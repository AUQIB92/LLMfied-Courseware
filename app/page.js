"use client"

import { useAuth } from "@/contexts/AuthContext"
import EducatorDashboard from "@/components/educator/EducatorDashboard"
import LearnerDashboard from "@/components/learner/LearnerDashboard"
import AuthForm from "@/components/AuthForm"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Lightbulb,
  Rocket,
  Globe,
  Award,
  Heart,
  Clock,
  Mail,
  X,
  Menu,
  ChevronDown,
  MessageCircle
} from "lucide-react"

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState("login") // 'login' or 'signup'
  const [showDemo, setShowDemo] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Waiting List State
  const [showWaitingList, setShowWaitingList] = useState(false)
  const [waitingListData, setWaitingListData] = useState({
    name: '',
    email: '',
    institution: '',
    experience: '',
    interests: ''
  })
  const [waitingListSubmitting, setWaitingListSubmitting] = useState(false)

  // Feedback Form State
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    type: 'general',
    message: '',
    rating: 5
  })
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Data Scientist",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
      content: "LLMfied has completely transformed how I learn programming. The AI-powered explanations make complex concepts so much easier to understand!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      image: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200",
      content: "As an educator, I've been able to create engaging courses that adapt to each student's needs. The platform's AI tools have revolutionized how I teach programming.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "UX Designer",
      image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200",
      content: "The interactive visualizations and personalized learning paths made complex design concepts click for me. I've recommended LLMfied to my entire team!",
      rating: 4
    }
  ]

  // Effects
  useEffect(() => {
    setIsClient(true) // Set client flag after hydration
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Scroll handler for header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)

      // Show/hide header based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setHeaderVisible(false)
      } else {
        // Scrolling up or at top
        setHeaderVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Helper functions
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  // Handler Functions for Forms
  const handleWaitingListSubmit = async (e) => {
    e.preventDefault()
    setWaitingListSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Waiting List Submission:', waitingListData)
      
      // Show success message
      alert('Thank you for joining our educator waiting list! We\'ll be in touch soon with early access information.')
      
      // Reset form
      setWaitingListData({
        name: '',
        email: '',
        institution: '',
        experience: '',
        interests: ''
      })
      setShowWaitingList(false)
      
    } catch (error) {
      console.error('Waiting list submission error:', error)
      alert('There was an error submitting your information. Please try again.')
    } finally {
      setWaitingListSubmitting(false)
    }
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    setFeedbackSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Feedback Submission:', feedbackData)
      
      // Show success message
      alert('Thank you for your feedback! We really appreciate your input and will use it to improve our platform.')
      
      // Reset form
      setFeedbackData({
        name: '',
        email: '',
        type: 'general',
        message: '',
        rating: 5
      })
      setShowFeedback(false)
      
    } catch (error) {
      console.error('Feedback submission error:', error)
      alert('There was an error submitting your feedback. Please try again.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  // Authentication logic
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-opacity-50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading...</h3>
          <p className="text-slate-600">Please wait while we load your dashboard</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return user.role === "educator" ? <EducatorDashboard /> : <LearnerDashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Enhanced Breathtaking Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        {/* Breathtaking Glassmorphism Navigation */}
        <div className={`relative transition-all duration-500 ${
          scrollY > 50 
            ? 'bg-white/95 backdrop-blur-3xl shadow-2xl shadow-slate-900/20 border-b border-white/30' 
            : 'bg-white/85 backdrop-blur-2xl shadow-xl shadow-slate-900/10 border-b border-white/20'
        }`}>
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 animate-gradient-x"></div>
          
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {isClient && [...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full animate-float"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${20 + Math.sin(i) * 60}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${4 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          <div className="container mx-auto px-6 lg:px-8 relative z-10">
            <div className="flex items-center justify-between h-20">
              {/* Beautiful Logo with Theme Integration */}
              <div className="flex items-center space-x-4 group cursor-pointer">
                <div className="relative">
                  {/* Logo Container with Theme Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-indigo-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-blue-400/15 to-purple-400/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500"></div>
                  
                  <div className="relative w-16 h-16 bg-gradient-to-br from-white via-blue-50/70 to-purple-50/50 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-700 group-hover:scale-110 border border-white/60 group-hover:border-blue-300/60 overflow-hidden p-2">
                    
                    {/* Logo Image */}
                    <img 
                      src="/uploads/avatars/Logo.png" 
                      alt="LLMfied Logo" 
                      className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 rounded-xl"
                    />
                    
                    {/* Subtle theme overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-indigo-700 transition-all duration-500 group-hover:scale-105">
                    LLMfied
                  </span>
                  <span className="text-xs font-medium bg-gradient-to-r from-slate-600 via-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-indigo-500 -mt-0.5 tracking-wider transition-all duration-500 leading-none">
                    DEMYSTIFY • REIMAGINE • DELIVER
                  </span>
                </div>
              </div>

              {/* Enhanced Navigation Links */}
              <div className="hidden lg:flex items-center space-x-2">
                <nav className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    className="relative text-slate-600 hover:text-blue-600 font-semibold px-6 py-3 rounded-2xl hover:bg-blue-50/60 transition-all duration-500 group overflow-hidden"
                    onClick={() => scrollToSection('features')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    Features
                    </span>
                    <div className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover:w-2/3 group-hover:left-1/6 transition-all duration-500"></div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="relative text-slate-600 hover:text-purple-600 font-semibold px-6 py-3 rounded-2xl hover:bg-purple-50/60 transition-all duration-500 group overflow-hidden"
                    onClick={() => scrollToSection('about')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    About
                    </span>
                    <div className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 group-hover:w-2/3 group-hover:left-1/6 transition-all duration-500"></div>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="relative text-slate-600 hover:text-emerald-600 font-semibold px-6 py-3 rounded-2xl hover:bg-emerald-50/60 transition-all duration-500 group overflow-hidden"
                    onClick={() => setShowDemo(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      <Play className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    Demo
                    </span>
                    <div className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 group-hover:w-2/3 group-hover:left-1/6 transition-all duration-500"></div>
                  </Button>
                </nav>

                {/* Spectacular Auth Button */}
                <div className="flex items-center ml-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-all duration-700"></div>
                  <Button
                    onClick={() => {
                        setAuthMode("signup")
                      setShowAuth(true)
                    }}
                      className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold px-8 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group overflow-hidden border border-white/20"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                      <span className="relative z-10 flex items-center gap-2">
                        <Rocket className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                        Get Started
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Button>
                  </div>
                </div>
              </div>

              {/* Enhanced Mobile Menu Button */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  className="relative p-3 rounded-2xl hover:bg-slate-100/80 transition-all duration-300 group"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <div className="w-6 h-6 flex flex-col justify-center space-y-1.5 relative">
                    <div className={`w-full h-0.5 bg-slate-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
                    <div className={`w-full h-0.5 bg-slate-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></div>
                    <div className={`w-full h-0.5 bg-slate-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <div className={`lg:hidden transition-all duration-500 overflow-hidden ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-6 py-4 bg-white/95 backdrop-blur-xl border-t border-white/30">
              <div className="flex flex-col space-y-4">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-600 hover:text-blue-600 font-medium"
                  onClick={() => scrollToSection('features')}
                >
                  <Sparkles className="w-4 h-4 mr-3" />
                  Features
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-600 hover:text-purple-600 font-medium"
                  onClick={() => scrollToSection('about')}
                >
                  <BookOpen className="w-4 h-4 mr-3" />
                  About
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-600 hover:text-emerald-600 font-medium"
                  onClick={() => setShowDemo(true)}
                >
                  <Play className="w-4 h-4 mr-3" />
                  Demo
                </Button>
                <div className="pt-4 border-t border-slate-200">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    onClick={() => {
                      setAuthMode("signup")
                      setShowAuth(true)
                    }}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dynamic progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-20">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${Math.min((scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100, 100)}%` }}
          ></div>
        </div>
      </nav>

      {/* Revolutionary Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
        {/* Dynamic Background */}
        <div className="absolute inset-0">
          {/* Gradient Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100"></div>
          
          {/* Animated Orbs */}
          <div className="absolute top-32 left-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-52 right-20 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float animation-delay-1000"></div>
          <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEyOCwgMTQzLCAxNjAsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          
          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {isClient && [...Array(20)].map((_, i) => (
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
        
        {/* Hero Content */}
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Announcement Badge */}
            <div className="flex justify-center mb-16">
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
    <Badge className="relative bg-white/90 backdrop-blur-sm text-slate-800 border border-white/50 px-8 py-3 text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center space-x-3">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent font-extrabold">
          Next-Generation AI Learning Platform
        </span>
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
      </div>
    </Badge>
  </div>
</div>
            
            {/* Main Headline */}
            <div className="mb-16">
  <h1 className="text-5xl lg:text-7xl xl:text-8xl font-black text-slate-900 tracking-tight">
                <span className="block mb-6 leading-none">Transform</span>
                <span className="block relative leading-[1.2] mb-16 font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
      <span className="inline-block align-baseline">Learning Forever</span>
    </span>
    <span className="block text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-600 leading-snug">
      with AI-Powered Education
    </span>
  </h1>
</div>
            
            {/* Subtitle */}
            <div className="mb-16">
              <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                Revolutionize your educational journey with cutting-edge artificial intelligence. 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold">
                  {" "}Whether you're an educator or learner
                </span>
                , unlock personalized, intelligent learning experiences that adapt to your unique style.
              </p>
            </div>
            
            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24">
              {/* Primary CTA */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <Button
                  size="lg"
                  onClick={() => {
                    setAuthMode("signup")
                    setShowAuth(true)
                  }}
                  className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                  <div className="relative z-10 flex items-center">
                    <Rocket className="mr-4 w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    Start Your Journey
                    <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>
              </div>
              
              {/* Secondary CTA */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowDemo(true)}
                className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-12 py-6 text-xl font-bold rounded-2xl transition-all duration-300 group backdrop-blur-sm bg-white/50 hover:bg-white/80 shadow-lg hover:shadow-xl"
              >
                <Play className="mr-4 w-6 h-6 group-hover:scale-110 transition-transform duration-300 text-blue-600" />
                Watch Demo
              </Button>
            </div>
            
            {/* Enhanced Social Proof */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-600 max-w-4xl mx-auto">
              <div className="flex flex-col items-center group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full border-3 border-white flex items-center justify-center transform hover:scale-110 transition-transform duration-300 hover:z-10 shadow-lg">
                        <Star className="w-5 h-5 text-white fill-current" />
                      </div>
                    ))}
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-lg font-bold text-slate-800 mb-1">10,000+ Active Learners</span>
                <span className="text-sm text-slate-500">Growing daily</span>
              </div>
              
              <div className="flex flex-col items-center group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-black text-green-600">✓</div>
                </div>
                <span className="text-lg font-bold text-slate-800 mb-1">Free to Start</span>
                <span className="text-sm text-slate-500">No credit card required</span>
              </div>
              
              <div className="flex flex-col items-center group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-black text-blue-600">⚡</div>
                </div>
                <span className="text-lg font-bold text-slate-800 mb-1">Instant Access</span>
                <span className="text-sm text-slate-500">Start learning immediately</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Enhanced Breathtaking Features Section */}
      <section id="features" className="py-28 relative overflow-hidden">
        {/* Stunning Background with Multiple Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/80 to-purple-50/60"></div>
        
        {/* Animated Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-indigo-400/10 animate-gradient-x"></div>
        
        {/* Dynamic Floating Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float opacity-60"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float opacity-70" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-float opacity-50" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-teal-400/15 rounded-full blur-3xl animate-float opacity-60" style={{animationDelay: '1s'}}></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {isClient && [...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float opacity-40"
              style={{
                background: `linear-gradient(45deg, ${['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 6]}, ${['#1d4ed8', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'][i % 6]})`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${4 + Math.random() * 6}s`
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          {/* Enhanced Section Header */}
          <div className="text-center mb-20">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-xl"></div>
              <Badge className="relative bg-white/90 backdrop-blur-xl text-purple-800 border border-purple-200/50 px-8 py-4 text-sm font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">
                    Revolutionary Features
                  </span>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                </div>
            </Badge>
            </div>
            
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 leading-tight">
              <span className="block mb-4">Why Choose</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
                LLMfied?
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
              Experience the future of education with our 
              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> comprehensive AI-powered platform</span>
            </p>
          </div>

          {/* Stunning Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                icon: Brain,
                title: "AI-Powered Learning",
                description: "Leverage advanced language models to create personalized learning experiences tailored to each student's unique needs and learning style.",
                primaryColor: "blue",
                gradientFrom: "from-blue-500",
                gradientTo: "to-blue-600",
                bgGradient: "from-blue-50/50 to-blue-100/30",
                glowColor: "blue-500/30",
                delay: 0
              },
              {
                icon: Users,
                title: "Collaborative Platform",
                description: "Connect educators and learners in a seamless environment designed for knowledge sharing, growth, and community building.",
                primaryColor: "purple",
                gradientFrom: "from-purple-500",
                gradientTo: "to-purple-600",
                bgGradient: "from-purple-50/50 to-purple-100/30",
                glowColor: "purple-500/30",
                delay: 0.1
              },
              {
                icon: BookOpen,
                title: "Rich Content Library",
                description: "Access a vast collection of educational resources, all enhanced with AI-driven insights and personalized recommendations.",
                primaryColor: "indigo",
                gradientFrom: "from-indigo-500",
                gradientTo: "to-indigo-600",
                bgGradient: "from-indigo-50/50 to-indigo-100/30",
                glowColor: "indigo-500/30",
                delay: 0.2
              },
              {
                icon: Zap,
                title: "Instant Feedback",
                description: "Get real-time feedback and intelligent assessments powered by AI to accelerate learning progress and understanding.",
                primaryColor: "cyan",
                gradientFrom: "from-cyan-500",
                gradientTo: "to-cyan-600",
                bgGradient: "from-cyan-50/50 to-cyan-100/30",
                glowColor: "cyan-500/30",
                delay: 0.3
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is protected with enterprise-grade security while maintaining complete privacy and user control.",
                primaryColor: "teal",
                gradientFrom: "from-teal-500",
                gradientTo: "to-teal-600",
                bgGradient: "from-teal-50/50 to-teal-100/30",
                glowColor: "teal-500/30",
                delay: 0.4
              },
              {
                icon: TrendingUp,
                title: "Progress Tracking",
                description: "Monitor learning progress with detailed analytics and insights to optimize educational outcomes and achievements.",
                primaryColor: "violet",
                gradientFrom: "from-violet-500",
                gradientTo: "to-violet-600",
                bgGradient: "from-violet-50/50 to-violet-100/30",
                glowColor: "violet-500/30",
                delay: 0.5
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group relative animate-fade-in-up"
                  style={{animationDelay: `${feature.delay}s`}}
                >
                  {/* Multi-layered Glow Effects */}
                  <div className={`absolute -inset-2 bg-gradient-to-r ${feature.gradientFrom} ${feature.gradientTo} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-700`}></div>
                  <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradientFrom} ${feature.gradientTo} rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-500`}></div>
                  
                  {/* Main Card Container */}
                  <div className="relative h-full">
                    {/* Premium Glassmorphism Card */}
                    <Card className="relative h-full border border-white/20 bg-white/90 backdrop-blur-2xl shadow-xl hover:shadow-2xl transition-all duration-700 rounded-3xl overflow-hidden group-hover:scale-[1.03] group-hover:-translate-y-3">
                      {/* Animated Background Layers */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-all duration-700`}></div>
                      <div className={`absolute inset-0 bg-gradient-to-tr ${feature.gradientFrom} ${feature.gradientTo} opacity-0 group-hover:opacity-5 transition-all duration-1000`}></div>
                      
                      {/* Subtle Border Animation */}
                      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" style={{background: `linear-gradient(135deg, ${feature.primaryColor === 'blue' ? '#3b82f6' : feature.primaryColor === 'purple' ? '#8b5cf6' : feature.primaryColor === 'indigo' ? '#6366f1' : feature.primaryColor === 'cyan' ? '#06b6d4' : feature.primaryColor === 'teal' ? '#14b8a6' : '#8b5cf6'}22, transparent, ${feature.primaryColor === 'blue' ? '#3b82f6' : feature.primaryColor === 'purple' ? '#8b5cf6' : feature.primaryColor === 'indigo' ? '#6366f1' : feature.primaryColor === 'cyan' ? '#06b6d4' : feature.primaryColor === 'teal' ? '#14b8a6' : '#8b5cf6'}22)`, padding: '1px'}}>
                        <div className="w-full h-full bg-white/90 backdrop-blur-2xl rounded-3xl"></div>
                    </div>
                    
                      <CardContent className="relative p-10 lg:p-12 h-full flex flex-col">
                        {/* Enhanced Icon Container */}
                        <div className="relative mb-10">
                          {/* Icon Glow Background */}
                          <div className={`absolute -inset-2 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500`}></div>
                          
                          {/* Icon Container */}
                          <div className={`relative w-24 h-24 bg-gradient-to-br ${feature.bgGradient} rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl border border-white/50 group-hover:border-white/80`}>
                            {/* Inner Glow */}
                            <div className={`absolute inset-3 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} opacity-10 group-hover:opacity-20 transition-all duration-300 rounded-2xl`}></div>
                            
                            {/* Icon */}
                            <Icon className={`relative w-12 h-12 text-${feature.primaryColor}-600 group-hover:scale-110 transition-all duration-300 drop-shadow-lg`} />
                            
                            {/* Floating Particles */}
                            <div className={`absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r ${feature.gradientFrom} ${feature.gradientTo} rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-opacity duration-500`}></div>
                            <div className={`absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r ${feature.gradientFrom} ${feature.gradientTo} rounded-full opacity-0 group-hover:opacity-80 animate-bounce transition-opacity duration-700`} style={{animationDelay: '0.3s'}}></div>
                            <div className={`absolute top-1/2 -right-3 w-2 h-2 bg-gradient-to-r ${feature.gradientFrom} ${feature.gradientTo} rounded-full opacity-0 group-hover:opacity-60 animate-pulse transition-opacity duration-600`} style={{animationDelay: '0.6s'}}></div>
                          </div>
                        </div>
                        
                        {/* Enhanced Typography */}
                        <div className="flex-1 space-y-6">
                          <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 leading-tight">
                            {feature.title}
                          </h3>
                          <p className="text-slate-600 group-hover:text-slate-700 leading-relaxed text-lg transition-all duration-300">
                            {feature.description}
                          </p>
                        </div>
                        
                        {/* Interactive Call-to-Action */}
                        <div className="mt-10 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-6 group-hover:translate-y-0">
                          <div className={`inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r ${feature.gradientFrom} ${feature.gradientTo} text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer`}>
                            <span>Explore Feature</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </div>
                        
                        {/* Subtle Decorative Elements */}
                        <div className={`absolute top-10 right-10 w-20 h-20 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-all duration-700 group-hover:scale-125`}></div>
                        <div className={`absolute bottom-10 left-10 w-14 h-14 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-all duration-700 group-hover:scale-150`}></div>
                        
                        {/* Premium Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1200 rounded-3xl"></div>
                        
                        {/* Radial Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-radial from-${feature.glowColor} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl`}></div>
                  </CardContent>
                </Card>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Enhanced Call-to-Action */}
          <div className="text-center mt-20">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-30"></div>
              <Button
                size="lg"
                onClick={() => {
                  setAuthMode("signup")
                  setShowAuth(true)
                }}
                className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 group overflow-hidden border border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                <span className="relative z-10 flex items-center gap-3">
                  <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  Experience All Features
                  <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-28 bg-gradient-to-br from-indigo-50 via-blue-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center opacity-5"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-8 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 px-6 py-2 text-sm font-semibold">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Success Stories
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-8">What Our Users Say</h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied learners and educators who have transformed their educational experience
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative min-h-[400px]">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={`testimonial-card transition-all duration-500 transform ${
                    activeTestimonial === index 
                      ? 'opacity-100 translate-y-0 scale-100 relative' 
                      : 'opacity-0 translate-y-8 scale-95 absolute inset-0'
                  }`}
                >
                  <div className="p-10 rounded-3xl bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-start gap-8">
                      <div className="flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-lg"></div>
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg transform hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-6">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-6 h-6 transition-colors duration-300 ${i < testimonial.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                          <Badge className="ml-4 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 px-3 py-1">
                            Verified User
                          </Badge>
                        </div>
                        <p className="text-xl text-slate-700 italic mb-8 leading-relaxed font-medium">"{testimonial.content}"</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xl mb-1">{testimonial.name}</h4>
                            <p className="text-slate-600 font-medium">{testimonial.role}</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="bg-white/80 border-gray-300 px-3 py-1">
                              ⭐ {testimonial.rating}/5
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-12 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    activeTestimonial === index 
                      ? 'bg-blue-600 w-12' 
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="py-28 bg-white/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/80 to-green-50/50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="animate-fade-in-up">
              <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-4 py-1 text-sm font-semibold">
                <Rocket className="w-3 h-3 mr-1" />
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
                  <div key={index} className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-700 group-hover:text-slate-900 transition-colors duration-300">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                className="mt-8 cta-button"
                onClick={() => {
                  setAuthMode("signup")
                  setShowAuth(true)
                }}
              >
                <UserPlus className="mr-2 w-5 h-5" />
                Start Teaching Today
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-2xl border border-white/50 animate-fade-in-up stagger-1 hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-2xl"></div>
                <img 
                  src="https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Educator using LLMfied"
                  className="w-full h-auto rounded-2xl shadow-lg relative z-10 object-cover hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-6 animate-float hover:rotate-12 transition-transform duration-300">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                {/* Overlay with stats */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 flex items-end">
                  <div className="p-6 text-white">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">500+</div>
                        <div className="text-xs opacity-90">Courses Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">10k+</div>
                        <div className="text-xs opacity-90">Students Reached</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learner Benefits Section */}
      <section className="py-28 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center opacity-5"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 shadow-2xl border border-white/50 animate-fade-in-up hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-2xl"></div>
                <img 
                  src="https://images.pexels.com/photos/5905885/pexels-photo-5905885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Learner using LLMfied"
                  className="w-full h-auto rounded-2xl shadow-lg relative z-10 object-cover hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6 animate-float hover:-rotate-12 transition-transform duration-300">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                {/* Overlay with stats */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 flex items-end">
                  <div className="p-6 text-white">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">98%</div>
                        <div className="text-xs opacity-90">Completion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">4.9/5</div>
                        <div className="text-xs opacity-90">Satisfaction</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 animate-fade-in-up stagger-1">
              <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-4 py-1 text-sm font-semibold">
                <Lightbulb className="w-3 h-3 mr-1" />
                For Learners
              </Badge>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">Accelerate Your Learning Journey</h3>
              <div className="space-y-4">
                {[
                  "Personalized learning paths tailored to your goals",
                  "Interactive content with AI-powered explanations",
                  "Real-time feedback and progress tracking",
                  "Connect with peers and experts in your field",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-700 group-hover:text-slate-900 transition-colors duration-300">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 rounded-xl font-semibold"
                onClick={() => {
                  setAuthMode("signup")
                  setShowAuth(true)
                }}
              >
                <Rocket className="mr-2 w-5 h-5" />
                Start Learning Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Educator Waiting List Section */}
      <section className="py-28 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-green-400/10 to-teal-400/10 animate-gradient-x"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {isClient && [...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float opacity-40"
              style={{
                background: `linear-gradient(45deg, ${['#10b981', '#059669', '#047857', '#065f46'][i % 4]}, ${['#0d9488', '#0f766e', '#115e59', '#134e4a'][i % 4]})`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${4 + Math.random() * 6}s`
              }}
            />
          ))}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-emerald-200/30 to-green-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-teal-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Section Header */}
            <div className="mb-16">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-full blur-xl"></div>
                <Badge className="relative bg-white/90 backdrop-blur-xl text-emerald-800 border border-emerald-200/50 px-8 py-4 text-sm font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent font-extrabold">
                      Exclusive Early Access
                    </span>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  </div>
                </Badge>
              </div>
              
              <h2 className="text-5xl lg:text-6xl font-black text-slate-900 mb-8 leading-tight">
                <span className="block mb-4">Join the Educator</span>
                <span className="block bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent animate-gradient-x">
                  Waiting List
                </span>
              </h2>
              <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                Be among the first educators to access our revolutionary AI-powered teaching tools. 
                <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> Get priority access, exclusive features, and special educator pricing.</span>
              </p>
            </div>

            {/* Waiting List CTA */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-3xl blur-lg opacity-30"></div>
              <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-white/60">
                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  {[
                    {
                      icon: Star,
                      title: "Priority Access",
                      description: "Be first to experience new AI teaching features",
                      color: "from-emerald-500 to-green-600"
                    },
                    {
                      icon: Award,
                      title: "Special Pricing",
                      description: "Exclusive educator discounts and free premium features",
                      color: "from-green-500 to-teal-600"
                    },
                    {
                      icon: Users,
                      title: "Expert Community",
                      description: "Connect with fellow innovative educators worldwide",
                      color: "from-teal-500 to-cyan-600"
                    }
                  ].map((benefit, index) => {
                    const Icon = benefit.icon
                    return (
                      <div key={index} className="text-center group">
                        <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center shadow-lg mb-4 transform group-hover:rotate-6 transition-transform duration-300`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{benefit.title}</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Join Button */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl blur-lg opacity-30"></div>
                  <Button
                    size="lg"
                    onClick={() => setShowWaitingList(true)}
                    className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 group overflow-hidden border border-white/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <span className="relative z-10 flex items-center gap-3">
                      <Mail className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                      Join Educator Waiting List
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Button>
                </div>

                {/* Stats */}
                <div className="mt-12 pt-8 border-t border-slate-200 flex justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">500+</div>
                    <div className="text-sm text-slate-600">Educators already registered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-white/80 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/80 to-indigo-50/50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10,000+", label: "Active Learners", icon: Users, color: "from-blue-500 to-indigo-600" },
              { value: "500+", label: "AI-Enhanced Courses", icon: BookOpen, color: "from-purple-500 to-pink-600" },
              { value: "98%", label: "Completion Rate", icon: Award, color: "from-emerald-500 to-green-600" },
              { value: "24/7", label: "AI Tutor Support", icon: Brain, color: "from-amber-500 to-orange-600" }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg mb-4 transform hover:rotate-6 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-3xl font-bold text-slate-800 mb-2">{stat.value}</h4>
                  <p className="text-slate-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-28 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 via-amber-400/10 to-yellow-400/10 animate-gradient-x"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {isClient && [...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full animate-float opacity-50"
              style={{
                background: `linear-gradient(45deg, ${['#f59e0b', '#d97706', '#b45309', '#92400e'][i % 4]}, ${['#f97316', '#ea580c', '#dc2626', '#b91c1c'][i % 4]})`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${3 + Math.random() * 5}s`
              }}
            />
          ))}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-16 left-16 w-48 h-48 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-16 right-16 w-48 h-48 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-yellow-200/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-amber-600/20 rounded-full blur-xl"></div>
                <Badge className="relative bg-white/90 backdrop-blur-xl text-orange-800 border border-orange-200/50 px-8 py-4 text-sm font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <MessageCircle className="w-5 h-5 text-orange-600" />
                    <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent font-extrabold">
                      Your Voice Matters
                    </span>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  </div>
                </Badge>
              </div>
              
              <h2 className="text-5xl lg:text-6xl font-black text-slate-900 mb-8 leading-tight">
                <span className="block mb-4">Help Us</span>
                <span className="block bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent animate-gradient-x">
                  Improve
                </span>
              </h2>
              <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                We're constantly evolving to better serve educators and learners. 
                <span className="font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent"> Share your thoughts and help shape the future of AI-powered education.</span>
              </p>
            </div>

            {/* Feedback Options Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Quick Feedback Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/60 group-hover:shadow-2xl transition-all duration-500">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform group-hover:rotate-6 transition-transform duration-300">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">General Feedback</h3>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                      Share your thoughts, suggestions, or experiences with our platform. Every insight helps us improve.
                    </p>
                    <Button
                      onClick={() => setShowFeedback(true)}
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Share Feedback
                    </Button>
                  </div>
                </div>
              </div>

              {/* Feature Request Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/60 group-hover:shadow-2xl transition-all duration-500">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform group-hover:rotate-6 transition-transform duration-300">
                      <Lightbulb className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Feature Ideas</h3>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                      Have an idea for a new feature? We'd love to hear what would make your experience even better.
                    </p>
                    <Button
                      onClick={() => {
                        setFeedbackData(prev => ({ ...prev, type: 'feature' }))
                        setShowFeedback(true)
                      }}
                      className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Suggest Feature
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Feedback Button */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl">
                  <p className="text-slate-600 mb-4 font-medium">
                    Quick feedback? Just want to say hi? 
                    <span className="block text-sm text-slate-500 mt-1">We read every single message ❤️</span>
                  </p>
                  <Button
                    onClick={() => {
                      setFeedbackData(prev => ({ ...prev, type: 'quick' }))
                      setShowFeedback(true)
                    }}
                    variant="outline"
                    className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 px-6 py-2 rounded-xl font-medium transition-all duration-300"
                  >
                    <Heart className="w-4 h-4 mr-2 text-red-500" />
                    Send Quick Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-28 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        
        {/* Animated Particles */}
        <div className="absolute inset-0">
          {isClient && [...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <Badge className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1 text-sm font-semibold">
              <Rocket className="w-3 h-3 mr-1" />
              Limited Time Offer
            </Badge>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 animate-fade-in-up">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-xl text-blue-100 mb-16 max-w-3xl mx-auto leading-relaxed animate-fade-in-up stagger-1">
              Join thousands of educators and learners who are already experiencing the future of education.
              Start your journey today with our AI-powered platform.
            </p>
            
            <div className="flex justify-center animate-fade-in-up stagger-2">
              <Button
                size="lg"
                onClick={() => {
                  setAuthMode("signup")
                  setShowAuth(true)
                }}
                className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-6 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
              >
                <Rocket className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                Get Started Free
              </Button>
            </div>
            
            <div className="mt-12 text-blue-100 text-sm animate-fade-in-up stagger-3">
              <span className="font-medium">✓ No credit card required</span>
              <span className="mx-4">•</span>
              <span className="font-medium">✓ Start learning immediately</span>
              <span className="mx-4">•</span>
              <span className="font-medium">✓ Join 10,000+ learners</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer - Matching Header Design */}
      <footer className="relative py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 overflow-hidden">
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border-t border-white/30"></div>
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 animate-gradient-x"></div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {isClient && [...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-full animate-float"
              style={{
                left: `${5 + i * 8}%`,
                top: `${10 + Math.sin(i) * 80}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${5 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        {/* Large decorative elements */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-start space-x-4 mb-6 group">
                <div className="relative mt-1">
                  {/* Enhanced Footer logo container with header-style effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-indigo-500/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-blue-400/15 to-purple-400/20 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500"></div>
                  
                  <div className="relative w-14 h-14 bg-gradient-to-br from-white via-blue-50/70 to-purple-50/50 rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-700 border border-white/60 group-hover:border-blue-300/60 group-hover:scale-105 overflow-hidden p-2">
                    
                    {/* Footer Logo Image */}
                    <img 
                      src="/uploads/avatars/Logo.png" 
                      alt="LLMfied Logo" 
                      className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-125 rounded-lg"
                    />
                    
                    {/* Enhanced theme overlay for footer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-indigo-700 mb-1 leading-tight transition-all duration-500 group-hover:scale-105">
                    LLMfied
                  </span>
                  <span className="text-xs font-medium bg-gradient-to-r from-slate-600 via-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-indigo-500 tracking-wider leading-relaxed transition-all duration-500">
                    DEMYSTIFY • REIMAGINE • DELIVER
                  </span>
                </div>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">Transforming education with AI-powered learning experiences that adapt to each student's needs.</p>
              
              {/* Enhanced Social Links */}
              <div className="flex space-x-4">
                <a href="#" className="group relative p-3 bg-white/70 hover:bg-white/90 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/60 hover:border-blue-300/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
                </a>
                <a href="#" className="group relative p-3 bg-white/70 hover:bg-white/90 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/60 hover:border-purple-300/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-purple-600 transition-colors duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a href="#" className="group relative p-3 bg-white/70 hover:bg-white/90 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/60 hover:border-emerald-300/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                </a>
              </div>
            </div>
            
            {/* Enhanced Navigation Sections */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">Platform</h3>
                <ul className="space-y-3">
                  <li><button onClick={() => scrollToSection('features')} className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Features
                  </button></li>
                  <li><button onClick={() => { setAuthMode('signup'); setShowAuth(true); }} className="group flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Pricing
                  </button></li>
                  <li><button onClick={() => scrollToSection('about')} className="group flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    For Educators
                  </button></li>
                  <li><button onClick={() => scrollToSection('about')} className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    For Learners
                  </button></li>
                  <li><button onClick={() => { setAuthMode('signup'); setShowAuth(true); }} className="group flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Enterprise
                  </button></li>
              </ul>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Resources</h3>
                <ul className="space-y-3">
                  <li><button onClick={() => setShowDemo(true)} className="group flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Documentation
                  </button></li>
                  <li><button onClick={() => setShowDemo(true)} className="group flex items-center gap-2 text-slate-600 hover:text-pink-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Blog
                  </button></li>
                  <li><button onClick={() => { setAuthMode('signup'); setShowAuth(true); }} className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Community
                  </button></li>
                  <li><button onClick={() => setShowDemo(true)} className="group flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Case Studies
                  </button></li>
                  <li><button onClick={() => setShowDemo(true)} className="group flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Help Center
                  </button></li>
              </ul>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">Company</h3>
                <ul className="space-y-3">
                  <li><button onClick={() => scrollToSection('about')} className="group flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    About Us
                  </button></li>
                  <li><button onClick={() => { setAuthMode('signup'); setShowAuth(true); }} className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Careers
                  </button></li>
                  <li><button onClick={() => setShowDemo(true)} className="group flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Contact
                  </button></li>
                  <li><button onClick={() => setShowDemo(true)} className="group flex items-center gap-2 text-slate-600 hover:text-slate-700 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Privacy Policy
                  </button></li>
                  <li><button onClick={() => setShowDemo(true)} className="group flex items-center gap-2 text-slate-600 hover:text-slate-700 transition-all duration-300 font-medium">
                    <div className="w-2 h-2 bg-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    Terms of Service
                  </button></li>
              </ul>
              </div>
            </div>
          </div>
          
          {/* Enhanced Footer Bottom */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-slate-600 font-medium">
                  &copy; 2025{" "}
                  <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 bg-clip-text text-transparent font-bold">
                    LLMfied
                  </span>
                  . All rights reserved.
                </p>
                <div className="flex items-center mt-4 md:mt-0 text-slate-600">
                  <Heart className="w-4 h-4 text-red-500 mr-2 animate-pulse" />
                  <p className="font-medium">Made with love for the future of education</p>
            </div>
          </div>
            </div>
          </div>
        </div>
        
        {/* Dynamic progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-30">
          <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 w-full"></div>
        </div>
      </footer>

      {/* Enhanced Auth Modal - Matching Header Design */}
      {showAuth && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/60 to-purple-900/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 animate-gradient-x"></div>
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden">
              {isClient && [...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-blue-400/50 to-purple-400/50 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.6}s`,
                    animationDuration: `${4 + Math.random() * 3}s`
                  }}
                />
              ))}
            </div>
            
            {/* Large decorative elements */}
            <div className="absolute top-20 left-20 w-60 h-60 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-indigo-400/15 to-blue-400/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Enhanced Modal Container */}
          <div className="relative">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl rounded-3xl border border-white/30"></div>
            
            {/* Enhanced Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-indigo-500/20 rounded-3xl blur-xl opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/15 via-blue-400/10 to-purple-400/15 rounded-3xl blur-lg opacity-80"></div>
            
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/60">
              {/* Spectacular Enhanced Close Button */}
              <div className="absolute top-6 right-6 z-20">
                <div className="relative group">
                  {/* Animated background rings */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-ping"></div>
                  
                  {/* Main button */}
            <button
              onClick={() => setShowAuth(false)}
                    className="relative group bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-xl p-4 rounded-2xl transition-all duration-300 border-2 border-slate-200/60 hover:border-red-300/60 hover:scale-110 hover:rotate-90 shadow-lg hover:shadow-2xl hover:shadow-red-500/20"
                  >
                    {/* Button background with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-pink-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-2xl translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    
                    {/* Icon with enhanced styling */}
                    <X className="w-5 h-5 text-slate-600 group-hover:text-red-600 transition-all duration-300 relative z-10 group-hover:scale-110" />
                    
                    {/* Pulsing dot indicator */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </button>
                  
                  {/* Floating close hint */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg">
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    Press ESC or click to close
                  </div>
                </div>
              </div>
              
              <div className="p-8 relative">
              <AuthForm 
                mode={authMode} 
                onClose={() => setShowAuth(false)} 
                onShowWaitingList={() => {
                  setShowAuth(false)
                  setShowWaitingList(true)
                }}
              />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowDemo(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-slate-900 mb-4">
                  See{" "}
                  <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                    LLMfied
                  </span>
                  {" "}in Action
                </h3>
                <p className="text-slate-600 text-lg">Experience the future of AI-powered education</p>
              </div>
              
              <div className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-xl p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Play className="w-12 h-12 text-white ml-1" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-800 mb-2">Interactive Demo</h4>
                  <p className="text-slate-600 mb-6">Click to start the interactive tour of our platform</p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      onClick={() => {
                        // In a real app, this would start the demo
                        alert('Demo feature coming soon! For now, sign up to explore the platform.');
                        setShowDemo(false);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Demo
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowDemo(false);
                        setAuthMode('signup');
                        setShowAuth(true);
                      }}
                    >
                      Sign Up Instead
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educator Waiting List Modal */}
      {showWaitingList && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-emerald-900/60 to-teal-900/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 animate-gradient-x"></div>
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden">
              {isClient && [...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-emerald-400/50 to-teal-400/50 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.8}s`,
                    animationDuration: `${4 + Math.random() * 3}s`
                  }}
                />
              ))}
            </div>
            
            {/* Large decorative elements */}
            <div className="absolute top-20 left-20 w-60 h-60 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          {/* Enhanced Modal Container */}
          <div className="relative">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl rounded-3xl border border-white/30"></div>
            
            {/* Enhanced Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/20 rounded-3xl blur-xl opacity-60"></div>
            
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/60">
              {/* Enhanced Close Button */}
              <button
                onClick={() => setShowWaitingList(false)}
                className="absolute top-6 right-6 p-3 bg-white/80 hover:bg-white/95 rounded-2xl transition-all duration-300 border border-slate-200/60 hover:border-emerald-300/60 shadow-lg hover:shadow-xl hover:scale-110 z-20"
              >
                <X className="w-5 h-5 text-slate-600 hover:text-emerald-600 transition-colors duration-300" />
              </button>
              
              <div className="p-8 relative">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Join the Educator Waiting List</h3>
                  <p className="text-slate-600 text-lg">Be among the first to experience revolutionary AI-powered teaching tools</p>
                </div>

                {/* Form */}
                <form onSubmit={handleWaitingListSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={waitingListData.name}
                        onChange={(e) => setWaitingListData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={waitingListData.email}
                        onChange={(e) => setWaitingListData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Institution/Organization</label>
                    <input
                      type="text"
                      value={waitingListData.institution}
                      onChange={(e) => setWaitingListData(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="University, School, Company, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Teaching Experience</label>
                    <select
                      value={waitingListData.experience}
                      onChange={(e) => setWaitingListData(prev => ({ ...prev, experience: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="">Select your experience level</option>
                      <option value="new">New to teaching (0-2 years)</option>
                      <option value="experienced">Experienced (3-10 years)</option>
                      <option value="veteran">Veteran educator (10+ years)</option>
                      <option value="administrator">Administrator/Leadership</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Areas of Interest</label>
                    <textarea
                      value={waitingListData.interests}
                      onChange={(e) => setWaitingListData(prev => ({ ...prev, interests: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                      placeholder="What subjects do you teach? What AI features interest you most?"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl blur-lg opacity-30"></div>
                    <button
                      type="submit"
                      disabled={waitingListSubmitting}
                      className="relative w-full bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {waitingListSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Joining Waiting List...
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5" />
                            Join Educator Waiting List
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Benefits Reminder */}
                <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50">
                  <h4 className="font-bold text-emerald-800 mb-3">What you'll get:</h4>
                  <ul className="space-y-2 text-sm text-emerald-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Priority access to new AI teaching features
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Exclusive educator pricing and discounts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Direct input on feature development
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Access to educator-only community
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-orange-900/60 to-amber-900/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 animate-gradient-x"></div>
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden">
              {isClient && [...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-orange-400/50 to-amber-400/50 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.7}s`,
                    animationDuration: `${3 + Math.random() * 4}s`
                  }}
                />
              ))}
            </div>
            
            {/* Large decorative elements */}
            <div className="absolute top-16 left-16 w-56 h-56 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-16 right-16 w-56 h-56 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.2s'}}></div>
          </div>
          
          {/* Enhanced Modal Container */}
          <div className="relative">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl rounded-3xl border border-white/30"></div>
            
            {/* Enhanced Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-amber-500/15 to-yellow-500/20 rounded-3xl blur-xl opacity-60"></div>
            
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/60">
              {/* Enhanced Close Button */}
              <button
                onClick={() => setShowFeedback(false)}
                className="absolute top-6 right-6 p-3 bg-white/80 hover:bg-white/95 rounded-2xl transition-all duration-300 border border-slate-200/60 hover:border-orange-300/60 shadow-lg hover:shadow-xl hover:scale-110 z-20"
              >
                <X className="w-5 h-5 text-slate-600 hover:text-orange-600 transition-colors duration-300" />
              </button>
              
              <div className="p-8 relative">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Share Your Feedback</h3>
                  <p className="text-slate-600 text-lg">Help us improve LLMfied by sharing your thoughts and suggestions</p>
                </div>

                {/* Form */}
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Your Name</label>
                      <input
                        type="text"
                        value={feedbackData.name}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        placeholder="Your name (optional)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        value={feedbackData.email}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        placeholder="your@email.com (optional)"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Feedback Type</label>
                    <select
                      value={feedbackData.type}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="general">General Feedback</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="improvement">Improvement Suggestion</option>
                      <option value="praise">Compliment</option>
                      <option value="quick">Quick Message</option>
                    </select>
                  </div>

                  {/* Rating */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Overall Experience Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFeedbackData(prev => ({ ...prev, rating }))}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            feedbackData.rating >= rating
                              ? 'text-yellow-500 scale-110 transform'
                              : 'text-slate-300 hover:text-yellow-400'
                          }`}
                        >
                          <Star className={`w-8 h-8 ${feedbackData.rating >= rating ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                      <span className="ml-4 text-sm text-slate-600">
                        {feedbackData.rating === 5 ? '🎉 Excellent!' : 
                         feedbackData.rating === 4 ? '😊 Great!' :
                         feedbackData.rating === 3 ? '👍 Good' :
                         feedbackData.rating === 2 ? '😐 Okay' : '😞 Poor'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Your Message *</label>
                    <textarea
                      required
                      value={feedbackData.message}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, message: e.target.value }))}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                      placeholder="Share your thoughts, suggestions, or experiences with LLMfied..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-2xl blur-lg opacity-30"></div>
                    <button
                      type="submit"
                      disabled={feedbackSubmitting}
                      className="relative w-full bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {feedbackSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Sending Feedback...
                          </>
                        ) : (
                          <>
                            <Heart className="w-5 h-5" />
                            Send Feedback
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Thank You Note */}
                <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/50">
                  <div className="flex items-center gap-3 mb-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-orange-800">Thank You!</h4>
                  </div>
                  <p className="text-sm text-orange-700 leading-relaxed">
                    Your feedback helps us create a better learning experience for everyone. We read every message and use your insights to guide our development priorities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}