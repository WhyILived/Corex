import { useMemo, useRef } from "react";
import type { StudyGuideSection } from "../assembler/assembler";
import { useNotebooksStore, type NotebookTab } from "../store/notebooks";
import { GuideNode, type ThreadHighlight } from "./guide/GuideNode";
import { ForkBubble } from "./ForkBubble";

function SectionView({
  section,
  highlightsByNode,
  activeThreadId,
  onHighlightClick,
}: {
  section: StudyGuideSection;
  highlightsByNode: Map<string, ThreadHighlight[]>;
  activeThreadId?: string;
  onHighlightClick: (threadId: string) => void;
}) {
  return (
    <section id={`section-${section.id}`} className="guide-section">
      <header className="guide-section-header">
        <h2>{section.title}</h2>
        <span className="guide-section-meta">
          {section.depth} · {section.weightPercent}%
        </span>
      </header>

      {section.warnings.map((warning, index) => (
        <div key={index} className="guide-warning">
          {warning.message}
        </div>
      ))}

      <div className="guide-section-body">
        {section.nodes.length === 0 ? (
          <p className="muted">No content generated for this section.</p>
        ) : (
          section.nodes.map((node) => (
            <GuideNode
              key={node.id}
              node={node}
              highlights={highlightsByNode.get(node.id) ?? []}
              activeThreadId={activeThreadId}
              onHighlightClick={onHighlightClick}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface MainPaneProps {
  tab: NotebookTab;
}

export function MainPane({ tab }: MainPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const createThread = useNotebooksStore((s) => s.createThread);
  const openThread = useNotebooksStore((s) => s.openThread);

  const sections = tab.doc?.sections ?? [];

  const nodeRaw = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of sections) {
      for (const node of section.nodes) map.set(node.id, node.raw);
    }
    return map;
  }, [sections]);

  const nodeSection = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of sections) {
      for (const node of section.nodes) map.set(node.id, section.id);
    }
    return map;
  }, [sections]);

  const highlightsByNode = useMemo(() => {
    const map = new Map<string, ThreadHighlight[]>();
    for (const section of sections) {
      for (const thread of section.threads) {
        const list = map.get(thread.anchorNodeId) ?? [];
        list.push({
          start: thread.anchorStart,
          end: thread.anchorEnd,
          threadId: thread.id,
        });
        map.set(thread.anchorNodeId, list);
      }
    }
    return map;
  }, [sections]);

  return (
    <div className="main-pane" ref={containerRef}>
      <article className="guide">
        <h1 className="guide-title">
          {tab.doc?.meta.courseName ?? tab.title}
        </h1>
        {sections.map((section) => (
          <SectionView
            key={section.id}
            section={section}
            highlightsByNode={highlightsByNode}
            activeThreadId={tab.activeThreadId}
            onHighlightClick={(threadId) =>
              openThread(tab.sessionId, threadId)
            }
          />
        ))}
      </article>

      <ForkBubble
        containerRef={containerRef}
        getNodeRaw={(id) => nodeRaw.get(id)}
        onFork={(anchor) => {
          const sectionId = nodeSection.get(anchor.nodeId);
          if (sectionId) void createThread(tab.sessionId, sectionId, anchor);
        }}
      />
    </div>
  );
}
