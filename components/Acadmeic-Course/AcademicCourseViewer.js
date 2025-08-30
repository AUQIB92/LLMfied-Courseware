"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ReliableMathRenderer from "@/components/ReliableMathRenderer"
import BeautifulAssignmentRenderer from "@/components/ui/beautiful-assignment-renderer"

import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Play,
  GraduationCap,
  CheckCircle,
  ChevronRight,
  FileText,
  Trophy,
  Target,
  Lightbulb,
  BarChart3,
  ChevronLeft,
  Calendar,
  Award,
  Eye,
  Download,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react"

// Add style for horizontal scrollbar hiding
const hiddenScrollbarStyle = {
  msOverflowStyle: "none" /* IE and Edge */,
  scrollbarWidth: "none" /* Firefox */,
  WebkitScrollbar: { display: "none" } /* Chrome, Safari */,
}

export default function AcademicCourseViewer({ courseId, course: initialCourse, onBack }) {
  const { getAuthHeaders, user } = useAuth()
  const [viewerCourse, setViewerCourse] = useState(initialCourse || null)
  const [loading, setLoading] = useState(!initialCourse)
  const [error, setError] = useState(null)
  const [currentModule, setCurrentModule] = useState(0)
  const [currentSubsection, setCurrentSubsection] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [completedModules, setCompletedModules] = useState(new Set())
  const [moduleTab, setModuleTab] = useState("content")
  const [completedSubsections, setCompletedSubsections] = useState(new Set())
  const [completedPages, setCompletedPages] = useState(new Set())
  const [activeTab, setActiveTab] = useState("overview")
  const [focusedModule, setFocusedModule] = useState(null) // New state for focused module view
  const [selectedAssignment, setSelectedAssignment] = useState(null) // For assignment viewing
  const [exportingPDF, setExportingPDF] = useState(false) // PDF export state
  const [editingAssignment, setEditingAssignment] = useState(null) // For assignment editing
  const [deletingAssignment, setDeletingAssignment] = useState(null) // For assignment deletion
  const [editForm, setEditForm] = useState({ title: '', description: '', content: '', dueDate: '', points: '' }) // Edit form state

  // Check if current user is an educator for this course
  const isEducator = user?.role === 'educator' && (viewerCourse?.educatorId === user?.id || viewerCourse?.educatorId === user?._id)

  // Assignment handling functions
  const handleViewFullAssignment = (assignment) => {
    setSelectedAssignment(assignment)
  }

  const handleExportAssignmentPDF = async (assignment, metadata = {}) => {
    try {
      setExportingPDF(true)

      // Dynamic import of current view PDF export utility (much lighter)
      const { exportCurrentAssignmentView } = await import("@/utils/current-view-pdf-export")

      const pdfMetadata = {
        moduleTitle: metadata.moduleTitle || assignment.title || "Assignment",
        courseTitle: metadata.courseTitle || viewerCourse.title,
        institutionName: 'GCET Kashmir',
        instructorName: metadata.instructorName || 'Dr. Auqib Hamid',
        studentName: user?.name || "",
        dueDate: assignment.dueDate,
        assignmentId: assignment.id || "assignment"
      }

      await exportCurrentAssignmentView(pdfMetadata)

      // Show success message
      console.log("📄 Assignment PDF exported successfully!")
      // Optional: Add toast notification if available
      if (typeof toast !== 'undefined') {
        toast.success("📄 Assignment PDF exported successfully!")
      }
    } catch (error) {
      console.error("Failed to export PDF:", error)
      alert(`Failed to export PDF: ${error.message}`)
    } finally {
      setExportingPDF(false)
    }
  }

  const handleQuickPrintAssignment = async (assignment, metadata = {}) => {
    try {
      // Dynamic import of simple print utility
      const { exportAssignmentAsPDF } = await import("@/utils/current-view-pdf-export")

      const pdfMetadata = {
        moduleTitle: metadata.moduleTitle || assignment.title || "Assignment",
        courseTitle: metadata.courseTitle || viewerCourse.title,
        studentName: user?.name || ""
      }

      await exportAssignmentAsPDF(pdfMetadata)
      console.log("📄 Print dialog opened!")
    } catch (error) {
      console.error("Failed to open print dialog:", error)
      alert(`Failed to print: ${error.message}`)
    }
  }

  // Handle assignment editing
  const handleEditAssignment = (assignment, moduleIndex, assignmentIndex) => {
    setEditingAssignment({
      assignment,
      moduleIndex,
      assignmentIndex,
      originalContent: assignment.content
    })
    
    // Populate edit form
    setEditForm({
      title: assignment.title || '',
      description: assignment.description || '',
      content: assignment.content || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
      points: assignment.points || ''
    })
  }

  // Handle assignment deletion
  const handleDeleteAssignment = async (assignmentIndex, moduleIndex) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingAssignment(`${moduleIndex}-${assignmentIndex}`)
      
      const response = await fetch(`/api/academic-courses/${viewerCourse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          action: 'deleteAssignment',
          moduleIndex: moduleIndex,
          assignmentIndex: assignmentIndex
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to delete assignment: ${response.statusText}`)
      }

      // Refresh course data
      await fetchCourse()
      console.log('✅ Assignment deleted successfully')
      
    } catch (error) {
      console.error('❌ Error deleting assignment:', error)
      alert(`Failed to delete assignment: ${error.message}`)
    } finally {
      setDeletingAssignment(null)
    }
  }

  // Handle saving edited assignment
  const handleSaveEditedAssignment = async () => {
    try {
      const updatedAssignment = {
        title: editForm.title,
        description: editForm.description,
        content: editForm.content,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
        points: editForm.points ? parseInt(editForm.points) : null
      }

      const response = await fetch(`/api/academic-courses/${viewerCourse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          action: 'updateAssignment',
          moduleIndex: editingAssignment.moduleIndex,
          assignmentIndex: editingAssignment.assignmentIndex,
          updatedAssignment: updatedAssignment
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update assignment: ${response.statusText}`)
      }

      // Refresh course data
      await fetchCourse()
      setEditingAssignment(null)
      console.log('✅ Assignment updated successfully')
      
    } catch (error) {
      console.error('❌ Error updating assignment:', error)
      alert(`Failed to update assignment: ${error.message}`)
    }
  }

  useEffect(() => {
    if (initialCourse) {
      setViewerCourse(initialCourse)
      setLoading(false)
    } else if (courseId) {
      fetchCourse()
    }
  }, [courseId, initialCourse])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      setError(null)
      const idToUse = courseId || initialCourse?._id
      if (!idToUse) {
        setError("No course ID provided")
        setLoading(false)
        return
      }
      const response = await fetch(`/api/academic-courses/${idToUse}`)
      if (response.ok) {
        const data = await response.json()
        setViewerCourse(data)
      } else if (response.status === 404) {
        setError("Course not found or not accessible")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load course")
      }
    } catch (e) {
      console.error("Error fetching course:", e)
      setError("Network error: Failed to load course")
    } finally {
      setLoading(false)
    }
  }

  const markModuleComplete = (moduleIndex) => {
    setCompletedModules((prev) => new Set([...prev, moduleIndex]))
  }

  const markSubsectionComplete = (moduleIndex, subsectionIndex) => {
    const subsectionKey = `${moduleIndex}-${subsectionIndex}`
    setCompletedSubsections((prev) => new Set([...prev, subsectionKey]))
  }

  const markPageComplete = (moduleIndex, subsectionIndex, pageIndex) => {
    const pageKey = `${moduleIndex}-${subsectionIndex}-${pageIndex}`
    setCompletedPages((prev) => new Set([...prev, pageKey]))
  }

  // Helper functions for focused module view
  const handleModuleClick = (moduleIndex) => {
    setFocusedModule(moduleIndex)
    setCurrentModule(moduleIndex)
    setModuleTab("content") // Reset to content tab when switching modules

    // Skip overview and go directly to content pages (index 1)
    // The overview is always at index 0, so we start at index 1
    setCurrentSubsection(1)
    setCurrentPage(0)
  }

  const handleBackToModules = () => {
    setFocusedModule(null)
  }

  const getProgressPercentage = () => {
    if (!viewerCourse?.modules?.length) return 0
    return (completedModules.size / viewerCourse.modules.length) * 100
  }

  const getAcademicLevelConfig = (level) => {
    const configs = {
      undergraduate: { name: "Undergraduate", color: "blue", icon: "🎓" },
      graduate: { name: "Graduate", color: "purple", icon: "📚" },
      postgraduate: { name: "Postgraduate", color: "indigo", icon: "🔬" },
      doctorate: { name: "Doctorate", color: "violet", icon: "⚕️" },
    }
    return configs[level?.toLowerCase()] || configs.undergraduate
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-opacity-50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Academic Course</h3>
          <p className="text-slate-600">Preparing your learning materials...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Course Not Available</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  if (!viewerCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Course Not Found</h3>
          <p className="text-slate-600 mb-6">The requested course could not be found.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  const levelConfig = getAcademicLevelConfig(viewerCourse.academicLevel)

  // Module and subsection data
  const modules = viewerCourse.modules || []
  const currentModuleData = modules[currentModule]

  // For academic courses, use educator-generated detailedSubsections or create fallback subsections
  const createAcademicSubsections = (module) => {
    if (!module) return []

    // If we have educator-generated detailedSubsections, use them directly
    if (module.detailedSubsections && module.detailedSubsections.length > 0) {
      return module.detailedSubsections.map((subsection, index) => ({
        ...subsection,
        // Ensure we have all required fields with fallbacks
        title: subsection.title || subsection.formattedTitle || `Section ${index + 1}`,
        content:
          subsection.content ||
          subsection.summary ||
          (subsection.pages && subsection.pages.length > 0
            ? subsection.pages[0].content || subsection.pages[0].html
            : null) ||
          "Content will be available soon.",
        type: "detailed",
      }))
    }

    // Fallback: create basic subsections from module structure if no detailed subsections exist
    const subsections = []

    // Check if we have any structured data
    const hasStructuredData =
      (module.objectives && module.objectives.length > 0) ||
      (module.topics && module.topics.length > 0) ||
      (module.examples && module.examples.length > 0) ||
      (module.assignments && module.assignments.length > 0) ||
      (module.discussions && module.discussions.length > 0)

    // Always add an overview section
    const overviewContent = module.summary || module.description || "This module provides essential learning content."

    subsections.push({
      title: "Overview",
      content: overviewContent,
      type: "overview",
    })

    // Add content section if we have actual content
    if (module.content && module.content.trim().length > 50) {
      subsections.push({
        title: "Module Content",
        content: module.content,
        type: "content",
      })
    }

    // Add structured sections only if they have meaningful content
    if (hasStructuredData) {
      if (module.objectives && module.objectives.length > 0) {
        subsections.push({
          title: "Learning Objectives",
          content: "## Learning Objectives\n\n" + module.objectives.map((obj) => `- ${obj}`).join("\n"),
          type: "objectives",
        })
      }

      if (module.topics && module.topics.length > 0) {
        subsections.push({
          title: "Topics Covered",
          content: "## Topics Covered\n\n" + module.topics.map((topic) => `- ${topic}`).join("\n"),
          type: "topics",
        })
      }
    }

    // Ensure we always have at least one subsection with meaningful content
    if (subsections.length === 0) {
      subsections.push({
        title: "Module Information",
        content:
          "This module is being prepared. Please check back later for content, or contact your instructor for materials.",
        type: "info",
      })
    }

    // If we have a subsection but no meaningful content, provide a helpful message
    if (subsections.length === 1 && subsections[0].content === "This module provides essential learning content.") {
      subsections[0] = {
        title: "Module Information",
        content:
          "This module is being prepared. Please check back later for content, or contact your instructor for materials.",
        type: "info",
      }
    }

    return subsections
  }

  const subsections = createAcademicSubsections(currentModuleData)
  const currentSubsectionData = subsections?.[currentSubsection]

  // Debug logging
  console.log("🔍 Academic Course Viewer Debug:", {
    courseTitle: viewerCourse.title,
    moduleCount: modules.length,
    currentModule,
    currentModuleData: currentModuleData
      ? {
          title: currentModuleData.title,
          hasContent: !!currentModuleData.content,
          hasSummary: !!currentModuleData.summary,
          hasObjectives: !!currentModuleData.objectives?.length,
          hasTopics: !!currentModuleData.topics?.length,
          hasExamples: !!currentModuleData.examples?.length,
          hasAssignments: !!currentModuleData.assignments?.length,
          hasDiscussions: !!currentModuleData.discussions?.length,
          hasDetailedSubsections: !!currentModuleData.detailedSubsections?.length,
          detailedSubsectionsCount: currentModuleData.detailedSubsections?.length || 0,
          detailedSubsectionsPreview: currentModuleData.detailedSubsections?.slice(0, 2),
          contentPreview: currentModuleData.content
            ? currentModuleData.content.substring(0, 100) + "..."
            : "No content",
          summaryPreview: currentModuleData.summary
            ? currentModuleData.summary.substring(0, 100) + "..."
            : "No summary",
        }
      : null,
    subsectionsCount: subsections.length,
    subsectionsPreview: subsections.slice(0, 2),
    currentSubsection,
    currentSubsectionData: currentSubsectionData
      ? {
          title: currentSubsectionData.title,
          type: currentSubsectionData.type,
          hasContent: !!currentSubsectionData.content,
          hasSummary: !!currentSubsectionData.summary,
          hasPages: !!currentSubsectionData.pages?.length,
          pagesCount: currentSubsectionData.pages?.length || 0,
          contentPreview: currentSubsectionData.content
            ? currentSubsectionData.content.substring(0, 100) + "..."
            : "No content",
          summaryPreview: currentSubsectionData.summary
            ? currentSubsectionData.summary.substring(0, 100) + "..."
            : "No summary",
        }
      : null,
  })

  const getCurrentPageContent = () => {
    const currentSubsectionData = subsections?.[currentSubsection]
    if (!currentSubsectionData?.pages || currentSubsectionData.pages.length === 0) {
      return currentSubsectionData?.content || "No content available for this page."
    }

    const currentPageData = currentSubsectionData.pages[currentPage]
    if (!currentPageData) {
      return "Page content not found."
    }

    return (
      currentPageData.html ||
      currentPageData.content ||
      currentPageData.generatedMarkdown ||
      "Page content will be available soon."
    )
  }

  // Enhanced keyboard navigation for subsections and pages
  const handleKeyDown = (e) => {
    if (activeTab !== "modules" || !viewerCourse) return

    const subsections = createAcademicSubsections(modules[currentModule])
    const currentSubsectionData = subsections?.[currentSubsection]
    const totalPages = currentSubsectionData?.pages?.length || 0

    // Page-level navigation (Arrow keys alone)
    if (e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (totalPages > 0 && currentPage > 0) {
        setCurrentPage(currentPage - 1)
      }
    } else if (e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (totalPages > 0 && currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1)
      }
    }

    // Subsection-level navigation (Ctrl + Arrow keys)
    else if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (currentSubsection > 0) {
        setCurrentSubsection(currentSubsection - 1)
        setCurrentPage(0)
      } else if (currentModule > 0) {
        setCurrentModule(currentModule - 1)
        setModuleTab("content") // Reset to content tab when switching modules
        const prevModuleSubsections = createAcademicSubsections(modules[currentModule - 1])
        setCurrentSubsection(prevModuleSubsections.length - 1)
        setCurrentPage(0)
      }
    } else if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (currentSubsection < subsections.length - 1) {
        setCurrentSubsection(currentSubsection + 1)
        setCurrentPage(0)
      } else if (currentModule < modules.length - 1) {
        setCurrentModule(currentModule + 1)
        setModuleTab("content") // Reset to content tab when switching modules
        setCurrentSubsection(0)
        setCurrentPage(0)
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTab, currentModule, currentSubsection, currentPage, modules, viewerCourse])

  // If an assignment is selected, show the assignment viewer
  if (selectedAssignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedAssignment(null)}
            className="mb-6 hover:bg-blue-50 text-blue-600 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Module
          </Button>

          {/* Assignment Header */}
          <Card className="border-l-4 border-l-purple-500 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {selectedAssignment.title || 'Module Assignment'}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">{selectedAssignment.moduleTitle}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleExportAssignmentPDF(selectedAssignment, {
                      moduleTitle: selectedAssignment.moduleTitle,
                      courseTitle: viewerCourse.title
                    })}
                    disabled={exportingPDF}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exportingPDF ? "Exporting..." : "Export PDF"}
                  </Button>
                  
                  <Button
                    onClick={() => handleQuickPrintAssignment(selectedAssignment, {
                      moduleTitle: selectedAssignment.moduleTitle,
                      courseTitle: viewerCourse.title
                    })}
                    variant="outline"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    🖨️ Quick Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Module:</span>
                  <span className="font-medium">{selectedAssignment.moduleTitle}</span>
                </div>
                
                {selectedAssignment.difficulty && (
                  <div className="flex items-center gap-2">
                    <Badge className={
                      selectedAssignment.difficulty.toLowerCase() === 'easy' 
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : selectedAssignment.difficulty.toLowerCase() === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }>
                      {selectedAssignment.difficulty.charAt(0).toUpperCase() + selectedAssignment.difficulty.slice(1)}
                    </Badge>
                  </div>
                )}
                
                {selectedAssignment.topics && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Topics:</span>
                    <span className="text-sm font-medium">{selectedAssignment.topics}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Assignment Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BeautifulAssignmentRenderer 
                content={selectedAssignment.content}
                className="module-assignment-viewer"
                allowEditing={true}
                onContentChange={(newContent) => {
                  // Update the assignment content
                  console.log('Assignment content changed:', newContent)
                  // You can add save logic here
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            className="flex items-center gap-4 mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button onClick={onBack} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <GraduationCap className="h-4 w-4" />
              <span>Academic Course</span>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="relative mb-8 border-0 shadow-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

              <CardContent className="p-8 relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl`}
                    >
                      {levelConfig.icon}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{viewerCourse.title}</h1>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          {levelConfig.name}
                        </Badge>
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          {viewerCourse.subject}
                        </Badge>
                        {viewerCourse.semester && (
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                            Semester {viewerCourse.semester}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-white/90 text-lg leading-relaxed mb-6 max-w-3xl">{viewerCourse.description}</p>

                <div className="flex items-center gap-8 text-white/80 mb-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span>{viewerCourse.modules?.length || 0} modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{viewerCourse.enrollmentCount || 0} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{viewerCourse.credits || 3} credits</span>
                  </div>
                  {viewerCourse.assignments && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span>{viewerCourse.assignments.length} assignments</span>
                    </div>
                  )}
                </div>

                <div className="bg-white/20 rounded-full p-1 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/90">Course Progress</span>
                    <span className="text-sm text-white/90">{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2 bg-white/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-5 lg:w-2/3">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="modules" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Modules
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Progress
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {viewerCourse.objectives?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          Learning Objectives
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {viewerCourse.objectives.map((objective, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                              <span className="text-sm text-slate-700">{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {viewerCourse.prerequisites?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-amber-600" />
                          Prerequisites
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {viewerCourse.prerequisites.map((prerequisite, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                              <span className="text-sm text-slate-700">{prerequisite}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {viewerCourse.assessmentCriteria && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-600" />
                        Assessment Criteria
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                          <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                            {viewerCourse.assessmentCriteria.assignments}%
                          </div>
                          <div className="text-xs sm:text-sm text-slate-600">Assignments</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                          <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                            {viewerCourse.assessmentCriteria.quizzes}%
                          </div>
                          <div className="text-xs sm:text-sm text-slate-600">Quizzes</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-amber-50 rounded-lg">
                          <div className="text-xl sm:text-2xl font-bold text-amber-600 mb-1">
                            {viewerCourse.assessmentCriteria.midterm}%
                          </div>
                          <div className="text-xs sm:text-sm text-slate-600">Midterm</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                          <div className="text-xl sm:text-2xl font-bold text-red-600 mb-1">
                            {viewerCourse.assessmentCriteria.final}%
                          </div>
                          <div className="text-xs sm:text-sm text-slate-600">Final</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="modules" className="space-y-4">
                {modules?.length > 0 ? (
                  // Check if we're in focused module view
                  focusedModule !== null ? (
                    // Focused Module View - Full Screen with Back Button
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="min-h-[calc(100vh-12rem)]"
                    >
                      {/* Back to Modules Header */}
                      <Card className="mb-6">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="outline"
                                onClick={handleBackToModules}
                                className="flex items-center gap-2 hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 bg-transparent"
                              >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Modules
                              </Button>
                              <div className="h-6 w-px bg-slate-200"></div>
                              <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                  {modules[focusedModule]?.title || `Module ${focusedModule + 1}`}
                                </h2>
                                <p className="text-sm text-slate-600">
                                  Module {focusedModule + 1} of {modules.length}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!completedModules.has(focusedModule) && (
                                <Button
                                  onClick={() => markModuleComplete(focusedModule)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </Button>
                              )}
                              {completedModules.has(focusedModule) && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Focused Module Interactive Content */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-4 border-b border-slate-100">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800">
                              {modules[focusedModule]?.title || `Module ${focusedModule + 1}`} - Interactive Content
                            </h3>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const focusedModuleData = modules[focusedModule]
                                const focusedSubsections = createAcademicSubsections(focusedModuleData)
                                return (
                                  focusedSubsections.length > 1 && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (currentSubsection > 0) {
                                            setCurrentSubsection(currentSubsection - 1)
                                            setCurrentPage(0)
                                          }
                                        }}
                                        disabled={currentSubsection === 0}
                                        className="flex items-center gap-1"
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                        Prev Section
                                      </Button>
                                      <span className="text-sm text-slate-600">
                                        Section {currentSubsection + 1} of {focusedSubsections.length}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (currentSubsection < focusedSubsections.length - 1) {
                                            setCurrentSubsection(currentSubsection + 1)
                                            setCurrentPage(0)
                                          }
                                        }}
                                        disabled={currentSubsection === focusedSubsections.length - 1}
                                        className="flex items-center gap-1"
                                      >
                                        Next Section
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )
                                )
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          {/* Interactive Content Area */}
                          {(() => {
                            const focusedModuleData = modules[focusedModule]
                            const focusedSubsections = createAcademicSubsections(focusedModuleData)
                            const focusedCurrentSubsectionData = focusedSubsections[currentSubsection]

                            return focusedCurrentSubsectionData?.hasPages &&
                              focusedCurrentSubsectionData?.detailedSubsections ? (
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={`${focusedModule}-${currentSubsection}`}
                                  className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-lg font-semibold text-slate-800">
                                      {focusedCurrentSubsectionData.title || `Section ${currentSubsection + 1}`}
                                    </h5>
                                    {!completedSubsections.has(`${focusedModule}-${currentSubsection}`) && (
                                      <Button
                                        onClick={() => markSubsectionComplete(focusedModule, currentSubsection)}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Mark Complete
                                      </Button>
                                    )}
                                  </div>

                                  <div className="prose max-w-none">
                                    {/* Display subsection pages */}
                                    {focusedCurrentSubsectionData?.pages &&
                                    focusedCurrentSubsectionData.pages.length > 0 ? (
                                      <div className="space-y-6">
                                        {/* Summary section */}
                                        {focusedCurrentSubsectionData.summary && (
                                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                            <h6 className="font-semibold text-blue-900 mb-2">Summary</h6>
                                            <ReliableMathRenderer
                                              content={focusedCurrentSubsectionData.summary}
                                              className="text-blue-900 prose max-w-none"
                                              showMetrics={false}
                                            />
                                          </div>
                                        )}

                                        {/* Current page content */}
                                        <div className="bg-white p-6 rounded-lg border border-blue-200">
                                          <ReliableMathRenderer
                                            content={getCurrentPageContent()}
                                            className="prose max-w-none"
                                            showMetrics={false}
                                          />
                                        </div>

                                        {/* Page Navigation */}
                                        {focusedCurrentSubsectionData.pages.length > 1 && (
                                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-blue-200">
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                if (currentPage > 0) {
                                                  setCurrentPage(currentPage - 1)
                                                }
                                              }}
                                              disabled={currentPage === 0}
                                              className="flex items-center gap-2"
                                            >
                                              <ChevronLeft className="h-4 w-4" />
                                              Previous Page
                                            </Button>

                                            <div className="flex items-center gap-2">
                                              <span className="text-sm text-slate-600">
                                                Page {currentPage + 1} of {focusedCurrentSubsectionData.pages.length}
                                              </span>
                                            </div>

                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                if (currentPage < focusedCurrentSubsectionData.pages.length - 1) {
                                                  setCurrentPage(currentPage + 1)
                                                }
                                              }}
                                              disabled={currentPage === focusedCurrentSubsectionData.pages.length - 1}
                                              className="flex items-center gap-2"
                                            >
                                              Next Page
                                              <ChevronRight className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      /* Fallback to basic content */
                                      <ReliableMathRenderer
                                        content={
                                          focusedCurrentSubsectionData.explanation ||
                                          focusedCurrentSubsectionData.content ||
                                          "No detailed content available for this section."
                                        }
                                        className="prose max-w-none"
                                        showMetrics={false}
                                      />
                                    )}
                                  </div>
                                </motion.div>
                              </AnimatePresence>
                            ) : (
                              /* Enhanced fallback to module content if no subsections */
                              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                  <Play className="h-5 w-5 text-blue-600" />
                                  Module Content
                                </h4>

                                <div className="prose prose-lg max-w-none mb-4">
                                  <ReliableMathRenderer
                                    content={
                                      modules[focusedModule]?.content ||
                                      modules[focusedModule]?.generatedMarkdown ||
                                      "Interactive learning materials and resources for this module will be displayed here."
                                    }
                                    className="prose prose-lg max-w-none"
                                    showMetrics={false}
                                  />
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Navigation Footer */}
                      <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (focusedModule > 0) {
                              setFocusedModule(focusedModule - 1)
                              setCurrentModule(focusedModule - 1)
                              setModuleTab("content") // Reset to content tab when switching modules
                              setCurrentSubsection(0)
                              setCurrentPage(0)
                            }
                          }}
                          disabled={focusedModule === 0}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous Module
                        </Button>

                        <span className="text-sm text-slate-600">
                          Module {focusedModule + 1} of {modules.length}
                        </span>

                        <Button
                          variant="outline"
                          onClick={() => {
                            if (focusedModule < modules.length - 1) {
                              setFocusedModule(focusedModule + 1)
                              setCurrentModule(focusedModule + 1)
                              setModuleTab("content") // Reset to content tab when switching modules
                              setCurrentSubsection(0)
                              setCurrentPage(0)
                            }
                          }}
                          disabled={focusedModule === modules.length - 1}
                          className="flex items-center gap-2"
                        >
                          Next Module
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    // Regular Module List View
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-16rem)]">
                      {/* Module Navigation Sidebar */}
                      <Card className="lg:col-span-1">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" /> Course Modules
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="space-y-3 p-6">
                            {modules.map((module, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="relative"
                              >
                                <Button
                                  variant={currentModule === index ? "default" : "ghost"}
                                  className={`w-full justify-start text-left h-auto p-0 overflow-hidden border-0 ${
                                    currentModule === index
                                      ? "bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25"
                                      : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-lg hover:shadow-blue-100/50"
                                  } transition-all duration-300 rounded-xl`}
                                  onClick={() => handleModuleClick(index)}
                                >
                                  <div className="flex items-center gap-4 w-full p-4 relative">
                                    {/* Module Number/Status Icon */}
                                    <div className="relative">
                                      <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                          completedModules.has(index)
                                            ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                                            : currentModule === index
                                              ? "bg-white/20 backdrop-blur-sm text-white shadow-lg"
                                              : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-md"
                                        }`}
                                      >
                                        {completedModules.has(index) ? (
                                          <CheckCircle className="h-6 w-6" />
                                        ) : (
                                          <span className="text-base font-bold">{index + 1}</span>
                                        )}
                                      </div>
                                      {/* Progress Ring */}
                                      {!completedModules.has(index) && (
                                        <div className="absolute inset-0 rounded-2xl">
                                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                                            <circle
                                              cx="24"
                                              cy="24"
                                              r="22"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              fill="none"
                                              className="text-white/20"
                                            />
                                            <circle
                                              cx="24"
                                              cy="24"
                                              r="22"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              fill="none"
                                              strokeDasharray={`${Math.PI * 44 * 0.3} ${Math.PI * 44}`}
                                              className={currentModule === index ? "text-white/60" : "text-blue-400"}
                                            />
                                          </svg>
                                        </div>
                                      )}
                                    </div>

                                    {/* Module Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h3 className={`font-semibold text-base truncate ${
                                          currentModule === index ? "text-white" : "text-slate-800"
                                        }`}>
                                          {module.title}
                                        </h3>
                                        {/* Completion Badge */}
                                        {completedModules.has(index) && (
                                          <div className="flex-shrink-0">
                                            <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                              Completed
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Module Stats */}
                                      <div className="flex items-center gap-4 text-xs">
                                        <div className={`flex items-center gap-1 ${
                                          currentModule === index ? "text-white/80" : "text-slate-500"
                                        }`}>
                                          <BookOpen className="h-3 w-3" />
                                          <span>{module.subsections?.length || 0} sections</span>
                                        </div>
                                        
                                        {module.assignments && module.assignments.length > 0 && (
                                          <div className={`flex items-center gap-1 ${
                                            currentModule === index ? "text-white/80" : "text-slate-500"
                                          }`}>
                                            <FileText className="h-3 w-3" />
                                            <span>{module.assignments.length} assignments</span>
                                          </div>
                                        )}
                                        
                                        {module.resources && module.resources.length > 0 && (
                                          <div className={`flex items-center gap-1 ${
                                            currentModule === index ? "text-white/80" : "text-slate-500"
                                          }`}>
                                            <Lightbulb className="h-3 w-3" />
                                            <span>{module.resources.length} resources</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Progress Bar */}
                                      {!completedModules.has(index) && (
                                        <div className="mt-3">
                                          <div className={`w-full rounded-full h-1.5 ${
                                            currentModule === index ? "bg-white/20" : "bg-slate-200"
                                          }`}>
                                            <div
                                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                                currentModule === index 
                                                  ? "bg-white/60" 
                                                  : "bg-gradient-to-r from-blue-400 to-purple-400"
                                              }`}
                                              style={{
                                                width: `${Math.min(30 + (index * 10), 85)}%` // Sample progress
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Indicators */}
                                    <div className="flex flex-col items-end gap-1">
                                      {/* Badge for assignments count */}
                                      {module.assignments && module.assignments.length > 0 && (
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          currentModule === index 
                                            ? "bg-white/20 text-white" 
                                            : "bg-purple-100 text-purple-700"
                                        }`}>
                                          {module.assignments.length}
                                        </div>
                                      )}
                                      
                                      {/* Chevron */}
                                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                                        currentModule === index 
                                          ? "text-white/60 translate-x-1" 
                                          : "text-slate-400 group-hover:translate-x-1"
                                      }`} />
                                    </div>
                                  </div>

                                  {/* Glow effect for active module */}
                                  {currentModule === index && (
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-xl -z-10" />
                                  )}
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      {/* Main Content Area */}
                      <div className="lg:col-span-3">
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <BookOpen className="h-5 w-5 text-blue-600" />
                                  {currentModuleData?.title || `Module ${currentModule + 1}`}
                                </CardTitle>
                                {currentModuleData?.description && (
                                  <p className="text-sm text-slate-600 mt-2">{currentModuleData.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!completedModules.has(currentModule) && (
                                  <Button
                                    onClick={() => markModuleComplete(currentModule)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Complete
                                  </Button>
                                )}
                                {completedModules.has(currentModule) && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Per-module tabs */}
                            <Tabs value={moduleTab} onValueChange={setModuleTab} className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="content" className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  Content
                                </TabsTrigger>
                                <TabsTrigger value="assignments" className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Assignments
                                  {currentModuleData?.assignments?.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                      {currentModuleData.assignments.length}
                                    </Badge>
                                  )}
                                </TabsTrigger>
                                <TabsTrigger value="resources" className="flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4" />
                                  Resources
                                  {currentModuleData?.resources?.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                      {currentModuleData.resources.length}
                                    </Badge>
                                  )}
                                </TabsTrigger>
                                <TabsTrigger value="progress" className="flex items-center gap-2">
                                  <Trophy className="h-4 w-4" />
                                  Progress
                                </TabsTrigger>
                              </TabsList>

                              {/* Content Tab */}
                              <TabsContent value="content" className="space-y-6 mt-6">
                                {/* Subsections Display */}
                                {subsections.length > 0 ? (
                                  <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                      <BookOpen className="h-5 w-5 text-blue-600" />
                                      Module Sections
                                    </h4>

                                  {/* Enhanced Subsection Pagination */}
                                  <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-700">Section Navigation</span>
                                        <Badge variant="outline" className="text-xs">
                                          {currentSubsection + 1} of {subsections.length}
                                        </Badge>
                                        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                                          <div className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">←→</kbd>
                                            <span>pages</span>
                                          </div>
                                          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                          <div className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">Ctrl</kbd>
                                            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">←→</kbd>
                                            <span>sections</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            if (currentSubsection > 0) {
                                              setCurrentSubsection(currentSubsection - 1)
                                              setCurrentPage(0)
                                            }
                                          }}
                                          disabled={currentSubsection === 0}
                                          className="h-7"
                                        >
                                          <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            if (currentSubsection < subsections.length - 1) {
                                              setCurrentSubsection(currentSubsection + 1)
                                              setCurrentPage(0)
                                            }
                                          }}
                                          disabled={currentSubsection === subsections.length - 1}
                                          className="h-7"
                                        >
                                          <ChevronRight className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Current Subsection Content */}
                                  <AnimatePresence mode="wait">
                                    {currentSubsectionData && (
                                      <motion.div
                                        key={`${currentModule}-${currentSubsection}`}
                                        className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                      >
                                        <div className="flex items-center justify-between mb-4">
                                          <h5 className="text-lg font-semibold text-slate-800">
                                            {currentSubsectionData.title || `Section ${currentSubsection + 1}`}
                                          </h5>
                                          {!completedSubsections.has(`${currentModule}-${currentSubsection}`) && (
                                            <Button
                                              onClick={() => markSubsectionComplete(currentModule, currentSubsection)}
                                              size="sm"
                                              className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Mark Complete
                                            </Button>
                                          )}
                                        </div>

                                        <div className="prose max-w-none">
                                          {/* Display educator-generated content with pages if available */}
                                          {currentSubsectionData?.pages && currentSubsectionData.pages.length > 0 ? (
                                            <div className="space-y-6">
                                              {/* Summary section */}
                                              {currentSubsectionData.summary && (
                                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                                  <h6 className="font-semibold text-blue-900 mb-2">Summary</h6>
                                                  <ReliableMathRenderer
                                                    content={currentSubsectionData.summary}
                                                    className="text-blue-900 prose max-w-none"
                                                    showMetrics={false}
                                                  />
                                                </div>
                                              )}

                                              {/* Current page content */}
                                              <div className="bg-white p-6 rounded-lg border border-blue-200">
                                                <ReliableMathRenderer
                                                  content={getCurrentPageContent()}
                                                  className="prose max-w-none"
                                                  showMetrics={false}
                                                />
                                              </div>

                                              {/* Page Navigation Controls */}
                                              {currentSubsectionData.pages.length > 1 && (
                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-blue-200">
                                                  <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                      if (currentPage > 0) {
                                                        setCurrentPage(currentPage - 1)
                                                      }
                                                    }}
                                                    disabled={currentPage === 0}
                                                    className="flex items-center gap-2"
                                                  >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Previous Page
                                                  </Button>

                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-600">
                                                      Page {currentPage + 1} of {currentSubsectionData.pages.length}
                                                    </span>
                                                  </div>

                                                  <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                      if (currentPage < currentSubsectionData.pages.length - 1) {
                                                        setCurrentPage(currentPage + 1)
                                                      }
                                                    }}
                                                    disabled={currentPage === currentSubsectionData.pages.length - 1}
                                                    className="flex items-center gap-2"
                                                  >
                                                    Next Page
                                                    <ChevronRight className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            /* Fallback to basic content */
                                            <ReliableMathRenderer
                                              content={
                                                currentSubsectionData.explanation ||
                                                currentSubsectionData.content ||
                                                "No detailed content available for this section."
                                              }
                                              className="prose max-w-none"
                                              showMetrics={false}
                                            />
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                  </div>
                                ) : (
                                  /* Enhanced fallback to module content if no subsections */
                                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Play className="h-5 w-5 text-blue-600" />
                                    Module Content
                                  </h4>

                                  {/* Module summary if available */}
                                  {currentModuleData?.summary &&
                                    currentModuleData.summary !== currentModuleData?.content && (
                                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                                        <h6 className="font-semibold text-blue-900 mb-2">Module Summary</h6>
                                        <ReliableMathRenderer
                                          content={currentModuleData.summary}
                                          className="text-blue-900 prose max-w-none"
                                          showMetrics={false}
                                        />
                                      </div>
                                    )}

                                  {/* Main module content */}
                                  <div className="prose prose-lg max-w-none mb-4">
                                    <ReliableMathRenderer
                                      content={
                                        currentModuleData?.content ||
                                        currentModuleData?.generatedMarkdown ||
                                        "Interactive learning materials and resources for this module will be displayed here."
                                      }
                                      className="prose prose-lg max-w-none"
                                      showMetrics={false}
                                    />
                                  </div>

                                  {/* Module objectives */}
                                  {currentModuleData?.objectives && currentModuleData.objectives.length > 0 && (
                                    <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                                      <h6 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Module Objectives
                                      </h6>
                                      <ul className="space-y-2">
                                        {currentModuleData.objectives.map((objective, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                                            <span className="text-amber-800">{objective}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Module topics */}
                                  {currentModuleData?.topics && currentModuleData.topics.length > 0 && (
                                    <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                                      <h6 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        Topics Covered
                                      </h6>
                                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {currentModuleData.topics.map((topic, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <ChevronRight className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                                            <span className="text-green-800">{topic}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Module assignments */}
                                  {currentModuleData?.assignments && currentModuleData.assignments.length > 0 && (
                                    <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                                      <h6 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Module Assignments ({currentModuleData.assignments.length})
                                      </h6>
                                      <div className="space-y-3">
                                        {currentModuleData.assignments.map((assignment, index) => (
                                          <div
                                            key={index}
                                            className="bg-white rounded-lg border border-purple-200 p-3 hover:shadow-md transition-shadow"
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex-1">
                                                <h7 className="font-semibold text-purple-900 text-base mb-1">
                                                  {assignment.title}
                                                </h7>
                                                {assignment.description && (
                                                  <p className="text-sm text-purple-700 mb-2">
                                                    {assignment.description}
                                                  </p>
                                                )}
                                                <div className="flex flex-wrap gap-2 text-xs text-purple-600">
                                                  {assignment.dueDate && (
                                                    <div className="flex items-center gap-1">
                                                      <Calendar className="h-3 w-3" />
                                                      <span>
                                                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {assignment.points && (
                                                    <div className="flex items-center gap-1">
                                                      <Award className="h-3 w-3" />
                                                      <span>{assignment.points} points</span>
                                                    </div>
                                                  )}
                                                  {assignment.difficulty && (
                                                    <div className="flex items-center gap-1">
                                                      <Target className="h-3 w-3" />
                                                      <span className="capitalize">{assignment.difficulty}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1 ml-3">
                                                <Button
                                                  onClick={() => {
                                                    const assignmentWithModule = {
                                                      ...assignment,
                                                      moduleTitle: currentModuleData.title,
                                                    }
                                                    handleViewFullAssignment(assignmentWithModule)
                                                  }}
                                                  size="sm"
                                                  variant="outline"
                                                  className="text-purple-600 border-purple-200 hover:bg-purple-50 px-2 py-1 text-xs"
                                                >
                                                  View
                                                </Button>
                                                <Button
                                                  onClick={() =>
                                                    handleExportAssignmentPDF(assignment, {
                                                      moduleTitle: currentModuleData.title,
                                                      courseTitle: viewerCourse.title,
                                                      institutionName: "Academic Institution",
                                                    })
                                                  }
                                                  size="sm"
                                                  variant="outline"
                                                  className="text-purple-600 border-purple-200 hover:bg-purple-50 px-2 py-1 text-xs"
                                                  disabled={exportingPDF}
                                                >
                                                  <FileText className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>

                                            {/* Assignment Preview (first 150 characters for compact view) */}
                                            {assignment.content && (
                                              <div className="mt-2 p-2 bg-purple-25 rounded border-l-2 border-purple-300">
                                                <p className="text-xs text-purple-800 font-medium mb-1">Preview:</p>
                                                <div className="text-xs text-purple-700 line-clamp-2">
                                                  {assignment.content.length > 150
                                                    ? `${assignment.content.substring(0, 150)}...`
                                                    : assignment.content}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  </div>
                                )}

                              {/* Enhanced Navigation Controls */}
                              <motion.div
                                className="pt-4 sm:pt-6 border-t border-slate-200"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full sm:w-auto"
                                  >
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        if (currentSubsection > 0) {
                                          setCurrentSubsection(currentSubsection - 1)
                                          setCurrentPage(0)
                                        } else if (currentModule > 0) {
                                          setCurrentModule(currentModule - 1)
                                          setModuleTab("content") // Reset to content tab when switching modules
                                          const prevModuleSubsections = createAcademicSubsections(
                                            modules[currentModule - 1],
                                          )
                                          setCurrentSubsection(prevModuleSubsections.length - 1)
                                          setCurrentPage(0)
                                        }
                                      }}
                                      disabled={currentModule === 0 && currentSubsection === 0}
                                      className="group flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
                                    >
                                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                                      <div className="text-left">
                                        <div className="font-medium text-sm sm:text-base">Previous</div>
                                        <div className="text-xs text-slate-500">
                                          {currentSubsection > 0
                                            ? `Section ${currentSubsection}`
                                            : currentModule > 0
                                              ? `Module ${currentModule}`
                                              : "Start"}
                                        </div>
                                      </div>
                                    </Button>
                                  </motion.div>

                                  <div className="text-center order-first sm:order-none">
                                    <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-3 sm:px-4 py-2 rounded-full border border-blue-100">
                                      <div className="flex items-center gap-1 sm:gap-2">
                                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                                          <span className="hidden sm:inline">
                                            Module {currentModule + 1} of {modules.length}
                                          </span>
                                          <span className="sm:hidden">
                                            M{currentModule + 1}/{modules.length}
                                          </span>
                                        </span>
                                      </div>
                                      {subsections.length > 0 && (
                                        <>
                                          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                          <div className="flex items-center gap-1 sm:gap-2">
                                            <FileText className="h-2 w-2 sm:h-3 sm:w-3 text-purple-600" />
                                            <span className="text-xs text-slate-600">
                                              <span className="hidden sm:inline">
                                                Section {currentSubsection + 1} of {subsections.length}
                                              </span>
                                              <span className="sm:hidden">
                                                S{currentSubsection + 1}/{subsections.length}
                                              </span>
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Mini progress indicator */}
                                    <div className="mt-2 flex justify-center">
                                      <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(modules.length, 10) }, (_, i) => (
                                          <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                                              i < currentModule
                                                ? "bg-green-400"
                                                : i === currentModule
                                                  ? "bg-blue-500"
                                                  : "bg-slate-200"
                                            }`}
                                          />
                                        ))}
                                        {modules.length > 10 && (
                                          <span className="text-xs text-slate-400 ml-1">+{modules.length - 10}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full sm:w-auto"
                                  >
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        if (currentSubsection < subsections.length - 1) {
                                          setCurrentSubsection(currentSubsection + 1)
                                          setCurrentPage(0)
                                        } else if (currentModule < modules.length - 1) {
                                          setCurrentModule(currentModule + 1)
                                          setModuleTab("content") // Reset to content tab when switching modules
                                          setCurrentSubsection(0)
                                          setCurrentPage(0)
                                        }
                                      }}
                                      disabled={
                                        currentModule === modules.length - 1 &&
                                        (subsections.length === 0 || currentSubsection === subsections.length - 1)
                                      }
                                      className="group flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
                                    >
                                      <div className="text-right">
                                        <div className="font-medium text-sm sm:text-base">Next</div>
                                        <div className="text-xs text-slate-500">
                                          {currentSubsection < subsections.length - 1
                                            ? `Section ${currentSubsection + 2}`
                                            : currentModule < modules.length - 1
                                              ? `Module ${currentModule + 2}`
                                              : "Complete"}
                                        </div>
                                      </div>
                                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                                    </Button>
                                  </motion.div>
                                </div>
                                {/* Progress summary */}
                                <div className="mt-3 sm:mt-4 text-center"></div>
                              </motion.div>
                              </TabsContent>

                              {/* Assignments Tab */}
                              <TabsContent value="assignments" className="space-y-6 mt-6">
                                <div className="space-y-4">
                                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    Module Assignments
                                    {currentModuleData?.assignments?.length > 0 && (
                                      <Badge variant="secondary" className="ml-2">
                                        {currentModuleData.assignments.length} assignment{currentModuleData.assignments.length > 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </h4>

                                  {currentModuleData?.assignments && currentModuleData.assignments.length > 0 ? (
                                    <div className="grid gap-4">
                                      {currentModuleData.assignments.map((assignment, index) => (
                                        <div
                                          key={index}
                                          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6 hover:shadow-lg transition-shadow"
                                        >
                                          <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                              <h5 className="text-xl font-bold text-purple-900 mb-2">
                                                {assignment.title}
                                              </h5>
                                              {assignment.description && (
                                                <p className="text-purple-700 mb-4 text-base leading-relaxed">
                                                  {assignment.description}
                                                </p>
                                              )}
                                              <div className="flex flex-wrap gap-3 text-sm">
                                                {assignment.dueDate && (
                                                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-full">
                                                    <Calendar className="h-4 w-4 text-purple-600" />
                                                    <span className="font-medium">
                                                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                    </span>
                                                  </div>
                                                )}
                                                {assignment.points && (
                                                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-full">
                                                    <Award className="h-4 w-4 text-purple-600" />
                                                    <span className="font-medium">{assignment.points} points</span>
                                                  </div>
                                                )}
                                                {assignment.difficulty && (
                                                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-full">
                                                    <Target className="h-4 w-4 text-purple-600" />
                                                    <span className="font-medium capitalize">{assignment.difficulty}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              onClick={() => {
                                                const assignmentWithModule = {
                                                  ...assignment,
                                                  moduleTitle: currentModuleData.title,
                                                }
                                                handleViewFullAssignment(assignmentWithModule)
                                              }}
                                              className="bg-purple-600 hover:bg-purple-700 text-white"
                                            >
                                              <Eye className="h-4 w-4 mr-2" />
                                              View
                                            </Button>
                                            <Button
                                              onClick={() =>
                                                handleExportAssignmentPDF(assignment, {
                                                  moduleTitle: currentModuleData.title,
                                                  courseTitle: viewerCourse.title
                                                })
                                              }
                                              variant="outline"
                                              className="border-purple-200 text-purple-600 hover:bg-purple-50"
                                              disabled={exportingPDF}
                                              size="sm"
                                            >
                                              <Download className="h-4 w-4 mr-1" />
                                              {exportingPDF ? "..." : "PDF"}
                                            </Button>
                                            <Button
                                              onClick={() =>
                                                handleQuickPrintAssignment(assignment, {
                                                  moduleTitle: currentModuleData.title,
                                                  courseTitle: viewerCourse.title
                                                })
                                              }
                                              variant="outline"
                                              className="border-gray-200 text-gray-600 hover:bg-gray-50"
                                              size="sm"
                                            >
                                              🖨️
                                            </Button>
                                            
                                            {/* Edit and Delete buttons for educators only */}
                                            {isEducator && (
                                              <>
                                                <Button
                                                  onClick={() => handleEditAssignment(assignment, currentModule, index)}
                                                  variant="outline"
                                                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                  size="sm"
                                                  title="Edit Assignment"
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  onClick={() => handleDeleteAssignment(index, currentModule)}
                                                  variant="outline"
                                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                                  size="sm"
                                                  disabled={deletingAssignment === `${currentModule}-${index}`}
                                                  title="Delete Assignment"
                                                >
                                                  {deletingAssignment === `${currentModule}-${index}` ? (
                                                    <span className="animate-spin">⏳</span>
                                                  ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                  )}
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                      <FileText className="h-16 w-16 text-slate-300 mb-4" />
                                      <h5 className="text-lg font-medium text-slate-600 mb-2">No Assignments Yet</h5>
                                      <p className="text-slate-500 max-w-md">
                                        This module doesn't have any assignments currently. Check back later or contact your instructor.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              {/* Resources Tab */}
                              <TabsContent value="resources" className="space-y-6 mt-6">
                                <div className="space-y-4">
                                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-amber-600" />
                                    Module Resources
                                    {currentModuleData?.resources?.length > 0 && (
                                      <Badge variant="secondary" className="ml-2">
                                        {currentModuleData.resources.length} resource{currentModuleData.resources.length > 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </h4>

                                  {currentModuleData?.resources && currentModuleData.resources.length > 0 ? (
                                    <div className="grid gap-4">
                                      {currentModuleData.resources.map((resource, index) => (
                                        <div
                                          key={index}
                                          className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 p-6 hover:shadow-lg transition-shadow"
                                        >
                                          <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                                <Lightbulb className="h-6 w-6 text-amber-600" />
                                              </div>
                                            </div>
                                            <div className="flex-1">
                                              <h5 className="text-lg font-bold text-amber-900 mb-2">
                                                {resource.title || `Resource ${index + 1}`}
                                              </h5>
                                              {resource.description && (
                                                <p className="text-amber-700 mb-4">
                                                  {resource.description}
                                                </p>
                                              )}
                                              {resource.type && (
                                                <Badge variant="outline" className="border-amber-300 text-amber-700 mb-3">
                                                  {resource.type}
                                                </Badge>
                                              )}
                                              <div className="flex gap-2">
                                                {resource.url && (
                                                  <Button
                                                    onClick={() => window.open(resource.url, '_blank')}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                                    size="sm"
                                                  >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Open Resource
                                                  </Button>
                                                )}
                                                {resource.downloadUrl && (
                                                  <Button
                                                    onClick={() => window.open(resource.downloadUrl, '_blank')}
                                                    variant="outline"
                                                    className="border-amber-200 text-amber-600 hover:bg-amber-50"
                                                    size="sm"
                                                  >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                      <Lightbulb className="h-16 w-16 text-slate-300 mb-4" />
                                      <h5 className="text-lg font-medium text-slate-600 mb-2">No Resources Yet</h5>
                                      <p className="text-slate-500 max-w-md">
                                        Additional learning resources for this module will appear here when available.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              {/* Progress Tab */}
                              <TabsContent value="progress" className="space-y-6 mt-6">
                                <div className="space-y-6">
                                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-green-600" />
                                    Module Progress
                                  </h4>

                                  {/* Module completion status */}
                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                                      <div className="flex items-center justify-between mb-4">
                                        <h5 className="text-lg font-semibold text-green-900">Module Status</h5>
                                        {completedModules.has(currentModule) ? (
                                          <Badge className="bg-green-100 text-green-800 border-green-200">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Completed
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                                            In Progress
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-green-700">Sections Completed</span>
                                          <span className="font-semibold text-green-900">
                                            {subsections.filter((_, i) => completedSubsections.has(`${currentModule}-${i}`)).length} / {subsections.length}
                                          </span>
                                        </div>
                                        <div className="w-full bg-green-100 rounded-full h-3">
                                          <div
                                            className="bg-green-600 h-3 rounded-full transition-all duration-500"
                                            style={{
                                              width: `${subsections.length > 0 ? (subsections.filter((_, i) => completedSubsections.has(`${currentModule}-${i}`)).length / subsections.length) * 100 : 0}%`
                                            }}
                                          />
                                        </div>
                                      </div>
                                      {!completedModules.has(currentModule) && (
                                        <Button
                                          onClick={() => markModuleComplete(currentModule)}
                                          className="bg-green-600 hover:bg-green-700 text-white mt-4 w-full"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Mark Module Complete
                                        </Button>
                                      )}
                                    </div>

                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                                      <h5 className="text-lg font-semibold text-blue-900 mb-4">Module Stats</h5>
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-blue-700 flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            Content Sections
                                          </span>
                                          <span className="font-semibold text-blue-900">{subsections.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-blue-700 flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Assignments
                                          </span>
                                          <span className="font-semibold text-blue-900">{currentModuleData?.assignments?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-blue-700 flex items-center gap-2">
                                            <Lightbulb className="h-4 w-4" />
                                            Resources
                                          </span>
                                          <span className="font-semibold text-blue-900">{currentModuleData?.resources?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-blue-700 flex items-center gap-2">
                                            <Target className="h-4 w-4" />
                                            Learning Objectives
                                          </span>
                                          <span className="font-semibold text-blue-900">{currentModuleData?.objectives?.length || 0}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Learning objectives progress */}
                                  {currentModuleData?.objectives && currentModuleData.objectives.length > 0 && (
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
                                      <h5 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Learning Objectives
                                      </h5>
                                      <div className="space-y-3">
                                        {currentModuleData.objectives.map((objective, index) => (
                                          <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                                            <div className="flex-shrink-0 mt-1">
                                              <CheckCircle className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <span className="text-purple-800 flex-1">{objective}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <BookOpen className="h-10 w-10 text-slate-400 mb-4" />
                    <p className="text-slate-500 text-sm">No modules available for this course yet.</p>
                  </div>
                )}
              </TabsContent>


              <TabsContent value="progress" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      Your Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Course Completion</span>
                        <span className="text-sm text-slate-600">{Math.round(getProgressPercentage())}%</span>
                      </div>
                      <Progress value={getProgressPercentage()} className="h-2" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700">Modules Completed</span>
                            <span className="text-sm text-blue-600">
                              {completedModules.size} / {modules.length}
                            </span>
                          </div>
                          <Progress
                            value={(completedModules.size / modules.length) * 100}
                            className="h-2 bg-blue-200"
                          />
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-700">Subsections Completed</span>
                            <span className="text-sm text-green-600">
                              {completedSubsections.size} / {subsections.length}
                            </span>
                          </div>
                          <Progress
                            value={(completedSubsections.size / subsections.length) * 100}
                            className="h-2 bg-green-200"
                          />
                        </div>
                      </div>

                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-amber-700">Time Spent</span>
                          <span className="text-sm text-amber-600">Estimated 45 hours</span>
                        </div>
                        <Progress value={75} className="h-2 bg-amber-200" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Assignment Edit Modal */}
      {editingAssignment && (
        <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-due-date">Due Date</Label>
                  <Input
                    id="edit-due-date"
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm(prev => ({...prev, dueDate: e.target.value}))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-points">Points</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    value={editForm.points}
                    onChange={(e) => setEditForm(prev => ({...prev, points: e.target.value}))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({...prev, content: e.target.value}))}
                  rows={10}
                  className="mt-1 font-mono text-sm"
                  placeholder="Assignment content..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingAssignment(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditedAssignment}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
