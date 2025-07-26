import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const educatorId = searchParams.get("educatorId")
    const testSeriesId = searchParams.get("id")
    
    const client = await clientPromise
    const db = client.db("llmfied")

    if (testSeriesId) {
      // Get specific test series
      const testSeries = await db.collection("testSeries").findOne({
        _id: new ObjectId(testSeriesId)
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
    } else if (educatorId) {
      // Get all test series for an educator
      const testSeries = await db.collection("testSeries").find({
        educatorId: new ObjectId(educatorId)
      }).sort({ createdAt: -1 }).toArray()

      return NextResponse.json({
        success: true,
        testSeries
      })
    } else {
      // Get all published test series (for students)
      const testSeries = await db.collection("testSeries").find({
        status: "published"
      }).sort({ createdAt: -1 }).toArray()

      return NextResponse.json({
        success: true,
        testSeries
      })
    }

  } catch (error) {
    console.error("Error fetching test series:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch test series" 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      subject,
      difficulty,
      totalTests,
      questionsPerTest,
      timePerTest,
      marksPerQuestion,
      negativeMarking,
      numericalPercentage,
      theoreticalPercentage,
      topics,
      educatorId,
      educatorName,
      targetAudience,
      prerequisites,
      status = "draft"
    } = body

    // Validate required fields
    if (!title || !subject || !educatorId) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: title, subject, and educatorId" 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")

    // Create test series document (draft mode)
    const testSeries = {
      title,
      description,
      subject,
      difficulty,
      totalTests,
      questionsPerTest,
      timePerTest,
      marksPerQuestion,
      negativeMarking,
      numericalPercentage,
      theoreticalPercentage,
      topics: topics || [],
      tests: [], // Empty for drafts
      educatorId: new ObjectId(educatorId),
      educatorName,
      targetAudience,
      prerequisites,
      status,
      enrollments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [subject, difficulty].filter(Boolean),
      analytics: {
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0
      }
    }

    // Save to database
    const result = await db.collection("testSeries").insertOne(testSeries)
    
    if (result.insertedId) {
      return NextResponse.json({
        success: true,
        testSeries: {
          _id: result.insertedId,
          ...testSeries
        },
        message: `Test series "${title}" saved as ${status}`
      })
    } else {
      throw new Error("Failed to save test series to database")
    }

  } catch (error) {
    console.error("Error creating test series:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to create test series" 
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { _id, ...updateData } = body

    if (!_id) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series ID is required" 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")

    // Update test series
    const result = await db.collection("testSeries").updateOne(
      { _id: new ObjectId(_id) },
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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const testSeriesId = searchParams.get("id")

    if (!testSeriesId) {
      return NextResponse.json({ 
        success: false, 
        error: "Test series ID is required" 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")

    // Delete test series
    const result = await db.collection("testSeries").deleteOne({
      _id: new ObjectId(testSeriesId)
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