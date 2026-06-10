import { useEffect, useMemo, useRef, useState } from "react";
import { useNotebooksStore, type NotebookTab } from "../store/notebooks";
import { useSettingsStore } from "../store/settings";
import { Markdown } from "./Markdown";

interface ThreadPanelProps {
  tab: NotebookTab;
}

export function ThreadPanel({ tab }: ThreadPanelProps) {
  const closeThread = useNotebooksStore((s) => s.closeThread);
  const sendThreadMessage = useNotebooksStore((s) => s.sendThreadMessage);
  const config = useSettingsStore((s) => s.config);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const thread = useMemo(() => {
    if (!tab.activeThreadId || !tab.doc) return undefined;
    for (const section of tab.doc.sections) {
      const found = section.threads.find((t) => t.id === tab.activeThreadId);
      if (found) return found;
    }
    return undefined;
  }, [tab]);

  const lastMessage = thread?.messages[thread.messages.length - 1];
  const waitingForFirstToken = sending && lastMessage?.role !== "assistant";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length, lastMessage?.content.length, sending]);

  if (!thread) return null;

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setError(null);
    setDraft("");
    setSending(true);
    try {
      await sendThreadMessage(tab.sessionId, thread.id, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="thread-panel">
      <header className="thread-header">
        <span>Thread</span>
        <button
          aria-label="Close thread"
          onClick={() => void closeThread(tab.sessionId)}
        >
          {"\u00d7"}
        </button>
      </header>

      <blockquote className="thread-quote">{thread.anchorQuote}</blockquote>

      <div className="thread-messages" ref={scrollRef}>
        {thread.messages.length === 0 && !sending && (
          <p className="muted">Ask a question about this passage.</p>
        )}
        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={`thread-msg thread-msg-${message.role}`}
          >
            {message.role === "assistant" ? (
              <Markdown source={message.content} idPrefix={message.id} />
            ) : (
              message.content
            )}
          </div>
        ))}
        {waitingForFirstToken && (
          <div className="thread-msg thread-msg-assistant">
            <span className="typing-dots" aria-label="Thinking">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
      </div>

      {error && <div className="thread-error">{error}</div>}

      <div className="thread-input">
        {config ? (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about this passage…"
              rows={2}
            />
            <button
              className="primary"
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
            >
              Send
            </button>
          </>
        ) : (
          <p className="muted">
            Configure an LLM in settings (gear icon) to chat.
          </p>
        )}
      </div>
    </aside>
  );
}
