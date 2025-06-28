import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

export async function GET(request) {
  try {
    const { db } = await connectToDatabase()
    
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
      
      // Get user notifications
      const notifications = await db.collection("notifications")
        .find({ userId: new ObjectId(decoded.userId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()

      // If no notifications exist, return sample ones
      if (notifications.length === 0) {
        const sampleNotifications = [
          {
            id: "1",
            title: "Welcome to AI Tutor Platform!",
            message: "Start creating your first course to engage with students.",
            time: "2 hours ago",
            read: false,
            type: "welcome"
          },
          {
            id: "2", 
            title: "Profile Setup",
            message: "Complete your profile to help students learn more about you.",
            time: "1 day ago",
            read: false,
            type: "profile"
          },
          {
            id: "3",
            title: "System Update",
            message: "New AI features have been added to enhance your course creation experience.",
            time: "3 days ago",
            read: true,
            type: "update"
          }
        ]
        return NextResponse.json(sampleNotifications)
      }

      return NextResponse.json(notifications)
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
    const { db } = await connectToDatabase()
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
        const result = await db.collection("notifications").updateOne(
          { 
            _id: new ObjectId(body.notificationId),
            userId: new ObjectId(decoded.userId)
          },
          { 
            $set: { 
              read: true,
              readAt: new Date()
            }
          }
        )

        return NextResponse.json({
          message: "Notification marked as read",
          success: result.modifiedCount > 0
        })
      } else if (body.action === "markAllAsRead") {
        // Mark all notifications as read
        const result = await db.collection("notifications").updateMany(
          { userId: new ObjectId(decoded.userId) },
          { 
            $set: { 
              read: true,
              readAt: new Date()
            }
          }
        )

        return NextResponse.json({
          message: "All notifications marked as read",
          modifiedCount: result.modifiedCount
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
