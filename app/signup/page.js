"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  Lock,
  User,
  Sparkles,
  Shield,
  Zap,
  Heart,
  BookOpen,
  Users,
  CheckCircle,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "learner" // 'learner' or 'educator'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic validation
    if (!formData.name.trim()) {
      setError("Name is required")
      setIsLoading(false)
      return
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      setIsLoading(false)
      return
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          ...formData
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Registration successful
        router.push("/")
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float animation-delay-1000"></div>
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEyOCwgMTQzLCAxNjAsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 animate-float`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation Header */}
      <nav className="relative z-50">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
        <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-4 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-600/20 to-indigo-600/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-blue-400/15 to-purple-400/20 rounded-3xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500"></div>
                  
                  <div className="relative w-12 h-12 bg-gradient-to-br from-white via-blue-50/70 to-purple-50/50 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 border border-white/60 group-hover:border-blue-300/60 overflow-hidden p-1.5">
                    <img 
                      src="/uploads/avatars/Logo.png" 
                      alt="LLMfied Logo" 
                      className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  LLMfied
                </span>
              </Link>

              {/* Back to Home */}
              <Link href="/">
                <Button variant="ghost" className="text-slate-700 hover:text-blue-600 font-semibold">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Badge className="bg-white/90 backdrop-blur-sm text-slate-800 border border-white/50 px-6 py-2 text-sm font-bold shadow-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Join the Revolution
                  </span>
                </div>
              </Badge>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-4 leading-tight tracking-tight">
              Start Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-gradient-x">
                Learning Journey
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of learners and educators already transforming education with AI
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Signup Form */}
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden animate-fade-in-up">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-center text-slate-900 mb-2">
                  Create Your Account
                </CardTitle>
                <p className="text-slate-600 text-center">
                  Choose your path and get started in seconds
                </p>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                {/* Role Selection */}
                <div className="mb-6">
                  <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                    I want to:
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: 'learner'})}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center space-y-2 ${
                        formData.role === 'learner'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <BookOpen className={`w-8 h-8 ${formData.role === 'learner' ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className={`font-semibold ${formData.role === 'learner' ? 'text-blue-700' : 'text-slate-700'}`}>
                        Learn
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: 'educator'})}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center space-y-2 ${
                        formData.role === 'educator'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Users className={`w-8 h-8 ${formData.role === 'educator' ? 'text-purple-600' : 'text-slate-500'}`} />
                      <span className={`font-semibold ${formData.role === 'educator' ? 'text-purple-700' : 'text-slate-700'}`}>
                        Teach
                      </span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      Full Name
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email Address
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Password
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Create a password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                      Confirm Password
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group relative overflow-hidden"
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                      
                      <div className="relative z-10 flex items-center justify-center">
                        {isLoading ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                            Create Account
                            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </div>
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Button>
                  </div>
                </form>

                {/* Login Link */}
                <div className="text-center mt-6 pt-6 border-t border-slate-200">
                  <p className="text-slate-600">
                    Already have an account?{" "}
                    <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Section */}
            <div className="space-y-8 animate-slide-in-right">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Why Join LLMfied?
                </h3>
                
                <div className="space-y-4">
                  {[
                    {
                      icon: Zap,
                      title: "Instant Access",
                      description: "Start learning or teaching immediately after signup",
                      color: "from-yellow-500 to-orange-500"
                    },
                    {
                      icon: Shield,
                      title: "Secure & Private",
                      description: "Your data is protected with enterprise-grade security",
                      color: "from-green-500 to-emerald-500"
                    },
                    {
                      icon: Heart,
                      title: "Free to Start",
                      description: "No credit card required. Upgrade when you're ready",
                      color: "from-pink-500 to-rose-500"
                    },
                    {
                      icon: CheckCircle,
                      title: "Proven Results",
                      description: "Join 10,000+ users already transforming their learning",
                      color: "from-blue-500 to-indigo-500"
                    }
                  ].map((benefit, index) => {
                    const Icon = benefit.icon
                    return (
                      <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/50 hover:bg-white/70 transition-all duration-300">
                        <div className={`w-12 h-12 bg-gradient-to-r ${benefit.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">{benefit.title}</h4>
                          <p className="text-slate-600 text-sm">{benefit.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-white/50 backdrop-blur-sm border border-white/50 rounded-2xl p-6">
                <div className="text-center">
                  <div className="flex justify-center space-x-2 mb-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ))}
                  </div>
                  <p className="text-lg font-semibold text-slate-900">10,000+ Happy Users</p>
                  <p className="text-slate-600 text-sm">Join the community transforming education</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
