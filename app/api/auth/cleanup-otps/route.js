import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request) {
  let client = null;
  try {
    console.log("=== Starting OTP Cleanup ===")
    
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    
    // Delete expired OTPs
    const result = await db.collection("otps").deleteMany({
      expiresAt: { $lt: new Date() }
    })
    
    console.log(`Deleted ${result.deletedCount} expired OTPs`)
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    })
    
  } catch (error) {
    console.error("OTP cleanup error:", error)
    return NextResponse.json({ 
      error: "Cleanup failed" 
    }, { status: 500 })
  }
}

// Also allow GET requests for scheduled cleanup
export async function GET(request) {
  return POST(request)
}
