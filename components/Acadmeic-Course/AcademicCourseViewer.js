"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Clock, Users, Play } from "lucide-react"

export default function AcademicCourseViewer({ courseId, onBack }) {
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/academic-courses/${courseId}`)
      
      if (response.ok) {
        const courseData = await response.json()
        setCourse(courseData)
        console.log("📖 Academic course loaded:", courseData.title)
      } else if (response.status === 404) {
        setError("Course not found or not accessible")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load course")
      }
      
    } catch (error) {
      console.error("Error fetching course:", error)
      setError("Network error: Failed to load course")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  if (!course) {
    return (
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
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle className="text-3xl font-bold text-slate-800 mb-2">
                {course.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">
                  {course.academicLevel || "Intermediate"}
                </Badge>
                <Badge variant="outline">
                  {course.subject || "General"}
                </Badge>
                <Badge variant="outline">
                  {course.semester ? `Semester ${course.semester}` : "Self-paced"}
                </Badge>
              </div>
            </div>
            
            <p className="text-slate-600 text-lg leading-relaxed">
              {course.description}
            </p>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{course.modules?.length || 0} modules</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrollmentCount || 0} students</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration || "Self-paced"}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Play className="h-4 w-4 mr-2" />
            Start Course
          </Button>
        </CardContent>
      </Card>

      {/* Course Content */}
      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {course.modules?.length > 0 ? (
              course.modules.map((module, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-800 mb-2">
                    Module {index + 1}: {module.title || `Module ${index + 1}`}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {module.description || "Module content description"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-8">
                No modules available for this course.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}