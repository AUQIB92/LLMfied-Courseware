"use client";

/**
 * Enhanced Content Renderer with Professional Math
 * 
 * Integrates professional LibreTexts-quality math rendering
 * with intelligent content detection and processing
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { ProfessionalMathRenderer, ProfessionalMathProvider } from './ProfessionalMathRenderer';

// Enhanced content analysis
const analyzeContent = (content) => {
  if (!content || typeof content !== 'string') {
    return {
      hasMath: false,
      mathType: 'none',
      mathCount: 0,
      hasChemistry: false,
      complexity: 'simple'
    };
  }

  const analysis = {
    hasMath: false,
    mathType: 'none',
    mathCount: 0,
    hasChemistry: false,
    complexity: 'simple',
    mathExpressions: []
  };

  // Detect different types of math
  const inlineMath = content.match(/\$[^$\n]+\$/g) || [];
  const displayMath = content.match(/\$\$[^$]+\$\$/g) || [];
  const latexCommands = content.match(/\\[a-zA-Z]+/g) || [];
  const chemicalFormulas = content.match(/\\ce\{[^}]+\}/g) || [];

  analysis.mathCount = inlineMath.length + displayMath.length;
  analysis.hasMath = analysis.mathCount > 0 || latexCommands.length > 0;
  analysis.hasChemistry = chemicalFormulas.length > 0;
  analysis.mathExpressions = [...inlineMath, ...displayMath];

  // Determine math type
  if (analysis.hasChemistry) {
    analysis.mathType = 'chemical';
  } else if (displayMath.length > 0) {
    analysis.mathType = 'display';
  } else if (inlineMath.length > 0) {
    analysis.mathType = 'inline';
  } else if (latexCommands.length > 0) {
    analysis.mathType = 'mixed';
  }

  // Determine complexity
  if (analysis.mathCount > 10 || latexCommands.length > 20) {
    analysis.complexity = 'complex';
  } else if (analysis.mathCount > 3 || latexCommands.length > 5) {
    analysis.complexity = 'moderate';
  }

  return analysis;
};

// Smart content preprocessor
const preprocessContent = (content, analysis) => {
  if (!content || !analysis.hasMath) return content;

  let processed = content
    // Normalize different math delimiters to standard format
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    
    // Fix common LaTeX formatting issues
    .replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '\\frac{$1}{$2}')
    .replace(/\\sqrt\s*\{([^}]*)\}/g, '\\sqrt{$1}')
    .replace(/\\text\s*\{([^}]*)\}/g, '\\text{$1}')
    
    // Enhance readability
    .replace(/\s*\$\s*/g, '$')
    .replace(/\s*\$\$\s*/g, '$$')
    
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return processed;
};

// Custom components for enhanced rendering
const createEnhancedComponents = (mathAnalysis, options = {}) => {
  const {
    showMathControls = false,
    enableInteractive = true,
    onMathError = null
  } = options;

  return {
    // Enhanced paragraph handling with math detection
    p: ({ children, ...props }) => {
      const childrenArray = React.Children.toArray(children);
      const hasDisplayMath = childrenArray.some(child => 
        typeof child === 'string' && child.includes('$$')
      );

      if (hasDisplayMath) {
        return (
          <div className="math-paragraph mb-6" {...props}>
            {children}
          </div>
        );
      }

      return (
        <p className="mb-4 leading-relaxed text-gray-800" {...props}>
          {children}
        </p>
      );
    },

    // Enhanced code handling for LaTeX
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match?.[1];

      // Handle LaTeX code blocks
      if (language === 'latex' || language === 'tex') {
        return (
          <div className="math-code-block border rounded-lg p-4 bg-gray-50 my-4">
            <div className="text-sm text-gray-600 mb-2 font-medium">LaTeX Code</div>
            <ProfessionalMathRenderer 
              content={String(children)}
              showControls={showMathControls}
              onError={onMathError}
            />
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">View Source</summary>
              <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                <code>{children}</code>
              </pre>
            </details>
          </div>
        );
      }

      // Regular code handling
      if (inline) {
        return (
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }

      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    },

    // Enhanced blockquote for math theorems
    blockquote: ({ children, ...props }) => {
      const text = React.Children.toArray(children).join('');
      const isTheorem = /^(theorem|definition|lemma|corollary|proposition)/i.test(text);

      if (isTheorem) {
        return (
          <div className="math-theorem-box" {...props}>
            {children}
          </div>
        );
      }

      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4" {...props}>
          {children}
        </blockquote>
      );
    },

    // Enhanced table handling
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),

    th: ({ children, ...props }) => (
      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>
        {children}
      </th>
    ),

    td: ({ children, ...props }) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" {...props}>
        {children}
      </td>
    ),

    // Enhanced list handling
    ul: ({ children, ...props }) => (
      <ul className="space-y-2 mb-4 pl-6 list-disc" {...props}>
        {children}
      </ul>
    ),

    ol: ({ children, ...props }) => (
      <ol className="space-y-2 mb-4 pl-6 list-decimal" {...props}>
        {children}
      </ol>
    ),

    li: ({ children, ...props }) => (
      <li className="text-gray-800 leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Enhanced heading handling
    h1: ({ children, ...props }) => (
      <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 border-b-2 border-blue-500 pb-2" {...props}>
        {children}
      </h1>
    ),

    h2: ({ children, ...props }) => (
      <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6 border-l-4 border-green-500 pl-4" {...props}>
        {children}
      </h2>
    ),

    h3: ({ children, ...props }) => (
      <h3 className="text-xl font-medium text-gray-900 mb-3 mt-5" {...props}>
        {children}
      </h3>
    ),
  };
};

// Main Enhanced Content Renderer
const EnhancedContentRenderer = ({
  content,
  className = '',
  showMathControls = false,
  enableInteractive = true,
  showAnalytics = false,
  onMathError = null,
  onRenderComplete = null,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // Analyze content
  const contentAnalysis = useMemo(() => {
    return analyzeContent(content);
  }, [content]);

  // Preprocess content
  const processedContent = useMemo(() => {
    return preprocessContent(content, contentAnalysis);
  }, [content, contentAnalysis]);

  // Create custom components
  const components = useMemo(() => {
    return createEnhancedComponents(contentAnalysis, {
      showMathControls,
      enableInteractive,
      onMathError: (error) => {
        setRenderError(error);
        if (onMathError) onMathError(error);
      }
    });
  }, [contentAnalysis, showMathControls, enableInteractive, onMathError]);

  // Handle render completion
  useEffect(() => {
    if (processedContent && !renderError) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
        if (onRenderComplete) {
          onRenderComplete({
            analysis: contentAnalysis,
            processed: processedContent,
            hasError: !!renderError
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [processedContent, renderError, contentAnalysis, onRenderComplete]);

  // Error boundary
  if (renderError) {
    return (
      <div className="enhanced-renderer-error border border-red-200 bg-red-50 p-4 rounded-lg">
        <h3 className="text-red-800 font-medium mb-2">Rendering Error</h3>
        <p className="text-red-700 mb-3">{renderError.message}</p>
        <button 
          onClick={() => setRenderError(null)}
          className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className={`enhanced-content-renderer loading ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-content-renderer ${className}`} data-complexity={contentAnalysis.complexity}>
      {/* Professional Math Provider wraps content if math is detected */}
      {contentAnalysis.hasMath ? (
        <ProfessionalMathProvider>
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            components={components}
            {...props}
          >
            {processedContent}
          </ReactMarkdown>
        </ProfessionalMathProvider>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
          {...props}
        >
          {processedContent}
        </ReactMarkdown>
      )}

      {/* Analytics panel */}
      {showAnalytics && (
        <div className="mt-6 p-3 bg-gray-50 border rounded-lg text-xs">
          <h4 className="font-medium mb-2">Content Analysis</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>Math Type: <span className="font-mono">{contentAnalysis.mathType}</span></div>
            <div>Math Count: <span className="font-mono">{contentAnalysis.mathCount}</span></div>
            <div>Complexity: <span className="font-mono">{contentAnalysis.complexity}</span></div>
            <div>Chemistry: <span className="font-mono">{contentAnalysis.hasChemistry ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedContentRenderer;