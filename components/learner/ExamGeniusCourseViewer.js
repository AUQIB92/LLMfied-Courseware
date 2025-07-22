"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import MathMarkdownRenderer from "@/components/MathMarkdownRenderer"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Play,
  Trophy,
  Target,
  CheckCircle,
  FileText,
  Video,
  Globe,
  Wrench,
  GraduationCap,
  Lightbulb,
  BarChart3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Crown,
  Brain,
  Timer,
} from "lucide-react"
import ModuleContent from './ModuleContent';
import AITutor from './AITutor';
import QuizModal from './QuizModal'; // Import the QuizModal component

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

export default function ExamGeniusCourseViewer({ course, onBack, onProgress }) {
  const { getAuthHeaders } = useAuth()
  const [viewerCourse, setViewerCourse] = useState(course)
  const [currentModule, setCurrentModule] = useState(0)
  const [currentSubsection, setCurrentSubsection] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [completedModules, setCompletedModules] = useState(new Set())
  const [completedSubsections, setCompletedSubsections] = useState(new Set())
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedQuizDifficulty, setSelectedQuizDifficulty] = useState(null)
  const [quizData, setQuizData] = useState(null)
  const [quizResults, setQuizResults] = useState({})
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [sidebarManuallyToggled, setSidebarManuallyToggled] = useState(false)
  const [loadingDetailedContent, setLoadingDetailedContent] = useState(false)
  const [currentPageTabs, setCurrentPageTabs] = useState({})
  const [selectedResourceCategory, setSelectedResourceCategory] = useState("articles"); // Default to articles
  const [activeContentTab, setActiveContentTab] = useState('content');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  const resourceCategories = {
    books: { icon: BookOpen, label: "Books" },
    courses: { icon: GraduationCap, label: "Courses" },
    articles: { icon: FileText, label: "Articles" },
    videos: { icon: Video, label: "Videos" },
    tools: { icon: Wrench, label: "Tools" },
    websites: { icon: Globe, label: "Websites" },
    exercises: { icon: Target, label: "Exercises" },
  };

  const categoryStyles = {
    books: { text: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-500' },
    courses: { text: 'text-green-600', bg: 'bg-green-100', ring: 'ring-green-500' },
    articles: { text: 'text-purple-600', bg: 'bg-purple-100', ring: 'ring-purple-500' },
    videos: { text: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-500' },
    tools: { text: 'text-orange-600', bg: 'bg-orange-100', ring: 'ring-orange-500' },
    websites: { text: 'text-cyan-600', bg: 'bg-cyan-100', ring: 'ring-cyan-500' },
    exercises: { text: 'text-pink-600', bg: 'bg-pink-100', ring: 'ring-pink-500' },
  };

  const modules = viewerCourse.modules || []
  const currentModuleData = modules[currentModule]
  const subsections = currentModuleData?.detailedSubsections || []
  const currentSubsectionData = subsections?.[currentSubsection]

  useEffect(() => {
    const savedProgress = localStorage.getItem(`exam-progress-${viewerCourse._id}`)
    if (savedProgress) {
      const progress = JSON.parse(savedProgress)
      setCompletedModules(new Set(progress.completedModules || []))
      setCompletedSubsections(new Set(progress.completedSubsections || []))
    }
  }, [viewerCourse._id]);

  useEffect(() => {
    if (viewerCourse.isExamGenius) {
      fetchDetailedContent(currentModule);
    }
  }, [currentModule, viewerCourse.isExamGenius]);

  const fetchDetailedContent = async (moduleIndex) => {
    const module = viewerCourse.modules[moduleIndex];
    if (!module || (module.detailedSubsections && module.detailedSubsections.length > 0)) {
      return;
    }

    try {
      setLoadingDetailedContent(true)
      const response = await fetch(`/api/courses/${viewerCourse._id}/detailed-content?moduleIndex=${moduleIndex}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.detailedSubsections) {
          setViewerCourse(prevCourse => {
            const newModules = [...prevCourse.modules];
            newModules[moduleIndex] = {
              ...newModules[moduleIndex],
              detailedSubsections: data.detailedSubsections,
            };
            return { ...prevCourse, modules: newModules };
          })
        }
      } else {
        toast.error(`Failed to load content for module ${moduleIndex + 1}`);
      }
    } catch (error) {
      toast.error(`An error occurred while loading content.`);
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
    localStorage.setItem(`exam-progress-${viewerCourse._id}`, JSON.stringify(progress))
    onProgress?.(progress)
  }

  const handleQuizStart = (difficulty, subsectionData, subsectionIndex) => {
    if (!subsectionData) {
      toast.error("No subsection data available")
      return
    }

    const quizKey = `${subsectionIndex}_${difficulty.toLowerCase()}`
    const existingQuiz = currentModuleData?.subsectionQuizzes?.[quizKey]

    if (!existingQuiz) {
      toast.error(`No ${difficulty.toLowerCase()} quiz available for this subsection`)
      return
    }

      setQuizData({
        questions: existingQuiz.questions || [],
        subsectionTitle: existingQuiz.subsectionTitle || subsectionData.title,
        difficulty: difficulty.toLowerCase(),
        totalQuestions: existingQuiz.totalQuestions || existingQuiz.questions?.length || 0,
        createdAt: existingQuiz.createdAt
      })
      setSelectedQuizDifficulty(difficulty)
      setShowQuiz(true)
  }

  const handleQuizCompletion = (results) => {
    const quizKey = `${currentModule}-${currentSubsection}-${selectedQuizDifficulty}`
    setQuizResults(prev => ({ ...prev, [quizKey]: results }))
    
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

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) newSet.delete(section)
      else newSet.add(section)
      return newSet
    })
  }

  const ResourceCard = ({ resource, type }) => {
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
            books: { gradient: "from-blue-500/10 via-indigo-500/10 to-purple-500/10", border: "border-blue-200/50", iconBg: "from-blue-500 to-indigo-600", titleColor: "text-blue-700", accent: "blue" },
            courses: { gradient: "from-purple-500/10 via-pink-500/10 to-rose-500/10", border: "border-purple-200/50", iconBg: "from-purple-500 to-pink-600", titleColor: "text-purple-700", accent: "purple" },
            videos: { gradient: "from-red-500/10 via-orange-500/10 to-yellow-500/10", border: "border-red-200/50", iconBg: "from-red-500 to-orange-600", titleColor: "text-red-700", accent: "red" },
            articles: { gradient: "from-green-500/10 via-emerald-500/10 to-teal-500/10", border: "border-green-200/50", iconBg: "from-green-500 to-emerald-600", titleColor: "text-green-700", accent: "green" },
            tools: { gradient: "from-orange-500/10 via-amber-500/10 to-yellow-500/10", border: "border-orange-200/50", iconBg: "from-orange-500 to-amber-600", titleColor: "text-orange-700", accent: "orange" },
            websites: { gradient: "from-indigo-500/10 via-blue-500/10 to-cyan-500/10", border: "border-indigo-200/50", iconBg: "from-indigo-500 to-blue-600", titleColor: "text-indigo-700", accent: "indigo" },
            exercises: { gradient: "from-pink-500/10 via-rose-500/10 to-red-500/10", border: "border-pink-200/50", iconBg: "from-pink-500 to-rose-600", titleColor: "text-pink-700", accent: "pink" }
      }
      return designMap[type] || designMap.articles
    }
    const design = getGradientAndColors();
    const isInstructorChoice = resource.isInstructorChoice;

    return (
      <motion.div variants={cardVariants} whileHover="hover" className="group h-full">
        <Card className={`h-full bg-gradient-to-br ${design.gradient} backdrop-blur-sm border ${design.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden relative`}>
          {isInstructorChoice && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-start gap-4">
              <motion.div className={`p-3 rounded-2xl bg-gradient-to-br ${design.iconBg} shadow-lg group-hover:shadow-xl transition-all duration-300`} whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                {getIcon()}
              </motion.div>
              <div className="flex-1 min-w-0">
                    <CardTitle className={`${design.titleColor} group-hover:${design.titleColor.replace('700', '800')} transition-colors duration-300 text-lg font-bold leading-tight mb-2`}>
                      {resource.title || resource.name}
                    </CardTitle>
                {resource.creator && <p className="text-slate-600 text-sm font-medium">by {resource.creator}</p>}
                {resource.isAIGenerated ? (
                  <motion.div className="mt-2" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-md">
                      <Sparkles className="h-3 w-3 mr-1" /> AI Curated
                    </Badge>
                  </motion.div>
                ) : isInstructorChoice && (
                  <motion.div className="mt-2" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md">
                      <Crown className="h-3 w-3 mr-1" /> Instructor's Choice
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
                  <Badge className={`font-semibold ${resource.difficulty === "Beginner" ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300" : resource.difficulty === "Intermediate" ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-300" : "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-300"}`}>
                    {resource.difficulty}
                  </Badge>
                </div>
              )}
              {resource.url && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                  <Button className={`w-full bg-gradient-to-r ${design.iconBg} hover:from-${design.accent}-600 hover:to-${design.accent}-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/button`} asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <ExternalLink className="h-4 w-4 group-hover/button:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Explore Resource</span>
                    </a>
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {resource.isAIGenerated && <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
          {isInstructorChoice && <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
        </Card>
      </motion.div>
    )
  }

  const getCurrentPageTab = (moduleIndex, subsectionIndex) => {
    const key = `${moduleIndex}-${subsectionIndex}`
    return currentPageTabs[key] || 0
  }

  const setCurrentPageTab = (moduleIndex, subsectionIndex, pageIndex) => {
    const key = `${moduleIndex}-${subsectionIndex}`
    setCurrentPageTabs(prev => ({ ...prev, [key]: pageIndex }))
  }

  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible
    setSidebarVisible(newVisibility)
    setSidebarManuallyToggled(true)
    if (!newVisibility) {
      setTimeout(() => setSidebarManuallyToggled(false), 2000)
    }
  }

  const handleMouseEnter = () => {
    if (!sidebarManuallyToggled) setSidebarVisible(true)
  }

  const handleMouseLeave = () => {
    if (!sidebarManuallyToggled) setSidebarVisible(false)
  }

  const handleModuleSelect = (moduleIndex) => {
    setCurrentModule(moduleIndex)
    setCurrentSubsection(0)
    setCurrentPage(0)
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
                    <CardTitle className="text-2xl font-bold">{selectedQuizDifficulty} Quiz</CardTitle>
                    <p className="text-orange-100 mt-1">{currentSubsectionData?.title} • {currentModuleData?.title}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowQuiz(false)} className="text-white hover:bg-white/20">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <QuizInterface quizData={quizData} onComplete={handleQuizCompletion} difficulty={selectedQuizDifficulty} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="fixed left-0 top-0 w-4 h-full z-50 bg-transparent" onMouseEnter={handleMouseEnter} />
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/20">
                <ChevronLeft className="h-5 w-5 mr-2" /> Back to Library
              </Button>
              <div className="h-8 w-px bg-white/30"></div>
              <Button variant="ghost" size="sm" onClick={toggleSidebar} className="text-white hover:bg-white/20" title={sidebarVisible ? "Hide Modules" : "Show Modules"}>
                <BookOpen className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Modules</span>
                {sidebarVisible ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
              <div className="h-8 w-px bg-white/30"></div>
              <div>
                <h1 className="text-2xl font-bold">{viewerCourse.title}</h1>
                <div className="text-orange-100 flex items-center gap-2 mt-1">
                  <Trophy className="h-4 w-4" /> {viewerCourse.examType} • {viewerCourse.subject}
                  <Badge className="bg-white/20 text-white border-white/30 ml-2">{viewerCourse.level || 'Intermediate'}</Badge>
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
          <div className={`transition-all duration-300 ${sidebarVisible ? 'w-80 lg:w-80 md:w-72 sm:w-64 xs:w-full opacity-100' : 'w-0 opacity-0'} overflow-hidden flex-shrink-0`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <Card className="sticky top-4 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><BookOpen className="h-5 w-5" /> Course Modules</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-6 p-6 min-h-[calc(100vh-8rem)]">
                  {modules.map((module, index) => (
                    <div key={index} className="space-y-2">
                      <Button variant={currentModule === index ? "default" : "ghost"} className={`w-full justify-start text-left h-auto p-3 ${currentModule === index ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "hover:bg-orange-50"}`} onClick={() => handleModuleSelect(index)}>
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completedModules.has(index) ? "bg-green-500 text-white" : currentModule === index ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                            {completedModules.has(index) ? <CheckCircle className="h-4 w-4" /> : <span className="text-sm font-bold">{index + 1}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{module.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={getModuleProgress(index)} className="h-1 flex-1" />
                              <span className="text-xs opacity-70">{getModuleProgress(index)}%</span>
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

          <div className="flex-1 min-w-0">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">{currentModuleData?.title}</CardTitle>
                    <p className="text-slate-300 mt-1">Module {currentModule + 1} of {modules.length}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!completedModules.has(currentModule) && (
                      <Button variant="outline" size="sm" onClick={markModuleComplete} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Complete
                      </Button>
                    )}
                    <Badge className="bg-white/20 text-white border-white/30">{subsections.length} subsections</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-50">
                    <TabsTrigger value="content" className="flex items-center gap-2"><FileText className="h-4 w-4" />Content</TabsTrigger>
                    <TabsTrigger value="subsections" className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Subsections</TabsTrigger>
                    <TabsTrigger value="resources" className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Resources</TabsTrigger>
                    <TabsTrigger value="progress" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Progress</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="p-6">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Module Overview</h3>
                        <div className="prose max-w-none">
                          {currentModuleData?.content ? <MathMarkdownRenderer content={currentModuleData.content} /> : <p className="text-gray-500 italic">No content available</p>}
                        </div>
                      </div>
                      {currentModuleData?.objectives && (
                        <div className="bg-blue-50 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-blue-600" />Learning Objectives</h3>
                          <ul className="space-y-2">
                            {currentModuleData.objectives.map((objective, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">{index + 1}</div>
                                <div className="text-gray-700 flex-1"><MathMarkdownRenderer content={objective} /></div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {currentModuleData?.examples && (
                        <div className="bg-green-50 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-green-600" />Key Examples</h3>
                          <div className="space-y-4">
                            {currentModuleData.examples.map((example, index) => (
                              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-start gap-3">
                                  <Badge className="bg-green-100 text-green-800 mt-1">Example {index + 1}</Badge>
                                  <div className="flex-1"><div className="text-gray-700 whitespace-pre-wrap"><MathMarkdownRenderer content={example} /></div></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="subsections" className="p-3 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {subsections.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-base sm:text-lg">No detailed subsections available.</p>
                        </div>
                      ) : (
                        subsections.map((subsection, index) => {
                          const pages = subsection.pages || subsection.explanationPages || [];
                          const isCompleted = completedSubsections.has(`${currentModule}-${index}`)
                          const sectionKey = `subsection-${index}`
                          const isExpanded = expandedSections.has(sectionKey)
                          
                          return (
                            <Card key={index} className={`border-2 transition-all duration-300 ${isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-orange-300'}`}>
                              <CardHeader className="pb-3 p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                      {isCompleted ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : <span className="font-bold text-sm sm:text-base">{index + 1}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-base sm:text-lg truncate">{subsection.title}</CardTitle>
                                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{subsection.estimatedTime || 15} min • {subsection.difficulty || 'medium'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button variant="ghost" size="sm" onClick={() => toggleSection(sectionKey)} className="w-8 h-8 sm:w-10 sm:h-10">
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              {isExpanded && (
                                <CardContent className="p-3 sm:p-4 lg:p-6">
                                  <div className="space-y-4 sm:space-y-6">
                                    {loadingDetailedContent ? (
                                      <div className="flex items-center justify-center py-8 sm:py-12">
                                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500"></div>
                                        <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading detailed content...</span>
                                      </div>
                                    ) : (
                                      <div className="w-full">
                                        <div className="space-y-6">
                                          {subsection.summary && (
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                              <h4 className="font-semibold text-blue-900 mb-2">Overview</h4>
                                              <div className="text-blue-800"><MathMarkdownRenderer content={subsection.summary} /></div>
                                                    </div>
                                          )}
                                          {subsection.keyPoints && subsection.keyPoints.length > 0 && (
                                            <div className="bg-green-50 p-4 rounded-lg">
                                              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2"><Target className="h-4 w-4" />Key Learning Points</h4>
                                              <ul className="space-y-2">
                                                {subsection.keyPoints.map((point, pointIndex) => (
                                                  <li key={pointIndex} className="flex items-start gap-2">
                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">{pointIndex + 1}</div>
                                                    <div className="text-green-800 flex-1"><MathMarkdownRenderer content={point} /></div>
                                                  </li>
                                                ))}
                                              </ul>
                                                    </div>
                                          )}
                                          {pages && pages.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-lg">
                                              <div className="p-6">
                                              {(() => {
                                                  const currentPageIndex = getCurrentPageTab(currentModule, index);
                                                  const currentPage = pages[currentPageIndex];
                                                  if (!currentPage) return <p className="text-gray-500 italic">No content available for this page.</p>;
                                                return (
                                                    <div className="space-y-6">
                                                      <h4 className="font-semibold text-xl text-gray-800 mb-4 pb-4 border-b">{currentPage.pageTitle}</h4>
                                                      <div className="prose max-w-none"><MathMarkdownRenderer content={currentPage.content} /></div>
                                                      {currentPage.mathematicalContent && currentPage.mathematicalContent.length > 0 && (
                                                        <div className="bg-purple-50 p-4 rounded-lg">
                                                          <h5 className="font-semibold text-purple-900 mb-3">Mathematical Concepts</h5>
                                                          <div className="space-y-4">
                                                            {currentPage.mathematicalContent.map((mathItem, mathIndex) => (
                                                              <div key={mathIndex} className="bg-white p-4 rounded border">
                                                                <h6 className="font-medium text-purple-800 mb-2">{mathItem.title}</h6>
                                                                <div className="text-purple-700 mb-2"><MathMarkdownRenderer content={mathItem.content} /></div>
                                                                {mathItem.explanation && <div className="text-sm text-purple-600"><MathMarkdownRenderer content={mathItem.explanation} /></div>}
                                                                {mathItem.example && <div className="mt-2 p-2 bg-purple-100 rounded text-sm"><strong>Example:</strong> <MathMarkdownRenderer content={mathItem.example} /></div>}
                                                    </div>
                                                  ))}
                                                          </div>
                                                        </div>
                                                      )}
                                                      {currentPage.keyTakeaway && (
                                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                                          <div className="flex items-start gap-2">
                                                            <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                              <h5 className="font-semibold text-yellow-900 mb-1">Key Takeaway</h5>
                                                              <div className="text-yellow-800"><MathMarkdownRenderer content={currentPage.keyTakeaway} /></div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}
                                                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                                        <Button variant="outline" size="sm" onClick={() => setCurrentPageTab(currentModule, index, Math.max(0, currentPageIndex - 1))} disabled={currentPageIndex === 0}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button>
                                                        <span className="text-sm text-gray-600">Page {currentPageIndex + 1} of {pages.length}</span>
                                                        <Button variant="outline" size="sm" onClick={() => setCurrentPageTab(currentModule, index, Math.min(pages.length - 1, currentPageIndex + 1))} disabled={currentPageIndex === pages.length - 1}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
                                                    </div>
                                                        </div>
                                                  );
                                              })()}
                                        </div>
                                                </div>
                                      )}
                                    </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          )
                        })
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="resources" className="p-6 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                      <div className="bg-gradient-to-r from-violet-100 to-purple-100 p-8 rounded-2xl mb-8 relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-full shadow-md">
                                    <Sparkles className="h-8 w-8 text-purple-600" />
                                </div>
                                <div>
                                  <h2 className="text-3xl font-bold text-slate-800">Learning Resources</h2>
                                  <p className="text-slate-600 mt-1">Comprehensive collection of exam preparation materials</p>
                                </div>
                            </div>
                            <Badge className="bg-purple-600 text-white text-sm py-2 px-4 border-purple-700">
                                <Brain className="h-4 w-4 mr-2" />
                                Exam Focused
                            </Badge>
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                          {Object.entries(resourceCategories).map(([key, { icon: Icon, label }]) => {
                              const resources = currentModuleData?.resources?.[key] || [];
                              const count = resources.length;
                              if (count === 0) return null;

                              const styles = categoryStyles[key] || {};
                              return (
                                  <button
                                      key={key}
                                      onClick={() => setSelectedResourceCategory(key)}
                                      className={`p-4 rounded-2xl text-center transition-all duration-300 transform hover:-translate-y-1 group ${
                                          selectedResourceCategory === key 
                                          ? `bg-white shadow-lg ring-2 ${styles.ring}` 
                                          : 'bg-white/80 shadow-md hover:shadow-lg'
                                      }`}
                                  >
                                      <Icon className={`h-7 w-7 mx-auto mb-3 ${styles.text} group-hover:text-opacity-80 transition-colors`} />
                                      <p className="font-semibold text-slate-800 text-sm">{label}</p>
                                      <div className={`mt-2 inline-block px-2 py-0.5 text-xs font-bold ${styles.text} ${styles.bg} rounded-full`}>
                                          {count}
                                      </div>
                                  </button>
                              );
                          })}
                        </div>
                      </div>
                      
                      <AnimatePresence mode="wait">
                          <motion.div
                              key={selectedResourceCategory}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                          >
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                  {(currentModuleData?.resources?.[selectedResourceCategory] || []).map((resource, index) => (
                                      <ResourceCard
                                          key={`${selectedResourceCategory}-${index}`}
                                          resource={resource}
                                          type={selectedResourceCategory}
                                          isInstructorChoice={resource.isInstructorChoice}
                                          resourceIndex={index}
                                      />
                                  ))}
                              </div>
                              {(currentModuleData?.resources?.[selectedResourceCategory] || []).length === 0 && (
                                  <div className="text-center py-12">
                                      <p className="text-slate-500">No resources in this category.</p>
                                  </div>
                              )}
                          </motion.div>
                      </AnimatePresence>
                    </div>
                  </TabsContent>
                  <TabsContent value="progress" className="p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                                <div>
                                    <p>Overall Progress: {getOverallProgress()}%</p>
                                    <Progress value={getOverallProgress()} />
                                    </div>
                                <div>
                                    <p>Current Module Progress: {getModuleProgress(currentModule)}%</p>
                                    <Progress value={getModuleProgress(currentModule)} />
                                  </div>
                          </div>
                        </CardContent>
                      </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <QuizModal
        quiz={selectedQuiz}
        open={isQuizModalOpen}
        onOpenChange={setIsQuizModalOpen}
        onQuizComplete={(score) => {
          console.log(`Quiz completed with score: ${score}`);
          // Handle quiz completion for Exam Genius courses
        }}
      />
    </div>
  )
}

function QuizInterface({ quizData, onComplete, difficulty }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questions = quizData.questions || [];
  const currentQ = questions[currentQuestion];

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResults) {
      handleSubmit()
    }
  }, [timeLeft, showResults])

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({...prev, [questionIndex]: answer}))
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
      onComplete({ score, correct, total: questions.length, results, difficulty, completedAt: new Date().toISOString() })
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
      {!showResults ? (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Question {currentQuestion + 1} of {questions.length}</h3>
            <div className="flex items-center gap-2 font-semibold text-red-500">
              <Timer className="h-5 w-5" />
              <span>{formatTime(timeLeft)}</span>
        </div>
        </div>
          <div>
            <p className="font-medium text-lg mb-4"><MathMarkdownRenderer content={currentQ?.question} inline={true} /></p>
            <div className="space-y-2">
              {currentQ?.options.map((option, index) => (
                <Button key={index} variant={selectedAnswers[currentQuestion] === index ? "default" : "outline"} className="w-full justify-start text-left h-auto py-3" onClick={() => handleAnswerSelect(currentQuestion, index)}>
                  <MathMarkdownRenderer content={option} />
              </Button>
            ))}
          </div>
        </div>
          <div className="flex justify-between">
            <Button onClick={() => setCurrentQuestion(q => q - 1)} disabled={currentQuestion === 0}>Previous</Button>
        {currentQuestion === questions.length - 1 ? (
              <Button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600">Submit</Button>
            ) : (
              <Button onClick={() => setCurrentQuestion(q => q + 1)}>Next</Button>
        )}
      </div>
        </>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
          <p>Your score: {quizResults.score}%</p>
          <Button onClick={() => onComplete(quizResults)} className="mt-4">Close</Button>
        </div>
      )}
    </div>
  )
} 
