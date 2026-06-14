// Model catalog: the "which model is best" knowledge for auto-selection.
//
// Live discovery (discovery.ts) tells us which model IDs a user's API key can
// actually reach, but a bare ID carries no quality/capability signal. This
// module supplies that signal: a curated table of known model families plus
// heuristics for anything unrecognized, so a newly-released model the user
// pastes in still gets sensible defaults.

import type { LLMConfig } from "./client";

export type LLMProvider = LLMConfig["provider"];

export interface ModelMeta {
  // Accepts image input (required for extraction/visual tasks).
  vision: boolean;
  // Supports provider-enforced JSON output. Soft signal: our JSON pipeline can
  // repair most outputs, so this is a ranking nudge, not a hard filter.
  json: boolean;
  // Approximate context window in tokens; used to satisfy long-context tasks
  // and to pick a bigger model after a context_length_exceeded failover.
  contextWindow: number;
  // 0-100 relative output quality (cross-provider). Drives quality-first tasks.
  quality: number;
  // 0-100 relative throughput/latency. Drives speed-first tasks (e.g. the many
  // small extraction calls).
  speed: number;
}

interface CatalogEntry extends ModelMeta {
  // Matched against the (lowercased) model id with `includes`.
  match: string[];
}

// Curated, cross-provider quality/speed scores for common model families.
// Ordered most-specific-first within each provider so e.g. "gpt-4o-mini"
// matches before "gpt-4o". Scores are deliberately coarse; they only need to
// rank models sensibly, not be precise benchmarks.
const CATALOG: Record<LLMProvider, CatalogEntry[]> = {
  anthropic: [
    { match: ["opus"], vision: true, json: true, contextWindow: 200000, quality: 97, speed: 45 },
    { match: ["sonnet"], vision: true, json: true, contextWindow: 200000, quality: 92, speed: 70 },
    { match: ["haiku"], vision: true, json: true, contextWindow: 200000, quality: 80, speed: 92 },
  ],
  openai: [
    { match: ["gpt-4.1-nano", "4.1-nano"], vision: true, json: true, contextWindow: 1000000, quality: 66, speed: 96 },
    { match: ["gpt-4o-mini", "4o-mini"], vision: true, json: true, contextWindow: 128000, quality: 80, speed: 92 },
    { match: ["gpt-4o", "4o"], vision: true, json: true, contextWindow: 128000, quality: 90, speed: 75 },
    { match: ["gpt-4.1-mini", "4.1-mini"], vision: true, json: true, contextWindow: 1000000, quality: 84, speed: 90 },
    { match: ["gpt-4.1"], vision: true, json: true, contextWindow: 1000000, quality: 91, speed: 72 },
    { match: ["o4-mini", "o3-mini", "o1-mini"], vision: true, json: true, contextWindow: 200000, quality: 88, speed: 55 },
    { match: ["o4", "o3", "o1"], vision: true, json: true, contextWindow: 200000, quality: 95, speed: 30 },
    { match: ["gpt-4-turbo"], vision: true, json: true, contextWindow: 128000, quality: 88, speed: 65 },
    { match: ["gpt-3.5"], vision: false, json: true, contextWindow: 16385, quality: 64, speed: 95 },
  ],
  gemini: [
    { match: ["2.5-pro", "1.5-pro"], vision: true, json: true, contextWindow: 1000000, quality: 93, speed: 58 },
    { match: ["2.5-flash-lite", "2.0-flash-lite"], vision: true, json: true, contextWindow: 1000000, quality: 77, speed: 96 },
    { match: ["2.5-flash", "2.0-flash", "1.5-flash"], vision: true, json: true, contextWindow: 1000000, quality: 85, speed: 90 },
    { match: ["pro"], vision: true, json: true, contextWindow: 1000000, quality: 88, speed: 60 },
    { match: ["flash"], vision: true, json: true, contextWindow: 1000000, quality: 82, speed: 92 },
  ],
  groq: [
    { match: ["llama-3.3-70b", "llama3.3-70b"], vision: false, json: true, contextWindow: 131072, quality: 82, speed: 97 },
    { match: ["llama-3.1-70b", "llama3.1-70b"], vision: false, json: true, contextWindow: 131072, quality: 80, speed: 96 },
    { match: ["llama-3.1-8b", "llama3.1-8b", "8b-instant"], vision: false, json: true, contextWindow: 131072, quality: 66, speed: 99 },
    { match: ["llama-4", "llama4", "maverick", "scout"], vision: true, json: true, contextWindow: 131072, quality: 84, speed: 94 },
    { match: ["vision", "-vl", "11b", "90b"], vision: true, json: true, contextWindow: 131072, quality: 78, speed: 90 },
    { match: ["mixtral"], vision: false, json: true, contextWindow: 32768, quality: 72, speed: 95 },
    { match: ["gemma"], vision: false, json: true, contextWindow: 8192, quality: 66, speed: 96 },
    { match: ["deepseek", "qwen"], vision: false, json: true, contextWindow: 131072, quality: 79, speed: 88 },
  ],
  openrouter: [
    // OpenRouter ids are "vendor/model"; describeModel also matches the cross-
    // provider families below, so these are extra hints for free/router-only ids.
    { match: ["free"], vision: false, json: true, contextWindow: 32768, quality: 60, speed: 80 },
  ],
  ollama: [
    { match: ["vl", "vision", "llava", "llama3.2-vision"], vision: true, json: true, contextWindow: 8192, quality: 70, speed: 55 },
    { match: ["70b", "72b"], vision: false, json: true, contextWindow: 32768, quality: 78, speed: 35 },
  ],
};

// Cross-provider family hints applied to any provider (notably OpenRouter,
// whose ids embed the upstream family, e.g. "anthropic/claude-3.5-sonnet").
const FAMILY_HINTS: CatalogEntry[] = [
  { match: ["opus"], vision: true, json: true, contextWindow: 200000, quality: 97, speed: 45 },
  { match: ["sonnet"], vision: true, json: true, contextWindow: 200000, quality: 92, speed: 70 },
  { match: ["haiku"], vision: true, json: true, contextWindow: 200000, quality: 80, speed: 92 },
  // Small/cheap variants must be matched BEFORE their full families so an id
  // like "openai/gpt-4.1-nano" doesn't inherit full-GPT-4.1's quality.
  { match: ["gpt-4.1-nano", "4.1-nano"], vision: true, json: true, contextWindow: 1000000, quality: 66, speed: 96 },
  { match: ["gpt-4.1-mini", "4.1-mini"], vision: true, json: true, contextWindow: 1000000, quality: 84, speed: 90 },
  { match: ["gpt-4o-mini"], vision: true, json: true, contextWindow: 128000, quality: 80, speed: 92 },
  { match: ["gpt-4o"], vision: true, json: true, contextWindow: 128000, quality: 90, speed: 75 },
  { match: ["gpt-4.1"], vision: true, json: true, contextWindow: 1000000, quality: 90, speed: 75 },
  { match: ["gemini-2.5-pro", "gemini-1.5-pro"], vision: true, json: true, contextWindow: 1000000, quality: 93, speed: 58 },
  { match: ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite"], vision: true, json: true, contextWindow: 1000000, quality: 76, speed: 96 },
  { match: ["gemini", "gemma-3", "gemma3"], vision: true, json: true, contextWindow: 1000000, quality: 84, speed: 88 },
  { match: ["llama-4", "llama4", "maverick"], vision: true, json: true, contextWindow: 131072, quality: 84, speed: 90 },
  { match: ["llama-3.3-70b", "llama-3.1-70b"], vision: false, json: true, contextWindow: 131072, quality: 82, speed: 92 },
  { match: ["qwen", "deepseek"], vision: false, json: true, contextWindow: 131072, quality: 80, speed: 80 },
  { match: ["pixtral", "vision", "-vl", "llava"], vision: true, json: true, contextWindow: 32768, quality: 76, speed: 80 },
  { match: ["mistral", "mixtral"], vision: false, json: true, contextWindow: 32768, quality: 73, speed: 90 },
  // Generic small-model catch-all (lowest priority): keep tiny variants out of
  // quality-first slots like chat/generate when better models exist.
  { match: ["nano", "-1b", "-3b", "-2b", "tiny", "mini"], vision: false, json: true, contextWindow: 32768, quality: 58, speed: 95 },
];

// Heuristics for a model neither the per-provider table nor the family hints
// recognize. Conservative: assume JSON works, infer vision from the id, and
// give a neutral quality so it sorts below known-good models but is still
// usable as a failover.
function heuristicMeta(id: string): ModelMeta {
  const lower = id.toLowerCase();
  const vision = /(vision|-vl\b|vl-|llava|pixtral|4o|4\.1|gemini|gemma-?3|claude-3|claude-4|sonnet|opus|haiku)/.test(
    lower,
  );
  // Small/cheap variants get a lower default so they don't outrank unknown
  // mid/large models for quality-first tasks.
  const small = /(nano|mini|lite|tiny|small|-1b|-2b|-3b)/.test(lower);
  return {
    vision,
    json: true,
    contextWindow: 32768,
    quality: small ? 50 : 58,
    speed: small ? 94 : 72,
  };
}

function matchIn(entries: CatalogEntry[], lower: string): ModelMeta | null {
  for (const entry of entries) {
    if (entry.match.some((needle) => lower.includes(needle))) {
      const { match: _match, ...meta } = entry;
      return meta;
    }
  }
  return null;
}

// Resolve capability/quality metadata for a discovered model id. Tries the
// provider-specific table, then cross-provider family hints, then heuristics.
export function describeModel(provider: LLMProvider, id: string): ModelMeta {
  const lower = id.toLowerCase();
  return (
    matchIn(CATALOG[provider] ?? [], lower) ??
    matchIn(FAMILY_HINTS, lower) ??
    heuristicMeta(id)
  );
}
