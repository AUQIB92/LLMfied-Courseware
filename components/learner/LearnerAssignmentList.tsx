"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  BookOpen,
  User
} from 'lucide-react'
import { toast } from 'sonner'

interface Assignment {
  id: string
  title: string
  content: string
  moduleTitle: string
  topics: string
  difficulty: string
  dueDate: Date
  publishedDate: Date
  references?: string
  instructorName: string
  courseTitle: string
  maxScore?: number
}

interface Submission {
  assignmentId: string
  submittedAt: Date
  isLate: boolean
  googleDriveLink: string
}

interface LearnerAssignmentListProps {
  assignments: Assignment[]
  submissions: Submission[]
  studentId: string
  studentName: string
  onViewAssignment: (assignment: Assignment) => void
  onDownloadPDF?: (assignment: Assignment) => void
}

export const LearnerAssignmentList: React.FC<LearnerAssignmentListProps> = ({
  assignments,
  submissions,
  studentId,
  studentName,
  onViewAssignment,
  onDownloadPDF
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all')
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>(assignments)

  useEffect(() => {
    let filtered = assignments.filter(assignment => {
      const matchesSearch = 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.moduleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.topics.toLowerCase().includes(searchTerm.toLowerCase())

      const now = new Date()
      const isOverdue = now > new Date(assignment.dueDate)
      const hasSubmission = submissions.some(sub => sub.assignmentId === assignment.id)

      switch (filterStatus) {
        case 'pending':
          return matchesSearch && !hasSubmission && !isOverdue
        case 'submitted':
          return matchesSearch && hasSubmission
        case 'overdue':
          return matchesSearch && isOverdue && !hasSubmission
        default:
          return matchesSearch
      }
    })

    // Sort by due date (earliest first)
    filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    
    setFilteredAssignments(filtered)
  }, [assignments, submissions, searchTerm, filterStatus])

  const getSubmissionStatus = (assignment: Assignment) => {
    const now = new Date()
    const isOverdue = now > new Date(assignment.dueDate)
    const submission = submissions.find(sub => sub.assignmentId === assignment.id)

    if (submission) {
      return {
        status: 'submitted',
        label: submission.isLate ? 'Submitted (Late)' : 'Submitted',
        color: submission.isLate ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      }
    }

    if (isOverdue) {
      return {
        status: 'overdue',
        label: 'Overdue',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle
      }
    }

    return {
      status: 'pending',
      label: 'Pending',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock
    }
  }

  const getTimeRemaining = (dueDate: Date) => {
    const now = new Date()
    const timeDiff = new Date(dueDate).getTime() - now.getTime()

    if (timeDiff <= 0) {
      return 'Overdue'
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `${days} days remaining`
    } else if (hours > 0) {
      return `${hours} hours remaining`
    } else {
      return 'Due soon'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  // Removed PDF download functionality - keeping only view functionality
  const handleViewAssignment = (assignment: Assignment) => {
    if (onViewAssignment) {
      onViewAssignment(assignment)
    }
  }

  // PDF download functionality completely removed

  const getStatusCounts = () => {
    const now = new Date()
    let pending = 0, submitted = 0, overdue = 0

    assignments.forEach(assignment => {
      const isOverdue = now > new Date(assignment.dueDate)
      const hasSubmission = submissions.some(sub => sub.assignmentId === assignment.id)

      if (hasSubmission) {
        submitted++
      } else if (isOverdue) {
        overdue++
      } else {
        pending++
      }
    })

    return { pending, submitted, overdue }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-1">View and submit your course assignments</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-700">
            {assignments.length} Total
          </Badge>
          <Badge variant="outline" className="text-green-700">
            {statusCounts.submitted} Submitted
          </Badge>
          <Badge variant="outline" className="text-yellow-700">
            {statusCounts.pending} Pending
          </Badge>
          <Badge variant="outline" className="text-red-700">
            {statusCounts.overdue} Overdue
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assignments by title, module, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All ({assignments.length})
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Pending ({statusCounts.pending})
              </Button>
              <Button
                variant={filterStatus === 'submitted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('submitted')}
              >
                Submitted ({statusCounts.submitted})
              </Button>
              <Button
                variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('overdue')}
              >
                Overdue ({statusCounts.overdue})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="grid gap-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No assignments found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? "Try adjusting your search or filter criteria" 
                  : "No assignments have been published yet"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => {
            const submissionStatus = getSubmissionStatus(assignment)
            const StatusIcon = submissionStatus.icon
            const timeRemaining = getTimeRemaining(assignment.dueDate)

            return (
              <Card 
                key={assignment.id} 
                className={`transition-all duration-200 hover:shadow-lg ${
                  submissionStatus.status === 'overdue' ? 'border-l-4 border-l-red-500' :
                  submissionStatus.status === 'submitted' ? 'border-l-4 border-l-green-500' :
                  'border-l-4 border-l-blue-500'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                        <Badge className={submissionStatus.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {submissionStatus.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Module:</span>
                          <span className="text-sm font-medium">{assignment.moduleTitle}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Instructor:</span>
                          <span className="text-sm font-medium">{assignment.instructorName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getDifficultyColor(assignment.difficulty)}>
                            {assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Due:</span>
                          <span className="text-sm font-medium text-orange-600">
                            {formatDate(assignment.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <Clock className={`h-4 w-4 ${
                          submissionStatus.status === 'overdue' ? 'text-red-600' : 'text-green-600'
                        }`} />
                        <span className={`text-sm font-medium ${
                          submissionStatus.status === 'overdue' ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {timeRemaining}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        <span className="font-medium">Topics:</span> {assignment.topics}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => onViewAssignment(assignment)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View & Submit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(assignment)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default LearnerAssignmentList