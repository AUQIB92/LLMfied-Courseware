import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const userId = resolvedParams.id
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Fetch public user information (exclude sensitive data like password, email)
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { 
        projection: { 
          name: 1,
          avatar: 1,
          bio: 1,
          title: 1,
          organization: 1,
          role: 1,
          createdAt: 1
        } 
      }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Fetch user error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
} 