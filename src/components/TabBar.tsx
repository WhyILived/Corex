import { useNotebooksStore } from "../store/notebooks";

interface TabBarProps {
  onNewTab: () => void;
}

export function TabBar({ onNewTab }: TabBarProps) {
  const tabs = useNotebooksStore((state) => state.tabs);
  const activeSessionId = useNotebooksStore((state) => state.activeSessionId);
  const setActive = useNotebooksStore((state) => state.setActive);
  const closeNotebook = useNotebooksStore((state) => state.closeNotebook);

  return (
    <div className="tabbar" role="tablist">
      {tabs.map((tab) => {
        const active = tab.sessionId === activeSessionId;
        return (
          <div
            key={tab.sessionId}
            role="tab"
            aria-selected={active}
            className={`tab${active ? " tab-active" : ""}`}
            onClick={() => setActive(tab.sessionId)}
          >
            <span className="tab-title" title={tab.title}>
              {tab.status === "loading" ? "Loading…" : tab.title}
            </span>
            <button
              className="tab-close"
              aria-label="Close notebook"
              onClick={(event) => {
                event.stopPropagation();
                closeNotebook(tab.sessionId);
              }}
            >
              {"\u00d7"}
            </button>
          </div>
        );
      })}
      <button className="tab-new" aria-label="Open notebook" onClick={onNewTab}>
        +
      </button>
    </div>
  );
}
