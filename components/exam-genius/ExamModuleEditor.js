"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Save,
  Plus,
  Trash2,
  BookOpen,
  Target,
  Lightbulb,
  FileText,
  Link,
  Video,
  Globe,
  Wrench,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Edit,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Brain,
  Trophy,
  PlusCircle,
  MinusCircle
} from "lucide-react"

export default function ExamModuleEditor({ module, onUpdate }) {
  const [editedModule, setEditedModule] = useState(module)
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [activeObjective, setActiveObjective] = useState(null)
  const [activeExample, setActiveExample] = useState(null)
  const [activeSubsection, setActiveSubsection] = useState(null)
  const [newObjective, setNewObjective] = useState("")
  const [newExample, setNewExample] = useState("")

  useEffect(() => {
    setEditedModule(module)
  }, [module])

  const handleModuleUpdate = (updates) => {
    const updatedModule = { ...editedModule, ...updates }
    setEditedModule(updatedModule)
    onUpdate(updatedModule)
  }

  const handleObjectiveAdd = () => {
    if (!newObjective.trim()) return
    
    const updatedObjectives = [...(editedModule.objectives || []), newObjective.trim()]
    handleModuleUpdate({ objectives: updatedObjectives })
    setNewObjective("")
  }

  const handleObjectiveUpdate = (index, value) => {
    const updatedObjectives = editedModule.objectives.map((obj, i) => 
      i === index ? value : obj
    )
    handleModuleUpdate({ objectives: updatedObjectives })
  }

  const handleObjectiveRemove = (index) => {
    const updatedObjectives = editedModule.objectives.filter((_, i) => i !== index)
    handleModuleUpdate({ objectives: updatedObjectives })
  }

  const handleExampleAdd = () => {
    if (!newExample.trim()) return
    
    const updatedExamples = [...(editedModule.examples || []), newExample.trim()]
    handleModuleUpdate({ examples: updatedExamples })
    setNewExample("")
  }

  const handleExampleUpdate = (index, value) => {
    const updatedExamples = editedModule.examples.map((ex, i) => 
      i === index ? value : ex
    )
    handleModuleUpdate({ examples: updatedExamples })
  }

  const handleExampleRemove = (index) => {
    const updatedExamples = editedModule.examples.filter((_, i) => i !== index)
    handleModuleUpdate({ examples: updatedExamples })
  }

  const handleResourceUpdate = (category, index, value) => {
    const updatedResources = { ...editedModule.resources }
    if (index === -1) {
      // Add new resource
      updatedResources[category] = [...(updatedResources[category] || []), value]
    } else {
      // Update existing resource
      updatedResources[category] = updatedResources[category].map((item, i) => 
        i === index ? value : item
      )
    }
    handleModuleUpdate({ resources: updatedResources })
  }

  const handleResourceRemove = (category, index) => {
    const updatedResources = { ...editedModule.resources }
    updatedResources[category] = updatedResources[category].filter((_, i) => i !== index)
    handleModuleUpdate({ resources: updatedResources })
  }

  const handleSubsectionAdd = () => {
    const newSubsection = {
      id: `subsection_${Date.now()}`,
      title: "",
      content: "",
      order: (editedModule.detailedSubsections?.length || 0) + 1,
      pages: [],
      estimatedTime: 0,
      difficulty: "medium",
      practiceQuestions: []
    }

    const updatedSubsections = [...(editedModule.detailedSubsections || []), newSubsection]
    handleModuleUpdate({ detailedSubsections: updatedSubsections })
    setActiveSubsection(updatedSubsections.length - 1)
  }

  const handleSubsectionUpdate = (index, updates) => {
    const updatedSubsections = editedModule.detailedSubsections.map((sub, i) => 
      i === index ? { ...sub, ...updates } : sub
    )
    handleModuleUpdate({ detailedSubsections: updatedSubsections })
  }

  const handleSubsectionRemove = (index) => {
    const updatedSubsections = editedModule.detailedSubsections.filter((_, i) => i !== index)
      .map((sub, i) => ({ ...sub, order: i + 1 }))
    handleModuleUpdate({ detailedSubsections: updatedSubsections })
    
    if (activeSubsection === index) {
      setActiveSubsection(null)
    } else if (activeSubsection > index) {
      setActiveSubsection(activeSubsection - 1)
    }
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

  const getModuleCompletionStatus = () => {
    const hasTitle = editedModule.title?.trim()
    const hasContent = editedModule.content?.trim()
    const hasSummary = editedModule.summary?.trim()
    const hasObjectives = editedModule.objectives?.length > 0
    const hasSubsections = editedModule.detailedSubsections?.length > 0

    const completed = [hasTitle, hasContent, hasSummary, hasObjectives, hasSubsections].filter(Boolean).length
    const total = 5
    const percentage = Math.round((completed / total) * 100)

    return { completed, total, percentage }
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

  const completionStatus = getModuleCompletionStatus()

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  Module Editor
                </CardTitle>
                <p className="text-gray-600">
                  {editedModule.examType} • {editedModule.subject}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-lg font-bold text-gray-800">{completionStatus.percentage}%</p>
              </div>
              <Progress value={completionStatus.percentage} className="w-24 h-2" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Different Sections */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objectives
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="subsections" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Subsections
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Module Title
                </Label>
                <Input
                  id="title"
                  value={editedModule.title || ""}
                  onChange={(e) => handleModuleUpdate({ title: e.target.value })}
                  placeholder="Enter module title..."
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="content" className="text-sm font-semibold">
                  Module Content
                </Label>
                <Textarea
                  id="content"
                  value={editedModule.content || ""}
                  onChange={(e) => handleModuleUpdate({ content: e.target.value })}
                  placeholder="Enter detailed module content..."
                  rows={12}
                  className="border-2 border-gray-200 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="summary" className="text-sm font-semibold">
                  AI Summary
                </Label>
                <Textarea
                  id="summary"
                  value={editedModule.summary || ""}
                  onChange={(e) => handleModuleUpdate({ summary: e.target.value })}
                  placeholder="AI-generated summary will appear here..."
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Module Examples</Label>
                <div className="space-y-3">
                  {editedModule.examples?.map((example, index) => (
                    <div key={`example-${index}`} className="flex items-start gap-3">
                      <div className="flex-1">
                        {activeExample === index ? (
                          <div className="flex items-center gap-2">
                            <Textarea
                              value={example}
                              onChange={(e) => handleExampleUpdate(index, e.target.value)}
                              rows={3}
                              className="flex-1 border-2 border-blue-300 focus:border-blue-500"
                            />
                            <Button
                              size="sm"
                              onClick={() => setActiveExample(null)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                            onClick={() => setActiveExample(index)}
                          >
                            <p className="text-sm">{example}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveExample(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExampleRemove(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={newExample}
                      onChange={(e) => setNewExample(e.target.value)}
                      placeholder="Add a new example..."
                      rows={2}
                      className="flex-1 border-2 border-gray-200 focus:border-green-500"
                    />
                    <Button
                      onClick={handleExampleAdd}
                      disabled={!newExample.trim()}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Learning Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedModule.objectives?.map((objective, index) => (
                <div key={`objective-${index}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    {activeObjective === index ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={objective}
                          onChange={(e) => handleObjectiveUpdate(index, e.target.value)}
                          rows={2}
                          className="flex-1 border-2 border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => setActiveObjective(null)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p 
                        className="text-sm cursor-pointer hover:text-blue-600"
                        onClick={() => setActiveObjective(index)}
                      >
                        {objective}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveObjective(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleObjectiveRemove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <Textarea
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add a new learning objective..."
                  rows={2}
                  className="flex-1 border-2 border-gray-200 focus:border-green-500"
                />
                <Button
                  onClick={handleObjectiveAdd}
                  disabled={!newObjective.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(resourceCategories).map(([category, { icon: Icon, label, color }]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className={`h-5 w-5 text-${color}-500`} />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editedModule.resources?.[category]?.map((resource, index) => (
                    <div key={`${category}-${index}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Input
                        value={resource}
                        onChange={(e) => handleResourceUpdate(category, index, e.target.value)}
                        className="flex-1 border-gray-200"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResourceRemove(category, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Add ${label.toLowerCase()}...`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleResourceUpdate(category, -1, e.target.value.trim())
                          e.target.value = ''
                        }
                      }}
                      className="flex-1 border-gray-200 focus:border-green-500"
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        const input = e.target.parentElement.querySelector('input')
                        if (input.value.trim()) {
                          handleResourceUpdate(category, -1, input.value.trim())
                          input.value = ''
                        }
                      }}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Subsections Tab */}
        <TabsContent value="subsections" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Detailed Subsections
                </CardTitle>
                <Button
                  onClick={handleSubsectionAdd}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subsection
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedModule.detailedSubsections?.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No subsections yet. Add your first subsection to get started.</p>
                </div>
              ) : (
                editedModule.detailedSubsections?.map((subsection, index) => (
                  <Card key={subsection.id} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <Input
                              value={subsection.title}
                              onChange={(e) => handleSubsectionUpdate(index, { title: e.target.value })}
                              placeholder="Subsection title..."
                              className="border-none p-0 text-lg font-semibold focus:ring-0"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveSubsection(activeSubsection === index ? null : index)}
                          >
                            {activeSubsection === index ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSubsectionRemove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {activeSubsection === index && (
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Content</Label>
                          <Textarea
                            value={subsection.content}
                            onChange={(e) => handleSubsectionUpdate(index, { content: e.target.value })}
                            placeholder="Subsection content..."
                            rows={6}
                            className="border-2 border-gray-200 focus:border-purple-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Estimated Time (minutes)</Label>
                            <Input
                              type="number"
                              value={subsection.estimatedTime || 0}
                              onChange={(e) => handleSubsectionUpdate(index, { estimatedTime: parseInt(e.target.value) || 0 })}
                              className="border-2 border-gray-200 focus:border-purple-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Difficulty</Label>
                            <select 
                              value={subsection.difficulty || 'medium'}
                              onChange={(e) => handleSubsectionUpdate(index, { difficulty: e.target.value })}
                              className="w-full p-2 border-2 border-gray-200 rounded-md focus:border-purple-500"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 