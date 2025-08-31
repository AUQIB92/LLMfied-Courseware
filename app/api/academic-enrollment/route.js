import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// GET /api/academic-enrollment - Get academic enrollments
export async function GET(request) {
  let client = null;
  try {
    // Verify authentication
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 })
    }
    
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId") || user.userId // Use authenticated user's ID if no studentId provided
    const courseId = searchParams.get("courseId")
    const status = searchParams.get("status") || "active" // Default to active enrollments

    const filter = {}
    
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

    const enrollments = await db.collection("academicEnrollments").find(filter).sort({ enrolledAt: -1 }).toArray()
    
    // Populate course and student details
    if (enrollments.length > 0) {
      const courseIds = [...new Set(enrollments.map(enrollment => enrollment.courseId))]
      const studentIds = [...new Set(enrollments.map(enrollment => enrollment.studentId))]
      
      const [courses, students] = await Promise.all([
        db.collection("courses").find({
          _id: { $in: courseIds }
        }).toArray(),
        db.collection("users").find({
          _id: { $in: studentIds }
        }, { projection: { name: 1, email: 1 } }).toArray()
      ])
      
      const courseMap = {}
      const studentMap = {}
      
      courses.forEach(course => {
        courseMap[course._id.toString()] = course
      })
      
      students.forEach(student => {
        studentMap[student._id.toString()] = student
      })
      
      enrollments.forEach(enrollment => {
        enrollment.course = courseMap[enrollment.courseId.toString()]
        enrollment.student = studentMap[enrollment.studentId.toString()]
      })

      // Filter out enrollments where the course was not found (e.g., deleted courses)
      const validEnrollments = enrollments.filter(enrollment => enrollment.course && enrollment.course.title)
      console.log(`Filtered ${enrollments.length - validEnrollments.length} enrollments with missing course data`)
      
      return NextResponse.json(validEnrollments)
    }

    return NextResponse.json(enrollments)

  } catch (error) {
    console.error("Error fetching academic enrollments:", error)
    return NextResponse.json({ 
      error: "Failed to fetch academic enrollments",
      details: error.message
    }, { status: 500 })
  }
}

// POST /api/academic-enrollment - Enroll in academic course
export async function POST(request) {
  let client = null;
  try {
    console.log("🎓 Academic enrollment request received");
    
    const user = await verifyToken(request)
    console.log("✅ User verified:", { userId: user.userId, role: user.role });
    
    if (user.role !== "learner") {
      console.log("❌ Unauthorized: User role is not learner");
      return NextResponse.json({ error: "Unauthorized - Only learners can enroll" }, { status: 403 })
    }

    const requestBody = await request.json()
    const { courseId } = requestBody
    console.log("📝 Request body:", { courseId });

    if (!courseId) {
      console.log("❌ Missing courseId");
      return NextResponse.json({ 
        error: "Missing required field: courseId" 
      }, { status: 400 })
    }

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    console.log("🔍 Looking for course with ID:", courseId);
    
    // Check if course exists and is published
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(courseId),
      status: "published",
      $or: [
        { isAcademicCourse: true },
        { courseType: "academic" }
      ]
    })

    console.log("📚 Course found:", course ? { id: course._id, title: course.title, status: course.status, isAcademicCourse: course.isAcademicCourse, courseType: course.courseType } : null);

    if (!course) {
      console.log("❌ Course not found or not available");
      return NextResponse.json({ 
        error: "Course not found or not available for enrollment" 
      }, { status: 404 })
    }

    // Check if already enrolled
    console.log("🔍 Checking for existing enrollment...");
    const existingEnrollment = await db.collection("academicEnrollments").findOne({
      studentId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId)
    })

    if (existingEnrollment) {
      console.log("⚠️ Already enrolled in this course");
      return NextResponse.json({ 
        error: "Already enrolled in this course" 
      }, { status: 400 })
    }

    // Create enrollment
    console.log("📝 Creating new enrollment...");
    const enrollmentDocument = {
      studentId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId),
      enrolledAt: new Date(),
      status: "active", // active, completed, dropped, suspended
      progress: 0,
      lastAccessedAt: new Date(),
      grade: null,
      completedModules: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const enrollment = await db.collection("academicEnrollments").insertOne(enrollmentDocument)

    console.log("✅ Academic enrollment created successfully:", enrollment.insertedId)
    
    return NextResponse.json({ 
      id: enrollment.insertedId,
      _id: enrollment.insertedId.toString(),
      ...enrollmentDocument
    })

  } catch (error) {
    console.error("❌ Error creating academic enrollment:", error)
    
    // Handle specific auth errors
    if (error.message.includes("No authorization header") || error.message.includes("No token provided")) {
      return NextResponse.json({ 
        error: "Authentication required",
        details: error.message
      }, { status: 401 })
    }
    
    if (error.message.includes("Invalid token") || error.message.includes("Token has expired")) {
      return NextResponse.json({ 
        error: "Invalid or expired token",
        details: error.message
      }, { status: 401 })
    }
    
    return NextResponse.json({ 
      error: "Failed to create academic enrollment",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// DELETE /api/academic-enrollment - Unenroll from academic course
export async function DELETE(request) {
  let client = null;
  try {
    const user = await verifyToken(request)
    if (user.role !== "learner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ 
        error: "Missing required parameter: courseId" 
      }, { status: 400 })
    }

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Check if enrollment exists
    const existingEnrollment = await db.collection("academicEnrollments").findOne({
      studentId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId)
    })

    if (!existingEnrollment) {
      return NextResponse.json({ 
        error: "Enrollment not found" 
      }, { status: 404 })
    }

    // Update enrollment status to dropped
    const result = await db.collection("academicEnrollments").updateOne(
      { 
        studentId: new ObjectId(user.userId),
        courseId: new ObjectId(courseId)
      },
      { 
        $set: { 
          status: "dropped",
          droppedAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Successfully unenrolled from course" })

  } catch (error) {
    console.error("Error removing academic enrollment:", error)
    return NextResponse.json({ 
      error: "Failed to remove academic enrollment",
      details: error.message
    }, { status: 500 })
  }
} 