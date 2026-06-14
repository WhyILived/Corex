// Model-agnostic LLM client for the Tauri renderer (fetch-only, no provider
// SDKs). Cross-cutting concerns live here so every caller gets them for free:
//   - system prompts (kept out of the user turn so models stop echoing rules)
//   - cancellation via AbortSignal (threaded into every fetch)
//   - automatic retry with backoff on transient (429 / 5xx / network) failures
//   - JSON coaxing/repair (delegated to ./json)

import { ensureWebStreams } from "../lib/streams";
import { extractJsonPayload } from "./json";
import {
  selectForTask,
  type AvailableModel,
  type LLMTask,
} from "./autoselect";
import { isChatCompletionModel } from "./modelFilter";

export interface LLMConfig {
  provider: "anthropic" | "openai" | "gemini" | "groq" | "ollama" | "openrouter";
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  baseUrl?: string;
  maxRetries?: number;
}

export interface LLMMessage {
  role: "user" | "assistant";
  content: string | LLMContentBlock[];
}

export interface LLMContentBlock {
  type: "text" | "image";
  text?: string;
  imageData?: string;
  mimeType?: string;
}

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

// Per-call options. `system` is the system prompt; `signal` cancels the request
// (and any retry waits) the moment it aborts; `json` requests provider-enforced
// JSON output (the model is constrained to emit a single JSON value, so it
// cannot leak prose/reasoning around it).
export interface AskOptions {
  system?: string;
  signal?: AbortSignal;
  json?: boolean;
}

export type StreamDeltaCallback = (delta: string) => void;

export const DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  // Gemini 2.5 Flash: vision-capable, follows instructions reliably (unlike
  // gemma-4-31b-it, which leaks chain-of-thought), and supports native JSON
  // output mode (AskOptions.json). Free tier is 250 requests/day. If you hit
  // that during a large generation run, switch to "gemini-2.5-flash-lite"
  // (1,000 req/day, slightly lower quality) in Settings.
  gemini: "gemini-2.5-flash",
  // The bare qwen3-vl tags alias the -thinking variants, which always emit a
  // reasoning trace (cannot be disabled) — far too slow for extraction.
  ollama: "qwen3-vl:8b-instruct",
  // Best free vision model on OpenRouter for document extraction: dense 31B,
  // image input, 256K context, and doesn't emit a reasoning trace by default.
  openrouter: "google/gemma-4-31b-it:free",
  groq: "llama-3.3-70b-versatile",
} as const;

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// Default JSON-mode system prompt: applied to askJSON/askStructured calls that
// don't supply their own, so the model returns a bare JSON value.
const JSON_SYSTEM_PROMPT =
  "You are a precise data-extraction engine. Respond with a single valid JSON " +
  "value and nothing else — no prose, no explanation, no markdown code fences.";

function defaultBaseUrl(provider: LLMConfig["provider"]): string {
  if (provider === "ollama") return DEFAULT_OLLAMA_BASE_URL;
  if (provider === "openai") return DEFAULT_OPENAI_BASE_URL;
  if (provider === "openrouter") return DEFAULT_OPENROUTER_BASE_URL;
  if (provider === "groq") return DEFAULT_GROQ_BASE_URL;
  return "";
}

type ResolvedLLMConfig = {
  provider: LLMConfig["provider"];
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseUrl: string;
  maxRetries: number;
};

export class LLMError extends Error {
  readonly statusCode: number;
  readonly isRetryable: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "LLMError";
    this.statusCode = statusCode;
    this.isRetryable = statusCode === 429 || statusCode >= 500;
  }
}

// Cancellation is signalled by aborting the call's AbortSignal; it surfaces as
// this error so callers can distinguish "user cancelled" from a real failure.
export class AbortError extends Error {
  constructor(message = "Operation aborted") {
    super(message);
    this.name = "AbortError";
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof AbortError ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new AbortError();
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AbortError());
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new AbortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// Default retry predicate: transient transport failures (429 / 5xx) and
// network errors (fetch throws TypeError) are worth retrying.
function defaultRetryable(error: unknown): boolean {
  return error instanceof LLMError ? error.isRetryable : error instanceof TypeError;
}

// A provider/model is "exhausted" when it is rate-limited, out of
// quota/credits, or the request overflowed its context window. These are the
// signals to stop hammering one model and fail over to the next candidate.
function isExhaustionError(error: unknown): boolean {
  if (!(error instanceof LLMError)) return false;
  if (error.statusCode === 429 || error.statusCode === 402) return true;
  const message = error.message.toLowerCase();
  return (
    message.includes("insufficient_quota") ||
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("credit") ||
    message.includes("rate limit") ||
    message.includes("rate_limit") ||
    message.includes("too many requests") ||
    message.includes("context_length_exceeded") ||
    message.includes("context length") ||
    message.includes("maximum context") ||
    message.includes("reduce the length")
  );
}

// In multi-candidate (auto) mode we don't burn the retry budget on an
// exhausted model — we fail over immediately — but transient 5xx/network blips
// on the current model are still worth a quick retry.
function retryableExceptExhaustion(error: unknown): boolean {
  return defaultRetryable(error) && !isExhaustionError(error);
}

// Whether the model/API combo is incompatible with our adapter (wrong endpoint,
// Interactions-only agent, etc.) — fail over to the next candidate in auto mode.
function isIncompatibleModelError(error: unknown): boolean {
  if (!(error instanceof LLMError)) return false;
  if (error.statusCode !== 400 && error.statusCode !== 404) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("interactions api") ||
    message.includes("not supported for generatecontent") ||
    message.includes("is not supported") ||
    message.includes("does not support")
  );
}

// Whether a failure on one candidate should trigger trying the next model:
// exhaustion, auth problems (a bad key for one provider shouldn't sink a run
// when others work), server errors, network failures, and incompatible models.
function shouldFailover(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (!(error instanceof LLMError)) return false;
  if (isIncompatibleModelError(error)) return true;
  const status = error.statusCode;
  if (status === 401 || status === 403 || status === 429 || status === 402) return true;
  if (status >= 500) return true;
  return isExhaustionError(error);
}

// Retries a request thunk on transient failures (per `retryable`) with
// exponential backoff + jitter. Aborts and non-retryable errors propagate
// immediately.
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  signal?: AbortSignal,
  retryable: (error: unknown) => boolean = defaultRetryable,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    throwIfAborted(signal);
    try {
      return await fn();
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError = error;

      if (!retryable(error) || attempt === maxRetries) throw error;

      const backoff = Math.min(8000, 500 * 2 ** attempt) + Math.floor(attempt * 137);
      console.warn(
        `[llm] request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoff}ms:`,
        error instanceof Error ? error.message : error,
      );
      await delay(backoff, signal);
    }
  }
  throw lastError;
}

function resolveConfig(config: LLMConfig): ResolvedLLMConfig {
  return {
    provider: config.provider,
    apiKey: config.apiKey,
    model: config.model || DEFAULT_MODELS[config.provider],
    maxTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: config.temperature ?? DEFAULT_TEMPERATURE,
    baseUrl: config.baseUrl ?? defaultBaseUrl(config.provider),
    maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
  };
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "(unable to read response body)";
  }
}

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new LLMError(
      `LLM request failed (${response.status}): ${body}`,
      response.status,
    );
  }
}

// Reads a text/event-stream response and invokes onData for each `data:` payload.
async function readSSE(
  response: Response,
  onData: (data: string) => void,
): Promise<void> {
  if (!response.body) {
    throw new LLMError("Streaming response has no body", 0);
  }
  if (typeof response.body.getReader !== "function") {
    throw new LLMError("Streaming response body is not readable", 0);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let separator: number;
    while ((separator = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);

      for (const line of rawEvent.split("\n")) {
        const trimmed = line.replace(/\r$/, "");
        if (trimmed.startsWith("data:")) {
          onData(trimmed.slice(5).trim());
        }
      }
    }
  }
}

function blocksFromImages(
  text: string,
  images: { data: string; mimeType: string }[],
): LLMContentBlock[] {
  const blocks: LLMContentBlock[] = [{ type: "text", text }];
  for (const image of images) {
    blocks.push({
      type: "image",
      imageData: image.data,
      mimeType: image.mimeType,
    });
  }
  return blocks;
}

interface LLMAdapter {
  complete(
    config: ResolvedLLMConfig,
    messages: LLMMessage[],
    opts: AskOptions,
  ): Promise<LLMResponse>;
  stream(
    config: ResolvedLLMConfig,
    messages: LLMMessage[],
    onDelta: StreamDeltaCallback,
    opts: AskOptions,
  ): Promise<LLMResponse>;
  ping(config: ResolvedLLMConfig): Promise<{ ok: boolean; models: string[] }>;
}

// --- Anthropic ---

function anthropicHeaders(config: ResolvedLLMConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-key": config.apiKey,
    "anthropic-version": "2023-06-01",
    // Required for direct (webview/browser) calls to pass CORS.
    "anthropic-dangerous-direct-browser-access": "true",
  };
}

function anthropicBody(
  config: ResolvedLLMConfig,
  messages: LLMMessage[],
  opts: AskOptions,
  stream: boolean,
) {
  return {
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    ...(opts.system ? { system: opts.system } : {}),
    ...(stream ? { stream: true } : {}),
    messages: messages.map(toAnthropicMessage),
  };
}

const anthropicAdapter: LLMAdapter = {
  async complete(config, messages, opts) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: anthropicHeaders(config),
      body: JSON.stringify(anthropicBody(config, messages, opts, false)),
      signal: opts.signal,
    });

    await assertOk(response);

    const data = (await response.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };

    const content =
      data.content
        ?.filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("") ?? "";

    return {
      content,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      model: data.model ?? config.model,
    };
  },

  async stream(config, messages, onDelta, opts) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: anthropicHeaders(config),
      body: JSON.stringify(anthropicBody(config, messages, opts, true)),
      signal: opts.signal,
    });

    await assertOk(response);

    let content = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let model = config.model;

    await readSSE(response, (data) => {
      if (!data || data === "[DONE]") return;
      let event: {
        type?: string;
        message?: { model?: string; usage?: { input_tokens?: number } };
        delta?: { type?: string; text?: string };
        usage?: { output_tokens?: number };
      };
      try {
        event = JSON.parse(data);
      } catch {
        return;
      }

      if (event.type === "message_start") {
        model = event.message?.model ?? model;
        inputTokens = event.message?.usage?.input_tokens ?? inputTokens;
      } else if (
        event.type === "content_block_delta" &&
        event.delta?.type === "text_delta" &&
        event.delta.text
      ) {
        content += event.delta.text;
        onDelta(event.delta.text);
      } else if (event.type === "message_delta") {
        outputTokens = event.usage?.output_tokens ?? outputTokens;
      }
    });

    return { content, inputTokens, outputTokens, model };
  },

  async ping() {
    return { ok: true, models: [] };
  },
};

function toAnthropicMessage(message: LLMMessage) {
  if (typeof message.content === "string") {
    return { role: message.role, content: message.content };
  }

  const content = message.content.map((block) => {
    if (block.type === "text") {
      return { type: "text", text: block.text ?? "" };
    }

    const mimeType = block.mimeType ?? "image/png";
    const source = {
      type: "base64" as const,
      media_type: mimeType,
      data: block.imageData ?? "",
    };

    if (mimeType === "application/pdf") {
      return { type: "document", source };
    }
    return { type: "image", source };
  });

  return { role: message.role, content };
}

// --- OpenAI-compatible (OpenAI + Ollama + OpenRouter) ---

function createOpenAIAdapter(
  getBaseUrl: (config: ResolvedLLMConfig) => string,
  useAuth: boolean,
  extraBody?: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): LLMAdapter {
  function buildHeaders(config: ResolvedLLMConfig): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...extraHeaders,
    };
    if (useAuth) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }
    return headers;
  }

  // Prepends the system prompt as a system-role message (the OpenAI dialect
  // carries the system prompt in the messages array, not a top-level field).
  function withSystem(messages: LLMMessage[], system?: string) {
    const mapped = messages.map(toOpenAIMessage);
    return system ? [{ role: "system", content: system }, ...mapped] : mapped;
  }

  return {
    async complete(config, messages, opts) {
      const body = {
        ...extraBody,
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        messages: withSystem(messages, opts.system),
      };

      const response = await fetch(`${getBaseUrl(config)}/chat/completions`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify(body),
        signal: opts.signal,
      });

      await assertOk(response);

      const data = (await response.json()) as {
        choices?: { message?: { content?: string | null } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
        model?: string;
      };

      return {
        content: data.choices?.[0]?.message?.content ?? "",
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        model: data.model ?? config.model,
      };
    },

    async stream(config, messages, onDelta, opts) {
      const body = {
        ...extraBody,
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: true,
        messages: withSystem(messages, opts.system),
      };

      const response = await fetch(`${getBaseUrl(config)}/chat/completions`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify(body),
        signal: opts.signal,
      });

      await assertOk(response);

      let content = "";
      let inputTokens = 0;
      let outputTokens = 0;
      let model = config.model;

      await readSSE(response, (data) => {
        if (!data || data === "[DONE]") return;
        let chunk: {
          choices?: { delta?: { content?: string | null } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
          model?: string;
        };
        try {
          chunk = JSON.parse(data);
        } catch {
          return;
        }

        model = chunk.model ?? model;
        inputTokens = chunk.usage?.prompt_tokens ?? inputTokens;
        outputTokens = chunk.usage?.completion_tokens ?? outputTokens;

        const choice = chunk.choices?.[0];
        const delta =
          choice?.delta?.content ??
          // Some OpenAI-compatible providers put text only on the final chunk.
          (choice as { message?: { content?: string | null } } | undefined)
            ?.message?.content;
        if (delta) {
          content += delta;
          onDelta(delta);
        }
      });

      return { content, inputTokens, outputTokens, model };
    },

    async ping(config) {
      if (useAuth) {
        return { ok: true, models: [] };
      }

      const baseUrl = getBaseUrl(config).replace(/\/v1$/, "");
      try {
        const response = await fetch(`${baseUrl}/api/tags`);
        if (!response.ok) {
          return { ok: false, models: [] };
        }
        const data = (await response.json()) as { models?: { name?: string }[] };
        const models =
          data.models
            ?.map((entry) => entry.name)
            .filter((name): name is string => Boolean(name)) ?? [];
        return { ok: true, models };
      } catch {
        return { ok: false, models: [] };
      }
    },
  };
}

function toOpenAIMessage(message: LLMMessage) {
  if (typeof message.content === "string") {
    return { role: message.role, content: message.content };
  }

  const content = message.content.map((block) => {
    if (block.type === "text") {
      return { type: "text", text: block.text ?? "" };
    }
    const mimeType = block.mimeType ?? "image/png";
    const data = block.imageData ?? "";
    return {
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${data}` },
    };
  });

  return { role: message.role, content };
}

const openaiAdapter = createOpenAIAdapter((config) => config.baseUrl, true);

const groqAdapter = createOpenAIAdapter((config) => config.baseUrl, true);

// OpenRouter speaks the OpenAI chat-completions dialect (including image_url
// content blocks). The attribution headers are optional but recommended.
const openrouterAdapter = createOpenAIAdapter(
  (config) => config.baseUrl,
  true,
  undefined,
  {
    "HTTP-Referer": "https://github.com/WhyILived/Corex",
    "X-Title": "Corex",
  },
);

// Ollama auto-enables thinking for thinking-capable models, which burns hidden
// reasoning tokens at local-inference speeds. reasoning_effort "none" disables
// the trace where the model's template allows it — note the *-thinking model
// variants ignore this and always reason; prefer -instruct variants here.
const ollamaAdapter = createOpenAIAdapter(
  (config) => `${config.baseUrl.replace(/\/$/, "")}/v1`,
  false,
  { reasoning_effort: "none" },
);

// --- Gemini ---

function geminiBody(
  config: ResolvedLLMConfig,
  messages: LLMMessage[],
  opts: AskOptions,
) {
  return {
    contents: messages.map(toGeminiContent),
    ...(opts.system
      ? { systemInstruction: { parts: [{ text: opts.system }] } }
      : {}),
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: config.temperature,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
}

const geminiAdapter: LLMAdapter = {
  async complete(config, messages, opts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody(config, messages, opts)),
      signal: opts.signal,
    });

    await assertOk(response);

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      modelVersion?: string;
    };

    const content =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";

    return {
      content,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      model: data.modelVersion ?? config.model,
    };
  },

  async stream(config, messages, onDelta, opts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(config.apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody(config, messages, opts)),
      signal: opts.signal,
    });

    await assertOk(response);

    let content = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let model = config.model;

    await readSSE(response, (data) => {
      if (!data || data === "[DONE]") return;
      let chunk: {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
        modelVersion?: string;
      };
      try {
        chunk = JSON.parse(data);
      } catch {
        return;
      }

      model = chunk.modelVersion ?? model;
      inputTokens = chunk.usageMetadata?.promptTokenCount ?? inputTokens;
      outputTokens = chunk.usageMetadata?.candidatesTokenCount ?? outputTokens;

      const delta =
        chunk.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("") ?? "";
      if (delta) {
        content += delta;
        onDelta(delta);
      }
    });

    return { content, inputTokens, outputTokens, model };
  },

  async ping() {
    return { ok: true, models: [] };
  },
};

function toGeminiContent(message: LLMMessage) {
  const role = message.role === "assistant" ? "model" : "user";

  if (typeof message.content === "string") {
    return { role, parts: [{ text: message.content }] };
  }

  const parts = message.content.map((block) => {
    if (block.type === "text") {
      return { text: block.text ?? "" };
    }
    return {
      inline_data: {
        mime_type: block.mimeType ?? "image/png",
        data: block.imageData ?? "",
      },
    };
  });

  return { role, parts };
}

const ADAPTERS: Record<LLMConfig["provider"], LLMAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
  gemini: geminiAdapter,
  groq: groqAdapter,
  ollama: ollamaAdapter,
  openrouter: openrouterAdapter,
};

// How a client decides which model(s) to use:
//   - manual: exactly one user-chosen config (today's behavior; failover is a
//     no-op since there is a single candidate).
//   - auto:   a pool of available models, ranked per task at call time, with
//     failover down the ranking when a model is exhausted.
type ClientPlan =
  | { kind: "manual"; config: LLMConfig }
  | { kind: "auto"; available: AvailableModel[]; task: LLMTask };

export class LLMClient {
  private plan: ClientPlan;
  // Per-call config overrides (e.g. temperature/maxTokens) applied to every
  // candidate, accumulated via withConfig().
  private overrides: Partial<LLMConfig>;
  // Default signal applied to every call made through this client; per-call
  // opts.signal overrides it. Set via withSignal() so a whole pipeline shares
  // one cancellation source.
  private defaultSignal?: AbortSignal;

  constructor(config: LLMConfig, defaultSignal?: AbortSignal) {
    this.plan = { kind: "manual", config };
    this.overrides = {};
    this.defaultSignal = defaultSignal;
  }

  // Auto mode: rank `available` models per task and fail over across them.
  static auto(
    available: AvailableModel[],
    task: LLMTask = "general",
    defaultSignal?: AbortSignal,
  ): LLMClient {
    return LLMClient.make({ kind: "auto", available, task }, {}, defaultSignal);
  }

  private static make(
    plan: ClientPlan,
    overrides: Partial<LLMConfig>,
    signal?: AbortSignal,
  ): LLMClient {
    const client = new LLMClient({ provider: "openai", apiKey: "", model: "" });
    client.plan = plan;
    client.overrides = overrides;
    client.defaultSignal = signal;
    return client;
  }

  // The ranked candidate configs for the active plan/task, with accumulated
  // overrides applied. Empty only when auto mode has no usable model.
  private resolvedCandidates(): ResolvedLLMConfig[] {
    const base =
      this.plan.kind === "manual"
        ? [this.plan.config]
        : selectForTask(this.plan.available, this.plan.task);
    return base.map((config) => resolveConfig({ ...config, ...this.overrides }));
  }

  get provider(): LLMConfig["provider"] {
    if (this.plan.kind === "manual") return this.plan.config.provider;
    return selectForTask(this.plan.available, this.plan.task)[0]?.provider ?? "openai";
  }

  private signalFor(opts?: AskOptions): AbortSignal | undefined {
    return opts?.signal ?? this.defaultSignal;
  }

  async complete(messages: LLMMessage[], opts: AskOptions = {}): Promise<LLMResponse> {
    const signal = this.signalFor(opts);
    const candidates = this.resolvedCandidates();
    if (candidates.length === 0) {
      throw new LLMError(
        "No model is available for this task. Add an API key (and ensure its models were discovered) in settings.",
        0,
      );
    }

    const multi = candidates.length > 1;
    let lastError: unknown;

    for (let index = 0; index < candidates.length; index++) {
      const config = candidates[index]!;
      if (!isChatCompletionModel(config.provider, config.model)) {
        lastError = new LLMError(
          `Model "${config.model}" is not supported for chat/completion (requires a different API).`,
          400,
        );
        if (index < candidates.length - 1) continue;
        throw lastError;
      }
      try {
        return await withRetry(
          () => ADAPTERS[config.provider].complete(config, messages, { ...opts, signal }),
          config.maxRetries,
          signal,
          // Don't waste the retry budget on an exhausted model when we can fail
          // over; still retry transient blips on the current one.
          multi ? retryableExceptExhaustion : undefined,
        );
      } catch (error) {
        if (isAbortError(error)) throw error;
        lastError = error;
        const hasNext = index < candidates.length - 1;
        if (hasNext && shouldFailover(error)) {
          console.warn(
            `[llm] ${config.provider}/${config.model} unavailable (${
              error instanceof Error ? error.message.slice(0, 120) : String(error)
            }); failing over to next model`,
          );
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  // Streams from the top-ranked candidate, invoking onDelta with each fragment.
  // Falls back to complete() (which carries full failover) when the stream is
  // empty or unreadable (common in WKWebView before the ReadableStream polyfill
  // loads). The stream attempt itself is not retried (partial deltas duplicate).
  async stream(
    messages: LLMMessage[],
    onDelta: StreamDeltaCallback,
    opts: AskOptions = {},
  ): Promise<LLMResponse> {
    ensureWebStreams();
    const signal = this.signalFor(opts);
    const config = this.resolvedCandidates()[0];
    if (config) {
      try {
        const streamed = await ADAPTERS[config.provider].stream(config, messages, onDelta, {
          ...opts,
          signal,
        });
        if (streamed.content.trim()) {
          return streamed;
        }
      } catch (error) {
        if (isAbortError(error)) throw error;
        console.warn("[llm] stream failed, falling back to complete", error);
      }
    }

    const completed = await this.complete(messages, opts);
    if (completed.content.trim()) {
      onDelta(completed.content);
    }
    return completed;
  }

  async ask(prompt: string, opts: AskOptions = {}): Promise<string> {
    const response = await this.complete([{ role: "user", content: prompt }], opts);
    return response.content;
  }

  // Asks for a JSON value and parses it, retrying once with a stronger nudge if
  // the first response can't be parsed (separate from transport retry).
  async askJSON<T>(prompt: string, opts: AskOptions = {}): Promise<T> {
    const system = opts.system ?? JSON_SYSTEM_PROMPT;
    const raw = await this.ask(prompt, { ...opts, system });
    const parsed = extractJsonPayload<T>(raw);
    if (parsed !== null) return parsed;

    throwIfAborted(this.signalFor(opts));
    const retryRaw = await this.ask(
      `${prompt}\n\nYour previous response was not valid JSON. Return ONLY the JSON value, with no other text.`,
      { ...opts, system },
    );
    const retryParsed = extractJsonPayload<T>(retryRaw);
    if (retryParsed !== null) return retryParsed;

    throw new LLMError(`Invalid JSON in LLM response: ${retryRaw.slice(0, 300)}`, 0);
  }

  // Like askJSON, but runs the parsed value through a validator/normalizer that
  // returns null to reject. Retries (with a corrective nudge) until valid or the
  // attempt budget is exhausted.
  async askStructured<T>(
    prompt: string,
    validate: (value: unknown) => T | null,
    opts: AskOptions & { attempts?: number } = {},
  ): Promise<T> {
    const system = opts.system ?? JSON_SYSTEM_PROMPT;
    const attempts = Math.max(1, opts.attempts ?? 2);
    let lastRaw = "";

    for (let attempt = 0; attempt < attempts; attempt++) {
      throwIfAborted(this.signalFor(opts));
      const ask =
        attempt === 0
          ? prompt
          : `${prompt}\n\nYour previous response did not match the required schema. Return ONLY the JSON value described above.`;
      lastRaw = await this.ask(ask, { ...opts, system });
      const parsed = extractJsonPayload<unknown>(lastRaw);
      if (parsed !== null) {
        const valid = validate(parsed);
        if (valid !== null) return valid;
      }
    }

    throw new LLMError(
      `Response did not match schema after ${attempts} attempts: ${lastRaw.slice(0, 300)}`,
      0,
    );
  }

  async askWithImages(
    text: string,
    images: { data: string; mimeType: string }[],
    opts: AskOptions = {},
  ): Promise<string> {
    const response = await this.complete(
      [{ role: "user", content: blocksFromImages(text, images) }],
      opts,
    );
    return response.content;
  }

  // Clone with additional config overrides (applied to every candidate).
  withConfig(overrides: Partial<LLMConfig>): LLMClient {
    return LLMClient.make(
      this.plan,
      { ...this.overrides, ...overrides },
      this.defaultSignal,
    );
  }

  // Clone re-ranked for a specific task. No-op in manual mode (single model).
  withTask(task: LLMTask): LLMClient {
    if (this.plan.kind === "manual") return this;
    return LLMClient.make(
      { kind: "auto", available: this.plan.available, task },
      this.overrides,
      this.defaultSignal,
    );
  }

  // Returns a client whose calls are cancelled when `signal` aborts. Used to
  // bind one cancellation source to an entire generation pipeline.
  withSignal(signal: AbortSignal): LLMClient {
    return LLMClient.make(this.plan, this.overrides, signal);
  }

  async ping(): Promise<{ ok: boolean; models: string[] }> {
    const config = this.resolvedCandidates()[0];
    if (!config) return { ok: false, models: [] };
    return ADAPTERS[config.provider].ping(config);
  }
}
