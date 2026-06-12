import { useState } from "react";
import type { NotebookTab } from "../store/notebooks";
import { useNotebooksStore } from "../store/notebooks";
import type { InputDocumentType, SourceManifestEntry } from "../types";
import {
  BookIcon,
  FileDescriptionIcon,
  FileTextIcon,
  PlusIcon,
  PresentationIcon,
} from "./icons";
import { SourcePreview } from "./SourcePreview";

const TYPE_LABEL: Record<InputDocumentType, string> = {
  course_outline: "outline",
  slides: "slides",
  past_exam: "past exam",
  textbook: "textbook",
  other: "file",
};

function TypeIcon({ type }: { type: InputDocumentType }) {
  switch (type) {
    case "course_outline":
      return <FileTextIcon />;
    case "slides":
      return <PresentationIcon />;
    case "past_exam":
      return <FileDescriptionIcon />;
    case "textbook":
      return <BookIcon />;
    default:
      return <FileTextIcon />;
  }
}

interface SourcesNavProps {
  tab: NotebookTab;
}

export function SourcesNav({ tab }: SourcesNavProps) {
  const selectSource = useNotebooksStore((state) => state.selectSource);
  const sources = tab.sources ?? [];
  const [preview, setPreview] = useState<SourceManifestEntry | null>(null);

  const openSource = (source: SourceManifestEntry) => {
    selectSource(tab.sessionId, source.id);
    setPreview(source);
  };

  return (
    <aside className="sources-panel" aria-label="Sources">
      <div className="panel-header">Sources</div>
      <div className="sources-list">
        {sources.length === 0 ? (
          <p className="muted small sources-empty">No source files.</p>
        ) : (
          sources.map((source) => (
            <button
              key={source.id}
              className={`source-item${
                source.id === tab.selectedSourceId ? " source-item-active" : ""
              }`}
              onClick={() => openSource(source)}
              title={`Preview ${source.filename}`}
            >
              <span className="source-icon">
                <TypeIcon type={source.type} />
              </span>
              <span className="source-text">
                <span className="source-label">{source.filename}</span>
                <span className="source-type">{TYPE_LABEL[source.type]}</span>
              </span>
            </button>
          ))
        )}
      </div>
      <div className="sources-footer">
        <button
          className="add-source"
          disabled
          title="Adding sources to an existing notebook isn't supported yet"
        >
          <PlusIcon /> Add source
        </button>
      </div>

      {preview && (
        <SourcePreview source={preview} onClose={() => setPreview(null)} />
      )}
    </aside>
  );
}
