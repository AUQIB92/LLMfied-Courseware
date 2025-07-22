import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { sanitizeLaTeX } from "@/lib/utils";

/**
 * Enhanced MathMarkdownRenderer component
 * 
 * This component renders markdown content with LaTeX math expressions
 * using KaTeX. It includes several enhancements:
 * 
 * 1. Memoization to prevent unnecessary re-renders
 * 2. Advanced LaTeX sanitization to fix common issues
 * 3. Custom components for proper HTML structure
 * 4. Error boundary for KaTeX rendering failures
 * 5. Support for both inline and block math
 * 
 * @param {Object} props Component props
 * @param {string} props.content Markdown content with LaTeX expressions
 * @param {Object} props.options Additional options for rendering
 * @param {string} props.className Additional CSS classes
 * @param {boolean} props.unwrapParagraphs Whether to unwrap paragraphs (prevents nesting issues)
 * @param {boolean} props.inline Whether to render as inline content (no block elements)
 */
export default function MathMarkdownRenderer({ 
  content, 
  options = {},
  className = "",
  unwrapParagraphs = false,
  inline = false
}) {
  // Memoize the sanitized content to prevent unnecessary re-processing
  const sanitizedContent = useMemo(() => {
    if (!content || typeof content !== "string") return "";
    
    // Apply the comprehensive sanitizer
    return sanitizeLaTeX(content);
  }, [content]);

  // KaTeX options for better math rendering
  const katexOptions = {
    strict: false,                // Don't throw errors for invalid LaTeX
    output: 'html',               // Output format
    throwOnError: false,          // Continue rendering even if there are errors
    errorColor: '#cc0000',        // Red color for errors
    fleqn: false,                 // Don't force left-aligned equations
    displayMode: false,           // Auto-detect display vs inline mode
    macros: {                     // Common macros for convenience
      "\\f": "\\frac{#1}{#2}",    // \f{a}{b} -> \frac{a}{b}
      "\\ds": "\\displaystyle",   // \ds -> \displaystyle
      "\\ts": "\\textstyle",      // \ts -> \textstyle
      "\\ss": "\\scriptstyle",    // \ss -> \scriptstyle
      "\\sss": "\\scriptscriptstyle", // \sss -> \scriptscriptstyle
      // Common physics and engineering macros
      "\\ohm": "\\Omega",         // \ohm -> \Omega
      "\\degree": "^\\circ",      // \degree -> °
      "\\celsius": "^\\circ\\text{C}", // \celsius -> °C
      "\\fahrenheit": "^\\circ\\text{F}", // \fahrenheit -> °F
      "\\kelvin": "\\text{K}",    // \kelvin -> K
      // Common mathematical constants
      "\\E": "\\mathrm{e}",       // Euler's number
      "\\I": "\\mathrm{i}",       // Imaginary unit
      "\\Real": "\\mathbb{R}",    // Real numbers
      "\\Complex": "\\mathbb{C}", // Complex numbers
      "\\Natural": "\\mathbb{N}",  // Natural numbers
      "\\Integer": "\\mathbb{Z}",  // Integers
      "\\Rational": "\\mathbb{Q}", // Rational numbers
    },
    trust: (context) => {
      // Allow certain HTML tags for better formatting
      return ['\\htmlClass', '\\htmlId', '\\htmlStyle', '\\htmlData'].includes(context.command);
    },
    maxSize: 25,                  // Maximum font size
    maxExpand: 1000,              // Maximum macro expansions
    ...options
  };

  // If no content, return empty span with a non-breaking space to maintain layout
  if (!sanitizedContent) {
    return <span className={`empty-content ${className}`}>&nbsp;</span>;
  }

  // For inline content (used inside paragraphs, headings, etc.)
  if (inline || unwrapParagraphs) {
    // Custom components for inline rendering - no block elements allowed
    const inlineComponents = {
      // Completely unwrap paragraphs to prevent nesting issues
      p: ({ children }) => <>{children}</>,
      
      // Convert all block elements to spans
      h1: ({ children }) => <span className="font-bold text-lg">{children}</span>,
      h2: ({ children }) => <span className="font-bold">{children}</span>,
      h3: ({ children }) => <span className="font-semibold">{children}</span>,
      h4: ({ children }) => <span className="font-medium">{children}</span>,
      h5: ({ children }) => <span className="font-medium text-sm">{children}</span>,
      h6: ({ children }) => <span className="font-medium text-xs">{children}</span>,
      
      // Convert list items to inline elements
      ul: ({ children }) => <span className="inline-block">{children}</span>,
      ol: ({ children }) => <span className="inline-block">{children}</span>,
      li: ({ children }) => <span className="inline-block mx-1">• {children}</span>,
      
      // Ensure code is properly styled
      code: ({ inline, className, children }) => (
        <code className={`bg-gray-100 px-1 py-0.5 rounded text-xs ${className || ''}`}>
          {children}
        </code>
      ),
      
      // Handle math errors gracefully
      span: ({ className, children, ...props }) => {
        if (className === 'katex-error') {
          return (
            <span 
              className="text-red-500 bg-red-50 px-1 rounded border border-red-200" 
              title={`LaTeX rendering error: ${children}`}
              {...props}
            >
              [Math Error: {children}]
            </span>
          );
        }
        return <span className={className} {...props}>{children}</span>;
      },
      
      // Convert block quotes to inline
      blockquote: ({ children }) => (
        <span className="italic text-gray-600 mx-2">{children}</span>
      ),
      
      // Convert pre to inline
      pre: ({ children }) => <span className="font-mono">{children}</span>,
      
      // Convert div to span
      div: ({ children }) => <span>{children}</span>,
    };

    return (
      <span className={`math-markdown-content inline ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, katexOptions]]}
          components={inlineComponents}
        >
          {sanitizedContent}
        </ReactMarkdown>
      </span>
    );
  }

  // For block content (used in divs, cards, etc.)
  const blockComponents = {
    // Use proper paragraph tags for block content
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-relaxed text-gray-800" {...props}>
        {children}
      </p>
    ),
    
    // Ensure math blocks are properly styled
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const isCodeBlock = !inline && match;
      
      return isCodeBlock ? (
        <pre className="bg-gray-50 rounded p-4 overflow-x-auto my-4">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 px-1 py-0.5 rounded" {...props}>
          {children}
        </code>
      );
    },
    
    // Ensure proper heading structure
    h1: (props) => <h3 className="text-2xl font-bold mt-6 mb-4" {...props} />,
    h2: (props) => <h4 className="text-xl font-bold mt-5 mb-3" {...props} />,
    h3: (props) => <h5 className="text-lg font-bold mt-4 mb-2" {...props} />,
    h4: (props) => <h6 className="text-base font-bold mt-3 mb-2" {...props} />,
    
    // Ensure lists are properly styled
    ul: (props) => <ul className="list-disc pl-6 mb-4" {...props} />,
    ol: (props) => <ol className="list-decimal pl-6 mb-4" {...props} />,
    li: (props) => <li className="mb-1" {...props} />,
    
    // Handle math errors gracefully
    span: ({ className, children, ...props }) => {
      if (className === 'katex-error') {
        return (
          <span 
            className="text-red-500 bg-red-50 px-2 py-1 rounded border border-red-200 inline-block" 
            title={`LaTeX rendering error: ${children}`}
            {...props}
          >
            [Math Error: {children}]
          </span>
        );
      }
      return <span className={className} {...props}>{children}</span>;
    },

    // Enhanced math display handling
    div: ({ className, children, ...props }) => {
      if (className && className.includes('katex-display')) {
        return (
          <div className={`${className} my-4 text-center overflow-x-auto`} {...props}>
            {children}
          </div>
        );
      }
      return <div className={className} {...props}>{children}</div>;
    },
  };

  return (
    <div className={`math-markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, katexOptions]]}
        components={blockComponents}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}