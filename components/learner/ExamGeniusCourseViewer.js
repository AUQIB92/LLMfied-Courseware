"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import MathMarkdownRenderer from "@/components/MathMarkdownRenderer"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Play,
  Trophy,
  Brain,
  Target,
  Clock,
  Star,
  Award,
  CheckCircle,
  Circle,
  FileText,
  Video,
  Globe,
  Wrench,
  GraduationCap,
  Lightbulb,
  ArrowRight,
  Zap,
  Timer,
  Medal,
  AlertCircle,
  AlertTriangle,
  Lock,
  Unlock,
  TrendingUp,
  BarChart3,
  Sparkles,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Crown,
  Settings
} from "lucide-react"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
}

// Math rendering is now handled by MathMarkdownRenderer component with enhanced LaTeX sanitization

export default function ExamGeniusCourseViewer({ course, onBack, onProgress }) {
  const { getAuthHeaders } = useAuth()
  const [currentModule, setCurrentModule] = useState(0)
  const [currentSubsection, setCurrentSubsection] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [completedModules, setCompletedModules] = useState(new Set())
  const [completedSubsections, setCompletedSubsections] = useState(new Set())
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedQuizDifficulty, setSelectedQuizDifficulty] = useState(null)
  const [quizData, setQuizData] = useState(null)
  const [quizResults, setQuizResults] = useState({})
  const [isQuizLoading, setIsQuizLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [sidebarManuallyToggled, setSidebarManuallyToggled] = useState(false)
  const [showModuleList, setShowModuleList] = useState(true)
  const [detailedContent, setDetailedContent] = useState(null)
  const [loadingDetailedContent, setLoadingDetailedContent] = useState(false)
  const [currentPageTabs, setCurrentPageTabs] = useState({})

  const modules = course.modules || []
  const currentModuleData = modules[currentModule];
  // The single source of truth for subsections is the detailedSubsections array
  const subsections = currentModuleData?.detailedSubsections || [];
  const currentSubsectionData = subsections[currentSubsection]
  const pages = currentSubsectionData?.pages || []

  useEffect(() => {
    console.log("🔍 DEBUG: useEffect triggered for course:", course._id, course.title)
    console.log("🔍 DEBUG: Course properties:", {
      isExamGenius: course.isExamGenius,
      status: course.status,
      modules: course.modules?.length || 0
    })
    
    // Debug: Log the actual subsections data
    if (course.modules && course.modules.length > 0) {
      console.log("🔍 DEBUG: First module detailed subsections:", {
        moduleTitle: course.modules[0]?.title,
        hasDetailedSubsections: !!course.modules[0]?.detailedSubsections,
        subsectionsCount: course.modules[0]?.detailedSubsections?.length || 0,
        firstSubsection: course.modules[0]?.detailedSubsections?.[0]
      })
      
      // Log pages for first subsection
      if (course.modules[0]?.detailedSubsections?.[0]?.pages) {
        console.log("🔍 DEBUG: First subsection pages:", {
          pagesCount: course.modules[0].detailedSubsections[0].pages.length,
          firstPageTitle: course.modules[0].detailedSubsections[0].pages[0]?.pageTitle,
          firstPageContent: course.modules[0].detailedSubsections[0].pages[0]?.content?.substring(0, 100) + "..."
        })
      }
    }
    
    // Initialize progress tracking
    const savedProgress = localStorage.getItem(`exam-progress-${course._id}`)
    if (savedProgress) {
      const progress = JSON.parse(savedProgress)
      setCompletedModules(new Set(progress.completedModules || []))
      setCompletedSubsections(new Set(progress.completedSubsections || []))
    }

    // Fetch detailed content for ExamGenius courses
    if (course.isExamGenius) {
      console.log("🔍 DEBUG: Fetching detailed content because course.isExamGenius is true")
      fetchDetailedContent()
    } else {
      console.log("🔍 DEBUG: NOT fetching detailed content because course.isExamGenius is", course.isExamGenius)
    }
  }, [course._id])

  const fetchDetailedContent = async () => {
    try {
      setLoadingDetailedContent(true)
      console.log("🔍 DEBUG: Course already has detailed subsections:", {
        courseId: course._id,
        isExamGenius: course.isExamGenius,
        modulesCount: course.modules?.length || 0,
        hasDetailedSubsections: course.modules?.some(m => m.detailedSubsections?.length > 0)
      })
      
      // Check if course already has detailed subsections in the modules
      const hasDetailedSubsections = course.modules?.some(module => 
        module.detailedSubsections && module.detailedSubsections.length > 0
      )
      
      if (hasDetailedSubsections) {
        console.log("📚 DEBUG: Using existing detailed subsections from course data")
        // The detailed content is already in the course.modules[].detailedSubsections
        // No need to fetch separately
        setDetailedContent("already-loaded")
        return
      }

      // If no detailed subsections exist, try to fetch from API
      console.log("🔍 DEBUG: Fetching detailed content from API for course:", course._id)
      
      const response = await fetch(`/api/courses/${course._id}`, {
        headers: getAuthHeaders(),
      })

      console.log("🔍 DEBUG: Response status:", response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log("📚 DEBUG: Updated course data:", {
          modulesCount: data.course?.modules?.length || 0,
          hasDetailedSubsections: data.course?.modules?.some(m => m.detailedSubsections?.length > 0)
        })
        
        // Update the course data if it has new detailed subsections
        if (data.course?.modules?.some(m => m.detailedSubsections?.length > 0)) {
          // Update the course object with new data
          Object.assign(course, data.course)
          setDetailedContent("refreshed")
        }
      } else {
        const errorText = await response.text()
        console.error("🔍 DEBUG: Failed to fetch course data:", response.status, response.statusText, errorText)
      }
    } catch (error) {
      console.error("🔍 DEBUG: Error fetching detailed content:", error)
    } finally {
      setLoadingDetailedContent(false)
    }
  }

  const saveProgress = () => {
    const progress = {
      completedModules: Array.from(completedModules),
      completedSubsections: Array.from(completedSubsections),
      currentModule,
      currentSubsection,
      currentPage,
      lastAccessed: new Date().toISOString()
    }
    localStorage.setItem(`exam-progress-${course._id}`, JSON.stringify(progress))
    onProgress?.(progress)
  }

  const handleQuizStart = async (difficulty, subsectionData, subsectionIndex) => {
    if (!subsectionData) {
      toast.error("No subsection data available")
      return
    }

    // Check if quiz exists for this subsection and difficulty
    const quizKey = `${subsectionIndex}_${difficulty.toLowerCase()}`
    const existingQuiz = currentModuleData?.subsectionQuizzes?.[quizKey]

    if (!existingQuiz) {
      toast.error(`No ${difficulty.toLowerCase()} quiz available for this subsection`)
      return
    }

    console.log('🎯 Loading existing quiz:', {
      quizKey,
      subsectionTitle: subsectionData.title,
      difficulty: difficulty.toLowerCase(),
      totalQuestions: existingQuiz.totalQuestions || existingQuiz.questions?.length || 0
    })

    try {
      // Use the existing quiz data
      setQuizData({
        questions: existingQuiz.questions || [],
        subsectionTitle: existingQuiz.subsectionTitle || subsectionData.title,
        difficulty: difficulty.toLowerCase(),
        totalQuestions: existingQuiz.totalQuestions || existingQuiz.questions?.length || 0,
        createdAt: existingQuiz.createdAt
      })
      setSelectedQuizDifficulty(difficulty)
      setShowQuiz(true)
      toast.success(`${difficulty} quiz loaded successfully!`)
    } catch (error) {
      console.error('Quiz loading error:', error)
      toast.error(`Failed to load ${difficulty.toLowerCase()} quiz`)
    }
  }

  const getQuizForSubsection = (moduleIndex, subsectionIndex, difficulty) => {
    const module = modules[moduleIndex]
    const quizKey = `${subsectionIndex}_${difficulty.toLowerCase()}`
    return module?.subsectionQuizzes?.[quizKey] || null
  }

  const hasQuizForSubsection = (moduleIndex, subsectionIndex, difficulty) => {
    return getQuizForSubsection(moduleIndex, subsectionIndex, difficulty) !== null
  }

  const handleQuizCompletion = (results) => {
    const quizKey = `${currentModule}-${currentSubsection}-${selectedQuizDifficulty}`
    setQuizResults(prev => ({
      ...prev,
      [quizKey]: results
    }))
    
    // Mark subsection as completed if quiz score is good
    if (results.score >= 60) {
      const subsectionKey = `${currentModule}-${currentSubsection}`
      setCompletedSubsections(prev => new Set([...prev, subsectionKey]))
    }
    
    setShowQuiz(false)
    setQuizData(null)
    saveProgress()
    
    toast.success(`Quiz completed! Score: ${results.score}%`)
  }

  const markModuleComplete = () => {
    setCompletedModules(prev => new Set([...prev, currentModule]))
    saveProgress()
    toast.success("Module marked as complete!")
  }

  const getOverallProgress = () => {
    const totalModules = modules.length
    const completedCount = completedModules.size
    return totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0
  }

  const getModuleProgress = (moduleIndex) => {
    const module = modules[moduleIndex]
    const subsections = module?.detailedSubsections || []
    const completedSubsectionCount = subsections.filter((_, subIndex) => 
      completedSubsections.has(`${moduleIndex}-${subIndex}`)
    ).length
    
    return subsections.length > 0 ? Math.round((completedSubsectionCount / subsections.length) * 100) : 0
  }

  const getQuizResultsForSubsection = (moduleIndex, subsectionIndex) => {
    const results = {}
    ;['Easy', 'Medium', 'Hard'].forEach(difficulty => {
      const key = `${moduleIndex}-${subsectionIndex}-${difficulty}`
      if (quizResults[key]) {
        results[difficulty] = quizResults[key]
      }
    })
    return results
  }

  const resourceCategories = {
    books: { icon: BookOpen, label: "Books", color: "blue" },
    courses: { icon: GraduationCap, label: "Courses", color: "green" },
    articles: { icon: FileText, label: "Articles", color: "purple" },
    videos: { icon: Video, label: "Videos", color: "red" },
    tools: { icon: Wrench, label: "Tools", color: "orange" },
    websites: { icon: Globe, label: "Websites", color: "cyan" },
    exercises: { icon: Target, label: "Exercises", color: "pink" }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  // Enhanced Resource Card Component (same as technical courses)
  const ResourceCard = ({ resource, type, isInstructorChoice = false, resourceIndex = 0 }) => {
    const getIcon = () => {
      const iconMap = {
        books: <BookOpen className="h-6 w-6 text-white" />,
        courses: <Video className="h-6 w-6 text-white" />,
        videos: <Play className="h-6 w-6 text-white" />,
        articles: <FileText className="h-6 w-6 text-white" />,
        tools: <Wrench className="h-6 w-6 text-white" />,
        websites: <Globe className="h-6 w-6 text-white" />,
        exercises: <Target className="h-6 w-6 text-white" />,
      }
      return iconMap[type] || <ExternalLink className="h-6 w-6 text-white" />
    }

    const getGradientAndColors = () => {
      const designMap = {
        books: {
          gradient: "from-blue-500/10 via-indigo-500/10 to-purple-500/10",
          border: "border-blue-200/50",
          iconBg: "from-blue-500 to-indigo-600",
          titleColor: "text-blue-700",
          accent: "blue"
        },
        courses: {
          gradient: "from-purple-500/10 via-pink-500/10 to-rose-500/10",
          border: "border-purple-200/50",
          iconBg: "from-purple-500 to-pink-600",
          titleColor: "text-purple-700",
          accent: "purple"
        },
        videos: {
          gradient: "from-red-500/10 via-orange-500/10 to-yellow-500/10",
          border: "border-red-200/50",
          iconBg: "from-red-500 to-orange-600",
          titleColor: "text-red-700",
          accent: "red"
        },
        articles: {
          gradient: "from-green-500/10 via-emerald-500/10 to-teal-500/10",
          border: "border-green-200/50",
          iconBg: "from-green-500 to-emerald-600",
          titleColor: "text-green-700",
          accent: "green"
        },
        tools: {
          gradient: "from-orange-500/10 via-amber-500/10 to-yellow-500/10",
          border: "border-orange-200/50",
          iconBg: "from-orange-500 to-amber-600",
          titleColor: "text-orange-700",
          accent: "orange"
        },
        websites: {
          gradient: "from-indigo-500/10 via-blue-500/10 to-cyan-500/10",
          border: "border-indigo-200/50",
          iconBg: "from-indigo-500 to-blue-600",
          titleColor: "text-indigo-700",
          accent: "indigo"
        },
        exercises: {
          gradient: "from-pink-500/10 via-rose-500/10 to-red-500/10",
          border: "border-pink-200/50",
          iconBg: "from-pink-500 to-rose-600",
          titleColor: "text-pink-700",
          accent: "pink"
        }
      }
      return designMap[type] || designMap.articles
    }

    const design = getGradientAndColors()

    return (
      <motion.div 
        variants={cardVariants} 
        whileHover="hover" 
        className="group h-full"
      >
        <Card className={`h-full bg-gradient-to-br ${design.gradient} backdrop-blur-sm border ${design.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden relative`}>
          {/* Subtle background animation for instructor choice */}
          {isInstructorChoice && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          )}
          
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-start gap-4">
              <motion.div
                className={`p-3 rounded-2xl bg-gradient-to-br ${design.iconBg} shadow-lg group-hover:shadow-xl transition-all duration-300`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {getIcon()}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className={`${design.titleColor} group-hover:${design.titleColor.replace('700', '800')} transition-colors duration-300 text-lg font-bold leading-tight mb-2`}>
                      {resource.title || resource.name}
                    </CardTitle>
                    {resource.creator && (
                      <p className="text-slate-600 text-sm font-medium">by {resource.creator}</p>
                    )}
                  </div>
                </div>
                
                {/* Special badges for different resource types */}
                {resource.isAIGenerated ? (
                  <motion.div
                    className="mt-2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-md">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Curated
                    </Badge>
                  </motion.div>
                ) : isInstructorChoice && (
                  <motion.div
                    className="mt-2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md">
                      <Crown className="h-3 w-3 mr-1" />
                      Instructor's Choice
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-4 relative z-10">
            {resource.description && (
              <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/40 group-hover:bg-white/80 transition-all duration-300">
                <div className="text-slate-700 text-sm leading-relaxed line-clamp-3">
                  <MathMarkdownRenderer content={resource.description} />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {resource.difficulty && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Difficulty:</span>
                  <Badge
                    className={`font-semibold ${
                      resource.difficulty === "Beginner"
                        ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300"
                        : resource.difficulty === "Intermediate"
                          ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-300"
                          : "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-300"
                    }`}
                  >
                    {resource.difficulty}
                  </Badge>
                </div>
              )}

              {resource.url && (
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  className="pt-2"
                >
                  <Button
                    className={`w-full bg-gradient-to-r ${design.iconBg} hover:from-${design.accent}-600 hover:to-${design.accent}-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/button`}
                    asChild
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4 group-hover/button:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Explore Resource</span>
                    </a>
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
          
          {/* Floating accent elements */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {resource.isAIGenerated && (
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          )}
          {isInstructorChoice && (
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          )}
        </Card>
      </motion.div>
    )
  }

  // Helper function to get detailed content for a specific subsection
  const getDetailedSubsectionContent = (moduleIndex, subsectionIndex) => {
    console.log(`🔍 DEBUG: Getting detailed content for module ${moduleIndex}, subsection ${subsectionIndex}:`, {
      hasDetailedContent: !!detailedContent,
      hasModule: !!detailedContent?.[moduleIndex],
      hasSubsection: !!detailedContent?.[moduleIndex]?.[subsectionIndex],
      availableModules: detailedContent ? Object.keys(detailedContent) : [],
      availableSubsections: detailedContent?.[moduleIndex] ? Object.keys(detailedContent[moduleIndex]) : []
    })
    
    if (!detailedContent || !detailedContent[moduleIndex] || !detailedContent[moduleIndex][subsectionIndex]) {
      return null
    }
    return detailedContent[moduleIndex][subsectionIndex]
  }

  // Helper functions for page tab navigation
  const getCurrentPageTab = (moduleIndex, subsectionIndex) => {
    const key = `${moduleIndex}-${subsectionIndex}`
    return currentPageTabs[key] || 0
  }

  const setCurrentPageTab = (moduleIndex, subsectionIndex, pageIndex) => {
    const key = `${moduleIndex}-${subsectionIndex}`
    setCurrentPageTabs(prev => ({
      ...prev,
      [key]: pageIndex
    }))
  }

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible
    setSidebarVisible(newVisibility)
    setSidebarManuallyToggled(true)
    
    // If user manually hides it, allow hover to work again after a delay
    if (!newVisibility) {
      setTimeout(() => setSidebarManuallyToggled(false), 2000)
    }
  }

  // Handle mouse hover for sidebar
  const handleMouseEnter = () => {
    if (!sidebarManuallyToggled) {
      setSidebarVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (!sidebarManuallyToggled) {
      setSidebarVisible(false)
    }
  }

  const handleModuleSelect = (moduleIndex) => {
    setCurrentModule(moduleIndex)
    setCurrentSubsection(0)
    setCurrentPage(0)
    setShowModuleList(false)
    // Keep sidebar visible after module selection
  }



  if (showQuiz && quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {selectedQuizDifficulty} Quiz
                    </CardTitle>
                    <p className="text-orange-100 mt-1">
                      {currentSubsectionData?.title} • {currentModuleData?.title}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuiz(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <QuizInterface 
                  quizData={quizData} 
                  onComplete={handleQuizCompletion}
                  difficulty={selectedQuizDifficulty}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">

      
      {/* Hover trigger for sidebar */}
      <div 
        className="fixed left-0 top-0 w-4 h-full z-50 bg-transparent"
        onMouseEnter={handleMouseEnter}
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to Library
              </Button>
              <div className="h-8 w-px bg-white/30"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="text-white hover:bg-white/20"
                title={sidebarVisible ? "Hide Modules" : "Show Modules"}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Modules</span>
                {sidebarVisible ? (
                  <ChevronLeft className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
              <div className="h-8 w-px bg-white/30"></div>
              <div>
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <div className="text-orange-100 flex items-center gap-2 mt-1">
                  <Trophy className="h-4 w-4" />
                  {course.examType} • {course.subject}
                  <Badge className="bg-white/20 text-white border-white/30 ml-2">
                    {course.level || 'Intermediate'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-orange-100 text-sm">Overall Progress</p>
                <p className="text-2xl font-bold">{getOverallProgress()}%</p>
              </div>
              <Progress value={getOverallProgress()} className="w-32 h-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 lg:gap-8">
          {/* Sidebar - Module Navigation */}
          <div 
            className={`transition-all duration-300 ${
              sidebarVisible ? 'w-80 lg:w-80 md:w-72 sm:w-64 xs:w-full opacity-100' : 'w-0 opacity-0'
            } overflow-hidden flex-shrink-0`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Card className="sticky top-4 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-6 p-6 min-h-[calc(100vh-8rem)]">
                  {modules.map((module, index) => (
                    <div key={index} className="space-y-2">
                      <Button
                        variant={currentModule === index ? "default" : "ghost"}
                        className={`w-full justify-start text-left h-auto p-3 ${
                          currentModule === index 
                            ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" 
                            : "hover:bg-orange-50"
                        }`}
                        onClick={() => handleModuleSelect(index)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            completedModules.has(index)
                              ? "bg-green-500 text-white"
                              : currentModule === index
                              ? "bg-white/20 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {completedModules.has(index) ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-sm font-bold">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{module.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress 
                                value={getModuleProgress(index)} 
                                className="h-1 flex-1"
                              />
                              <span className="text-xs opacity-70">
                                {getModuleProgress(index)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {currentModuleData?.title}
                    </CardTitle>
                    <p className="text-slate-300 mt-1">
                      Module {currentModule + 1} of {modules.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!completedModules.has(currentModule) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={markModuleComplete}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    <Badge className="bg-white/20 text-white border-white/30">
                      {subsections.length} subsections
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-50">
                    <TabsTrigger value="content" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="subsections" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Subsections
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Resources
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Progress
                    </TabsTrigger>
                  </TabsList>

                  {/* Content Tab */}
                  <TabsContent value="content" className="p-6">
                    <div className="space-y-6">
                      {/* Module Overview */}
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Module Overview</h3>
                        <div className="prose max-w-none">
                          {currentModuleData?.content ? (
                            <MathMarkdownRenderer content={currentModuleData.content} />
                          ) : (
                            <p className="text-gray-500 italic">No content available</p>
                          )}
                        </div>
                      </div>

                      {/* Learning Objectives */}
                      {currentModuleData?.objectives && (
                        <div className="bg-blue-50 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            Learning Objectives
                          </h3>
                          <ul className="space-y-2">
                            {currentModuleData.objectives.map((objective, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                                  {index + 1}
                                </div>
                                <div className="text-gray-700 flex-1">
                                  <MathMarkdownRenderer content={objective} />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Key Examples */}
                      {currentModuleData?.examples && (
                        <div className="bg-green-50 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-green-600" />
                            Key Examples
                          </h3>
                          <div className="space-y-4">
                            {currentModuleData.examples.map((example, index) => (
                              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-start gap-3">
                                  <Badge className="bg-green-100 text-green-800 mt-1">
                                    Example {index + 1}
                                  </Badge>
                                  <div className="flex-1">
                                    <div className="text-gray-700 whitespace-pre-wrap">
                                      <MathMarkdownRenderer content={example} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Subsections Tab */}
                  <TabsContent value="subsections" className="p-3 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {subsections.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-base sm:text-lg">No detailed subsections available.</p>
                        </div>
                      ) : (
                        subsections.map((subsection, index) => {
                          const isCompleted = completedSubsections.has(`${currentModule}-${index}`)
                          const quizResults = getQuizResultsForSubsection(currentModule, index)
                          const sectionKey = `subsection-${index}`
                          const isExpanded = expandedSections.has(sectionKey)
                          
                          return (
                            <Card key={index} className={`border-2 transition-all duration-300 ${
                              isCompleted 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-gray-200 hover:border-orange-300'
                            }`}>
                              <CardHeader className="pb-3 p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                      isCompleted 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-orange-500 text-white'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                      ) : (
                                        <span className="font-bold text-sm sm:text-base">{index + 1}</span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-base sm:text-lg truncate">{subsection.title}</CardTitle>
                                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        {subsection.estimatedTime || 15} min • {subsection.difficulty || 'medium'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleSection(sectionKey)}
                                      className="w-8 h-8 sm:w-10 sm:h-10"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              {isExpanded && (
                                <CardContent className="p-3 sm:p-4 lg:p-6">
                                  {/* Subsection Content Container */}
                                  <div className="space-y-4 sm:space-y-6">
                                    {loadingDetailedContent ? (
                                      <div className="flex items-center justify-center py-8 sm:py-12">
                                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500"></div>
                                        <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading detailed content...</span>
                                      </div>
                                    ) : (
                                      <div className="w-full">
                                        {/* Display the current subsection content */}
                                        <div className="space-y-6">
                                          {/* Subsection Summary */}
                                          {subsection.summary && (
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                              <h4 className="font-semibold text-blue-900 mb-2">Overview</h4>
                                              <div className="text-blue-800">
                                                <MathMarkdownRenderer content={subsection.summary} />
                                              </div>
                                            </div>
                                          )}

                                          {/* Key Points */}
                                          {subsection.keyPoints && subsection.keyPoints.length > 0 && (
                                            <div className="bg-green-50 p-4 rounded-lg">
                                              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                Key Learning Points
                                              </h4>
                                              <ul className="space-y-2">
                                                {subsection.keyPoints.map((point, pointIndex) => (
                                                  <li key={pointIndex} className="flex items-start gap-2">
                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">
                                                      {pointIndex + 1}
                                                    </div>
                                                    <div className="text-green-800 flex-1">
                                                      <MathMarkdownRenderer content={point} />
                                                    </div>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Detailed Pages */}
                                          {subsection.pages && subsection.pages.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-lg">
                                              <div className="border-b border-gray-200 p-4">
                                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                  <BookOpen className="h-4 w-4" />
                                                  Detailed Study Material
                                                </h4>
                                              </div>
                                              
                                              {/* Page Navigation Tabs */}
                                              <div className="border-b border-gray-200">
                                                <div className="flex overflow-x-auto">
                                                  {subsection.pages.map((page, pageIndex) => (
                                                    <button
                                                      key={pageIndex}
                                                      onClick={() => setCurrentPageTab(currentModule, index, pageIndex)}
                                                      className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                                        getCurrentPageTab(currentModule, index) === pageIndex
                                                          ? 'border-orange-500 text-orange-600 bg-orange-50'
                                                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                      }`}
                                                    >
                                                      {page.pageTitle}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                              
                                              {/* Current Page Content */}
                                              <div className="p-6">
                                                {(() => {
                                                  const currentPageIndex = getCurrentPageTab(currentModule, index);
                                                  const currentPage = subsection.pages[currentPageIndex];
                                                  
                                                  if (!currentPage) {
                                                    return <p className="text-gray-500 italic">No content available for this page.</p>;
                                                  }
                                                  
                                                  return (
                                                    <div className="space-y-6">
                                                      {/* Page Content */}
                                                      <div className="prose max-w-none">
                                                        <MathMarkdownRenderer content={currentPage.content} />
                                                      </div>
                                                      
                                                      {/* Mathematical Content */}
                                                      {currentPage.mathematicalContent && currentPage.mathematicalContent.length > 0 && (
                                                        <div className="bg-purple-50 p-4 rounded-lg">
                                                          <h5 className="font-semibold text-purple-900 mb-3">Mathematical Concepts</h5>
                                                          <div className="space-y-4">
                                                            {currentPage.mathematicalContent.map((mathItem, mathIndex) => (
                                                              <div key={mathIndex} className="bg-white p-4 rounded border">
                                                                <h6 className="font-medium text-purple-800 mb-2">{mathItem.title}</h6>
                                                                <div className="text-purple-700 mb-2">
                                                                  <MathMarkdownRenderer content={mathItem.content} />
                                                                </div>
                                                                {mathItem.explanation && (
                                                                  <div className="text-sm text-purple-600">
                                                                    <MathMarkdownRenderer content={mathItem.explanation} />
                                                                  </div>
                                                                )}
                                                                {mathItem.example && (
                                                                  <div className="mt-2 p-2 bg-purple-100 rounded text-sm">
                                                                    <strong>Example:</strong> <MathMarkdownRenderer content={mathItem.example} />
                                                                  </div>
                                                                )}
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      )}
                                                      
                                                      {/* Key Takeaway */}
                                                      {currentPage.keyTakeaway && (
                                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                                          <div className="flex items-start gap-2">
                                                            <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                              <h5 className="font-semibold text-yellow-900 mb-1">Key Takeaway</h5>
                                                              <div className="text-yellow-800">
                                                                <MathMarkdownRenderer content={currentPage.keyTakeaway} />
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}
                                                      
                                                      {/* Page Navigation */}
                                                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => setCurrentPageTab(currentModule, index, Math.max(0, currentPageIndex - 1))}
                                                          disabled={currentPageIndex === 0}
                                                        >
                                                          <ChevronLeft className="h-4 w-4 mr-1" />
                                                          Previous
                                                        </Button>
                                                        
                                                        <span className="text-sm text-gray-600">
                                                          Page {currentPageIndex + 1} of {subsection.pages.length}
                                                        </span>
                                                        
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => setCurrentPageTab(currentModule, index, Math.min(subsection.pages.length - 1, currentPageIndex + 1))}
                                                          disabled={currentPageIndex === subsection.pages.length - 1}
                                                        >
                                                          Next
                                                          <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  );
                                                })()}
                                              </div>
                                            </div>
                                          )}

                                          {/* Practical Example */}
                                          {subsection.practicalExample && (
                                            <div className="bg-indigo-50 p-4 rounded-lg">
                                              <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4" />
                                                Practical Example
                                              </h4>
                                              <div className="text-indigo-800">
                                                <MathMarkdownRenderer content={subsection.practicalExample} />
                                              </div>
                                            </div>
                                          )}

                                          {/* Common Pitfalls */}
                                          {subsection.commonPitfalls && subsection.commonPitfalls.length > 0 && (
                                            <div className="bg-red-50 p-4 rounded-lg">
                                              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                Common Pitfalls to Avoid
                                              </h4>
                                              <ul className="space-y-2">
                                                {subsection.commonPitfalls.map((pitfall, pitfallIndex) => (
                                                  <li key={pitfallIndex} className="flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <div className="text-red-800">
                                                      <MathMarkdownRenderer content={pitfall} />
                                                    </div>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Quiz Section - Mobile First */}
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-xl">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                                      <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                      Practice Quizzes
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {['Easy', 'Medium', 'Hard'].map((difficulty) => {
                                        const result = quizResults[difficulty]
                                        const hasQuiz = hasQuizForSubsection(currentModule, index, difficulty)
                                        const quizData = getQuizForSubsection(currentModule, index, difficulty)
                                        
                                        return (
                                          <div key={difficulty} className="bg-white p-3 rounded-lg border">
                                            <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                                              <Badge className={`text-xs ${
                                                difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                                difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                              }`}>
                                                {difficulty}
                                              </Badge>
                                              <div className="flex gap-1">
                                              {result && (
                                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                  {result.score}%
                                                </Badge>
                                              )}
                                              {hasQuiz && (
                                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                                  {quizData?.totalQuestions || quizData?.questions?.length || 0} Q
                                                </Badge>
                                              )}
                                              </div>
                                            </div>
                                            {hasQuiz ? (
                                              <Button
                                                size="sm"
                                                className={`w-full text-xs h-8 ${
                                                  difficulty === 'Easy' ? 'bg-green-500 hover:bg-green-600' :
                                                  difficulty === 'Medium' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                                  'bg-red-500 hover:bg-red-600'
                                                }`}
                                                onClick={() => handleQuizStart(difficulty, subsection, index)}
                                                disabled={isQuizLoading}
                                              >
                                                {isQuizLoading && selectedQuizDifficulty === difficulty ? (
                                                  <>
                                                    <Timer className="h-3 w-3 mr-1 animate-spin" />
                                                    Loading...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Trophy className="h-3 w-3 mr-1" />
                                                    {result ? 'Retake' : 'Take'} Quiz
                                                  </>
                                                )}
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full cursor-not-allowed opacity-50 text-xs h-8"
                                                disabled
                                              >
                                                <X className="h-3 w-3 mr-1" />
                                                No Quiz Available
                                              </Button>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          )
                        })
                      )}
                    </div>
                  </TabsContent>

                  {/* Resources Tab */}
                  <TabsContent value="resources" className="p-6">
                    <div className="space-y-6">
                      {currentModuleData?.resources && Object.keys(currentModuleData.resources).length > 0 ? (
                        <div className="relative">
                          {/* Enhanced background blur effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 rounded-3xl blur-3xl"></div>
                          
                          <Card className="relative border-0 bg-gradient-to-br from-purple-50/90 via-indigo-50/90 to-blue-50/90 shadow-2xl overflow-hidden backdrop-blur-sm">
                            {/* Animated background elements */}
                            <div className="absolute inset-0 overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 to-indigo-100/30"></div>
                              <motion.div
                                className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-2xl"
                                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              />
                              <motion.div
                                className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-2xl"
                                animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
                                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              />
                            </div>

                            <CardHeader className="relative z-10 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-b border-purple-200/50 p-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <motion.div
                                    className="w-16 h-16 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                  >
                                    <Sparkles className="h-8 w-8 text-white" />
                                  </motion.div>
                                  
                                  <div>
                                    <CardTitle className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent mb-2">
                                      Learning Resources
                                    </CardTitle>
                                    <CardDescription className="text-purple-700 text-lg font-medium">
                                      Comprehensive collection of exam preparation materials
                                    </CardDescription>
                                  </div>
                                </div>
                                
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: 0.3, type: "spring" }}
                                >
                                  <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-lg px-4 py-2 text-sm font-bold">
                                    <Brain className="h-4 w-4 mr-2" />
                                    Exam Focused
                                  </Badge>
                                </motion.div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="relative z-10 p-8">
                              <Tabs
                                defaultValue={
                                  currentModuleData.resources.articles && currentModuleData.resources.articles.length > 0
                                    ? "articles"
                                    : currentModuleData.resources.videos && currentModuleData.resources.videos.length > 0
                                      ? "videos"
                                      : currentModuleData.resources.books && currentModuleData.resources.books.length > 0
                                        ? "books"
                                        : currentModuleData.resources.courses && currentModuleData.resources.courses.length > 0
                                          ? "courses"
                                          : currentModuleData.resources.tools && currentModuleData.resources.tools.length > 0
                                            ? "tools"
                                            : currentModuleData.resources.websites && currentModuleData.resources.websites.length > 0
                                              ? "websites"
                                              : currentModuleData.resources.exercises && currentModuleData.resources.exercises.length > 0
                                                ? "exercises"
                                                : "articles"
                                }
                                className="w-full"
                              >
                                {/* Enhanced TabsList with Educator Design */}
                                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-2 bg-gradient-to-r from-white/80 to-purple-50/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg">
                          {Object.entries(resourceCategories).map(([category, { icon: Icon, label, color }]) => {
                            const resources = currentModuleData.resources[category]
                            if (!resources || resources.length === 0) return null
                            
                            return (
                                      <TabsTrigger
                                        key={category}
                                        value={category}
                                        className={`group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-${color}-500 data-[state=active]:to-${color}-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-${color}-50`}
                                      >
                                        <div className={`p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300`}>
                                          <Icon className={`h-5 w-5 text-${color}-600 group-data-[state=active]:text-white`} />
                                        </div>
                                        <span className="text-xs font-semibold">{label}</span>
                                        <Badge variant="secondary" className={`text-xs bg-${color}-100 text-${color}-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white`}>
                                          {resources.length}
                                        </Badge>
                                      </TabsTrigger>
                                    )
                                  })}
                                </TabsList>

                                <div className="mt-8">
                                  {Object.entries(resourceCategories).map(([category, { icon: Icon, label, color }]) => {
                                    const resources = currentModuleData.resources[category]
                                    if (!resources || resources.length === 0) return null
                                    
                                    return (
                                      <TabsContent key={category} value={category}>
                                        <motion.div
                                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                          variants={containerVariants}
                                          initial="hidden"
                                          animate="visible"
                                        >
                                          {resources.map((resource, index) => (
                                            <motion.div key={`${category}-${index}`} variants={itemVariants}>
                                              <ResourceCard 
                                                resource={typeof resource === 'string' ? { title: resource } : resource} 
                                                type={category} 
                                                resourceIndex={index} 
                                              />
                                            </motion.div>
                                          ))}
                                        </motion.div>
                                      </TabsContent>
                                    )
                                  })}
                                  </div>
                              </Tabs>
                                </CardContent>
                              </Card>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No resources available for this module</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Progress Tab */}
                  <TabsContent value="progress" className="p-6">
                    <div className="space-y-6">
                      {/* Overall Progress */}
                      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Course Progress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-600">Overall Completion</span>
                            <span className="text-2xl font-bold text-blue-600">{getOverallProgress()}%</span>
                          </div>
                          <Progress value={getOverallProgress()} className="h-3" />
                          <p className="text-sm text-gray-600 mt-2">
                            {completedModules.size} of {modules.length} modules completed
                          </p>
                        </CardContent>
                      </Card>

                      {/* Module Progress */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-green-600" />
                            Module Progress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {modules.map((module, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                      completedModules.has(index)
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {completedModules.has(index) ? '✓' : index + 1}
                                    </div>
                                    <span className="font-medium">{module.title}</span>
                                  </div>
                                  <span className="text-sm text-gray-600">{getModuleProgress(index)}%</span>
                                </div>
                                <Progress value={getModuleProgress(index)} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Custom styles for scrollbar hiding */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari, and Opera */
        }
      `}</style>
    </div>
  )
}

// Quiz Interface Component
function QuizInterface({ quizData, onComplete, difficulty }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questions = quizData.questions || []
  const currentQ = questions[currentQuestion]

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResults) {
      handleSubmit()
    }
  }, [timeLeft, showResults])

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    let correct = 0
    const results = []
    
    questions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index]
      const isCorrect = userAnswer === question.correctAnswer
      if (isCorrect) correct++
      
      results.push({
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      })
    })

    const score = Math.round((correct / questions.length) * 100)
    
    setTimeout(() => {
      setIsSubmitting(false)
      setShowResults(true)
      onComplete({
        score,
        correct,
        total: questions.length,
        results,
        difficulty,
        completedAt: new Date().toISOString()
      })
    }, 1000)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isSubmitting) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xl font-semibold text-gray-800">Evaluating your answers...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className="bg-orange-100 text-orange-800">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-orange-600" />
          <span className={`font-mono text-lg ${timeLeft < 60 ? 'text-red-600' : 'text-orange-600'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Question */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg">
            <MathMarkdownRenderer content={currentQ?.question || ''} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQ?.options?.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswers[currentQuestion] === option ? "default" : "outline"}
                className={`w-full justify-start text-left p-4 h-auto ${
                  selectedAnswers[currentQuestion] === option
                    ? "bg-orange-500 text-white border-orange-500"
                    : "hover:bg-orange-50 border-orange-200"
                }`}
                onClick={() => handleAnswerSelect(currentQuestion, option)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswers[currentQuestion] === option
                      ? "border-white bg-white text-orange-500"
                      : "border-orange-300"
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>
                    <MathMarkdownRenderer content={option || ''} />
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2">
          {questions.map((_, index) => (
            <Button
              key={index}
              variant={currentQuestion === index ? "default" : "outline"}
              size="sm"
              className={`w-8 h-8 p-0 ${
                selectedAnswers[index] ? "bg-green-100 border-green-300" : ""
              }`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            className="bg-green-500 hover:bg-green-600"
            disabled={Object.keys(selectedAnswers).length === 0}
          >
            Submit Quiz
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
} 
