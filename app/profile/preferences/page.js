"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Switch } from "../../../components/ui/switch"
import { Label } from "../../../components/ui/label"
import { Separator } from "../../../components/ui/separator"
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone } from "lucide-react"

export default function PreferencesPage() {
  const { user, loading, updateProfile } = useAuth()
  const router = useRouter()
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    courseReminders: true,
    progressUpdates: true,
    aiTutorSuggestions: true,
    weeklyDigest: true,
    promotionalEmails: false,
    theme: "system",
    language: "en",
    autoSaveInterval: 30,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
    if (user?.preferences) {
      setPreferences({ ...preferences, ...user.preferences })
    }
  }, [user, loading, router])

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const result = await updateProfile({ preferences })
      if (result.success) {
        // Show success message
        console.log("Preferences updated successfully")
      } else {
        console.error("Failed to update preferences:", result.error)
      }
    } catch (error) {
      console.error("Error updating preferences:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Preferences</h1>
        </div>

        <div className="space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange("pushNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      SMS Notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive important updates via SMS
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange("smsNotifications", checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Notification Types</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Course Reminders</Label>
                    <p className="text-sm text-gray-600">
                      Get reminded about upcoming courses and deadlines
                    </p>
                  </div>
                  <Switch
                    checked={preferences.courseReminders}
                    onCheckedChange={(checked) => handlePreferenceChange("courseReminders", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Progress Updates</Label>
                    <p className="text-sm text-gray-600">
                      Receive updates about your learning progress
                    </p>
                  </div>
                  <Switch
                    checked={preferences.progressUpdates}
                    onCheckedChange={(checked) => handlePreferenceChange("progressUpdates", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Tutor Suggestions</Label>
                    <p className="text-sm text-gray-600">
                      Get personalized learning suggestions from AI
                    </p>
                  </div>
                  <Switch
                    checked={preferences.aiTutorSuggestions}
                    onCheckedChange={(checked) => handlePreferenceChange("aiTutorSuggestions", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-gray-600">
                      Weekly summary of your learning activities
                    </p>
                  </div>
                  <Switch
                    checked={preferences.weeklyDigest}
                    onCheckedChange={(checked) => handlePreferenceChange("weeklyDigest", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Promotional Emails</Label>
                    <p className="text-sm text-gray-600">
                      Receive updates about new features and courses
                    </p>
                  </div>
                  <Switch
                    checked={preferences.promotionalEmails}
                    onCheckedChange={(checked) => handlePreferenceChange("promotionalEmails", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Customize your general application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-gray-600">
                    Choose your preferred color theme
                  </p>
                </div>
                <select
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange("theme", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Language</Label>
                  <p className="text-sm text-gray-600">
                    Choose your preferred language
                  </p>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange("language", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Auto-save Interval</Label>
                  <p className="text-sm text-gray-600">
                    How often to save your progress (seconds)
                  </p>
                </div>
                <select
                  value={preferences.autoSaveInterval}
                  onChange={(e) => handlePreferenceChange("autoSaveInterval", parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={savePreferences}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
