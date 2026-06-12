// WKWebView (Tauri) ships a broken ReadableStream where getReader() is missing.
// pdf.js already needed this polyfill; LLM SSE streaming hits the same bug.
import { ReadableStream as ReadableStreamPonyfill } from "web-streams-polyfill";
import { isTauriRuntime } from "./env";

let applied = false;

function needsReadableStreamPolyfill(): boolean {
  const RS = globalThis.ReadableStream;
  if (!RS) return true;
  try {
    const stream = new RS({
      start(controller) {
        controller.enqueue(new Uint8Array([1]));
        controller.close();
      },
    });
    return typeof stream.getReader !== "function";
  } catch {
    return true;
  }
}

/** Install before any fetch response.body.getReader() use (LLM streams, pdf.js). */
export function ensureWebStreams(): void {
  if (applied) return;
  if (!isTauriRuntime() && !needsReadableStreamPolyfill()) {
    applied = true;
    return;
  }
  globalThis.ReadableStream =
    ReadableStreamPonyfill as typeof globalThis.ReadableStream;
  applied = true;
}
