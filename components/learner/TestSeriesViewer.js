"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft,
  Play,
  Clock,
  FileQuestion,
  Users,
  Calendar,
  Trophy,
  Target,
  CheckCircle,
  Loader2,
  Timer,
  Star,
  Award,
  BookOpen,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Lock,
  Unlock
} from "lucide-react"
import TestTaking from "./TestTaking"

export default function TestSeriesViewer({ testSeries, onBack }) {
  const [selectedTest, setSelectedTest] = useState(null)
  const [testAttempts, setTestAttempts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { getAuthHeaders, user } = useAuth()

  useEffect(() => {
    if (testSeries?._id) {
      fetchTestAttempts()
    }
  }, [testSeries])

  const fetchTestAttempts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/test-attempts?testSeriesId=${testSeries._id}`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const attemptsMap = {}
        data.attempts?.forEach(attempt => {
          attemptsMap[attempt.testNumber] = attempt
        })
        setTestAttempts(attemptsMap)
      }
    } catch (error) {
      console.error('Error fetching test attempts:', error)
      setError('Failed to load test progress')
    } finally {
      setLoading(false)
    }
  }

  const handleTestSelect = (test) => {
    setSelectedTest(test)
  }

  const handleTestComplete = (results) => {
    // Update test attempts with new results
    setTestAttempts(prev => ({
      ...prev,
      [results.testNumber]: results
    }))
    setSelectedTest(null)
  }

  const getTestStatus = (testNumber) => {
    const attempt = testAttempts[testNumber]
    if (!attempt) return { status: 'not-attempted', score: null, completedAt: null }
    
    return {
      status: attempt.completed ? 'completed' : 'in-progress',
      score: attempt.score,
      completedAt: attempt.completedAt
    }
  }

  const calculateOverallProgress = () => {
    const completedTests = Object.values(testAttempts).filter(attempt => attempt.completed).length
    return (completedTests / testSeries.totalTests) * 100
  }

  const calculateAverageScore = () => {
    const completedAttempts = Object.values(testAttempts).filter(attempt => attempt.completed && attempt.score !== null)
    if (completedAttempts.length === 0) return 0
    
    const totalScore = completedAttempts.reduce((sum, attempt) => sum + attempt.score, 0)
    return totalScore / completedAttempts.length
  }

  if (selectedTest) {
    return (
      <TestTaking
        test={selectedTest}
        testSeries={testSeries}
        onBack={() => setSelectedTest(null)}
        onComplete={handleTestComplete}
        existingAttempt={testAttempts[selectedTest.testNumber]}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-opacity-50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Test Series...</h3>
          <p className="text-slate-600">Please wait while we load your progress</p>
        </div>
      </div>
    )
  }

  const overallProgress = calculateOverallProgress()
  const averageScore = calculateAverageScore()
  const completedTests = Object.values(testAttempts).filter(attempt => attempt.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </div>

        {/* Test Series Overview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Series Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">{testSeries.title}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge className="bg-purple-100 text-purple-700">{testSeries.subject}</Badge>
                    <Badge variant="secondary">{testSeries.difficulty}</Badge>
                    <span className="text-slate-600 text-sm">
                      Enrolled on {new Date(testSeries.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {testSeries.description && (
                <p className="text-slate-600 mb-6 leading-relaxed">{testSeries.description}</p>
              )}

              {/* Instructor Info */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <img
                  src={testSeries.instructorAvatar || "/placeholder-user.jpg"}
                  alt={testSeries.instructorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <p className="font-semibold text-slate-800">{testSeries.instructorName || 'Unknown Instructor'}</p>
                  <p className="text-slate-600 text-sm">Instructor</p>
                </div>
              </div>
            </div>

            {/* Right: Progress Stats */}
            <div className="lg:w-80">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{completedTests}</div>
                  <p className="text-blue-700 text-sm">Tests Completed</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 mb-1">{averageScore.toFixed(1)}%</div>
                  <p className="text-green-700 text-sm">Average Score</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                  <span className="text-sm text-slate-600">{overallProgress.toFixed(0)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Tests:</span>
                  <span className="font-medium">{testSeries.totalTests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Questions per Test:</span>
                  <span className="font-medium">{testSeries.questionsPerTest}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Time per Test:</span>
                  <span className="font-medium">{testSeries.timePerTest} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Marks per Question:</span>
                  <span className="font-medium">{testSeries.marksPerQuestion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tests List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testSeries.tests?.map((test, index) => {
            const testStatus = getTestStatus(test.testNumber)
            const isLocked = index > 0 && getTestStatus(index).status === 'not-attempted'

            return (
              <Card 
                key={test.testNumber}
                className={`group transition-all duration-300 hover:shadow-xl ${
                  testStatus.status === 'completed' 
                    ? 'border-green-200 bg-green-50/50' 
                    : testStatus.status === 'in-progress'
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-slate-200 hover:border-purple-300'
                } ${isLocked ? 'opacity-60' : 'hover:-translate-y-1 cursor-pointer'}`}
                onClick={() => !isLocked && handleTestSelect(test)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {isLocked ? (
                        <Lock className="h-5 w-5 text-slate-400" />
                      ) : testStatus.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : testStatus.status === 'in-progress' ? (
                        <Timer className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Play className="h-5 w-5 text-purple-500" />
                      )}
                      {test.title}
                    </CardTitle>
                    
                    {testStatus.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-700">
                        {testStatus.score}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileQuestion className="h-4 w-4" />
                      <span>{test.questions?.length || testSeries.questionsPerTest} Questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span>{test.timeLimit || testSeries.timePerTest} mins</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Target className="h-4 w-4" />
                      <span>{test.totalMarks} marks</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Star className="h-4 w-4" />
                      <span>-{testSeries.negativeMarking} negative</span>
                    </div>
                  </div>

                  {testStatus.completedAt && (
                    <div className="text-xs text-slate-500 border-t pt-3">
                      Completed on {new Date(testStatus.completedAt).toLocaleDateString()}
                    </div>
                  )}

                  {!isLocked && (
                    <Button 
                      className={`w-full ${
                        testStatus.status === 'completed'
                          ? 'bg-green-500 hover:bg-green-600'
                          : testStatus.status === 'in-progress'
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-purple-500 hover:bg-purple-600'
                      } text-white`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTestSelect(test)
                      }}
                    >
                      {testStatus.status === 'completed' ? (
                        <>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Results
                        </>
                      ) : testStatus.status === 'in-progress' ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume Test
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Test
                        </>
                      )}
                    </Button>
                  )}

                  {isLocked && (
                    <div className="text-center text-sm text-slate-500 py-2">
                      Complete previous tests to unlock
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Achievement Summary */}
        {completedTests > 0 && (
          <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center flex items-center justify-center gap-2">
              <Award className="h-6 w-6 text-yellow-500" />
              Your Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {overallProgress.toFixed(0)}%
                </div>
                <p className="text-slate-600">Course Progress</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {averageScore.toFixed(1)}%
                </div>
                <p className="text-slate-600">Average Score</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {completedTests}/{testSeries.totalTests}
                </div>
                <p className="text-slate-600">Tests Completed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 