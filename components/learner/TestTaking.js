"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Flag,
  Eye,
  BookOpen,
  Timer,
  Send,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Info,
  X
} from "lucide-react"

export default function TestTaking({ test, testSeries, onBack, onComplete, existingAttempt }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [testStarted, setTestStarted] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const timerRef = useRef(null)
  const { getAuthHeaders, user } = useAuth()

  const questions = test.questions || []
  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    // Initialize from existing attempt if available
    if (existingAttempt) {
      setAnswers(existingAttempt.answers || {})
      setFlaggedQuestions(new Set(existingAttempt.flaggedQuestions || []))
      setTimeRemaining(existingAttempt.timeRemaining || test.timeLimit * 60)
      setTestStarted(true)
      setShowInstructions(false)
      if (existingAttempt.completed) {
        setIsTimerRunning(false)
      } else {
        setIsTimerRunning(true)
      }
    } else {
      setTimeRemaining(test.timeLimit * 60) // Convert minutes to seconds
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [test, existingAttempt])

  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTimerRunning, timeRemaining])

  const startTest = () => {
    setTestStarted(true)
    setShowInstructions(false)
    setIsTimerRunning(true)
    saveProgress() // Save initial state
  }

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }))
    
    // Auto-save progress
    setTimeout(() => saveProgress(), 500)
  }

  const toggleFlag = (questionIndex) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex)
      } else {
        newSet.add(questionIndex)
      }
      return newSet
    })
  }

  const saveProgress = async () => {
    if (!testStarted) return

    try {
      await fetch('/api/test-attempts', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testSeriesId: testSeries._id,
          testNumber: test.testNumber,
          answers,
          flaggedQuestions: Array.from(flaggedQuestions),
          timeRemaining,
          completed: false
        })
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const handleAutoSubmit = async () => {
    await submitTest(true)
  }

  const submitTest = async (autoSubmit = false) => {
    setIsSubmitting(true)
    setIsTimerRunning(false)

    try {
      const response = await fetch('/api/test-attempts', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testSeriesId: testSeries._id,
          testNumber: test.testNumber,
          answers,
          flaggedQuestions: Array.from(flaggedQuestions),
          timeRemaining: autoSubmit ? 0 : timeRemaining,
          completed: true,
          autoSubmitted: autoSubmit
        })
      })

      if (response.ok) {
        const result = await response.json()
        onComplete(result.attempt)
      } else {
        throw new Error('Failed to submit test')
      }
    } catch (error) {
      console.error('Error submitting test:', error)
      setIsTimerRunning(true) // Resume timer on error
    } finally {
      setIsSubmitting(false)
      setShowConfirmSubmit(false)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionStatus = (index) => {
    if (answers[index] !== undefined) return 'answered'
    if (flaggedQuestions.has(index)) return 'flagged'
    return 'not-attempted'
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getFlaggedCount = () => {
    return flaggedQuestions.size
  }

  const getNotAttemptedCount = () => {
    return questions.length - getAnsweredCount()
  }

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
                <BookOpen className="h-8 w-8 text-purple-600" />
                {test.title}
              </CardTitle>
              <CardDescription className="text-lg text-slate-600">
                Test Instructions
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Test Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{questions.length}</div>
                  <p className="text-slate-600 text-sm">Questions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{test.timeLimit} mins</div>
                  <p className="text-slate-600 text-sm">Duration</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{testSeries.marksPerQuestion}</div>
                  <p className="text-slate-600 text-sm">Per Correct</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">-{testSeries.negativeMarking}</div>
                  <p className="text-slate-600 text-sm">Per Wrong</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Important Instructions
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-700">General Guidelines</h4>
                    <ul className="space-y-2 text-slate-600 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Test duration is {test.timeLimit} minutes
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        All questions are multiple choice with 4 options
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Each correct answer gives +{testSeries.marksPerQuestion} marks
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        Each wrong answer deducts -{testSeries.negativeMarking} marks
                      </li>
                      <li className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Unanswered questions carry no penalty
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-700">Navigation & Features</h4>
                    <ul className="space-y-2 text-slate-600 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Use Previous/Next buttons to navigate
                      </li>
                      <li className="flex items-start gap-2">
                        <Flag className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        Flag questions for later review
                      </li>
                      <li className="flex items-start gap-2">
                        <Eye className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        Question palette shows your progress
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Test auto-saves your progress
                      </li>
                      <li className="flex items-start gap-2">
                        <Timer className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Test auto-submits when time expires
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Important:</strong> Once you start the test, the timer will begin immediately. 
                  Make sure you have a stable internet connection and are in a distraction-free environment.
                </AlertDescription>
              </Alert>

              {/* Start Button */}
              <div className="text-center pt-4">
                <Button 
                  onClick={startTest}
                  size="lg" 
                  className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Test
                </Button>
                <p className="text-sm text-slate-500 mt-2">
                  Click to begin your test. Good luck!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (existingAttempt?.completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tests
            </Button>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-slate-800">
                Test Completed
              </CardTitle>
              <CardDescription>
                {test.title} - Results
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-bold text-green-600">
                {existingAttempt.score}%
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div>
                  <div className="text-2xl font-bold text-green-600">{existingAttempt.correctAnswers}</div>
                  <p className="text-slate-600 text-sm">Correct</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{existingAttempt.wrongAnswers}</div>
                  <p className="text-slate-600 text-sm">Wrong</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-600">{existingAttempt.skippedAnswers}</div>
                  <p className="text-slate-600 text-sm">Skipped</p>
                </div>
              </div>
              <p className="text-slate-600">
                Completed on {new Date(existingAttempt.completedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{test.title}</h1>
              <p className="text-sm text-slate-600">{testSeries.title}</p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${
              timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Test
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl min-h-[600px]">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFlag(currentQuestionIndex)}
                    className={flaggedQuestions.has(currentQuestionIndex) ? 'bg-yellow-100 border-yellow-300' : ''}
                  >
                    <Flag className={`h-4 w-4 ${flaggedQuestions.has(currentQuestionIndex) ? 'text-yellow-600' : 'text-slate-400'}`} />
                    {flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                {currentQuestion && (
                  <div className="space-y-6">
                    <div className="text-lg leading-relaxed text-slate-800">
                      {currentQuestion.questionText}
                    </div>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            answers[currentQuestionIndex] === optionIndex
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                          onClick={() => handleAnswerSelect(currentQuestionIndex, optionIndex)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              answers[currentQuestionIndex] === optionIndex
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-slate-300'
                            }`}>
                              {answers[currentQuestionIndex] === optionIndex && (
                                <CheckCircle className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <span className="font-medium text-slate-700">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span className="text-slate-800">{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Navigation */}
              <div className="flex items-center justify-between p-6 border-t bg-slate-50/50">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-sm text-slate-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Question Palette */}
          <div className="space-y-6">
            {/* Progress Summary */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Answered</span>
                    <Badge className="bg-green-100 text-green-700">{getAnsweredCount()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Flagged</span>
                    <Badge className="bg-yellow-100 text-yellow-700">{getFlaggedCount()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Not Attempted</span>
                    <Badge variant="secondary">{getNotAttemptedCount()}</Badge>
                  </div>
                </div>
                <Progress value={(getAnsweredCount() / questions.length) * 100} className="h-2" />
              </CardContent>
            </Card>

            {/* Question Grid */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const status = getQuestionStatus(index)
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                          index === currentQuestionIndex
                            ? 'border-purple-500 bg-purple-500 text-white scale-110'
                            : status === 'answered'
                            ? 'border-green-500 bg-green-100 text-green-700 hover:scale-105'
                            : status === 'flagged'
                            ? 'border-yellow-500 bg-yellow-100 text-yellow-700 hover:scale-105'
                            : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:scale-105'
                        }`}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-500"></div>
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-500"></div>
                  <span className="text-slate-600">Flagged</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded bg-slate-50 border border-slate-300"></div>
                  <span className="text-slate-600">Not Attempted</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded bg-purple-500"></div>
                  <span className="text-slate-600">Current</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirm Submission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Are you sure you want to submit your test? You have:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Answered questions:</span>
                  <span className="font-medium">{getAnsweredCount()}/{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time remaining:</span>
                  <span className="font-medium">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  Once submitted, you cannot modify your answers.
                </AlertDescription>
              </Alert>
            </CardContent>
            <div className="flex gap-3 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1"
              >
                Continue Test
              </Button>
              <Button
                onClick={() => submitTest(false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                Submit Now
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
} 