import type { NotebookTab } from "../store/notebooks";
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
      <SourcesNav tab={tab} />
      <ContentNav tab={tab} />
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
