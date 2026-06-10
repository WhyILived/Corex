import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { ingestFiles } from "../ingest/ingest";
import { extractAll } from "../extract/extract";
import { LLMError, type LLMClient } from "../llm/client";
import {
  serializeScopeToMarkdown,
  synthesizeScope,
} from "./synthesize";
import type {
  ExamExtraction,
  OutlineExtraction,
  PipelineError,
  PipelineState,
  RawDocument,
  ScopeDocument,
  SlidesExtraction,
  SourceManifest,
  StageStatus,
} from "../types";

export interface ScopePipelineInput {
  files: File[];
  userPrompt?: string;
  sessionId?: string;
}

export interface ProgressUpdate {
  stage: "ingest" | "extract" | "synthesize" | "write";
  message: string;
  done: number;
  total: number;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

export interface ScopePipelineResult {
  sessionId: string;
  scopeDocument: ScopeDocument;
  scopeMdPath: string;
  statePath: string;
}

export interface SessionSummary {
  sessionId: string;
  courseCode: string;
  courseName: string;
  generatedAt: string;
  scopeMdPath: string;
  status: "done" | "failed" | "incomplete";
}

const SESSIONS_DIR = "sessions";
const EXTRACTIONS_DIR = "extractions";
const SOURCES_DIR = "sources";
const STATE_FILE = "pipeline-state.json";
const SCOPE_FILE = "SCOPE.md";
const SOURCES_FILE = "sources.json";

// Synchronous path join. Tauri's path.join() is async (it bridges to Rust);
// since every path here is derived from an already-resolved appDataDir, a local
// joiner keeps the code synchronous and avoids awaiting on every segment. The
// Tauri fs plugin normalizes forward slashes on Windows.
function joinPath(...segments: string[]): string {
  return segments
    .map((segment, index) =>
      index === 0
        ? segment.replace(/[\\/]+$/, "")
        : segment.replace(/^[\\/]+|[\\/]+$/g, ""),
    )
    .filter((segment) => segment.length > 0)
    .join("/");
}

async function getSessionsRoot(): Promise<string> {
  return joinPath(await appDataDir(), SESSIONS_DIR);
}

async function getSessionDir(sessionId: string): Promise<string> {
  return joinPath(await getSessionsRoot(), sessionId);
}

async function getExtractionsDir(sessionDir: string): Promise<string> {
  return joinPath(sessionDir, EXTRACTIONS_DIR);
}

// Copies the user's original uploads into the session so the Sources panel can
// preview them later, and writes sources.json mapping each RawDocument to its
// stored file. docs[i] corresponds to files[i] (ingestFiles preserves order).
async function persistSources(
  sessionDir: string,
  files: File[],
  docs: RawDocument[],
): Promise<SourceManifest> {
  const sourcesDir = joinPath(sessionDir, SOURCES_DIR);
  await mkdir(sourcesDir, { recursive: true });

  const manifest: SourceManifest = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]!;
    const file = files[i];
    if (!file) {
      continue;
    }

    // Prefix with the doc id so identically-named uploads can't collide.
    const storedName = `${doc.id}__${doc.filename}`;
    const path = joinPath(sourcesDir, storedName);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(path, bytes);

    manifest.push({
      id: doc.id,
      filename: doc.filename,
      type: doc.type,
      mimeType: doc.mimeType,
      path,
    });
  }

  await writeTextFile(
    joinPath(sessionDir, SOURCES_FILE),
    JSON.stringify(manifest, null, 2),
  );

  return manifest;
}

export async function loadSources(sessionId: string): Promise<SourceManifest> {
  const sessionDir = await getSessionDir(sessionId);
  const path = joinPath(sessionDir, SOURCES_FILE);

  if (!(await exists(path))) {
    return [];
  }

  return JSON.parse(await readTextFile(path)) as SourceManifest;
}

function createInitialState(sessionId: string): PipelineState {
  return {
    sessionId,
    startedAt: new Date().toISOString(),
    stages: {
      ingest: "pending",
      extract: "pending",
      synthesize: "pending",
      write: "pending",
    },
    errors: [],
  };
}

function toPipelineError(
  stage: string,
  error: unknown,
  file?: string,
): PipelineError {
  return {
    stage,
    message: error instanceof Error ? error.message : String(error),
    file,
    retryable: error instanceof LLMError ? error.isRetryable : false,
  };
}

function deriveSessionStatus(
  stages: PipelineState["stages"],
): SessionSummary["status"] {
  const values = Object.values(stages);
  if (values.some((status) => status === "failed")) {
    return "failed";
  }
  if (values.every((status) => status === "done")) {
    return "done";
  }
  return "incomplete";
}

function parseScopeMeta(content: string): {
  courseCode?: string;
  courseName?: string;
  generatedAt?: string;
} {
  const courseMatch = content.match(/^course:\s*(.+?)\s*—\s*(.+)$/m);
  const generatedMatch = content.match(/^generated:\s*(.+)$/m);

  return {
    courseCode: courseMatch?.[1]?.trim(),
    courseName: courseMatch?.[2]?.trim(),
    generatedAt: generatedMatch?.[1]?.trim(),
  };
}

function indexedFilename(prefix: string, index: number): string {
  return `${prefix}-${index}.json`;
}

function sortIndexedFiles(names: string[], prefix: string): string[] {
  return names
    .filter((name) => name.startsWith(`${prefix}-`) && name.endsWith(".json"))
    .sort((a, b) => {
      const indexA = Number(a.slice(prefix.length + 1, -5));
      const indexB = Number(b.slice(prefix.length + 1, -5));
      return indexA - indexB;
    });
}

async function ensureSessionDirs(sessionDir: string): Promise<string> {
  const extractionsDir = await getExtractionsDir(sessionDir);
  await mkdir(extractionsDir, { recursive: true });
  return extractionsDir;
}

async function writePipelineState(
  sessionDir: string,
  state: PipelineState,
): Promise<void> {
  const statePath = joinPath(sessionDir, STATE_FILE);
  await writeTextFile(statePath, JSON.stringify(state, null, 2));
}

async function writeExtractions(
  extractionsDir: string,
  extractions: {
    outline?: OutlineExtraction;
    slides: SlidesExtraction[];
    exams: ExamExtraction[];
  },
): Promise<void> {
  if (extractions.outline) {
    await writeTextFile(
      joinPath(extractionsDir, "outline.json"),
      JSON.stringify(extractions.outline, null, 2),
    );
  }

  for (let i = 0; i < extractions.slides.length; i++) {
    await writeTextFile(
      joinPath(extractionsDir, indexedFilename("slides", i)),
      JSON.stringify(extractions.slides[i], null, 2),
    );
  }

  for (let i = 0; i < extractions.exams.length; i++) {
    await writeTextFile(
      joinPath(extractionsDir, indexedFilename("exam", i)),
      JSON.stringify(extractions.exams[i], null, 2),
    );
  }
}

async function readExtractions(extractionsDir: string): Promise<{
  outline?: OutlineExtraction;
  slides: SlidesExtraction[];
  exams: ExamExtraction[];
}> {
  const entries = await readDir(extractionsDir);
  const names = entries
    .filter((entry) => entry.isFile)
    .map((entry) => entry.name);

  let outline: OutlineExtraction | undefined;
  if (names.includes("outline.json")) {
    outline = JSON.parse(
      await readTextFile(joinPath(extractionsDir, "outline.json")),
    ) as OutlineExtraction;
  }

  const slides: SlidesExtraction[] = [];
  for (const name of sortIndexedFiles(names, "slides")) {
    slides.push(
      JSON.parse(await readTextFile(joinPath(extractionsDir, name))) as SlidesExtraction,
    );
  }

  const exams: ExamExtraction[] = [];
  for (const name of sortIndexedFiles(names, "exam")) {
    exams.push(
      JSON.parse(await readTextFile(joinPath(extractionsDir, name))) as ExamExtraction,
    );
  }

  return { outline, slides, exams };
}

async function readOutlineMeta(extractionsDir: string): Promise<{
  courseCode?: string;
  courseName?: string;
}> {
  const outlinePath = joinPath(extractionsDir, "outline.json");
  if (!(await exists(outlinePath))) {
    return {};
  }

  const outline = JSON.parse(await readTextFile(outlinePath)) as OutlineExtraction;
  return {
    courseCode: outline.courseCode,
    courseName: outline.courseName,
  };
}

async function setStage(
  sessionDir: string,
  state: PipelineState,
  stage: keyof PipelineState["stages"],
  status: StageStatus,
): Promise<void> {
  state.stages[stage] = status;
  await writePipelineState(sessionDir, state);
}

async function failStage(
  sessionDir: string,
  state: PipelineState,
  stage: keyof PipelineState["stages"],
  error: unknown,
  file?: string,
): Promise<void> {
  state.stages[stage] = "failed";
  state.errors.push(toPipelineError(stage, error, file));
  await writePipelineState(sessionDir, state);
}

export async function runScopePipeline(
  input: ScopePipelineInput,
  llm: LLMClient,
  onProgress: ProgressCallback,
): Promise<ScopePipelineResult> {
  const sessionId = input.sessionId ?? Date.now().toString(36);
  const sessionDir = await getSessionDir(sessionId);
  const statePath = joinPath(sessionDir, STATE_FILE);
  const scopeMdPath = joinPath(sessionDir, SCOPE_FILE);

  await mkdir(sessionDir, { recursive: true });
  const extractionsDir = await ensureSessionDirs(sessionDir);

  const state = createInitialState(sessionId);
  await writePipelineState(sessionDir, state);

  let docs: Awaited<ReturnType<typeof ingestFiles>> = [];
  let extractions: Awaited<ReturnType<typeof extractAll>> = {
    slides: [],
    exams: [],
    failures: [],
  };
  let scopeDocument: ScopeDocument | undefined;

  try {
    await setStage(sessionDir, state, "ingest", "running");
    onProgress({
      stage: "ingest",
      message: "Ingesting files...",
      done: 0,
      total: input.files.length,
    });

    docs = await ingestFiles(input.files, (done, total, filename) => {
      onProgress({
        stage: "ingest",
        message: `Ingested ${filename}`,
        done,
        total,
      });
    });

    await persistSources(sessionDir, input.files, docs);

    await setStage(sessionDir, state, "ingest", "done");

    await setStage(sessionDir, state, "extract", "running");
    onProgress({
      stage: "extract",
      message: "Extracting documents...",
      done: 0,
      total: docs.length,
    });

    extractions = await extractAll(docs, llm, (done, total, filename) => {
      onProgress({
        stage: "extract",
        message: `Extracted ${filename}`,
        done,
        total,
      });
    });

    // Surface a real error instead of shipping an empty notebook when nothing
    // usable came out of the sources.
    const hasContent =
      extractions.outline !== undefined ||
      extractions.slides.some((slide) => slide.sections.length > 0) ||
      extractions.exams.some((exam) => exam.questions.length > 0);

    if (!hasContent) {
      const detail = extractions.failures[0]
        ? ` First error: ${extractions.failures[0]}`
        : "";
      throw new Error(
        `No content could be extracted from the uploaded sources.${detail}`,
      );
    }

    await writeExtractions(extractionsDir, extractions);
    await setStage(sessionDir, state, "extract", "done");

    await setStage(sessionDir, state, "synthesize", "running");
    onProgress({
      stage: "synthesize",
      message: "Synthesizing SCOPE...",
      done: 0,
      total: 1,
    });

    scopeDocument = await synthesizeScope(
      extractions.outline,
      extractions.slides,
      extractions.exams,
      input.userPrompt,
      llm,
    );

    if (scopeDocument.sections.length === 0) {
      throw new Error(
        "Synthesis produced no sections from the extracted content. Try again, or add more sources.",
      );
    }

    await setStage(sessionDir, state, "synthesize", "done");

    await setStage(sessionDir, state, "write", "running");
    onProgress({
      stage: "write",
      message: "Writing SCOPE.md...",
      done: 0,
      total: 1,
    });

    await writeTextFile(scopeMdPath, serializeScopeToMarkdown(scopeDocument));
    await setStage(sessionDir, state, "write", "done");

    onProgress({
      stage: "write",
      message: "Done",
      done: 1,
      total: 1,
    });

    return {
      sessionId,
      scopeDocument,
      scopeMdPath,
      statePath,
    };
  } catch (error) {
    let failedStage = (
      ["ingest", "extract", "synthesize", "write"] as const
    ).find((stage) => state.stages[stage] === "running");

    if (!failedStage) {
      failedStage = (
        ["ingest", "extract", "synthesize", "write"] as const
      ).find((stage) => state.stages[stage] === "pending");
    }

    if (failedStage) {
      await failStage(sessionDir, state, failedStage, error);
    }

    throw error;
  }
}

export async function loadExistingScope(
  sessionId: string,
  llm: LLMClient,
  userPrompt?: string,
): Promise<ScopeDocument | null> {
  const sessionDir = await getSessionDir(sessionId);
  if (!(await exists(sessionDir))) {
    return null;
  }

  const extractionsDir = joinPath(sessionDir, EXTRACTIONS_DIR);
  if (!(await exists(extractionsDir))) {
    return null;
  }

  const extractions = await readExtractions(extractionsDir);
  return synthesizeScope(
    extractions.outline,
    extractions.slides,
    extractions.exams,
    userPrompt,
    llm,
  );
}

export async function listSessions(): Promise<SessionSummary[]> {
  const sessionsRoot = await getSessionsRoot();
  if (!(await exists(sessionsRoot))) {
    return [];
  }

  const entries = await readDir(sessionsRoot);
  const summaries: SessionSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory) {
      continue;
    }

    const sessionId = entry.name;
    const sessionDir = joinPath(sessionsRoot, sessionId);
    const statePath = joinPath(sessionDir, STATE_FILE);
    const scopeMdPath = joinPath(sessionDir, SCOPE_FILE);
    const hasState = await exists(statePath);
    const hasScope = await exists(scopeMdPath);

    if (!hasState && !hasScope) {
      continue;
    }

    let state: PipelineState | undefined;
    if (hasState) {
      state = JSON.parse(await readTextFile(statePath)) as PipelineState;
    }

    let courseCode = "UNKNOWN";
    let courseName = "Unknown Course";
    let generatedAt = state?.startedAt ?? new Date(0).toISOString();

    if (hasScope) {
      const scopeMeta = parseScopeMeta(await readTextFile(scopeMdPath));
      courseCode = scopeMeta.courseCode ?? courseCode;
      courseName = scopeMeta.courseName ?? courseName;
      generatedAt = scopeMeta.generatedAt ?? generatedAt;
    } else {
      const extractionsDir = joinPath(sessionDir, EXTRACTIONS_DIR);
      if (await exists(extractionsDir)) {
        const outlineMeta = await readOutlineMeta(extractionsDir);
        courseCode = outlineMeta.courseCode ?? courseCode;
        courseName = outlineMeta.courseName ?? courseName;
      }
    }

    summaries.push({
      sessionId,
      courseCode,
      courseName,
      generatedAt,
      scopeMdPath,
      status: state ? deriveSessionStatus(state.stages) : "incomplete",
    });
  }

  return summaries.sort(
    (a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
}
