import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request, { params }) {
  let client = null;
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series ID is required" 
      }, { status: 400 })
    }

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    const testSeries = await db.collection("testSeries").findOne({
      _id: new ObjectId(id)
    })

    if (!testSeries) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      testSeries
    })

  } catch (error) {
    console.error("Error fetching test series:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch test series" 
    }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  let client = null;
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series ID is required" 
      }, { status: 400 })
    }

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Remove _id from update data if present
    const { _id, ...updateData } = body

    // Update test series
    const result = await db.collection("testSeries").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series not found or no changes made" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Test series updated successfully"
    })

  } catch (error) {
    console.error("Error updating test series:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update test series" 
    }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  let client = null;
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series ID is required" 
      }, { status: 400 })
    }

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Delete test series
    const result = await db.collection("testSeries").deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Test series deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting test series:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete test series" 
    }, { status: 500 })
  }
} 