"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, Mail, Lock, User, UserCheck } from "lucide-react"
import OTPVerification from "./OTPVerification"

export default function AuthForm({ initialMode = "login", onClose }) {
  const [isLogin, setIsLogin] = useState(initialMode === "login")
  const [showOTP, setShowOTP] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "learner",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login, register, setUser } = useAuth()

  // Update mode when initialMode prop changes
  useEffect(() => {
    setIsLogin(initialMode === "login")
  }, [initialMode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isLogin) {
        // Handle login
        const result = await login(formData.email, formData.password)
        if (result.success) {
          if (onClose) {
            onClose()
          }
        } else {
          setError(result.error)
        }
      } else {
        // Handle registration - send OTP
        const response = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name
          }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setShowOTP(true)
        } else {
          setError(data.error || "Failed to send verification code")
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleOTPVerifySuccess = (user) => {
    setUser(user)
    // onClose will be called by OTPVerification component
  }

  const handleBackFromOTP = () => {
    setShowOTP(false)
    setError("")
  }

  // Show OTP verification screen
  if (showOTP) {
    return (
      <OTPVerification
        email={formData.email}
        name={formData.name}
        password={formData.password}
        onVerifySuccess={handleOTPVerifySuccess}
        onBack={handleBackFromOTP}
        onClose={onClose}
      />
    )
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6">
        <div className="text-center">
          <div className="relative group cursor-pointer mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-indigo-600/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-blue-400/15 to-purple-400/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500"></div>
            
            <div className="relative w-16 h-16 bg-gradient-to-br from-white via-blue-50/70 to-purple-50/50 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-700 group-hover:scale-110 border border-white/60 group-hover:border-blue-300/60 overflow-hidden p-2">
              <img 
                src="/uploads/avatars/Logo.png" 
                alt="LLMfied Logo" 
                className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Join LLMfied"}
          </CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            {isLogin ? "Sign in to continue your learning journey" : "Create your account and start learning today"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input 
                id="name" 
                name="name" 
                type="text" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-700 font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Role
              </Label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <span className="text-xl">🎓</span>
                  <span className="font-medium">Learner</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Educator registration is currently disabled. Contact support if you're an educator.
                </p>
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Mail className="w-4 h-4" />
                <span className="font-medium text-sm">Email Verification Required</span>
              </div>
              <p className="text-xs text-green-600">
                We'll send a 6-digit code to your email for verification before creating your account.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200" 
            disabled={loading}
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Send Verification Code"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          
          {isLogin && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">
                <span className="font-medium">Educators:</span> You can sign in with your existing account. 
                For new educator accounts, please contact support.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
