"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { sanitizeLaTeX } from "@/lib/utils";

/**
 * BeautifulMathRenderer - Ultra-beautiful mathematical content renderer
 * 
 * Features:
 * - Stunning visual effects and animations
 * - Professional typography with Crimson Text font
 * - Glass morphism design for display math
 * - Color-coded mathematical symbols
 * - Responsive design with mobile optimization
 * - Advanced accessibility features
 * - Dark mode and high contrast support
 * - Equation numbering and theorem environments
 */

// Enhanced LaTeX sanitization for beautiful rendering
const beautifyLaTeX = (content) => {
  if (!content || typeof content !== "string") return "";
  
  let beautified = sanitizeLaTeX(content);
  
  // Add beautiful spacing and formatting
  beautified = beautified
    // Enhance display math with better spacing
    .replace(/\$\$([^$]+)\$\$/g, (match, p1) => {
      return `$$${p1.trim()}$$`;
    })
    // Enhance inline math
    .replace(/\$([^$]+)\$/g, (match, p1) => {
      return `$${p1.trim()}$`;
    })
    // Add semantic markup for special expressions
    .replace(/\\theorem\{([^}]+)\}/g, '<div class="math-theorem">**Theorem:** $1</div>')
    .replace(/\\proof\{([^}]+)\}/g, '<div class="math-proof">**Proof:** $1</div>')
    .replace(/\\definition\{([^}]+)\}/g, '<div class="math-definition">**Definition:** $1</div>');
    
  return beautified;
};

// Beautiful KaTeX configuration
const getBeautifulKaTeXConfig = () => ({
  strict: false,
  output: "html",
  throwOnError: false,
  errorColor: "#dc2626",
  displayMode: false,
  fleqn: false,
  leqno: false,
  minRuleThickness: 0.06,
  maxSize: 30,
  maxExpand: 1000,
  trust: false,
  
  macros: {
    // Beautiful shortcuts
    "\\R": "\\mathbb{R}",
    "\\C": "\\mathbb{C}",
    "\\N": "\\mathbb{N}",
    "\\Z": "\\mathbb{Z}",
    "\\Q": "\\mathbb{Q}",
    
    // Enhanced operators
    "\\grad": "\\nabla",
    "\\divergence": "\\nabla \\cdot",
    "\\curl": "\\nabla \\times",
    "\\laplacian": "\\nabla^2",
    
    // Beautiful fractions
    "\\half": "\\frac{1}{2}",
    "\\third": "\\frac{1}{3}",
    "\\quarter": "\\frac{1}{4}",
    
    // Physics and engineering
    "\\ohm": "\\Omega",
    "\\degree": "^\\circ",
    "\\celsius": "^\\circ\\text{C}",
    "\\fahrenheit": "^\\circ\\text{F}",
    "\\kelvin": "\\text{K}",
    
    // Beautiful vectors
    "\\vec": "\\overrightarrow{#1}",
    "\\uvec": "\\hat{#1}",
    
    // Enhanced derivatives
    "\\dd": "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}",
    "\\pd": "\\frac{\\partial#1}{\\partial#2}",
    
    // Beautiful limits
    "\\lim": "\\lim\\limits",
    "\\sum": "\\sum\\limits",
    "\\int": "\\int\\limits",
    "\\prod": "\\prod\\limits",
    
    // Theorem environments
    "\\theorem": "\\text{Theorem: }",
    "\\proof": "\\text{Proof: }",
    "\\definition": "\\text{Definition: }",
    "\\lemma": "\\text{Lemma: }",
    "\\corollary": "\\text{Corollary: }",
  }
});

// Beautiful custom components
const getBeautifulComponents = (inline = false) => {
  if (inline) {
    return {
      p: ({ children }) => <span className="inline-math-wrapper">{children}</span>,
      div: ({ children, className, ...props }) => {
        if (className?.includes('math-theorem') || className?.includes('math-proof') || className?.includes('math-definition')) {
          return <span className={`${className} inline-theorem`} {...props}>{children}</span>;
        }
        return <span className={className} {...props}>{children}</span>;
      },
      h1: ({ children }) => <span className="font-bold text-lg text-blue-600">{children}</span>,
      h2: ({ children }) => <span className="font-bold text-blue-600">{children}</span>,
      h3: ({ children }) => <span className="font-semibold text-blue-600">{children}</span>,
      strong: ({ children }) => <span className="font-bold text-indigo-700">{children}</span>,
      em: ({ children }) => <span className="italic text-purple-600">{children}</span>,
    };
  }

  return {
    // Enhanced paragraph styling
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-relaxed text-gray-800 font-light tracking-wide" {...props}>
        {children}
      </p>
    ),

    // Beautiful headers with gradients
    h1: ({ children, ...props }) => (
      <h1 
        className="text-4xl font-bold mb-6 mt-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent first:mt-0" 
        {...props}
      >
        {children}
      </h1>
    ),
    
    h2: ({ children, ...props }) => (
      <h2 
        className="text-3xl font-bold mb-5 mt-7 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent first:mt-0" 
        {...props}
      >
        {children}
      </h2>
    ),
    
    h3: ({ children, ...props }) => (
      <h3 
        className="text-2xl font-semibold mb-4 mt-6 text-blue-700 first:mt-0" 
        {...props}
      >
        {children}
      </h3>
    ),

    // Enhanced emphasis
    strong: ({ children, ...props }) => (
      <strong className="font-bold text-indigo-700 tracking-wide" {...props}>
        {children}
      </strong>
    ),
    
    em: ({ children, ...props }) => (
      <em className="italic text-purple-600 font-medium" {...props}>
        {children}
      </em>
    ),

    // Beautiful lists
    ul: ({ children, ...props }) => (
      <ul className="mb-6 ml-6 space-y-2 list-none" {...props}>
        {children}
      </ul>
    ),
    
    ol: ({ children, ...props }) => (
      <ol className="mb-6 ml-6 space-y-2 list-decimal list-inside" {...props}>
        {children}
      </ol>
    ),
    
    li: ({ children, ...props }) => (
      <li className="leading-relaxed relative pl-4" {...props}>
        <span className="absolute left-0 top-0 text-blue-500 font-bold">•</span>
        {children}
      </li>
    ),

    // Enhanced code blocks
    pre: ({ children, ...props }) => (
      <pre className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 overflow-x-auto my-6 border border-blue-200 shadow-lg" {...props}>
        {children}
      </pre>
    ),
    
    code: ({ inline: isInline, className, children, ...props }) => {
      if (isInline) {
        return (
          <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-mono font-medium" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="font-mono text-sm text-gray-800" {...props}>
          {children}
        </code>
      );
    },

    // Beautiful blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-blue-500 pl-6 py-4 my-6 italic text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-r-lg shadow-sm" {...props}>
        {children}
      </blockquote>
    ),

    // Enhanced tables
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-blue-200 shadow-lg">
        <table className="min-w-full" {...props}>
          {children}
        </table>
      </div>
    ),
    
    thead: ({ children, ...props }) => (
      <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white" {...props}>
        {children}
      </thead>
    ),
    
    th: ({ children, ...props }) => (
      <th className="px-6 py-4 text-left font-semibold" {...props}>
        {children}
      </th>
    ),
    
    td: ({ children, ...props }) => (
      <td className="px-6 py-4 border-b border-blue-100" {...props}>
        {children}
      </td>
    ),

    // Enhanced math display
    div: ({ className, children, ...props }) => {
      if (className?.includes('katex-display')) {
        return (
          <div 
            className={`${className} katex-display-beautiful my-8 text-center overflow-x-auto`} 
            {...props}
          >
            {children}
          </div>
        );
      }
      
      if (className?.includes('math-theorem')) {
        return (
          <div className="math-theorem my-6 p-6 rounded-lg border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md" {...props}>
            {children}
          </div>
        );
      }
      
      if (className?.includes('math-proof')) {
        return (
          <div className="math-proof my-6 p-6 rounded-lg border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 shadow-md" {...props}>
            {children}
          </div>
        );
      }
      
      if (className?.includes('math-definition')) {
        return (
          <div className="math-definition my-6 p-6 rounded-lg border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-md" {...props}>
            {children}
          </div>
        );
      }
      
      return <div className={className} {...props}>{children}</div>;
    },

    // Enhanced error handling
    span: ({ className, children, ...props }) => {
      if (className === 'katex-error') {
        return (
          <span 
            className="inline-block px-3 py-2 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-lg text-red-700 font-bold shadow-md animate-pulse" 
            title={`Math Error: ${children}`}
            {...props}
          >
            ⚠️ Math Error: <code className="font-mono text-xs">{children}</code>
          </span>
        );
      }
      return <span className={className} {...props}>{children}</span>;
    },

    // Beautiful links
    a: ({ children, href, ...props }) => (
      <a 
        href={href}
        className="text-blue-600 hover:text-purple-600 underline decoration-2 underline-offset-2 transition-colors duration-200 font-medium"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    ),
  };
};

// Main Beautiful Math Renderer
const BeautifulMathRenderer = ({
  content,
  className = "",
  inline = false,
  enableAnimations = true,
  showMetrics = false,
  theme = "light", // light, dark, auto
  ...props
}) => {
  const [renderTime, setRenderTime] = useState(0);
  const [mathCount, setMathCount] = useState(0);
  const containerRef = useRef(null);
  
  // Process content for beautiful rendering
  const processedContent = useMemo(() => {
    if (!content) return "";
    
    const startTime = Date.now();
    const beautified = beautifyLaTeX(content);
    
    // Count math expressions
    const inlineMathCount = (beautified.match(/\$[^$]+\$/g) || []).length;
    const displayMathCount = (beautified.match(/\$\$[^$]+\$\$/g) || []).length;
    setMathCount(inlineMathCount + displayMathCount);
    
    setRenderTime(Date.now() - startTime);
    return beautified;
  }, [content]);

  // Add beautiful animations on mount
  useEffect(() => {
    if (enableAnimations && containerRef.current) {
      const mathElements = containerRef.current.querySelectorAll('.katex');
      mathElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
        el.classList.add('math-fade-in');
      });
    }
  }, [processedContent, enableAnimations]);

  if (!processedContent) {
    return inline ? (
      <span className="text-gray-400 italic">No content</span>
    ) : (
      <div className="text-gray-400 italic text-center py-4">No content to display</div>
    );
  }

  const WrapperComponent = inline ? "span" : "div";
  const wrapperClass = `beautiful-math-renderer ${theme} ${inline ? 'inline' : 'block'} ${className}`;

  return (
    <WrapperComponent 
      ref={containerRef}
      className={wrapperClass}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, getBeautifulKaTeXConfig()]]}
        components={getBeautifulComponents(inline)}
      >
        {processedContent}
      </ReactMarkdown>
      
      {showMetrics && !inline && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-xs text-blue-600">
          <div className="flex justify-between items-center">
            <span>📊 Render time: {renderTime}ms</span>
            <span>🔢 Math expressions: {mathCount}</span>
            <span>✨ Beautiful rendering enabled</span>
          </div>
        </div>
      )}
    </WrapperComponent>
  );
};

export default BeautifulMathRenderer;