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
    // Force all math to be block display for maximum clarity
    const blockMathComponents = {
      // All content should be block for math separation
      p: ({ children }) => <div className="math-paragraph">{children}</div>,
      div: ({ children }) => <div className="math-container">{children}</div>,
      h1: ({ children }) => (
        <div className="font-bold text-lg math-heading">{children}</div>
      ),
      h2: ({ children }) => (
        <div className="font-bold math-heading">{children}</div>
      ),
      h3: ({ children }) => (
        <div className="font-semibold math-heading">{children}</div>
      ),
      ul: ({ children }) => <div className="math-list">{children}</div>,
      li: ({ children }) => <div className="math-list-item">• {children}</div>,
      br: () => <div className="math-break" style={{ height: "1em" }} />,
      // Force all math into display mode
      ".math-display": ({ children }) => (
        <div className="math-display-block">{children}</div>
      ),
      ".math-inline": ({ children }) => (
        <div className="math-inline-block">{children}</div>
      ),
      span: ({ children, ...props }) => {
        // Convert inline math spans to block divs
        if (props.className?.includes("katex")) {
          return (
            <div className="katex-block" {...props}>
              {children}
            </div>
          );
        }
        return <div {...props}>{children}</div>;
      },
    };

    return blockMathComponents;
  }, []);

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
