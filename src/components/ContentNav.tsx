import type { NotebookTab } from "../store/notebooks";
import { useNotebooksStore } from "../store/notebooks";

function weightClass(percent: number): string {
  if (percent >= 15) return "weight-high";
  if (percent >= 10) return "weight-mid";
  return "weight-low";
}

interface ContentNavProps {
  tab: NotebookTab;
}

export function ContentNav({ tab }: ContentNavProps) {
  const setActiveSection = useNotebooksStore((state) => state.setActiveSection);
  const setView = useNotebooksStore((state) => state.setView);
  const sections = tab.doc?.sections ?? [];

  const visited = sections.filter((s) => s.analytics.visits > 0).length;
  const progressPct =
    sections.length > 0 ? Math.round((visited / sections.length) * 100) : 0;

  const goToSection = (sectionId: string) => {
    setActiveSection(tab.sessionId, sectionId);
    if (tab.view !== "guide") setView(tab.sessionId, "guide");
    // Wait a frame so the guide is mounted when switching from chat view.
    requestAnimationFrame(() => {
      document
        .getElementById(`section-${sectionId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <aside className="content-panel" aria-label="Contents">
      <div className="page-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab.view === "guide"}
          className={`page-tab${tab.view === "guide" ? " page-tab-active" : ""}`}
          onClick={() => setView(tab.sessionId, "guide")}
        >
          Guide
        </button>
        <button
          role="tab"
          aria-selected={tab.view === "chat"}
          className={`page-tab${tab.view === "chat" ? " page-tab-active" : ""}`}
          onClick={() => setView(tab.sessionId, "chat")}
        >
          Chat
        </button>
      </div>

      <div className="content-list">
        {sections.length === 0 ? (
          <p className="muted small content-empty">No sections.</p>
        ) : (
          sections.map((section) => (
            <button
              key={section.id}
              className={`content-nav-item${
                section.id === tab.activeSectionId
                  ? " content-nav-item-active"
                  : ""
              }`}
              onClick={() => goToSection(section.id)}
              title={section.title}
            >
              <span className="content-nav-title">{section.title}</span>
              {section.warnings.length > 0 && (
                <span className="nav-badge" title="Has warnings">
                  !
                </span>
              )}
              <span className={`weight-badge ${weightClass(section.weightPercent)}`}>
                {Math.round(section.weightPercent)}%
              </span>
            </button>
          ))
        )}
      </div>

      {sections.length > 0 && (
        <div className="study-progress">
          <div className="study-progress-label">Study progress</div>
          <div className="study-progress-bar">
            <div style={{ width: `${progressPct}%` }} />
          </div>
          <div className="study-progress-count">
            {visited} of {sections.length} section
            {sections.length === 1 ? "" : "s"} visited
          </div>
        </div>
      )}
    </aside>
  );
}
