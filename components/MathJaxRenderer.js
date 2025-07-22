import React, { useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";

/**
 * MathJax-based Math Renderer - Superior to KaTeX for error handling
 * 
 * MathJax advantages over KaTeX:
 * 1. Better error recovery and fallback mechanisms
 * 2. More complete LaTeX support
 * 3. Superior handling of malformed expressions
 * 4. Better accessibility features
 * 5. More robust parsing of edge cases
 */

// Intelligent math context detection
const isMathematicalContent = (text) => {
  if (!text || typeof text !== "string") return false;
  
  // Strong mathematical indicators
  const strongMathPatterns = [
    /\$[^$\n]+\$/,                          // Inline math delimiters
    /\$\$[^$]+\$\$/,                        // Block math delimiters  
    /\\[a-zA-Z]+\{[^}]*\}/,                 // LaTeX commands with braces
    /\\(frac|sqrt|sum|int|lim|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega|infty)/,
    /\b\d+\s*[+\-×÷*/=≠≤≥]\s*\d+/,         // Mathematical expressions
    /[∑∏∫∂∇∞αβγδεζηθλμπσφψωΩ]/,           // Mathematical symbols
    /\b(sin|cos|tan|log|ln|exp|sinh|cosh|tanh)\s*\(/,  // Math functions
  ];
  
  // Weak indicators (need multiple to confirm)
  const weakMathPatterns = [
    /\b[a-z]\s*=\s*[^a-zA-Z\s]/,           // Variable assignments
    /\b(equation|formula|calculate|solve)/i, // Mathematical keywords
    /\b\d+\s*(V|A|W|Ω|Hz|m|s|kg|N|J|C)\b/, // Units
  ];
  
  const strongMatches = strongMathPatterns.filter(pattern => pattern.test(text)).length;
  const weakMatches = weakMathPatterns.filter(pattern => pattern.test(text)).length;
  
  return strongMatches > 0 || weakMatches >= 2;
};

// Ultra-conservative preprocessing - only fix obvious errors
const conservativePreprocess = (text) => {
  // Only apply preprocessing if we're confident it's mathematical content
  if (!isMathematicalContent(text)) {
    return text;
  }
  
  return text
    // Fix only the most obvious LaTeX errors
    .replace(/(?<!\\)frac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")
    .replace(/(?<!\\)sqrt\{([^}]+)\}/g, "\\sqrt{$1}")
    
    // Fix mathematical "to" only in very specific contexts
    .replace(/\b(\d+)\s+to\s+(\d+)\b/g, "$1 \\to $2")  // "1 to 5"
    .replace(/\bf\s*:\s*([A-Z])\s+to\s+([A-Z])\b/g, "f: $1 \\to $2")  // "f: A to B"
    
    // Fix common Greek letters only when followed by mathematical operators
    .replace(/\b(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega)\s*([=+\-*/])/g, "\\$1 $2")
    
    // Clean up encoding artifacts
    .replace(/\\\\([a-zA-Z]+)/g, "\\$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

// MathJax configuration optimized for robustness
const getMathJaxConfig = () => ({
  tex: {
    inlineMath: [['$', '$']],
    displayMath: [['$$', '$$']],
    processEscapes: true,
    processEnvironments: true,
    
    // Enhanced error handling
    formatError: (jax, err) => {
      console.warn('MathJax error:', err);
      return jax.formatError(err);
    },
    
    // Useful macros
    macros: {
      "\\f": ["\\frac{#1}{#2}", 2],
      "\\half": "\\frac{1}{2}",
      "\\ohm": "\\Omega",
      "\\degree": "^\\circ",
      "\\vv": ["\\vec{#1}", 1],
      "\\abs": ["\\left|#1\\right|", 1],
    },
    
    // Tags and labels
    tags: 'none',
    tagSide: 'right',
    tagIndent: '0.8em',
    
    // Packages
    packages: {
      '[+]': ['base', 'ams', 'newcommand', 'configmacros', 'action']
    }
  },
  
  // Output options
  svg: {
    fontCache: 'local',
    scale: 1,
    minScale: 0.5,
    mtextInheritFont: false,
    merrorInheritFont: true,
    mathmlSpacing: false,
    skipAttributes: {},
    exFactor: 0.5,
    displayAlign: 'center',
    displayIndent: '0'
  },
  
  // Startup options
  startup: {
    ready: () => {
      console.log('MathJax is loaded and ready');
    },
    typeset: false
  }
});

export default function MathJaxRenderer({ 
  content, 
  className = "",
  inline = false,
  enableFallback = true 
}) {
  const [hasError, setHasError] = useState(false);
  
  // Smart preprocessing with error handling
  const processedContent = useMemo(() => {
    if (!content || typeof content !== "string") return "";
    
    try {
      setHasError(false);
      return conservativePreprocess(content);
    } catch (error) {
      console.warn("Math preprocessing failed:", error);
      setHasError(true);
      return content; // Return original on error
    }
  }, [content]);

  // Error handler
  const handleError = useCallback((error) => {
    console.warn("MathJax rendering error:", error);
    setHasError(true);
  }, []);

  // Fallback to plain text if there's an error
  if (hasError && enableFallback) {
    return (
      <div className={`math-fallback ${className}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
        {process.env.NODE_ENV === 'development' && (
          <small className="text-red-500 block mt-1">
            ⚠️ Math rendering fallback active
          </small>
        )}
      </div>
    );
  }

  // Component configuration based on inline/block mode
  const components = inline ? {
    // Inline mode - no block elements
    p: ({ children }) => <>{children}</>,
    div: ({ children }) => <span>{children}</span>,
    h1: ({ children }) => <span className="font-bold text-lg">{children}</span>,
    h2: ({ children }) => <span className="font-bold">{children}</span>,
    h3: ({ children }) => <span className="font-semibold">{children}</span>,
    ul: ({ children }) => <span>{children}</span>,
    li: ({ children }) => <span className="mx-1">• {children}</span>,
    
    // Math error handling
    '.math-error': ({ children }) => (
      <span className="text-red-500 bg-red-50 px-1 rounded text-sm" title="Math error">
        {children}
      </span>
    ),
  } : {
    // Block mode - proper block elements
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-relaxed text-gray-800" {...props}>
        {children}
      </p>
    ),
    
    // Enhanced code blocks
    code: ({ inline: isInline, className: codeClass, children, ...props }) => {
      if (isInline) {
        return (
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
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
    
    // Math error handling
    '.math-error': ({ children }) => (
      <div className="text-red-500 bg-red-50 p-2 rounded border border-red-200 my-2">
        <strong>Math Rendering Error:</strong> {children}
      </div>
    ),
  };

  const WrapperComponent = inline ? 'span' : 'div';

  return (
    <WrapperComponent className={`mathjax-content ${inline ? 'inline' : 'block'} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeMathjax, getMathJaxConfig()]]}
        components={components}
        onError={handleError}
      >
        {processedContent}
      </ReactMarkdown>
    </WrapperComponent>
  );
}

// Utility hooks and functions
export const useMathContentDetection = (content) => {
  return useMemo(() => isMathematicalContent(content), [content]);
};

export const preprocessMathSafely = (text) => {
  try {
    return conservativePreprocess(text);
  } catch (error) {
    console.warn("Safe math preprocessing failed:", error);
    return text;
  }
};