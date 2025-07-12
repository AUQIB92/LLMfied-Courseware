"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ExamContentEditor from "./ExamContentEditor"
import ExamGeniusCourseCreator from "./ExamGeniusCourseCreator"
import { toast } from "sonner"
import {
  Plus,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Users,
  Star,
  Edit3,
  Trash2,
  Play,
  BarChart3,
  Brain,
  Zap,
  Award,
  CheckCircle,
  AlertCircle,
  Settings,
  Search,
  Filter,
  Calendar,
  FileText,
  Globe,
  ChevronRight,
  Sparkles,
  GraduationCap,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  BookmarkPlus,
  Upload,
  Loader2,
  Download,
  X,
  Eye
} from "lucide-react"
import { parseCurriculumOutline } from "@/lib/curriculumParser"
import { Textarea } from "@/components/ui/textarea"

export default function ExamGenius() {
  const { user, getAuthHeaders } = useAuth()
  const [activeView, setActiveView] = useState("dashboard")
  const [examCourses, setExamCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCourse, setEditingCourse] = useState(null)
  const [showCourseCreator, setShowCourseCreator] = useState(false)
  
  // Course creation workflow states
  const [creationStep, setCreationStep] = useState(1) // 1: Basic Info, 2: Curriculum Generation, 3: Review & Process
  const [generationType, setGenerationType] = useState("generate") // "upload", "generate"
  const [processingStep, setProcessingStep] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [file, setFile] = useState(null)
  const [curriculumTopic, setCurriculumTopic] = useState("")
  const [generatedCurriculum, setGeneratedCurriculum] = useState("")
  const [showCurriculumPreview, setShowCurriculumPreview] = useState(false)
  const [moduleTopics, setModuleTopics] = useState("")
  const [teachingNotes, setTeachingNotes] = useState("")
  const [numberOfModules, setNumberOfModules] = useState(8)
  const [finalizedCurriculum, setFinalizedCurriculum] = useState(null)
  const [showFinalizeStep, setShowFinalizeStep] = useState(false)
  
  const [newCourseData, setNewCourseData] = useState({
    title: "",
    description: "",
    examType: "",
    subject: "",
    learnerLevel: "intermediate",
    duration: "",
    difficultyLevel: "medium",
    modules: []
  })

  const [stats, setStats] = useState({
    totalExamCourses: 0,
    activeStudents: 0,
    completionRate: 0,
    averageScore: 0
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all") // "all", "published", "draft"

  // Computed filtered courses
  const filteredCourses = examCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesExamType = filterType === "all" || course.examType === filterType
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && course.isPublished) ||
                         (statusFilter === "draft" && !course.isPublished)
    
    return matchesSearch && matchesExamType && matchesStatus
  })

  // Separate published and draft courses
  const publishedCourses = examCourses.filter(course => course.isPublished)
  const draftCourses = examCourses.filter(course => !course.isPublished)

  const examTypes = [
    { id: "jee", name: "JEE Main/Advanced", icon: "🔬", color: "blue" },
    { id: "neet", name: "NEET", icon: "🏥", color: "green" },
    { id: "gate", name: "GATE", icon: "⚙️", color: "purple" },
    { id: "cat", name: "CAT", icon: "💼", color: "orange" },
    { id: "upsc", name: "UPSC", icon: "🏛️", color: "red" },
    { id: "banking", name: "Banking", icon: "🏦", color: "cyan" },
    { id: "ssc", name: "SSC", icon: "📊", color: "pink" },
    { id: "custom", name: "Custom", icon: "⚡", color: "yellow" }
  ]

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science",
    "General Knowledge", "Reasoning", "Economics", "History", "Geography", "Other"
  ]

  useEffect(() => {
    if (user) {
      fetchExamCourses()
      fetchStats()
    }
  }, [user])

  const fetchExamCourses = async () => {
    try {
      setLoading(true)
      console.log("🔍 ExamGenius: Fetching courses for user:", user.id)
      
      const response = await fetch(`/api/courses?educatorId=${user.id}&isExamGenius=true`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📊 ExamGenius: Raw courses data:", data)
        console.log("📊 ExamGenius: Total courses received:", data.length)
        
        // Additional client-side filtering to ensure only ExamGenius courses are shown
        const examGeniusCourses = Array.isArray(data) 
          ? data.filter(course => {
              const isExamGenius = course.isExamGenius === true
              const isCompetitiveExam = course.isCompetitiveExam === true
              const hasModules = course.modules && Array.isArray(course.modules)
              const moduleCount = hasModules ? course.modules.length : 0
              
              console.log(`📝 Course: ${course.title}`, {
                isExamGenius,
                isCompetitiveExam,
                hasModules,
                moduleCount,
                examType: course.examType,
                subject: course.subject,
                id: course._id || course.id
              })
              
              return isExamGenius || isCompetitiveExam
            })
          : []
          
        console.log("✅ ExamGenius: Filtered courses:", examGeniusCourses.length)
        examGeniusCourses.forEach(course => {
          console.log(`📋 ExamGenius Course: ${course.title} - Modules: ${course.modules?.length || 0}`)
        })
        
        setExamCourses(examGeniusCourses)
      } else {
        console.error("❌ ExamGenius: Failed to fetch exam courses", response.status)
        setExamCourses([])
      }
    } catch (error) {
      console.error("❌ ExamGenius: Error fetching exam courses:", error)
      setExamCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats?type=examgenius&isExamGenius=true`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Set default stats if API fails
      setStats({
        totalExamCourses: 0,
        activeStudents: 0,
        completionRate: 0,
        averageScore: 0
      })
    }
  }

  // Handle file selection for upload
  const handleFileSelection = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      // Check file size (25MB limit)
      if (selectedFile.size > 25 * 1024 * 1024) {
        alert("File size must be less than 25MB")
        return
      }

      // Check file type
      const allowedTypes = ["application/pdf", "text/markdown", "text/plain", "application/x-markdown"]
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.md')) {
        alert("Please select a PDF, Markdown (.md), or Text (.txt) file")
        return
      }

      setFile(selectedFile)
      toast.success(`File "${selectedFile.name}" selected successfully`)
    }
  }

  // Generate curriculum with ExamGenius AI
  const handleGenerateCurriculum = async () => {
    if (!curriculumTopic.trim() || !newCourseData.examType || !newCourseData.subject) {
      alert("Please enter a topic, select exam type, and subject")
      return
    }

    setLoading(true)
    setProcessingStep("🧠 AI is creating your competitive exam curriculum...")
    setProcessingProgress(0)

    try {
      const progressStages = [
        { step: "🔍 Analyzing exam pattern and requirements...", progress: 25 },
        { step: "📚 Creating exam-focused module structure...", progress: 50 },
        { step: "🎯 Organizing competitive strategies...", progress: 75 },
        { step: "⚡ Adding speed techniques and shortcuts...", progress: 90 }
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step)
          setProcessingProgress(progressStages[currentStage].progress)
          currentStage++
        }
      }, 2000)

      const response = await fetch("/api/exam-genius/generate-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          topic: curriculumTopic,
          examType: newCourseData.examType,
          subject: newCourseData.subject,
          learnerLevel: newCourseData.learnerLevel,
          duration: newCourseData.duration,
          title: newCourseData.title,
          description: newCourseData.description,
          moduleTopics: moduleTopics,
          teachingNotes: teachingNotes,
          numberOfModules: numberOfModules
        }),
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const data = await response.json()

      if (response.ok) {
        setProcessingStep("✅ Competitive exam curriculum ready!")
        setGeneratedCurriculum(data.curriculum)
        setShowCurriculumPreview(true)
        
        setTimeout(() => {
          toast.success(`🎉 ${newCourseData.examType.toUpperCase()} Curriculum Created!\n\n📖 Topic: ${curriculumTopic}\n🎯 Level: ${newCourseData.learnerLevel}\n📊 Modules: ${data.moduleCount || numberOfModules}\n\n🏆 Exam-focused curriculum with strategies, shortcuts, and practice questions ready for processing!`)
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

  // Process uploaded file
  const handleProcessFile = async () => {
    if (!file) {
      alert("Please select a file first")
      return
    }

    setLoading(true)
    setProcessingStep("📄 Processing uploaded content...")
    setProcessingProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("learnerLevel", newCourseData.learnerLevel)
      formData.append("subject", newCourseData.subject)
      formData.append("title", newCourseData.title)
      formData.append("description", newCourseData.description)
      formData.append("duration", newCourseData.duration)
      formData.append("examType", newCourseData.examType)
      formData.append("isCompetitiveExam", "true")

      const progressStages = [
        { step: "📖 Reading and analyzing content...", progress: 20 },
        { step: "🧠 Extracting key concepts...", progress: 40 },
        { step: "🎯 Creating exam-focused modules...", progress: 60 },
        { step: "⚡ Adding competitive strategies...", progress: 80 },
        { step: "✨ Finalizing course structure...", progress: 95 }
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step)
          setProcessingProgress(progressStages[currentStage].progress)
          currentStage++
        }
      }, 3000)

      const response = await fetch("/api/courses/process", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const data = await response.json()

      if (response.ok) {
        setProcessingStep("✅ Content processed successfully!")
        setNewCourseData(prev => ({
          ...prev,
          modules: data.modules
        }))
        
        setTimeout(() => {
          setCreationStep(3)
          toast.success(`🎉 Content Processing Complete!\n\n✨ Successfully created ${data.modules.length} exam-focused modules\n\n🏆 Your competitive exam course is ready for final review and publishing!`)
        }, 1000)
      } else {
        console.error("File processing error:", data)
        alert(data.error || "Failed to process file. Please try again.")
        setProcessingStep("❌ Processing failed")
      }
    } catch (error) {
      console.error("File processing error:", error)
      alert(`Failed to process file: ${error.message}`)
      setProcessingStep("❌ Processing failed")
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProcessingStep("")
        setProcessingProgress(0)
      }, 2000)
    }
  }

  // Process generated curriculum
  const handleProcessCurriculum = async () => {
    // Use finalizedCurriculum if available, else fallback to generatedCurriculum
    const curriculumToProcess = finalizedCurriculum || parseCurriculumOutline(generatedCurriculum)
    if (!curriculumToProcess || !curriculumToProcess.modules || curriculumToProcess.modules.length === 0) return

    setLoading(true)
    setProcessingStep("🚀 Processing curriculum into detailed competitive exam modules...")
    setProcessingProgress(0)

    try {
      const progressStages = [
        { step: "🧠 Analyzing curriculum structure...", progress: 15 },
        { step: "📚 Generating comprehensive exam content...", progress: 30 },
        { step: "🎯 Creating practice questions and strategies...", progress: 50 },
        { step: "⚡ Adding shortcuts and time-saving techniques...", progress: 70 },
        { step: "🏆 Integrating exam-specific resources...", progress: 85 },
        { step: "✨ Finalizing competitive exam course...", progress: 95 }
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step)
          setProcessingProgress(progressStages[currentStage].progress)
          currentStage++
        }
      }, 3000)

      const response = await fetch("/api/exam-genius/process-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          curriculum: curriculumToProcess, // Now sending structured curriculum
          courseData: {
            ...newCourseData,
            isCompetitiveExam: true,
            isExamGenius: true
          }
        }),
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const data = await response.json()

      if (response.ok) {
        setProcessingStep("✅ Competitive exam modules created successfully!")
        setNewCourseData(prev => ({
          ...prev,
          modules: data.modules
        }))
        setTimeout(() => {
          setCreationStep(3)
          setShowCurriculumPreview(false)
          toast.success(`🎉 ${newCourseData.examType.toUpperCase()} Curriculum Processing Complete!\n\n✨ Successfully generated ${data.modules.length} detailed competitive exam modules\n\n🏆 Your course now includes exam strategies, shortcuts, practice questions, and time-saving techniques!`)
        }, 1000)
      } else {
        console.error("Curriculum processing error:", data)
        alert(data.error || "Failed to process curriculum. Please try again.")
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
      }, 3000)
    }
  }

  // Create final course with processed modules
  const handleCreateFinalCourse = async () => {
    try {
      const courseData = {
        ...newCourseData,
        isCompetitiveExam: true,
        isExamGenius: true,
        educatorId: user.id,
        modules: newCourseData.modules.map(module => ({
          ...module,
          isCompetitiveExam: true,
          examType: newCourseData.examType,
          subject: newCourseData.subject,
          learnerLevel: newCourseData.learnerLevel
        }))
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(courseData)
      })

      if (response.ok) {
        const newCourse = await response.json()
        setEditingCourse(newCourse)
        setActiveView("editor")
        toast.success("Competitive exam course created successfully!")
        
        // Reset form
        resetCourseForm()
        fetchExamCourses()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create course")
      }
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("An error occurred while creating the course")
    }
  }

  // Reset course creation form
  const resetCourseForm = () => {
    setCreationStep(1)
    setGenerationType("generate")
    setProcessingStep("")
    setProcessingProgress(0)
    setFile(null)
    setCurriculumTopic("")
    setGeneratedCurriculum("")
    setShowCurriculumPreview(false)
    setModuleTopics("")
    setTeachingNotes("")
    setNumberOfModules(8)
    setNewCourseData({
      title: "",
      description: "",
      examType: "",
      subject: "",
      learnerLevel: "intermediate",
      duration: "",
      difficultyLevel: "medium",
      modules: []
    })
    setLoading(false)
    
    // Clear file input
    const fileInput = document.getElementById('exam-file-upload')
    if (fileInput) fileInput.value = ''
  }

  // Download curriculum as .md file
  const handleDownloadCurriculum = () => {
    if (!generatedCurriculum) return

    const blob = new Blob([generatedCurriculum], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${newCourseData.title || curriculumTopic}-${newCourseData.examType}-curriculum.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // After curriculum is generated, parse and show finalize step
  useEffect(() => {
    if (generatedCurriculum && !finalizedCurriculum) {
      const parsed = parseCurriculumOutline(generatedCurriculum)
      setFinalizedCurriculum(parsed)
      setShowFinalizeStep(true)
    }
  }, [generatedCurriculum])

  // Handler for user confirming curriculum finalization
  const handleFinalizeCurriculum = () => {
    setShowFinalizeStep(false)
    // Optionally, you could allow editing finalizedCurriculum here
    // For now, just proceed to processing
    handleProcessCurriculum()
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setActiveView("editor")
  }

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        setExamCourses(examCourses.filter(c => c.id !== courseId && c._id !== courseId))
        toast.success("Course deleted successfully!")
      } else {
        throw new Error("Failed to delete course")
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course. Please try again.")
    }
  }

  const handleBackFromEditor = () => {
    setEditingCourse(null)
    setActiveView("dashboard")
    fetchExamCourses()
    fetchStats()
  }

  const handleCourseCreated = (newCourse) => {
    setShowCourseCreator(false)
    setActiveView("dashboard")
    fetchExamCourses()
    fetchStats()
    toast.success("🎉 Course created successfully! You can now edit and manage your modules.")
  }

  const handleCourseSaved = async (updatedCourse) => {
    try {
      console.log("🔄 Saving ExamGenius course:", {
        courseId: updatedCourse.id || updatedCourse._id,
        title: updatedCourse.title,
        examType: updatedCourse.examType,
        moduleCount: updatedCourse.modules?.length || 0
      })

      // Use the ExamGenius save-course endpoint for updating courses
      const response = await fetch("/api/exam-genius/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          course: {
            ...updatedCourse,
            _id: updatedCourse.id || updatedCourse._id,
            isExamGenius: true,
            isCompetitiveExam: true,
            // Preserve the existing status or set to draft
            status: updatedCourse.status || updatedCourse.isPublished ? "published" : "draft"
          }
        }),
      })

      console.log("💾 Save response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Course saved successfully:", data)
        toast.success("🎉 Course saved successfully!")
        fetchExamCourses()
      } else {
        const errorText = await response.text()
        console.error("❌ Save failed:", response.status, response.statusText, errorText)
        
        let errorMessage = "Failed to save course"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("💥 Error saving course:", error)
      toast.error(`Failed to save course: ${error.message}`)
    }
  }

  const getExamTypeConfig = (examType) => {
    return examTypes.find(type => type.id === examType) || examTypes[examTypes.length - 1]
  }

  if (activeView === "editor" && editingCourse) {
    return (
      <ExamContentEditor
        course={editingCourse}
        onBack={handleBackFromEditor}
        onSave={handleCourseSaved}
      />
    )
  }

  if (showCourseCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setShowCourseCreator(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <ExamGeniusCourseCreator onCourseCreated={handleCourseCreated} />
        </div>
      </div>
    )
  }

  // Show curriculum finalization step if needed
  if (showFinalizeStep && finalizedCurriculum) {
    const handleModuleChange = (idx, field, value) => {
      const updated = [...finalizedCurriculum.modules]
      updated[idx][field] = value
      setFinalizedCurriculum({ ...finalizedCurriculum, modules: updated })
    }
    const handleKeyConceptChange = (modIdx, kcIdx, value) => {
      const updated = [...finalizedCurriculum.modules]
      updated[modIdx].keyConcepts[kcIdx] = value
      setFinalizedCurriculum({ ...finalizedCurriculum, modules: updated })
    }
    const handleAddKeyConcept = (modIdx) => {
      const updated = [...finalizedCurriculum.modules]
      updated[modIdx].keyConcepts.push("")
      setFinalizedCurriculum({ ...finalizedCurriculum, modules: updated })
    }
    const handleRemoveKeyConcept = (modIdx, kcIdx) => {
      const updated = [...finalizedCurriculum.modules]
      updated[modIdx].keyConcepts.splice(kcIdx, 1)
      setFinalizedCurriculum({ ...finalizedCurriculum, modules: updated })
    }
    const handleAddModule = () => {
      const updated = [...finalizedCurriculum.modules]
      updated.push({
        number: updated.length + 1,
        title: "New Module",
        objective: "",
        keyConcepts: [""]
      })
      setFinalizedCurriculum({ ...finalizedCurriculum, modules: updated })
    }
    const handleRemoveModule = (modIdx) => {
      const updated = [...finalizedCurriculum.modules]
      updated.splice(modIdx, 1)
      // Re-number modules
      updated.forEach((m, i) => { m.number = i + 1 })
      setFinalizedCurriculum({ ...finalizedCurriculum, modules: updated })
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Finalize Curriculum Structure</h2>
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Course Overview</h3>
            <p className="mb-2"><b>Description:</b> {finalizedCurriculum.overview.description}</p>
            <p className="mb-2"><b>Objectives:</b> {finalizedCurriculum.overview.objectives?.join(", ")}</p>
            <p className="mb-2"><b>Prerequisites:</b> {finalizedCurriculum.overview.prerequisites?.join(", ")}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Modules</h3>
            <ol className="list-decimal ml-6">
              {finalizedCurriculum.modules.map((mod, idx) => (
                <li key={mod.number} className="mb-6 border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={mod.title}
                      onChange={e => handleModuleChange(idx, "title", e.target.value)}
                      className="font-bold flex-1"
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveModule(idx)}>Remove Module</Button>
                  </div>
                  <Textarea
                    value={mod.objective}
                    onChange={e => handleModuleChange(idx, "objective", e.target.value)}
                    className="mb-2"
                    placeholder="Module objective"
                  />
                  <div>
                    <b>Key Concepts:</b>
                    {mod.keyConcepts.map((kc, kidx) => (
                      <div key={kidx} className="flex items-center gap-2 mb-1">
                        <Input
                          value={kc}
                          onChange={e => handleKeyConceptChange(idx, kidx, e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveKeyConcept(idx, kidx)}>Remove</Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => handleAddKeyConcept(idx)}>Add Key Concept</Button>
                  </div>
                </li>
              ))}
            </ol>
            <Button className="mt-4" onClick={handleAddModule}>Add Module</Button>
          </div>
          <div className="mt-8 flex gap-4">
            <Button onClick={() => setShowFinalizeStep(false)} variant="outline">Back</Button>
            <Button onClick={handleFinalizeCurriculum} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">Finalize & Process Curriculum</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ExamGenius
              </h1>
              <p className="text-gray-600">Competitive Exam Course Creator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
              <Zap className="h-4 w-4 mr-1" />
              AI-Powered
            </Badge>
            <Button
              onClick={() => setShowCourseCreator(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First ExamGenius Course
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8" />
                <div>
                  <p className="text-blue-100">Total Courses</p>
                  <p className="text-2xl font-bold">{stats.totalExamCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8" />
                <div>
                  <p className="text-green-100">Active Students</p>
                  <p className="text-2xl font-bold">{stats.activeStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8" />
                <div>
                  <p className="text-purple-100">Completion Rate</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8" />
                <div>
                  <p className="text-orange-100">Average Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Courses ({examCourses.length})
            </TabsTrigger>
            <TabsTrigger value="published" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Published ({publishedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Drafts ({draftCourses.length})
            </TabsTrigger>
          </TabsList>

          {/* All Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Trophy className="h-5 w-5" />
                <p className="text-sm font-medium">
                  All ExamGenius courses - specialized for competitive exam preparation
                </p>
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Exams</option>
                {examTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Courses Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No ExamGenius Courses Yet</h3>
                <p className="text-gray-400 mb-4">
                  Create your first competitive exam course to get started.
                </p>
                <Button
                  onClick={() => setShowCourseCreator(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First ExamGenius Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const examConfig = getExamTypeConfig(course.examType)
                  return (
                    <Card key={course.id || course._id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r from-${examConfig.color}-500 to-${examConfig.color}-600 flex items-center justify-center text-white text-lg`}>
                              {examConfig.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {examConfig.name}
                                </Badge>
                                <Badge variant={course.isPublished ? "default" : "secondary"}>
                                  {course.isPublished ? "Published" : "Draft"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCourse(course.id || course._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.description || "No description available"}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Subject:</span>
                            <span className="font-medium">{course.subject}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Level:</span>
                            <span className="font-medium capitalize">{course.learnerLevel}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Modules:</span>
                            <span className="font-medium">{course.modules?.length || 0}</span>
                          </div>
                          
                          <div className="pt-2">
                            <Button
                              onClick={() => handleEditCourse(course)}
                              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Course
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Published Courses Tab */}
          <TabsContent value="published" className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Published ExamGenius courses - live and available to students
                </p>
              </div>
            </div>
            
            {publishedCourses.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No Published Courses</h3>
                <p className="text-gray-400 mb-4">
                  You haven't published any ExamGenius courses yet. Create and publish your first course to get started.
                </p>
                <Button
                  onClick={() => setShowCourseCreator(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create & Publish Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedCourses.map((course) => {
                  const examConfig = getExamTypeConfig(course.examType)
                  return (
                    <Card key={course.id || course._id} className="hover:shadow-lg transition-shadow duration-200 border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r from-${examConfig.color}-500 to-${examConfig.color}-600 flex items-center justify-center text-white text-lg`}>
                              {examConfig.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {examConfig.name}
                                </Badge>
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Published
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCourse(course.id || course._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.description || "No description available"}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Subject:</span>
                            <span className="font-medium">{course.subject}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Level:</span>
                            <span className="font-medium capitalize">{course.learnerLevel}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Modules:</span>
                            <span className="font-medium">{course.modules?.length || 0}</span>
                          </div>
                          
                          <div className="pt-2 flex gap-2">
                            <Button
                              onClick={() => handleEditCourse(course)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Draft Courses Tab */}
          <TabsContent value="drafts" className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <FileText className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Draft ExamGenius courses - not yet published, continue editing to complete
                </p>
              </div>
            </div>
            
            {draftCourses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No Draft Courses</h3>
                <p className="text-gray-400 mb-4">
                  You don't have any draft ExamGenius courses. Start creating a new course to save as draft.
                </p>
                <Button
                  onClick={() => setShowCourseCreator(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Draft Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draftCourses.map((course) => {
                  const examConfig = getExamTypeConfig(course.examType)
                  return (
                    <Card key={course.id || course._id} className="hover:shadow-lg transition-shadow duration-200 border-yellow-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r from-${examConfig.color}-500 to-${examConfig.color}-600 flex items-center justify-center text-white text-lg`}>
                              {examConfig.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {examConfig.name}
                                </Badge>
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Draft
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCourse(course.id || course._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.description || "No description available"}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Subject:</span>
                            <span className="font-medium">{course.subject}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Level:</span>
                            <span className="font-medium capitalize">{course.learnerLevel}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Modules:</span>
                            <span className="font-medium">{course.modules?.length || 0}</span>
                          </div>
                          
                          <div className="pt-2">
                            <Button
                              onClick={() => handleEditCourse(course)}
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Continue Editing
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Course Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Completion Rate</span>
                      <span className="font-semibold">{stats.completionRate}%</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Score</span>
                      <span className="font-semibold">{stats.averageScore}%</span>
                    </div>
                    <Progress value={stats.averageScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Students</span>
                      <span className="font-semibold">{stats.activeStudents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Enrollments</span>
                      <span className="font-semibold">{stats.totalEnrollments || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 