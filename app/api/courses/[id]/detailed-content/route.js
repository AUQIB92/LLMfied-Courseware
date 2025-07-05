import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) throw new Error("No token provided")
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new Error("Invalid token")
  }
}

export async function GET(request, { params }) {
  try {
    // Get user session
    const user = await verifyToken(request)
    
    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("llmfied")
    const detailedContentCollection = db.collection("course_detailed_content")
    const coursesCollection = db.collection("courses")
    
    const courseId = params.id
    
    console.log("🔍 DEBUG API: Fetching detailed content for courseId:", courseId)
    
    // First, check if user has access to this course
    const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) })
    if (!course) {
      console.log("🔍 DEBUG API: Course not found")
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    
    console.log("🔍 DEBUG API: Course found:", { title: course.title, status: course.status, isExamGenius: course.isExamGenius })
    
    // For now, allow access to published courses or if user is the educator
    // In a real app, you'd check enrollment status
    const hasAccess = course.status === "published" || course.educatorId?.toString() === user.userId
    
    if (!hasAccess) {
      console.log("🔍 DEBUG API: Access denied")
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Try both string and ObjectId formats for courseId
    const detailedContentQuery = { 
      $or: [
        { courseId: courseId },
        { courseId: new ObjectId(courseId) }
      ]
    }
    
    console.log("🔍 DEBUG API: Searching for detailed content with query:", detailedContentQuery)
    
    // Fetch all detailed content for this course
    const detailedContent = await detailedContentCollection
      .find(detailedContentQuery)
      .sort({ moduleIndex: 1, subsectionIndex: 1 })
      .toArray()
      
    console.log("🔍 DEBUG API: Found detailed content documents:", detailedContent.length)
    
    if (detailedContent.length > 0) {
      console.log("🔍 DEBUG API: Sample detailed content:", {
        firstDoc: {
          courseId: detailedContent[0].courseId,
          moduleIndex: detailedContent[0].moduleIndex,
          subsectionIndex: detailedContent[0].subsectionIndex,
          pagesCount: detailedContent[0].pages?.length || 0
        }
      })
    }
    
    // Group content by module and subsection
    const contentByModule = {}
    
    detailedContent.forEach(content => {
      if (!contentByModule[content.moduleIndex]) {
        contentByModule[content.moduleIndex] = {}
      }
      contentByModule[content.moduleIndex][content.subsectionIndex] = {
        pages: content.pages || [],
        practicalExample: content.practicalExample,
        commonPitfalls: content.commonPitfalls,
        subsectionTitle: content.subsectionTitle
      }
    })
    
    console.log("🔍 DEBUG API: Grouped content by module:", {
      totalModules: Object.keys(contentByModule).length,
      moduleStructure: Object.keys(contentByModule).map(moduleIndex => ({
        moduleIndex,
        subsections: Object.keys(contentByModule[moduleIndex]).length
      }))
    })
    
    const response = {
      success: true,
      courseId: courseId,
      detailedContent: contentByModule,
      totalDocuments: detailedContent.length
    }
    
    console.log("🔍 DEBUG API: Returning response:", response)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("Fetch detailed content error:", error)
    
    if (error.message === "Invalid token") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: "Failed to fetch detailed content" },
      { status: 500 }
    )
  }
} 