import { useEffect, useState } from "react";
import { listSessions, type SessionSummary } from "../scope/pipeline";
import { useNotebooksStore } from "../store/notebooks";
import { isTauriRuntime } from "../lib/env";
import { TrashIcon } from "./icons";

interface SessionPickerProps {
  onClose: () => void;
}

export function SessionPicker({ onClose }: SessionPickerProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const openNotebook = useNotebooksStore((state) => state.openNotebook);
  const deleteNotebook = useNotebooksStore((state) => state.deleteNotebook);

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

  const handleDelete = async (sessionId: string) => {
    setBusyId(sessionId);
    try {
      await deleteNotebook(sessionId);
      setSessions((current) => current.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

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
            {"×"}
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
              <li key={session.sessionId} className="session-row">
                {confirmingId === session.sessionId ? (
                  <div className="session-confirm">
                    <span>Delete this notebook and all its files?</span>
                    <div className="session-confirm-actions">
                      <button
                        onClick={() => setConfirmingId(null)}
                        disabled={busyId === session.sessionId}
                      >
                        Cancel
                      </button>
                      <button
                        className="danger"
                        onClick={() => void handleDelete(session.sessionId)}
                        disabled={busyId === session.sessionId}
                      >
                        {busyId === session.sessionId ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      className="session-item"
                      onClick={() => {
                        void openNotebook(session.sessionId, session.courseCode);
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
                    <button
                      className="session-delete"
                      aria-label={`Delete ${session.courseCode}`}
                      title="Delete notebook"
                      onClick={() => setConfirmingId(session.sessionId)}
                    >
                      <TrashIcon />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
