import React, { useMemo } from "react";
import ReliableMathRenderer from "./ReliableMathRenderer";
import TruthTable, { ModusPonensTable, ModusTollensTable, BasicLogicTable } from "./ui/truth-table";

/**
 * MathMarkdownRenderer component using Stack Exchange LaTeX parsing
 * 
 * This component renders markdown content with Math.StackExchange style math display:
 * 
 * 1. Uses MathJax (like Stack Exchange) for LaTeX processing
 * 2. Supports Stack Exchange delimiters: $...$ $$...$$ \(...\) \[...\]
 * 3. Professional math typography matching Stack Exchange
 * 4. Truth tables with textbook styling
 * 5. Robust LaTeX processing with Stack Exchange macros
 * 
 * @param {Object} props Component props
 * @param {string} props.content Markdown content with math expressions
 * @param {string} props.className Additional CSS classes
 * @param {boolean} props.unwrapParagraphs Whether to unwrap paragraphs (prevents nesting issues)
 * @param {boolean} props.inline Whether to render as inline content (no block elements)
 */
export default function MathMarkdownRenderer({ 
  content, 
  className = "",
  unwrapParagraphs = false,
  inline = false
}) {
  // Process content for Stack Exchange style rendering
  const processedContent = useMemo(() => {
    if (!content || typeof content !== "string") return "";
    
    // Clean up whitespace and normalize line endings
    return content.trim();
  }, [content]);

  // If no content, return empty span
  if (!processedContent) {
    return <span className={`empty-content ${className}`}>&nbsp;</span>;
  }

  // Determine content type for enhanced rendering
  const contentType = useMemo(() => {
    if (!processedContent) return 'general';
    const lower = processedContent.toLowerCase();
    
    if (lower.includes('proof') || lower.includes('prove') || lower.includes('q.e.d')) return 'proof';
    if (lower.includes('theorem') || lower.includes('lemma') || lower.includes('corollary')) return 'theorem';
    if (lower.includes('example') || lower.includes('problem') || lower.includes('exercise')) return 'example';
    if (lower.includes('definition') || lower.includes('define') || lower.includes('concept')) return 'definition';
    
    return 'general';
  }, [processedContent]);

  // Use Reliable Math Renderer with multiple fallbacks
  return (
    <div className={`math-markdown-content ${inline ? 'inline' : 'block'} prose prose-lg max-w-none ${className}`}>
      <ReliableMathRenderer
        content={processedContent}
        inline={inline}
        showMetrics={false}
      />
    </div>
  );
}