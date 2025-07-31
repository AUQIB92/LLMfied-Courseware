"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AcademicContentEditor from "./AcademicContentEditor"
import ExamGeniusCourseCreator from "./ExamGeniusCourseCreator"
import { toast } from "sonner"
import {
  Plus,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Users,
  Star,
  Edit3,
  Trash2,
  Play,
  BarChart3,
  Brain,
  Zap,
  Award,
  CheckCircle,
  AlertCircle,
  Settings,
  Search,
  Filter,
  Calendar,
  FileText,
  Globe,
  ChevronRight,
  Sparkles,
  GraduationCap,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  BookmarkPlus,
  Upload,
  Loader2,
  Download,
  X,
  Eye
} from "lucide-react"

export default function CompetitiveCourseManager() {
  const { user, getAuthHeaders } = useAuth()
  const [activeView, setActiveView] = useState("dashboard")
  const [competitiveCourses, setCompetitiveCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCourse, setEditingCourse] = useState(null)
  const [showCourseCreator, setShowCourseCreator] = useState(false)

  const [stats, setStats] = useState({
    totalCompetitiveCourses: 0,
    activeStudents: 0,
    completionRate: 0,
    averageScore: 0
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all") // "all", "published", "draft"

  // Computed filtered courses
  const filteredCourses = competitiveCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.examType?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesExamType = filterType === "all" || course.examType === filterType
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && course.isPublished) ||
                         (statusFilter === "draft" && !course.isPublished)
    
    return matchesSearch && matchesExamType && matchesStatus
  })

  // Separate published and draft courses
  const publishedCourses = competitiveCourses.filter(course => 
    course.status === "published" || course.isPublished === true
  )
  
  const draftCourses = competitiveCourses.filter(course => 
    course.status !== "published" && course.isPublished !== true
  )

  const examTypes = [
    { id: "jee", name: "JEE Main/Advanced", icon: "🔬", color: "blue" },
    { id: "neet", name: "NEET", icon: "🏥", color: "green" },
    { id: "gate", name: "GATE", icon: "⚙️", color: "purple" },
    { id: "cat", name: "CAT", icon: "💼", color: "orange" },
    { id: "upsc", name: "UPSC", icon: "🏛️", color: "red" },
    { id: "banking", name: "Banking", icon: "🏦", color: "cyan" },
    { id: "ssc", name: "SSC", icon: "📊", color: "pink" },
    { id: "custom", name: "Custom", icon: "⚡", color: "yellow" }
  ]

  useEffect(() => {
    if (user) {
      fetchCompetitiveCourses()
      fetchStats()
    }
  }, [user])

  const fetchCompetitiveCourses = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching competitive/ExamGenius courses for user:", user.id)
      
      // Fetch courses with competitive exam filter
      const response = await fetch(`/api/courses?educatorId=${user.id}&isCompetitiveExam=true&isExamGenius=true`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Competitive/ExamGenius courses:", data)
        
        if (!Array.isArray(data)) {
          console.error("❌ Invalid courses data format")
          setCompetitiveCourses([])
          return
        }
        
        // Filter for competitive exam courses
        const competitiveOnly = data.filter(course => 
          course.isCompetitiveExam === true || 
          course.isExamGenius === true ||
          course.examType // Has exam type field
        )
        
        setCompetitiveCourses(competitiveOnly)
        
        console.log(`✅ Loaded ${competitiveOnly.length} competitive exam courses`)
      } else {
        console.error("❌ Failed to fetch competitive courses")
        setCompetitiveCourses([])
      }
    } catch (error) {
      console.error("Error fetching competitive courses:", error)
      setCompetitiveCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    // Mock stats for now - in a real app, this would come from an API
    setStats({
      totalCompetitiveCourses: competitiveCourses.length,
      activeStudents: Math.floor(Math.random() * 500),
      completionRate: Math.floor(Math.random() * 40) + 60,
      averageScore: Math.floor(Math.random() * 20) + 75
    })
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setActiveView("editor")
  }

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Are you sure you want to delete this competitive exam course?")) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        toast.success("Course deleted successfully")
        fetchCompetitiveCourses()
      } else {
        toast.error("Failed to delete course")
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("An error occurred while deleting the course")
    }
  }

  const handleBackFromEditor = () => {
    setEditingCourse(null)
    setActiveView("dashboard")
  }

  const handleCourseSaved = () => {
    fetchCompetitiveCourses()
    setActiveView("dashboard")
  }

  const handleCourseCreated = () => {
    setShowCourseCreator(false)
    fetchCompetitiveCourses()
  }

  if (activeView === "editor" && editingCourse) {
    return (
      <AcademicContentEditor
        course={editingCourse}
        onBack={handleBackFromEditor}
        onSave={handleCourseSaved}
      />
    )
  }

  if (showCourseCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setShowCourseCreator(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <ExamGeniusCourseCreator onCourseCreated={handleCourseCreated} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Competitive Exam Courses
              </h1>
              <p className="text-gray-600">ExamGenius & Competitive Course Manager</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <Zap className="h-4 w-4 mr-1" />
              AI-Powered
            </Badge>
            <Button
              onClick={() => setShowCourseCreator(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create ExamGenius Course
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold">{competitiveCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold">{stats.activeStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search courses by title, subject, or exam type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Exam Types</option>
                  {examTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Courses ({filteredCourses.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedCourses.length})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({draftCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <CourseGrid courses={filteredCourses} onEdit={handleEditCourse} onDelete={handleDeleteCourse} loading={loading} />
          </TabsContent>

          <TabsContent value="published">
            <CourseGrid courses={publishedCourses.filter(course => 
              course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.examType?.toLowerCase().includes(searchTerm.toLowerCase())
            )} onEdit={handleEditCourse} onDelete={handleDeleteCourse} loading={loading} />
          </TabsContent>

          <TabsContent value="draft">
            <CourseGrid courses={draftCourses.filter(course => 
              course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.examType?.toLowerCase().includes(searchTerm.toLowerCase())
            )} onEdit={handleEditCourse} onDelete={handleDeleteCourse} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Course Grid Component
function CourseGrid({ courses, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Competitive Courses Found</h3>
        <p className="text-gray-500 mb-6">Create your first ExamGenius course to get started!</p>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Create First ExamGenius Course
        </Button>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course._id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.examType} • {course.subject}</p>
                </div>
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <p className="text-sm text-gray-700 line-clamp-3">
                {course.description || "No description available"}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span>{course.modules?.length || 0} modules</span>
                {course.estimatedTime && (
                  <>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>{course.estimatedTime}</span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(course)}
                  className="flex-1"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(course._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}