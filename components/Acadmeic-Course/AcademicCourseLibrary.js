"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Clock, GraduationCap } from "lucide-react"

export default function AcademicCourseLibrary({ onCourseSelect }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPublishedAcademicCourses()
  }, [])

  const fetchPublishedAcademicCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/academic-courses?status=published')
      
      if (response.ok) {
        const data = await response.json()
        setCourses(Array.isArray(data) ? data : [])
        console.log("📚 Academic courses loaded:", data.length)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load academic courses')
        console.error("Failed to fetch academic courses:", errorData)
      }
    } catch (error) {
      console.error("Error fetching academic courses:", error)
      setError("Network error: Unable to load academic courses")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading academic courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <GraduationCap className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Error Loading Courses</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={fetchPublishedAcademicCourses} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">No Academic Courses Available</h3>
          <p className="text-slate-600 mb-6">
            Academic courses will appear here once they are published by educators.
          </p>
          <p className="text-sm text-slate-500">
            Check back soon for new academic content!
          </p>
          <Button onClick={fetchPublishedAcademicCourses} variant="outline" className="mt-4">
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Academic Course Library
        </h2>
        <p className="text-slate-600">
          Discover and enroll in comprehensive academic courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course._id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {course.academicLevel || "Intermediate"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {course.subject || "General"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {course.description || "Comprehensive academic course content"}
              </p>
              
              <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
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

              <Button 
                onClick={() => onCourseSelect?.(course)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                View Course
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}