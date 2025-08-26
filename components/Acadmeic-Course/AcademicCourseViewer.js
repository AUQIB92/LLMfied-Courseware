"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReliableMathRenderer from "@/components/ReliableMathRenderer"



import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Users, 
  Play, 
  GraduationCap,
  CheckCircle,
  ChevronRight,
  FileText,
  Video,
  Trophy,
  Target,
  Lightbulb,
  BarChart3,
  ChevronLeft,
  Calendar,
  Award
} from "lucide-react"

// Add style for horizontal scrollbar hiding
const hiddenScrollbarStyle = {
  msOverflowStyle: 'none',  /* IE and Edge */
  scrollbarWidth: 'none',   /* Firefox */
  WebkitScrollbar: { display: 'none' } /* Chrome, Safari */
}

export default function AcademicCourseViewer({ courseId, course: initialCourse, onBack }) {
  const { getAuthHeaders } = useAuth()
  const [viewerCourse, setViewerCourse] = useState(initialCourse || null)
  const [loading, setLoading] = useState(!initialCourse)
  const [error, setError] = useState(null)
  const [currentModule, setCurrentModule] = useState(0)
  const [currentSubsection, setCurrentSubsection] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [completedModules, setCompletedModules] = useState(new Set())
  const [completedSubsections, setCompletedSubsections] = useState(new Set())
  const [completedPages, setCompletedPages] = useState(new Set())
  const [activeTab, setActiveTab] = useState("overview")
  const [focusedModule, setFocusedModule] = useState(null) // New state for focused module view

  useEffect(() => {
    if (initialCourse) {
      setViewerCourse(initialCourse)
      setLoading(false)
    } else if (courseId) {
      fetchCourse()
    }
  }, [courseId, initialCourse])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      setError(null)
      const idToUse = courseId || initialCourse?._id
      if (!idToUse) {
        setError("No course ID provided")
        setLoading(false)
        return
      }
      const response = await fetch(`/api/academic-courses/${idToUse}`)
      if (response.ok) {
        const data = await response.json()
        setViewerCourse(data)
      } else if (response.status === 404) {
        setError("Course not found or not accessible")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load course")
      }
    } catch (e) {
      console.error("Error fetching course:", e)
      setError("Network error: Failed to load course")
    } finally {
      setLoading(false)
    }
  }

  const markModuleComplete = (moduleIndex) => {
    setCompletedModules(prev => new Set([...prev, moduleIndex]))
  }

  const markSubsectionComplete = (moduleIndex, subsectionIndex) => {
    const subsectionKey = `${moduleIndex}-${subsectionIndex}`
    setCompletedSubsections(prev => new Set([...prev, subsectionKey]))
  }

  const markPageComplete = (moduleIndex, subsectionIndex, pageIndex) => {
    const pageKey = `${moduleIndex}-${subsectionIndex}-${pageIndex}`
    setCompletedPages(prev => new Set([...prev, pageKey]))
  }

  // Helper functions for focused module view
  const handleModuleClick = (moduleIndex) => {
    setFocusedModule(moduleIndex)
    setCurrentModule(moduleIndex)
    setCurrentSubsection(0)
    setCurrentPage(0)
  }

  const handleBackToModules = () => {
    setFocusedModule(null)
  }

  const getProgressPercentage = () => {
    if (!viewerCourse?.modules?.length) return 0
    return (completedModules.size / viewerCourse.modules.length) * 100
  }

  const getAcademicLevelConfig = (level) => {
    const configs = {
      undergraduate: { name: "Undergraduate", color: "blue", icon: "🎓" },
      graduate: { name: "Graduate", color: "purple", icon: "📚" },
      postgraduate: { name: "Postgraduate", color: "indigo", icon: "🔬" },
      doctorate: { name: "Doctorate", color: "violet", icon: "⚕️" }
    }
    return configs[level?.toLowerCase()] || configs.undergraduate
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-opacity-50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Academic Course</h3>
          <p className="text-slate-600">Preparing your learning materials...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Course Not Available</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  if (!viewerCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Course Not Found</h3>
          <p className="text-slate-600 mb-6">The requested course could not be found.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  const levelConfig = getAcademicLevelConfig(viewerCourse.academicLevel)
  
  // Module and subsection data
  const modules = viewerCourse.modules || []
  const currentModuleData = modules[currentModule]
  
  // For academic courses, use educator-generated detailedSubsections or create fallback subsections
  const createAcademicSubsections = (module) => {
    if (!module) return []
    
    // If we have educator-generated detailedSubsections, use them directly
    if (module.detailedSubsections && module.detailedSubsections.length > 0) {
      return module.detailedSubsections.map((subsection, index) => ({
        ...subsection,
        // Ensure we have all required fields with fallbacks
        title: subsection.title || subsection.formattedTitle || `Section ${index + 1}`,
        content: subsection.content || subsection.summary || 
                (subsection.pages && subsection.pages.length > 0 ? 
                  subsection.pages[0].content || subsection.pages[0].html : null) ||
                "Content will be available soon.",
        type: "detailed"
      }))
    }
    
    // Fallback: create basic subsections from module structure if no detailed subsections exist
    const subsections = []
    
    // Check if we have any structured data
    const hasStructuredData = (
      (module.objectives && module.objectives.length > 0) ||
      (module.topics && module.topics.length > 0) ||
      (module.examples && module.examples.length > 0) ||
      (module.assignments && module.assignments.length > 0) ||
      (module.discussions && module.discussions.length > 0)
    )
    
    // Always add an overview section
    const overviewContent = module.summary || module.description || 
      "This module provides essential learning content."
    
    subsections.push({
      title: "Overview",
      content: overviewContent,
      type: "overview"
    })
    
    // Add content section if we have actual content
    if (module.content && module.content.trim().length > 50) {
      subsections.push({
        title: "Module Content",
        content: module.content,
        type: "content"
      })
    }
    
    // Add structured sections only if they have meaningful content
    if (hasStructuredData) {
      if (module.objectives && module.objectives.length > 0) {
        subsections.push({
          title: "Learning Objectives",
          content: "## Learning Objectives\n\n" + 
            module.objectives.map(obj => `- ${obj}`).join('\n'),
          type: "objectives"
        })
      }
      
      if (module.topics && module.topics.length > 0) {
        subsections.push({
          title: "Topics Covered",
          content: "## Topics Covered\n\n" + 
            module.topics.map(topic => `- ${topic}`).join('\n'),
          type: "topics"
        })
      }
    }
    
    // Ensure we always have at least one subsection with meaningful content
    if (subsections.length === 0) {
      subsections.push({
        title: "Module Information",
        content: "This module is being prepared. Please check back later for content, or contact your instructor for materials.",
        type: "info"
      })
    }
    
    // If we have a subsection but no meaningful content, provide a helpful message
    if (subsections.length === 1 && subsections[0].content === "This module provides essential learning content.") {
      subsections[0] = {
        title: "Module Information", 
        content: "This module is being prepared. Please check back later for content, or contact your instructor for materials.",
        type: "info"
      }
    }
    
    return subsections
  }
  
  const subsections = createAcademicSubsections(currentModuleData)
  const currentSubsectionData = subsections?.[currentSubsection]
  
  // Debug logging
  console.log("🔍 Academic Course Viewer Debug:", {
    courseTitle: viewerCourse.title,
    moduleCount: modules.length,
    currentModule,
    currentModuleData: currentModuleData ? {
      title: currentModuleData.title,
      hasContent: !!currentModuleData.content,
      hasSummary: !!currentModuleData.summary,
      hasObjectives: !!currentModuleData.objectives?.length,
      hasTopics: !!currentModuleData.topics?.length,
      hasExamples: !!currentModuleData.examples?.length,
      hasAssignments: !!currentModuleData.assignments?.length,
      hasDiscussions: !!currentModuleData.discussions?.length,
      hasDetailedSubsections: !!currentModuleData.detailedSubsections?.length,
      detailedSubsectionsCount: currentModuleData.detailedSubsections?.length || 0,
      detailedSubsectionsPreview: currentModuleData.detailedSubsections?.slice(0, 2),
      contentPreview: currentModuleData.content ? currentModuleData.content.substring(0, 100) + "..." : "No content",
      summaryPreview: currentModuleData.summary ? currentModuleData.summary.substring(0, 100) + "..." : "No summary"
    } : null,
    subsectionsCount: subsections.length,
    subsectionsPreview: subsections.slice(0, 2),
    currentSubsection,
    currentSubsectionData: currentSubsectionData ? {
      title: currentSubsectionData.title,
      type: currentSubsectionData.type,
      hasContent: !!currentSubsectionData.content,
      hasSummary: !!currentSubsectionData.summary,
      hasPages: !!currentSubsectionData.pages?.length,
      pagesCount: currentSubsectionData.pages?.length || 0,
      contentPreview: currentSubsectionData.content ? currentSubsectionData.content.substring(0, 100) + "..." : "No content",
      summaryPreview: currentSubsectionData.summary ? currentSubsectionData.summary.substring(0, 100) + "..." : "No summary"
    } : null
  })

  // Enhanced keyboard navigation for subsections and pages
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== "modules" || !viewerCourse) return
      
      const subsections = createAcademicSubsections(modules[currentModule])
      const currentSubsectionData = subsections?.[currentSubsection]
      const totalPages = currentSubsectionData?.pages?.length || 0
      
      // Page-level navigation (Arrow keys alone)
      if (e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (totalPages > 0 && currentPage > 0) {
          setCurrentPage(currentPage - 1)
        }
      } else if (e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (totalPages > 0 && currentPage < totalPages - 1) {
          setCurrentPage(currentPage + 1)
        }
      }
      
      // Subsection-level navigation (Ctrl + Arrow keys)
      else if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (currentSubsection > 0) {
          setCurrentSubsection(currentSubsection - 1)
          setCurrentPage(0)
        } else if (currentModule > 0) {
          setCurrentModule(currentModule - 1)
          const prevModuleSubsections = createAcademicSubsections(modules[currentModule - 1])
          setCurrentSubsection(prevModuleSubsections.length - 1)
          setCurrentPage(0)
        }
      } else if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (currentSubsection < subsections.length - 1) {
          setCurrentSubsection(currentSubsection + 1)
          setCurrentPage(0)
        } else if (currentModule < modules.length - 1) {
          setCurrentModule(currentModule + 1)
          setCurrentSubsection(0)
          setCurrentPage(0)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, currentModule, currentSubsection, currentPage, modules, viewerCourse])

  return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div 
          className="flex items-center gap-4 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button onClick={onBack} variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <GraduationCap className="h-4 w-4" />
            <span>Academic Course</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
		  <Card className="relative mb-8 border-0 shadow-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl`}>
                    {levelConfig.icon}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{viewerCourse.title}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {levelConfig.name}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {viewerCourse.subject}
                      </Badge>
                      {viewerCourse.semester && (
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          Semester {viewerCourse.semester}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-white/90 text-lg leading-relaxed mb-6 max-w-3xl">
                {viewerCourse.description}
              </p>

              <div className="flex items-center gap-8 text-white/80 mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{viewerCourse.modules?.length || 0} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{viewerCourse.enrollmentCount || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{viewerCourse.credits || 3} credits</span>
                </div>
                {viewerCourse.assignments && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span>{viewerCourse.assignments.length} assignments</span>
                  </div>
                )}
              </div>

              <div className="bg-white/20 rounded-full p-1 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Course Progress</span>
                  <span className="text-sm text-white/90">{Math.round(getProgressPercentage())}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2 bg-white/20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 lg:w-2/3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="modules" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Modules
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {viewerCourse.objectives?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Learning Objectives
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {viewerCourse.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {viewerCourse.prerequisites?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-600" />
                        Prerequisites
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {viewerCourse.prerequisites.map((prerequisite, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{prerequisite}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {viewerCourse.assessmentCriteria && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      Assessment Criteria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                          {viewerCourse.assessmentCriteria.assignments}%
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600">Assignments</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                          {viewerCourse.assessmentCriteria.quizzes}%
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600">Quizzes</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-amber-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-amber-600 mb-1">
                          {viewerCourse.assessmentCriteria.midterm}%
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600">Midterm</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-red-600 mb-1">
                          {viewerCourse.assessmentCriteria.final}%
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600">Final</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="modules" className="space-y-4">
              {modules?.length > 0 ? (
                // Check if we're in focused module view
                focusedModule !== null ? (
                  // Focused Module View - Full Screen with Back Button
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[calc(100vh-12rem)]"
                  >
                    {/* Back to Modules Header */}
                    <Card className="mb-6">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="outline"
                              onClick={handleBackToModules}
                              className="flex items-center gap-2 hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                            >
                              <ArrowLeft className="h-4 w-4" />
                              Back to Modules
                            </Button>
                            <div className="h-6 w-px bg-slate-200"></div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-800">
                                {modules[focusedModule]?.title || `Module ${focusedModule + 1}`}
                              </h2>
                              <p className="text-sm text-slate-600">
                                Module {focusedModule + 1} of {modules.length}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!completedModules.has(focusedModule) && (
                              <Button
                                onClick={() => markModuleComplete(focusedModule)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            )}
                            {completedModules.has(focusedModule) && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Focused Module Content */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {/* Module Description */}
                          {modules[focusedModule]?.description && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                              <p className="text-blue-800">{modules[focusedModule].description}</p>
                            </div>
                          )}
                          
                          {/* Main module content */}
                          <div className="prose prose-lg max-w-none mb-4">
                            <ReliableMathRenderer
                              content={
                                modules[focusedModule]?.content || 
                                modules[focusedModule]?.generatedMarkdown ||
                                "Interactive learning materials and resources for this module will be displayed here."
                              }
                              className="prose prose-lg max-w-none"
                              showMetrics={false}
                            />
                          </div>
                          
                          {/* Module objectives */}
                          {modules[focusedModule]?.objectives && modules[focusedModule].objectives.length > 0 && (
                            <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                              <h6 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Module Objectives
                              </h6>
                              <ul className="space-y-2">
                                {modules[focusedModule].objectives.map((objective, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <ChevronRight className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                                    <span className="text-amber-800">{objective}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Module topics */}
                          {modules[focusedModule]?.topics && modules[focusedModule].topics.length > 0 && (
                            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                              <h6 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Topics Covered
                              </h6>
                              <ul className="space-y-2">
                                {modules[focusedModule].topics.map((topic, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <ChevronRight className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                                    <span className="text-green-800">{topic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Module assignments if any */}
                          {modules[focusedModule]?.assignments && modules[focusedModule].assignments.length > 0 && (
                            <div className="mt-6 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                              <h6 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Module Assignments
                              </h6>
                              <div className="space-y-2">
                                {modules[focusedModule].assignments.map((assignment, index) => (
                                  <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border">
                                    <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-medium text-purple-900">{assignment.title}</p>
                                      <p className="text-sm text-purple-700">
                                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Navigation Footer */}
                          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (focusedModule > 0) {
                                  setFocusedModule(focusedModule - 1)
                                  setCurrentModule(focusedModule - 1)
                                  setCurrentSubsection(0)
                                  setCurrentPage(0)
                                }
                              }}
                              disabled={focusedModule === 0}
                              className="flex items-center gap-2"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous Module
                            </Button>
                            
                            <div className="flex items-center gap-2">
                              {Array.from({ length: Math.min(modules.length, 5) }, (_, i) => {
                                const moduleIndex = Math.max(0, focusedModule - 2) + i;
                                return moduleIndex < modules.length ? (
                                  <div
                                    key={moduleIndex}
                                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                                      moduleIndex < focusedModule
                                        ? "bg-green-400"
                                        : moduleIndex === focusedModule
                                        ? "bg-blue-500"
                                        : "bg-slate-200"
                                    }`}
                                  />
                                ) : null;
                              })}
                              {modules.length > 5 && (
                                <span className="text-xs text-slate-400 ml-1">
                                  {focusedModule + 1}/{modules.length}
                                </span>
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (focusedModule < modules.length - 1) {
                                  setFocusedModule(focusedModule + 1)
                                  setCurrentModule(focusedModule + 1)
                                  setCurrentSubsection(0)
                                  setCurrentPage(0)
                                }
                              }}
                              disabled={focusedModule === modules.length - 1}
                              className="flex items-center gap-2"
                            >
                              Next Module
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  // Regular Module List View
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-16rem)]">
                    {/* Module Navigation Sidebar */}
                    <Card className="lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" /> Course Modules
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-2 p-4">
                          {modules.map((module, index) => (
                            <Button
                              key={index}
                              variant={currentModule === index ? "default" : "ghost"}
                              className={`w-full justify-start text-left h-auto p-3 ${
                                currentModule === index
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                  : "hover:bg-blue-50"
                              }`}
                              onClick={() => handleModuleClick(index)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    completedModules.has(index)
                                      ? "bg-green-500 text-white"
                                      : currentModule === index
                                      ? "bg-white/20 text-white"
                                      : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  {completedModules.has(index) ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <span className="text-sm font-bold">
                                      {index + 1}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {module.title || `Module ${index + 1}`}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Progress
                                      value={completedModules.has(index) ? 100 : 0}
                                      className="h-1 flex-1"
                                    />
                                    <span className="text-xs opacity-70">
                                      {completedModules.has(index) ? 100 : 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Main Content Area */}
                    <Card className="lg:col-span-3">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">
                              {currentModuleData?.title || `Module ${currentModule + 1}`}
                            </CardTitle>
                            {currentModuleData?.description && (
                              <p className="text-slate-600 mt-2">
                                {currentModuleData.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!completedModules.has(currentModule) && (
                              <Button
                                onClick={() => markModuleComplete(currentModule)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            )}
                            {completedModules.has(currentModule) && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                      <div className="space-y-6">
                        {/* Subsections Display */}
                        {subsections.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                              Module Sections
                            </h4>
                            
                            {/* Enhanced Subsection Pagination */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700">Section Navigation</span>
                                  <Badge variant="outline" className="text-xs">
                                    {currentSubsection + 1} of {subsections.length}
                                  </Badge>
                                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">←→</kbd>
                                      <span>pages</span>
                                    </div>
                                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                    <div className="flex items-center gap-1">
                                      <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">Ctrl</kbd>
                                      <span>+</span>
                                      <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">←→</kbd>
                                      <span>sections</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {Math.round((completedSubsections.size / subsections.length) * 100)}% completed
                                </div>
                              </div>
                              
                              {/* Desktop Pagination - Compact horizontal scrollable */}
                              <div className="hidden md:block">
                                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200 p-2">
                                  <div 
                                    className="flex items-center gap-1 overflow-x-auto pb-1"
                                    style={hiddenScrollbarStyle}
                                  >
                                    {subsections.map((subsection, index) => {
                                      const isCompleted = completedSubsections.has(`${currentModule}-${index}`)
                                      const isCurrent = currentSubsection === index
                                      const isVisited = index < currentSubsection || isCompleted
                                      
                                      return (
                                        <div key={index} className="flex items-center flex-shrink-0">
                                          <motion.button
                                            onClick={() => {
                                              setCurrentSubsection(index)
                                              setCurrentPage(0)
                                            }}
                                            className={`relative group transition-all duration-200 ${
                                              isCurrent ? "scale-105" : "hover:scale-102"
                                            }`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <div className={`
                                              w-7 h-7 rounded-full flex items-center justify-center font-medium text-xs
                                              border transition-all duration-200 ${
                                                isCurrent
                                                  ? "bg-blue-600 text-white border-blue-500 shadow-md"
                                                  : isCompleted
                                                  ? "bg-green-500 text-white border-green-400"
                                                  : isVisited
                                                  ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-150"
                                                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                              }
                                            `}>
                                              {isCompleted ? (
                                                <CheckCircle className="h-3 w-3" />
                                              ) : (
                                                <span>{index + 1}</span>
                                              )}
                                            </div>
                                            
                                            {/* Enhanced Tooltip with full title */}
                                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                              <div className="bg-slate-800 text-white text-xs px-2 py-1.5 rounded-md shadow-lg max-w-48 text-center">
                                                <div className="font-medium">{subsection.title || `Section ${index + 1}`}</div>
                                                {subsection.type && (
                                                  <div className="text-slate-300 text-xs mt-0.5 capitalize">{subsection.type}</div>
                                                )}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-slate-800"></div>
                                              </div>
                                            </div>
                                          </motion.button>
                                          
                                          {/* Compact Progress connector */}
                                          {index < subsections.length - 1 && (
                                            <div className="w-4 h-px mx-0.5 relative">
                                              <div className="absolute inset-0 bg-slate-300"></div>
                                              <motion.div
                                                className="absolute inset-0 bg-blue-500"
                                                initial={{ width: "0%" }}
                                                animate={{ 
                                                  width: isCompleted || index < currentSubsection ? "100%" : "0%" 
                                                }}
                                                transition={{ duration: 0.2 }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Mobile Pagination - More compact view */}
                              <div className="md:hidden">
                                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newSubsection = Math.max(0, currentSubsection - 1)
                                        setCurrentSubsection(newSubsection)
                                        setCurrentPage(0)
                                      }}
                                      disabled={currentSubsection === 0}
                                      className="flex items-center gap-1 px-2 py-1 h-7 text-xs"
                                    >
                                      <ChevronLeft className="h-3 w-3" />
                                      Prev
                                    </Button>
                                    
                                    <div className="text-center min-w-0 flex-1 mx-2">
                                      <div className="text-sm font-medium text-slate-800 truncate">
                                        {subsections[currentSubsection]?.title?.split(' ').slice(0, 3).join(' ') || `Section ${currentSubsection + 1}`}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {currentSubsection + 1}/{subsections.length}
                                      </div>
                                    </div>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newSubsection = Math.min(subsections.length - 1, currentSubsection + 1)
                                        setCurrentSubsection(newSubsection)
                                        setCurrentPage(0)
                                      }}
                                      disabled={currentSubsection === subsections.length - 1}
                                      className="flex items-center gap-1 px-2 py-1 h-7 text-xs"
                                    >
                                      Next
                                      <ChevronRight className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  {/* Compact Progress bar */}
                                  <div className="relative mb-2">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full bg-blue-600"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${((currentSubsection + 1) / subsections.length) * 100}%` }}
                                        transition={{ duration: 0.2 }}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Enhanced Section dots with tooltips */}
                                  <div 
                                    className="flex items-center gap-1 overflow-x-auto py-1"
                                    style={hiddenScrollbarStyle}
                                  >
                                    {subsections.map((subsection, index) => {
                                      const isCompleted = completedSubsections.has(`${currentModule}-${index}`)
                                      const isCurrent = currentSubsection === index
                                      
                                      return (
                                        <div key={index} className="relative group flex-shrink-0">
                                          <button
                                            onClick={() => {
                                              setCurrentSubsection(index)
                                              setCurrentPage(0)
                                            }}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border transition-all duration-150 ${
                                              isCurrent
                                                ? "bg-blue-600 text-white border-blue-500 scale-110"
                                                : isCompleted
                                                ? "bg-green-500 text-white border-green-400"
                                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-150"
                                            }`}
                                          >
                                            {isCompleted ? (
                                              <CheckCircle className="h-2.5 w-2.5" />
                                            ) : (
                                              <span>{index + 1}</span>
                                            )}
                                          </button>
                                          
                                          {/* Mobile Tooltip */}
                                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                                            <div className="bg-slate-800 text-white text-xs px-2 py-1.5 rounded-md shadow-lg max-w-32 text-center">
                                              <div className="font-medium">{subsection.title || `Section ${index + 1}`}</div>
                                              {subsection.type && (
                                                <div className="text-slate-300 text-xs mt-0.5 capitalize">{subsection.type}</div>
                                              )}
                                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-slate-800"></div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Current Subsection Content */}
                            <AnimatePresence mode="wait">
                              {currentSubsectionData && (
                                <motion.div 
                                  key={`${currentModule}-${currentSubsection}`}
                                  className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                  <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-lg font-semibold text-slate-800">
                                    {currentSubsectionData.title || `Section ${currentSubsection + 1}`}
                                  </h5>
                                  {!completedSubsections.has(`${currentModule}-${currentSubsection}`) && (
                                    <Button
                                      onClick={() => markSubsectionComplete(currentModule, currentSubsection)}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Mark Complete
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="prose max-w-none">
                                  {/* Display educator-generated content with pages if available */}
                                  {currentSubsectionData?.pages && currentSubsectionData.pages.length > 0 ? (
                                    <div className="space-y-6">
                                      {/* Summary section */}
                                      {currentSubsectionData.summary && (
                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                          <h6 className="font-semibold text-blue-900 mb-2">Summary</h6>
                                          <ReliableMathRenderer
                                            content={currentSubsectionData.summary}
                                            className="text-blue-900 prose max-w-none"
                                            showMetrics={false}
                                          />
                                        </div>
                                      )}
                                      
                                      {/* Key Points section */}
                                      {currentSubsectionData.keyPoints && currentSubsectionData.keyPoints.length > 0 && (
                                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                                          <h6 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                            <Target className="h-4 w-4" />
                                            Key Points
                                          </h6>
                                          <ul className="space-y-2">
                                            {currentSubsectionData.keyPoints.map((point, index) => (
                                              <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                                                <span className="text-amber-800">{point}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      {/* Enhanced Single Page View with Navigation */}
                                      <div className="space-y-6">
                                        {/* Page Navigation Header */}
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                          <div className="flex items-center gap-3">
                                            <BookOpen className="h-5 w-5 text-blue-600" />
                                            <div>
                                              <h6 className="font-semibold text-slate-800">
                                                Content Pages
                                              </h6>
                                              <p className="text-sm text-slate-600">
                                                Page {currentPage + 1} of {currentSubsectionData.pages.length}
                                              </p>
                                            </div>
                                          </div>
                                          
                                          {/* Page Navigation Controls */}
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                              disabled={currentPage === 0}
                                              className="flex items-center gap-1"
                                            >
                                              <ChevronLeft className="h-3 w-3" />
                                              Prev Page
                                            </Button>
                                            
                                            <div className="flex items-center gap-1 px-3">
                                              {currentSubsectionData.pages.map((_, pageIndex) => (
                                                <button
                                                  key={pageIndex}
                                                  onClick={() => setCurrentPage(pageIndex)}
                                                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                                                    currentPage === pageIndex
                                                      ? "bg-blue-600 text-white shadow-md"
                                                      : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
                                                  }`}
                                                >
                                                  {pageIndex + 1}
                                                </button>
                                              ))}
                                            </div>
                                            
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setCurrentPage(Math.min(currentSubsectionData.pages.length - 1, currentPage + 1))}
                                              disabled={currentPage === currentSubsectionData.pages.length - 1}
                                              className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3"
                                            >
                                              <span className="hidden sm:inline">Next Page</span>
                                              <span className="sm:hidden">Next</span>
                                              <ChevronRight className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Current Page Content */}
                                        <AnimatePresence mode="wait">
                                          {(() => {
                                            const currentPageData = currentSubsectionData.pages[currentPage]
                                            if (!currentPageData) return null
                                            
                                            const pageContent = currentPageData.html || currentPageData.content || currentPageData.generatedMarkdown || "Page content will be available soon."
                                            const pageTitle = currentPageData.pageTitle || currentPageData.title || `Page ${currentPageData.pageNumber || currentPage + 1}`
                                            const isPageCompleted = completedPages.has(`${currentModule}-${currentSubsection}-${currentPage}`)
                                            
                                            return (
                                              <motion.div
                                                key={`page-${currentModule}-${currentSubsection}-${currentPage}`}
                                                className="border border-slate-200 rounded-lg overflow-hidden shadow-sm"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                              >
                                                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                                    <h6 className="font-medium text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                                                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                                      {pageTitle}
                                                    </h6>
                                                    <div className="flex items-center gap-2">
                                                      <Badge variant="outline" className="text-xs">
                                                        Page {currentPageData.pageNumber || currentPage + 1}
                                                      </Badge>
                                                      {!isPageCompleted && (
                                                        <Button
                                                          onClick={() => markPageComplete(currentModule, currentSubsection, currentPage)}
                                                          size="sm"
                                                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 sm:px-3 py-1"
                                                        >
                                                          <CheckCircle className="h-3 w-3 mr-1" />
                                                          <span className="hidden sm:inline">Mark Complete</span>
                                                          <span className="sm:hidden">Done</span>
                                                        </Button>
                                                      )}
                                                      {isPageCompleted && (
                                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                                          <CheckCircle className="h-3 w-3 mr-1" />
                                                          <span className="hidden sm:inline">Completed</span>
                                                          <span className="sm:hidden">Done</span>
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                <div className="p-4 sm:p-6 lg:p-8">
                                                  {/* Main content with enhanced math rendering */}
                                                  <div className="mb-4 sm:mb-6">
                                                    <ReliableMathRenderer
                                                      content={pageContent}
                                                      className="prose prose-sm sm:prose-lg max-w-none text-slate-700"
                                                      showMetrics={false}
                                                    />
                                                  </div>
                                                  
                                                  {/* Key takeaway section */}
                                                  {currentPageData.keyTakeaway && (
                                                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                                      <div className="flex items-start gap-3">
                                                        <Lightbulb className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                          <p className="font-medium text-green-900 text-sm mb-1">Key Takeaway</p>
                                                          <ReliableMathRenderer
                                                            content={currentPageData.keyTakeaway}
                                                            className="text-green-800 text-sm prose prose-sm max-w-none"
                                                            showMetrics={false}
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                                
                                                {/* Page Navigation Footer */}
                                                <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4">
                                                  <div className="flex items-center justify-between">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                                      disabled={currentPage === 0}
                                                      className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-xs sm:text-sm px-2 sm:px-4"
                                                    >
                                                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                                                      <span className="hidden sm:inline">Previous Page</span>
                                                      <span className="sm:hidden">Prev</span>
                                                    </Button>
                                                    
                                                    <div className="text-xs sm:text-sm text-slate-500">
                                                      Page {currentPage + 1} of {currentSubsectionData.pages.length}
                                                    </div>
                                                    
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setCurrentPage(Math.min(currentSubsectionData.pages.length - 1, currentPage + 1))}
                                                      disabled={currentPage === currentSubsectionData.pages.length - 1}
                                                      className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-xs sm:text-sm px-2 sm:px-4"
                                                    >
                                                      <span className="hidden sm:inline">Next Page</span>
                                                      <span className="sm:hidden">Next</span>
                                                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </motion.div>
                                            )
                                          })()}
                                        </AnimatePresence>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Enhanced fallback content display with better content handling */
                                    <div className="space-y-4">
                                      {/* Display any available summary */}
                                      {currentSubsectionData?.summary && (
                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                                          <h6 className="font-semibold text-blue-900 mb-2">Summary</h6>
                                          <ReliableMathRenderer
                                            content={currentSubsectionData.summary}
                                            className="text-blue-900 prose max-w-none"
                                            showMetrics={false}
                                          />
                                        </div>
                                      )}
                                      
                                      {/* Main content */}
                                      <ReliableMathRenderer
                                        content={
                                          currentSubsectionData?.content || 
                                          currentSubsectionData?.generatedMarkdown ||
                                          currentSubsectionData?.html ||
                                          "Section content will be displayed here."
                                        }
                                        className="prose prose-lg max-w-none"
                                        showMetrics={false}
                                      />
                                      
                                      {/* Display any objectives */}
                                      {currentSubsectionData?.objectives && currentSubsectionData.objectives.length > 0 && (
                                        <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                                          <h6 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                            <Target className="h-4 w-4" />
                                            Learning Objectives
                                          </h6>
                                          <ul className="space-y-2">
                                            {currentSubsectionData.objectives.map((objective, index) => (
                                              <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                                                <span className="text-amber-800">{objective}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      {/* Display examples if available */}
                                      {currentSubsectionData?.examples && currentSubsectionData.examples.length > 0 && (
                                        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                                          <h6 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                            <Lightbulb className="h-4 w-4" />
                                            Examples
                                          </h6>
                                          <div className="space-y-3">
                                            {currentSubsectionData.examples.map((example, index) => (
                                              <div key={index} className="bg-white p-3 rounded border border-green-100">
                                                <ReliableMathRenderer
                                                  content={example}
                                                  className="text-green-800 prose prose-sm max-w-none"
                                                  showMetrics={false}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          /* Enhanced fallback to module content if no subsections */
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <Play className="h-5 w-5 text-blue-600" />
                              Module Content
                            </h4>
                            
                            {/* Module summary if available */}
                            {currentModuleData?.summary && currentModuleData.summary !== currentModuleData?.content && (
                              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                                <h6 className="font-semibold text-blue-900 mb-2">Module Summary</h6>
                                <ReliableMathRenderer
                                  content={currentModuleData.summary}
                                  className="text-blue-900 prose max-w-none"
                                  showMetrics={false}
                                />
                              </div>
                            )}
                            
                            {/* Main module content */}
                            <div className="prose prose-lg max-w-none mb-4">
                              <ReliableMathRenderer
                                content={
                                  currentModuleData?.content || 
                                  currentModuleData?.generatedMarkdown ||
                                  "Interactive learning materials and resources for this module will be displayed here."
                                }
                                className="prose prose-lg max-w-none"
                                showMetrics={false}
                              />
                            </div>
                            
                            {/* Module objectives */}
                            {currentModuleData?.objectives && currentModuleData.objectives.length > 0 && (
                              <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                                <h6 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Module Objectives
                                </h6>
                                <ul className="space-y-2">
                                  {currentModuleData.objectives.map((objective, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                                      <span className="text-amber-800">{objective}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Module topics */}
                            {currentModuleData?.topics && currentModuleData.topics.length > 0 && (
                              <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                                <h6 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  Topics Covered
                                </h6>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {currentModuleData.topics.map((topic, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <ChevronRight className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                                      <span className="text-green-800">{topic}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Enhanced Navigation Controls */}
                        <motion.div 
                          className="pt-4 sm:pt-6 border-t border-slate-200"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (currentSubsection > 0) {
                                    setCurrentSubsection(currentSubsection - 1)
                                    setCurrentPage(0)
                                  } else if (currentModule > 0) {
                                    setCurrentModule(currentModule - 1)
                                    const prevModuleSubsections = createAcademicSubsections(modules[currentModule - 1])
                                    setCurrentSubsection(prevModuleSubsections.length - 1)
                                    setCurrentPage(0)
                                  }
                                }}
                                disabled={currentModule === 0 && currentSubsection === 0}
                                className="group flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
                              >
                                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                                <div className="text-left">
                                  <div className="font-medium text-sm sm:text-base">Previous</div>
                                  <div className="text-xs text-slate-500">
                                    {currentSubsection > 0 
                                      ? `Section ${currentSubsection}`
                                      : currentModule > 0 
                                      ? `Module ${currentModule}`
                                      : "Start"
                                    }
                                  </div>
                                </div>
                              </Button>
                            </motion.div>
                            
                            <div className="text-center order-first sm:order-none">
                              <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-3 sm:px-4 py-2 rounded-full border border-blue-100">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                                    <span className="hidden sm:inline">Module {currentModule + 1} of {modules.length}</span>
                                    <span className="sm:hidden">M{currentModule + 1}/{modules.length}</span>
                                  </span>
                                </div>
                                {subsections.length > 0 && (
                                  <>
                                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <FileText className="h-2 w-2 sm:h-3 sm:w-3 text-purple-600" />
                                      <span className="text-xs text-slate-600">
                                        <span className="hidden sm:inline">Section {currentSubsection + 1} of {subsections.length}</span>
                                        <span className="sm:hidden">S{currentSubsection + 1}/{subsections.length}</span>
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {/* Mini progress indicator */}
                              <div className="mt-2 flex justify-center">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.min(modules.length, 10) }, (_, i) => (
                                    <div
                                      key={i}
                                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                                        i < currentModule
                                          ? "bg-green-400"
                                          : i === currentModule
                                          ? "bg-blue-500"
                                          : "bg-slate-200"
                                      }`}
                                    />
                                  ))}
                                  {modules.length > 10 && (
                                    <span className="text-xs text-slate-400 ml-1">+{modules.length - 10}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (currentSubsection < subsections.length - 1) {
                                    setCurrentSubsection(currentSubsection + 1)
                                    setCurrentPage(0)
                                  } else if (currentModule < modules.length - 1) {
                                    setCurrentModule(currentModule + 1)
                                    setCurrentSubsection(0)
                                    setCurrentPage(0)
                                  }
                                }}
                                disabled={
                                  currentModule === modules.length - 1 &&
                                  (subsections.length === 0 || currentSubsection === subsections.length - 1)
                                }
                                className="group flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
                              >
                                <div className="text-right">
                                  <div className="font-medium text-sm sm:text-base">Next</div>
                                  <div className="text-xs text-slate-500">
                                    {currentSubsection < subsections.length - 1
                                      ? `Section ${currentSubsection + 2}`
                                      : currentModule < modules.length - 1
                                      ? `Module ${currentModule + 2}`
                                      : "Complete"
                                    }
                                  </div>
                                </div>
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                              </Button>
                            </motion.div>
                          </div>
                          
                          {/* Progress summary */}
                          <div className="mt-3 sm:mt-4 text-center">
                            <div className="inline-flex flex-wrap items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-100 rounded-full text-xs">
                              <Trophy className="h-3 w-3 text-amber-500" />
                              <span className="text-slate-600">
                                <span className="hidden sm:inline">{completedPages.size} pages completed</span>
                                <span className="sm:hidden">{completedPages.size}p</span>
                              </span>
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <span className="text-slate-600">
                                <span className="hidden sm:inline">{completedSubsections.size} sections completed</span>
                                <span className="sm:hidden">{completedSubsections.size}s</span>
                              </span>
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <span className="text-slate-600">
                                <span className="hidden sm:inline">{Math.round((completedModules.size / modules.length) * 100)}% course progress</span>
                                <span className="sm:hidden">{Math.round((completedModules.size / modules.length) * 100)}%</span>
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                )
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">No Modules Available</h3>
                    <p className="text-slate-500">This course doesn't have any modules configured yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="assignments">
              <Card>
                <CardHeader>
                  <CardTitle>Course Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {viewerCourse.assignments?.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {viewerCourse.assignments.map((assignment, index) => (
                        <div key={index} className="p-3 sm:p-4 border border-slate-200 rounded-lg">
                          <h4 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">
                            {assignment.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 mb-3">
                            {assignment.description}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              <span>{assignment.points} points</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">No Assignments</h3>
                      <p className="text-slate-500">No assignments have been created for this course yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                    Course Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Get resources from current module or course level
                    const moduleResources = currentModuleData?.resources
                    const courseResources = viewerCourse.resources
                    
                    // Resource categories with icons
                    const resourceCategories = {
                      readings: { icon: BookOpen, label: "Required Readings", color: "blue" },
                      videos: { icon: Video, label: "Video Lectures", color: "red" },
                      articles: { icon: FileText, label: "Articles & Papers", color: "green" },
                      tools: { icon: Target, label: "Tools & Software", color: "purple" },
                      links: { icon: Lightbulb, label: "External Links", color: "amber" }
                    }

                    const hasAnyResources = moduleResources || courseResources

                    if (!hasAnyResources) {
                      return (
                        <div className="text-center py-12">
                          <Lightbulb className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-600 mb-2">No Resources Available</h3>
                          <p className="text-slate-500">Resources will be added to support your learning journey.</p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-6">
                        {/* Module-specific resources */}
                        {moduleResources && (
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                              Resources for {currentModuleData?.title || `Module ${currentModule + 1}`}
                            </h3>
                            <div className="grid gap-4">
                              {Object.entries(resourceCategories).map(([key, { icon: Icon, label, color }]) => {
                                const resources = moduleResources[key] || []
                                if (resources.length === 0) return null

                                return (
                                  <Card key={key} className="border-l-4" style={{ borderLeftColor: `rgb(var(--color-${color}-500))` }}>
                                    <CardContent className="p-4">
                                      <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                        <Icon className={`h-4 w-4 text-${color}-600`} />
                                        {label} ({resources.length})
                                      </h4>
                                      <ul className="space-y-2">
                                        {resources.map((resource, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-${color}-400 mt-2 flex-shrink-0`}></div>
                                            {typeof resource === 'string' ? (
                                              <span className="text-sm text-slate-700">{resource}</span>
                                            ) : (
                                              <div>
                                                <a 
                                                  href={resource.url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className={`text-sm font-medium text-${color}-600 hover:text-${color}-800 hover:underline`}
                                                >
                                                  {resource.title}
                                                </a>
                                                {resource.description && (
                                                  <p className="text-xs text-slate-500 mt-1">{resource.description}</p>
                                                )}
                                              </div>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Course-level resources */}
                        {courseResources && (
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <GraduationCap className="h-5 w-5 text-purple-600" />
                              Course Resources
                            </h3>
                            <div className="grid gap-4">
                              {Object.entries(resourceCategories).map(([key, { icon: Icon, label, color }]) => {
                                const resources = courseResources[key] || []
                                if (resources.length === 0) return null

                                return (
                                  <Card key={key} className="border-l-4" style={{ borderLeftColor: `rgb(var(--color-${color}-500))` }}>
                                    <CardContent className="p-4">
                                      <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                        <Icon className={`h-4 w-4 text-${color}-600`} />
                                        {label} ({resources.length})
                                      </h4>
                                      <ul className="space-y-2">
                                        {resources.map((resource, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-${color}-400 mt-2 flex-shrink-0`}></div>
                                            {typeof resource === 'string' ? (
                                              <span className="text-sm text-slate-700">{resource}</span>
                                            ) : (
                                              <div>
                                                <a 
                                                  href={resource.url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className={`text-sm font-medium text-${color}-600 hover:text-${color}-800 hover:underline`}
                                                >
                                                  {resource.title}
                                                </a>
                                                {resource.description && (
                                                  <p className="text-xs text-slate-500 mt-1">{resource.description}</p>
                                                )}
                                              </div>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {Math.round(getProgressPercentage())}%
                      </div>
                      <p className="text-slate-600">Overall Progress</p>
                      <Progress value={getProgressPercentage()} className="mt-4" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                          {completedModules.size}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600">Modules Completed</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-slate-600 mb-1">
                          {(viewerCourse.modules?.length || 0) - completedModules.size}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600">Modules Remaining</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                          {viewerCourse.credits || 3}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600">Credits</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  )
}