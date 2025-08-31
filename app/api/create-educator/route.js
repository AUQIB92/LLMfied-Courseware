import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

// This endpoint is for testing purposes - to create a test educator account
export async function POST(request) {
  let client = null;
  try {
    console.log("=== Creating Test Educator Account ===")
    
    const body = await request.json()
    const { email, password, name } = body
    
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: "Email, password, and name are required" 
      }, { status: 400 })
    }
    
    console.log("Connecting to MongoDB...")
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ 
        error: "User already exists" 
      }, { status: 400 })
    }

    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 12)
    
    console.log("Creating educator user...")
    const user = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      role: "educator", // Educator role
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log("Educator created with ID:", user.insertedId)
    
    return NextResponse.json({
      success: true,
      message: "Test educator account created successfully",
      user: { 
        id: user.insertedId, 
        email, 
        name, 
        role: "educator" 
      }
    })
    
  } catch (error) {
    console.error("=== CREATE EDUCATOR ERROR ===")
    console.error("Error:", error.message)
    
    return NextResponse.json({ 
      error: "Failed to create educator account",
      details: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test Educator Creation Endpoint",
    instructions: "Send a POST request with { email, password, name } to create a test educator account",
    example: {
      email: "educator@example.com",
      password: "password123",
      name: "Test Educator"
    }
  })
}
