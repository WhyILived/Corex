import type { NotebookTab } from "../store/notebooks";
import { useNotebooksStore } from "../store/notebooks";
import type { InputDocumentType } from "../types";

const TYPE_LABEL: Record<InputDocumentType, string> = {
  course_outline: "Outline",
  slides: "Slides",
  past_exam: "Exam",
  textbook: "Textbook",
  other: "File",
};

interface SourcesNavProps {
  tab: NotebookTab;
}

export function SourcesNav({ tab }: SourcesNavProps) {
  const selectSource = useNotebooksStore((state) => state.selectSource);
  const sources = tab.sources ?? [];

  return (
    <nav className="nav-block" aria-label="Sources">
      <h3 className="nav-heading">Sources</h3>
      {sources.length === 0 ? (
        <p className="muted small">No source files.</p>
      ) : (
        <ul className="nav-list">
          {sources.map((source) => (
            <li key={source.id}>
              <button
                className={`nav-item${
                  source.id === tab.selectedSourceId ? " nav-item-active" : ""
                }`}
                onClick={() => selectSource(tab.sessionId, source.id)}
                title={source.filename}
              >
                <span className="nav-item-title">{source.filename}</span>
                <span className="nav-tag">{TYPE_LABEL[source.type]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
