// Resolves a DOM text selection back to character offsets in a content node's
// RAW markdown, using the data-* attributes emitted by GuideNode:
//   data-node-id              on each node root
//   data-raw-start            on every offset-bearing span
//   data-raw-end + data-atomic on styled/atomic spans (math, code, bold, blocks)
//
// Plain "text" spans render 1:1 with their raw slice, so an offset within their
// text node maps directly. Atomic spans snap to their raw start/end.

export interface SelectionAnchor {
  nodeId: string;
  start: number;
  end: number;
  quote: string;
}

function elementFrom(node: Node | null): HTMLElement | null {
  if (!node) return null;
  return node.nodeType === Node.TEXT_NODE
    ? node.parentElement
    : (node as HTMLElement);
}

function findNodeId(node: Node | null): string | null {
  let el = elementFrom(node);
  while (el) {
    const id = el.getAttribute("data-node-id");
    if (id) return id;
    el = el.parentElement;
  }
  return null;
}

function findRawSpan(node: Node | null): HTMLElement | null {
  let el = elementFrom(node);
  while (el) {
    if (el.hasAttribute("data-raw-start")) return el;
    el = el.parentElement;
  }
  return null;
}

function pointOffset(
  container: Node,
  offset: number,
  isEnd: boolean,
): number | null {
  const span = findRawSpan(container);
  if (!span) return null;

  const rawStart = Number(span.getAttribute("data-raw-start"));

  if (span.hasAttribute("data-atomic")) {
    const rawEnd = Number(span.getAttribute("data-raw-end"));
    return isEnd ? rawEnd : rawStart;
  }

  // Plain text span: its single text node mirrors the raw slice 1:1.
  if (container.nodeType === Node.TEXT_NODE) {
    return rawStart + offset;
  }

  // Element boundary: offset is a child index, snap to span start/end.
  if (offset <= 0) return rawStart;
  return rawStart + (span.textContent?.length ?? 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function resolveSelectionAnchor(
  getNodeRaw: (nodeId: string) => string | undefined,
): SelectionAnchor | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const nodeId = findNodeId(range.startContainer);
  if (!nodeId) return null;

  const raw = getNodeRaw(nodeId);
  if (raw === undefined) return null;

  const sameNode = findNodeId(range.endContainer) === nodeId;
  let start = pointOffset(range.startContainer, range.startOffset, false);
  // Cross-node selections are clamped to the end of the anchor node.
  let end = sameNode
    ? pointOffset(range.endContainer, range.endOffset, true)
    : raw.length;

  if (start === null || end === null) return null;
  if (start > end) {
    [start, end] = [end, start];
  }

  start = clamp(start, 0, raw.length);
  end = clamp(end, 0, raw.length);
  if (start === end) return null;

  return { nodeId, start, end, quote: raw.slice(start, end) };
}
