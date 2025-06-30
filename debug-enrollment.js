// Debug utility for testing enrollment API
import { getAuthHeaders } from './lib/auth' // Adjust path as needed

export const debugEnrollment = async (courseId) => {
  console.log('🔍 ENROLLMENT DEBUG STARTED for course:', courseId)
  
  try {
    // 1. Check initial enrollment status
    console.log('\n1️⃣ Checking enrollment status...')
    const checkResponse = await fetch(`/api/enrollment?courseId=${courseId}`, {
      headers: getAuthHeaders(),
    })
    console.log('Status response:', checkResponse.status)
    
    if (checkResponse.ok) {
      const checkData = await checkResponse.json()
      console.log('Initial enrollment data:', checkData)
    } else {
      console.error('Failed to check enrollment:', await checkResponse.text())
    }
    
    // 2. Get all enrollments
    console.log('\n2️⃣ Getting all enrollments...')
    const allResponse = await fetch('/api/enrollment', {
      headers: getAuthHeaders(),
    })
    console.log('All enrollments response:', allResponse.status)
    
    if (allResponse.ok) {
      const allData = await allResponse.json()
      console.log('All enrollments data:', allData)
    } else {
      console.error('Failed to get all enrollments:', await allResponse.text())
    }
    
    // 3. Test enrollment
    console.log('\n3️⃣ Testing enrollment...')
    const enrollResponse = await fetch('/api/enrollment', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId }),
    })
    console.log('Enrollment response:', enrollResponse.status)
    
    if (enrollResponse.ok) {
      const enrollData = await enrollResponse.json()
      console.log('Enrollment success data:', enrollData)
    } else {
      const enrollError = await enrollResponse.json()
      console.error('Enrollment failed:', enrollError)
    }
    
    // 4. Check enrollment status again
    console.log('\n4️⃣ Checking enrollment status after enrollment...')
    const recheckResponse = await fetch(`/api/enrollment?courseId=${courseId}`, {
      headers: getAuthHeaders(),
    })
    console.log('Recheck response:', recheckResponse.status)
    
    if (recheckResponse.ok) {
      const recheckData = await recheckResponse.json()
      console.log('Post-enrollment data:', recheckData)
    } else {
      console.error('Failed to recheck enrollment:', await recheckResponse.text())
    }
    
  } catch (error) {
    console.error('🔥 Debug failed:', error)
  }
  
  console.log('✅ ENROLLMENT DEBUG COMPLETED')
}

// Usage: Call this from browser console
// debugEnrollment('your-course-id-here')

export default debugEnrollment 