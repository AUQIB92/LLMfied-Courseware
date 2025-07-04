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
      <DialogContent className="w-[95vw] max-w-sm mx-auto p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-yellow-300" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 mb-1">
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm">
              Perfect for learners
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-4 pt-2 space-y-4">
          {/* Premium Plan */}
          <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-500 shadow-lg">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-3 py-1 text-xs font-bold">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Best Value
              </Badge>
            </div>
            
            <div className="text-center mt-2">
              <div className="text-2xl font-black text-slate-900 mb-1">
                ₹100<span className="text-base text-slate-600">/month</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">Perfect for students & learners</p>
              
              {/* Compact Features */}
              <div className="text-left mb-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-3 h-3 text-green-600 shrink-0" />
                  <span className="text-slate-700">AI Tutor Assistant</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-3 h-3 text-green-600 shrink-0" />
                  <span className="text-slate-700">Quiz Generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-3 h-3 text-green-600 shrink-0" />
                  <span className="text-slate-700">Get More Details</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-3 h-3 text-green-600 shrink-0" />
                  <span className="text-slate-700">Priority Support</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 text-sm rounded-lg transition-all duration-300 min-h-[44px] touch-manipulation"
                onClick={() => {
                  alert('Premium plan selected! ₹100/month - Payment integration would be implemented here.')
                  onClose()
                }}
              >
                <CreditCard className="w-4 h-4 mr-2 shrink-0" />
                Start Learning Premium
              </Button>
            </div>
          </div>

          {/* Compact Trust Signals */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-600" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-blue-600" />
              <span>7-day Trial</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-600" />
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