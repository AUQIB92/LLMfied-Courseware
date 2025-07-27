import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// GET /api/assignment-submissions/[id] - Get specific submission
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db("llmfied")

    // Get submission
    const submission = await db.collection("assignmentSubmissions").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Get assignment details
    const assignment = await db.collection("assignments").findOne({
      _id: submission.assignmentId
    })

    // Get student details
    const student = await db.collection("users").findOne({
      _id: submission.studentId
    }, { projection: { name: 1, email: 1 } })

    // Get course details
    const course = await db.collection("academicCourses").findOne({
      _id: submission.courseId
    }, { projection: { title: 1, subject: 1 } })

    // Attach additional data
    submission.assignment = assignment
    submission.student = student
    submission.course = course

    return NextResponse.json(submission)

  } catch (error) {
    console.error("Error fetching submission:", error)
    return NextResponse.json({ 
      error: "Failed to fetch submission",
      details: error.message
    }, { status: 500 })
  }
}

// PUT /api/assignment-submissions/[id] - Update submission or grade submission
export async function PUT(request, { params }) {
  try {
    const user = await verifyToken(request)
    const resolvedParams = await params
    const requestBody = await request.json()
    const client = await clientPromise
    const db = client.db("llmfied")

    // Get existing submission
    const existingSubmission = await db.collection("assignmentSubmissions").findOne({
      _id: new ObjectId(resolvedParams.id)
    })

    if (!existingSubmission) {
      return NextResponse.json({ 
        error: "Submission not found" 
      }, { status: 404 })
    }

    // Check authorization
    const isStudent = user.role === "learner" && user.userId === existingSubmission.studentId.toString()
    const isEducator = user.role === "educator"

    if (!isStudent && !isEducator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // If educator is grading
    if (isEducator && (requestBody.grade !== undefined || requestBody.feedback !== undefined)) {
      // Verify educator teaches this course
      const assignment = await db.collection("assignments").findOne({
        _id: existingSubmission.assignmentId,
        educatorId: new ObjectId(user.userId)
      })

      if (!assignment) {
        return NextResponse.json({ 
          error: "Unauthorized - You don't teach this course" 
        }, { status: 403 })
      }

      // Grade the submission
      const gradeUpdate = {
        updatedAt: new Date()
      }

      if (requestBody.grade !== undefined) {
        gradeUpdate.grade = requestBody.grade
        gradeUpdate.gradedAt = new Date()
        gradeUpdate.gradedBy = new ObjectId(user.userId)
        gradeUpdate.status = "graded"
      }

      if (requestBody.feedback !== undefined) {
        gradeUpdate.feedback = requestBody.feedback
      }

      const result = await db.collection("assignmentSubmissions").updateOne(
        { _id: new ObjectId(resolvedParams.id) },
        { $set: gradeUpdate }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      const updatedSubmission = await db.collection("assignmentSubmissions").findOne({
        _id: new ObjectId(resolvedParams.id)
      })

      return NextResponse.json(updatedSubmission)
    }

    // If student is updating their submission
    if (isStudent) {
      // Check if submission is still editable
      if (existingSubmission.status === "graded") {
        return NextResponse.json({ 
          error: "Cannot update submission that has already been graded" 
        }, { status: 400 })
      }

      // Get assignment to check deadline
      const assignment = await db.collection("assignments").findOne({
        _id: existingSubmission.assignmentId
      })

      const now = new Date()
      const dueDate = new Date(assignment.dueDate)
      const isLate = now > dueDate

      if (isLate && !assignment.allowLateSubmission) {
        return NextResponse.json({ 
          error: "Cannot update submission after deadline" 
        }, { status: 400 })
      }

      // Update submission
      const updateDoc = {
        ...requestBody,
        updatedAt: new Date(),
        isLate: isLate
      }

      // Remove fields that shouldn't be updated by students
      delete updateDoc._id
      delete updateDoc.assignmentId
      delete updateDoc.courseId
      delete updateDoc.studentId
      delete updateDoc.grade
      delete updateDoc.feedback
      delete updateDoc.gradedAt
      delete updateDoc.gradedBy
      delete updateDoc.createdAt

      const result = await db.collection("assignmentSubmissions").updateOne(
        { _id: new ObjectId(resolvedParams.id) },
        { $set: updateDoc }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      const updatedSubmission = await db.collection("assignmentSubmissions").findOne({
        _id: new ObjectId(resolvedParams.id)
      })

      return NextResponse.json(updatedSubmission)
    }

    return NextResponse.json({ error: "Invalid update request" }, { status: 400 })

  } catch (error) {
    console.error("Error updating submission:", error)
    return NextResponse.json({ 
      error: "Failed to update submission",
      details: error.message
    }, { status: 500 })
  }
}

// DELETE /api/assignment-submissions/[id] - Delete submission (only by student before grading)
export async function DELETE(request, { params }) {
  try {
    const user = await verifyToken(request)
    if (user.role !== "learner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db("llmfied")

    // Check if submission exists and belongs to student
    const existingSubmission = await db.collection("assignmentSubmissions").findOne({
      _id: new ObjectId(resolvedParams.id),
      studentId: new ObjectId(user.userId)
    })

    if (!existingSubmission) {
      return NextResponse.json({ 
        error: "Submission not found or unauthorized" 
      }, { status: 404 })
    }

    // Check if submission has been graded
    if (existingSubmission.status === "graded") {
      return NextResponse.json({ 
        error: "Cannot delete submission that has already been graded" 
      }, { status: 400 })
    }

    // Delete the submission
    const result = await db.collection("assignmentSubmissions").deleteOne({
      _id: new ObjectId(resolvedParams.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Submission deleted successfully" })

  } catch (error) {
    console.error("Error deleting submission:", error)
    return NextResponse.json({ 
      error: "Failed to delete submission",
      details: error.message
    }, { status: 500 })
  }
} 