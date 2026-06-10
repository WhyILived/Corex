import { useEffect, useState } from "react";
import { listSessions, type SessionSummary } from "../scope/pipeline";
import { useNotebooksStore } from "../store/notebooks";
import { isTauriRuntime } from "../lib/env";

interface SessionPickerProps {
  onClose: () => void;
}

export function SessionPicker({ onClose }: SessionPickerProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string>();
  const openNotebook = useNotebooksStore((state) => state.openNotebook);

  useEffect(() => {
    let cancelled = false;

    if (!isTauriRuntime()) {
      setStatus("error");
      setError(
        "Session storage is only available in the desktop app. Run `npm run tauri dev`.",
      );
      return;
    }

    listSessions()
      .then((result) => {
        if (!cancelled) {
          setSessions(result);
          setStatus("ready");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus("error");
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-label="Open notebook"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Open a notebook</h2>
          <button aria-label="Close" onClick={onClose}>
            {"\u00d7"}
          </button>
        </div>

        {status === "loading" && <p className="muted">Loading sessions…</p>}
        {status === "error" && <p className="muted">{error}</p>}
        {status === "ready" && sessions.length === 0 && (
          <p className="muted">
            No sessions yet. Generate a study guide to create one.
          </p>
        )}

        {status === "ready" && sessions.length > 0 && (
          <ul className="session-list">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <button
                  className="session-item"
                  onClick={() => {
                    void openNotebook(
                      session.sessionId,
                      session.courseCode,
                    );
                    onClose();
                  }}
                >
                  <span className="session-title">
                    {session.courseCode} — {session.courseName}
                  </span>
                  <span className="session-meta">
                    {new Date(session.generatedAt).toLocaleString()} ·{" "}
                    {session.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
