import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

export async function GET(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const { db } = await connectToDatabase()

    const preferences = await db.collection("preferences").findOne({
      userId: new ObjectId(decoded.userId)
    })

    if (!preferences) {
      // Return default preferences
      return NextResponse.json({
        emailNotifications: true,
        pushNotifications: false,
        browserNotifications: false,
        courseUpdates: true,
        studentMessages: true,
        systemAlerts: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        autoSave: true,
        publicProfile: true,
        soundEffects: true,
        compactView: false,
        showTips: true,
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json({ 
      message: "Error fetching preferences", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    console.log("PUT /api/preferences - Starting request processing")
    
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.log("PUT /api/preferences - No token provided")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    console.log("PUT /api/preferences - Token found, verifying...")
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("PUT /api/preferences - Token verified for user:", decoded.userId)
    
    const body = await req.json()
    console.log("PUT /api/preferences - Request body:", JSON.stringify(body, null, 2))
    
    console.log("PUT /api/preferences - Connecting to database...")
    const { db } = await connectToDatabase()
    console.log("PUT /api/preferences - Database connected")

    // Filter out immutable fields that MongoDB doesn't allow updating
    const { _id, userId: bodyUserId, ...preferencesData } = body
    
    const updateData = {
      ...preferencesData,
      userId: new ObjectId(decoded.userId),
      updatedAt: new Date()
    }
    
    console.log("PUT /api/preferences - Updating preferences with filtered data:", JSON.stringify(updateData, null, 2))

    const result = await db.collection("preferences").updateOne(
      { userId: new ObjectId(decoded.userId) },
      { $set: updateData },
      { upsert: true }
    )

    console.log("PUT /api/preferences - Update result:", result)

    return NextResponse.json({ 
      message: "Preferences updated successfully",
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId
    })
  } catch (error) {
    console.error("Error updating preferences:", error)
    console.error("Error stack:", error.stack)
    
    // Check for specific error types
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ 
        message: "Invalid token", 
        error: error.message 
      }, { status: 401 })
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return NextResponse.json({ 
        message: "Database error", 
        error: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: "Error updating preferences", 
      error: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
