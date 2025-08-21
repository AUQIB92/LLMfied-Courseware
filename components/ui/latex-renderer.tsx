"use client"

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Import KaTeX CSS
// Note: You'll need to install katex: npm install katex
import 'katex/dist/katex.min.css'

interface LatexRendererProps {
  content: string
  className?: string
  displayMode?: boolean
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ 
  content, 
  className, 
  displayMode = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderLatex = async () => {
      if (typeof window === 'undefined' || !containerRef.current) return

      try {
        // Dynamic import for client-side only
        const katex = (await import('katex')).default
        
        if (!content) return

        let processedContent = content

        // Process display math blocks first (to avoid conflicts with inline)
        processedContent = processedContent.replace(
          /\\\[(.*?)\\\]/gs,
          (match, formula) => {
            try {
              const rendered = katex.renderToString(formula.trim(), {
                displayMode: true,
                throwOnError: false,
                trust: true,
                strict: false,
                macros: {
                  "\\RR": "\\mathbb{R}",
                  "\\NN": "\\mathbb{N}",
                  "\\ZZ": "\\mathbb{Z}",
                  "\\QQ": "\\mathbb{Q}",
                  "\\CC": "\\mathbb{C}"
                }
              })
              return `<div class="katex-display-block my-4">${rendered}</div>`
            } catch (e) {
              console.warn('KaTeX display math error:', e)
              return `<div class="math-error bg-red-50 p-2 rounded text-red-600 my-2">LaTeX Error: ${formula}</div>`
            }
          }
        )

        // Process inline math
        processedContent = processedContent.replace(
          /\\\((.*?)\\\)/g,
          (match, formula) => {
            try {
              const rendered = katex.renderToString(formula.trim(), {
                displayMode: false,
                throwOnError: false,
                trust: true,
                strict: false,
                macros: {
                  "\\RR": "\\mathbb{R}",
                  "\\NN": "\\mathbb{N}",
                  "\\ZZ": "\\mathbb{Z}",
                  "\\QQ": "\\mathbb{Q}",
                  "\\CC": "\\mathbb{C}"
                }
              })
              return `<span class="katex-inline">${rendered}</span>`
            } catch (e) {
              console.warn('KaTeX inline math error:', e)
              return `<span class="math-error bg-red-50 px-1 rounded text-red-600">${formula}</span>`
            }
          }
        )

        // Convert markdown-style formatting
        processedContent = processedContent
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-gray-900">$1</h1>')
          .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3 text-gray-800 mt-6">$1</h2>')
          .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-2 text-gray-700 mt-4">$1</h3>')
          .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
          .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
          .replace(/\n\n/g, '</p><p class="mb-4">')

        // Wrap content in paragraphs
        processedContent = `<p class="mb-4">${processedContent}</p>`

        if (containerRef.current) {
          containerRef.current.innerHTML = processedContent
        }
      } catch (error) {
        console.error('LaTeX rendering error:', error)
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p class="text-yellow-800 font-medium">LaTeX Rendering Unavailable</p>
              <div class="mt-2 text-gray-700 whitespace-pre-wrap">${content}</div>
            </div>
          `
        }
      }
    }

    renderLatex()
  }, [content, displayMode])

  return (
    <div
      ref={containerRef}
      className={cn(
        "latex-content prose prose-lg max-w-none",
        "prose-headings:text-gray-900 prose-p:text-gray-700",
        "prose-strong:text-gray-900 prose-em:text-gray-600",
        className
      )}
    />
  )
}

export default LatexRenderer