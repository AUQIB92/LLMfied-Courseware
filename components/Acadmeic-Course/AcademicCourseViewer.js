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

  // Keyboard navigation for subsections
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== "modules" || !viewerCourse) return
      
      if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
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
        const subsections = createAcademicSubsections(modules[currentModule])
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
  }, [activeTab, currentModule, currentSubsection, modules, viewerCourse])

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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {viewerCourse.assessmentCriteria.assignments}%
                        </div>
                        <div className="text-sm text-slate-600">Assignments</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {viewerCourse.assessmentCriteria.quizzes}%
                        </div>
                        <div className="text-sm text-slate-600">Quizzes</div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600 mb-1">
                          {viewerCourse.assessmentCriteria.midterm}%
                        </div>
                        <div className="text-sm text-slate-600">Midterm</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {viewerCourse.assessmentCriteria.final}%
                        </div>
                        <div className="text-sm text-slate-600">Final</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="modules" className="space-y-4">
              {modules?.length > 0 ? (
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
                            onClick={() => {
                              setCurrentModule(index)
                              setCurrentSubsection(0)
                              setCurrentPage(0)
                            }}
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
                                  <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
                                    <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">Ctrl</kbd>
                                    <span>+</span>
                                    <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">←→</kbd>
                                    <span>to navigate</span>
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {Math.round((completedSubsections.size / subsections.length) * 100)}% completed
                                </div>
                              </div>
                              
                              {/* Desktop Pagination - Show all sections */}
                              <div className="hidden md:block">
                                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                                  {subsections.map((subsection, index) => {
                                    const isCompleted = completedSubsections.has(`${currentModule}-${index}`)
                                    const isCurrent = currentSubsection === index
                                    const isVisited = index < currentSubsection || isCompleted
                                    
                                    return (
                                      <div key={index} className="flex items-center">
                                        <motion.button
                                          onClick={() => {
                                            setCurrentSubsection(index)
                                            setCurrentPage(0)
                                          }}
                                          className={`relative group transition-all duration-300 ease-in-out ${
                                            isCurrent
                                              ? "scale-110"
                                              : "hover:scale-105"
                                          }`}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                        >
                                          <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                                            border-2 transition-all duration-300 ${
                                              isCurrent
                                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400 shadow-lg shadow-blue-200"
                                                : isCompleted
                                                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400 shadow-md shadow-green-200"
                                                : isVisited
                                                ? "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
                                                : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                                            }
                                          `}>
                                            {isCompleted ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <span>{index + 1}</span>
                                            )}
                                          </div>
                                          
                                          {/* Tooltip */}
                                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                            <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                              {subsection.title || `Section ${index + 1}`}
                                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                          </div>
                                        </motion.button>
                                        
                                        {/* Progress connector */}
                                        {index < subsections.length - 1 && (
                                          <div className="flex-1 h-0.5 mx-2 relative">
                                            <div className="absolute inset-0 bg-slate-200 rounded-full"></div>
                                            <motion.div
                                              className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                                              initial={{ width: "0%" }}
                                              animate={{ 
                                                width: isCompleted || index < currentSubsection ? "100%" : "0%" 
                                              }}
                                              transition={{ duration: 0.3 }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                              
                              {/* Mobile Pagination - Compact view */}
                              <div className="md:hidden">
                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newSubsection = Math.max(0, currentSubsection - 1)
                                        setCurrentSubsection(newSubsection)
                                        setCurrentPage(0)
                                      }}
                                      disabled={currentSubsection === 0}
                                      className="flex items-center gap-1"
                                    >
                                      <ChevronLeft className="h-3 w-3" />
                                      Prev
                                    </Button>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="text-center">
                                        <div className="text-sm font-semibold text-slate-800">
                                          {subsections[currentSubsection]?.title || `Section ${currentSubsection + 1}`}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {currentSubsection + 1} of {subsections.length}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCurrentSubsection(Math.min(subsections.length - 1, currentSubsection + 1))}
                                      disabled={currentSubsection === subsections.length - 1}
                                      className="flex items-center gap-1"
                                    >
                                      Next
                                      <ChevronRight className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  {/* Progress bar */}
                                  <div className="relative">
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${((currentSubsection + 1) / subsections.length) * 100}%` }}
                                        transition={{ duration: 0.3 }}
                                      />
                                    </div>
                                    <div className="absolute inset-0 flex justify-between items-center px-1">
                                      {subsections.map((_, index) => {
                                        const isCompleted = completedSubsections.has(`${currentModule}-${index}`)
                                        const isCurrent = currentSubsection === index
                                        
                                        return (
                                          <div
                                            key={index}
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              isCurrent
                                                ? "bg-white shadow-sm"
                                                : isCompleted
                                                ? "bg-green-400"
                                                : "bg-slate-300"
                                            }`}
                                          />
                                        )
                                      })}
                                    </div>
                                  </div>
                                  
                                  {/* Section grid for quick access */}
                                  <div className="mt-3 pt-3 border-t border-slate-100">
                                    <div className="grid grid-cols-4 gap-1">
                                      {subsections.map((subsection, index) => {
                                        const isCompleted = completedSubsections.has(`${currentModule}-${index}`)
                                        const isCurrent = currentSubsection === index
                                        
                                        return (
                                          <button
                                            key={index}
                                            onClick={() => {
                                            setCurrentSubsection(index)
                                            setCurrentPage(0)
                                          }}
                                            className={`p-2 rounded text-xs font-medium transition-all duration-200 ${
                                              isCurrent
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : isCompleted
                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                          >
                                            {isCompleted && <CheckCircle className="h-2 w-2 mx-auto mb-0.5" />}
                                            <div className="truncate">
                                              {subsection.title?.split(' ').slice(0, 2).join(' ') || `S${index + 1}`}
                                            </div>
                                          </button>
                                        )
                                      })}
                                    </div>
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
                                      
                                      {/* Enhanced Pages content with proper handling of markdown and HTML */}
                                      <div className="space-y-4">
                                        <h6 className="font-semibold text-slate-800 flex items-center gap-2">
                                          <BookOpen className="h-4 w-4 text-blue-600" />
                                          Content Pages ({currentSubsectionData.pages.length} pages)
                                        </h6>
                                        {currentSubsectionData.pages.map((page, pageIndex) => {
                                          // Handle different content formats from the API
                                          const pageContent = page.html || page.content || page.generatedMarkdown || "Page content will be available soon."
                                          const pageTitle = page.pageTitle || page.title || `Page ${page.pageNumber || pageIndex + 1}`
                                          
                                          return (
                                            <div key={pageIndex} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3 border-b border-slate-200">
                                                <div className="flex items-center justify-between">
                                                  <h6 className="font-medium text-slate-800 flex items-center gap-2">
                                                    <BookOpen className="h-3 w-3 text-blue-600" />
                                                    {pageTitle}
                                                  </h6>
                                                  <Badge variant="outline" className="text-xs">
                                                    Page {page.pageNumber || pageIndex + 1}
                                                  </Badge>
                                                </div>
                                              </div>
                                              <div className="p-6">
                                                {/* Main content with enhanced math rendering */}
                                                <div className="mb-4">
                                                  <ReliableMathRenderer
                                                    content={pageContent}
                                                    className="prose prose-lg max-w-none text-slate-700"
                                                    showMetrics={false}
                                                  />
                                                </div>
                                                
                                                
                                                {/* Key takeaway section */}
                                                {page.keyTakeaway && (
                                                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                      <Lightbulb className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                      <div className="flex-1">
                                                        <p className="font-medium text-green-900 text-sm mb-1">Key Takeaway</p>
                                                        <ReliableMathRenderer
                                                          content={page.keyTakeaway}
                                                          className="text-green-800 text-sm prose prose-sm max-w-none"
                                                          showMetrics={false}
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })}
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
                          className="pt-6 border-t border-slate-200"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center justify-between">
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (currentSubsection > 0) {
                                    setCurrentSubsection(currentSubsection - 1)
                                  } else if (currentModule > 0) {
                                    setCurrentModule(currentModule - 1)
                                    const prevModuleSubsections = createAcademicSubsections(modules[currentModule - 1])
                                    setCurrentSubsection(prevModuleSubsections.length - 1)
                                  }
                                }}
                                disabled={currentModule === 0 && currentSubsection === 0}
                                className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                                <div className="text-left">
                                  <div className="font-medium">Previous</div>
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
                            
                            <div className="text-center">
                              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-100">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-slate-700">
                                    Module {currentModule + 1} of {modules.length}
                                  </span>
                                </div>
                                {subsections.length > 0 && (
                                  <>
                                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-3 w-3 text-purple-600" />
                                      <span className="text-sm text-slate-600">
                                        Section {currentSubsection + 1} of {subsections.length}
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
                            >
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (currentSubsection < subsections.length - 1) {
                                    setCurrentSubsection(currentSubsection + 1)
                                  } else if (currentModule < modules.length - 1) {
                                    setCurrentModule(currentModule + 1)
                                    setCurrentSubsection(0)
                                  }
                                }}
                                disabled={
                                  currentModule === modules.length - 1 &&
                                  (subsections.length === 0 || currentSubsection === subsections.length - 1)
                                }
                                className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="text-right">
                                  <div className="font-medium">Next</div>
                                  <div className="text-xs text-slate-500">
                                    {currentSubsection < subsections.length - 1
                                      ? `Section ${currentSubsection + 2}`
                                      : currentModule < modules.length - 1
                                      ? `Module ${currentModule + 2}`
                                      : "Complete"
                                    }
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                              </Button>
                            </motion.div>
                          </div>
                          
                          {/* Progress summary */}
                          <div className="mt-4 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs">
                              <Trophy className="h-3 w-3 text-amber-500" />
                              <span className="text-slate-600">
                                {completedSubsections.size} sections completed
                              </span>
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <span className="text-slate-600">
                                {Math.round((completedModules.size / modules.length) * 100)}% course progress
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                    <div className="space-y-4">
                      {viewerCourse.assignments.map((assignment, index) => (
                        <div key={index} className="p-4 border border-slate-200 rounded-lg">
                          <h4 className="font-semibold text-slate-800 mb-2">
                            {assignment.title}
                          </h4>
                          <p className="text-sm text-slate-600 mb-3">
                            {assignment.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {completedModules.size}
                        </div>
                        <div className="text-sm text-slate-600">Modules Completed</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-slate-600 mb-1">
                          {(viewerCourse.modules?.length || 0) - completedModules.size}
                        </div>
                        <div className="text-sm text-slate-600">Modules Remaining</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {viewerCourse.credits || 3}
                        </div>
                        <div className="text-sm text-slate-600">Credits</div>
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