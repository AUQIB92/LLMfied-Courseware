"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Plus,
  BookOpen,
  Trophy,
  Target,
  Upload,
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
  Download,
  Loader2,
  X,
  Eye,
  Brain
} from "lucide-react"

export default function ExamGeniusCourseCreator({ onCourseCreated }) {
  const { user, getAuthHeaders } = useAuth()
  
  // ExamGenius workflow states: 1: Course Info, 2: Upload Syllabus, 3: Review & Edit, 4: Publish
  const [creationStep, setCreationStep] = useState(1)
  const [processingStep, setProcessingStep] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [file, setFile] = useState(null)
  const [generatedModules, setGeneratedModules] = useState([])
  const [processedCourse, setProcessedCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    examType: "",
    subject: "",
    estimatedTime: "",
    isExamGenius: true,
    isCompetitiveExam: true,
    modules: []
  })

  const examTypes = [
    { id: "jee", name: "JEE Main/Advanced", icon: "🔬", color: "blue" },
    { id: "neet", name: "NEET", icon: "🏥", color: "green" },
    { id: "gate", name: "GATE", icon: "⚙️", color: "purple" },
    { id: "cat", name: "CAT", icon: "💼", color: "orange" },
    { id: "upsc", name: "UPSC", icon: "🏛️", color: "red" },
    { id: "banking", name: "Banking (SBI PO, IBPS)", icon: "🏦", color: "cyan" },
    { id: "ssc", name: "SSC (CGL, CHSL)", icon: "📊", color: "pink" },
    { id: "railways", name: "Railways (RRB)", icon: "🚂", color: "green" },
    { id: "teaching", name: "Teaching (CTET/TET)", icon: "👩‍🏫", color: "blue" },
    { id: "defense", name: "Defense (CDS/NDA)", icon: "🛡️", color: "red" },
    { id: "police", name: "Police/Civil Services", icon: "👮‍♂️", color: "blue" },
    { id: "custom", name: "Custom Exam", icon: "⚡", color: "yellow" }
  ]

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science",
    "General Knowledge", "Reasoning", "Economics", "History", "Geography", 
    "Political Science", "Quantitative Aptitude", "Verbal Ability", "Current Affairs",
    "General Science", "Environmental Studies", "Legal Reasoning", "Other"
  ]

  const handleProcessSyllabus = async () => {
    if (!file) {
      toast.error("Please upload a syllabus file first")
      return
    }

    setLoading(true)
    setProcessingStep("📄 ExamGenius is processing your syllabus...")
    setProcessingProgress(0)

    try {
      const progressStages = [
        { step: "📄 Reading and parsing syllabus file...", progress: 20 },
        { step: "🧠 Analyzing exam pattern and structure...", progress: 40 },
        { step: "📚 Generating ExamGenius modules...", progress: 60 },
        { step: "🎯 Creating flashcards and practice content...", progress: 80 },
        { step: "✨ Finalizing ExamGenius course structure...", progress: 95 }
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step)
          setProcessingProgress(progressStages[currentStage].progress)
          currentStage++
        }
      }, 2500)

      // Upload and process the syllabus file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', courseData.title)
      formData.append('examType', courseData.examType)
      formData.append('subject', courseData.subject)
      formData.append('description', courseData.description)

      const response = await fetch("/api/exam-genius/process-curriculum", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const data = await response.json()

      if (response.ok) {
        setProcessingStep("✅ Syllabus processed successfully!")
        setGeneratedModules(data.modules || [])
        
        setTimeout(() => {
          setCreationStep(3) // Move to Review & Edit step
          setLoading(false)
        }, 1000)
      } else {
        throw new Error(data.error || "Failed to process syllabus")
      }
    } catch (error) {
      console.error("Error processing syllabus:", error)
      toast.error("Failed to process syllabus. Please try again.")
      setLoading(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }

  const handleSaveAndContinue = () => {
    // Update course data with generated modules
    const updatedCourseData = {
      ...courseData,
      modules: generatedModules,
      isExamGenius: true,
      isCompetitiveExam: true
    }
    
    setProcessedCourse(updatedCourseData)
    setCreationStep(4) // Move to Publish step
  }

  const handleEditModule = (moduleIndex) => {
    setEditingModule(moduleIndex)
  }

  const handleSaveModuleEdit = (moduleIndex, updatedModule) => {
    const updatedModules = [...generatedModules]
    updatedModules[moduleIndex] = updatedModule
    setGeneratedModules(updatedModules)
    setEditingModule(null)
  }

  const handlePublishCourse = async (publishStatus = "draft") => {
    if (!processedCourse) {
      toast.error("No course data to publish")
      return
    }

    setLoading(true)
    setProcessingStep(`🚀 ${publishStatus === "published" ? "Publishing" : "Saving"} your ExamGenius course...`)
    setProcessingProgress(50)

    try {
      const finalCourseData = {
        ...processedCourse,
        modules: generatedModules,
        isExamGenius: true,
        isCompetitiveExam: true,
        educatorId: user.id,
        createdAt: new Date(),
        status: publishStatus,
        isPublished: publishStatus === "published"
      }

      const response = await fetch('/api/exam-genius/save-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          course: finalCourseData
        })
      })

      setProcessingProgress(100)

      if (response.ok) {
        const newCourse = await response.json()
        const message = publishStatus === "published" 
          ? "ExamGenius course published successfully!" 
          : "ExamGenius course saved as draft!"
        
        toast.success(message)
        
        // Reset form
        resetCourseForm()
        
        if (onCourseCreated) {
          onCourseCreated()
        }
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to save ExamGenius course")
      }
    } catch (error) {
      console.error("Error saving ExamGenius course:", error)
      toast.error("An error occurred while saving the course")
    } finally {
      setLoading(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }

  const resetCourseForm = () => {
    setCreationStep(1)
    setProcessingStep("")
    setProcessingProgress(0)
    setFile(null)
    setGeneratedModules([])
    setProcessedCourse(null)
    setEditingModule(null)
    setCourseData({
      title: "",
      description: "",
      examType: "",
      subject: "",
      estimatedTime: "",
      isExamGenius: true,
      isCompetitiveExam: true,
      modules: []
    })
    setLoading(false)
    
    // Clear file input
    const fileInput = document.getElementById('examgenius-file-upload')
    if (fileInput) fileInput.value = ''
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                ExamGenius Course Creator
              </h1>
              <p className="text-gray-600">AI-powered competitive exam course generation with flashcards</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <Zap className="h-4 w-4 mr-1" />
              ExamGenius AI
            </Badge>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              <Sparkles className="h-4 w-4 mr-1" />
              Flashcard System
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  ${creationStep >= step 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                    : 'bg-gray-200 text-gray-500'}`}>
                  {step}
                </div>
                {index < 3 && (
                  <div className={`h-1 w-12 mx-2 ${creationStep > step ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">
                {creationStep === 1 ? "Course Information" : 
                 creationStep === 2 ? "Upload Syllabus" : 
                 creationStep === 3 ? "Review & Edit" :
                 "Publish"}
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {creationStep === 1 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                ExamGenius Course Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={courseData.title}
                    onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., SSC CGL Complete Preparation, JEE Main Physics Mastery"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examType">Exam Type *</Label>
                  <Select value={courseData.examType} onValueChange={(value) => setCourseData(prev => ({ ...prev, examType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id}>
                          <div className="flex items-center gap-2">
                            <span>{exam.icon}</span>
                            <span>{exam.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={courseData.subject} onValueChange={(value) => setCourseData(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Completion Time</Label>
                  <Input
                    id="estimatedTime"
                    value={courseData.estimatedTime}
                    onChange={(e) => setCourseData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    placeholder="e.g., 3 months, 6 months, 1 year"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfModules">Number of Modules</Label>
                  <Input
                    id="numberOfModules"
                    type="number"
                    value={courseData.numberOfModules}
                    onChange={(e) => setCourseData(prev => ({ ...prev, numberOfModules: parseInt(e.target.value) || 8 }))}
                    min="4"
                    max="20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  value={courseData.description}
                  onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your ExamGenius course and what students will learn..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setCreationStep(2)}
                  disabled={!courseData.title || !courseData.examType || !courseData.subject}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  Next: Generate ExamGenius Curriculum
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {creationStep === 2 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Exam Syllabus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Upload your exam syllabus or curriculum document. ExamGenius will analyze it and create a comprehensive course with flashcards, practice questions, and shortcuts.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed border-emerald-300 rounded-lg p-8 text-center bg-emerald-50">
                <FileText className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-emerald-700 mb-2">Upload Exam Syllabus</h3>
                <p className="text-sm text-emerald-600 mb-4">
                  Supported formats: PDF, DOC, DOCX, TXT
                  <br />
                  Maximum file size: 10MB
                </p>
                <Input
                  id="examgenius-file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="examgenius-file-upload">
                  <Button variant="outline" asChild className="border-emerald-400 text-emerald-700 hover:bg-emerald-100">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Syllabus File
                    </span>
                  </Button>
                </label>
                {file && (
                  <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                    <p className="text-sm text-emerald-700 font-medium">Selected: {file.name}</p>
                    <p className="text-xs text-emerald-600">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              {loading && (
                <Card className="border-emerald-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        <span className="font-medium">{processingStep}</span>
                      </div>
                      <Progress value={processingProgress} className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setCreationStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleProcessSyllabus}
                  disabled={loading || !file}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  Process Syllabus with ExamGenius
                  <Brain className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {creationStep === 3 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Review & Edit Course Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Review the generated course modules below. You can edit any module content before publishing your ExamGenius course.
                </AlertDescription>
              </Alert>

              {generatedModules.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Generated Course Modules ({generatedModules.length})</h3>
                  <div className="space-y-3">
                    {generatedModules.map((module, index) => (
                      <Card key={index} className="border-emerald-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{module.title || `Module ${index + 1}`}</h4>
                            <div className="flex gap-2">
                              <Badge variant="secondary">
                                {module.flashCards?.length || 0} flashcards
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditModule(index)}
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {module.summary || module.content?.substring(0, 150) + "..."}
                          </p>
                          {module.estimatedTime && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{module.estimatedTime}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {generatedModules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No modules generated yet. Please go back and process your syllabus.</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setCreationStep(2)}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Upload
                </Button>
                <Button 
                  onClick={handleSaveAndContinue}
                  disabled={generatedModules.length === 0}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  Continue to Publish
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {creationStep === 4 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Publish ExamGenius Course
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Trophy className="h-4 w-4" />
                <AlertDescription>
                  Your ExamGenius course is ready! Choose to save as draft for further editing or publish to make it available to students.
                </AlertDescription>
              </Alert>

              {processedCourse && (
                <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                  <h3 className="text-lg font-semibold text-emerald-800 mb-4">Course Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-emerald-700">Title:</p>
                      <p className="text-emerald-600">{processedCourse.title}</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-700">Exam Type:</p>
                      <p className="text-emerald-600">{processedCourse.examType}</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-700">Subject:</p>
                      <p className="text-emerald-600">{processedCourse.subject}</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-700">Modules:</p>
                      <p className="text-emerald-600">{generatedModules.length} modules</p>
                    </div>
                  </div>
                  {processedCourse.description && (
                    <div className="mt-4">
                      <p className="font-medium text-emerald-700">Description:</p>
                      <p className="text-emerald-600">{processedCourse.description}</p>
                    </div>
                  )}
                </div>
              )}

              {loading && (
                <Card className="border-emerald-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        <span className="font-medium">{processingStep}</span>
                      </div>
                      <Progress value={processingProgress} className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setCreationStep(3)}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Review
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => handlePublishCourse("draft")}
                    disabled={loading}
                  >
                    Save as Draft
                  </Button>
                  <Button 
                    onClick={() => handlePublishCourse("published")}
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Publish Course
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}