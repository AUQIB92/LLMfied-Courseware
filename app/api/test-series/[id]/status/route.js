import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(request, { params }) {
  let client = null;
  try {
    const { id } = params
    const { status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series ID and status are required" 
      }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["draft", "published", "archived"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid status. Must be one of: draft, published, archived" 
      }, { status: 400 })
    }

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Update test series status
    const result = await db.collection("testSeries").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Test series status updated to ${status}`
    })

  } catch (error) {
    console.error("Error updating test series status:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update test series status" 
    }, { status: 500 })
  }
} 