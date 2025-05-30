import React from "react";
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { gfmTable, gfmTableHtml } from "micromark-extension-gfm-table";

interface MarkdownProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Markdown: React.FC<MarkdownProps> = ({
  children,
  className = "",
  style,
}) => {
  // Combine GFM and GFM Table extensions
  const html = micromark(children || "", {
    extensions: [gfm(), gfmTable()],
    htmlExtensions: [gfmHtml(), gfmTableHtml()],
  });

  // TODO: Consider sanitizing HTML output for security if user input is rendered
  return (
    <div
      className={`markdown-content ${className}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
