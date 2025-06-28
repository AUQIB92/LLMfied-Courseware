import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

export async function PUT(request) {
  try {
    console.log("Profile PUT request received")
    
    const { db } = await connectToDatabase()
    console.log("Database connected successfully")
    
    const body = await request.json()
    console.log("Request body:", body)
    
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No authorization header found")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log("Token extracted")
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      console.log("Token decoded:", decoded)
      
      // Update user profile
      const updateData = {
        ...(body.name && { name: body.name }),
        ...(body.email && { email: body.email }),
        ...(body.bio && { bio: body.bio }),
        ...(body.avatar && { avatar: body.avatar }),
        ...(body.organization && { organization: body.organization }),
        ...(body.title && { title: body.title }),
        ...(body.website && { website: body.website }),
        ...(body.phone && { phone: body.phone }),
        ...(body.location && { location: body.location }),
        updatedAt: new Date()
      }

      console.log("Update data prepared:", updateData)

      const result = await db.collection("users").updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: updateData },
        { upsert: true }
      )

      console.log("Database update result:", result)

      if (result.matchedCount === 0 && result.upsertedCount === 0) {
        return NextResponse.json(
          { error: "Failed to update user profile" },
          { status: 500 }
        )
      }

      // Get updated user data
      const updatedUser = await db.collection("users").findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      )

      return NextResponse.json({
        message: "Profile updated successfully",
        user: updatedUser
      })
    } catch (jwtError) {
      console.log("JWT Error:", jwtError)
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    console.log("Profile GET request received")
    
    const { db } = await connectToDatabase()
    console.log("Database connected successfully")
    
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No authorization header found")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log("Token extracted")
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      console.log("Token decoded:", decoded)
      
      // Get user profile
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      )

      if (!user) {
        // Create a default user profile if not found
        const defaultUser = {
          _id: new ObjectId(decoded.userId),
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || "User",
          bio: "",
          location: "",
          website: "",
          avatar: "",
          phone: "",
          organization: "",
          title: "",
          expertise: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await db.collection("users").insertOne(defaultUser)
        
        return NextResponse.json({ 
          user: defaultUser,
          message: "Profile created successfully"
        })
      }

      return NextResponse.json({ user })
    } catch (jwtError) {
      console.log("JWT Error:", jwtError)
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
