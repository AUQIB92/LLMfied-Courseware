/**
 * State-of-the-Art Enrollment Cache Management System
 * 
 * Features:
 * - Single source of truth for enrollment status
 * - Intelligent caching with TTL (Time To Live)
 * - Real-time synchronization across components
 * - Optimistic updates for better UX
 * - Automatic cache invalidation
 * - Memory-efficient storage
 * - Event-driven architecture
 */

class EnrollmentCache {
  constructor() {
    this.cache = new Map()
    this.subscribers = new Set()
    this.lastFetchTime = new Map()
    this.TTL = 5 * 60 * 1000 // 5 minutes cache TTL
    this.batchQueue = new Set()
    this.batchTimeout = null
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    
    // Listen for online/offline events (browser only)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.syncPendingChanges()
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  /**
   * Get enrollment status for a course
   * @param {string} courseId - Course ID
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<{isEnrolled: boolean, enrollment: object|null, cached: boolean}>}
   */
  async getEnrollmentStatus(courseId, forceRefresh = false) {
    const cacheKey = `enrollment_${courseId}`
    const now = Date.now()
    const lastFetch = this.lastFetchTime.get(cacheKey) || 0
    const isCacheValid = !forceRefresh && (now - lastFetch) < this.TTL
    
    // Return cached data if valid
    if (isCacheValid && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      console.log(`📋 Enrollment cache HIT for course ${courseId}:`, cached)
      return { ...cached, cached: true }
    }

    // Fetch from server
    console.log(`🔄 Fetching enrollment status for course ${courseId} from server`)
    try {
      const response = await fetch(`/api/enrollment?courseId=${courseId}`, {
        headers: this.getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        const enrollmentData = {
          isEnrolled: data.isEnrolled,
          enrollment: data.enrollment || null,
          lastUpdated: now,
          courseId
        }

        // Update cache
        this.cache.set(cacheKey, enrollmentData)
        this.lastFetchTime.set(cacheKey, now)

        // Notify subscribers
        this.notifySubscribers('enrollment_updated', { courseId, ...enrollmentData })

        console.log(`✅ Enrollment status cached for course ${courseId}:`, enrollmentData)
        return { ...enrollmentData, cached: false }
      } else {
        console.error(`❌ Failed to fetch enrollment status for course ${courseId}:`, response.status)
        return { isEnrolled: false, enrollment: null, cached: false }
      }
    } catch (error) {
      console.error(`🔥 Error fetching enrollment status for course ${courseId}:`, error)
      
      // Return cached data if available, even if expired
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        console.log(`⚠️ Using stale cache for course ${courseId} due to error:`, cached)
        return { ...cached, cached: true, stale: true }
      }
      
      return { isEnrolled: false, enrollment: null, cached: false, error: true }
    }
  }

  /**
   * Get all enrollments for the current user
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<{enrollments: Map, cached: boolean}>}
   */
  async getAllEnrollments(forceRefresh = false) {
    const cacheKey = 'all_enrollments'
    const now = Date.now()
    const lastFetch = this.lastFetchTime.get(cacheKey) || 0
    const isCacheValid = !forceRefresh && (now - lastFetch) < this.TTL

    if (isCacheValid && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      console.log(`📋 All enrollments cache HIT:`, cached.size, 'enrollments')
      return { enrollments: new Map(cached), cached: true }
    }

    console.log(`🔄 Fetching all enrollments from server`)
    try {
      const response = await fetch('/api/enrollment', {
        headers: this.getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        const enrollmentMap = new Map()

        // Process different response formats
        if (data && Array.isArray(data.enrollments)) {
          data.enrollments.forEach(enrollment => {
            enrollmentMap.set(enrollment.courseId, enrollment)
            // Also cache individual enrollments
            this.cache.set(`enrollment_${enrollment.courseId}`, {
              isEnrolled: true,
              enrollment,
              lastUpdated: now,
              courseId: enrollment.courseId
            })
          })
        } else if (data && Array.isArray(data.courses)) {
          data.courses.forEach(course => {
            const courseId = course._id || course.id
            enrollmentMap.set(courseId, { courseId })
            this.cache.set(`enrollment_${courseId}`, {
              isEnrolled: true,
              enrollment: { courseId },
              lastUpdated: now,
              courseId
            })
          })
        }

        // Cache all enrollments
        this.cache.set(cacheKey, enrollmentMap)
        this.lastFetchTime.set(cacheKey, now)

        console.log(`✅ All enrollments cached:`, enrollmentMap.size, 'enrollments')
        return { enrollments: enrollmentMap, cached: false }
      } else {
        console.error(`❌ Failed to fetch all enrollments:`, response.status)
        return { enrollments: new Map(), cached: false }
      }
    } catch (error) {
      console.error(`🔥 Error fetching all enrollments:`, error)
      
      // Return cached data if available
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        console.log(`⚠️ Using stale all enrollments cache due to error:`, cached.size, 'enrollments')
        return { enrollments: new Map(cached), cached: true, stale: true }
      }
      
      return { enrollments: new Map(), cached: false, error: true }
    }
  }

  /**
   * Optimistic enrollment update
   * @param {string} courseId - Course ID
   * @param {boolean} isEnrolled - New enrollment status
   * @param {object} enrollmentData - Additional enrollment data
   */
  async updateEnrollment(courseId, isEnrolled, enrollmentData = null) {
    const now = Date.now()
    const cacheKey = `enrollment_${courseId}`
    
    // 🛡️ EARLY DUPLICATE PREVENTION: Check if already in desired state
    const currentStatus = this.cache.get(cacheKey)
    if (currentStatus && currentStatus.isEnrolled === isEnrolled && !currentStatus.optimistic) {
      console.log(`⏭️ Course ${courseId} already in desired state (${isEnrolled ? 'enrolled' : 'not enrolled'}) - skipping update`)
      return // No need to update or queue for sync
    }
    
    // Optimistic update - update cache immediately
    const optimisticData = {
      isEnrolled,
      enrollment: isEnrolled ? (enrollmentData || { courseId, enrolledAt: new Date() }) : null,
      lastUpdated: now,
      courseId,
      optimistic: true
    }

    this.cache.set(cacheKey, optimisticData)
    this.lastFetchTime.set(cacheKey, now)

    // Update all enrollments cache
    const allEnrollmentsKey = 'all_enrollments'
    if (this.cache.has(allEnrollmentsKey)) {
      const allEnrollments = this.cache.get(allEnrollmentsKey)
      if (isEnrolled) {
        allEnrollments.set(courseId, optimisticData.enrollment)
      } else {
        allEnrollments.delete(courseId)
      }
      this.cache.set(allEnrollmentsKey, allEnrollments)
    }

    // Notify subscribers immediately
    this.notifySubscribers('enrollment_updated', { courseId, ...optimisticData })

    // Queue for batch server sync
    this.queueForSync(courseId, isEnrolled, enrollmentData)

    console.log(`⚡ Optimistic enrollment update for course ${courseId}:`, optimisticData)
  }

  /**
   * Queue enrollment change for batch sync with server
   */
  queueForSync(courseId, isEnrolled, enrollmentData) {
    this.batchQueue.add({ courseId, isEnrolled, enrollmentData, timestamp: Date.now() })

    // Clear existing timeout and set new one
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    // Batch sync after 500ms of inactivity
    this.batchTimeout = setTimeout(() => {
      this.syncBatchedChanges()
    }, 500)
  }

  /**
   * Sync batched changes with server
   */
  async syncBatchedChanges() {
    if (this.batchQueue.size === 0 || !this.isOnline) return

    const changes = Array.from(this.batchQueue)
    this.batchQueue.clear()

    console.log(`🔄 Syncing ${changes.length} enrollment changes with server`)

    for (const change of changes) {
      try {
        const { courseId, isEnrolled } = change
        
        // 🛡️ SMART DUPLICATE PREVENTION: Check current enrollment status before making server request
        const currentStatus = await this.getEnrollmentStatus(courseId, true) // Force fresh check
        const currentlyEnrolled = currentStatus?.isEnrolled === true
        
        console.log(`🔍 Pre-sync verification for course ${courseId}:`, {
          wantToEnroll: isEnrolled,
          currentlyEnrolled,
          shouldSkip: (isEnrolled && currentlyEnrolled) || (!isEnrolled && !currentlyEnrolled)
        })
        
        // Skip if user is already in the desired state
        if ((isEnrolled && currentlyEnrolled) || (!isEnrolled && !currentlyEnrolled)) {
          console.log(`✅ Course ${courseId} already in desired state (${isEnrolled ? 'enrolled' : 'not enrolled'}) - skipping server request`)
          
          // Update cache with current state to prevent future duplicates
          if (currentlyEnrolled) {
            this.cache.set(`enrollment_${courseId}`, {
              isEnrolled: true,
              enrollment: currentStatus.enrollment || { courseId },
              lastUpdated: Date.now(),
              courseId,
              optimistic: false
            })
          } else {
            this.cache.delete(`enrollment_${courseId}`)
          }
          
          continue // Skip to next change
        }
        
        if (isEnrolled) {
          // Enroll (only if not already enrolled)
          console.log(`📝 Proceeding with enrollment for course ${courseId} (verified not already enrolled)`)
          const response = await fetch('/api/enrollment', {
            method: 'POST',
            headers: {
              ...this.getAuthHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ courseId }),
          })

          if (response.ok) {
            const data = await response.json()
            // Update cache with server response
            this.cache.set(`enrollment_${courseId}`, {
              isEnrolled: true,
              enrollment: data.enrollment || { courseId },
              lastUpdated: Date.now(),
              courseId,
              optimistic: false
            })
            console.log(`✅ Server confirmed enrollment for course ${courseId}`)
          } else {
            // Get detailed error information
            let errorMessage = 'Server rejected enrollment'
            let errorType = 'unknown'
            
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
              
              // Categorize error types
              if (response.status === 409) {
                errorType = 'already_enrolled'
                errorMessage = 'You are already enrolled in this course'
                
                // 🎯 GRACEFUL 409 HANDLING: Treat "already enrolled" as success
                console.log(`✅ Course ${courseId} - User already enrolled (409), treating as successful enrollment`)
                
                // Update cache to reflect enrolled state
                this.cache.set(`enrollment_${courseId}`, {
                  isEnrolled: true,
                  enrollment: { courseId },
                  lastUpdated: Date.now(),
                  courseId,
                  optimistic: false
                })
                
                // Notify subscribers of successful enrollment state
                this.notifySubscribers('enrollment_updated', { courseId, isEnrolled: true })
                
                // Don't show error notification for 409 - it's not really an error
                continue // Skip to next change without showing error
              } else if (response.status === 404) {
                errorType = 'course_not_found'
                errorMessage = 'Course not found or no longer available'
              } else if (response.status === 403) {
                errorType = 'permission_denied'
                errorMessage = 'You do not have permission to enroll in this course'
              } else if (response.status === 400) {
                errorType = 'invalid_request'
                errorMessage = 'Invalid enrollment request'
              }
            } catch (parseError) {
              console.warn('Could not parse error response:', parseError)
            }
            
            console.error(`❌ Server rejected enrollment for course ${courseId} (${response.status}): ${errorMessage}`)
            
            // Revert optimistic update
            this.cache.delete(`enrollment_${courseId}`)
            
            // Notify with detailed error information
            this.notifySubscribers('enrollment_error', { 
              courseId, 
              error: errorMessage,
              errorType,
              statusCode: response.status
            })
            
            // Show user-friendly notification
            this.showEnrollmentErrorNotification(errorMessage, errorType)
          }
        } else {
          // Unenroll (only if currently enrolled)
          console.log(`🗑️ Proceeding with unenrollment for course ${courseId} (verified currently enrolled)`)
          const response = await fetch(`/api/enrollment?courseId=${courseId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
          })

          if (response.ok) {
            // Confirm removal from cache
            this.cache.delete(`enrollment_${courseId}`)
            console.log(`✅ Server confirmed unenrollment for course ${courseId}`)
          } else {
            // Get detailed error information for unenrollment
            let errorMessage = 'Server rejected unenrollment'
            let errorType = 'unenroll_failed'
            
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
              
              if (response.status === 404) {
                errorType = 'not_enrolled'
                errorMessage = 'You are not enrolled in this course'
                
                // 🎯 GRACEFUL 404 HANDLING: Treat "not enrolled" as successful unenrollment
                console.log(`✅ Course ${courseId} - User not enrolled (404), treating as successful unenrollment`)
                
                // Remove from cache to reflect unenrolled state
                this.cache.delete(`enrollment_${courseId}`)
                
                // Notify subscribers of successful unenrollment state
                this.notifySubscribers('enrollment_updated', { courseId, isEnrolled: false })
                
                // Don't show error notification for 404 during unenrollment - it's not really an error
                continue // Skip to next change without showing error
              }
            } catch (parseError) {
              console.warn('Could not parse unenrollment error response:', parseError)
            }
            
            console.error(`❌ Server rejected unenrollment for course ${courseId} (${response.status}): ${errorMessage}`)
            
            // Revert optimistic update
            this.notifySubscribers('enrollment_error', { 
              courseId: change.courseId, 
              error: errorMessage,
              errorType,
              statusCode: response.status
            })
            
            // Show user-friendly notification
            this.showEnrollmentErrorNotification(errorMessage, errorType)
          }
        }
      } catch (error) {
        console.error(`🔥 Error syncing enrollment change:`, error)
        
        // Provide better error messaging
        let userFriendlyMessage = 'Network error - please check your connection'
        let errorType = 'network_error'
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          userFriendlyMessage = 'Unable to connect to server - please try again'
        } else if (error.message.includes('token')) {
          userFriendlyMessage = 'Session expired - please log in again'
          errorType = 'auth_error'
        }
        
        this.notifySubscribers('enrollment_error', { 
          courseId: change.courseId, 
          error: userFriendlyMessage,
          errorType,
          originalError: error.message
        })
        
        // Show user-friendly notification
        this.showEnrollmentErrorNotification(userFriendlyMessage, errorType)
      }
    }
  }

  /**
   * Sync pending changes when coming back online
   */
  async syncPendingChanges() {
    console.log(`🌐 Back online - syncing pending changes`)
    await this.syncBatchedChanges()
  }

  /**
   * Subscribe to enrollment changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers of changes
   */
  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        console.error('Error in enrollment cache subscriber:', error)
      }
    })
  }

  /**
   * Invalidate cache for specific course or all
   * @param {string} courseId - Course ID (optional)
   */
  invalidateCache(courseId = null) {
    if (courseId) {
      this.cache.delete(`enrollment_${courseId}`)
      this.lastFetchTime.delete(`enrollment_${courseId}`)
      console.log(`🗑️ Invalidated cache for course ${courseId}`)
    } else {
      this.cache.clear()
      this.lastFetchTime.clear()
      console.log(`🗑️ Invalidated all enrollment cache`)
    }
  }

  /**
   * Show user-friendly enrollment error notification
   * @param {string} errorMessage - Error message to display
   * @param {string} errorType - Type of error for styling
   */
  showEnrollmentErrorNotification(errorMessage, errorType) {
    // Only show notification in browser environment
    if (typeof document === 'undefined') return

    const notification = document.createElement('div')
    notification.className = `fixed top-8 right-8 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500 ${
      errorType === 'already_enrolled' ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
      errorType === 'course_not_found' ? 'bg-gradient-to-r from-red-500 to-pink-600' :
      errorType === 'permission_denied' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
      errorType === 'network_error' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
      errorType === 'auth_error' ? 'bg-gradient-to-r from-orange-500 to-red-600' :
      errorType === 'not_enrolled' ? 'bg-gradient-to-r from-gray-500 to-slate-600' :
      'bg-gradient-to-r from-slate-500 to-slate-600'
    }`
    
    const getIconSvg = (type) => {
      switch (type) {
        case 'already_enrolled':
          return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
        case 'course_not_found':
          return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"></path></svg>'
        case 'network_error':
          return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>'
        case 'auth_error':
          return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>'
        default:
          return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"></path></svg>'
      }
    }
    
    const iconSvg = getIconSvg(errorType)
    
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          ${iconSvg}
        </div>
        <div class="flex-1">
          <div class="font-semibold">Enrollment Failed</div>
          <div class="text-sm text-white/90 mt-1">${errorMessage}</div>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 500)
    }, 5000)
  }

  /**
   * Get auth headers
   */
  getAuthHeaders() {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem("token")
      return token ? { Authorization: `Bearer ${token}` } : {}
    }
    return {}
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      subscriberCount: this.subscribers.size,
      batchQueueSize: this.batchQueue.size,
      isOnline: this.isOnline,
      lastFetchTimes: Object.fromEntries(this.lastFetchTime)
    }
  }

  /**
   * Preload enrollments for courses
   * @param {Array} courseIds - Array of course IDs
   */
  async preloadEnrollments(courseIds) {
    console.log(`🚀 Preloading enrollments for ${courseIds.length} courses`)
    
    const promises = courseIds.map(courseId => 
      this.getEnrollmentStatus(courseId).catch(error => {
        console.warn(`Failed to preload enrollment for course ${courseId}:`, error)
        return null
      })
    )

    await Promise.allSettled(promises)
    console.log(`✅ Preloading completed`)
  }
}

// Create singleton instance
const enrollmentCache = new EnrollmentCache()

// Export both the instance and the class
export default enrollmentCache
export { EnrollmentCache }
