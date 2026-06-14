// Models we must never route through our standard chat/completion adapters.
// Discovery may list them (or they may be typed manually), but they require
// different APIs (e.g. Gemini Interactions / Deep Research agents, embeddings,
// image/video generation) and will 400 if sent to generateContent or /chat/completions.

import type { LLMProvider } from "./catalog";

const BLOCKED_ID_PATTERNS = [
  "deep-research", // Gemini Interactions-only research agents
  "lyria", // audio generation
  "imagen", // image generation
  "veo", // video generation
  "embedding",
  "text-embedding",
  "embed-",
  "-embed",
  "aqa", // attributed QA models
  "gemini-robotics",
  "text-to-speech",
  "/tts",
  "whisper", // speech-to-text (OpenRouter etc.)
  "moderation", // moderation endpoints
  "dall-e", // image
  "sora", // video
] as const;

export function isChatCompletionModel(
  _provider: LLMProvider,
  modelId: string,
): boolean {
  const id = modelId.toLowerCase();
  return !BLOCKED_ID_PATTERNS.some((pattern) => id.includes(pattern));
}

export function filterChatCompletionModels(
  provider: LLMProvider,
  modelIds: string[],
): string[] {
  return modelIds.filter((id) => isChatCompletionModel(provider, id));
}
