import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  FileText,
  Award,
  User,
  Calendar,
  Filter,
  Search,
  Eye,
  Edit,
  Save,
  MessageSquare,
  TrendingUp,
  BarChart3,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AssignmentGrading = ({ assignmentId, courseId }) => {
  const { getAuthHeaders } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingData, setGradingData] = useState({
    grade: '',
    feedback: '',
    rubricScores: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('submissions');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submittedAt');

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId]);

  useEffect(() => {
    filterAndSortSubmissions();
  }, [submissions, filterStatus, searchTerm, sortBy]);

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

      // Fetch all submissions for this assignment
      const submissionsResponse = await fetch(`/api/assignment-submissions?assignmentId=${assignmentId}`, {
        headers: getAuthHeaders()
      });
      
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions || []);
      }

    } catch (error) {
      console.error('Error fetching assignment data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSubmissions = () => {
    let filtered = [...submissions];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    // Filter by search term (student name)
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort submissions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'submittedAt':
          return new Date(b.submittedAt) - new Date(a.submittedAt);
        case 'studentName':
          return (a.student?.name || '').localeCompare(b.student?.name || '');
        case 'grade':
          return (b.grade || 0) - (a.grade || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredSubmissions(filtered);
  };

  const handleSubmissionSelect = (submission) => {
    setSelectedSubmission(submission);
    setGradingData({
      grade: submission.grade || '',
      feedback: submission.feedback || '',
      rubricScores: submission.rubricScores || {}
    });
    setError('');
    setSuccess('');
  };

  const handleGradingChange = (field, value) => {
    setGradingData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleRubricScoreChange = (criteriaId, score) => {
    setGradingData(prev => ({
      ...prev,
      rubricScores: {
        ...prev.rubricScores,
        [criteriaId]: score
      }
    }));
    setError('');
  };

  const calculateRubricTotal = () => {
    if (!assignment?.rubric?.criteria) return 0;
    
    return assignment.rubric.criteria.reduce((total, criterion, index) => {
      const score = gradingData.rubricScores[index] || 0;
      return total + parseFloat(score);
    }, 0);
  };

  const validateGrading = () => {
    if (!gradingData.grade) {
      return 'Grade is required';
    }

    const grade = parseFloat(gradingData.grade);
    if (isNaN(grade) || grade < 0 || grade > assignment.maxPoints) {
      return `Grade must be between 0 and ${assignment.maxPoints}`;
    }

    // If rubric is used, validate rubric scores
    if (assignment.rubric?.criteria?.length > 0) {
      const rubricTotal = calculateRubricTotal();
      if (Math.abs(rubricTotal - grade) > 0.01) {
        return 'Grade must match rubric total';
      }
    }

    return null;
  };

  const handleSubmitGrade = async () => {
    const validationError = validateGrading();
    if (validationError) {
      setError(validationError);
      return;
    }

    setGrading(true);
    setError('');

    try {
      const response = await fetch(`/api/assignment-submissions/${selectedSubmission._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          grade: parseFloat(gradingData.grade),
          feedback: gradingData.feedback,
          rubricScores: gradingData.rubricScores,
          status: 'graded'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save grade');
      }

      // Update submissions list
      setSubmissions(prev => 
        prev.map(sub => 
          sub._id === selectedSubmission._id 
            ? { ...sub, ...data.submission }
            : sub
        )
      );

      setSelectedSubmission(data.submission);
      setSuccess('Grade saved successfully!');

    } catch (error) {
      console.error('Error saving grade:', error);
      setError(error.message);
    } finally {
      setGrading(false);
    }
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status !== 'draft').length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submitted - graded;

    const avgGrade = graded > 0 
      ? submissions
          .filter(s => s.status === 'graded')
          .reduce((sum, s) => sum + (s.grade || 0), 0) / graded
      : 0;

    return { total, submitted, graded, pending, avgGrade };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const stats = getSubmissionStats();

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <CardDescription className="mt-2 text-base">
                Review and grade student submissions
              </CardDescription>
            </div>
            
            <Badge variant="secondary" className="text-sm">
              <Calendar className="h-3 w-3 mr-1" />
              Due: {formatDate(assignment.dueDate)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
              <div className="text-sm text-gray-500">Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.graded}</div>
              <div className="text-sm text-gray-500">Graded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {stats.avgGrade > 0 ? stats.avgGrade.toFixed(1) : '--'}
              </div>
              <div className="text-sm text-gray-500">Avg Grade</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              
              {/* Filters and Search */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="graded">Graded</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submittedAt">Recent</SelectItem>
                      <SelectItem value="studentName">Name</SelectItem>
                      <SelectItem value="grade">Grade</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No submissions found
                  </div>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <div
                      key={submission._id}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        selectedSubmission?._id === submission._id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSubmissionSelect(submission)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {submission.student?.name || 'Unknown Student'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {submission.student?.email}
                          </p>
                        </div>
                        
                        <Badge 
                          variant={
                            submission.status === 'graded' ? 'default' :
                            submission.status === 'submitted' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {submission.status !== 'draft' && (
                          <p>Submitted: {formatDate(submission.submittedAt)}</p>
                        )}
                        {submission.status === 'graded' && (
                          <p className="font-medium text-green-600">
                            Grade: {submission.grade}/{assignment.maxPoints}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Details and Grading */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="submission">Submission</TabsTrigger>
                <TabsTrigger value="grading">Grading</TabsTrigger>
                <TabsTrigger value="rubric">Rubric</TabsTrigger>
              </TabsList>

              <TabsContent value="submission" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Submission</CardTitle>
                    <CardDescription>
                      {selectedSubmission.student?.name} • 
                      Submitted {formatDate(selectedSubmission.submittedAt)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Text Response */}
                    {selectedSubmission.textResponse && (
                      <div>
                        <Label className="font-medium">Written Response</Label>
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                          <p className="whitespace-pre-wrap">{selectedSubmission.textResponse}</p>
                        </div>
                      </div>
                    )}

                    {/* URL Submission */}
                    {selectedSubmission.url && (
                      <div>
                        <Label className="font-medium">Submitted URL</Label>
                        <div className="mt-2">
                          <a 
                            href={selectedSubmission.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedSubmission.url}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* File Attachments */}
                    {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                      <div>
                        <Label className="font-medium">Attachments</Label>
                        <div className="mt-2 space-y-2">
                          {selectedSubmission.attachments.map((attachment, index) => (
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
                      </div>
                    )}

                    {/* Student Notes */}
                    {selectedSubmission.notes && (
                      <div>
                        <Label className="font-medium">Student Notes</Label>
                        <div className="mt-2 p-4 bg-blue-50 rounded-lg border">
                          <p className="whitespace-pre-wrap">{selectedSubmission.notes}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grading" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Assignment</CardTitle>
                    <CardDescription>
                      Provide grade and feedback for {selectedSubmission.student?.name}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="grade">Grade *</Label>
                        <Input
                          id="grade"
                          type="number"
                          min="0"
                          max={assignment.maxPoints}
                          step="0.1"
                          value={gradingData.grade}
                          onChange={(e) => handleGradingChange('grade', e.target.value)}
                          placeholder={`0 - ${assignment.maxPoints}`}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Percentage</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                          {gradingData.grade 
                            ? `${Math.round((parseFloat(gradingData.grade) / assignment.maxPoints) * 100)}%`
                            : '--'
                          }
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="feedback">Feedback</Label>
                      <Textarea
                        id="feedback"
                        value={gradingData.feedback}
                        onChange={(e) => handleGradingChange('feedback', e.target.value)}
                        placeholder="Provide detailed feedback for the student..."
                        rows={6}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmitGrade}
                        disabled={grading}
                      >
                        {grading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Grade
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rubric" className="space-y-4">
                {assignment.rubric?.criteria?.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Grading Rubric</CardTitle>
                      <CardDescription>
                        Evaluate each criterion and assign points
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {assignment.rubric.criteria.map((criterion, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{criterion.name}</h4>
                                {criterion.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {criterion.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">
                                {criterion.points} pts
                              </Badge>
                            </div>
                            
                            <div>
                              <Label>Score</Label>
                              <Input
                                type="number"
                                min="0"
                                max={criterion.points}
                                step="0.1"
                                value={gradingData.rubricScores[index] || ''}
                                onChange={(e) => handleRubricScoreChange(index, e.target.value)}
                                placeholder={`0 - ${criterion.points}`}
                                className="mt-1 w-32"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Score:</span>
                          <span className="text-lg font-bold">
                            {calculateRubricTotal().toFixed(1)} / {assignment.maxPoints}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No rubric defined for this assignment</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Submission</h3>
                <p className="text-gray-600">
                  Choose a student submission from the list to review and grade
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentGrading; 