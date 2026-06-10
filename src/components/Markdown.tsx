import { useMemo } from "react";
import { parseContentNodes } from "../assembler/assembler";
import { GuideNode } from "./guide/GuideNode";

interface MarkdownProps {
  source: string;
  // Used to namespace node ids; pass something stable like a message id.
  idPrefix: string;
}

// Renders a markdown string (with $/$$ LaTeX, code fences, lists, headings)
// by reusing the study guide's node parser and renderer.
export function Markdown({ source, idPrefix }: MarkdownProps) {
  const nodes = useMemo(
    () => parseContentNodes(idPrefix, source),
    [idPrefix, source],
  );

  return (
    <div className="markdown">
      {nodes.map((node) => (
        <GuideNode key={node.id} node={node} />
      ))}
    </div>
  );
}
