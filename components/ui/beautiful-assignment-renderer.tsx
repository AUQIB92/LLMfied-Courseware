"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ExamFrontPage,
  QuestionHeader, 
  SolvedExample, 
  UnsolvedProblem, 
  QuestionContainer 
} from './assignment-components'
import ReliableMathRenderer from '../ReliableMathRenderer'
import EnhancedContentRenderer from './enhanced-content-renderer'
import { useStudentInfo } from '@/hooks/useStudentInfo'
import InlineLaTeXEditor from './inline-latex-editor'

interface AssignmentData {
  title?: string
  instructions?: string
  references?: string
  questions?: QuestionData[]
  deadline?: string
  totalMarks?: number
  marksObtained?: number
  studentName?: string
  studentEnrollment?: string
}

interface QuestionData {
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
    problem: string
    marks?: number
  }>
}

interface BeautifulAssignmentRendererProps {
  content: string
  className?: string
  allowEditing?: boolean
  onContentChange?: (content: string) => void
}

export const BeautifulAssignmentRenderer: React.FC<BeautifulAssignmentRendererProps> = ({
  content,
  className = "",
  allowEditing = false,
  onContentChange
}) => {
  const studentInfo = useStudentInfo()
  const [isEditMode, setIsEditMode] = useState(false)
  // Parse the assignment content to extract structured data
  const parseAssignment = (content: string): AssignmentData => {
    if (!content) return {}
    
    try {
      // Parse the assignment content using regex patterns
      const questions: QuestionData[] = []
      
      // Extract questions using pattern matching
      const questionPattern = /### Question (\d+): ([^\n]+)\n\*\*Source Reference:\*\* ([^\n]+)/g
      let questionMatch
      
      while ((questionMatch = questionPattern.exec(content)) !== null) {
        const questionNumber = parseInt(questionMatch[1])
        const questionTitle = questionMatch[2].trim()
        const reference = questionMatch[3].trim()
        
        // Find the content for this question
        const questionStart = questionMatch.index
        const nextQuestionMatch = content.indexOf('### Question', questionStart + 1)
        const questionEnd = nextQuestionMatch === -1 ? content.length : nextQuestionMatch
        const questionContent = content.substring(questionStart, questionEnd)
        
        // Parse solved example
        const solvedExample = parseSolvedExample(questionContent)
        const unsolvedProblems = parseUnsolvedProblems(questionContent)
        
        if (solvedExample) {
          questions.push({
            number: questionNumber,
            title: questionTitle,
            reference,
            solvedExample,
            unsolvedProblems
          })
        }
      }
      
      return {
        title: extractTitle(content),
        instructions: extractInstructions(content),
        references: extractReferences(content),
        questions
      }
    } catch (error) {
      console.error('Error parsing assignment:', error)
      return {}
    }
  }

  const extractTitle = (content: string): string => {
    const titleMatch = content.match(/# ([^\n]+)/)
    return titleMatch ? titleMatch[1].trim() : 'Mathematical Assignment'
  }

  const extractInstructions = (content: string): string => {
    const instructionsMatch = content.match(/## Instructions for Students\n([\s\S]*?)(?=##|$)/)
    return instructionsMatch ? instructionsMatch[1].trim() : ''
  }

  const extractReferences = (content: string): string => {
    const referencesMatch = content.match(/## Academic References Used\n([\s\S]*?)(?=##|$)/)
    return referencesMatch ? referencesMatch[1].trim() : ''
  }

  const parseSolvedExample = (questionContent: string) => {
    try {
      const problemMatch = questionContent.match(/\*\*Problem:\*\* ([^\n]+)/)
      const givenMatch = questionContent.match(/\*\*Given:\*\*\n([\s\S]*?)\n\*\*Required:/)
      const requiredMatch = questionContent.match(/\*\*Required:\*\* ([^\n]+)/)
      const solutionMatch = questionContent.match(/\*\*Solution:\*\*\n([\s\S]*?)\n\*\*Final Answer:/)
      const answerMatch = questionContent.match(/\*\*Final Answer:\*\* ([^\n]+)/)
      
      if (!problemMatch || !requiredMatch || !answerMatch) return null
      
      const given = givenMatch ? 
        givenMatch[1].split('\n')
          .map(line => line.replace(/^- /, '').trim())
          .filter(line => line.length > 0) 
        : []
      
      return {
        problem: problemMatch[1].trim(),
        given,
        required: requiredMatch[1].trim(),
        solution: solutionMatch ? solutionMatch[1].trim() : '',
        answer: answerMatch[1].trim()
      }
    } catch (error) {
      console.error('Error parsing solved example:', error)
      return null
    }
  }

  const parseUnsolvedProblems = (questionContent: string) => {
    const problems = []
    
    try {
      // Extract unsolved problems - only the problem statement
      const problemPattern = /\*\*Problem (\d+):\*\* ([^\n]+)/g
      let problemMatch
      
      while ((problemMatch = problemPattern.exec(questionContent)) !== null) {
        problems.push({
          problem: problemMatch[2].trim()
        })
      }
    } catch (error) {
      console.error('Error parsing unsolved problems:', error)
    }
    
    return problems
  }

  const assignmentData = parseAssignment(content)

  if (!assignmentData.questions || assignmentData.questions.length === 0) {
    // Simple fallback renderer for unstructured content
    return (
      <div className={`exam-assignment-fallback ${className}`}>
        {/* Front Page for fallback content */}
        <ExamFrontPage
          title="Mathematics Assignment"
          totalMarks={100}
          studentName={studentInfo?.name}
          studentEnrollment={studentInfo?.enrollmentNumber}
          className="mb-12"
        />
        
        <div className="border border-gray-300 rounded-lg p-6 bg-white">
          {isEditMode && allowEditing ? (
            <InlineLaTeXEditor
              content={content}
              onChange={(newContent) => {
                onContentChange?.(newContent)
              }}
              placeholder="Enter assignment content with LaTeX..."
              className="w-full"
            />
          ) : (
            <div className="text-gray-800">
              <ReliableMathRenderer content={content} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Calculate total marks
  const totalMarks = assignmentData.questions?.reduce((total, q) => 
    total + (q.marks || 0) + q.unsolvedProblems.reduce((subTotal, p) => subTotal + (p.marks || 0), 0)
  , 0) || 0

  return (
    <div className={`beautiful-assignment-renderer ${className}`}>
      {/* Edit Mode Toggle */}
      {allowEditing && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-colors ${
              isEditMode 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isEditMode ? '✓ Done Editing' : '✏️ Quick Edit'}
          </button>
        </div>
      )}

      {/* Exam Front Page */}
      <ExamFrontPage
        title={assignmentData.title || 'Mathematics Examination'}
        totalMarks={totalMarks}
        marksObtained={assignmentData.marksObtained}
        deadline={assignmentData.deadline}
        studentName={assignmentData.studentName || studentInfo?.name}
        studentEnrollment={assignmentData.studentEnrollment || studentInfo?.enrollmentNumber}
        className="mb-12"
      />
      {/* Exam Header */}
      {assignmentData.title && (
        <div className="text-center mb-8 px-4 border-b-2 border-gray-400 pb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {assignmentData.title}
          </h1>
          <div className="flex justify-center gap-8 text-sm text-gray-700">
            <div>Name: ___________________</div>
            <div>Date: ___________________</div>
            <div>Class: ___________________</div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {assignmentData.instructions && (
        <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Instructions:
          </h2>
          <div className="text-gray-800">
            <ReliableMathRenderer content={assignmentData.instructions} />
          </div>
        </div>
      )}

      {/* References */}
      {assignmentData.references && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 mb-8 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-emerald-800">Academic References</h2>
          </div>
          <EnhancedContentRenderer content={assignmentData.references} className="text-emerald-700 leading-relaxed" />
        </motion.div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {assignmentData.questions.map((question, index) => (
          <div key={question.number} className="border border-gray-400 rounded-lg p-6 bg-white">
            <QuestionHeader
              questionNumber={question.number}
              title={question.title}
              reference={question.reference}
              marks={question.marks}
              className="mb-6"
            />
            
            <SolvedExample
              problem={question.solvedExample.problem}
              given={question.solvedExample.given}
              required={question.solvedExample.required}
              solution={question.solvedExample.solution}
              answer={question.solvedExample.answer}
              className="mb-6"
            />
            
            {question.unsolvedProblems.length > 0 && (
              <div className="space-y-4">
                {question.unsolvedProblems.map((problem, problemIndex) => (
                  <UnsolvedProblem
                    key={`problem-${problemIndex}`}
                    problemNumber={problemIndex + 1}
                    problem={problem.problem}
                    marks={problem.marks}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Exam Footer */}
      <div className="mt-12 text-center border-t-2 border-gray-400 pt-6">
        <div className="text-sm text-gray-600">
          Total Marks: {assignmentData.questions.reduce((total, q) => 
            total + (q.marks || 0) + q.unsolvedProblems.reduce((subTotal, p) => subTotal + (p.marks || 0), 0)
          , 0)}
        </div>
      </div>
    </div>
  )
}

export default BeautifulAssignmentRenderer