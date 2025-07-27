import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// GET /api/assignments/[id] - Get specific assignment
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db("llmfied")

    // Get assignment
    const assignment = await db.collection("assignments").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Get submissions for this assignment
    const submissions = await db.collection("assignmentSubmissions").find({
      assignmentId: new ObjectId(resolvedParams.id)
    }).sort({ submittedAt: -1 }).toArray()

    // Get course info
    const course = await db.collection("academicCourses").findOne({
      _id: assignment.courseId
    }, { projection: { title: 1, subject: 1, academicLevel: 1 } })

    // Attach additional data
    assignment.submissions = submissions
    assignment.submissionCount = submissions.length
    assignment.course = course

    return NextResponse.json(assignment)

  } catch (error) {
    console.error("Error fetching assignment:", error)
    return NextResponse.json({ 
      error: "Failed to fetch assignment",
      details: error.message
    }, { status: 500 })
  }
}

// PUT /api/assignments/[id] - Update assignment
export async function PUT(request, { params }) {
  try {
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await params
    const requestBody = await request.json()
    const client = await clientPromise
    const db = client.db("llmfied")

    // Check if assignment exists and belongs to educator
    const existingAssignment = await db.collection("assignments").findOne({
      _id: new ObjectId(resolvedParams.id),
      educatorId: new ObjectId(user.userId)
    })

    if (!existingAssignment) {
      return NextResponse.json({ 
        error: "Assignment not found or unauthorized" 
      }, { status: 404 })
    }

    // Prepare update document
    const updateDoc = {
      ...requestBody,
      updatedAt: new Date()
    }

    // Handle dueDate conversion
    if (updateDoc.dueDate) {
      updateDoc.dueDate = new Date(updateDoc.dueDate)
    }

    // Remove fields that shouldn't be updated directly
    delete updateDoc._id
    delete updateDoc.educatorId
    delete updateDoc.courseId
    delete updateDoc.createdAt

    // Update assignment
    const result = await db.collection("assignments").updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      { $set: updateDoc }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Get updated assignment
    const updatedAssignment = await db.collection("assignments").findOne({
      _id: new ObjectId(resolvedParams.id)
    })

    return NextResponse.json(updatedAssignment)

  } catch (error) {
    console.error("Error updating assignment:", error)
    return NextResponse.json({ 
      error: "Failed to update assignment",
      details: error.message
    }, { status: 500 })
  }
}

// DELETE /api/assignments/[id] - Delete assignment
export async function DELETE(request, { params }) {
  try {
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db("llmfied")

    // Check if assignment exists and belongs to educator
    const existingAssignment = await db.collection("assignments").findOne({
      _id: new ObjectId(resolvedParams.id),
      educatorId: new ObjectId(user.userId)
    })

    if (!existingAssignment) {
      return NextResponse.json({ 
        error: "Assignment not found or unauthorized" 
      }, { status: 404 })
    }

    // Delete related submissions
    await db.collection("assignmentSubmissions").deleteMany({
      assignmentId: new ObjectId(resolvedParams.id)
    })

    // Delete the assignment
    const result = await db.collection("assignments").deleteOne({
      _id: new ObjectId(resolvedParams.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Assignment deleted successfully" })

  } catch (error) {
    console.error("Error deleting assignment:", error)
    return NextResponse.json({ 
      error: "Failed to delete assignment",
      details: error.message
    }, { status: 500 })
  }
} 