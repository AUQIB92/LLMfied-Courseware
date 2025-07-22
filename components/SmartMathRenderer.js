import React, { useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * Smart Math Renderer - State-of-the-art mathematical content rendering
 * 
 * This component uses a much more intelligent approach than regex-based sanitization:
 * 1. Context-aware content detection
 * 2. Proper LaTeX parsing with fallbacks
 * 3. Minimal preprocessing to avoid breaking regular text
 * 4. Error boundaries with graceful degradation
 * 5. Performance optimizations with memoization
 */

// Smart content detector - identifies mathematical contexts
const detectMathContext = (text) => {
  const mathIndicators = [
    /\$[^$]+\$/,                    // Inline math: $...$
    /\$\$[^$]+\$\$/,                // Block math: $$...$$
    /\\[a-zA-Z]+\{[^}]*\}/,         // LaTeX commands: \frac{...}
    /\\[a-zA-Z]+(?![a-zA-Z])/,      // LaTeX commands: \alpha
    /\b\d+\s*[+\-*/=]\s*\d+/,      // Simple equations: 2 + 3
    /\b[a-z]\s*=\s*[^a-zA-Z\s]/,   // Variable assignments: x = 5
    /\b(sin|cos|tan|log|ln|exp)\s*\(/,  // Math functions
    /[∑∏∫∂∇∞αβγδεζηθλμπσφψω]/,     // Math symbols
  ];
  
  return mathIndicators.some(pattern => pattern.test(text));
};

// Minimal, safe preprocessing - only fixes obvious LaTeX errors
const minimalPreprocess = (text) => {
  return text
    // Fix only the most common and safe LaTeX issues
    .replace(/(?<!\\)frac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")  // Missing backslash in fractions
    .replace(/(?<!\\)sqrt\{([^}]+)\}/g, "\\sqrt{$1}")                  // Missing backslash in square roots
    .replace(/(?<!\\)sum_\{([^}]+)\}\^\{([^}]+)\}/g, "\\sum_{$1}^{$2}") // Missing backslash in summations
    .replace(/(?<!\\)int_\{([^}]+)\}\^\{([^}]+)\}/g, "\\int_{$1}^{$2}") // Missing backslash in integrals
    
    // Fix only mathematical "to" contexts (very conservative)
    .replace(/\b(\d+)\s+to\s+(\d+)\b/g, "$1 \\to $2")                 // Numbers only: "1 to 5"
    .replace(/\b([a-z])\s+to\s+([a-z])\b(?=\s*[,.]|\s*$)/g, "$1 \\to $2") // Single letters at end of sentence
    
    // Fix common Greek letters only when clearly mathematical
    .replace(/\b(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega)\b(?=\s*[=+\-*/])/g, "\\$1")
    
    // Clean up any double backslashes from JSON encoding
    .replace(/\\\\([a-zA-Z]+)/g, "\\$1");
};

// Enhanced KaTeX configuration with better error handling
const getKatexOptions = () => ({
  strict: false,
  output: 'html',
  throwOnError: false,
  errorColor: '#dc2626',
  colorIsTextColor: true,
  fleqn: false,
  leqno: false,
  minRuleThickness: 0.04,
  maxSize: Infinity,
  maxExpand: 1000,
  trust: false,
  globalGroup: false,
  
  // Useful macros without being too aggressive
  macros: {
    "\\f": "\\frac{#1}{#2}",
    "\\half": "\\frac{1}{2}",
    "\\ohm": "\\Omega",
    "\\degree": "^\\circ",
    "\\vv": "\\vec{#1}",
    "\\abs": "\\left|#1\\right|",
    "\\dd": "\\frac{d#1}{d#2}",
    "\\pd": "\\frac{\\partial#1}{\\partial#2}",
  }
});

export default function SmartMathRenderer({ 
  content, 
  className = "",
  inline = false,
  fallbackToPlainText = true 
}) {
  const [renderError, setRenderError] = useState(null);
  
  // Smart content processing with error handling
  const processedContent = useMemo(() => {
    if (!content || typeof content !== "string") return "";
    
    try {
      // Only preprocess if we detect mathematical content
      const hasMath = detectMathContext(content);
      
      if (hasMath) {
        return minimalPreprocess(content);
      } else {
        // For non-mathematical content, return as-is
        return content;
      }
    } catch (error) {
      console.warn("Math preprocessing error:", error);
      setRenderError(error);
      return content; // Fallback to original
    }
  }, [content]);

  // Error boundary callback
  const handleRenderError = useCallback((error) => {
    console.warn("Math rendering error:", error);
    setRenderError(error);
  }, []);

  // If there's an error and fallback is enabled, render plain text
  if (renderError && fallbackToPlainText) {
    return (
      <div className={`math-fallback ${className}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-red-500 mt-1">
            Math rendering error: {renderError.message}
          </div>
        )}
      </div>
    );
  }

  // Custom components for better HTML structure
  const components = inline ? {
    // Inline components - no block elements
    p: ({ children }) => <>{children}</>,
    h1: ({ children }) => <span className="font-bold text-lg">{children}</span>,
    h2: ({ children }) => <span className="font-bold">{children}</span>,
    h3: ({ children }) => <span className="font-semibold">{children}</span>,
    div: ({ children }) => <span>{children}</span>,
    ul: ({ children }) => <span className="inline-block">{children}</span>,
    li: ({ children }) => <span className="inline-block mx-1">• {children}</span>,
    
    // Error handling for math
    span: ({ className: spanClass, children, ...props }) => {
      if (spanClass === 'katex-error') {
        return (
          <span 
            className="text-red-500 bg-red-50 px-1 rounded text-sm" 
            title="Math rendering error"
            {...props}
          >
            {children}
          </span>
        );
      }
      return <span className={spanClass} {...props}>{children}</span>;
    },
  } : {
    // Block components - proper block elements
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-relaxed text-gray-800" {...props}>
        {children}
      </p>
    ),
    
    // Error handling for math
    span: ({ className: spanClass, ...props }) => {
      if (spanClass === 'katex-error') {
        return (
          <span 
            className="text-red-500 bg-red-50 px-1 rounded" 
            title="Math rendering error"
            {...props}
          />
        );
      }
      return <span className={spanClass} {...props} />;
    },
    
    // Better code formatting
    code: ({ inline: isInline, className: codeClass, children, ...props }) => {
      const match = /language-(\w+)/.exec(codeClass || '');
      const isCodeBlock = !isInline && match;
      
      return isCodeBlock ? (
        <pre className="bg-gray-50 rounded p-4 overflow-x-auto my-4">
          <code className={codeClass} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 px-1 py-0.5 rounded" {...props}>
          {children}
        </code>
      );
    },
  };

  const WrapperComponent = inline ? 'span' : 'div';

  return (
    <WrapperComponent className={`smart-math-content ${inline ? 'inline' : ''} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, getKatexOptions()]]}
        components={components}
        onError={handleRenderError}
      >
        {processedContent}
      </ReactMarkdown>
    </WrapperComponent>
  );
}

// Hook for detecting if content needs math rendering
export const useMathDetection = (content) => {
  return useMemo(() => {
    if (!content) return false;
    return detectMathContext(content);
  }, [content]);
};

// Utility function for safe math preprocessing
export const safeMathPreprocess = (text) => {
  try {
    return minimalPreprocess(text);
  } catch (error) {
    console.warn("Safe math preprocessing failed:", error);
    return text;
  }
};