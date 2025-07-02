import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  createWelcomeNotification
} from "@/lib/notificationService"

export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      
      // Get user notifications using the notification service
      const result = await getUserNotifications(decoded.userId)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        )
      }

      // If no notifications exist, create a welcome notification
      if (result.notifications.length === 0) {
        console.log("No notifications found, creating welcome notification...")
        
        // Get user role from database
        const { db } = await connectToDatabase()
        const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
        
        if (user) {
          await createWelcomeNotification(decoded.userId, user.role)
          // Fetch notifications again after creating welcome notification
          const updatedResult = await getUserNotifications(decoded.userId)
          if (updatedResult.success) {
            return NextResponse.json(updatedResult.notifications)
          }
        }
      }

      // Format notifications for frontend compatibility
      const formattedNotifications = result.notifications.map(notification => ({
        id: notification._id.toString(),
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        readAt: notification.readAt,
        metadata: notification.metadata,
        priority: notification.priority,
        // Legacy format support
        time: formatTimeAgo(notification.createdAt)
      }))

      return NextResponse.json(formattedNotifications)
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      
      if (body.action === "markAsRead" && body.notificationId) {
        // Mark specific notification as read
        const result = await markNotificationAsRead(body.notificationId, decoded.userId)

        return NextResponse.json({
          message: "Notification marked as read",
          success: result.success
        })
      } else if (body.action === "markAllAsRead") {
        // Mark all notifications as read
        const result = await markAllNotificationsAsRead(decoded.userId)

        return NextResponse.json({
          message: "All notifications marked as read",
          modifiedCount: result.modifiedCount,
          success: result.success
        })
      }

      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Notifications update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    
    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }
    
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      
      const result = await deleteNotification(notificationId, decoded.userId)

      return NextResponse.json({
        message: "Notification deleted",
        success: result.success
      })
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Notification delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000)
  
  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return new Date(date).toLocaleDateString()
}
