import { paginateForContext } from "../ingest/ingest";
import type { LLMClient } from "../llm/client";
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

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return fenced ? fenced[1]!.trim() : trimmed;
}

function parseJsonResponse<T>(raw: string): T {
  return JSON.parse(stripMarkdownFences(raw)) as T;
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

async function extractSlidesChunk(
  pages: DocumentPage[],
  llm: LLMClient,
  chunkIndex: number,
  totalChunks: number,
): Promise<SlideSection[]> {
  const hasImages = pages.some((page) => page.imageData);

  if (hasImages) {
    const textContext = pages
      .map((page) => page.textContent)
      .filter(Boolean)
      .join("\n\n");

    const imagePages = pages.filter((page) => page.imageData);
    const sections: SlideSection[] = [];

    for (let i = 0; i < imagePages.length; i += MAX_VISION_IMAGES_PER_CALL) {
      const batch = imagePages.slice(i, i + MAX_VISION_IMAGES_PER_CALL);
      const images = batch.map((page) => ({
        data: page.imageData!,
        mimeType: page.mimeType,
      }));
      const prompt = buildSlidesVisionPrompt(
        textContext,
        chunkIndex,
        totalChunks,
        batch.map((page) => page.pageNumber),
      );
      const raw = await llm.askWithImages(prompt, images);
      sections.push(...parseJsonResponse<SlideSection[]>(raw));
    }

    return sections;
  }

  const text = pages
    .map((page) => page.textContent)
    .filter(Boolean)
    .join("\n\n");

  return llm.askJSON<SlideSection[]>(
    buildSlidesTextPrompt(text, chunkIndex, totalChunks),
  );
}

export async function extractOutline(
  doc: RawDocument,
  llm: LLMClient,
): Promise<OutlineExtraction> {
  const text = documentText(doc);
  return llm.askJSON<OutlineExtraction>(buildOutlinePrompt(text));
}

export async function extractSlides(
  doc: RawDocument,
  llm: LLMClient,
  onChunkProgress?: (chunk: number, total: number) => void,
): Promise<SlidesExtraction> {
  const chunks = paginateForContext(doc);
  const allSections: SlideSection[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkSections = await extractSlidesChunk(
      chunks[i]!,
      llm,
      i,
      chunks.length,
    );
    allSections.push(...chunkSections);
    onChunkProgress?.(i + 1, chunks.length);
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
  const useVision =
    imagePages.length > 0 && imagePages.length <= MAX_EXAM_VISION_PAGES;

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
    const raw = await llm.askWithImages(prompt, images);
    const parsed = parseJsonResponse<{
      totalMarks: number | null;
      questions: ExamQuestion[];
    }>(raw);
    totalMarks = parsed.totalMarks ?? undefined;
    questions = parsed.questions;
  } else {
    const text = documentText(doc);
    const parsed = await llm.askJSON<{
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
}> {
  const result: {
    outline?: OutlineExtraction;
    slides: SlidesExtraction[];
    exams: ExamExtraction[];
  } = {
    slides: [],
    exams: [],
  };

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]!;

    try {
      switch (doc.type) {
        case "course_outline":
          result.outline = await extractOutline(doc, llm);
          break;
        case "slides":
          result.slides.push(await extractSlides(doc, llm));
          break;
        case "past_exam":
          result.exams.push(await extractExam(doc, llm));
          break;
        case "other":
        case "textbook":
          console.warn(
            `[extract] Skipping "${doc.filename}" — type "${doc.type}" has no extractor`,
          );
          break;
      }
    } catch (error) {
      console.error(
        `[extract] Failed to extract "${doc.filename}":`,
        error,
      );
    }

    onProgress?.(i + 1, docs.length, doc.filename, doc.type);
  }

  return result;
}
