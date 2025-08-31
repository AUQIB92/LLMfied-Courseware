import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { sendOTPEmail } from "@/lib/emailService"

// Helper function to generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
  let client = null;
  try {
    console.log("=== Starting POST /api/auth/send-otp ===")
    
    const body = await request.json()
    const { email, name } = body
    
    console.log("Sending OTP to:", email)
    
    if (!email || !name) {
      console.error("Missing required fields:", { email: !!email, name: !!name })
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }
    
    // Check if user already exists
    console.log("Connecting to MongoDB...")
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      console.log("User already exists:", email)
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }
    
    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    
    console.log("Generated OTP:", otp, "expires at:", expiresAt)
    
    // Store OTP in database (temporary collection)
    await db.collection("otps").deleteMany({ email }) // Remove any existing OTPs for this email
    await db.collection("otps").insertOne({
      email,
      name,
      otp,
      expiresAt,
      createdAt: new Date(),
      verified: false
    })
    
    console.log("OTP stored in database")
    
    // Send OTP email
    const emailResult = await sendOTPEmail({
      email,
      name,
      otp
    })
    
    if (emailResult.success) {
      console.log("✅ OTP email sent successfully")
      return NextResponse.json({ 
        success: true, 
        message: "OTP sent to your email address",
        expiresIn: 600 // 10 minutes in seconds
      })
    } else {
      console.error("❌ Failed to send OTP email:", emailResult.error)
      return NextResponse.json({ 
        error: "Failed to send OTP email. Please try again." 
      }, { status: 500 })
    }
    
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
