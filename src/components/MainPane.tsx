import { useMemo, useRef } from "react";
import {
  parseContentNodes,
  type ContentNode,
  type StudyGuideSection,
} from "../assembler/assembler";
import { useNotebooksStore, type NotebookTab } from "../store/notebooks";
import { sanitizeMarkdown } from "../lib/sanitize";
import { GuideNode, type ThreadHighlight } from "./guide/GuideNode";
import { ForkBubble } from "./ForkBubble";

function SectionView({
  section,
  nodes,
  highlightsByNode,
  activeThreadId,
  onHighlightClick,
}: {
  section: StudyGuideSection;
  nodes: ContentNode[];
  highlightsByNode: Map<string, ThreadHighlight[]>;
  activeThreadId?: string;
  onHighlightClick: (threadId: string) => void;
}) {
  const threadCount = section.threads.length;

  return (
    <section id={`section-${section.id}`} className="guide-section">
      <header className="guide-section-header">
        <h2 className="guide-section-title">{section.title}</h2>
        <div className="guide-section-meta">
          <span className={`depth-badge depth-${section.depth}`}>
            {section.depth}
          </span>
          {section.weekOrUnit && <span>{section.weekOrUnit}</span>}
          <span className="meta-dot">·</span>
          <span>{Math.round(section.weightPercent)}% of exam marks</span>
          {threadCount > 0 && (
            <>
              <span className="meta-dot">·</span>
              <span>
                {threadCount} thread{threadCount === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      </header>

      {section.warnings.map((warning, index) => (
        <div key={index} className="guide-warning">
          {warning.message}
        </div>
      ))}

      <div className="guide-section-body">
        {nodes.length === 0 ? (
          <p className="muted">No content generated for this section.</p>
        ) : (
          nodes.map((node) => (
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

  // Re-parse content live so already-assembled (old) notebooks pick up parser
  // improvements (tables, horizontal rules, italics, nested lists) without
  // needing to regenerate. parseContentNodes is deterministic and uses the same
  // id scheme used at assemble time, so fork anchors stay aligned for unchanged
  // structure.
  const nodesBySection = useMemo(() => {
    const map = new Map<string, ContentNode[]>();
    for (const section of sections) {
      map.set(
        section.id,
        parseContentNodes(section.id, sanitizeMarkdown(section.contentMd)),
      );
    }
    return map;
  }, [sections]);

  const nodeRaw = useMemo(() => {
    const map = new Map<string, string>();
    for (const nodes of nodesBySection.values()) {
      for (const node of nodes) map.set(node.id, node.raw);
    }
    return map;
  }, [nodesBySection]);

  const nodeSection = useMemo(() => {
    const map = new Map<string, string>();
    for (const [sectionId, nodes] of nodesBySection) {
      for (const node of nodes) map.set(node.id, sectionId);
    }
    return map;
  }, [nodesBySection]);

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
            nodes={nodesBySection.get(section.id) ?? []}
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
