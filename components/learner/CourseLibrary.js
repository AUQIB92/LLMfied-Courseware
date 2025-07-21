"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import ExamGeniusCourseViewer from "./ExamGeniusCourseViewer"
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
  RotateCcw,
  BookMarked,
  Heart,
  Share2,
  Eye,
  Calendar,
  ArrowRight,
  Lightbulb,
  Globe,
  Code,
  Palette,
  Trophy
} from "lucide-react"
import enrollmentCache from "@/lib/enrollmentCache"

export default function CourseLibrary({ onCourseSelect, onEnrollmentChange }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [showCompetitiveOnly, setShowCompetitiveOnly] = useState(false)
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState({})
  const [enrollmentLoading, setEnrollmentLoading] = useState({})
  const [enrollmentAttempts, setEnrollmentAttempts] = useState(new Set()) // Track enrollment attempts
  const [instructors, setInstructors] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uiUpdateTrigger, setUiUpdateTrigger] = useState(0) // Force UI updates
  const [viewingExamGeniusCourse, setViewingExamGeniusCourse] = useState(null)
  const { getAuthHeaders, user } = useAuth()

  // Fetch all published courses and enrollment status on component mount
  useEffect(() => {
    fetchCourses()
    initializeEnrollments()
  }, [showCompetitiveOnly])

  // Fetch instructor details when courses change
  useEffect(() => {
    if (courses.length > 0) {
      fetchInstructorDetails()
    }
  }, [courses])

  // Subscribe to enrollment cache updates
  useEffect(() => {
    const unsubscribe = enrollmentCache.subscribe((event, data) => {
      console.log(`📡 CourseLibrary received enrollment event:`, event, data)
      
      switch (event) {
        case 'enrollment_updated':
          console.log(`🔄 Updating enrollment state for course ${data.courseId}:`, data.isEnrolled ? 'ENROLLED' : 'NOT ENROLLED')
          setEnrollments(prev => {
            const newState = {
            ...prev,
            [data.courseId]: data.isEnrolled ? data.enrollment : null
            }
            console.log(`📋 New enrollment state:`, newState)
            return newState
          })
          
          // Force UI update to reflect enrollment changes
          setUiUpdateTrigger(prev => prev + 1)
          
          // Notify parent component
          if (onEnrollmentChange) {
            onEnrollmentChange(data.courseId, data.isEnrolled)
          }
          break
          
        case 'enrollment_error':
          console.error(`❌ Enrollment error for course ${data.courseId}:`, data.error)
          
          // Clear loading state for the failed course
          setEnrollmentLoading(prev => ({
            ...prev,
            [data.courseId]: false
          }))
          
          // Clear enrollment attempt tracking
          setEnrollmentAttempts(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.courseId)
            return newSet
          })
          
          // Force UI re-render to update button states
          setUiUpdateTrigger(prev => prev + 1)
          
          // The enrollment cache already shows the error notification,
          // so we don't need to show another one here
          break
          
        case 'enrollments_synced':
          // Refresh enrollment data after bulk sync
          initializeEnrollments()
          break
      }
    })

    return unsubscribe
  }, [onEnrollmentChange])

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
      
      // Add isExamGenius parameter to include ExamGenius courses
      const url = showCompetitiveOnly 
        ? '/api/courses?status=published&isExamGenius=true'
        : '/api/courses?status=published'
        
      const response = await fetch(url, {
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

  const initializeEnrollments = async () => {
    try {
      console.log('🚀 Initializing enrollments using cache system (force refresh from DB)')
      
      // Force refresh from database to ensure we have the latest enrollment data
      const { enrollments: enrollmentMap } = await enrollmentCache.getAllEnrollments(true)
      
      // Convert Map to object for state
      const enrollmentObj = {}
      enrollmentMap.forEach((enrollment, courseId) => {
        enrollmentObj[courseId] = enrollment
      })
      
      console.log('✅ Enrollments initialized from database:', enrollmentObj)
      setEnrollments(enrollmentObj)
    } catch (error) {
      console.error('Failed to initialize enrollments:', error)
      setEnrollments({})
    }
  }

  const handleEnrollment = async (courseId) => {
    console.log('🎯 Starting enrollment for course:', courseId)
    
    // Prevent double-enrollment by checking current state first
    if (isEnrolled(courseId)) {
      console.log('🚨 Already enrolled in this course, no action needed')
      
      // Show notification that user is already enrolled
      const notification = document.createElement('div')
      notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <span class="font-semibold">Already enrolled in this course!</span>
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => notification.style.transform = 'translateX(0)', 100)
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)'
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 500)
      }, 3000)
      
      return
    }
    
    // Prevent multiple simultaneous enrollment attempts
    if (isEnrollmentInProgress(courseId)) {
      console.log('🔄 Enrollment already in progress for this course')
      return
    }
    
    // Mark enrollment attempt as started - this immediately prevents duplicate attempts
    setEnrollmentAttempts(prev => new Set([...prev, courseId]))
    setEnrollmentLoading(prev => ({ ...prev, [courseId]: true }))
    
    try {
      console.log('📡 Making enrollment API request...')
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()
      
      if (response.status === 409) {
        // Server detected duplicate enrollment
        console.log('🚨 Server prevented duplicate enrollment')
        
        // Show "already enrolled" notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <span class="font-semibold">Already enrolled in this course!</span>
          </div>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100)
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)'
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 500)
        }, 3000)
        
        // Force refresh enrollment state from server
        await enrollmentCache.getEnrollmentStatus(courseId, true)
        setUiUpdateTrigger(prev => prev + 1)
        
        return
      }

      if (response.ok) {
        console.log('✅ Enrollment successful:', data)
        
        // Update local state immediately
        setEnrollments(prev => ({
          ...prev,
          [courseId]: data.enrollment
        }))
        
        // Update cache
        await enrollmentCache.updateEnrollment(courseId, true, data.enrollment)
        
        // Force UI update
        setUiUpdateTrigger(prev => prev + 1)
        
        // Notify parent component of enrollment change
        if (onEnrollmentChange) {
          onEnrollmentChange(courseId, true)
        }
        
        // Show success notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <span class="font-semibold">Successfully enrolled!</span>
          </div>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100)
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)'
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 500)
        }, 2500)
        
      } else {
        console.error('❌ Enrollment failed:', data)
        
        // Show error notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <span class="font-semibold">Enrollment failed: ${data.error || 'Unknown error'}</span>
          </div>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100)
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)'
        setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 500)
        }, 4000)
      }
      
    } catch (error) {
      console.error('🔥 Enrollment error:', error)
      
      // Show network error notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <span class="font-semibold">Network error. Please try again.</span>
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => notification.style.transform = 'translateX(0)', 100)
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)'
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 500)
             }, 4000)
       
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [courseId]: false }))
      // Clear enrollment attempt tracking
      setEnrollmentAttempts(prev => {
        const newSet = new Set(prev)
        newSet.delete(courseId)
        return newSet
      })
    }
  }

  const handleUnenrollment = async (courseId) => {
    if (!confirm('Are you sure you want to unenroll from this course? You will lose access to all course materials.')) {
      return
    }

    console.log('🗑️ Starting unenrollment for course using cache system:', courseId)
    setEnrollmentLoading(prev => ({ ...prev, [courseId]: true }))
    
    try {
      // Use enrollment cache for optimistic updates
      await enrollmentCache.updateEnrollment(courseId, false)
      
      // The cache will handle the server sync and notify subscribers
      // UI will update automatically via the subscription
      
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
      console.log('🔄 Refreshing courses list after unenrollment')
      fetchCourses()
      
    } catch (error) {
      console.error('🔥 Unenrollment error:', error)
      alert('Failed to unenroll from course')
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const isEnrolled = (courseId) => {
    const enrolled = !!enrollments[courseId]
    return enrolled
  }

  const isLoading = (courseId) => {
    return !!enrollmentLoading[courseId]
  }

  const isEnrollmentInProgress = (courseId) => {
    return enrollmentAttempts.has(courseId) || isLoading(courseId)
  }

  // Enhanced filtering - separate ExamGenius courses from general courses
  const generalCourses = courses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel
    
    // When not in competitive mode, show only regular courses
    return matchesSearch && matchesCategory && matchesLevel && 
           !course.isExamGenius && !course.isCompetitiveExam
  })

  const examGeniusCourses = courses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // When in competitive mode, show only ExamGenius/competitive courses
    return matchesSearch && (course.isExamGenius || course.isCompetitiveExam)
  })

  const filteredCourses = showCompetitiveOnly ? examGeniusCourses : generalCourses

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

  // If viewing an ExamGenius course, render the special viewer
  if (viewingExamGeniusCourse) {
    return (
      <ExamGeniusCourseViewer
        course={viewingExamGeniusCourse}
        onBack={() => setViewingExamGeniusCourse(null)}
        onProgress={(progress) => {
          console.log('📊 ExamGenius course progress:', progress)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Simple Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 bg-white"
            />
          </div>

          {/* Simple Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Category Filters */}
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className={`capitalize ${
                  selectedCategory === category 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {category}
              </Button>
            ))}

            <div className="w-px h-6 bg-slate-300 self-center"></div>

            {/* Level Filters */}
            {levels.map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                onClick={() => setSelectedLevel(level)}
                size="sm"
                className={`capitalize ${
                  selectedLevel === level 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {level}
              </Button>
            ))}

            <div className="w-px h-6 bg-slate-300 self-center"></div>

            {/* Competitive Exam Filter */}
            <Button
              variant={showCompetitiveOnly ? "default" : "outline"}
              onClick={() => setShowCompetitiveOnly(!showCompetitiveOnly)}
              size="sm"
              className={`${
                showCompetitiveOnly
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Trophy className="h-3 w-3 mr-1" />
              Competitive Exams
            </Button>
          </div>
        </div>

        {/* ExamGenius Section */}
        {examGeniusCourses.length > 0 && (
          <div className="mb-12">
            {/* ExamGenius Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                    ExamGenius Courses
                  </h2>
                  <p className="text-gray-600">Competitive exam-focused courses with AI-powered learning</p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    AI-Enhanced
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                    <Brain className="h-3 w-3 mr-1" />
                    Exam-Focused
                  </Badge>
                </div>
              </div>
              
              {/* ExamGenius Info Banner */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-3 text-orange-800">
                  <Trophy className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">
                      Specialized courses designed for competitive exams with speed-solving techniques, shortcuts, and exam strategies
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Quiz per subsection
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Speed techniques
                      </span>
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        Memory tricks
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ExamGenius Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {examGeniusCourses.map((course, index) => {
                const courseData = getDefaultData(course)
                const LevelIcon = getLevelIcon(course.level)
                const instructorInfo = getInstructorInfo(course)
                
                return (
                  <Card 
                    key={`exam-genius-${course._id}-${uiUpdateTrigger}-${isEnrolled(course._id)}`} 
                    className="group border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 backdrop-blur-sm overflow-hidden transform hover:scale-[1.02]"
                  >
                    {/* ExamGenius Course Header with Special Gradient */}
                    <div className="relative h-56 bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 overflow-hidden">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      
                      {/* Course Image */}
                      <img 
                        src={courseData.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                      />
                      
                      {/* ExamGenius Badge */}
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-xl font-bold text-sm shadow-lg">
                        <Trophy className="h-4 w-4 inline mr-1" />
                        ExamGenius
                      </div>
                      
                      {/* Instructor Info */}
                      <div className="absolute top-4 right-4 flex items-center gap-2 p-3 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/30">
                        <div className="relative">
                          {instructorInfo.avatar ? (
                            <img 
                              src={instructorInfo.avatar} 
                              alt={instructorInfo.name}
                              className="w-8 h-8 rounded-full object-cover shadow-lg border-2 border-white/50"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50">
                              <span className="text-white text-xs font-bold">
                                {instructorInfo.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600 font-medium">{instructorInfo.name}</p>
                        </div>
                      </div>

                      {/* Course Info Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-gradient-to-r from-orange-600 to-red-700 text-white border-none">
                            <LevelIcon className="h-3 w-3 mr-1" />
                            {course.level || 'Intermediate'}
                          </Badge>
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                            {course.examType}
                          </Badge>
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                            {course.modules?.length || 0} modules
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-300 leading-tight line-clamp-2">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 line-clamp-3 text-base leading-relaxed">
                        {course.description || "Competitive exam focused course with speed-solving techniques"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* ExamGenius Specific Metrics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors duration-300">
                          <div className="flex items-center justify-center mb-2">
                            <Target className="h-5 w-5 text-orange-500" />
                          </div>
                          <p className="text-xs text-orange-600 font-medium mb-1">Exam Type</p>
                          <p className="text-sm font-bold text-slate-800">{course.examType || 'JEE'}</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors duration-300">
                          <div className="flex items-center justify-center mb-2">
                            <Brain className="h-5 w-5 text-red-500" />
                          </div>
                          <p className="text-xs text-red-600 font-medium mb-1">Subject</p>
                          <p className="text-sm font-bold text-slate-800">{course.subject || 'Mathematics'}</p>
                        </div>
                        <div className="text-center p-3 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors duration-300">
                          <div className="flex items-center justify-center mb-2">
                            <Star className="h-5 w-5 text-pink-500 fill-current" />
                          </div>
                          <p className="text-xs text-pink-600 font-medium mb-1">Rating</p>
                          <p className="text-sm font-bold text-slate-800">{course.rating || '4.8'}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200">
                            <Trophy className="h-3 w-3 mr-1" />
                            Competitive Exam Course
                          </Badge>
                          
                          {isEnrolled(course._id) && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enrolled
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {isEnrolled(course._id) ? (
                            <>
                              <Button 
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('📖 Opening enrolled ExamGenius course:', course.title)
                                  const instructorInfo = getInstructorInfo(course)
                                  setViewingExamGeniusCourse({
                                    ...course, 
                                    ...courseData,
                                    instructorName: instructorInfo.name,
                                    instructorAvatar: instructorInfo.avatar,
                                    isEnrolled: true,
                                    isExamGenius: true,
                                    enrolledAt: enrollments[course._id]?.enrolledAt || new Date().toISOString()
                                  })
                                }}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Continue Exam Prep
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUnenrollment(course._id)
                                }}
                                disabled={isEnrollmentInProgress(course._id)}
                              >
                                {isEnrollmentInProgress(course._id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Unenroll'
                                )}
                              </Button>
                            </>
                          ) : (
                            <Button 
                              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEnrollment(course._id)
                              }}
                              disabled={isEnrollmentInProgress(course._id)}
                            >
                              {isEnrollmentInProgress(course._id) ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enrolling...
                                </>
                              ) : (
                                <>
                                  <Trophy className="h-4 w-4 mr-2" />
                                  Start Exam Prep
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
          </div>
        )}

        {/* General Courses Section */}
        {!showCompetitiveOnly && generalCourses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">General Courses</h2>
              <Badge variant="outline" className="text-slate-600">
                {generalCourses.length} course{generalCourses.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {coursesArray.map((course, index) => {
            const courseData = getDefaultData(course)
            const LevelIcon = getLevelIcon(course.level)
            const instructorInfo = getInstructorInfo(course)
            
            return (
              <Card 
                key={`${course._id}-${uiUpdateTrigger}-${isEnrolled(course._id)}`} 
                className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/95 backdrop-blur-sm overflow-hidden transform hover:scale-[1.02]"
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
                      {course.isCompetitiveExam && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-none backdrop-blur-sm font-semibold">
                          <Trophy className="h-3 w-3 mr-1" />
                          Competitive Exam
                        </Badge>
                      )}
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
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(course.category || "General")}>
                          <BookOpen className="h-3 w-3 mr-1" />
                          {course.category || "General"}
                        </Badge>
                        {course.isCompetitiveExam && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-none font-semibold">
                            <Trophy className="h-3 w-3 mr-1" />
                            Competitive Exam
                          </Badge>
                        )}
                      </div>
                      
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
                              console.log('📖 Opening enrolled course from Continue Learning button:', course.title)
                              const instructorInfo = getInstructorInfo(course)
                              onCourseSelect({
                                ...course, 
                                ...courseData,
                                instructorName: instructorInfo.name,
                                instructorAvatar: instructorInfo.avatar,
                                isEnrolled: true,
                                enrolledAt: enrollments[course._id]?.enrolledAt || new Date().toISOString()
                              })
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
                            disabled={isEnrollmentInProgress(course._id)}
                          >
                            {isEnrollmentInProgress(course._id) ? (
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
                          disabled={isEnrollmentInProgress(course._id)}
                        >
                          {isEnrollmentInProgress(course._id) ? (
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
        {coursesArray.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              {showCompetitiveOnly ? (
                <Trophy className="h-10 w-10 text-amber-500" />
              ) : (
                <BookOpen className="h-10 w-10 text-amber-500" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {showCompetitiveOnly 
                ? "No Exam Genius courses found" 
                : "No courses found"}
            </h3>
            <p className="text-gray-600 mb-6">
              {showCompetitiveOnly
                ? "We couldn't find any Exam Genius courses matching your criteria. Try adjusting your search or check back later for new courses."
                : "We couldn't find any courses matching your criteria. Try adjusting your search or filters."}
            </p>
            <Button 
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedLevel("all")
                if (showCompetitiveOnly) {
                  // Force refresh ExamGenius courses
                  fetchCourses()
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
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