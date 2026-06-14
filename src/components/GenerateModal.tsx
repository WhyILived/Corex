import { useEffect, useRef, useState } from "react";
import { buildPlan, useLLMReady } from "../llm/factory";
import { useSettingsStore } from "../store/settings";
import {
  PHASE_LABELS,
  useGenerationStore,
  type GenerationJob,
} from "../store/generation";
import { isTauriRuntime } from "../lib/env";

interface GenerateModalProps {
  onClose: () => void;
}

const ACCEPT = ".pdf,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.txt,.md";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GenerateModal({ onClose }: GenerateModalProps) {
  const ready = useLLMReady();
  const enqueue = useGenerationStore((s) => s.enqueue);
  const cancel = useGenerationStore((s) => s.cancel);
  const dismiss = useGenerationStore((s) => s.dismiss);

  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [dragging, setDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Stable across retries within this modal: a failed/cancelled run leaves its
  // partial extraction cache, so retrying the same session id skips the
  // documents/chunks that already finished.
  const sessionIdRef = useRef<string | null>(null);

  // The live job for this modal (or undefined once dismissed).
  const job = useGenerationStore((s) =>
    jobId ? s.jobs.find((entry) => entry.id === jobId) : undefined,
  );

  // When the run finishes, the store has already opened the notebook tab — just
  // close the modal.
  useEffect(() => {
    if (job?.status === "done") onClose();
  }, [job?.status, onClose]);

  const tauri = isTauriRuntime();
  const running = job?.status === "running" || job?.status === "cancelling";

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming);
    setFiles((current) => {
      const seen = new Set(current.map((f) => `${f.name}:${f.size}`));
      return [...current, ...next.filter((f) => !seen.has(`${f.name}:${f.size}`))];
    });
  };

  const removeFile = (index: number) =>
    setFiles((current) => current.filter((_, i) => i !== index));

  const start = () => {
    if (files.length === 0 || running || !ready) return;
    const plan = buildPlan();
    if (!plan) return;
    sessionIdRef.current ??= Date.now().toString(36);
    const id = enqueue({
      files,
      prompt: prompt.trim() || undefined,
      sessionId: sessionIdRef.current,
      plan,
      searchConfig: useSettingsStore.getState().search,
    });
    setJobId(id);
  };

  const retry = () => {
    if (job) dismiss(job.id);
    setJobId(null);
  };

  // Closing while a job runs leaves it going in the background (the manager owns
  // it); cancelling explicitly aborts and cleans up.
  const cancelRun = () => {
    if (job) cancel(job.id);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-label="New notebook"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>New notebook</h2>
          <button
            type="button"
            aria-label={running ? "Run in background" : "Close"}
            title={running ? "Run in background" : "Close"}
            onClick={onClose}
          >
            {"×"}
          </button>
        </div>

        {!tauri && (
          <p className="muted">
            Generation writes to disk and is only available in the desktop app.
            Run <code>npm run tauri dev</code>.
          </p>
        )}

        {tauri && !ready && (
          <p className="muted">
            Configure an LLM in settings (gear icon) before generating.
          </p>
        )}

        {tauri && ready && !job && (
          <>
            <div
              className={`dropzone${dragging ? " dropzone-active" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <p>Drop files here or click to browse</p>
              <p className="muted">
                Course outline, lecture slides, past exams — PDF, PPTX, images,
                or text.
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPT}
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <ul className="file-list">
                {files.map((file, index) => (
                  <li key={`${file.name}:${file.size}`}>
                    <span className="file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="file-size muted">
                      {formatSize(file.size)}
                    </span>
                    <button
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeFile(index)}
                    >
                      {"×"}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="field">
              <span>
                Focus / instructions <span className="muted">(optional)</span>
              </span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="e.g. Emphasize the topics weighted heavily on the final."
              />
            </label>

            <div className="settings-actions">
              <button onClick={onClose}>Cancel</button>
              <button
                className="primary"
                onClick={start}
                disabled={files.length === 0}
              >
                Generate
              </button>
            </div>
          </>
        )}

        {job && <JobView job={job} onCancel={cancelRun} onRetry={retry} onClose={onClose} />}
      </div>
    </div>
  );
}

function JobView({
  job,
  onCancel,
  onRetry,
  onClose,
}: {
  job: GenerationJob;
  onCancel: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (job.status === "error") {
    return (
      <div className="generate-progress">
        <div className="generate-error">{job.error ?? "Generation failed."}</div>
        <div className="settings-actions">
          <button onClick={onClose}>Close</button>
          <button className="primary" onClick={onRetry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (job.status === "cancelled") {
    return (
      <div className="generate-progress">
        <p className="muted">Generation cancelled. Partial files were cleaned up.</p>
        <div className="settings-actions">
          <button onClick={onClose}>Close</button>
          <button className="primary" onClick={onRetry}>
            Start over
          </button>
        </div>
      </div>
    );
  }

  const phaseLabel = job.progress ? PHASE_LABELS[job.progress.phase] : "Starting…";
  const cancelling = job.status === "cancelling";

  return (
    <div className="generate-progress">
      <div className="generate-phase">
        <span>{cancelling ? "Cancelling…" : phaseLabel}</span>
        <span className="muted">{job.percent}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${job.percent}%` }} />
      </div>
      {job.progress?.message && (
        <p className="muted generate-message" title={job.progress.message}>
          {job.progress.message}
        </p>
      )}
      <p className="muted generate-hint">
        Runs in the background — you can close this window and keep working. Keep
        the app open until it finishes.
      </p>
      <div className="settings-actions">
        <button onClick={onCancel} disabled={cancelling}>
          Cancel
        </button>
        <button className="primary" onClick={onClose}>
          Run in background
        </button>
      </div>
    </div>
  );
}
