import type { ReactNode } from "react";
import { parseMarkdownTable, type ContentNode } from "../../assembler/assembler";
import { renderKatex } from "../../lib/katex";

// Inline markdown is tokenized so each rendered fragment carries its offset into
// the node's RAW markdown. Plain "text" fragments render 1:1 (rendered length ==
// raw length), so a selection inside them maps directly to a raw offset. Styled
// fragments (math/code) are "atomic": a selection touching them snaps to their
// raw start/end. Bold and italic render their children with preserved offsets.
// Math, inline code, bold (**) and italic (* or _) are parsed; a "*" used as
// multiplication and "_" inside identifiers (snake_case) are kept as text via
// adjacency checks to avoid false positives in technical content.

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

type InlineTokenType =
  | "text"
  | "math"
  | "code"
  | "bold"
  | "italic"
  | "strike"
  | "link";

interface InlineToken {
  type: InlineTokenType;
  rawStart: number;
  rawEnd: number;
  inner: string;
  url?: string; // for "link" tokens
}

// Only allow safe link schemes; anything else falls back to plain text.
const SAFE_LINK_RE = /^(https?:|mailto:)/i;
const INLINE_LINK_RE = /^\[([^\]]*)\]\(([^)\s]+)\)/;

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

    if (c === "[") {
      const m = source.slice(i).match(INLINE_LINK_RE);
      if (m) {
        flushText(i);
        tokens.push({
          type: "link",
          rawStart: base + i,
          rawEnd: base + i + m[0].length,
          inner: m[1] ?? "",
          url: m[2] ?? "",
        });
        i += m[0].length;
        textStart = i;
        continue;
      }
    }

    if (c === "~" && source[i + 1] === "~") {
      const close = source.indexOf("~~", i + 2);
      if (close > i + 1) {
        flushText(i);
        tokens.push({
          type: "strike",
          rawStart: base + i,
          rawEnd: base + close + 2,
          inner: source.slice(i + 2, close),
        });
        i = close + 2;
        textStart = i;
        continue;
      }
    }

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

    // Single-* italic. Skip "**" (handled above) and reject "a * b" style
    // multiplication by requiring non-space immediately inside both delimiters.
    if (c === "*" && source[i + 1] !== "*") {
      const close = source.indexOf("*", i + 1);
      if (
        close > i + 1 &&
        source[i + 1] !== " " &&
        source[i + 1] !== "\t" &&
        source[close - 1] !== " " &&
        source[close - 1] !== "\t"
      ) {
        flushText(i);
        tokens.push({
          type: "italic",
          rawStart: base + i,
          rawEnd: base + close + 1,
          inner: source.slice(i + 1, close),
        });
        i = close + 1;
        textStart = i;
        continue;
      }
    }

    // Underscore italic. Require word boundaries so snake_case identifiers
    // (foo_bar_baz) and mid-word underscores aren't treated as emphasis.
    if (c === "_" && !/[A-Za-z0-9]/.test(source[i - 1] ?? "")) {
      let close = -1;
      for (let j = i + 1; j < source.length; j++) {
        if (source[j] === "_" && !/[A-Za-z0-9]/.test(source[j + 1] ?? "")) {
          close = j;
          break;
        }
      }
      if (
        close > i + 1 &&
        source[i + 1] !== " " &&
        source[i + 1] !== "\t" &&
        source[close - 1] !== " " &&
        source[close - 1] !== "\t"
      ) {
        flushText(i);
        tokens.push({
          type: "italic",
          rawStart: base + i,
          rawEnd: base + close + 1,
          inner: source.slice(i + 1, close),
        });
        i = close + 1;
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
            data-thread-id={threadId}
            className={cover ? highlightClassName(cover, ctx) : undefined}
            onClick={onClick}
          >
            {renderInline(
              tokenizeInline(token.inner, token.rawStart + 2),
              ctx,
            )}
          </strong>,
        );
        break;
      case "italic":
        out.push(
          <em
            key={key}
            data-thread-id={threadId}
            className={cover ? highlightClassName(cover, ctx) : undefined}
            onClick={onClick}
          >
            {renderInline(
              tokenizeInline(token.inner, token.rawStart + 1),
              ctx,
            )}
          </em>,
        );
        break;
      case "strike":
        out.push(
          <del
            key={key}
            data-thread-id={threadId}
            className={cover ? highlightClassName(cover, ctx) : undefined}
            onClick={onClick}
          >
            {renderInline(tokenizeInline(token.inner, token.rawStart + 2), ctx)}
          </del>,
        );
        break;
      case "link": {
        const safe = token.url && SAFE_LINK_RE.test(token.url);
        // Links are atomic for selection: a fork snaps to the whole [text](url).
        const common = {
          "data-raw-start": String(token.rawStart),
          "data-raw-end": String(token.rawEnd),
          "data-atomic": "true",
          "data-thread-id": threadId,
        };
        out.push(
          safe ? (
            <a
              key={key}
              {...common}
              href={token.url}
              target="_blank"
              rel="noreferrer noopener"
              className={`node-link${cover ? " " + highlightClassName(cover, ctx) : ""}`}
              onClick={(event) => event.stopPropagation()}
            >
              {token.inner}
            </a>
          ) : (
            <span key={key} {...common} onClick={onClick}>
              {token.inner}
            </span>
          ),
        );
        break;
      }
    }
  });

  return out;
}

interface ListItem {
  indent: number;
  ordered: boolean;
  tokens: InlineToken[];
}

// Renders a (possibly nested) list from flat items, grouping by indentation.
// Items at exactly `indent` are siblings; deeper items become a nested list
// inside the preceding <li>. Returns the list element and the index of the
// first item not consumed at this level. `attrs` is applied to the outer list
// only (so the top-level list keeps the node id/class for fork anchoring).
function renderListLevel(
  items: ListItem[],
  start: number,
  indent: number,
  ctx: HighlightCtx,
  attrs?: Record<string, string>,
): [ReactNode, number] {
  const lis: ReactNode[] = [];
  let ordered = items[start]?.ordered ?? false;
  let i = start;

  while (i < items.length && items[i]!.indent >= indent) {
    if (items[i]!.indent > indent) {
      // Deeper item with no sibling at this level yet — fold into the last <li>.
      const [child, next] = renderListLevel(items, i, items[i]!.indent, ctx);
      if (lis.length === 0) {
        lis.push(<li key={`li_${i}`}>{child}</li>);
      } else {
        const last = lis.pop() as React.ReactElement<{ children?: ReactNode }>;
        lis.push(
          <li key={last.key}>
            {last.props.children}
            {child}
          </li>,
        );
      }
      i = next;
      continue;
    }

    const item = items[i]!;
    ordered = item.ordered;
    const index = i;
    i += 1;

    let child: ReactNode = null;
    if (i < items.length && items[i]!.indent > indent) {
      const [nested, next] = renderListLevel(items, i, items[i]!.indent, ctx);
      child = nested;
      i = next;
    }

    lis.push(
      <li key={`li_${index}`}>
        {renderInline(item.tokens, ctx)}
        {child}
      </li>,
    );
  }

  const Tag = ordered ? "ol" : "ul";
  return [
    <Tag {...attrs} className={attrs?.className ?? "node-list"}>
      {lis}
    </Tag>,
    i,
  ];
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
      const items: ListItem[] = [];
      for (const line of lines) {
        const lineStart = cursor;
        cursor += line.length + 1;
        const marker = line.match(/^(\s*)([-*]|\d+\.)\s+/);
        if (!marker) continue;
        const markerLen = marker[0].length;
        items.push({
          indent: marker[1]!.length,
          ordered: /\d+\./.test(marker[2]!),
          tokens: tokenizeInline(line.slice(markerLen), lineStart + markerLen),
        });
      }

      if (items.length === 0) {
        return (
          <ul data-node-id={node.id} data-node-type="list" className="node-list" />
        );
      }

      const baseIndent = Math.min(...items.map((item) => item.indent));
      const [list] = renderListLevel(items, 0, baseIndent, ctx, {
        "data-node-id": node.id,
        "data-node-type": "list",
        className: "node-list",
      });
      return list;
    }

    case "table": {
      const { headers, rows } = parseMarkdownTable(node.raw);
      const cover = highlights[0];
      return (
        <table
          data-node-id={node.id}
          data-node-type="table"
          data-raw-start="0"
          data-raw-end={String(node.raw.length)}
          data-atomic="true"
          className={`node-table${cover ? " " + highlightClassName(cover, ctx) : ""}`}
          {...(cover
            ? {
                "data-thread-id": cover.threadId,
                onClick: () => onHighlightClick?.(cover.threadId),
              }
            : {})}
        >
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((cell, cellIndex) => (
                  <th key={cellIndex}>
                    {renderInline(tokenizeInline(cell, 0), ctx)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {renderInline(tokenizeInline(cell, 0), ctx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    case "quote": {
      const lines = node.raw.split("\n");
      let cursor = 0;
      const paragraphs: ReactNode[] = [];
      lines.forEach((line, index) => {
        const lineStart = cursor;
        cursor += line.length + 1;
        const marker = line.match(/^ {0,3}>\s?/);
        const prefixLen = marker ? marker[0].length : 0;
        const content = line.slice(prefixLen);
        if (content.trim() === "") return;
        paragraphs.push(
          <p key={index}>
            {renderInline(tokenizeInline(content, lineStart + prefixLen), ctx)}
          </p>,
        );
      });
      return (
        <blockquote
          data-node-id={node.id}
          data-node-type="quote"
          className="node-quote"
        >
          {paragraphs}
        </blockquote>
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

    case "hr":
      return <hr data-node-id={node.id} data-node-type="hr" className="node-hr" />;

    case "svg": {
      const cover = highlights[0];
      // SVG is produced by our own visual pipeline (self-contained, no external
      // refs), so mounting it as markup is safe here.
      return (
        <figure
          data-node-id={node.id}
          data-node-type="svg"
          data-raw-start="0"
          data-raw-end={String(node.raw.length)}
          data-atomic="true"
          className={`node-figure node-svg${cover ? " " + highlightClassName(cover, ctx) : ""}`}
          {...(cover
            ? {
                "data-thread-id": cover.threadId,
                onClick: () => onHighlightClick?.(cover.threadId),
              }
            : {})}
          dangerouslySetInnerHTML={{ __html: node.raw }}
        />
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
