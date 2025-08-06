"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  BookOpen,
  Users,
  Calendar,
  Star,
  PlayCircle,
  FileText,
  Clock,
  TrendingUp,
  Globe,
  Lock,
  Archive,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock auth headers function
const getAuthHeaders = () => ({
  Authorization: "Bearer mock-token",
  "Content-Type": "application/json",
})

export default function CourseList({ courses, onRefresh, onEditCourse }) {
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const { getAuthHeaders } = useAuth()

  // Filter to show only technical courses (not ExamGenius, not competitive exam, not academic courses)
  const filteredCourses = courses.filter(course => 
    !course.isExamGenius && 
    !course.isCompetitiveExam && 
    !course.isAcademicCourse
  )

  const handleStatusChange = async (courseId, newStatus) => {
    // Add confirmation for unpublishing
    if (newStatus === 'draft') {
      const confirmed = confirm(
        "Are you sure you want to unpublish this course? Students will lose access to the content until you publish it again."
      )
      if (!confirmed) return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (response.ok) {
        const action = newStatus === 'published' ? 'published' : 'unpublished'
        alert(`Course ${action} successfully!`)
        onRefresh?.()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.details || 'Unknown error occurred'
        console.error(`Failed to update course status:`, errorData)
        alert(`Failed to update course status: ${errorMessage}`)
      }
    } catch (error) {
      console.error("Error updating course status:", error)
      alert(`Network error: Failed to update course status. Please check your connection and try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (courseId) => {
    // Enhanced confirmation dialog
    const courseToDelete = filteredCourses.find(c => (c._id || c.id) === courseId)
    const isPublished = courseToDelete?.status === 'published'
    const enrollmentCount = courseToDelete?.enrollmentCount || 0
    
    let confirmMessage = "Are you sure you want to delete this course? This action cannot be undone."
    
    if (isPublished && enrollmentCount > 0) {
      confirmMessage = `⚠️ WARNING: This course is published and has ${enrollmentCount} enrolled student(s). Deleting it will remove their access to all course content. This action cannot be undone.\n\nAre you absolutely sure you want to proceed?`
    } else if (isPublished) {
      confirmMessage = "⚠️ WARNING: This course is currently published. Deleting it will make it unavailable to students. This action cannot be undone.\n\nAre you sure you want to proceed?"
    }

    if (!confirm(confirmMessage)) return

    setDeletingId(courseId)
    try {
      const authHeaders = getAuthHeaders()
      console.log("Attempting to delete course:", {
        courseId,
        hasAuth: !!authHeaders.Authorization,
        authHeadersKeys: Object.keys(authHeaders)
      })
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        headers: authHeaders,
      })
      
      console.log("DELETE response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      })

      if (response.ok) {
        alert("Course deleted successfully!")
        onRefresh?.()
      } else {
        let errorData = null
        let errorMessage = 'Unknown error occurred'
        
        try {
          // Try to parse the response as JSON
          errorData = await response.json()
          errorMessage = errorData?.error || errorData?.details || errorData?.message || 'Unknown error occurred'
        } catch (parseError) {
          // If response is not JSON, use the status text
          console.error("Failed to parse error response as JSON:", parseError)
          errorMessage = response.statusText || `HTTP ${response.status} error`
        }
        
        console.error(`Failed to delete course (${response.status}):`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage
        })
        
        // Provide specific error messages based on status code
        if (response.status === 403) {
          alert("Access denied: You don't have permission to delete this course.")
        } else if (response.status === 404) {
          alert("Course not found. It may have already been deleted.")
        } else if (response.status === 409) {
          alert("Cannot delete course: There may be active enrollments or dependencies.")
        } else if (response.status === 401) {
          alert("Authentication failed. Please log in again and try again.")
        } else {
          alert(`Failed to delete course: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error("Network error deleting course:", {
        error: error.message,
        stack: error.stack,
        name: error.name,
        courseId
      })
      
      // Provide more specific error messages based on error type
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Network error: Unable to connect to the server. Please check your internet connection and try again.")
      } else if (error.message.includes('token')) {
        alert("Authentication error: Please log out and log in again, then try to delete the course.")
      } else {
        alert(`Network error: ${error.message}. Please try again or contact support if the problem persists.`)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case "published":
        return {
          color: "bg-gradient-to-r from-emerald-500 to-green-600 text-white",
          icon: <PlayCircle className="h-3 w-3" />,
          label: "Published",
        }
      case "draft":
        return {
          color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
          icon: <FileText className="h-3 w-3" />,
          label: "Draft",
        }
      case "archived":
        return {
          color: "bg-gradient-to-r from-slate-500 to-gray-600 text-white",
          icon: <Archive className="h-3 w-3" />,
          label: "Archived",
        }
      default:
        return {
          color: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
          icon: <Clock className="h-3 w-3" />,
          label: "Unknown",
        }
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      Programming: "from-blue-500 to-cyan-600",
      Design: "from-purple-500 to-pink-600",
      Business: "from-green-500 to-emerald-600",
      Marketing: "from-orange-500 to-red-600",
      "Data Science": "from-indigo-500 to-purple-600",
      "Mobile Development": "from-teal-500 to-blue-600",
      "Computer Science": "from-violet-500 to-purple-600",
    }
    return colors[category] || "from-gray-500 to-slate-600"
  }

  if (filteredCourses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-100 to-blue-50 rounded-3xl p-16 border border-white/50 shadow-2xl max-w-md mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-4">No courses yet</h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Start your teaching journey by creating your first course. Share your knowledge and inspire learners
              worldwide!
            </p>
            <p className="text-slate-500 text-sm mt-4">
              Note: ExamGenius courses are shown in the ExamGenius section
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Course Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">General Courses</p>
                <p className="text-2xl font-bold">{filteredCourses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Published</p>
                <p className="text-2xl font-bold">{filteredCourses.filter(c => c.status === 'published').length}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Drafts</p>
                <p className="text-2xl font-bold">{filteredCourses.filter(c => c.status === 'draft').length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Students</p>
                <p className="text-2xl font-bold">{filteredCourses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map((course, index) => {
          const statusConfig = getStatusConfig(course.status)
          const categoryGradient = getCategoryColor(course.category)
          const isDeleting = deletingId === (course._id || course.id)

          return (
            <Card
              key={course._id || course.id}
              className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-[1px] bg-white rounded-xl"></div>

              {/* Deleting Overlay */}
              {isDeleting && (
                <div className="absolute inset-0 bg-red-500/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                    <p className="font-semibold">Deleting course...</p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="relative">
                {/* Course Header with Gradient Background */}
                <div className={`relative h-40 bg-gradient-to-br ${categoryGradient} overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/placeholder.svg?height=160&width=400')] bg-cover bg-center opacity-20"></div>

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className={`${statusConfig.color} px-3 py-1 text-xs font-semibold shadow-lg border-0`}>
                      <div className="flex items-center gap-1">
                        {statusConfig.icon}
                        {statusConfig.label}
                      </div>
                    </Badge>
                  </div>

                  {/* Course Actions */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0"
                          disabled={loading || isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 shadow-xl border-white/20 bg-white/95 backdrop-blur-xl"
                      >
                        <DropdownMenuItem
                          onClick={() => onEditCourse(course._id || course.id)}
                          className="text-blue-700 hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-green-700 hover:bg-green-50 cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-purple-700 hover:bg-purple-50 cursor-pointer">
                          <Users className="h-4 w-4 mr-2" />
                          View Students
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(course._id || course.id, course.status === 'published' ? 'draft' : 'published')}
                          className="text-orange-700 hover:bg-orange-50 cursor-pointer"
                          disabled={loading}
                        >
                          {course.status === 'published' ? <Lock className="h-4 w-4 mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                          {course.status === 'published' ? 'Unpublish' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(course._id || course.id)}
                          className="text-red-600 hover:bg-red-50 cursor-pointer"
                          disabled={loading || isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Course Category and Level */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                        {course.category || "General"}
                      </div>
                      <div className="flex items-center gap-1 text-white/90 text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        {course.level || "Beginner"}
                      </div>
                    </div>
                  </div>

                  {/* Course Rating (if available) */}
                  {course.rating && (
                    <div className="absolute bottom-4 right-4">
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-white text-xs font-semibold">{course.rating}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <CardContent className="p-6 space-y-4">
                  {/* Title and Description */}
                  <div className="space-y-3">
                    <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                      {course.title || "Untitled Course"}
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                      {course.description
                        ? course.description.length > 120
                          ? `${course.description.substring(0, 120)}...`
                          : course.description
                        : "No description available for this course."}
                    </CardDescription>
                  </div>

                  {/* Course Metrics */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{course.modules?.length || course.lessonsCount || 0}</span>
                        <span className="text-slate-500">lessons</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{course.enrolledCount || 0}</span>
                        <span className="text-slate-500">students</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span className="text-slate-500">
                          {course.createdAt
                            ? new Date(course.createdAt).toLocaleDateString()
                            : course.updatedAt
                              ? new Date(course.updatedAt).toLocaleDateString()
                              : "Recently"}
                        </span>
                      </div>
                      {course.completionRate !== undefined && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium">{course.completionRate}%</span>
                          <span className="text-slate-500">completion</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar (if completion rate available) */}
                  {course.completionRate !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-medium">Student Progress</span>
                        <span className="font-semibold text-slate-800">{course.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${course.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => onEditCourse(course._id || course.id)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 transition-all duration-300 hover:shadow-lg"
                      disabled={loading || isDeleting}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Course
                    </Button>
                    <Button
                      variant="outline"
                      className="px-3 hover:bg-slate-50 border-slate-200 hover:border-slate-300 transition-all duration-300 bg-transparent"
                      disabled={loading || isDeleting}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <span className="font-semibold text-slate-800">Updating course...</span>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
