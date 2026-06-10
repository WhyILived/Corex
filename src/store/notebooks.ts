import { create } from "zustand";
import {
  loadNotebookChat,
  loadStudyGuide,
  saveNotebookChat,
  saveThread,
  type InlineThread,
  type StudyGuideDocument,
  type StudyGuideSection,
  type ThreadMessage,
} from "../assembler/assembler";
import { loadSources } from "../scope/pipeline";
import type { SourceManifest } from "../types";
import type { SelectionAnchor } from "../lib/selection";
import { isTauriRuntime } from "../lib/env";
import { LLMClient, type LLMMessage } from "../llm/client";
import { useSettingsStore } from "./settings";

export type NotebookStatus = "loading" | "ready" | "error";
export type NotebookView = "guide" | "chat";

export interface NotebookTab {
  sessionId: string;
  title: string;
  status: NotebookStatus;
  view: NotebookView;
  doc?: StudyGuideDocument;
  sources?: SourceManifest;
  error?: string;
  activeSectionId?: string;
  selectedSourceId?: string;
  activeThreadId?: string;
  chatMessages: ThreadMessage[];
}

interface NotebooksState {
  tabs: NotebookTab[];
  activeSessionId: string | null;
  openNotebook: (sessionId: string, fallbackTitle?: string) => Promise<void>;
  closeNotebook: (sessionId: string) => void;
  setActive: (sessionId: string) => void;
  setActiveSection: (sessionId: string, sectionId: string) => void;
  selectSource: (sessionId: string, sourceId: string | undefined) => void;
  setView: (sessionId: string, view: NotebookView) => void;
  sendChatMessage: (sessionId: string, text: string) => Promise<void>;
  createThread: (
    sessionId: string,
    sectionId: string,
    anchor: SelectionAnchor,
  ) => Promise<void>;
  openThread: (sessionId: string, threadId: string) => void;
  closeThread: (sessionId: string) => Promise<void>;
  sendThreadMessage: (
    sessionId: string,
    threadId: string,
    text: string,
  ) => Promise<void>;
}

function patchTab(
  tabs: NotebookTab[],
  sessionId: string,
  patch: Partial<NotebookTab>,
): NotebookTab[] {
  return tabs.map((tab) =>
    tab.sessionId === sessionId ? { ...tab, ...patch } : tab,
  );
}

function findThread(
  doc: StudyGuideDocument | undefined,
  threadId: string,
): { section: StudyGuideSection; thread: InlineThread } | undefined {
  if (!doc) return undefined;
  for (const section of doc.sections) {
    const thread = section.threads.find((t) => t.id === threadId);
    if (thread) return { section, thread };
  }
  return undefined;
}

// Replace the content of one chat message inside a tab, returning new tabs.
function patchChatMessage(
  tabs: NotebookTab[],
  sessionId: string,
  messageId: string,
  content: string,
): NotebookTab[] {
  return tabs.map((tab) =>
    tab.sessionId === sessionId
      ? {
          ...tab,
          chatMessages: tab.chatMessages.map((message) =>
            message.id === messageId ? { ...message, content } : message,
          ),
        }
      : tab,
  );
}

// Replace the content of one thread message, returning new tabs.
function patchThreadMessage(
  tabs: NotebookTab[],
  sessionId: string,
  threadId: string,
  messageId: string,
  content: string,
): NotebookTab[] {
  return tabs.map((tab) => {
    if (tab.sessionId !== sessionId || !tab.doc) return tab;
    const sections = tab.doc.sections.map((section) =>
      section.threads.some((t) => t.id === threadId)
        ? {
            ...section,
            threads: section.threads.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    messages: t.messages.map((message) =>
                      message.id === messageId
                        ? { ...message, content }
                        : message,
                    ),
                  }
                : t,
            ),
          }
        : section,
    );
    return { ...tab, doc: { ...tab.doc, sections } };
  });
}

// Append a message to one thread inside a tab, returning new tabs.
function appendMessage(
  tabs: NotebookTab[],
  sessionId: string,
  threadId: string,
  message: ThreadMessage,
): NotebookTab[] {
  return tabs.map((tab) => {
    if (tab.sessionId !== sessionId || !tab.doc) return tab;
    const sections = tab.doc.sections.map((section) =>
      section.threads.some((t) => t.id === threadId)
        ? {
            ...section,
            threads: section.threads.map((t) =>
              t.id === threadId
                ? { ...t, messages: [...t.messages, message] }
                : t,
            ),
          }
        : section,
    );
    return { ...tab, doc: { ...tab.doc, sections } };
  });
}

// Forked-thread chat is grounded in the highlighted quote + the full section.
// The grounding context is folded into the first user turn so multi-turn history
// maps cleanly onto provider message roles.
function buildChatMessages(
  messages: ThreadMessage[],
  section: StudyGuideSection,
  quote: string,
): LLMMessage[] {
  const context = [
    "You are a study assistant helping a student understand a specific passage from their study guide.",
    "",
    `Section: "${section.title}"`,
    "",
    "The student highlighted (forked) this passage:",
    '"""',
    quote,
    '"""',
    "",
    "Full section content for context:",
    '"""',
    section.contentMd,
    '"""',
    "",
    "Answer the student's questions about the highlighted passage concisely and accurately. Use Markdown and LaTeX ($...$) where helpful.",
  ].join("\n");

  return messages.map((message, index) =>
    index === 0 && message.role === "user"
      ? {
          role: "user",
          content: `${context}\n\n---\n\nQuestion: ${message.content}`,
        }
      : { role: message.role, content: message.content },
  );
}

// Notebook-wide chat grounds answers in every section's content. The grounding
// is folded into the first user turn so history maps onto provider roles.
function buildNotebookChatMessages(
  messages: ThreadMessage[],
  doc: StudyGuideDocument,
): LLMMessage[] {
  const body = doc.sections
    .map((section) => `## ${section.title}\n\n${section.contentMd}`)
    .join("\n\n");

  const context = [
    `You are a study assistant for the course "${doc.meta.courseName || doc.meta.courseCode}".`,
    "Answer the student's questions using the study guide below. If something is not covered, say so rather than inventing facts.",
    "Use Markdown and LaTeX ($...$) where helpful, and cite the relevant section titles when useful.",
    "",
    "=== STUDY GUIDE ===",
    body,
    "=== END STUDY GUIDE ===",
  ].join("\n");

  return messages.map((message, index) =>
    index === 0 && message.role === "user"
      ? {
          role: "user",
          content: `${context}\n\n---\n\nQuestion: ${message.content}`,
        }
      : { role: message.role, content: message.content },
  );
}

export const useNotebooksStore = create<NotebooksState>((set, get) => ({
  tabs: [],
  activeSessionId: null,

  openNotebook: async (sessionId, fallbackTitle) => {
    const existing = get().tabs.find((tab) => tab.sessionId === sessionId);
    if (existing) {
      set({ activeSessionId: sessionId });
      return;
    }

    const loadingTab: NotebookTab = {
      sessionId,
      title: fallbackTitle ?? sessionId,
      status: "loading",
      view: "guide",
      chatMessages: [],
    };
    set((state) => ({
      tabs: [...state.tabs, loadingTab],
      activeSessionId: sessionId,
    }));

    try {
      const [doc, sources, chatMessages] = await Promise.all([
        loadStudyGuide(sessionId),
        loadSources(sessionId),
        loadNotebookChat(sessionId),
      ]);

      if (!doc) {
        set((state) => ({
          tabs: patchTab(state.tabs, sessionId, {
            status: "error",
            error: "No assembled study guide found for this session.",
          }),
        }));
        return;
      }

      set((state) => ({
        tabs: patchTab(state.tabs, sessionId, {
          status: "ready",
          doc,
          sources,
          chatMessages,
          title: doc.meta.courseCode || fallbackTitle || sessionId,
          activeSectionId: doc.sections[0]?.id,
        }),
      }));
    } catch (error) {
      set((state) => ({
        tabs: patchTab(state.tabs, sessionId, {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }),
      }));
    }
  },

  closeNotebook: (sessionId) => {
    set((state) => {
      const tabs = state.tabs.filter((tab) => tab.sessionId !== sessionId);
      let activeSessionId = state.activeSessionId;
      if (activeSessionId === sessionId) {
        activeSessionId = tabs.length > 0 ? tabs[tabs.length - 1]!.sessionId : null;
      }
      return { tabs, activeSessionId };
    });
  },

  setActive: (sessionId) => set({ activeSessionId: sessionId }),

  setActiveSection: (sessionId, sectionId) =>
    set((state) => ({
      tabs: patchTab(state.tabs, sessionId, { activeSectionId: sectionId }),
    })),

  selectSource: (sessionId, sourceId) =>
    set((state) => ({
      tabs: patchTab(state.tabs, sessionId, { selectedSourceId: sourceId }),
    })),

  setView: (sessionId, view) =>
    set((state) => ({
      tabs: patchTab(state.tabs, sessionId, { view }),
    })),

  sendChatMessage: async (sessionId, text) => {
    const config = useSettingsStore.getState().config;
    if (!config) {
      throw new Error("No LLM is configured. Open settings to add one.");
    }

    const tab = get().tabs.find((t) => t.sessionId === sessionId);
    if (!tab?.doc) return;
    const doc = tab.doc;

    const userMessage: ThreadMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const history = [...tab.chatMessages, userMessage];
    set((state) => ({
      tabs: patchTab(state.tabs, sessionId, { chatMessages: history }),
    }));

    const persist = async (messages: ThreadMessage[]) => {
      if (!isTauriRuntime()) return;
      try {
        await saveNotebookChat(sessionId, messages);
      } catch (error) {
        console.warn("[notebooks] saveNotebookChat failed", error);
      }
    };
    await persist(history);

    const client = new LLMClient(config);
    const assistantId = crypto.randomUUID();
    let streamed = "";
    let started = false;

    try {
      const response = await client.stream(
        buildNotebookChatMessages(history, doc),
        (delta) => {
          streamed += delta;
          if (!started) {
            started = true;
            const assistantMessage: ThreadMessage = {
              id: assistantId,
              role: "assistant",
              content: streamed,
              createdAt: new Date().toISOString(),
            };
            set((state) => ({
              tabs: patchTab(state.tabs, sessionId, {
                chatMessages: [...history, assistantMessage],
              }),
            }));
            return;
          }
          set((state) => ({
            tabs: patchChatMessage(state.tabs, sessionId, assistantId, streamed),
          }));
        },
      );

      const assistantMessage: ThreadMessage = {
        id: assistantId,
        role: "assistant",
        content: response.content || streamed,
        createdAt: new Date().toISOString(),
      };

      const next = [...history, assistantMessage];
      set((state) => ({
        tabs: patchTab(state.tabs, sessionId, { chatMessages: next }),
      }));
      await persist(next);
    } catch (error) {
      // Drop the partial assistant message so a failed send can be retried.
      set((state) => ({
        tabs: patchTab(state.tabs, sessionId, { chatMessages: history }),
      }));
      throw error;
    }
  },

  createThread: async (sessionId, sectionId, anchor) => {
    const tab = get().tabs.find((t) => t.sessionId === sessionId);
    if (!tab?.doc) return;

    const thread: InlineThread = {
      id: crypto.randomUUID(),
      anchorNodeId: anchor.nodeId,
      anchorStart: anchor.start,
      anchorEnd: anchor.end,
      anchorQuote: anchor.quote,
      messages: [],
      collapsed: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      tabs: state.tabs.map((t) => {
        if (t.sessionId !== sessionId || !t.doc) return t;
        const sections = t.doc.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                threads: [...section.threads, thread],
                analytics: {
                  ...section.analytics,
                  threadCount: section.threads.length + 1,
                },
              }
            : section,
        );
        return {
          ...t,
          doc: { ...t.doc, sections },
          activeThreadId: thread.id,
        };
      }),
    }));

    if (isTauriRuntime()) {
      try {
        await saveThread(sessionId, sectionId, thread);
      } catch (error) {
        console.warn("[notebooks] saveThread failed", error);
      }
    }
  },

  openThread: (sessionId, threadId) =>
    set((state) => ({
      tabs: patchTab(state.tabs, sessionId, { activeThreadId: threadId }),
    })),

  closeThread: async (sessionId) => {
    const tab = get().tabs.find((t) => t.sessionId === sessionId);
    const threadId = tab?.activeThreadId;

    set((state) => ({
      tabs: patchTab(state.tabs, sessionId, { activeThreadId: undefined }),
    }));

    if (!tab?.doc || !threadId) return;

    let sectionId: string | undefined;
    let collapsed: InlineThread | undefined;
    for (const section of tab.doc.sections) {
      const found = section.threads.find((t) => t.id === threadId);
      if (found) {
        sectionId = section.id;
        collapsed = { ...found, collapsed: true };
        break;
      }
    }

    if (!sectionId || !collapsed) return;
    const collapsedThread = collapsed;

    set((state) => ({
      tabs: state.tabs.map((t) => {
        if (t.sessionId !== sessionId || !t.doc) return t;
        const sections = t.doc.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                threads: section.threads.map((th) =>
                  th.id === threadId ? collapsedThread : th,
                ),
              }
            : section,
        );
        return { ...t, doc: { ...t.doc, sections } };
      }),
    }));

    if (isTauriRuntime()) {
      try {
        await saveThread(sessionId, sectionId, collapsedThread);
      } catch (error) {
        console.warn("[notebooks] saveThread failed", error);
      }
    }
  },

  sendThreadMessage: async (sessionId, threadId, text) => {
    const config = useSettingsStore.getState().config;
    if (!config) {
      throw new Error("No LLM is configured. Open settings to add one.");
    }

    const tab = get().tabs.find((t) => t.sessionId === sessionId);
    const located = findThread(tab?.doc, threadId);
    if (!located) return;
    const { section, thread } = located;

    const userMessage: ThreadMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      tabs: appendMessage(state.tabs, sessionId, threadId, userMessage),
    }));

    const persist = async (updated: InlineThread) => {
      if (!isTauriRuntime()) return;
      try {
        await saveThread(sessionId, section.id, updated);
      } catch (error) {
        console.warn("[notebooks] saveThread failed", error);
      }
    };

    const history = [...thread.messages, userMessage];
    await persist({ ...thread, messages: history });

    const client = new LLMClient(config);
    const assistantId = crypto.randomUUID();
    let streamed = "";
    let started = false;

    const response = await client.stream(
      buildChatMessages(history, section, thread.anchorQuote),
      (delta) => {
        streamed += delta;
        if (!started) {
          started = true;
          set((state) => ({
            tabs: appendMessage(state.tabs, sessionId, threadId, {
              id: assistantId,
              role: "assistant",
              content: streamed,
              createdAt: new Date().toISOString(),
            }),
          }));
          return;
        }
        set((state) => ({
          tabs: patchThreadMessage(
            state.tabs,
            sessionId,
            threadId,
            assistantId,
            streamed,
          ),
        }));
      },
    );

    const assistantMessage: ThreadMessage = {
      id: assistantId,
      role: "assistant",
      content: response.content || streamed,
      createdAt: new Date().toISOString(),
    };

    if (started) {
      set((state) => ({
        tabs: patchThreadMessage(
          state.tabs,
          sessionId,
          threadId,
          assistantId,
          assistantMessage.content,
        ),
      }));
    } else {
      set((state) => ({
        tabs: appendMessage(state.tabs, sessionId, threadId, assistantMessage),
      }));
    }

    await persist({
      ...thread,
      messages: [...history, assistantMessage],
    });
  },
}));
