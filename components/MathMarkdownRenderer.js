import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { sanitizeLaTeX } from "@/lib/utils";

// Enhanced math sanitizer with better error handling
function sanitizeMath(raw) {
  if (typeof raw !== "string") return "";

  try {
    // Use the centralized enhanced sanitizer
    if (typeof sanitizeLaTeX === "function") {
      return sanitizeLaTeX(raw);
    }

    // Fallback sanitizer if centralized one is not available
    return (
      raw
        // ✅ Fix malformed fractions
        .replace(/@rac\s*\{(.*?)\}\s*\{(.*?)\}/g, "\\frac{$1}{$2}")
        .replace(/rac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")
        .replace(/\\f\s*(\d+)\s*\/\s*(\d+)/g, "\\frac{$1}{$2}")
        .replace(/\\f\s*([A-Za-z0-9]+)\s*\/\s*([A-Za-z0-9]+)/g, "\\frac{$1}{$2}")
        .replace(/\\\\f([A-Za-z0-9]+)/g, "\\frac{$1}")
        .replace(/\\f(?![a-zA-Z])/g, "") // remove stray \f
        .replace(/(?<!\\)frac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")

        // ✅ Fix electrical engineering specific patterns from ExamGenius
        .replace(/frac\{V_t\}\{I_t\}/g, "\\frac{V_t}{I_t}")
        .replace(/frac\{V_t\}\{L_t\}/g, "\\frac{V_t}{L_t}")
        .replace(/frac\{V_th\}\{I_t\}/g, "\\frac{V_{th}}{I_t}")
        .replace(/frac\{V_th\}\{L_t\}/g, "\\frac{V_{th}}{L_t}")

        // ✅ Fix malformed vector/arrow notations
        .replace(/\\ec\s*([A-Za-z])/g, "\\vec{$1}")
        .replace(/\\ec\s*\{\s*([A-Za-z])\s*\}/g, "\\vec{$1}")
        .replace(/→\s*([A-Za-z])/g, "\\vec{$1}")
        .replace(/→\s*\\?([A-Za-z]+)/g, "\\vec{$1}")
        .replace(/\\vec\s+([A-Za-z])/g, "\\vec{$1}")
        .replace(/\\overrightarrow\s+([A-Za-z]+)/g, "\\overrightarrow{$1}")

        // ✅ Fix malformed square roots
        .replace(/qrt\{([^}]+)\}/g, "\\sqrt{$1}")
        .replace(/(?<!\\)sqrt\{([^}]+)\}/g, "\\sqrt{$1}")

        // ✅ Add missing backslashes to known math commands
        .replace(
          /(?<!\\)(frac|sqrt|sum|int|oint|lim|log|exp|sin|cos|tan|text|vec|overrightarrow|prod|partial|nabla|infty)\s*\{/g,
          "\\$1{"
        )

        // ✅ Fix Greek letters without backslash
        .replace(
          /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|pi|sigma|omega|infty|mu_0|theta_0|phi_0)\b/g,
          "\\$1"
        )
        .replace(/μ/g, "\\mu")
        .replace(/π/g, "\\pi")
        .replace(/θ/g, "\\theta")
        .replace(/φ/g, "\\phi")
        .replace(/σ/g, "\\sigma")
        .replace(/∞/g, "\\infty")

        // ✅ Fix subscripted current and common physics variables
        .replace(/\bIenc\b/g, "I_{\\text{enc}}")
        .replace(/\bI_\{enc\}\b/g, "I_{\\text{enc}}")
        .replace(/\bV_\{th\}\b/g, "V_{th}")
        .replace(/\bR_\{th\}\b/g, "R_{th}")

        // ✅ Remove invalid/isolated commands
        .replace(/\\frac(?!\s*\{)/g, "")
        .replace(/\\sqrt(?!\s*\{)/g, "")
        .replace(/\\sum(?!\s*[_{])/g, "")
        .replace(/\\int(?!\s*[_{])/g, "")

        // ✅ Fix double backslashes
        .replace(/\\\\frac/g, "\\frac")
        .replace(/\\\\sqrt/g, "\\sqrt")
        .replace(/\\\\sum/g, "\\sum")
        .replace(/\\\\int/g, "\\int")
        .replace(/\\\\vec/g, "\\vec")

        // ✅ Strip all invisible/control characters
        .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
    );
  } catch (error) {
    console.error("LaTeX sanitization error:", error);
    // Return original content if sanitization fails
    return raw;
  }
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
