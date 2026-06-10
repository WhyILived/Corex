import { paginateForContext } from "../ingest/ingest";
import { LLMError, type LLMClient } from "../llm/client";
import type {
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
// Output budget for extraction calls. Dense inputs (textbooks) produce large
// JSON; a low cap truncates mid-array and the parse fails.
const EXTRACTION_MAX_TOKENS = 8192;
// Chunk size for text extraction. Kept moderate so the JSON the model returns
// for one chunk stays comfortably inside EXTRACTION_MAX_TOKENS.
const TEXT_CHUNK_CHAR_BUDGET = 24000;

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return fenced ? fenced[1]!.trim() : trimmed;
}

function parseJsonResponse<T>(raw: string): T {
  return JSON.parse(stripMarkdownFences(raw)) as T;
}

// Recovers complete top-level objects from a truncated JSON array (e.g. when
// the model hit its output token limit mid-array). Returns null if nothing
// usable could be recovered.
function salvageTruncatedArray<T>(raw: string): T[] | null {
  const start = raw.indexOf("[");
  if (start === -1) return null;

  const items: T[] = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;

  for (let i = start + 1; i < raw.length; i++) {
    const char = raw[i]!;

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      if (depth === 0) objectStart = i;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart !== -1) {
        try {
          items.push(JSON.parse(raw.slice(objectStart, i + 1)) as T);
        } catch {
          // Skip malformed entries; keep whatever else parses.
        }
        objectStart = -1;
      }
    }
  }

  return items.length > 0 ? items : null;
}

function parseSlideSections(raw: string): SlideSection[] {
  const stripped = stripMarkdownFences(raw);

  try {
    return JSON.parse(stripped) as SlideSection[];
  } catch {
    const salvaged = salvageTruncatedArray<SlideSection>(stripped);
    if (salvaged) {
      console.warn(
        `[extract] Response JSON was truncated; salvaged ${salvaged.length} section(s)`,
      );
      return salvaged;
    }
    throw new LLMError(
      `Invalid JSON in extraction response: ${raw.slice(0, 300)}`,
      0,
    );
  }
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
- One section per major topic (usually 1-3 sections per lecture chunk).
- Concepts are specific and precise, not vague.
- Formulas in LaTeX notation exactly as written in the slides.
- Defined terms are only words given explicit definitions in the slides.
- Figure descriptions should be detailed enough to recreate or search for the figure.

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
- One section per major topic (usually 1-3 sections per lecture chunk).
- Concepts are specific and precise, not vague.
- Formulas in LaTeX notation exactly as written in the slides.
- Defined terms are only words given explicit definitions in the slides.
- Figure descriptions should be detailed enough to recreate or search for the figure.`;
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
    const raw = await llm.askWithImages(prompt, images);
    sections.push(...parseSlideSections(raw));
  }

  return sections;
}

export async function extractOutline(
  doc: RawDocument,
  llm: LLMClient,
): Promise<OutlineExtraction> {
  const text = documentText(doc);
  return llm
    .withConfig({ maxTokens: EXTRACTION_MAX_TOKENS })
    .askJSON<OutlineExtraction>(buildOutlinePrompt(text));
}

export async function extractSlides(
  doc: RawDocument,
  llm: LLMClient,
  onChunkProgress?: (chunk: number, total: number) => void,
): Promise<SlidesExtraction> {
  const extractor = llm.withConfig({ maxTokens: EXTRACTION_MAX_TOKENS });
  const chunks = paginateForContext(doc, TEXT_CHUNK_CHAR_BUDGET);
  const results: SlideSection[][] = new Array(chunks.length);
  const failures: string[] = [];
  let done = 0;
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < chunks.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        results[index] = await extractSlidesChunk(
          chunks[index]!,
          extractor,
          index,
          chunks.length,
        );
      } catch (error) {
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
      { length: Math.min(CHUNK_CONCURRENCY, Math.max(chunks.length, 1)) },
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
    const raw = await extractor.askWithImages(prompt, images);
    const parsed = parseJsonResponse<{
      totalMarks: number | null;
      questions: ExamQuestion[];
    }>(raw);
    totalMarks = parsed.totalMarks ?? undefined;
    questions = parsed.questions;
  } else {
    const text = documentText(doc);
    const parsed = await extractor.askJSON<{
      totalMarks: number | null;
      questions: ExamQuestion[];
    }>(buildExamTextPrompt(text, year, examType));
    totalMarks = parsed.totalMarks ?? undefined;
    questions = parsed.questions;
  }

  return {
    sourceFile: doc.filename,
    examType,
    year,
    totalMarks,
    questions,
  };
}

type DocExtraction =
  | { kind: "outline"; outline: OutlineExtraction }
  | { kind: "slides"; slides: SlidesExtraction }
  | { kind: "exam"; exam: ExamExtraction }
  | { kind: "none" };

async function extractDocument(
  doc: RawDocument,
  llm: LLMClient,
): Promise<DocExtraction> {
  switch (doc.type) {
    case "course_outline":
      return { kind: "outline", outline: await extractOutline(doc, llm) };
    case "slides":
      return { kind: "slides", slides: await extractSlides(doc, llm) };
    case "past_exam":
      return { kind: "exam", exam: await extractExam(doc, llm) };
    // Textbooks and unrecognized files still carry course content — run them
    // through the content extractor so every uploaded source is analyzed.
    case "textbook":
    case "other":
      return { kind: "slides", slides: await extractSlides(doc, llm) };
  }
}

export async function extractAll(
  docs: RawDocument[],
  llm: LLMClient,
  onProgress?: (
    done: number,
    total: number,
    filename: string,
    type: InputDocumentType,
  ) => void,
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
        extractions[index] = await extractDocument(doc, llm);
      } catch (error) {
        extractions[index] = { kind: "none" };
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${doc.filename}: ${message}`);
        console.error(`[extract] Failed to extract "${doc.filename}":`, error);
      }

      done += 1;
      onProgress?.(done, docs.length, doc.filename, doc.type);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(EXTRACT_CONCURRENCY, Math.max(docs.length, 1)) },
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
