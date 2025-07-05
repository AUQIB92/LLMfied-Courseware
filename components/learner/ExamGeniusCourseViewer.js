"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
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
  Lock,
  Unlock,
  TrendingUp,
  BarChart3,
  Sparkles,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react"

export default function ExamGeniusCourseViewer({ course, onBack, onProgress }) {
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
  const [showModuleList, setShowModuleList] = useState(true)

  const modules = course.modules || []
  const currentModuleData = modules[currentModule]
  const subsections = currentModuleData?.detailedSubsections || []
  const currentSubsectionData = subsections[currentSubsection]
  const pages = currentSubsectionData?.pages || []

  useEffect(() => {
    // Initialize progress tracking
    const savedProgress = localStorage.getItem(`exam-progress-${course._id}`)
    if (savedProgress) {
      const progress = JSON.parse(savedProgress)
      setCompletedModules(new Set(progress.completedModules || []))
      setCompletedSubsections(new Set(progress.completedSubsections || []))
    }
  }, [course._id])

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

  // Enhanced Rich text formatting helper for beautiful text display
  const formatRichText = (text) => {
    if (!text) return ''
    
    return text
      .split('\n\n')
      .map(paragraph => {
        let formatted = paragraph.trim()
        
        // Handle markdown headers (# ## ### #### ##### ######)
        if (formatted.match(/^#{1,6}\s/)) {
          const headerLevel = formatted.match(/^(#{1,6})/)[1].length
          const headerText = formatted.replace(/^#{1,6}\s/, '')
          
          const headerStyles = {
            1: 'text-3xl font-bold text-orange-700 mb-6 mt-8 first:mt-0 border-b-2 border-orange-200 pb-2',
            2: 'text-2xl font-bold text-orange-600 mb-5 mt-7 first:mt-0',
            3: 'text-xl font-bold text-emerald-700 mb-4 mt-6 first:mt-0 flex items-center gap-2',
            4: 'text-lg font-bold text-emerald-600 mb-3 mt-5 first:mt-0',
            5: 'text-base font-bold text-gray-700 mb-2 mt-4 first:mt-0',
            6: 'text-sm font-bold text-gray-600 mb-2 mt-3 first:mt-0'
          }
          
          const headerClass = headerStyles[headerLevel] || headerStyles[3]
          
          if (headerLevel === 3) {
            return `<h${headerLevel} class="${headerClass}">
              <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
              ${headerText}
            </h${headerLevel}>`
          } else {
            return `<h${headerLevel} class="${headerClass}">${headerText}</h${headerLevel}>`
          }
        }
        
        // Check if this is a section header (starts with ** and ends with ** on its own line)
        if (formatted.match(/^\*\*[^*]+\*\*$/) && formatted.trim().length > 4 && !formatted.includes(' **')) {
          const headerText = formatted.replace(/\*\*/g, '')
          return `<h4 class="text-xl font-bold text-emerald-700 mb-4 mt-6 first:mt-0 flex items-center gap-2">
            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
            ${headerText}
          </h4>`
        }
        
        // Format bold text (**text** -> <strong>text</strong>) - handle inline bold
        formatted = formatted.replace(/\*\*([^*\n]+?)\*\*/g, '<strong class="font-bold text-emerald-800 bg-emerald-50 px-1 rounded">$1</strong>')
        
        // Format inline math ($equation$ -> styled math)
        formatted = formatted.replace(/\$([^$]+)\$/g, '<span class="inline-flex items-center bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 text-blue-900 px-4 py-2 rounded-xl font-mono text-sm border-2 border-blue-300 mx-1 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">✨ $1</span>')
        
        // Format block math ($$equation$$ -> styled block math)
        formatted = formatted.replace(/\$\$([^$]+)\$\$/g, '<div class="my-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-center"><span class="font-mono text-lg text-blue-800">$1</span></div>')
        
        // Format code blocks (`code` -> styled code)
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-mono text-sm border border-emerald-200">$1</code>')
        
        // Format italic text (*text* -> <em>text</em>)
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic text-emerald-700 font-medium">$1</em>')
        
        // Format single-quoted text ('text' -> <em>text</em>)
        formatted = formatted.replace(/'([^']+)'/g, '<em class="italic text-emerald-600">$1</em>')
        
        // Format links [text](url) -> styled links
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors duration-200">$1 <span class="text-xs">↗</span></a>')
        
        // Format numbered lists (1. item -> styled list)
        if (formatted.match(/^\d+\.\s/)) {
          formatted = formatted.replace(/^(\d+)\.\s(.*)/, '<div class="flex items-start gap-3 mb-3"><div class="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">$1</div><div>$2</div></div>')
          return formatted
        }
        
        // Format bullet points (- item or • item -> styled list)
        if (formatted.match(/^[-•]\s/)) {
          formatted = formatted.replace(/^[-•]\s(.*)/, '<div class="flex items-start gap-3 mb-3"><div class="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-3"></div><div>$1</div></div>')
          return formatted
        }
        
        return `<p class="mb-4 last:mb-0 leading-relaxed text-gray-700">${formatted}</p>`
      })
      .join('')
  }

  // Handle mouse hover for sidebar
  const handleMouseEnter = () => {
    setSidebarVisible(true)
  }

  const handleMouseLeave = () => {
    setSidebarVisible(false)
  }

  const handleModuleSelect = (moduleIndex) => {
    setCurrentModule(moduleIndex)
    setCurrentSubsection(0)
    setCurrentPage(0)
    setShowModuleList(false)
    setSidebarVisible(false)
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
        <div className="flex gap-8">
          {/* Sidebar - Module Navigation */}
          <div 
            className={`transition-all duration-300 ${
              sidebarVisible ? 'w-80 opacity-100' : 'w-0 opacity-0'
            } overflow-hidden`}
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
                <div className="space-y-1 p-4">
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
          <div className="flex-1">
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
                            <div 
                              className="whitespace-pre-wrap text-gray-700"
                              dangerouslySetInnerHTML={{ __html: formatRichText(currentModuleData.content) }}
                            />
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
                                <div 
                                  className="text-gray-700 flex-1"
                                  dangerouslySetInnerHTML={{ __html: formatRichText(objective) }}
                                />
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
                                    <div 
                                      className="text-gray-700 whitespace-pre-wrap"
                                      dangerouslySetInnerHTML={{ __html: formatRichText(example) }}
                                    />
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
                  <TabsContent value="subsections" className="p-6">
                    <div className="space-y-6">
                      {subsections.length === 0 ? (
                        <div className="text-center py-12">
                          <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No detailed subsections available</p>
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
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      isCompleted 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-orange-500 text-white'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle className="h-5 w-5" />
                                      ) : (
                                        <span className="font-bold">{index + 1}</span>
                                      )}
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg">{subsection.title}</CardTitle>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {subsection.estimatedTime || 15} min • {subsection.difficulty || 'medium'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleSection(sectionKey)}
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
                                <CardContent className="space-y-6">
                                  {/* Subsection Content */}
                                  <div className="bg-white p-4 rounded-lg border">
                                    <h4 className="font-semibold text-gray-800 mb-3">Content</h4>
                                    <div className="prose max-w-none">
                                      {/* Display pages if available */}
                                      {subsection.pages && subsection.pages.length > 0 ? (
                                        <div className="space-y-6">
                                          {subsection.pages.map((page, pageIndex) => (
                                            <div key={pageIndex} className="border-l-4 border-orange-500 pl-4 py-2">
                                              <h5 className="font-bold text-gray-800 mb-2">
                                                {page.pageTitle || `Page ${page.pageNumber || pageIndex + 1}`}
                                              </h5>
                                              <div 
                                                className="whitespace-pre-wrap text-gray-700 mb-3"
                                                dangerouslySetInnerHTML={{ __html: formatRichText(page.content || '') }}
                                              />
                                              {page.keyTakeaway && (
                                                <div className="bg-orange-50 p-3 rounded-lg">
                                                  <p className="text-sm font-medium text-orange-800">
                                                    <span className="font-bold">Key Takeaway:</span> {page.keyTakeaway}
                                                  </p>
                                                </div>
                                              )}
                                              {page.mathematicalContent && page.mathematicalContent.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                  {page.mathematicalContent.map((math, mathIndex) => (
                                                    <div key={mathIndex} className="bg-blue-50 p-3 rounded-lg">
                                                      <p className="text-sm font-bold text-blue-800">{math.title}</p>
                                                      <p className="text-sm text-blue-700 mt-1">{math.content}</p>
                                                      {math.explanation && (
                                                        <p className="text-sm text-gray-600 mt-2">{math.explanation}</p>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        /* Fallback to other content fields */
                                        <>
                                          {(subsection.content || subsection.explanation || subsection.summary) ? (
                                            <div 
                                              className="whitespace-pre-wrap text-gray-700"
                                              dangerouslySetInnerHTML={{ 
                                                __html: formatRichText(subsection.content || subsection.explanation || subsection.summary) 
                                              }}
                                            />
                                          ) : (
                                            <p className="text-gray-500 italic">No content available</p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quiz Section */}
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                      <Brain className="h-5 w-5 text-purple-600" />
                                      Practice Quizzes
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {['Easy', 'Medium', 'Hard'].map((difficulty) => {
                                        const result = quizResults[difficulty]
                                        const hasQuiz = hasQuizForSubsection(currentModule, index, difficulty)
                                        const quizData = getQuizForSubsection(currentModule, index, difficulty)
                                        
                                        return (
                                          <div key={difficulty} className="bg-white p-4 rounded-lg border">
                                            <div className="flex items-center justify-between mb-3">
                                              <Badge className={`${
                                                difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                                difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                              }`}>
                                                {difficulty}
                                              </Badge>
                                              {result && (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                  {result.score}%
                                                </Badge>
                                              )}
                                              {hasQuiz && (
                                                <Badge className="bg-purple-100 text-purple-800">
                                                  {quizData?.totalQuestions || quizData?.questions?.length || 0} Q
                                                </Badge>
                                              )}
                                            </div>
                                            {hasQuiz ? (
                                              <Button
                                                size="sm"
                                                className={`w-full ${
                                                  difficulty === 'Easy' ? 'bg-green-500 hover:bg-green-600' :
                                                  difficulty === 'Medium' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                                  'bg-red-500 hover:bg-red-600'
                                                }`}
                                                onClick={() => handleQuizStart(difficulty, subsection, index)}
                                                disabled={isQuizLoading}
                                              >
                                                {isQuizLoading && selectedQuizDifficulty === difficulty ? (
                                                  <>
                                                    <Timer className="h-4 w-4 mr-2 animate-spin" />
                                                    Loading...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Trophy className="h-4 w-4 mr-2" />
                                                    {result ? 'Retake' : 'Take'} Quiz
                                                  </>
                                                )}
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full cursor-not-allowed opacity-50"
                                                disabled
                                              >
                                                <X className="h-4 w-4 mr-2" />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(resourceCategories).map(([category, { icon: Icon, label, color }]) => {
                            const resources = currentModuleData.resources[category]
                            if (!resources || resources.length === 0) return null
                            
                            return (
                              <Card key={category} className="border-2 hover:border-blue-300 transition-colors">
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center gap-2 text-lg">
                                    <Icon className={`h-5 w-5 text-${color}-500`} />
                                    {label}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {resources.map((resource, index) => (
                                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className={`w-8 h-8 rounded-full bg-${color}-100 flex items-center justify-center`}>
                                          <Icon className={`h-4 w-4 text-${color}-600`} />
                                        </div>
                                        <div className="flex-1">
                                          {typeof resource === 'string' ? (
                                            <p className="text-sm font-medium text-gray-800">{resource}</p>
                                          ) : resource && typeof resource === 'object' ? (
                                            <div className="space-y-1">
                                              <p className="text-sm font-medium text-gray-800">
                                                {resource.title || resource.name || 'Untitled Resource'}
                                              </p>
                                              {resource.author && (
                                                <p className="text-xs text-gray-600">by {resource.author}</p>
                                              )}
                                              {resource.description && (
                                                <p className="text-xs text-gray-500 line-clamp-2">{resource.description}</p>
                                              )}
                                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                                {resource.year && <span>{resource.year}</span>}
                                                {resource.difficulty && <span>• {resource.difficulty}</span>}
                                                {resource.examRelevance && <span>• {resource.examRelevance}</span>}
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-sm font-medium text-gray-800">Invalid resource</p>
                                          )}
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
                                          {typeof resource === 'object' && resource?.url ? (
                                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                              <ArrowRight className="h-4 w-4" />
                                            </a>
                                          ) : (
                                            <ArrowRight className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
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
          <CardTitle className="text-lg">{currentQ?.question}</CardTitle>
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
                  <span>{option}</span>
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