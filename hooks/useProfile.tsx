import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"

export interface Preferences {
  darkMode?: boolean
  emailNotifications?: boolean
  pushNotifications?: boolean
  [key: string]: any
}

export interface Notifications {
  // shape can grow – keep it generic for now
  [key: string]: any
}

export interface ProfileData {
  name?: string
  email?: string
  avatar?: string
  role?: string
  // any other user fields
  [key: string]: any
}

interface UseProfileReturn {
  profile: ProfileData | null
  preferences: Preferences | null
  notifications: Notifications | null
  refresh: () => Promise<void>
  updateProfile: (updates: Partial<ProfileData>) => Promise<boolean>
  updatePreferences: (prefs: Partial<Preferences>) => Promise<boolean>
  updateNotifications: (notif: Partial<Notifications>) => Promise<boolean>
}

export function useProfile(): UseProfileReturn {
  const {
    user,
    updateProfile: ctxUpdateProfile,
    getAuthHeaders,
    refreshUser,
  } = useAuth()

  const [profile, setProfile] = useState<ProfileData | null>(user ?? null)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [notifications, setNotifications] = useState<Notifications | null>(null)

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/preferences", { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPreferences(data)
      }
    } catch (err) {
      console.error("Failed to fetch preferences", err)
    }
  }, [getAuthHeaders])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/notifications", { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err)
    }
  }, [getAuthHeaders])

  const refresh = useCallback(async () => {
    await refreshUser()
    if (user) setProfile(user)
    await Promise.all([fetchPreferences(), fetchNotifications()])
  }, [refreshUser, user, fetchPreferences, fetchNotifications])

  // initial load
  useEffect(() => {
    setProfile(user ?? null)
  }, [user])

  useEffect(() => {
    fetchPreferences()
    fetchNotifications()
  }, [fetchPreferences, fetchNotifications])

  const updatePreferences = async (prefs: Partial<Preferences>) => {
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(prefs)
      })
      if (res.ok) {
        setPreferences((prev) => ({ ...(prev ?? {}), ...prefs }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  }

  const updateNotifications = async (notif: Partial<Notifications>) => {
    try {
      const res = await fetch("/api/profile/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(notif)
      })
      if (res.ok) {
        setNotifications((prev) => ({ ...(prev ?? {}), ...notif }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  }

  const updateProfile = async (updates: Partial<ProfileData>) => {
    const result = await ctxUpdateProfile(updates)
    if (result.success) {
      setProfile((prev) => ({ ...(prev ?? {}), ...updates }))
      return true
    }
    return false
  }

  return { profile, preferences, notifications, refresh, updateProfile, updatePreferences, updateNotifications }
} 