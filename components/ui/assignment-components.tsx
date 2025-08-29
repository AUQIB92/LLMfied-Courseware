"use client"

import React from 'react'
import { motion } from 'framer-motion'
import ReliableMathRenderer from '../ReliableMathRenderer'
import EnhancedContentRenderer from './enhanced-content-renderer'
import { cn } from '@/lib/utils'

// SVG Icons
export const SolvedIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#solved-gradient)" />
    <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="solved-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
)

export const ProblemIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#problem-gradient)" />
    <path d="M12 16v-4M12 8h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="problem-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
  </svg>
)

export const QuestionIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="14" rx="2" fill="url(#question-gradient)" />
    <path d="M8 10h8M8 14h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="19" cy="19" r="3" fill="#f59e0b" />
    <path d="M19 17.5v1M19 20.5h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="question-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
  </svg>
)

export const ReferenceIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7h8M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const StepIcon = ({ stepNumber }: { stepNumber: number }) => (
  <div className="relative">
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="url(#step-gradient)" stroke="white" strokeWidth="2" />
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
        {stepNumber}
      </text>
      <defs>
        <linearGradient id="step-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
    </svg>
  </div>
)

// Exam Front Page Component
export const ExamFrontPage = ({ 
  title,
  totalMarks,
  marksObtained,
  deadline,
  studentName,
  studentEnrollment,
  className 
}: {
  title: string
  totalMarks: number
  marksObtained?: number
  deadline?: string
  studentName?: string
  studentEnrollment?: string
  className?: string
}) => (
  <div className={cn(
    "border-4 border-gray-800 p-8 mb-8 bg-white min-h-screen page-break-after",
    className
  )}>
    {/* College Header */}
    <div className="text-center border-b-2 border-gray-600 pb-6 mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        GCET KASHMIR
      </h1>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Government College of Engineering and Technology
      </h2>
      <div className="text-lg text-gray-700">
        <div className="mb-2">
          <span className="font-semibold">Instructor:</span> Dr. Auqib Hamid
        </div>
      </div>
    </div>

    {/* Exam Title */}
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 border-2 border-gray-600 p-4">
        {title}
      </h2>
    </div>

    {/* Student Information */}
    <div className="grid grid-cols-1 gap-6 mb-8 text-lg">
      <div className="flex justify-between border-b border-gray-400 pb-2">
        <span className="font-semibold">Student Name:</span>
        <span className="border-b border-gray-400 min-w-[300px] text-right">
          {studentName || '_'.repeat(30)}
        </span>
      </div>
      
      <div className="flex justify-between border-b border-gray-400 pb-2">
        <span className="font-semibold">Enrollment No:</span>
        <span className="border-b border-gray-400 min-w-[300px] text-right">
          {studentEnrollment || '_'.repeat(30)}
        </span>
      </div>
      
      <div className="flex justify-between border-b border-gray-400 pb-2">
        <span className="font-semibold">Date:</span>
        <span className="border-b border-gray-400 min-w-[300px] text-right">
          {'_'.repeat(30)}
        </span>
      </div>

      {deadline && (
        <div className="flex justify-between border-b border-gray-400 pb-2">
          <span className="font-semibold">Deadline:</span>
          <span className="font-medium">{deadline}</span>
        </div>
      )}
    </div>

    {/* Marks Section */}
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div className="border-2 border-gray-600 p-4">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Total Marks</div>
          <div className="text-3xl font-bold border-2 border-gray-400 p-4">
            {totalMarks}
          </div>
        </div>
      </div>
      
      <div className="border-2 border-gray-600 p-4">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Marks Obtained</div>
          <div className="text-3xl font-bold border-2 border-gray-400 p-4">
            {marksObtained !== undefined ? marksObtained : '____'}
          </div>
        </div>
      </div>
    </div>

    {/* Instructions */}
    <div className="border-2 border-gray-600 p-4 mb-8">
      <h3 className="text-lg font-semibold mb-4">Instructions:</h3>
      <ul className="space-y-2 text-base">
        <li>• Read all questions carefully before answering</li>
        <li>• Show all work clearly and step by step</li>
        <li>• Write your answers in the spaces provided</li>
        <li>• Use proper mathematical notation</li>
        <li>• Check your answers before submitting</li>
      </ul>
    </div>

    {/* Signature Section */}
    <div className="flex justify-between items-end mt-auto pt-8">
      <div>
        <div className="border-b border-gray-400 w-40 mb-2"></div>
        <div className="text-center text-sm">Student Signature</div>
      </div>
      <div>
        <div className="border-b border-gray-400 w-40 mb-2"></div>
        <div className="text-center text-sm">Instructor Signature</div>
      </div>
    </div>
  </div>
)

// Exam-style Question Header Component
export const QuestionHeader = ({ 
  questionNumber, 
  title, 
  reference, 
  className,
  marks 
}: {
  questionNumber: number
  title: string
  reference?: string
  className?: string
  marks?: number
}) => (
  <div className={cn(
    "border-b-2 border-gray-300 pb-3 mb-6",
    className
  )}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-gray-800">
          {questionNumber}.
        </span>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {marks && (
        <div className="bg-gray-100 px-3 py-1 rounded-md border">
          <span className="text-sm font-medium text-gray-700">[{marks} marks]</span>
        </div>
      )}
    </div>
    {reference && (
      <p className="text-sm text-gray-600 mt-2 ml-8">
        Reference: {reference}
      </p>
    )}
  </div>
)

// Exam-style Worked Example Component
export const SolvedExample = ({ 
  problem, 
  given, 
  required, 
  solution, 
  answer, 
  className 
}: {
  problem: string
  given: string[]
  required: string
  solution: string
  answer: string
  className?: string
}) => (
  <div className={cn(
    "border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50",
    className
  )}>
    <div className="mb-4">
      <h4 className="text-base font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
        Worked Example:
      </h4>
      <div className="text-gray-800 mb-4">
        <ReliableMathRenderer content={problem} />
      </div>
    </div>

    {/* Given and Required in simple format */}
    {given.length > 0 && (
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Given:</p>
        <ul className="ml-4 space-y-1">
          {given.map((item, index) => (
            <li key={index} className="text-sm text-gray-800">
              • <ReliableMathRenderer content={item} inline />
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="mb-4">
      <p className="text-sm font-medium text-gray-700 mb-2">Find:</p>
      <div className="text-sm text-gray-800 ml-4">
        <ReliableMathRenderer content={required} />
      </div>
    </div>

    <div className="mb-4">
      <p className="text-sm font-medium text-gray-700 mb-2">Solution:</p>
      <div className="ml-4 text-gray-800 leading-relaxed">
        <ReliableMathRenderer content={solution} />
      </div>
    </div>

    <div className="border-t border-gray-300 pt-3">
      <p className="text-sm font-medium text-gray-700 mb-2">Answer:</p>
      <div className="ml-4 font-medium text-gray-900">
        <ReliableMathRenderer content={answer} />
      </div>
    </div>
  </div>
)

// Exam-style Problem Component
export const UnsolvedProblem = ({ 
  problemNumber, 
  problem, 
  className,
  marks 
}: {
  problemNumber: number
  problem: string
  className?: string
  marks?: number
}) => (
  <div className={cn(
    "border border-gray-300 rounded-lg p-4 mb-4 bg-white",
    className
  )}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-base font-semibold text-gray-800">
        ({String.fromCharCode(97 + problemNumber - 1)}) {/* Converts 1 to 'a', 2 to 'b', etc. */}
      </span>
      {marks && (
        <span className="text-sm text-gray-600">[{marks} marks]</span>
      )}
    </div>
    
    <div className="text-gray-800">
      <ReliableMathRenderer content={problem} />
    </div>
  </div>
)

// Container for all problems in a question
export const QuestionContainer = ({ 
  children, 
  className 
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn("space-y-6 mb-8", className)}>
    {children}
    <div className="flex justify-center">
      <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full"></div>
    </div>
  </div>
)

export default {
  ExamFrontPage,
  QuestionHeader,
  SolvedExample,
  UnsolvedProblem,
  QuestionContainer,
  SolvedIcon,
  ProblemIcon,
  QuestionIcon,
  ReferenceIcon,
  StepIcon
}