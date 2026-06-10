import type { NotebookTab } from "../store/notebooks";
import { useNotebooksStore } from "../store/notebooks";

interface ContentNavProps {
  tab: NotebookTab;
}

export function ContentNav({ tab }: ContentNavProps) {
  const setActiveSection = useNotebooksStore((state) => state.setActiveSection);
  const sections = tab.doc?.sections ?? [];

  return (
    <nav className="nav-block" aria-label="Contents">
      <h3 className="nav-heading">Contents</h3>
      {sections.length === 0 ? (
        <p className="muted small">No sections.</p>
      ) : (
        <ul className="nav-list">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                className={`nav-item${
                  section.id === tab.activeSectionId ? " nav-item-active" : ""
                }`}
                onClick={() => {
                  setActiveSection(tab.sessionId, section.id);
                  document
                    .getElementById(`section-${section.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="nav-item-title">{section.title}</span>
                {section.warnings.length > 0 && (
                  <span className="nav-badge" title="Has warnings">
                    !
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
