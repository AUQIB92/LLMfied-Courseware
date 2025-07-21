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
  ArrowRight, ArrowLeft, Edit 
} from "lucide-react"
import { toast } from "sonner"
import ExamModuleEditorEnhanced from "./ExamModuleEditorEnhanced"

export default function ExamGeniusCourseCreator({ onCourseCreated }) {
  const [step, setStep] = useState(1)
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    modules: [],
    examType: "",
    subject: "",
    learnerLevel: "intermediate",
    duration: "",
    objectives: [],
    isExamGenius: true,
    isCompetitiveExam: true
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const { getAuthHeaders } = useAuth()

  const examTypes = [
    { id: "jee", name: "JEE Main/Advanced", icon: "🔬" },
    { id: "neet", name: "NEET", icon: "🏥" },
    { id: "gate", name: "GATE", icon: "⚙️" },
    { id: "cat", name: "CAT", icon: "💼" },
    { id: "upsc", name: "UPSC", icon: "🏛️" },
    { id: "banking", name: "Banking", icon: "🏦" },
    { id: "ssc", name: "SSC", icon: "📊" },
    { id: "custom", name: "Custom", icon: "⚡" }
  ]

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science",
    "General Knowledge", "Reasoning", "Economics", "History", "Geography", "Other"
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
      const fileResponse = await fetch("/api/upload/content", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      })

      if (!fileResponse.ok) {
        const error = await fileResponse.json()
        throw new Error(error.error || "Failed to upload file")
      }

      const fileData = await fileResponse.json()
      
      if (!fileData.structure || !fileData.structure.modules) {
        throw new Error("Failed to extract structure from file")
      }
      
      setProcessingStep("🧠 Extracted course structure...")
      setProcessingProgress(60)
      
      // Step 2: Convert the structured data into our course format
      const structuredModules = fileData.structure.modules.map(module => {
        // Create a flattened content string for the module that includes all section and subsection titles
        // This will be used for AI processing later
        let moduleContent = `## ${module.title}\n\n`;
        
        module.sections.forEach(section => {
          moduleContent += `### ${section.title}\n\n`;
          
          section.subsections.forEach(subsection => {
            moduleContent += `#### ${subsection.title}\n\n`;
          });
        });
        
        return {
          title: module.title,
          content: moduleContent,
          id: `module-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          examType: courseData.examType,
          subject: courseData.subject,
          learnerLevel: courseData.learnerLevel,
          isExamGenius: true,
          isCompetitiveExam: true
        };
      });
      
      // Update course data with the structured modules
      const updatedCourseData = {
        ...courseData,
        modules: structuredModules,
        isExamGenius: true,
        isCompetitiveExam: true
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
        toast.success(`🎉 Course Structure Imported Successfully!\n\n✨ Created ${updatedCourseData.modules.length} modules with structured content\n\n🏆 Your course template is ready for review and content generation!`)
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
    setProcessingStep("🧠 AI is creating your competitive exam curriculum...")
    setProcessingProgress(0)

    try {
      const response = await fetch("/api/exam-genius/generate-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: curriculumTopic,
          topic: curriculumTopic,
          examType: courseData.examType,
          subject: courseData.subject,
          learnerLevel: courseData.learnerLevel,
          numberOfModules: numberOfModules,
          moduleTopics: moduleTopics,
          teachingNotes: teachingNotes
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedCurriculum(data.curriculum)
        
        // Process the curriculum
        const processResponse = await fetch("/api/exam-genius/process-curriculum", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            curriculum: data.curriculum,
            courseData: courseData
          }),
        })

        if (processResponse.ok) {
          const processData = await processResponse.json()
          setCourseData(prev => ({ ...prev, modules: processData.modules }))
          setStep(3)
          toast.success("Curriculum generated and processed successfully!")

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
      toast.info("🎯 Creating competitive exam quiz...")

      const quizPayload = {
        concept: module.title,
        content: module.content || module.summary || `Module content for ${module.title}`,
        examType: courseData.examType,
        subject: courseData.subject,
        learnerLevel: module.difficulty || courseData.learnerLevel
      }

      console.log("🎯 Quiz creation payload:", quizPayload)

      const response = await fetch("/api/exam-genius/generate-quiz", {
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
      
      if (!currentCourseData.title || !currentCourseData.examType || !currentCourseData.subject) {
        toast.error("❌ Please fill in all required fields (Title, Exam Type, Subject)")
        return
      }

      if (!currentCourseData.modules || currentCourseData.modules.length === 0) {
        toast.error("❌ Course must have at least one module before saving")
        return
      }

      const payload = {
        ...currentCourseData, 
          status: "draft",
          isExamGenius: true,
          isCompetitiveExam: true
      };

      if (currentCourseId) {
        payload._id = currentCourseId;
        }
      
      const response = await fetch("/api/exam-genius/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ course: payload }),
      })

      if (response.ok) {
        const data = await response.json()
        const savedCourseId = data.courseId || (data.result && data.result.upsertedId) || currentCourseId;
        
        if (savedCourseId) {
          setCurrentCourseId(savedCourseId);
          // Update the main course data with the ID
          setCourseData(prev => ({ ...prev, _id: savedCourseId }));
        }

        if (isAutoSave) {
          toast.success("✅ Draft auto-saved successfully!");
      } else {
          toast.success(`📝 Draft Saved Successfully!`);
        }
        return { success: true, courseId: savedCourseId };
        
      } else {
        const errorText = await response.text()
        let errorMessage = "Failed to save draft"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
        throw new Error(errorMessage)
      }
    } catch (error) {
      toast.error(`❌ Save Draft Failed: ${error.message}`)
      return { success: false };
    } finally {
      if (!isAutoSave) setLoading(false);
    }
  }

  const handlePublishCourse = async () => {
    try {
      // First, ensure the latest changes are saved.
      const saveResult = await handleSaveDraft();
      if (!saveResult.success) {
          toast.error("Could not save draft before publishing. Please try again.");
          return;
      }
      const finalCourseId = saveResult.courseId;

      if (!finalCourseId) {
          toast.error("Could not get a course ID. Please save a draft first.");
          return;
      }
      
      // Validate required fields
      if (!courseData.title || !courseData.examType || !courseData.subject) {
        toast.error("❌ Please fill in all required fields (Title, Exam Type, Subject)")
        return
      }

      if (!courseData.modules || courseData.modules.length === 0) {
        toast.error("❌ Course must have at least one module before publishing")
        return
      }

      // Validate modules have content
      const hasContentModules = courseData.modules.some(module => 
        module.content || module.summary || (module.detailedSubsections && module.detailedSubsections.length > 0)
      )
      
      if (!hasContentModules) {
        toast.error("❌ At least one module must have content before publishing")
        return
      }

      console.log("🔍 DEBUG: Publishing course data:", {
        title: courseData.title,
        examType: courseData.examType,
        subject: courseData.subject,
        modules: courseData.modules.length,
        currentCourseId: finalCourseId,
        hasAuth: !!getAuthHeaders()?.authorization
      })
      
      console.log("🔍 DEBUG: Auth headers:", getAuthHeaders())
      
      const coursePayload = {
        ...courseData, 
        _id: finalCourseId,
        status: "published",
        isExamGenius: true,
        isCompetitiveExam: true
      }
      
      const response = await fetch("/api/exam-genius/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          course: coursePayload
        }),
      })

      console.log("🔍 DEBUG: Publish response:", response.status, response.statusText)
      console.log("🔍 DEBUG: Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log("🔍 DEBUG: Course published successfully:", data)
        
        // Set currentCourseId if it wasn't already set
        if (!currentCourseId && data.course._id) {
          setCurrentCourseId(data.course._id)
        }
        
        // Create detailed publish success message
        const moduleCount = courseData.modules?.length || 0
        const subsectionCount = courseData.modules?.reduce((total, module) => 
          total + (module.detailedSubsections?.length || 0), 0) || 0
        const quizCount = courseData.modules?.reduce((total, module) => {
          if (module.subsectionQuizzes) {
            return total + Object.keys(module.subsectionQuizzes).length
          }
          return total + (module.quiz ? 1 : 0)
        }, 0) || 0
        
        toast.success(`🎉 Course Published Successfully! 🏆 "${courseData.title}" is now live • 📚 ${courseData.examType} • 📖 ${courseData.subject} • 📋 ${moduleCount} modules${subsectionCount > 0 ? ` • 🔍 ${subsectionCount} subsections` : ''}${quizCount > 0 ? ` • 🎯 ${quizCount} quizzes` : ''} • 🚀 Students can now enroll and learn!`, {
          duration: 8000,
        })
        
        if (onCourseCreated) {
          onCourseCreated(data.course)
        }
        
        // Reset form
        setCourseData({
          title: "",
          description: "",
          modules: [],
          examType: "",
          subject: "",
          learnerLevel: "intermediate",
          duration: "",
          objectives: [],
          isExamGenius: true,
          isCompetitiveExam: true
        })
        setCurrentCourseId(null)
        setStep(1)
      } else {
        const errorText = await response.text()
        console.error("🔍 DEBUG: Publish failed:", response.status, response.statusText, errorText)
        
        let errorMessage = "Failed to publish course"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
          
          // Specific error handling
          if (response.status === 403) {
            errorMessage = "❌ You need educator permissions to publish courses. Please contact support."
          } else if (response.status === 400) {
            errorMessage = `❌ ${errorData.error || "Invalid course data. Please check all required fields."}`
          } else if (response.status === 401) {
            errorMessage = "❌ Authentication failed. Please log in again."
          }
          
          if (errorData.details) {
            console.error("Error details:", errorData.details)
          }
        } catch (e) {
          if (response.status === 403) {
            errorMessage = "❌ You need educator permissions to publish courses."
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("🔍 DEBUG: Publish error:", error)
      console.error("🔍 DEBUG: Error name:", error.name)
      console.error("🔍 DEBUG: Error message:", error.message)
      console.error("🔍 DEBUG: Error stack:", error.stack)
      toast.error(`❌ Publish Failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ExamGenius Course Creator
              </h1>
              <p className="text-gray-600 mt-2">Create competitive exam-focused courses with AI-powered content generation</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2">
              <Zap className="h-4 w-4 mr-1" />
              AI-Powered
            </Badge>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2">
              <Target className="h-4 w-4 mr-1" />
              Exam-Focused
            </Badge>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2">
              <Timer className="h-4 w-4 mr-1" />
              Speed-Solving
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: "Course Info", icon: FileText },
              { num: 2, label: "Content Upload", icon: Upload },
              { num: 3, label: "Review & Edit", icon: BookOpen },
              { num: 4, label: "Publish", icon: Award }
            ].map((stepItem, index) => (
              <div key={stepItem.num} className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  step >= stepItem.num 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <stepItem.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{stepItem.label}</span>
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 ${
                    step > stepItem.num ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Course Information */}
        {step === 1 && (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-blue-600" />
                Competitive Exam Course Information
              </CardTitle>
              <CardDescription>
                Set up your competitive exam course with exam-specific details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Complete JEE Mathematics Preparation"
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={courseData.description}
                  onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your competitive exam course and what students will achieve..."
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exam Type *</Label>
                  <Select value={courseData.examType} onValueChange={(value) => setCourseData(prev => ({ ...prev, examType: value }))}>
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map(exam => (
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Learner Level *</Label>
                  <Select value={courseData.learnerLevel} onValueChange={(value) => setCourseData(prev => ({ ...prev, learnerLevel: value }))}>
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - Starting exam prep</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Some preparation done</SelectItem>
                      <SelectItem value="advanced">Advanced - Extensive preparation</SelectItem>
                      <SelectItem value="expert">Expert - Final revision level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={courseData.duration}
                    onChange={(e) => setCourseData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 3 months, 6 weeks"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!courseData.title || !courseData.examType || !courseData.subject || !courseData.learnerLevel}
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
                Upload existing content or generate competitive exam curriculum with AI
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
                    <h3 className="text-lg font-semibold mb-2">Upload Your Competitive Exam Content</h3>
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
                            Process for {courseData.examType}
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
                    <Input
                      id="curriculum-topic"
                      value={curriculumTopic}
                      onChange={(e) => setCurriculumTopic(e.target.value)}
                      placeholder={`e.g., ${courseData.examType} ${courseData.subject} Complete Preparation`}
                      className="border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modules-count">Number of Modules</Label>
                      <Input
                        id="modules-count"
                        type="number"
                        value={numberOfModules}
                        onChange={(e) => setNumberOfModules(parseInt(e.target.value) || 8)}
                        min="4"
                        max="20"
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="module-topics">Specific Topics</Label>
                      <Input
                        id="module-topics"
                        value={moduleTopics}
                        onChange={(e) => setModuleTopics(e.target.value)}
                        placeholder="e.g., Algebra, Calculus, Geometry..."
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teaching-notes">Teaching Notes & Focus Areas</Label>
                    <Textarea
                      id="teaching-notes"
                      value={teachingNotes}
                      onChange={(e) => setTeachingNotes(e.target.value)}
                      placeholder="Special focus areas, exam patterns, important topics to emphasize..."
                      rows={3}
                      className="border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={handleGenerateCurriculum}
                      disabled={loading || !curriculumTopic.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Exam Curriculum
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">{processingStep}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Creating competitive exam-focused content...
                    </div>
                  </div>
                  <Progress value={processingProgress} className="h-3" />
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                {courseData.modules.length > 0 && (
                  <Button
                    onClick={() => setStep(3)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Review Modules
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Edit Modules */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Edit className="h-6 w-6" />
                Review & Edit Modules
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Review your course modules and edit content. Create quizzes for each subsection.
              </p>
            </CardHeader>
            <CardContent>
              {selectedModule !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Editing: {courseData.modules[selectedModule]?.title || "Module"}
                    </h3>
                    <Button
                      onClick={() => setSelectedModule(null)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Overview
                    </Button>
                  </div>
                  
                  <ExamModuleEditorEnhanced
                    module={courseData.modules[selectedModule]}
                    onUpdate={(updatedModule) => {
                      const updatedModules = [...courseData.modules]
                      updatedModules[selectedModule] = updatedModule
                      setCourseData({ ...courseData, modules: updatedModules })
                    }}
                    examType={courseData.examType}
                    subject={courseData.subject}
                    learnerLevel={courseData.learnerLevel}
                    course={courseData}
                    courseId={currentCourseId}
                    onSaveSuccess={(savedCourse, status) => {
                      setCourseData(savedCourse)
                      toast.success(`Course ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`)
                      if (status === 'published' && onCourseCreated) {
                        onCourseCreated(savedCourse)
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courseData.modules.map((module, index) => (
                      <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{module.title}</CardTitle>
                              <p className="text-sm text-gray-600">
                                {module.estimatedTime || "45-60 mins"}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {module.summary || "No summary available"}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Objectives:</span>
                              <span className="font-medium">{module.objectives?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Subsections:</span>
                              <span className="font-medium">{module.detailedSubsections?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Quizzes:</span>
                              <span className="font-medium">{Object.keys(module.subsectionQuizzes || {}).length}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setSelectedModule(index)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Module
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t">
                    <Button
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Content
                    </Button>
                    <Button
                      onClick={() => setStep(4)}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                    >
                      Continue to Publish
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Publish */}
        {step === 4 && (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center justify-center gap-2">
                <Award className="h-6 w-6 text-green-600" />
                Publish Your Competitive Exam Course
              </CardTitle>
              <CardDescription>
                Final review and publish your course for students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Ready to Launch!</h3>
                <p className="text-gray-600 mb-6">
                  Your competitive exam course is ready to help students achieve their goals.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Course Title:</span>
                  <span className="font-medium">{courseData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exam Type:</span>
                  <span className="font-medium">{courseData.examType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-medium">{courseData.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modules:</span>
                  <span className="font-medium">{courseData.modules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modules with Quiz:</span>
                  <span className="font-medium">{courseData.modules.filter(m => m.quiz).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Level:</span>
                  <span className="font-medium">{courseData.learnerLevel}</span>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Review
                </Button>
                
                <Button
                  onClick={handlePublishCourse}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Publish Course
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 