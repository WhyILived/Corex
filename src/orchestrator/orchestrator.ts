// The orchestrator. It is deliberately content-blind: it never reads, writes,
// or judges study material. Its only jobs are to (1) plan the work (one task per
// section, ordered by dependencies), (2) spawn subagents — generate, then verify
// against the sources of truth, then fix-and-reverify in a loop until the
// verifier passes or the round budget is spent — and (3) persist task state so a
// crashed/cancelled run can resume. All content reasoning lives in subagents.ts.

import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { AbortError, type LLMClient } from "../llm/client";
import { joinPath } from "../lib/paths";
import {
  buildGroundTruth,
  buildRubric,
  fixSection,
  generateSection,
  verifySection,
  type Verdict,
} from "./subagents";
import {
  formatContextForPrompt,
  type SectionSearchContext,
} from "../search/webSearch";
import type { ScopeDocument, ScopeSection } from "../types";

type TaskStatus =
  | "pending"
  | "generating"
  | "verifying"
  | "fixing"
  | "done"
  | "failed";

interface SectionTask {
  sectionId: string;
  sectionTitle: string;
  status: TaskStatus;
  attempts: number;
  error?: string;
  completedAt?: string;
}

interface TaskGraph {
  sessionId: string;
  createdAt: string;
  tasks: SectionTask[];
  concurrency: number;
}

export interface OrchestratorUpdate {
  sectionId: string;
  sectionTitle: string;
  status: TaskStatus;
  attempt: number;
  totalSections: number;
  doneSections: number;
}

export type OrchestratorProgressCallback = (update: OrchestratorUpdate) => void;

export interface OrchestratorResult {
  sessionId: string;
  completedSections: string[];
  failedSections: string[];
  finalPaths: Record<string, string>;
}

const SESSIONS_DIR = "sessions";
const SECTIONS_DIR = "sections";
const TASKS_FILE = "tasks.json";
const DEFAULT_CONCURRENCY = 3;
const MAX_CONCURRENCY = 5;
// Verify → fix → re-verify, at most this many fix rounds before shipping the
// best draft with a warning.
const MAX_FIX_ROUNDS = 2;

const taskGraphWriteQueues = new Map<string, Promise<void>>();

// Serializes read-modify-write cycles on a session's tasks.json so concurrent
// section workers can't clobber each other's status updates.
async function withTaskGraphLock<T>(
  sessionId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = taskGraphWriteQueues.get(sessionId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  taskGraphWriteQueues.set(
    sessionId,
    previous.then(() => current),
  );

  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (taskGraphWriteQueues.get(sessionId) === current) {
      taskGraphWriteQueues.delete(sessionId);
    }
  }
}

async function getSessionDir(sessionId: string): Promise<string> {
  return joinPath(await appDataDir(), SESSIONS_DIR, sessionId);
}

async function getSectionDir(
  sessionId: string,
  sectionId: string,
): Promise<string> {
  return joinPath(await getSessionDir(sessionId), SECTIONS_DIR, sectionId);
}

function clampConcurrency(concurrency: number): number {
  return Math.min(Math.max(concurrency, 1), MAX_CONCURRENCY);
}

function createSectionTask(section: ScopeSection): SectionTask {
  return {
    sectionId: section.id,
    sectionTitle: section.title,
    status: "pending",
    attempts: 0,
  };
}

function buildTaskGraph(
  sessionId: string,
  scope: ScopeDocument,
  existing?: TaskGraph,
): TaskGraph {
  if (existing) {
    const knownIds = new Set(existing.tasks.map((task) => task.sectionId));
    for (const section of scope.sections) {
      if (!knownIds.has(section.id)) {
        existing.tasks.push(createSectionTask(section));
      }
    }
    // Re-arm anything a previous run left unfinished: a crash/cancel can freeze
    // a task mid-flight (generating/verifying/fixing). Reset everything that
    // isn't "done" so it restarts cleanly; completed sections are skipped.
    for (const task of existing.tasks) {
      if (task.status !== "done") {
        task.status = "pending";
        task.error = undefined;
        task.attempts = 0;
      }
    }
    existing.concurrency = clampConcurrency(
      existing.concurrency || DEFAULT_CONCURRENCY,
    );
    return existing;
  }

  return {
    sessionId,
    createdAt: new Date().toISOString(),
    tasks: scope.sections.map(createSectionTask),
    concurrency: DEFAULT_CONCURRENCY,
  };
}

async function loadTaskGraph(sessionDir: string): Promise<TaskGraph | null> {
  const tasksPath = joinPath(sessionDir, TASKS_FILE);
  if (!(await exists(tasksPath))) {
    return null;
  }
  return JSON.parse(await readTextFile(tasksPath)) as TaskGraph;
}

async function writeTaskGraph(sessionDir: string, graph: TaskGraph): Promise<void> {
  await writeTextFile(
    joinPath(sessionDir, TASKS_FILE),
    JSON.stringify(graph, null, 2),
  );
}

// Topologically orders pending tasks into dependency "waves". Tasks in a wave
// have no unfinished dependency on a later wave, so a whole wave can run
// concurrently. Circular dependencies are broken by dropping the cycle's edges.
export function getDispatchOrder(
  tasks: SectionTask[],
  sections: ScopeSection[],
): string[][] {
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const dependencyOverrides = new Map<string, string[]>();
  const doneIds = new Set(
    tasks.filter((task) => task.status === "done").map((task) => task.sectionId),
  );
  const pendingIds = new Set(
    tasks
      .filter((task) => task.status !== "done" && task.status !== "failed")
      .map((task) => task.sectionId),
  );

  const waves: string[][] = [];
  const remaining = new Set(pendingIds);

  function sectionDependencies(sectionId: string): string[] {
    if (dependencyOverrides.has(sectionId)) {
      return dependencyOverrides.get(sectionId)!;
    }
    return sectionMap.get(sectionId)?.dependencies ?? [];
  }

  function dependenciesSatisfied(sectionId: string): boolean {
    return sectionDependencies(sectionId).every(
      (dep) => doneIds.has(dep) || !pendingIds.has(dep),
    );
  }

  while (remaining.size > 0) {
    let wave = [...remaining].filter((sectionId) =>
      dependenciesSatisfied(sectionId),
    );

    if (wave.length === 0) {
      const forced = [...remaining][0]!;
      console.warn(
        `[orchestrator] Circular dependency detected for "${forced}", dropping dependencies: ${sectionDependencies(forced).join(", ")}`,
      );
      dependencyOverrides.set(forced, []);
      wave = [forced];
    }

    waves.push(wave);
    for (const sectionId of wave) {
      remaining.delete(sectionId);
    }
  }

  return waves;
}

// Runs task thunks with a bounded number in flight at once. Rejections (including
// cancellation) propagate so the orchestrator stops and the caller can clean up.
export async function runWithConcurrency<T>(
  taskFns: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  if (taskFns.length === 0) return [];

  const results: T[] = new Array(taskFns.length);
  let nextIndex = 0;
  const limit = clampConcurrency(concurrency);

  async function worker(): Promise<void> {
    while (nextIndex < taskFns.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await taskFns[index]!();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, taskFns.length) }, () => worker()),
  );

  return results;
}

function emitProgress(
  onProgress: OrchestratorProgressCallback,
  task: SectionTask,
  totalSections: number,
  doneSections: number,
): void {
  onProgress({
    sectionId: task.sectionId,
    sectionTitle: task.sectionTitle,
    status: task.status,
    attempt: task.attempts,
    totalSections,
    doneSections,
  });
}

async function persistTask(sessionId: string, task: SectionTask): Promise<void> {
  await withTaskGraphLock(sessionId, async () => {
    const sessionDir = await getSessionDir(sessionId);
    const graph = (await loadTaskGraph(sessionDir))!;
    const index = graph.tasks.findIndex(
      (entry) => entry.sectionId === task.sectionId,
    );
    if (index >= 0) graph.tasks[index] = task;
    await writeTaskGraph(sessionDir, graph);
  });
}

async function updateTaskStatus(
  sessionId: string,
  task: SectionTask,
  status: TaskStatus,
  onProgress: OrchestratorProgressCallback,
  totalSections: number,
  doneSections: number,
): Promise<void> {
  task.status = status;
  await persistTask(sessionId, task);
  emitProgress(onProgress, task, totalSections, doneSections);
}

// One section's full subagent loop: generate → verify → (fix → verify)* until
// the verifier passes or the fix-round budget is spent. The best draft is always
// shipped to final.md; the task carries a warning if it never passed.
async function runSectionTask(
  task: SectionTask,
  section: ScopeSection,
  scope: ScopeDocument,
  sessionId: string,
  llm: LLMClient,
  signal: AbortSignal | undefined,
  onProgress: OrchestratorProgressCallback,
  totalSections: number,
  doneSections: number,
  searchContext?: SectionSearchContext,
): Promise<void> {
  const sectionDir = await getSectionDir(sessionId, task.sectionId);
  const contentPath = joinPath(sectionDir, "content.md");
  const verdictPath = joinPath(sectionDir, "verdict.json");
  const finalPath = joinPath(sectionDir, "final.md");

  const rubric = buildRubric(section);
  // Web search context (when present) is appended as clearly-labeled
  // supplementary material; the ground truth from uploaded sources leads.
  const webBlock = searchContext ? formatContextForPrompt(searchContext) : "";
  const groundTruth = webBlock
    ? `${buildGroundTruth(section, scope)}\n\n${webBlock}`
    : buildGroundTruth(section, scope);
  const opts = { signal };

  try {
    // Round 0: generate, then verify.
    await updateTaskStatus(sessionId, task, "generating", onProgress, totalSections, doneSections);
    let content = await generateSection(section, groundTruth, llm, opts);
    await writeTextFile(contentPath, content);

    await updateTaskStatus(sessionId, task, "verifying", onProgress, totalSections, doneSections);
    let verdict: Verdict = await verifySection(content, rubric, groundTruth, llm, opts);
    await writeTextFile(verdictPath, JSON.stringify(verdict, null, 2));

    // Fix/re-verify loop until it passes or we run out of rounds.
    let round = 0;
    while (!verdict.pass && round < MAX_FIX_ROUNDS) {
      round += 1;
      task.attempts = round;

      await updateTaskStatus(sessionId, task, "fixing", onProgress, totalSections, doneSections);
      content = await fixSection(content, verdict, rubric, groundTruth, llm, opts);
      await writeTextFile(contentPath, content);

      await updateTaskStatus(sessionId, task, "verifying", onProgress, totalSections, doneSections);
      verdict = await verifySection(content, rubric, groundTruth, llm, opts);
      await writeTextFile(verdictPath, JSON.stringify(verdict, null, 2));
    }

    await writeTextFile(finalPath, content);
    task.completedAt = new Date().toISOString();
    task.error = verdict.pass
      ? undefined
      : `Shipped without passing verification (score ${verdict.score}).`;
    if (!verdict.pass) {
      console.warn(
        `[orchestrator] Section "${task.sectionId}" shipped after ${round} fix round(s) without passing (score ${verdict.score}).`,
      );
    }

    await updateTaskStatus(sessionId, task, "done", onProgress, totalSections, doneSections + 1);
  } catch (error) {
    if (error instanceof AbortError) throw error;
    task.status = "failed";
    task.error = error instanceof Error ? error.message : String(error);
    await persistTask(sessionId, task);
    emitProgress(onProgress, task, totalSections, doneSections);
  }
}

export async function runOrchestrator(
  sessionId: string,
  scope: ScopeDocument,
  llm: LLMClient,
  onProgress: OrchestratorProgressCallback,
  signal?: AbortSignal,
  searchContexts?: Map<string, SectionSearchContext>,
): Promise<OrchestratorResult> {
  const sessionDir = await getSessionDir(sessionId);
  const existingGraph = await loadTaskGraph(sessionDir);
  const graph = buildTaskGraph(sessionId, scope, existingGraph ?? undefined);
  await writeTaskGraph(sessionDir, graph);

  const sectionMap = new Map(scope.sections.map((section) => [section.id, section]));

  // Pre-create each pending section's directory + rubric (useful for debugging
  // a run and for resume).
  for (const task of graph.tasks.filter((t) => t.status !== "done")) {
    const sectionDir = await getSectionDir(sessionId, task.sectionId);
    await mkdir(sectionDir, { recursive: true });
    await writeTextFile(
      joinPath(sectionDir, "rubric.json"),
      JSON.stringify(buildRubric(sectionMap.get(task.sectionId)!), null, 2),
    );
  }

  const waves = getDispatchOrder(graph.tasks, scope.sections);
  const totalSections = graph.tasks.length;

  for (const wave of waves) {
    if (signal?.aborted) throw new AbortError();

    const waveTasks = wave
      .map((sectionId) => graph.tasks.find((task) => task.sectionId === sectionId))
      .filter(
        (task): task is SectionTask =>
          Boolean(task) && task!.status !== "done" && task!.status !== "failed",
      );

    if (waveTasks.length === 0) continue;

    const doneSections = graph.tasks.filter((task) => task.status === "done").length;

    await runWithConcurrency(
      waveTasks.map(
        (task) => () =>
          runSectionTask(
            task,
            sectionMap.get(task.sectionId)!,
            scope,
            sessionId,
            llm,
            signal,
            onProgress,
            totalSections,
            doneSections,
            searchContexts?.get(task.sectionId),
          ),
      ),
      graph.concurrency,
    );

    const refreshed = await loadTaskGraph(sessionDir);
    if (refreshed) Object.assign(graph, refreshed);
  }

  const finalGraph = (await loadTaskGraph(sessionDir)) ?? graph;
  const completedSections = finalGraph.tasks
    .filter((task) => task.status === "done")
    .map((task) => task.sectionId);
  const failedSections = finalGraph.tasks
    .filter((task) => task.status === "failed")
    .map((task) => task.sectionId);

  const finalPaths: Record<string, string> = {};
  for (const sectionId of completedSections) {
    finalPaths[sectionId] = joinPath(
      await getSectionDir(sessionId, sectionId),
      "final.md",
    );
  }

  return { sessionId, completedSections, failedSections, finalPaths };
}
