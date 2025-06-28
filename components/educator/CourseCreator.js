"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Loader2, Plus, Trash2, Sparkles, BookOpen, Brain, Download, FileText, Zap } from "lucide-react"
import ModuleEditor from "./ModuleEditor"

export default function CourseCreator({ onCourseCreated }) {
  const [step, setStep] = useState(1)
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    modules: [],
    subject: "",
    learnerLevel: "",
    duration: "",
    objectives: []
  })
  const [loading, setLoading] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [file, setFile] = useState(null)
  const [generationType, setGenerationType] = useState("upload") // "upload", "generate"
  const [curriculumTopic, setCurriculumTopic] = useState("")
  const [generatedCurriculum, setGeneratedCurriculum] = useState("")
  const [showCurriculumPreview, setShowCurriculumPreview] = useState(false)
  const [currentCourseId, setCurrentCourseId] = useState(null)
  const { getAuthHeaders } = useAuth()

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Enhanced file validation
    const validTypes = ['application/pdf', 'text/markdown', 'text/plain']
    const validExtensions = ['.pdf', '.md', '.txt']
    const isValidType = validTypes.includes(selectedFile.type) || 
                       validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))
    
    if (!isValidType) {
      alert("Please select a PDF, Markdown (.md), or Text (.txt) file")
      return
    }

    // Enhanced file size validation (max 25MB for better content)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (selectedFile.size > maxSize) {
      alert("File size must be less than 25MB")
      return
    }

    setFile(selectedFile)
    setLoading(true)
    setProcessingProgress(0)
    setProcessingStep("Preparing file upload...")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("learnerLevel", courseData.learnerLevel)
      formData.append("subject", courseData.subject)

      console.log("Uploading file:", selectedFile.name, "Type:", selectedFile.type, "Size:", selectedFile.size)

      // Simulate progress stages
      const progressStages = [
        { step: "Uploading and parsing content...", progress: 20 },
        { step: "Analyzing document structure...", progress: 40 },
        { step: "Generating intelligent modules...", progress: 60 },
        { step: "Creating interactive resources...", progress: 80 },
        { step: "Finalizing course content...", progress: 95 }
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step)
          setProcessingProgress(progressStages[currentStage].progress)
          currentStage++
        }
      }, 2000)

      const response = await fetch("/api/courses/process", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        setProcessingStep("✅ Course created successfully!")
        console.log("✅ File processed successfully, received modules:", data.modules.length)
        
        setCourseData((prev) => ({
          ...prev,
          modules: data.modules,
          subject: data.subject || prev.subject,
        }))
        
        setTimeout(() => {
          setStep(2)
          alert(`🎉 Success! Processed "${selectedFile.name}" and created ${data.modules.length} intelligent modules!\n\n✨ Features included:\n• AI-generated summaries\n• Interactive visualizers\n• Code simulators\n• Comprehensive resources\n• Practice exercises\n\nClick OK to review and customize your course.`)
        }, 1000)
      } else {
        console.error("Server error:", data)
        setProcessingStep("❌ Processing failed")
        alert(data.error || "Failed to process file. Please try again or contact support.")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setProcessingStep("❌ Upload failed")
      alert(`Failed to upload file: ${error.message}`)
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProcessingStep("")
        setProcessingProgress(0)
      }, 2000)
    }
  }

  const handleManualModuleAdd = () => {
    const newModule = {
      id: `module-${Date.now()}`,
      title: "New Module",
      content: "",
      summary: "",
      objectives: [],
      examples: [],
      resources: [],
      order: courseData.modules.length + 1,
    }

    setCourseData((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule],
    }))
  }

  const updateModule = (moduleId, updates) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => (module.id === moduleId ? { ...module, ...updates } : module)),
    }))
  }

  const deleteModule = (moduleId) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.filter((module) => module.id !== moduleId),
    }))
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...courseData,
          status: "draft",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentCourseId(data.id || data._id) // Capture the course ID for publishing
        alert("Course saved as draft!")
        // Don't reset form here - keep data for potential publishing
      } else {
        const errorData = await response.json()
        alert(`Failed to save course: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error saving course:", error)
      alert("Failed to save course")
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!currentCourseId) {
      alert("Please save the course first before publishing")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${currentCourseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          status: "published",
        }),
      })

      if (response.ok) {
        alert("Course published successfully!")
        onCourseCreated?.()
        // Reset the form completely after successful publishing
        setStep(1)
        setCourseData({ 
          title: "", 
          description: "", 
          modules: [],
          subject: "",
          learnerLevel: "",
          duration: "",
          objectives: []
        })
        setCurriculumTopic("")
        setGeneratedCurriculum("")
        setShowCurriculumPreview(false)
        setGenerationType("upload")
        setCurrentCourseId(null)
      } else {
        const errorData = await response.json()
        alert(`Failed to publish course: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error publishing course:", error)
      alert("Failed to publish course")
    } finally {
      setLoading(false)
    }
  }

  // Generate curriculum with AI
  const handleGenerateCurriculum = async () => {
    if (!curriculumTopic.trim() || !courseData.learnerLevel) {
      alert("Please enter a topic and select a learner level")
      return
    }

    setLoading(true)
    setProcessingStep("🧠 AI is creating your curriculum outline...")
    setProcessingProgress(0)

    try {
      const progressStages = [
        { step: "🔍 Analyzing topic and learner level...", progress: 30 },
        { step: "� Creating simple module structure...", progress: 60 },
        { step: "🎯 Organizing key concepts...", progress: 90 }
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step)
          setProcessingProgress(progressStages[currentStage].progress)
          currentStage++
        }
      }, 1500)

      const response = await fetch("/api/courses/generate-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          topic: curriculumTopic,
          learnerLevel: courseData.learnerLevel,
          subject: courseData.subject,
          duration: courseData.duration,
          objectives: courseData.objectives,
          title: courseData.title,
          description: courseData.description
        }),
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const data = await response.json()

      if (response.ok) {
        setProcessingStep("✅ Simple curriculum outline ready!")
        setGeneratedCurriculum(data.curriculum)
        setShowCurriculumPreview(true)
        
        setTimeout(() => {
          alert(`🎉 Curriculum Outline Created!\n\n📖 Topic: ${curriculumTopic}\n🎯 Level: ${courseData.learnerLevel}\n📊 Modules: ${data.moduleCount || 'Multiple'}\n\n📝 This is a simple outline with modules and key concepts.\n💡 When you "Use This Curriculum", our AI will generate detailed content, resources, visualizers, and interactive elements for each module!`)
        }, 1000)
      } else {
        console.error("Curriculum generation error:", data)
        alert(data.error || "Failed to generate curriculum. Please try again.")
        setProcessingStep("❌ Generation failed")
      }
    } catch (error) {
      console.error("Curriculum generation error:", error)
      alert(`Failed to generate curriculum: ${error.message}`)
      setProcessingStep("❌ Generation failed")
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProcessingStep("")
        setProcessingProgress(0)
      }, 2000)
    }
  }

  // Use generated curriculum
  const handleUseCurriculum = async () => {
    if (!generatedCurriculum) return

    setLoading(true)
    setProcessingStep("🚀 Processing curriculum into detailed modules...")
    setProcessingProgress(0)

    try {
      const progressStages = [
        { step: "📖 Extracting modules from curriculum...", progress: 20 },
        { step: "🧠 Generating detailed content with AI...", progress: 40 },
        { step: "📚 Adding resources and examples...", progress: 60 },
        { step: "🎨 Creating visualizers and simulators...", progress: 80 },
        { step: "✨ Finalizing interactive elements...", progress: 95 }
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step)
          setProcessingProgress(progressStages[currentStage].progress)
          currentStage++
        }
      }, 2000)

      const response = await fetch("/api/courses/process-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          curriculum: generatedCurriculum,
          courseData: courseData
        }),
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const data = await response.json()

      if (response.ok) {
        setProcessingStep("✅ Detailed modules created successfully!")
        setCourseData((prev) => ({
          ...prev,
          modules: data.modules,
        }))
        setStep(2)
        setShowCurriculumPreview(false)
        
        setTimeout(() => {
          alert(`🎉 Curriculum Fully Processed!\n\n✨ Generated: ${data.modules.length} detailed modules\n📚 Each module includes:\n  • Rich content & explanations\n  • Interactive resources\n  • Visual learning aids\n  • Practice exercises\n  • Real-world examples\n\n🚀 Ready to review and publish!`)
        }, 1000)
      } else {
        alert(data.error || "Failed to process curriculum")
        setProcessingStep("❌ Processing failed")
      }
    } catch (error) {
      console.error("Curriculum processing error:", error)
      alert(`Failed to process curriculum: ${error.message}`)
      setProcessingStep("❌ Processing failed")
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProcessingStep("")
        setProcessingProgress(0)
      }, 2000)
    }
  }

  // Download curriculum as .md file
  const handleDownloadCurriculum = () => {
    if (!generatedCurriculum) return

    const blob = new Blob([generatedCurriculum], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${courseData.title || curriculumTopic}-curriculum.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (step === 1) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              Create New Course
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Choose your preferred method to create an engaging, AI-powered learning experience
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              generationType === "upload" 
                ? "border-blue-500 bg-blue-50/50 shadow-lg" 
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setGenerationType("upload")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">Upload Content</CardTitle>
              <CardDescription>
                Upload your existing PDF, Markdown, or text content and let AI enhance it
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              generationType === "generate" 
                ? "border-purple-500 bg-purple-50/50 shadow-lg" 
                : "border-gray-200 hover:border-purple-300"
            }`}
            onClick={() => setGenerationType("generate")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">AI Generate</CardTitle>
              <CardDescription>
                Let AI create a complete curriculum from scratch based on your topic and requirements
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Course Basic Information */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Course Information
            </CardTitle>
            <CardDescription>Provide basic details about your course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={(e) => setCourseData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Complete JavaScript Masterclass"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Category</Label>
                <Select 
                  value={courseData.subject} 
                  onValueChange={(value) => setCourseData((prev) => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select subject category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programming">Programming & Development</SelectItem>
                    <SelectItem value="data-science">Data Science & Analytics</SelectItem>
                    <SelectItem value="web-development">Web Development</SelectItem>
                    <SelectItem value="mobile-development">Mobile Development</SelectItem>
                    <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
                    <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="cloud-computing">Cloud Computing</SelectItem>
                    <SelectItem value="devops">DevOps & Infrastructure</SelectItem>
                    <SelectItem value="design">Design & UX/UI</SelectItem>
                    <SelectItem value="business">Business & Management</SelectItem>
                    <SelectItem value="marketing">Digital Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="learnerLevel">Target Learner Level *</Label>
                <Select 
                  value={courseData.learnerLevel} 
                  onValueChange={(value) => setCourseData((prev) => ({ ...prev, learnerLevel: value }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select learner level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Beginner - No prior experience</SelectItem>
                    <SelectItem value="intermediate">🌿 Intermediate - Some experience</SelectItem>
                    <SelectItem value="advanced">🌳 Advanced - Significant experience</SelectItem>
                    <SelectItem value="expert">🚀 Expert - Professional level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration</Label>
                <Select 
                  value={courseData.duration} 
                  onValueChange={(value) => setCourseData((prev) => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3 hours">⚡ 1-3 hours - Quick introduction</SelectItem>
                    <SelectItem value="4-8 hours">🕐 4-8 hours - Half day course</SelectItem>
                    <SelectItem value="1-2 days">📅 1-2 days - Intensive workshop</SelectItem>
                    <SelectItem value="1 week">📆 1 week - Comprehensive course</SelectItem>
                    <SelectItem value="2-4 weeks">🗓️ 2-4 weeks - Extended learning</SelectItem>
                    <SelectItem value="1+ months">📚 1+ months - Full curriculum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                value={courseData.description}
                onChange={(e) => setCourseData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn, key skills they'll gain, and who this course is for..."
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Generation Methods */}
        {generationType === "upload" && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Upload Course Content
              </CardTitle>
              <CardDescription>Upload your existing content and let AI enhance it with interactive features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.md,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={loading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-blue-600 animate-pulse" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-blue-800">{processingStep}</p>
                        {file && <p className="text-sm text-gray-600">{file.name}</p>}
                        <Progress value={processingProgress} className="w-full max-w-md mx-auto h-3" />
                        <p className="text-xs text-gray-500">
                          {processingProgress}% complete
                        </p>
                      </div>
                      <Alert className="max-w-md mx-auto bg-blue-50 border-blue-200">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          AI is creating enhanced modules with interactive visualizers, code simulators, and comprehensive learning resources...
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-800">
                          {file ? `✅ Selected: ${file.name}` : "Upload Your Course Content"}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Supported: PDF, Markdown (.md), Text (.txt) | Max: 25MB
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                            <Sparkles className="h-4 w-4" />
                            <span>AI Enhancement Features</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 max-w-md mx-auto">
                            <div>• Interactive Visualizers</div>
                            <div>• Code Simulators</div>
                            <div>• Smart Summaries</div>
                            <div>• Practice Exercises</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </label>
                {file && !loading && (
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFile(null)}
                    >
                      Clear File
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleFileUpload}
                      disabled={!courseData.title || !courseData.learnerLevel}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600"
                    >
                      Process File
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {generationType === "generate" && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Curriculum Generation
              </CardTitle>
              <CardDescription>
                Generate a simple curriculum outline with modules and key concepts. 
                Our AI will later add detailed content, resources, and interactive elements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="curriculumTopic">Course Topic *</Label>
                <Input
                  id="curriculumTopic"
                  value={curriculumTopic}
                  onChange={(e) => setCurriculumTopic(e.target.value)}
                  placeholder="e.g., Python for Data Science, React Development, Machine Learning Basics"
                  className="h-12"
                />
              </div>

              {loading ? (
                <div className="space-y-4 text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="h-6 w-6 text-purple-600 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-purple-800">{processingStep}</p>
                    <Progress value={processingProgress} className="w-full max-w-md mx-auto h-3" />
                    <p className="text-xs text-gray-500">{processingProgress}% complete</p>
                  </div>
                  <Alert className="max-w-md mx-auto bg-purple-50 border-purple-200">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      AI is designing a comprehensive curriculum with modules, objectives, and interactive content...
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateCurriculum}
                  disabled={!curriculumTopic.trim() || !courseData.learnerLevel || !courseData.title}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Simple Curriculum
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Curriculum Preview Modal */}
        {showCurriculumPreview && generatedCurriculum && (
          <Card className="bg-white shadow-2xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Simple Curriculum Outline
                </span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  AI Generated
                </Badge>
              </CardTitle>
              <CardDescription>
                Review this simple outline. When you proceed, our AI will generate detailed content, 
                resources, visualizers, and interactive elements for each module.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {generatedCurriculum.substring(0, 1000)}
                  {generatedCurriculum.length > 1000 && "...\n\n[Content truncated for preview]"}
                </pre>
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleDownloadCurriculum}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download .md
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCurriculumPreview(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUseCurriculum}
                  className="bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  🚀 Create Detailed Course Content
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-600">
            {generationType === "upload" ? "Upload content" : "Generate with AI"} • 
            <span className="font-medium"> {courseData.learnerLevel || "Select level"}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setStep(2)
              handleManualModuleAdd()
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Skip & Create Manually
          </Button>
        </div>
      </div>
    )
  }

  if (step === 2) {
    console.log("Rendering step 2 with courseData:", courseData)
    console.log("Number of modules:", courseData.modules.length)
    
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{courseData.title || "New Course"}</h2>
            <p className="text-gray-600">{courseData.modules.length} modules</p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="outline" onClick={handleManualModuleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Publish Course
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {courseData.modules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">No modules found. This might indicate an issue with file processing.</p>
                <Button onClick={() => setStep(1)} variant="outline">
                  Go Back to Upload
                </Button>
              </CardContent>
            </Card>
          ) : (
            courseData.modules.map((module, index) => (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      Module {index + 1}: {module.title}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => deleteModule(module.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ModuleEditor module={module} onUpdate={(updates) => updateModule(module.id, updates)} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  return null
}
