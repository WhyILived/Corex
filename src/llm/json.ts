// Shared helpers for coaxing valid JSON out of LLM responses. Models wrap JSON
// in markdown fences, prepend scratchpad reasoning, emit LaTeX backslashes that
// break JSON escaping, and truncate mid-array when they hit the output cap.
// Every recovery strategy lives here so the client, extractor, and visual
// pipeline all parse responses the same way.

export type PayloadShape = "array" | "object" | "any";

// Strips a single leading/trailing markdown code fence (```json … ```), if the
// whole response is fenced.
export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return fenced?.[1] ? fenced[1].trim() : trimmed;
}

// Repairs escape sequences in model-produced JSON that would otherwise fail to
// parse. LaTeX-heavy content makes models emit lone backslashes ("\Pr",
// "\frac", "\{") that JSON.parse rejects; turning them into escaped literal
// backslashes preserves the LaTeX. Only \", \\, \/ and \uXXXX survive as JSON
// escapes — once a response breaks escaping rules, "\text"/"\neg"/"\binom" are
// far more likely LaTeX than an intentional tab/newline/backspace.
export function repairInvalidJsonEscapes(json: string): string {
  let out = "";
  for (let i = 0; i < json.length; i++) {
    const char = json[i]!;
    if (char !== "\\") {
      out += char;
      continue;
    }
    const next = json[i + 1] ?? "";
    if ('"\\/'.includes(next)) {
      out += char + next;
      i += 1;
    } else if (next === "u" && /^[0-9a-fA-F]{4}$/.test(json.slice(i + 2, i + 6))) {
      out += json.slice(i, i + 6);
      i += 5;
    } else {
      out += "\\\\";
    }
  }
  return out;
}

// Finds top-level balanced JSON arrays/objects embedded in surrounding prose.
function findBalancedRegions(text: string, shape: PayloadShape): string[] {
  const regions: string[] = [];
  let depth = 0;
  let start = -1;
  let startChar = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      if (depth > 0) inString = true;
    } else if (char === "[" || char === "{") {
      if (depth === 0) {
        start = i;
        startChar = char;
      }
      depth += 1;
    } else if (char === "]" || char === "}") {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start !== -1) {
        const matches =
          (char === "]" && startChar === "[") ||
          (char === "}" && startChar === "{");
        const wanted =
          shape === "any" ||
          (shape === "array" ? startChar === "[" : startChar === "{");
        if (matches && wanted) {
          regions.push(text.slice(start, i + 1));
        }
        start = -1;
      }
    }
  }

  return regions;
}

// Extracts the JSON payload from a model response that may wrap it in markdown
// fences, scratchpad reasoning, or commentary. Tries the whole response first,
// then embedded balanced regions from last to first (the final answer follows
// any scratchpad), each as-is and with invalid escapes repaired. Returns null
// if nothing parses to the requested shape.
export function extractJsonPayload<T>(
  raw: string,
  shape: PayloadShape = "any",
): T | null {
  const stripped = stripCodeFences(raw);
  const candidates = [stripped, ...findBalancedRegions(stripped, shape).reverse()];

  for (const candidate of candidates) {
    for (const text of [candidate, repairInvalidJsonEscapes(candidate)]) {
      try {
        const parsed = JSON.parse(text) as T;
        const isArray = Array.isArray(parsed);
        const isObject = parsed !== null && typeof parsed === "object";
        if (
          shape === "array"
            ? isArray
            : shape === "object"
              ? isObject && !isArray
              : isObject
        ) {
          return parsed;
        }
      } catch {
        // Try the next candidate.
      }
    }
  }

  return null;
}

// Recovers complete top-level objects from a truncated JSON array (e.g. when
// the model hit its output-token limit mid-array). Returns null if nothing
// usable could be recovered.
export function salvageTruncatedArray<T>(raw: string): T[] | null {
  const start = raw.indexOf("[");
  if (start === -1) return null;

  const items: T[] = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;

  for (let i = start + 1; i < raw.length; i++) {
    const char = raw[i]!;

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      if (depth === 0) objectStart = i;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart !== -1) {
        const slice = raw.slice(objectStart, i + 1);
        try {
          items.push(JSON.parse(slice) as T);
        } catch {
          try {
            items.push(JSON.parse(repairInvalidJsonEscapes(slice)) as T);
          } catch {
            // Skip malformed entries; keep whatever else parses.
          }
        }
        objectStart = -1;
      }
    }
  }

  return items.length > 0 ? items : null;
}
