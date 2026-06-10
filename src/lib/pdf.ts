// The pdf.js worker as a bundled asset URL. Importing with `?url` emits the
// worker as a separate chunk and yields only its URL (a string), so it does NOT
// pull the pdf.js library into the main bundle — the library itself stays behind
// the dynamic import in the ingest module. The worker is wired up lazily on the
// first PDF parse (see configurePdfWorker).
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export { pdfWorkerUrl };

interface PdfWorkerOptionsHolder {
  GlobalWorkerOptions: { workerSrc: string };
}

export function configurePdfWorker(pdfjs: PdfWorkerOptionsHolder): void {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
}
