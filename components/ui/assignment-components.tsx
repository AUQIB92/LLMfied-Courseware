"use client"

import React from 'react'
import { motion } from 'framer-motion'
import SmartMathRenderer from '../SmartMathRenderer'
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

// Beautiful Question Header Component
export const QuestionHeader = ({ 
  questionNumber, 
  title, 
  reference, 
  className 
}: {
  questionNumber: number
  title: string
  reference?: string
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={cn(
      "relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-6 text-white shadow-2xl",
      className
    )}
  >
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10">
      <svg className="h-full w-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
      </svg>
    </div>
    
    <div className="relative flex items-center gap-4">
      <QuestionIcon />
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
            Question {questionNumber}
          </span>
          {reference && (
            <div className="flex items-center gap-1 text-amber-200">
              <ReferenceIcon />
              <span className="text-sm opacity-90">Source</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        {reference && (
          <p className="text-blue-100 text-sm mt-1 opacity-90">{reference}</p>
        )}
      </div>
    </div>
    
    {/* Decorative elements */}
    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-purple-400/20 rounded-full blur-lg"></div>
  </motion.div>
)

// Beautiful Solved Example Component
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
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className={cn(
      "relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6 shadow-lg",
      className
    )}
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-6">
      <SolvedIcon />
      <div>
        <h4 className="text-lg font-bold text-emerald-800">Solved Example</h4>
        <p className="text-sm text-emerald-600">Complete step-by-step solution</p>
      </div>
    </div>

    {/* Problem Statement */}
    <div className="mb-6 rounded-lg bg-white/80 p-4 shadow-sm border border-emerald-100">
      <h5 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        Problem Statement
      </h5>
      <EnhancedContentRenderer content={problem} className="text-gray-800" />
    </div>

    {/* Given & Required */}
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <h5 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Given
        </h5>
        <ul className="space-y-2">
          {given.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-blue-800">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <EnhancedContentRenderer content={item} className="text-sm" />
            </li>
          ))}
        </ul>
      </div>
      
      <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
        <h5 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          Required
        </h5>
        <EnhancedContentRenderer content={required} className="text-purple-800 font-medium" />
      </div>
    </div>

    {/* Solution Steps */}
    <div className="mb-6">
      <h5 className="text-sm font-semibold text-emerald-700 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        Solution
      </h5>
      <div className="bg-white/90 rounded-lg p-4 border border-emerald-200">
        <EnhancedContentRenderer content={solution} className="text-gray-800 leading-relaxed" />
      </div>
    </div>

    {/* Final Answer */}
    <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 p-4 text-white">
      <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Final Answer
      </h5>
      <EnhancedContentRenderer content={answer} className="text-white font-semibold text-lg" />
    </div>
  </motion.div>
)

// Beautiful Unsolved Problem Component
export const UnsolvedProblem = ({ 
  problemNumber, 
  problem, 
  className 
}: {
  problemNumber: number
  problem: string
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay: problemNumber * 0.1 }}
    className={cn(
      "relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-md hover:shadow-lg transition-all duration-300",
      className
    )}
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <ProblemIcon />
      <div>
        <h5 className="text-lg font-bold text-blue-800">Problem {problemNumber}</h5>
        <p className="text-sm text-blue-600">For students to solve</p>
      </div>
    </div>

    {/* Problem Statement Only */}
    <div className="mb-4 rounded-lg bg-white/90 p-5 shadow-sm border border-blue-100">
      <EnhancedContentRenderer content={problem} className="text-gray-800 text-base leading-relaxed" />
    </div>

    {/* Solution Space Indicator */}
    <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 p-4 bg-gray-50/50">
      <p className="text-center text-gray-500 text-sm font-medium">
        ✏️ Student Solution Space
      </p>
      <div className="mt-2 space-y-2">
        {[1, 2, 3, 4].map((line) => (
          <div key={line} className="h-4 border-b border-dotted border-gray-300"></div>
        ))}
      </div>
    </div>
  </motion.div>
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