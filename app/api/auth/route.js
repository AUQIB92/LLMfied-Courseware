import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendLearnerRegistrationNotification, sendEducatorRegistrationNotification } from "@/lib/emailService"

// Helper function to check if a password is already hashed
function isPasswordHashed(password) {
  // bcrypt hashes always start with $2a$, $2b$, or $2y$ and are 60 characters long
  return password && (
    password.startsWith('$2a$') || 
    password.startsWith('$2b$') || 
    password.startsWith('$2y$')
  ) && password.length === 60
}

export async function POST(request) {
  try {
    console.log("=== Starting POST /api/auth ===")
    
    const body = await request.json()
    const { action, email, password, name, role } = body
    
    console.log("Auth action:", action, "for email:", email)
    
    if (!action || !email || !password) {
      console.error("Missing required fields:", { action: !!action, email: !!email, password: !!password })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    console.log("Connecting to MongoDB...")
    const client = await clientPromise
    console.log("MongoDB client obtained successfully")
    
    const db = client.db("llmfied")
    console.log("Database selected: llmfied")

    if (action === "register") {
      console.log("Processing registration for:", email)
      
      // Check if user already exists
      const existingUser = await db.collection("users").findOne({ email })
      if (existingUser) {
        console.log("User already exists:", email)
        return NextResponse.json({ error: "User already exists" }, { status: 400 })
      }

      console.log("Hashing password for new user...")
      const hashedPassword = await bcrypt.hash(password, 12)
      console.log("Password hashed successfully")

      const userRole = role || "learner"
      
      console.log("Creating new user with role:", userRole)
      const user = await db.collection("users").insertOne({
        email,
        password: hashedPassword,
        name,
        role: userRole,
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHashed: true, // Flag to indicate password is hashed
      })

      console.log("User created successfully with ID:", user.insertedId)

      console.log("Generating JWT token...")
      const token = jwt.sign({ userId: user.insertedId, email, role: userRole }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      })

      // Send registration notification emails
      console.log("Sending registration notification emails...")
      let emailResult
      if (userRole === "educator") {
        emailResult = await sendEducatorRegistrationNotification({ name, email, role: userRole })
      } else {
        emailResult = await sendLearnerRegistrationNotification({ name, email, role: userRole })
      }
      
      if (emailResult.success) {
        console.log("✅ Registration notification emails sent successfully")
      } else {
        console.warn("⚠️ Failed to send registration notification emails:", emailResult.error)
      }

      console.log("Registration successful for:", email)
      return NextResponse.json({ token, user: { id: user.insertedId, email, name, role: userRole } })
    }

    if (action === "login") {
      console.log("Processing login for:", email)
      
      const user = await db.collection("users").findOne({ email })
      if (!user) {
        console.log("User not found:", email)
        return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
      }

      console.log("User found, verifying password...")
      let isValid = false
      let needsPasswordMigration = false

      // Check if password is already hashed
      if (isPasswordHashed(user.password)) {
        console.log("Password is hashed, using bcrypt.compare...")
        isValid = await bcrypt.compare(password, user.password)
      } else {
        console.log("Password appears to be plain text, checking direct comparison...")
        // For backward compatibility, check plain text password
        if (user.password === password) {
          isValid = true
          needsPasswordMigration = true
          console.log("Plain text password matched, will migrate to hashed password")
        }
      }

      if (!isValid) {
        console.log("Invalid password for:", email)
        return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
      }

      // If user has plain text password, migrate it to hashed password
      if (needsPasswordMigration) {
        console.log("Migrating plain text password to hashed password for:", email)
        try {
          const hashedPassword = await bcrypt.hash(password, 12)
          await db.collection("users").updateOne(
            { _id: user._id },
            { 
              $set: { 
                password: hashedPassword,
                passwordHashed: true,
                passwordMigratedAt: new Date(),
                updatedAt: new Date()
              }
            }
          )
          console.log("✅ Password successfully migrated to hash for:", email)
        } catch (migrationError) {
          console.error("⚠️ Failed to migrate password for:", email, migrationError)
          // Don't fail the login if migration fails, but log it
        }
      }

      console.log("Password valid, generating token...")
      const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      })

      console.log("Login successful for:", email, "with role:", user.role)
      return NextResponse.json({
        token,
        user: { 
          id: user._id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          avatar: user.avatar 
        },
      })
    }
    
    console.error("Invalid action:", action)
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    
  } catch (error) {
    console.error("=== AUTH API ERROR ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("=== END AUTH ERROR ===")
    
    return NextResponse.json({ 
      error: "Authentication failed",
      details: error.message,
      type: error.constructor.name
    }, { status: 500 })
  }
}
