import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

export async function PUT(request) {
  try {
    console.log("🔄 Profile PUT request received")
    console.log("📅 Timestamp:", new Date().toISOString())
    
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not configured")
      return NextResponse.json(
        { error: "Database configuration error" },
        { status: 500 }
      )
    }

    console.log("🔗 Connecting to database...")
    const { db } = await connectToDatabase()
    console.log("✅ Database connected successfully")
    
    console.log("📖 Reading request body...")
    const body = await request.json()
    console.log("📋 Request body received:", JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body || typeof body !== 'object') {
      console.error("❌ Invalid request body format")
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    // Get token from Authorization header
    console.log("🔐 Checking authorization header...")
    const authHeader = request.headers.get("Authorization")
    console.log("🔑 Auth header exists:", !!authHeader)
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No valid authorization header found")
      return NextResponse.json(
        { error: "Unauthorized - Missing or invalid authorization header" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log("🎫 Token extracted, length:", token.length)
    
    // Verify JWT token
    console.log("🔍 Verifying JWT token...")
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      console.log("✅ Token decoded successfully")
      console.log("👤 User ID from token:", decoded.userId)
      console.log("📧 Email from token:", decoded.email)
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError.message)
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    // Validate ObjectId
    if (!ObjectId.isValid(decoded.userId)) {
      console.error("❌ Invalid user ID format:", decoded.userId)
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      )
    }

    // Prepare update data with validation
    console.log("📝 Preparing update data...")
    const updateData = {}
    
    // Only include fields that are provided and valid
    if (body.name !== undefined) {
      if (typeof body.name === 'string' && body.name.trim().length > 0) {
        updateData.name = body.name.trim()
        console.log("✅ Name field added:", updateData.name)
      } else {
        console.error("❌ Invalid name field:", body.name)
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        )
      }
    }
    
    if (body.email !== undefined) {
      if (typeof body.email === 'string' && body.email.includes('@')) {
        updateData.email = body.email.trim().toLowerCase()
        console.log("✅ Email field added:", updateData.email)
      } else {
        console.error("❌ Invalid email field:", body.email)
        return NextResponse.json(
          { error: "Email must be a valid email address" },
          { status: 400 }
        )
      }
    }
    
    // Optional fields - allow empty strings
    const optionalFields = ['bio', 'organization', 'title', 'website', 'phone', 'location', 'avatar']
    optionalFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = typeof body[field] === 'string' ? body[field].trim() : body[field]
        console.log(`✅ ${field} field added:`, updateData[field])
      }
    })

    updateData.updatedAt = new Date()
    console.log("📋 Final update data:", JSON.stringify(updateData, null, 2))

    if (Object.keys(updateData).length === 1) { // Only updatedAt
      console.error("❌ No valid fields to update")
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      )
    }

    // Update user profile
    console.log("💾 Updating user profile in database...")
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: updateData }
    )

    console.log("📊 Database update result:")
    console.log("   - Matched count:", result.matchedCount)
    console.log("   - Modified count:", result.modifiedCount)
    console.log("   - Acknowledged:", result.acknowledged)

    if (result.matchedCount === 0) {
      console.error("❌ User not found in database")
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (result.modifiedCount === 0) {
      console.log("ℹ️ No changes made (data was identical)")
      // This is not necessarily an error - data might be identical
    }

    // Get updated user data
    console.log("📖 Fetching updated user data...")
    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    )

    if (!updatedUser) {
      console.error("❌ Failed to fetch updated user data")
      return NextResponse.json(
        { error: "Failed to retrieve updated profile" },
        { status: 500 }
      )
    }

    console.log("✅ Profile updated successfully")
    console.log("👤 Updated user data:", JSON.stringify(updatedUser, null, 2))

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
      changesCount: result.modifiedCount
    })

  } catch (error) {
    console.error("💥 Profile update error:", error)
    console.error("📍 Error stack:", error.stack)
    
    // Provide more specific error messages
    let errorMessage = "Internal server error"
    let statusCode = 500
    
    if (error.message.includes('timeout')) {
      errorMessage = "Database connection timeout"
      statusCode = 503
    } else if (error.message.includes('network')) {
      errorMessage = "Network error"
      statusCode = 503
    } else if (error.message.includes('JSON')) {
      errorMessage = "Invalid request format"
      statusCode = 400
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}

export async function GET(request) {
  try {
    console.log("🔄 Profile GET request received")
    console.log("📅 Timestamp:", new Date().toISOString())
    
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not configured")
      return NextResponse.json(
        { error: "Database configuration error" },
        { status: 500 }
      )
    }

    console.log("🔗 Connecting to database...")
    const { db } = await connectToDatabase()
    console.log("✅ Database connected successfully")
    
    // Get token from Authorization header
    console.log("🔐 Checking authorization header...")
    const authHeader = request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No valid authorization header found")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log("🎫 Token extracted")
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      console.log("✅ Token decoded successfully")
      console.log("👤 User ID:", decoded.userId)
      
      // Get user profile
      console.log("📖 Fetching user profile...")
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      )

      if (!user) {
        console.log("👤 User not found, creating default profile...")
        
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

        console.log("💾 Inserting default user profile...")
        await db.collection("users").insertOne(defaultUser)
        console.log("✅ Default profile created")
        
        return NextResponse.json({ 
          user: defaultUser,
          message: "Profile created successfully"
        })
      }

      console.log("✅ Profile fetched successfully")
      return NextResponse.json({ user })
      
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError.message)
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("💥 Profile fetch error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
