import { paginateForContext } from "../ingest/ingest";
import { clampChars } from "../lib/text";
import { LLMError, isAbortError, type LLMClient } from "../llm/client";
import {
  extractJsonPayload,
  salvageTruncatedArray,
  stripCodeFences,
} from "../llm/json";
import type {
  DefinedTerm,
  DocumentPage,
  ExamExtraction,
  ExamQuestion,
  InputDocumentType,
  OutlineExtraction,
  RawDocument,
  SlideSection,
  SlidesExtraction,
} from "../types";

const MAX_VISION_IMAGES_PER_CALL = 10;
const MAX_EXAM_VISION_PAGES = 15;
// Pages whose text layer has at least this many characters are extracted from
// text alone; vision is reserved for pages that are mostly images/diagrams.
const SPARSE_TEXT_THRESHOLD = 200;
const EXTRACT_CONCURRENCY = 3;
const CHUNK_CONCURRENCY = 3;

// Ollama serves one request at a time, so extra workers only pile up in its
// queue (where webview reloads abort them) and thrash the prompt cache.
// Cloud providers handle the concurrency fine.
function concurrencyFor(llm: LLMClient, max: number): number {
  return llm.provider === "ollama" ? 1 : max;
}
// Output budget for extraction calls. Dense inputs (textbooks) produce large
// JSON; a low cap truncates mid-array and the parse fails.
const EXTRACTION_MAX_TOKENS = 8192;
// Chunk size for text extraction. Kept moderate so the JSON the model returns
// for one chunk stays comfortably inside EXTRACTION_MAX_TOKENS.
const TEXT_CHUNK_CHAR_BUDGET = 24000;
// Outline and exam text are sent to the model whole (not chunked like slides),
// so they are capped to keep a single request inside the context window.
const OUTLINE_MAX_CHARS = 120000;
const EXAM_TEXT_MAX_CHARS = 120000;

// System prompt for vision extraction calls (askWithImages bypasses the client's
// default JSON-mode system prompt, so it is supplied here explicitly).
const EXTRACTION_SYSTEM =
  "You are a precise data-extraction engine. Respond with a single valid JSON " +
  "value and nothing else — no prose, no explanation, no markdown code fences.";

function parseJsonResponse<T>(raw: string): T {
  const parsed = extractJsonPayload<T>(raw, "object");
  if (parsed === null) {
    throw new LLMError(
      `Invalid JSON in extraction response: ${raw.slice(0, 300)}`,
      0,
    );
  }
  return parsed;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

// Keeps only items shaped like a SlideSection and fills in missing arrays.
// Chatty models leak scratchpad fragments (e.g. bare {term, definition}
// objects) into salvaged output; passing those downstream crashes synthesis
// on `section.title`.
function normalizeSlideSections(items: unknown[]): SlideSection[] {
  const sections: SlideSection[] = [];
  for (const item of items) {
    const value = item as Partial<SlideSection> | null;
    if (!value || typeof value !== "object" || typeof value.title !== "string") {
      continue;
    }
    sections.push({
      title: value.title,
      concepts: stringArray(value.concepts),
      formulas: stringArray(value.formulas),
      definedTerms: Array.isArray(value.definedTerms)
        ? value.definedTerms.filter(
            (term): term is DefinedTerm =>
              !!term &&
              typeof term.term === "string" &&
              typeof term.definition === "string",
          )
        : [],
      figureDescriptions: stringArray(value.figureDescriptions),
    });
  }
  return sections;
}

function parseSlideSections(raw: string): SlideSection[] {
  const parsed = extractJsonPayload<unknown[]>(raw, "array");
  if (parsed) {
    const sections = normalizeSlideSections(parsed);
    if (sections.length > 0) {
      return sections;
    }
  }

  // Last resort: the array itself was cut off mid-object (output token cap),
  // so no balanced payload exists. Recover the complete objects.
  const salvaged = salvageTruncatedArray<unknown>(stripCodeFences(raw));
  if (salvaged) {
    const sections = normalizeSlideSections(salvaged);
    if (sections.length > 0) {
      console.warn(
        `[extract] Response JSON was malformed; salvaged ${sections.length} section(s)`,
      );
      return sections;
    }
  }

  throw new LLMError(
    `Invalid JSON in extraction response: ${raw.slice(0, 300)}`,
    0,
  );
}

function documentText(doc: RawDocument): string {
  if (doc.textContent) {
    return doc.textContent;
  }
  return (doc.pages ?? [])
    .map((page) => page.textContent)
    .filter(Boolean)
    .join("\n\n");
}

function inferWeekOrUnit(filename: string): string | undefined {
  const weekMatch = filename.match(/w(?:eek)?[_\s]?(\d+)/i);
  if (weekMatch) {
    return `Week ${weekMatch[1]}`;
  }

  const lecMatch = filename.match(/lec(?:ture)?[_\s]?(\d+)/i);
  if (lecMatch) {
    return `Lecture ${lecMatch[1]}`;
  }

  return undefined;
}

function inferExamYear(filename: string): number | undefined {
  const match = filename.match(/20\d{2}/);
  return match ? Number(match[0]) : undefined;
}

function inferExamType(
  filename: string,
): ExamExtraction["examType"] {
  if (/midterm|mt\d/i.test(filename)) {
    return "midterm";
  }
  if (/final|f\d{4}/i.test(filename)) {
    return "final";
  }
  if (/quiz/i.test(filename)) {
    return "quiz";
  }
  return "unknown";
}

function examTypeLetter(examType: ExamExtraction["examType"]): string {
  return examType[0] ?? "u";
}

function buildOutlinePrompt(text: string): string {
  return `You are extracting structured data from a university course outline.

Return ONLY a JSON object matching this shape — no markdown fences, no explanation:
{
  "courseName": string,
  "courseCode": string,
  "term": string | null,
  "instructor": string | null,
  "topics": [{ "title": string, "weekOrUnit": string | null, "subtopics": string[], "lectureHours": number | null }],
  "assessments": [{ "name": string, "weight": number, "date": string | null, "topicsCovered": string[] | null }]
}

Rules:
- Output minified JSON on a single line — no indentation, no line breaks, no markdown fences.
- Topic titles must be 6 words or fewer.
- Subtopics are specific concepts, not vague descriptions.
- Assessment weight is a number (30 for 30%, not "30%").
- Use null for any field not present in the document.

Course outline text:
${text}`;
}

function buildSlidesTextPrompt(
  text: string,
  chunkIndex: number,
  totalChunks: number,
): string {
  return `You are extracting structured data from university lecture slides.

This is chunk ${chunkIndex + 1} of ${totalChunks}.

Return ONLY a JSON array of SlideSection objects — no markdown fences, no explanation:
[{ "title": string, "concepts": string[], "formulas": string[], "definedTerms": [{ "term": string, "definition": string }], "figureDescriptions": string[] }]

Rules:
- Output minified JSON on a single line — no indentation, no line breaks, no markdown fences.
- One section per major topic (usually 1-3 sections per lecture chunk).
- Concepts are specific and precise, not vague — at most 8 words each.
- Formulas in LaTeX notation exactly as written in the slides.
- Defined terms are only words given explicit definitions in the slides.
- Figure descriptions: one concise sentence each, specific enough to search for the figure.

Slide text:
${text}`;
}

function buildSlidesVisionPrompt(
  textContext: string,
  chunkIndex: number,
  totalChunks: number,
  pageNumbers: number[],
): string {
  const pageList = pageNumbers.join(", ");
  const textBlock = textContext
    ? `\nExtracted text from these pages:\n${textContext}\n`
    : "";

  return `You are extracting structured data from university lecture slides.

This is chunk ${chunkIndex + 1} of ${totalChunks}. The attached images are pages: ${pageList}.
${textBlock}
Return ONLY a JSON array of SlideSection objects — no markdown fences, no explanation:
[{ "title": string, "concepts": string[], "formulas": string[], "definedTerms": [{ "term": string, "definition": string }], "figureDescriptions": string[] }]

Rules:
- Output minified JSON on a single line — no indentation, no line breaks, no markdown fences.
- One section per major topic (usually 1-3 sections per lecture chunk).
- Concepts are specific and precise, not vague — at most 8 words each.
- Formulas in LaTeX notation exactly as written in the slides.
- Defined terms are only words given explicit definitions in the slides.
- Figure descriptions: one concise sentence each, specific enough to search for the figure.`;
}

function buildExamTextPrompt(
  text: string,
  year: number | undefined,
  examType: ExamExtraction["examType"],
): string {
  const yearStr = year ?? "unknown";
  const typeLetter = examTypeLetter(examType);

  return `You are extracting structured data from a university exam paper.

Return ONLY a JSON object — no markdown fences, no explanation:
{ "totalMarks": number | null, "questions": [{ "id": string, "text": string, "marks": number, "topic": string, "concepts": string[], "hasSolution": boolean }] }

Rules:
- Output minified JSON on a single line — no indentation, no line breaks, no markdown fences.
- Include ALL questions and sub-questions as separate entries (Q1a, Q1b are separate).
- id format: "{year}_{examTypeLetter}_Q{num}" e.g. "${yearStr}_${typeLetter}_Q3b"
- topic should match a course topic name, not a generic description.
- concepts are specific things the student needs to know to answer the question.
- hasSolution is true if an answer key is visible in the document.
- Extract formulas in LaTeX notation exactly as written.

Exam text:
${text}`;
}

function buildExamVisionPrompt(
  year: number | undefined,
  examType: ExamExtraction["examType"],
  pageNumbers: number[],
): string {
  const yearStr = year ?? "unknown";
  const typeLetter = examTypeLetter(examType);
  const pageList = pageNumbers.join(", ");

  return `You are extracting structured data from a university exam paper.

The attached images are exam pages: ${pageList}.

Return ONLY a JSON object — no markdown fences, no explanation:
{ "totalMarks": number | null, "questions": [{ "id": string, "text": string, "marks": number, "topic": string, "concepts": string[], "hasSolution": boolean }] }

Rules:
- Output minified JSON on a single line — no indentation, no line breaks, no markdown fences.
- Include ALL questions and sub-questions as separate entries (Q1a, Q1b are separate).
- id format: "{year}_{examTypeLetter}_Q{num}" e.g. "${yearStr}_${typeLetter}_Q3b"
- topic should match a course topic name, not a generic description.
- concepts are specific things the student needs to know to answer the question.
- hasSolution is true if an answer key is visible in the document.
- Extract formulas in LaTeX notation exactly as written.`;
}

function hasRichText(page: DocumentPage): boolean {
  return (page.textContent?.length ?? 0) >= SPARSE_TEXT_THRESHOLD;
}

// Text-first extraction: pages with a usable text layer are processed as text
// (faster and more reliable than OCR-by-vision); vision is only used for pages
// that are mostly images/diagrams with little selectable text.
async function extractSlidesChunk(
  pages: DocumentPage[],
  llm: LLMClient,
  chunkIndex: number,
  totalChunks: number,
): Promise<SlideSection[]> {
  const textPages = pages.filter(
    (page) => hasRichText(page) || !page.imageData,
  );
  const visionPages = pages.filter(
    (page) => page.imageData && !hasRichText(page),
  );

  const sections: SlideSection[] = [];

  const text = textPages
    .map((page) => page.textContent)
    .filter(Boolean)
    .join("\n\n");

  if (text.trim()) {
    const raw = await llm.ask(
      buildSlidesTextPrompt(text, chunkIndex, totalChunks),
    );
    sections.push(...parseSlideSections(raw));
  }

  // Vision failures (e.g. a non-vision model rejecting image input) must not
  // discard the sections already extracted from the chunk's text pass.
  const visionErrors: string[] = [];

  for (let i = 0; i < visionPages.length; i += MAX_VISION_IMAGES_PER_CALL) {
    const batch = visionPages.slice(i, i + MAX_VISION_IMAGES_PER_CALL);
    const images = batch.map((page) => ({
      data: page.imageData!,
      mimeType: page.mimeType,
    }));
    const batchText = batch
      .map((page) => page.textContent)
      .filter(Boolean)
      .join("\n\n");
    const prompt = buildSlidesVisionPrompt(
      batchText,
      chunkIndex,
      totalChunks,
      batch.map((page) => page.pageNumber),
    );
    try {
      const raw = await llm.askWithImages(prompt, images, {
        system: EXTRACTION_SYSTEM,
      });
      sections.push(...parseSlideSections(raw));
    } catch (error) {
      if (isAbortError(error)) throw error;
      const message = error instanceof Error ? error.message : String(error);
      visionErrors.push(message);
      console.error(
        `[extract] Vision batch (pages ${batch[0]!.pageNumber}–${batch[batch.length - 1]!.pageNumber}) failed:`,
        error,
      );
    }
  }

  if (sections.length === 0 && visionErrors.length > 0) {
    throw new Error(visionErrors[0]);
  }

  return sections;
}

export async function extractOutline(
  doc: RawDocument,
  llm: LLMClient,
): Promise<OutlineExtraction> {
  const text = clampChars(documentText(doc), OUTLINE_MAX_CHARS, `outline ${doc.filename}`);
  return llm
    .withConfig({ maxTokens: EXTRACTION_MAX_TOKENS })
    .askJSON<OutlineExtraction>(buildOutlinePrompt(text));
}

export async function extractSlides(
  doc: RawDocument,
  llm: LLMClient,
  onChunkProgress?: (chunk: number, total: number) => void,
  cache?: ExtractionCache,
): Promise<SlidesExtraction> {
  const extractor = llm.withConfig({ maxTokens: EXTRACTION_MAX_TOKENS });
  const chunks = paginateForContext(doc, TEXT_CHUNK_CHAR_BUDGET);
  const results: SlideSection[][] = new Array(chunks.length);
  const failures: string[] = [];
  let done = 0;
  let nextIndex = 0;

  // Announce the chunk count up front so the UI can show activity before the
  // first (potentially slow) chunk completes.
  onChunkProgress?.(0, chunks.length);

  async function worker(): Promise<void> {
    while (nextIndex < chunks.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        const cached = await cache?.loadChunk(doc, index, chunks.length);
        if (cached) {
          console.log(
            `[extract] Chunk ${index + 1}/${chunks.length} of "${doc.filename}" loaded from cache`,
          );
          results[index] = cached;
        } else {
          results[index] = await extractSlidesChunk(
            chunks[index]!,
            extractor,
            index,
            chunks.length,
          );
          await cache?.saveChunk(doc, index, chunks.length, results[index]!);
        }
      } catch (error) {
        if (isAbortError(error)) throw error;
        // A single bad chunk shouldn't sink the whole document.
        results[index] = [];
        const message = error instanceof Error ? error.message : String(error);
        failures.push(message);
        console.error(
          `[extract] Chunk ${index + 1}/${chunks.length} of "${doc.filename}" failed:`,
          error,
        );
      }

      done += 1;
      onChunkProgress?.(done, chunks.length);
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          concurrencyFor(llm, CHUNK_CONCURRENCY),
          Math.max(chunks.length, 1),
        ),
      },
      () => worker(),
    ),
  );

  const allSections = results.flat();

  if (allSections.length === 0 && chunks.length > 0) {
    throw new Error(
      `Could not extract any content from "${doc.filename}"` +
        (failures[0] ? ` — ${failures[0]}` : ""),
    );
  }

  return {
    sourceFile: doc.filename,
    weekOrUnit: inferWeekOrUnit(doc.filename),
    sections: allSections,
  };
}

// Same boundary guard as normalizeSlideSections: drop malformed entries and
// default optional fields so downstream `question.topic.trim()` etc. is safe.
function normalizeExamQuestions(questions: unknown): ExamQuestion[] {
  if (!Array.isArray(questions)) return [];
  const normalized: ExamQuestion[] = [];
  for (const [index, item] of questions.entries()) {
    const value = item as Partial<ExamQuestion> | null;
    if (!value || typeof value !== "object" || typeof value.text !== "string") {
      continue;
    }
    normalized.push({
      id: typeof value.id === "string" ? value.id : `q${index + 1}`,
      text: value.text,
      marks: typeof value.marks === "number" ? value.marks : 0,
      topic: typeof value.topic === "string" ? value.topic : "",
      concepts: stringArray(value.concepts),
      hasSolution: value.hasSolution === true,
    });
  }
  return normalized;
}

export async function extractExam(
  doc: RawDocument,
  llm: LLMClient,
): Promise<ExamExtraction> {
  const year = inferExamYear(doc.filename);
  const examType = inferExamType(doc.filename);
  const imagePages = (doc.pages ?? []).filter((page) => page.imageData);
  // Prefer the text layer when the document has one; fall back to vision for
  // scanned/image-only exams.
  const textIsSparse =
    documentText(doc).length < (doc.pages?.length ?? 1) * SPARSE_TEXT_THRESHOLD;
  const useVision =
    imagePages.length > 0 &&
    imagePages.length <= MAX_EXAM_VISION_PAGES &&
    textIsSparse;

  const extractor = llm.withConfig({ maxTokens: EXTRACTION_MAX_TOKENS });
  let totalMarks: number | undefined;
  let questions: ExamQuestion[];

  if (useVision) {
    const prompt = buildExamVisionPrompt(
      year,
      examType,
      imagePages.map((page) => page.pageNumber),
    );
    const images = imagePages.map((page) => ({
      data: page.imageData!,
      mimeType: page.mimeType,
    }));
    const raw = await extractor.askWithImages(prompt, images, {
      system: EXTRACTION_SYSTEM,
    });
    const parsed = parseJsonResponse<{
      totalMarks: number | null;
      questions: ExamQuestion[];
    }>(raw);
    totalMarks = parsed.totalMarks ?? undefined;
    questions = normalizeExamQuestions(parsed.questions);
  } else {
    const text = clampChars(documentText(doc), EXAM_TEXT_MAX_CHARS, `exam ${doc.filename}`);
    const parsed = await extractor.askJSON<{
      totalMarks: number | null;
      questions: ExamQuestion[];
    }>(buildExamTextPrompt(text, year, examType));
    totalMarks = parsed.totalMarks ?? undefined;
    questions = normalizeExamQuestions(parsed.questions);
  }

  return {
    sourceFile: doc.filename,
    examType,
    year,
    totalMarks,
    questions,
  };
}

export type DocExtraction =
  | { kind: "outline"; outline: OutlineExtraction }
  | { kind: "slides"; slides: SlidesExtraction }
  | { kind: "exam"; exam: ExamExtraction }
  | { kind: "none" };

// Persists completed extraction work so a retry of a dead run (app closed,
// webview reloaded, provider error) skips already-finished documents/chunks
// instead of re-paying for them. Implementations must swallow their own I/O
// errors — a broken cache should never fail an extraction.
export interface ExtractionCache {
  loadDoc(doc: RawDocument): Promise<DocExtraction | null>;
  saveDoc(doc: RawDocument, extraction: DocExtraction): Promise<void>;
  loadChunk(
    doc: RawDocument,
    index: number,
    total: number,
  ): Promise<SlideSection[] | null>;
  saveChunk(
    doc: RawDocument,
    index: number,
    total: number,
    sections: SlideSection[],
  ): Promise<void>;
}

async function extractDocument(
  doc: RawDocument,
  llm: LLMClient,
  onChunkProgress?: (chunk: number, total: number) => void,
  cache?: ExtractionCache,
): Promise<DocExtraction> {
  switch (doc.type) {
    case "course_outline":
      return { kind: "outline", outline: await extractOutline(doc, llm) };
    case "slides":
      return {
        kind: "slides",
        slides: await extractSlides(doc, llm, onChunkProgress, cache),
      };
    case "past_exam":
      return { kind: "exam", exam: await extractExam(doc, llm) };
    // Textbooks and unrecognized files still carry course content — run them
    // through the content extractor so every uploaded source is analyzed.
    case "textbook":
    case "other":
      return {
        kind: "slides",
        slides: await extractSlides(doc, llm, onChunkProgress, cache),
      };
  }
}

export interface ExtractProgressUpdate {
  done: number;
  total: number;
  filename: string;
  type: InputDocumentType;
  status: "extracting" | "extracted";
  chunksDone?: number;
  chunksTotal?: number;
}

export async function extractAll(
  docs: RawDocument[],
  llm: LLMClient,
  onProgress?: (update: ExtractProgressUpdate) => void,
  cache?: ExtractionCache,
): Promise<{
  outline?: OutlineExtraction;
  slides: SlidesExtraction[];
  exams: ExamExtraction[];
  failures: string[];
}> {
  const extractions: (DocExtraction | undefined)[] = new Array(docs.length);
  const failures: string[] = [];
  let done = 0;
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < docs.length) {
      const index = nextIndex;
      nextIndex += 1;
      const doc = docs[index]!;

      try {
        const cached = await cache?.loadDoc(doc);
        if (cached) {
          console.log(`[extract] "${doc.filename}" loaded from cache`);
          extractions[index] = cached;
        } else {
          const extraction = await extractDocument(
            doc,
            llm,
            (chunksDone, chunksTotal) =>
              onProgress?.({
                done,
                total: docs.length,
                filename: doc.filename,
                type: doc.type,
                status: "extracting",
                chunksDone,
                chunksTotal,
              }),
            cache,
          );
          extractions[index] = extraction;
          if (extraction.kind !== "none") {
            await cache?.saveDoc(doc, extraction);
          }
        }
      } catch (error) {
        if (isAbortError(error)) throw error;
        extractions[index] = { kind: "none" };
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${doc.filename}: ${message}`);
        console.error(`[extract] Failed to extract "${doc.filename}":`, error);
      }

      done += 1;
      onProgress?.({
        done,
        total: docs.length,
        filename: doc.filename,
        type: doc.type,
        status: "extracted",
      });
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          concurrencyFor(llm, EXTRACT_CONCURRENCY),
          Math.max(docs.length, 1),
        ),
      },
      () => worker(),
    ),
  );

  const result: {
    outline?: OutlineExtraction;
    slides: SlidesExtraction[];
    exams: ExamExtraction[];
    failures: string[];
  } = {
    slides: [],
    exams: [],
    failures,
  };

  for (const extraction of extractions) {
    if (!extraction) continue;
    switch (extraction.kind) {
      case "outline":
        result.outline = extraction.outline;
        break;
      case "slides":
        result.slides.push(extraction.slides);
        break;
      case "exam":
        result.exams.push(extraction.exam);
        break;
      case "none":
        break;
    }
  }

  return result;
}
