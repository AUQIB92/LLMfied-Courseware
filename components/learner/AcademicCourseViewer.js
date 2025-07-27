import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Users, 
  Award, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Download,
  ExternalLink,
  Star,
  MessageSquare,
  TrendingUp,
  Target,
  GraduationCap,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AcademicCourseViewer = ({ courseId, user }) => {
  const { getAuthHeaders } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // Fetch course details
      const courseResponse = await fetch(`/api/academic-courses/${courseId}`, {
        headers: getAuthHeaders()
      });
      
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details');
      }
      
      const courseData = await courseResponse.json();
      setCourse(courseData.course);

      // Fetch assignments for this course
      const assignmentsResponse = await fetch(`/api/assignments?courseId=${courseId}`, {
        headers: getAuthHeaders()
      });
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments || []);
      }

      // Fetch user's submissions for this course
      const submissionsResponse = await fetch(`/api/assignment-submissions?courseId=${courseId}&studentId=${user?.id}`, {
        headers: getAuthHeaders()
      });
      
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions || []);
      }

      // Check enrollment status
      const enrollmentResponse = await fetch(`/api/academic-enrollment?courseId=${courseId}&studentId=${user?.id}`, {
        headers: getAuthHeaders()
      });
      
      if (enrollmentResponse.ok) {
        const enrollmentData = await enrollmentResponse.json();
        setEnrollment(enrollmentData.enrollments?.[0] || null);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async () => {
    setEnrolling(true);
    try {
      const response = await fetch('/api/academic-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ courseId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll in course');
      }

      setEnrollment(data.enrollment);
      // Refresh course data to get updated enrollment count
      fetchCourseData();

    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError(error.message);
    } finally {
      setEnrolling(false);
    }
  };

  const getAssignmentStatus = (assignment) => {
    const submission = submissions.find(sub => sub.assignmentId === assignment._id);
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    if (submission) {
      if (submission.status === 'graded') {
        return { status: 'graded', color: 'green', label: 'Graded' };
      } else if (submission.status === 'submitted') {
        return { status: 'submitted', color: 'blue', label: 'Submitted' };
      }
    }

    if (now > dueDate) {
      return { status: 'overdue', color: 'red', label: 'Overdue' };
    } else if (now > new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)) {
      return { status: 'due-soon', color: 'yellow', label: 'Due Soon' };
    }

    return { status: 'pending', color: 'gray', label: 'Pending' };
  };

  const calculateProgress = () => {
    if (assignments.length === 0) return 0;
    
    const completedAssignments = assignments.filter(assignment => {
      const submission = submissions.find(sub => sub.assignmentId === assignment._id);
      return submission && submission.status !== 'draft';
    });

    return Math.round((completedAssignments.length / assignments.length) * 100);
  };

  const calculateGradeAverage = () => {
    const gradedSubmissions = submissions.filter(sub => 
      sub.status === 'graded' && sub.grade !== null && sub.grade !== undefined
    );

    if (gradedSubmissions.length === 0) return null;

    const totalPoints = gradedSubmissions.reduce((sum, sub) => {
      const assignment = assignments.find(a => a._id === sub.assignmentId);
      return sum + (assignment ? assignment.maxPoints : 0);
    }, 0);

    const earnedPoints = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);

    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null;
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Course not found</AlertDescription>
      </Alert>
    );
  }

  const progress = calculateProgress();
  const gradeAverage = calculateGradeAverage();

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-blue-100 text-lg">{course.description}</p>
            
            <div className="flex items-center space-x-4 mt-4">
              <Badge variant="secondary" className="bg-white/20 text-white">
                <GraduationCap className="h-3 w-3 mr-1" />
                {course.subject}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                <Target className="h-3 w-3 mr-1" />
                {course.academicLevel}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                <Users className="h-3 w-3 mr-1" />
                {course.enrollmentCount || 0} Students
              </Badge>
            </div>
          </div>

          <div className="text-right">
            {enrollment ? (
              <div className="space-y-2">
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enrolled
                </Badge>
                <div className="text-sm text-blue-100">
                  Enrolled on {formatDate(enrollment.enrolledAt)}
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleEnrollment} 
                disabled={enrolling}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </Button>
            )}
          </div>
        </div>

        {enrollment && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{progress}%</div>
                <div className="text-sm text-blue-100">Progress</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {gradeAverage !== null ? `${gradeAverage}%` : '--'}
                </div>
                <div className="text-sm text-blue-100">Grade Average</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{assignments.length}</div>
                <div className="text-sm text-blue-100">Assignments</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Course Content */}
      {enrollment ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Instructor</h4>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{course.educator?.name || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Credits</h4>
                    <p className="text-gray-600">{course.credits || 'N/A'} credits</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Semester</h4>
                    <p className="text-gray-600">{course.semester || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Due Date</h4>
                    <p className="text-gray-600">{formatDate(course.dueDate)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.slice(0, 3).map((assignment) => {
                    const status = getAssignmentStatus(assignment);
                    return (
                      <div key={assignment._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-gray-500">Due: {formatDate(assignment.dueDate)}</p>
                        </div>
                        <Badge 
                          variant={status.color === 'green' ? 'default' : 'secondary'}
                          className={`${
                            status.color === 'green' ? 'bg-green-100 text-green-800' :
                            status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            status.color === 'red' ? 'bg-red-100 text-red-800' :
                            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {assignments.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No assignments available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Learning Objectives */}
            {course.objectives && course.objectives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Learning Objectives</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {assignments.map((assignment) => {
              const status = getAssignmentStatus(assignment);
              const submission = submissions.find(sub => sub.assignmentId === assignment._id);
              
              return (
                <Card key={assignment._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                      </div>
                      <Badge 
                        variant={status.color === 'green' ? 'default' : 'secondary'}
                        className={`${
                          status.color === 'green' ? 'bg-green-100 text-green-800' :
                          status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          status.color === 'red' ? 'bg-red-100 text-red-800' :
                          status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                      {submission && submission.status === 'graded' && (
                        <div>
                          <p className="text-sm font-medium">Grade</p>
                          <p className="text-sm font-semibold text-green-600">
                            {submission.grade}/{assignment.maxPoints}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        
                        {!submission && status.status !== 'overdue' && (
                          <Button size="sm">
                            Submit Assignment
                          </Button>
                        )}
                        
                        {submission && submission.status !== 'graded' && (
                          <Button variant="outline" size="sm">
                            Edit Submission
                          </Button>
                        )}
                      </div>

                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Downloads ({assignment.attachments.length})
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {assignments.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assignments available yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
                      <div className="text-sm text-gray-500">Total Assignments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {submissions.filter(s => s.status !== 'draft').length}
                      </div>
                      <div className="text-sm text-gray-500">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {submissions.filter(s => s.status === 'graded').length}
                      </div>
                      <div className="text-sm text-gray-500">Graded</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {gradeAverage !== null ? `${gradeAverage}%` : '--'}
                      </div>
                      <div className="text-sm text-gray-500">Grade Average</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.map((assignment) => {
                    const status = getAssignmentStatus(assignment);
                    const submission = submissions.find(sub => sub.assignmentId === assignment._id);
                    
                    return (
                      <div key={assignment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-gray-500">Due: {formatDate(assignment.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={status.color === 'green' ? 'default' : 'secondary'}
                            className={`${
                              status.color === 'green' ? 'bg-green-100 text-green-800' :
                              status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              status.color === 'red' ? 'bg-red-100 text-red-800' :
                              status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {status.label}
                          </Badge>
                          {submission && submission.status === 'graded' && (
                            <div className="text-sm text-gray-600 mt-1">
                              Grade: {submission.grade}/{assignment.maxPoints}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Prerequisites</h4>
                    {course.prerequisites && course.prerequisites.length > 0 ? (
                      <ul className="space-y-1">
                        {course.prerequisites.map((prereq, index) => (
                          <li key={index} className="text-sm text-gray-600">• {prereq}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No prerequisites</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Grading Scale</h4>
                    {course.gradingScale ? (
                      <div className="text-sm text-gray-600">
                        <p>A: {course.gradingScale.A}%+</p>
                        <p>B: {course.gradingScale.B}%+</p>
                        <p>C: {course.gradingScale.C}%+</p>
                        <p>D: {course.gradingScale.D}%+</p>
                        <p>F: Below {course.gradingScale.D}%</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Standard grading scale</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Assessment Criteria */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.assessmentCriteria ? (
                    <div className="space-y-2">
                      {Object.entries(course.assessmentCriteria).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium">{value}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Assessment criteria not specified</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Syllabus */}
            {course.syllabus && (
              <Card>
                <CardHeader>
                  <CardTitle>Syllabus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{course.syllabus}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Enroll to Access Course Content</h3>
            <p className="text-gray-600 mb-6">
              You need to enroll in this course to access assignments, materials, and track your progress.
            </p>
            <Button onClick={handleEnrollment} disabled={enrolling}>
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AcademicCourseViewer; 