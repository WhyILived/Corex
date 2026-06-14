// Deterministic, per-task model selection for auto mode.
//
// Given the user's configured providers and the models their keys can reach
// (discovered live, described by the catalog), this produces a RANKED list of
// candidate configs for a given task. The LLMClient tries them in order and
// fails over down the list when a provider is exhausted. No LLM call is
// involved in the choice — it's a pure, instant ranking.

import type { LLMConfig } from "./client";
import { describeModel, type LLMProvider, type ModelMeta } from "./catalog";
import { isChatCompletionModel } from "./modelFilter";

// The kinds of work the app sends to a model. Each maps to capability
// requirements + a quality-vs-speed preference below.
export type LLMTask =
  | "general"
  | "chat"
  | "extract-text"
  | "extract-vision"
  | "synthesize"
  | "generate"
  | "verify"
  | "fix"
  | "visual-judge"
  | "visual-svg";

interface TaskSpec {
  // Hard requirement: only vision-capable models are eligible.
  needsVision: boolean;
  // Soft requirement: bias toward models that natively enforce JSON.
  prefersJson: boolean;
  // Ranking objective.
  prefer: "quality" | "speed";
  // Minimum context window (tokens) a candidate must advertise.
  minContext: number;
}

const TASK_SPECS: Record<LLMTask, TaskSpec> = {
  general: { needsVision: false, prefersJson: false, prefer: "quality", minContext: 8000 },
  // Conversational; quality matters most, JSON used for the reply envelope.
  chat: { needsVision: false, prefersJson: true, prefer: "quality", minContext: 16000 },
  // Many bounded calls over large text → favor fast models with room for big
  // input + JSON output.
  "extract-text": { needsVision: false, prefersJson: true, prefer: "speed", minContext: 32000 },
  // Reading slide/exam images → must accept images.
  "extract-vision": { needsVision: true, prefersJson: true, prefer: "speed", minContext: 16000 },
  // One reasoning-heavy pass over the whole course → quality + long context.
  synthesize: { needsVision: false, prefersJson: true, prefer: "quality", minContext: 32000 },
  generate: { needsVision: false, prefersJson: false, prefer: "quality", minContext: 16000 },
  verify: { needsVision: false, prefersJson: true, prefer: "quality", minContext: 16000 },
  fix: { needsVision: false, prefersJson: false, prefer: "quality", minContext: 16000 },
  "visual-judge": { needsVision: true, prefersJson: true, prefer: "quality", minContext: 16000 },
  "visual-svg": { needsVision: false, prefersJson: false, prefer: "quality", minContext: 16000 },
};

// A model the user can actually use right now: a provider credential paired
// with one of that provider's discovered model ids and its catalog metadata.
export interface AvailableModel {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  meta: ModelMeta;
}

export interface ProviderCredential {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
}

// Build the flat list of usable models from credentials + discovered ids.
// Each discovered id is described via the catalog so it carries ranking signal.
export function buildAvailable(
  credentials: ProviderCredential[],
  discovered: Partial<Record<LLMProvider, string[]>>,
): AvailableModel[] {
  const out: AvailableModel[] = [];
  for (const cred of credentials) {
    const ids = discovered[cred.provider] ?? [];
    for (const model of ids) {
      if (!isChatCompletionModel(cred.provider, model)) continue;
      out.push({
        provider: cred.provider,
        apiKey: cred.apiKey,
        baseUrl: cred.baseUrl,
        model,
        meta: describeModel(cred.provider, model),
      });
    }
  }
  return out;
}

function scoreFor(meta: ModelMeta, spec: TaskSpec): number {
  const primary = spec.prefer === "quality" ? meta.quality : meta.speed;
  const secondary = spec.prefer === "quality" ? meta.speed : meta.quality;
  // Primary objective dominates; secondary breaks ties; JSON support is a small
  // nudge for JSON-heavy tasks.
  return primary * 1000 + secondary + (spec.prefersJson && meta.json ? 1 : 0);
}

// Rank the available models for a task: filter to eligible ones, then sort best
// first. Returns ready-to-use LLMConfigs (without apiKey-less placeholders).
export function selectForTask(
  available: AvailableModel[],
  task: LLMTask,
): LLMConfig[] {
  const spec = TASK_SPECS[task];

  const eligible = available.filter((m) => {
    if (spec.needsVision && !m.meta.vision) return false;
    if (m.meta.contextWindow < spec.minContext) return false;
    return true;
  });

  // Vision tasks have no fallback if nothing is vision-capable: relax the
  // context floor rather than returning nothing (better a small-context vision
  // model than failing the whole pipeline).
  const pool = eligible.length > 0
    ? eligible
    : available.filter((m) => !spec.needsVision || m.meta.vision);

  const ranked = [...pool].sort((a, b) => scoreFor(b.meta, spec) - scoreFor(a.meta, spec));

  return ranked.map((m) => ({
    provider: m.provider,
    apiKey: m.apiKey,
    model: m.model,
    ...(m.baseUrl ? { baseUrl: m.baseUrl } : {}),
  }));
}
