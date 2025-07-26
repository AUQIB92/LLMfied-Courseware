"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  BookOpen,
  Users,
  TrendingUp,
  Sparkles,
  Award,
  Target,
  Zap,
  LogOut,
  User,
  Settings,
  Bell,
  ChevronDown,
  Clock,
  Eye,
  Edit3,
  MoreVertical,
  Calendar,
  Star,
  PlayCircle,
  FileText,
  ArrowRight,
  Trophy,
  GraduationCap,
  TestTube2,
} from "lucide-react"
import CourseCreator from "./CourseCreator"
import CourseList from "./CourseList"
import CourseEditor from "./CourseEditor"
import ExamContentEditor from "@/components/exam-genius/ExamContentEditor"
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm"
import PreferencesSettings from "@/components/profile/PreferencesSettings"
import NotificationsSettings from "@/components/profile/NotificationsSettings"
import ExamGenius from "@/components/exam-genius/ExamGenius"
import TestSeriesCreator from "./TestSeriesCreator"
import TestSeriesManager from "./TestSeriesManager"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function EducatorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [courses, setCourses] = useState([])
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [editingCourse, setEditingCourse] = useState(null)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const [editingTestSeries, setEditingTestSeries] = useState(null)
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    recentEnrollments: 0,
    completionRate: 0,
    averageProgress: 0,
    // Enhanced stats
    revenue: 0,
    activeLearners: 0,
    retentionRate: 0,
    monthlyGrowth: 0,
    weeklyEnrollments: [],
    topCourses: [],
    engagementMetrics: {
      averageSessionDuration: 0,
      averageCoursesPerStudent: 0,
      studentSatisfaction: 0,
      certificatesIssued: 0
    }
  })

  const { user, getAuthHeaders, logout, updateProfile, updateUser } = useAuth()
  const router = useRouter()

  const dataFetched = useRef(false)

  useEffect(() => {
    if (user && !dataFetched.current) {
      dataFetched.current = true
      fetchCourses()
      fetchStats()
    } else if (!user) {
      dataFetched.current = false
    }
  }, [user?._id])

  // Listen for user update events to refresh avatar
  useEffect(() => {
    const handleUserUpdate = (event) => {
      console.log('User update event detected in EducatorDashboard:', event.detail)
      // Update avatar key to force re-render of avatar components
      setAvatarKey(Date.now())
    }

    // Listen for user update events
    window.addEventListener('userUpdated', handleUserUpdate)

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
    }
  }, [])

  const fetchCourses = async () => {
    try {
      console.log("Fetching courses for educator:", user.id)
      console.log("User ID type:", typeof user.id)
      console.log("Full user object:", user)

      const response = await fetch(`/api/courses?educatorId=${user.id}`, {
        headers: getAuthHeaders(),
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      const data = await response.json()
      console.log("API Response:", data)

      // Handle error responses from API
      if (!response.ok || data.error) {
        console.error("API error:", data.error || "Unknown error")
        console.error("API error details:", data.details)
        console.error("API debug info:", data.debug)
        console.error("API error type:", data.type)
        if (data.stack) {
          console.error("API error stack:", data.stack)
        }
        setCourses([])
        return
      }

      const coursesArray = Array.isArray(data) ? data : []
      console.log("Total courses fetched:", coursesArray.length)
      
      // Filter out ExamGenius courses from the general dashboard
      const generalCourses = coursesArray.filter(course => !course.isExamGenius && !course.isCompetitiveExam)
      console.log("General courses (excluding ExamGenius):", generalCourses.length)
      console.log("ExamGenius courses filtered out:", coursesArray.length - generalCourses.length)
      
      setCourses(generalCourses)
    } catch (error) {
      console.error("Failed to fetch courses:", error)
      console.error("Error type:", error.constructor.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      setCourses([])
    }
  }

  const fetchStats = async () => {
    try {
      console.log("📊 Fetching educator stats...")
      console.log("🔑 Auth headers:", getAuthHeaders())
      
      const response = await fetch(`/api/stats?type=educator&excludeExamGenius=true`, {
        headers: getAuthHeaders(),
      })

      console.log("📊 Stats response status:", response.status)
      console.log("📊 Stats response ok:", response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Enhanced stats received:", data)
        setStats(data)
      } else {
        const errorText = await response.text()
        console.error("❌ Failed to fetch stats:", errorText)
        console.error("❌ Response status:", response.status)
        console.error("❌ Response statusText:", response.statusText)
        
        // Try to parse error details
        try {
          const errorData = JSON.parse(errorText)
          console.error("❌ Error details:", errorData)
          
          // Show user-friendly error message
          if (errorData.error) {
            console.error("❌ API Error:", errorData.error)
            if (errorData.details) {
              console.error("❌ Error details:", errorData.details)
            }
          }
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError)
        }
      }
    } catch (error) {
      console.error("💥 Network error fetching stats:", error)
      console.error("💥 Error name:", error.name)
      console.error("💥 Error message:", error.message)
      console.error("💥 Error stack:", error.stack)
      
      // Keep default stats if API fails
      setStats({
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        totalStudents: 0,
        recentEnrollments: 0,
        completionRate: 0,
        averageProgress: 0,
        revenue: 0,
        activeLearners: 0,
        retentionRate: 0,
        monthlyGrowth: 0,
        weeklyEnrollments: [],
        topCourses: [],
        engagementMetrics: {
          averageSessionDuration: 0,
          averageCoursesPerStudent: 0,
          studentSatisfaction: 0,
          certificatesIssued: 0
        }
      })
    }
  }

  const handleEditCourse = (courseId) => {
    // Find the course to determine which editor to use
    const course = courses.find(c => c.id === courseId || c._id === courseId)
    console.log("Editing course:", courseId, "Found course:", course)
    console.log("Is competitive exam?", course?.isCompetitiveExam, "Is exam genius?", course?.isExamGenius)
    
    setEditingCourseId(courseId)
    setEditingCourse(course)
    
    // Route to appropriate editor based on course type
    if (course?.isCompetitiveExam || course?.isExamGenius) {
      console.log("Routing to ExamContentEditor")
      setActiveTab("edit-exam")
    } else {
      console.log("Routing to regular CourseEditor")
      setActiveTab("edit")
    }
  }

  const refreshData = async () => {
    await Promise.all([fetchCourses(), fetchStats()])
  }

  const handleBackFromEditor = () => {
    setEditingCourseId(null)
    setEditingCourse(null)
    setActiveTab("courses")
  }

  const handleCourseUpdated = () => {
    refreshData()
    setEditingCourseId(null)
    setEditingCourse(null)
    setActiveTab("courses")
  }

  const handleTestSeriesCreated = () => {
    refreshData()
    setActiveTab("test-series-manage")
  }

  const handleEditTestSeries = (testSeries) => {
    setEditingTestSeries(testSeries)
    setActiveTab("test-series-edit")
  }

  const handleLogout = async () => {
    try {
      logout()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const navigateToProfile = () => {
    setActiveTab("profile")
  }

  const navigateToPreferences = () => {
    setActiveTab("preferences")
  }

  const navigateToNotifications = () => {
    setActiveTab("notifications")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
                    Welcome back, {user?.name || "Educator"}!
                  </h1>
                  <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                    Your educational impact dashboard. Create, manage, and track both technical and competitive exam courses.
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Stats Section */}
            <div className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-sm font-medium text-blue-100">Total Courses</CardTitle>
                      <div className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                        {stats.totalCourses}
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:bg-white/30 transition-all duration-300">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-xs text-blue-100 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Your creative journey
                    </p>
                  </CardContent>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                </Card>

                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-sm font-medium text-emerald-100">Published</CardTitle>
                      <div className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                        {stats.publishedCourses}
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:bg-white/30 transition-all duration-300">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-xs text-emerald-100 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Live and impacting
                    </p>
                  </CardContent>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                </Card>

                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-sm font-medium text-purple-100">Total Students</CardTitle>
                      <div className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                        {stats.totalStudents}
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:bg-white/30 transition-all duration-300">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-xs text-purple-100 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Minds you're shaping
                    </p>
                  </CardContent>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                </Card>

                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 via-red-600 to-pink-700 text-white shadow-2xl hover:shadow-orange-500/25 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-sm font-medium text-orange-100">Completion Rate</CardTitle>
                      <div className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                        {stats.completionRate}%
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:bg-white/30 transition-all duration-300">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-xs text-orange-100 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Success rate
                    </p>
                  </CardContent>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                </Card>
              </div>
            </div>

            {/* Secondary Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Draft Courses</CardTitle>
                  <FileText className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.draftCourses}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ready to publish
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Recent Enrollments</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.recentEnrollments}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Progress</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.averageProgress}%</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Student progress
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">₹{stats.revenue || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total earnings
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Learners</CardTitle>
                  <Users className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">{stats.activeLearners || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last 7 days
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Retention Rate</CardTitle>
                  <Target className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600">{stats.retentionRate || 0}%</div>
                  <p className="text-xs text-gray-500 mt-1">
                    50%+ completion
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Monthly Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{stats.monthlyGrowth || 0}%</div>
                  <p className="text-xs text-gray-500 mt-1">
                    vs last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Performing Courses */}
              <Card className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 via-orange-50/30 to-red-50/50"></div>
                <CardHeader className="relative bg-gradient-to-r from-yellow-50/80 to-orange-50/80 backdrop-blur-sm border-b border-white/20">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-800 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                    <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full"></div>
                    Top Performing Courses
                  </CardTitle>
                  <CardDescription className="text-yellow-700 mt-1">Your most successful courses</CardDescription>
                </CardHeader>
                <CardContent className="relative p-6">
                  {stats.topCourses && stats.topCourses.length > 0 ? (
                    <div className="space-y-4">
                      {stats.topCourses.map((course, index) => (
                        <div key={course._id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-yellow-200/50 hover:bg-white/80 transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-yellow-800 truncate max-w-48">{course.title}</h4>
                              <p className="text-sm text-yellow-700">{course.enrollments} enrollments</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-semibold text-yellow-800">{course.completionRate}%</p>
                              <p className="text-xs text-yellow-600">completion</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-yellow-800">{course.averageRating}</p>
                              <p className="text-xs text-yellow-600">rating</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
                      <p className="text-yellow-700">No performance data available yet</p>
                      <p className="text-sm text-yellow-600">Create and publish courses to see analytics</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Engagement Metrics */}
              <Card className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-rose-50/50"></div>
                <CardHeader className="relative bg-gradient-to-r from-purple-50/80 to-pink-50/80 backdrop-blur-sm border-b border-white/20">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                    <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                    Engagement Metrics
                  </CardTitle>
                  <CardDescription className="text-purple-700 mt-1">Student engagement insights</CardDescription>
                </CardHeader>
                <CardContent className="relative p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="h-5 w-5 text-purple-500" />
                          <h4 className="font-semibold text-purple-800">Avg Session</h4>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{stats.engagementMetrics?.averageSessionDuration || 0}m</p>
                        <p className="text-xs text-purple-600">per session</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="h-5 w-5 text-purple-500" />
                          <h4 className="font-semibold text-purple-800">Courses/Student</h4>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{stats.engagementMetrics?.averageCoursesPerStudent || 0}</p>
                        <p className="text-xs text-purple-600">average</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Star className="h-5 w-5 text-purple-500" />
                          <h4 className="font-semibold text-purple-800">Satisfaction</h4>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{stats.engagementMetrics?.studentSatisfaction || 0}/5</p>
                        <p className="text-xs text-purple-600">rating</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="h-5 w-5 text-purple-500" />
                          <h4 className="font-semibold text-purple-800">Certificates</h4>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{stats.engagementMetrics?.certificatesIssued || 0}</p>
                        <p className="text-xs text-purple-600">issued</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "courses":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                Technical Courses
              </h2>
              <p className="text-slate-600">Manage and organize all your technical educational content</p>
            </div>
            <CourseList
              courses={Array.isArray(courses) ? courses : []}
              onRefresh={refreshData}
              onEditCourse={handleEditCourse}
            />
          </div>
        )

      case "create":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Create New Course
              </h2>
              <p className="text-slate-600">Bring your knowledge to life</p>
            </div>
            <CourseCreator onCourseCreated={refreshData} />
          </div>
        )

      case "edit":
        return (
          <CourseEditor
            courseId={editingCourseId}
            onBack={handleBackFromEditor}
            onCourseUpdated={handleCourseUpdated}
          />
        )

      case "edit-exam":
        return (
          <ExamContentEditor
            course={editingCourse}
            onCourseUpdated={handleCourseUpdated}
            onBack={handleBackFromEditor}
          />
        )

      case "profile":
        return (
          <ProfileSettingsForm 
            onBack={() => setActiveTab("overview")} 
            isEducator={true}
            avatarKey={avatarKey}
            setAvatarKey={setAvatarKey}
          />
        )

      case "preferences":
        return (
          <PreferencesSettings 
            onBack={() => setActiveTab("overview")} 
            isEducator={true}
          />
        )

      case "notifications":
        return (
          <NotificationsSettings 
            onBack={() => setActiveTab("overview")} 
            isEducator={true}
          />
        )

      case "examgenius":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Competitive Exam Courses
              </h2>
              <p className="text-slate-600">Create specialized courses for competitive exams like SSC, UPSC, CAT, Bank PO, and more</p>
            </div>
            <ExamGenius />
          </div>
        )

      case "test-series-create":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Create Test Series
              </h2>
              <p className="text-slate-600">Generate AI-powered test series with Perplexity AI integration</p>
            </div>
            <TestSeriesCreator onTestSeriesCreated={handleTestSeriesCreated} />
          </div>
        )

      case "test-series-manage":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Manage Test Series
              </h2>
              <p className="text-slate-600">View, edit, and manage your test series collection</p>
            </div>
            <TestSeriesManager 
              onEditTestSeries={handleEditTestSeries}
              onRefresh={refreshData}
            />
          </div>
        )

      case "test-series-edit":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Edit Test Series
              </h2>
              <p className="text-slate-600">Modify your test series configuration and content</p>
            </div>
            <TestSeriesCreator 
              editingTestSeries={editingTestSeries}
              onTestSeriesCreated={() => {
                setEditingTestSeries(null)
                setActiveTab("test-series-manage")
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 sm:py-8 lg:py-12 space-y-4 sm:space-y-0">
            <div className="space-y-2 flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                LLMfied Courseware
              </h1>
              <div className="text-blue-200 text-sm sm:text-base lg:text-xl flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Welcome back, <span className="font-semibold text-white">{user?.name}</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Create Course Button */}
              <Button
                onClick={() => setActiveTab("create")}
                className="group relative bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-white text-slate-800 shadow-2xl hover:shadow-white/25 border-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Create Course</span>
                <span className="sm:hidden">Create</span>
              </Button>

              {/* Test Series Button */}
              <Button
                onClick={() => setActiveTab("test-series-create")}
                className="group relative bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-800 shadow-2xl hover:shadow-indigo-500/25 border-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <TestTube2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline">Test Series</span>
                <span className="sm:hidden">Tests</span>
              </Button>

              {/* ExamGenius Button */}
              <Button
                onClick={() => setActiveTab("examgenius")}
                className="group relative bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 shadow-2xl hover:shadow-emerald-500/25 border-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline">ExamGenius</span>
                <span className="sm:hidden">Exam</span>
              </Button>

              {/* Profile Section */}
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="group relative h-12 sm:h-14 lg:h-16 px-3 sm:px-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative">
                          <Avatar
                            className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300"
                            key={`header-avatar-${avatarKey}`}
                          >
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm sm:text-base">
                              {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="hidden sm:block text-left">
                          <p className="text-white font-semibold text-xs sm:text-sm leading-none truncate max-w-32 lg:max-w-none">{user?.name || "Educator"}</p>
                          <p className="text-blue-200 text-xs mt-1 truncate max-w-32 lg:max-w-none">{user?.email || "educator@example.com"}</p>
                        </div>
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-200 group-hover:text-white transition-all duration-300 group-data-[state=open]:rotate-180" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2"
                  >
                    {/* Profile Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="h-12 w-12 ring-2 ring-blue-200"
                          key={`dropdown-avatar-${avatarKey}`}
                        >
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{user?.name || "Educator Name"}</p>
                          <p className="text-sm text-slate-600 truncate">{user?.email || "educator@example.com"}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Online</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-slate-200" />

                    {/* Menu Items */}
                    <DropdownMenuItem
                      onClick={navigateToProfile}
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="p-2 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors duration-200">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Profile Settings</p>
                        <p className="text-xs text-slate-500">Manage your account</p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={navigateToPreferences}
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="p-2 bg-purple-100 group-hover:bg-purple-200 rounded-lg transition-colors duration-200">
                        <Settings className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Preferences</p>
                        <p className="text-xs text-slate-500">Customize your experience</p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={navigateToNotifications}
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="p-2 bg-amber-100 group-hover:bg-amber-200 rounded-lg transition-colors duration-200">
                        <Bell className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">Notifications</p>
                        <p className="text-xs text-slate-500">Manage alerts</p>
                      </div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-200 my-2" />

                    {/* Logout Button */}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="p-2 bg-red-100 group-hover:bg-red-200 rounded-lg transition-colors duration-200">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Sign Out</p>
                        <p className="text-xs text-slate-500">Logout from your account</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pb-4 sm:pb-6">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "courses", label: "Technical Courses", icon: BookOpen },
              { id: "create", label: "Create Course", icon: Plus },
              { id: "test-series-manage", label: "Test Series", icon: TestTube2 },
              { id: "examgenius", label: "Competitive Exam Courses", icon: GraduationCap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative py-3 sm:py-4 px-4 sm:px-6 font-semibold text-sm transition-all duration-300 rounded-lg sm:rounded-xl touch-manipulation ${
                  activeTab === tab.id
                    ? "bg-white/20 backdrop-blur-sm text-white shadow-lg"
                    : "text-blue-200 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                }`}
              >
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 h-0.5 sm:h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="animate-in fade-in-50 duration-500">{renderContent()}</div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
