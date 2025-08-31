import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendLearnerRegistrationNotification } from "@/lib/emailService"

export async function POST(request) {
  let client = null;
  try {
    console.log("=== Starting POST /api/verify-otp ===")
    
    const body = await request.json()
    const { email, otp, password, name } = body
    
    console.log("OTP verification for:", email)
    
    if (!email || !otp || !password || !name) {
      console.error("Missing required fields:", { email: !!email, otp: !!otp, password: !!password, name: !!name })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    console.log("Connecting to MongoDB...")
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Find and verify OTP
    console.log("Looking for OTP record...")
    const otpRecord = await db.collection("otps").findOne({ 
      email, 
      otp,
      expiresAt: { $gt: new Date() } // Check if not expired
    })
    
    if (!otpRecord) {
      console.log("Invalid or expired OTP for:", email)
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }
    
    console.log("OTP verified successfully for:", email)
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      console.log("User already exists:", email)
      // Clean up OTP
      await db.collection("otps").deleteOne({ _id: otpRecord._id })
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and create user
    console.log("Creating new user...")
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const user = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      role: "learner", // Always learner for OTP registration
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true // Mark as verified since they used OTP
    })

    console.log("User created with ID:", user.insertedId)
    
    // Clean up OTP record
    await db.collection("otps").deleteOne({ _id: otpRecord._id })
    console.log("OTP record cleaned up")
    
    // Send welcome email
    console.log("Sending welcome email...")
    const emailResult = await sendLearnerRegistrationNotification({
      name,
      email,
      role: "learner"
    })
    
    if (emailResult.success) {
      console.log("✅ Welcome emails sent successfully")
    } else {
      console.warn("⚠️ Failed to send welcome emails:", emailResult.error)
    }
    
    // Generate JWT token
    console.log("Generating JWT token...")
    const token = jwt.sign({ 
      userId: user.insertedId, 
      email, 
      role: "learner" 
    }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    })

    console.log("Registration completed successfully for:", email)
    return NextResponse.json({ 
      success: true,
      token, 
      user: { 
        id: user.insertedId, 
        email, 
        name, 
        role: "learner" 
      } 
    })
    
  } catch (error) {
    console.error("=== VERIFY OTP API ERROR ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("=== END VERIFY OTP ERROR ===")
    
    return NextResponse.json({ 
      error: "OTP verification failed",
      details: error.message
    }, { status: 500 })
  }
}
