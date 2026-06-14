// Optional web-search module. Off by default; enabled in settings. Plugs into
// two places:
//   1. Generation pipeline — supplementary context appended to a section author
//      subagent's prompt (uploaded course materials always take priority).
//   2. Notebook chat — a tool the model may call when the study guide clearly
//      lacks the answer.
//
// Every provider adapter is SILENT on failure (logs + returns []), never throws,
// so a flaky search backend can never break generation or chat. When
// `config.enabled` is false every entry point returns immediately with empty
// results / null.
//
// Single-file module by design (see task spec). Results are cached to disk per
// session so re-opening a notebook does not re-run every query.

import { exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

import { joinPath } from "../lib/paths";
import type { LLMConfig } from "../llm/client";
import type { ScopeDocument, ScopeSection } from "../types";

// --- Config ---

export type SearchProvider = "tavily" | "brave" | "searxng";

export interface SearchConfig {
  enabled: boolean;
  provider: SearchProvider;
  apiKey?: string; // required for tavily and brave, not for searxng
  searxngBaseUrl?: string; // required for searxng e.g. "http://localhost:8080"
  searchDepth: "surface" | "deep"; // surface: 2 queries/section, deep: 5 queries/section
}

// --- Result / cache types ---

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  excerpt: string; // clean text extract, no HTML
  source: SearchProvider;
  query: string; // the query that produced this result
  fetchedAt: string;
}

export interface SectionSearchContext {
  sectionId: string;
  sectionTitle: string;
  results: SearchResult[];
}

export interface WebSearchCache {
  sessionId: string;
  sections: SectionSearchContext[];
}

// --- Constants ---

const SESSIONS_DIR = "sessions";
const CACHE_FILE = "web-search-cache.json";
const MAX_RESULTS_PER_QUERY = 5;
const MAX_RESULTS_PER_SECTION = 5;
// Bias every query toward academic/teaching sources rather than products/news.
const ACADEMIC_BIAS = "university course";

// --- Small utilities ---

async function getSessionDir(sessionId: string): Promise<string> {
  return joinPath(await appDataDir(), SESSIONS_DIR, sessionId);
}

// Strip HTML tags and collapse whitespace so excerpts are clean prompt text.
function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function makeId(url: string, query: string): string {
  // Stable-ish id from url+query; good enough for dedupe/reference, not crypto.
  return `sr_${Math.abs(hashString(`${url}::${query}`)).toString(36)}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// --- Provider adapters (all silent on failure: log + return []) ---

async function searchTavily(
  query: string,
  config: SearchConfig,
): Promise<SearchResult[]> {
  if (!config.apiKey) {
    console.warn("[webSearch] tavily: missing apiKey");
    return [];
  }
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: MAX_RESULTS_PER_QUERY,
        include_answer: false,
      }),
    });
    if (!response.ok) {
      console.warn(`[webSearch] tavily: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = (await response.json()) as {
      results?: { title?: string; url?: string; content?: string }[];
    };
    return normalize(data.results, "tavily", query, (r) => ({
      title: r.title,
      url: r.url,
      excerpt: r.content,
    }));
  } catch (error) {
    console.warn("[webSearch] tavily failed:", error);
    return [];
  }
}

async function searchBrave(
  query: string,
  config: SearchConfig,
): Promise<SearchResult[]> {
  if (!config.apiKey) {
    console.warn("[webSearch] brave: missing apiKey");
    return [];
  }
  try {
    const url =
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}` +
      `&count=${MAX_RESULTS_PER_QUERY}&text_decorations=false`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": config.apiKey,
      },
    });
    if (!response.ok) {
      console.warn(`[webSearch] brave: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = (await response.json()) as {
      web?: { results?: { title?: string; url?: string; description?: string }[] };
    };
    return normalize(data.web?.results, "brave", query, (r) => ({
      title: r.title,
      url: r.url,
      excerpt: r.description,
    }));
  } catch (error) {
    console.warn("[webSearch] brave failed:", error);
    return [];
  }
}

async function searchSearxng(
  query: string,
  config: SearchConfig,
): Promise<SearchResult[]> {
  if (!config.searxngBaseUrl) {
    console.warn("[webSearch] searxng: missing searxngBaseUrl");
    return [];
  }
  try {
    const base = config.searxngBaseUrl.replace(/\/$/, "");
    const url =
      `${base}/search?q=${encodeURIComponent(query)}` +
      `&format=json&engines=google,bing&language=en`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[webSearch] searxng: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = (await response.json()) as {
      results?: { title?: string; url?: string; content?: string }[];
    };
    return normalize(data.results, "searxng", query, (r) => ({
      title: r.title,
      url: r.url,
      excerpt: r.content,
    }));
  } catch (error) {
    console.warn("[webSearch] searxng failed:", error);
    return [];
  }
}

// Maps raw provider results to normalized SearchResult[], dropping entries
// without a usable url.
function normalize<T>(
  raw: T[] | undefined,
  source: SearchProvider,
  query: string,
  pick: (item: T) => { title?: string; url?: string; excerpt?: string },
): SearchResult[] {
  if (!Array.isArray(raw)) return [];
  const fetchedAt = new Date().toISOString();
  const out: SearchResult[] = [];
  for (const item of raw) {
    const { title, url, excerpt } = pick(item);
    if (typeof url !== "string" || !url.trim()) continue;
    out.push({
      id: makeId(url, query),
      title: cleanText(title) || url,
      url,
      excerpt: cleanText(excerpt),
      source,
      query,
      fetchedAt,
    });
  }
  return out;
}

// --- Core search ---

// Routes to the configured provider. Prepends an academic bias to every query.
// Returns [] when search is disabled.
export async function search(
  query: string,
  config: SearchConfig,
): Promise<SearchResult[]> {
  if (!config.enabled) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const biased = `${ACADEMIC_BIAS} ${trimmed}`;

  switch (config.provider) {
    case "tavily":
      return searchTavily(biased, config);
    case "brave":
      return searchBrave(biased, config);
    case "searxng":
      return searchSearxng(biased, config);
    default:
      return [];
  }
}

// --- Generation pipeline integration ---

// Build the deterministic query list for a section (no LLM call). `surface`
// keeps the first two; `deep` adds formula/example/mistake probes.
function buildSectionQueries(
  section: ScopeSection,
  courseCode: string,
  depth: SearchConfig["searchDepth"],
): string[] {
  const title = section.title;
  const queries: string[] = [
    `${courseCode} ${title} explained`.trim(),
    `${title} ${section.requiredConcepts[0] ?? ""}`.trim(),
  ];

  if (depth === "deep") {
    if (section.requiredFormulas[0]) {
      queries.push(`${title} ${section.requiredFormulas[0]}`.trim());
    }
    queries.push(`${title} worked examples`);
    queries.push(`${title} common mistakes exam`);
  }

  // Drop empties/dupes and cap to the depth budget (surface 2, deep 5).
  const budget = depth === "deep" ? 5 : 2;
  return Array.from(new Set(queries.filter((q) => q.length > 0))).slice(0, budget);
}

// Run a section's queries and return its de-duplicated, ranked context. courseCode
// is optional to preserve the two-arg call shape; pass it (from scope.meta) for
// the best "{courseCode} {title} explained" query.
export async function buildSectionSearchContext(
  section: ScopeSection,
  config: SearchConfig,
  courseCode = "",
): Promise<SectionSearchContext> {
  const base: SectionSearchContext = {
    sectionId: section.id,
    sectionTitle: section.title,
    results: [],
  };
  if (!config.enabled) return base;

  const queries = buildSectionQueries(section, courseCode, config.searchDepth);

  // Sequential within a section too — keeps total request rate low.
  const all: SearchResult[] = [];
  for (const query of queries) {
    all.push(...(await search(query, config)));
  }

  base.results = dedupeAndRank(all);
  return base;
}

// Deduplicate by URL, then keep the top N by excerpt length (longer = richer
// context for the author subagent).
function dedupeAndRank(results: SearchResult[]): SearchResult[] {
  const byUrl = new Map<string, SearchResult>();
  for (const result of results) {
    const existing = byUrl.get(result.url);
    if (!existing || result.excerpt.length > existing.excerpt.length) {
      byUrl.set(result.url, result);
    }
  }
  return Array.from(byUrl.values())
    .sort((a, b) => b.excerpt.length - a.excerpt.length)
    .slice(0, MAX_RESULTS_PER_SECTION);
}

// Build (or load) search context for every section. Sequential to avoid rate
// limiting. Cached to disk; pass force=true to re-search.
export async function buildAllSectionContexts(
  scope: ScopeDocument,
  config: SearchConfig,
  sessionId: string,
  onProgress?: (done: number, total: number) => void,
  force = false,
): Promise<WebSearchCache> {
  if (!config.enabled) {
    return { sessionId, sections: [] };
  }

  if (!force) {
    const cached = await loadSearchCache(sessionId);
    if (cached) {
      onProgress?.(scope.sections.length, scope.sections.length);
      return cached;
    }
  }

  const total = scope.sections.length;
  const sections: SectionSearchContext[] = [];
  let done = 0;

  for (const section of scope.sections) {
    sections.push(
      await buildSectionSearchContext(section, config, scope.meta.courseCode),
    );
    done += 1;
    onProgress?.(done, total);
  }

  const cache: WebSearchCache = { sessionId, sections };
  await writeSearchCache(cache);
  return cache;
}

// Pure: format a section's results as a clearly-supplementary prompt block.
export function formatContextForPrompt(context: SectionSearchContext): string {
  if (context.results.length === 0) return "";

  const lines: string[] = [
    "--- WEB SEARCH CONTEXT (supplementary only -- prefer uploaded course materials) ---",
  ];
  context.results.forEach((result, index) => {
    lines.push(`[${index + 1}] ${result.title} (${result.url})`);
    if (result.excerpt) lines.push(result.excerpt);
    lines.push("");
  });
  lines.push("--- END WEB SEARCH CONTEXT ---");
  return lines.join("\n");
}

// --- Chat integration ---

export interface ChatSearchTool {
  definition: object; // tool definition to pass to the LLM
  execute: (query: string) => Promise<SearchResult[]>;
}

const TOOL_NAME = "web_search";
const TOOL_DESCRIPTION =
  "Search the web for information not found in the study guide. Use only when the study guide clearly does not contain the answer.";

// Returns a provider-correct tool definition + an executor. Anthropic uses a
// flat tool schema; OpenAI/Groq/OpenRouter use the function-calling wrapper.
// Ollama/Gemini fall back to the OpenAI-compatible shape.
export function buildChatSearchTool(
  config: SearchConfig,
  provider: LLMConfig["provider"] = "anthropic",
): ChatSearchTool {
  const definition =
    provider === "anthropic"
      ? {
          name: TOOL_NAME,
          description: TOOL_DESCRIPTION,
          input_schema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
          },
        }
      : {
          type: "function",
          function: {
            name: TOOL_NAME,
            description: TOOL_DESCRIPTION,
            parameters: {
              type: "object",
              properties: { query: { type: "string" } },
              required: ["query"],
            },
          },
        };

  return {
    definition,
    execute: (query: string) => search(query, config),
  };
}

// Pure: format tool-call results for injection back into the chat turn.
export function formatSearchResultsForChat(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No web search results were found.";
  }

  const query = results[0]!.query;
  const lines: string[] = [`Search results for "${query}":`, ""];
  results.forEach((result, index) => {
    lines.push(`[${index + 1}] ${result.title}`);
    lines.push(`Source: ${result.url}`);
    if (result.excerpt) lines.push(result.excerpt);
    lines.push("");
  });
  lines.push("Cite sources by URL when using this information in your response.");
  return lines.join("\n");
}

// --- Cache I/O ---

async function cachePath(sessionId: string): Promise<string> {
  return joinPath(await getSessionDir(sessionId), CACHE_FILE);
}

async function writeSearchCache(cache: WebSearchCache): Promise<void> {
  try {
    const sessionDir = await getSessionDir(cache.sessionId);
    await mkdir(sessionDir, { recursive: true });
    await writeTextFile(
      joinPath(sessionDir, CACHE_FILE),
      JSON.stringify(cache, null, 2),
    );
  } catch (error) {
    console.warn("[webSearch] failed to write cache:", error);
  }
}

// Read the session's cache, or null if absent / unreadable.
export async function loadSearchCache(
  sessionId: string,
): Promise<WebSearchCache | null> {
  try {
    const path = await cachePath(sessionId);
    if (!(await exists(path))) return null;
    const parsed = JSON.parse(await readTextFile(path)) as WebSearchCache;
    return Array.isArray(parsed.sections) ? parsed : null;
  } catch (error) {
    console.warn("[webSearch] failed to load cache:", error);
    return null;
  }
}

// Append one result to a section's cached context (creating the cache/section if
// needed). Used by chat to persist results surfaced mid-conversation.
export async function appendSearchResult(
  sessionId: string,
  sectionId: string,
  result: SearchResult,
): Promise<void> {
  try {
    const cache: WebSearchCache =
      (await loadSearchCache(sessionId)) ?? { sessionId, sections: [] };

    let section = cache.sections.find((s) => s.sectionId === sectionId);
    if (!section) {
      section = { sectionId, sectionTitle: sectionId, results: [] };
      cache.sections.push(section);
    }

    // De-dupe by URL within the section.
    if (!section.results.some((r) => r.url === result.url)) {
      section.results.push(result);
    }

    await writeSearchCache(cache);
  } catch (error) {
    console.warn("[webSearch] failed to append result:", error);
  }
}
