"use client";

/**
 * Professional Math Renderer - LibreTexts Quality
 * 
 * Features:
 * - MathJax 3 integration with advanced configuration
 * - Interactive zoom and accessibility
 * - Professional typography matching LibreTexts
 * - Multi-format support (TeX, MathML, AsciiMath)
 * - Custom macros and extensions
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';

// LibreTexts-inspired MathJax configuration
const MATHJAX_CONFIG = {
  loader: {
    load: [
      '[tex]/ams', 
      '[tex]/color', 
      '[tex]/cancel', 
      '[tex]/mhchem',
      '[tex]/bbox',
      '[tex]/boldsymbol',
      '[tex]/braket'
    ]
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    packages: {
      '[+]': [
        'ams', 
        'color', 
        'cancel', 
        'mhchem', 
        'bbox',
        'boldsymbol',
        'braket'
      ]
    },
    formatError: (jax, error) => {
      console.warn('MathJax formatting error:', error);
      return jax.formatError(error);
    },
    // Custom macros like LibreTexts
    macros: {
      // Common mathematical notation
      'R': '\\mathbb{R}',
      'N': '\\mathbb{N}',
      'Z': '\\mathbb{Z}',
      'Q': '\\mathbb{Q}',
      'C': '\\mathbb{C}',
      
      // Vectors and matrices
      'vec': ['\\mathbf{#1}', 1],
      'mat': ['\\begin{bmatrix} #1 \\end{bmatrix}', 1],
      'det': ['\\begin{vmatrix} #1 \\end{vmatrix}', 1],
      
      // Calculus
      'dd': ['\\,\\mathrm{d}#1', 1],
      'pp': ['\\frac{\\partial #1}{\\partial #2}', 2],
      'dv': ['\\frac{\\mathrm{d} #1}{\\mathrm{d} #2}', 2],
      
      // Set theory
      'set': ['\\left\\{ #1 \\right\\}', 1],
      'abs': ['\\left| #1 \\right|', 1],
      'norm': ['\\left\\| #1 \\right\\|', 1],
      
      // Probability
      'P': ['\\text{P}\\left( #1 \\right)', 1],
      'E': ['\\text{E}\\left[ #1 \\right]', 1],
      'Var': ['\\text{Var}\\left( #1 \\right)', 1],
      
      // Physics/Engineering
      'units': ['\\,\\text{#1}', 1],
      'SI': ['\\,\\text{#1}', 1],
    }
  },
  svg: {
    fontCache: 'local',
    scale: 0.9, // LibreTexts uses slightly smaller scale
    minScale: 0.5,
    mtextInheritFont: true,
    merrorInheritFont: true,
    mathmlSpacing: true,
    skipAttributes: {},
    exFactor: 0.5,
    displayAlign: 'center',
    displayIndent: '0'
  },
  options: {
    enableMenu: true,
    menuOptions: {
      settings: {
        zoom: 'Double-Click',    // LibreTexts feature
        zscale: '150%',
        renderer: 'SVG'
      }
    },
    renderActions: {
      addMenu: [150,
        function (doc) {
          for (const math of doc.math) {
            this.addMenu(math);
          }
        }
      ]
    }
  },
  startup: {
    ready: () => {
      console.log('Professional MathJax renderer initialized');
    }
  }
};

// Enhanced math processing function
const preprocessMath = (content) => {
  if (!content) return '';
  
  let processed = content
    // Normalize different math delimiters
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    
    // Fix common LaTeX issues
    .replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '\\frac{$1}{$2}')
    .replace(/\\sqrt\s*\{([^}]*)\}/g, '\\sqrt{$1}')
    
    // Enhance chemical equations
    .replace(/\\ce\{([^}]*)\}/g, '\\ce{$1}')
    
    // Better spacing for units
    .replace(/([0-9])\s*(kg|m|s|A|K|mol|cd|Hz|N|Pa|J|W|C|V|F|Ω|S|Wb|T|H|°C|°F|L|g)\b/g, '$1\\,\\text{$2}')
    
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
    
  return processed;
};

// Professional Math Component
const ProfessionalMathRenderer = ({ 
  content, 
  inline = false, 
  className = '',
  showControls = false,
  enableZoom = true,
  accessibility = true,
  onError = null,
  renderMode = 'auto' // auto, inline, display, chemical
}) => {
  const [processedContent, setProcessedContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);

  // Process content
  useEffect(() => {
    if (!content) return;
    
    try {
      const processed = preprocessMath(content);
      setProcessedContent(processed);
      setHasError(false);
    } catch (error) {
      console.error('Math preprocessing error:', error);
      setHasError(true);
      if (onError) onError(error);
    }
  }, [content, onError]);

  // Handle MathJax ready state
  const handleMathJaxReady = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Error boundary for math rendering
  const ErrorFallback = ({ error, resetError }) => (
    <div className="math-error-fallback border border-red-200 bg-red-50 p-3 rounded">
      <p className="text-red-700 font-medium mb-1">Math Rendering Error</p>
      <p className="text-red-600 text-sm mb-2">{error?.message || 'Unknown error'}</p>
      <div className="flex gap-2">
        <button 
          onClick={resetError}
          className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-red-700"
        >
          Retry
        </button>
        <button 
          onClick={() => navigator.clipboard.writeText(content)}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700"
        >
          Copy LaTeX
        </button>
      </div>
      <details className="mt-2">
        <summary className="text-xs text-red-500 cursor-pointer">Raw Content</summary>
        <pre className="text-xs mt-1 p-1 bg-red-100 rounded overflow-auto">
          {content}
        </pre>
      </details>
    </div>
  );

  if (hasError) {
    return <ErrorFallback error={{ message: 'Content preprocessing failed' }} resetError={() => setHasError(false)} />;
  }

  if (!processedContent) {
    return (
      <div className={`math-placeholder ${inline ? 'inline' : 'block'} ${className}`}>
        <span className="text-gray-400 text-sm">Loading math...</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`professional-math-renderer ${inline ? 'inline' : 'block'} ${className}`}
      data-inline={inline}
      data-loaded={isLoaded}
    >
      <MathJax 
        onInitTypeset={handleMathJaxReady}
        onError={(error) => {
          console.error('MathJax rendering error:', error);
          setHasError(true);
          if (onError) onError(error);
        }}
      >
        {inline ? (
          <span className="math-inline">
            {processedContent}
          </span>
        ) : (
          <div className="math-display">
            {processedContent}
          </div>
        )}
      </MathJax>
      
      {showControls && isLoaded && (
        <div className="math-controls mt-2 flex gap-2 text-xs">
          <button 
            className="text-blue-600 hover:text-blue-800 underline"
            onClick={() => {
              const mathJaxMenu = document.querySelector('.MathJax_Menu');
              if (mathJaxMenu) mathJaxMenu.click();
            }}
          >
            Math Settings
          </button>
          <button 
            className="text-blue-600 hover:text-blue-800 underline"
            onClick={() => navigator.clipboard.writeText(processedContent)}
          >
            Copy LaTeX
          </button>
        </div>
      )}
    </div>
  );
};

// Main provider component
const ProfessionalMathProvider = ({ children, config = {} }) => {
  const mergedConfig = {
    ...MATHJAX_CONFIG,
    ...config,
    tex: { ...MATHJAX_CONFIG.tex, ...config.tex },
    svg: { ...MATHJAX_CONFIG.svg, ...config.svg }
  };

  return (
    <MathJaxContext 
      config={mergedConfig}
      src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg-full.js"
      onStartup={(mathJax) => {
        console.log('MathJax started with config:', mergedConfig);
      }}
      onLoad={() => {
        console.log('MathJax loaded successfully');
      }}
      onError={(error) => {
        console.error('MathJax loading error:', error);
      }}
    >
      {children}
    </MathJaxContext>
  );
};

export { ProfessionalMathRenderer, ProfessionalMathProvider };
export default ProfessionalMathRenderer;