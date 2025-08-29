import { useMemo } from "react"
import { useProfile } from "./useProfile"

export interface StudentInfo {
  name: string
  enrollmentNumber: string
  email: string
}

/**
 * Hook to get student information for assignment headers
 * Extracts relevant student data from the profile system
 */
export function useStudentInfo(): StudentInfo | null {
  const { profile } = useProfile()
  
  const studentInfo = useMemo(() => {
    if (!profile) return null
    
    // Extract student information from profile
    // This assumes the profile has these fields - adjust based on your actual profile structure
    return {
      name: profile.name || profile.fullName || '',
      enrollmentNumber: profile.enrollmentNumber || profile.studentId || profile.id || '',
      email: profile.email || ''
    }
  }, [profile])
  
  return studentInfo
}