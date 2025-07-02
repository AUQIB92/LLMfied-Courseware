import { connectToDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

// Notification types
export const NOTIFICATION_TYPES = {
  WELCOME: "welcome",
  COURSE_ENROLLMENT: "course_enrollment", 
  COURSE_COMPLETION: "course_completion",
  PROFILE_UPDATE: "profile_update",
  SYSTEM: "system",
  ACHIEVEMENT: "achievement",
  REMINDER: "reminder",
  MESSAGE: "message",
  COURSE_PUBLISHED: "course_published",
  STUDENT_ENROLLED: "student_enrolled",
  PROGRESS_MILESTONE: "progress_milestone"
}

/**
 * Create a new notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
  priority = "normal" // low, normal, high
}) {
  try {
    const { db } = await connectToDatabase()
    
    const notification = {
      userId: new ObjectId(userId),
      type,
      title,
      message,
      metadata,
      priority,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("notifications").insertOne(notification)
    
    console.log(`✅ Created notification for user ${userId}: ${title}`)
    return { success: true, notificationId: result.insertedId }
  } catch (error) {
    console.error("❌ Failed to create notification:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Create welcome notification for new users
 */
export async function createWelcomeNotification(userId, userRole) {
  const isEducator = userRole === "educator"
  
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.WELCOME,
    title: `Welcome to LLMfied! 🎉`,
    message: isEducator 
      ? "Start creating your first AI-enhanced course and share your knowledge with learners worldwide."
      : "Begin your learning journey! Explore our course library and discover new skills.",
    metadata: { userRole },
    priority: "high"
  })
}

/**
 * Create course enrollment notification
 */
export async function createCourseEnrollmentNotification(userId, courseTitle, courseId) {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.COURSE_ENROLLMENT,
    title: "Course Enrollment Successful! 📚",
    message: `You've successfully enrolled in "${courseTitle}". Start learning now!`,
    metadata: { courseId, courseTitle },
    priority: "normal"
  })
}

/**
 * Create course completion notification
 */
export async function createCourseCompletionNotification(userId, courseTitle, courseId) {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.COURSE_COMPLETION,
    title: "Congratulations! Course Completed! 🏆",
    message: `You've successfully completed "${courseTitle}". Well done on your achievement!`,
    metadata: { courseId, courseTitle },
    priority: "high"
  })
}

/**
 * Create profile update notification
 */
export async function createProfileUpdateNotification(userId) {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.PROFILE_UPDATE,
    title: "Profile Updated Successfully ✅",
    message: "Your profile information has been updated. Your learning experience is now more personalized!",
    metadata: {},
    priority: "low"
  })
}

/**
 * Create course published notification (for educators)
 */
export async function createCoursePublishedNotification(userId, courseTitle, courseId) {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.COURSE_PUBLISHED,
    title: "Course Published Successfully! 🚀",
    message: `Your course "${courseTitle}" is now live and available to learners worldwide.`,
    metadata: { courseId, courseTitle },
    priority: "high"
  })
}

/**
 * Create student enrolled notification (for educators)
 */
export async function createStudentEnrolledNotification(educatorId, studentName, courseTitle, courseId) {
  return await createNotification({
    userId: educatorId,
    type: NOTIFICATION_TYPES.STUDENT_ENROLLED,
    title: "New Student Enrolled! 👋",
    message: `${studentName} has enrolled in your course "${courseTitle}".`,
    metadata: { courseId, courseTitle, studentName },
    priority: "normal"
  })
}

/**
 * Create progress milestone notification
 */
export async function createProgressMilestoneNotification(userId, courseTitle, progress, courseId) {
  const milestones = {
    25: "Quarter way there! 🌟",
    50: "Halfway completed! 🎯", 
    75: "Three-quarters done! 🔥",
    90: "Almost finished! 🏁"
  }
  
  const title = milestones[progress] || "Progress Update 📈"
  
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.PROGRESS_MILESTONE,
    title,
    message: `You've completed ${progress}% of "${courseTitle}". Keep up the great work!`,
    metadata: { courseId, courseTitle, progress },
    priority: "normal"
  })
}

/**
 * Create achievement notification
 */
export async function createAchievementNotification(userId, achievementType, details = {}) {
  const achievements = {
    first_course: {
      title: "First Course Completed! 🎓",
      message: "Congratulations on completing your first course! This is just the beginning of your learning journey."
    },
    streak_7: {
      title: "7-Day Learning Streak! 🔥",
      message: "Amazing! You've maintained a 7-day learning streak. Consistency is key to success!"
    },
    streak_30: {
      title: "30-Day Learning Streak! 🏆",
      message: "Incredible! You've achieved a 30-day learning streak. You're truly dedicated to learning!"
    },
    courses_5: {
      title: "5 Courses Completed! 🌟",
      message: "Fantastic! You've completed 5 courses. Your knowledge is expanding rapidly!"
    },
    courses_10: {
      title: "10 Courses Completed! 💎",
      message: "Outstanding! You've completed 10 courses. You're becoming a true expert!"
    }
  }
  
  const achievement = achievements[achievementType] || {
    title: "Achievement Unlocked! 🏅",
    message: "You've unlocked a new achievement. Keep up the excellent work!"
  }
  
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.ACHIEVEMENT,
    title: achievement.title,
    message: achievement.message,
    metadata: { achievementType, ...details },
    priority: "high"
  })
}

/**
 * Create system notification
 */
export async function createSystemNotification(userId, title, message, metadata = {}) {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.SYSTEM,
    title,
    message,
    metadata,
    priority: "normal"
  })
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId, limit = 50, offset = 0) {
  try {
    const { db } = await connectToDatabase()
    
    const notifications = await db.collection("notifications")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()
    
    return { success: true, notifications }
  } catch (error) {
    console.error("❌ Failed to get notifications:", error)
    return { success: false, error: error.message, notifications: [] }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId, userId) {
  try {
    const { db } = await connectToDatabase()
    
    const result = await db.collection("notifications").updateOne(
      { 
        _id: new ObjectId(notificationId),
        userId: new ObjectId(userId)
      },
      { 
        $set: { 
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    return { success: result.modifiedCount > 0 }
  } catch (error) {
    console.error("❌ Failed to mark notification as read:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const { db } = await connectToDatabase()
    
    const result = await db.collection("notifications").updateMany(
      { userId: new ObjectId(userId) },
      { 
        $set: { 
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    return { success: true, modifiedCount: result.modifiedCount }
  } catch (error) {
    console.error("❌ Failed to mark all notifications as read:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId, userId) {
  try {
    const { db } = await connectToDatabase()
    
    const result = await db.collection("notifications").deleteOne({
      _id: new ObjectId(notificationId),
      userId: new ObjectId(userId)
    })
    
    return { success: result.deletedCount > 0 }
  } catch (error) {
    console.error("❌ Failed to delete notification:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId) {
  try {
    const { db } = await connectToDatabase()
    
    const count = await db.collection("notifications").countDocuments({
      userId: new ObjectId(userId),
      read: false
    })
    
    return { success: true, count }
  } catch (error) {
    console.error("❌ Failed to get unread notification count:", error)
    return { success: false, count: 0 }
  }
} 