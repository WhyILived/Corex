import { useEffect, useRef, useState } from "react";
import { readFile } from "@tauri-apps/plugin-fs";
import type { SourceManifestEntry } from "../types";

interface SourcePreviewProps {
  source: SourceManifestEntry;
  onClose: () => void;
}

type PreviewKind = "image" | "pdf" | "text" | "unsupported";

const MAX_PDF_PAGES = 20;

function kindOf(mimeType: string): PreviewKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/")) return "text";
  return "unsupported";
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode.apply(null, chunk as unknown as number[]));
  }
  return btoa(chunks.join(""));
}

// Renders a PDF's pages to data-URL images using the same pdf.js webview setup
// the ingest pipeline relies on.
async function renderPdf(bytes: Uint8Array): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const { configurePdfWorker } = await import("../lib/pdf");
  configurePdfWorker(pdfjs);

  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const pages: string[] = [];
  const count = Math.min(pdf.numPages, MAX_PDF_PAGES);

  for (let pageNumber = 1; pageNumber <= count; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 900 / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    pages.push(canvas.toDataURL("image/jpeg", 0.85));
  }

  return pages;
}

export function SourcePreview({ source, onClose }: SourcePreviewProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [imageSrc, setImageSrc] = useState<string>();
  const [text, setText] = useState<string>();
  const [pdfPages, setPdfPages] = useState<string[]>();
  const kind = kindOf(source.mimeType);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        if (kind === "unsupported") {
          if (mountedRef.current) setStatus("ready");
          return;
        }
        const bytes = await readFile(source.path);
        if (!mountedRef.current) return;

        if (kind === "image") {
          setImageSrc(`data:${source.mimeType};base64,${bytesToBase64(bytes)}`);
        } else if (kind === "text") {
          setText(new TextDecoder().decode(bytes));
        } else if (kind === "pdf") {
          const pages = await renderPdf(bytes);
          if (!mountedRef.current) return;
          setPdfPages(pages);
        }
        if (mountedRef.current) setStatus("ready");
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [source.path, source.mimeType, kind]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal preview-modal"
        role="dialog"
        aria-label={`Preview ${source.filename}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="preview-title" title={source.filename}>
            {source.filename}
          </h2>
          <button aria-label="Close" onClick={onClose}>
            {"×"}
          </button>
        </div>

        <div className="preview-body">
          {status === "loading" && <p className="muted">Loading preview…</p>}
          {status === "error" && (
            <p className="muted">Couldn't preview this file: {error}</p>
          )}
          {status === "ready" && kind === "unsupported" && (
            <p className="muted">
              No in-app preview for this file type ({source.mimeType}).
            </p>
          )}
          {status === "ready" && kind === "image" && imageSrc && (
            <img className="preview-image" src={imageSrc} alt={source.filename} />
          )}
          {status === "ready" && kind === "text" && (
            <pre className="preview-text">{text}</pre>
          )}
          {status === "ready" && kind === "pdf" && pdfPages && (
            <div className="preview-pdf">
              {pdfPages.map((page, index) => (
                <img key={index} src={page} alt={`Page ${index + 1}`} />
              ))}
              {pdfPages.length === MAX_PDF_PAGES && (
                <p className="muted">Showing the first {MAX_PDF_PAGES} pages.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
