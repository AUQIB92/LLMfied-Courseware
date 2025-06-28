"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, ArrowLeft, Save, Eye, BookOpen } from "lucide-react"
import ModuleEditor from "./ModuleEditor"

export default function CourseEditor({ courseId, onBack, onCourseUpdated }) {
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    modules: [],
    status: "draft"
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { getAuthHeaders } = useAuth()

  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: getAuthHeaders(),
      })
      
      if (response.ok) {
        const course = await response.json()
        setCourseData(course)
      } else {
        alert("Failed to fetch course data")
        onBack?.()
      }
    } catch (error) {
      console.error("Failed to fetch course:", error)
      alert("Failed to fetch course data")
      onBack?.()
    } finally {
      setLoading(false)
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
      resources: {
        books: [],
        courses: [],
        articles: [],
        videos: [],
        tools: [],
        websites: [],
        exercises: []
      },
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

  const handleSave = async (newStatus = courseData.status) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...courseData,
          status: newStatus,
        }),
      })

      if (response.ok) {
        setCourseData(prev => ({ ...prev, status: newStatus }))
        alert(newStatus === "published" ? "Course published successfully!" : "Course saved successfully!")
        onCourseUpdated?.()
      } else {
        alert("Failed to save course")
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Failed to save course")
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = () => handleSave("published")
  const handleSaveDraft = () => handleSave("draft")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading course...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <div>
              <h2 className="text-3xl font-bold">Edit Course</h2>
              <p className="text-blue-100">{courseData.modules.length} modules • {courseData.status}</p>
            </div>
          </div>
          <div className="space-x-3">
            <Button variant="outline" onClick={handleManualModuleAdd} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={saving} className="bg-white hover:bg-gray-100 text-blue-600">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Publish Course
            </Button>
          </div>
        </div>
      </div>

      {/* Course Basic Info */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-xl text-blue-900">Course Information</CardTitle>
          <CardDescription className="text-blue-700">Update the basic details of your course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Course Title</Label>
              <Input
                id="title"
                value={courseData.title}
                onChange={(e) => setCourseData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title"
                className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status</Label>
              <div className="flex items-center space-x-2">
                <span className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  courseData.status === "published" 
                    ? "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg" 
                    : "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
                }`}>
                  {courseData.status.charAt(0).toUpperCase() + courseData.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Course Description</Label>
            <Textarea
              id="description"
              value={courseData.description}
              onChange={(e) => setCourseData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what students will learn"
              rows={4}
              className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-6">
        {courseData.modules.length === 0 ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-blue-50">
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No modules yet</h3>
                <p className="text-gray-600 mb-6">Start building your course by adding your first module.</p>
              </div>
              <Button onClick={handleManualModuleAdd} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          courseData.modules.map((module, index) => (
            <Card key={module.id} className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50 transition-all hover:shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl text-purple-900 flex items-center">
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    {module.title}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => deleteModule(module.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ModuleEditor module={module} onUpdate={(updates) => updateModule(module.id, updates)} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
