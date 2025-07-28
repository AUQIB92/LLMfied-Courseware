import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Calendar, 
  Award, 
  CheckCircle,
  Clock,
  GraduationCap,
  Target,
  User,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AcademicCourseLibrary = ({ 
  onCourseSelect, 
  enrolledCourses = [], 
  enrollmentDataLoaded = false,
  onEnrollmentChange
}) => {
  const { getAuthHeaders } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [enrolling, setEnrolling] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, subjectFilter, levelFilter]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/academic-courses?status=published', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch academic courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching academic courses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(course => course.subject === subjectFilter);
    }

    // Filter by academic level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(course => course.academicLevel === levelFilter);
    }

    setFilteredCourses(filtered);
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(enrolled => enrolled._id === courseId || enrolled.id === courseId);
  };

  const handleEnrollment = async (courseId) => {
    setEnrolling(prev => ({ ...prev, [courseId]: true }));

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

      // Trigger enrollment refresh
      if (onEnrollmentChange) {
        onEnrollmentChange();
      }

    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError(error.message);
    } finally {
      setEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const getUniqueSubjects = () => {
    const subjects = [...new Set(courses.map(course => course.subject))];
    return subjects.sort();
  };

  const getUniqueLevels = () => {
    const levels = [...new Set(courses.map(course => course.academicLevel))];
    return levels.sort();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Academic Courses
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Explore structured academic courses with assignments, grading, and comprehensive learning paths
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {getUniqueSubjects().map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Academic Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {getUniqueLevels().map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const enrolled = isEnrolled(course._id);
          const isEnrollingCourse = enrolling[course._id];

          return (
            <Card 
              key={course._id} 
              className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-3">
                      {course.description}
                    </CardDescription>
                  </div>
                  
                  {enrolled && (
                    <Badge className="bg-green-100 text-green-800 ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enrolled
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {course.subject}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    {course.academicLevel}
                  </Badge>
                  {course.credits && (
                    <Badge variant="outline" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      {course.credits} Credits
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Course Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{course.enrollmentCount || 0} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span>{course.assignmentCount || 0} assignments</span>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>By {course.educator?.name || 'Unknown'}</span>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Due: {formatDate(course.dueDate)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    {enrolled ? (
                      <Button 
                        onClick={() => onCourseSelect(course)}
                        className="flex-1"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => onCourseSelect(course)}
                          className="flex-1"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          onClick={() => handleEnrollment(course._id)}
                          disabled={isEnrollingCourse}
                          className="flex-1"
                        >
                          {isEnrollingCourse ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Enroll
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Courses Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || subjectFilter !== 'all' || levelFilter !== 'all' 
                ? 'Try adjusting your filters to find more courses.'
                : 'No academic courses are available at the moment.'
              }
            </p>
            {(searchTerm || subjectFilter !== 'all' || levelFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSubjectFilter('all');
                  setLevelFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AcademicCourseLibrary; 