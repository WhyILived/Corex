import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import type { LLMClient } from "../llm/client";
import type { ScopeDocument, ScopeSection, SectionDepth } from "../types";

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
  maxAttempts: number;
  error?: string;
  completedAt?: string;
}

interface TaskGraph {
  sessionId: string;
  createdAt: string;
  tasks: SectionTask[];
  concurrency: number;
}

interface Verdict {
  pass: boolean;
  score: number;
  failures: VerdictFailure[];
  suggestions: string[];
}

interface VerdictFailure {
  type:
    | "missing_concept"
    | "missing_formula"
    | "inaccurate"
    | "insufficient_depth"
    | "missing_examples";
  detail: string;
  requiredItem?: string;
}

interface SectionRubric {
  sectionId: string;
  sectionTitle: string;
  requiredConcepts: string[];
  requiredFormulas: string[];
  requiredTerms: string[];
  minimumExamples: number;
  depth: SectionDepth;
}

export interface OrchestratorUpdate {
  sectionId: string;
  sectionTitle: string;
  status: TaskStatus;
  attempt: number;
  totalSections: number;
  doneSections: number;
}

export type OrchestratorProgressCallback = (
  update: OrchestratorUpdate,
) => void;

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
const PASS_SCORE_THRESHOLD = 75;

const taskGraphWriteQueues = new Map<string, Promise<void>>();

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
  return join(await appDataDir(), SESSIONS_DIR, sessionId);
}

async function getSectionDir(
  sessionId: string,
  sectionId: string,
): Promise<string> {
  return join(await getSessionDir(sessionId), SECTIONS_DIR, sectionId);
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
    maxAttempts: 3,
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
    // Re-arm anything a previous run left unfinished: failed tasks get another
    // shot, and tasks frozen mid-flight by a crash (generating/verifying/fixing)
    // are reset so they restart cleanly. Only "done" sections are skipped.
    for (const task of existing.tasks) {
      if (task.status !== "done") {
        task.status = "pending";
        task.error = undefined;
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
  const tasksPath = join(sessionDir, TASKS_FILE);
  if (!(await exists(tasksPath))) {
    return null;
  }
  return JSON.parse(await readTextFile(tasksPath)) as TaskGraph;
}

async function writeTaskGraph(
  sessionDir: string,
  graph: TaskGraph,
): Promise<void> {
  await writeTextFile(
    join(sessionDir, TASKS_FILE),
    JSON.stringify(graph, null, 2),
  );
}

async function copyFile(source: string, destination: string): Promise<void> {
  await writeTextFile(destination, await readTextFile(source));
}

function depthInstructions(depth: SectionDepth): string {
  switch (depth) {
    case "overview":
      return "overview: 1-2 paragraphs, key concepts only, no worked examples";
    case "standard":
      return "standard: thorough explanation, 1-2 worked examples, connect to related concepts";
    case "deep":
      return "deep: comprehensive coverage, 3+ worked examples, common exam traps, connections to other sections";
  }
}

function normalizeVerdict(raw: Partial<Verdict> | null | undefined): Verdict {
  const score = Math.max(0, Math.min(100, Number(raw?.score) || 0));
  return {
    pass: Boolean(raw?.pass) && score >= PASS_SCORE_THRESHOLD,
    score,
    failures: Array.isArray(raw?.failures) ? raw!.failures! : [],
    suggestions: Array.isArray(raw?.suggestions) ? raw!.suggestions! : [],
  };
}

export function buildRubric(section: ScopeSection): SectionRubric {
  const minimumExamples =
    section.depth === "overview" ? 0 : section.depth === "standard" ? 1 : 3;

  return {
    sectionId: section.id,
    sectionTitle: section.title,
    requiredConcepts: section.requiredConcepts,
    requiredFormulas: section.requiredFormulas,
    requiredTerms: section.definedTerms.map((term) => term.term),
    minimumExamples,
    depth: section.depth,
  };
}

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

export async function runWithConcurrency<T>(
  taskFns: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  if (taskFns.length === 0) {
    return [];
  }

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

export async function generateSection(
  section: ScopeSection,
  _sessionId: string,
  llm: LLMClient,
): Promise<string> {
  const termsBlock = section.definedTerms
    .map((term) => `- ${term.term}: ${term.definition}`)
    .join("\n");

  const prompt = `Write a complete study guide section in Markdown.

Section: ${section.title}
Weight: ${section.weightPercent}%
Depth: ${section.depth}
Depth requirements: ${depthInstructions(section.depth)}

Required concepts (cover every one):
${section.requiredConcepts.map((concept) => `- ${concept}`).join("\n")}

Required formulas in LaTeX (include every one):
${section.requiredFormulas.map((formula) => `- ${formula}`).join("\n")}

Defined terms (define every one):
${termsBlock || "(none)"}

Source hints:
${section.sourceHints.map((hint) => `- ${hint}`).join("\n") || "(none)"}

Rules:
- Output valid Markdown only.
- Use $ for inline LaTeX and $$ for block LaTeX.
- Do NOT include a top-level # heading.
- Do NOT include content outside this section's scope.
- Return the section body only, no preamble or explanation.`;

  return llm.withConfig({ temperature: 0.3 }).ask(prompt);
}

export async function verifySection(
  content: string,
  rubric: SectionRubric,
  llm: LLMClient,
): Promise<Verdict> {
  const prompt = `Evaluate the study guide section against this rubric.

Rubric:
${JSON.stringify(rubric, null, 2)}

Generated content:
${content}

Return ONLY a JSON object — no markdown fences, no explanation:
{
  "pass": boolean,
  "score": number,
  "failures": [{ "type": "missing_concept" | "missing_formula" | "inaccurate" | "insufficient_depth" | "missing_examples", "detail": string, "requiredItem": string | null }],
  "suggestions": string[]
}

Check:
- Every requiredConcept is addressed and explained, not just mentioned.
- Every requiredFormula is present and correctly formatted.
- Every requiredTerm is defined.
- Example count meets minimumExamples (${rubric.minimumExamples}).
- Depth matches the rubric depth level (${rubric.depth}).
- No factual inaccuracies detectable from the content itself.

Score 0-100. Set pass to true only if score >= ${PASS_SCORE_THRESHOLD}.`;

  const verdict = await llm
    .withConfig({ temperature: 0 })
    .askJSON<Partial<Verdict>>(prompt);

  return normalizeVerdict(verdict);
}

export async function fixSection(
  content: string,
  verdict: Verdict,
  section: ScopeSection,
  llm: LLMClient,
): Promise<string> {
  const failuresBlock = verdict.failures
    .map((failure) => {
      const item = failure.requiredItem
        ? ` (required: ${failure.requiredItem})`
        : "";
      return `- [${failure.type}] ${failure.detail}${item}`;
    })
    .join("\n");

  const termsBlock = section.definedTerms
    .map((term) => `- ${term.term}: ${term.definition}`)
    .join("\n");

  const prompt = `Fix this study guide section based on the verification verdict.

Original content:
${content}

Verification failures:
${failuresBlock || "(none)"}

Suggestions:
${verdict.suggestions.map((suggestion) => `- ${suggestion}`).join("\n") || "(none)"}

Section spec:
- Title: ${section.title}
- Depth: ${section.depth} (${depthInstructions(section.depth)})
- Required concepts:
${section.requiredConcepts.map((concept) => `- ${concept}`).join("\n")}
- Required formulas:
${section.requiredFormulas.map((formula) => `- ${formula}`).join("\n")}
- Defined terms:
${termsBlock || "(none)"}

Rules:
- Fix all failures.
- Do not remove any content that was correct.
- Return the complete fixed Markdown section, not a diff or partial patch.
- Do NOT include a top-level # heading.
- Use $ for inline LaTeX and $$ for block LaTeX.`;

  return llm.withConfig({ temperature: 0 }).ask(prompt);
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

async function persistTask(
  sessionId: string,
  task: SectionTask,
): Promise<void> {
  await withTaskGraphLock(sessionId, async () => {
    const sessionDir = await getSessionDir(sessionId);
    const graph = (await loadTaskGraph(sessionDir))!;
    const index = graph.tasks.findIndex(
      (entry) => entry.sectionId === task.sectionId,
    );

    if (index >= 0) {
      graph.tasks[index] = task;
    }

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

export async function runSectionTask(
  task: SectionTask,
  section: ScopeSection,
  sessionId: string,
  llm: LLMClient,
  onProgress: OrchestratorProgressCallback,
  totalSections: number,
  doneSections: number,
): Promise<void> {
  const sectionDir = await getSectionDir(sessionId, task.sectionId);
  const contentPath = join(sectionDir, "content.md");
  const verdictPath = join(sectionDir, "verdict.json");
  const contentFixedPath = join(sectionDir, "content-fixed.md");
  const finalPath = join(sectionDir, "final.md");

  try {
    await updateTaskStatus(
      sessionId,
      task,
      "generating",
      onProgress,
      totalSections,
      doneSections,
    );

    const generated = await generateSection(section, sessionId, llm);
    await writeTextFile(contentPath, generated);

    await updateTaskStatus(
      sessionId,
      task,
      "verifying",
      onProgress,
      totalSections,
      doneSections,
    );

    const rubric = buildRubric(section);
    const content = await readTextFile(contentPath);
    const verdict = await verifySection(content, rubric, llm);
    await writeTextFile(verdictPath, JSON.stringify(verdict, null, 2));

    if (verdict.pass) {
      await copyFile(contentPath, finalPath);
      task.completedAt = new Date().toISOString();
      task.error = undefined;
      await updateTaskStatus(
        sessionId,
        task,
        "done",
        onProgress,
        totalSections,
        doneSections + 1,
      );
      return;
    }

    if (task.attempts < task.maxAttempts) {
      await updateTaskStatus(
        sessionId,
        task,
        "fixing",
        onProgress,
        totalSections,
        doneSections,
      );

      const fixed = await fixSection(content, verdict, section, llm);
      await writeTextFile(contentFixedPath, fixed);
      await writeTextFile(finalPath, fixed);

      task.attempts += 1;
      task.completedAt = new Date().toISOString();
      task.error =
        "Shipped after fix pass — verification did not pass; content may need review.";

      await updateTaskStatus(
        sessionId,
        task,
        "done",
        onProgress,
        totalSections,
        doneSections + 1,
      );
      return;
    }

    await copyFile(contentPath, finalPath);
    task.completedAt = new Date().toISOString();
    task.error = `Shipped without passing verification (score ${verdict.score}).`;
    console.warn(
      `[orchestrator] Section "${task.sectionId}" failed verification after ${task.attempts} attempts`,
    );

    await updateTaskStatus(
      sessionId,
      task,
      "done",
      onProgress,
      totalSections,
      doneSections + 1,
    );
  } catch (error) {
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
): Promise<OrchestratorResult> {
  const sessionDir = await getSessionDir(sessionId);
  const existingGraph = await loadTaskGraph(sessionDir);
  const graph = buildTaskGraph(sessionId, scope, existingGraph ?? undefined);
  await writeTaskGraph(sessionDir, graph);

  const sectionMap = new Map(
    scope.sections.map((section) => [section.id, section]),
  );

  const pendingTasks = graph.tasks.filter((task) => task.status !== "done");

  for (const task of pendingTasks) {
    const sectionDir = await getSectionDir(sessionId, task.sectionId);
    await mkdir(sectionDir, { recursive: true });

    const rubric = buildRubric(sectionMap.get(task.sectionId)!);
    await writeTextFile(
      join(sectionDir, "rubric.json"),
      JSON.stringify(rubric, null, 2),
    );
  }

  const waves = getDispatchOrder(graph.tasks, scope.sections);
  const totalSections = graph.tasks.length;

  for (const wave of waves) {
    const waveTasks = wave
      .map((sectionId) => graph.tasks.find((task) => task.sectionId === sectionId))
      .filter(
        (task): task is SectionTask =>
          Boolean(task) && task!.status !== "done" && task!.status !== "failed",
      );

    if (waveTasks.length === 0) {
      continue;
    }

    const doneSections = graph.tasks.filter(
      (task) => task.status === "done",
    ).length;

    await runWithConcurrency(
      waveTasks.map(
        (task) => () =>
          runSectionTask(
            task,
            sectionMap.get(task.sectionId)!,
            sessionId,
            llm,
            onProgress,
            totalSections,
            doneSections,
          ),
      ),
      graph.concurrency,
    );

    const refreshed = await loadTaskGraph(sessionDir);
    if (refreshed) {
      Object.assign(graph, refreshed);
    }
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
    finalPaths[sectionId] = join(
      await getSectionDir(sessionId, sectionId),
      "final.md",
    );
  }

  return {
    sessionId,
    completedSections,
    failedSections,
    finalPaths,
  };
}
