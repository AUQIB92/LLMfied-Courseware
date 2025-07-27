import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  X,
  Save,
  Send,
  Eye,
  Calendar,
  Link,
  User,
  Award,
  Edit
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AssignmentSubmission = ({ 
  assignmentId, 
  courseId, 
  user, 
  onSubmissionComplete,
  onCancel 
}) => {
  const { getAuthHeaders } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    textResponse: '',
    url: '',
    attachments: [],
    notes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId]);

  const fetchAssignmentData = async () => {
    setLoading(true);
    try {
      // Fetch assignment details
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`, {
        headers: getAuthHeaders()
      });
      
      if (!assignmentResponse.ok) {
        throw new Error('Failed to fetch assignment details');
      }
      
      const assignmentData = await assignmentResponse.json();
      setAssignment(assignmentData.assignment);

      // Check for existing submission
      const submissionResponse = await fetch(
        `/api/assignment-submissions?assignmentId=${assignmentId}&studentId=${user?.id}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (submissionResponse.ok) {
        const submissionData = await submissionResponse.json();
        const existingSubmission = submissionData.submissions?.[0];
        
        if (existingSubmission) {
          setSubmission(existingSubmission);
          setSubmissionData({
            textResponse: existingSubmission.textResponse || '',
            url: existingSubmission.url || '',
            attachments: existingSubmission.attachments || [],
            notes: existingSubmission.notes || ''
          });
          setIsDraft(existingSubmission.status === 'draft');
        }
      }

    } catch (error) {
      console.error('Error fetching assignment data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSubmissionData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleFileUpload = async (files) => {
    const newAttachments = [];
    
    for (let file of files) {
      // In a real app, you would upload to cloud storage
      // For now, we'll create a mock URL
      const attachment = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Mock URL
        uploadedAt: new Date().toISOString()
      };
      newAttachments.push(attachment);
    }
    
    setSubmissionData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index) => {
    setSubmissionData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateSubmission = () => {
    if (!assignment) return 'Assignment data not available';

    const { submissionType } = assignment;
    
    if (submissionType === 'text' || submissionType === 'both') {
      if (!submissionData.textResponse.trim()) {
        return 'Text response is required';
      }
    }
    
    if (submissionType === 'file' || submissionType === 'both') {
      if (submissionData.attachments.length === 0) {
        return 'File upload is required';
      }
    }
    
    if (submissionType === 'url') {
      if (!submissionData.url.trim()) {
        return 'URL is required';
      }
      // Basic URL validation
      try {
        new URL(submissionData.url);
      } catch {
        return 'Please enter a valid URL';
      }
    }

    return null;
  };

  const handleSubmit = async (status = 'submitted') => {
    const validationError = validateSubmission();
    if (status === 'submitted' && validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const method = submission ? 'PUT' : 'POST';
      const url = submission 
        ? `/api/assignment-submissions/${submission._id}`
        : '/api/assignment-submissions';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          assignmentId,
          courseId,
          ...submissionData,
          status
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save submission');
      }

      setSubmission(data.submission);
      setIsDraft(status === 'draft');
      
      const message = status === 'draft' 
        ? 'Draft saved successfully!' 
        : 'Assignment submitted successfully!';
      setSuccess(message);

      if (status === 'submitted' && onSubmissionComplete) {
        setTimeout(() => {
          onSubmissionComplete(data.submission);
        }, 2000);
      }

    } catch (error) {
      console.error('Error saving submission:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = () => {
    if (!assignment) return false;
    return new Date() > new Date(assignment.dueDate);
  };

  const getTimeRemaining = () => {
    if (!assignment) return '';
    
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const diff = dueDate - now;
    
    if (diff < 0) {
      return 'Overdue';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return 'Due soon';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!assignment) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Assignment not found</AlertDescription>
      </Alert>
    );
  }

  const canSubmit = !isOverdue() || assignment.allowLateSubmission;
  const isSubmitted = submission && submission.status !== 'draft';
  const isGraded = submission && submission.status === 'graded';

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {assignment.description}
              </CardDescription>
            </div>
            
            <div className="text-right space-y-2">
              {isGraded && (
                <Badge className="bg-green-100 text-green-800">
                  <Award className="h-3 w-3 mr-1" />
                  Graded: {submission.grade}/{assignment.maxPoints}
                </Badge>
              )}
              
              {isSubmitted && !isGraded && (
                <Badge className="bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
              
              {!isSubmitted && (
                <Badge variant={isOverdue() ? 'destructive' : 'secondary'}>
                  <Clock className="h-3 w-3 mr-1" />
                  {getTimeRemaining()}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Due Date</p>
              <p className="text-sm text-gray-600">{formatDate(assignment.dueDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Max Points</p>
              <p className="text-sm text-gray-600">{assignment.maxPoints}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Submission Type</p>
              <p className="text-sm text-gray-600 capitalize">{assignment.submissionType}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Late Submissions</p>
              <p className="text-sm text-gray-600">
                {assignment.allowLateSubmission ? 'Allowed' : 'Not Allowed'}
              </p>
            </div>
          </div>

          {assignment.allowLateSubmission && assignment.lateSubmissionPenalty > 0 && isOverdue() && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Late submission penalty: {assignment.lateSubmissionPenalty}% deduction
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Assignment Instructions */}
      {assignment.instructions && (
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Attachments */}
      {assignment.attachments && assignment.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignment.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Submission Form */}
      {canSubmit && !isGraded && (
        <Card>
          <CardHeader>
            <CardTitle>
              {submission ? 'Edit Submission' : 'Submit Assignment'}
            </CardTitle>
            <CardDescription>
              {submission && isDraft 
                ? 'Complete your draft and submit your assignment'
                : submission && !isDraft
                ? 'You can edit your submission until the assignment is graded'
                : 'Provide your response to complete this assignment'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Text Response */}
            {(assignment.submissionType === 'text' || assignment.submissionType === 'both') && (
              <div>
                <Label htmlFor="textResponse" className="text-base font-medium">
                  Written Response *
                </Label>
                <Textarea
                  id="textResponse"
                  value={submissionData.textResponse}
                  onChange={(e) => handleInputChange('textResponse', e.target.value)}
                  placeholder="Enter your response here..."
                  rows={8}
                  className="mt-2"
                  disabled={isSubmitted && !isDraft}
                />
              </div>
            )}

            {/* URL Submission */}
            {assignment.submissionType === 'url' && (
              <div>
                <Label htmlFor="url" className="text-base font-medium">
                  URL/Link *
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={submissionData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="https://example.com"
                  className="mt-2"
                  disabled={isSubmitted && !isDraft}
                />
              </div>
            )}

            {/* File Upload */}
            {(assignment.submissionType === 'file' || assignment.submissionType === 'both') && (
              <div>
                <Label className="text-base font-medium">
                  File Attachments {assignment.submissionType === 'file' ? '*' : ''}
                </Label>
                
                {(!isSubmitted || isDraft) && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = '.pdf,.doc,.docx,.txt,.zip,.jpg,.png,.gif';
                        input.onchange = (e) => {
                          const files = Array.from(e.target.files);
                          handleFileUpload(files);
                        };
                        input.click();
                      }}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                )}
                
                {submissionData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {submissionData.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                          </div>
                        </div>
                        {(!isSubmitted || isDraft) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-base font-medium">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={submissionData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional comments or notes for your instructor..."
                rows={3}
                className="mt-2"
                disabled={isSubmitted && !isDraft}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {(!isSubmitted || isDraft) && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleSubmit('draft')}
                      disabled={submitting}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    
                    <Button
                      onClick={() => handleSubmit('submitted')}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Assignment
                        </>
                      )}
                    </Button>
                  </>
                )}
                
                {isSubmitted && !isDraft && !isGraded && (
                  <Button
                    variant="outline"
                    onClick={() => setIsDraft(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Submission
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Status for Graded Assignment */}
      {isGraded && (
        <Card>
          <CardHeader>
            <CardTitle>Grade and Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Grade</p>
                  <p className="text-2xl font-bold text-green-600">
                    {submission.grade}/{assignment.maxPoints}
                  </p>
                  <p className="text-sm text-gray-500">
                    {Math.round((submission.grade / assignment.maxPoints) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Graded On</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(submission.gradedAt)}
                  </p>
                </div>
              </div>
              
              {submission.feedback && (
                <div>
                  <p className="text-sm font-medium mb-2">Instructor Feedback</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{submission.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cannot Submit Message */}
      {!canSubmit && !isSubmitted && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Submission Period Ended</h3>
            <p className="text-gray-600">
              This assignment is overdue and late submissions are not allowed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentSubmission; 