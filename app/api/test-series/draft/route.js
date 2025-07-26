import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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
      _id // For updating existing drafts
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

    const draftData = {
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
      educatorName,
      targetAudience,
      prerequisites,
      status: "draft",
      updatedAt: new Date(),
      tags: [subject, difficulty].filter(Boolean)
    }

    let result
    let message

    if (_id) {
      // Update existing draft
      result = await db.collection("testSeries").updateOne(
        { _id: new ObjectId(_id), educatorId: new ObjectId(educatorId) },
        { $set: draftData }
      )

      if (result.modifiedCount === 0) {
        return NextResponse.json({ 
          success: false, 
          error: "Draft not found or no changes made" 
        }, { status: 404 })
      }

      message = "Draft updated successfully"
    } else {
      // Create new draft
      const newDraft = {
        ...draftData,
        educatorId: new ObjectId(educatorId),
        tests: [], // Empty for drafts
        enrollments: 0,
        createdAt: new Date(),
        analytics: {
          totalAttempts: 0,
          averageScore: 0,
          completionRate: 0
        }
      }

      result = await db.collection("testSeries").insertOne(newDraft)
      
      if (!result.insertedId) {
        throw new Error("Failed to save draft to database")
      }

      message = "Draft saved successfully"
    }

    return NextResponse.json({
      success: true,
      message,
      draftId: _id || result.insertedId
    })

  } catch (error) {
    console.error("Error saving draft:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to save draft" 
    }, { status: 500 })
  }
} 