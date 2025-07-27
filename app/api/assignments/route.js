import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// GET /api/assignments - Fetch assignments
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db("llmfied")
    
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const educatorId = searchParams.get("educatorId")
    const status = searchParams.get("status")
    const studentId = searchParams.get("studentId")

    console.log("Assignment query params:", { courseId, educatorId, status, studentId })

    const filter = {}
    
    if (courseId) {
      if (!/^[0-9a-fA-F]{24}$/.test(courseId)) {
        return NextResponse.json({ 
          error: "Invalid course ID format"
        }, { status: 400 })
      }
      filter.courseId = new ObjectId(courseId)
    }
    
    if (educatorId) {
      if (!/^[0-9a-fA-F]{24}$/.test(educatorId)) {
        return NextResponse.json({ 
          error: "Invalid educator ID format"
        }, { status: 400 })
      }
      filter.educatorId = new ObjectId(educatorId)
    }

    if (status) {
      filter.status = status
    }

    const assignments = await db.collection("assignments").find(filter).sort({ createdAt: -1 }).toArray()
    
    // If studentId is provided, get submission status for each assignment
    if (studentId && assignments.length > 0) {
      const assignmentIds = assignments.map(assignment => assignment._id)
      const submissions = await db.collection("assignmentSubmissions").find({
        assignmentId: { $in: assignmentIds },
        studentId: new ObjectId(studentId)
      }).toArray()
      
      const submissionMap = {}
      submissions.forEach(submission => {
        submissionMap[submission.assignmentId.toString()] = submission
      })
      
      assignments.forEach(assignment => {
        assignment.studentSubmission = submissionMap[assignment._id.toString()] || null
      })
    }

    // Get submission counts for each assignment
    if (assignments.length > 0) {
      const assignmentIds = assignments.map(assignment => assignment._id)
      const submissionCounts = await db.collection("assignmentSubmissions").aggregate([
        { $match: { assignmentId: { $in: assignmentIds } } },
        { $group: { _id: "$assignmentId", count: { $sum: 1 } } }
      ]).toArray()
      
      const submissionCountMap = {}
      submissionCounts.forEach(item => {
        submissionCountMap[item._id.toString()] = item.count
      })
      
      assignments.forEach(assignment => {
        assignment.submissionCount = submissionCountMap[assignment._id.toString()] || 0
      })
    }

    console.log("Found", assignments.length, "assignments")
    return NextResponse.json(assignments)

  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ 
      error: "Failed to fetch assignments",
      details: error.message
    }, { status: 500 })
  }
}

// POST /api/assignments - Create new assignment
export async function POST(request) {
  try {
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const requestBody = await request.json()
    const { 
      courseId,
      title,
      description,
      instructions,
      dueDate,
      maxPoints,
      attachments,
      submissionType,
      allowLateSubmission,
      lateSubmissionPenalty,
      rubric
    } = requestBody

    // Validate required fields
    if (!courseId || !title || !description || !dueDate) {
      return NextResponse.json({ 
        error: "Missing required fields: courseId, title, description, dueDate" 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")

    // Verify the course exists and belongs to the educator
    const course = await db.collection("academicCourses").findOne({
      _id: new ObjectId(courseId),
      educatorId: new ObjectId(user.userId)
    })

    if (!course) {
      return NextResponse.json({ 
        error: "Academic course not found or unauthorized" 
      }, { status: 404 })
    }

    const assignmentDocument = {
      courseId: new ObjectId(courseId),
      educatorId: new ObjectId(user.userId),
      title,
      description,
      instructions: instructions || "",
      dueDate: new Date(dueDate),
      maxPoints: maxPoints || 100,
      attachments: attachments || [],
      submissionType: submissionType || "file", // file, text, url
      allowLateSubmission: allowLateSubmission || false,
      lateSubmissionPenalty: lateSubmissionPenalty || 0, // percentage
      rubric: rubric || null,
      status: "published", // draft, published, closed
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const assignment = await db.collection("assignments").insertOne(assignmentDocument)

    console.log("Assignment created successfully:", assignment.insertedId)
    
    return NextResponse.json({ 
      id: assignment.insertedId,
      _id: assignment.insertedId.toString(),
      ...assignmentDocument
    })

  } catch (error) {
    console.error("Error creating assignment:", error)
    return NextResponse.json({ 
      error: "Failed to create assignment",
      details: error.message
    }, { status: 500 })
  }
} 