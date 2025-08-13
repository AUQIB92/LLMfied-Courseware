'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'

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

// --- MathJax loader (v3) ---
let mathJaxLoadingPromise = null

function configureGlobalMathJax() {
  if (typeof window === 'undefined') return
  if (window.MathJax && window.MathJax.configuredForHtmlViewer) return

  window.MathJax = {
    loader: {
      load: [
        '[tex]/ams',
        '[tex]/physics',
        '[tex]/mhchem',
        '[tex]/color',
        '[tex]/noerrors',
        '[tex]/noundefined'
      ]
    },
    ...(window.MathJax || {}),
    tex: {
      inlineMath: [["$", "$"], ["\\(", "\\)"]],
      displayMath: [["$$", "$$"], ["\\[", "\\]"]],
      processEscapes: true,
      processEnvironments: true,
      tags: 'none',
      packages: { '[+]': ['base', 'ams', 'newcommand', 'configmacros', 'physics', 'mhchem', 'color', 'noerrors', 'noundefined'] },
      macros: {
        "\\RR": "\\mathbb{R}",
        "\\NN": "\\mathbb{N}",
        "\\ZZ": "\\mathbb{Z}",
        "\\QQ": "\\mathbb{Q}",
        "\\CC": "\\mathbb{C}",
        "\\f": ["\\frac{#1}{#2}", 2],
        "\\half": "\\frac{1}{2}",
        "\\ohm": "\\Omega",
        "\\degree": "^\\circ"
      }
    },
    // Use CommonHTML output like StackExchange
    chtml: {
      scale: 1,
      minScale: 0.5,
      matchFontHeight: true,
      mtextInheritFont: false,
      merrorInheritFont: true,
      fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts',
      displayAlign: 'center',
      displayIndent: '0'
    },
    options: {
      skipHtmlTags: { '[-]': ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] }
    },
    startup: {
      typeset: false
    }
  }
  window.MathJax.configuredForHtmlViewer = true
}

function loadMathJax() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
    return Promise.resolve(window.MathJax)
  }
  if (!mathJaxLoadingPromise) {
    configureGlobalMathJax()
    mathJaxLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js'
      script.async = true
      script.onload = () => resolve(window.MathJax)
      script.onerror = (e) => reject(e)
      document.head.appendChild(script)
    })
  }
  return mathJaxLoadingPromise
}

export default function HtmlMathViewer({ html, markdownFallback = '', className = '' }) {
  const containerRef = useRef(null)

  const processed = useMemo(() => {
    let source = html
    if (!source && markdownFallback) {
      source = basicMarkdownToHtml(markdownFallback)
    }
    const clean = DOMPurify.sanitize(source || '', {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre',
        'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div', 'a', 'img', 'hr'
      ],
      ALLOWED_ATTR: [
        'class', 'href', 'src', 'alt', 'title', 'id', 'style'
      ],
      ALLOWED_CLASSES: {}
    })
    return clean
  }, [html, markdownFallback])

  // Typeset with MathJax after HTML is injected
  useEffect(() => {
    let cancelled = false
    const typeset = async () => {
      try {
        const mj = await loadMathJax()
        if (!cancelled && mj && containerRef.current) {
          // Defer typesetting to end of frame to mimic SE behavior and avoid layout thrash
          requestAnimationFrame(async () => {
            if (!cancelled && mj && containerRef.current) {
              await mj.typesetPromise([containerRef.current])
            }
          })
        }
      } catch (e) {
        console.warn('MathJax load/typeset failed:', e)
      }
    }
    typeset()
    return () => {
      cancelled = true
    }
  }, [processed])

  return (
    <div ref={containerRef} className={`html-math-viewer ${className}`} dangerouslySetInnerHTML={{ __html: processed }} />
  )
}


