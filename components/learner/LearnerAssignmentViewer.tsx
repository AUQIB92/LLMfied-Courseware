"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Download, 
  Calendar, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  User,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import BeautifulAssignmentRenderer from '@/components/ui/beautiful-assignment-renderer'

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
  id?: string
  assignmentId: string
  studentId: string
  googleDriveLink: string
  comments?: string
  submittedAt: Date
  isLate: boolean
}

interface LearnerAssignmentViewerProps {
  assignment: Assignment
  studentId: string
  studentName: string
  existingSubmission?: Submission
  onSubmissionUpdate?: (submission: Submission) => void
  onBack?: () => void
}

export const LearnerAssignmentViewer: React.FC<LearnerAssignmentViewerProps> = ({
  assignment,
  studentId,
  studentName,
  existingSubmission,
  onSubmissionUpdate,
  onBack
}) => {
  const [googleDriveLink, setGoogleDriveLink] = useState(existingSubmission?.googleDriveLink || '')
  const [comments, setComments] = useState(existingSubmission?.comments || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isOverdue, setIsOverdue] = useState(false)
  const [canSubmit, setCanSubmit] = useState(true)

  // Calculate time remaining and submission availability
  useEffect(() => {
    const updateTimeStatus = () => {
      const now = new Date()
      const dueDate = new Date(assignment.dueDate)
      const timeDiff = dueDate.getTime() - now.getTime()
      
      if (timeDiff <= 0) {
        setIsOverdue(true)
        setCanSubmit(false)
        setTimeRemaining('Assignment Overdue')
        return
      }

      setIsOverdue(false)
      setCanSubmit(true)

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days} days, ${hours} hours remaining`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hours, ${minutes} minutes remaining`)
      } else {
        setTimeRemaining(`${minutes} minutes remaining`)
      }
    }

    updateTimeStatus()
    const interval = setInterval(updateTimeStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [assignment.dueDate])

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      // Import the beautiful PDF export function
      const { exportBeautifulAssignmentPDF } = await import('../../utils/beautiful-pdf-export')
      
      const metadata = {
        moduleTitle: assignment.moduleTitle,
        topics: assignment.topics,
        difficulty: assignment.difficulty,
        dueDate: assignment.dueDate,
        courseTitle: assignment.courseTitle,
        institutionName: 'Govt. College of Engineering Safapora Ganderbal Kashmir, India 193504',
        instructorName: assignment.instructorName,
        references: assignment.references,
        studentName: studentName,
        assignmentId: assignment.id
      }

      await exportBeautifulAssignmentPDF(assignment.content, metadata)
      toast.success("📄 Assignment PDF downloaded successfully!")
    } catch (error) {
      console.error("PDF Download Error:", error)
      toast.error("Failed to download PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const validateGoogleDriveLink = (link: string): boolean => {
    const googleDrivePatterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/,
      /^https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
      /^https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/
    ]
    
    return googleDrivePatterns.some(pattern => pattern.test(link))
  }

  const handleSubmitSolution = async () => {
    if (!googleDriveLink.trim()) {
      toast.error("Please provide a Google Drive link to your solution")
      return
    }

    if (!validateGoogleDriveLink(googleDriveLink)) {
      toast.error("Please provide a valid Google Drive sharing link")
      return
    }

    if (!canSubmit) {
      toast.error("Submission is no longer allowed after the due date")
      return
    }

    setIsSubmitting(true)
    try {
      const submission: Submission = {
        id: existingSubmission?.id || undefined,
        assignmentId: assignment.id,
        studentId,
        googleDriveLink: googleDriveLink.trim(),
        comments: comments.trim(),
        submittedAt: new Date(),
        isLate: new Date() > new Date(assignment.dueDate)
      }

      // TODO: Replace with actual API call
      console.log("Submitting assignment:", submission)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSubmissionUpdate?.(submission)
      toast.success(existingSubmission ? "Solution updated successfully!" : "Solution submitted successfully!")
    } catch (error) {
      console.error("Submission Error:", error)
      toast.error("Failed to submit solution. Please try again.")
    } finally {
      setIsSubmitting(false)
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 hover:bg-blue-50 text-blue-600 font-medium"
        >
          ← Back to Assignments
        </Button>
      )}
      {/* Assignment Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {assignment.title}
                </CardTitle>
                <p className="text-gray-600 mt-1">{assignment.courseTitle}</p>
              </div>
            </div>
            
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Instructor:</span>
              <span className="font-medium">{assignment.instructorName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Module:</span>
              <span className="font-medium">{assignment.moduleTitle}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(assignment.difficulty)}>
                {assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Due:</span>
              <span className="font-medium text-orange-600">
                {formatDate(assignment.dueDate)}
              </span>
            </div>
          </div>

          {/* Time Status */}
          <div className={`p-3 rounded-lg border ${
            isOverdue 
              ? 'bg-red-50 border-red-200' 
              : new Date().getTime() > new Date(assignment.dueDate).getTime() - (24 * 60 * 60 * 1000)
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${
                isOverdue ? 'text-red-600' : 'text-green-600'
              }`} />
              <span className={`font-medium ${
                isOverdue ? 'text-red-800' : 'text-green-800'
              }`}>
                {timeRemaining}
              </span>
              {isOverdue && (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Assignment Problems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BeautifulAssignmentRenderer 
            content={assignment.content}
            className="assignment-viewer"
          />
        </CardContent>
      </Card>

      {/* Submission Section */}
      {canSubmit && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Submit Your Solution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gdrive-link" className="text-base font-medium">
                Google Drive Link to Your Solution *
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Share your solution document, spreadsheet, or presentation from Google Drive
              </p>
              <Input
                id="gdrive-link"
                type="url"
                value={googleDriveLink}
                onChange={(e) => setGoogleDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/your-file-id/view"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Make sure your Google Drive file is shared with viewing permissions
              </p>
            </div>

            <div>
              <Label htmlFor="comments" className="text-base font-medium">
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any additional notes or explanations about your solution..."
                rows={3}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-600">
                {existingSubmission ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Last submitted: {formatDate(existingSubmission.submittedAt)}</span>
                    {existingSubmission.isLate && (
                      <Badge variant="destructive" className="text-xs">Late</Badge>
                    )}
                  </div>
                ) : (
                  "No submission yet"
                )}
              </div>

              <Button
                onClick={handleSubmitSolution}
                disabled={isSubmitting || !googleDriveLink.trim()}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting 
                  ? "Submitting..." 
                  : existingSubmission 
                    ? "Update Submission" 
                    : "Submit Solution"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Notice */}
      {isOverdue && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Assignment Overdue</h3>
                <p className="text-red-700 text-sm">
                  The submission deadline has passed. You can still download and review the assignment PDF, 
                  but new submissions are no longer accepted.
                </p>
                {existingSubmission && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-sm text-gray-700">
                      <strong>Your last submission:</strong> 
                      <a 
                        href={existingSubmission.googleDriveLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1 inline-flex items-center gap-1"
                      >
                        View Solution
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {formatDate(existingSubmission.submittedAt)}
                      {existingSubmission.isLate && <span className="text-red-600 ml-2">(Late)</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LearnerAssignmentViewer