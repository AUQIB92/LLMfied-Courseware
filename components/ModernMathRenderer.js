import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * Modern Math Renderer - State-of-the-Art Approach (2024)
 * 
 * Based on research of industry leaders (Notion, Obsidian, Jupyter):
 * 
 * 1. CONTENT-FIRST: Detect mathematical context before processing
 * 2. MINIMAL PREPROCESSING: Only fix obvious errors, preserve text
 * 3. PROGRESSIVE ENHANCEMENT: Plain text → Math detection → Rendering
 * 4. GRACEFUL DEGRADATION: Multiple fallback levels
 * 5. PERFORMANCE OPTIMIZED: Lazy loading and memoization
 * 6. ERROR RESILIENT: Proper error boundaries and recovery
 */

// Advanced mathematical content detection (inspired by Obsidian)
const detectMathematicalContent = (text) => {
  if (!text || typeof text !== "string") return { hasMath: false, confidence: 0 };

  // High-confidence math indicators
  const strongIndicators = [
    /\$[^$\n]+\$/g,                           // Inline math delimiters
    /\$\$[\s\S]+?\$\$/g,                      // Block math delimiters
    /\\(?:frac|sqrt|sum|int|lim|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega|infty)\b/g,
    /\\[a-zA-Z]+\{[^}]*\}/g,                  // LaTeX commands with braces
    /[∑∏∫∂∇∞αβγδεζηθλμπσφψωΩ]/g,            // Mathematical Unicode symbols
  ];

  // Medium-confidence indicators
  const mediumIndicators = [
    /\b\d+\s*[+\-×÷*/=≠≤≥]\s*\d+/g,          // Mathematical expressions
    /\b[a-z]\s*=\s*[^a-zA-Z\s]/g,            // Variable assignments
    /\b(?:sin|cos|tan|log|ln|exp|sinh|cosh|tanh)\s*\(/g, // Math functions
    /\b(?:equation|formula|calculate|solve|derivative|integral)\b/gi, // Math keywords
  ];

  // Low-confidence indicators (need multiple)
  const weakIndicators = [
    /\b\d+\s*[A-Z]\b/g,                      // Units (5V, 10A)
    /\b[a-z]_\d+\b/g,                        // Subscripts (x_1)
    /\b[a-z]\^\d+\b/g,                       // Superscripts (x^2)
  ];

  const strongCount = strongIndicators.reduce((sum, regex) => sum + (text.match(regex) || []).length, 0);
  const mediumCount = mediumIndicators.reduce((sum, regex) => sum + (text.match(regex) || []).length, 0);
  const weakCount = weakIndicators.reduce((sum, regex) => sum + (text.match(regex) || []).length, 0);

  // Calculate confidence score
  let confidence = 0;
  let hasMath = false;

  if (strongCount > 0) {
    hasMath = true;
    confidence = Math.min(0.95, 0.7 + strongCount * 0.1);
  } else if (mediumCount >= 2) {
    hasMath = true;
    confidence = Math.min(0.8, 0.5 + mediumCount * 0.1);
  } else if (mediumCount >= 1 && weakCount >= 2) {
    hasMath = true;
    confidence = 0.6;
  } else if (weakCount >= 4) {
    hasMath = true;
    confidence = 0.4;
  }

  return {
    hasMath,
    confidence,
    indicators: { strong: strongCount, medium: mediumCount, weak: weakCount }
  };
};

// Surgical preprocessing - only fix critical errors (inspired by Notion)
const surgicalPreprocess = (text, confidence) => {
  // Only apply preprocessing if we're confident it's mathematical content
  if (confidence < 0.5) {
    return text; // Return unchanged for low-confidence content
  }

  return text
    // Fix only the most critical LaTeX errors
    .replace(/(?<!\\)frac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")
    .replace(/(?<!\\)sqrt\{([^}]+)\}/g, "\\sqrt{$1}")
    
    // Fix mathematical arrows ONLY in very specific contexts
    .replace(/\b(\d+)\s+to\s+(\d+)\b/g, "$1 \\to $2")                    // "1 to 5"
    .replace(/\bf\s*:\s*([A-Z])\s+to\s+([A-Z])\b/g, "f: $1 \\to $2")     // "f: A to B"
    .replace(/\blim\s*_{[^}]*}\s+to\s+/g, "\\lim_{\\to ")                 // "lim to"
    
    // Fix only obvious Greek letters in mathematical contexts
    .replace(/\b(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega)\s*([=+\-*/])/g, "\\$1 $2")
    
    // Clean up encoding artifacts
    .replace(/\\\\([a-zA-Z]+)/g, "\\$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

// Enhanced KaTeX configuration (based on Jupyter's approach)
const getOptimizedKatexOptions = () => ({
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
  
  // Carefully curated macros (not too aggressive)
  macros: {
    // Essential shortcuts
    "\\f": "\\frac{#1}{#2}",
    "\\half": "\\frac{1}{2}",
    "\\third": "\\frac{1}{3}",
    "\\quarter": "\\frac{1}{4}",
    
    // Common engineering symbols
    "\\ohm": "\\Omega",
    "\\degree": "^\\circ",
    "\\micro": "\\mu",
    
    // Vector notation
    "\\vv": "\\vec{#1}",
    "\\unit": "\\hat{#1}",
    
    // Absolute value and norms
    "\\abs": "\\left|#1\\right|",
    "\\norm": "\\left\\|#1\\right\\|",
    
    // Derivatives
    "\\dd": "\\frac{d#1}{d#2}",
    "\\pd": "\\frac{\\partial#1}{\\partial#2}",
  }
});

// Error boundary with multiple fallback levels
const MathErrorBoundary = ({ children, fallbackLevels, currentLevel = 0 }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  const resetError = useCallback(() => {
    setHasError(false);
    setErrorInfo(null);
  }, []);

  useEffect(() => {
    if (hasError) {
      console.warn(`Math rendering error at level ${currentLevel}:`, errorInfo);
    }
  }, [hasError, errorInfo, currentLevel]);

  if (hasError && currentLevel < fallbackLevels.length - 1) {
    // Try next fallback level
    const NextFallback = fallbackLevels[currentLevel + 1];
    return (
      <MathErrorBoundary 
        fallbackLevels={fallbackLevels} 
        currentLevel={currentLevel + 1}
      >
        <NextFallback onRetry={resetError} />
      </MathErrorBoundary>
    );
  }

  if (hasError) {
    // Final fallback
    const FinalFallback = fallbackLevels[fallbackLevels.length - 1];
    return <FinalFallback error={errorInfo} onRetry={resetError} />;
  }

  try {
    return children;
  } catch (error) {
    setHasError(true);
    setErrorInfo(error);
    return null;
  }
};

export default function ModernMathRenderer({ 
  content, 
  className = "",
  inline = false,
  enableAnalytics = false,
  onRenderStrategy = null
}) {
  const [renderAttempts, setRenderAttempts] = useState(0);
  const renderRef = useRef(null);

  // Analyze content with caching
  const analysis = useMemo(() => {
    const result = detectMathematicalContent(content);
    
    if (enableAnalytics) {
      console.log("Math content analysis:", {
        content: content?.substring(0, 100) + "...",
        ...result
      });
    }
    
    return result;
  }, [content, enableAnalytics]);

  // Determine rendering strategy
  const strategy = useMemo(() => {
    const { hasMath, confidence } = analysis;
    
    if (!hasMath) return 'plain';
    if (confidence >= 0.8) return 'full-math';
    if (confidence >= 0.5) return 'safe-math';
    return 'minimal-math';
  }, [analysis]);

  // Notify strategy changes
  useEffect(() => {
    onRenderStrategy?.(strategy, analysis);
  }, [strategy, analysis, onRenderStrategy]);

  // Process content based on strategy
  const processedContent = useMemo(() => {
    if (!content) return "";
    
    switch (strategy) {
      case 'plain':
        return content;
      case 'minimal-math':
        return surgicalPreprocess(content, 0.3);
      case 'safe-math':
        return surgicalPreprocess(content, analysis.confidence);
      case 'full-math':
        return surgicalPreprocess(content, analysis.confidence);
      default:
        return content;
    }
  }, [content, strategy, analysis.confidence]);

  // Fallback components
  const PlainTextFallback = useCallback(({ onRetry }) => (
    <div className={`math-fallback-plain ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={onRetry}
          className="text-xs text-blue-500 underline mt-1"
        >
          Retry math rendering
        </button>
      )}
    </div>
  ), [content, className]);

  const MinimalMathFallback = useCallback(({ onRetry }) => (
    <div className={`math-fallback-minimal ${className}`}>
      <ReactMarkdown>{surgicalPreprocess(content, 0.2)}</ReactMarkdown>
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-yellow-600 mt-1">
          Minimal math processing active
          <button onClick={onRetry} className="ml-2 text-blue-500 underline">
            Retry
          </button>
        </div>
      )}
    </div>
  ), [content, className]);

  const FinalFallback = useCallback(({ error, onRetry }) => (
    <div className={`math-fallback-final ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-red-500 mt-1 p-1 bg-red-50 rounded">
          Math rendering failed: {error?.message}
          <button onClick={onRetry} className="ml-2 text-blue-500 underline">
            Retry
          </button>
        </div>
      )}
    </div>
  ), [content, className]);

  // Component configuration
  const components = inline ? {
    p: ({ children }) => <>{children}</>,
    div: ({ children }) => <span>{children}</span>,
    h1: ({ children }) => <span className="font-bold text-lg">{children}</span>,
    h2: ({ children }) => <span className="font-bold">{children}</span>,
    h3: ({ children }) => <span className="font-semibold">{children}</span>,
    ul: ({ children }) => <span>{children}</span>,
    li: ({ children }) => <span className="mx-1">• {children}</span>,
  } : {
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-relaxed text-gray-800" {...props}>
        {children}
      </p>
    ),
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
  };

  // Main render logic
  const MainRenderer = useCallback(() => {
    const WrapperComponent = inline ? 'span' : 'div';
    
    return (
      <WrapperComponent 
        ref={renderRef}
        className={`modern-math-content ${strategy} ${inline ? 'inline' : 'block'} ${className}`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, getOptimizedKatexOptions()]]}
          components={components}
        >
          {processedContent}
        </ReactMarkdown>
      </WrapperComponent>
    );
  }, [processedContent, strategy, inline, className, components]);

  // Render with error boundary and fallbacks
  return (
    <MathErrorBoundary 
      fallbackLevels={[MainRenderer, MinimalMathFallback, PlainTextFallback, FinalFallback]}
    >
      <MainRenderer />
    </MathErrorBoundary>
  );
}

// Utility hooks for advanced usage
export const useMathAnalysis = (content) => {
  return useMemo(() => detectMathematicalContent(content), [content]);
};

export const useRenderingStrategy = (content, options = {}) => {
  const analysis = useMathAnalysis(content);
  
  return useMemo(() => {
    const { hasMath, confidence } = analysis;
    const { confidenceThreshold = 0.5, forceStrategy = null } = options;
    
    if (forceStrategy) return forceStrategy;
    if (!hasMath) return 'plain';
    if (confidence >= 0.8) return 'full-math';
    if (confidence >= confidenceThreshold) return 'safe-math';
    return 'minimal-math';
  }, [analysis, options]);
};