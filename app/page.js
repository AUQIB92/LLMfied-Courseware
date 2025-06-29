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
  X
} from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState("login") // 'login' or 'signup'
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Data Scientist",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
      content: "LLMfied transformed my learning experience. The AI-powered courses helped me master complex ML concepts in half the time it would have taken with traditional methods.",
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
  ];

  // Scroll functions
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle demo modal
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    // Automatic testimonial rotation
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600 font-medium">Loading your experience...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return user.role === "educator" ? <EducatorDashboard /> : <LearnerDashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Modern Elegant Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        {/* Glassmorphism Navigation */}
        <div className="bg-white/80 backdrop-blur-2xl border-b border-white/20 shadow-2xl shadow-slate-900/5">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Modern Logo */}
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative">
                  {/* Elegant logo background */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10"></div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                    LLMfied
                  </span>
                  <span className="text-xs font-medium text-slate-500 -mt-1 tracking-wider">
                    AI-POWERED LEARNING
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden lg:flex items-center space-x-1">
                <nav className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    className="text-slate-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50/50 transition-all duration-300 group relative"
                    onClick={() => scrollToSection('features')}
                  >
                    Features
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-1/2 group-hover:left-1/4 transition-all duration-300"></div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="text-slate-600 hover:text-purple-600 font-medium px-4 py-2 rounded-lg hover:bg-purple-50/50 transition-all duration-300 group relative"
                    onClick={() => scrollToSection('about')}
                  >
                    About
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-purple-600 group-hover:w-1/2 group-hover:left-1/4 transition-all duration-300"></div>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="text-slate-600 hover:text-emerald-600 font-medium px-4 py-2 rounded-lg hover:bg-emerald-50/50 transition-all duration-300 group relative"
                    onClick={() => setShowDemo(true)}
                  >
                    Demo
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-emerald-600 group-hover:w-1/2 group-hover:left-1/4 transition-all duration-300"></div>
                  </Button>
                </nav>

                {/* Auth Buttons */}
                <div className="flex items-center space-x-3 ml-8">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAuthMode("login")
                      setShowAuth(true)
                    }}
                    className="text-slate-600 hover:text-blue-600 font-medium px-5 py-2.5 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-300"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  

                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  className="p-2 rounded-lg hover:bg-slate-100"
                  onClick={() => setShowAuth(true)}
                >
                  <div className="w-6 h-6 flex flex-col justify-center space-y-1.5">
                    <div className="w-full h-0.5 bg-slate-600 rounded-full"></div>
                    <div className="w-full h-0.5 bg-slate-600 rounded-full"></div>
                    <div className="w-full h-0.5 bg-slate-600 rounded-full"></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Revolutionary Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">
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
            {[...Array(20)].map((_, i) => (
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
          <div className="flex justify-center mb-12">
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
            <div className="mb-12">
  <h1 className="text-5xl lg:text-7xl xl:text-8xl font-black text-slate-900 tracking-tight">
    <span className="block mb-4 leading-none">Transform</span>

    {/* FIXED: Prevent "g" from being cut off */}
    <span className="block relative leading-[1.2] mb-12 font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
      <span className="inline-block align-baseline">Learning Forever</span>
    </span>

    <span className="block text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-600 leading-snug">
      with AI-Powered Education
    </span>
  </h1>
</div>

            
            {/* Subtitle */}
            <div className="mb-12">
              <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                Revolutionize your educational journey with cutting-edge artificial intelligence. 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold">
                  {" "}Whether you're an educator or learner
                </span>
                , unlock personalized, intelligent learning experiences that adapt to your unique style.
              </p>
            </div>
            
            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
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
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                  
                  <div className="relative z-10 flex items-center">
                    <Rocket className="mr-4 w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    Start Your Journey
                    <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                  
                  {/* Shine effect */}
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
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/80 to-purple-50/50"></div>
        
        {/* Animated background shapes */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-float" style={{animationDelay: '2s'}}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 px-6 py-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">Why Choose LLMfied?</h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
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
                color: "from-blue-500 to-indigo-600",
                bgColor: "from-blue-50 to-indigo-50",
                delay: 0
              },
              {
                icon: Users,
                title: "Collaborative Platform",
                description:
                  "Connect educators and learners in a seamless environment designed for knowledge sharing and growth.",
                color: "from-purple-500 to-pink-600",
                bgColor: "from-purple-50 to-pink-50",
                delay: 0.1
              },
              {
                icon: BookOpen,
                title: "Rich Content Library",
                description:
                  "Access a vast collection of educational resources, all enhanced with AI-driven insights and recommendations.",
                color: "from-emerald-500 to-green-600",
                bgColor: "from-emerald-50 to-green-50",
                delay: 0.2
              },
              {
                icon: Zap,
                title: "Instant Feedback",
                description: "Get real-time feedback and assessments powered by AI to accelerate learning progress.",
                color: "from-amber-500 to-orange-600",
                bgColor: "from-amber-50 to-orange-50",
                delay: 0.3
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description:
                  "Your data is protected with enterprise-grade security while maintaining complete privacy.",
                color: "from-red-500 to-rose-600",
                bgColor: "from-red-50 to-rose-50",
                delay: 0.4
              },
              {
                icon: TrendingUp,
                title: "Progress Tracking",
                description:
                  "Monitor learning progress with detailed analytics and insights to optimize educational outcomes.",
                color: "from-sky-500 to-cyan-600",
                bgColor: "from-sky-50 to-cyan-50",
                delay: 0.5
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="feature-card-wrapper relative p-1 rounded-3xl bg-gradient-to-br from-gray-100 via-white to-gray-200 group cursor-pointer animate-fade-in-up transition-all duration-500 hover:scale-[1.02]"
                  style={{animationDelay: `${feature.delay}s`}}
                >
                  {/* Dynamic Gradient Border with Feature Colors */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-30 group-hover:opacity-70 transition-all duration-500 rounded-3xl`}></div>
                  <div className={`absolute inset-0 bg-gradient-to-tr ${feature.color} opacity-20 group-hover:opacity-50 transition-all duration-700 rounded-3xl blur-sm`}></div>
                  
                  <Card className="relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/98 backdrop-blur-sm rounded-3xl overflow-hidden z-10">
                    <CardContent className="p-8 relative">
                      {/* Background Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-25 transition-opacity duration-500 rounded-3xl`}></div>
                    
                    <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.bgColor} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 animate-float shadow-lg group-hover:shadow-xl border-2 border-white/50 group-hover:border-white/80`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl`}></div>
                      <Icon className={`relative w-8 h-8 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                    
                    <h3 className="relative text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300 mb-4">{feature.title}</h3>
                    <p className="relative text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">{feature.description}</p>
                    
                    {/* Decorative Elements */}
                    <div className={`absolute top-6 right-6 w-20 h-20 bg-gradient-to-br ${feature.color} opacity-5 rounded-full group-hover:opacity-10 transition-opacity duration-500`}></div>
                    <div className={`absolute bottom-6 left-6 w-12 h-12 bg-gradient-to-br ${feature.color} opacity-5 rounded-full group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-125`}></div>
                  </CardContent>
                </Card>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-blue-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center opacity-5"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 px-6 py-2 text-sm font-semibold">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Success Stories
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">What Our Users Say</h2>
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
      <section id="about" className="py-20 bg-white/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/80 to-green-50/50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
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
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center opacity-5"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
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

      {/* Stats Section */}
      <section className="py-16 bg-white/80 backdrop-blur-sm relative overflow-hidden">
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        
        {/* Animated Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
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
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1 text-sm font-semibold">
              <Rocket className="w-3 h-3 mr-1" />
              Limited Time Offer
            </Badge>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 animate-fade-in-up">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up stagger-1">
              Join thousands of educators and learners who are already experiencing the future of education.
              Start your journey today with our AI-powered platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up stagger-2">

              
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setAuthMode("login")
                  setShowAuth(true)
                }}
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-12 py-6 text-lg font-semibold rounded-2xl transition-all duration-300 group backdrop-blur-sm"
              >
                <LogIn className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                Sign In
              </Button>
            </div>
            
            <div className="mt-8 text-blue-100 text-sm animate-fade-in-up stagger-3">
              <span className="font-medium">✓ No credit card required</span>
              <span className="mx-4">•</span>
              <span className="font-medium">✓ Start learning immediately</span>
              <span className="mx-4">•</span>
              <span className="font-medium">✓ Join 10,000+ learners</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-300">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">LLMfied</span>
              </div>
              <p className="text-slate-400 mb-4">DEMYSTIFY • REIMAGINE • DELIVER</p>
              <p className="text-slate-400 mb-4">Transforming education with AI-powered learning experiences that adapt to each student's needs.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('features')} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Features</button></li>
                <li><button onClick={() => { setAuthMode('signup'); setShowAuth(true); }} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Pricing</button></li>
                <li><button onClick={() => scrollToSection('about')} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">For Educators</button></li>
                <li><button onClick={() => scrollToSection('about')} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">For Learners</button></li>
                <li><button onClick={() => { setAuthMode('signup'); setShowAuth(true); }} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Enterprise</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><button onClick={() => setShowDemo(true)} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Documentation</button></li>
                <li><button onClick={() => setShowDemo(true)} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Blog</button></li>
                <li><button onClick={() => { setAuthMode('signup'); setShowAuth(true); }} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Community</button></li>
                <li><button onClick={() => setShowDemo(true)} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Case Studies</button></li>
                <li><button onClick={() => setShowDemo(true)} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Help Center</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('about')} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">About Us</button></li>
                <li><button onClick={() => { setAuthMode('signup'); setShowAuth(true); }} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Careers</button></li>
                <li><button onClick={() => setShowDemo(true)} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Contact</button></li>
                <li><button onClick={() => setShowDemo(true)} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Privacy Policy</button></li>
                <li><button onClick={() => setShowDemo(true)} className="footer-link text-slate-400 hover:text-white transition-colors duration-300 text-left">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; 2025 LLMfied. All rights reserved.</p>
            <div className="flex items-center mt-4 md:mt-0">
              <Heart className="w-4 h-4 text-red-500 mr-2" />
              <p>Made with love for the future of education</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-6">
              <AuthForm mode={authMode} onClose={() => setShowAuth(false)} />
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
                <h3 className="text-3xl font-bold text-slate-900 mb-4">See LLMfied in Action</h3>
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
    </div>
  )
}