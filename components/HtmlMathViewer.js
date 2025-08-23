'use client'

import React, { useMemo, useEffect, useState } from 'react'
import ReliableMathRenderer from './ReliableMathRenderer'

// Simple Markdown-to-HTML helper for headings, lists and paragraphs.
function basicMarkdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') return ''
  const escape = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Handle code blocks fenced with ```
  let html = markdown.replace(/```([\s\S]*?)```/g, (m, code) => {
    // Check if this might be math content
    const isMathContent = code.includes('$') || 
                          code.includes('\\') ||
                          /[αβγδεζηθλμπρστφχψωΑΒΓΔΕΖΗΘΛΜΠΡΣΤΦΧΨΩ]/.test(code) ||
                          /[∑∏∫∂∇∞±≈≡≠≤≥→←↔⇒⇐⇔]/.test(code);
    
    if (isMathContent) {
      return `<pre class="math-code-block bg-blue-50 border border-blue-200 p-4 rounded-lg"><code class="text-blue-800">${escape(code)}</code></pre>`
    }
    return `<pre><code>${escape(code)}</code></pre>`
  })

  // Handle inline code with math detection
  html = html.replace(/`([^`]+)`/g, (m, code) => {
    const isMathContent = code.includes('$') || 
                          code.includes('\\') ||
                          /[αβγδεζηθλμπρστφχψωΑΒΓΔΕΖΗΘΛΜΠΡΣΤΦΧΨΩ]/.test(code) ||
                          /[∑∏∫∂∇∞±≈≡≠≤≥→←↔⇒⇐⇔]/.test(code);
    
    if (isMathContent) {
      return `<code class="math-inline bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">${escape(code)}</code>`
    }
    return `<code class="bg-gray-100 px-1 py-0.5 rounded">${escape(code)}</code>`
  })

  // Headings
  html = html.replace(/^######\s*(.*)$/gm, '<h6 class="text-sm font-semibold mt-3 mb-2">$1</h6>')
  html = html.replace(/^#####\s*(.*)$/gm, '<h5 class="text-base font-semibold mt-4 mb-2">$1</h5>')
  html = html.replace(/^####\s*(.*)$/gm, '<h4 class="text-lg font-semibold mt-5 mb-3">$1</h4>')
  html = html.replace(/^###\s*(.*)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-4">$1</h3>')
  html = html.replace(/^##\s*(.*)$/gm, '<h2 class="text-2xl font-bold mt-7 mb-5">$1</h2>')
  html = html.replace(/^#\s*(.*)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-6">$1</h1>')

  // Bold/italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')

  // Math expressions - prepare for KaTeX rendering
  html = html.replace(/\$\$([^$]+)\$\$/g, '<div class="math-display">$$$$1$$</div>')
  html = html.replace(/\$([^$]+)\$/g, '<span class="math-inline">$$$1$$</span>')

  // Lists (basic)
  html = html.replace(/^(\s*[-*+]\s+.*(?:\n\s*[-*+]\s+.*)*)/gm, (m) => {
    const items = m.split(/\n/).map((line) => line.replace(/^\s*[-*+]\s+/, '')).join('</li><li class="mb-1">')
    return `<ul class="list-disc ml-4 mb-4"><li class="mb-1">${items}</li></ul>`
  })

  // Numbered lists
  html = html.replace(/^(\s*\d+\.\s+.*(?:\n\s*\d+\.\s+.*)*)/gm, (m) => {
    const items = m.split(/\n/).map((line) => line.replace(/^\s*\d+\.\s+/, '')).join('</li><li class="mb-1">')
    return `<ol class="list-decimal ml-4 mb-4"><li class="mb-1">${items}</li></ol>`
  })

  // Blockquotes
  html = html.replace(/^>\s*(.*)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-700 bg-blue-50 rounded-r">$1</blockquote>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-6 border-gray-300">')

  // Paragraphs
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<h\d|^<ul|^<ol|^<pre|^<table|^<blockquote|^<div|^<hr/.test(block.trim())) return block
      if (!block.trim()) return ''
      return `<p class="mb-4 leading-relaxed text-gray-800">${block.trim().replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')

  return html
}

// Simple HTML processing with math detection and highlighting
function processHtmlContent(html) {
  if (!html || typeof html !== 'string') return ''
  
  let processed = html

  // Add classes to existing elements if they don't have them
  processed = processed
    // Style headings
    .replace(/<h1(?![^>]*class)/g, '<h1 class="text-3xl font-bold mt-8 mb-6"')
    .replace(/<h2(?![^>]*class)/g, '<h2 class="text-2xl font-bold mt-7 mb-5"')
    .replace(/<h3(?![^>]*class)/g, '<h3 class="text-xl font-semibold mt-6 mb-4"')
    .replace(/<h4(?![^>]*class)/g, '<h4 class="text-lg font-semibold mt-5 mb-3"')
    .replace(/<h5(?![^>]*class)/g, '<h5 class="text-base font-semibold mt-4 mb-2"')
    .replace(/<h6(?![^>]*class)/g, '<h6 class="text-sm font-semibold mt-3 mb-2"')
    
    // Style paragraphs
    .replace(/<p(?![^>]*class)/g, '<p class="mb-4 leading-relaxed text-gray-800"')
    
    // Style lists
    .replace(/<ul(?![^>]*class)/g, '<ul class="list-disc ml-4 mb-4"')
    .replace(/<ol(?![^>]*class)/g, '<ol class="list-decimal ml-4 mb-4"')
    .replace(/<li(?![^>]*class)/g, '<li class="mb-1"')
    
    // Style code
    .replace(/<code(?![^>]*class)/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"')
    .replace(/<pre(?![^>]*class)/g, '<pre class="bg-gray-50 rounded-lg p-4 overflow-x-auto my-4 border"')
    
    // Style blockquotes
    .replace(/<blockquote(?![^>]*class)/g, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-700 bg-blue-50 rounded-r"')
    
    // Style links
    .replace(/<a(?![^>]*class)/g, '<a class="text-blue-600 hover:text-blue-800 underline"')
    
    // Style tables
    .replace(/<table(?![^>]*class)/g, '<table class="min-w-full border-collapse border border-gray-300 my-4"')
    .replace(/<th(?![^>]*class)/g, '<th class="border border-gray-300 px-4 py-2 text-left font-semibold bg-gray-100"')
    .replace(/<td(?![^>]*class)/g, '<td class="border border-gray-300 px-4 py-2"')

  // Detect math expressions and prepare for KaTeX rendering
  // We'll keep the math expressions as they are for KaTeX to process
  processed = processed
    // Preserve display math
    .replace(/\$\$([^$]+)\$\$/g, '$$$$1$$')
    // Preserve inline math
    .replace(/\$([^$]+)\$/g, '$$$1$$')

  return processed
}

export default function HtmlMathViewer({ html, markdownFallback = '', className = '' }) {
  const [DOMPurify, setDOMPurify] = useState(null)
  const [isClient, setIsClient] = useState(false)

  // Load DOMPurify only on client side
  useEffect(() => {
    setIsClient(true)
    const loadDOMPurify = async () => {
      try {
        const DOMPurifyModule = await import('dompurify')
        setDOMPurify(DOMPurifyModule.default)
      } catch (error) {
        console.warn('Failed to load DOMPurify:', error)
      }
    }
    loadDOMPurify()
  }, [])

  const contentToRender = useMemo(() => {
    let source = html
    if (!source && markdownFallback) {
      source = basicMarkdownToHtml(markdownFallback)
    } else if (source) {
      source = processHtmlContent(source)
    }
    
    // Only sanitize on client side when DOMPurify is available
    if (isClient && DOMPurify) {
      const clean = DOMPurify.sanitize(source || '', {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre',
          'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'span', 'div', 'a', 'img', 'hr'
        ],
        ALLOWED_ATTR: [
          'class', 'href', 'src', 'alt', 'title', 'id'
        ],
        ALLOWED_CLASSES: {}
      })
      return clean
    }
    
    // Return unsanitized content during SSR (should be safe if content is trusted)
    return source || ''
  }, [html, markdownFallback, isClient, DOMPurify])

  // Determine content type from HTML content
  const contentType = useMemo(() => {
    if (!contentToRender) return 'general';
    const lower = contentToRender.toLowerCase();
    
    if (lower.includes('proof') || lower.includes('prove') || lower.includes('q.e.d')) return 'proof';
    if (lower.includes('theorem') || lower.includes('lemma') || lower.includes('corollary')) return 'theorem';
    if (lower.includes('example') || lower.includes('problem') || lower.includes('exercise')) return 'example';
    if (lower.includes('definition') || lower.includes('define') || lower.includes('concept')) return 'definition';
    
    return 'general';
  }, [contentToRender]);

  if (!contentToRender) {
    return (
      <div className={`html-math-viewer prose prose-gray max-w-none ${className}`}>
        <span className="text-gray-400 italic">No content to display</span>
      </div>
    )
  }

  // Use Reliable Math Renderer for HTML content
  return (
    <div className={`html-math-viewer prose prose-gray max-w-none ${className}`}>
      <ReliableMathRenderer
        content={contentToRender}
        inline={false}
        showMetrics={false}
      />
    </div>
  )
}