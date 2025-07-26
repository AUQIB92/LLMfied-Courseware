"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Eye,
  Trash2,
  Users,
  Calendar,
  Clock,
  BarChart3,
  PlayCircle,
  Pause,
  Archive,
  Download,
  Share,
  Copy,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Brain
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"

export default function TestSeriesManager({ onEditTestSeries, onRefresh }) {
  const [testSeries, setTestSeries] = useState([])
  const [filteredTestSeries, setFilteredTestSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")

  const { user, getAuthHeaders } = useAuth()

  useEffect(() => {
    fetchTestSeries()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [testSeries, searchTerm, statusFilter, subjectFilter])

  const fetchTestSeries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/test-series?educatorId=${user.id}`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setTestSeries(data.testSeries || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch test series")
      }
    } catch (error) {
      console.error("Error fetching test series:", error)
      setError("Failed to fetch test series")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...testSeries]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(series =>
        series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        series.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        series.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(series => series.status === statusFilter)
    }

    // Subject filter
    if (subjectFilter !== "all") {
      filtered = filtered.filter(series => series.subject === subjectFilter)
    }

    setFilteredTestSeries(filtered)
  }

  const handleStatusChange = async (seriesId, newStatus) => {
    try {
      const response = await fetch(`/api/test-series/${seriesId}/status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchTestSeries() // Refresh the list
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      setError("Failed to update status")
    }
  }

  const handleDelete = async (seriesId) => {
    if (!confirm("Are you sure you want to delete this test series? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/test-series/${seriesId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      })

      if (response.ok) {
        fetchTestSeries() // Refresh the list
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete test series")
      }
    } catch (error) {
      console.error("Error deleting test series:", error)
      setError("Failed to delete test series")
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Published
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="border-yellow-200 text-yellow-800">
            <Edit3 className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        )
      case "archived":
        return (
          <Badge variant="secondary">
            <Archive className="w-3 h-3 mr-1" />
            Archived
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const uniqueSubjects = [...new Set(testSeries.map(series => series.subject))].filter(Boolean)

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test series...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Brain className="w-5 h-5" />
            Test Series Management
          </CardTitle>
          <CardDescription>
            Manage your test series, view analytics, and track student performance
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </span>
            <Button onClick={fetchTestSeries} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search test series..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Series List */}
      <div className="space-y-4">
        {filteredTestSeries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Test Series Found</h3>
              <p className="text-gray-500 mb-4">
                {testSeries.length === 0 
                  ? "You haven't created any test series yet. Create your first test series to get started."
                  : "No test series match your current filters. Try adjusting your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTestSeries.map((series) => (
            <Card key={series._id} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {series.title}
                      </h3>
                      {getStatusBadge(series.status)}
                      <Badge variant="outline" className="text-xs">
                        {series.subject}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {series.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">
                          {series.totalTests} Tests
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600">
                          {series.enrollments || 0} Students
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-600">
                          Created {formatDate(series.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-600">
                          {series.timePerTest}min/test
                        </span>
                      </div>
                    </div>

                    {series.topics && series.topics.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {series.topics.slice(0, 3).map((topic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {topic.name}
                            </Badge>
                          ))}
                          {series.topics.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{series.topics.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditTestSeries && onEditTestSeries(series)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        {series.status === "published" ? (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(series._id, "archived")}
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        ) : series.status === "draft" ? (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(series._id, "published")}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(series._id, "published")}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(series._id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Summary */}
      {testSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testSeries.length}
                </div>
                <div className="text-sm text-gray-600">Total Test Series</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testSeries.filter(s => s.status === "published").length}
                </div>
                <div className="text-sm text-gray-600">Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {testSeries.filter(s => s.status === "draft").length}
                </div>
                <div className="text-sm text-gray-600">Drafts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {testSeries.reduce((sum, s) => sum + (s.enrollments || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Enrollments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 