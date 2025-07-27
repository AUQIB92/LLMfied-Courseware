import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// GET /api/academic-courses - Fetch academic courses
export async function GET(request) {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    mongoUriExists: !!process.env.MONGODB_URI,
    mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) : 'NOT_SET'
  }

  try {
    console.log("=== Starting GET /api/academic-courses ===")
    console.log("Environment check:", errorDetails)
    
    if (!process.env.MONGODB_URI) {
      const error = "MONGODB_URI environment variable is not set"
      console.error(error)
      return NextResponse.json({ 
        error: "Database configuration error",
        details: error,
        debug: errorDetails
      }, { status: 500 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const educatorId = searchParams.get("educatorId")
    const subject = searchParams.get("subject")
    const academicLevel = searchParams.get("academicLevel")

    console.log("Query params:", { status, educatorId, subject, academicLevel })

    const filter = { courseType: "academic" }
    
    if (status) {
      filter.status = status
    }
    
    if (educatorId) {
      if (!/^[0-9a-fA-F]{24}$/.test(educatorId)) {
        return NextResponse.json({ 
          error: "Invalid educator ID format",
          debug: { ...errorDetails, educatorId }
        }, { status: 400 })
      }
      
      filter.educatorId = new ObjectId(educatorId)
    }

    if (subject) {
      filter.subject = subject
    }

    if (academicLevel) {
      filter.academicLevel = academicLevel
    }

    // Handle published status
    if (status === "published") {
      filter.$or = [
        { status: "published" },
        { isPublished: true }
      ];
      delete filter.status;
    }

    console.log("Final filter object:", filter)

    const collection = db.collection("academicCourses")
    const courses = await collection.find(filter).sort({ createdAt: -1 }).toArray()
    
    // Add enrollment counts and assignment counts
    if (courses.length > 0) {
      const enrollmentCollection = db.collection("academicEnrollments")
      const assignmentCollection = db.collection("assignments")
      const courseIds = courses.map(course => course._id)
      
      // Get enrollment counts
      const enrollmentCounts = await enrollmentCollection.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: "$courseId", count: { $sum: 1 } } }
      ]).toArray()
      
      // Get assignment counts
      const assignmentCounts = await assignmentCollection.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: "$courseId", count: { $sum: 1 } } }
      ]).toArray()
      
      const enrollmentMap = {}
      const assignmentMap = {}
      
      enrollmentCounts.forEach(item => {
        enrollmentMap[item._id.toString()] = item.count
      })
      
      assignmentCounts.forEach(item => {
        assignmentMap[item._id.toString()] = item.count
      })
      
      courses.forEach(course => {
        course.enrollmentCount = enrollmentMap[course._id.toString()] || 0
        course.assignmentCount = assignmentMap[course._id.toString()] || 0
        
        if (course.status === "published" && course.isPublished !== true) {
          course.isPublished = true
        }
        
        if (course.isPublished === true && course.status !== "published") {
          course.status = "published"
        }
      })
    }

    console.log("Query executed successfully, found", courses.length, "academic courses")
    return NextResponse.json(courses)

  } catch (error) {
    console.error("Error in GET /api/academic-courses:", error)
    return NextResponse.json({ 
      error: "Failed to fetch academic courses",
      details: error.message,
      debug: errorDetails
    }, { status: 500 })
  }
}

// POST /api/academic-courses - Create new academic course
export async function POST(request) {
  try {
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const requestBody = await request.json()
    const { 
      title, 
      description, 
      subject,
      academicLevel,
      semester,
      credits,
      modules,
      syllabus,
      objectives,
      prerequisites,
      assessmentCriteria
    } = requestBody

    const client = await clientPromise
    const db = client.db("llmfied")

    const courseDocument = {
      courseType: "academic",
      title,
      description,
      subject,
      academicLevel, // undergraduate, graduate, postgraduate
      semester: semester || null,
      credits: credits || 0,
      educatorId: new ObjectId(user.userId),
      modules: modules || [],
      syllabus: syllabus || "",
      objectives: objectives || [],
      prerequisites: prerequisites || [],
      assessmentCriteria: assessmentCriteria || {
        assignments: 40,
        quizzes: 20,
        midterm: 20,
        final: 20
      },
      status: requestBody.status || "draft",
      isPublished: requestBody.status === "published" || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Academic-specific features
      allowAssignments: true,
      allowDiscussions: requestBody.allowDiscussions || true,
      allowGroupWork: requestBody.allowGroupWork || false,
      gradingScale: requestBody.gradingScale || "percentage", // percentage, gpa, letter
      
      // Preserve any other fields from the request
      ...Object.fromEntries(
        Object.entries(requestBody).filter(([key]) => 
          !['title', 'description', 'modules', 'educatorId', 'status', 'createdAt', 'updatedAt'].includes(key)
        )
      )
    }

    const course = await db.collection("academicCourses").insertOne(courseDocument)

    console.log("Academic course created successfully:", course.insertedId)
    
    return NextResponse.json({ 
      id: course.insertedId,
      _id: course.insertedId.toString(),
      ...courseDocument
    })

  } catch (error) {
    console.error("Error creating academic course:", error)
    return NextResponse.json({ 
      error: "Failed to create academic course",
      details: error.message
    }, { status: 500 })
  }
} 