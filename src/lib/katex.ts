import katex from "katex";

// Render a LaTeX string to an HTML string. throwOnError keeps a malformed
// formula from blowing up the whole guide — it falls back to the raw source.
export function renderKatex(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      output: "html",
    });
  } catch {
    return tex;
  }
}
