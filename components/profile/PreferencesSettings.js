"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Settings, 
  Bell, 
  Monitor, 
  Sun, 
  Moon, 
  Globe, 
  Clock,
  ArrowRight,
  Save,
  Shield,
  Palette,
  Volume2,
  Smartphone,
  Mail,
  CheckCircle
} from "lucide-react"

export default function PreferencesSettings({ onBack, isEducator = false }) {
  const { getAuthHeaders } = useAuth()
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    browserNotifications: false,
    courseUpdates: true,
    studentMessages: true,
    systemAlerts: true,
    darkMode: false,
    language: "en",
    timezone: "UTC",
    autoSave: true,
    publicProfile: true,
    soundEffects: true,
    compactView: false,
    showTips: true,
  })
  
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    fetchPreferences()
    // Test API health
    testApiHealth()
  }, [])

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/preferences", {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setPreferences(prev => ({ ...prev, ...(data.preferences || data) }))
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const testApiHealth = async () => {
    try {
      const response = await fetch("/api/preferences/test", {
        headers: getAuthHeaders(),
      })
      const result = await response.json()
      console.log("API Health Check:", result)
    } catch (error) {
      console.error("API Health Check Failed:", error)
    }
  }

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    setSaveLoading(true)
    try {
      // Filter out MongoDB-specific fields before sending
      const { _id, userId, createdAt, updatedAt, ...cleanPreferences } = preferences
      
      console.log("Saving preferences:", cleanPreferences)
      
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanPreferences),
      })
      
      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log("Success result:", result)
        setHasUnsavedChanges(false)
        toast.success("Preferences updated successfully!")
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          errorData = { message: `HTTP ${response.status} - ${response.statusText}` }
        }
        
        console.error("Error response:", errorData)
        
        let errorMessage = errorData.message || 'Unknown error'
        if (errorData.error) {
          errorMessage += `: ${errorData.error}`
        }
        
        // Provide specific guidance for 500 errors
        if (response.status === 500) {
          errorMessage += '\n\nTroubleshooting:\n• Check if the server is running\n• Verify database connection\n• Check browser console for details'
        }
        
        toast.error(`Failed to update preferences: ${errorMessage}`)
      }
    } catch (error) {
      console.error("Error updating preferences:", error)
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      
      let errorMessage = error.message
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection and ensure the server is running'
      }
      
      toast.error(`Error updating preferences: ${errorMessage}`)
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="group flex items-center gap-2 hover:bg-purple-50 text-purple-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
        >
          <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Dashboard
        </Button>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Preferences
          </h2>
          <p className="text-slate-600 text-lg mt-2">
            Customize your {isEducator ? 'teaching' : 'learning'} experience
          </p>
          {hasUnsavedChanges && (
            <p className="text-amber-600 text-sm mt-1 font-medium">
              You have unsaved changes
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notification Settings */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                <Bell className="h-6 w-6 text-white" />
              </div>
              Notification Settings
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">
              Control how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-600" />
                    <p className="font-semibold text-slate-800">Email Notifications</p>
                  </div>
                  <p className="text-sm text-slate-500">Receive updates via email</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-purple-600" />
                    <p className="font-semibold text-slate-800">Push Notifications</p>
                  </div>
                  <p className="text-sm text-slate-500">Receive mobile push notifications</p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-purple-600" />
                    <p className="font-semibold text-slate-800">Browser Notifications</p>
                  </div>
                  <p className="text-sm text-slate-500">Show notifications in your browser</p>
                </div>
                <Switch
                  checked={preferences.browserNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('browserNotifications', checked)}
                />
              </div>

              {isEducator && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800">Course Updates</p>
                      <p className="text-sm text-slate-500">Notifications about course activities</p>
                    </div>
                    <Switch
                      checked={preferences.courseUpdates}
                      onCheckedChange={(checked) => handlePreferenceChange('courseUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800">Student Messages</p>
                      <p className="text-sm text-slate-500">Messages from students</p>
                    </div>
                    <Switch
                      checked={preferences.studentMessages}
                      onCheckedChange={(checked) => handlePreferenceChange('studentMessages', checked)}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <p className="font-semibold text-slate-800">System Alerts</p>
                  </div>
                  <p className="text-sm text-slate-500">Important system notifications</p>
                </div>
                <Switch
                  checked={preferences.systemAlerts}
                  onCheckedChange={(checked) => handlePreferenceChange('systemAlerts', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl">
                <Palette className="h-6 w-6 text-white" />
              </div>
              Display Settings
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">
              Customize the appearance and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  Language
                </Label>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  className="w-full h-12 px-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  Timezone
                </Label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  className="w-full h-12 px-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Europe/Berlin">Berlin</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-600" />
                    <p className="font-semibold text-slate-800">Dark Mode</p>
                  </div>
                  <p className="text-sm text-slate-500">Use dark theme</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-indigo-600" />
                    <p className="font-semibold text-slate-800">Sound Effects</p>
                  </div>
                  <p className="text-sm text-slate-500">Play sounds for interactions</p>
                </div>
                <Switch
                  checked={preferences.soundEffects}
                  onCheckedChange={(checked) => handlePreferenceChange('soundEffects', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">Compact View</p>
                  <p className="text-sm text-slate-500">Use condensed layout</p>
                </div>
                <Switch
                  checked={preferences.compactView}
                  onCheckedChange={(checked) => handlePreferenceChange('compactView', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">Show Tips</p>
                  <p className="text-sm text-slate-500">Display helpful tips and hints</p>
                </div>
                <Switch
                  checked={preferences.showTips}
                  onCheckedChange={(checked) => handlePreferenceChange('showTips', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security Settings */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              Privacy & Security
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">
              Control your privacy and data settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">Public Profile</p>
                  <p className="text-sm text-slate-500">Make your profile visible to {isEducator ? 'students' : 'other learners'}</p>
                </div>
                <Switch
                  checked={preferences.publicProfile}
                  onCheckedChange={(checked) => handlePreferenceChange('publicProfile', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">Auto Save</p>
                  <p className="text-sm text-slate-500">Automatically save your work</p>
                </div>
                <Switch
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) => handlePreferenceChange('autoSave', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-8">
        <div className="text-sm text-slate-500">
          {hasUnsavedChanges && (
            <span className="text-amber-600 font-medium">
              You have unsaved changes
            </span>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saveLoading || !hasUnsavedChanges}
          className="group relative bg-gradient-to-r from-purple-500 via-pink-600 to-purple-600 hover:from-purple-600 hover:via-pink-700 hover:to-purple-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative flex items-center gap-3">
            {saveLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                Save Preferences
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  )
} 