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
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        studyReminders: true
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json({ message: "Error fetching preferences" }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const body = await req.json()
    const { db } = await connectToDatabase()

    const result = await db.collection("preferences").updateOne(
      { userId: new ObjectId(decoded.userId) },
      { 
        $set: {
          ...body,
          userId: new ObjectId(decoded.userId),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ 
      message: "Preferences updated successfully",
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId
    })
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json({ message: "Error updating preferences" }, { status: 500 })
  }
}
