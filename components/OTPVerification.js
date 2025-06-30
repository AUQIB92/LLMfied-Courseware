"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Shield, Mail, ArrowLeft, Clock, RefreshCw, ArrowRight } from "lucide-react"

export default function OTPVerification({ 
  email, 
  name, 
  password, 
  onVerifySuccess, 
  onBack, 
  onClose 
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6)
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      
      // Focus next empty input or last input
      const nextIndex = Math.min(pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    // Handle single character input
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Move to next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const otpString = otp.join("")
    
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          otp: otpString,
          password
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store auth data
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        
        // Call success callback
        onVerifySuccess(data.user)
        
        // Close modal
        if (onClose) {
          onClose()
        }
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    setResendLoading(true)
    setError("")

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTimeLeft(600) // Reset timer
        setCanResend(false)
        setOtp(["", "", "", "", "", ""]) // Clear OTP
        // Focus first input
        inputRefs.current[0]?.focus()
      } else {
        setError(data.error || "Failed to resend code")
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 relative overflow-hidden">
      {/* Enhanced Card Background */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl rounded-3xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/30 to-blue-50/50 rounded-3xl"></div>
      
      {/* Subtle floating particles inside card */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-emerald-300/30 to-blue-300/30 rounded-full animate-float"
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
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-blue-600/20 to-purple-600/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-emerald-400/15 to-blue-400/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500"></div>
              
              <div className="relative w-16 h-16 bg-gradient-to-br from-white via-emerald-50/70 to-blue-50/50 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-700 group-hover:scale-110 border border-white/60 group-hover:border-emerald-300/60 overflow-hidden p-2">
                
                {/* Logo with Security Badge Overlay */}
                <div className="relative w-full h-full">
                  <img 
                    src="/uploads/avatars/Logo.png" 
                    alt="LLMfied Logo" 
                    className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 rounded-xl"
                  />
                  
                  {/* Security Badge */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-emerald-700 to-blue-700 bg-clip-text text-transparent">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2 font-medium">
              Enter the 6-digit code sent to
              <br />
              <span className="font-bold text-emerald-600">{email}</span>
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-slate-700 font-semibold flex items-center gap-2 justify-center">
                <div className="p-1 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg">
                  <Shield className="w-3 h-3 text-emerald-600" />
                </div>
                Verification Code
              </Label>
              
                             {/* Enhanced OTP Input Container */}
               <div className="relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 rounded-xl blur-sm"></div>
                 <div className="relative bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-xl p-4">
                   <div className="flex gap-3 justify-center">
                     {otp.map((digit, index) => (
                       <Input
                         key={index}
                         ref={(el) => (inputRefs.current[index] = el)}
                         type="text"
                         inputMode="numeric"
                         maxLength={6}
                         value={digit}
                         onChange={(e) => handleOtpChange(index, e.target.value)}
                         onKeyDown={(e) => handleKeyDown(index, e)}
                         className="w-12 h-12 text-center text-lg font-bold border-2 border-emerald-200/60 bg-white/90 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/20 transition-all duration-300 hover:bg-white"
                         placeholder="0"
                       />
                     ))}
                   </div>
                 </div>
               </div>
               
               {/* Timer */}
               <div className="text-center">
                 <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 rounded-xl blur-sm"></div>
                   <div className="relative bg-white/80 backdrop-blur-sm border border-blue-200/60 rounded-xl px-4 py-2 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-blue-600" />
                     {timeLeft > 0 ? (
                       <span className="text-blue-700 font-medium">Code expires in {formatTime(timeLeft)}</span>
                     ) : (
                       <span className="text-red-600 font-medium">Code expired</span>
                     )}
                   </div>
                 </div>
               </div>
            </div>
            
            {error && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-pink-50/50 rounded-xl blur-sm"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
                             <Button 
                 type="submit" 
                 className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-blue-600 hover:from-emerald-700 hover:via-green-700 hover:to-blue-700 text-white font-bold py-4 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group overflow-hidden border border-white/20 rounded-xl h-12"
                 disabled={loading || timeLeft === 0}
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                 <span className="relative z-10 flex items-center justify-center gap-2">
                   {loading ? (
                     <>
                       <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                       Verifying...
                     </>
                   ) : (
                     <>
                       <Shield className="w-4 h-4" />
                       Verify & Complete Registration
                       <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                     </>
                   )}
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
               </Button>
                           </div>
           </form>
           
           {/* Resend and Back buttons */}
           <div className="space-y-3">
             <Button
               type="button"
               variant="outline"
               onClick={handleResendOtp}
               disabled={!canResend || resendLoading}
               className="w-full border-emerald-200/60 text-emerald-600 hover:bg-emerald-50/80 bg-white/80 backdrop-blur-sm rounded-xl font-semibold transition-all duration-300 hover:scale-105"
             >
               <div className="flex items-center justify-center gap-2">
                 {resendLoading ? (
                   <>
                     <RefreshCw className="w-4 h-4 animate-spin" />
                     Sending...
                   </>
                 ) : (
                   <>
                     <RefreshCw className="w-4 h-4" />
                     {canResend ? "Resend Code" : `Resend in ${formatTime(timeLeft)}`}
                   </>
                 )}
               </div>
             </Button>
             
             <Button
               type="button"
               variant="ghost"
               onClick={onBack}
               className="w-full text-slate-600 hover:text-slate-800 hover:bg-slate-50/80 rounded-xl font-semibold transition-all duration-300"
             >
               <ArrowLeft className="w-4 h-4 mr-2" />
               Back to Registration
             </Button>
           </div>
           
           {/* Help text */}
           <div className="text-center">
             <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/50 rounded-xl blur-sm"></div>
               <div className="relative bg-white/60 backdrop-blur-sm border border-slate-200/40 rounded-xl p-3">
                 <p className="text-xs text-slate-600 font-medium">
                   Didn't receive the code? Check your spam folder or try resending.
                 </p>
               </div>
             </div>
           </div>
         </CardContent>
       </div>
     </Card>
   )
}
