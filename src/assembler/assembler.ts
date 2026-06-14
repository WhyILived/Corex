import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { sanitizeMarkdown } from "../lib/sanitize";
import type {
  DefinedTerm,
  ScopeDocument,
  ScopeMeta,
  ScopeSection,
  SectionDepth,
} from "../types";

export interface StudyGuideDocument {
  sessionId: string;
  meta: ScopeMeta;
  sections: StudyGuideSection[];
  globalVocabulary: DefinedTerm[];
  assembledAt: string;
}

export interface StudyGuideSection {
  id: string;
  title: string;
  depth: SectionDepth;
  weightPercent: number;
  weekOrUnit?: string;
  contentMd: string;
  nodes: ContentNode[];
  threads: InlineThread[];
  analytics: SectionAnalytics;
  warnings: SectionWarning[];
}

export type ContentNodeType =
  | "paragraph"
  | "heading"
  | "formula_block"
  | "code"
  | "list"
  | "figure"
  | "table"
  | "hr"
  | "svg"
  | "quote";

export interface ContentNode {
  id: string;
  type: ContentNodeType;
  raw: string;
  level?: number;
}

export interface InlineThread {
  id: string;
  anchorNodeId: string;
  // Character offsets into the anchor node's RAW markdown (ContentNode.raw).
  // The renderer maps a rendered-text selection back to these raw indices.
  anchorStart: number;
  anchorEnd: number;
  // Verbatim slice of raw markdown that was forked. Re-find fallback if the
  // section is ever regenerated and offsets drift (or to orphan the thread).
  anchorQuote: string;
  messages: ThreadMessage[];
  collapsed: boolean;
  createdAt: string;
}

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  // The model that produced an assistant reply (shown as a badge). Useful in
  // auto mode where each reply may come from a different model.
  model?: string;
}

export interface SectionAnalytics {
  totalTimeMs: number;
  visits: number;
  rereadCount: number;
  threadCount: number;
  lastVisitedAt?: string;
}

export interface SectionWarning {
  type: "verify_failed" | "extraction_partial" | "no_source_found";
  message: string;
}

const SESSIONS_DIR = "sessions";
const SECTIONS_DIR = "sections";
const STUDY_GUIDE_FILE = "study-guide.json";
const CHAT_FILE = "chat.json";

async function getSessionDir(sessionId: string): Promise<string> {
  return join(await appDataDir(), SESSIONS_DIR, sessionId);
}

async function getSectionDir(
  sessionDir: string,
  sectionId: string,
): Promise<string> {
  return join(sessionDir, SECTIONS_DIR, sectionId);
}

function nodeId(sectionId: string, index: number): string {
  return `${sectionId}_node_${String(index).padStart(3, "0")}`;
}

function zeroedAnalytics(): SectionAnalytics {
  return {
    totalTimeMs: 0,
    visits: 0,
    rereadCount: 0,
    threadCount: 0,
  };
}

const FORMULA_DELIM = "$$";
const FENCE_RE = /^```/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const FIGURE_RE = /^!\[[^\]]*\]\([^)]*\)\s*$/;
const LIST_ITEM_RE = /^(\s*)([-*]|\d+\.)\s+/;
// Thematic break: 3+ of -, *, or _ on their own line (CommonMark allows
// interleaving spaces). Checked before lists so "---" isn't seen as a bullet.
const HR_RE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const BLOCKQUOTE_RE = /^ {0,3}>/;
const TABLE_ROW_RE = /^\s*\|.+\|\s*$/;
const TABLE_SEP_RE = /^\s*\|[\s:|\-]+\|\s*$/;

function isTableLine(line: string): boolean {
  return TABLE_ROW_RE.test(line) || TABLE_SEP_RE.test(line);
}

function isTableDataRow(line: string): boolean {
  return TABLE_ROW_RE.test(line) && !TABLE_SEP_RE.test(line);
}

export function parseMarkdownTable(raw: string): {
  headers: string[];
  rows: string[][];
} {
  const parsed = raw
    .split("\n")
    .filter((line) => !TABLE_SEP_RE.test(line))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );

  if (parsed.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headers, ...rows] = parsed;
  return { headers: headers ?? [], rows };
}

export function parseContentNodes(
  sectionId: string,
  markdown: string,
): ContentNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const nodes: ContentNode[] = [];
  let index = 0;

  function push(type: ContentNodeType, raw: string, level?: number): void {
    const trimmed = raw.replace(/\n+$/, "");
    if (type === "paragraph" && trimmed.trim() === "") {
      return;
    }
    nodes.push({
      id: nodeId(sectionId, index),
      type,
      raw: trimmed,
      ...(level !== undefined ? { level } : {}),
    });
    index += 1;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (line.trim().startsWith(FORMULA_DELIM)) {
      const block: string[] = [line];
      const singleLine =
        line.trim().length > FORMULA_DELIM.length * 2 &&
        line.trim().endsWith(FORMULA_DELIM);
      if (!singleLine) {
        i += 1;
        while (i < lines.length) {
          block.push(lines[i]!);
          if (lines[i]!.trim().endsWith(FORMULA_DELIM)) {
            break;
          }
          i += 1;
        }
      }
      push("formula_block", block.join("\n"));
      i += 1;
      continue;
    }

    if (FENCE_RE.test(line.trim())) {
      const block: string[] = [line];
      i += 1;
      while (i < lines.length) {
        block.push(lines[i]!);
        if (FENCE_RE.test(lines[i]!.trim())) {
          i += 1;
          break;
        }
        i += 1;
      }
      push("code", block.join("\n"));
      continue;
    }

    // Inline SVG block (emitted by the visual pipeline). Collect from the
    // opening <svg until the line containing </svg>.
    if (line.trim().toLowerCase().startsWith("<svg")) {
      const block: string[] = [line];
      let closed = /<\/svg>/i.test(line);
      while (!closed && i + 1 < lines.length) {
        i += 1;
        block.push(lines[i]!);
        if (/<\/svg>/i.test(lines[i]!)) closed = true;
      }
      i += 1;
      if (closed) {
        push("svg", block.join("\n"));
        continue;
      }
      // Unterminated — fall back to treating the opener as a paragraph.
      push("paragraph", block.join("\n"));
      continue;
    }

    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      const level = Math.min(headingMatch[1]!.length, 4);
      push("heading", line, level);
      i += 1;
      continue;
    }

    if (HR_RE.test(line)) {
      push("hr", line);
      i += 1;
      continue;
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const block: string[] = [];
      while (i < lines.length && BLOCKQUOTE_RE.test(lines[i]!)) {
        block.push(lines[i]!);
        i += 1;
      }
      push("quote", block.join("\n"));
      continue;
    }

    if (FIGURE_RE.test(line)) {
      push("figure", line);
      i += 1;
      continue;
    }

    if (LIST_ITEM_RE.test(line)) {
      const block: string[] = [];
      while (i < lines.length) {
        if (LIST_ITEM_RE.test(lines[i]!)) {
          block.push(lines[i]!);
          i += 1;
          continue;
        }
        // Keep a "loose" list (blank line between items) as one list when the
        // next non-blank line is still a list item.
        if (lines[i]!.trim() === "" && LIST_ITEM_RE.test(lines[i + 1] ?? "")) {
          block.push(lines[i]!);
          i += 1;
          continue;
        }
        break;
      }
      push("list", block.join("\n"));
      continue;
    }

    if (isTableLine(line)) {
      const block: string[] = [line];
      let j = i + 1;
      while (j < lines.length && isTableLine(lines[j]!)) {
        block.push(lines[j]!);
        j += 1;
      }
      if (block.some(isTableDataRow) && block.length >= 2) {
        push("table", block.join("\n"));
        i = j;
        continue;
      }
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== "" &&
      !lines[i]!.trim().startsWith(FORMULA_DELIM) &&
      !FENCE_RE.test(lines[i]!.trim()) &&
      !HEADING_RE.test(lines[i]!) &&
      !HR_RE.test(lines[i]!) &&
      !BLOCKQUOTE_RE.test(lines[i]!) &&
      !lines[i]!.trim().toLowerCase().startsWith("<svg") &&
      !FIGURE_RE.test(lines[i]!) &&
      !LIST_ITEM_RE.test(lines[i]!) &&
      !isTableLine(lines[i]!)
    ) {
      paragraph.push(lines[i]!);
      i += 1;
    }
    push("paragraph", paragraph.join("\n"));
  }

  return nodes;
}

export async function assembleStudyGuide(
  sessionId: string,
  scope: ScopeDocument,
  onProgress?: (done: number, total: number) => void,
): Promise<StudyGuideDocument> {
  const sessionDir = await getSessionDir(sessionId);
  const sections: StudyGuideSection[] = [];
  const total = scope.sections.length;

  for (let i = 0; i < scope.sections.length; i++) {
    const scopeSection = scope.sections[i]!;
    const section = await assembleSection(sessionDir, scopeSection);
    sections.push(section);
    onProgress?.(i + 1, total);
  }

  const document: StudyGuideDocument = {
    sessionId,
    meta: scope.meta,
    sections,
    globalVocabulary: scope.globalVocabulary,
    assembledAt: new Date().toISOString(),
  };

  await writeTextFile(
    await join(sessionDir, STUDY_GUIDE_FILE),
    JSON.stringify(document, null, 2),
  );

  return document;
}

async function assembleSection(
  sessionDir: string,
  scopeSection: ScopeSection,
): Promise<StudyGuideSection> {
  const sectionDir = await getSectionDir(sessionDir, scopeSection.id);
  const visualPath = await join(sectionDir, "content-visual.md");
  const finalPath = await join(sectionDir, "final.md");
  const verdictPath = await join(sectionDir, "verdict.json");
  const warnings: SectionWarning[] = [];

  let contentMd = "";
  if (await exists(visualPath)) {
    contentMd = await readTextFile(visualPath);
  } else if (await exists(finalPath)) {
    contentMd = await readTextFile(finalPath);
  } else {
    console.warn(
      `[assembler] Missing final.md for section "${scopeSection.id}"`,
    );
    warnings.push({
      type: "verify_failed",
      message: "No final content was produced for this section.",
    });
  }

  // Strip any prompt brief / formatting rules the model echoed into the content
  // (defensive — the generator's system prompt already forbids this).
  contentMd = sanitizeMarkdown(contentMd);

  if (await exists(verdictPath)) {
    try {
      const verdict = JSON.parse(await readTextFile(verdictPath)) as {
        pass?: boolean;
        score?: number;
      };
      if (verdict.pass === false) {
        warnings.push({
          type: "verify_failed",
          message: `Section shipped without passing verification (score ${verdict.score ?? "unknown"}).`,
        });
      }
    } catch (error) {
      console.warn(
        `[assembler] Could not parse verdict.json for "${scopeSection.id}":`,
        error,
      );
    }
  }

  const nodes = parseContentNodes(scopeSection.id, contentMd);

  return {
    id: scopeSection.id,
    title: scopeSection.title,
    depth: scopeSection.depth,
    weightPercent: scopeSection.weightPercent,
    weekOrUnit: scopeSection.weekOrUnit,
    contentMd,
    nodes,
    threads: [],
    analytics: zeroedAnalytics(),
    warnings,
  };
}

export async function loadStudyGuide(
  sessionId: string,
): Promise<StudyGuideDocument | null> {
  const sessionDir = await getSessionDir(sessionId);
  const path = await join(sessionDir, STUDY_GUIDE_FILE);

  if (!(await exists(path))) {
    return null;
  }

  return JSON.parse(await readTextFile(path)) as StudyGuideDocument;
}

async function writeStudyGuide(
  sessionId: string,
  document: StudyGuideDocument,
): Promise<void> {
  const sessionDir = await getSessionDir(sessionId);
  await writeTextFile(
    await join(sessionDir, STUDY_GUIDE_FILE),
    JSON.stringify(document, null, 2),
  );
}

export async function updateSectionAnalytics(
  sessionId: string,
  sectionId: string,
  update: Partial<SectionAnalytics>,
): Promise<void> {
  const document = await loadStudyGuide(sessionId);
  if (!document) {
    return;
  }

  const section = document.sections.find((entry) => entry.id === sectionId);
  if (!section) {
    return;
  }

  const current = section.analytics;
  section.analytics = {
    totalTimeMs: current.totalTimeMs + (update.totalTimeMs ?? 0),
    visits: current.visits + (update.visits ?? 0),
    rereadCount: current.rereadCount + (update.rereadCount ?? 0),
    threadCount: update.threadCount ?? current.threadCount,
    lastVisitedAt: update.lastVisitedAt ?? current.lastVisitedAt,
  };

  await writeStudyGuide(sessionId, document);
}

export async function saveThread(
  sessionId: string,
  sectionId: string,
  thread: InlineThread,
): Promise<void> {
  const document = await loadStudyGuide(sessionId);
  if (!document) {
    return;
  }

  const section = document.sections.find((entry) => entry.id === sectionId);
  if (!section) {
    return;
  }

  const existingIndex = section.threads.findIndex(
    (entry) => entry.id === thread.id,
  );
  if (existingIndex >= 0) {
    section.threads[existingIndex] = thread;
  } else {
    section.threads.push(thread);
  }

  section.analytics.threadCount = section.threads.length;

  await writeStudyGuide(sessionId, document);
}

// Notebook-level chat (NotebookLM-style, scoped to the whole notebook) is stored
// separately from the study guide so it can grow independently of section data.
export async function loadNotebookChat(
  sessionId: string,
): Promise<ThreadMessage[]> {
  const sessionDir = await getSessionDir(sessionId);
  const path = await join(sessionDir, CHAT_FILE);

  if (!(await exists(path))) {
    return [];
  }

  try {
    const parsed = JSON.parse(await readTextFile(path)) as ThreadMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveNotebookChat(
  sessionId: string,
  messages: ThreadMessage[],
): Promise<void> {
  const sessionDir = await getSessionDir(sessionId);
  await writeTextFile(
    await join(sessionDir, CHAT_FILE),
    JSON.stringify(messages, null, 2),
  );
}
