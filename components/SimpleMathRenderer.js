"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * SimpleMathRenderer - Clean math display without LaTeX compilation
 * 
 * Features:
 * - Displays math expressions exactly as written
 * - No LaTeX processing or compilation
 * - Clean, readable formatting
 * - Simple HTML-based rendering
 * - Fast and reliable
 */

// Simple math formatting - just clean up the content
const formatMathContent = (content) => {
  if (!content || typeof content !== "string") return "";
  
  let formatted = content;
  
  // Just clean up extra whitespace and normalize line breaks
  formatted = formatted
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
    
  return formatted;
};

// Clean components without LaTeX processing
const getSimpleComponents = (inline = false) => {
  if (inline) {
    return {
      p: ({ children }) => <span className="inline-math-wrapper">{children}</span>,
      div: ({ children }) => <span>{children}</span>,
      h1: ({ children }) => <span className="font-bold text-lg">{children}</span>,
      h2: ({ children }) => <span className="font-bold">{children}</span>,
      h3: ({ children }) => <span className="font-semibold">{children}</span>,
      strong: ({ children }) => <span className="font-bold">{children}</span>,
      em: ({ children }) => <span className="italic">{children}</span>,
      code: ({ children }) => <code className="bg-blue-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
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

    h4: ({ children, ...props }) => (
      <h4 className="text-lg font-semibold mb-3 mt-5 text-gray-900 first:mt-0" {...props}>
        {children}
      </h4>
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

    // Enhanced code blocks
    pre: ({ children, ...props }) => (
      <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto my-4 border text-sm" {...props}>
        {children}
      </pre>
    ),
    
    code: ({ inline: isInline, className, children, ...props }) => {
      // Check if this might be math content (contains $ signs)
      const isMathContent = typeof children === 'string' && (
        children.includes('$') || 
        children.includes('\\') ||
        children.includes('^') ||
        children.includes('_') ||
        /[αβγδεζηθλμπρστφχψωΑΒΓΔΕΖΗΘΛΜΠΡΣΤΦΧΨΩ]/.test(children)
      );

      if (isInline) {
        if (isMathContent) {
          return (
            <code className="bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-200 font-mono text-sm" {...props}>
              {children}
            </code>
          );
        }
        return (
          <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }

      // For block code, check if it's math content
      if (isMathContent) {
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <div className="text-xs text-blue-600 mb-2 font-semibold">Mathematical Expression:</div>
            <code className="font-mono text-sm text-blue-800 whitespace-pre-wrap" {...props}>
              {children}
            </code>
          </div>
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
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-700 bg-blue-50 rounded-r" {...props}>
        {children}
      </blockquote>
    ),

    // Enhanced tables
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
        <table className="min-w-full" {...props}>
          {children}
        </table>
      </div>
    ),
    
    thead: ({ children, ...props }) => (
      <thead className="bg-gray-50" {...props}>
        {children}
      </thead>
    ),
    
    th: ({ children, ...props }) => (
      <th className="px-4 py-2 text-left font-semibold text-gray-900 border-b border-gray-200" {...props}>
        {children}
      </th>
    ),
    
    td: ({ children, ...props }) => (
      <td className="px-4 py-2 border-b border-gray-100" {...props}>
        {children}
      </td>
    ),

    // Enhanced div handling
    div: ({ className, children, ...props }) => {
      return <div className={className} {...props}>{children}</div>;
    },

    // Simple span handling
    span: ({ className, children, ...props }) => {
      return <span className={className} {...props}>{children}</span>;
    },

    // Beautiful links
    a: ({ children, href, ...props }) => (
      <a 
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    ),

    // Enhanced image handling
    img: ({ src, alt, ...props }) => (
      <img 
        src={src} 
        alt={alt} 
        className="max-w-full h-auto rounded-lg my-4" 
        {...props} 
      />
    ),

    // Horizontal rules
    hr: ({ ...props }) => (
      <hr className="my-6 border-gray-300" {...props} />
    ),
  };
};

// Main Simple Math Renderer
const SimpleMathRenderer = ({
  content,
  className = "",
  inline = false,
  showMetrics = false,
  ...props
}) => {
  // Process content with simple formatting
  const processedContent = useMemo(() => {
    if (!content) return "";
    return formatMathContent(content);
  }, [content]);

  if (!processedContent) {
    return inline ? (
      <span className="text-gray-400 italic">No content</span>
    ) : (
      <div className="text-gray-400 italic text-center py-4">No content to display</div>
    );
  }

  const WrapperComponent = inline ? "span" : "div";
  const wrapperClass = `simple-math-renderer ${inline ? 'inline' : 'block'} ${className}`;

  return (
    <WrapperComponent 
      className={wrapperClass}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={getSimpleComponents(inline)}
      >
        {processedContent}
      </ReactMarkdown>
      
      {showMetrics && !inline && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>📝 Simple rendering enabled</span>
            <span>✅ No LaTeX processing</span>
            <span>🚀 Fast & reliable</span>
          </div>
        </div>
      )}
    </WrapperComponent>
  );
};

export default SimpleMathRenderer;