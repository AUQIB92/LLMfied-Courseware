import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  X, 
  Upload, 
  FileText, 
  Clock, 
  Users, 
  AlertCircle,
  Save,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AssignmentCreator = ({ 
  courseId, 
  editingAssignment = null, 
  onAssignmentCreated, 
  onCancel 
}) => {
  const { getAuthHeaders } = useAuth();
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxPoints: 100,
    submissionType: 'text',
    allowLateSubmission: true,
    lateSubmissionPenalty: 10,
    attachments: [],
    rubric: {
      criteria: []
    }
  });

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [showPreview, setShowPreview] = useState(false);

  // Initialize data if editing
  useEffect(() => {
    if (editingAssignment) {
      setAssignmentData({
        title: editingAssignment.title || '',
        description: editingAssignment.description || '',
        instructions: editingAssignment.instructions || '',
        dueDate: editingAssignment.dueDate ? new Date(editingAssignment.dueDate).toISOString().slice(0, 16) : '',
        maxPoints: editingAssignment.maxPoints || 100,
        submissionType: editingAssignment.submissionType || 'text',
        allowLateSubmission: editingAssignment.allowLateSubmission || true,
        lateSubmissionPenalty: editingAssignment.lateSubmissionPenalty || 10,
        attachments: editingAssignment.attachments || [],
        rubric: editingAssignment.rubric || { criteria: [] }
      });
    }
  }, [editingAssignment]);

  const handleInputChange = (field, value) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleRubricChange = (index, field, value) => {
    setAssignmentData(prev => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        criteria: prev.rubric.criteria.map((criterion, i) => 
          i === index ? { ...criterion, [field]: value } : criterion
        )
      }
    }));
  };

  const addRubricCriterion = () => {
    setAssignmentData(prev => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        criteria: [
          ...prev.rubric.criteria,
          {
            name: '',
            description: '',
            points: 0,
            levels: [
              { name: 'Excellent', points: 0, description: '' },
              { name: 'Good', points: 0, description: '' },
              { name: 'Satisfactory', points: 0, description: '' },
              { name: 'Needs Improvement', points: 0, description: '' }
            ]
          }
        ]
      }
    }));
  };

  const removeRubricCriterion = (index) => {
    setAssignmentData(prev => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        criteria: prev.rubric.criteria.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAttachmentAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt,.zip';
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      const newAttachments = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file) // In real app, upload to cloud storage
      }));
      
      setAssignmentData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
      }));
    };
    input.click();
  };

  const removeAttachment = (index) => {
    setAssignmentData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateAssignment = () => {
    if (!assignmentData.title.trim()) {
      return 'Assignment title is required';
    }
    if (!assignmentData.description.trim()) {
      return 'Assignment description is required';
    }
    if (!assignmentData.dueDate) {
      return 'Due date is required';
    }
    if (assignmentData.maxPoints <= 0) {
      return 'Maximum points must be greater than 0';
    }
    if (assignmentData.allowLateSubmission && (assignmentData.lateSubmissionPenalty < 0 || assignmentData.lateSubmissionPenalty > 100)) {
      return 'Late submission penalty must be between 0-100%';
    }
    
    // Validate rubric if provided
    if (assignmentData.rubric.criteria.length > 0) {
      for (let criterion of assignmentData.rubric.criteria) {
        if (!criterion.name.trim()) {
          return 'All rubric criteria must have names';
        }
        if (criterion.points <= 0) {
          return 'All rubric criteria must have points greater than 0';
        }
      }
    }
    
    return null;
  };

  const handleCreateAssignment = async () => {
    const validationError = validateAssignment();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const method = editingAssignment ? 'PUT' : 'POST';
      const url = editingAssignment 
        ? `/api/assignments/${editingAssignment._id}`
        : '/api/assignments';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...assignmentData,
          courseId,
          dueDate: new Date(assignmentData.dueDate).toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save assignment');
      }

      setSuccess(editingAssignment ? 'Assignment updated successfully!' : 'Assignment created successfully!');
      
      // Reset form if creating new
      if (!editingAssignment) {
        setAssignmentData({
          title: '',
          description: '',
          instructions: '',
          dueDate: '',
          maxPoints: 100,
          submissionType: 'text',
          allowLateSubmission: true,
          lateSubmissionPenalty: 10,
          attachments: [],
          rubric: { criteria: [] }
        });
        setActiveTab('basic');
      }

      if (onAssignmentCreated) {
        onAssignmentCreated(data.assignment);
      }

    } catch (error) {
      console.error('Error saving assignment:', error);
      setError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
          </h2>
          <p className="text-gray-600 mt-1">
            {editingAssignment ? 'Update assignment details and settings' : 'Set up a new assignment for your students'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assignment Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{assignmentData.title}</h3>
                  <p className="text-gray-600 mt-2">{assignmentData.description}</p>
                </div>
                
                {assignmentData.instructions && (
                  <div>
                    <h4 className="font-medium mb-2">Instructions</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{assignmentData.instructions}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <p className="text-sm">{assignmentData.dueDate ? new Date(assignmentData.dueDate).toLocaleString() : 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Maximum Points</Label>
                    <p className="text-sm">{assignmentData.maxPoints}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="rubric">Rubric</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up the fundamental details of your assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  value={assignmentData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter assignment title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={assignmentData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a clear description of the assignment"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={assignmentData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxPoints">Maximum Points *</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    min="1"
                    value={assignmentData.maxPoints}
                    onChange={(e) => handleInputChange('maxPoints', parseInt(e.target.value) || 0)}
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="submissionType">Submission Type</Label>
                <Select 
                  value={assignmentData.submissionType} 
                  onValueChange={(value) => handleInputChange('submissionType', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select submission type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Response</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                    <SelectItem value="both">Text + File</SelectItem>
                    <SelectItem value="url">URL/Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                Provide detailed instructions and attachments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instructions">Detailed Instructions</Label>
                <Textarea
                  id="instructions"
                  value={assignmentData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Provide step-by-step instructions for completing this assignment..."
                  rows={8}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Attachments</Label>
                <div className="mt-2 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAttachmentAdd}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Files
                  </Button>
                  
                  {assignmentData.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rubric" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grading Rubric</CardTitle>
              <CardDescription>
                Create detailed grading criteria for consistent evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={addRubricCriterion}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Grading Criterion
              </Button>

              {assignmentData.rubric.criteria.map((criterion, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Criterion {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRubricCriterion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Criterion Name</Label>
                      <Input
                        value={criterion.name}
                        onChange={(e) => handleRubricChange(index, 'name', e.target.value)}
                        placeholder="e.g., Content Quality"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min="0"
                        value={criterion.points}
                        onChange={(e) => handleRubricChange(index, 'points', parseInt(e.target.value) || 0)}
                        placeholder="25"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={criterion.description}
                      onChange={(e) => handleRubricChange(index, 'description', e.target.value)}
                      placeholder="Describe what this criterion evaluates..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Settings</CardTitle>
              <CardDescription>
                Configure submission and grading policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Late Submissions</Label>
                  <p className="text-sm text-gray-500">
                    Students can submit after the due date
                  </p>
                </div>
                <Switch
                  checked={assignmentData.allowLateSubmission}
                  onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
                />
              </div>

              {assignmentData.allowLateSubmission && (
                <div>
                  <Label htmlFor="lateSubmissionPenalty">Late Submission Penalty (%)</Label>
                  <Input
                    id="lateSubmissionPenalty"
                    type="number"
                    min="0"
                    max="100"
                    value={assignmentData.lateSubmissionPenalty}
                    onChange={(e) => handleInputChange('lateSubmissionPenalty', parseInt(e.target.value) || 0)}
                    placeholder="10"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Percentage of points deducted for late submissions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Submission Type:</span>
                  <Badge variant="secondary" className="ml-2">
                    {assignmentData.submissionType}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Max Points:</span>
                  <span className="ml-2">{assignmentData.maxPoints}</span>
                </div>
                <div>
                  <span className="font-medium">Late Submissions:</span>
                  <span className="ml-2">
                    {assignmentData.allowLateSubmission ? 'Allowed' : 'Not Allowed'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Rubric Criteria:</span>
                  <span className="ml-2">{assignmentData.rubric.criteria.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          onClick={handleCreateAssignment}
          disabled={isCreating}
          className="px-8"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {editingAssignment ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AssignmentCreator; 