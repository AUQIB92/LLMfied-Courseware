import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

// GET - Check enrollment status or get enrolled courses
export async function GET(request) {
  try {
    const user = await verifyToken(request)
    const client = await clientPromise
    const db = client.db("llmfied")
    
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const learnerId = searchParams.get("learnerId") || user.userId

    if (courseId) {
      // Check specific course enrollment
      const enrollment = await db.collection("enrollments").findOne({
        learnerId: new ObjectId(learnerId),
        courseId: new ObjectId(courseId)
      })
      
      return NextResponse.json({ 
        isEnrolled: !!enrollment,
        enrollment: enrollment 
      })
    } else {
      // Get all enrolled courses for learner
      const enrollments = await db.collection("enrollments")
        .find({ learnerId: new ObjectId(learnerId) })
        .toArray()
      
      // Get course details for enrolled courses
      const courseIds = enrollments.map(e => e.courseId)
      const courses = await db.collection("courses")
        .find({ 
          _id: { $in: courseIds },
          status: "published" 
        })
        .toArray()
      
      return NextResponse.json({ 
        enrollments,
        courses 
      })
    }
  } catch (error) {
    console.error("Error in GET /api/enrollment:", error)
    return NextResponse.json(
      { error: "Failed to fetch enrollment data" },
      { status: 500 }
    )
  }
}

// POST - Enroll in a course
export async function POST(request) {
  try {
    const user = await verifyToken(request)
    
    if (user.role !== "learner") {
      return NextResponse.json(
        { error: "Only learners can enroll in courses" },
        { status: 403 }
      )
    }

    const { courseId } = await request.json()
    
    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("llmfied")
    
    // Check if course exists and is published
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(courseId),
      status: "published"
    })
    
    if (!course) {
      return NextResponse.json(
        { error: "Course not found or not published" },
        { status: 404 }
      )
    }
    
    // Check if already enrolled
    const existingEnrollment = await db.collection("enrollments").findOne({
      learnerId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId)
    })
    
    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this course" },
        { status: 409 }
      )
    }
    
    // Create enrollment
    const enrollment = {
      learnerId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId),
      enrolledAt: new Date(),
      progress: 0,
      status: "active"
    }
    
    const result = await db.collection("enrollments").insertOne(enrollment)
    
    // Update course enrollment count
    await db.collection("courses").updateOne(
      { _id: new ObjectId(courseId) },
      { $inc: { enrollmentCount: 1 } }
    )
    
    return NextResponse.json({
      message: "Successfully enrolled in course",
      enrollmentId: result.insertedId,
      enrollment: {
        ...enrollment,
        _id: result.insertedId
      }
    })
    
  } catch (error) {
    console.error("Error in POST /api/enrollment:", error)
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    )
  }
}

// DELETE - Unenroll from a course
export async function DELETE(request) {
  try {
    const user = await verifyToken(request)
    const { searchParams } = new URL(request.url)
    let courseId = searchParams.get("courseId")
    
    // If not in query params, check request body
    if (!courseId) {
      try {
        const body = await request.json()
        courseId = body.courseId
      } catch (e) {
        // Body might be empty, that's okay if courseId was in query params
      }
    }
    
    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("llmfied")
    
    // Remove enrollment
    const result = await db.collection("enrollments").deleteOne({
      learnerId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId)
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      )
    }
    
    // Update course enrollment count
    await db.collection("courses").updateOne(
      { _id: new ObjectId(courseId) },
      { $inc: { enrollmentCount: -1 } }
    )
    
    return NextResponse.json({
      message: "Successfully unenrolled from course"
    })
    
  } catch (error) {
    console.error("Error in DELETE /api/enrollment:", error)
    return NextResponse.json(
      { error: "Failed to unenroll from course" },
      { status: 500 }
    )
  }
}
