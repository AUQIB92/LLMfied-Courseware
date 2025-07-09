import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function MathMarkdownRenderer({ content }) {
  const textContent = typeof content === "string" ? content : "";

  // Sanitize: only fix broken LaTeX commands without breaking valid ones
  const fixedContent = textContent
    .replace(/(?<!\\)(frac|sqrt|sum|int|lim|text)\{/g, "\\$1{")
    .replace(/(?<!\\)(alpha|beta|gamma|delta|epsilon|theta|pi|sigma|omega|infty)\b/g, "\\$1")
    .replace(/(?<!\\)f(?=\d|\s|[VE])/g, "\\frac"); // fix \f -> \frac

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
      }}
    >
      {fixedContent}
    </ReactMarkdown>
  );
}
