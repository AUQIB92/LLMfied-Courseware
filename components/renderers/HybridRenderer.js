"use client"

import React, { useMemo, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * HybridRenderer - Best of both worlds approach
 * 
 * This renderer uses a sophisticated hybrid approach:
 * 1. KaTeX for speed and simple expressions
 * 2. Enhanced error recovery mechanisms
 * 3. Selective content processing
 * 4. Optimized for moderate complexity math
 */

// Detect specific math patterns that might cause rendering issues
const detectPotentialIssues = (text) => {
  const issues = [];
  
  // Check for unbalanced delimiters
  const dollarCount = (text.match(/\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    issues.push("unbalanced-delimiters");
  }
  
  // Check for unbalanced braces
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push("unbalanced-braces");
  }
  
  // Check for complex environments that KaTeX might struggle with
  if (text.match(/\\begin\{(align|matrix|pmatrix|bmatrix|vmatrix|array|cases)\}/)) {
    issues.push("complex-environments");
  }
  
  // Check for nested fractions (often problematic)
  if (text.match(/\\frac\{[^{}]*\\frac/)) {
    issues.push("nested-fractions");
  }
  
  // Check for unsupported commands
  const unsupportedCommands = text.match(/\\(substack|xrightarrow|xleftarrow|overparen|underparen|overbrace|underbrace|overrightarrow|overleftarrow)/g);
  if (unsupportedCommands && unsupportedCommands.length > 0) {
    issues.push("unsupported-commands");
  }
  
  return issues;
};

// Selective content processor - only fixes what needs fixing
const selectiveProcess = (text, issues) => {
  if (!text || issues.length === 0) return text;
  
  let processed = text;
  
  // Fix unbalanced delimiters
  if (issues.includes("unbalanced-delimiters")) {
    // Count $ characters and add one if odd
    const dollarCount = (processed.match(/\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
      processed = processed + "$";
    }
  }
  
  // Fix unbalanced braces
  if (issues.includes("unbalanced-braces")) {
    const openBraces = (processed.match(/\{/g) || []).length;
    const closeBraces = (processed.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      processed = processed + "}".repeat(openBraces - closeBraces);
    }
  }
  
  // Handle complex environments by ensuring they're properly formatted
  if (issues.includes("complex-environments")) {
    // Ensure all environments have matching end tags
    const beginEnvs = processed.match(/\\begin\{([^}]+)\}/g) || [];
    const endEnvs = processed.match(/\\end\{([^}]+)\}/g) || [];
    
    if (beginEnvs.length > endEnvs.length) {
      // Add missing end environments
      beginEnvs.forEach(beginEnv => {
        const envName = beginEnv.match(/\\begin\{([^}]+)\}/)[1];
        const endEnv = `\\end{${envName}}`;
        
        // Check if this end environment exists
        const endPattern = new RegExp(`\\\\end\\{${envName}\\}`);
        if (!processed.match(endPattern)) {
          processed = processed + endEnv;
        }
      });
    }
  }
  
  // Handle nested fractions by adding extra braces for clarity
  if (issues.includes("nested-fractions")) {
    processed = processed.replace(
      /(\\frac\{[^{}]*)(\\frac)([^{}]*\}\{[^{}]*\})/g,
      "$1{$2$3}"
    );
  }
  
  // Replace unsupported commands with alternatives
  if (issues.includes("unsupported-commands")) {
    processed = processed
      .replace(/\\substack\{([^}]+)\}/g, "\\begin{array}{c}$1\\end{array}")
      .replace(/\\xrightarrow\{([^}]+)\}/g, "\\rightarrow\\text{$1}")
      .replace(/\\xleftarrow\{([^}]+)\}/g, "\\leftarrow\\text{$1}")
      .replace(/\\overparen\{([^}]+)\}/g, "\\overline{($1)}")
      .replace(/\\underparen\{([^}]+)\}/g, "\\underline{($1)}")
      .replace(/\\overbrace\{([^}]+)\}/g, "\\overline{\\{$1\\}}")
      .replace(/\\underbrace\{([^}]+)\}/g, "\\underline{\\{$1\\}}")
      .replace(/\\overrightarrow\{([^}]+)\}/g, "\\vec{$1}")
      .replace(/\\overleftarrow\{([^}]+)\}/g, "\\vec{$1}");
  }
  
  return processed;
};

const HybridRenderer = ({ 
  content, 
  className = "", 
  inline = false,
  onError = null,
  accessibilityLabel = ""
}) => {
  const [renderingIssues, setRenderingIssues] = useState([]);
  
  // Detect potential issues in the content
  useEffect(() => {
    if (content) {
      const issues = detectPotentialIssues(content);
      setRenderingIssues(issues);
    }
  }, [content]);
  
  // Process content based on detected issues
  const processedContent = useMemo(() => {
    if (!content) return "";
    return selectiveProcess(content, renderingIssues);
  }, [content, renderingIssues]);

  // Enhanced KaTeX options with better error handling
  const katexOptions = useMemo(() => ({
    strict: false,
    output: 'html',
    throwOnError: false,
    errorColor: '#dc2626',
    colorIsTextColor: true,
    maxSize: Infinity,
    maxExpand: 1000,
    trust: false,
    
    // Comprehensive macros for better rendering
    macros: {
      // Fraction shortcuts
      "\\f": "\\frac{#1}{#2}",
      "\\half": "\\frac{1}{2}",
      "\\third": "\\frac{1}{3}",
      "\\quarter": "\\frac{1}{4}",
      
      // Common symbols
      "\\ohm": "\\Omega",
      "\\degree": "^\\circ",
      "\\micro": "\\mu",
      "\\resistivity": "\\rho",
      
      // Vector notation
      "\\vv": "\\vec{#1}",
      "\\unit": "\\hat{#1}",
      
      // Common functions
      "\\abs": "\\left|#1\\right|",
      "\\norm": "\\left\\|#1\\right\\|",
      "\\avg": "\\langle#1\\rangle",
      "\\ceil": "\\left\\lceil#1\\right\\rceil",
      "\\floor": "\\left\\lfloor#1\\right\\rfloor",
      
      // Derivatives
      "\\dd": "\\frac{d#1}{d#2}",
      "\\pd": "\\frac{\\partial#1}{\\partial#2}",
      
      // Limits and arrows
      "\\approaches": "\\to",
      "\\goesto": "\\mapsto",
      
      // Common constants
      "\\ee": "e",
      "\\ii": "i",
      "\\jj": "j",
      
      // Units (common in engineering)
      "\\volt": "\\text{V}",
      "\\amp": "\\text{A}",
      "\\watt": "\\text{W}",
      "\\henry": "\\text{H}",
      "\\farad": "\\text{F}",
      "\\meter": "\\text{m}",
      "\\second": "\\text{s}",
      "\\hertz": "\\text{Hz}",
    }
  }), []);

  // Custom components with enhanced error handling
  const components = useMemo(() => {
    if (inline) {
      return {
        // Inline components
        p: ({ children }) => <>{children}</>,
        div: ({ children }) => <span>{children}</span>,
        h1: ({ children }) => <span className="font-bold text-lg">{children}</span>,
        h2: ({ children }) => <span className="font-bold">{children}</span>,
        h3: ({ children }) => <span className="font-semibold">{children}</span>,
        ul: ({ children }) => <span className="inline-block">{children}</span>,
        li: ({ children }) => <span className="inline-block mx-1">• {children}</span>,
        
        // Enhanced error handling
        span: ({ className: spanClass, children, ...props }) => {
          if (spanClass === 'katex-error') {
            const errorMessage = String(children).trim();
            onError?.({ message: errorMessage, issues: renderingIssues });
            
            return (
              <span 
                className="text-red-500 bg-red-50 px-1 rounded text-sm" 
                title={`Math error: ${errorMessage}`}
                {...props}
              >
                {children}
              </span>
            );
          }
          return <span className={spanClass} {...props}>{children}</span>;
        },
      };
    }
    
    return {
      // Block components
      p: ({ children, ...props }) => (
        <p className="mb-4 leading-relaxed text-gray-800" {...props}>
          {children}
        </p>
      ),
      
      // Enhanced error handling
      span: ({ className: spanClass, children, ...props }) => {
        if (spanClass === 'katex-error') {
          const errorMessage = String(children).trim();
          onError?.({ message: errorMessage, issues: renderingIssues });
          
          return (
            <span 
              className="text-red-500 bg-red-50 px-1 rounded" 
              title={`Math error: ${errorMessage}`}
              {...props}
            >
              {children}
            </span>
          );
        }
        return <span className={spanClass} {...props}>{children}</span>;
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
  }, [inline, onError, renderingIssues]);

  const WrapperComponent = inline ? 'span' : 'div';
  
  // Accessibility attributes
  const accessibilityProps = {
    role: "math",
    "aria-label": accessibilityLabel || undefined,
    "data-issues": renderingIssues.length > 0 ? renderingIssues.join(',') : undefined
  };

  return (
    <WrapperComponent 
      className={`hybrid-renderer ${inline ? 'inline' : ''} ${className}`}
      {...accessibilityProps}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, katexOptions]]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
      
      {process.env.NODE_ENV === 'development' && renderingIssues.length > 0 && (
        <div className="text-xs text-amber-500 mt-1 hidden">
          Issues detected: {renderingIssues.join(', ')}
        </div>
      )}
    </WrapperComponent>
  );
};

export default HybridRenderer;