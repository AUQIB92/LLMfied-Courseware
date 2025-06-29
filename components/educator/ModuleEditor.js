"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Video,
  Play,
  FileText,
  Globe,
  Wrench,
  Target,
  Lightbulb,
  Sparkles,
  GraduationCap,
  Brain,
  Zap,
  Crown,
  Star,
} from "lucide-react"

export default function ModuleEditor({ module, onUpdate }) {
  const [showManualResourceForm, setShowManualResourceForm] = useState(false)
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    description: "",
    type: "article", // Default type for categorization
  })

  // Handle legacy resources (manual ones) - organized by type
  const legacyResources = useMemo(() => {
    if (Array.isArray(module.resources)) {
      // Legacy array format
      return module.resources
    } else if (module.resources && typeof module.resources === "object" && module.resources.manual) {
      // New object format with manual resources
      return Array.isArray(module.resources.manual) ? module.resources.manual : []
    }
    return []
  }, [module.resources])
  
  // Debug logging
  console.log('Module resources:', module.resources)
  console.log('Legacy resources:', legacyResources)
  
  // Organize manual resources by type for the instructor masterpieces section
  const instructorMasterpieces = {
    articles: legacyResources.filter(r => r.type === 'article' || !r.type), // Default to article for legacy
    videos: legacyResources.filter(r => r.type === 'video'),
    books: legacyResources.filter(r => r.type === 'book'),
    tools: legacyResources.filter(r => r.type === 'tool'),
    websites: legacyResources.filter(r => r.type === 'website'),
    exercises: legacyResources.filter(r => r.type === 'exercise'),
    courses: legacyResources.filter(r => r.type === 'course'),
  }
  
  console.log('Instructor masterpieces:', instructorMasterpieces)

  // Handle new structured resources from AI with safer property access
  const aiResources =
    module.resources && typeof module.resources === "object" && !Array.isArray(module.resources)
      ? {
          books: Array.isArray(module.resources.books) ? module.resources.books : [],
          courses: Array.isArray(module.resources.courses) ? module.resources.courses : [],
          articles: Array.isArray(module.resources.articles) ? module.resources.articles : [],
          videos: Array.isArray(module.resources.videos) ? module.resources.videos : [],
          tools: Array.isArray(module.resources.tools) ? module.resources.tools : [],
          websites: Array.isArray(module.resources.websites) ? module.resources.websites : [],
          exercises: Array.isArray(module.resources.exercises) ? module.resources.exercises : [],
        }
      : {
          books: [],
          courses: [],
          articles: [],
          videos: [],
          tools: [],
          websites: [],
          exercises: [],
        }

  const handleAddManualResource = () => {
    if (newResource.title) {
      const resourceWithId = { 
        ...newResource, 
        id: Date.now(),
        type: newResource.type || 'article' // Ensure type is set
      }
      const updatedLegacyResources = [...legacyResources, resourceWithId]
      
      console.log('Adding new resource:', resourceWithId)
      console.log('Updated legacy resources:', updatedLegacyResources)
      
      // If module already has AI resources structure, merge properly
      if (module.resources && typeof module.resources === "object" && !Array.isArray(module.resources)) {
        onUpdate({
          resources: {
            ...aiResources,
            manual: updatedLegacyResources
          }
        })
      } else {
        // If module only has legacy array format, keep as array
        onUpdate({
          resources: updatedLegacyResources
        })
      }
      
      setNewResource({ title: "", url: "", description: "", type: "article" })
      setShowManualResourceForm(false)
    }
  }

  const handleRemoveManualResource = (resourceId) => {
    const updatedLegacyResources = legacyResources.filter((r) => r.id !== resourceId)
    
    console.log('Removing resource:', resourceId)
    console.log('Updated legacy resources after removal:', updatedLegacyResources)
    
    // If module already has AI resources structure, merge properly
    if (module.resources && typeof module.resources === "object" && !Array.isArray(module.resources)) {
      onUpdate({
        resources: {
          ...aiResources,
          manual: updatedLegacyResources
        }
      })
    } else {
      // If module only has legacy array format, keep as array
      onUpdate({
        resources: updatedLegacyResources
      })
    }
  }

  const ResourceSection = ({ title, icon: Icon, resources, type, isInstructorContent = false }) => {
    if (!resources || resources.length === 0) return null

    const getTypeGradient = () => {
      const baseGradients = {
        "books": "from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-200/50",
        "courses": "from-purple-500/10 via-pink-500/10 to-rose-500/10 border-purple-200/50",
        "videos": "from-red-500/10 via-orange-500/10 to-yellow-500/10 border-red-200/50",
        "articles": "from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-200/50",
        "tools": "from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-orange-200/50",
        "websites": "from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border-indigo-200/50",
        "exercises": "from-pink-500/10 via-rose-500/10 to-red-500/10 border-pink-200/50"
      }
      
      // Special styling for instructor content
      if (isInstructorContent) {
        return baseGradients[type] ? 
          baseGradients[type].replace('/10', '/20').replace('/50', '') + ' border-amber-300/70 shadow-amber-100/50' :
          "from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-amber-300/70 shadow-amber-100/50"
      }
      
      return baseGradients[type] || "from-gray-500/10 via-slate-500/10 to-zinc-500/10 border-gray-200/50"
    }

    const getIconColor = () => {
      switch (type) {
        case "books":
          return "text-blue-600"
        case "courses":
          return "text-purple-600"
        case "videos":
          return "text-red-600"
        case "articles":
          return "text-green-600"
        case "tools":
          return "text-orange-600"
        case "websites":
          return "text-indigo-600"
        case "exercises":
          return "text-pink-600"
        default:
          return "text-gray-600"
      }
    }

    return (
      <Card
        className={`bg-gradient-to-br ${getTypeGradient()} backdrop-blur-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div
              className={`p-2 rounded-xl bg-white/80 ${getIconColor()} group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{title}</span>
            <Badge variant="secondary" className="ml-auto bg-white/80 text-gray-700 font-semibold">
              {resources.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div
                key={resource.id || index}
                className="group/item bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-base mb-2 group-hover/item:text-gray-800">
                      {resource.title || resource.name}
                    </h4>

                    {/* Type-specific metadata */}
                    <div className="space-y-2 mb-3">
                      {resource.author && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Author:</span> {resource.author}
                          </p>
                        </div>
                      )}
                      {resource.creator && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Creator:</span> {resource.creator}
                          </p>
                        </div>
                      )}
                      {resource.platform && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Platform:</span> {resource.platform}
                          </p>
                        </div>
                      )}
                      {resource.source && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Source:</span> {resource.source}
                          </p>
                        </div>
                      )}
                      {resource.duration && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Duration:</span> {resource.duration}
                          </p>
                        </div>
                      )}
                      {resource.estimatedTime && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Time:</span> {resource.estimatedTime}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{resource.description}</p>

                    <div className="flex gap-2 flex-wrap">
                      {resource.difficulty && (
                        <Badge variant="outline" className="text-xs bg-white/80 border-gray-300">
                          {resource.difficulty}
                        </Badge>
                      )}
                      {resource.category && (
                        <Badge variant="outline" className="text-xs bg-white/80 border-gray-300">
                          {resource.category}
                        </Badge>
                      )}
                      {resource.cost && (
                        <Badge
                          variant={resource.cost === "Free" ? "default" : "outline"}
                          className={`text-xs ${resource.cost === "Free" ? "bg-green-500 text-white" : "bg-white/80 border-gray-300"}`}
                        >
                          {resource.cost}
                        </Badge>
                      )}
                      {isInstructorContent && (
                        <Badge
                          variant="default"
                          className="text-xs bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          Instructor's Choice
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {resource.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hover:bg-white/80 hover:scale-110 transition-all duration-300"
                      >
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {isInstructorContent && resource.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveManualResource(resource.id)}
                        className="hover:bg-red-100 hover:text-red-600 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Module Editor
            </h1>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <Brain className="h-8 w-8" />
            </div>
          </div>
          <p className="text-gray-600 text-lg">Create and customize your learning modules with AI-powered resources</p>
        </div>

        {/* Basic Information */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Sparkles className="h-6 w-6 text-blue-600" />
              Module Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-semibold text-gray-700">
                  Module Title
                </Label>
                <Input
                  id="title"
                  value={module.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors duration-300"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="order" className="text-base font-semibold text-gray-700">
                  Order
                </Label>
                <Input
                  id="order"
                  type="number"
                  value={module.order}
                  onChange={(e) => onUpdate({ order: Number.parseInt(e.target.value) })}
                  className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors duration-300"
                />
              </div>
            </div>

            <div className="space-y-3 mt-8">
              <Label htmlFor="content" className="text-base font-semibold text-gray-700">
                Content
              </Label>
              <Textarea
                id="content"
                value={module.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                rows={8}
                placeholder="Enter module content..."
                className="text-base border-2 border-gray-200 focus:border-blue-500 transition-colors duration-300 resize-none"
              />
            </div>

            <div className="space-y-3 mt-8">
              <Label htmlFor="summary" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                AI-Generated Summary
              </Label>
              <Textarea
                id="summary"
                value={module.summary}
                onChange={(e) => onUpdate({ summary: e.target.value })}
                rows={4}
                placeholder="AI will generate a summary..."
                className="text-base border-2 border-gray-200 focus:border-purple-500 transition-colors duration-300 resize-none bg-gradient-to-r from-purple-50/50 to-pink-50/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Learning Objectives and Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="h-6 w-6 text-blue-600" />
                Learning Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(module.objectives || []).map((objective, index) => (
                  <div key={index} className="flex gap-3 group">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors duration-300">
                      <Target className="h-4 w-4" />
                    </div>
                    <Input
                      value={objective}
                      onChange={(e) => {
                        const newObjectives = [...(module.objectives || [])]
                        newObjectives[index] = e.target.value
                        onUpdate({ objectives: newObjectives })
                      }}
                      placeholder="Learning objective"
                      className="flex-1 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-300"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newObjectives = module.objectives.filter((_, i) => i !== index)
                        onUpdate({ objectives: newObjectives })
                      }}
                      className="hover:bg-red-100 hover:text-red-600 transition-colors duration-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => onUpdate({ objectives: [...(module.objectives || []), ""] })}
                  className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Objective
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                Real-World Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(module.examples || []).map((example, index) => (
                  <div key={index} className="flex gap-3 group">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200 transition-colors duration-300">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <Input
                      value={example}
                      onChange={(e) => {
                        const newExamples = [...(module.examples || [])]
                        newExamples[index] = e.target.value
                        onUpdate({ examples: newExamples })
                      }}
                      placeholder="Real-world example"
                      className="flex-1 border-2 border-gray-200 focus:border-yellow-500 transition-colors duration-300"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newExamples = module.examples.filter((_, i) => i !== index)
                        onUpdate({ examples: newExamples })
                      }}
                      className="hover:bg-red-100 hover:text-red-600 transition-colors duration-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => onUpdate({ examples: [...(module.examples || []), ""] })}
                  className="w-full border-2 border-dashed border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Example
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Resources */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              Learning Resources
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs
              defaultValue={
                aiResources.books && aiResources.books.length > 0
                  ? "books"
                  : aiResources.courses && aiResources.courses.length > 0
                    ? "courses"
                    : aiResources.videos && aiResources.videos.length > 0
                      ? "videos"
                      : aiResources.articles && aiResources.articles.length > 0
                        ? "articles"
                        : aiResources.tools && aiResources.tools.length > 0
                          ? "tools"
                          : aiResources.websites && aiResources.websites.length > 0
                            ? "websites"
                            : aiResources.exercises && aiResources.exercises.length > 0
                              ? "exercises"
                              : "books"
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl">
                <TabsTrigger
                  value="books"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium">Books</span>
                  {aiResources.books && aiResources.books.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {aiResources.books.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="courses"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Video className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-medium">Courses</span>
                  {aiResources.courses && aiResources.courses.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {aiResources.courses.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="videos"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Play className="h-5 w-5 text-red-600" />
                  <span className="text-xs font-medium">Videos</span>
                  {aiResources.videos && aiResources.videos.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {aiResources.videos.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="articles"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium">Articles</span>
                  {aiResources.articles && aiResources.articles.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {aiResources.articles.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="tools"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Wrench className="h-5 w-5 text-orange-600" />
                  <span className="text-xs font-medium">Tools</span>
                  {aiResources.tools && aiResources.tools.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {aiResources.tools.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="websites"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Globe className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-medium">Websites</span>
                  {aiResources.websites && aiResources.websites.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {aiResources.websites.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="exercises"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Target className="h-5 w-5 text-pink-600" />
                  <span className="text-xs font-medium">Exercises</span>
                  {aiResources.exercises && aiResources.exercises.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {aiResources.exercises.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="mt-8">
                <TabsContent value="books" className="space-y-6">
                  <ResourceSection
                    title="Recommended Books"
                    icon={BookOpen}
                    resources={aiResources.books}
                    type="books"
                  />
                </TabsContent>

                <TabsContent value="courses" className="space-y-6">
                  <ResourceSection title="Online Courses" icon={Video} resources={aiResources.courses} type="courses" />
                </TabsContent>

                <TabsContent value="videos" className="space-y-6">
                  <ResourceSection title="Video Tutorials" icon={Play} resources={aiResources.videos} type="videos" />
                </TabsContent>

                <TabsContent value="articles" className="space-y-6">
                  <ResourceSection
                    title="Articles & Papers"
                    icon={FileText}
                    resources={aiResources.articles}
                    type="articles"
                  />
                </TabsContent>

                <TabsContent value="tools" className="space-y-6">
                  <ResourceSection title="Tools & Software" icon={Wrench} resources={aiResources.tools} type="tools" />
                </TabsContent>

                <TabsContent value="websites" className="space-y-6">
                  <ResourceSection
                    title="Useful Websites"
                    icon={Globe}
                    resources={aiResources.websites}
                    type="websites"
                  />
                </TabsContent>

                <TabsContent value="exercises" className="space-y-6">
                  <ResourceSection
                    title="Practice Exercises"
                    icon={Target}
                    resources={aiResources.exercises}
                    type="exercises"
                  />
                </TabsContent>
              </div>
            </Tabs>

        {/* Masterpieces from the Instructor */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Crown className="h-6 w-6" />
              </div>
              Masterpieces from the Instructor
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold"
              >
                <Star className="h-3 w-3 mr-1" />
                Your Curated Content
              </Badge>
              <Button
                onClick={() => setShowManualResourceForm(!showManualResourceForm)}
                variant="outline"
                size="sm"
                className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Masterpiece
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs
              defaultValue={
                instructorMasterpieces.articles.length > 0
                  ? "articles"
                  : instructorMasterpieces.videos.length > 0
                    ? "videos"
                    : instructorMasterpieces.books.length > 0
                      ? "books"
                      : instructorMasterpieces.courses.length > 0
                        ? "courses"
                        : instructorMasterpieces.tools.length > 0
                          ? "tools"
                          : instructorMasterpieces.websites.length > 0
                            ? "websites"
                            : instructorMasterpieces.exercises.length > 0
                              ? "exercises"
                              : "articles"
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-2 bg-gradient-to-r from-amber-100 to-orange-200 rounded-xl">
                <TabsTrigger
                  value="articles"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium">Articles</span>
                  {instructorMasterpieces.articles.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {instructorMasterpieces.articles.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="videos"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Play className="h-5 w-5 text-red-600" />
                  <span className="text-xs font-medium">Videos</span>
                  {instructorMasterpieces.videos.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {instructorMasterpieces.videos.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="books"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium">Books</span>
                  {instructorMasterpieces.books.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {instructorMasterpieces.books.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="courses"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Video className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-medium">Courses</span>
                  {instructorMasterpieces.courses.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {instructorMasterpieces.courses.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="tools"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Wrench className="h-5 w-5 text-orange-600" />
                  <span className="text-xs font-medium">Tools</span>
                  {instructorMasterpieces.tools.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {instructorMasterpieces.tools.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="websites"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Globe className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-medium">Websites</span>
                  {instructorMasterpieces.websites.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {instructorMasterpieces.websites.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="exercises"
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  <Target className="h-5 w-5 text-pink-600" />
                  <span className="text-xs font-medium">Exercises</span>
                  {instructorMasterpieces.exercises.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {instructorMasterpieces.exercises.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="mt-8">
                <TabsContent value="articles" className="space-y-6">
                  {instructorMasterpieces.articles.length > 0 ? (
                    <ResourceSection
                      title="Articles & Papers"
                      icon={FileText}
                      resources={instructorMasterpieces.articles}
                      type="articles"
                      isInstructorContent={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">No Articles Added Yet</h3>
                      <p className="text-gray-400 mb-4">Share your favorite articles and papers with students</p>
                      <Button
                        onClick={() => {
                          setNewResource(prev => ({ ...prev, type: 'article' }))
                          setShowManualResourceForm(true)
                        }}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Article
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="videos" className="space-y-6">
                  {instructorMasterpieces.videos.length > 0 ? (
                    <ResourceSection
                      title="Video Tutorials"
                      icon={Play}
                      resources={instructorMasterpieces.videos}
                      type="videos"
                      isInstructorContent={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">No Videos Added Yet</h3>
                      <p className="text-gray-400 mb-4">Share your recommended video tutorials</p>
                      <Button
                        onClick={() => {
                          setNewResource(prev => ({ ...prev, type: 'video' }))
                          setShowManualResourceForm(true)
                        }}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Video
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="books" className="space-y-6">
                  {instructorMasterpieces.books.length > 0 ? (
                    <ResourceSection
                      title="Recommended Books"
                      icon={BookOpen}
                      resources={instructorMasterpieces.books}
                      type="books"
                      isInstructorContent={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">No Books Added Yet</h3>
                      <p className="text-gray-400 mb-4">Recommend essential books for deeper learning</p>
                      <Button
                        onClick={() => {
                          setNewResource(prev => ({ ...prev, type: 'book' }))
                          setShowManualResourceForm(true)
                        }}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Book
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="courses" className="space-y-6">
                  {instructorMasterpieces.courses.length > 0 ? (
                    <ResourceSection
                      title="Online Courses"
                      icon={Video}
                      resources={instructorMasterpieces.courses}
                      type="courses"
                      isInstructorContent={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">No Courses Added Yet</h3>
                      <p className="text-gray-400 mb-4">Share complementary online courses</p>
                      <Button
                        onClick={() => {
                          setNewResource(prev => ({ ...prev, type: 'course' }))
                          setShowManualResourceForm(true)
                        }}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Course
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tools" className="space-y-6">
                  {instructorMasterpieces.tools.length > 0 ? (
                    <ResourceSection
                      title="Tools & Software"
                      icon={Wrench}
                      resources={instructorMasterpieces.tools}
                      type="tools"
                      isInstructorContent={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">No Tools Added Yet</h3>
                      <p className="text-gray-400 mb-4">Recommend useful tools and software</p>
                      <Button
                        onClick={() => {
                          setNewResource(prev => ({ ...prev, type: 'tool' }))
                          setShowManualResourceForm(true)
                        }}
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Tool
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="websites" className="space-y-6">
                  {instructorMasterpieces.websites.length > 0 ? (
                    <ResourceSection
                      title="Useful Websites"
                      icon={Globe}
                      resources={instructorMasterpieces.websites}
                      type="websites"
                      isInstructorContent={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">No Websites Added Yet</h3>
                      <p className="text-gray-400 mb-4">Share valuable websites and resources</p>
                      <Button
                        onClick={() => {
                          setNewResource(prev => ({ ...prev, type: 'website' }))
                          setShowManualResourceForm(true)
                        }}
                        variant="outline"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Website
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="exercises" className="space-y-6">
                  {instructorMasterpieces.exercises.length > 0 ? (
                    <ResourceSection
                      title="Practice Exercises"
                      icon={Target}
                      resources={instructorMasterpieces.exercises}
                      type="exercises"
                      isInstructorContent={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">No Exercises Added Yet</h3>
                      <p className="text-gray-400 mb-4">Add practice exercises and challenges</p>
                      <Button
                        onClick={() => {
                          setNewResource(prev => ({ ...prev, type: 'exercise' }))
                          setShowManualResourceForm(true)
                        }}
                        variant="outline"
                        className="border-pink-300 text-pink-700 hover:bg-pink-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Exercise
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {showManualResourceForm && (
              <Card className="mb-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-amber-800">
                    <Plus className="h-6 w-6" />
                    Add New Masterpiece
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">Resource Type</Label>
                    <Select
                      value={newResource.type}
                      onValueChange={(value) => setNewResource((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="h-12 border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80">
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            Article
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-red-600" />
                            Video
                          </div>
                        </SelectItem>
                        <SelectItem value="book">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            Book
                          </div>
                        </SelectItem>
                        <SelectItem value="course">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-purple-600" />
                            Course
                          </div>
                        </SelectItem>
                        <SelectItem value="tool">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            Tool
                          </div>
                        </SelectItem>
                        <SelectItem value="website">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-indigo-600" />
                            Website
                          </div>
                        </SelectItem>
                        <SelectItem value="exercise">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-pink-600" />
                            Exercise
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">Title</Label>
                    <Input
                      value={newResource.title}
                      onChange={(e) => setNewResource((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Resource title"
                      className="h-12 border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">URL (optional)</Label>
                    <Input
                      value={newResource.url}
                      onChange={(e) => setNewResource((prev) => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                      className="h-12 border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">Description</Label>
                    <Textarea
                      value={newResource.description}
                      onChange={(e) => setNewResource((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the resource and why you recommend it"
                      rows={3}
                      className="border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 resize-none bg-white/80"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddManualResource}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-6 py-2 transition-all duration-300 shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Masterpiece
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowManualResourceForm(false)}
                      className="border-2 border-amber-300 hover:border-amber-500 transition-colors duration-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
