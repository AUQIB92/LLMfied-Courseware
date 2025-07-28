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
import { 
  Upload, Loader2, Plus, Trash2, Sparkles, BookOpen, Brain, Download, 
  FileText, Zap, Trophy, Target, Timer, Award, CheckCircle, AlertCircle, 
  ArrowRight, ArrowLeft, Edit, AlertTriangle, Info, GraduationCap 
} from "lucide-react"
import { toast } from "sonner"
import ExamModuleEditorEnhanced from "../exam-genius/ExamModuleEditorEnhanced"
import { useContentValidation, useContentProcessor } from "@/lib/contentDisplayHooks"
import ContentDisplay from "@/components/ContentDisplay"

// Course Field Validator Component for Academic Courses
function AcademicCourseFieldValidator({ field, value, onChange, placeholder, className, rows, multiline = false }) {
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
              Content validated • Ready for academic course format
              {hasMath && " • LaTeX equations detected"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AcademicCourseCreator({ onCourseCreated }) {
  const [step, setStep] = useState(1)
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    modules: [],
    subject: "",
    academicLevel: "undergraduate",
    semester: "",
    credits: 3,
    duration: "",
    objectives: [],
    isAcademicCourse: true,
    courseType: "academic"
  })
  const [loading, setLoading] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [file, setFile] = useState(null)
  const [generationType, setGenerationType] = useState("upload")
  const [curriculumTopic, setCurriculumTopic] = useState("")
  const [generatedCurriculum, setGeneratedCurriculum] = useState("")
  const [showCurriculumPreview, setShowCurriculumPreview] = useState(false)
  const [currentCourseId, setCurrentCourseId] = useState(null)
  const [numberOfModules, setNumberOfModules] = useState(8)
  const [moduleTopics, setModuleTopics] = useState("")
  const [teachingNotes, setTeachingNotes] = useState("")
  const [selectedModule, setSelectedModule] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [totalJobs, setTotalJobs] = useState(0)
  const { getAuthHeaders } = useAuth()

  const academicLevels = [
    { id: "undergraduate", name: "Undergraduate", icon: "🎓" },
    { id: "graduate", name: "Graduate", icon: "📚" },
    { id: "postgraduate", name: "Postgraduate", icon: "🔬" },
    { id: "doctoral", name: "Doctoral", icon: "🏆" }
  ]

  const subjects = [
    "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology", "Engineering",
    "Business", "Psychology", "History", "Literature", "Economics", "Political Science",
    "Sociology", "Philosophy", "Art", "Music", "Other"
  ]

  const handleFileSelection = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      toast.success(`✅ File selected: ${selectedFile.name}`)
    }
  }

  const handleProcessFile = async () => {
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    setLoading(true)
    setProcessingStep("📄 Processing uploaded content...")
    setProcessingProgress(10)

    try {
      // Step 1: Upload the file and get its structured content
      const formData = new FormData()
      formData.append("file", file)
      
      setProcessingStep("📖 Reading file content...")
      setProcessingProgress(30)

             // First API call to get the structured content from the file
       const fileResponse = await fetch("/api/academic-courses/upload/content", {
         method: "POST",
         headers: getAuthHeaders(),
         body: formData,
       })

      if (!fileResponse.ok) {
        const error = await fileResponse.json()
        throw new Error(error.error || "Failed to upload file")
      }

             const fileData = await fileResponse.json()
       
       if (!fileData.content) {
         throw new Error("Failed to extract content from file")
       }
       
       setProcessingStep("🧠 Processing content with AI...")
       setProcessingProgress(60)
       
       // Step 2: Process the content with AI to generate modules
       const processResponse = await fetch("/api/academic-courses/process-content", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           ...getAuthHeaders(),
         },
         body: JSON.stringify({
           content: fileData.content,
           title: courseData.title,
           description: courseData.description,
           subject: courseData.subject,
           academicLevel: courseData.academicLevel,
           credits: courseData.credits,
           semester: courseData.semester,
           objectives: courseData.objectives
         }),
       })

       if (!processResponse.ok) {
         const error = await processResponse.json()
         throw new Error(error.error || "Failed to process content")
       }

       const processData = await processResponse.json()
       const structuredModules = processData.modules || [];
      
      // Update course data with the structured modules
      const updatedCourseData = {
        ...courseData,
        modules: structuredModules,
        isAcademicCourse: true,
        courseType: "academic"
      };
      
      setCourseData(updatedCourseData);
      
      setProcessingStep("🔄 Saving course template...")
      setProcessingProgress(90)
      
      // Save the course as a draft without generating detailed content
      await handleSaveDraft(updatedCourseData, true)
      
      // Final step: Complete and move to next step
      setProcessingStep("✅ Course template created successfully!")
      setProcessingProgress(100)
      
      setCourseData(updatedCourseData)
      
      setTimeout(() => {
        setStep(3)
        toast.success(`🎉 Course Structure Imported Successfully!\n\n✨ Created ${updatedCourseData.modules.length} modules with structured content\n\n🎓 Your academic course template is ready for review and content generation!`)
      }, 1000)
    } catch (error) {
      console.error("Processing error:", error)
      toast.error(`Failed to process content: ${error.message}`)
      setProcessingStep("❌ Processing failed")
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProcessingStep("")
        setProcessingProgress(0)
      }, 2000)
    }
  }

  const handleGenerateCurriculum = async () => {
    if (!curriculumTopic.trim()) {
      toast.error("Please enter a curriculum topic")
      return
    }

    setLoading(true)
    setProcessingStep("🧠 AI is creating your academic curriculum...")
    setProcessingProgress(0)

    try {
      const response = await fetch("/api/academic-courses/generate-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: curriculumTopic,
          topic: curriculumTopic,
          subject: courseData.subject,
          academicLevel: courseData.academicLevel,
          credits: courseData.credits,
          semester: courseData.semester,
          numberOfModules: numberOfModules,
          moduleTopics: moduleTopics,
          teachingNotes: teachingNotes,
          isAcademicCourse: true
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedCurriculum(data.curriculum)
        
                 // Process the curriculum
         const processResponse = await fetch("/api/academic-courses/process-curriculum", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             ...getAuthHeaders(),
           },
           body: JSON.stringify({
             curriculum: data.curriculum,
             title: courseData.title,
             description: courseData.description,
             subject: courseData.subject,
             academicLevel: courseData.academicLevel,
             credits: courseData.credits,
             semester: courseData.semester,
             objectives: courseData.objectives
           }),
         })

        if (processResponse.ok) {
          const processData = await processResponse.json()
          setCourseData(prev => ({ ...prev, modules: processData.modules }))
          setStep(3)
          toast.success("Academic curriculum generated and processed successfully!")

          // Automatically save as draft after generating and processing
          await handleSaveDraft({ ...courseData, modules: processData.modules }, true);

        }
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate curriculum")
      }
    } catch (error) {
      console.error("Generation error:", error)
      toast.error(`Failed to generate curriculum: ${error.message}`)
    } finally {
      setLoading(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }

  const handleCreateAssignment = async (module, assignmentIndex) => {
    // Validate required data
    if (!module.title) {
      toast.error("❌ Module title is required to create an assignment")
      return
    }

    if (!module.content && !module.summary) {
      toast.error("❌ Module content is required to create an assignment")
      return
    }

    try {
      setLoading(true)
      toast.info("📝 Creating academic assignment...")

      const assignmentPayload = {
        concept: module.title,
        content: module.content || module.summary || `Module content for ${module.title}`,
        subject: courseData.subject,
        academicLevel: courseData.academicLevel,
        assignmentType: assignmentIndex === 0 ? "Research Paper" : "Problem Solving"
      }

      const response = await fetch("/api/academic-courses/generate-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(assignmentPayload),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("📋 Assignment created successfully!")
        
        const updatedModules = courseData.modules.map(m => {
          if (m.id === module.id) {
            const updatedAssignments = [...(m.assignments || [])]
            updatedAssignments[assignmentIndex] = data.assignment
            return { ...m, assignments: updatedAssignments }
          }
          return m
        })
        setCourseData(prev => ({ ...prev, modules: updatedModules }))
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create assignment")
      }
    } catch (error) {
      console.error("Assignment creation error:", error)
      toast.error(`Failed to create assignment: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuiz = async (module) => {
    // Validate required data
    if (!module.title) {
      toast.error("❌ Module title is required to create a quiz")
      return
    }

    if (!module.content && !module.summary) {
      toast.error("❌ Module content is required to create a quiz")
      return
    }

    try {
      setLoading(true)
      toast.info("🎯 Creating academic quiz...")

      const quizPayload = {
        concept: module.title,
        content: module.content || module.summary || `Module content for ${module.title}`,
        subject: courseData.subject,
        academicLevel: courseData.academicLevel
      }

      const response = await fetch("/api/academic-courses/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(quizPayload),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("🏆 Quiz created successfully!")
        
        const updatedModules = courseData.modules.map(m => 
          m.id === module.id ? { ...m, quiz: data.quiz } : m
        )
        setCourseData(prev => ({ ...prev, modules: updatedModules }))
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create quiz")
      }
    } catch (error) {
      console.error("Quiz creation error:", error)
      toast.error(`Failed to create quiz: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async (currentCourseData = courseData, isAutoSave = false) => {
    try {
      if (!isAutoSave) setLoading(true);
      
      toast.info(isAutoSave ? "🔄 Automatically saving draft..." : "🔍 Saving draft...");
      
      if (!currentCourseData.title || !currentCourseData.subject || !currentCourseData.academicLevel) {
        toast.error("❌ Please fill in all required fields (Title, Subject, Academic Level)")
        return
      }

      if (!currentCourseData.modules || currentCourseData.modules.length === 0) {
        toast.error("❌ Course must have at least one module before saving")
        return
      }

      const payload = {
        ...currentCourseData, 
        status: "draft",
        isAcademicCourse: true,
        courseType: "academic"
      }

      const response = await fetch("/api/academic-courses/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentCourseId(data.courseId)
        
        if (!isAutoSave) {
          toast.success("✅ Academic course draft saved successfully!")
        }
        
        return data
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to save draft")
      }
    } catch (error) {
      console.error("Save draft error:", error)
      toast.error(`Failed to save draft: ${error.message}`)
    } finally {
      if (!isAutoSave) setLoading(false)
    }
  }

  const handlePublishCourse = async () => {
    try {
      setLoading(true)
      
      if (!courseData.title || !courseData.subject || !courseData.academicLevel) {
        toast.error("❌ Please fill in all required fields before publishing")
        return
      }

      if (!courseData.modules || courseData.modules.length === 0) {
        toast.error("❌ Course must have at least one module before publishing")
        return
      }

      const payload = {
        ...courseData,
        status: "published",
        isAcademicCourse: true,
        courseType: "academic"
      }

      const response = await fetch("/api/academic-courses/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("🎉 Academic course published successfully!")
        
        if (onCourseCreated) {
          onCourseCreated(data)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to publish course")
      }
    } catch (error) {
      console.error("Publish course error:", error)
      toast.error(`Failed to publish course: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditModule = (module) => {
    setSelectedModule(module)
  }

  const handleModuleUpdate = (updatedModule) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map(module => 
        module.id === updatedModule.id ? updatedModule : module
      )
    }))
    setSelectedModule(null)
    toast.success("📚 Module updated successfully!")
  }

  const resetForm = () => {
    setCourseData({
      title: "",
      description: "",
      modules: [],
      subject: "",
      academicLevel: "undergraduate",
      semester: "",
      credits: 3,
      duration: "",
      objectives: [],
      isAcademicCourse: true,
      courseType: "academic"
    })
    setStep(1)
    setFile(null)
    setCurriculumTopic("")
    setGeneratedCurriculum("")
    setShowCurriculumPreview(false)
    setCurrentCourseId(null)
    setSelectedModule(null)
    toast.success("Form reset successfully")
  }

  if (selectedModule) {
    return (
      <ExamModuleEditorEnhanced
        module={selectedModule}
        onUpdate={handleModuleUpdate}
        examType="technical"
        subject={courseData.subject}
        learnerLevel={courseData.academicLevel}
        course={{
          ...courseData,
          isAcademicCourse: true,
          courseType: "academic",
          isTechnicalCourse: true
        }}
        courseId={currentCourseId}
        onSaveSuccess={() => setSelectedModule(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Academic Course Creator
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Create comprehensive academic courses with AI-powered content generation
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              Academic Standards
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              2 Assignments
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              1 Quiz
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="font-medium">Course Info</span>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="font-medium">Upload Content</span>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="font-medium">Review & Publish</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800">{processingStep}</h3>
                  <Progress value={processingProgress} className="mt-2 h-3" />
                  <p className="text-sm text-blue-600 mt-1">{processingProgress}% complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Course Information */}
        {step === 1 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center justify-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Academic Course Information
              </CardTitle>
              <CardDescription>
                Enter the essential details for your academic course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <AcademicCourseFieldValidator
                  field="title"
                  value={courseData.title}
                  onChange={(value) => setCourseData(prev => ({ ...prev, title: value }))}
                  placeholder="e.g., Advanced Data Structures and Algorithms"
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description *</Label>
                <AcademicCourseFieldValidator
                  field="description"
                  value={courseData.description}
                  onChange={(value) => setCourseData(prev => ({ ...prev, description: value }))}
                  placeholder="Provide a comprehensive description of what students will learn in this course..."
                  multiline={true}
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={courseData.subject} onValueChange={(value) => setCourseData(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Academic Level *</Label>
                  <Select value={courseData.academicLevel} onValueChange={(value) => setCourseData(prev => ({ ...prev, academicLevel: value }))}>
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicLevels.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          <div className="flex items-center gap-2">
                            <span>{level.icon}</span>
                            <span>{level.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={courseData.credits}
                    onChange={(e) => setCourseData(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester/Term</Label>
                  <AcademicCourseFieldValidator
                    field="semester"
                    value={courseData.semester}
                    onChange={(value) => setCourseData(prev => ({ ...prev, semester: value }))}
                    placeholder="e.g., Fall 2024"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <AcademicCourseFieldValidator
                    field="duration"
                    value={courseData.duration}
                    onChange={(value) => setCourseData(prev => ({ ...prev, duration: value }))}
                    placeholder="e.g., 16 weeks"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!courseData.title || !courseData.subject || !courseData.academicLevel}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Next: Upload Content
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Content Upload */}
        {step === 2 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center justify-center gap-2">
                <Upload className="h-6 w-6 text-green-600" />
                Content Upload & Generation
              </CardTitle>
              <CardDescription>
                Upload existing content or generate academic curriculum with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex justify-center gap-4">
                <Button
                  variant={generationType === "upload" ? "default" : "outline"}
                  onClick={() => setGenerationType("upload")}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Content
                </Button>
                <Button
                  variant={generationType === "generate" ? "default" : "outline"}
                  onClick={() => setGenerationType("generate")}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Curriculum
                </Button>
              </div>

              {generationType === "upload" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Your Academic Content</h3>
                    <p className="text-gray-600 mb-4">
                      Support PDF, Markdown, or Text files (max 25MB)
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.md,.txt,.markdown"
                      onChange={handleFileSelection}
                      className="max-w-xs mx-auto"
                    />
                    {file && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">✅ File selected: {file.name}</p>
                      </div>
                    )}
                  </div>

                  {file && (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleProcessFile}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Process for {courseData.academicLevel}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {generationType === "generate" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="curriculum-topic">Curriculum Topic *</Label>
                    <AcademicCourseFieldValidator
                      field="curriculum-topic"
                      value={curriculumTopic}
                      onChange={(value) => setCurriculumTopic(value)}
                      placeholder={`e.g., ${courseData.subject} Complete Academic Course`}
                      className="border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modules-count">Number of Modules</Label>
                      <Input
                        type="number"
                        min="4"
                        max="20"
                        value={numberOfModules}
                        onChange={(e) => setNumberOfModules(parseInt(e.target.value) || 8)}
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="module-topics">Specific Topics</Label>
                      <AcademicCourseFieldValidator
                        field="module-topics"
                        value={moduleTopics}
                        onChange={(value) => setModuleTopics(value)}
                        placeholder="e.g., Theory, Practice, Research..."
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teaching-notes">Teaching Notes & Focus Areas</Label>
                    <AcademicCourseFieldValidator
                      field="teaching-notes"
                      value={teachingNotes}
                      onChange={(value) => setTeachingNotes(value)}
                      placeholder="Special instructions for content generation..."
                      multiline={true}
                      rows={3}
                      className="border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={handleGenerateCurriculum}
                      disabled={loading || !curriculumTopic}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Academic Curriculum
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && (
          <Card className="w-full max-w-6xl mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-purple-600" />
                Review & Publish Academic Course
              </CardTitle>
              <CardDescription>
                Review your course modules and publish when ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Course Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{courseData.title}</h3>
                <p className="text-gray-600 mb-2">{courseData.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{courseData.subject}</Badge>
                  <Badge variant="secondary">{courseData.academicLevel}</Badge>
                  <Badge variant="secondary">{courseData.modules.length} modules</Badge>
                  <Badge variant="secondary">{courseData.modules.length * 2} assignments</Badge>
                  <Badge variant="secondary">{courseData.modules.length} quizzes</Badge>
                </div>
              </div>

              {/* Modules List */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Course Modules ({courseData.modules.length})</h3>
                {courseData.modules.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Modules Available</h3>
                    <p className="text-gray-500 mb-4">
                      Please go back and upload content or generate curriculum.
                    </p>
                    <Button onClick={() => setStep(2)} variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Upload
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {courseData.modules.map((module, index) => (
                      <Card key={module.id || index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">
                              Module {index + 1}: {module.title || `Untitled Module`}
                            </h4>
                            <Button
                              onClick={() => handleEditModule(module)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                          
                          <p className="text-gray-600 mb-3 text-sm">
                            {module.summary || 'No summary available'}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Assignments */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-blue-600">Assignments (2)</h5>
                              {module.assignments?.map((assignment, idx) => (
                                <div key={idx} className="p-2 bg-blue-50 rounded text-xs">
                                  <p className="font-medium">{assignment.title}</p>
                                  <p className="text-gray-600">{assignment.type} - {assignment.points} points</p>
                                </div>
                              )) || (
                                <div className="space-y-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleCreateAssignment(module, 0)}
                                    className="w-full text-xs"
                                  >
                                    Create Assignment 1
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleCreateAssignment(module, 1)}
                                    className="w-full text-xs"
                                  >
                                    Create Assignment 2
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Quiz */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-green-600">Quiz (1)</h5>
                              {module.quiz ? (
                                <div className="p-2 bg-green-50 rounded text-xs">
                                  <p className="font-medium">{module.quiz.title}</p>
                                  <p className="text-gray-600">{module.quiz.questions} questions - {module.quiz.points} points</p>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleCreateQuiz(module)}
                                  className="w-full text-xs"
                                >
                                  Create Quiz
                                </Button>
                              )}
                            </div>

                            {/* Module Info */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-gray-600">Module Info</h5>
                              <div className="text-xs text-gray-500 space-y-1">
                                <p>Subject: {courseData.subject}</p>
                                <p>Level: {courseData.academicLevel}</p>
                                <p>Study Time: {module.estimatedStudyTime || '3-4 hours'}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {courseData.modules.length > 0 && (
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Upload
                  </Button>
                  
                  <div className="space-x-2">
                    <Button 
                      onClick={handleSaveDraft}
                      variant="outline"
                      disabled={loading}
                    >
                      Save Draft
                    </Button>
                    <Button 
                      onClick={handlePublishCourse}
                      disabled={loading}
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Publish Course
                    </Button>
                  </div>
                </div>
              )}

              {/* New Course Button */}
              <div className="flex justify-center pt-6 border-t">
                <Button onClick={resetForm} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 