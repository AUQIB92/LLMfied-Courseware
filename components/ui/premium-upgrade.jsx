"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Crown,
  Star,
  Check,
  X,
  Zap,
  Award,
  CreditCard,
  Shield,
  Rocket
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog"

// Premium Feature Button Component
export const PremiumFeatureButton = ({ 
  children, 
  feature, 
  className = "", 
  size = "default",
  onClick,
  ...props 
}) => {
  const [showModal, setShowModal] = React.useState(false)

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
        className={`relative overflow-hidden group ${className}`}
        size={size}
        onClick={handleClick}
        {...props}
      >
        {children}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-300" />
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Choose Your Plan
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-base">
              Unlock powerful AI features and take your learning to the next level
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          {/* Premium Features Header */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Premium Features</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: Zap, text: "AI Tutor Assistant", highlight: highlightFeature === 'ai-tutor' },
                { icon: Award, text: "Quiz Generation", highlight: highlightFeature === 'quiz-generation' },
                { icon: Star, text: "Get More Details", highlight: highlightFeature === 'get-more-details' },
                { icon: Shield, text: "Priority Support", highlight: false }
              ].map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      feature.highlight 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg' 
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      feature.highlight 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg' 
                        : 'bg-gradient-to-br from-slate-400 to-slate-500'
                    }`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <span className={`text-sm font-medium ${
                      feature.highlight ? 'text-blue-800' : 'text-slate-700'
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Premium Plan */}
            <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-500 shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-1 text-sm font-bold">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  Popular
                </Badge>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Premium</h3>
                <div className="text-3xl font-black text-slate-900 mb-1">
                  ₹100<span className="text-lg text-slate-600">/month</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">Perfect for students</p>
                
                {/* Features */}
                <div className="text-left mb-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-slate-700">AI Tutor Assistant</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-slate-700">Quiz Generation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-slate-700">Get More Details</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-slate-700">Email Support</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 text-sm rounded-lg transition-all duration-300 min-h-[48px] touch-manipulation"
                  onClick={() => {
                    alert('Premium plan selected! ₹100/month - Payment integration would be implemented here.')
                    onClose()
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2 shrink-0" />
                  Choose Premium
                </Button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-purple-300 transition-colors duration-300 shadow-lg">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Pro</h3>
                <div className="text-3xl font-black text-slate-900 mb-1">
                  ₹200<span className="text-lg text-slate-600">/month</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">For educators & professionals</p>
                
                {/* Features */}
                <div className="text-left mb-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-slate-700">Everything in Premium</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-slate-700">Advanced AI Features</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-slate-700">Course Creation Tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-slate-700">Priority Support</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold py-3 px-4 text-sm rounded-lg transition-all duration-300 min-h-[48px] touch-manipulation"
                  onClick={() => {
                    alert('Pro plan selected! ₹200/month - Payment integration would be implemented here.')
                    onClose()
                  }}
                >
                  <Rocket className="w-4 h-4 mr-2 shrink-0" />
                  Choose Pro
                </Button>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500 border-t border-slate-200 pt-6">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>7-day Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

export default PremiumUpgradeModal 