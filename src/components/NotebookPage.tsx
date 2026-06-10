import { useNotebooksStore, type NotebookTab } from "../store/notebooks";
import { ContentNav } from "./ContentNav";
import { SourcesNav } from "./SourcesNav";
import { MainPane } from "./MainPane";
import { ThreadPanel } from "./ThreadPanel";
import { ChatPage } from "./ChatPage";

interface NotebookPageProps {
  tab: NotebookTab;
}

export function NotebookPage({ tab }: NotebookPageProps) {
  if (tab.status === "loading") {
    return (
      <div className="notebook-page notebook-centered">
        <p className="muted">Loading notebook…</p>
      </div>
    );
  }

  if (tab.status === "error") {
    return (
      <div className="notebook-page notebook-centered">
        <p className="muted">{tab.error ?? "Failed to load notebook."}</p>
      </div>
    );
  }

  return (
    <div className="notebook-page">
      <aside className="sidebar">
        <ViewToggle tab={tab} />
        <ContentNav tab={tab} />
        <SourcesNav tab={tab} />
      </aside>
      {tab.view === "chat" ? (
        <ChatPage tab={tab} />
      ) : (
        <>
          <MainPane tab={tab} />
          <ThreadPanel tab={tab} />
        </>
      )}
    </div>
  );
}

function ViewToggle({ tab }: NotebookPageProps) {
  const setView = useNotebooksStore((s) => s.setView);
  return (
    <div className="view-toggle" role="tablist">
      <button
        role="tab"
        aria-selected={tab.view === "guide"}
        className={tab.view === "guide" ? "active" : ""}
        onClick={() => setView(tab.sessionId, "guide")}
      >
        Guide
      </button>
      <button
        role="tab"
        aria-selected={tab.view === "chat"}
        className={tab.view === "chat" ? "active" : ""}
        onClick={() => setView(tab.sessionId, "chat")}
      >
        Chat
      </button>
    </div>
  );
}
