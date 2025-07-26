"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  BookOpen, 
  Clock, 
  Users, 
  Star,
  Play,
  Award,
  ChevronRight,
  Filter,
  TrendingUp,
  Target,
  Zap,
  UserPlus,
  CheckCircle,
  Loader2,
  Brain,
  GraduationCap,
  BarChart3,
  AlertTriangle,
  RotateCcw,
  BookMarked,
  Heart,
  Share2,
  Eye,
  Calendar,
  ArrowRight,
  Trophy,
  Timer,
  FileQuestion,
  Percent,
  ClipboardCheck
} from "lucide-react"

export default function TestSeriesLibrary({ onTestSeriesSelect, onEnrollmentChange }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [testSeries, setTestSeries] = useState([])
  const [enrollments, setEnrollments] = useState({})
  const [enrollmentLoading, setEnrollmentLoading] = useState({})
  const [instructors, setInstructors] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getAuthHeaders, user } = useAuth()

  // Fetch all published test series and enrollment status on component mount
  useEffect(() => {
    fetchTestSeries()
    initializeEnrollments()
  }, [])

  // Fetch instructor details when test series change
  useEffect(() => {
    if (testSeries.length > 0) {
      fetchInstructorDetails()
    }
  }, [testSeries])

  const fetchTestSeries = async () => {
    try {
      setError(null)
      console.log('Fetching test series from API...')
      
      const response = await fetch('/api/test-series?status=published', {
        headers: getAuthHeaders(),
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        
        if (Array.isArray(data.testSeries)) {
          setTestSeries(data.testSeries)
          console.log(`Set ${data.testSeries.length} test series`)
        } else {
          console.warn('Unexpected response format:', data)
          setTestSeries([])
          setError('Unexpected response format from API')
        }
      } else {
        const errorText = await response.text()
        const errorMessage = `API Error: ${response.status} - ${errorText}`
        console.error(errorMessage)
        setError(errorMessage)
        setTestSeries([])
      }
    } catch (error) {
      const errorMessage = `Network error: ${error.message}`
      console.error('Network error while fetching test series:', error)
      setError(errorMessage)
      setTestSeries([])
    } finally {
      setLoading(false)
    }
  }

  const initializeEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollment', {
        headers: getAuthHeaders(),
      })
      
      if (response.ok) {
        const data = await response.json()
        const enrollmentMap = {}
        
        if (Array.isArray(data.enrollments)) {
          data.enrollments.forEach(enrollment => {
            if (enrollment.testSeriesId) {
              enrollmentMap[enrollment.testSeriesId] = enrollment
            }
          })
        }
        
        setEnrollments(enrollmentMap)
        console.log('Initialized test series enrollments:', enrollmentMap)
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    }
  }

  const fetchInstructorDetails = async () => {
    try {
      const educatorIds = [...new Set(testSeries.map(series => series.educatorId).filter(Boolean))]
      const instructorPromises = educatorIds.map(id => 
        fetch(`/api/users/${id}`, { headers: getAuthHeaders() })
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      )
      
      const instructorResponses = await Promise.all(instructorPromises)
      const instructorMap = {}
      
      instructorResponses.forEach((response, index) => {
        if (response && response.user) {
          instructorMap[educatorIds[index]] = response.user
        }
      })
      
      setInstructors(instructorMap)
    } catch (error) {
      console.error('Error fetching instructor details:', error)
    }
  }

  const handleEnrollment = async (seriesId) => {
    if (enrollmentLoading[seriesId]) return
    
    setEnrollmentLoading(prev => ({ ...prev, [seriesId]: true }))
    
    try {
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testSeriesId: seriesId,
          type: 'test-series'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEnrollments(prev => ({
          ...prev,
          [seriesId]: data.enrollment
        }))
        
        if (onEnrollmentChange) {
          onEnrollmentChange()
        }
      } else {
        // Parse error response
        try {
          const errorData = await response.json()
          
          // Handle "already enrolled" as a special case
          if (response.status === 409 && errorData.error?.includes('Already enrolled')) {
            console.log('📝 User already enrolled in this test series - treating as success')
            // Mark as enrolled in local state (fetch the actual enrollment)
            const checkResponse = await fetch(`/api/enrollment?testSeriesId=${seriesId}`, {
              headers: getAuthHeaders()
            })
            if (checkResponse.ok) {
              const checkData = await checkResponse.json()
              if (checkData.enrollment) {
                setEnrollments(prev => ({
                  ...prev,
                  [seriesId]: checkData.enrollment
                }))
              }
            }
            return // Don't show as error
          }
          
          console.error('Enrollment failed:', errorData.error || 'Unknown error')
        } catch (parseError) {
          // If JSON parsing fails, fall back to text
          const errorText = await response.text()
          console.error('Enrollment failed:', errorText)
        }
      }
    } catch (error) {
      console.error('Error enrolling in test series:', error)
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [seriesId]: false }))
    }
  }

  const isEnrolled = (seriesId) => {
    return enrollments[seriesId] !== undefined
  }

  const getInstructorInfo = (series) => {
    const instructor = instructors[series.educatorId]
    return {
      name: instructor?.name || series.educatorName || "Unknown Instructor",
      avatar: instructor?.avatar || "/placeholder-user.jpg"
    }
  }

  // Filter and search logic
  const filteredTestSeries = testSeries.filter((series) => {
    const matchesSearch = searchTerm === "" || 
      series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSubject = selectedSubject === "all" || series.subject === selectedSubject
    const matchesDifficulty = selectedDifficulty === "all" || series.difficulty === selectedDifficulty
    
    return matchesSearch && matchesSubject && matchesDifficulty
  })

  // Get unique subjects and difficulties for filters
  const uniqueSubjects = [...new Set(testSeries.map(series => series.subject))].filter(Boolean)
  const uniqueDifficulties = [...new Set(testSeries.map(series => series.difficulty))].filter(Boolean)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-opacity-50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Test Series...</h3>
          <p className="text-slate-600">Please wait while we load available test series</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Test Series Library
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Challenge yourself with comprehensive test series designed to enhance your knowledge and exam preparation
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search test series by title, subject, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base bg-white/50 border-slate-200 focus:border-purple-300 focus:ring-purple-200 rounded-xl"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:border-purple-300 focus:ring-purple-200 text-slate-700"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:border-purple-300 focus:ring-purple-200 text-slate-700"
              >
                <option value="all">All Levels</option>
                {uniqueDifficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Error Loading Test Series</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <Button
              onClick={fetchTestSeries}
              variant="outline"
              className="mt-4 border-red-200 text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Test Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTestSeries.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileQuestion className="h-12 w-12 text-slate-500" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                {testSeries.length === 0 
                  ? "No Test Series Available" 
                  : "No Test Series Found"
                }
              </h3>
              <p className="text-slate-600 max-w-md mx-auto">
                {testSeries.length === 0
                  ? "Check back later for new test series, or adjust your search criteria."
                  : "Try adjusting your search terms or filters to find what you're looking for."
                }
              </p>
            </div>
          ) : (
            filteredTestSeries.map((series) => {
              const instructorInfo = getInstructorInfo(series)
              const enrolled = isEnrolled(series._id)
              const loading = enrollmentLoading[series._id]

              return (
                <Card 
                  key={series._id} 
                  className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2 cursor-pointer overflow-hidden"
                  onClick={() => {
                    if (enrolled && onTestSeriesSelect) {
                      onTestSeriesSelect({
                        ...series,
                        instructorName: instructorInfo.name,
                        instructorAvatar: instructorInfo.avatar,
                        isEnrolled: true,
                        enrolledAt: enrollments[series._id]?.enrolledAt || new Date().toISOString()
                      })
                    }
                  }}
                >
                  <div className="relative overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 relative">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-purple-700 hover:bg-white border-0">
                          {series.subject}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge 
                          variant="secondary" 
                          className={`border-0 text-white ${
                            series.difficulty === 'Beginner' ? 'bg-green-500' :
                            series.difficulty === 'Intermediate' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        >
                          {series.difficulty}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors line-clamp-2">
                          {series.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Description */}
                    {series.description && (
                      <p className="text-slate-600 mb-4 line-clamp-2 text-sm">
                        {series.description}
                      </p>
                    )}

                    {/* Test Series Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FileQuestion className="h-4 w-4 text-purple-500" />
                        <span>{series.totalTests} Tests</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ClipboardCheck className="h-4 w-4 text-green-500" />
                        <span>{series.questionsPerTest} Questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Timer className="h-4 w-4 text-blue-500" />
                        <span>{series.timePerTest} mins</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-pink-500" />
                        <span>{series.enrollments || 0} enrolled</span>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                      <img
                        src={instructorInfo.avatar}
                        alt={instructorInfo.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {instructorInfo.name}
                        </p>
                        <p className="text-xs text-slate-500">Instructor</p>
                      </div>
                    </div>

                                         {/* Action Button */}
                     <div className="flex gap-2">
                       {enrolled ? (
                         <Button 
                           className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                           onClick={(e) => {
                             e.stopPropagation()
                             console.log('📝 Continuing enrolled test series:', series.title)
                             if (onTestSeriesSelect) {
                               onTestSeriesSelect({
                                 ...series,
                                 instructorName: instructorInfo.name,
                                 instructorAvatar: instructorInfo.avatar,
                                 isEnrolled: true,
                                 enrolledAt: enrollments[series._id]?.enrolledAt || new Date().toISOString()
                               })
                             }
                           }}
                         >
                           <Play className="h-4 w-4 mr-2" />
                           Continue
                         </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEnrollment(series._id)
                          }}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Enroll Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Stats Summary */}
        {testSeries.length > 0 && (
          <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Library Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {testSeries.length}
                </div>
                <p className="text-slate-600">Total Test Series</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {uniqueSubjects.length}
                </div>
                <p className="text-slate-600">Subjects</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {testSeries.reduce((sum, s) => sum + (s.enrollments || 0), 0)}
                </div>
                <p className="text-slate-600">Total Enrollments</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">
                  {testSeries.reduce((sum, s) => sum + s.totalTests, 0)}
                </div>
                <p className="text-slate-600">Total Tests</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 