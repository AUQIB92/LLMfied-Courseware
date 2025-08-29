"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReliableMathRenderer from '../ReliableMathRenderer'

interface InlineLaTeXEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  inline?: boolean
}

const LaTeXShortcuts = [
  { label: '½', latex: '\\frac{1}{2}' },
  { label: '√', latex: '\\sqrt{}' },
  { label: 'x²', latex: 'x^{2}' },
  { label: 'x₁', latex: 'x_{1}' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: 'π', latex: '\\pi' },
  { label: '∞', latex: '\\infty' },
  { label: '∑', latex: '\\sum_{i=1}^{n}' },
  { label: '∫', latex: '\\int_{a}^{b}' },
  { label: '≤', latex: '\\leq' },
  { label: '≥', latex: '\\geq' },
  { label: '≠', latex: '\\neq' },
  { label: '∈', latex: '\\in' },
  { label: '→', latex: '\\to' },
  { label: '⇒', latex: '\\Rightarrow' },
]

export const InlineLaTeXEditor: React.FC<InlineLaTeXEditorProps> = ({
  content,
  onChange,
  placeholder = "Enter text with LaTeX...",
  className = "",
  inline = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [content, isEditing])

  // Close editor when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false)
        setShowShortcuts(false)
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing])

  const insertLaTeX = (latex: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + latex + content.substring(end)
      onChange(newContent)
      
      // Set cursor position after inserted text
      setTimeout(() => {
        const newPosition = start + latex.length
        textarea.setSelectionRange(newPosition, newPosition)
        textarea.focus()
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
      setShowShortcuts(false)
    } else if (e.ctrlKey && e.key === 'Enter') {
      setIsEditing(false)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setShowShortcuts(!showShortcuts)
    }
  }

  if (isEditing) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="space-y-2">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-t-lg border">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                title="Show LaTeX shortcuts (Tab)"
              >
                📐 LaTeX
              </button>
              <span className="text-xs text-gray-500">Press Ctrl+Enter to save, Esc to cancel</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                ✓ Done
              </button>
              <button
                onClick={() => {
                  onChange(content) // Reset to original
                  setIsEditing(false)
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                ✕ Cancel
              </button>
            </div>
          </div>

          {/* LaTeX Shortcuts Panel */}
          <AnimatePresence>
            {showShortcuts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border rounded-lg p-3 shadow-lg"
              >
                <div className="grid grid-cols-8 gap-1">
                  {LaTeXShortcuts.map((shortcut, index) => (
                    <button
                      key={index}
                      onClick={() => insertLaTeX(shortcut.latex)}
                      className="p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border text-center"
                      title={shortcut.latex}
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Click any symbol to insert its LaTeX code
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Split view: Editor and Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border rounded-b-lg">
            {/* Editor */}
            <div className="p-0">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full min-h-[100px] p-3 border-0 resize-none focus:outline-none font-mono text-sm"
                autoFocus
              />
            </div>
            
            {/* Live Preview */}
            <div className="border-l p-3 bg-gray-50">
              <div className="text-xs text-gray-600 mb-2">Live Preview:</div>
              <div className="min-h-[76px]">
                <ReliableMathRenderer content={content} inline={inline} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div 
      ref={containerRef}
      className={`group relative cursor-text ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <div className="min-h-[1.5em]">
        {content ? (
          <ReliableMathRenderer content={content} inline={inline} />
        ) : (
          <span className="text-gray-400 italic">{placeholder}</span>
        )}
      </div>
      
      {/* Edit indicator */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-bl-lg">
          ✏️ Click to edit
        </div>
      </div>
    </div>
  )
}

export default InlineLaTeXEditor