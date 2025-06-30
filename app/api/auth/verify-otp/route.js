import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendLearnerRegistrationNotification } from "@/lib/emailService"

export async function POST(request) {
  try {
    console.log("=== Starting POST /api/auth/verify-otp ===")
    
    const body = await request.json()
    const { email, otp, password } = body
    
    console.log("Verifying OTP for:", email)
    
    if (!email || !otp || !password) {
      console.error("Missing required fields:", { email: !!email, otp: !!otp, password: !!password })
      return NextResponse.json({ error: "Email, OTP, and password are required" }, { status: 400 })
    }
    
    console.log("Connecting to MongoDB...")
    const client = await clientPromise
    const db = client.db("llmfied")
    
    // Find OTP record
    const otpRecord = await db.collection("otps").findOne({ 
      email, 
      otp: otp.toString(),
      verified: false 
    })
    
    if (!otpRecord) {
      console.log("Invalid OTP for:", email)
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }
    
    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      console.log("Expired OTP for:", email)
      // Clean up expired OTP
      await db.collection("otps").deleteOne({ _id: otpRecord._id })
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
    }
    
    console.log("OTP verified successfully for:", email)
    
    // Check if user already exists (double check)
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      console.log("User already exists:", email)
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }
    
    // Hash password and create user
    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 12)
    
    console.log("Creating new user...")
    const user = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name: otpRecord.name,
      role: "learner", // Always learner for OTP registration
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    console.log("User created with ID:", user.insertedId)
    
    // Mark OTP as verified and clean up
    await db.collection("otps").updateOne(
      { _id: otpRecord._id },
      { $set: { verified: true, verifiedAt: new Date() } }
    )
    
    // Clean up old OTPs (optional cleanup)
    await db.collection("otps").deleteMany({ 
      email,
      _id: { $ne: otpRecord._id }
    })
    
    // Send registration notification emails
    console.log("Sending registration notification emails...")
    const emailResult = await sendLearnerRegistrationNotification({
      name: otpRecord.name,
      email,
      role: "learner"
    })
    
    if (emailResult.success) {
      console.log("✅ Registration notification emails sent successfully")
    } else {
      console.warn("⚠️ Failed to send registration notification emails:", emailResult.error)
    }
    
    // Generate JWT token
    console.log("Generating JWT token...")
    const token = jwt.sign(
      { userId: user.insertedId, email, role: "learner" }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    )
    
    console.log("Registration with OTP verification successful for:", email)
    return NextResponse.json({ 
      success: true,
      token, 
      user: { 
        id: user.insertedId, 
        email, 
        name: otpRecord.name, 
        role: "learner",
        emailVerified: true
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
