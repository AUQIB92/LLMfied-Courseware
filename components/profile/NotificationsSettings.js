"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bell, 
  ArrowRight,
  CheckCircle,
  X,
  MessageSquare,
  BookOpen,
  Users,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  Settings,
  Filter,
  Search
} from "lucide-react"

export default function NotificationsSettings({ onBack, isEducator = false }) {
  const { getAuthHeaders } = useAuth()
  
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id || notif._id?.toString() === id ? { ...notif, read: true } : notif
          )
        )
        toast.success("Notification marked as read")
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        toast.success("All notifications marked as read")
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== id && notif._id?.toString() !== id))
        toast.success("Notification deleted")
      }
    } catch (error) {
      console.error("Failed to delete notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "course": return <BookOpen className="h-4 w-4" />
      case "message": return <MessageSquare className="h-4 w-4" />
      case "student": return <Users className="h-4 w-4" />
      case "system": return <Settings className="h-4 w-4" />
      case "warning": return <AlertTriangle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case "course": return "bg-gradient-to-r from-blue-500 to-indigo-600"
      case "message": return "bg-gradient-to-r from-green-500 to-emerald-600"
      case "student": return "bg-gradient-to-r from-purple-500 to-violet-600"
      case "system": return "bg-gradient-to-r from-slate-500 to-gray-600"
      case "warning": return "bg-gradient-to-r from-orange-500 to-red-600"
      default: return "bg-gradient-to-r from-blue-500 to-purple-600"
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || 
                         (filterType === "unread" && !notification.read) ||
                         (filterType === "read" && notification.read) ||
                         notification.type === filterType
    return matchesSearch && matchesFilter
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="group flex items-center gap-2 hover:bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
        >
          <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Notifications
          </h2>
          <p className="text-slate-600 text-lg mt-2">
            Manage your alerts and communication preferences
          </p>
          {unreadCount > 0 && (
            <p className="text-amber-600 text-sm mt-1 font-medium">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-2xl border-2 border-slate-200 focus:border-amber-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-12 px-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="course">Course</option>
                  <option value="message">Messages</option>
                  <option value="student">Students</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  className="hover:bg-green-50 border-green-200 hover:border-green-400 text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-t-2xl">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
              <Bell className="h-6 w-6 text-white" />
            </div>
            Recent Notifications
            {unreadCount > 0 && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Bell className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No notifications found</h3>
              <p className="text-slate-600">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "You're all caught up! No new notifications."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className={`group relative p-6 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-blue-50/50 transition-all duration-300 ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${getNotificationColor(notification.type)} text-white shadow-lg`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-bold text-lg ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                              {notification.title || 'Notification'}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-slate-600 leading-relaxed mb-3">
                            {notification.message || 'No message content available'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {notification.createdAt 
                                ? new Date(notification.createdAt).toLocaleDateString()
                                : 'Unknown date'
                              }
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {notification.type || 'general'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="hover:bg-green-100 text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="hover:bg-red-100 text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 