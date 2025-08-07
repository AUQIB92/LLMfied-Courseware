"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  ChevronDown,
  ChevronUp,
  Calendar,
  Award
} from "lucide-react"

export default function AcademicCourseViewer({ courseId, course: initialCourse, onBack }) {
  const [course, setCourse] = useState(initialCourse || null)
  const [loading, setLoading] = useState(!initialCourse)
  const [error, setError] = useState(null)
  const [currentModule, setCurrentModule] = useState(0)
  const [completedModules, setCompletedModules] = useState(new Set())
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (initialCourse) {
      // If we already have course data, no need to fetch
      console.log("📖 Academic course data provided:", initialCourse.title)
      setCourse(initialCourse)
      setLoading(false)
    } else if (courseId) {
      // Otherwise fetch the course data
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
        const courseData = await response.json()
        setCourse(courseData)
        console.log("📖 Academic course loaded:", courseData.title)
      } else if (response.status === 404) {
        setError("Course not found or not accessible")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load course")
      }
      
    } catch (error) {
      console.error("Error fetching course:", error)
      setError("Network error: Failed to load course")
    } finally {
      setLoading(false)
    }
  }

  const markModuleComplete = (moduleIndex) => {
    setCompletedModules(prev => new Set([...prev, moduleIndex]))
  }

  const getProgressPercentage = () => {
    if (!course?.modules?.length) return 0
    return (completedModules.size / course.modules.length) * 100
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

  if (!course) {
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

  const levelConfig = getAcademicLevelConfig(course.academicLevel)

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
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

        {/* Course Hero Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
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
                    <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {levelConfig.name}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {course.subject}
                      </Badge>
                      {course.semester && (
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          Semester {course.semester}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-white/90 text-lg leading-relaxed mb-6 max-w-3xl">
                {course.description}
              </p>

              <div className="flex items-center gap-8 text-white/80 mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{course.modules?.length || 0} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{course.enrollmentCount || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{course.credits || 3} credits</span>
                </div>
                {course.assignments && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span>{course.assignments.length} assignments</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
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

        {/* Content Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 lg:w-1/2">
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
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Objectives */}
                {course.objectives?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Learning Objectives
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {course.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Prerequisites */}
                {course.prerequisites?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-600" />
                        Prerequisites
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {course.prerequisites.map((prerequisite, index) => (
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

              {/* Assessment Criteria */}
              {course.assessmentCriteria && (
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
                          {course.assessmentCriteria.assignments}%
                        </div>
                        <div className="text-sm text-slate-600">Assignments</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {course.assessmentCriteria.quizzes}%
                        </div>
                        <div className="text-sm text-slate-600">Quizzes</div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600 mb-1">
                          {course.assessmentCriteria.midterm}%
                        </div>
                        <div className="text-sm text-slate-600">Midterm</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {course.assessmentCriteria.final}%
                        </div>
                        <div className="text-sm text-slate-600">Final</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="modules" className="space-y-4">
              {course.modules?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-16rem)]">
                  {/* Module Sidebar */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" /> Course Modules
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-2 p-4">
                        {course.modules.map((module, index) => (
                          <Button
                            key={index}
                            variant={currentModule === index ? "default" : "ghost"}
                            className={`w-full justify-start text-left h-auto p-3 ${
                              currentModule === index
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                : "hover:bg-blue-50"
                            }`}
                            onClick={() => setCurrentModule(index)}
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

                  {/* Module Content */}
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            {course.modules[currentModule]?.title || `Module ${currentModule + 1}`}
                          </CardTitle>
                          {course.modules[currentModule]?.description && (
                            <p className="text-slate-600 mt-2">
                              {course.modules[currentModule].description}
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
                        {/* Module Content */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Play className="h-5 w-5 text-blue-600" />
                            Module Content
                          </h4>
                          <p className="text-slate-700 mb-4">
                            {course.modules[currentModule]?.content || 
                             "Interactive learning materials and resources for this module will be displayed here."}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                              <Play className="h-4 w-4 mr-2" />
                              Start Learning
                            </Button>
                            {course.modules[currentModule]?.resources?.length > 0 && (
                              <Button variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                Resources ({course.modules[currentModule].resources.length})
                              </Button>
                            )}
                            {course.modules[currentModule]?.quiz && (
                              <Button variant="outline">
                                <Target className="h-4 w-4 mr-2" />
                                Take Quiz
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Module Navigation */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentModule(Math.max(0, currentModule - 1))}
                            disabled={currentModule === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous Module
                          </Button>
                          
                          <div className="text-sm text-slate-600">
                            Module {currentModule + 1} of {course.modules.length}
                          </div>
                          
                          <Button
                            variant="outline"
                            onClick={() => setCurrentModule(Math.min(course.modules.length - 1, currentModule + 1))}
                            disabled={currentModule === course.modules.length - 1}
                          >
                            Next Module
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
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
                  {course.assignments?.length > 0 ? (
                    <div className="space-y-4">
                      {course.assignments.map((assignment, index) => (
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
                          {(course.modules?.length || 0) - completedModules.size}
                        </div>
                        <div className="text-sm text-slate-600">Modules Remaining</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {course.credits || 3}
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