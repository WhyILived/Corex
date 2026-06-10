import { useEffect, useState, type RefObject } from "react";
import { resolveSelectionAnchor, type SelectionAnchor } from "../lib/selection";

interface ForkBubbleProps {
  containerRef: RefObject<HTMLDivElement | null>;
  getNodeRaw: (nodeId: string) => string | undefined;
  onFork: (anchor: SelectionAnchor) => void;
}

export function ForkBubble({
  containerRef,
  getNodeRaw,
  onFork,
}: ForkBubbleProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleMouseUp() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPos(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setPos(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }

      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const hide = () => setPos(null);
    container.addEventListener("scroll", hide);
    return () => container.removeEventListener("scroll", hide);
  }, [containerRef]);

  if (!pos) return null;

  return (
    <div
      className="fork-bubble"
      style={{ left: pos.x, top: pos.y }}
      // Keep the selection alive when pressing the button.
      onMouseDown={(event) => event.preventDefault()}
    >
      <button
        onClick={() => {
          const anchor = resolveSelectionAnchor(getNodeRaw);
          if (anchor) onFork(anchor);
          window.getSelection()?.removeAllRanges();
          setPos(null);
        }}
      >
        {"\u270e"} Fork
      </button>
    </div>
  );
}
