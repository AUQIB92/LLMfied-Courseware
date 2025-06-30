"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, Mail, Lock, User, UserCheck, ArrowRight } from "lucide-react"
import OTPVerification from "./OTPVerification"

export default function AuthForm({ initialMode = "login", onClose, onShowWaitingList }) {
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
    <Card className="w-full max-w-md border-0 relative overflow-hidden">
      {/* Enhanced Card Background */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl rounded-3xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/30 to-purple-50/50 rounded-3xl"></div>
      
      {/* Subtle floating particles inside card */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-300/30 to-purple-300/30 rounded-full animate-float"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + Math.sin(i) * 40}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${6 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10">
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
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 bg-clip-text text-transparent">
              {isLogin ? "Welcome Back" : "Join LLMfied"}
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2 font-medium">
              {isLogin ? "Sign in to continue your learning journey" : "Create your account and start learning today"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-semibold flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                    <User className="w-3 h-3 text-blue-600" />
                  </div>
                  Full Name
                </Label>
                <Input 
                  id="name" 
                  name="name" 
                  type="text" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/80 backdrop-blur-sm rounded-xl h-12 transition-all duration-300 hover:bg-white/90"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2">
                <div className="p-1 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                  <Mail className="w-3 h-3 text-purple-600" />
                </div>
                Email
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/80 backdrop-blur-sm rounded-xl h-12 transition-all duration-300 hover:bg-white/90"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2">
                <div className="p-1 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
                  <Lock className="w-3 h-3 text-emerald-600" />
                </div>
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/80 backdrop-blur-sm rounded-xl h-12 transition-all duration-300 hover:bg-white/90"
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 font-semibold flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg">
                    <UserCheck className="w-3 h-3 text-indigo-600" />
                  </div>
                  Role
                </Label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl blur-sm"></div>
                  <div className="relative p-4 bg-white/80 backdrop-blur-sm border border-blue-200/60 rounded-xl">
                    <div className="flex items-center gap-3 text-blue-700">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                        <span className="text-lg">🎓</span>
                      </div>
                      <span className="font-bold">Learner</span>
                    </div>
                    <div className="mt-2 space-y-3">
                      <p className="text-sm text-blue-600/80 font-medium">
                        Educator registration is currently disabled. 
                      </p>
                      <div className="text-sm">
                        <span className="text-blue-700 font-semibold">Are you an educator? </span>
                        <button
                          type="button"
                          onClick={() => onShowWaitingList && onShowWaitingList()}
                          className="text-emerald-600 hover:text-emerald-700 font-bold underline decoration-emerald-300 hover:decoration-emerald-500 transition-all duration-300"
                        >
                          Join our exclusive waiting list
                        </button>
                        <span className="text-blue-600/80"> for priority access to AI teaching tools!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-xl blur-sm"></div>
                <div className="relative p-4 bg-white/80 backdrop-blur-sm border border-green-200/60 rounded-xl">
                  <div className="flex items-center gap-3 text-green-700 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="font-bold text-sm">Email Verification Required</span>
                  </div>
                  <p className="text-xs text-green-600/80 font-medium">
                    We'll send a 6-digit code to your email for verification before creating your account.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-pink-50/50 rounded-xl blur-sm"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold py-4 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group overflow-hidden border border-white/20 rounded-xl h-12" 
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Send Verification Code"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="relative group text-blue-600 hover:text-blue-800 text-sm font-semibold transition-all duration-300 px-4 py-2 rounded-xl hover:bg-blue-50/80"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </span>
            </button>
            
            {isLogin && (
              <div className="mt-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-xl blur-sm"></div>
                <div className="relative p-3 bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-xl">
                  <div className="text-sm text-emerald-700 font-medium space-y-2">
                    <p>
                      <span className="font-bold">Educators:</span> You can sign in with your existing account.
                    </p>
                    <p>
                      <span className="font-semibold">New educator? </span>
                      <button
                        type="button"
                        onClick={() => onShowWaitingList && onShowWaitingList()}
                        className="text-emerald-800 hover:text-emerald-900 font-bold underline decoration-emerald-400 hover:decoration-emerald-600 transition-all duration-300"
                      >
                        Join our waiting list
                      </button>
                      <span> for exclusive early access!</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
