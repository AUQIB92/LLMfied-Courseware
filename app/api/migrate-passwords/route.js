import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

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
  let client = null;
  try {
    console.log("=== Starting Password Migration ===")
    
    const body = await request.json()
    const { adminKey } = body
    
    // Simple admin key check for security
    if (adminKey !== process.env.MIGRATION_ADMIN_KEY) {
      console.error("Unauthorized migration attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("Connecting to MongoDB...")
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    
    // Find all users with potentially plain text passwords
    console.log("Finding users with plain text passwords...")
    const users = await db.collection("users").find({
      $or: [
        { passwordHashed: { $ne: true } }, // Users without the passwordHashed flag
        { passwordHashed: { $exists: false } } // Users where the field doesn't exist
      ]
    }).toArray()
    
    console.log(`Found ${users.length} users that may need password migration`)
    
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const errors = []
    
    for (const user of users) {
      try {
        // Double-check if password is actually hashed
        if (isPasswordHashed(user.password)) {
          console.log(`User ${user.email} already has hashed password, updating flag...`)
          await db.collection("users").updateOne(
            { _id: user._id },
            { 
              $set: { 
                passwordHashed: true,
                passwordMigrationCheckedAt: new Date(),
                updatedAt: new Date()
              }
            }
          )
          skippedCount++
          continue
        }
        
        // Password appears to be plain text, hash it
        console.log(`Migrating password for user: ${user.email}`)
        const hashedPassword = await bcrypt.hash(user.password, 12)
        
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
        
        migratedCount++
        console.log(`✅ Successfully migrated password for: ${user.email}`)
        
      } catch (userError) {
        console.error(`❌ Failed to migrate password for user ${user.email}:`, userError)
        errorCount++
        errors.push({
          userId: user._id,
          email: user.email,
          error: userError.message
        })
      }
    }
    
    const result = {
      success: true,
      totalUsersChecked: users.length,
      migratedCount,
      skippedCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }
    
    console.log("=== Password Migration Complete ===")
    console.log(`Total users checked: ${users.length}`)
    console.log(`Passwords migrated: ${migratedCount}`)
    console.log(`Already hashed (skipped): ${skippedCount}`)
    console.log(`Errors: ${errorCount}`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("=== PASSWORD MIGRATION ERROR ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    
    return NextResponse.json({ 
      success: false,
      error: "Password migration failed",
      details: error.message,
      type: error.constructor.name
    }, { status: 500 })
  }
}

export async function GET(request) {
  let client = null;
  try {
    console.log("=== Password Migration Status Check ===")
    
    const url = new URL(request.url)
    const adminKey = url.searchParams.get('adminKey')
    
    // Simple admin key check for security
    if (adminKey !== process.env.MIGRATION_ADMIN_KEY) {
      console.error("Unauthorized migration status check")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("Connecting to MongoDB...")
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    
    // Count users by password status
    const totalUsers = await db.collection("users").countDocuments()
    const hashedUsers = await db.collection("users").countDocuments({ passwordHashed: true })
    const unhashedUsers = await db.collection("users").countDocuments({
      $or: [
        { passwordHashed: { $ne: true } },
        { passwordHashed: { $exists: false } }
      ]
    })
    
    // Get sample of users that need migration (without exposing passwords)
    const sampleUnhashedUsers = await db.collection("users").find({
      $or: [
        { passwordHashed: { $ne: true } },
        { passwordHashed: { $exists: false } }
      ]
    }, {
      projection: { email: 1, createdAt: 1, passwordHashed: 1 }
    }).limit(10).toArray()
    
    const status = {
      totalUsers,
      hashedUsers,
      unhashedUsers,
      migrationPercentage: totalUsers > 0 ? Math.round((hashedUsers / totalUsers) * 100) : 100,
      needsMigration: unhashedUsers > 0,
      sampleUnhashedUsers: sampleUnhashedUsers.map(user => ({
        email: user.email,
        createdAt: user.createdAt,
        passwordHashed: user.passwordHashed || false
      })),
      timestamp: new Date().toISOString()
    }
    
    console.log("Migration status:", status)
    
    return NextResponse.json(status)
    
  } catch (error) {
    console.error("=== MIGRATION STATUS ERROR ===")
    console.error("Error:", error)
    
    return NextResponse.json({ 
      error: "Failed to get migration status",
      details: error.message
    }, { status: 500 })
  }
} 