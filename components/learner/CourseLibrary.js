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
  Sparkles,
  Target,
  Zap,
  UserPlus,
  CheckCircle,
  Loader2
} from "lucide-react"

export default function CourseLibrary({ onCourseSelect, onDataChange }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState({})
  const [enrollmentLoading, setEnrollmentLoading] = useState({})
  const [loading, setLoading] = useState(true)
  const { getAuthHeaders } = useAuth()

  // Fetch all published courses and enrollment status on component mount
  useEffect(() => {
    fetchCourses()
    fetchEnrollmentStatus()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?status=published', {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setCourses(Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch courses')
        setCourses([])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollmentStatus = async () => {
    try {
      const response = await fetch('/api/enrollment', {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        const enrollmentMap = {}
        data.enrollments?.forEach(enrollment => {
          enrollmentMap[enrollment.courseId] = enrollment
        })
        setEnrollments(enrollmentMap)
      }
    } catch (error) {
      console.error('Failed to fetch enrollment status:', error)
    }
  }

  const handleEnrollment = async (courseId) => {
    setEnrollmentLoading(prev => ({ ...prev, [courseId]: true }))
    
    try {
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      if (response.ok) {
        const data = await response.json()
        setEnrollments(prev => ({
          ...prev,
          [courseId]: data.enrollment
        }))
        // Show success message
        alert('Successfully enrolled in course! You can now access all course content.')
        // Refresh courses to get updated enrollment count
        fetchCourses()
        // Notify parent component to refresh stats
        if (onDataChange) {
          onDataChange()
        }
      } else {
        const error = await response.json()
        alert(`Failed to enroll: ${error.error}`)
      }
    } catch (error) {
      console.error('Enrollment failed:', error)
      alert('Failed to enroll in course')
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const handleUnenrollment = async (courseId) => {
    setEnrollmentLoading(prev => ({ ...prev, [courseId]: true }))
    
    try {
      const response = await fetch(`/api/enrollment?courseId=${courseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        setEnrollments(prev => {
          const newEnrollments = { ...prev }
          delete newEnrollments[courseId]
          return newEnrollments
        })
        alert('Successfully unenrolled from course!')
        // Refresh courses to get updated enrollment count
        fetchCourses()
        // Notify parent component to refresh stats
        if (onDataChange) {
          onDataChange()
        }
      } else {
        const error = await response.json()
        alert(`Failed to unenroll: ${error.error}`)
      }
    } catch (error) {
      console.error('Unenrollment failed:', error)
      alert('Failed to unenroll from course')
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const isEnrolled = (courseId) => {
    return !!enrollments[courseId]
  }

  const isLoading = (courseId) => {
    return !!enrollmentLoading[courseId]
  }

  // Enhanced filtering
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel
    
    return matchesSearch && matchesCategory && matchesLevel
  })

  // Get unique categories and levels for filters
  const categories = ["all", ...new Set(courses.map(course => course.category).filter(Boolean))]
  const levels = ["all", "beginner", "intermediate", "advanced"]

  const getCategoryColor = (category) => {
    const colors = {
      "Programming": "bg-blue-100 text-blue-700 border-blue-200",
      "Design": "bg-purple-100 text-purple-700 border-purple-200",
      "Business": "bg-green-100 text-green-700 border-green-200",
      "Marketing": "bg-orange-100 text-orange-700 border-orange-200",
      "Data Science": "bg-indigo-100 text-indigo-700 border-indigo-200",
      "General": "bg-slate-100 text-slate-700 border-slate-200"
    }
    return colors[category] || colors["General"]
  }

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'intermediate': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'advanced': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return Target
      case 'intermediate': return TrendingUp
      case 'advanced': return Zap
      default: return Sparkles
    }
  }

  // Generate random but consistent data for demo
  const getRandomData = (courseId) => {
    const seed = courseId ? courseId.charCodeAt(0) : Math.random()
    return {
      duration: Math.floor(seed * 20 % 15) + 5,
      students: Math.floor(seed * 5000 % 4900) + 100,
      rating: (4.0 + (seed * 10 % 10) / 10).toFixed(1),
      instructor: ["Dr. Sarah Chen", "Prof. Michael Rodriguez", "Alex Thompson", "Dr. Emily Watson", "James Park"][Math.floor(seed * 5) % 5]
    }
  }

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Courses</h3>
            <p className="text-slate-600">Discovering amazing learning opportunities for you...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Beautiful Header */}
          <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 blur-3xl"></div>
          <div className="relative">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Course Library
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Discover world-class courses designed to accelerate your learning journey and unlock your potential
            </p>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-8 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl px-8 py-4 shadow-xl">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{courses.length}</div>
              <div className="text-sm text-slate-600">Published Courses</div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {courses.reduce((acc, course) => acc + (course.enrollmentCount || 0), 0)}
              </div>
              <div className="text-sm text-slate-600">Total Enrollments</div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {Object.keys(enrollments).length}
              </div>
              <div className="text-sm text-slate-600">Your Enrollments</div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {courses.length > 0 ? 
                  (courses.reduce((acc, course) => acc + (course.rating || 4.5), 0) / courses.length).toFixed(1) : 
                  '4.8'
                }
              </div>
              <div className="text-sm text-slate-600">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 p-8">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <Input
                placeholder="Search for courses, topics, or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 pr-6 h-16 text-lg rounded-2xl border-2 border-slate-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300 focus:shadow-xl"
              />
              <div className="absolute inset-y-0 right-0 pr-6 flex items-center">
                <kbd className="hidden sm:inline-flex items-center px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-500 bg-slate-50">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className={`capitalize px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                      selectedCategory === category 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                        : 'hover:bg-blue-50 border-blue-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {category}
                  </Button>
                ))}
              </div>

              <div className="w-px h-8 bg-slate-300"></div>

              {/* Level Filters */}
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    onClick={() => setSelectedLevel(level)}
                    className={`capitalize px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                      selectedLevel === level 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                        : 'hover:bg-emerald-50 border-emerald-200 text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Beautiful Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredCourses.map((course) => {
          const randomData = getRandomData(course._id)
          const LevelIcon = getLevelIcon(course.level)
          
          return (
            <Card 
              key={course._id} 
              className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/95 backdrop-blur-sm overflow-hidden cursor-pointer transform hover:scale-[1.02]"
              onClick={() => onCourseSelect(course)}
            >
              {/* Course Header with Gradient */}
              <div className="relative h-56 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Floating Elements */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Star className="h-4 w-4 text-yellow-300 fill-current" />
                  </div>
                </div>

                {/* Course Info Overlay */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`${getLevelColor(course.level || 'beginner')} backdrop-blur-sm`}>
                      <LevelIcon className="h-3 w-3 mr-1" />
                      {course.level || 'Beginner'}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      {course.modules?.length || Math.floor(Math.random() * 12) + 6} modules
                    </Badge>
                  </div>
                </div>

                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-white rounded-full animate-pulse delay-500"></div>
                </div>
              </div>

              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300 leading-tight line-clamp-2">
                  {course.title}
                </CardTitle>
                <CardDescription className="text-slate-600 line-clamp-3 text-base leading-relaxed">
                  {course.description || "Master essential skills with this comprehensive course designed to take your expertise to the next level through hands-on projects and real-world applications."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Course Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors duration-300">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-slate-500 group-hover:text-blue-500 transition-colors duration-300" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Duration</p>
                    <p className="text-sm font-bold text-slate-800">{randomData.duration}h</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl group-hover:bg-purple-50 transition-colors duration-300">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-slate-500 group-hover:text-purple-500 transition-colors duration-300" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Enrolled</p>
                    <p className="text-sm font-bold text-slate-800">{course.enrollmentCount || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors duration-300">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Rating</p>
                    <p className="text-sm font-bold text-slate-800">{course.rating || randomData.rating}</p>
                  </div>
                </div>

                {/* Instructor Info */}
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">
                      {randomData.instructor.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium">Instructor</p>
                    <p className="text-sm font-semibold text-slate-800">{randomData.instructor}</p>
                  </div>
                </div>

                {/* Category and Action */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(course.category || "General")}>
                      <BookOpen className="h-3 w-3 mr-1" />
                      {course.category || "General"}
                    </Badge>
                    
                    {/* Enrollment Status Badge */}
                    {isEnrolled(course._id) && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enrolled
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isEnrolled(course._id) ? (
                      <>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            onCourseSelect(course)
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnenrollment(course._id)
                          }}
                          disabled={isLoading(course._id)}
                        >
                          {isLoading(course._id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Unenroll'
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEnrollment(course._id)
                        }}
                        disabled={isLoading(course._id)}
                      >
                        {isLoading(course._id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Enroll Now
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Beautiful Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-20">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-purple-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <BookOpen className="h-16 w-16 text-slate-400" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-emerald-400/20 blur-3xl"></div>
          </div>
          
          <h3 className="text-3xl font-bold text-slate-800 mb-4">No courses found</h3>
          <p className="text-xl text-slate-600 mb-8 max-w-md mx-auto">
            We couldn't find any courses matching your criteria. Try adjusting your search or filters.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedLevel("all")
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
            <Button 
              variant="outline"
              className="border-2 border-slate-200 hover:bg-slate-50 px-8 py-3 rounded-2xl font-semibold"
            >
              Browse All Courses
            </Button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}