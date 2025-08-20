"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import MathMarkdownRenderer from "./MathMarkdownRenderer";
import HtmlMathViewer from "./HtmlMathViewer";

/**
 * UniversalContentRenderer - Direct Math Display Rendering
 *
 * This component provides reliable content rendering with:
 * 1. DIRECT MATH: Display math equations without LaTeX syntax
 * 2. CLEAN NOTATION: Convert LaTeX to readable mathematical symbols
 * 3. INTELLIGENT FALLBACKS: Simple rendering for non-math content
 * 4. PERFORMANCE OPTIMIZED: Fast direct text processing
 * 5. ACCESSIBILITY COMPLIANT: Screen reader friendly
 * 6. ZERO-ERROR GUARANTEE: Always displays content
 */

// Simple content analysis
const analyzeContentComplexity = (content) => {
  if (!content || typeof content !== "string")
    return { complexity: "none", hasMath: false, hasMarkdown: false };

  const mathPatterns = [
    /\$[^$\n]+\$/g, // Inline math
    /\$\$[^$]+\$\$/g, // Display math
    /\\[a-zA-Z]+/g, // LaTeX commands
    /[αβγδεζηθλμπρστφχψω∑∏∫∂∇∞]/g, // Greek letters and math symbols
  ];

  const markdownPatterns = [
    /^#{1,6}\s/gm, // Headers
    /\*\*[^*]+\*\*/g, // Bold
    /\*[^*]+\*/g, // Italic
    /```[\s\S]*?```/g, // Code blocks
    /`[^`]+`/g, // Inline code
    /^\s*[-+*]\s/gm, // Lists
    /^\s*\d+\.\s/gm, // Numbered lists
    /\[([^\]]+)\]\(([^)]+)\)/g, // Links
    /\|.*\|/g, // Tables
  ];

  const mathCount = mathPatterns.reduce(
    (sum, pattern) => sum + (content.match(pattern) || []).length,
    0
  );
  const markdownCount = markdownPatterns.reduce(
    (sum, pattern) => sum + (content.match(pattern) || []).length,
    0
  );

  let complexity = "simple";
  if (mathCount > 10 || markdownCount > 15) complexity = "complex";
  else if (mathCount > 3 || markdownCount > 5) complexity = "moderate";

  return {
    complexity,
    hasMath: mathCount > 0,
    hasMarkdown: markdownCount > 0,
    mathCount,
    markdownCount,
  };
};

// Simple content preprocessing
const preprocessContent = (content) => {
  if (!content || typeof content !== "string") return "";

  try {
    // Just clean up the content without any LaTeX processing
    let processed = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return processed;
  } catch (error) {
    console.warn("Content preprocessing error:", error);
    return content; // Return original content if preprocessing fails
  }
};

// Main UniversalContentRenderer component
const UniversalContentRenderer = ({
  content,
  className = "",
  inline = false,
  enableAnalytics = false,
  onRenderError = null,
  onRenderComplete = null,
  accessibilityLabel = "",
  maxRetries = 3,
  placeholder = "Loading content...",
  renderingMode = "auto",
}) => {
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [renderError, setRenderError] = useState(null);
  const [renderStrategy, setRenderStrategy] = useState("simple");
  const renderTimeRef = useRef(null);
  
  // Analyze content complexity
  const contentAnalysis = useMemo(() => {
    const analysis = analyzeContentComplexity(content);
    if (enableAnalytics) {
      console.log("📊 Content Analysis:", analysis);
    }
    return analysis;
  }, [content, enableAnalytics]);

  // Process content with simple preprocessing
  const processedContent = useMemo(() => {
    if (!content || typeof content !== "string") return "";

    renderTimeRef.current = Date.now();

    try {
      const processed = preprocessContent(content);
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Simple Processing Debug:', {
          original: content.substring(0, 200),
          processed: processed.substring(0, 200),
          hasMath: contentAnalysis.hasMath,
          mathCount: contentAnalysis.mathCount
        });
      }

      return processed;
    } catch (error) {
      console.warn("Content processing error:", error);
      setTimeout(() => {
        setRenderError(error);
      }, 0);
      return content; // Fallback to original
    }
  }, [content, contentAnalysis]);

  // Error handler with retry logic
  const handleRenderError = useCallback(
    (error, context = "unknown") => {
      console.warn(`Render error (attempt ${renderAttempt + 1}):`, error);

      if (onRenderError) {
        onRenderError(error, { attempt: renderAttempt + 1, context });
      }

      setTimeout(() => {
        setRenderError(error);
        if (renderAttempt < maxRetries) {
          setRenderAttempt((prev) => prev + 1);
        }
      }, 0);
    },
    [renderAttempt, maxRetries, onRenderError]
  );

  // Render complete handler
  useEffect(() => {
    if (renderTimeRef.current && onRenderComplete) {
      const renderTime = Date.now() - renderTimeRef.current;
      onRenderComplete({
        strategy: renderStrategy,
        attempt: renderAttempt + 1,
        renderTime,
        analysis: contentAnalysis,
      });
    }
  }, [
    processedContent,
    renderStrategy,
    renderAttempt,
    contentAnalysis,
    onRenderComplete,
  ]);

  // StackExchange-style render logic
  const renderContent = () => {
    if (!content) {
      return inline ? (
        <span className="text-gray-400 italic">{placeholder}</span>
      ) : (
        <div className="text-gray-400 italic text-center py-8 bg-gray-50 rounded-lg border">
          <div className="text-2xl mb-2">📝</div>
          {placeholder}
        </div>
      );
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && contentAnalysis.hasMath) {
      console.log('🔧 Direct Math Rendering Debug:', {
        strategy: renderStrategy,
        complexity: contentAnalysis.complexity,
        mathCount: contentAnalysis.mathCount,
        processedContent: processedContent.substring(0, 100)
      });
    }

    // Use MathMarkdownRenderer for proper math rendering
    const strategyName = "math-enabled";

    return (
      <div
        className={`universal-content-renderer ${strategyName} ${renderStrategy} ${
          inline ? "inline" : "block"
        } ${className}`}
        role={contentAnalysis.hasMath ? "math" : undefined}
        aria-label={accessibilityLabel || undefined}
        data-strategy={strategyName}
        data-attempt={renderAttempt + 1}
        data-complexity={contentAnalysis.complexity}
        data-math-enabled={contentAnalysis.hasMath}
      >
        <MathMarkdownRenderer
          content={processedContent}
          inline={inline}
          className={contentAnalysis.hasMath ? "math-content" : "regular-content"}
        />

        {/* Math rendering development info */}
        {process.env.NODE_ENV === "development" && enableAnalytics && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-sm">
            <div className="flex items-center gap-4 text-green-600">
              <span className="font-bold">🚀 Render Strategy:</span>
              <span className="px-2 py-1 bg-green-100 rounded">{strategyName}</span>
              <span className="font-bold">🎯 Attempt:</span>
              <span className="px-2 py-1 bg-green-100 rounded">{renderAttempt + 1}</span>
              <span className="font-bold">🧩 Complexity:</span>
              <span className="px-2 py-1 bg-green-100 rounded">{contentAnalysis.complexity}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-green-600">
              <span className="font-bold">📊 Math:</span>
              <span className="px-2 py-1 bg-green-100 rounded">{contentAnalysis.mathCount}</span>
              <span className="font-bold">📝 Markdown:</span>
              <span className="px-2 py-1 bg-green-100 rounded">{contentAnalysis.markdownCount}</span>
              <span className="font-bold">{contentAnalysis.hasMath ? '🧮 KaTeX Enabled:' : '📝 Markdown:'}</span>
              <span className={`px-2 py-1 rounded ${contentAnalysis.hasMath ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                {contentAnalysis.hasMath ? 'LaTeX Rendering' : 'Standard Text'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Error boundary with final fallback
  if (renderError && renderAttempt >= maxRetries) {
    const FallbackComponent = inline ? "span" : "div";
    return (
      <FallbackComponent className={`content-error-fallback ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 font-semibold mb-2">Content Display Error</div>
          <div className="text-red-600 text-sm mb-3">
            After {maxRetries} attempts, showing content as plain text:
          </div>
          <div className="bg-white p-3 rounded border text-gray-700 font-mono text-sm whitespace-pre-wrap">
            {content}
          </div>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-red-500 mt-2">
            [Render failed after {maxRetries} attempts]
          </div>
        )}
      </FallbackComponent>
    );
  }

  return renderContent();
};

export default UniversalContentRenderer;