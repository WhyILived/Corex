import type {
  DocumentPage,
  InputDocumentType,
  RawDocument,
} from "../types";

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  txt: "text/plain",
  md: "text/markdown",
};

const SLIDE_SEPARATOR = "\n\n---\n\n";
const IMAGE_CHAR_ESTIMATE = 2000;
const DEFAULT_CHAR_BUDGET = 60000;

const DOCUMENT_TYPE_PATTERNS: {
  type: InputDocumentType;
  pattern: RegExp;
}[] = [
  { type: "course_outline", pattern: /outline|syllabus|course.?info/i },
  { type: "slides", pattern: /slide|lecture|lec|week|module/i },
  { type: "past_exam", pattern: /exam|midterm|final|quiz|test|mt\d|f\d{4}/i },
  { type: "textbook", pattern: /textbook|book|chapter|ch\d/i },
];

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

function detectMimeType(filename: string): string {
  return MIME_MAP[getExtension(filename)] ?? "application/octet-stream";
}

function inferDocumentType(filename: string): InputDocumentType {
  for (const { type, pattern } of DOCUMENT_TYPE_PATTERNS) {
    if (pattern.test(filename)) {
      return type;
    }
  }
  return "other";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(
      String.fromCharCode.apply(null, chunk as unknown as number[]),
    );
  }

  return btoa(chunks.join(""));
}

function pageCharEstimate(page: DocumentPage): number {
  const textChars = page.textContent?.length ?? 0;
  const imageChars = page.imageData ? IMAGE_CHAR_ESTIMATE : 0;
  return textChars + imageChars;
}

async function parsePdf(
  file: File,
): Promise<Pick<RawDocument, "textContent" | "pages">> {
  // pdfjs-dist and its worker are both loaded lazily here so they only ship when
  // a PDF is actually parsed. configurePdfWorker sets GlobalWorkerOptions.workerSrc
  // (idempotent) using the bundled worker asset URL.
  const pdfjs = await import("pdfjs-dist");
  const { configurePdfWorker } = await import("../lib/pdf");
  configurePdfWorker(pdfjs);
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: DocumentPage[] = [];
  const textParts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to acquire 2D canvas context for PDF rendering");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // JPEG has no alpha channel; fill white so transparent regions don't
    // render black. JPEG keeps the base64 payload several times smaller than
    // PNG, which makes vision calls much faster.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const imageData = dataUrl.split(",")[1];

    pages.push({
      pageNumber,
      textContent: pageText || undefined,
      imageData,
      mimeType: "image/jpeg",
    });

    if (pageText) {
      textParts.push(pageText);
    }
  }

  return {
    textContent: textParts.join("\n\n"),
    pages,
  };
}

async function parsePptx(
  file: File,
): Promise<Pick<RawDocument, "textContent" | "pages">> {
  const JSZip = (await import("jszip")).default;
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort((a, b) => {
      const numA = Number(a.match(/slide(\d+)\.xml/i)?.[1] ?? 0);
      const numB = Number(b.match(/slide(\d+)\.xml/i)?.[1] ?? 0);
      return numA - numB;
    });

  const slideTexts: string[] = [];
  const pages: DocumentPage[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i]!;
    const xml = await zip.file(slidePath)!.async("string");
    const textNodes = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g)];
    const slideText = textNodes
      .map((match) => match[1] ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    slideTexts.push(slideText);
    pages.push({
      pageNumber: i + 1,
      textContent: slideText || undefined,
      mimeType: "text/plain",
    });
  }

  return {
    textContent: slideTexts.join(SLIDE_SEPARATOR),
    pages,
  };
}

async function parseImage(
  file: File,
  mimeType: string,
): Promise<Pick<RawDocument, "textContent" | "pages">> {
  const buffer = await file.arrayBuffer();
  const imageData = arrayBufferToBase64(buffer);

  return {
    pages: [
      {
        pageNumber: 1,
        imageData,
        mimeType,
      },
    ],
  };
}

async function parseText(
  file: File,
  mimeType: string,
): Promise<Pick<RawDocument, "textContent" | "pages">> {
  const textContent = await file.text();

  return {
    textContent,
    pages: [
      {
        pageNumber: 1,
        textContent,
        mimeType,
      },
    ],
  };
}

async function parseUnknown(
  file: File,
  mimeType: string,
): Promise<Pick<RawDocument, "textContent" | "pages">> {
  const buffer = await file.arrayBuffer();
  const imageData = arrayBufferToBase64(buffer);

  return {
    pages: [
      {
        pageNumber: 1,
        imageData,
        mimeType,
      },
    ],
  };
}

async function parseByExtension(
  file: File,
  mimeType: string,
): Promise<Pick<RawDocument, "textContent" | "pages">> {
  const ext = getExtension(file.name);

  switch (ext) {
    case "pdf":
      return parsePdf(file);
    case "pptx":
      return parsePptx(file);
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
      return parseImage(file, mimeType);
    case "txt":
    case "md":
      return parseText(file, mimeType);
    default:
      return parseUnknown(file, mimeType);
  }
}

export async function ingestFile(
  file: File,
  typeOverride?: InputDocumentType,
): Promise<RawDocument> {
  const mimeType = detectMimeType(file.name);
  const type = typeOverride ?? inferDocumentType(file.name);
  const parsed = await parseByExtension(file, mimeType);

  return {
    id: crypto.randomUUID(),
    filename: file.name,
    type,
    mimeType,
    ...parsed,
  };
}

export async function ingestFiles(
  files: File[],
  onProgress?: (done: number, total: number, filename: string) => void,
): Promise<RawDocument[]> {
  const documents: RawDocument[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    documents.push(await ingestFile(file));
    onProgress?.(i + 1, files.length, file.name);
  }

  return documents;
}

export function paginateForContext(
  doc: RawDocument,
  charBudget = DEFAULT_CHAR_BUDGET,
): DocumentPage[][] {
  const pages = doc.pages ?? [];
  if (pages.length === 0) {
    return [];
  }

  const batches: DocumentPage[][] = [];
  let currentBatch: DocumentPage[] = [];
  let currentChars = 0;

  for (const page of pages) {
    const pageChars = pageCharEstimate(page);

    if (currentBatch.length > 0 && currentChars + pageChars > charBudget) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(page);
    currentChars += pageChars;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}
