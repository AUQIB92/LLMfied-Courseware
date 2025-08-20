"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * DirectMathRenderer - Display math equations directly without LaTeX syntax
 * 
 * Features:
 * - Converts LaTeX syntax to readable math notation
 * - No LaTeX compilation - direct text display
 * - Clean mathematical typography
 * - Removes backslashes, dollar signs, and LaTeX commands
 * - Shows math as it would appear in textbooks
 */

// Convert LaTeX syntax to direct mathematical notation
const convertLatexToDirect = (content) => {
  if (!content || typeof content !== "string") return "";
  
  let converted = content;
  
  // Remove LaTeX delimiters
  converted = converted
    // Remove display math delimiters
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    // Remove inline math delimiters  
    .replace(/\$([^$]+)\$/g, '$1')
    // Remove LaTeX brackets
    .replace(/\\\[([^\]]+)\\\]/g, '$1')
    .replace(/\\\(([^\)]+)\\\)/g, '$1');
    
  // Convert LaTeX commands to readable text
  converted = converted
    // Mathematical operators
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    
    // Fractions
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    
    // Superscripts and subscripts
    .replace(/\^(\{[^}]+\}|\w)/g, (match, exp) => {
      const cleanExp = exp.replace(/[{}]/g, '');
      return `^${cleanExp}`;
    })
    .replace(/_(\{[^}]+\}|\w)/g, (match, sub) => {
      const cleanSub = sub.replace(/[{}]/g, '');
      return `_${cleanSub}`;
    })
    
    // Square roots
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, 'ⁿ√($2) where n=$1')
    
    // Greek letters
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\varepsilon/g, 'ε')
    .replace(/\\zeta/g, 'ζ')
    .replace(/\\eta/g, 'η')
    .replace(/\\theta/g, 'θ')
    .replace(/\\vartheta/g, 'θ')
    .replace(/\\iota/g, 'ι')
    .replace(/\\kappa/g, 'κ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\nu/g, 'ν')
    .replace(/\\xi/g, 'ξ')
    .replace(/\\pi/g, 'π')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\varrho/g, 'ρ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\varsigma/g, 'ς')
    .replace(/\\tau/g, 'τ')
    .replace(/\\upsilon/g, 'υ')
    .replace(/\\phi/g, 'φ')
    .replace(/\\varphi/g, 'φ')
    .replace(/\\chi/g, 'χ')
    .replace(/\\psi/g, 'ψ')
    .replace(/\\omega/g, 'ω')
    
    // Capital Greek letters
    .replace(/\\Gamma/g, 'Γ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\Theta/g, 'Θ')
    .replace(/\\Lambda/g, 'Λ')
    .replace(/\\Xi/g, 'Ξ')
    .replace(/\\Pi/g, 'Π')
    .replace(/\\Sigma/g, 'Σ')
    .replace(/\\Upsilon/g, 'Υ')
    .replace(/\\Phi/g, 'Φ')
    .replace(/\\Psi/g, 'Ψ')
    .replace(/\\Omega/g, 'Ω')
    
    // Number sets
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\mathbb\{Q\}/g, 'ℚ') 
    .replace(/\\mathbb\{Z\}/g, 'ℤ')
    .replace(/\\mathbb\{N\}/g, 'ℕ')
    .replace(/\\mathbb\{C\}/g, 'ℂ')
    .replace(/\\mathbb\{F\}/g, 'F')
    
    // Relations and logic
    .replace(/\\to/g, '→')
    .replace(/\\gets/g, '←')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftarrow/g, '⇐')
    .replace(/\\Leftrightarrow/g, '⇔')
    .replace(/\\implies/g, '⇒')
    .replace(/\\iff/g, '⇔')
    
    // Inequalities
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡')
    .replace(/\\sim/g, '∼')
    .replace(/\\simeq/g, '≃')
    
    // Set theory
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\subseteq/g, '⊆')
    .replace(/\\supset/g, '⊃')
    .replace(/\\supseteq/g, '⊇')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\emptyset/g, '∅')
    .replace(/\\varnothing/g, '∅')
    
    // Calculus
    .replace(/\\int/g, '∫')
    .replace(/\\iint/g, '∬')
    .replace(/\\iiint/g, '∭')
    .replace(/\\oint/g, '∮')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\lim/g, 'lim')
    .replace(/\\infty/g, '∞')
    
    // Functions
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\sec/g, 'sec')
    .replace(/\\csc/g, 'csc')
    .replace(/\\cot/g, 'cot')
    .replace(/\\sinh/g, 'sinh')
    .replace(/\\cosh/g, 'cosh')
    .replace(/\\tanh/g, 'tanh')
    .replace(/\\ln/g, 'ln')
    .replace(/\\log/g, 'log')
    .replace(/\\exp/g, 'exp')
    
    // Remove remaining LaTeX commands and braces
    .replace(/\\[a-zA-Z]+\*/g, '')  // Remove commands with *
    .replace(/\\[a-zA-Z]+/g, '')    // Remove other commands
    .replace(/\{([^}]*)\}/g, '$1')  // Remove braces
    .replace(/\\\\/g, ' ')          // Remove double backslashes
    .replace(/\\_/g, '_')           // Keep underscores
    .replace(/\\\^/g, '^')          // Keep carets
    
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
    
  return converted;
};

// Clean components for direct math display
const getDirectMathComponents = (inline = false) => {
  if (inline) {
    return {
      p: ({ children }) => <span className="inline-math-wrapper">{children}</span>,
      div: ({ children }) => <span>{children}</span>,
      h1: ({ children }) => <span className="font-bold text-lg">{children}</span>,
      h2: ({ children }) => <span className="font-bold">{children}</span>,
      h3: ({ children }) => <span className="font-semibold">{children}</span>,
      strong: ({ children }) => <span className="font-bold">{children}</span>,
      em: ({ children }) => <span className="italic">{children}</span>,
      code: ({ children }) => <code className="bg-green-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
    };
  }

  return {
    // Enhanced paragraph styling
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-relaxed text-gray-800" {...props}>
        {children}
      </p>
    ),

    // Beautiful headers
    h1: ({ children, ...props }) => (
      <h1 className="text-3xl font-bold mb-6 mt-8 text-gray-900 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    
    h2: ({ children, ...props }) => (
      <h2 className="text-2xl font-bold mb-5 mt-7 text-gray-900 first:mt-0" {...props}>
        {children}
      </h2>
    ),
    
    h3: ({ children, ...props }) => (
      <h3 className="text-xl font-semibold mb-4 mt-6 text-gray-900 first:mt-0" {...props}>
        {children}
      </h3>
    ),

    // Enhanced emphasis
    strong: ({ children, ...props }) => (
      <strong className="font-bold text-gray-900" {...props}>
        {children}
      </strong>
    ),
    
    em: ({ children, ...props }) => (
      <em className="italic text-gray-700" {...props}>
        {children}
      </em>
    ),

    // Math-friendly code blocks
    pre: ({ children, ...props }) => (
      <pre className="bg-green-50 rounded-lg p-4 overflow-x-auto my-4 border border-green-200 text-sm" {...props}>
        {children}
      </pre>
    ),
    
    code: ({ inline: isInline, className, children, ...props }) => {
      if (isInline) {
        return (
          <code className="bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200 font-mono text-sm" {...props}>
            {children}
          </code>
        );
      }

      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
          <div className="text-xs text-green-600 mb-2 font-semibold">Direct Mathematical Expression:</div>
          <code className="font-mono text-sm text-green-800 whitespace-pre-wrap" {...props}>
            {children}
          </code>
        </div>
      );
    },

    // Beautiful lists
    ul: ({ children, ...props }) => (
      <ul className="mb-4 ml-4 space-y-1 list-disc" {...props}>
        {children}
      </ul>
    ),
    
    ol: ({ children, ...props }) => (
      <ol className="mb-4 ml-4 space-y-1 list-decimal" {...props}>
        {children}
      </ol>
    ),
    
    li: ({ children, ...props }) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Beautiful blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-green-500 pl-4 py-2 my-4 italic text-gray-700 bg-green-50 rounded-r" {...props}>
        {children}
      </blockquote>
    ),

    // Enhanced links
    a: ({ children, href, ...props }) => (
      <a 
        href={href}
        className="text-green-600 hover:text-green-800 underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    ),

    // Horizontal rules
    hr: ({ ...props }) => (
      <hr className="my-6 border-gray-300" {...props} />
    ),
  };
};

// Main Direct Math Renderer
const DirectMathRenderer = ({
  content,
  className = "",
  inline = false,
  showMetrics = false,
  ...props
}) => {
  // Process content to convert LaTeX to direct notation
  const processedContent = useMemo(() => {
    if (!content) return "";
    
    // Convert LaTeX to direct mathematical notation
    const converted = convertLatexToDirect(content);
    
    // Clean up extra whitespace
    const cleaned = converted
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
      
    return cleaned;
  }, [content]);

  if (!processedContent) {
    return inline ? (
      <span className="text-gray-400 italic">No content</span>
    ) : (
      <div className="text-gray-400 italic text-center py-4">No content to display</div>
    );
  }

  const WrapperComponent = inline ? "span" : "div";
  const wrapperClass = `direct-math-renderer ${inline ? 'inline' : 'block'} ${className}`;

  return (
    <WrapperComponent 
      className={wrapperClass}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={getDirectMathComponents(inline)}
      >
        {processedContent}
      </ReactMarkdown>
      
      {showMetrics && !inline && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-xs text-green-600">
          <div className="flex justify-between items-center">
            <span>📐 Direct math display</span>
            <span>✅ No LaTeX syntax</span>
            <span>🎯 Clean equations</span>
          </div>
        </div>
      )}
    </WrapperComponent>
  );
};

export default DirectMathRenderer;