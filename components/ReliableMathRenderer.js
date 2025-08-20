'use client'

import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'

/**
 * ReliableMathRenderer - Robust math rendering with multiple fallbacks
 * 
 * Priority order:
 * 1. Try MathJax (Stack Exchange style) if available
 * 2. Fall back to KaTeX if MathJax fails
 * 3. Show formatted fallback if both fail
 */

let mathJaxReady = false
let katexReady = false

const loadMathJax = () => {
  if (typeof window === 'undefined') return Promise.resolve(false)
  
  if (mathJaxReady) return Promise.resolve(true)
  
  if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
    mathJaxReady = true
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    // Set up MathJax configuration
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
        macros: {
          "\\R": "\\mathbb{R}",
          "\\Q": "\\mathbb{Q}",
          "\\Z": "\\mathbb{Z}",
          "\\N": "\\mathbb{N}",
          "\\C": "\\mathbb{C}",
          "\\implies": "\\Rightarrow",
          "\\iff": "\\Leftrightarrow",
          "\\land": "\\wedge",
          "\\lor": "\\vee",
          "\\lnot": "\\neg"
        }
      },
      chtml: {
        displayAlign: 'center',
        displayIndent: '0'
      },
      startup: {
        ready: () => {
          console.log('🔬 MathJax ready')
          window.MathJax.startup.defaultReady()
          mathJaxReady = true
          resolve(true)
        }
      }
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js'
    script.async = true
    
    script.onerror = () => {
      console.warn('⚠️ MathJax failed to load, will use KaTeX fallback')
      resolve(false)
    }
    
    // Timeout fallback
    setTimeout(() => {
      if (!mathJaxReady) {
        console.warn('⚠️ MathJax loading timeout, will use KaTeX fallback')
        resolve(false)
      }
    }, 10000)
    
    document.head.appendChild(script)
  })
}

const loadKaTeX = async () => {
  if (typeof window === 'undefined') return false
  
  if (katexReady) return true
  
  try {
    // Import KaTeX dynamically
    const katex = await import('katex')
    await import('katex/dist/katex.min.css')
    
    if (katex.default) {
      katexReady = true
      console.log('📐 KaTeX ready as fallback')
      return true
    }
  } catch (error) {
    console.warn('⚠️ KaTeX fallback also failed:', error)
  }
  
  return false
}

const renderWithMathJax = async (container, content) => {
  if (!mathJaxReady || !window.MathJax || !window.MathJax.typesetPromise) {
    throw new Error('MathJax not ready')
  }
  
  // Create temporary container for MathJax processing
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = content
  
  // Process with MathJax
  await window.MathJax.typesetPromise([tempDiv])
  
  // Return the processed HTML
  return tempDiv.innerHTML
}

const renderWithKaTeX = async (container, content) => {
  if (!katexReady) {
    throw new Error('KaTeX not ready')
  }
  
  const katex = (await import('katex')).default
  
  // Process the content to render math expressions
  let processedHTML = content
  
  // Handle display math
  processedHTML = processedHTML.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: true })
    } catch (error) {
      console.warn('KaTeX display math error:', error)
      return `<div class="math-error" style="color: red; font-style: italic;">[Math Error: ${math}]</div>`
    }
  })
  
  // Handle inline math
  processedHTML = processedHTML.replace(/\$([^$\n]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: false })
    } catch (error) {
      console.warn('KaTeX inline math error:', error)
      return `<span class="math-error" style="color: red; font-style: italic;">[${math}]</span>`
    }
  })
  
  // Use React-safe rendering approach - return HTML for dangerouslySetInnerHTML
  return processedHTML
}

const renderFallback = (container, content) => {
  // Simple formatting fallback
  let fallbackHTML = content
    .replace(/\$\$([^$]+)\$\$/g, '<div class="math-fallback" style="text-align: center; font-style: italic; color: #666; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">$$1$</div>')
    .replace(/\$([^$\n]+)\$/g, '<span class="math-fallback" style="font-style: italic; color: #666; background: #f0f0f0; padding: 2px 4px; border-radius: 2px; font-family: monospace;">$1</span>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  
  // Use React-safe rendering approach - return HTML for dangerouslySetInnerHTML
  return `
    <div style="border: 2px solid #ffd700; background: #fffbf0; padding: 12px; border-radius: 8px; margin: 10px 0;">
      <div style="color: #b8860b; font-weight: bold; margin-bottom: 8px;">⚠️ Advanced math rendering unavailable</div>
      <div style="color: #8b7355; font-size: 14px; margin-bottom: 10px;">Showing content with basic formatting:</div>
      <div><p>${fallbackHTML}</p></div>
    </div>
  `
  return 'fallback'
}

const ReliableMathRenderer = ({ 
  content, 
  className = '', 
  inline = false,
  showMetrics = false 
}) => {
  const containerRef = useRef(null)
  const [renderState, setRenderState] = useState('loading')
  const [renderMethod, setRenderMethod] = useState('')
  const [renderTime, setRenderTime] = useState(0)
  const [renderKey, setRenderKey] = useState(0)
  const [renderedHtml, setRenderedHtml] = useState('')

  useEffect(() => {
    if (!content || !containerRef.current) return

    let isCancelled = false

    const attemptRender = async () => {
      const startTime = Date.now()
      setRenderState('loading')
      
      // Force React to recreate the DOM element
      setRenderKey(prev => prev + 1)
      
      // Wait for DOM update
      await new Promise(resolve => requestAnimationFrame(resolve))

      try {
        // Try MathJax first
        try {
          await loadMathJax()
          if (!isCancelled && mathJaxReady) {
            const htmlContent = await renderWithMathJax(null, content)
            if (!isCancelled) {
              setRenderedHtml(htmlContent)
              setRenderMethod('mathjax')
              setRenderState('success')
              setRenderTime(Date.now() - startTime)
              return
            }
          }
        } catch (mathJaxError) {
          console.log('MathJax failed, trying KaTeX...', mathJaxError.message)
        }

        // Try KaTeX fallback
        try {
          await loadKaTeX()
          if (!isCancelled && katexReady) {
            const htmlContent = await renderWithKaTeX(null, content)
            if (!isCancelled) {
              setRenderedHtml(htmlContent)
              setRenderMethod('katex')
              setRenderState('success')
              setRenderTime(Date.now() - startTime)
              return
            }
          }
        } catch (katexError) {
          console.log('KaTeX fallback failed, using basic formatting...', katexError.message)
        }

        // Final fallback
        if (!isCancelled) {
          const htmlContent = renderFallback(null, content)
          setRenderedHtml(htmlContent)
          setRenderMethod('fallback')
          setRenderState('success')
          setRenderTime(Date.now() - startTime)
        }

      } catch (error) {
        if (!isCancelled) {
          console.error('All rendering methods failed:', error)
          setRenderState('error')
          const errorHtml = `
            <div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px; background: #fee;">
              ❌ Rendering failed: ${error.message}
              <pre style="margin-top: 10px; font-size: 12px; background: white; padding: 5px;">${content}</pre>
            </div>
          `
          setRenderedHtml(errorHtml)
        }
      }
    }

    attemptRender()

    return () => {
      isCancelled = true
    }
  }, [content])

  const WrapperComponent = inline ? 'span' : 'div'

  return (
    <WrapperComponent className={`reliable-math-renderer ${renderState} ${className}`}>
      {renderState === 'loading' ? (
        <div
          key={renderKey}
          ref={containerRef}
          className={inline ? 'inline-block' : 'block'}
          style={{
            minHeight: inline ? 'auto' : '20px',
            lineHeight: inline ? 'inherit' : '1.6'
          }}
        >
          <span style={{ color: '#666', fontStyle: 'italic' }}>
            {inline ? '⏳' : '🔄 Loading math rendering...'}
          </span>
        </div>
      ) : (
        <div
          key={renderKey}
          ref={containerRef}
          className={inline ? 'inline-block' : 'block'}
          dangerouslySetInnerHTML={{ __html: renderedHtml || content }}
          style={{
            minHeight: inline ? 'auto' : '20px',
            lineHeight: inline ? 'inherit' : '1.6'
          }}
        />
      )}
      
      {showMetrics && renderState === 'success' && !inline && (
        <div style={{ 
          marginTop: '8px', 
          padding: '6px 10px', 
          background: '#e8f5e8', 
          border: '1px solid #4caf50', 
          borderRadius: '4px', 
          fontSize: '12px',
          color: '#2e7d32'
        }}>
          ✅ Rendered with {renderMethod.toUpperCase()} in {renderTime}ms
        </div>
      )}
    </WrapperComponent>
  )
}

export default ReliableMathRenderer