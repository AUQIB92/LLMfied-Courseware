"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ForgotPassword from "@/components/auth/ForgotPassword"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  return <ForgotPassword initialToken={token} />
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
} 