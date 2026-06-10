import type { LLMClient } from "../llm/client";
import type {
  DefinedTerm,
  ExamExtraction,
  ExamQuestion,
  OutlineExtraction,
  ScopeDocument,
  ScopeMeta,
  ScopeSection,
  SectionDepth,
  SlidesExtraction,
} from "../types";

const DEPTH_HOURS: Record<SectionDepth, number> = {
  deep: 4,
  standard: 2,
  overview: 0.5,
};

function computeTopicWeights(exams: ExamExtraction[]): Map<string, number> {
  const marksByTopic = new Map<string, number>();
  let totalMarks = 0;

  for (const exam of exams) {
    for (const question of exam.questions) {
      totalMarks += question.marks;
      const topic = question.topic.trim();
      marksByTopic.set(topic, (marksByTopic.get(topic) ?? 0) + question.marks);
    }
  }

  if (totalMarks === 0) {
    return new Map();
  }

  const weights = new Map<string, number>();
  for (const [topic, marks] of marksByTopic) {
    weights.set(topic, (marks / totalMarks) * 100);
  }

  return weights;
}

function buildCanonicalTopics(
  outline: OutlineExtraction | undefined,
  slides: SlidesExtraction[],
): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];

  function add(title: string) {
    const trimmed = title.trim();
    const key = trimmed.toLowerCase();
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    topics.push(trimmed);
  }

  for (const topic of outline?.topics ?? []) {
    add(topic.title);
  }

  if (topics.length < 3) {
    for (const slide of slides) {
      for (const section of slide.sections) {
        add(section.title);
      }
    }
  }

  return topics;
}

function buildSlidesDigest(slides: SlidesExtraction[]): string {
  const lines: string[] = [];

  for (const slide of slides) {
    const header = slide.weekOrUnit
      ? `FILE: ${slide.sourceFile} (${slide.weekOrUnit})`
      : `FILE: ${slide.sourceFile}`;
    lines.push(header);

    for (const section of slide.sections) {
      lines.push(`  Section: ${section.title}`);
      lines.push(`  Concepts: ${section.concepts.join(", ")}`);
      lines.push(`  Formulas: ${section.formulas.join(", ")}`);
      lines.push(
        `  Defined terms: ${section.definedTerms.map((t) => t.term).join(", ")}`,
      );
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function buildExamsDigest(exams: ExamExtraction[]): string {
  const lines: string[] = [];

  for (const exam of exams) {
    const year = exam.year ?? "unknown";
    const marks = exam.totalMarks ?? "unknown";
    lines.push(
      `FILE: ${exam.sourceFile} (${year} ${exam.examType}, ${marks} marks)`,
    );

    for (const question of exam.questions) {
      lines.push(
        `  Q[${question.id}] ${question.marks}mk | topic: ${question.topic} | concepts: ${question.concepts.join(", ")}`,
      );
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function buildWeightsDigest(weights: Map<string, number>): string {
  if (weights.size === 0) {
    return "No exam weight data available.";
  }

  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([topic, weight]) => `${topic}: ${weight.toFixed(1)}%`)
    .join("\n");
}

function buildSynthesisPrompt(
  canonicalTopics: string[],
  slidesDigest: string,
  examsDigest: string,
  weightsDigest: string,
  userPrompt: string | undefined,
): string {
  const numberedTopics = canonicalTopics
    .map((topic, index) => `${index + 1}. ${topic}`)
    .join("\n");

  const userFocus = userPrompt
    ? `\nUSER FOCUS:\n${userPrompt}\n`
    : "";

  return `You are synthesizing a unified course scope document from extracted outline, slide, and exam data.

Return ONLY a JSON array of ScopeSection objects — no markdown fences, no explanation:
[{
  "id": string,
  "title": string,
  "weightPercent": number,
  "depth": "overview" | "standard" | "deep",
  "weekOrUnit": string | null,
  "requiredConcepts": string[],
  "requiredFormulas": string[],
  "definedTerms": [{ "term": string, "definition": string }],
  "examQuestions": [{ "id": string, "text": string, "marks": number, "topic": string, "concepts": string[], "hasSolution": boolean }],
  "sourceHints": string[],
  "dependencies": string[]
}]

Canonical topics:
${numberedTopics}

Slides:
${slidesDigest || "(none)"}

Exams:
${examsDigest || "(none)"}

Topic weights from exam marks:
${weightsDigest}
${userFocus}
Rules:
- ALL exam questions must be assigned to exactly one section.
- Combine outline topics with similar slide sections into one section where appropriate.
- requiredConcepts should be exhaustive for each section.
- depth rules:
  - "deep" if weightPercent >= 15% OR the section contains 3+ exam questions
  - "standard" if weightPercent 5-14% OR the section contains 1-2 exam questions
  - "overview" if weightPercent < 5% AND the section has no exam questions
- dependencies: list section ids this section requires knowledge of (must reference other section ids in your output).
- If no exam weight data exists, distribute weights based on slide coverage proportion.
- id format: snake_case e.g. "fourier_transforms"`;
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(
    a
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 0),
  );
  const wordsB = new Set(
    b
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 0),
  );

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      overlap++;
    }
  }

  return overlap;
}

function assignOrphanQuestions(
  sections: ScopeSection[],
  exams: ExamExtraction[],
): void {
  if (sections.length === 0) {
    return;
  }

  const assignedIds = new Set<string>();
  for (const section of sections) {
    for (const question of section.examQuestions) {
      assignedIds.add(question.id);
    }
  }

  const orphans: ExamQuestion[] = [];
  for (const exam of exams) {
    for (const question of exam.questions) {
      if (!assignedIds.has(question.id)) {
        orphans.push(question);
      }
    }
  }

  for (const question of orphans) {
    let bestIndex = 0;
    let bestScore = wordOverlap(question.topic, sections[0]!.title);

    for (let i = 1; i < sections.length; i++) {
      const score = wordOverlap(question.topic, sections[i]!.title);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    sections[bestIndex]!.examQuestions.push(question);
  }
}

function normalizeWeights(sections: ScopeSection[]): void {
  const total = sections.reduce((sum, section) => sum + section.weightPercent, 0);

  if (total === 0 || Math.abs(total - 100) <= 5) {
    return;
  }

  for (const section of sections) {
    section.weightPercent = Math.round((section.weightPercent / total) * 100);
  }

  const newTotal = sections.reduce(
    (sum, section) => sum + section.weightPercent,
    0,
  );

  if (newTotal !== 100 && sections.length > 0) {
    const largest = sections.reduce((max, section) =>
      section.weightPercent > max.weightPercent ? section : max,
    );
    largest.weightPercent += 100 - newTotal;
  }
}

function extractGlobalVocabulary(
  sections: ScopeSection[],
  slides: SlidesExtraction[],
): DefinedTerm[] {
  const entries = new Map<
    string,
    { term: string; definition: string; count: number }
  >();

  function record(term: DefinedTerm) {
    const key = term.term.toLowerCase().trim();
    if (!key) {
      return;
    }

    const existing = entries.get(key);
    if (existing) {
      existing.count++;
    } else {
      entries.set(key, {
        term: term.term,
        definition: term.definition,
        count: 1,
      });
    }
  }

  for (const section of sections) {
    for (const term of section.definedTerms) {
      record(term);
    }
  }

  for (const slide of slides) {
    for (const slideSection of slide.sections) {
      for (const term of slideSection.definedTerms) {
        record(term);
      }
    }
  }

  return [...entries.values()]
    .filter((entry) => entry.count >= 2)
    .sort((a, b) =>
      a.term.localeCompare(b.term, undefined, { sensitivity: "base" }),
    )
    .map(({ term, definition }) => ({ term, definition }));
}

// Pulls a course code like "ECE108" out of a filename such as
// "ece108-textbook-s2026.pdf" when no course outline was provided.
function inferCourseCodeFromFilenames(filenames: string[]): string | undefined {
  for (const filename of filenames) {
    const match = filename.match(/\b([a-z]{2,5})[\s_-]?(\d{3}[a-z]?)\b/i);
    if (match) {
      return `${match[1]!.toUpperCase()}${match[2]!.toUpperCase()}`;
    }
  }
  return undefined;
}

function buildMeta(
  outline: OutlineExtraction | undefined,
  slides: SlidesExtraction[],
  exams: ExamExtraction[],
  sections: ScopeSection[],
): ScopeMeta {
  // TODO: OutlineExtraction has no sourceFile -- add it later if inputFiles needs to include the outline filename
  const inputFiles = [
    ...new Set([
      ...slides.map((slide) => slide.sourceFile),
      ...exams.map((exam) => exam.sourceFile),
    ]),
  ];

  const totalExamQuestions = sections.reduce(
    (sum, section) => sum + section.examQuestions.length,
    0,
  );

  const estimatedStudyHours = sections.reduce(
    (sum, section) => sum + DEPTH_HOURS[section.depth],
    0,
  );

  const inferredCode = inferCourseCodeFromFilenames(inputFiles);

  return {
    courseCode: outline?.courseCode ?? inferredCode ?? "UNKNOWN",
    courseName: outline?.courseName ?? inferredCode ?? "Untitled Notebook",
    term: outline?.term,
    generatedAt: new Date().toISOString(),
    inputFiles,
    totalExamQuestions,
    estimatedStudyHours,
  };
}

function normalizeScopeSections(sections: ScopeSection[]): ScopeSection[] {
  return sections.map((section) => ({
    ...section,
    weekOrUnit: section.weekOrUnit ?? undefined,
    requiredConcepts: section.requiredConcepts ?? [],
    requiredFormulas: section.requiredFormulas ?? [],
    definedTerms: section.definedTerms ?? [],
    examQuestions: section.examQuestions ?? [],
    sourceHints: section.sourceHints ?? [],
    dependencies: section.dependencies ?? [],
  }));
}

export async function synthesizeScope(
  outline: OutlineExtraction | undefined,
  slides: SlidesExtraction[],
  exams: ExamExtraction[],
  userPrompt: string | undefined,
  llm: LLMClient,
): Promise<ScopeDocument> {
  const weights = computeTopicWeights(exams);
  const canonicalTopics = buildCanonicalTopics(outline, slides);

  const prompt = buildSynthesisPrompt(
    canonicalTopics,
    buildSlidesDigest(slides),
    buildExamsDigest(exams),
    buildWeightsDigest(weights),
    userPrompt,
  );

  let sections = normalizeScopeSections(
    await llm.askJSON<ScopeSection[]>(prompt),
  );

  assignOrphanQuestions(sections, exams);
  normalizeWeights(sections);

  const globalVocabulary = extractGlobalVocabulary(sections, slides);
  const meta = buildMeta(outline, slides, exams, sections);

  return {
    meta,
    sections,
    globalVocabulary,
    rawExtractions: { outline, slides, exams },
  };
}

export function serializeScopeToMarkdown(scope: ScopeDocument): string {
  const { meta, globalVocabulary, sections } = scope;
  const lines: string[] = [];

  lines.push("# SCOPE");
  lines.push(`generated: ${meta.generatedAt}`);
  lines.push(`course: ${meta.courseCode} — ${meta.courseName}`);
  lines.push(`term: ${meta.term ?? "unknown"}`);
  lines.push(`inputs: ${meta.inputFiles.join(", ")}`);
  lines.push(`estimated study hours: ${meta.estimatedStudyHours}`);
  lines.push(`total practice questions: ${meta.totalExamQuestions}`);
  lines.push("");
  lines.push("## Global Vocabulary");

  for (const term of globalVocabulary) {
    lines.push(`${term.term}: ${term.definition}`);
  }

  lines.push("");
  lines.push("## Sections");
  lines.push("");

  sections.forEach((section, index) => {
    lines.push(`### ${index + 1}. ${section.title}`);
    lines.push(`weight: ${section.weightPercent}%`);
    lines.push(`depth: ${section.depth}`);
    lines.push(`week: ${section.weekOrUnit ?? "—"}`);
    lines.push(
      `dependencies: ${section.dependencies.length > 0 ? section.dependencies.join(", ") : "none"}`,
    );
    lines.push("");
    lines.push("**Concepts**");

    for (const concept of section.requiredConcepts) {
      lines.push(`- ${concept}`);
    }

    lines.push("");
    lines.push("**Formulas**");

    for (const formula of section.requiredFormulas) {
      lines.push(`- ${formula}`);
    }

    lines.push("");
    lines.push("**Defined Terms**");

    for (const term of section.definedTerms) {
      lines.push(`${term.term}: ${term.definition}`);
    }

    lines.push("");
    lines.push("**Practice Questions**");

    for (const question of section.examQuestions) {
      lines.push(
        `[${question.id}] (${question.marks} marks) ${question.text}`,
      );
    }

    lines.push("");
    lines.push("**Source Hints**");

    for (const hint of section.sourceHints) {
      lines.push(`- ${hint}`);
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n").trimEnd() + "\n";
}
