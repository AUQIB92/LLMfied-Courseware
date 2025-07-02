import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { markAllNotificationsAsRead } from "@/lib/notificationService"

export async function PUT(request) {
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
      
      const result = await markAllNotificationsAsRead(decoded.userId)

      return NextResponse.json({
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount,
        success: result.success
      })
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 