"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Edit, Trash2, Calendar, Users, FileText } from "lucide-react"

const AssignmentManagementPage = () => {
  const { user, getAuthHeaders } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxPoints: '',
    submissionType: 'text',
    allowLateSubmission: true,
    lateSubmissionPenalty: 10
  })

  useEffect(() => {
    if (user && user.role === 'educator') {
      fetchAssignments()
      fetchCourses()
    }
  }, [user])

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?educatorId=${user.userId}`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch(`/api/academic-courses?educatorId=${user.userId}`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      setLoading(false)
    }
  }

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment)
    setEditForm({
      title: assignment.title || '',
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
      maxPoints: assignment.maxPoints || '',
      submissionType: assignment.submissionType || 'text',
      allowLateSubmission: assignment.allowLateSubmission !== undefined ? assignment.allowLateSubmission : true,
      lateSubmissionPenalty: assignment.lateSubmissionPenalty || 10
    })
  }

  const handleSaveAssignment = async () => {
    try {
      const updatedAssignment = {
        title: editForm.title,
        description: editForm.description,
        instructions: editForm.instructions,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
        maxPoints: editForm.maxPoints ? parseInt(editForm.maxPoints) : null,
        submissionType: editForm.submissionType,
        allowLateSubmission: editForm.allowLateSubmission,
        lateSubmissionPenalty: editForm.lateSubmissionPenalty
      }

      const response = await fetch(`/api/assignments/${editingAssignment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedAssignment)
      })

      if (response.ok) {
        await fetchAssignments()
        setEditingAssignment(null)
        console.log('✅ Assignment updated successfully')
      } else {
        throw new Error('Failed to update assignment')
      }
    } catch (error) {
      console.error('❌ Error updating assignment:', error)
      alert(`Failed to update assignment: ${error.message}`)
    }
  }

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c._id === courseId.toString())
    return course ? course.title : 'Unknown Course'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (assignment) => {
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    
    if (dueDate < now) {
      return <Badge variant="destructive">Overdue</Badge>
    } else if (dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Due Soon</Badge>
    } else {
      return <Badge variant="default">Active</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Management</h1>
          <p className="text-gray-600">Manage deadlines and details for all your assignments</p>
        </div>

        <div className="grid gap-6">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments</h3>
                <p className="text-gray-600">You haven't created any assignments yet.</p>
              </CardContent>
            </Card>
          ) : (
            assignments.map(assignment => (
              <Card key={assignment._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{assignment.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {getCourseTitle(assignment.courseId)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(assignment)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        Due: {assignment.dueDate ? formatDate(assignment.dueDate) : 'No due date'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {assignment.submissionCount || 0} submissions
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {assignment.maxPoints || 0} points
                      </span>
                    </div>
                  </div>
                  {assignment.description && (
                    <p className="text-gray-600 mt-3 line-clamp-2">{assignment.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Assignment Edit Modal */}
      {editingAssignment && (
        <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Assignment: {editingAssignment.title}</DialogTitle>
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

              <div>
                <Label htmlFor="edit-instructions">Instructions</Label>
                <Textarea
                  id="edit-instructions"
                  value={editForm.instructions}
                  onChange={(e) => setEditForm(prev => ({...prev, instructions: e.target.value}))}
                  rows={3}
                  className="mt-1"
                  placeholder="Detailed instructions for students..."
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
                  <Label htmlFor="edit-points">Max Points</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    value={editForm.maxPoints}
                    onChange={(e) => setEditForm(prev => ({...prev, maxPoints: e.target.value}))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-submission-type">Submission Type</Label>
                  <select
                    id="edit-submission-type"
                    value={editForm.submissionType}
                    onChange={(e) => setEditForm(prev => ({...prev, submissionType: e.target.value}))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text Submission</option>
                    <option value="file">File Upload</option>
                    <option value="url">URL/Link</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 mt-6">
                  <input
                    id="edit-allow-late"
                    type="checkbox"
                    checked={editForm.allowLateSubmission}
                    onChange={(e) => setEditForm(prev => ({...prev, allowLateSubmission: e.target.checked}))}
                    className="rounded"
                  />
                  <Label htmlFor="edit-allow-late">Allow Late Submissions</Label>
                </div>
              </div>

              {editForm.allowLateSubmission && (
                <div>
                  <Label htmlFor="edit-late-penalty">Late Submission Penalty (%)</Label>
                  <Input
                    id="edit-late-penalty"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.lateSubmissionPenalty}
                    onChange={(e) => setEditForm(prev => ({...prev, lateSubmissionPenalty: parseInt(e.target.value) || 0}))}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingAssignment(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAssignment}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default AssignmentManagementPage