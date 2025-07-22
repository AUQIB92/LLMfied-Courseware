"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax/chtml";

/**
 * MathJaxRenderer - Superior for complex math and error recovery
 *
 * This renderer uses MathJax for handling complex mathematical expressions.
 * It has superior error recovery and better support for advanced LaTeX constructs.
 */

const MathJaxRenderer = ({
  content,
  className = "",
  inline = false,
  onError = null,
  accessibilityLabel = "",
}) => {
  // Enhanced MathJax configuration for better rendering
  const mathjaxConfig = useMemo(
    () => ({
      chtml: {
        fontURL:
          "https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2",
      },
    }),
    []
  );

  // Custom components based on inline/block mode
  const components = useMemo(() => {
    if (inline) {
      return {
        // Inline mode - everything should be inline
        p: ({ children }) => <>{children}</>,
        div: ({ children }) => <span>{children}</span>,
        h1: ({ children }) => (
          <span className="font-bold text-lg">{children}</span>
        ),
        h2: ({ children }) => <span className="font-bold">{children}</span>,
        h3: ({ children }) => <span className="font-semibold">{children}</span>,
        ul: ({ children }) => <span>{children}</span>,
        li: ({ children }) => <span className="mx-1">• {children}</span>,
      };
    }

    return {
      // Block mode - proper block elements
      p: ({ children, ...props }) => (
        <p className="mb-4 leading-relaxed text-gray-800" {...props}>
          {children}
        </p>
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

  return (
    <WrapperComponent
      className={`mathjax-renderer ${inline ? "inline" : "block"} ${className}`}
      role="math"
      aria-label={accessibilityLabel || undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeMathjax, mathjaxConfig]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </WrapperComponent>
  );
};

export default MathJaxRenderer;
