import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// GET /api/assignment-submissions - Fetch assignment submissions
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db("llmfied")
    
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get("assignmentId")
    const studentId = searchParams.get("studentId")
    const courseId = searchParams.get("courseId")
    const status = searchParams.get("status")

    console.log("Submission query params:", { assignmentId, studentId, courseId, status })

    const filter = {}
    
    if (assignmentId) {
      if (!/^[0-9a-fA-F]{24}$/.test(assignmentId)) {
        return NextResponse.json({ 
          error: "Invalid assignment ID format"
        }, { status: 400 })
      }
      filter.assignmentId = new ObjectId(assignmentId)
    }
    
    if (studentId) {
      if (!/^[0-9a-fA-F]{24}$/.test(studentId)) {
        return NextResponse.json({ 
          error: "Invalid student ID format"
        }, { status: 400 })
      }
      filter.studentId = new ObjectId(studentId)
    }

    if (courseId) {
      if (!/^[0-9a-fA-F]{24}$/.test(courseId)) {
        return NextResponse.json({ 
          error: "Invalid course ID format"
        }, { status: 400 })
      }
      filter.courseId = new ObjectId(courseId)
    }

    if (status) {
      filter.status = status
    }

    const submissions = await db.collection("assignmentSubmissions").find(filter).sort({ submittedAt: -1 }).toArray()
    
    // Populate assignment and student details
    if (submissions.length > 0) {
      const assignmentIds = [...new Set(submissions.map(sub => sub.assignmentId))]
      const studentIds = [...new Set(submissions.map(sub => sub.studentId))]
      
      const [assignments, students] = await Promise.all([
        db.collection("assignments").find({
          _id: { $in: assignmentIds }
        }).toArray(),
        db.collection("users").find({
          _id: { $in: studentIds }
        }, { projection: { name: 1, email: 1 } }).toArray()
      ])
      
      const assignmentMap = {}
      const studentMap = {}
      
      assignments.forEach(assignment => {
        assignmentMap[assignment._id.toString()] = assignment
      })
      
      students.forEach(student => {
        studentMap[student._id.toString()] = student
      })
      
      submissions.forEach(submission => {
        submission.assignment = assignmentMap[submission.assignmentId.toString()]
        submission.student = studentMap[submission.studentId.toString()]
      })
    }

    console.log("Found", submissions.length, "submissions")
    return NextResponse.json(submissions)

  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ 
      error: "Failed to fetch submissions",
      details: error.message
    }, { status: 500 })
  }
}

// POST /api/assignment-submissions - Create new submission
export async function POST(request) {
  try {
    const user = await verifyToken(request)
    if (user.role !== "learner") {
      return NextResponse.json({ error: "Unauthorized - Only learners can submit assignments" }, { status: 403 })
    }

    const requestBody = await request.json()
    const { 
      assignmentId,
      courseId,
      submissionText,
      submissionFiles,
      submissionUrl
    } = requestBody

    // Validate required fields
    if (!assignmentId || !courseId) {
      return NextResponse.json({ 
        error: "Missing required fields: assignmentId, courseId" 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")

    // Verify the assignment exists and is still accepting submissions
    const assignment = await db.collection("assignments").findOne({
      _id: new ObjectId(assignmentId)
    })

    if (!assignment) {
      return NextResponse.json({ 
        error: "Assignment not found" 
      }, { status: 404 })
    }

    // Check if assignment is still open
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    const isLate = now > dueDate

    if (isLate && !assignment.allowLateSubmission) {
      return NextResponse.json({ 
        error: "Assignment deadline has passed and late submissions are not allowed" 
      }, { status: 400 })
    }

    // Check if student is enrolled in the course
    const enrollment = await db.collection("academicEnrollments").findOne({
      courseId: new ObjectId(courseId),
      studentId: new ObjectId(user.userId),
      status: "active"
    })

    if (!enrollment) {
      return NextResponse.json({ 
        error: "Student is not enrolled in this course" 
      }, { status: 403 })
    }

    // Check if student has already submitted
    const existingSubmission = await db.collection("assignmentSubmissions").findOne({
      assignmentId: new ObjectId(assignmentId),
      studentId: new ObjectId(user.userId)
    })

    if (existingSubmission) {
      return NextResponse.json({ 
        error: "Assignment already submitted. Use PUT to update submission." 
      }, { status: 400 })
    }

    // Validate submission content based on assignment type
    if (assignment.submissionType === "text" && !submissionText) {
      return NextResponse.json({ 
        error: "Text submission required for this assignment" 
      }, { status: 400 })
    }

    if (assignment.submissionType === "file" && (!submissionFiles || submissionFiles.length === 0)) {
      return NextResponse.json({ 
        error: "File submission required for this assignment" 
      }, { status: 400 })
    }

    if (assignment.submissionType === "url" && !submissionUrl) {
      return NextResponse.json({ 
        error: "URL submission required for this assignment" 
      }, { status: 400 })
    }

    const submissionDocument = {
      assignmentId: new ObjectId(assignmentId),
      courseId: new ObjectId(courseId),
      studentId: new ObjectId(user.userId),
      submissionText: submissionText || "",
      submissionFiles: submissionFiles || [],
      submissionUrl: submissionUrl || "",
      submittedAt: new Date(),
      isLate: isLate,
      status: "submitted", // submitted, graded, returned
      grade: null,
      feedback: "",
      gradedAt: null,
      gradedBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const submission = await db.collection("assignmentSubmissions").insertOne(submissionDocument)

    console.log("Assignment submission created successfully:", submission.insertedId)
    
    return NextResponse.json({ 
      id: submission.insertedId,
      _id: submission.insertedId.toString(),
      ...submissionDocument
    })

  } catch (error) {
    console.error("Error creating submission:", error)
    return NextResponse.json({ 
      error: "Failed to create submission",
      details: error.message
    }, { status: 500 })
  }
} 