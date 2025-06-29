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
} from "lucide-react"
import CourseCreator from "./CourseCreator"
import CourseList from "./CourseList"
import CourseEditor from "./CourseEditor"
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
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    recentEnrollments: 0,
    completionRate: 0,
    averageProgress: 0,
  })

  const { user, getAuthHeaders, logout, updateProfile, updateUser } = useAuth()
  const router = useRouter()

  // Profile state management
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
    location: "",
    website: "",
    avatar: user?.avatar || "",
    phone: "",
    organization: "",
    title: "",
    expertise: [],
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    language: "en",
    timezone: "UTC",
    autoSave: true,
    publicProfile: true,
  })

  const [notifications, setNotifications] = useState([])
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    fetchCourses()
    fetchStats()
    if (user) {
      fetchProfile()
      fetchPreferences()
      fetchNotifications()
    }
  }, [user])

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
      console.log("Setting courses:", coursesArray.length, "courses")
      setCourses(coursesArray)
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
      const response = await fetch(`/api/stats?type=educator`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error("Failed to fetch stats:", await response.text())
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
      // Keep default stats if API fails
      setStats({
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        totalStudents: 0,
        recentEnrollments: 0,
        completionRate: 0,
        averageProgress: 0,
      })
    }
  }

  const fetchProfile = async () => {
    setProfileLoading(true)
    try {
      const response = await fetch("/api/profile", {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setProfile((prev) => ({ ...prev, ...data.user }))
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/preferences", {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setPreferences((prev) => ({ ...prev, ...(data.preferences || data) }))
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const handleEditCourse = (courseId) => {
    setEditingCourseId(courseId)
    setActiveTab("edit")
  }

  const refreshData = async () => {
    await Promise.all([fetchCourses(), fetchStats()])
  }

  const handleBackFromEditor = () => {
    setEditingCourseId(null)
    setActiveTab("courses")
  }

  const handleCourseUpdated = () => {
    refreshData()
    setEditingCourseId(null)
    setActiveTab("courses")
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

  // Beautiful Recent Courses Component
  const BeautifulRecentCourses = () => {
    const recentCourses = Array.isArray(courses) ? courses.slice(0, 6) : []

    const getStatusColor = (status) => {
      switch (status) {
        case "published":
          return "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
        case "draft":
          return "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
        case "archived":
          return "bg-gradient-to-r from-slate-500 to-gray-600 text-white"
        default:
          return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
      }
    }

    const getStatusIcon = (status) => {
      switch (status) {
        case "published":
          return <PlayCircle className="h-3 w-3" />
        case "draft":
          return <FileText className="h-3 w-3" />
        case "archived":
          return <Clock className="h-3 w-3" />
        default:
          return <BookOpen className="h-3 w-3" />
      }
    }

    if (recentCourses.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-slate-100 to-blue-50 rounded-3xl p-12 border border-white/50 shadow-xl">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">No courses yet</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Start your teaching journey by creating your first course. Share your knowledge with the world!
              </p>
              <Button
                onClick={() => setActiveTab("create")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Course
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        {/* Header with View All Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Recent Courses</h3>
              <p className="text-slate-600 text-sm">Your latest educational content</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setActiveTab("courses")}
            className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-slate-200 hover:border-blue-300 transition-all duration-300"
          >
            View All Courses
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentCourses.map((course, index) => (
            <Card
              key={course._id || course.id || `course-${index}`}
              className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-[1px] bg-white rounded-xl"></div>

              {/* Content */}
              <div className="relative">
                {/* Course Thumbnail/Header */}
                <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/placeholder.svg?height=128&width=400')] bg-cover bg-center opacity-20"></div>

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className={`${getStatusColor(course.status)} px-3 py-1 text-xs font-semibold shadow-lg`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(course.status)}
                        {course.status?.charAt(0).toUpperCase() + course.status?.slice(1) || "Draft"}
                      </div>
                    </Badge>
                  </div>

                  {/* Course Actions */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEditCourse(course.id)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          View Students
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Course Category/Level */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                        {course.category || "General"}
                      </div>
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        {course.level || "Beginner"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <CardContent className="p-6 space-y-4">
                  {/* Title and Description */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                      {course.title || "Untitled Course"}
                    </h4>
                    <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                      {course.description || "No description available for this course."}
                    </p>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{course.enrolledCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">{course.lessonsCount || 0} lessons</span>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : "Recently"}</span>
                    </div>
                  </div>

                  {/* Progress Bar (if applicable) */}
                  {course.completionRate !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Completion Rate</span>
                        <span className="font-semibold text-slate-800">{course.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${course.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleEditCourse(course._id || course.id)}
                    className="w-full bg-gradient-to-r from-slate-100 to-blue-50 hover:from-blue-50 hover:to-purple-50 text-slate-700 hover:text-slate-800 border border-slate-200 hover:border-blue-300 transition-all duration-300 group-hover:shadow-md"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Course
                  </Button>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center pt-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setActiveTab("create")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Course
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("courses")}
              className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 border-slate-200 hover:border-blue-300 px-6 py-3 rounded-xl transition-all duration-300"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Manage All Courses
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Inline Profile Components
  const ProfileSettings = () => {
    const [localProfile, setLocalProfile] = useState(profile)
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
      setLocalProfile(profile)
    }, [profile])

    const handleProfileUpdate = async (e) => {
      e.preventDefault()
      try {
        console.log("Updating profile with data:", localProfile)
        console.log("Auth headers:", getAuthHeaders())

        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(localProfile),
        })
        console.log("Response status:", response.status)
        console.log("Response headers:", response.headers)
        if (response.ok) {
          const data = await response.json()
          console.log("Profile update successful:", data)

          // Update user context if name or email changed
          if (localProfile.name !== user.name || localProfile.email !== user.email) {
            updateUser({
              name: localProfile.name,
              email: localProfile.email,
              avatar: localProfile.avatar,
            })
          }

          alert("Profile updated successfully!")
          fetchProfile() // Refresh profile data
        } else {
          const errorData = await response.json()
          console.log("Profile update failed:", errorData)
          alert(`Failed to update profile: ${errorData.error || "Unknown error"}`)
        }
      } catch (error) {
        console.error("Error updating profile:", error)
        alert(`Error updating profile: ${error.message}`)
      }
    }

    const handleAvatarUpload = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      setIsUploading(true)
      const formData = new FormData()
      formData.append("avatar", file)

      try {
        const response = await fetch("/api/upload/avatar", {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          const newAvatarUrl = data.avatarUrl

          // Update local profile state immediately for instant UI feedback
          setLocalProfile((prev) => ({ ...prev, avatar: newAvatarUrl }))
          setProfile((prev) => ({ ...prev, avatar: newAvatarUrl }))

          // Update the user context (this will update the header avatar immediately)
          updateUser({ avatar: newAvatarUrl, _avatarTimestamp: Date.now() })

          alert("Avatar uploaded successfully!")
        } else {
          const errorData = await response.json()
          alert(`Failed to upload avatar: ${errorData.error || "Unknown error"}`)
        }
      } catch (error) {
        console.error("Error uploading avatar:", error)
        alert(`Error uploading avatar: ${error.message}`)
      } finally {
        setIsUploading(false)
      }
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setActiveTab("overview")} className="hover:bg-blue-50 text-blue-600">
            ← Back to Dashboard
          </Button>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Profile Settings
            </h2>
            <p className="text-slate-600">Manage your account information</p>
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
                  <Avatar className="h-24 w-24 ring-4 ring-blue-200">
                    <AvatarImage src={localProfile.avatar || "/placeholder.svg"} alt={localProfile.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {localProfile.name?.charAt(0)?.toUpperCase() || "U"}
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
                      className="cursor-pointer bg-transparent"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        {isUploading ? "Uploading..." : "Upload New Avatar"}
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
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
                    value={localProfile.name}
                    onChange={(e) => setLocalProfile((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={localProfile.email}
                    onChange={(e) => setLocalProfile((prev) => ({ ...prev, email: e.target.value }))}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input
                    id="title"
                    value={localProfile.title}
                    onChange={(e) => setLocalProfile((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Senior Developer, Math Professor"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={localProfile.organization}
                    onChange={(e) => setLocalProfile((prev) => ({ ...prev, organization: e.target.value }))}
                    placeholder="e.g., Tech University, ABC Company"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={localProfile.phone}
                    onChange={(e) => setLocalProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={localProfile.location}
                    onChange={(e) => setLocalProfile((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., New York, USA"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={localProfile.website}
                  onChange={(e) => setLocalProfile((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={localProfile.bio}
                  onChange={(e) => setLocalProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
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
    const [localPreferences, setLocalPreferences] = useState(preferences)

    useEffect(() => {
      setLocalPreferences(preferences)
    }, [preferences])

    const handlePreferenceUpdate = async () => {
      try {
        const response = await fetch("/api/preferences", {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(localPreferences),
        })
        if (response.ok) {
          alert("Preferences updated successfully!")
          fetchPreferences() // Refresh preferences data
        } else {
          alert("Failed to update preferences")
        }
      } catch (error) {
        console.error("Error updating preferences:", error)
        alert("Error updating preferences")
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
              Preferences
            </h2>
            <p className="text-slate-600">Customize your experience</p>
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
                  <p className="text-sm text-slate-500">Receive updates via email</p>
                </div>
                <Switch
                  checked={localPreferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPreferences((prev) => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-slate-500">Receive browser notifications</p>
                </div>
                <Switch
                  checked={localPreferences.pushNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPreferences((prev) => ({ ...prev, pushNotifications: checked }))
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
              <div className="space-y-2">
                <Label>Language</Label>
                <select
                  value={localPreferences.language}
                  onChange={(e) => setLocalPreferences((prev) => ({ ...prev, language: e.target.value }))}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <select
                  value={localPreferences.timezone}
                  onChange={(e) => setLocalPreferences((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-slate-500">Toggle dark theme</p>
                </div>
                <Switch
                  checked={localPreferences.darkMode}
                  onCheckedChange={(checked) => setLocalPreferences((prev) => ({ ...prev, darkMode: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-slate-500">Make your profile visible to students</p>
                </div>
                <Switch
                  checked={localPreferences.publicProfile}
                  onCheckedChange={(checked) => setLocalPreferences((prev) => ({ ...prev, publicProfile: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Save</p>
                  <p className="text-sm text-slate-500">Automatically save your work</p>
                </div>
                <Switch
                  checked={localPreferences.autoSave}
                  onCheckedChange={(checked) => setLocalPreferences((prev) => ({ ...prev, autoSave: checked }))}
                />
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
    const [localNotifications, setLocalNotifications] = useState(notifications)

    useEffect(() => {
      setLocalNotifications(notifications)
    }, [notifications])

    const markAsRead = (id) => {
      setLocalNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
    }

    const markAllAsRead = () => {
      setLocalNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setActiveTab("overview")} className="hover:bg-amber-50 text-amber-600">
            ← Back to Dashboard
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Notifications
            </h2>
            <p className="text-slate-600">Stay updated with your latest activities</p>
          </div>
          <Button onClick={markAllAsRead} variant="outline" className="hover:bg-amber-50 bg-transparent">
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
              {localNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-3 h-3 rounded-full mt-2 ${
                        !notification.read ? "bg-blue-500 animate-pulse" : "bg-gray-300"
                      }`}
                    ></div>
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

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-12">
            {/* Hero Stats Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 hover:scale-105">
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
              </div>
            </div>

            {/* Secondary Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.completionRate}%</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Course completion
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
            </div>

            {/* Beautiful Recent Courses Section */}
            <Card className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50"></div>
              <CardHeader className="relative bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-2">
                      <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                      Recent Courses
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">Your latest masterpieces</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live updates
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative p-8">
                <BeautifulRecentCourses />
              </CardContent>
            </Card>
          </div>
        )

      case "courses":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                Your Course Library
              </h2>
              <p className="text-slate-600">Manage and organize all your educational content</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-12">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                Educator Dashboard
              </h1>
              <div className="text-blue-200 text-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Welcome back, <span className="font-semibold text-white">{user?.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Create Course Button */}
              <Button
                onClick={() => setActiveTab("create")}
                className="group relative bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-white text-slate-800 shadow-2xl hover:shadow-white/25 border-0 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create Course
              </Button>

              {/* Profile Section */}
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="group relative h-16 px-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar
                            className="h-10 w-10 ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300"
                            key={`header-avatar-${user?.avatar}-${user?._avatarTimestamp || Date.now()}`}
                          >
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                        </div>
                        <div className="hidden md:block text-left">
                          <p className="text-white font-semibold text-sm leading-none">{user?.name || "Educator"}</p>
                          <p className="text-blue-200 text-xs mt-1">{user?.email || "educator@example.com"}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-blue-200 group-hover:text-white transition-all duration-300 group-data-[state=open]:rotate-180" />
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
                          key={`dropdown-avatar-${user?.avatar}-${user?._avatarTimestamp || Date.now()}`}
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
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex space-x-2 pb-6">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "courses", label: "My Courses", icon: BookOpen },
              { id: "create", label: "Create Course", icon: Plus },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative py-4 px-6 font-semibold text-sm transition-all duration-300 rounded-xl ${
                  activeTab === tab.id
                    ? "bg-white/20 backdrop-blur-sm text-white shadow-lg"
                    : "text-blue-200 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
