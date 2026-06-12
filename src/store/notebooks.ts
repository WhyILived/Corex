import { create } from "zustand";
import {
  loadNotebookChat,
  loadStudyGuide,
  saveNotebookChat,
  saveThread,
  updateSectionAnalytics,
  type InlineThread,
  type StudyGuideDocument,
  type StudyGuideSection,
  type ThreadMessage,
} from "../assembler/assembler";
import { deleteSession, loadSources } from "../scope/pipeline";
import type { SourceManifest } from "../types";
import type { SelectionAnchor } from "../lib/selection";
import { isTauriRuntime } from "../lib/env";
import { sanitizeChatReply, sanitizeMarkdown, stripHeavyAssets } from "../lib/sanitize";
import { clampChars } from "../lib/text";
import { LLMClient, type LLMMessage } from "../llm/client";
import { extractJsonPayload } from "../llm/json";
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
  deleteNotebook: (sessionId: string) => Promise<void>;
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

// Shared assistant behaviour, kept in the SYSTEM prompt. We force the model
// into provider-level JSON mode (AskOptions.json) and ask for a {"reply": ...}
// object: the decoder is constrained to emit JSON, so chain-of-thought can't
// leak around the answer the way it does with free-form text — no fragile
// output-scrubbing required. The reply field is extracted with the client's
// JSON parser (which also repairs LaTeX backslashes).
const CHAT_BEHAVIOUR = [
  "Respond naturally and conversationally, like a helpful tutor.",
  "For greetings, thanks, or small talk, reply warmly and briefly and invite a question about the material — never refuse these.",
  "For questions about the course material, answer using the provided study guide; if a factual question genuinely isn't covered, say so rather than inventing facts.",
  "Use Markdown and LaTeX ($...$) where helpful.",
  'Respond with a SINGLE JSON object and nothing else, of exactly the form {"reply": "<your full reply to the student>"}. Put your entire answer (Markdown allowed) in the "reply" string. Do not add any other keys, prose, planning, or commentary outside the JSON.',
];

// Parses the model's JSON reply, salvaging with the heuristic scrub only if the
// model ignored the JSON contract (e.g. a provider without enforced JSON mode).
function extractReply(raw: string): string {
  const parsed = extractJsonPayload<{ reply?: unknown }>(raw, "object");
  if (parsed && typeof parsed.reply === "string" && parsed.reply.trim()) {
    return parsed.reply.trim();
  }
  return sanitizeChatReply(raw);
}

// Maps stored chat history straight onto provider message roles. All grounding
// lives in the system prompt, so each turn is just its own content.
function toLLMMessages(messages: ThreadMessage[]): LLMMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

// System prompt for forked-thread chat: grounded in the highlighted quote + the
// full section.
function threadChatSystem(section: StudyGuideSection, quote: string): string {
  return [
    "You are a friendly study assistant helping a student understand a specific passage from their study guide.",
    ...CHAT_BEHAVIOUR,
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
    clampChars(
      stripHeavyAssets(sanitizeMarkdown(section.contentMd)),
      60000,
      "thread context",
    ),
    '"""',
  ].join("\n");
}

// System prompt for notebook-wide chat: grounded in every section's content.
function notebookChatSystem(doc: StudyGuideDocument): string {
  // Cap the grounding so a large guide can't push the chat request past the
  // model's context window.
  const body = clampChars(
    doc.sections
      .map(
        (section) =>
          `## ${section.title}\n\n${stripHeavyAssets(sanitizeMarkdown(section.contentMd))}`,
      )
      .join("\n\n"),
    120000,
    "notebook chat context",
  );

  return [
    `You are a friendly study assistant for the course "${doc.meta.courseName || doc.meta.courseCode}".`,
    ...CHAT_BEHAVIOUR,
    "Cite the relevant section titles when useful.",
    "",
    "=== STUDY GUIDE ===",
    body,
    "=== END STUDY GUIDE ===",
  ].join("\n");
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

  deleteNotebook: async (sessionId) => {
    // Close any open tab first so the UI doesn't hold a now-deleted notebook,
    // then remove every file the session wrote (sources, drafts, guide, chat).
    get().closeNotebook(sessionId);
    if (isTauriRuntime()) {
      await deleteSession(sessionId);
    }
  },

  setActive: (sessionId) => set({ activeSessionId: sessionId }),

  setActiveSection: (sessionId, sectionId) => {
    const tab = get().tabs.find((t) => t.sessionId === sessionId);
    const isNewVisit = tab?.activeSectionId !== sectionId;
    const visitedAt = new Date().toISOString();

    set((state) => ({
      tabs: state.tabs.map((t) => {
        if (t.sessionId !== sessionId) return t;
        if (!isNewVisit || !t.doc) {
          return { ...t, activeSectionId: sectionId };
        }
        const sections = t.doc.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                analytics: {
                  ...section.analytics,
                  visits: section.analytics.visits + 1,
                  lastVisitedAt: visitedAt,
                },
              }
            : section,
        );
        return {
          ...t,
          activeSectionId: sectionId,
          doc: { ...t.doc, sections },
        };
      }),
    }));

    if (isNewVisit && tab?.doc && isTauriRuntime()) {
      void updateSectionAnalytics(sessionId, sectionId, {
        visits: 1,
        lastVisitedAt: visitedAt,
      }).catch((error) =>
        console.warn("[notebooks] analytics update failed", error),
      );
    }
  },

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

    try {
      // Non-streamed JSON call: the reply is constrained to a JSON field so
      // reasoning can't leak around it. The chat UI shows a typing indicator
      // (waitingForFirstToken) until this assistant message is appended.
      const response = await client.complete(toLLMMessages(history), {
        system: notebookChatSystem(doc),
        json: true,
      });

      const assistantMessage: ThreadMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: extractReply(response.content),
        createdAt: new Date().toISOString(),
      };

      if (!assistantMessage.content.trim()) {
        throw new Error("The model returned an empty response.");
      }

      const next = [...history, assistantMessage];
      set((state) => ({
        tabs: patchTab(state.tabs, sessionId, { chatMessages: next }),
      }));
      await persist(next);
    } catch (error) {
      // Drop the failed user turn so a retry doesn't stack unanswered messages
      // or break providers that require strictly alternating user/assistant
      // roles.
      set((state) => ({
        tabs: patchTab(state.tabs, sessionId, { chatMessages: tab.chatMessages }),
      }));
      await persist(tab.chatMessages);
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

    try {
      const response = await client.complete(toLLMMessages(history), {
        system: threadChatSystem(section, thread.anchorQuote),
        json: true,
      });

      const assistantMessage: ThreadMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: extractReply(response.content),
        createdAt: new Date().toISOString(),
      };

      if (!assistantMessage.content.trim()) {
        throw new Error("The model returned an empty response.");
      }

      set((state) => ({
        tabs: appendMessage(state.tabs, sessionId, threadId, assistantMessage),
      }));

      await persist({
        ...thread,
        messages: [...history, assistantMessage],
      });
    } catch (error) {
      // Revert to the thread's pre-send messages so a failed turn isn't left
      // dangling (which would stack consecutive user messages on retry).
      set((state) => ({
        tabs: state.tabs.map((tab) => {
          if (tab.sessionId !== sessionId || !tab.doc) return tab;
          const sections = tab.doc.sections.map((sec) =>
            sec.threads.some((t) => t.id === threadId)
              ? {
                  ...sec,
                  threads: sec.threads.map((t) =>
                    t.id === threadId ? { ...t, messages: thread.messages } : t,
                  ),
                }
              : sec,
          );
          return { ...tab, doc: { ...tab.doc, sections } };
        }),
      }));
      await persist({ ...thread, messages: thread.messages });
      throw error;
    }
  },
}));
