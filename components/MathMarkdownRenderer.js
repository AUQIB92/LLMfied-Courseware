import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { sanitizeLaTeX } from "@/lib/utils";

// Fully robust math sanitizer
function sanitizeMath(raw) {
  if (typeof raw !== "string") return "";

  // Use the centralized sanitizer if available
  if (typeof sanitizeLaTeX === "function") return sanitizeLaTeX(raw);

  return (
    raw
      // ✅ Fix malformed fractions
      .replace(/@rac\s*\{(.*?)\}\s*\{(.*?)\}/g, "\\frac{$1}{$2}")
      .replace(/\\f\s*(\d+)\s*\/\s*(\d+)/g, "\\frac{$1}{$2}")
      .replace(/\\f\s*([A-Za-z0-9]+)\s*\/\s*([A-Za-z0-9]+)/g, "\\frac{$1}{$2}")
      .replace(/\\\\f([A-Za-z0-9]+)/g, "\\frac{$1}")
      .replace(/\\f(?![a-zA-Z])/g, "") // remove stray \f

      // ✅ Fix malformed vector/arrow notations
      .replace(/\\ec\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\ec\s*\{\s*([A-Za-z])\s*\}/g, "\\vec{$1}")
      .replace(/→\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/→\s*\\?([A-Za-z]+)/g, "\\vec{$1}")
      .replace(/\\vec\s+([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\overrightarrow\s+([A-Za-z]+)/g, "\\overrightarrow{$1}")

      // ✅ Add missing backslashes to known math commands
      .replace(
        /(?<!\\)(frac|sqrt|sum|int|oint|lim|log|exp|sin|cos|tan|text|vec|overrightarrow)\s*\{/g,
        "\\$1{"
      )

      // ✅ Fix Greek letters without backslash
      .replace(
        /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|pi|sigma|omega|infty|mu_0)\b/g,
        "\\$1"
      )
      .replace(/μ/g, "\\mu")

      // ✅ Fix subscripted current
      .replace(/\bIenc\b/g, "I_{\\text{enc}}")

      // ✅ Remove invalid/isolated \frac
      .replace(/\\frac(?!\s*\{)/g, "")

      // ✅ Strip all invisible/control characters
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
  );
}

export default function MathMarkdownRenderer({ content }) {
  const cleaned = sanitizeMath(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ node, ...props }) => (
          <p className="mb-4 leading-relaxed" {...props} />
        ),
      }}
    >
      {cleaned}
    </ReactMarkdown>
  );
}
