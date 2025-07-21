"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Upload,
  AlertCircle,
  ArrowRight,
  Globe,
  BookOpen,
  Target,
  Shield,
  Briefcase,
  Building2,
  FileText
} from "lucide-react"

export default function ProfileSettingsForm({ onBack, isEducator = false, avatarKey, setAvatarKey }) {
  const { user, getAuthHeaders, updateUser } = useAuth()
  
  // Initialize form state only once with current user data
  const [profileData, setProfileData] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    phone: user?.phone || '',
    location: user?.location || '',
    website: user?.website || '',
    // Learner-specific fields
    learningGoals: user?.learningGoals || '',
    interests: user?.interests || [],
    // Educator-specific fields
    title: user?.title || '',
    organization: user?.organization || '',
    expertise: user?.expertise || []
  }))
  
  const [isUploading, setIsUploading] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Only update form if user data changes significantly (not on every render)
  const userDataRef = useRef()
  useEffect(() => {
    const currentUserKey = user ? `${user._id}-${user.name}-${user.email}` : null
    if (currentUserKey && currentUserKey !== userDataRef.current) {
      userDataRef.current = currentUserKey
      // Only update if we don't have unsaved changes
      if (!hasUnsavedChanges) {
        setProfileData({
          name: user?.name || '',
          email: user?.email || '',
          bio: user?.bio || '',
          avatar: user?.avatar || '',
          phone: user?.phone || '',
          location: user?.location || '',
          website: user?.website || '',
          learningGoals: user?.learningGoals || '',
          interests: user?.interests || [],
          title: user?.title || '',
          organization: user?.organization || '',
          expertise: user?.expertise || []
        })
      }
    }
  }, [user?._id, user?.name, user?.email])

  const validateForm = () => {
    const errors = {}
    if (!profileData.name?.trim()) {
      errors.name = 'Name is required'
    }
    if (!profileData.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (profileData.website && !/^https?:\/\/.+\..+/.test(profileData.website)) {
      errors.website = 'Please enter a valid website URL (include http:// or https://)'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFieldChange = (fieldName, value) => {
    setProfileData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    setHasUnsavedChanges(true)
    
    // Clear specific field error when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }))
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaveLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        const result = await response.json()
        updateUser(result.user)
        setHasUnsavedChanges(false)
        if (setAvatarKey) setAvatarKey(Date.now())
        
        // Show success notification
        toast.success("Profile updated successfully!")
      } else {
        const errorData = await response.json()
        console.error('Profile update failed:', errorData)
        toast.error(`Failed to update profile: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(`Error updating profile: ${error.message}`)
    } finally {
      setSaveLoading(false)
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
        const newAvatarUrl = data.avatarUrl
        
        handleFieldChange('avatar', newAvatarUrl)
        updateUser({ ...user, avatar: newAvatarUrl })
        if (setAvatarKey) setAvatarKey(Date.now())
        toast.success("Avatar uploaded successfully!")
      } else {
        toast.error("Failed to upload avatar")
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error("Error uploading avatar")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="group flex items-center gap-2 hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
        >
          <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Dashboard
        </Button>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profile Settings
          </h2>
          <p className="text-slate-600 text-lg mt-2">
            Manage your {isEducator ? 'educator' : 'learning'} profile and personal information
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-t-2xl">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <User className="h-6 w-6 text-white" />
            </div>
            {isEducator ? 'Educator Profile' : 'Personal Information'}
          </CardTitle>
          <CardDescription className="text-slate-600 text-base mt-2">
            Update your profile details and preferences
            {hasUnsavedChanges && (
              <span className="ml-4 text-amber-600 font-medium">
                • You have unsaved changes
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleFormSubmit} className="space-y-8">
            {/* Avatar Upload */}
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 scale-125"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-pink-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-700 scale-110 animate-pulse"></div>
                
                <div className="relative">
                  <Avatar key={`profile-${avatarKey}`} className="h-40 w-40 ring-4 ring-blue-200 group-hover:ring-blue-300 group-hover:ring-8 transition-all duration-500 shadow-2xl">
                    <AvatarImage src={profileData.avatar || "/placeholder.svg"} alt={profileData.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 text-white text-5xl font-bold">
                      {profileData.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent mx-auto mb-2"></div>
                        <div className="text-sm font-medium">Uploading...</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-full transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm font-semibold">Change Photo</div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-white">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Profile Picture</h3>
                        <p className="text-slate-600">Express your {isEducator ? 'professional' : 'learning'} journey visually</p>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      Upload a clear, {isEducator ? 'professional' : 'friendly'} photo that represents you. 
                      This helps create connections with {isEducator ? 'students and colleagues' : 'educators and fellow students'} in the community.
                    </p>
                    
                    <label className="block">
                      <Button
                        type="button"
                        variant="outline"
                        className="group cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-2 border-blue-200 hover:border-blue-400 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl w-full"
                        disabled={isUploading}
                        asChild
                      >
                        <span className="flex items-center justify-center gap-3">
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                              <span>Uploading Photo...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                              <span>Choose New Photo</span>
                            </>
                          )}
                        </span>
                      </Button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Basic Information */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
                  <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                    Basic Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-slate-700 font-semibold flex items-center gap-2">
                        <div className="p-1 bg-blue-100 rounded-lg">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className={`h-14 rounded-2xl border-2 transition-all duration-300 ${
                          formErrors.name ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2">
                        <div className="p-1 bg-purple-100 rounded-lg">
                          <Mail className="h-4 w-4 text-purple-600" />
                        </div>
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className={`h-14 rounded-2xl border-2 transition-all duration-300 ${
                          formErrors.email ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-purple-500 hover:border-slate-300'
                        }`}
                        placeholder="Enter your email address"
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Educator Professional Fields */}
              {isEducator && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                      <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                      Professional Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="text-slate-700 font-semibold flex items-center gap-2">
                          <div className="p-1 bg-indigo-100 rounded-lg">
                            <Briefcase className="h-4 w-4 text-indigo-600" />
                          </div>
                          Professional Title
                        </Label>
                        <Input
                          id="title"
                          value={profileData.title}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="e.g., Senior Developer, Math Professor"
                          className="h-14 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 hover:border-slate-300 transition-all duration-300"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="organization" className="text-slate-700 font-semibold flex items-center gap-2">
                          <div className="p-1 bg-purple-100 rounded-lg">
                            <Building2 className="h-4 w-4 text-purple-600" />
                          </div>
                          Organization
                        </Label>
                        <Input
                          id="organization"
                          value={profileData.organization}
                          onChange={(e) => handleFieldChange('organization', e.target.value)}
                          placeholder="e.g., Tech University, ABC Company"
                          className="h-14 rounded-2xl border-2 border-slate-200 focus:border-purple-500 hover:border-slate-300 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
                  <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                    Contact Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-slate-700 font-semibold flex items-center gap-2">
                        <div className="p-1 bg-emerald-100 rounded-lg">
                          <Phone className="h-4 w-4 text-emerald-600" />
                        </div>
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="h-14 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 hover:border-slate-300 transition-all duration-300"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="location" className="text-slate-700 font-semibold flex items-center gap-2">
                        <div className="p-1 bg-green-100 rounded-lg">
                          <MapPin className="h-4 w-4 text-green-600" />
                        </div>
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        placeholder="e.g., New York, USA"
                        className="h-14 rounded-2xl border-2 border-slate-200 focus:border-green-500 hover:border-slate-300 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <Label htmlFor="website" className="text-slate-700 font-semibold flex items-center gap-2">
                      <div className="p-1 bg-teal-100 rounded-lg">
                        <Globe className="h-4 w-4 text-teal-600" />
                      </div>
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className={`h-14 rounded-2xl border-2 transition-all duration-300 ${
                        formErrors.website ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-teal-500 hover:border-slate-300'
                      }`}
                    />
                    {formErrors.website && (
                      <p className="text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {formErrors.website}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio / Learning Profile */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
                  <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                    {isEducator ? 'About You' : 'Learning Profile'}
                  </h4>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="bio" className="text-slate-700 font-semibold flex items-center gap-2">
                        <div className="p-1 bg-indigo-100 rounded-lg">
                          {isEducator ? <FileText className="h-4 w-4 text-indigo-600" /> : <BookOpen className="h-4 w-4 text-indigo-600" />}
                        </div>
                        {isEducator ? 'Professional Bio' : 'About You'}
                      </Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => handleFieldChange('bio', e.target.value)}
                        placeholder={isEducator ? 
                          "Tell us about your background, expertise, and teaching philosophy..." :
                          "Tell us about your background, interests, and learning style..."
                        }
                        rows={4}
                        className="rounded-2xl border-2 border-slate-200 focus:border-indigo-500 hover:border-slate-300 transition-all duration-300 resize-none"
                      />
                    </div>

                    {!isEducator && (
                      <div className="space-y-3">
                        <Label htmlFor="learningGoals" className="text-slate-700 font-semibold flex items-center gap-2">
                          <div className="p-1 bg-blue-100 rounded-lg">
                            <Target className="h-4 w-4 text-blue-600" />
                          </div>
                          Learning Goals
                        </Label>
                        <Textarea
                          id="learningGoals"
                          value={profileData.learningGoals}
                          onChange={(e) => handleFieldChange('learningGoals', e.target.value)}
                          placeholder="What are your learning objectives? What skills do you want to develop?"
                          rows={3}
                          className="rounded-2xl border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-all duration-300 resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-8">
              <div className="text-sm text-slate-500">
                <span className="text-red-500">*</span> Required fields
                {hasUnsavedChanges && (
                  <span className="ml-4 text-amber-600 font-medium">
                    You have unsaved changes
                  </span>
                )}
              </div>

              <Button
                type="submit"
                disabled={saveLoading}
                className="group relative bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                      Save Profile Changes
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 