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
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
      $or: [{ courseType: "academic" }, { isAcademicCourse: true }]
    })

    if (!course) {
      return NextResponse.json({ error: "Academic course not found" }, { status: 404 })
    }

    // Get assignments for this course
    const assignments = await db.collection("assignments").find({
      courseId: new ObjectId(resolvedParams.id)
    }).sort({ createdAt: -1 }).toArray()

    // Get enrollments count
    const enrollmentCount = await db.collection("enrollments").countDocuments({
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
    const existingCourse = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
      educatorId: new ObjectId(user.userId),
      $or: [{ courseType: "academic" }, { isAcademicCourse: true }]
    })

    if (!existingCourse) {
      return NextResponse.json({ 
        error: "Academic course not found or unauthorized" 
      }, { status: 404 })
    }

    let updateDoc
    let updateOperation

    // Check if this is a module-specific update (for assignments)
    if (requestBody.moduleIndex !== undefined && requestBody.updatedModule) {
      const { moduleIndex, updatedModule } = requestBody
      
      console.log('📝 Processing module update:', {
        courseId: resolvedParams.id,
        moduleIndex,
        moduleTitle: updatedModule.title,
        assignmentCount: updatedModule.assignments?.length || 0
      })

      // Validate moduleIndex
      if (!existingCourse.modules || moduleIndex >= existingCourse.modules.length || moduleIndex < 0) {
        return NextResponse.json({ 
          error: "Invalid module index" 
        }, { status: 400 })
      }

      // Validate and truncate assignment content to prevent document size limit
      if (updatedModule.assignments && Array.isArray(updatedModule.assignments)) {
        updatedModule.assignments = updatedModule.assignments.map(assignment => {
          if (assignment.content && assignment.content.length > 1000000) { // 1MB limit per assignment
            console.log('⚠️ Truncating large assignment content:', {
              originalSize: assignment.content.length,
              truncatedSize: 1000000
            })
            return {
              ...assignment,
              content: assignment.content.substring(0, 1000000) + '\n\n[Content truncated due to size limit]',
              originalContentSize: assignment.content.length,
              wasTruncated: true
            }
          }
          return assignment
        })
      }

      // Calculate total document size estimation
      const moduleJsonString = JSON.stringify(updatedModule)
      const estimatedSize = new Blob([moduleJsonString]).size
      
      console.log('📊 Document size estimation:', {
        moduleIndex,
        estimatedSizeKB: Math.round(estimatedSize / 1024),
        estimatedSizeMB: Math.round(estimatedSize / (1024 * 1024) * 100) / 100,
        assignmentCount: updatedModule.assignments?.length || 0
      })
      
      // Prevent updates that might exceed MongoDB's 16MB limit
      if (estimatedSize > 15000000) { // 15MB safety limit
        console.error('❌ Module update rejected - document too large:', {
          estimatedSizeMB: Math.round(estimatedSize / (1024 * 1024) * 100) / 100,
          limit: '16MB'
        })
        return NextResponse.json({ 
          error: "Module content too large",
          details: `Module size (${Math.round(estimatedSize / (1024 * 1024) * 100) / 100}MB) exceeds MongoDB document limit. Please reduce assignment content size.`,
          estimatedSize: estimatedSize,
          limitMB: 16
        }, { status: 413 })
      }

      // Update specific module in the modules array
      updateOperation = {
        $set: {
          [`modules.${moduleIndex}`]: updatedModule,
          updatedAt: new Date()
        }
      }

      console.log('🔄 Updating module with assignments:', {
        moduleIndex,
        totalAssignments: updatedModule.assignments?.length || 0,
        documentSizeKB: Math.round(estimatedSize / 1024)
      })
    } else {
      // Regular course update
      updateDoc = {
        ...requestBody,
        updatedAt: new Date()
      }

      // Remove fields that shouldn't be updated directly
      delete updateDoc._id
      delete updateDoc.educatorId
      delete updateDoc.createdAt
      delete updateDoc.moduleIndex
      delete updateDoc.updatedModule

      updateOperation = { $set: updateDoc }
    }

    // Update course
    const result = await db.collection("courses").updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      updateOperation
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Academic course not found" }, { status: 404 })
    }

    // Get updated course
    const updatedCourse = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id)
    })

    console.log('✅ Course updated successfully:', {
      courseId: resolvedParams.id,
      moduleCount: updatedCourse.modules?.length || 0,
      totalAssignments: updatedCourse.modules?.reduce((total, module) => total + (module.assignments?.length || 0), 0) || 0
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
    const existingCourse = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
      educatorId: new ObjectId(user.userId),
      $or: [{ courseType: "academic" }, { isAcademicCourse: true }]
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
      db.collection("enrollments").deleteMany({
        courseId: new ObjectId(resolvedParams.id)
      }),
      // Delete discussions
      db.collection("discussions").deleteMany({
        courseId: new ObjectId(resolvedParams.id)
      })
    ])

    // Delete the course
    const result = await db.collection("courses").deleteOne({
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