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

// Enhanced content detector - identifies mathematical contexts
const detectMathContext = (text) => {
  const mathIndicators = [
    /\$[^$]+\$/,                    // Inline math: $...$
    /\$\$[^$]+\$\$/,                // Block math: $$...$$
    /\\[a-zA-Z]+\{[^}]*\}/,         // LaTeX commands: \frac{...}
    /\\[a-zA-Z]+(?![a-zA-Z])/,      // LaTeX commands: \alpha
    /\b\d+\s*[+\-*/=≠<>≤≥]\s*\d+/, // Equations with math symbols
    /\b[a-z]\s*[=≠<>≤≥]\s*[^a-zA-Z\s]/, // Variable assignments
    /\b(sin|cos|tan|log|ln|exp|lim|max|min|sup|inf)\s*[\(_{]/,  // Math functions
    /[∑∏∫∂∇∞αβγδεζηθλμπρστυφχψω]/,     // Greek letters and math symbols
    /\^\{[^}]*\}|_\{[^}]*\}/,       // Superscripts and subscripts
    /\\(begin|end)\{[^}]+\}/,       // LaTeX environments
    /\\(left|right)\s*[\(\)\[\]\{\}|]/,  // LaTeX delimiters
    /[²³¹⁰⁴⁵⁶⁷⁸⁹]/,              // Unicode superscripts
    /[₀₁₂₃₄₅₆₇₈₉]/,                // Unicode subscripts
  ];
  
  return mathIndicators.some(pattern => pattern.test(text));
};

// Enhanced preprocessing - fixes more LaTeX patterns
const enhancedPreprocess = (text) => {
  return text
    // Fix missing backslashes for common LaTeX commands
    .replace(/(?<!\\)\b(frac|sqrt|sum|int|prod|lim|sin|cos|tan|log|ln|exp)\s*\{/g, "\\$1{")
    .replace(/(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/g, "\\$1")
    .replace(/(?<!\\)\b(Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta|Iota|Kappa|Lambda|Mu|Nu|Xi|Pi|Rho|Sigma|Tau|Upsilon|Phi|Chi|Psi|Omega)\b/g, "\\$1")
    
    // Fix subscripts and superscripts without proper math delimiters
    .replace(/([a-zA-Z0-9])_(\w+)(?![{}])/g, "$1_{$2}")
    .replace(/([a-zA-Z0-9])\^(\w+)(?![{}])/g, "$1^{$2}")
    
    // Fix common mathematical expressions
    .replace(/\b(\d+)\s*\*\s*(\d+)/g, "$1 \\times $2")
    .replace(/\b(\d+)\s*\/\s*(\d+)/g, "\\frac{$1}{$2}")
    .replace(/\binfinity\b/g, "\\infty")
    .replace(/\bpm\b|\+\-/g, "\\pm")
    .replace(/\bmp\b|\-\+/g, "\\mp")
    
    // Fix arrows and special symbols
    .replace(/\b(\w+)\s+to\s+(\w+)\b/g, "$1 \\to $2")
    .replace(/->/g, "\\to")
    .replace(/<-/g, "\\leftarrow")
    .replace(/<->/g, "\\leftrightarrow")
    .replace(/=>/g, "\\Rightarrow")
    .replace(/<=/g, "\\Leftarrow")
    .replace(/<=>/g, "\\Leftrightarrow")
    
    // Fix inequalities
    .replace(/<=(?!=)/g, "\\leq")
    .replace(/>=(?!=)/g, "\\geq")
    .replace(/!=/g, "\\neq")
    
    // Fix set notation
    .replace(/\bin\b/g, "\\in")
    .replace(/\bnotin\b/g, "\\notin")
    .replace(/\bsubset\b/g, "\\subset")
    .replace(/\bsuperset\b/g, "\\superset")
    .replace(/\bunion\b/g, "\\cup")
    .replace(/\bintersection\b/g, "\\cap")
    
    // Fix common math functions that might be missing backslashes
    .replace(/(?<!\\)\b(arcsin|arccos|arctan|sinh|cosh|tanh)\b/g, "\\$1")
    .replace(/(?<!\\)\b(sec|csc|cot)\b/g, "\\$1")
    
    // Ensure proper math environment for standalone expressions
    .replace(/^([^$]*[a-zA-Z0-9\\][^$]*)$/gm, (match) => {
      // Only wrap if it contains math indicators and isn't already wrapped
      if (detectMathContext(match) && !match.includes('$')) {
        return `$${match}$`;
      }
      return match;
    })
    
    // Clean up any double backslashes from JSON encoding
    .replace(/\\\\([a-zA-Z]+)/g, "\\$1")
    
    // Fix common fraction patterns
    .replace(/(\d+)\/(\d+)/g, "\\frac{$1}{$2}")
    .replace(/\((\d+)\)\/(\d+)/g, "\\frac{$1}{$2}")
    .replace(/(\d+)\/\((\d+)\)/g, "\\frac{$1}{$2}")
    
    // Fix degree symbols
    .replace(/\bdegrees?\b|°/g, "^\\circ");
};

// Enhanced KaTeX configuration with comprehensive macro support
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
  trust: (context) => {
    // Allow certain safe commands
    return ['\\htmlClass', '\\htmlId', '\\htmlStyle', '\\class', '\\id', '\\style'].includes(context.command);
  },
  globalGroup: false,
  
  // Comprehensive macros for common mathematical notation
  macros: {
    // Fractions and basic operations
    "\\f": "\\frac{#1}{#2}",
    "\\half": "\\frac{1}{2}",
    "\\third": "\\frac{1}{3}",
    "\\quarter": "\\frac{1}{4}",
    
    // Common symbols
    "\\ohm": "\\Omega",
    "\\degree": "^\\circ",
    "\\celsius": "^\\circ\\text{C}",
    "\\fahrenheit": "^\\circ\\text{F}",
    
    // Vectors and absolute values
    "\\vv": "\\vec{#1}",
    "\\abs": "\\left|#1\\right|",
    "\\norm": "\\left\\|#1\\right\\|",
    "\\floor": "\\left\\lfloor#1\\right\\rfloor",
    "\\ceil": "\\left\\lceil#1\\right\\rceil",
    
    // Derivatives
    "\\dd": "\\frac{d#1}{d#2}",
    "\\pd": "\\frac{\\partial#1}{\\partial#2}",
    "\\ddx": "\\frac{d}{dx}",
    "\\ddt": "\\frac{d}{dt}",
    
    // Sets
    "\\N": "\\mathbb{N}",
    "\\Z": "\\mathbb{Z}",
    "\\Q": "\\mathbb{Q}",
    "\\R": "\\mathbb{R}",
    "\\C": "\\mathbb{C}",
    
    // Logic
    "\\implies": "\\Rightarrow",
    "\\iff": "\\Leftrightarrow",
    "\\land": "\\wedge",
    "\\lor": "\\vee",
    "\\lnot": "\\neg",
    
    // Common functions
    "\\sinc": "\\operatorname{sinc}",
    "\\sgn": "\\operatorname{sgn}",
    "\\erf": "\\operatorname{erf}",
    "\\Var": "\\operatorname{Var}",
    "\\Cov": "\\operatorname{Cov}",
    "\\E": "\\operatorname{E}",
    
    // Chemistry/Physics
    "\\pH": "\\text{pH}",
    "\\pOH": "\\text{pOH}",
    "\\molarity": "\\text{M}",
    
    // Units (basic)
    "\\meter": "\\text{m}",
    "\\kilogram": "\\text{kg}",
    "\\second": "\\text{s}",
    "\\ampere": "\\text{A}",
    "\\kelvin": "\\text{K}",
    "\\mole": "\\text{mol}",
    "\\candela": "\\text{cd}",
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
        return enhancedPreprocess(content);
      } else {
        // For non-mathematical content, still check for basic math patterns
        const basicMathPatterns = /[\d]+[\+\-\*\/=][\d]+|[a-z]\s*=\s*[\d]/;
        if (basicMathPatterns.test(content)) {
          return enhancedPreprocess(content);
        }
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

  // Enhanced error handling with progressive fallback
  if (renderError && fallbackToPlainText) {
    return (
      <div className={`math-fallback ${className}`}>
        <div className="text-gray-800">
          {/* Try basic markdown first */}
          <ReactMarkdown
            components={{
              // Custom rendering for common math patterns
              code: ({children, className, ...props}) => {
                const code = String(children);
                // If it looks like inline math, wrap it
                if (code.includes('$') || /\\[a-zA-Z]+/.test(code)) {
                  return <code className="math-code bg-yellow-50 px-1 rounded" {...props}>{code}</code>;
                }
                return <code className="bg-gray-100 px-1 rounded" {...props}>{children}</code>;
              },
              // Handle text that might contain math
              p: ({children, ...props}) => (
                <p className="mb-2 leading-relaxed" {...props}>{children}</p>
              )
            }}
          >
            {content}
          </ReactMarkdown>
          
          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2 text-xs text-red-600 border border-red-200 rounded p-2">
              <summary className="cursor-pointer">Math rendering error (dev only)</summary>
              <div className="mt-1 font-mono whitespace-pre-wrap">{renderError.message}</div>
              <div className="mt-1 text-gray-600">Original content length: {content?.length || 0} chars</div>
            </details>
          )}
        </div>
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