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
import { Upload, Loader2, Plus, Trash2, Sparkles, BookOpen, Brain, Download, FileText, Zap, CheckCircle, AlertTriangle, Info } from "lucide-react"
import ModuleEditor from "./ModuleEditor"
import { useContentValidation, useContentProcessor } from "@/lib/contentDisplayHooks"
import ContentDisplay from "@/components/ContentDisplay"

// Course Field Validator Component
function CourseFieldValidator({ field, value, onChange, placeholder, className, rows, multiline = false }) {
  const { isValid, errors, warnings, isValidating } = useContentValidation(value)
  const { processedContent, processed, hasErrors, hasMath } = useContentProcessor(value)
  
  const Component = multiline ? Textarea : Input
  
  const getValidationColor = () => {
    if (!value) return "border-gray-200"
    if (errors.length > 0) return "border-red-500"
    if (isValid) return "border-green-500"
    return "border-yellow-500"
  }

  const getValidationIcon = () => {
    if (!value) return null
    if (errors.length > 0) return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (isValid) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <Info className="h-4 w-4 text-yellow-500" />
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Component
          id={field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${className} ${getValidationColor()} transition-colors duration-200`}
          rows={rows}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      
      {/* Validation Messages */}
      {value && (
        <div className="space-y-1">
          {errors.length > 0 && (
            <Alert className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {errors.join(", ")}
              </AlertDescription>
            </Alert>
          )}
          
          {warnings.length > 0 && (
            <Alert className="py-2 border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-700">
                {warnings.join(", ")}
              </AlertDescription>
            </Alert>
          )}
          
          {isValid && processed && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Content validated • Ready for course creation
              {hasMath && " • LaTeX equations detected"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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

  const handleFileSelection = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Enhanced file validation with better type detection
    const fileName = selectedFile.name.toLowerCase()
    const validTypes = ['application/pdf', 'text/markdown', 'text/plain']
    const validExtensions = ['.pdf', '.md', '.txt', '.markdown']
    
    const hasValidType = validTypes.includes(selectedFile.type)
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
    const isValidFile = hasValidType || hasValidExtension
    
    // Special handling for markdown files which might have different MIME types
    const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.markdown') || selectedFile.type === 'text/markdown'
    const isPdf = fileName.endsWith('.pdf') || selectedFile.type === 'application/pdf'
    const isText = fileName.endsWith('.txt') || selectedFile.type === 'text/plain'
    
    if (!isValidFile && !isMarkdown && !isPdf && !isText) {
      alert("❌ Invalid file type!\n\nSupported formats:\n• PDF files (.pdf)\n• Markdown files (.md, .markdown)\n• Text files (.txt)\n\nPlease select a valid file type.")
      e.target.value = ''
      return
    }

    // Enhanced file size validation with better error message
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (selectedFile.size > maxSize) {
      const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1)
      alert(`❌ File too large!\n\nYour file: ${fileSizeMB}MB\nMax allowed: 25MB\n\nPlease select a smaller file or compress your content.`)
      e.target.value = ''
      return
    }

    // Warn for very small files that might not have enough content
    if (selectedFile.size < 1024) { // Less than 1KB
      const proceed = confirm("⚠️ Small file detected!\n\nThis file appears to be very small and might not contain enough content for a meaningful course.\n\nDo you want to proceed anyway?")
      if (!proceed) {
        e.target.value = ''
        return
      }
    }

    setFile(selectedFile)
    const fileSizeFormatted = selectedFile.size < 1024 * 1024 
      ? `${(selectedFile.size / 1024).toFixed(1)}KB` 
      : `${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB`
    
    console.log("✅ File selected:", {
      name: selectedFile.name,
      type: selectedFile.type,
      size: fileSizeFormatted,
      detectedFormat: isPdf ? 'PDF' : isMarkdown ? 'Markdown' : 'Text'
    })
  }

  const processUploadedFile = async () => {
    if (!file) {
      alert("❌ No file selected!\n\nPlease select a PDF, Markdown, or Text file to upload.")
      return
    }

    // Validate required course information with detailed messages
    if (!courseData.title.trim()) {
      alert("📝 Course title required!\n\nPlease enter a descriptive title for your course before processing the file.\n\nExample: 'Complete JavaScript Fundamentals'")
      return
    }

    if (!courseData.learnerLevel) {
      alert("🎯 Learner level required!\n\nPlease select the target learner level to help AI create appropriate content:\n\n• Beginner - No prior experience\n• Intermediate - Some experience\n• Advanced - Significant experience\n• Expert - Professional level")
      return
    }

    // Optional but recommended validations
    if (!courseData.subject) {
      const proceed = confirm("💡 Subject category not selected!\n\nWe recommend selecting a subject category to help AI generate better content.\n\nDo you want to proceed without a subject category?")
      if (!proceed) return
    }

    setLoading(true)
    setProcessingProgress(0)
    setProcessingStep("Preparing file upload...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("learnerLevel", courseData.learnerLevel)
      formData.append("subject", courseData.subject || "")
      formData.append("title", courseData.title)
      formData.append("description", courseData.description || "")
      formData.append("duration", courseData.duration || "")

      console.log("Processing file:", file.name, "with course data:", {
        title: courseData.title,
        learnerLevel: courseData.learnerLevel,
        subject: courseData.subject
      })

      // Add debugging for fetch request
      console.log("🔄 Making fetch request to:", "/api/courses/process")
      console.log("🔄 Request headers:", getAuthHeaders())
      console.log("🔄 FormData contents:", {
        file: file.name,
        learnerLevel: courseData.learnerLevel,
        subject: courseData.subject || "",
        title: courseData.title,
        description: courseData.description || "",
        duration: courseData.duration || ""
      })

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

      let response
      try {
        console.log("🚀 Starting fetch request...")
        response = await fetch("/api/courses/process", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      })
        console.log("✅ Fetch completed, response received:", response.status)
      } catch (fetchError) {
        console.error("❌ Fetch request failed:", fetchError)
        throw new Error(`Network error: ${fetchError.message}. Please check if the development server is running on the correct port.`)
      }

      clearInterval(progressInterval)
      setProcessingProgress(100)

      console.log("Response status:", response.status)
      
      if (!response.ok) {
        let errorMessage = "Failed to process file"
        try {
          const errorData = await response.json()
          console.log("❌ Server error response:", errorData)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("Failed to parse error response:", e)
          errorMessage = `Server error (${response.status}): ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Response data:", data)

        setProcessingStep("✅ Course created successfully!")
      console.log("✅ File processed successfully, received modules:", data.modules?.length || 0)
      
      if (!data.modules || data.modules.length === 0) {
        throw new Error("No modules were generated from the uploaded content")
      }
        
        setCourseData((prev) => ({
          ...prev,
          modules: data.modules,
          subject: data.subject || prev.subject,
        // Update title and description if they were enhanced by AI
        title: data.title || prev.title,
        description: data.description || prev.description,
        }))
        
        setTimeout(() => {
          setStep(2)
        const successMessage = `🎉 Course Creation Successful!\n\n📊 Processing Results:\n• File: ${file.name}\n• Modules Created: ${data.modules.length}\n• Target Level: ${courseData.learnerLevel}\n• Subject: ${courseData.subject || 'General'}\n\n✨ AI Enhancements Applied:\n• Smart content summaries\n• Learning objectives\n• Interactive visualizers\n• Code simulators\n• Comprehensive resources\n• Practice exercises\n\n🚀 Ready to review and customize your course!`
        alert(successMessage)
        }, 1000)

    } catch (error) {
      console.error("Processing error:", error)
        setProcessingStep("❌ Processing failed")
      
      // Provide specific error messages based on error type
      let errorMessage = "❌ File Processing Failed!\n\n"
      
      if (error.message.includes("No modules were generated")) {
        errorMessage += "The uploaded file couldn't be processed into learning modules. This might happen if:\n\n• The file is corrupted or unreadable\n• The content is too short or lacks structure\n• The file format isn't properly supported\n\n💡 Try:\n• Using a different file\n• Checking file integrity\n• Adding more content to your file"
      } else if (error.message.includes("Course title is required")) {
        errorMessage += "Course title is missing. Please ensure you've entered a course title before uploading."
      } else if (error.message.includes("Learner level is required")) {
        errorMessage += "Learner level is missing. Please select a target learner level before uploading."
      } else if (error.message.includes("Failed to process file")) {
        errorMessage += `Server processing error: ${error.message}\n\n💡 This might be a temporary issue. Please try:\n• Refreshing the page\n• Uploading again in a few minutes\n• Using a smaller file\n• Contacting support if the issue persists`
      } else {
        errorMessage += `Unexpected error: ${error.message}\n\n💡 Please try:\n• Refreshing the page and trying again\n• Using a different file\n• Contacting support if the issue continues`
      }
      
      alert(errorMessage)
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
        resetForm()
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
        { step: "🌱 Creating simple module structure...", progress: 60 },
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
        { step: "🧠 Analyzing curriculum structure...", progress: 15, description: "Understanding your course outline and identifying key modules" },
        { step: "📚 Generating comprehensive content...", progress: 30, description: "Creating detailed explanations, examples, and learning materials" },
        { step: "🎨 Building interactive elements...", progress: 50, description: "Adding quizzes, exercises, and hands-on activities" },
        { step: "📊 Creating visual aids...", progress: 70, description: "Generating charts, diagrams, and visual learning tools" },
        { step: "🔗 Adding resources & references...", progress: 85, description: "Curating additional materials and external resources" },
        { step: "✨ Finalizing course structure...", progress: 95, description: "Optimizing content flow and learning progression" }
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step)
          setProcessingProgress(progressStages[currentStage].progress)
          currentStage++
        }
      }, 3000) // Slower transitions for better UX

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
        
        // Show completion message immediately
        setTimeout(() => {
        setStep(2)
        setShowCurriculumPreview(false)
        
          // Enhanced success message
        setTimeout(() => {
            alert(`🎉 Curriculum Transformation Complete!\n\n✨ Successfully generated ${data.modules.length} detailed modules\n\n📚 Your course now includes:\n  • Rich content & explanations\n  • Interactive learning activities\n  • Visual aids & diagrams\n  • Practice exercises & quizzes\n  • Real-world examples & case studies\n  • Curated resources & references\n\n🚀 Ready to review, customize, and publish!\n\n💡 Tip: You can edit any module content to match your teaching style.`)
        }, 1000)
        }, 500)
      } else {
        console.error("Curriculum processing error:", data)
        alert(`❌ Processing Failed\n\n${data.error || "Unable to process curriculum at this time."}\n\nPlease try again or contact support if the issue persists.`)
        setProcessingStep("❌ Processing failed")
      }
    } catch (error) {
      console.error("Curriculum processing error:", error)
      alert(`🚫 Connection Error\n\nFailed to process curriculum: ${error.message}\n\nPlease check your internet connection and try again.`)
      setProcessingStep("❌ Connection failed")
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProcessingStep("")
        setProcessingProgress(0)
      }, 3000) // Keep loading state visible longer for better UX
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

  const resetForm = () => {
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
    setFile(null)
    setLoading(false)
    setProcessingStep("")
    setProcessingProgress(0)
    
    // Clear file input
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = ''
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
                <CourseFieldValidator
                  field="title"
                  value={courseData.title}
                  onChange={(value) => setCourseData((prev) => ({ ...prev, title: value }))}
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
              <CourseFieldValidator
                field="description"
                value={courseData.description}
                onChange={(value) => setCourseData((prev) => ({ ...prev, description: value }))}
                placeholder="Describe what students will learn, key skills they'll gain, and who this course is for..."
                rows={4}
                className="resize-none"
                multiline={true}
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
                  accept=".pdf,.md,.markdown,.txt"
                  onChange={handleFileSelection}
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
                          {file ? `✅ File Selected` : "Upload Your Course Content"}
                        </p>
                        {file && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800">📄 {file.name}</p>
                            <p className="text-xs text-blue-600">
                              Size: {file.size < 1024 * 1024 
                                ? `${(file.size / 1024).toFixed(1)}KB` 
                                : `${(file.size / (1024 * 1024)).toFixed(1)}MB`}
                              {" • "}
                              Type: {file.name.toLowerCase().endsWith('.pdf') ? 'PDF Document' 
                                   : file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown') ? 'Markdown' 
                                   : 'Text Document'}
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          Supported: PDF (.pdf), Markdown (.md, .markdown), Text (.txt) | Max: 25MB
                        </p>
                        {(!courseData.title.trim() || !courseData.learnerLevel) && (
                          <p className="text-xs text-amber-600 mt-2 font-medium">
                            ⚠️ Complete course title and learner level above to enable processing
                          </p>
                        )}
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
                      onClick={() => {
                        setFile(null)
                        // Clear the file input as well
                        const fileInput = document.getElementById('file-upload')
                        if (fileInput) fileInput.value = ''
                      }}
                    >
                      Clear File
                    </Button>
                    <Button 
                      size="sm"
                      onClick={processUploadedFile}
                      disabled={!courseData.title.trim() || !courseData.learnerLevel}
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
          <Card className="relative bg-white shadow-2xl border-2 border-purple-200">
            {loading && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                <div className="text-center space-y-8 p-8">
                  {/* Beautiful Animated Spinner */}
                  <div className="relative flex items-center justify-center">
                    {/* Outer rotating ring */}
                    <div className="absolute w-32 h-32 border-4 border-purple-200 rounded-full animate-spin"></div>
                    {/* Inner pulsing ring */}
                    <div className="absolute w-24 h-24 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    {/* Center icon */}
                    <div className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center animate-pulse">
                      <Brain className="h-8 w-8 text-white animate-bounce" />
                    </div>
                    {/* Floating particles */}
                    <div className="absolute w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ top: '10%', left: '20%', animationDelay: '0s' }}></div>
                    <div className="absolute w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{ top: '80%', right: '15%', animationDelay: '1s' }}></div>
                    <div className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{ bottom: '20%', left: '10%', animationDelay: '2s' }}></div>
                    <div className="absolute w-1 h-1 bg-indigo-400 rounded-full animate-ping" style={{ top: '30%', right: '25%', animationDelay: '0.5s' }}></div>
                  </div>

                  {/* Processing Status */}
                  <div className="space-y-6 max-w-md mx-auto">
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        🤖 AI is Crafting Your Course
                      </h3>
                      <p className="text-lg font-semibold text-purple-800 animate-pulse">
                        {processingStep}
                      </p>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Progress 
                          value={processingProgress} 
                          className="w-full h-4 bg-purple-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex justify-between text-sm text-purple-600 font-medium">
                        <span>0%</span>
                        <span className="animate-pulse">{processingProgress}% Complete</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Motivational Message */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-6 w-6 text-white animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-purple-800 mb-2">✨ Creating Magic</h4>
                          <p className="text-sm text-purple-700 leading-relaxed">
                            Our AI is transforming your curriculum into an engaging, interactive learning experience with rich content, visual aids, and hands-on activities.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fun Facts */}
                    <div className="text-center space-y-2">
                      <p className="text-xs text-purple-600 font-medium">💡 Did you know?</p>
                      <p className="text-sm text-purple-700">
                        Interactive courses have <span className="font-bold text-purple-800">75% higher</span> completion rates!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
                  disabled={loading}
                >
                  <Download className="h-4 w-4" />
                  Download .md
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCurriculumPreview(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUseCurriculum}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                  🚀 Create Detailed Course Content
                    </>
                  )}
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
