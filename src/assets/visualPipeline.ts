// Visual asset pipeline. Runs after section generation and before the
// assembler. Resolves {{figure: "..."}} placeholders in section markdown by
// finding or generating the best matching visual, in priority order:
//   lane 1: a real figure CROPPED from an ingested textbook/slide page
//   lane 2: an LLM-generated SVG diagram (fallback)
//
// Why a rebuild: the old lane 1 stored entire page screenshots and returned the
// first weak candidate, so a title slide got pasted across every section. Now a
// figure must (a) survive a strict "is this an actual diagram, not a title /
// agenda / text slide?" detection pass, (b) be cropped to its bounding box, and
// (c) be confirmed relevant to the specific placeholder by a judge that may
// answer "none". Each figure is used at most once (dedupe); anything without a
// confident match falls through to an SVG.

import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

import { isAbortError, type AskOptions, type LLMClient } from "../llm/client";
import { extractJsonPayload } from "../llm/json";
import type { RawDocument, ScopeDocument, ScopeSection } from "../types";

// --- Types ---

export type FigureMimeType = "image/png" | "image/jpeg" | "image/svg+xml";

export interface FigureEntry {
  id: string;
  sourceFile: string;
  pageNumber: number;
  imageData: string; // base64 for raster (CROPPED region); raw <svg> markup for SVG
  mimeType: FigureMimeType;
  caption: string;
  topics: string[];
  relevanceHint: string;
  source: "textbook" | "svg";
}

export interface FigureIndex {
  sessionId: string;
  builtAt: string;
  figures: FigureEntry[];
}

export interface FigurePlaceholder {
  raw: string;
  description: string;
  position: number;
}

export interface ResolvedFigure {
  placeholder: FigurePlaceholder;
  figure: FigureEntry | null; // null if all lanes failed
}

interface BoundingBox {
  x: number; // 0-1 fraction of page width
  y: number;
  width: number;
  height: number;
}

// --- Constants ---

const SESSIONS_DIR = "sessions";
const SECTIONS_DIR = "sections";
const ASSETS_DIR = "assets";
const FIGURE_INDEX_FILE = "figure-index.json";

const DETECTION_BATCH = 5; // pages per "does this page have a real figure?" call
const DETAIL_BATCH = 3; // pages per detailed metadata + bounding-box pass
const BBOX_PADDING = 0.02; // crop padding as a fraction of page size
// A box this close to the whole page is a text/title slide, not a figure.
const MAX_FIGURE_COVERAGE = 0.92;
const MIN_FIGURE_SIZE = 0.12; // a real figure occupies at least this fraction per side

// --- Path helpers ---

async function getSessionDir(sessionId: string): Promise<string> {
  return join(await appDataDir(), SESSIONS_DIR, sessionId);
}

async function getSectionDir(
  sessionDir: string,
  sectionId: string,
): Promise<string> {
  return join(sessionDir, SECTIONS_DIR, sectionId);
}

// --- Placeholder parser (pure, no I/O) ---

const PLACEHOLDER_RE = /\{\{figure:\s*"([^"]*)"\s*\}\}/g;

export function parsePlaceholders(markdown: string): FigurePlaceholder[] {
  const results: FigurePlaceholder[] = [];
  PLACEHOLDER_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_RE.exec(markdown)) !== null) {
    const raw = match[0];
    const position = match.index;
    const end = position + raw.length;

    // Require the placeholder to sit alone on its line.
    const lineStart = markdown.lastIndexOf("\n", position - 1) + 1;
    const before = markdown.slice(lineStart, position);
    let nextNewline = markdown.indexOf("\n", end);
    if (nextNewline === -1) nextNewline = markdown.length;
    const after = markdown.slice(end, nextNewline);

    if (before.trim() !== "" || after.trim() !== "") continue;

    results.push({ raw, description: (match[1] ?? "").trim(), position });
  }

  return results;
}

// --- Markdown rewriter (pure, no I/O) ---

export function resolvePlaceholders(
  markdown: string,
  resolved: ResolvedFigure[],
): string {
  const sorted = [...resolved].sort(
    (a, b) => b.placeholder.position - a.placeholder.position,
  );

  let out = markdown;

  for (const entry of sorted) {
    const { position, raw } = entry.placeholder;
    const end = position + raw.length;
    const figure = entry.figure;

    if (!figure) {
      // Drop the placeholder line entirely, including its trailing newline.
      const lineStart = out.lastIndexOf("\n", position - 1) + 1;
      let lineEnd = out.indexOf("\n", end);
      lineEnd = lineEnd === -1 ? out.length : lineEnd + 1;
      out = out.slice(0, lineStart) + out.slice(lineEnd);
      continue;
    }

    let replacement: string;
    if (figure.source === "svg") {
      replacement = `${figure.imageData}\n\n*${figure.caption}*`;
    } else {
      const dataUri = `data:${figure.mimeType};base64,${figure.imageData}`;
      replacement = `![${figure.caption}](${dataUri})`;
    }

    out = out.slice(0, position) + replacement + out.slice(end);
  }

  return out;
}

// --- Image cropping (renderer canvas) ---

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("figure image failed to load"));
    img.src = dataUrl;
  });
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Validates a model-reported bounding box: it must be a plausible sub-region of
// the page (not the whole page, not a sliver). Returns null to reject the box
// (and therefore the figure — better an SVG than a full-page screenshot).
function validateBox(box: BoundingBox | null | undefined): BoundingBox | null {
  if (!box) return null;
  const x = clamp01(Number(box.x));
  const y = clamp01(Number(box.y));
  const width = clamp01(Number(box.width));
  const height = clamp01(Number(box.height));
  if (!(width > 0 && height > 0)) return null;
  if (width < MIN_FIGURE_SIZE || height < MIN_FIGURE_SIZE) return null;
  if (width > MAX_FIGURE_COVERAGE && height > MAX_FIGURE_COVERAGE) return null;
  if (x + width > 1.001 || y + height > 1.001) return null;
  return { x, y, width, height };
}

async function cropToBox(
  base64: string,
  mimeType: string,
  box: BoundingBox,
): Promise<string | null> {
  try {
    const img = await loadImage(`data:${mimeType};base64,${base64}`);
    const padX = BBOX_PADDING * img.width;
    const padY = BBOX_PADDING * img.height;
    const sx = Math.max(0, box.x * img.width - padX);
    const sy = Math.max(0, box.y * img.height - padY);
    const sw = Math.min(img.width - sx, box.width * img.width + 2 * padX);
    const sh = Math.min(img.height - sy, box.height * img.height + 2 * padY);
    if (sw < 1 || sh < 1) return null;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1] ?? null;
  } catch (error) {
    console.warn("[visual] crop failed:", error);
    return null;
  }
}

// --- Lane 1: textbook / slide figure extraction ---

interface PageRef {
  doc: RawDocument;
  pageNumber: number;
  imageData: string;
  mimeType: FigureMimeType;
}

interface PageFigureMeta {
  caption: string;
  topics: string[];
  relevanceHint: string;
  figureCount: number;
  box: BoundingBox | null;
}

function collectImagePages(rawDocs: RawDocument[]): PageRef[] {
  const pages: PageRef[] = [];
  for (const doc of rawDocs) {
    for (const page of doc.pages ?? []) {
      if (!page.imageData) continue;
      const mime = page.mimeType === "image/png" ? "image/png" : "image/jpeg";
      pages.push({
        doc,
        pageNumber: page.pageNumber,
        imageData: page.imageData,
        mimeType: mime,
      });
    }
  }
  return pages;
}

function imageBlock(page: PageRef): { data: string; mimeType: string } {
  return { data: page.imageData, mimeType: page.mimeType };
}

// Strict yes/no pass: which pages hold a genuine diagram/figure/chart — NOT a
// title slide, agenda/table of contents, references page, or page that is just
// text and equations.
async function detectFiguresInBatch(
  batch: PageRef[],
  llm: LLMClient,
  opts: AskOptions,
): Promise<boolean[]> {
  const prompt =
    `You are shown ${batch.length} document page image(s), in order.\n` +
    `For each page, decide if it contains a genuine DIAGRAM, FIGURE, GRAPH, ` +
    `CHART, PLOT, CIRCUIT, or technical ILLUSTRATION that a student would want ` +
    `to see.\n` +
    `Answer "no" for: title/cover slides, agendas, tables of contents, ` +
    `reference/citation pages, pages that are only text, and pages that are ` +
    `only equations or only a table.\n` +
    `Reply with ONLY a JSON array of ${batch.length} strings, each exactly ` +
    `"yes" or "no", in page order. No other text.`;

  try {
    const raw = await llm.askWithImages(prompt, batch.map(imageBlock), opts);
    const parsed = extractJsonPayload<string[]>(raw, "array");
    if (!parsed) return batch.map(() => false);
    return batch.map((_, i) =>
      String(parsed[i] ?? "").trim().toLowerCase().startsWith("y"),
    );
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.warn("[visual] figure detection batch failed:", error);
    // On failure, assume NO figure — we'd rather generate an SVG than risk
    // pasting an irrelevant page screenshot.
    return batch.map(() => false);
  }
}

// Detailed vision pass: figure metadata + bounding box for figure-bearing pages.
async function extractFigureMeta(
  batch: PageRef[],
  llm: LLMClient,
  opts: AskOptions,
): Promise<(PageFigureMeta | null)[]> {
  const prompt =
    `You are shown ${batch.length} document page image(s), in order. Each ` +
    `should contain at least one diagram/figure/chart.\n` +
    `For each page IN ORDER, return one JSON object describing the single most ` +
    `important figure and its bounding box as fractions (0-1) of the page:\n` +
    `{\n` +
    `  "caption": string,        // short descriptive title\n` +
    `  "topics": string[],       // topic keywords the figure relates to\n` +
    `  "relevanceHint": string,  // one sentence on what it shows\n` +
    `  "figureCount": number,    // distinct figures on the page\n` +
    `  "box": { "x": number, "y": number, "width": number, "height": number }\n` +
    `}\n` +
    `The box must tightly enclose ONLY the figure (exclude surrounding body ` +
    `text, slide titles, and footers). If a page actually has no real figure, ` +
    `return figureCount 0 and box null.\n` +
    `Return ONLY a JSON array of exactly ${batch.length} objects, in page order.`;

  try {
    const raw = await llm.askWithImages(prompt, batch.map(imageBlock), opts);
    const parsed = extractJsonPayload<PageFigureMeta[]>(raw, "array");
    if (!parsed) return batch.map(() => null);
    return batch.map((_, i) => {
      const meta = parsed[i];
      if (!meta || typeof meta !== "object") return null;
      return {
        caption: String(meta.caption ?? "").trim(),
        topics: Array.isArray(meta.topics)
          ? meta.topics.map((t) => String(t)).filter(Boolean)
          : [],
        relevanceHint: String(meta.relevanceHint ?? "").trim(),
        figureCount: typeof meta.figureCount === "number" ? meta.figureCount : 1,
        box: (meta.box as BoundingBox | null) ?? null,
      };
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.warn("[visual] figure metadata batch failed:", error);
    return batch.map(() => null);
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function buildFigureIndex(
  sessionId: string,
  rawDocs: RawDocument[],
  llm: LLMClient,
  opts: AskOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<FigureIndex> {
  const imagePages = collectImagePages(rawDocs);
  const total = imagePages.length;
  let done = 0;

  // Pass 1: strict detection.
  const figurePages: PageRef[] = [];
  for (const batch of chunk(imagePages, DETECTION_BATCH)) {
    const flags = await detectFiguresInBatch(batch, llm, opts);
    batch.forEach((page, i) => {
      if (flags[i]) figurePages.push(page);
    });
    done += batch.length;
    onProgress?.(done, total);
  }

  // Pass 2: metadata + bounding box, then crop to the box. A figure is only
  // indexed if it has a real caption AND a valid (non-full-page) box that crops
  // cleanly — this is what keeps title slides out.
  const figures: FigureEntry[] = [];
  let figureIndex = 0;

  for (const batch of chunk(figurePages, DETAIL_BATCH)) {
    const metas = await extractFigureMeta(batch, llm, opts);
    for (let i = 0; i < batch.length; i++) {
      const page = batch[i]!;
      const meta = metas[i];
      if (!meta || meta.figureCount <= 0 || meta.caption === "") continue;

      const box = validateBox(meta.box);
      if (!box) continue;

      const cropped = await cropToBox(page.imageData, page.mimeType, box);
      if (!cropped) continue;

      figures.push({
        id: `fig_${sessionId}_${figureIndex++}`,
        sourceFile: page.doc.filename,
        pageNumber: page.pageNumber,
        imageData: cropped,
        mimeType: "image/jpeg",
        caption: meta.caption,
        topics: meta.topics,
        relevanceHint: meta.relevanceHint,
        source: "textbook",
      });
    }
  }

  const index: FigureIndex = {
    sessionId,
    builtAt: new Date().toISOString(),
    figures,
  };

  const sessionDir = await getSessionDir(sessionId);
  const assetsDir = await join(sessionDir, ASSETS_DIR);
  await mkdir(assetsDir, { recursive: true });
  await writeTextFile(
    await join(assetsDir, FIGURE_INDEX_FILE),
    JSON.stringify(index, null, 2),
  );

  return index;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3);
}

// Picks the single best UNUSED figure for a placeholder, or null. Candidates are
// pre-filtered by topic/word overlap, then a judge confirms the match (and may
// answer "none"). Dedupe via `usedIds` ensures no figure is reused.
export async function matchFigureFromIndex(
  index: FigureIndex,
  description: string,
  sectionTopics: string[],
  usedIds: Set<string>,
  llm: LLMClient,
  opts: AskOptions,
): Promise<FigureEntry | null> {
  const topicSet = new Set(sectionTopics.map((t) => t.toLowerCase().trim()));
  const descWords = new Set(tokenize(description));

  const candidates = index.figures.filter((figure) => {
    if (usedIds.has(figure.id)) return false;
    const topicOverlap = figure.topics.some((t) =>
      topicSet.has(t.toLowerCase().trim()),
    );
    if (topicOverlap) return true;
    const hintWords = tokenize(`${figure.relevanceHint} ${figure.caption}`);
    return hintWords.some((word) => descWords.has(word));
  });

  if (candidates.length === 0) return null;

  // Always confirm relevance with the judge — even a single candidate — so a
  // weak keyword overlap can't force an irrelevant figure in.
  const list = candidates
    .map((figure, i) => `${i}: ${figure.relevanceHint || figure.caption}`)
    .join("\n");
  const prompt =
    `A study-guide figure is needed for this description:\n"${description}"\n\n` +
    `Candidate figures (index: description):\n${list}\n\n` +
    `Reply with ONLY the integer index of the figure that genuinely matches the ` +
    `description, or -1 if none of them are a good match. Prefer -1 over a weak match.`;

  try {
    const raw = await llm.ask(prompt, opts);
    const parsed = parseInt(raw.match(/-?\d+/)?.[0] ?? "", 10);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < candidates.length) {
      return candidates[parsed]!;
    }
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.warn("[visual] figure match judge failed:", error);
  }

  return null;
}

// --- Lane 2: LLM-generated SVG diagram ---

export async function generateSVGFigure(
  description: string,
  sectionTitle: string,
  surroundingText: string,
  llm: LLMClient,
  opts: AskOptions,
): Promise<FigureEntry | null> {
  const context = surroundingText.slice(0, 200);
  const prompt =
    `Generate a clean technical SVG diagram for a study guide.\n\n` +
    `Figure description: ${description}\n` +
    `Section title (for context): ${sectionTitle}\n` +
    `Surrounding text (for context): ${context}\n\n` +
    `Strict requirements:\n` +
    `- Output ONLY the raw SVG. Start with "<svg" and end with "</svg>". No markdown fences, no commentary.\n` +
    `- A viewBox MUST be set. Do NOT set width or height attributes (the figure must be responsive).\n` +
    `- Use ONLY black (#1a1a1a) and light gray (#e5e5e5) fills. No color.\n` +
    `- Font: sans-serif, minimum 12px.\n` +
    `- Fully self-contained: no external references, no <image> tags.\n` +
    `Suitable content: block diagrams, signal flow graphs, waveforms, filter response sketches, state machines, simple mathematical illustrations.\n\n` +
    `If the description cannot be represented as a clean technical SVG (e.g. a photograph or complex real-world scene), reply with the single word SKIP and nothing else.`;

  try {
    const generator = llm.withConfig({ temperature: 0.2, maxTokens: 2048 });
    const raw = (await generator.ask(prompt, opts)).trim();

    if (raw === "SKIP" || !raw.startsWith("<svg") || !raw.includes("</svg>")) {
      return null;
    }

    return {
      id: "", // assigned by the caller
      sourceFile: "generated",
      pageNumber: 0,
      imageData: raw,
      mimeType: "image/svg+xml",
      caption: description,
      topics: [],
      relevanceHint: description,
      source: "svg",
    };
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.warn("[visual] SVG generation failed:", error);
    return null;
  }
}

// --- Placeholder resolution (both lanes, in order) ---

function surroundingTextFor(markdown: string, position: number): string {
  const start = Math.max(0, position - 200);
  return markdown.slice(start, position).trim();
}

async function resolveOnePlaceholder(
  placeholder: FigurePlaceholder,
  markdown: string,
  index: FigureIndex,
  sectionTitle: string,
  sectionTopics: string[],
  usedIds: Set<string>,
  llm: LLMClient,
  opts: AskOptions,
  mintId: (source: "svg") => string,
): Promise<FigureEntry | null> {
  const description = placeholder.description;

  // Lane 1: a confidently-matched, unused, cropped textbook figure.
  const fromIndex = await matchFigureFromIndex(
    index,
    description,
    sectionTopics,
    usedIds,
    llm,
    opts,
  );
  if (fromIndex) {
    usedIds.add(fromIndex.id);
    return fromIndex;
  }

  // Lane 2: generated SVG.
  const surrounding = surroundingTextFor(markdown, placeholder.position);
  const fromSvg = await generateSVGFigure(
    description,
    sectionTitle,
    surrounding,
    llm,
    opts,
  );
  if (fromSvg) {
    fromSvg.id = mintId("svg");
    fromSvg.topics = sectionTopics;
    return fromSvg;
  }

  return null;
}

// --- Main entry point ---

interface SectionWork {
  section: ScopeSection;
  markdown: string;
  placeholders: FigurePlaceholder[];
}

async function readSectionMarkdown(
  sessionDir: string,
  sectionId: string,
): Promise<string | null> {
  const sectionDir = await getSectionDir(sessionDir, sectionId);
  for (const name of ["final.md", "content.md"]) {
    const path = await join(sectionDir, name);
    if (await exists(path)) return readTextFile(path);
  }
  return null;
}

export async function runVisualPipeline(
  sessionId: string,
  scope: ScopeDocument,
  rawDocs: RawDocument[],
  llm: LLMClient,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const opts: AskOptions = { signal };
  const sessionDir = await getSessionDir(sessionId);

  // First pass: load each section's markdown and parse its placeholders, so we
  // can skip the (expensive) figure-index build when nothing needs it and report
  // accurate resolution progress.
  const work: SectionWork[] = [];
  let totalPlaceholders = 0;
  for (const section of scope.sections) {
    const markdown = await readSectionMarkdown(sessionDir, section.id);
    if (markdown === null) {
      console.warn(`[visual] no content for section "${section.id}", skipping`);
      continue;
    }
    const placeholders = parsePlaceholders(markdown);
    work.push({ section, markdown, placeholders });
    totalPlaceholders += placeholders.length;
  }

  if (totalPlaceholders === 0) return;

  const index = await buildFigureIndex(sessionId, rawDocs, llm, opts, onProgress);

  // Second pass: resolve placeholders and rewrite each section's markdown. A
  // figure is used at most once across the whole guide (dedupe via usedIds).
  let done = 0;
  let mintCounter = 0;
  const usedIds = new Set<string>();
  const mintId = (source: "svg"): string =>
    `fig_${sessionId}_${source}_${mintCounter++}`;

  for (const { section, markdown, placeholders } of work) {
    if (placeholders.length === 0) continue;

    const sectionDir = await getSectionDir(sessionDir, section.id);
    const sectionTopics = section.requiredConcepts ?? [];
    const resolved: ResolvedFigure[] = [];

    for (const placeholder of placeholders) {
      const figure = await resolveOnePlaceholder(
        placeholder,
        markdown,
        index,
        section.title,
        sectionTopics,
        usedIds,
        llm,
        opts,
        mintId,
      );

      resolved.push({ placeholder, figure });
      done += 1;
      onProgress?.(done, totalPlaceholders);
    }

    const rewritten = resolvePlaceholders(markdown, resolved);
    await writeTextFile(await join(sectionDir, "content-visual.md"), rewritten);
  }
}
