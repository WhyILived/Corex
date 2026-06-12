// Shared type definitions for the study guide generator pipeline.
// Ingest → Extract → Synthesize → SCOPE.md → Orchestrator → Subagents → Assembler → Viewer

export type { LLMConfig } from "../llm/client";

export type LLMProvider =
  | "anthropic"
  | "openai"
  | "gemini"
  | "ollama"
  | "openrouter";

// --- Ingestion ---

export type InputDocumentType =
  | "course_outline"
  | "slides"
  | "past_exam"
  | "textbook"
  | "other";

export interface RawDocument {
  id: string;
  filename: string;
  type: InputDocumentType;
  mimeType: string;
  textContent?: string;
  pages?: DocumentPage[];
}

export interface DocumentPage {
  pageNumber: number;
  textContent?: string;
  imageData?: string;
  mimeType: string;
}

// --- Sources (original files copied into the session for preview) ---

export interface SourceManifestEntry {
  id: string;                 // matches RawDocument.id
  filename: string;
  type: InputDocumentType;
  mimeType: string;
  path: string;               // absolute path to the copied original under sessions/{id}/sources/
}

export type SourceManifest = SourceManifestEntry[];

// --- Extraction: course outline ---

export interface OutlineExtraction {
  courseName: string;
  courseCode: string;
  term?: string;
  instructor?: string;
  topics: OutlineTopic[];
  assessments: Assessment[];
}

export interface OutlineTopic {
  title: string;
  weekOrUnit?: string;
  subtopics: string[];
  lectureHours?: number;
}

export interface Assessment {
  name: string;
  weight: number;
  date?: string;
  topicsCovered?: string[];
}

// --- Extraction: slides ---

export interface SlidesExtraction {
  sourceFile: string;
  weekOrUnit?: string;
  sections: SlideSection[];
}

export interface SlideSection {
  title: string;
  concepts: string[];
  formulas: string[];
  definedTerms: DefinedTerm[];
  figureDescriptions: string[];
}

export interface DefinedTerm {
  term: string;
  definition: string;
}

// --- Extraction: exams ---

export interface ExamExtraction {
  sourceFile: string;
  examType: "midterm" | "final" | "quiz" | "unknown";
  year?: number;
  totalMarks?: number;
  questions: ExamQuestion[];
}

export interface ExamQuestion {
  id: string;
  text: string;
  marks: number;
  topic: string;
  concepts: string[];
  hasSolution: boolean;
}

// --- SCOPE ---

export type SectionDepth = "overview" | "standard" | "deep";

export interface ScopeDocument {
  meta: ScopeMeta;
  sections: ScopeSection[];
  globalVocabulary: DefinedTerm[];
  rawExtractions: {
    outline?: OutlineExtraction;
    slides: SlidesExtraction[];
    exams: ExamExtraction[];
  };
}

export interface ScopeMeta {
  courseCode: string;
  courseName: string;
  term?: string;
  generatedAt: string;
  inputFiles: string[];
  totalExamQuestions: number;
  estimatedStudyHours: number;
}

export interface ScopeSection {
  id: string;
  title: string;
  weightPercent: number;
  depth: SectionDepth;
  weekOrUnit?: string;
  requiredConcepts: string[];
  requiredFormulas: string[];
  definedTerms: DefinedTerm[];
  examQuestions: ExamQuestion[];
  sourceHints: string[];
  dependencies: string[];
}

// --- Pipeline state ---

export type StageStatus = "pending" | "running" | "done" | "failed";

export interface PipelineState {
  sessionId: string;
  startedAt: string;
  stages: {
    ingest: StageStatus;
    extract: StageStatus;
    synthesize: StageStatus;
    write: StageStatus;
  };
  errors: PipelineError[];
}

export interface PipelineError {
  stage: string;
  message: string;
  file?: string;
  retryable: boolean;
}
