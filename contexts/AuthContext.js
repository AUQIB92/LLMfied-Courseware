"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Refresh user data from server to get latest profile including avatar
        try {
          const response = await fetch("/api/profile", {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (response.ok) {
            const data = await response.json()
            const updatedUser = { ...parsedUser, ...data.user, id: data.user._id || data.user.id }
            setUser(updatedUser)
            localStorage.setItem("user", JSON.stringify(updatedUser))
            
            // Dispatch user update event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }))
            }
          }
        } catch (error) {
          console.warn("Failed to refresh user profile on app load:", error)
          // Keep the existing user data if refresh fails
        }
    }
    setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)
      
      // Automatically refresh user profile to get complete data including avatar
      try {
        await refreshUser()
      } catch (error) {
        console.warn("Failed to refresh user profile after login:", error)
        // Don't fail the login if profile refresh fails
      }
      
      return { success: true }
    }

    return { success: false, error: data.error }
  }

  const register = async (email, password, name, role) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", email, password, name, role }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }
    }

    return { success: false, error: data.error }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const refreshUser = async () => {
    try {
      console.log("Refreshing user profile...")
      const response = await fetch("/api/profile", {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        // Use the complete user data from the API, preserving any existing data
        const updatedUser = { ...user, ...data.user, id: data.user._id || data.user.id }
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        
        // Dispatch user update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }))
        }
        
        console.log("User profile refreshed successfully:", updatedUser)
        return { success: true, user: updatedUser }
      }
      
      console.error("Failed to refresh user profile:", response.status, response.statusText)
      return { success: false, error: "Failed to refresh user data" }
    } catch (error) {
      console.error("Error refreshing user:", error)
      return { success: false, error: "Failed to refresh user data" }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (response.ok) {
        const updatedUser = { ...user, ...data.user }
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        return { success: true, user: updatedUser }
      }

      return { success: false, error: data.error }
    } catch (error) {
      return { success: false, error: "Failed to update profile" }
    }
  }

  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData }
    setUser(newUser)
    localStorage.setItem("user", JSON.stringify(newUser))
    
    // Dispatch a custom event to notify components of user update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: newUser }))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        getAuthHeaders,
        updateProfile,
        updateUser,
        refreshUser,
        loading,
        isAuthenticated: !!user, // Add isAuthenticated property
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
