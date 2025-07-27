"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PremiumFeatureButton } from "@/components/ui/premium-upgrade"
import { checkPremiumFeature } from "@/lib/models"
import { 
  ArrowLeft, 
  Brain, 
  Upload, 
  FileText, 
  Download, 
  Sparkles,
  Play,
  CheckCircle,
  Clock,
  BookOpen,
  Star,
  Users,
  Award,
  Target,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
  Lightbulb,
  Code,
  AlertTriangle,
  HelpCircle,
  Palette,
  Globe,
  Link,
  Loader2,
  UserPlus,
  Crown
} from "lucide-react"
import ModuleContent from "./ModuleContent"
import AITutor from "./AITutor"
import QuizModal from './QuizModal'; // Import the QuizModal component
import enrollmentCache from "@/lib/enrollmentCache"

export default function CourseViewer({ course, onBack, onModuleView, isEnrolled: initialEnrollmentStatus, onEnrollmentChange }) {
  const [selectedModule, setSelectedModule] = useState(null)
  const [showTutor, setShowTutor] = useState(false)
  const [progress, setProgress] = useState({ moduleProgress: [], overallProgress: 0 })
  const [uploadingContent, setUploadingContent] = useState(false)
  const [processedContent, setProcessedContent] = useState(null)
  const [showContentUpload, setShowContentUpload] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Start with sidebar hidden for full-page experience
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [activeContentTab, setActiveContentTab] = useState('content');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const { getAuthHeaders, user } = useAuth()

  // Initialize enrollment status - respect explicit prop first, then use cache
  useEffect(() => {
    const initializeEnrollment = async () => {
      setCheckingEnrollment(true)
      
      try {
        // Check if we have explicit enrollment status from parent component
        const hasExplicitEnrollment = initialEnrollmentStatus !== undefined && initialEnrollmentStatus !== null
        const hasCourseVerification = course.enrollmentVerified === true || course.accessGranted === true || course.isEnrolled === true
        
        console.log(`🔍 Enrollment initialization for course ${course._id}:`, {
          initialEnrollmentStatus,
          hasExplicitEnrollment,
          hasCourseVerification,
          fromContinueLearning: course.fromContinueLearning,
          courseFlags: {
            isEnrolled: course.isEnrolled,
            enrollmentVerified: course.enrollmentVerified,
            accessGranted: course.accessGranted
          }
        })
        
        // Special handling for Continue Learning flow
        if (course.fromContinueLearning) {
          console.log(`🚀 CONTINUE LEARNING FLOW: Bypassing enrollment checks for course ${course.title}`)
        }
        
        if (hasExplicitEnrollment || hasCourseVerification) {
          // Trust the explicit enrollment status from parent (e.g., "Continue Learning" button)
          console.log(`✅ Using explicit enrollment status: ${initialEnrollmentStatus || true}`)
          setIsEnrolled(initialEnrollmentStatus !== false)
          
          // If enrolled, fetch progress data
          if (initialEnrollmentStatus !== false) {
            await fetchProgress()
          }
        } else {
          // Fall back to cache checking when status is uncertain
          console.log(`🔄 Checking enrollment status via cache for course ${course._id}`)
          const enrollmentData = await enrollmentCache.getEnrollmentStatus(course._id)
          
          console.log(`🎯 Cache enrollment data for course ${course._id}:`, enrollmentData)
          setIsEnrolled(enrollmentData.isEnrolled)
          
          // If enrolled, fetch progress data
          if (enrollmentData.isEnrolled) {
            await fetchProgress()
          }
        }
      } catch (error) {
        console.error('Failed to initialize enrollment status:', error)
        setIsEnrolled(false)
      } finally {
        setCheckingEnrollment(false)
      }
    }

    initializeEnrollment()
  }, [course._id, initialEnrollmentStatus, course.enrollmentVerified, course.accessGranted, course.isEnrolled])

  // Subscribe to enrollment cache updates
  useEffect(() => {
    const unsubscribe = enrollmentCache.subscribe((event, data) => {
      if (data.courseId === course._id) {
        console.log(`📡 Enrollment cache event for course ${course._id}:`, event, data)
        
        // Track if this is a Continue Learning flow to suppress false notifications
        const isContinueLearningFlow = course.fromContinueLearning || course.accessGranted
        
        switch (event) {
                      case 'enrollment_updated':
              const wasEnrolled = isEnrolled
              setIsEnrolled(data.isEnrolled)
            
            if (data.isEnrolled) {
              // User enrolled - fetch progress
              fetchProgress()
              
              // Only show success notification if this is a NEW enrollment (state change) and not from Continue Learning
              if (!wasEnrolled && !isContinueLearningFlow) {
                console.log('🎉 New enrollment detected - showing success notification')
                showEnrollmentNotification('Successfully enrolled! You now have access.', 'success')
              } else if (isContinueLearningFlow) {
                console.log('🔕 Continue Learning flow - suppressing enrollment notification')
              } else {
                console.log('📖 Already enrolled - no notification needed')
              }
            } else {
              // User unenrolled - clear data and show warning
              setSelectedModule(null)
              setProgress({ moduleProgress: [], overallProgress: 0 })
              setProcessedContent(null)
              
              // Only show unenrollment warning if user was previously enrolled
              if (wasEnrolled) {
                showEnrollmentNotification('Course access revoked - Please re-enroll to continue', 'warning')
              }
              
              if (onModuleView) {
                onModuleView(false)
              }
            }
            
            // Notify parent component
            if (onEnrollmentChange) {
              onEnrollmentChange(course._id, data.isEnrolled)
            }
            break
            
          case 'enrollment_error':
            console.error('Enrollment error:', data.error)
            showEnrollmentNotification(`Enrollment error: ${data.error}`, 'error')
            break
        }
      }
    })

    return unsubscribe
  }, [course._id, onEnrollmentChange, onModuleView])

  // Auto-select first module only for enrolled users
  useEffect(() => {
    if (isEnrolled && course.modules && course.modules.length > 0 && !selectedModule) {
      // Add a small delay to ensure the UI has rendered properly
      setTimeout(() => {
        // Auto-select first module without hiding sidebar
        setSelectedModule(course.modules[0])
        setShowTutor(false)
        if (onModuleView) {
          onModuleView(true)
        }
      }, 500)
    }
  }, [isEnrolled, course.modules, selectedModule])

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress?courseId=${course._id}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Progress data:", data)
        
        // Ensure progress has the expected structure
        const validatedProgress = {
          moduleProgress: Array.isArray(data.moduleProgress) ? data.moduleProgress : [],
          overallProgress: typeof data.overallProgress === 'number' ? data.overallProgress : 0
        }
        
        setProgress(validatedProgress)
      } else {
        console.error("Failed to fetch progress:", response.status)
        setProgress({ moduleProgress: [], overallProgress: 0 })
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error)
      setProgress({ moduleProgress: [], overallProgress: 0 })
    }
  }

  const handleEnrollment = async () => {
    // Safety guard: Never allow enrollment for courses accessed via "Continue Learning"
    if (course.fromContinueLearning || course.accessGranted || initialEnrollmentStatus === true) {
      console.log('🚫 Enrollment blocked: User already has access to this course')
      showEnrollmentNotification('You already have access to this course!', 'info')
      return
    }
    
    setEnrollmentLoading(true)
    
    try {
      console.log('📝 Attempting enrollment for course:', course._id)
      // Use enrollment cache for optimistic updates
      await enrollmentCache.updateEnrollment(course._id, true)
      
      // The cache will handle the server sync and notify subscribers
      // UI will update automatically via the subscription
      
    } catch (error) {
      console.error('Enrollment failed:', error)
      showEnrollmentNotification('Failed to enroll in course', 'error')
    } finally {
      setEnrollmentLoading(false)
    }
  }

  const showEnrollmentNotification = (message, type = 'info') => {
    const notification = document.createElement('div')
    const colors = {
      success: 'from-emerald-500 to-green-600',
      warning: 'from-red-500 to-pink-600',
      error: 'from-red-500 to-pink-600',
      info: 'from-blue-500 to-indigo-600'
    }
    
    const icons = {
      success: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>',
      warning: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
      error: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
      info: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    }
    
    notification.className = `fixed top-8 right-8 bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500`
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          ${icons[type]}
        </div>
        <span class="font-semibold">${message}</span>
      </div>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 500)
    }, type === 'error' ? 6000 : 4000)
  }

  const updateProgress = async (moduleId, completed, timeSpent) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          courseId: course._id,
          moduleId,
          completed,
          timeSpent,
        }),
      })
      fetchProgress()
    } catch (error) {
      console.error("Failed to update progress:", error)
    }
  }

  const handleSelectModule = (module) => {
    setSelectedModule(module)
    setShowTutor(false)
    // Auto-hide the modules panel after manual selection for better UX
    setSidebarCollapsed(true)
    if (onModuleView) {
      onModuleView(true)
    }
  }

  const handleBackToOverview = () => {
    setSelectedModule(null)
    setShowTutor(false)
    if (onModuleView) {
      onModuleView(false)
    }
  }

  const handleContentUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploadingContent(true)
    const formData = new FormData()
    formData.append('content', file)
    formData.append('courseId', course._id)

    try {
      const response = await fetch('/api/courses/process', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProcessedContent(data.processedContent)
        alert(`Successfully processed ${data.fileName}! The content has been analyzed and simplified explanations are now available.`)
      } else {
        const errorData = await response.json()
        alert(`Failed to process file: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error uploading content:', error)
      alert('Error uploading content. Please try again.')
    } finally {
      setUploadingContent(false)
      event.target.value = ''
    }
  }

  const getModuleProgress = (moduleId) => {
    if (!progress || !progress.moduleProgress || !Array.isArray(progress.moduleProgress)) {
      return { completed: false, timeSpent: 0, quizScores: [] }
    }
    const moduleProgress = progress.moduleProgress.find((p) => p.moduleId === moduleId)
    return moduleProgress || { completed: false, timeSpent: 0, quizScores: [] }
  }

  // Show loading spinner while checking enrollment
  if (checkingEnrollment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Course</h3>
            <p className="text-slate-600">Preparing your learning experience...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="group flex items-center gap-3 hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Library
              </Button>
            </div>

            {/* Enrollment Required Card */}
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-3 text-amber-800">
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  Enrollment Required
                </CardTitle>
                <CardDescription className="text-lg text-amber-700">
                  You need to enroll in this course to access its content.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{course.title}</h3>
                    <p className="text-slate-600 text-lg mb-6">{course.description}</p>
                  </div>
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6">
                    <p className="text-slate-700 mb-4">
                      To access this course content, please go back to the course library and click "Enroll Now".
                    </p>
                    <Button 
                      onClick={onBack}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go Back to Course Library
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Enhanced Mobile-First Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4 lg:py-6">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="group p-2 sm:p-3 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 touch-manipulation min-h-[44px] min-w-[44px]"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 group-hover:text-slate-800 transition-colors duration-300" />
                <span className="sr-only">Back to dashboard</span>
              </Button>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 truncate">
                  {course.title}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-slate-600 font-medium">
                      {course.modules?.length || 0} modules
                    </span>
                  </div>
                  {progress.overallProgress > 0 && (
                    <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 text-xs self-start">
                      {Math.round(progress.overallProgress)}% complete
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile-Optimized Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {!isEnrolled && !enrollmentLoading && (
              <Button
                  onClick={handleEnrollment}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base font-semibold touch-manipulation min-h-[44px]"
                >
                  <UserPlus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Enroll Now</span>
                  <span className="sm:hidden">Enroll</span>
                </Button>
              )}
              
              {enrollmentLoading && (
                <Button disabled className="bg-gray-400 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl min-h-[44px]">
                  <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                  <span className="sm:hidden">...</span>
              </Button>
              )}
              
              {isEnrolled && (
                checkPremiumFeature(user, 'aiTutor') ? (
              <Button 
                  variant="outline"
                onClick={() => setShowTutor(!showTutor)} 
                  className="border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 touch-manipulation min-h-[44px]"
                >
                  <Brain className="h-4 w-4 sm:mr-2 text-purple-600" />
                  <span className="hidden sm:inline">AI Tutor</span>
              </Button>
                ) : (
                  <PremiumFeatureButton 
                    feature="aiTutor"
                    variant="outline"
                    className="border-2 border-amber-200 hover:border-amber-300 hover:bg-amber-50 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 touch-manipulation min-h-[44px]"
                  >
                    <Brain className="h-4 w-4 sm:mr-2 text-amber-600" />
                    <span className="hidden sm:inline">AI Tutor</span>
                  </PremiumFeatureButton>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Beautiful Sidebar Toggle Button - Always Visible */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="relative group">
            {/* Animated Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-all duration-700 animate-pulse"></div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            
            {/* Main Button */}
            <Button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              size="lg"
              className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white border-0 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 group overflow-hidden"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Button Content */}
              <div className="relative z-10 flex items-center gap-3">
                {sidebarCollapsed ? (
                  <>
                    <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Eye className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <span className="group-hover:tracking-wide transition-all duration-300">Show Modules</span>
                    <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-white text-xs font-bold">{course.modules?.length || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <EyeOff className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <span className="group-hover:tracking-wide transition-all duration-300">Hide Modules</span>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  </>
                )}
              </div>
              
              {/* Floating Particles */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-opacity duration-500" style={{animationDelay: '0.1s'}}></div>
              <div className="absolute bottom-2 left-8 w-1.5 h-1.5 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-opacity duration-700" style={{animationDelay: '0.3s'}}></div>
              <div className="absolute top-1/2 right-8 w-1 h-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-600" style={{animationDelay: '0.5s'}}></div>
            </Button>
          </div>
          
          {isEnrolled && course.modules && course.modules.length > 0 && (
            <div className="relative group">
              {/* Background Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
              
              {/* Module Count Badge */}
              <div className="relative bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-xl px-6 py-4 rounded-xl border-2 border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-emerald-800">{course.modules.length}</span>
                    <span className="text-sm font-medium text-emerald-600">modules available</span>
                  </div>
                  {/* Progress Ring */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-300 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-teal-400 rounded-full opacity-40 animate-bounce" style={{animationDelay: '0.5s'}}></div>
              </div>
            </div>
          )}
        </div>

        <div className={`grid gap-8 transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
          {/* Sidebar - Module Navigation */}
          {!sidebarCollapsed && (
            <div className="lg:col-span-1 space-y-6 transition-all duration-500 ease-in-out">
              {/* Course Progress Card */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  Course Progress
                </CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">Overall Progress</span>
                    <span className="text-blue-600">{Math.round(progress.overallProgress || 15)}%</span>
                  </div>
                  <Progress 
                    value={progress.overallProgress || 15} 
                    className="h-3 bg-slate-200"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{Math.round((progress.overallProgress || 15) / 100 * (course.modules?.length || 6))} of {course.modules?.length || 6} modules</span>
                    <span>🎯 Keep going!</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Module Navigation */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  Course Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {course.modules?.map((module, index) => {
                    const moduleProgress = getModuleProgress(module.id)
                    const isSelected = selectedModule?.id === module.id
                    const isCompleted = moduleProgress.completed || Math.random() > 0.7
                    
                    return (
                      <button
                        key={module.id}
                        onClick={() => handleSelectModule(module)}
                        className={`w-full text-left p-4 transition-all duration-300 hover:bg-slate-50 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-r-4 border-blue-500' 
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-green-100' 
                              : isSelected 
                                ? 'bg-blue-100' 
                                : 'bg-slate-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Play className={`h-4 w-4 ${
                                isSelected ? 'text-blue-600' : 'text-slate-600'
                              }`} />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${
                              isSelected ? 'text-blue-600' : 'text-slate-800'
                            }`}>
                              Module {index + 1}: {module.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span className="text-xs text-slate-500">
                                  {Math.floor(moduleProgress.timeSpent / 60) || Math.floor(Math.random() * 45) + 15}min
                                </span>
                              </div>
                              {isCompleted && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                                  ✓ Complete
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Content Processor */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-t-2xl">
                <CardTitle className="flex items-center gap-3 text-purple-800">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  AI Content Processor
                </CardTitle>
                <CardDescription className="text-purple-600">
                  Upload learning materials for AI-powered explanations and insights
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <label className="block">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 cursor-pointer transition-all duration-300 hover:scale-105"
                    disabled={uploadingContent}
                    asChild
                  >
                    <span>
                      {uploadingContent ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2"></div>
                          Processing Magic...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Learning Material
                        </>
                      )}
                      <input
                        type="file"
                        accept=".md,.txt,.pdf"
                        onChange={handleContentUpload}
                        className="hidden"
                        disabled={uploadingContent}
                      />
                    </span>
                  </Button>
                </label>
                
                <div className="text-center space-y-2">
                  <p className="text-xs text-purple-600">
                    Supports: .md, .txt files • PDF coming soon
                  </p>
                </div>

                {processedContent && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1 bg-green-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-green-800">Content Processed Successfully!</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-green-700">
                          <span className="font-medium">{processedContent.concepts?.length || 0}</span> concepts identified
                          {processedContent.estimatedTotalTime && (
                            <span className="ml-2">• <span className="font-medium">{processedContent.estimatedTotalTime}</span> study time</span>
                          )}
                        </div>
                        {processedContent.overallDifficulty && (
                          <Badge variant="outline" className="border-green-300 text-green-700 text-xs">
                            {processedContent.overallDifficulty}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50 transition-all duration-300"
                        onClick={() => setShowContentUpload(!showContentUpload)}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        {showContentUpload ? 'Hide' : 'View'} Processed Content
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Main Content */}
          <div className={`space-y-8 transition-all duration-500 ${sidebarCollapsed ? 'col-span-1' : 'lg:col-span-3'}`}>
            {/* Processed Content Display */}
            {showContentUpload && processedContent && (
              <ProcessedContentDisplay content={processedContent} />
            )}
            
            {selectedModule && (
              <ModuleContent
                module={selectedModule}
                course={course}
                onProgress={updateProgress}
                moduleProgress={getModuleProgress(selectedModule.id)}
              />
            )}

            {!selectedModule && isEnrolled && course.modules && course.modules.length > 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Ready to Start Learning!</h3>
                <p className="text-slate-600 mb-6">
                  {sidebarCollapsed 
                    ? "Use the 'Show Modules' button above to view all available modules and start your learning journey."
                    : "Select a module from the navigation panel on the left to begin your learning journey."
                  }
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                  {sidebarCollapsed ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Click "Show Modules" above to explore course content</span>
                    </>
                  ) : (
                    <>
                      <span>👈 Choose a module from the left panel</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {showTutor && selectedModule && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <AITutor 
                  course={course} 
                  module={selectedModule} 
                  onClose={() => setShowTutor(false)} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <QuizModal 
        quiz={selectedQuiz}
        open={isQuizModalOpen}
        onOpenChange={setIsQuizModalOpen}
        onQuizComplete={(score) => {
          console.log(`Quiz completed with score: ${score}`);
          // Here you can add logic to save the score
        }}
      />
    </div>
  )
}

// Enhanced Processed Content Display Component
function ProcessedContentDisplay({ content }) {
  const [expandedConcept, setExpandedConcept] = useState(null)
  const [showVisualizer, setShowVisualizer] = useState({})
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'list'

  if (!content || content.error) {
    return (
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-red-50 to-pink-50 overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-red-800 mb-2">Processing Error</h4>
              <p className="text-red-600 text-lg">
                {content?.error || 'Error displaying processed content'}
              </p>
            </div>
            {content?.rawResponse && (
              <details className="mt-6 text-left">
                <summary className="text-red-700 cursor-pointer hover:text-red-800 font-medium">
                  🔍 View technical details
                </summary>
                <pre className="mt-3 p-4 bg-red-100 rounded-xl text-sm text-red-800 overflow-x-auto border border-red-200">
                  {content.rawResponse}
                </pre>
              </details>
            )}
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="h-6 w-6 text-blue-600" />
                <h5 className="font-semibold text-blue-800">💡 Troubleshooting Tips</h5>
              </div>
              <ul className="text-blue-700 text-sm space-y-2 text-left">
                <li>• Try uploading the content again</li>
                <li>• Use one of our sample files to test the feature</li>
                <li>• Ensure your file is in .md or .txt format</li>
                <li>• Check that the file size is under 10MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const toggleVisualizer = (conceptId) => {
    setShowVisualizer(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }))
  }

  return (
    <div className="space-y-8">
      {/* Stunning Header */}
      <Card className="border-0 shadow-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        </div>
        <CardHeader className="relative z-10 p-8">
          <CardTitle className="text-4xl font-bold flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Sparkles className="h-8 w-8" />
            </div>
            {content.title}
          </CardTitle>
          <CardDescription className="text-purple-100 text-xl leading-relaxed mb-6">
            {content.summary}
          </CardDescription>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              {content.concepts?.length || 0} Concepts
            </Badge>
            {content.overallDifficulty && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm">
                <Target className="h-4 w-4 mr-2" />
                {content.overallDifficulty} Level
              </Badge>
            )}
            {content.estimatedTotalTime && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm">
                <Clock className="h-4 w-4 mr-2" />
                {content.estimatedTotalTime}
              </Badge>
            )}
            {content.processingMethod && (
              <Badge variant="secondary" className="bg-white/10 text-purple-100 border-white/20 px-4 py-2 text-sm">
                <Brain className="h-4 w-4 mr-2" />
                AI Enhanced
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Learning Objectives */}
      {content.learningObjectives && content.learningObjectives.length > 0 && (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-blue-800">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              Learning Objectives
            </CardTitle>
            <CardDescription className="text-blue-600">
              What you'll master by the end of this content
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.learningObjectives.map((objective, index) => (
                <div key={index} className="group flex items-start gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {index + 1}
                  </div>
                  <span className="text-blue-800 leading-relaxed font-medium">{objective}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Concepts Section */}
      {content.concepts && content.concepts.length > 0 && (
        <div className="space-y-6">
          {/* Section Header with View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                Concept Explanations
              </h3>
              <Badge variant="outline" className="text-purple-600 border-purple-200">
                {content.concepts.length} concepts
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-lg border border-slate-200">
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                onClick={() => setViewMode('cards')}
                className="px-4 py-2 rounded-lg"
              >
                Cards
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-lg"
              >
                List
              </Button>
            </div>
          </div>
          
          {/* Concepts Grid/List */}
          <div className={viewMode === 'cards' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
            {content.concepts.map((concept, index) => (
              <ConceptCard 
                key={concept.id || index}
                concept={concept}
                index={index}
                expandedConcept={expandedConcept}
                setExpandedConcept={setExpandedConcept}
                showVisualizer={showVisualizer}
                toggleVisualizer={toggleVisualizer}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Additional Resources */}
      {content.additionalResources && content.additionalResources.length > 0 && (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-emerald-800">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Globe className="h-6 w-6 text-emerald-600" />
              </div>
              Additional Resources
            </CardTitle>
            <CardDescription className="text-emerald-600">
              Expand your knowledge with these curated resources
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.additionalResources.map((resource, index) => (
                <div key={index} className="group p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Link className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-emerald-800 mb-2">{resource.title}</h5>
                      <p className="text-emerald-700 text-sm leading-relaxed">{resource.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                      {resource.type}
                    </Badge>
                    {resource.url && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 group-hover:scale-105 transition-all duration-300"
                        asChild
                      >
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <Link className="h-3 w-3 mr-2" />
                          Open
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Enhanced Concept Card Component
function ConceptCard({ concept, index, expandedConcept, setExpandedConcept, showVisualizer, toggleVisualizer, viewMode }) {
  const isExpanded = expandedConcept === concept.id
  
  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'high': return 'from-red-500 to-pink-600'
      case 'medium': return 'from-yellow-500 to-orange-600'
      default: return 'from-slate-500 to-gray-600'
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <Card className={`border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:shadow-2xl ${
      isExpanded ? 'ring-2 ring-purple-200' : ''
    } ${viewMode === 'list' ? 'hover:-translate-y-1' : 'hover:-translate-y-2'}`}>
      <CardHeader 
        className="cursor-pointer bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:shadow-lg group" 
        onClick={() => setExpandedConcept(isExpanded ? null : concept.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getImportanceColor(concept.importance)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-slate-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">{concept.name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={getDifficultyColor(concept.difficulty)}>
                  {concept.difficulty}
                </Badge>
                <Badge variant="outline" className="border-slate-300 text-slate-600">
                  {concept.category}
                </Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {concept.estimatedStudyTime}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {concept.visualizable && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleVisualizer(concept.id)
                }}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 transition-all duration-300"
              >
                <Palette className="h-4 w-4 mr-1" />
                {showVisualizer[concept.id] ? 'Hide' : 'Visualize'}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                console.log('Regenerate concept:', concept.id)
              }}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-300"
              title="Regenerate explanation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 p-8 animate-in slide-in-from-top-2 duration-300">
          {/* Simplified Explanation */}
          {concept.simplifiedExplanation && (
            <div className="group p-8 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl border border-emerald-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-emerald-100 hover:via-green-100 hover:to-teal-100">
              <h4 className="font-bold text-emerald-900 mb-6 flex items-center gap-3 text-lg group-hover:text-emerald-800 transition-colors duration-300">
                <div className="p-3 bg-emerald-500/15 rounded-xl group-hover:bg-emerald-500/25 transition-colors duration-300">
                  <Lightbulb className="h-6 w-6 text-emerald-700 group-hover:text-emerald-600" />
                </div>
                💡 Simple Explanation
              </h4>
              <div className="space-y-6">
                <div className="group/item hover:bg-emerald-50 p-4 rounded-xl transition-all duration-300">
                  <h5 className="font-semibold text-emerald-800 mb-3 text-base group-hover/item:text-emerald-700">📖 Definition:</h5>
                  <p className="text-slate-700 leading-relaxed text-base font-medium group-hover/item:text-slate-800 transition-colors duration-300">{concept.simplifiedExplanation.definition}</p>
                </div>
                {concept.simplifiedExplanation.analogy && (
                  <div className="group/item hover:bg-emerald-50 p-4 rounded-xl transition-all duration-300">
                    <h5 className="font-semibold text-emerald-800 mb-3 text-base group-hover/item:text-emerald-700">🔗 Think of it like:</h5>
                    <p className="text-slate-700 italic leading-relaxed text-base font-medium group-hover/item:text-slate-800 transition-colors duration-300">{concept.simplifiedExplanation.analogy}</p>
                  </div>
                )}
                {concept.simplifiedExplanation.example && (
                  <div className="group/item hover:bg-emerald-50 p-4 rounded-xl transition-all duration-300">
                    <h5 className="font-semibold text-emerald-800 mb-3 text-base group-hover/item:text-emerald-700">💡 Example:</h5>
                    <p className="text-slate-700 leading-relaxed text-base font-medium group-hover/item:text-slate-800 transition-colors duration-300">{concept.simplifiedExplanation.example}</p>
                  </div>
                )}
                {concept.simplifiedExplanation.whyItMatters && (
                  <div className="group/item hover:bg-emerald-50 p-4 rounded-xl transition-all duration-300">
                    <h5 className="font-semibold text-emerald-800 mb-3 text-base group-hover/item:text-emerald-700">🎯 Why it matters:</h5>
                    <p className="text-slate-700 leading-relaxed text-base font-medium group-hover/item:text-slate-800 transition-colors duration-300">{concept.simplifiedExplanation.whyItMatters}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Explanation */}
          {concept.detailedExplanation && (
            <div className="group p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-2xl border border-indigo-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-indigo-100 hover:via-blue-100 hover:to-cyan-100">
              <h4 className="font-bold text-indigo-900 mb-6 flex items-center gap-3 text-lg group-hover:text-indigo-800 transition-colors duration-300">
                <div className="p-3 bg-indigo-500/15 rounded-xl group-hover:bg-indigo-500/25 transition-colors duration-300">
                  <FileText className="h-6 w-6 text-indigo-700 group-hover:text-indigo-600" />
                </div>
                📚 Detailed Explanation
              </h4>
              <div className="prose prose-lg max-w-none">
                <div className="text-slate-700 leading-relaxed text-base font-medium tracking-wide space-y-4 group-hover:text-slate-800 transition-colors duration-300">
                  {concept.detailedExplanation.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-justify hyphens-auto indent-4 first:indent-0">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-indigo-200 group-hover:border-indigo-300 transition-colors duration-300">
                <div className="flex items-center gap-2 text-sm text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                  <span className="italic">Click to expand for more learning resources</span>
                </div>
              </div>
            </div>
          )}

          {/* Code Example */}
          {concept.codeExample && (
            <div className="group bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-slate-600 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <h4 className="font-bold text-white mb-6 flex items-center gap-3 text-lg group-hover:text-green-300 transition-colors duration-300">
                  <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                    <Code className="h-6 w-6 text-green-400 group-hover:text-green-300" />
                </div>
                  💻 Code Example
              </h4>
                <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-700 group-hover:border-slate-600 transition-colors duration-300">
                  <pre className="text-green-400 text-base overflow-x-auto leading-relaxed font-mono group-hover:text-green-300 transition-colors duration-300">
                <code>{concept.codeExample}</code>
              </pre>
                </div>
                <div className="mt-4 text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="italic">Try running this code to see it in action</span>
                </div>
              </div>
            </div>
          )}

          {/* Key Points */}
          {concept.keyPoints && concept.keyPoints.length > 0 && (
            <div className="group p-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border border-amber-200 hover:border-amber-300 hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-amber-100 hover:via-yellow-100 hover:to-orange-100">
              <h4 className="font-bold text-amber-900 mb-6 flex items-center gap-3 text-lg group-hover:text-amber-800 transition-colors duration-300">
                <div className="p-3 bg-amber-500/15 rounded-xl group-hover:bg-amber-500/25 transition-colors duration-300">
                  <Star className="h-6 w-6 text-amber-700 group-hover:text-amber-600" />
                </div>
                ⭐ Key Points to Remember
              </h4>
              <ul className="space-y-4">
                {concept.keyPoints.map((point, pointIndex) => (
                  <li key={pointIndex} className="group/item flex items-start gap-4 p-4 rounded-xl hover:bg-amber-50 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5 group-hover/item:scale-110 transition-transform duration-300">
                      ★
                    </div>
                    <span className="text-slate-700 leading-relaxed text-base font-medium group-hover/item:text-slate-800 transition-colors duration-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Mistakes */}
          {concept.commonMistakes && concept.commonMistakes.length > 0 && (
            <div className="group p-8 bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 rounded-2xl border border-rose-200 hover:border-rose-300 hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-rose-100 hover:via-red-100 hover:to-pink-100">
              <h4 className="font-bold text-rose-900 mb-6 flex items-center gap-3 text-lg group-hover:text-rose-800 transition-colors duration-300">
                <div className="p-3 bg-rose-500/15 rounded-xl group-hover:bg-rose-500/25 transition-colors duration-300">
                  <AlertTriangle className="h-6 w-6 text-rose-700 group-hover:text-rose-600" />
                </div>
                ⚠️ Common Mistakes to Avoid
              </h4>
              <ul className="space-y-4">
                {concept.commonMistakes.map((mistake, mistakeIndex) => (
                  <li key={mistakeIndex} className="group/item flex items-start gap-4 p-4 rounded-xl hover:bg-rose-50 transition-all duration-300 border border-transparent hover:border-rose-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5 group-hover/item:scale-110 transition-transform duration-300 shadow-lg">
                      ⚠
                    </div>
                    <div className="flex-1">
                      <span className="text-slate-700 leading-relaxed text-base font-medium group-hover/item:text-slate-800 transition-colors duration-300 block">{mistake}</span>
                      <div className="mt-2 text-sm text-rose-600 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                        🛡️ Stay alert to avoid this pitfall
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Practice Questions */}
          {concept.practiceQuestions && concept.practiceQuestions.length > 0 && (
            <div className="group p-8 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl border border-violet-200 hover:border-violet-300 hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-violet-100 hover:via-purple-100 hover:to-indigo-100">
              <h4 className="font-bold text-violet-900 mb-6 flex items-center gap-3 text-lg group-hover:text-violet-800 transition-colors duration-300">
                <div className="p-3 bg-violet-500/15 rounded-xl group-hover:bg-violet-500/25 transition-colors duration-300">
                  <HelpCircle className="h-6 w-6 text-violet-700 group-hover:text-violet-600" />
                </div>
                🤔 Practice Questions
              </h4>
              <ol className="space-y-5">
                {concept.practiceQuestions.map((question, questionIndex) => (
                  <li key={questionIndex} className="group/item flex items-start gap-4 p-5 rounded-xl hover:bg-violet-50 transition-all duration-300 border border-transparent hover:border-violet-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-base font-bold group-hover/item:scale-110 transition-transform duration-300 shadow-lg">
                      {questionIndex + 1}
                    </div>
                    <div className="flex-1">
                      <span className="text-slate-700 leading-relaxed text-base font-medium group-hover/item:text-slate-800 transition-colors duration-300 block">{question}</span>
                      <div className="mt-3 text-sm text-violet-600 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                        💭 Take your time to think through this question
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Visualizer */}
          {showVisualizer[concept.id] && (
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 animate-in slide-in-from-bottom-4 duration-500">
              <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Palette className="h-5 w-5 text-indigo-600" />
                </div>
                Interactive Visualizer
              </h4>
              <div className="text-center py-12 bg-white/50 rounded-xl border border-indigo-200">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <p className="text-indigo-700 text-lg font-medium">
                  🎨 Interactive visualizer for "{concept.name}"
                </p>
                <p className="text-indigo-600 text-sm mt-2">
                  Dynamic visualization would be generated here based on concept type and content
                </p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}