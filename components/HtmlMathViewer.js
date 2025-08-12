'use client'

import React, { useMemo, useEffect } from 'react'
import DOMPurify from 'dompurify'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Very small, safe Markdown-to-HTML helper for headings, lists and paragraphs.
// This is not a full Markdown parser, but good enough as a fallback when
// consumers want an HTML preview without bringing a heavy dependency.
function basicMarkdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') return ''
  const escape = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Handle code blocks fenced with ```
  let html = markdown.replace(/```([\s\S]*?)```/g, (m, code) => {
    return `<pre><code>${escape(code)}</code></pre>`
  })

  // Headings
  html = html.replace(/^######\s*(.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s*(.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s*(.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s*(.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s*(.*)$/gm, '<h1>$1</h1>')

  // Bold/italic/code inline
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Lists (very basic)
  html = html.replace(/^(\s*[-*+]\s+.*(?:\n\s*[-*+]\s+.*)*)/gm, (m) => {
    const items = m.split(/\n/).map((line) => line.replace(/^\s*[-*+]\s+/, '')).join('</li><li>')
    return `<ul><li>${items}</li></ul>`
  })

  // Paragraphs
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<h\d|^<ul|^<pre|^<table|^<blockquote/.test(block.trim())) return block
      if (!block.trim()) return ''
      return `<p>${block.trim().replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')

  return html
}

function renderMathWithKatex(html) {
  if (!html || typeof html !== 'string') return ''

  const render = (tex, displayMode) => {
    try {
      // Unescape the LaTeX backslashes (convert \\ to \)
      const unescapedTex = tex.replace(/\\\\/g, '\\');
      
      return katex.renderToString(unescapedTex, {
        displayMode,
        throwOnError: false,
        strict: false,
        output: 'html',
        trust: true,
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\NN": "\\mathbb{N}",
          "\\ZZ": "\\mathbb{Z}",
          "\\QQ": "\\mathbb{Q}",
          "\\CC": "\\mathbb{C}"
        }
      })
    } catch (e) {
      console.warn('KaTeX rendering error:', e.message, 'for tex:', tex);
      return `<span class="katex-error" title="Math rendering error: ${e.message}">${tex}</span>`
    }
  }

  // Handle new HTML format with \(...\) and \[...\] delimiters
  let out = html
  
  // Replace display math: \[...\]
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => {
    return render(tex, true)
  })
  
  // Replace inline math: \(...\)
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => {
    return render(tex, false)
  })
  
  // Also handle traditional LaTeX format for backward compatibility
  // Display math first
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => render(tex, true))
  // Then inline math. Avoid matching $$
  out = out.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_, tex) => render(tex, false))
  
  return out
}

export default function HtmlMathViewer({ html, markdownFallback = '', className = '' }) {
  // Ensure KaTeX is properly loaded
  useEffect(() => {
    // Load KaTeX CSS if not already loaded
    if (typeof window !== 'undefined' && !document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, []);

  const processed = useMemo(() => {
    let source = html
    if (!source && markdownFallback) {
      source = basicMarkdownToHtml(markdownFallback)
    }
    const withMath = renderMathWithKatex(source || '')
    const clean = DOMPurify.sanitize(withMath, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre',
        'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div', 'a', 'img', 'hr'
      ],
      ALLOWED_ATTR: [
        'class', 'href', 'src', 'alt', 'title', 'id', 'style'
      ],
      ALLOWED_CLASSES: {
        'span': ['katex', 'katex-error'],
        'div': ['katex', 'katex-display'],
        '*': ['katex', 'katex-error', 'katex-display']
      }
    })
    return clean
  }, [html, markdownFallback])

  return (
    <div className={`html-math-viewer ${className}`} dangerouslySetInnerHTML={{ __html: processed }} />
  )
}


