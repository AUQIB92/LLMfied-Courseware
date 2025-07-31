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
  Eye
} from "lucide-react"

export default function CompetitiveCourseCreator({ onCourseCreated }) {
  const { user, getAuthHeaders } = useAuth()
  
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
  const [loading, setLoading] = useState(false)
  
  const [newCourseData, setNewCourseData] = useState({
    title: "",
    description: "",
    academicLevel: "",
    subject: "",
    semester: "intermediate",
    duration: "",
    difficultyLevel: "medium",
    modules: []
  })

  const academicLevels = [
    { id: "jee", name: "JEE Main/Advanced", icon: "🔬", color: "blue" },
    { id: "neet", name: "NEET", icon: "🏥", color: "green" },
    { id: "gate", name: "GATE", icon: "⚙️", color: "purple" },
    { id: "cat", name: "CAT", icon: "💼", color: "orange" },
    { id: "upsc", name: "UPSC", icon: "🏛️", color: "red" },
    { id: "banking", name: "Banking", icon: "🏦", color: "cyan" },
    { id: "ssc", name: "SSC", icon: "📊", color: "pink" },
    { id: "railways", name: "Railways", icon: "🚂", color: "green" },
    { id: "teaching", name: "Teaching (CTET/TET)", icon: "👩‍🏫", color: "blue" },
    { id: "defense", name: "Defense (CDS/NDA)", icon: "🛡️", color: "red" },
    { id: "custom", name: "Custom", icon: "⚡", color: "yellow" }
  ]

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science",
    "General Knowledge", "Reasoning", "Economics", "History", "Geography", 
    "Political Science", "Quantitative Aptitude", "Verbal Ability", "Current Affairs",
    "General Science", "Environmental Studies", "Other"
  ]

  const handleGenerateCurriculum = async () => {
    if (!curriculumTopic.trim() || !newCourseData.academicLevel || !newCourseData.subject) {
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

      const response = await fetch("/api/academic-courses/generate-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          topic: curriculumTopic,
          academicLevel: newCourseData.academicLevel,
          subject: newCourseData.subject,
          semester: newCourseData.semester,
          duration: newCourseData.duration,
          title: newCourseData.title,
          description: newCourseData.description,
          moduleTopics: moduleTopics,
          teachingNotes: teachingNotes,
          numberOfModules: numberOfModules,
          isCompetitiveExam: true
        }),
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const data = await response.json()

      if (response.ok) {
        setProcessingStep("✅ Curriculum generated successfully!")
        setGeneratedCurriculum(data.curriculum)
        setShowCurriculumPreview(true)
        
        setTimeout(() => {
          setCreationStep(3)
          setLoading(false)
        }, 1000)
      } else {
        throw new Error(data.error || "Failed to generate curriculum")
      }
    } catch (error) {
      console.error("Error generating curriculum:", error)
      toast.error("Failed to generate curriculum. Please try again.")
      setLoading(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }

  const handleProcessFile = async () => {
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    setLoading(true)
    setProcessingStep("📄 Processing uploaded file...")
    setProcessingProgress(20)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/academic-courses/process-file', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      })

      setProcessingProgress(60)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const fileData = await response.json()
      
      setProcessingProgress(90)

      // Create structured modules from the processed file
      const structuredModules = fileData.structure.modules.map((module) => {
        let moduleContent = `## ${module.title}\n\n`;

        module.sections.forEach((section) => {
          moduleContent += `### ${section.title}\n\n`;
          section.subsections.forEach((subsection) => {
            moduleContent += `#### ${subsection.title}\n\n`;
          });
        });

        return {
          title: module.title,
          content: moduleContent,
          id: `module-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          academicLevel: newCourseData.academicLevel,
          subject: newCourseData.subject,
          semester: newCourseData.semester,
          isAcademicCourse: true,
          isCompetitiveExam: true,
        };
      });

      const updatedCourseData = {
        ...newCourseData,
        modules: structuredModules,
        isAcademicCourse: true,
        isCompetitiveExam: true,
      };

      setNewCourseData(updatedCourseData);

      setProcessingStep("✅ Course template created successfully!");
      setProcessingProgress(100);

      setTimeout(() => {
        setCreationStep(3);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error("Error processing file:", error)
      toast.error("Failed to process file. Please try again.")
      setLoading(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }

  const handleProcessCurriculum = async () => {
    if (!generatedCurriculum) return

    setLoading(true)
    setProcessingStep("🚀 Processing curriculum into detailed competitive course modules...")
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

      const response = await fetch("/api/academic-courses/process-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          curriculum: generatedCurriculum,
          courseData: {
            ...newCourseData,
            isCompetitiveExam: true,
            isAcademicCourse: true
          }
        }),
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const data = await response.json()

      if (response.ok) {
        setProcessingStep("✅ Course modules processed successfully!")
        setNewCourseData(prevData => ({
          ...prevData,
          modules: data.modules
        }))
        
        setTimeout(() => {
          handleCreateFinalCourse()
        }, 1000)
      } else {
        throw new Error(data.error || "Failed to process curriculum")
      }
    } catch (error) {
      console.error("Error processing curriculum:", error)
      toast.error("Failed to process curriculum. Please try again.")
      setLoading(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }

  const handleCreateFinalCourse = async () => {
    try {
      const courseData = {
        ...newCourseData,
        isCompetitiveExam: true,
        isAcademicCourse: true,
        educatorId: user.id,
        modules: newCourseData.modules.map(module => ({
          ...module,
          isCompetitiveExam: true,
          academicLevel: newCourseData.academicLevel,
          subject: newCourseData.subject,
          semester: newCourseData.semester
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
        toast.success("Competitive exam course created successfully!")
        
        // Reset form
        resetCourseForm()
        
        if (onCourseCreated) {
          onCourseCreated()
        }
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create course")
      }
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("An error occurred while creating the course")
    }
  }

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
      academicLevel: "",
      subject: "",
      semester: "intermediate",
      duration: "",
      difficultyLevel: "medium",
      modules: []
    })
    setLoading(false)
    
    // Clear file input
    const fileInput = document.getElementById('competitive-file-upload')
    if (fileInput) fileInput.value = ''
  }

  const handleDownloadCurriculum = () => {
    if (!generatedCurriculum) return

    const blob = new Blob([generatedCurriculum], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${newCourseData.title || curriculumTopic}-${newCourseData.academicLevel}-curriculum.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                Competitive Exam Course Creator
              </h1>
              <p className="text-gray-600">Create specialized courses for competitive exams</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
              <Zap className="h-4 w-4 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  ${creationStep >= step 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' 
                    : 'bg-gray-200 text-gray-500'}`}>
                  {step}
                </div>
                {index < 2 && (
                  <div className={`h-1 w-16 mx-2 ${creationStep > step ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">
                {creationStep === 1 ? "Course Information" : 
                 creationStep === 2 ? "Curriculum Generation" : 
                 "Review & Process"}
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {creationStep === 1 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Competitive Exam Course Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={newCourseData.title}
                    onChange={(e) => setNewCourseData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., SSC CGL Complete Course, UPSC Prelims Preparation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicLevel">Exam Type *</Label>
                  <Select value={newCourseData.academicLevel} onValueChange={(value) => setNewCourseData(prev => ({ ...prev, academicLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicLevels.map((level) => (
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

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={newCourseData.subject} onValueChange={(value) => setNewCourseData(prev => ({ ...prev, subject: value }))}>
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
                  <Label htmlFor="duration">Course Duration</Label>
                  <Input
                    id="duration"
                    value={newCourseData.duration}
                    onChange={(e) => setNewCourseData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 6 months, 1 year"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  value={newCourseData.description}
                  onChange={(e) => setNewCourseData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your competitive exam course..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setCreationStep(2)}
                  disabled={!newCourseData.title || !newCourseData.academicLevel || !newCourseData.subject}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  Next: Generate Curriculum
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
                <Sparkles className="h-5 w-5" />
                Curriculum Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={generationType} onValueChange={setGenerationType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="generate">AI Generate</TabsTrigger>
                  <TabsTrigger value="upload">Upload Syllabus</TabsTrigger>
                </TabsList>
                
                <TabsContent value="generate" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="curriculumTopic">Curriculum Topic/Theme *</Label>
                      <Input
                        id="curriculumTopic"
                        value={curriculumTopic}
                        onChange={(e) => setCurriculumTopic(e.target.value)}
                        placeholder="e.g., Complete SSC CGL Preparation, UPSC Prelims General Studies"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="numberOfModules">Number of Modules</Label>
                        <Input
                          id="numberOfModules"
                          type="number"
                          value={numberOfModules}
                          onChange={(e) => setNumberOfModules(parseInt(e.target.value) || 8)}
                          min="4"
                          max="20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="moduleTopics">Specific Topics to Include (Optional)</Label>
                      <Textarea
                        id="moduleTopics"
                        value={moduleTopics}
                        onChange={(e) => setModuleTopics(e.target.value)}
                        placeholder="List specific topics you want to include..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teachingNotes">Additional Teaching Notes (Optional)</Label>
                      <Textarea
                        id="teachingNotes"
                        value={teachingNotes}
                        onChange={(e) => setTeachingNotes(e.target.value)}
                        placeholder="Any specific instructions or focus areas..."
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">Upload Exam Syllabus or Curriculum</p>
                    <p className="text-sm text-gray-500 mb-4">Support for PDF, DOC, DOCX, TXT files</p>
                    <Input
                      id="competitive-file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="hidden"
                    />
                    <label htmlFor="competitive-file-upload">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </span>
                      </Button>
                    </label>
                    {file && (
                      <p className="mt-2 text-sm text-green-600">Selected: {file.name}</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {loading && (
                <Card className="border-orange-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
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
                  onClick={generationType === "generate" ? handleGenerateCurriculum : handleProcessFile}
                  disabled={loading || (generationType === "generate" && !curriculumTopic.trim()) || (generationType === "upload" && !file)}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  {generationType === "generate" ? "Generate Curriculum" : "Process File"}
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {creationStep === 3 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Review & Create Course
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedCurriculum && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Curriculum</h3>
                    <Button
                      variant="outline"
                      onClick={handleDownloadCurriculum}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedCurriculum}</pre>
                  </div>
                </div>
              )}

              {loading && (
                <Card className="border-orange-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
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
                  onClick={() => setCreationStep(2)}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleProcessCurriculum}
                  disabled={loading || !generatedCurriculum}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  Create Competitive Course
                  <Trophy className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}