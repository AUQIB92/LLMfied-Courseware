"use client"

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExamFrontPage,
  QuestionHeader, 
  SolvedExample, 
  UnsolvedProblem, 
  QuestionContainer 
} from './assignment-components'
import ReliableMathRenderer from '../ReliableMathRenderer'
import { useStudentInfo } from '@/hooks/useStudentInfo'

// Editing toolbar component
const EditingToolbar = ({ 
  onSave, 
  onExport, 
  onToggleEdit, 
  isEditing, 
  onUndo, 
  onRedo,
  canUndo,
  canRedo
}: {
  onSave: () => void
  onExport: () => void
  onToggleEdit: () => void
  isEditing: boolean
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}) => (
  <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg border p-2 z-50 flex gap-2">
    <button
      onClick={onToggleEdit}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isEditing 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
    >
      {isEditing ? '✓ Done Editing' : '✏️ Edit'}
    </button>
    
    {isEditing && (
      <>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
      </>
    )}
    
    <button
      onClick={onSave}
      className="px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200"
    >
      💾 Save
    </button>
    
    <button
      onClick={onExport}
      className="px-3 py-2 rounded-md text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
    >
      📄 Export
    </button>
  </div>
)

// LaTeX helper panel
const LaTeXHelper = ({ isVisible, onInsert }: { isVisible: boolean, onInsert: (latex: string) => void }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-4 bg-white shadow-lg rounded-lg border p-4 z-40 w-80"
      >
        <h3 className="text-sm font-semibold text-gray-800 mb-3">LaTeX Quick Insert</h3>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onInsert('\\frac{}{}')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">Fraction</button>
          <button onClick={() => onInsert('\\sqrt{}')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">Square Root</button>
          <button onClick={() => onInsert('x^{}')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">Superscript</button>
          <button onClick={() => onInsert('x_{}')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">Subscript</button>
          <button onClick={() => onInsert('\\alpha')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">α</button>
          <button onClick={() => onInsert('\\beta')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">β</button>
          <button onClick={() => onInsert('\\gamma')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">γ</button>
          <button onClick={() => onInsert('\\pi')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">π</button>
          <button onClick={() => onInsert('\\sum_{i=1}^{n}')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">Σ</button>
          <button onClick={() => onInsert('\\int_{a}^{b}')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">∫</button>
          <button onClick={() => onInsert('\\lim_{x \\to \\infty}')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">lim</button>
          <button onClick={() => onInsert('\\begin{equation}\n\n\\end{equation}')} className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded">Equation</button>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          <p><strong>Tip:</strong> Use $ for inline math, $$ for block math</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Editable text area with live preview
const EditableContent = ({ 
  content, 
  onChange, 
  isEditing, 
  placeholder = "Enter content...",
  className = ""
}: {
  content: string
  onChange: (content: string) => void
  isEditing: boolean
  placeholder?: string
  className?: string
}) => {
  const [showLatexHelper, setShowLatexHelper] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertLatex = useCallback((latex: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + latex + content.substring(end)
      onChange(newContent)
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + latex.length
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
    setShowLatexHelper(false)
  }, [content, onChange])

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Edit Content</label>
              <button
                onClick={() => setShowLatexHelper(!showLatexHelper)}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                LaTeX Help
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-32 min-h-[8rem] p-3 border border-gray-300 rounded-lg resize-y font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'z') {
                  e.preventDefault()
                  // Handle undo
                }
                if (e.ctrlKey && e.key === 'y') {
                  e.preventDefault()
                  // Handle redo
                }
              }}
            />
          </div>
          
          {/* Live Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Live Preview</label>
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 min-h-[8rem] overflow-auto">
              <ReliableMathRenderer content={content} />
            </div>
          </div>
        </div>
        
        <LaTeXHelper 
          isVisible={showLatexHelper} 
          onInsert={insertLatex}
        />
      </div>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      <ReliableMathRenderer content={content} />
      <button
        onClick={() => {/* This will be handled by parent */}}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-bl-lg"
      >
        ✏️ Edit
      </button>
    </div>
  )
}

// Main editable assignment renderer
interface EditableAssignmentData {
  title: string
  instructions: string
  deadline?: string
  totalMarks?: number
  questions: EditableQuestionData[]
}

interface EditableQuestionData {
  id: string
  number: number
  title: string
  reference?: string
  marks?: number
  solvedExample: {
    problem: string
    given: string[]
    required: string
    solution: string
    answer: string
  }
  unsolvedProblems: Array<{
    id: string
    problem: string
    marks?: number
  }>
}

interface EditableAssignmentRendererProps {
  initialContent: string
  onSave?: (content: EditableAssignmentData) => void
  onExport?: (content: EditableAssignmentData) => void
  className?: string
}

export const EditableAssignmentRenderer: React.FC<EditableAssignmentRendererProps> = ({
  initialContent,
  onSave,
  onExport,
  className = ""
}) => {
  const studentInfo = useStudentInfo()
  const [isEditing, setIsEditing] = useState(false)
  const [assignmentData, setAssignmentData] = useState<EditableAssignmentData>(() => {
    // Parse initial content or provide default structure
    return {
      title: "Mathematics Examination",
      instructions: "Read all questions carefully. Show all work clearly.",
      totalMarks: 100,
      questions: [
        {
          id: "q1",
          number: 1,
          title: "Sample Question",
          marks: 10,
          solvedExample: {
            problem: "Solve: $x^2 + 5x + 6 = 0$",
            given: ["Quadratic equation", "$a = 1, b = 5, c = 6$"],
            required: "Find the roots of the equation",
            solution: "Using the quadratic formula:\n$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n$x = \\frac{-5 \\pm \\sqrt{25 - 24}}{2}$\n$x = \\frac{-5 \\pm 1}{2}$",
            answer: "$x = -2$ or $x = -3$"
          },
          unsolvedProblems: [
            {
              id: "p1",
              problem: "Solve: $x^2 - 7x + 12 = 0$",
              marks: 5
            }
          ]
        }
      ]
    }
  })

  // History for undo/redo
  const [history, setHistory] = useState<EditableAssignmentData[]>([assignmentData])
  const [historyIndex, setHistoryIndex] = useState(0)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const addToHistory = useCallback((newData: EditableAssignmentData) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1)
      setAssignmentData(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1)
      setAssignmentData(history[historyIndex + 1])
    }
  }

  const updateField = (path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(assignmentData))
    let current = newData
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    
    setAssignmentData(newData)
    addToHistory(newData)
  }

  const handleSave = () => {
    onSave?.(assignmentData)
    // Show save confirmation
    alert('Assignment saved successfully!')
  }

  const handleExport = () => {
    onExport?.(assignmentData)
    // Export to PDF or other format
    window.print()
  }

  const totalMarks = assignmentData.questions.reduce((total, q) => 
    total + (q.marks || 0) + q.unsolvedProblems.reduce((subTotal, p) => subTotal + (p.marks || 0), 0)
  , 0)

  return (
    <div className={`editable-assignment-renderer ${className}`}>
      <EditingToolbar
        onSave={handleSave}
        onExport={handleExport}
        onToggleEdit={() => setIsEditing(!isEditing)}
        isEditing={isEditing}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Exam Front Page */}
      <ExamFrontPage
        title={assignmentData.title}
        totalMarks={totalMarks}
        studentName={studentInfo?.name}
        studentEnrollment={studentInfo?.enrollmentNumber}
        deadline={assignmentData.deadline}
        className="mb-12"
      />

      {/* Editable Title */}
      <div className="mb-8">
        <EditableContent
          content={assignmentData.title}
          onChange={(content) => updateField(['title'], content)}
          isEditing={isEditing}
          placeholder="Assignment Title"
          className="text-center"
        />
      </div>

      {/* Editable Instructions */}
      {(assignmentData.instructions || isEditing) && (
        <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Instructions:</h2>
          <EditableContent
            content={assignmentData.instructions}
            onChange={(content) => updateField(['instructions'], content)}
            isEditing={isEditing}
            placeholder="Enter instructions for students..."
          />
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {assignmentData.questions.map((question, qIndex) => (
          <div key={question.id} className="border border-gray-400 rounded-lg p-6 bg-white">
            {/* Question Header - Editable */}
            <div className="border-b-2 border-gray-300 pb-3 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-800">{question.number}.</span>
                  <EditableContent
                    content={question.title}
                    onChange={(content) => updateField(['questions', qIndex, 'title'], content)}
                    isEditing={isEditing}
                    placeholder="Question title"
                  />
                </div>
                {isEditing && (
                  <input
                    type="number"
                    value={question.marks || 0}
                    onChange={(e) => updateField(['questions', qIndex, 'marks'], parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Marks"
                  />
                )}
                {!isEditing && question.marks && (
                  <div className="bg-gray-100 px-3 py-1 rounded-md border">
                    <span className="text-sm font-medium text-gray-700">[{question.marks} marks]</span>
                  </div>
                )}
              </div>
              {question.reference && (
                <EditableContent
                  content={question.reference}
                  onChange={(content) => updateField(['questions', qIndex, 'reference'], content)}
                  isEditing={isEditing}
                  placeholder="Reference source"
                  className="text-sm text-gray-600 mt-2 ml-8"
                />
              )}
            </div>
            
            {/* Solved Example - Editable */}
            <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
              <h4 className="text-base font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                Worked Example:
              </h4>
              
              <div className="mb-4">
                <EditableContent
                  content={question.solvedExample.problem}
                  onChange={(content) => updateField(['questions', qIndex, 'solvedExample', 'problem'], content)}
                  isEditing={isEditing}
                  placeholder="Problem statement"
                />
              </div>

              {/* Given and Required sections */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Given:</p>
                  {isEditing ? (
                    <textarea
                      value={question.solvedExample.given.join('\n')}
                      onChange={(e) => updateField(['questions', qIndex, 'solvedExample', 'given'], e.target.value.split('\n').filter(line => line.trim()))}
                      className="w-full h-20 p-2 border border-gray-300 rounded text-sm"
                      placeholder="Enter given information (one per line)"
                    />
                  ) : (
                    <ul className="ml-4 space-y-1">
                      {question.solvedExample.given.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-800">
                          • <ReliableMathRenderer content={item} inline />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Find:</p>
                  <EditableContent
                    content={question.solvedExample.required}
                    onChange={(content) => updateField(['questions', qIndex, 'solvedExample', 'required'], content)}
                    isEditing={isEditing}
                    placeholder="What needs to be found"
                    className="text-sm text-gray-800 ml-4"
                  />
                </div>
              </div>

              {/* Solution */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Solution:</p>
                <EditableContent
                  content={question.solvedExample.solution}
                  onChange={(content) => updateField(['questions', qIndex, 'solvedExample', 'solution'], content)}
                  isEditing={isEditing}
                  placeholder="Step-by-step solution"
                  className="ml-4 text-gray-800 leading-relaxed"
                />
              </div>

              {/* Answer */}
              <div className="border-t border-gray-300 pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Answer:</p>
                <EditableContent
                  content={question.solvedExample.answer}
                  onChange={(content) => updateField(['questions', qIndex, 'solvedExample', 'answer'], content)}
                  isEditing={isEditing}
                  placeholder="Final answer"
                  className="ml-4 font-medium text-gray-900"
                />
              </div>
            </div>

            {/* Unsolved Problems - Editable */}
            <div className="space-y-4">
              {question.unsolvedProblems.map((problem, pIndex) => (
                <div key={problem.id} className="border border-gray-300 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-gray-800">
                      ({String.fromCharCode(97 + pIndex)})
                    </span>
                    {isEditing && (
                      <input
                        type="number"
                        value={problem.marks || 0}
                        onChange={(e) => updateField(['questions', qIndex, 'unsolvedProblems', pIndex, 'marks'], parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Marks"
                      />
                    )}
                    {!isEditing && problem.marks && (
                      <span className="text-sm text-gray-600">[{problem.marks} marks]</span>
                    )}
                  </div>
                  
                  <EditableContent
                    content={problem.problem}
                    onChange={(content) => updateField(['questions', qIndex, 'unsolvedProblems', pIndex, 'problem'], content)}
                    isEditing={isEditing}
                    placeholder="Problem statement"
                    className="text-gray-800"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Button (when editing) */}
      {isEditing && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              const newQuestion: EditableQuestionData = {
                id: `q${Date.now()}`,
                number: assignmentData.questions.length + 1,
                title: "New Question",
                marks: 10,
                solvedExample: {
                  problem: "",
                  given: [],
                  required: "",
                  solution: "",
                  answer: ""
                },
                unsolvedProblems: [
                  {
                    id: `p${Date.now()}`,
                    problem: "",
                    marks: 5
                  }
                ]
              }
              updateField(['questions'], [...assignmentData.questions, newQuestion])
            }}
            className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
          >
            + Add New Question
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center border-t-2 border-gray-400 pt-6">
        <div className="text-sm text-gray-600">
          Total Marks: {totalMarks}
        </div>
      </div>
    </div>
  )
}

export default EditableAssignmentRenderer