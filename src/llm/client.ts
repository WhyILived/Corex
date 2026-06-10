// Model-agnostic LLM client for Tauri renderer (fetch-only, no provider SDKs).

export interface LLMConfig {
  provider: "anthropic" | "openai" | "gemini" | "ollama";
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  baseUrl?: string;
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

export type StreamDeltaCallback = (delta: string) => void;

export const DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-1.5-pro",
  ollama: "gemma4:e4b",
} as const;

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

function defaultBaseUrl(provider: LLMConfig["provider"]): string {
  if (provider === "ollama") return DEFAULT_OLLAMA_BASE_URL;
  if (provider === "openai") return DEFAULT_OPENAI_BASE_URL;
  return "";
}

type ResolvedLLMConfig = {
  provider: LLMConfig["provider"];
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseUrl: string;
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

interface LLMAdapter {
  complete(config: ResolvedLLMConfig, messages: LLMMessage[]): Promise<LLMResponse>;
  stream(
    config: ResolvedLLMConfig,
    messages: LLMMessage[],
    onDelta: StreamDeltaCallback,
  ): Promise<LLMResponse>;
  ping(config: ResolvedLLMConfig): Promise<{ ok: boolean; models: string[] }>;
}

function resolveConfig(config: LLMConfig): ResolvedLLMConfig {
  return {
    provider: config.provider,
    apiKey: config.apiKey,
    model: config.model || DEFAULT_MODELS[config.provider],
    maxTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: config.temperature ?? DEFAULT_TEMPERATURE,
    baseUrl: config.baseUrl ?? defaultBaseUrl(config.provider),
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

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return fenced?.[1] ? fenced[1].trim() : trimmed;
}

// Reads a text/event-stream response and invokes onData for each `data:` payload.
async function readSSE(
  response: Response,
  onData: (data: string) => void,
): Promise<void> {
  if (!response.body) {
    throw new LLMError("Streaming response has no body", 0);
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

const anthropicAdapter: LLMAdapter = {
  async complete(config, messages) {
    const body = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: messages.map(toAnthropicMessage),
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: anthropicHeaders(config),
      body: JSON.stringify(body),
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

  async stream(config, messages, onDelta) {
    const body = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: true,
      messages: messages.map(toAnthropicMessage),
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: anthropicHeaders(config),
      body: JSON.stringify(body),
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

// --- OpenAI-compatible (OpenAI + Ollama) ---

function createOpenAIAdapter(getBaseUrl: (config: ResolvedLLMConfig) => string, useAuth: boolean): LLMAdapter {
  function buildHeaders(config: ResolvedLLMConfig): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (useAuth) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }
    return headers;
  }

  return {
    async complete(config, messages) {
      const headers = buildHeaders(config);

      const body = {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: messages.map(toOpenAIMessage),
      };

      const response = await fetch(`${getBaseUrl(config)}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
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

    async stream(config, messages, onDelta) {
      const body = {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: true,
        messages: messages.map(toOpenAIMessage),
      };

      const response = await fetch(`${getBaseUrl(config)}/chat/completions`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify(body),
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

        const delta = chunk.choices?.[0]?.delta?.content;
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

        const data = (await response.json()) as {
          models?: { name?: string }[];
        };

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

const ollamaAdapter = createOpenAIAdapter(
  (config) => `${config.baseUrl.replace(/\/$/, "")}/v1`,
  false,
);

// --- Gemini ---

const geminiAdapter: LLMAdapter = {
  async complete(config, messages) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

    const body = {
      contents: messages.map(toGeminiContent),
      generationConfig: {
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    await assertOk(response);

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
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

  async stream(config, messages, onDelta) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(config.apiKey)}`;

    const body = {
      contents: messages.map(toGeminiContent),
      generationConfig: {
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
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
  ollama: ollamaAdapter,
};

export class LLMClient {
  private readonly config: ResolvedLLMConfig;

  constructor(config: LLMConfig) {
    this.config = resolveConfig(config);
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    return ADAPTERS[this.config.provider].complete(this.config, messages);
  }

  // Streams the response, invoking onDelta with each text fragment as it
  // arrives. Resolves with the full response once the stream ends.
  async stream(
    messages: LLMMessage[],
    onDelta: StreamDeltaCallback,
  ): Promise<LLMResponse> {
    return ADAPTERS[this.config.provider].stream(this.config, messages, onDelta);
  }

  async ask(prompt: string): Promise<string> {
    const response = await this.complete([{ role: "user", content: prompt }]);
    return response.content;
  }

  async askJSON<T>(prompt: string): Promise<T> {
    const raw = await this.ask(prompt);
    const stripped = stripMarkdownFences(raw);

    try {
      return JSON.parse(stripped) as T;
    } catch {
      throw new LLMError(`Invalid JSON in LLM response: ${raw}`, 0);
    }
  }

  async askWithImages(
    text: string,
    images: { data: string; mimeType: string }[],
  ): Promise<string> {
    const response = await this.complete([
      { role: "user", content: blocksFromImages(text, images) },
    ]);
    return response.content;
  }

  withConfig(overrides: Partial<LLMConfig>): LLMClient {
    return new LLMClient({ ...this.toConfig(), ...overrides });
  }

  async ping(): Promise<{ ok: boolean; models: string[] }> {
    return ADAPTERS[this.config.provider].ping(this.config);
  }

  private toConfig(): LLMConfig {
    const { provider, apiKey, model, maxTokens, temperature, baseUrl } =
      this.config;
    return { provider, apiKey, model, maxTokens, temperature, baseUrl };
  }
}
