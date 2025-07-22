"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * KatexRenderer - Optimized for speed and simple math expressions
 *
 * This renderer uses KaTeX for fast rendering of simple to moderate math expressions.
 * It's optimized for performance and works best with well-formed LaTeX.
 */

const KatexRenderer = ({
  content,
  className = "",
  inline = false,
  onError = null,
  accessibilityLabel = "",
}) => {
  // Enhanced KaTeX options for better rendering
  const katexOptions = useMemo(
    () => ({
      strict: false,
      output: "html",
      throwOnError: false,
      errorColor: "#dc2626",
      colorIsTextColor: true,
      maxSize: Infinity,
      maxExpand: 1000,
      trust: false,
      displayMode: false, // Will be handled by markdown parsing

      // Enhanced spacing and display
      fleqn: false, // Center equations
      leqno: false, // Number on right

      // Useful macros for common patterns
      macros: {
        // Fraction shortcuts
        "\\f": "\\frac{#1}{#2}",
        "\\half": "\\frac{1}{2}",
        "\\third": "\\frac{1}{3}",
        "\\quarter": "\\frac{1}{4}",

        // Common symbols
        "\\ohm": "\\Omega",
        "\\degree": "^\\circ",
        "\\micro": "\\mu",

        // Vector notation
        "\\vv": "\\vec{#1}",
        "\\unit": "\\hat{#1}",

        // Common functions
        "\\abs": "\\left|#1\\right|",
        "\\norm": "\\left\\|#1\\right\\|",

        // Derivatives with better spacing
        "\\dd": "\\frac{d#1}{d#2}",
        "\\pd": "\\frac{\\partial#1}{\\partial#2}",

        // Display math with spacing
        "\\display": "\\displaystyle",
      },
    }),
    []
  );

  // Enhanced components for better rendering
  const components = useMemo(() => {
    if (inline) {
      return {
        // Inline mode - but still separate math equations
        p: ({ children }) => <span className="block">{children}</span>,
        div: ({ children }) => <span className="block">{children}</span>,
        h1: ({ children }) => (
          <span className="font-bold block">{children}</span>
        ),
        h2: ({ children }) => (
          <span className="font-bold block">{children}</span>
        ),
        h3: ({ children }) => (
          <span className="font-semibold block">{children}</span>
        ),
        ul: ({ children }) => <span className="block">{children}</span>,
        li: ({ children }) => <span className="block mx-1">• {children}</span>,
        br: () => <br />,
        // Ensure math equations get their own line
        ".math-display": ({ children }) => (
          <div className="my-4 text-center">{children}</div>
        ),
        ".math-inline": ({ children }) => (
          <span className="mx-1">{children}</span>
        ),
      };
    }

    return {
      // Block mode - proper block elements with math spacing
      p: ({ children, ...props }) => (
        <div className="mb-4 leading-relaxed text-gray-800" {...props}>
          {children}
        </div>
      ),

      // Math display handling
      ".math-display": ({ children }) => (
        <div className="my-6 text-center">{children}</div>
      ),

      ".math-inline": ({ children }) => (
        <span className="mx-1">{children}</span>
      ),

      // Enhanced code blocks
      code: ({
        inline: isInline,
        className: codeClass,
        children,
        ...props
      }) => {
        if (isInline) {
          return (
            <code
              className="bg-gray-100 px-1 py-0.5 rounded text-sm"
              {...props}
            >
              {children}
            </code>
          );
        }

        return (
          <pre className="bg-gray-50 rounded p-4 overflow-x-auto my-4 border">
            <code className={codeClass} {...props}>
              {children}
            </code>
          </pre>
        );
      },
    };
  }, [inline]);

  const WrapperComponent = inline ? "span" : "div";

  // Accessibility attributes
  const accessibilityProps = {
    role: "math",
    "aria-label": accessibilityLabel || undefined,
  };

  return (
    <WrapperComponent
      className={`katex-renderer ${inline ? "inline" : ""} ${className}`}
      {...accessibilityProps}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, katexOptions]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </WrapperComponent>
  );
};

export default KatexRenderer;
