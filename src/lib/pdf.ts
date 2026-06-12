// pdf.js runtime setup for the Tauri webview:
// 1. Polyfill ReadableStream — WKWebView exposes a broken implementation where
//    stream.getReader() is undefined, which breaks pdf.js text/render streaming.
// 2. Install WorkerMessageHandler on the main thread so pdf.js does not fall
//    back to `import(workerSrc)` (fetch + response.body.getReader()).
import { WorkerMessageHandler } from "pdfjs-dist/build/pdf.worker.min.mjs";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ensureWebStreams } from "./streams";

export { pdfWorkerUrl };

declare global {
  // pdf.js reads this to run the worker on the main thread (see PDFWorker in pdf.mjs).
  var pdfjsWorker: { WorkerMessageHandler: typeof WorkerMessageHandler } | undefined;
}

interface PdfWorkerOptionsHolder {
  GlobalWorkerOptions: { workerSrc: string };
}

let runtimeReady = false;

function ensurePdfWorkerHandler(): void {
  if (globalThis.pdfjsWorker?.WorkerMessageHandler) {
    return;
  }
  globalThis.pdfjsWorker = { WorkerMessageHandler };
}

/** Call before the first pdf.js API use (getDocument, etc.). */
export function ensurePdfRuntime(): void {
  if (runtimeReady) return;
  ensureWebStreams();
  ensurePdfWorkerHandler();
  runtimeReady = true;
}

export function configurePdfWorker(pdfjs: PdfWorkerOptionsHolder): void {
  ensurePdfRuntime();
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
}
