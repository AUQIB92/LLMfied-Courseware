import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { sendOTPEmail } from "@/lib/emailService"

export async function POST(request) {
  let client = null;
  try {
    console.log("=== Starting POST /api/send-otp ===")
    
    const body = await request.json()
    const { email, name } = body
    
    console.log("Sending OTP to:", email)
    
    if (!email || !name) {
      console.error("Missing required fields:", { email: !!email, name: !!name })
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email)
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }
    
    console.log("Connecting to MongoDB...")
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      console.log("User already exists:", email)
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("Generated OTP for", email)
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    
    // Clean up any existing OTPs for this email
    await db.collection("otps").deleteMany({ email })
    
    // Store OTP in database
    await db.collection("otps").insertOne({
      email,
      name,
      otp,
      createdAt: new Date(),
      expiresAt
    })
    
    console.log("OTP stored in database for:", email)
    
    // Send OTP email
    console.log("Sending OTP email...")
    const emailResult = await sendOTPEmail({
      email,
      name,
      otp
    })
    
    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error)
      // Clean up OTP record if email failed
      await db.collection("otps").deleteMany({ email })
      return NextResponse.json({ 
        error: "Failed to send OTP email. Please try again." 
      }, { status: 500 })
    }
    
    console.log("✅ OTP sent successfully to:", email)
    return NextResponse.json({ 
      success: true,
      message: "OTP sent to your email address" 
    })
    
  } catch (error) {
    console.error("=== SEND OTP API ERROR ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("=== END SEND OTP ERROR ===")
    
    return NextResponse.json({ 
      error: "Failed to send OTP",
      details: error.message
    }, { status: 500 })
  }
}
