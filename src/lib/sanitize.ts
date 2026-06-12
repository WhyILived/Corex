// Normalizes the Markdown a model returns for a study-guide section before it
// is stored or rendered. Two classes of pollution are removed:
//
//   1. Prompt echo — instruct models (qwen, gemma, etc.) parrot the brief back
//      before the real answer: "Section: ...", "Weight: 50%", a "Formatting
//      Rules:" block, "No top-level # heading.", "Return only ...", etc.
//   2. Conversational preamble/wrapper — "Sure! Here is the section:", a
//      wrapping ```markdown fence around the whole reply.
//
// The model is also instructed (via the system prompt) not to do any of this;
// this function is the defensive net for models that ignore that. It is
// idempotent and safe to apply at both write and read time. Content inside
// fenced code blocks and $$ math blocks is never touched.

// Anchored, whole-line signatures of echoed instruction text. A line is dropped
// only if (after stripping an optional list marker / bold) it matches one of
// these in full — a real study-guide sentence won't be exactly "Markdown only."
const RULE_SIGNATURES: RegExp[] = [
  /^formatting(?:\s+rules)?\s*:?$/i,
  /^output\s+(?:rules|format|formatting)\s*:?.*$/i,
  /^(?:strict\s+)?rules?\s*:?$/i,
  /^instructions?\s*:?$/i,
  /^markdown only\.?$/i,
  /^use \$+ for .*latex.*$/i,
  /^\$+ for inline.*$/i,
  /^no top-?level #?\s*heading.*$/i,
  /^use #{2,3}.*head(?:ing|er)s?.*$/i,
  /^(?:never )?(?:do not |don'?t )?use bold text.*head.*$/i,
  /^no bold text on its own line.*$/i,
  /^(?:use )?real markdown tables.*$/i,
  /^(?:use )?italics? for emphasis.*$/i,
  /^figure placeholders?\b.*$/i,
  /^(?:do not include )?(?:no )?content outside (?:this )?(?:section'?s? )?scope.*$/i,
  /^no preamble.*$/i,
  /^(?:return|output|begin|reply)\b.*(?:only|immediately|markdown|section|no preamble).*$/i,
  /^do not (?:include|restate|summarize|acknowledge|narrate|repeat).*$/i,
];

// Leading "Label: value" echoes of the brief (only stripped while they form the
// very first block — a legitimate "Depth: …" later in the body is preserved).
const ECHO_LABELS = [
  "section",
  "weight",
  "depth",
  "depth requirements?",
  "required concepts?",
  "required formulas?",
  "defined terms?",
  "source hints?",
  "your role",
  "my role",
  "user'?s role",
];

const ECHO_LABEL_RE = new RegExp(
  `^\\s*(?:[-*]\\s*)?\\**\\s*(?:${ECHO_LABELS.join("|")})\\s*\\**\\s*[:\\-—]`,
  "i",
);

// Leading conversational wrappers: "Sure!", "Here is the section:", etc.
const PREAMBLE_RE =
  /^\s*(?:sure|certainly|of course|okay|ok|here(?:'?s| is| are)|below is|here you go)\b.*[:.]?\s*$/i;

function stripListAndBold(line: string): string {
  return line
    .trim()
    .replace(/^[-*]\s+/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .trim();
}

function stripWrappingFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return fenced?.[1] ?? text;
}

export function sanitizeMarkdown(text: string): string {
  if (!text) return text;

  let body = stripWrappingFence(text.replace(/^﻿/, "")).replace(/\r\n/g, "\n");
  const lines = body.split("\n");

  // Pass 1: drop leading blank/preamble/label-echo lines until real content.
  let start = 0;
  while (start < lines.length) {
    const line = lines[start]!;
    if (line.trim() === "") {
      start += 1;
      continue;
    }
    if (PREAMBLE_RE.test(line) || ECHO_LABEL_RE.test(line)) {
      start += 1;
      continue;
    }
    break;
  }

  // Pass 2: drop instruction-rule lines anywhere, but never inside code/math.
  const kept: string[] = [];
  let inFence = false;
  let inMath = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) inFence = !inFence;
    else if (!inFence && trimmed.startsWith("$$") && trimmed !== "$$")
      inMath = false;
    else if (!inFence && trimmed === "$$") inMath = !inMath;

    if (inFence || inMath) {
      kept.push(line);
      continue;
    }

    const probe = stripListAndBold(line);
    if (probe && RULE_SIGNATURES.some((re) => re.test(probe))) {
      continue;
    }
    kept.push(line);
  }

  // Collapse 3+ blank lines to a single blank and trim the ends.
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Replaces heavy embedded assets (base64 data-URI images, inline SVG) with
// short text placeholders. For LLM grounding context ONLY: the raw bytes are
// useless to the model as text and a single inlined figure can blow past the
// context window. Never use this for rendering — the viewer needs the real
// image/SVG.
export function stripHeavyAssets(markdown: string): string {
  if (!markdown) return markdown;
  return markdown
    .replace(
      /!\[([^\]]*)\]\(\s*data:[^)]*\)/gi,
      (_full, alt: string) => `[figure: ${alt || "image"}]`,
    )
    .replace(/<svg[\s\S]*?<\/svg>/gi, "[diagram]");
}

// Some instruct models (notably Gemma) leak their chain-of-thought before the
// real reply, in one of two forms — labeled scaffolding:
//
//   User says: "hi"
//   Role: Friendly study assistant for "ECE140".
//   Response: Warm, brief.Hello! How can I help?
//
// …or prose reasoning + a plan:
//
//   The user said "hi". This is a greeting. According to the instructions: …
//   Plan:
//   Reply warmly and briefly.
//   Invite a question.Hello! How can I help?
//
// No system-prompt instruction reliably suppresses this, so the leaked preamble
// is stripped here, keeping only the actual reply. Conservative: it only fires
// when the message OPENS with two or more reasoning lines, so ordinary answers
// (which may begin with "Let me explain…" or contain a lone "Note:") are left
// untouched.
const SCAFFOLD_LABEL_RE =
  /^\s*(?:[*\->\s]*)?(?:user(?:'?s)?(?:\s+(?:says|message|input|question|turn))?|assistant|role|constraints?|greetings?|responses?|reply|answer|output|reasoning|rationale|analysis|thoughts?|plan|approach|task|goal|objective|instructions?|context|notes?|step\s*\d*|final\s+(?:answer|response))\s*:/i;

// Prose lines that talk ABOUT the task/user/instructions rather than reply to
// the student — the tell-tale of leaked reasoning.
const META_TELL_RE =
  /^\s*(?:[*\->\s]*)?(?:the (?:user|student)\b|this is (?:a|an)\b|according to\b|the (?:system(?:\s+(?:instructions?|prompt|message))?|instructions?|rubric|guidelines?)\b|i (?:should|will|need to|must|can|'?ll|am going to)\b|let'?s\b|let me\b|my (?:role|task|goal|job|instructions?)\b|(?:reply|respond|invite|greet|acknowledge|answer)\s+\w+|here(?:'?s| is) (?:my|the) (?:plan|reasoning|response|reply))/i;

// A standalone chain-of-thought header ("Plan:", "Reasoning:") that precedes a
// list of plan items before the real reply. Deliberately excludes "Steps:" /
// "Process:" — those routinely head legitimate step-by-step answers.
const PLAN_HEADER_RE =
  /^\s*(?:[*\->\s]*)?(?:plan|reasoning|rationale|analysis|thoughts?|approach|strategy)\s*:?\s*$/i;

// Lines that clearly open a genuine reply (greeting, acknowledgement, or a
// direct lead-in) — used to end "plan mode" so a short answer isn't mistaken
// for a plan item.
const ANSWER_CUE_RE =
  /^\s*(?:[*\->"']*)?(?:hello|hi|hey|greetings|sure|yes|yeah|yep|no|nope|okay|ok|great|absolutely|certainly|of course|thanks|thank you|you'?re welcome|that'?s|here'?s the|the (?:answer|difference|key|main|formula|term|concept|idea)\b|in (?:short|summary|essence)|to (?:answer|summarize|recap))/i;

function isPlanItem(line: string): boolean {
  if (ANSWER_CUE_RE.test(line)) return false;
  const words = line
    .trim()
    .replace(/^[-*]\s+/, "")
    .split(/\s+/)
    .filter(Boolean);
  return words.length > 0 && words.length <= 8;
}

export function sanitizeChatReply(text: string): string {
  if (!text) return text;
  let body = text.replace(/\r\n/g, "\n");

  // Defensive: if a stray reply marker (from a prior prompt iteration or a
  // cached message) leaked in, keep only what follows the last one.
  const markers = [...body.matchAll(/\[+\s*REPLY\s*\]+/gi)];
  const lastMarker = markers[markers.length - 1];
  if (lastMarker) {
    body = body.slice(lastMarker.index! + lastMarker[0].length);
  }

  const lines = body.split("\n");

  // Walk the leading region, marking reasoning/scaffold lines (and, once a
  // chain-of-thought header is seen, the short plan items that follow) until
  // the real reply begins. `cut` is the index of the last reasoning line. We
  // only strip when the leading block carries two or more strong signals
  // (scaffold/meta lines or a CoT header), so a normal answer that merely opens
  // with one meta-ish clause or a legitimate "Plan:" is left intact.
  let cut = -1;
  let strongCount = 0;
  let inPlan = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line === "") continue;

    if (PLAN_HEADER_RE.test(line)) {
      inPlan = true;
      strongCount += 1;
      cut = i;
      continue;
    }
    if (SCAFFOLD_LABEL_RE.test(line) || META_TELL_RE.test(line)) {
      strongCount += 1;
      cut = i;
      continue;
    }
    // Inside a plan, terse non-answer fragments are plan items, not the reply.
    if (inPlan && isPlanItem(line)) {
      cut = i;
      continue;
    }
    break; // first real reply line
  }

  if (cut === -1 || strongCount < 2) {
    return body.trim();
  }

  // The real reply is whatever follows the reasoning block…
  const tail = lines.slice(cut + 1).join("\n").trim();
  if (tail) return tail;

  // …or, when the model glued the reply onto the last reasoning line after a
  // meta clause ("…invite a question.Hello! …"), recover the trailing
  // sentence(s) at the first "<end-punctuation><Capital>" boundary.
  const stripped = lines[cut]!
    .replace(SCAFFOLD_LABEL_RE, "")
    .replace(PLAN_HEADER_RE, "")
    .trim();
  const glue = stripped.match(/[.!?](?=[A-Z])/);
  if (glue) {
    const recovered = stripped.slice(glue.index! + 1).trim();
    if (recovered) return recovered;
  }
  return body.trim();
}
