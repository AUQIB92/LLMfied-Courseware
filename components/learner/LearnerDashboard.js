"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  LogOut, 
  User,
  Settings,
  Bell,
  ChevronDown,
  Star,
  Calendar,
  Target,
  Award,
  Zap,
  BookMarked,
  Play,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react"
import CourseLibrary from "./CourseLibrary"
import CourseViewer from "./CourseViewer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function LearnerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const [hideHeader, setHideHeader] = useState(false) // For hiding header when viewing modules
  const [isHeaderVisible, setIsHeaderVisible] = useState(true) // For scroll-based header visibility (auto-hide on scroll down)
  const [lastScrollY, setLastScrollY] = useState(0) // Track scroll position for header visibility
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    streak: 7,
    certificates: 3
  })
  const { user, getAuthHeaders, logout, updateUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchEnrolledCourses()
    fetchStats()
  }, [])

  // Scroll event listener for header visibility
  useEffect(() => {
    // Don't add scroll listener if header is already hidden due to module view
    if (hideHeader) return
    
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          // Show header when at the top of the page
          if (currentScrollY < 10) {
            setIsHeaderVisible(true)
          } 
          // Hide header when scrolling down past threshold, show when scrolling up
          else if (currentScrollY > lastScrollY && currentScrollY > 120) {
            setIsHeaderVisible(false)
          } else if (currentScrollY < lastScrollY - 5) { // Small threshold to prevent jitter
            setIsHeaderVisible(true)
          }
          
          setLastScrollY(currentScrollY)
          ticking = false
        })
        ticking = true
      }
    }

    // Add scroll event listener with throttling
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, hideHeader])

  const fetchEnrolledCourses = async () => {
    try {
      console.log("Fetching enrolled courses...")
      const response = await fetch("/api/enrollment", {
        headers: getAuthHeaders(),
      })
      
      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)
      
      const data = await response.json()
      console.log("API Response:", data)
      
      if (!response.ok || data.error) {
        console.error("API error:", data.error || "Unknown error")
        setEnrolledCourses([])
        return
      }
      
      // Get enrolled courses from the API response
      const coursesArray = Array.isArray(data.courses) ? data.courses : []
      console.log("Setting enrolled courses:", coursesArray.length, "courses")
      setEnrolledCourses(coursesArray)
      
      // Update stats based on enrolled courses
      setStats(prev => ({
        ...prev,
        coursesEnrolled: coursesArray.length,
        coursesCompleted: coursesArray.filter(c => c.completionRate === 100).length
      }))
    } catch (error) {
      console.error("Failed to fetch enrolled courses:", error)
      setEnrolledCourses([])
    }
  }

  const fetchStats = async () => {
    setStats({
      coursesEnrolled: 8,
      coursesCompleted: 5,
      totalTimeSpent: 2847, // minutes
      averageScore: 92,
      streak: 12,
      certificates: 5
    })
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const navigateToProfile = () => {
    setShowProfileSettings(true)
    setShowPreferences(false)
    setShowNotifications(false)
    setActiveTab("profile")
  }

  const navigateToPreferences = () => {
    setShowPreferences(true)
    setShowProfileSettings(false)
    setShowNotifications(false)
    setActiveTab("preferences")
  }

  const navigateToNotifications = () => {
    setShowNotifications(true)
    setShowProfileSettings(false)
    setShowPreferences(false)
    setActiveTab("notifications")
  }

  const renderContent = () => {
    if (selectedCourse) {
      return (
        <CourseViewer 
          course={selectedCourse} 
          onBack={() => {
            setSelectedCourse(null)
            setHideHeader(false)
            setIsHeaderVisible(true) // Reset scroll-based header visibility
            setLastScrollY(0) // Reset scroll position tracking
          }}
          onModuleView={(isViewingModule) => setHideHeader(isViewingModule)}
        />
      )
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-32 -translate-x-32"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Welcome back, {user?.name}!</h2>
                    <p className="text-white/80 text-lg">Ready to continue your learning journey?</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/90 font-medium">{stats.streak} day streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-300" />
                    <span className="text-white/90 font-medium">{stats.certificates} certificates earned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-semibold text-slate-700">Courses Enrolled</CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-slate-800 mb-1">{stats.coursesEnrolled}</div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +2 this month
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-semibold text-slate-700">Completed</CardTitle>
                  <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <Trophy className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-slate-800 mb-1">{stats.coursesCompleted}</div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {Math.round((stats.coursesCompleted / stats.coursesEnrolled) * 100)}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-semibold text-slate-700">Time Spent</CardTitle>
                  <div className="p-2 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors duration-300">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-slate-800 mb-1">{Math.floor(stats.totalTimeSpent / 60)}h</div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {stats.totalTimeSpent % 60}m this week
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-semibold text-slate-700">Average Score</CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors duration-300">
                    <Star className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-slate-800 mb-1">{stats.averageScore}%</div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Excellent performance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Continue Learning Section */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl">
                        <Play className="h-6 w-6 text-blue-600" />
                      </div>
                      Continue Learning
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-2">Pick up where you left off and keep building momentum</CardDescription>
                  </div>
                  <Button variant="outline" className="hover:bg-blue-50 border-blue-200">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {Array.isArray(enrolledCourses) && enrolledCourses.slice(0, 3).map((course, index) => {
                    const progress = Math.random() * 100
                    const timeLeft = Math.floor(Math.random() * 120) + 30
                    
                    return (
                      <div key={course._id} className="group relative overflow-hidden p-6 border border-slate-200 rounded-2xl hover:shadow-xl transition-all duration-500 hover:border-blue-300 bg-gradient-to-r from-white to-slate-50/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                                <BookMarked className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                                  {course.title}
                                </h4>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm text-slate-600 flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    {course.modules?.length || 0} modules
                                  </span>
                                  <span className="text-sm text-slate-600 flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    ~{timeLeft} min left
                                  </span>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {Math.floor(progress)}% complete
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 font-medium">Progress</span>
                                <span className="text-slate-800 font-semibold">{Math.floor(progress)}%</span>
                              </div>
                              <Progress 
                                value={progress} 
                                className="h-3 bg-slate-100"
                              />
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => setSelectedCourse(course)}
                            className="ml-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                          >
                            Continue
                            <Play className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  
                  {(!Array.isArray(enrolledCourses) || enrolledCourses.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-12 w-12 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">No courses yet</h3>
                      <p className="text-slate-600 mb-6">Start your learning journey by exploring our course library</p>
                      <Button 
                        onClick={() => setActiveTab("library")}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl"
                      >
                        Browse Courses
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="group border-0 bg-gradient-to-br from-indigo-50 to-blue-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Study Schedule</h3>
                  <p className="text-slate-600 text-sm">Plan your learning sessions</p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-gradient-to-br from-emerald-50 to-green-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Learning Goals</h3>
                  <p className="text-slate-600 text-sm">Set and track your objectives</p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Achievements</h3>
                  <p className="text-slate-600 text-sm">View your badges and certificates</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "library":
        return <CourseLibrary onCourseSelect={setSelectedCourse} />

      case "profile":
        return <ProfileSettings />

      case "preferences":
        return <Preferences />

      case "notifications":
        return <Notifications />

      default:
        return null
    }
  }

  // Enhanced Profile Components
  const ProfileSettings = () => {
    const [profile, setProfile] = useState({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    })
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
      if (user) {
        setProfile({
          name: user.name || '',
          email: user.email || '',
          bio: user.bio || '',
          avatar: user.avatar || ''
        })
      }
    }, [user])

    const handleProfileUpdate = async (e) => {
      e.preventDefault()
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profile),
        })

        if (response.ok) {
          const updatedUser = await response.json()
          updateUser(updatedUser.user)
          setAvatarKey(Date.now())
          alert('Profile updated successfully!')
        } else {
          alert('Failed to update profile')
        }
      } catch (error) {
        console.error('Error updating profile:', error)
        alert('Error updating profile')
      }
    }

    const handleAvatarUpload = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      setIsUploading(true)
      const formData = new FormData()
      formData.append('avatar', file)

      try {
        const response = await fetch('/api/upload/avatar', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          const updatedProfile = { ...profile, avatar: data.avatarUrl }
          setProfile(updatedProfile)
          updateUser({ ...user, avatar: data.avatarUrl })
          setAvatarKey(Date.now())
          alert('Avatar uploaded successfully!')
        } else {
          alert('Failed to upload avatar')
        }
      } catch (error) {
        console.error('Error uploading avatar:', error)
        alert('Error uploading avatar')
      } finally {
        setIsUploading(false)
      }
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className="group flex items-center gap-2 hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Profile Settings
            </h2>
            <p className="text-slate-600 text-lg mt-2">Manage your learning profile and personal information</p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <User className="h-6 w-6 text-white" />
              </div>
              Personal Information
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">
              Update your profile details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleProfileUpdate} className="space-y-8">
              {/* Avatar Upload */}
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <Avatar key={`profile-${avatarKey}`} className="h-32 w-32 ring-4 ring-blue-200 shadow-xl group-hover:ring-blue-300 transition-all duration-300">
                    <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                      {profile.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-full transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-sm font-medium">Change</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Profile Picture</h3>
                    <p className="text-slate-600 mb-4">Upload a new avatar to personalize your profile</p>
                  </div>
                  <label className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-300 px-6 py-3 rounded-2xl font-medium"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        {isUploading ? 'Uploading...' : 'Upload New Avatar'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </span>
                    </Button>
                  </label>
                  <p className="text-sm text-slate-500">JPG, PNG or GIF. Max size 5MB.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-slate-700 font-semibold">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="h-14 rounded-2xl border-2 border-slate-200 focus:border-blue-500 transition-colors duration-300"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="h-14 rounded-2xl border-2 border-slate-200 focus:border-blue-500 transition-colors duration-300"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="bio" className="text-slate-700 font-semibold">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about your learning journey and goals..."
                  rows={5}
                  className="rounded-2xl border-2 border-slate-200 focus:border-blue-500 transition-colors duration-300 resize-none"
                />
              </div>

              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                Save Changes
                <CheckCircle className="h-5 w-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const Preferences = () => {
    const [preferences, setPreferences] = useState({
      emailNotifications: true,
      pushNotifications: false,
      darkMode: false,
      language: 'en',
      studyReminders: true,
      weeklyGoal: 5,
      preferredStudyTime: 'morning'
    })

    const handlePreferenceUpdate = async () => {
      try {
        const response = await fetch('/api/preferences', {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        })

        if (response.ok) {
          alert('Preferences updated successfully!')
        } else {
          alert('Failed to update preferences')
        }
      } catch (error) {
        console.error('Error updating preferences:', error)
        alert('Error updating preferences')
      }
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className="group flex items-center gap-2 hover:bg-purple-50 text-purple-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Learning Preferences
            </h2>
            <p className="text-slate-600 text-lg mt-2">Customize your learning experience to match your style</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                Notification Settings
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                Control how you receive updates and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-slate-800">Email Notifications</p>
                  <p className="text-sm text-slate-600 mt-1">Course updates and progress reports</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-slate-800">Push Notifications</p>
                  <p className="text-sm text-slate-600 mt-1">Real-time browser notifications</p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-600"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-slate-800">Study Reminders</p>
                  <p className="text-sm text-slate-600 mt-1">Daily learning session reminders</p>
                </div>
                <Switch
                  checked={preferences.studyReminders}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, studyReminders: checked }))
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                Learning Settings
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                Personalize your study environment and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold">Weekly Learning Goal</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={preferences.weeklyGoal}
                    onChange={(e) => setPreferences(prev => ({ ...prev, weeklyGoal: parseInt(e.target.value) }))}
                    className="flex-1 h-3 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-2xl font-bold text-slate-800 min-w-[3rem]">{preferences.weeklyGoal}h</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold">Preferred Study Time</Label>
                <select
                  value={preferences.preferredStudyTime}
                  onChange={(e) => setPreferences(prev => ({ ...prev, preferredStudyTime: e.target.value }))}
                  className="w-full h-14 px-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors duration-300 bg-white"
                >
                  <option value="morning">Morning (6AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 6PM)</option>
                  <option value="evening">Evening (6PM - 12AM)</option>
                  <option value="night">Night (12AM - 6AM)</option>
                </select>
              </div>
              
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold">Language</Label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full h-14 px-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors duration-300 bg-white"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="zh">🇨🇳 Chinese</option>
                  <option value="ja">🇯🇵 Japanese</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handlePreferenceUpdate}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            Save Preferences
            <CheckCircle className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  const Notifications = () => {
    const [notifications, setNotifications] = useState([
      {
        id: 1,
        type: 'course',
        title: 'Course progress update',
        message: 'You completed Module 2 of "JavaScript Fundamentals"',
        time: '1 hour ago',
        read: false,
        icon: BookOpen,
        color: 'blue'
      },
      {
        id: 2,
        type: 'achievement',
        title: 'Achievement unlocked!',
        message: 'You earned the "Quick Learner" badge',
        time: '2 days ago',
        read: true,
        icon: Trophy,
        color: 'yellow'
      },
      {
        id: 3,
        type: 'reminder',
        title: 'Daily study reminder',
        message: 'Time for your daily 30-minute learning session',
        time: '3 days ago',
        read: false,
        icon: Clock,
        color: 'green'
      },
      {
        id: 4,
        type: 'certificate',
        title: 'Certificate available',
        message: 'Your "React Fundamentals" certificate is ready for download',
        time: '1 week ago',
        read: true,
        icon: Award,
        color: 'purple'
      }
    ])

    const markAsRead = (id) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      )
    }

    const markAllAsRead = () => {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
    }

    const getColorClasses = (color, read) => {
      const colors = {
        blue: read ? 'from-blue-50 to-blue-50' : 'from-blue-50 to-indigo-100',
        yellow: read ? 'from-yellow-50 to-yellow-50' : 'from-yellow-50 to-amber-100',
        green: read ? 'from-green-50 to-green-50' : 'from-green-50 to-emerald-100',
        purple: read ? 'from-purple-50 to-purple-50' : 'from-purple-50 to-pink-100'
      }
      return colors[color] || colors.blue
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className="group flex items-center gap-2 hover:bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Notifications
            </h2>
            <p className="text-slate-600 text-lg mt-2">Stay updated with your learning progress and achievements</p>
          </div>
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-300 px-6 py-3 rounded-2xl font-medium"
          >
            Mark All as Read
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
                <Bell className="h-6 w-6 text-white" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">
              Your latest updates and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const IconComponent = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={`group p-8 hover:bg-gradient-to-r ${getColorClasses(notification.color, notification.read)} transition-all duration-300 ${
                      !notification.read ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-6">
                      <div className={`p-4 rounded-2xl ${
                        notification.color === 'blue' ? 'bg-blue-500' :
                        notification.color === 'yellow' ? 'bg-yellow-500' :
                        notification.color === 'green' ? 'bg-green-500' :
                        'bg-purple-500'
                      } shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-lg text-slate-900 group-hover:text-slate-800 transition-colors duration-300">
                              {notification.title}
                            </h4>
                            <p className="text-slate-700 mt-2 leading-relaxed">{notification.message}</p>
                            <div className="flex items-center gap-3 mt-4">
                              <p className="text-sm text-slate-500 font-medium">{notification.time}</p>
                              {!notification.read && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl font-medium opacity-0 group-hover:opacity-100 transition-all duration-300"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Enhanced Header - Hide when viewing modules or scrolling */}
      {!hideHeader && (
        <div className={`bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 transition-all duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0 shadow-xl' : '-translate-y-full shadow-lg'
        } ${lastScrollY > 10 ? 'shadow-2xl border-slate-300/50' : 'shadow-xl'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Learning Hub
                </h1>
                <div className="text-slate-600 flex items-center gap-3 mt-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-lg">Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span></span>
                  <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                    {stats.streak} day streak 🔥
                  </Badge>
                </div>
              </div>
            
            {/* Enhanced User Profile Menu */}
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="group relative h-16 px-6 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 rounded-2xl shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar key={`header-${avatarKey}`} className="h-12 w-12 ring-4 ring-slate-200 group-hover:ring-blue-300 transition-all duration-300 shadow-lg">
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-white rounded-full shadow-lg"></div>
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-slate-800 font-bold text-base leading-none">{user?.name || "Learner"}</p>
                        <p className="text-slate-600 text-sm mt-1 font-medium">{user?.email || "learner@example.com"}</p>
                      </div>
                      <ChevronDown className="h-5 w-5 text-slate-600 group-hover:text-slate-800 transition-all duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-80 bg-white/95 backdrop-blur-xl border-2 border-slate-200 shadow-2xl rounded-3xl p-3"
                >
                  {/* Enhanced Profile Header */}
                  <div className="px-6 py-5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl mb-3">
                    <div className="flex items-center gap-4">
                      <Avatar key={`dropdown-${avatarKey}`} className="h-16 w-16 ring-4 ring-blue-200 shadow-lg">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate text-lg">{user?.name || "Learner Name"}</p>
                        <p className="text-sm text-slate-600 truncate font-medium">{user?.email || "learner@example.com"}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-semibold">Online</span>
                          <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">
                            Level {Math.floor(stats.averageScore / 20)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-slate-200" />

                  {/* Enhanced Menu Items */}
                  <DropdownMenuItem 
                    onClick={navigateToProfile}
                    className="group flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 rounded-xl transition-all duration-300 group-hover:scale-110">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-base">Profile Settings</p>
                      <p className="text-sm text-slate-500">Manage your account details</p>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={navigateToPreferences}
                    className="group flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 rounded-xl transition-all duration-300 group-hover:scale-110">
                      <Settings className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-base">Learning Preferences</p>
                      <p className="text-sm text-slate-500">Customize your experience</p>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={navigateToNotifications}
                    className="group flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 group-hover:from-amber-200 group-hover:to-amber-300 rounded-xl transition-all duration-300 group-hover:scale-110">
                      <Bell className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-base">Notifications</p>
                      <p className="text-sm text-slate-500">View updates and alerts</p>
                    </div>
                    <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-pink-500 rounded-full animate-pulse shadow-lg"></div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-slate-200 my-3" />

                  {/* Enhanced Logout Button */}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="group flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 group-hover:from-red-200 group-hover:to-red-300 rounded-xl transition-all duration-300 group-hover:scale-110">
                      <LogOut className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-base">Sign Out</p>
                      <p className="text-sm text-slate-500">Logout from your account</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex space-x-2 pb-6">
            {[
              { id: "overview", label: "Dashboard", icon: TrendingUp, gradient: "from-blue-500 to-indigo-600" },
              { id: "library", label: "Course Library", icon: BookOpen, gradient: "from-emerald-500 to-green-600" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsHeaderVisible(true) // Show header when switching tabs
                  setLastScrollY(0) // Reset scroll tracking
                }}
                className={`group flex items-center gap-3 py-4 px-8 font-semibold text-sm transition-all duration-300 rounded-2xl ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl scale-105`
                    : "text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:scale-105"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
      )}

      {/* Enhanced Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in fade-in-50 duration-700 slide-in-from-bottom-4">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}