"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AuthForm from "@/components/AuthForm"
import {
  BookOpen,
  Users,
  Brain,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Sparkles,
  GraduationCap,
  ChevronRight,
  LogIn,
  UserPlus,
  Star,
  Play,
} from "lucide-react"

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState("login") // 'login' or 'signup'

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={() => setShowAuth(false)}
                className="mb-4 text-slate-600 hover:text-slate-900"
              >
                ← Back to Home
              </Button>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {authMode === "login" ? "Welcome Back" : "Join LLMfied"}
              </h2>
              <p className="text-slate-600">
                {authMode === "login" 
                  ? "Sign in to continue your learning journey" 
                  : "Create your account and start learning today"}
              </p>
            </div>
            <AuthForm initialMode={authMode} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  LLMfied
                </span>
                <p className="text-xs text-slate-500 -mt-1">AI-Powered Education</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                className="text-slate-600 hover:text-slate-900 hidden md:flex"
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                className="text-slate-600 hover:text-slate-900 hidden md:flex"
              >
                About
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAuthMode("login")
                    setShowAuth(true)
                  }}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    setAuthMode("signup")
                    setShowAuth(true)
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-60"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-10 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 px-6 py-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                Next-Generation Learning Platform
              </Badge>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight">
              Transform Learning with
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block mt-2">
                AI-Powered Education
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Revolutionize your educational experience with cutting-edge AI technology. Whether you're an educator or
              learner, unlock the full potential of personalized, intelligent learning.
            </p>
            
            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                size="lg"
                onClick={() => {
                  setAuthMode("signup")
                  setShowAuth(true)
                }}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 px-12 py-4 text-lg font-semibold rounded-full group"
              >
                <UserPlus className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                Start Learning Today
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setAuthMode("login")
                  setShowAuth(true)
                }}
                className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-12 py-4 text-lg font-semibold rounded-full transition-all duration-300 group"
              >
                <LogIn className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                Sign In
              </Button>
              
              <Button
                size="lg"
                variant="ghost"
                className="text-slate-600 hover:text-slate-900 px-8 py-4 text-lg font-semibold group"
              >
                <Play className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>
            
            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-slate-600">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-medium ml-2">Trusted by 10,000+ learners</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-green-600">✓ Free to get started</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-blue-600">✓ No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Why Choose LLMfied?</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Experience the future of education with our comprehensive AI-powered platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Learning",
                description:
                  "Leverage advanced language models to create personalized learning experiences tailored to each student's needs.",
              },
              {
                icon: Users,
                title: "Collaborative Platform",
                description:
                  "Connect educators and learners in a seamless environment designed for knowledge sharing and growth.",
              },
              {
                icon: BookOpen,
                title: "Rich Content Library",
                description:
                  "Access a vast collection of educational resources, all enhanced with AI-driven insights and recommendations.",
              },
              {
                icon: Zap,
                title: "Instant Feedback",
                description: "Get real-time feedback and assessments powered by AI to accelerate learning progress.",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description:
                  "Your data is protected with enterprise-grade security while maintaining complete privacy.",
              },
              {
                icon: TrendingUp,
                title: "Progress Tracking",
                description:
                  "Monitor learning progress with detailed analytics and insights to optimize educational outcomes.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="feature-card border-slate-200 hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-2xl group"
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 animate-float" style={{animationDelay: `${index * 0.2}s`}}>
                    <feature.icon className="w-8 h-8 text-blue-600 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-900 transition-colors">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 bg-green-100 text-green-700 border-green-200">
                For Educators
              </Badge>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">Empower Your Teaching with AI</h3>
              <div className="space-y-4">
                {[
                  "Create engaging, personalized curricula in minutes",
                  "Generate assessments and quizzes automatically",
                  "Track student progress with detailed analytics",
                  "Access AI-powered teaching recommendations",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="w-full h-64 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-16 h-16 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of educators and learners who are already experiencing the future of education.
            Start your journey today with our AI-powered platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              onClick={() => {
                setAuthMode("signup")
                setShowAuth(true)
              }}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-3xl transition-all duration-300 px-12 py-4 text-lg font-semibold rounded-full group"
            >
              <UserPlus className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
              Get Started Free
              <ChevronRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setAuthMode("login")
                setShowAuth(true)
              }}
              className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-12 py-4 text-lg font-semibold rounded-full transition-all duration-300 group backdrop-blur-sm"
            >
              <LogIn className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
              Sign In
            </Button>
          </div>
          
          <div className="mt-8 text-blue-100 text-sm">
            <span className="font-medium">✓ No credit card required</span>
            <span className="mx-4">•</span>
            <span className="font-medium">✓ Start learning immediately</span>
            <span className="mx-4">•</span>
            <span className="font-medium">✓ Join 10,000+ learners</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">LLMfied</span>
            </div>
            <div className="text-center md:text-right">
              <p>&copy; 2024 LLMfied. All rights reserved.</p>
              <p className="text-sm text-slate-400 mt-1">Education in the LLM Era</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
