import type { ReactNode } from "react";
import type { ContentNode } from "../../assembler/assembler";
import { renderKatex } from "../../lib/katex";

// Inline markdown is tokenized so each rendered fragment carries its offset into
// the node's RAW markdown. Plain "text" fragments render 1:1 (rendered length ==
// raw length), so a selection inside them maps directly to a raw offset. Styled
// fragments (math/code/bold) are "atomic": a selection touching them snaps to
// their raw start/end. Only math, inline code, and bold are parsed — single "*"
// and "_" are left as text to avoid false positives in technical content
// (multiplication, snake_case identifiers).

export interface ThreadHighlight {
  start: number;
  end: number;
  threadId: string;
}

interface HighlightCtx {
  highlights: ThreadHighlight[];
  activeThreadId?: string;
  onHighlightClick?: (threadId: string) => void;
}

type InlineTokenType = "text" | "math" | "code" | "bold";

interface InlineToken {
  type: InlineTokenType;
  rawStart: number;
  rawEnd: number;
  inner: string;
}

function tokenizeInline(source: string, base: number): InlineToken[] {
  const tokens: InlineToken[] = [];
  let textStart = 0;
  let i = 0;

  const flushText = (end: number) => {
    if (end > textStart) {
      tokens.push({
        type: "text",
        rawStart: base + textStart,
        rawEnd: base + end,
        inner: source.slice(textStart, end),
      });
    }
  };

  while (i < source.length) {
    const c = source[i]!;

    if (c === "`") {
      const close = source.indexOf("`", i + 1);
      if (close !== -1) {
        flushText(i);
        tokens.push({
          type: "code",
          rawStart: base + i,
          rawEnd: base + close + 1,
          inner: source.slice(i + 1, close),
        });
        i = close + 1;
        textStart = i;
        continue;
      }
    }

    if (c === "$" && source[i + 1] !== "$") {
      const close = source.indexOf("$", i + 1);
      if (close !== -1) {
        flushText(i);
        tokens.push({
          type: "math",
          rawStart: base + i,
          rawEnd: base + close + 1,
          inner: source.slice(i + 1, close),
        });
        i = close + 1;
        textStart = i;
        continue;
      }
    }

    if (c === "*" && source[i + 1] === "*") {
      const close = source.indexOf("**", i + 2);
      if (close !== -1) {
        flushText(i);
        tokens.push({
          type: "bold",
          rawStart: base + i,
          rawEnd: base + close + 2,
          inner: source.slice(i + 2, close),
        });
        i = close + 2;
        textStart = i;
        continue;
      }
    }

    i += 1;
  }

  flushText(source.length);
  return tokens;
}

function coveringHighlight(
  start: number,
  end: number,
  highlights: ThreadHighlight[],
): ThreadHighlight | undefined {
  return highlights.find((h) => h.start <= start && h.end >= end && h.end > h.start);
}

function overlappingHighlight(
  start: number,
  end: number,
  highlights: ThreadHighlight[],
): ThreadHighlight | undefined {
  return highlights.find((h) => h.end > start && h.start < end);
}

function highlightClassName(
  highlight: ThreadHighlight,
  ctx: HighlightCtx,
): string {
  return `fork-highlight${
    ctx.activeThreadId === highlight.threadId ? " fork-highlight-active" : ""
  }`;
}

function highlightProps(highlight: ThreadHighlight, ctx: HighlightCtx) {
  return {
    "data-thread-id": highlight.threadId,
    className: highlightClassName(highlight, ctx),
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      ctx.onHighlightClick?.(highlight.threadId);
    },
  };
}

function renderTextToken(
  token: InlineToken,
  ctx: HighlightCtx,
  keyBase: string,
): ReactNode[] {
  const relevant = ctx.highlights.filter(
    (h) => h.end > token.rawStart && h.start < token.rawEnd,
  );

  if (relevant.length === 0) {
    return [
      <span key={keyBase} data-raw-start={String(token.rawStart)}>
        {token.inner}
      </span>,
    ];
  }

  const points = new Set<number>([token.rawStart, token.rawEnd]);
  for (const h of relevant) {
    points.add(Math.max(h.start, token.rawStart));
    points.add(Math.min(h.end, token.rawEnd));
  }
  const sorted = [...points].sort((a, b) => a - b);

  const out: ReactNode[] = [];
  for (let k = 0; k < sorted.length - 1; k++) {
    const a = sorted[k]!;
    const b = sorted[k + 1]!;
    if (b <= a) continue;

    const text = token.inner.slice(a - token.rawStart, b - token.rawStart);
    const cover = coveringHighlight(a, b, relevant);

    if (cover) {
      out.push(
        <span key={`${keyBase}_${a}`} data-raw-start={String(a)} {...highlightProps(cover, ctx)}>
          {text}
        </span>,
      );
    } else {
      out.push(
        <span key={`${keyBase}_${a}`} data-raw-start={String(a)}>
          {text}
        </span>,
      );
    }
  }
  return out;
}

function renderInline(tokens: InlineToken[], ctx: HighlightCtx): ReactNode[] {
  const out: ReactNode[] = [];

  tokens.forEach((token, index) => {
    const key = `${token.rawStart}_${index}`;

    if (token.type === "text") {
      out.push(...renderTextToken(token, ctx, key));
      return;
    }

    const cover = overlappingHighlight(token.rawStart, token.rawEnd, ctx.highlights);
    const onClick = cover
      ? (event: React.MouseEvent) => {
          event.stopPropagation();
          ctx.onHighlightClick?.(cover.threadId);
        }
      : undefined;
    const threadId = cover?.threadId;

    switch (token.type) {
      case "math":
        out.push(
          <span
            key={key}
            data-raw-start={String(token.rawStart)}
            data-raw-end={String(token.rawEnd)}
            data-atomic="true"
            data-thread-id={threadId}
            className={`katex-inline${cover ? " " + highlightClassName(cover, ctx) : ""}`}
            onClick={onClick}
            dangerouslySetInnerHTML={{ __html: renderKatex(token.inner, false) }}
          />,
        );
        break;
      case "code":
        out.push(
          <code
            key={key}
            data-raw-start={String(token.rawStart)}
            data-raw-end={String(token.rawEnd)}
            data-atomic="true"
            data-thread-id={threadId}
            className={`node-inline-code${cover ? " " + highlightClassName(cover, ctx) : ""}`}
            onClick={onClick}
          >
            {token.inner}
          </code>,
        );
        break;
      case "bold":
        out.push(
          <strong
            key={key}
            data-raw-start={String(token.rawStart)}
            data-raw-end={String(token.rawEnd)}
            data-atomic="true"
            data-thread-id={threadId}
            className={cover ? highlightClassName(cover, ctx) : undefined}
            onClick={onClick}
          >
            {token.inner}
          </strong>,
        );
        break;
    }
  });

  return out;
}

interface GuideNodeProps {
  node: ContentNode;
  highlights?: ThreadHighlight[];
  activeThreadId?: string;
  onHighlightClick?: (threadId: string) => void;
}

export function GuideNode({
  node,
  highlights = [],
  activeThreadId,
  onHighlightClick,
}: GuideNodeProps) {
  const ctx: HighlightCtx = { highlights, activeThreadId, onHighlightClick };

  switch (node.type) {
    case "heading": {
      const prefix = node.raw.match(/^(#{1,6})\s+/);
      const prefixLen = prefix ? prefix[0].length : 0;
      const level = Math.min(Math.max(node.level ?? 2, 2), 4);
      const children = renderInline(
        tokenizeInline(node.raw.slice(prefixLen), prefixLen),
        ctx,
      );
      if (level === 2)
        return (
          <h2 data-node-id={node.id} data-node-type="heading" className="node-heading">
            {children}
          </h2>
        );
      if (level === 3)
        return (
          <h3 data-node-id={node.id} data-node-type="heading" className="node-heading">
            {children}
          </h3>
        );
      return (
        <h4 data-node-id={node.id} data-node-type="heading" className="node-heading">
          {children}
        </h4>
      );
    }

    case "formula_block": {
      const inner = node.raw
        .replace(/^\s*\$\$/, "")
        .replace(/\$\$\s*$/, "")
        .trim();
      const cover = highlights[0];
      return (
        <div
          data-node-id={node.id}
          data-node-type="formula_block"
          data-raw-start="0"
          data-raw-end={String(node.raw.length)}
          data-atomic="true"
          className={`node-formula-block${cover ? " " + highlightClassName(cover, ctx) : ""}`}
          {...(cover
            ? {
                "data-thread-id": cover.threadId,
                onClick: () => onHighlightClick?.(cover.threadId),
              }
            : {})}
          dangerouslySetInnerHTML={{ __html: renderKatex(inner, true) }}
        />
      );
    }

    case "code": {
      const inner = node.raw.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
      const cover = highlights[0];
      return (
        <pre
          data-node-id={node.id}
          data-node-type="code"
          data-raw-start="0"
          data-raw-end={String(node.raw.length)}
          data-atomic="true"
          className={`node-code${cover ? " " + highlightClassName(cover, ctx) : ""}`}
          {...(cover
            ? {
                "data-thread-id": cover.threadId,
                onClick: () => onHighlightClick?.(cover.threadId),
              }
            : {})}
        >
          <code>{inner}</code>
        </pre>
      );
    }

    case "list": {
      const lines = node.raw.split("\n");
      let cursor = 0;
      const items = lines.map((line, index) => {
        const lineStart = cursor;
        cursor += line.length + 1;
        const marker = line.match(/^(\s*)([-*]|\d+\.)\s+/);
        const markerLen = marker ? marker[0].length : 0;
        const tokens = tokenizeInline(
          line.slice(markerLen),
          lineStart + markerLen,
        );
        return <li key={index}>{renderInline(tokens, ctx)}</li>;
      });
      return (
        <ul data-node-id={node.id} data-node-type="list" className="node-list">
          {items}
        </ul>
      );
    }

    case "figure": {
      const match = node.raw.match(/^!\[([^\]]*)\]\(([^)]*)\)/);
      const alt = match?.[1] ?? "";
      const src = match?.[2] ?? "";
      const cover = highlights[0];
      return (
        <figure
          data-node-id={node.id}
          data-node-type="figure"
          data-raw-start="0"
          data-raw-end={String(node.raw.length)}
          data-atomic="true"
          className={`node-figure${cover ? " " + highlightClassName(cover, ctx) : ""}`}
          {...(cover
            ? {
                "data-thread-id": cover.threadId,
                onClick: () => onHighlightClick?.(cover.threadId),
              }
            : {})}
        >
          <img src={src} alt={alt} />
          {alt && <figcaption>{alt}</figcaption>}
        </figure>
      );
    }

    default:
      return (
        <p
          data-node-id={node.id}
          data-node-type="paragraph"
          className="node-paragraph"
        >
          {renderInline(tokenizeInline(node.raw, 0), ctx)}
        </p>
      );
  }
}
