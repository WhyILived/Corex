// Live model discovery: ask each provider which models the user's key can
// reach. Called whenever a credential is added/changed so auto-selection only
// ever ranks models the user actually has access to.
//
// Every function returns a plain list of model ids (provider-native casing,
// "models/" prefixes stripped). Failures throw so the caller can surface a
// per-provider error; they never return partial garbage.

import type { ProviderCredential } from "./autoselect";
import type { LLMProvider } from "./catalog";
import { filterChatCompletionModels } from "./modelFilter";

const DEFAULT_BASE_URL: Record<LLMProvider, string> = {
  anthropic: "https://api.anthropic.com/v1",
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434",
};

function baseFor(cred: ProviderCredential): string {
  return (cred.baseUrl?.trim() || DEFAULT_BASE_URL[cred.provider]).replace(/\/$/, "");
}

async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }
  return response.json();
}

// OpenAI / Groq / OpenRouter all expose GET /models -> { data: [{ id }] }.
async function listOpenAICompatible(cred: ProviderCredential): Promise<string[]> {
  const data = (await getJson(`${baseFor(cred)}/models`, {
    Authorization: `Bearer ${cred.apiKey}`,
  })) as { data?: { id?: string }[] };
  return filterChatCompletionModels(
    cred.provider,
    (data.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string"),
  );
}

async function listAnthropic(cred: ProviderCredential): Promise<string[]> {
  const data = (await getJson(`${baseFor(cred)}/models?limit=1000`, {
    "x-api-key": cred.apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  })) as { data?: { id?: string }[] };
  return (data.data ?? [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === "string");
}

async function listGemini(cred: ProviderCredential): Promise<string[]> {
  const data = (await getJson(
    `${baseFor(cred)}/models?key=${encodeURIComponent(cred.apiKey)}&pageSize=1000`,
    {},
  )) as {
    models?: { name?: string; supportedGenerationMethods?: string[] }[];
  };
  return filterChatCompletionModels(
    "gemini",
    (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name?.replace(/^models\//, ""))
      .filter((id): id is string => typeof id === "string"),
  );
}

async function listOllama(cred: ProviderCredential): Promise<string[]> {
  const data = (await getJson(`${baseFor(cred)}/api/tags`, {})) as {
    models?: { name?: string }[];
  };
  return (data.models ?? [])
    .map((m) => m.name)
    .filter((id): id is string => typeof id === "string");
}

// Discover the model ids reachable with a credential. Resolves to a de-duped,
// sorted list; rejects with a human-readable message on transport/auth errors.
export async function discoverModels(cred: ProviderCredential): Promise<string[]> {
  let ids: string[];
  switch (cred.provider) {
    case "anthropic":
      ids = await listAnthropic(cred);
      break;
    case "gemini":
      ids = await listGemini(cred);
      break;
    case "ollama":
      ids = await listOllama(cred);
      break;
    case "openai":
    case "groq":
    case "openrouter":
      ids = await listOpenAICompatible(cred);
      break;
  }
  return Array.from(new Set(ids)).sort();
}
