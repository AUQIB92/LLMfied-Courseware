"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { 
  QuestionHeader, 
  SolvedExample, 
  UnsolvedProblem, 
  QuestionContainer 
} from './assignment-components'
import SmartMathRenderer from '../SmartMathRenderer'
import EnhancedContentRenderer from './enhanced-content-renderer'

interface AssignmentData {
  title?: string
  instructions?: string
  references?: string
  questions?: QuestionData[]
}

interface QuestionData {
  number: number
  title: string
  reference?: string
  solvedExample: {
    problem: string
    given: string[]
    required: string
    solution: string
    answer: string
  }
  unsolvedProblems: Array<{
    problem: string
  }>
}

interface BeautifulAssignmentRendererProps {
  content: string
  className?: string
}

export const BeautifulAssignmentRenderer: React.FC<BeautifulAssignmentRendererProps> = ({
  content,
  className = ""
}) => {
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
    // Enhanced fallback renderer for unstructured content
    return (
      <div className={`beautiful-assignment-fallback ${className}`}>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-800">Assignment Content</h2>
              <p className="text-sm text-blue-600">Enhanced rendering with math, tables, and HTML support</p>
            </div>
          </div>
        </div>
        <div className="assignment-content-enhanced">
          <EnhancedContentRenderer content={content} />
        </div>
      </div>
    )
  }

  return (
    <div className={`beautiful-assignment-renderer ${className}`}>
      {/* Assignment Header */}
      {assignmentData.title && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            {assignmentData.title}
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
        </motion.div>
      )}

      {/* Instructions */}
      {assignmentData.instructions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-blue-800">Instructions for Students</h2>
          </div>
          <EnhancedContentRenderer content={assignmentData.instructions} className="text-blue-700 leading-relaxed" />
        </motion.div>
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
      <div className="space-y-10">
        {assignmentData.questions.map((question, index) => (
          <QuestionContainer key={question.number} className="">
            <QuestionHeader
              questionNumber={question.number}
              title={question.title}
              reference={question.reference}
            />
            
            <SolvedExample
              problem={question.solvedExample.problem}
              given={question.solvedExample.given}
              required={question.solvedExample.required}
              solution={question.solvedExample.solution}
              answer={question.solvedExample.answer}
            />
            
            {question.unsolvedProblems.length > 0 && (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-blue-800">Problems for Students to Solve</h4>
                </motion.div>
                
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {question.unsolvedProblems.map((problem, problemIndex) => (
                    <UnsolvedProblem
                      key={`problem-${problemIndex}`}
                      problemNumber={problemIndex + 1}
                      problem={problem.problem}
                    />
                  ))}
                </div>
              </div>
            )}
          </QuestionContainer>
        ))}
      </div>

      {/* Assignment Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="mt-12 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-full px-6 py-3">
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-purple-800">
            Assignment Complete • {assignmentData.questions.length} Questions • {assignmentData.questions.length * 4} Total Problems
          </span>
        </div>
      </motion.div>
    </div>
  )
}

export default BeautifulAssignmentRenderer