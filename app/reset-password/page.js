"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import ForgotPassword from "@/components/auth/ForgotPassword"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  return <ForgotPassword initialToken={token} />
} 