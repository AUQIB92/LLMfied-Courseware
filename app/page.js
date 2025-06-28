"use client"

import { useAuth } from "@/contexts/AuthContext"
import EducatorDashboard from "@/components/educator/EducatorDashboard"
import LearnerDashboard from "@/components/learner/LearnerDashboard"
import LandingPage from "@/components/LandingPage"

export default function Home() {
  const { user, loading } = useAuth()

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

  if (!user) {
    return <LandingPage />
  }

  return user.role === "educator" ? <EducatorDashboard /> : <LearnerDashboard />
}
