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
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  LogOut, 
  User,
  Settings,
  Bell,
  ChevronDown
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
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalTimeSpent: 0,
    averageScore: 0,
  })
  const { user, getAuthHeaders, logout, updateUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchEnrolledCourses()
    fetchStats()
  }, [])

  const fetchEnrolledCourses = async () => {
    try {
      console.log("Fetching enrolled courses...")
      const response = await fetch("/api/courses?status=published", {
        headers: getAuthHeaders(),
      })
      
      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)
      
      const courses = await response.json()
      console.log("API Response:", courses)
      
      // Handle error responses from API
      if (!response.ok || courses.error) {
        console.error("API error:", courses.error || "Unknown error")
        console.error("API error details:", courses.details)
        console.error("API debug info:", courses.debug)
        console.error("API error type:", courses.type)
        if (courses.stack) {
          console.error("API error stack:", courses.stack)
        }
        setEnrolledCourses([])
        return
      }
      
      const coursesArray = Array.isArray(courses) ? courses : []
      console.log("Setting enrolled courses:", coursesArray.length, "courses")
      setEnrolledCourses(coursesArray)
    } catch (error) {
      console.error("Failed to fetch courses:", error)
      console.error("Error type:", error.constructor.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      setEnrolledCourses([])
    }
  }

  const fetchStats = async () => {
    // This would typically fetch user-specific learning statistics
    setStats({
      coursesEnrolled: 5,
      coursesCompleted: 2,
      totalTimeSpent: 1250, // minutes
      averageScore: 85,
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
      return <CourseViewer course={selectedCourse} onBack={() => setSelectedCourse(null)} />
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.coursesEnrolled}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.coursesCompleted}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.floor(stats.totalTimeSpent / 60)}h</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageScore}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(enrolledCourses) && enrolledCourses.slice(0, 3).map((course) => (
                    <div key={course._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{course.modules?.length || 0} modules</p>
                        <Progress value={Math.random() * 100} className="mt-2 w-full max-w-xs" />
                      </div>
                      <Button onClick={() => setSelectedCourse(course)}>Continue</Button>
                    </div>
                  ))}
                  {(!Array.isArray(enrolledCourses) || enrolledCourses.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No enrolled courses found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "library":
        return <CourseLibrary courses={Array.isArray(enrolledCourses) ? enrolledCourses : []} onCourseSelect={setSelectedCourse} />

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

  // Inline Profile Components (similar to EducatorDashboard)
  const ProfileSettings = () => {
    const [profile, setProfile] = useState({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    })
    const [isUploading, setIsUploading] = useState(false)

    // Sync profile state with user context
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
          setAvatarKey(Date.now()) // Force avatar re-render
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
          
          // Update user context with new avatar
          updateUser({ ...user, avatar: data.avatarUrl })
          setAvatarKey(Date.now()) // Force avatar re-render
          
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
            className="hover:bg-blue-50 text-blue-600"
          >
            ← Back to Dashboard
          </Button>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Profile Settings
            </h2>
            <p className="text-slate-600">Manage your learning profile</p>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar key={`profile-${avatarKey}`} className="h-24 w-24 ring-4 ring-blue-200">
                    <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {profile.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
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
                  <p className="text-sm text-slate-500 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about your learning journey..."
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
              >
                Save Changes
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
      studyReminders: true
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
            className="hover:bg-purple-50 text-purple-600"
          >
            ← Back to Dashboard
          </Button>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Learning Preferences
            </h2>
            <p className="text-slate-600">Customize your learning experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-500">Course updates and progress</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-slate-500">Browser notifications</p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Study Reminders</p>
                  <p className="text-sm text-slate-500">Daily learning reminders</p>
                </div>
                <Switch
                  checked={preferences.studyReminders}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, studyReminders: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                Display Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-slate-500">Toggle dark theme</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, darkMode: checked }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handlePreferenceUpdate}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3"
          >
            Save Preferences
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
        read: false
      },
      {
        id: 2,
        type: 'achievement',
        title: 'Achievement unlocked!',
        message: 'You earned the "Quick Learner" badge',
        time: '2 days ago',
        read: true
      },
      {
        id: 3,
        type: 'reminder',
        title: 'Daily study reminder',
        message: 'Time for your daily 30-minute learning session',
        time: '3 days ago',
        read: false
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

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className="hover:bg-amber-50 text-amber-600"
          >
            ← Back to Dashboard
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Notifications
            </h2>
            <p className="text-slate-600">Stay updated with your learning progress</p>
          </div>
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="hover:bg-amber-50"
          >
            Mark All as Read
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      !notification.read ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-2">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      <div className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                Learning Dashboard
              </h1>
              <div className="text-slate-600 flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Welcome back, <span className="font-medium text-slate-800">{user?.name}</span>
              </div>
            </div>
            
            {/* User Profile Menu */}
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="group relative h-12 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar key={`header-${avatarKey}`} className="h-8 w-8 ring-2 ring-slate-200 group-hover:ring-slate-300 transition-all duration-300">
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-slate-800 font-semibold text-sm leading-none">{user?.name || "Learner"}</p>
                        <p className="text-slate-600 text-xs mt-1">{user?.email || "learner@example.com"}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-600 group-hover:text-slate-800 transition-all duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-72 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2"
                >
                  {/* Profile Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar key={`dropdown-${avatarKey}`} className="h-12 w-12 ring-2 ring-blue-200">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{user?.name || "Learner Name"}</p>
                        <p className="text-sm text-slate-600 truncate">{user?.email || "learner@example.com"}</p>
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
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
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

          <nav className="flex space-x-1 pb-6">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "library", label: "Course Library", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 py-3 px-6 font-medium text-sm transition-all duration-300 rounded-xl ${
                  activeTab === tab.id
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-in fade-in-50 duration-500">{renderContent()}</div>
      </div>
    </div>
  )
}
