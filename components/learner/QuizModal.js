"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// KaTeX renderer for mathematical content
const KaTeXRenderer = ({ content, className }) => {
  return (
    <div className={className || "katex-content"} dangerouslySetInnerHTML={{ __html: content }} />
  )
}

// Enhanced Rich text formatting helper with LaTeX support
const formatRichText = (text) => {
  if (!text || typeof text !== 'string') return ''
  
  // First, extract all LaTeX expressions to prevent them from being processed by other formatters
  const mathExpressions = []
  let processedText = text.replace(/\$\$(.*?)\$\$|\$(.*?)\$/g, (match, blockMath, inlineMath) => {
    const id = `MATH_PLACEHOLDER_${mathExpressions.length}`
    mathExpressions.push({
      id,
      type: blockMath ? 'block' : 'inline',
      expression: blockMath || inlineMath
    })
    return id
  })
  
  // Process the text with regular formatters
  processedText = processedText
    .split('\n\n')
    .map(paragraph => {
      let formatted = paragraph.trim()
      
      // Format bold text (**text** -> <strong>text</strong>)
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      
      // Format code blocks (`code` -> styled code)
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono text-sm">$1</code>')
      
      // Format italic text (*text* -> <em>text</em>)
      formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
      
      return `<p class="mb-2 last:mb-0">${formatted}</p>`
    })
    .join('')
  
  // Replace math placeholders with KaTeX HTML
  mathExpressions.forEach(({ id, type, expression }) => {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedId, 'g')
    
    if (type === 'block') {
      processedText = processedText.replace(regex, `<div class="katex-block my-2 text-center">\\[${expression}\\]</div>`)
    } else {
      processedText = processedText.replace(regex, `<span class="katex-inline">\\(${expression}\\)</span>`)
    }
  })
  
  return processedText
}

export default function QuizModal({ course, module, onClose, onComplete }) {
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const { getAuthHeaders } = useAuth()

  useEffect(() => {
    generateQuiz()
  }, [])

  const generateQuiz = async () => {
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          courseId: course._id,
          moduleId: module.id,
          difficulty: "medium",
        }),
      })

      const data = await response.json()

      if (response.ok && data.questions) {
        setQuiz(data)
      } else {
        throw new Error("Failed to generate quiz")
      }
    } catch (error) {
      console.error("Quiz generation error:", error)
      // Fallback quiz
      setQuiz({
        questions: [
          {
            question: "What is the main topic of this module?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: 0,
            explanation: "This is a sample question.",
          },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      calculateResults()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const calculateResults = () => {
    let correctAnswers = 0
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correct) {
        correctAnswers++
      }
    })

    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100)
    setScore(finalScore)
    setShowResults(true)
  }

  const handleComplete = () => {
    onComplete(score)
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generating Quiz</DialogTitle>
            <DialogDescription>Please wait while we create a personalized quiz for you...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz Unavailable</DialogTitle>
            <DialogDescription>
              Sorry, we couldn't generate a quiz for this module. Please try again later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showResults) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
            <DialogDescription>Here's how you performed on the {module.title} quiz</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{score}%</div>
              <Badge variant={score >= 70 ? "default" : "destructive"} className="text-lg px-4 py-2">
                {score >= 70 ? "Passed" : "Needs Improvement"}
              </Badge>
            </div>

            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const userAnswer = answers[index]
                const isCorrect = userAnswer === question.correct

                return (
                  <Card key={index} className={`border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <KaTeXRenderer 
                            content={formatRichText(question.question)}
                            className="text-base font-semibold mb-2"
                          />
                          <div className="mt-2 space-y-1">
                            <div className="text-sm text-gray-600">
                              Your answer: 
                              <KaTeXRenderer 
                                content={formatRichText(question.options[userAnswer] || "Not answered")}
                                className="inline ml-1"
                              />
                            </div>
                            {!isCorrect && (
                              <div className="text-sm text-green-600">
                                Correct answer: 
                                <KaTeXRenderer 
                                  content={formatRichText(question.options[question.correct])}
                                  className="inline ml-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {question.explanation && (
                      <CardContent className="pt-0">
                        <KaTeXRenderer 
                          content={formatRichText(question.explanation)}
                          className="text-sm text-gray-700"
                        />
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleComplete}>Continue Learning</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const currentQ = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quiz: {module.title}</DialogTitle>
          <DialogDescription>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} />

          <Card>
            <CardHeader>
              <KaTeXRenderer 
                content={formatRichText(currentQ.question)}
                className="text-lg font-semibold"
              />
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion]?.toString()}
                onValueChange={(value) => handleAnswerSelect(currentQuestion, Number.parseInt(value))}
              >
                {currentQ.options.map((option, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-1" />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      <KaTeXRenderer 
                        content={formatRichText(option)}
                        className="text-sm"
                      />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
              Previous
            </Button>

            <Button onClick={handleNext} disabled={answers[currentQuestion] === undefined}>
              {currentQuestion === quiz.questions.length - 1 ? "Finish Quiz" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
