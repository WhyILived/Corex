import { useEffect, useRef, useState } from "react";
import { useNotebooksStore, type NotebookTab } from "../store/notebooks";
import { useLLMReady } from "../llm/factory";
import { Markdown } from "./Markdown";

interface ChatPageProps {
  tab: NotebookTab;
}

export function ChatPage({ tab }: ChatPageProps) {
  const sendChatMessage = useNotebooksStore((s) => s.sendChatMessage);
  const ready = useLLMReady();

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = tab.chatMessages;
  const lastMessage = messages[messages.length - 1];
  const waitingForFirstToken = sending && lastMessage?.role !== "assistant";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, lastMessage?.content.length, sending]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setError(null);
    setDraft("");
    setSending(true);
    try {
      await sendChatMessage(tab.sessionId, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-thread">
          {messages.length === 0 && !sending && (
            <div className="chat-empty">
              <h2>Chat with {tab.doc?.meta.courseName ?? tab.title}</h2>
              <p className="muted">
                Ask anything about this notebook. Answers are grounded in the
                whole study guide.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-msg chat-msg-${message.role}`}
            >
              {message.role === "assistant" ? (
                <>
                  <Markdown source={message.content} idPrefix={message.id} />
                  {message.model && (
                    <span className="model-badge" title="Model that generated this reply">
                      {message.model}
                    </span>
                  )}
                </>
              ) : (
                message.content
              )}
            </div>
          ))}
          {waitingForFirstToken && (
            <div className="chat-msg chat-msg-assistant">
              <span className="typing-dots" aria-label="Thinking">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-composer">
        {ready ? (
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
              placeholder="Ask about this notebook…"
              rows={1}
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
    </div>
  );
}
