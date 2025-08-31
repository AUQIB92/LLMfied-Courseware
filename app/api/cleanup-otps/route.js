import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request) {
  let client = null;
  try {
    console.log("=== Starting POST /api/cleanup-otps ===")
    
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Delete expired OTPs
    const result = await db.collection("otps").deleteMany({
      expiresAt: { $lt: new Date() }
    })
    
    console.log(`Cleaned up ${result.deletedCount} expired OTPs`)
    
    return NextResponse.json({ 
      success: true,
      deletedCount: result.deletedCount 
    })
    
  } catch (error) {
    console.error("=== CLEANUP OTPS API ERROR ===")
    console.error("Error:", error)
    
    return NextResponse.json({ 
      error: "Cleanup failed",
      details: error.message
    }, { status: 500 })
  }
}
