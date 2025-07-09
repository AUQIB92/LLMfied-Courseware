import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function sanitizeMath(raw) {
  if (typeof raw !== "string") return "";

  return raw
    // Fix malformed fractions
    .replace(/@rac\s*\{(.*?)\}\s*\{(.*?)\}/g, "\\frac{$1}{$2}")
    .replace(/\\f\s*([A-Za-z0-9_]+)\s*\/\s*([A-Za-z0-9_]+)/g, "\\frac{$1}{$2}")
    .replace(/\\f(\d+)\s*\/\s*(\d+)/g, "\\frac{$1}{$2}")
    .replace(/\\\\f([A-Za-z0-9]+)/g, "\\frac{$1}")
    .replace(/\\f(?![a-zA-Z])/g, "")

    // ✅ FIX all malformed vector/arrow notations
    .replace(/\\ec\s*([A-Za-z])/g, "\\vec{$1}")
    .replace(/\\[^a-zA-Z0-9]?ec\s*([A-Za-z])/g, "\\vec{$1}")
    .replace(/→\s*([A-Za-z])/g, "\\vec{$1}")
    .replace(/\\vec\s+([A-Za-z])/g, "\\vec{$1}")
    .replace(/\\overrightarrow\s+([A-Za-z]+)/g, "\\overrightarrow{$1}")

    // Fix Greek and missing backslashes
    .replace(/(?<!\\)(frac|sqrt|sum|int|lim|log|exp|sin|cos|tan|text|oint|vec|overrightarrow)\s*\{/g, "\\$1{")
    .replace(/(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|pi|sigma|omega|infty|mu_0)\b/g, "\\$1")
    .replace(/μ/g, "\\mu")

    // Fix common physics variable
    .replace(/\bIenc\b/g, "I_{\\text{enc}}")

    // Prevent KaTeX from crashing on lonely \frac
    .replace(/\\frac(?!\s*\{)/g, "")

    // Remove all invisible Unicode/control characters
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, "");
}

export default function SafeMathMarkdownRenderer({ content }) {
  const cleaned = sanitizeMath(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
      }}
    >
      {cleaned}
    </ReactMarkdown>
  );
}
