import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function GET(request) {
  // Return detailed error information to help debug
  const errorDetails = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    mongoUriExists: !!process.env.MONGODB_URI,
    mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) : 'NOT_SET'
  }

  try {
    console.log("=== Starting GET /api/courses ===")
    console.log("Environment check:", errorDetails)
    
    // Check if MongoDB URI is set
    if (!process.env.MONGODB_URI) {
      const error = "MONGODB_URI environment variable is not set"
      console.error(error)
      return NextResponse.json({ 
        error: "Database configuration error",
        details: error,
        debug: errorDetails
      }, { status: 500 })
    }

    console.log("Attempting to get MongoDB client...")
    const client = await clientPromise
    console.log("MongoDB client obtained successfully")
    
    console.log("Selecting database 'llmfied'...")
    const db = client.db("llmfied")
    console.log("Database selected successfully")
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const educatorId = searchParams.get("educatorId")

    console.log("Query params:", { status, educatorId })

    const filter = {}
    
    if (status) {
      filter.status = status
      console.log("Added status filter:", status)
    }
    
    if (educatorId) {
      console.log("Processing educatorId:", educatorId, "type:", typeof educatorId)
      
      // Validate ObjectId format before conversion
      if (!/^[0-9a-fA-F]{24}$/.test(educatorId)) {
        const error = `Invalid ObjectId format: ${educatorId}`
        console.error(error)
        return NextResponse.json({ 
          error: "Invalid educator ID format",
          details: error,
          debug: { ...errorDetails, educatorId, educatorIdType: typeof educatorId }
        }, { status: 400 })
      }
      
      try {
        filter.educatorId = new ObjectId(educatorId)
        console.log("ObjectId created successfully:", filter.educatorId)
      } catch (objectIdError) {
        console.error("ObjectId conversion failed:", objectIdError)
        return NextResponse.json({ 
          error: "Failed to create ObjectId",
          details: objectIdError.message,
          debug: { ...errorDetails, educatorId, originalError: objectIdError.message }
        }, { status: 400 })
      }
    }

    console.log("Final filter object:", filter)

    // Test collection access
    console.log("Getting courses collection...")
    const collection = db.collection("courses")
    console.log("Collection obtained successfully")

    // Test if collection exists by trying to get stats
    console.log("Testing collection access...")
    const stats = await collection.estimatedDocumentCount()
    console.log("Collection stats - estimated document count:", stats)

    // Execute the query
    console.log("Executing find query...")
    const courses = await collection.find(filter).sort({ createdAt: -1 }).toArray()
    console.log("Query executed successfully, found", courses.length, "courses")
    
    // Add enrollment counts to courses
    if (courses.length > 0) {
      const enrollmentCollection = db.collection("enrollments")
      const courseIds = courses.map(course => course._id)
      
      // Get enrollment counts for all courses
      const enrollmentCounts = await enrollmentCollection.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: "$courseId", count: { $sum: 1 } } }
      ]).toArray()
      
      // Create a map for quick lookup
      const enrollmentMap = {}
      enrollmentCounts.forEach(item => {
        enrollmentMap[item._id.toString()] = item.count
      })
      
      // Add enrollment counts to courses
      courses.forEach(course => {
        course.enrollmentCount = enrollmentMap[course._id.toString()] || 0
      })
    }
    
    // Log sample data for debugging
    if (courses.length > 0) {
      console.log("First course sample:", {
        id: courses[0]._id,
        title: courses[0].title,
        educatorId: courses[0].educatorId,
        status: courses[0].status,
        hasModules: !!courses[0].modules,
        moduleCount: courses[0].modules?.length || 0
      })
    } else {
      console.log("No courses found with filter:", filter)
      
      // If no courses found with filter, try a basic query to see if any courses exist
      const totalCourses = await collection.countDocuments()
      console.log("Total courses in collection (no filter):", totalCourses)
      
      if (totalCourses > 0) {
        const sampleCourse = await collection.findOne()
        console.log("Sample course structure:", {
          id: sampleCourse._id,
          title: sampleCourse.title,
          status: sampleCourse.status,
          educatorId: sampleCourse.educatorId,
          educatorIdType: typeof sampleCourse.educatorId
        })
      }
    }

    console.log("=== GET /api/courses completed successfully ===")
    return NextResponse.json(courses)
    
  } catch (error) {
    console.error("=== GET /api/courses ERROR ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("=== END ERROR ===")
    
    return NextResponse.json({ 
      error: "Failed to fetch courses",
      details: error.message,
      type: error.constructor.name,
      debug: errorDetails,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { title, description, modules } = await request.json()
    const client = await clientPromise
    const db = client.db("llmfied")  // Changed from "ai-tutor" to match your .env

    const course = await db.collection("courses").insertOne({
      title,
      description,
      educatorId: new ObjectId(user.userId),
      modules: modules || [],
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ id: course.insertedId })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}
