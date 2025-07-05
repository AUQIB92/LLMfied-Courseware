"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import ExamModuleEditorEnhanced from "./ExamModuleEditorEnhanced"
import { toast } from "sonner"
import {
  Save,
  Plus,
  Trash2,
  BookOpen,
  Trophy,
  CheckCircle,
  Loader2,
  ArrowLeft,
  BarChart3,
  Settings,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react"

export default function ExamContentEditor({ course, onBack, onSave }) {
  const { getAuthHeaders } = useAuth()
  const [editedCourse, setEditedCourse] = useState(course)
  const [activeModule, setActiveModule] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedModules, setExpandedModules] = useState(new Set())

  useEffect(() => {
    setEditedCourse(course)
  }, [course])

  const handleCourseUpdate = (updates) => {
    setEditedCourse(prev => ({ ...prev, ...updates }))
  }

  const handleModuleUpdate = (moduleIndex, updates) => {
    setEditedCourse(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) =>
        index === moduleIndex ? { ...module, ...updates } : module
      )
    }))
  }

  const handleAddModule = () => {
    // Safety check for modules array
    const modules = editedCourse?.modules || []
    
    const newModule = {
      id: `module_${Date.now()}`,
      title: "",
      content: "",
      order: modules.length + 1,
      summary: "",
      objectives: [],
      examples: [],
      resources: {
        books: [],
        courses: [],
        articles: [],
        videos: [],
        tools: [],
        websites: [],
        exercises: []
      },
      detailedSubsections: [],
      isCompetitiveExam: true,
      examType: editedCourse.examType,
      subject: editedCourse.subject,
      learnerLevel: editedCourse.learnerLevel
    }

    setEditedCourse(prev => ({
      ...prev,
      modules: [...(prev.modules || []), newModule]
    }))

    setActiveModule(modules.length)
  }

  const handleRemoveModule = (moduleIndex) => {
    // Safety check for modules array
    const modules = editedCourse?.modules || []
    
    if (modules.length === 1) {
      toast.error("Cannot remove the last module")
      return
    }

    if (modules.length === 0) {
      toast.error("No modules to remove")
      return
    }

    setEditedCourse(prev => ({
      ...prev,
      modules: (prev.modules || []).filter((_, index) => index !== moduleIndex)
        .map((module, index) => ({ ...module, order: index + 1 }))
    }))

    if (activeModule === moduleIndex) {
      setActiveModule(null)
    } else if (activeModule > moduleIndex) {
      setActiveModule(activeModule - 1)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editedCourse)
      toast.success("Competitive exam course saved successfully!")
    } catch (error) {
      console.error("Error saving course:", error)
      toast.error("Failed to save course. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const toggleModuleExpansion = (moduleIndex) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleIndex)) {
        newSet.delete(moduleIndex)
      } else {
        newSet.add(moduleIndex)
      }
      return newSet
    })
  }

  const getModuleCompletionStatus = (module) => {
    const hasTitle = module.title?.trim()
    const hasContent = module.content?.trim()
    const hasSummary = module.summary?.trim()
    const hasObjectives = module.objectives?.length > 0
    const hasSubsections = module.detailedSubsections?.length > 0

    const completed = [hasTitle, hasContent, hasSummary, hasObjectives, hasSubsections].filter(Boolean).length
    const total = 5
    const percentage = Math.round((completed / total) * 100)

    return { completed, total, percentage }
  }

  const getCourseStats = () => {
    // Safety check for modules array
    if (!editedCourse?.modules || !Array.isArray(editedCourse.modules)) {
      return { totalModules: 0, completedModules: 0, totalSubsections: 0, totalPages: 0 }
    }

    const totalModules = editedCourse.modules.length
    const completedModules = editedCourse.modules.filter(module => {
      const status = getModuleCompletionStatus(module)
      return status.percentage >= 80
    }).length

    const totalSubsections = editedCourse.modules.reduce((sum, module) => 
      sum + (module.detailedSubsections?.length || 0), 0
    )

    const totalPages = editedCourse.modules.reduce((sum, module) => 
      sum + (module.detailedSubsections?.reduce((pageSum, subsection) => 
        pageSum + (subsection.pages?.length || 0), 0) || 0), 0
    )

    return { totalModules, completedModules, totalSubsections, totalPages }
  }

  const stats = getCourseStats()

  if (activeModule !== null) {
    // Safety check for modules array and active module
    if (!editedCourse?.modules || !Array.isArray(editedCourse.modules) || !editedCourse.modules[activeModule]) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => setActiveModule(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Course
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Module Editor</h1>
                <p className="text-red-600">Module not found or not loaded yet</p>
              </div>
            </div>
            
            <div className="text-center py-8">
              <p className="text-gray-600">Unable to load module. Please go back and try again.</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setActiveModule(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Module {activeModule + 1}: {editedCourse.modules[activeModule]?.title || "Untitled Module"}
              </h1>
              <p className="text-gray-600">
                {editedCourse.examType} • {editedCourse.subject} • {editedCourse.learnerLevel}
              </p>
            </div>
          </div>
          
          <ExamModuleEditorEnhanced
            module={editedCourse.modules[activeModule]}
            onUpdate={(updates) => handleModuleUpdate(activeModule, updates)}
            examType={editedCourse.examType}
            subject={editedCourse.subject}
            learnerLevel={editedCourse.learnerLevel}
            course={editedCourse}
            courseId={editedCourse._id}
            onSaveSuccess={(savedCourse, status) => {
              setEditedCourse(savedCourse)
              toast.success(`Course ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`)
              if (onSave) onSave(savedCourse)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Competitive Exam Course Editor
            </h1>
            <p className="text-gray-600 mt-1">
              {editedCourse.examType} • {editedCourse.subject} • {editedCourse.learnerLevel}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <Trophy className="h-4 w-4 mr-1" />
            Competitive Exam
          </Badge>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Course
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              <div>
                <p className="text-blue-100">Total Modules</p>
                <p className="text-2xl font-bold">{stats.totalModules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8" />
              <div>
                <p className="text-green-100">Completed</p>
                <p className="text-2xl font-bold">{stats.completedModules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" />
              <div>
                <p className="text-purple-100">Subsections</p>
                <p className="text-2xl font-bold">{stats.totalSubsections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              <div>
                <p className="text-orange-100">Total Pages</p>
                <p className="text-2xl font-bold">{stats.totalPages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Information */}
        <div className="lg:col-span-1">
          <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-blue-600" />
                Course Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                  Course Title
                </Label>
                <Input
                  id="title"
                  value={editedCourse.title}
                  onChange={(e) => handleCourseUpdate({ title: e.target.value })}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={editedCourse.description}
                  onChange={(e) => handleCourseUpdate({ description: e.target.value })}
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Exam Type</Label>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 font-medium">{editedCourse.examType}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Subject</Label>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-purple-800 font-medium">{editedCourse.subject}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Learner Level</Label>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium capitalize">{editedCourse.learnerLevel}</p>
                  </div>
                </div>
              </div>

              {/* Course Progress */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Course Progress</Label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Modules Completed</span>
                    <span>{stats.completedModules}/{stats.totalModules}</span>
                  </div>
                  <Progress 
                    value={(stats.completedModules / stats.totalModules) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules List */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Course Modules
                </CardTitle>
                <Button
                  onClick={handleAddModule}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {(editedCourse?.modules?.length || 0) === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No Modules Yet</h3>
                  <p className="text-gray-400 mb-4">Add your first module to get started</p>
                  <Button
                    onClick={handleAddModule}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Module
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(editedCourse?.modules || []).map((module, index) => {
                    const status = getModuleCompletionStatus(module)
                    const isExpanded = expandedModules.has(index)

                    return (
                      <Card key={module.id} className="border-2 hover:border-blue-300 transition-colors duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">
                                  {module.title || `Module ${index + 1}`}
                                </h3>
                                <div className="flex items-center gap-4 mt-1">
                                  <div className="flex items-center gap-2">
                                    <Progress value={status.percentage} className="w-20 h-2" />
                                    <span className="text-xs text-gray-500">{status.percentage}%</span>
                                  </div>
                                  {module.detailedSubsections?.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {module.detailedSubsections.length} sections
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleModuleExpansion(index)}
                                className="hover:bg-gray-100"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveModule(index)}
                                className="hover:bg-blue-100 hover:text-blue-600"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveModule(index)}
                                className="hover:bg-red-100 hover:text-red-600"
                                disabled={(editedCourse?.modules?.length || 0) === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {isExpanded && (
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Content Preview</Label>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                  {module.content || "No content added yet"}
                                </p>
                              </div>
                              
                              {module.summary && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">AI Summary</Label>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {module.summary}
                                  </p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Objectives:</span>
                                  <span className="ml-2 font-medium">{module.objectives?.length || 0}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Examples:</span>
                                  <span className="ml-2 font-medium">{module.examples?.length || 0}</span>
                                </div>
                              </div>
                              
                              <Button
                                onClick={() => setActiveModule(index)}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Edit Module
                              </Button>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 