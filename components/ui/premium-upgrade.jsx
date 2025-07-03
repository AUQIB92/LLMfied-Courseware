"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Crown,
  Star,
  Check,
  X,
  Zap,
  Sparkles,
  Award,
  Users,
  Brain,
  TestTube,
  Lightbulb,
  ArrowRight,
  CreditCard,
  Shield,
  Rocket
} from "lucide-react"

// Premium Plans Configuration
const PremiumPlans = {
  free: {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Basic course access",
      "Community support",
      "Limited AI features"
    ],
    color: "from-slate-500 to-slate-600",
    popular: false
  },
  premium: {
    name: "Premium",
    price: "$9.99",
    period: "month",
    description: "Unlock advanced AI-powered learning",
    features: [
      "AI Tutor assistance",
      "Quiz generation",
      "Get More Details feature",
      "Priority support",
      "Advanced analytics",
      "Unlimited course access"
    ],
    color: "from-blue-500 to-purple-600",
    popular: true
  },
  pro: {
    name: "Pro",
    price: "$19.99",
    period: "month",
    description: "For serious learners and educators",
    features: [
      "Everything in Premium",
      "Advanced AI tutoring",
      "Custom learning paths",
      "White-label options",
      "API access",
      "1-on-1 support sessions"
    ],
    color: "from-purple-500 to-pink-600",
    popular: false
  }
}

// Premium Feature Button Component
export const PremiumFeatureButton = ({ 
  children, 
  feature, 
  className = "", 
  size = "default",
  onClick,
  ...props 
}) => {
  const [showModal, setShowModal] = useState(false)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setShowModal(true)
    }
  }

  return (
    <>
      <Button
        onClick={handleClick}
        className={`relative group overflow-hidden border-2 border-amber-300 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${className}`}
        size={size}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </Button>

      <PremiumUpgradeModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        highlightFeature={feature}
      />
    </>
  )
}

// Premium Upgrade Modal Component
export const PremiumUpgradeModal = ({ isOpen, onClose, highlightFeature }) => {
  const [selectedPlan, setSelectedPlan] = useState("premium")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-300" />
            </div>
            <h2 className="text-3xl font-black mb-2">Upgrade to Premium</h2>
            <p className="text-blue-100 text-lg">Unlock the full power of AI-enhanced learning</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Choose Your Plan</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Premium Plan */}
              <Card className="border-2 border-blue-500 shadow-xl relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-3 py-1 text-xs font-bold">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Most Popular
                  </Badge>
                </div>
                
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Premium</CardTitle>
                  <div className="text-3xl font-black text-slate-900">
                    $9.99<span className="text-sm font-normal text-slate-600">/month</span>
                  </div>
                  <CardDescription>Perfect for advanced learning</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">AI Tutor assistance</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">Quiz generation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">Get More Details feature</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">Priority support</span>
                    </li>
                  </ul>
                  
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-bold py-3 rounded-xl">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Choose Premium
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="border-2 border-slate-200 hover:border-slate-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                  <div className="text-3xl font-black text-slate-900">
                    $19.99<span className="text-sm font-normal text-slate-600">/month</span>
                  </div>
                  <CardDescription>For serious learners</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">Everything in Premium</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">Advanced AI features</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">Custom learning paths</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">1-on-1 support</span>
                    </li>
                  </ul>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 text-white font-bold py-3 rounded-xl">
                    Choose Pro
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Security info */}
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 border-t pt-6">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              Secure Payment
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              30-day Money Back
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              Instant Access
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Premium Badge Component
export const PremiumBadge = ({ children, className = "", ...props }) => {
  return (
    <Badge 
      className={`bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 ${className}`}
      {...props}
    >
      <Crown className="w-3 h-3 mr-1" />
      {children}
    </Badge>
  )
}

// Helper function to check if user has premium access (can be used in components)
export const useCheckPremium = (user, feature) => {
  if (!user || !user.subscription) return false
  
  const { plan = 'free', status = 'inactive' } = user.subscription
  
  if (status !== 'active') return false
  
  const featureAccess = {
    free: [],
    premium: ['aiTutor', 'quizGeneration', 'getMoreDetails'],
    pro: ['aiTutor', 'quizGeneration', 'getMoreDetails', 'advancedAnalytics', 'customPaths']
  }
  
  return featureAccess[plan]?.includes(feature) || false
}

export default PremiumUpgradeModal 