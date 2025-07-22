"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  BookOpen,
  Video,
  FileText,
  Globe,
  Wrench,
  Target,
  Lightbulb,
  Sparkles,
  GraduationCap,
  Brain,
  Zap,
  Trophy,
  Timer,
  Award,
  CheckCircle,
  AlertCircle,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  Users,
  Clock,
  Layers,
  Network,
  Calculator,
  RefreshCw,
  Eye,
  Download,
  Share2,
  BarChart3,
  TrendingUp,
  ExternalLink,
  Loader2
} from "lucide-react"
import MathMarkdownRenderer from "@/components/MathMarkdownRenderer";

function parseMarkdownToPages(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return []
  }

  // Split by newline followed by "####" and any whitespace
  const sections = markdown.split(/\\n####\\s+/)
  const pages = []

  // The first element of split() is the content before the first delimiter
  const introContent = sections.shift()?.trim()

  // If there's content before the first "####", add it as an "Introduction" page
  if (introContent) {
    pages.push({ title: "Introduction", content: introContent })
  }

  sections.forEach(section => {
    const lines = section.split("\\n")
    const title = lines.shift()?.trim() || "Untitled Section"
    const content = lines.join("\\n").trim()
    if (title && content) {
      pages.push({ title, content })
    }
  })

  // If, after all that, we have no pages but there was intro content,
  // it means there were no "####" delimiters. Treat the whole thing as one page.
  if (pages.length === 0 && introContent) {
    return [{ title: "Content", content: introContent }]
  }

  return pages
}

function parseMarkdownToSubsections(markdownContent) {
  if (!markdownContent) {
    return [];
  }

  const subsections = [];
  const lines = markdownContent.split('\n');
  let currentSubsection = null;

  lines.forEach(line => {
    // Match ###, ####, etc. but NOT ##
    const match = line.match(/^(###+)\s+(.*)/); 
    if (match) {
      if (currentSubsection) {
        subsections.push(currentSubsection);
      }
      currentSubsection = {
        title: match[2].trim(),
        content: ''
      };
    } else if (currentSubsection && !line.match(/^##\s+.*/)) { // Ignore module titles
      currentSubsection.content += line + '\n';
    }
  });

  if (currentSubsection) {
    subsections.push(currentSubsection);
  }

  return subsections.map(sub => ({ ...sub, content: sub.content.trim() }));
}

export default function ExamModuleEditorEnhanced({ module, onUpdate, examType, subject, learnerLevel, course, courseId, onSaveSuccess }) {
  const { getAuthHeaders } = useAuth()
  
  // Main tabs state
  const [activeMainTab, setActiveMainTab] = useState("overview")
  
  // Save/publish state
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  // Detailed explanations pagination
  const [currentExplanationPage, setCurrentExplanationPage] = useState(0)
  const [explanationsPerPage] = useState(3)
  
  // Individual explanation pagination
  const [explanationPages, setExplanationPages] = useState({})
  const [wordsPerExplanationPage] = useState(200)
  
  // Quiz generation state
  const [generatingQuiz, setGeneratingQuiz] = useState({})
  const [quizProgress, setQuizProgress] = useState({})
  const [subsectionQuizzes, setSubsectionQuizzes] = useState(module.subsectionQuizzes || {})
  
  // Resource management
  const [showManualResourceForm, setShowManualResourceForm] = useState(false)
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    description: "",
    type: "article"
  })
  const [editingResource, setEditingResource] = useState(null)
  const [editForm, setEditForm] = useState({})
  
  // Edit states
  const [editingObjective, setEditingObjective] = useState(null)
  const [editingExample, setEditingExample] = useState(null)
  const [editingSubsection, setEditingSubsection] = useState(null)
  const [newObjective, setNewObjective] = useState("")
  const [newExample, setNewExample] = useState("")
  
  const detailedSubsections = useMemo(() => {
    const content = module.content || '';
    const lines = content.split('\n');
    const sections = {}; // "1.1" -> "Basic concepts"
    
    // First pass: find all section headers (###)
    lines.forEach(line => {
      const sectionMatch = line.match(/^###\s+([\d.]+)\s+(.*)/);
      if (sectionMatch) {
        sections[sectionMatch[1]] = sectionMatch[2].trim();
      }
    });

    const subsectionsFromMarkdown = [];
    // Second pass: find all subsection headers (####)
    lines.forEach(line => {
      const subsectionMatch = line.match(/^####\s+([\d.]+)\s+(.*)/);
      if (subsectionMatch) {
        const number = subsectionMatch[1]; // "1.1.1"
        const name = subsectionMatch[2].trim(); // "Resistance"
        
        subsectionsFromMarkdown.push({
          title: `${number} ${name}`,
          number: number,
          name: name
        });
      }
    });

    const aiSubsections = module.detailedSubsections || [];

    // Now, map over the markdown subsections, and enrich with AI data.
    return subsectionsFromMarkdown.map(mdSub => {
      // Find the corresponding AI subsection. Match by number.
      const aiSub = aiSubsections.find(ai => {
        if (!ai.title) return false;
        const aiMatch = ai.title.match(/^([\d.]+)/);
        return aiMatch && aiMatch[1] === mdSub.number;
      }) || {};

      const parentNumber = mdSub.number.split('.').slice(0, 2).join('.');
      const parentName = sections[parentNumber] || '';
      
      const formattedTitle = parentName ? `${parentName}:${mdSub.name}` : mdSub.name;

      return {
        ...aiSub, // a lot of rich content
        title: mdSub.title, // overwrite with the one from markdown for consistency
        formattedTitle: formattedTitle,
        // Pre-parse the pages here, outside the render loop
        subsectionPages: parseMarkdownToPages(aiSub.generatedMarkdown)
      };
    });
  }, [module.content, module.detailedSubsections]);
  
  const totalExplanationPages = Math.ceil(detailedSubsections.length / explanationsPerPage)
  const startExplanationIndex = currentExplanationPage * explanationsPerPage
  const endExplanationIndex = startExplanationIndex + explanationsPerPage
  const currentPageExplanations = detailedSubsections.slice(startExplanationIndex, endExplanationIndex)

  // Get current page for a specific explanation
  const getCurrentExplanationPage = (subsectionIndex) => {
    return explanationPages[subsectionIndex] || 0
  }

  // Set current page for a specific explanation
  const setCurrentExplanationPageForSubsection = (subsectionIndex, pageIndex) => {
    setExplanationPages(prev => ({
      ...prev,
      [subsectionIndex]: pageIndex
    }))
  }

  // Generate quiz for subsection with difficulty level
  const generateSubsectionQuiz = async (subsection, subsectionIndex, difficulty = 'medium') => {
    // Build comprehensive content from all available fields
    const contentParts = []
    
    if (subsection.summary) contentParts.push(`Summary: ${subsection.summary}`)
    if (subsection.keyPoints && Array.isArray(subsection.keyPoints)) {
      contentParts.push(`Key Points: ${subsection.keyPoints.join(', ')}`)
    }
    if (subsection.generatedMarkdown) {
      contentParts.push(subsection.generatedMarkdown);
    }
    if (subsection.pages && Array.isArray(subsection.pages)) {
      subsection.pages.forEach((page, index) => {
        if (page.content) contentParts.push(`Page ${index + 1}: ${page.content}`)
      })
    }
    if (subsection.practicalExample) contentParts.push(`Practical Example: ${subsection.practicalExample}`)
    if (subsection.commonPitfalls) contentParts.push(`Common Pitfalls: ${subsection.commonPitfalls}`)
    if (subsection.explanation) contentParts.push(`Explanation: ${subsection.explanation}`)
    if (subsection.content) contentParts.push(`Content: ${subsection.content}`)
    if (subsection.details) contentParts.push(`Details: ${subsection.details}`)
    
    const subsectionContent = contentParts.join('\n\n')
    
    console.log("🔍 Quiz generation debug:", {
      subsection: subsection,
      title: subsection.title,
      hasExplanation: !!subsection.explanation,
      hasContent: !!subsection.content,
      hasDetails: !!subsection.details,
      contentLength: subsectionContent.length,
      examType: examType,
      subject: subject,
      difficulty: difficulty,
      allFields: Object.keys(subsection)
    })
    
    if (!subsection.title) {
      toast.error("❌ Subsection title is required for quiz generation")
      console.log("Missing title:", { subsection })
      return
    }
    
    if (!subsectionContent || subsectionContent.trim().length < 10) {
      toast.error("❌ Subsection content is required and must be at least 10 characters long")
      console.log("Missing/insufficient content:", { 
        contentLength: subsectionContent.length,
        content: subsectionContent,
        subsection,
        availableFields: Object.keys(subsection)
      })
      return
    }

    const quizKey = `${subsectionIndex}_${difficulty}`
    setGeneratingQuiz(prev => ({ ...prev, [quizKey]: true }))
    setQuizProgress(prev => ({ ...prev, [quizKey]: 0 }))

    try {
      toast.info(`🎯 Creating ${difficulty} quiz for: ${subsection.title}`)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setQuizProgress(prev => {
          const current = prev[quizKey] || 0
          const next = Math.min(current + 20, 90)
          return { ...prev, [quizKey]: next }
        })
      }, 500)

      const requestPayload = {
        concept: subsection.title,
        content: subsectionContent.trim(),
        examType: examType,
        subject: subject,
        learnerLevel: difficulty // Use difficulty as learner level
      }

      console.log("📤 Sending quiz generation request:", {
        url: "/api/exam-genius/generate-quiz",
        payload: requestPayload,
        contentLength: subsectionContent.length,
        headers: getAuthHeaders()
      })

      const response = await fetch("/api/exam-genius/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(requestPayload),
      })

      clearInterval(progressInterval)
      setQuizProgress(prev => ({ ...prev, [quizKey]: 100 }))

      console.log("📥 Quiz generation response:", response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Quiz generation successful:", data)
        
        // Store quiz in subsection quizzes
        const updatedQuizzes = {
          ...subsectionQuizzes,
          [quizKey]: {
            ...data.quiz,
            difficulty: difficulty,
            subsectionTitle: subsection.title,
            formattedSubsectionTitle: subsection.formattedTitle,
            createdAt: new Date().toISOString()
          }
        }
        
        setSubsectionQuizzes(updatedQuizzes)
        
        // Update module with quizzes
        onUpdate({
          ...module,
          subsectionQuizzes: updatedQuizzes
        })
        
        toast.success(`🏆 ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} quiz created successfully!`)
      } else {
        const errorText = await response.text()
        console.error("Quiz generation failed:", response.status, response.statusText, errorText)
        
        let errorMessage = "Failed to create quiz"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("Quiz creation error:", error)
      toast.error(`Failed to create quiz: ${error.message}`)
    } finally {
      setTimeout(() => {
        setGeneratingQuiz(prev => ({ ...prev, [quizKey]: false }))
        setQuizProgress(prev => ({ ...prev, [quizKey]: 0 }))
      }, 1000)
    }
  }

  // Delete quiz
  const deleteSubsectionQuiz = (subsectionIndex, difficulty) => {
    const quizKey = `${subsectionIndex}_${difficulty}`
    const updatedQuizzes = { ...subsectionQuizzes }
    delete updatedQuizzes[quizKey]
    
    setSubsectionQuizzes(updatedQuizzes)
    onUpdate({
      ...module,
      subsectionQuizzes: updatedQuizzes
    })
    
    toast.success("Quiz deleted successfully")
  }

  // Update module fields
  const updateModuleField = (field, value) => {
    onUpdate({
      ...module,
      [field]: value
    })
  }

  // Add objective
  const addObjective = () => {
    if (!newObjective.trim()) return
    const updatedObjectives = [...(module.objectives || []), newObjective.trim()]
    updateModuleField('objectives', updatedObjectives)
    setNewObjective("")
    toast.success("Objective added")
  }

  // Update objective
  const updateObjective = (index, value) => {
    const updatedObjectives = module.objectives.map((obj, i) => 
      i === index ? value : obj
    )
    updateModuleField('objectives', updatedObjectives)
  }

  // Remove objective
  const removeObjective = (index) => {
    const updatedObjectives = module.objectives.filter((_, i) => i !== index)
    updateModuleField('objectives', updatedObjectives)
    toast.success("Objective removed")
  }

  // Add example
  const addExample = () => {
    if (!newExample.trim()) return
    const updatedExamples = [...(module.examples || []), newExample.trim()]
    updateModuleField('examples', updatedExamples)
    setNewExample("")
    toast.success("Example added")
  }

  // Update example
  const updateExample = (index, value) => {
    const updatedExamples = module.examples.map((ex, i) => 
      i === index ? value : ex
    )
    updateModuleField('examples', updatedExamples)
  }

  // Remove example
  const removeExample = (index) => {
    const updatedExamples = module.examples.filter((_, i) => i !== index)
    updateModuleField('examples', updatedExamples)
    toast.success("Example removed")
  }

  // Update subsection - handle both explanation and content fields
  const updateSubsection = (index, updates) => {
    const updatedSubsections = detailedSubsections.map((sub, i) => 
      i === index ? { ...sub, ...updates } : sub
    )
    updateModuleField('detailedSubsections', updatedSubsections)
  }

  // Resource management functions
  const resourceCategories = {
    books: { icon: BookOpen, label: "Books", color: "blue" },
    courses: { icon: GraduationCap, label: "Courses", color: "green" },
    articles: { icon: FileText, label: "Articles", color: "purple" },
    videos: { icon: Video, label: "Videos", color: "red" },
    tools: { icon: Wrench, label: "Tools", color: "orange" },
    websites: { icon: Globe, label: "Websites", color: "cyan" },
    exercises: { icon: Target, label: "Exercises", color: "pink" }
  }

  const addResource = (category, resource) => {
    const updatedResources = {
      ...module.resources,
      [category]: [...(module.resources[category] || []), resource]
    }
    updateModuleField('resources', updatedResources)
  }

  const removeResource = (category, index) => {
    const updatedResources = {
      ...module.resources,
      [category]: module.resources[category].filter((_, i) => i !== index)
    }
    updateModuleField('resources', updatedResources)
  }

  // Navigation helpers
  const goToNextExplanationPage = () => {
    if (currentExplanationPage < totalExplanationPages - 1) {
      setCurrentExplanationPage(currentExplanationPage + 1)
    }
  }

  const goToPrevExplanationPage = () => {
    if (currentExplanationPage > 0) {
      setCurrentExplanationPage(currentExplanationPage - 1)
    }
  }

  // Save/Publish handlers
  const handleSaveDraft = async () => {
    if (!course || !courseId) {
      toast.error("❌ Course information missing. Cannot save changes.")
      return
    }

    setSaving(true)
    
    try {
      console.log("Saving course as draft:", {
        courseId,
        moduleCount: course.modules?.length,
        currentModule: module.title
      })

      const response = await fetch("/api/exam-genius/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          course: {
            ...course,
            _id: courseId,
            status: "draft",
            isExamGenius: true,
            isCompetitiveExam: true,
            modules: course.modules // Include all modules with current changes
          }
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Create detailed draft success message
        const moduleCount = course.modules?.length || 0
        const subsectionCount = course.modules?.reduce((total, module) => 
          total + (module.detailedSubsections?.length || 0), 0) || 0
        
        toast.success(`📝 Draft Saved Successfully! 🎯 "${course.title}" • 📚 ${course.examType} • �� ${course.subject} • 📋 ${moduleCount} modules${subsectionCount > 0 ? ` • 🔍 ${subsectionCount} subsections` : ''} • ✨ Continue editing or publish when ready!`, {
          duration: 6000,
        })
        
        if (onSaveSuccess) onSaveSuccess(data.course, "draft")
      } else {
        const errorText = await response.text()
        console.error("Save draft failed:", response.status, response.statusText, errorText)
        
        let errorMessage = "Failed to save draft"
        if (response.status === 403) {
          errorMessage = "❌ You need educator permissions to save courses."
        } else if (response.status === 401) {
          errorMessage = "❌ Authentication failed. Please log in again."
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePublishCourse = async () => {
    // Enhanced validation
    console.log("🔍 Publish validation:", {
      hasCourse: !!course,
      hasTitle: !!course?.title,
      hasCourseId: !!courseId,
      moduleCount: course?.modules?.length || 0,
      examType: course?.examType,
      subject: course?.subject
    })

    if (!course) {
      toast.error("❌ Course information missing. Cannot publish.")
      console.error("Missing course data:", course)
      return
    }

    // If no courseId, we're creating a new course (not updating)
    if (!courseId) {
      console.log("⚠️  No courseId found, will create new course instead of updating")
    }

    if (!course.title || !course.examType || !course.subject) {
      toast.error("❌ Course must have title, exam type, and subject before publishing")
      console.error("Missing required fields:", { 
        title: course.title, 
        examType: course.examType, 
        subject: course.subject 
      })
      return
    }

    // Validate course has required content
    if (!course.modules || course.modules.length === 0) {
      toast.error("❌ Course must have at least one module before publishing")
      return
    }

    const hasContentModules = course.modules.some(module => 
      module.content || module.summary || (module.detailedSubsections && module.detailedSubsections.length > 0)
    )
    
    if (!hasContentModules) {
      toast.error("❌ At least one module must have content before publishing")
      return
    }

    setPublishing(true)
    
    try {
      const publishPayload = {
        course: {
          ...course,
          status: "published",
          isPublished: true,
          isExamGenius: true,
          isCompetitiveExam: true,
          modules: course.modules
        }
      }

      // Only include _id if we have a courseId (for updates)
      if (courseId) {
        publishPayload.course._id = courseId
      }

      console.log("🚀 Publishing course:", {
        courseId,
        moduleCount: course.modules?.length,
        title: course.title,
        hasAuth: !!getAuthHeaders()?.authorization,
        payload: {
          ...publishPayload.course,
          _id: publishPayload.course._id,
          status: publishPayload.course.status,
          isPublished: publishPayload.course.isPublished
        }
      })

      const response = await fetch("/api/exam-genius/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(publishPayload),
      })

      console.log("📥 Publish response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Course published successfully:", data)
        
        // Create detailed publish success message
        const moduleCount = course.modules?.length || 0
        const subsectionCount = course.modules?.reduce((total, module) => 
          total + (module.detailedSubsections?.length || 0), 0) || 0
        const quizCount = course.modules?.reduce((total, module) => {
          if (module.subsectionQuizzes) {
            return total + Object.keys(module.subsectionQuizzes).length
          }
          return total + (module.quiz ? 1 : 0)
        }, 0) || 0
        
        toast.success(`🎉 Course Published Successfully! 🏆 "${course.title}" is now live • 📚 ${course.examType} • 📖 ${course.subject} • 📋 ${moduleCount} modules${subsectionCount > 0 ? ` • 🔍 ${subsectionCount} subsections` : ''}${quizCount > 0 ? ` • 🎯 ${quizCount} quizzes` : ''} • 🚀 Students can now enroll and learn!`, {
          duration: 8000,
        })
        
        // Make sure we pass the updated course with the published status
        const publishedCourse = {
          ...data.course,
          _id: courseId || data.courseId,
          status: "published",
          isPublished: true
        }
        
        if (onSaveSuccess) onSaveSuccess(publishedCourse, "published")
      } else {
        const errorText = await response.text()
        console.error("❌ Publish failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url
        })
        
        let errorMessage = "Failed to publish course"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
          
          if (response.status === 403) {
            errorMessage = "❌ You need educator permissions to publish courses."
          } else if (response.status === 401) {
            errorMessage = "❌ Authentication failed. Please log in again."
          } else if (response.status === 400) {
            errorMessage = `❌ ${errorData.error || "Invalid course data. Please check all required fields."}`
          } else if (response.status === 500) {
            errorMessage = "❌ Server error. Please try again later."
          }
          
          console.error("Error details:", errorData)
        } catch (e) {
          console.error("Failed to parse error response:", e)
          errorMessage = `❌ Server error: ${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("💥 Publish error:", error)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error("❌ Network error. Please check your connection and try again.")
      } else {
        toast.error(`Failed to publish: ${error.message}`)
      }
    } finally {
      setPublishing(false)
    }
  }

  // Resource editing handlers
  const startEditingResource = (type, index) => {
    const resource = module.resources?.[type]?.[index]
    if (resource) {
      setEditingResource({ type, index })
      setEditForm({ ...resource })
    }
  }

  const cancelEditingResource = () => {
    setEditingResource(null)
    setEditForm({})
  }

  const saveResourceEdit = () => {
    if (!editingResource) return
    
    const { type, index } = editingResource
    const updatedResources = {
      ...module.resources,
      [type]: module.resources[type].map((resource, i) => 
        i === index ? { ...editForm } : resource
      )
    }
    
    updateModuleField('resources', updatedResources)
    setEditingResource(null)
    setEditForm({})
  }

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  // Add manual resource
  const handleAddManualResource = () => {
    if (!newResource.title || !newResource.type) return
    
    const resourceWithId = {
      ...newResource,
      id: Date.now().toString()
    }
    
    addResource(newResource.type + 's', resourceWithId)
    setNewResource({
      title: "",
      url: "",
      description: "",
      type: "article"
    })
    setShowManualResourceForm(false)
  }

  // Add this function to generate content for a specific subsection
  const generateSubsectionContent = async (subsection, subsectionIndex) => {
    try {
      // Show loading state
      setEditingSubsection(subsectionIndex);
      const updatedSubsection = { ...subsection, isGenerating: true };
      updateSubsection(subsectionIndex, updatedSubsection);
      
      console.log(`Generating content for subsection: ${subsection.title}`);
      
      // Prepare the context for the API
      const context = {
        subject: subject || "General",
        examType: examType || "General",
        moduleTitle: module.title,
        subsectionTitle: subsection.title
      };
      
      // Extract content for this subsection from the module content
      const subsectionRegex = new RegExp(
        `####\\s*${subsection.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?(?=####|###|##|#|$)`
      );
      const subsectionContentMatch = module.content.match(subsectionRegex);
      const focusedContent = subsectionContentMatch ? 
        subsectionContentMatch[0] : 
        `#### ${subsection.title}\n\nThis is a subsection of the module "${module.title}" for ${examType} exam preparation in ${subject}.`;
      
      // Add module context to help the AI
      const moduleContext = `Module: ${module.title}\nSubject: ${subject}\nExam: ${examType}\n\n${focusedContent}`;
      
      // Call the API to generate content
      const response = await fetch('/api/exam-genius/generate-subsection-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          content: moduleContext,
          context: context
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate content");
      }
      
      const data = await response.json();
      
      // Update the subsection with the generated content
      updateSubsection(subsectionIndex, {
        generatedMarkdown: data.content,
        isGenerating: false
      });
      
      toast.success(`Content generated successfully for subsection: ${subsection.title}`);
    } catch (error) {
      console.error(`Error generating content for subsection: ${subsection.title}`, error);
      // Reset the generating state
      updateSubsection(subsectionIndex, { isGenerating: false });
      // Show error toast
      toast.error(error.message || "Failed to generate content. Please try again.");
    } finally {
      setEditingSubsection(null);
    }
  };

  // Add this function after generateSubsectionContent
  const generateResources = async () => {
    try {
      setIsGeneratingResources(true);
      
      // Get module content
      const moduleContent = module.content || '';
      const subsectionsContent = module.subsections?.map(s => s.explanation || '').join('\n\n') || '';
      const fullContent = `${moduleContent}\n\n${subsectionsContent}`;
      
      const response = await fetch('/api/exam-genius/generate-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          moduleTitle: module.title,
          moduleContent: fullContent,
          examType,
          subject,
          learnerLevel
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate resources');
      }
      
      const data = await response.json();
      
      if (data.success && data.resources) {
        // Update module with new resources
        const updatedModule = { ...module };
        
        // Map the API response to our resource structure
        if (data.resources.videos && data.resources.videos.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.videos = [
            ...(updatedModule.resources.videos || []),
            ...data.resources.videos.map(video => ({
              title: video.title,
              url: video.url,
              description: video.description,
              creator: video.author || video.creator,
              isAIGenerated: true
            }))
          ];
        }
        
        if (data.resources.articles && data.resources.articles.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.articles = [
            ...(updatedModule.resources.articles || []),
            ...data.resources.articles.map(article => ({
              title: article.title,
              url: article.url,
              description: article.description,
              author: article.author || article.creator,
              isAIGenerated: true
            }))
          ];
        }
        
        if (data.resources.books && data.resources.books.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.books = [
            ...(updatedModule.resources.books || []),
            ...data.resources.books.map(book => ({
              title: book.title,
              url: book.url,
              description: book.description,
              author: book.author || book.creator,
              isAIGenerated: true
            }))
          ];
        }
        
        if (data.resources.courses && data.resources.courses.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.courses = [
            ...(updatedModule.resources.courses || []),
            ...data.resources.courses.map(course => ({
              title: course.title,
              url: course.url,
              description: course.description,
              platform: course.platform || course.author || course.creator,
              isAIGenerated: true
            }))
          ];
        }
        
        if (data.resources.tools && data.resources.tools.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.tools = [
            ...(updatedModule.resources.tools || []),
            ...data.resources.tools.map(tool => ({
              title: tool.title,
              url: tool.url,
              description: tool.description,
              creator: tool.creator || tool.author,
              isAIGenerated: true
            }))
          ];
        }
        
        if (data.resources.websites && data.resources.websites.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.websites = [
            ...(updatedModule.resources.websites || []),
            ...data.resources.websites.map(website => ({
              title: website.title,
              url: website.url,
              description: website.description,
              creator: website.creator || website.author,
              isAIGenerated: true
            }))
          ];
        }
        
        if (data.resources.githubRepos && data.resources.githubRepos.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.websites = [
            ...(updatedModule.resources.websites || []),
            ...data.resources.githubRepos.map(repo => ({
              title: repo.title,
              url: repo.url,
              description: repo.description,
              creator: repo.creator || repo.author,
              isAIGenerated: true,
              isGithub: true
            }))
          ];
        }
        
        if (data.resources.exercises && data.resources.exercises.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.exercises = [
            ...(updatedModule.resources.exercises || []),
            ...data.resources.exercises.map(exercise => ({
              title: exercise.title,
              url: exercise.url,
              description: exercise.description,
              creator: exercise.creator || exercise.author,
              isAIGenerated: true
            }))
          ];
        }
        
        // Update the module
        onUpdate(updatedModule);
        
        toast.success("Learning resources have been added to your module.");
      }
    } catch (error) {
      console.error("Error generating resources:", error);
      toast.error("Failed to generate resources. Please try again.");
    } finally {
      setIsGeneratingResources(false);
    }
  };

  // ResourceSection component
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
      
      return baseGradients[type] || "from-gray-500/10 via-slate-500/10 to-zinc-500/10 border-gray-200/50"
    }

    const getIconColor = () => {
      switch (type) {
        case "books": return "text-blue-600"
        case "courses": return "text-purple-600"
        case "videos": return "text-red-600"
        case "articles": return "text-green-600"
        case "tools": return "text-orange-600"
        case "websites": return "text-indigo-600"
        case "exercises": return "text-pink-600"
        default: return "text-gray-600"
      }
    }

    return (
      <Card className={`bg-gradient-to-br ${getTypeGradient()} backdrop-blur-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className={`p-2 rounded-xl bg-white/80 ${getIconColor()} group-hover:scale-110 transition-transform duration-300`}>
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
            {resources.map((resource, index) => {
              const isEditing = editingResource?.type === type && editingResource?.index === index
              
              return (
                <div key={resource.id || index} className="group/item bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900">Edit Resource</h4>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveResourceEdit} className="bg-green-500 hover:bg-green-600 text-white">
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditingResource}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Title</Label>
                          <Input
                            value={editForm.title || editForm.name || ""}
                            onChange={(e) => updateEditForm('title', e.target.value)}
                            className="mt-1"
                            placeholder="Resource title"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">URL</Label>
                          <Input
                            value={editForm.url || ""}
                            onChange={(e) => updateEditForm('url', e.target.value)}
                            className="mt-1"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="col-span-full">
                          <Label className="text-sm font-medium text-gray-700">Description</Label>
                          <Textarea
                            value={editForm.description || ""}
                            onChange={(e) => updateEditForm('description', e.target.value)}
                            className="mt-1"
                            placeholder="Resource description"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">
                            {resource.title || resource.name || "Untitled Resource"}
                          </h4>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                          )}
                          {resource.url && (
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Visit Resource
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => startEditingResource(type, index)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeResource(type, index)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const [isGeneratingResources, setIsGeneratingResources] = useState(false);

      return (
    <div className="space-y-6">
      {/* Action Bar - Save/Publish */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 sticky top-4 z-10 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Course Actions</h3>
                <p className="text-sm text-green-600">Save your changes or publish the course</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveDraft}
                disabled={saving || publishing}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              
              <Button
                onClick={handlePublishCourse}
                disabled={saving || publishing}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Publish Course
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  {module.title || "Untitled Module"}
                </CardTitle>
                <p className="text-gray-600">
                  {examType} • {subject} • {learnerLevel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <Trophy className="h-4 w-4 mr-1" />
                ExamGenius
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="subsections" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Subsections
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Module Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Module Title
                </Label>
                <Input
                  id="title"
                  value={module.title || ""}
                  onChange={(e) => updateModuleField('title', e.target.value)}
                  placeholder="Enter module title..."
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="summary" className="text-sm font-semibold">
                  AI Summary
                </Label>
                <Textarea
                  id="summary"
                  value={module.summary || ""}
                  onChange={(e) => updateModuleField('summary', e.target.value)}
                  placeholder="AI-generated summary will appear here..."
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Estimated Time</Label>
                  <Input
                    value={module.estimatedTime || "45-60 mins"}
                    onChange={(e) => updateModuleField('estimatedTime', e.target.value)}
                    placeholder="e.g., 45-60 mins"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Difficulty</Label>
                  <Select 
                    value={module.difficulty || learnerLevel} 
                    onValueChange={(value) => updateModuleField('difficulty', value)}
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Time Allocation</Label>
                  <Input
                    value={module.timeAllocation || "45-60 minutes"}
                    onChange={(e) => updateModuleField('timeAllocation', e.target.value)}
                    placeholder="e.g., 45-60 minutes"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Learning Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {module.objectives?.map((objective, index) => (
                <div key={`objective-${index}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    {editingObjective === index ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={objective}
                          onChange={(e) => updateObjective(index, e.target.value)}
                          rows={2}
                          className="flex-1 border-2 border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => setEditingObjective(null)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p 
                        className="text-sm cursor-pointer hover:text-blue-600"
                        onClick={() => setEditingObjective(index)}
                      >
                        {objective}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingObjective(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeObjective(index)}
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
                  onClick={addObjective}
                  disabled={!newObjective.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Examples & Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {module.examples?.map((example, index) => (
                <div key={`example-${index}`} className="flex items-start gap-3">
                  <div className="flex-1">
                    {editingExample === index ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={example}
                          onChange={(e) => updateExample(index, e.target.value)}
                          rows={3}
                          className="flex-1 border-2 border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => setEditingExample(null)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => setEditingExample(index)}
                      >
                        <p className="text-sm">{example}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingExample(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExample(index)}
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
                  onClick={addExample}
                  disabled={!newExample.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Module Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={module.content || ""}
                onChange={(e) => updateModuleField('content', e.target.value)}
                placeholder="Enter detailed module content..."
                rows={20}
                className="border-2 border-gray-200 focus:border-blue-500 resize-none"
              />
            </CardContent>
          </Card>

          {/* Debug Section - Show module structure */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="bg-gray-50 border-dashed">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Debug: Module Data Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div><strong>Module keys:</strong> {Object.keys(module).join(', ')}</div>
                  <div><strong>Detailed subsections count:</strong> {detailedSubsections.length}</div>
                  {detailedSubsections.length > 0 && (
                    <>
                      <div><strong>First subsection keys:</strong> {Object.keys(detailedSubsections[0]).join(', ')}</div>
                      <div><strong>First subsection title:</strong> {detailedSubsections[0].title || 'No title'}</div>
                      <div><strong>First subsection has pages:</strong> {!!(detailedSubsections[0].pages && detailedSubsections[0].pages.length > 0)}</div>
                      <div><strong>First subsection page count:</strong> {(detailedSubsections[0].pages || []).length}</div>
                      <div><strong>First subsection raw data:</strong> {JSON.stringify(detailedSubsections[0], null, 2).slice(0, 200)}...</div>
                    </>
                  )}
                  <div><strong>Subsection quizzes:</strong> {Object.keys(subsectionQuizzes).length}</div>
                  <div><strong>Current page explanations count:</strong> {currentPageExplanations.length}</div>
                  <div><strong>ExamType:</strong> {examType}</div>
                  <div><strong>Subject:</strong> {subject}</div>
                  <div><strong>LearnerLevel:</strong> {learnerLevel}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subsections Tab */}
        <TabsContent value="subsections" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Detailed Subsections
                </CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Page {currentExplanationPage + 1} of {totalExplanationPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToPrevExplanationPage}
                      disabled={currentExplanationPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToNextExplanationPage}
                      disabled={currentExplanationPage === totalExplanationPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {detailedSubsections.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No subsections found in module content.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    AI is generating content, or you can add `##` or `###` headings to your module content to create subsections.
                  </p>
                </div>
              ) : (
                currentPageExplanations.map((subsection, pageIndex) => {
                  const globalIndex = startExplanationIndex + pageIndex
                  
                  // Pages are now pre-parsed in the detailedSubsections memo
                  const subsectionPages = subsection.subsectionPages || []
                  const currentSubsectionPage = getCurrentExplanationPage(globalIndex)
                  const currentPageData = subsectionPages[currentSubsectionPage]
                  
                  return (
                    <Card key={globalIndex} className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {globalIndex + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{subsection.formattedTitle}</h3>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {subsection.estimatedTime || "15-20 mins"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {subsection.difficulty || "Medium"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSubsection(editingSubsection === globalIndex ? null : globalIndex)}
                            >
                              {editingSubsection === globalIndex ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Content Display */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Content</Label>
                          {editingSubsection === globalIndex ? (
                            <Textarea
                              value={subsection.generatedMarkdown || ''}
                              onChange={(e) => updateSubsection(globalIndex, { generatedMarkdown: e.target.value })}
                              rows={15}
                              className="border-2 border-blue-300 focus:border-blue-500"
                              placeholder="Enter detailed subsection content..."
                            />
                          ) : (
                            <div 
                              className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 min-h-[100px]"
                              onClick={() => setEditingSubsection(globalIndex)}
                            >
                              {subsection.generatedMarkdown ? (
                                <>
                                  {currentPageData ? (
                                    <div className="prose prose-sm max-w-none">
                                      <h4 className="font-semibold text-md mb-2">{currentPageData.title}</h4>
                                      <MathMarkdownRenderer content={currentPageData.content} />
                                    </div>
                                  ) : (
                                    <div className="prose prose-sm max-w-none">
                                      {/* Fallback for when parsing fails or for single-page content */}
                                      <MathMarkdownRenderer content={subsection.generatedMarkdown} />
                                    </div>
                                  )}
                                  {subsectionPages.length > 1 && (
                                    <div className="flex items-center justify-end gap-2 mt-4">
                                <span className="text-xs text-gray-500">
                                        Page {currentSubsectionPage + 1} of {subsectionPages.length}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                        onClick={e => {
                                          e.stopPropagation()
                                          setCurrentExplanationPageForSubsection(
                                    globalIndex, 
                                    Math.max(0, currentSubsectionPage - 1)
                                          )
                                        }}
                                  disabled={currentSubsectionPage === 0}
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                        onClick={e => {
                                          e.stopPropagation()
                                          setCurrentExplanationPageForSubsection(
                                    globalIndex, 
                                            Math.min(subsectionPages.length - 1, currentSubsectionPage + 1)
                                          )
                                        }}
                                        disabled={currentSubsectionPage >= subsectionPages.length - 1}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                                </>
                              ) : (
                                <div className="space-y-4 text-center py-4">
                                  <p className="text-sm text-gray-500 italic">This subsection has no detailed content yet.</p>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateSubsectionContent(subsection, globalIndex);
                                    }}
                                    disabled={subsection.isGenerating}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                  >
                                    {subsection.isGenerating ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate with AI
                                      </>
                                    )}
                                  </Button>
                                    </div>
                                  )}
                            </div>
                          )}
                        </div>

                        {/* Quiz Generation for Subsection */}
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium text-gray-700">
                              Quiz Generation
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              3 Difficulty Levels
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {['easy', 'medium', 'hard'].map((difficulty) => {
                              const quizKey = `${globalIndex}_${difficulty}`
                              const hasQuiz = subsectionQuizzes[quizKey]
                              const isGenerating = generatingQuiz[quizKey]
                              const progress = quizProgress[quizKey] || 0
                              
                              return (
                                <div key={difficulty} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium capitalize">
                                      {difficulty}
                                    </span>
                                    {hasQuiz && (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        Ready
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {isGenerating ? (
                                    <div className="space-y-2">
                                      <Progress value={progress} className="h-2" />
                                      <p className="text-xs text-gray-600">Generating...</p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant={hasQuiz ? "outline" : "default"}
                                        onClick={async (e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          console.log("🔘 Quiz button clicked:", { difficulty, globalIndex, subsection: subsection.title })
                                          await generateSubsectionQuiz(subsection, globalIndex, difficulty)
                                        }}
                                        disabled={isGenerating}
                                        className="flex-1"
                                      >
                                        {hasQuiz ? (
                                          <>
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Update
                                          </>
                                        ) : (
                                          <>
                                            <Trophy className="h-3 w-3 mr-1" />
                                            Create
                                          </>
                                        )}
                                      </Button>
                                      
                                      {hasQuiz && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteSubsectionQuiz(globalIndex, difficulty)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                  
                                  {hasQuiz && (
                                    <div className="text-xs text-gray-600">
                                      {hasQuiz.totalQuestions || 15} questions
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Generated Quizzes Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(subsectionQuizzes).length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No quizzes generated yet.</p>
                  <div className="text-sm text-gray-400 mt-2">
                    Go to the Subsections tab to create quizzes for each section.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(subsectionQuizzes).map(([quizKey, quiz]) => {
                    const [subsectionIndex, difficulty] = quizKey.split('_')
                    const difficultyColors = {
                      easy: 'bg-green-100 text-green-800',
                      medium: 'bg-yellow-100 text-yellow-800',
                      hard: 'bg-red-100 text-red-800'
                    }
                    
                    return (
                      <Card key={quizKey} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{quiz.formattedSubsectionTitle || quiz.subsectionTitle}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={difficultyColors[difficulty]}>
                                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {quiz.totalQuestions || 15} questions
                                </span>
                                <span className="text-sm text-gray-600">
                                  Created: {new Date(quiz.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteSubsectionQuiz(parseInt(subsectionIndex), difficulty)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="space-y-6">
            {/* Resource Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(resourceCategories).map(([category, { icon: Icon, label, color }]) => (
                <div key={category}>
                  {module.resources?.[category]?.length > 0 ? (
                    <ResourceSection
                      title={label}
                      icon={Icon}
                      resources={module.resources[category]}
                      type={category}
                    />
                  ) : (
                    <Card className="border-dashed border-2 border-gray-200 hover:border-gray-300 transition-colors">
                      <CardContent className="text-center py-8">
                        <Icon className={`h-12 w-12 text-gray-300 mx-auto mb-4`} />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">No {label} Added Yet</h3>
                        <div className="text-gray-400 mb-4">Add your first {label.toLowerCase()} resource</div>
                        <Button
                          onClick={() => {
                            setNewResource(prev => ({ ...prev, type: category.slice(0, -1) }))
                            setShowManualResourceForm(true)
                          }}
                          variant="outline"
                          className={`border-${color}-300 text-${color}-700 hover:bg-${color}-50`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First {label.slice(0, -1)}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>

            {/* Add Resource Button */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Add New Resource</h3>
                    <div className="text-green-600">Enhance your module with additional learning resources</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      onClick={generateResources}
                      disabled={isGeneratingResources}
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                    >
                      {isGeneratingResources ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Best Resources
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowManualResourceForm(true)}
                      className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manually
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Resource Form */}
            {showManualResourceForm && (
              <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-amber-800">
                    <Plus className="h-6 w-6" />
                    Add New Resource
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">Resource Type</Label>
                    <Select
                      value={newResource.type}
                      onValueChange={(value) => setNewResource(prev => ({ ...prev, type: value }))}
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
                            <Video className="h-4 w-4 text-red-600" />
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
                            <GraduationCap className="h-4 w-4 text-purple-600" />
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
                      onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Resource title"
                      className="h-12 border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">URL (optional)</Label>
                    <Input
                      value={newResource.url}
                      onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                      className="h-12 border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">Description</Label>
                    <Textarea
                      value={newResource.description}
                      onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Resource description"
                      rows={3}
                      className="border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleAddManualResource}
                      disabled={!newResource.title || !newResource.type}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowManualResourceForm(false)}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 