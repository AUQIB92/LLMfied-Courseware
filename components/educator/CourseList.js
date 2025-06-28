"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Eye, Trash2, BookOpen } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function CourseList({ courses, onRefresh, onEditCourse }) {
  const [loading, setLoading] = useState(false)
  const { getAuthHeaders } = useAuth()

  const handleStatusChange = async (courseId, newStatus) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        onRefresh?.()
      }
    } catch (error) {
      alert("Failed to update course status")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (courseId) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        onRefresh?.()
      }
    } catch (error) {
      alert("Failed to delete course")
    } finally {
      setLoading(false)
    }
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
        <p className="text-gray-600">Create your first course to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course._id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-xl text-blue-900 group-hover:text-blue-700 transition-colors">
                  {course.title}
                </CardTitle>
                <CardDescription className="mt-2 text-blue-700">
                  {course.description?.substring(0, 100)}...
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="shadow-lg border-blue-100">
                  <DropdownMenuItem onClick={() => onEditCourse?.(course._id)} className="text-blue-700 hover:bg-blue-50">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-green-700 hover:bg-green-50">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  {course.status === "draft" ? (
                    <DropdownMenuItem onClick={() => handleStatusChange(course._id, "published")} className="text-purple-700 hover:bg-purple-50">
                      Publish
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleStatusChange(course._id, "draft")} className="text-orange-700 hover:bg-orange-50">
                      Unpublish
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleDelete(course._id)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <p className="text-sm text-blue-700 font-medium flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {course.modules?.length || 0} modules
                </p>
                <p className="text-xs text-blue-600">
                  Created {new Date(course.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge 
                variant={course.status === "published" ? "default" : "secondary"}
                className={course.status === "published" 
                  ? "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-md" 
                  : "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md"
                }
              >
                {course.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
