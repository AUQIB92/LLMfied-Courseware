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
  Loader2,
  Brain,
  GraduationCap,
  BarChart3,
  AlertTriangle,
  RotateCcw
} from "lucide-react"

export default function CourseLibrary({ onCourseSelect, onEnrollmentChange }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState({})
  const [enrollmentLoading, setEnrollmentLoading] = useState({})
  const [instructors, setInstructors] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getAuthHeaders } = useAuth()

  // Fetch all published courses and enrollment status on component mount
  useEffect(() => {
    fetchCourses()
    fetchEnrollmentStatus()
  }, [])

  // Fetch instructor details when courses change
  useEffect(() => {
    if (courses.length > 0) {
      fetchInstructorDetails()
    }
  }, [courses])

  const fetchInstructorDetails = async () => {
    const instructorIds = [...new Set(courses.map(course => course.educatorId).filter(Boolean))]
    
    if (instructorIds.length === 0) return
    
    console.log('Fetching instructor details for IDs:', instructorIds)
    
    const instructorPromises = instructorIds.map(async (educatorId) => {
      try {
        const response = await fetch(`/api/users/${educatorId}`)
        if (response.ok) {
          const data = await response.json()
          return { id: educatorId, data: data.user }
        } else {
          console.warn(`Failed to fetch instructor ${educatorId}`)
          return { id: educatorId, data: null }
        }
      } catch (error) {
        console.warn(`Error fetching instructor ${educatorId}:`, error)
        return { id: educatorId, data: null }
      }
    })

    try {
      const instructorResults = await Promise.all(instructorPromises)
      const instructorMap = {}
      
      instructorResults.forEach(({ id, data }) => {
        instructorMap[id] = data
      })
      
      setInstructors(instructorMap)
      console.log('Instructor data loaded:', instructorMap)
    } catch (error) {
      console.error('Error fetching instructor details:', error)
    }
  }

  const getInstructorInfo = (course) => {
    const instructorData = instructors[course.educatorId]
    
    if (instructorData) {
      return {
        name: instructorData.name || 'Unknown Instructor',
        avatar: instructorData.avatar || null,
        title: instructorData.title || '',
        organization: instructorData.organization || ''
      }
    }
    
    // Fallback to placeholder while loading or if instructor not found
    return {
      name: 'Loading...',
      avatar: null,
      title: '',
      organization: ''
    }
  }

  const fetchCourses = async () => {
    try {
      setError(null) // Clear previous errors
      console.log('Fetching courses from API...')
      
      const response = await fetch('/api/courses?status=published', {
        headers: getAuthHeaders(),
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setCourses(data)
          console.log(`Set ${data.length} courses`)
        } else if (data && Array.isArray(data.courses)) {
          setCourses(data.courses)
          console.log(`Set ${data.courses.length} courses from data.courses`)
        } else if (data && data.data && Array.isArray(data.data)) {
          setCourses(data.data)
          console.log(`Set ${data.data.length} courses from data.data`)
        } else {
          console.warn('Unexpected response format:', data)
          setCourses([])
          setError('Unexpected response format from API')
        }
      } else {
        const errorText = await response.text()
        const errorMessage = `API Error: ${response.status} - ${errorText}`
        console.error(errorMessage)
        setError(errorMessage)
        setCourses([])
      }
    } catch (error) {
      const errorMessage = `Network error: ${error.message}`
      console.error('Network error while fetching courses:', error)
      setError(errorMessage)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollmentStatus = async () => {
    console.log('🔍 Fetching enrollment status...')
    try {
      const response = await fetch('/api/enrollment', {
        headers: getAuthHeaders(),
      })
      
      console.log('📡 Enrollment API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Enrollment API response data:', data)
        
        const enrollmentMap = {}
        
        // Handle different response formats
        if (data && Array.isArray(data.enrollments)) {
          console.log('📋 Processing enrollments array:', data.enrollments.length, 'items')
          data.enrollments.forEach(enrollment => {
            enrollmentMap[enrollment.courseId] = enrollment
          })
        } else if (data && Array.isArray(data.courses)) {
          console.log('📚 Processing courses array:', data.courses.length, 'items')
          // Handle case where courses are returned directly
          data.courses.forEach(course => {
            enrollmentMap[course._id || course.id] = { courseId: course._id || course.id }
          })
        } else if (Array.isArray(data)) {
          console.log('📄 Processing direct array:', data.length, 'items')
          // Handle case where enrollments are returned as array
          data.forEach(enrollment => {
            enrollmentMap[enrollment.courseId] = enrollment
          })
        }
        
        console.log('✅ Final enrollment map:', enrollmentMap)
        console.log('📈 Number of enrollments:', Object.keys(enrollmentMap).length)
        setEnrollments(enrollmentMap)
      } else {
        console.warn(`❌ Failed to fetch enrollment status. Status: ${response.status}`)
        setEnrollments({})
      }
    } catch (error) {
      console.warn('🔥 Error fetching enrollment status:', error)
      setEnrollments({})
    }
  }

  const handleEnrollment = async (courseId) => {
    console.log('🎯 Starting enrollment for course:', courseId)
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

      console.log('📡 Enrollment POST response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Enrollment successful:', data)
        
        // Update local enrollment state immediately
        setEnrollments(prev => {
          const newState = {
            ...prev,
            [courseId]: data.enrollment
          }
          console.log('🔄 Updated local enrollment state:', newState)
          return newState
        })
        
        // Call parent's onEnrollmentChange for state sync
        if (onEnrollmentChange) {
          console.log('📢 Notifying parent of enrollment change')
          onEnrollmentChange(courseId, true)
        } else {
          console.warn('⚠️ onEnrollmentChange callback not provided')
        }
        
        // Find the enrolled course data
        const enrolledCourse = courses.find(course => course._id === courseId)
        
        if (enrolledCourse && onCourseSelect) {
          console.log('🚀 Navigating to enrolled course:', enrolledCourse.title)
          // Show enrollment success notification
          const successNotification = document.createElement('div')
          successNotification.className = 'fixed top-8 right-8 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500'
          successNotification.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <span class="font-semibold">Successfully enrolled! Opening course...</span>
            </div>
          `
          document.body.appendChild(successNotification)
          
          setTimeout(() => {
            successNotification.style.transform = 'translateX(0)'
          }, 100)
          
          // Auto-dismiss notification
          setTimeout(() => {
            successNotification.style.transform = 'translateX(100%)'
            setTimeout(() => {
              if (document.body.contains(successNotification)) {
                document.body.removeChild(successNotification)
              }
            }, 500)
          }, 2500)
          
          // Navigate to course content after showing success message
          setTimeout(() => {
            // Get instructor info for the course
            const instructorInfo = getInstructorInfo(enrolledCourse)
            
            // Pass the course with enrollment status and instructor info
            onCourseSelect({
              ...enrolledCourse,
              instructorName: instructorInfo.name,
              instructorAvatar: instructorInfo.avatar,
              isEnrolled: true, // Explicitly set enrollment status
              enrolledAt: new Date().toISOString()
            })
          }, 1000)
        } else {
          console.log('📝 Showing standalone success message')
          // If no course selection handler, show success message
          const successNotification = document.createElement('div')
          successNotification.className = 'fixed top-8 right-8 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500'
          successNotification.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <span class="font-semibold">Successfully enrolled in course!</span>
            </div>
          `
          document.body.appendChild(successNotification)
          
          setTimeout(() => {
            successNotification.style.transform = 'translateX(0)'
          }, 100)
          
          setTimeout(() => {
            successNotification.style.transform = 'translateX(100%)'
            setTimeout(() => {
              if (document.body.contains(successNotification)) {
                document.body.removeChild(successNotification)
              }
            }, 500)
          }, 3000)
        }
        
        // Refresh courses to get updated enrollment count
        console.log('🔄 Refreshing courses list')
        fetchCourses()
      } else {
        const error = await response.json()
        console.error('❌ Enrollment failed:', error)
        alert(`Failed to enroll: ${error.error}`)
      }
    } catch (error) {
      console.error('🔥 Enrollment error:', error)
      alert('Failed to enroll in course')
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const handleUnenrollment = async (courseId) => {
    if (!confirm('Are you sure you want to unenroll from this course? You will lose access to all course materials.')) {
      return
    }

    console.log('🗑️ Starting unenrollment for course:', courseId)
    setEnrollmentLoading(prev => ({ ...prev, [courseId]: true }))
    
    try {
      const response = await fetch('/api/enrollment', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      console.log('📡 Unenrollment DELETE response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Unenrollment successful:', data)
        
        // Update local enrollment state immediately
        setEnrollments(prev => {
          const newEnrollments = { ...prev }
          delete newEnrollments[courseId]
          console.log('🔄 Updated local enrollment state after unenrollment:', newEnrollments)
          return newEnrollments
        })
        
        // Call parent's onEnrollmentChange for state sync
        if (onEnrollmentChange) {
          console.log('📢 Notifying parent of unenrollment change')
          onEnrollmentChange(courseId, false)
        } else {
          console.warn('⚠️ onEnrollmentChange callback not provided')
        }
        
        // Show unenrollment notification
        const warningNotification = document.createElement('div')
        warningNotification.className = 'fixed top-8 right-8 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500'
        warningNotification.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <span class="font-semibold">Successfully unenrolled from course</span>
          </div>
        `
        document.body.appendChild(warningNotification)
        
        setTimeout(() => {
          warningNotification.style.transform = 'translateX(0)'
        }, 100)
        
        setTimeout(() => {
          warningNotification.style.transform = 'translateX(100%)'
          setTimeout(() => {
            if (document.body.contains(warningNotification)) {
              document.body.removeChild(warningNotification)
            }
          }, 500)
        }, 3000)
        
        // Refresh courses to get updated enrollment count
        console.log('🔄 Refreshing courses list')
        fetchCourses()
      } else {
        const error = await response.json()
        console.error('❌ Unenrollment failed:', error)
        alert(`Failed to unenroll: ${error.error}`)
      }
    } catch (error) {
      console.error('🔥 Unenrollment error:', error)
      alert('Failed to unenroll from course')
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const isEnrolled = (courseId) => {
    const enrolled = !!enrollments[courseId]
    if (courseId === Object.keys(enrollments)[0]) { // Only log for the first course to avoid spam
      console.log(`🔍 Checking enrollment for course ${courseId}:`, enrolled, 'Enrollments:', enrollments)
    }
    return enrolled
  }

  const isLoading = (courseId) => {
    return !!enrollmentLoading[courseId]
  }

  // Enhanced filtering
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Provide default values for missing course data
  const getDefaultData = (course) => {
    return {
      duration: course.estimatedDuration || 10,
      students: course.enrollmentCount || 0,
      rating: course.rating || 0,
      instructor: course.instructor || "Course Instructor",
      thumbnail: course.thumbnail || "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400"
    }
  }

  // Use only real courses from the API
  const coursesArray = filteredCourses

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Mobile-First Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Course Library
                </h1>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">Discover amazing courses to advance your skills</p>
              </div>
              
              {/* Mobile-Optimized Stats */}
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{courses.length} courses</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{Object.keys(enrollments).length} enrolled</span>
                </div>
              </div>
            </div>

            {/* Mobile-First Search and Filters */}
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full rounded-xl border-2 border-slate-200 focus:border-blue-300 focus:ring-blue-100 text-base touch-manipulation min-h-[44px]"
                />
              </div>

              {/* Mobile-Optimized Filter Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Category Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-300 focus:ring-blue-100 text-base touch-manipulation min-h-[44px] bg-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="programming">Programming</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="business">Business</option>
                    <option value="data-science">Data Science</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Level Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Level</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-300 focus:ring-blue-100 text-base touch-manipulation min-h-[44px] bg-white"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Beautiful Header */}
        <div className="text-center space-y-6 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 blur-3xl"></div>
            <div className="relative">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent mb-4 animate-fade-in-up">
                Course Library
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up stagger-1">
                Discover world-class courses designed to accelerate your learning journey and unlock your potential
              </p>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex justify-center animate-fade-in-up stagger-2">
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
                    (courses.reduce((acc, course) => acc + (course.rating || 0), 0) / courses.length).toFixed(1) : 
                    '0.0'
                  }
                </div>
                <div className="text-sm text-slate-600">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden animate-fade-in-up stagger-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in-up stagger-4">
          {coursesArray.map((course, index) => {
            const courseData = getDefaultData(course)
            const LevelIcon = getLevelIcon(course.level)
            const instructorInfo = getInstructorInfo(course)
            
            return (
              <Card 
                key={course._id} 
                className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/95 backdrop-blur-sm overflow-hidden cursor-pointer transform hover:scale-[1.02]"
                onClick={() => onCourseSelect({...course, ...courseData})}
              >
                {/* Course Header with Gradient */}
                <div className="relative h-56 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  
                  {/* Course Image */}
                  <img 
                    src={courseData.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Instructor Info - Top Left Corner */}
                  <div className="absolute top-4 left-4 flex items-center gap-3 p-3 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/30 group-hover:bg-white transition-all duration-300">
                    <div className="relative">
                      {instructorInfo.avatar ? (
                        <img 
                          src={instructorInfo.avatar} 
                          alt={instructorInfo.name}
                          className="w-10 h-10 rounded-full object-cover shadow-lg border-2 border-white/50"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50">
                          <span className="text-white text-sm font-bold">
                            {instructorInfo.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Online Status Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-600 font-medium mb-0.5">Instructor</p>
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[120px]">
                        {instructorInfo.name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Floating Elements - Top Right */}
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
                        {course.modules?.length || 8} modules
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
                    {course.description || "Course description not available."}
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
                      <p className="text-sm font-bold text-slate-800">{courseData.duration}h</p>
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
                      <p className="text-sm font-bold text-slate-800">{course.rating || courseData.rating || 'N/A'}</p>
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
                              onCourseSelect({...course, ...courseData})
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

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-orange-400/20 to-yellow-400/20 blur-3xl"></div>
            </div>
            
            <h3 className="text-3xl font-bold text-slate-800 mb-4">Unable to Load Courses</h3>
            <p className="text-xl text-slate-600 mb-4 max-w-md mx-auto">
              We're having trouble connecting to our course database.
            </p>
            <p className="text-sm text-slate-500 mb-8 max-w-lg mx-auto font-mono bg-slate-100 p-3 rounded-lg">
              {error}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => {
                  setLoading(true)
                  fetchCourses()
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-slate-200 hover:bg-slate-50 px-8 py-3 rounded-2xl font-semibold"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        )}

        {/* Beautiful Empty State */}
        {coursesArray.length === 0 && !loading && !error && (
          <div className="text-center py-20 animate-fade-in-up stagger-5">
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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 relative mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-opacity-50"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Courses</h3>
            <p className="text-slate-600">Discovering learning opportunities for you...</p>
          </div>
        )}
      </div>
    </div>
  )
}