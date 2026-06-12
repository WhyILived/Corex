// Caps a text payload to a character budget (a cheap proxy for tokens, ~4
// chars/token) so a single LLM request can't exceed the model's context window.
// The defaults at call sites stay well under even a 128K-token context once
// prompt scaffolding and the output reservation are accounted for. Truncation is
// logged so an over-long source is debuggable.
export function clampChars(text: string, maxChars: number, label = "input"): string {
  if (text.length <= maxChars) return text;
  console.warn(
    `[text] ${label} truncated from ${text.length} to ${maxChars} chars to fit the model context window.`,
  );
  return `${text.slice(0, maxChars)}\n…(truncated)`;
}
