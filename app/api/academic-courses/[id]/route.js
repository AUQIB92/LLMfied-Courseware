import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// GET /api/academic-courses/[id] - Get specific academic course
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db("llmfied")

    // Get academic course basic info
    const course = await db.collection("academicCourses").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!course) {
      return NextResponse.json({ error: "Academic course not found" }, { status: 404 })
    }

    // Get assignments for this course
    const assignments = await db.collection("assignments").find({
      courseId: new ObjectId(resolvedParams.id)
    }).sort({ createdAt: -1 }).toArray()

    // Get enrollments count
    const enrollmentCount = await db.collection("academicEnrollments").countDocuments({
      courseId: new ObjectId(resolvedParams.id)
    })

    // Get discussion threads if enabled
    let discussions = []
    if (course.allowDiscussions) {
      discussions = await db.collection("discussions").find({
        courseId: new ObjectId(resolvedParams.id)
      }).sort({ createdAt: -1 }).limit(10).toArray()
    }

    // Attach additional data to course
    course.assignments = assignments
    course.enrollmentCount = enrollmentCount
    course.discussions = discussions
    course.assignmentCount = assignments.length

    return NextResponse.json(course)

  } catch (error) {
    console.error("Error fetching academic course:", error)
    return NextResponse.json({ 
      error: "Failed to fetch academic course",
      details: error.message
    }, { status: 500 })
  }
}

// PUT /api/academic-courses/[id] - Update academic course
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

    // Check if course exists and belongs to educator
    const existingCourse = await db.collection("academicCourses").findOne({
      _id: new ObjectId(resolvedParams.id),
      educatorId: new ObjectId(user.userId)
    })

    if (!existingCourse) {
      return NextResponse.json({ 
        error: "Academic course not found or unauthorized" 
      }, { status: 404 })
    }

    // Prepare update document
    const updateDoc = {
      ...requestBody,
      updatedAt: new Date()
    }

    // Remove fields that shouldn't be updated directly
    delete updateDoc._id
    delete updateDoc.educatorId
    delete updateDoc.createdAt

    // Update course
    const result = await db.collection("academicCourses").updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      { $set: updateDoc }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Academic course not found" }, { status: 404 })
    }

    // Get updated course
    const updatedCourse = await db.collection("academicCourses").findOne({
      _id: new ObjectId(resolvedParams.id)
    })

    return NextResponse.json(updatedCourse)

  } catch (error) {
    console.error("Error updating academic course:", error)
    return NextResponse.json({ 
      error: "Failed to update academic course",
      details: error.message
    }, { status: 500 })
  }
}

// DELETE /api/academic-courses/[id] - Delete academic course
export async function DELETE(request, { params }) {
  try {
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db("llmfied")

    // Check if course exists and belongs to educator
    const existingCourse = await db.collection("academicCourses").findOne({
      _id: new ObjectId(resolvedParams.id),
      educatorId: new ObjectId(user.userId)
    })

    if (!existingCourse) {
      return NextResponse.json({ 
        error: "Academic course not found or unauthorized" 
      }, { status: 404 })
    }

    // Delete related data
    await Promise.all([
      // Delete assignments
      db.collection("assignments").deleteMany({
        courseId: new ObjectId(resolvedParams.id)
      }),
      // Delete assignment submissions
      db.collection("assignmentSubmissions").deleteMany({
        courseId: new ObjectId(resolvedParams.id)
      }),
      // Delete enrollments
      db.collection("academicEnrollments").deleteMany({
        courseId: new ObjectId(resolvedParams.id)
      }),
      // Delete discussions
      db.collection("discussions").deleteMany({
        courseId: new ObjectId(resolvedParams.id)
      })
    ])

    // Delete the course
    const result = await db.collection("academicCourses").deleteOne({
      _id: new ObjectId(resolvedParams.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Academic course not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Academic course deleted successfully" })

  } catch (error) {
    console.error("Error deleting academic course:", error)
    return NextResponse.json({ 
      error: "Failed to delete academic course",
      details: error.message
    }, { status: 500 })
  }
} 