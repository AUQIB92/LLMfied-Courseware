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
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
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
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        getAuthHeaders,
        updateProfile,
        updateUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
