"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Download, FileText, Clock, Users } from 'lucide-react'
import { LatexRenderer } from '@/components/ui/latex-renderer'
import { toast } from 'sonner'

interface AssignmentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: string
  moduleTitle: string
  topics: string
  difficulty: string
  dueDate?: Date
  onPublish?: () => void
  onExportPDF?: () => void
}

export const AssignmentPreviewModal: React.FC<AssignmentPreviewModalProps> = ({
  isOpen,
  onClose,
  assignment,
  moduleTitle,
  topics,
  difficulty,
  dueDate,
  onPublish,
  onExportPDF
}) => {
  const [isPublishing, setIsPublishing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await onPublish?.()
      toast.success("Assignment published successfully!")
      onClose()
    } catch (error) {
      toast.error("Failed to publish assignment")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await onExportPDF?.()
      toast.success("PDF exported successfully!")
    } catch (error) {
      toast.error("Failed to export PDF")
    } finally {
      setIsExporting(false)
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
    }).format(date)
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            Assignment Preview
          </DialogTitle>
        </DialogHeader>

        {/* Assignment Metadata */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200/50 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Module:</span>
              <span className="font-medium text-gray-900">{moduleTitle}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Topics:</span>
              <span className="font-medium text-gray-900 truncate">{topics}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(difficulty)}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Badge>
            </div>

            {dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Due Date:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatDate(dueDate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Content */}
        <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-lg">
          <div className="p-6">
            {assignment ? (
              <LatexRenderer 
                content={assignment} 
                className="assignment-content"
              />
            ) : (
              <div className="text-center text-gray-500 py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No assignment content available</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Close Preview
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExporting || !assignment}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>

            {onPublish && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !assignment}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {isPublishing ? "Publishing..." : "Publish Assignment"}
              </Button>
            )}
          </div>
        </div>

        {/* Assignment Stats */}
        {assignment && (
          <div className="flex-shrink-0 text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            Assignment length: {assignment.length.toLocaleString()} characters
            {dueDate && (
              <>
                {" • "}
                Due in {Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AssignmentPreviewModal