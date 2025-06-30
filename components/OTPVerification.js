"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Shield, Mail, ArrowLeft, Clock, RefreshCw } from "lucide-react"

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
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6">
        <div className="text-center">
          <div className="relative group cursor-pointer mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 via-blue-600/20 to-purple-600/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-green-400/15 to-purple-400/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500"></div>
            
            <div className="relative w-16 h-16 bg-gradient-to-br from-white via-green-50/70 to-blue-50/50 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-700 group-hover:scale-110 border border-white/60 group-hover:border-green-300/60 overflow-hidden p-2">
              <img 
                src="/uploads/avatars/Logo.png" 
                alt="LLMfied Logo" 
                className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            {/* Verification badge overlay */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Enter the 6-digit code sent to
            <br />
            <span className="font-medium text-blue-600">{email}</span>
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          {/* OTP Input */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium flex items-center gap-2 justify-center">
              <Mail className="w-4 h-4" />
              Verification Code
            </Label>
            <div className="flex gap-2 justify-center">
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
                  className="w-12 h-12 text-center text-lg font-bold border-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0"
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
              <Clock className="w-4 h-4" />
              {timeLeft > 0 ? (
                <span>Code expires in {formatTime(timeLeft)}</span>
              ) : (
                <span className="text-red-600">Code expired</span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200" 
            disabled={loading || timeLeft === 0}
          >
            {loading ? "Verifying..." : "Verify & Complete Registration"}
          </Button>
        </form>

        {/* Resend and Back buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResendOtp}
            disabled={!canResend || resendLoading}
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            {resendLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {canResend ? "Resend Code" : `Resend in ${formatTime(timeLeft)}`}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Button>
        </div>

        {/* Help text */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Didn't receive the code? Check your spam folder or try resending.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
