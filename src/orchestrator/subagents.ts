// Subagents spawned by the orchestrator. Each is a single LLM call with a
// clean, self-contained brief: a role (system prompt), a rubric, and the
// relevant source material — and nothing about the rest of the run. The
// orchestrator (orchestrator.ts) coordinates these but never inspects or judges
// study content itself; that responsibility lives entirely here.
//
//   - generateSection: author one section from the rubric + sources.
//   - verifySection:   impartially check a draft against the SOURCES OF TRUTH
//                      (and the rubric) — it did not write the draft.
//   - fixSection:      repair a draft given the verifier's specific failures.

import type { AskOptions, LLMClient } from "../llm/client";
import { sanitizeMarkdown } from "../lib/sanitize";
import type {
  ScopeDocument,
  ScopeSection,
  SectionDepth,
  SlideSection,
} from "../types";

export interface SectionRubric {
  sectionId: string;
  sectionTitle: string;
  requiredConcepts: string[];
  requiredFormulas: string[];
  requiredTerms: string[];
  minimumExamples: number;
  depth: SectionDepth;
}

export type VerdictFailureType =
  | "missing_concept"
  | "missing_formula"
  | "inaccurate"
  | "unsupported_claim"
  | "insufficient_depth"
  | "missing_examples";

export interface VerdictFailure {
  type: VerdictFailureType;
  detail: string;
  requiredItem?: string;
}

export interface Verdict {
  pass: boolean;
  score: number;
  failures: VerdictFailure[];
  suggestions: string[];
}

export const PASS_SCORE_THRESHOLD = 75;

// Hard caps on the source material handed to a subagent, so a huge course can't
// blow past the model's context window. Generous enough to carry a section's
// worth of ground truth.
const MAX_GROUND_TRUTH_CHARS = 6000;

// The formatting contract lives in the system prompt — NOT the user turn — so
// instruct models stop echoing it back into the output ("Formatting Rules:",
// "Markdown only.", …). sanitizeMarkdown() is the defensive net for models that
// echo anyway.
const FORMATTING_RULES = [
  "Output rules for the section body:",
  "- Markdown only. Begin immediately with the content.",
  "- Use $...$ for inline LaTeX and $$...$$ for block LaTeX.",
  "- No top-level # heading. Use ## and ### for subsection headings.",
  "- Never use bold text on its own line as a substitute for a heading.",
  "- Use real Markdown tables (| col | col | then |---|---|), not bullet lists, for tabular data.",
  "- Use *italics* for emphasis and **bold** for key terms.",
  '- Where a diagram would genuinely aid understanding, insert a placeholder alone on its own line: {{figure: "concise description"}} (roughly 0-3 per section, never decorative).',
  "- Do not restate the brief, the rules, the section title, or your reasoning. No preamble, no closing remarks.",
].join("\n");

const GENERATOR_SYSTEM = `You are a subject-matter author writing ONE self-contained section of a university study guide. You write accurate, complete, well-structured explanations grounded strictly in the source material you are given — never invent facts, formulas, or examples that the sources do not support.

${FORMATTING_RULES}`;

const FIXER_SYSTEM = `You are a subject-matter editor repairing ONE section of a university study guide so it passes verification. You fix every reported failure while preserving everything that was already correct, staying grounded strictly in the source material.

${FORMATTING_RULES}`;

const VERIFIER_SYSTEM = `You are an impartial fact-checker. You are given source material (the ground truth), a rubric, and a draft study-guide section that someone else wrote. You have no stake in the draft. Judge ONLY:
- accuracy: is every claim, definition, and formula supported by the source material? Flag anything the sources do not support.
- completeness: does the draft cover every required concept, formula, term, and the minimum example count in the rubric, at the required depth?
Respond with a single JSON object and nothing else — no prose, no markdown fences.`;

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

function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3),
  );
}

// Picks the slide sections most relevant to a scope section by title + concept
// word overlap. These extracted slide sections are the closest thing to the
// original source of truth that we keep in structured form.
function relevantSlideSections(
  section: ScopeSection,
  scope: ScopeDocument,
): SlideSection[] {
  const needle = wordSet(
    [section.title, ...section.requiredConcepts].join(" "),
  );

  const scored: { slide: SlideSection; score: number }[] = [];
  for (const extraction of scope.rawExtractions.slides) {
    for (const slide of extraction.sections) {
      const hay = wordSet([slide.title, ...slide.concepts].join(" "));
      let score = 0;
      for (const word of hay) if (needle.has(word)) score += 1;
      if (score > 0) scored.push({ slide, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => entry.slide);
}

// Compact, bounded source-of-truth packet handed to the generator and verifier.
export function buildGroundTruth(
  section: ScopeSection,
  scope: ScopeDocument,
): string {
  const lines: string[] = [];

  lines.push("REQUIRED CONCEPTS (must all be covered):");
  lines.push(
    section.requiredConcepts.map((c) => `- ${c}`).join("\n") || "- (none)",
  );

  lines.push("\nREQUIRED FORMULAS (LaTeX, must all appear, verbatim where possible):");
  lines.push(
    section.requiredFormulas.map((f) => `- ${f}`).join("\n") || "- (none)",
  );

  lines.push("\nDEFINED TERMS (must all be defined):");
  lines.push(
    section.definedTerms.map((t) => `- ${t.term}: ${t.definition}`).join("\n") ||
      "- (none)",
  );

  const slides = relevantSlideSections(section, scope);
  if (slides.length > 0) {
    lines.push("\nSOURCE MATERIAL FROM LECTURE SLIDES (ground truth):");
    for (const slide of slides) {
      lines.push(`• ${slide.title}`);
      if (slide.concepts.length) lines.push(`  concepts: ${slide.concepts.join("; ")}`);
      if (slide.formulas.length) lines.push(`  formulas: ${slide.formulas.join("; ")}`);
      if (slide.definedTerms.length)
        lines.push(
          `  terms: ${slide.definedTerms.map((t) => `${t.term} = ${t.definition}`).join("; ")}`,
        );
    }
  }

  if (section.examQuestions.length > 0) {
    lines.push("\nPRACTICE QUESTIONS THIS SECTION MUST PREPARE THE STUDENT FOR:");
    for (const q of section.examQuestions.slice(0, 8)) {
      lines.push(`- [${q.marks}mk] ${q.text}`);
    }
  }

  if (section.sourceHints.length > 0) {
    lines.push(`\nSOURCE HINTS: ${section.sourceHints.join("; ")}`);
  }

  const text = lines.join("\n");
  return text.length > MAX_GROUND_TRUTH_CHARS
    ? text.slice(0, MAX_GROUND_TRUTH_CHARS) + "\n…(truncated)"
    : text;
}

export async function generateSection(
  section: ScopeSection,
  groundTruth: string,
  llm: LLMClient,
  opts: AskOptions = {},
): Promise<string> {
  const prompt = `Write the study-guide section titled "${section.title}".

Target depth — ${depthInstructions(section.depth)}.

Use ONLY the following source material. Cover every required concept, include every required formula, and define every required term.

${groundTruth}`;

  const raw = await llm
    .withTask("generate")
    .withConfig({ temperature: 0.3 })
    .ask(prompt, { ...opts, system: GENERATOR_SYSTEM });
  return sanitizeMarkdown(raw);
}

export async function verifySection(
  content: string,
  rubric: SectionRubric,
  groundTruth: string,
  llm: LLMClient,
  opts: AskOptions = {},
): Promise<Verdict> {
  const prompt = `Evaluate the draft section below against the rubric and the source material.

RUBRIC:
${JSON.stringify(rubric, null, 2)}

SOURCE MATERIAL (ground truth — the draft must not contradict or go beyond this):
${groundTruth}

DRAFT SECTION:
${content}

Return ONLY this JSON object:
{
  "pass": boolean,
  "score": number,
  "failures": [{ "type": "missing_concept" | "missing_formula" | "inaccurate" | "unsupported_claim" | "insufficient_depth" | "missing_examples", "detail": string, "requiredItem": string | null }],
  "suggestions": string[]
}

Scoring (0-100): deduct for each required concept/formula/term not properly covered, for any claim unsupported by the source material ("unsupported_claim"), for factual errors ("inaccurate"), for fewer than ${rubric.minimumExamples} worked example(s), and for depth below "${rubric.depth}". Set "pass" to true only if score >= ${PASS_SCORE_THRESHOLD} and there are no "inaccurate" or "unsupported_claim" failures.`;

  return llm
    .withTask("verify")
    .withConfig({ temperature: 0 })
    .askStructured<Verdict>(prompt, normalizeVerdict, {
      ...opts,
      system: VERIFIER_SYSTEM,
    });
}

export async function fixSection(
  content: string,
  verdict: Verdict,
  rubric: SectionRubric,
  groundTruth: string,
  llm: LLMClient,
  opts: AskOptions = {},
): Promise<string> {
  const failuresBlock =
    verdict.failures
      .map((f) => `- [${f.type}] ${f.detail}${f.requiredItem ? ` (required: ${f.requiredItem})` : ""}`)
      .join("\n") || "(none)";

  const suggestionsBlock =
    verdict.suggestions.map((s) => `- ${s}`).join("\n") || "(none)";

  const prompt = `Repair the study-guide section titled "${rubric.sectionTitle}".

Fix every failure below, keep everything that was already correct, and stay grounded in the source material. Return the COMPLETE corrected section (not a diff).

FAILURES TO FIX:
${failuresBlock}

SUGGESTIONS:
${suggestionsBlock}

Target depth — ${depthInstructions(rubric.depth)}.

SOURCE MATERIAL (ground truth):
${groundTruth}

CURRENT DRAFT:
${content}`;

  const raw = await llm
    .withTask("fix")
    .withConfig({ temperature: 0 })
    .ask(prompt, { ...opts, system: FIXER_SYSTEM });
  return sanitizeMarkdown(raw);
}

// Validates/normalizes a raw verifier response into a Verdict, or returns null
// (rejected) so askStructured retries. The pass flag is anchored to the score
// threshold so a model can't "pass" a low score.
export function normalizeVerdict(raw: unknown): Verdict | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<Verdict>;
  if (typeof value.score !== "number" && typeof value.pass !== "boolean") {
    return null;
  }

  const score = Math.max(0, Math.min(100, Number(value.score) || 0));
  const failures: VerdictFailure[] = Array.isArray(value.failures)
    ? value.failures
        .filter(
          (f): f is VerdictFailure =>
            !!f && typeof f === "object" && typeof (f as VerdictFailure).detail === "string",
        )
        .map((f) => ({
          type: (f.type as VerdictFailureType) ?? "inaccurate",
          detail: f.detail,
          ...(f.requiredItem ? { requiredItem: f.requiredItem } : {}),
        }))
    : [];

  const hasBlocker = failures.some(
    (f) => f.type === "inaccurate" || f.type === "unsupported_claim",
  );

  return {
    pass: Boolean(value.pass) && score >= PASS_SCORE_THRESHOLD && !hasBlocker,
    score,
    failures,
    suggestions: Array.isArray(value.suggestions)
      ? value.suggestions.filter((s): s is string => typeof s === "string")
      : [],
  };
}
