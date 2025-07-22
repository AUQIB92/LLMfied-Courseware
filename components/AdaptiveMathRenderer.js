import React, { useMemo, useState, Suspense, lazy } from "react";
import ReactMarkdown from "react-markdown";

/**
 * Adaptive Math Renderer - State-of-the-art approach
 * 
 * This renderer intelligently chooses the best rendering strategy based on:
 * 1. Content complexity analysis
 * 2. Performance requirements  
 * 3. Error probability assessment
 * 4. Context (inline vs block)
 * 
 * Rendering Strategies:
 * - Simple text: No processing (fastest)
 * - Basic math: Minimal processing with KaTeX
 * - Complex math: Full MathJax processing
 * - Error cases: Graceful fallback to plain text
 */

// Lazy load heavy renderers for better performance
const MathJaxRenderer = lazy(() => import('./MathJaxRenderer'));
const SmartMathRenderer = lazy(() => import('./SmartMathRenderer'));

// Content complexity analyzer
const analyzeContentComplexity = (text) => {
  if (!text || typeof text !== "string") {
    return { level: 'none', confidence: 1.0, indicators: [] };
  }

  const indicators = {
    // Simple math indicators
    simple: [
      /\$[^$\n]{1,20}\$/g,                    // Short inline math
      /\b\d+\s*[+\-*/=]\s*\d+\b/g,          // Basic arithmetic
      /\b[a-z]\s*=\s*\d+\b/g,                // Simple assignments
    ],
    
    // Moderate complexity indicators  
    moderate: [
      /\\(frac|sqrt)\{[^}]+\}\{?[^}]*\}?/g,  // Fractions, square roots
      /\$\$[^$]{1,100}\$\$/g,                // Medium block math
      /\\[a-zA-Z]+\{[^}]*\}/g,               // LaTeX commands
      /[αβγδεθλμπσφω]/g,                     // Greek letters
    ],
    
    // Complex math indicators
    complex: [
      /\\(sum|int|lim|prod)_\{[^}]+\}\^\{[^}]+\}/g,  // Advanced operators
      /\$\$[^$]{100,}\$\$/g,                         // Long block math
      /\\(begin|end)\{[^}]+\}/g,                     // LaTeX environments
      /\\(matrix|array|align)/g,                     // Advanced structures
      /[∑∏∫∂∇]/g,                                    // Advanced symbols
    ],
    
    // Error-prone patterns
    risky: [
      /\\to\b/g,                             // Problematic arrow conversions
      /(?<!\\)[a-zA-Z]+\{/g,                 // Missing backslashes
      /\$[^$]*\n[^$]*\$/g,                   // Multi-line inline math
      /\\\\+/g,                              // Multiple backslashes
    ]
  };

  const counts = {
    simple: indicators.simple.reduce((sum, pattern) => sum + (text.match(pattern) || []).length, 0),
    moderate: indicators.moderate.reduce((sum, pattern) => sum + (text.match(pattern) || []).length, 0),
    complex: indicators.complex.reduce((sum, pattern) => sum + (text.match(pattern) || []).length, 0),
    risky: indicators.risky.reduce((sum, pattern) => sum + (text.match(pattern) || []).length, 0),
  };

  const total = counts.simple + counts.moderate + counts.complex;
  
  // Determine complexity level
  let level, confidence;
  
  if (total === 0) {
    level = 'none';
    confidence = 1.0;
  } else if (counts.complex > 0 || counts.risky > 2) {
    level = 'complex';
    confidence = 0.8 - (counts.risky * 0.1);
  } else if (counts.moderate > 0 || total > 3) {
    level = 'moderate';
    confidence = 0.9 - (counts.risky * 0.05);
  } else {
    level = 'simple';
    confidence = 0.95 - (counts.risky * 0.02);
  }

  return {
    level,
    confidence: Math.max(0.1, Math.min(1.0, confidence)),
    indicators: counts,
    totalMathElements: total,
    riskScore: counts.risky
  };
};

// Ultra-safe text processor - only handles the safest cases
const ultraSafeProcess = (text) => {
  // Only process if we're very confident it won't break regular text
  return text
    // Fix only obvious LaTeX errors with high confidence
    .replace(/(?<!\\)frac\{(\d+)\}\{(\d+)\}/g, "\\frac{$1}{$2}")  // Only numeric fractions
    .replace(/(?<!\\)sqrt\{(\d+)\}/g, "\\sqrt{$1}")               // Only numeric square roots
    
    // Fix mathematical "to" only between numbers
    .replace(/\b(\d+)\s+to\s+(\d+)\b/g, "$1 \\to $2")
    
    // Clean up obvious encoding issues
    .replace(/\\\\([a-zA-Z]+)/g, "\\$1")
    .replace(/&amp;/g, "&");
};

// Loading component
const MathLoadingFallback = ({ inline = false }) => (
  <span className={`math-loading ${inline ? 'inline' : 'block'}`}>
    <span className="animate-pulse bg-gray-200 rounded px-2 py-1">
      {inline ? "⋯" : "Loading math..."}
    </span>
  </span>
);

// Error boundary component
const MathErrorBoundary = ({ children, fallback, onError }) => {
  const [hasError, setHasError] = useState(false);
  
  React.useEffect(() => {
    const handleError = (error) => {
      console.warn("Math rendering error caught:", error);
      setHasError(true);
      onError?.(error);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);
  
  if (hasError) {
    return fallback;
  }
  
  return children;
};

export default function AdaptiveMathRenderer({ 
  content, 
  className = "",
  inline = false,
  forceStrategy = null,  // 'simple', 'moderate', 'complex', 'none'
  onStrategyChange = null,
  enableAnalytics = false
}) {
  const [renderError, setRenderError] = useState(null);
  
  // Analyze content complexity
  const analysis = useMemo(() => {
    const result = analyzeContentComplexity(content);
    
    if (enableAnalytics) {
      console.log("Content analysis:", result);
    }
    
    return result;
  }, [content, enableAnalytics]);

  // Determine rendering strategy
  const strategy = useMemo(() => {
    if (forceStrategy) return forceStrategy;
    
    const { level, confidence, riskScore } = analysis;
    
    // If confidence is too low or risk is too high, use safest approach
    if (confidence < 0.5 || riskScore > 3) {
      return 'safe';
    }
    
    return level;
  }, [analysis, forceStrategy]);

  // Notify strategy changes
  React.useEffect(() => {
    onStrategyChange?.(strategy, analysis);
  }, [strategy, analysis, onStrategyChange]);

  // Error handler
  const handleError = React.useCallback((error) => {
    console.warn(`Math rendering error (${strategy}):`, error);
    setRenderError(error);
  }, [strategy]);

  // Render based on strategy
  const renderContent = () => {
    if (!content) return null;

    switch (strategy) {
      case 'none':
        // No math processing - fastest
        return (
          <ReactMarkdown className={className}>
            {content}
          </ReactMarkdown>
        );

      case 'simple':
        // Ultra-safe processing only
        return (
          <ReactMarkdown className={className}>
            {ultraSafeProcess(content)}
          </ReactMarkdown>
        );

      case 'moderate':
        // Use smart renderer with KaTeX
        return (
          <Suspense fallback={<MathLoadingFallback inline={inline} />}>
            <SmartMathRenderer 
              content={content}
              className={className}
              inline={inline}
              fallbackToPlainText={true}
            />
          </Suspense>
        );

      case 'complex':
        // Use MathJax for complex content
        return (
          <Suspense fallback={<MathLoadingFallback inline={inline} />}>
            <MathJaxRenderer 
              content={content}
              className={className}
              inline={inline}
              enableFallback={true}
            />
          </Suspense>
        );

      case 'safe':
      default:
        // Safest fallback - minimal processing
        return (
          <ReactMarkdown className={className}>
            {ultraSafeProcess(content)}
          </ReactMarkdown>
        );
    }
  };

  // Error fallback
  if (renderError) {
    return (
      <div className={`math-error-fallback ${className}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-red-500 mt-1 p-1 bg-red-50 rounded">
            Strategy: {strategy} | Error: {renderError.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <MathErrorBoundary 
      onError={handleError}
      fallback={
        <ReactMarkdown className={className}>
          {content}
        </ReactMarkdown>
      }
    >
      {renderContent()}
    </MathErrorBoundary>
  );
}

// Utility hooks
export const useContentAnalysis = (content) => {
  return useMemo(() => analyzeContentComplexity(content), [content]);
};

export const useMathStrategy = (content, options = {}) => {
  const analysis = useContentAnalysis(content);
  
  return useMemo(() => {
    const { level, confidence, riskScore } = analysis;
    
    if (confidence < (options.confidenceThreshold || 0.5) || 
        riskScore > (options.riskThreshold || 3)) {
      return 'safe';
    }
    
    return level;
  }, [analysis, options]);
};