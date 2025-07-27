"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Trash2, 
  Save, 
  BookOpen, 
  Users, 
  GraduationCap,
  FileText,
  Target,
  CheckCircle,
  AlertCircle,
  Calendar,
  Award,
  Upload,
  Brain,
  Sparkles,
  Download,
  Loader2,
  Zap,
  ArrowRight,
  Edit3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ExamModuleEditorEnhanced from "../exam-genius/ExamModuleEditorEnhanced";

const academicLevels = [
  "undergraduate",
  "graduate", 
  "postgraduate",
  "doctoral"
];

const subjects = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Engineering",
  "Business",
  "Psychology",
  "History",
  "Literature",
  "Economics",
  "Political Science",
  "Sociology",
  "Philosophy",
  "Art",
  "Music",
  "Other"
];

const gradingScales = [
  "percentage",
  "gpa",
  "letter"
];

const initialCourseData = {
  title: "",
  description: "",
  subject: "",
  academicLevel: "",
  semester: "",
  credits: 3,
  dueDate: "",
  syllabus: "",
  objectives: [""],
  prerequisites: [""],
  assessmentCriteria: {
    assignments: 40,
    quizzes: 20,
    midterm: 20,
    final: 20
  },
  allowDiscussions: true,
  allowGroupWork: false,
  gradingScale: "percentage",
  modules: []
};

export default function AcademicCourseCreator({ onCourseCreated, editingCourse = null }) {
  const { user, getAuthHeaders } = useAuth();
  const [courseData, setCourseData] = useState(initialCourseData);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  
  // File upload and AI processing states
  const [creationStep, setCreationStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [editingModuleIndex, setEditingModuleIndex] = useState(null);

  useEffect(() => {
    if (editingCourse) {
      setCourseData({
        ...initialCourseData,
        ...editingCourse,
        objectives: editingCourse.objectives?.length > 0 ? editingCourse.objectives : [""],
        prerequisites: editingCourse.prerequisites?.length > 0 ? editingCourse.prerequisites : [""],
        modules: editingCourse.modules?.length > 0 ? editingCourse.modules : []
      });
      // If editing existing course with modules, skip to content tab
      if (editingCourse.modules?.length > 0) {
        setCreationStep(3);
        setActiveTab("content");
      }
    }
  }, [editingCourse]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name, checked) => {
    setCourseData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAssessmentChange = (type, value) => {
    const numValue = parseInt(value) || 0;
    setCourseData(prev => ({
      ...prev,
      assessmentCriteria: {
        ...prev.assessmentCriteria,
        [type]: numValue
      }
    }));
  };

  // File upload handling
  const handleFileSelection = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check file size (25MB limit)
      if (selectedFile.size > 25 * 1024 * 1024) {
        toast.error("File size must be less than 25MB");
        return;
      }

      // Check file type
      const allowedTypes = ["application/pdf", "text/markdown", "text/plain", "application/x-markdown"];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.md')) {
        toast.error("Please select a PDF, Markdown (.md), or Text (.txt) file");
        return;
      }

      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" selected successfully`);
    }
  };

  // Process uploaded syllabus file
  const handleProcessFile = async () => {
    if (!file) {
      toast.error("Please select a syllabus file first");
      return;
    }

    // Validate basic course info
    if (!courseData.title.trim() || !courseData.subject || !courseData.academicLevel) {
      toast.error("Please fill in course title, subject, and academic level before processing syllabus");
      return;
    }

    setLoading(true);
    setProcessingStep("📄 Processing uploaded syllabus...");
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", courseData.title);
      formData.append("description", courseData.description);
      formData.append("subject", courseData.subject);
      formData.append("academicLevel", courseData.academicLevel);
      formData.append("credits", courseData.credits.toString());
      formData.append("isAcademicCourse", "true");

      const progressStages = [
        { step: "📖 Reading and analyzing syllabus content...", progress: 20 },
        { step: "🧠 Extracting key academic concepts...", progress: 40 },
        { step: "📚 Creating structured learning modules...", progress: 60 },
        { step: "🎯 Organizing academic objectives...", progress: 80 },
        { step: "✨ Finalizing course structure...", progress: 95 }
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step);
          setProcessingProgress(progressStages[currentStage].progress);
          currentStage++;
        }
      }, 3000);

      const response = await fetch("/api/academic-courses/process", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      const data = await response.json();

      if (response.ok) {
        setProcessingStep("✅ Syllabus processed successfully!");
        setCourseData(prev => ({
          ...prev,
          modules: data.modules || [],
          objectives: data.objectives || prev.objectives,
          syllabus: data.syllabus || prev.syllabus
        }));
        
        setTimeout(() => {
          setCreationStep(3);
          setActiveTab("content");
          toast.success(`🎉 Syllabus Processing Complete!\n\n✨ Successfully created ${data.modules?.length || 0} academic modules\n\n📚 Your academic course is ready for content editing!`);
        }, 1000);
      } else {
        console.error("File processing error:", data);
        toast.error(data.error || "Failed to process syllabus. Please try again.");
        setProcessingStep("❌ Processing failed");
      }
    } catch (error) {
      console.error("File processing error:", error);
      toast.error(`Failed to process syllabus: ${error.message}`);
      setProcessingStep("❌ Processing failed");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProcessingStep("");
        setProcessingProgress(0);
      }, 2000);
    }
  };

  // Generate modules using AI
  const handleGenerateModules = async () => {
    if (!courseData.title.trim() || !courseData.subject || !courseData.academicLevel) {
      toast.error("Please fill in course title, subject, and academic level first");
      return;
    }

    setLoading(true);
    setProcessingStep("🧠 AI is generating academic modules...");
    setProcessingProgress(0);

    try {
      const progressStages = [
        { step: "🔍 Analyzing course requirements...", progress: 25 },
        { step: "📚 Creating academic module structure...", progress: 50 },
        { step: "🎯 Organizing learning objectives...", progress: 75 },
        { step: "✨ Adding assessments and resources...", progress: 90 }
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step);
          setProcessingProgress(progressStages[currentStage].progress);
          currentStage++;
        }
      }, 2000);

      const response = await fetch("/api/academic-courses/generate-modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          subject: courseData.subject,
          academicLevel: courseData.academicLevel,
          credits: courseData.credits,
          semester: courseData.semester,
          objectives: courseData.objectives.filter(obj => obj.trim()),
          numberOfModules: 8 // Default number of modules
        }),
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      const data = await response.json();

      if (response.ok) {
        setProcessingStep("✅ Academic modules generated!");
        setCourseData(prev => ({
          ...prev,
          modules: data.modules || []
        }));
        
        setTimeout(() => {
          setCreationStep(3);
          setActiveTab("content");
          toast.success(`🎉 AI Module Generation Complete!\n\n📖 Topic: ${courseData.title}\n🎯 Level: ${courseData.academicLevel}\n📊 Modules: ${data.modules?.length || 0}\n\n📚 Academic curriculum ready for editing!`);
        }, 1000);
      } else {
        console.error("Module generation error:", data);
        toast.error(data.error || "Failed to generate modules. Please try again.");
        setProcessingStep("❌ Generation failed");
      }
    } catch (error) {
      console.error("Module generation error:", error);
      toast.error(`Failed to generate modules: ${error.message}`);
      setProcessingStep("❌ Generation failed");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProcessingStep("");
        setProcessingProgress(0);
      }, 2000);
    }
  };

  const addObjective = () => {
    setCourseData(prev => ({
      ...prev,
      objectives: [...prev.objectives, ""]
    }));
  };

  const updateObjective = (index, value) => {
    setCourseData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => i === index ? value : obj)
    }));
  };

  const removeObjective = (index) => {
    setCourseData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const addPrerequisite = () => {
    setCourseData(prev => ({
      ...prev,
      prerequisites: [...prev.prerequisites, ""]
    }));
  };

  const updatePrerequisite = (index, value) => {
    setCourseData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.map((prereq, i) => i === index ? value : prereq)
    }));
  };

  const removePrerequisite = (index) => {
    setCourseData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const addModule = () => {
    const newModule = {
      id: Date.now(),
      title: "",
      content: "",
      summary: "",
      order: courseData.modules.length + 1
    };
    setCourseData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
  };

  const updateModule = (index, field, value) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === index ? { ...module, [field]: value } : module
      )
    }));
  };

  const removeModule = (index) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index)
    }));
  };

  const handleEditModule = (index) => {
    setEditingModuleIndex(index);
    setShowModuleEditor(true);
  };

  const handleModuleUpdate = (updatedModule) => {
    if (editingModuleIndex !== null) {
      updateModule(editingModuleIndex, 'title', updatedModule.title);
      updateModule(editingModuleIndex, 'content', updatedModule.content);
      updateModule(editingModuleIndex, 'summary', updatedModule.summary);
    }
    setShowModuleEditor(false);
    setEditingModuleIndex(null);
  };

  const validateCourse = () => {
    if (!courseData.title.trim()) return "Course title is required";
    if (!courseData.description.trim()) return "Course description is required";
    if (!courseData.subject) return "Subject is required";
    if (!courseData.academicLevel) return "Academic level is required";
    if (!courseData.dueDate) return "Due date is required";
    
    // Validate objectives
    const validObjectives = courseData.objectives.filter(obj => obj.trim());
    if (validObjectives.length === 0) return "At least one learning objective is required";
    
    // Validate assessment criteria totals 100%
    const total = Object.values(courseData.assessmentCriteria).reduce((sum, val) => sum + val, 0);
    if (total !== 100) return "Assessment criteria must total 100%";
    
    return null;
  };

  const handleCreateCourse = async () => {
    const validationError = validateCourse();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccess("");

    try {
      // Filter out empty objectives and prerequisites
      const processedData = {
        ...courseData,
        objectives: courseData.objectives.filter(obj => obj.trim()),
        prerequisites: courseData.prerequisites.filter(prereq => prereq.trim()),
        modules: courseData.modules.filter(module => module.title?.trim()),
        status: "published",
        courseType: "academic"
      };

      const endpoint = editingCourse 
        ? `/api/academic-courses/${editingCourse._id}`
        : "/api/academic-courses";
      
      const method = editingCourse ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingCourse ? 'update' : 'create'} academic course`);
      }

      const result = await response.json();
      setSuccess(`Academic course ${editingCourse ? 'updated' : 'created'} successfully!`);
      
      if (onCourseCreated) {
        onCourseCreated(result);
      }

      if (!editingCourse) {
        setCourseData(initialCourseData);
        setActiveTab("basic");
        setCreationStep(1);
      }

    } catch (error) {
      console.error("Error creating academic course:", error);
      setError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const getTotalPercentage = () => {
    return Object.values(courseData.assessmentCriteria).reduce((sum, val) => sum + val, 0);
  };

  // Show module editor modal
  if (showModuleEditor && editingModuleIndex !== null) {
    const module = courseData.modules[editingModuleIndex];
    return (
      <ExamModuleEditorEnhanced
        module={module}
        onSave={handleModuleUpdate}
        onCancel={() => {
          setShowModuleEditor(false);
          setEditingModuleIndex(null);
        }}
        isAcademicMode={true}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {editingCourse ? 'Edit Academic Course' : 'Create Academic Course'}
          </h1>
          <p className="text-gray-600 mt-2">
            Design comprehensive academic courses with AI-powered content generation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <Badge variant="secondary">Academic</Badge>
        </div>
      </div>

      {/* Progress indicator for creation steps */}
      {!editingCourse && (
        <div className="flex items-center justify-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className={`flex items-center space-x-2 ${creationStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${creationStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            <span className="text-sm font-medium">Course Info</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center space-x-2 ${creationStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${creationStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
            <span className="text-sm font-medium">Syllabus/AI</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center space-x-2 ${creationStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${creationStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
            <span className="text-sm font-medium">Content & Settings</span>
          </div>
        </div>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Processing indicator */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div className="flex-1">
                <p className="text-blue-800 font-medium">{processingStep}</p>
                <Progress value={processingProgress} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" disabled={editingCourse && creationStep > 1}>Basic Info</TabsTrigger>
          <TabsTrigger value="syllabus" disabled={editingCourse && creationStep > 2}>Syllabus/AI</TabsTrigger>
          <TabsTrigger value="content" disabled={creationStep < 3}>Content</TabsTrigger>
          <TabsTrigger value="assessment" disabled={creationStep < 3}>Assessment</TabsTrigger>
          <TabsTrigger value="settings" disabled={creationStep < 3}>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>
                Enter the fundamental details of your academic course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={courseData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Advanced Data Structures and Algorithms"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Select 
                    name="subject" 
                    value={courseData.subject} 
                    onValueChange={(value) => handleSelectChange("subject", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
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
                <div>
                  <Label htmlFor="academicLevel">Academic Level *</Label>
                  <Select 
                    name="academicLevel" 
                    value={courseData.academicLevel} 
                    onValueChange={(value) => handleSelectChange("academicLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic level" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="semester">Semester/Term</Label>
                  <Input
                    id="semester"
                    name="semester"
                    value={courseData.semester}
                    onChange={handleInputChange}
                    placeholder="e.g., Fall 2024, Spring 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    min="1"
                    max="10"
                    value={courseData.credits}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Course Due Date *</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={courseData.dueDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={courseData.description}
                  onChange={handleInputChange}
                  placeholder="Provide a comprehensive description of what students will learn in this course..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {!editingCourse && (
            <div className="flex justify-end">
              <Button 
                onClick={() => setCreationStep(2)} 
                disabled={!courseData.title.trim() || !courseData.subject || !courseData.academicLevel}
              >
                Continue to Syllabus/AI
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Syllabus</span>
              </CardTitle>
              <CardDescription>
                Upload your syllabus file and let AI extract modules and content automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <Label htmlFor="syllabus-file" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-700">
                    Drop your syllabus file here or click to browse
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports PDF, Markdown (.md), and Text (.txt) files (max 25MB)
                  </p>
                </Label>
                <Input
                  id="syllabus-file"
                  type="file"
                  accept=".pdf,.md,.txt,.markdown"
                  onChange={handleFileSelection}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{file.name}</p>
                      <p className="text-sm text-green-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleProcessFile}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Process with AI
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center py-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">OR</span>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Generate with AI</span>
              </CardTitle>
              <CardDescription>
                Let AI create a comprehensive academic curriculum based on your course information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGenerateModules}
                disabled={loading || !courseData.title.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Modules...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Generate Academic Modules with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {!editingCourse && courseData.modules.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No modules created yet</p>
              <p>Upload a syllabus file or generate modules with AI to continue</p>
            </div>
          )}

          {courseData.modules.length > 0 && (
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setCreationStep(3);
                  setActiveTab("content");
                }}
              >
                Continue to Content Editing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Course Modules ({courseData.modules.length})</span>
              </CardTitle>
              <CardDescription>
                Review and edit your course modules. Click on any module to open the advanced editor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseData.modules.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500">No modules available</p>
                  <p className="text-gray-400">Go to the Syllabus/AI tab to create modules first</p>
                </div>
              ) : (
                <>
                  {courseData.modules.map((module, index) => (
                    <Card key={module.id || index} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Module {index + 1}: {module.title || `Untitled Module`}
                          </CardTitle>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditModule(index)}
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeModule(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {module.summary && (
                          <p className="text-sm text-gray-600 mb-2">{module.summary}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          Content: {module.content ? `${module.content.slice(0, 100)}...` : 'No content yet'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outline" onClick={addModule} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual Module
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Learning Objectives</span>
              </CardTitle>
              <CardDescription>
                Define what students will be able to do after completing this course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseData.objectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    placeholder="e.g., Analyze complex algorithms and their time complexity"
                  />
                  {courseData.objectives.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeObjective(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addObjective} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Learning Objective
              </Button>
            </CardContent>
          </Card>

          {/* Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Prerequisites</span>
              </CardTitle>
              <CardDescription>
                List courses or knowledge students should have before taking this course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseData.prerequisites.map((prerequisite, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={prerequisite}
                    onChange={(e) => updatePrerequisite(index, e.target.value)}
                    placeholder="e.g., Introduction to Programming, Discrete Mathematics"
                  />
                  {courseData.prerequisites.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrerequisite(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addPrerequisite} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Prerequisite
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Assessment Criteria</span>
              </CardTitle>
              <CardDescription>
                Define how student performance will be evaluated (must total 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignments">Assignments (%)</Label>
                  <Input
                    id="assignments"
                    type="number"
                    min="0"
                    max="100"
                    value={courseData.assessmentCriteria.assignments}
                    onChange={(e) => handleAssessmentChange("assignments", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="quizzes">Quizzes (%)</Label>
                  <Input
                    id="quizzes"
                    type="number"
                    min="0"
                    max="100"
                    value={courseData.assessmentCriteria.quizzes}
                    onChange={(e) => handleAssessmentChange("quizzes", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="midterm">Midterm Exam (%)</Label>
                  <Input
                    id="midterm"
                    type="number"
                    min="0"
                    max="100"
                    value={courseData.assessmentCriteria.midterm}
                    onChange={(e) => handleAssessmentChange("midterm", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="final">Final Exam (%)</Label>
                  <Input
                    id="final"
                    type="number"
                    min="0"
                    max="100"
                    value={courseData.assessmentCriteria.final}
                    onChange={(e) => handleAssessmentChange("final", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Total:</span>
                <span className={`font-bold ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {getTotalPercentage()}%
                </span>
              </div>
              {getTotalPercentage() !== 100 && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    Assessment criteria must total exactly 100%
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grading Scale</CardTitle>
              <CardDescription>
                Choose how grades will be displayed to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                name="gradingScale" 
                value={courseData.gradingScale} 
                onValueChange={(value) => handleSelectChange("gradingScale", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grading scale" />
                </SelectTrigger>
                <SelectContent>
                  {gradingScales.map((scale) => (
                    <SelectItem key={scale} value={scale}>
                      {scale === "percentage" ? "Percentage (0-100%)" : 
                       scale === "gpa" ? "GPA (0.0-4.0)" : 
                       "Letter Grades (A-F)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Course Features</span>
              </CardTitle>
              <CardDescription>
                Configure additional features for your academic course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allowDiscussions">Discussion Forums</Label>
                  <p className="text-sm text-gray-500">
                    Allow students to participate in course discussions
                  </p>
                </div>
                <Switch
                  id="allowDiscussions"
                  checked={courseData.allowDiscussions}
                  onCheckedChange={(checked) => handleSwitchChange("allowDiscussions", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allowGroupWork">Group Work</Label>
                  <p className="text-sm text-gray-500">
                    Enable collaborative assignments and group projects
                  </p>
                </div>
                <Switch
                  id="allowGroupWork"
                  checked={courseData.allowGroupWork}
                  onCheckedChange={(checked) => handleSwitchChange("allowGroupWork", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button variant="outline" onClick={() => setActiveTab("basic")}>
          Reset
        </Button>
        <Button 
          onClick={handleCreateCourse} 
          disabled={isCreating || getTotalPercentage() !== 100}
          className="min-w-[120px]"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {editingCourse ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {editingCourse ? 'Update Course' : 'Create Course'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 