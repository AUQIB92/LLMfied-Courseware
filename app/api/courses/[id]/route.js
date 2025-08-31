import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { createCoursePublishedNotification } from "@/lib/notificationService"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function GET(request, { params }) {
  let client = null;
  try {
    const resolvedParams = await params
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Get course basic info first
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // If the course has modules, fetch quizzes for each module
    if (course.modules && course.modules.length > 0) {
      const moduleIds = course.modules.map(m => new ObjectId(m._id));
      const quizzes = await db.collection("quizzes").find({
        moduleId: { $in: moduleIds }
      }).toArray();

      // Attach quizzes to their respective modules
      course.modules.forEach(module => {
        module.quizzes = quizzes.filter(q => q.moduleId.toString() === module._id.toString());
      });
    }

    // Check if user is authenticated
    try {
      const user = await verifyToken(request)
      
      // If user is the educator who created the course, return full content
      if (user.role === "educator" && course.educatorId.toString() === user.userId.toString()) {
        return NextResponse.json(course)
      }
      
      // If user is a learner, check enrollment status
      if (user.role === "learner") {
        const enrollment = await db.collection("enrollments").findOne({
          learnerId: new ObjectId(user.userId),
          courseId: new ObjectId(resolvedParams.id)
        })
        
        // If enrolled, return full course content
        if (enrollment) {
          return NextResponse.json(course)
        }
        
        // If not enrolled, return limited course info (no modules/content)
        const limitedCourse = {
          _id: course._id,
          title: course.title,
          description: course.description,
          status: course.status,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          enrollmentCount: course.enrollmentCount || 0,
          // Don't include modules, content, or other sensitive data
          isEnrolled: false
        }
        
        return NextResponse.json(limitedCourse)
      }
      
      // For other roles or unknown users, return limited info
      const limitedCourse = {
        _id: course._id,
        title: course.title,
        description: course.description,
        status: course.status,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        enrollmentCount: course.enrollmentCount || 0,
        isEnrolled: false
      }
      
      return NextResponse.json(limitedCourse)
      
    } catch (tokenError) {
      // If no valid token, return limited public info only
      if (course.status === "published") {
        const publicCourse = {
          _id: course._id,
          title: course.title,
          description: course.description,
          status: course.status,
          createdAt: course.createdAt,
          enrollmentCount: course.enrollmentCount || 0,
          isEnrolled: false
        }
        return NextResponse.json(publicCourse)
      } else {
        // Don't show draft courses to unauthenticated users
        return NextResponse.json({ error: "Course not found" }, { status: 404 })
      }
    }
    
  } catch (error) {
    console.error("Error in GET /api/courses/[id]:", error)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  let client = null;
  try {
    const resolvedParams = await params
    const user = await verifyToken(request)
    const updates = await request.json()
    
    console.log("PUT /api/courses/[id] - Updates received:", {
      courseId: resolvedParams.id,
      userId: user.userId,
      userRole: user.role,
      updateKeys: Object.keys(updates),
      hasId: '_id' in updates,
      hasCreatedAt: 'createdAt' in updates,
      hasEducatorId: 'educatorId' in updates
    })
    
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    const course = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (user.role === "educator" && course.educatorId.toString() !== user.userId.toString()) {
      return NextResponse.json({ 
        error: "Unauthorized: You can only edit your own courses" 
      }, { status: 403 })
    }

    // Check if status is being changed
    if (updates.status && updates.status !== course.status) {
      if (updates.status === "published") {
        // Validate course has required content before publishing
        if (!course.title || !course.description) {
          return NextResponse.json({ 
            error: "Cannot publish course: Title and description are required" 
          }, { status: 400 })
        }
        
        if (!course.modules || course.modules.length === 0) {
          return NextResponse.json({ 
            error: "Cannot publish course: At least one module is required" 
          }, { status: 400 })
        }
        
        console.log(`Publishing course: ${course.title} (${resolvedParams.id})`)
      } else if (updates.status === "draft" && course.status === "published") {
        // Check enrollment count when unpublishing
        const enrollmentCount = await db.collection("enrollments").countDocuments({
          courseId: new ObjectId(resolvedParams.id)
        })
        
        if (enrollmentCount > 0) {
          console.log(`Unpublishing course with ${enrollmentCount} enrollments: ${course.title}`)
        }
      }
    }

    // Prevent certain updates if course is published and has enrollments
    if (course.status === "published" && updates.modules) {
      const enrollmentCount = await db.collection("enrollments").countDocuments({
        courseId: new ObjectId(resolvedParams.id)
      })
      
      if (enrollmentCount > 0) {
        console.warn(`Updating modules for published course with ${enrollmentCount} enrollments`)
        // Allow the update but log it for tracking
      }
    }

    // Filter out immutable fields that cannot be updated
    const { _id, createdAt, educatorId, ...allowedUpdates } = updates
    
    // Validate that we have something to update
    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update" 
      }, { status: 400 })
    }

    await db.collection("courses").updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      {
        $set: {
          ...allowedUpdates,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ 
      success: true,
      message: "Course updated successfully" 
    })
  } catch (error) {
    console.error("PUT /api/courses/[id] error:", error)
    return NextResponse.json({ 
      error: "Failed to update course", 
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  let client = null;
  try {
    const resolvedParams = await params
    const user = await verifyToken(request)
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    const course = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (user.role === "educator" && course.educatorId.toString() !== user.userId.toString()) {
      return NextResponse.json({ error: "Unauthorized: You can only delete your own courses" }, { status: 403 })
    }

    // Check for active enrollments
    const enrollmentCount = await db.collection("enrollments").countDocuments({
      courseId: new ObjectId(resolvedParams.id)
    })

    if (course.status === "published" && enrollmentCount > 0) {
      console.log(`Attempting to delete published course with ${enrollmentCount} enrollments`)
      // Allow deletion but log for tracking
      console.warn(`Course ${course.title} (${resolvedParams.id}) deleted with ${enrollmentCount} active enrollments`)
    }

    // Delete the course
    await db.collection("courses").deleteOne({
      _id: new ObjectId(resolvedParams.id),
    })

    // Also clean up related enrollments (optional - you might want to keep for historical purposes)
    if (enrollmentCount > 0) {
      await db.collection("enrollments").deleteMany({
        courseId: new ObjectId(resolvedParams.id)
      })
      console.log(`Cleaned up ${enrollmentCount} enrollments for deleted course`)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Course deleted successfully",
      enrollmentsRemoved: enrollmentCount 
    })
  } catch (error) {
    console.error("DELETE /api/courses/[id] error:", error)
    return NextResponse.json({ 
      error: "Failed to delete course", 
      details: error.message 
    }, { status: 500 })
  }
}