import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// GET /api/academic-courses/[id] - Get specific academic course
export async function GET(request, { params }) {
  let client = null;
  try {
    const resolvedParams = await params
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Get academic course basic info
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
      $or: [{ courseType: "academic" }, { isAcademicCourse: true }]
    })

    if (!course) {
      return NextResponse.json({ error: "Academic course not found" }, { status: 404 })
    }

    // Get assignments for this course from both sources
    let assignments = []
    
    // 1. Get assignments from separate assignments collection
    const separateAssignments = await db.collection("assignments").find({
      courseId: new ObjectId(resolvedParams.id)
    }).sort({ createdAt: -1 }).toArray()
    
    assignments = [...separateAssignments]
    
    // 2. Get assignments from course modules
    if (course.modules && Array.isArray(course.modules)) {
      for (const module of course.modules) {
        if (module.assignments && Array.isArray(module.assignments)) {
          for (const assignment of module.assignments) {
            if (assignment.isActive !== false) {
              assignments.push({
                ...assignment,
                courseId: course._id.toString(),
                courseTitle: course.title,
                educatorId: course.educatorId?.toString(),
                educatorName: course.educatorName || 'Course Instructor',
                moduleTitle: module.title,
                fromModule: true,
                // Ensure consistent date handling
                dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
                publishedDate: assignment.publishedDate ? new Date(assignment.publishedDate) : null
              })
            }
          }
        }
      }
    }

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
  let client = null;
  const startTime = Date.now()
  let operationContext = {
    courseId: 'unknown',
    operation: 'unknown',
    step: 'initialization'
  }
  
  try {
    console.log('🔄 Starting PUT request for academic course update')
    operationContext.step = 'token_verification'
    
    const user = await verifyToken(request)
    if (!user) {
      console.error('❌ Token verification failed - no user returned')
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
    
    if (user.role !== "educator") {
      console.error('❌ Authorization failed - user role:', user.role)
      return NextResponse.json({ error: "Unauthorized - educator role required" }, { status: 403 })
    }
    
    console.log('✅ User authenticated:', { userId: user.userId, role: user.role })

    operationContext.step = 'parameter_resolution'
    const resolvedParams = await params
    if (!resolvedParams?.id) {
      console.error('❌ No course ID provided in params')
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }
    
    operationContext.courseId = resolvedParams.id
    console.log('📋 Processing course update:', { courseId: resolvedParams.id })
    
    // Validate ObjectId format
    if (!ObjectId.isValid(resolvedParams.id)) {
      console.error('❌ Invalid ObjectId format:', resolvedParams.id)
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 })
    }
    
    operationContext.step = 'request_body_parsing'
    const requestBody = await request.json()
    console.log('📥 Request body structure:', {
      hasModuleIndex: requestBody.moduleIndex !== undefined,
      hasUpdatedModule: !!requestBody.updatedModule,
      hasAddAssignment: !!requestBody.addAssignment,
      bodyKeys: Object.keys(requestBody),
      moduleIndex: requestBody.moduleIndex,
      addAssignmentId: requestBody.addAssignment?.id
    })
    
    operationContext.step = 'database_connection'
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    console.log('✅ Database connection established')

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

    console.log('📚 Found existing course:', {
      courseId: existingCourse._id.toString(),
      title: existingCourse.title,
      totalModules: existingCourse.modules?.length || 0,
      modulesTitles: existingCourse.modules?.map((m, i) => `${i}: ${m.title}`) || []
    })

    let updateDoc
    let updateOperation

    // Handle action-based updates (delete/edit assignments)
    if (requestBody.action) {
      const { action, moduleIndex, assignmentIndex, updatedAssignment } = requestBody
      
      if (action === 'deleteAssignment') {
        console.log('🗑️ Processing assignment deletion:', { moduleIndex, assignmentIndex })
        
        // Validate indices
        if (!existingCourse.modules || moduleIndex >= existingCourse.modules.length || 
            !existingCourse.modules[moduleIndex].assignments || 
            assignmentIndex >= existingCourse.modules[moduleIndex].assignments.length) {
          return NextResponse.json({ 
            error: "Invalid module or assignment index" 
          }, { status: 400 })
        }
        
        // Create updated modules array with assignment removed
        const updatedModules = [...existingCourse.modules]
        updatedModules[moduleIndex] = {
          ...updatedModules[moduleIndex],
          assignments: updatedModules[moduleIndex].assignments.filter((_, index) => index !== assignmentIndex)
        }
        
        updateOperation = {
          $set: {
            modules: updatedModules,
            updatedAt: new Date()
          }
        }
        
      } else if (action === 'updateAssignment') {
        console.log('✏️ Processing assignment update:', { moduleIndex, assignmentIndex })
        
        // Validate indices
        if (!existingCourse.modules || moduleIndex >= existingCourse.modules.length || 
            !existingCourse.modules[moduleIndex].assignments || 
            assignmentIndex >= existingCourse.modules[moduleIndex].assignments.length) {
          return NextResponse.json({ 
            error: "Invalid module or assignment index" 
          }, { status: 400 })
        }
        
        // Create updated modules array with assignment updated
        const updatedModules = [...existingCourse.modules]
        updatedModules[moduleIndex] = {
          ...updatedModules[moduleIndex],
          assignments: updatedModules[moduleIndex].assignments.map((assignment, index) => 
            index === assignmentIndex ? { ...assignment, ...updatedAssignment } : assignment
          )
        }
        
        updateOperation = {
          $set: {
            modules: updatedModules,
            updatedAt: new Date()
          }
        }
      }
    }
    // Check if this is a module-specific update (for assignments)
    if (requestBody.moduleIndex !== undefined && (requestBody.updatedModule || requestBody.addAssignment)) {
      operationContext.operation = 'module_update'
      operationContext.step = 'module_validation'
      
      const { moduleIndex, updatedModule, addAssignment } = requestBody
      
      console.log('📝 Processing module update:', {
        courseId: resolvedParams.id,
        moduleIndex,
        updateType: addAssignment ? 'addAssignment' : 'replaceModule',
        moduleTitle: updatedModule?.title || 'adding assignment only',
        assignmentCount: updatedModule?.assignments?.length || (addAssignment ? 1 : 0)
      })
      
      operationContext.moduleIndex = moduleIndex
      operationContext.updateType = addAssignment ? 'addAssignment' : 'replaceModule'

      // Validate moduleIndex - check for null, undefined, or invalid values
      if (moduleIndex === null || moduleIndex === undefined || 
          !existingCourse.modules || 
          moduleIndex >= existingCourse.modules.length || 
          moduleIndex < 0 || 
          !Number.isInteger(moduleIndex)) {
        console.error('❌ Invalid module index:', {
          moduleIndex,
          moduleIndexType: typeof moduleIndex,
          totalModules: existingCourse.modules?.length || 0,
          isInteger: Number.isInteger(moduleIndex)
        })
        return NextResponse.json({ 
          error: "Invalid module index",
          details: `Module index must be a valid integer between 0 and ${(existingCourse.modules?.length || 1) - 1}. Received: ${moduleIndex} (${typeof moduleIndex})`,
          moduleIndex,
          totalModules: existingCourse.modules?.length || 0
        }, { status: 400 })
      }

      if (updatedModule) {
        // Validate and truncate assignment content to prevent document size limit (for full module updates)
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
        
        console.log('📊 Document size estimation for full module update:', {
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
      } else if (addAssignment) {
        // Validate single assignment content size
        if (addAssignment.content && addAssignment.content.length > 1000000) { // 1MB limit per assignment
          console.log('⚠️ Truncating large assignment content:', {
            originalSize: addAssignment.content.length,
            truncatedSize: 1000000
          })
          addAssignment.content = addAssignment.content.substring(0, 1000000) + '\n\n[Content truncated due to size limit]'
          addAssignment.originalContentSize = addAssignment.content.length
          addAssignment.wasTruncated = true
        }

        // Calculate assignment size estimation
        const assignmentJsonString = JSON.stringify(addAssignment)
        const estimatedSize = new Blob([assignmentJsonString]).size
        
        console.log('📊 Assignment size estimation:', {
          moduleIndex,
          estimatedSizeKB: Math.round(estimatedSize / 1024),
          assignmentId: addAssignment.id,
          assignmentTitle: addAssignment.title
        })
      }

      if (addAssignment) {
        // Add assignment to existing module without overwriting
        console.log('➕ Adding assignment to existing module:', {
          moduleIndex,
          assignmentId: addAssignment.id,
          assignmentTitle: addAssignment.title
        })
        
        // Get the current module and safely add the assignment
        const currentModule = existingCourse.modules[moduleIndex]
        
        if (!currentModule) {
          console.error('❌ Module not found at index:', {
            moduleIndex,
            totalModules: existingCourse.modules?.length || 0,
            courseId: resolvedParams.id
          })
          return NextResponse.json({
            error: `Module not found at index ${moduleIndex}`,
            details: `Course has ${existingCourse.modules?.length || 0} modules, but tried to access index ${moduleIndex}`,
            totalModules: existingCourse.modules?.length || 0
          }, { status: 400 })
        }
        
        const currentAssignments = currentModule.assignments || []
        
        console.log('📋 Current module assignments:', {
          moduleTitle: currentModule.title,
          assignmentCount: currentAssignments.length
        })
        
        // Create updated assignments array with new assignment
        const updatedAssignments = [...currentAssignments, addAssignment]
        
        // Update only the assignments array and timestamp
        updateOperation = {
          $set: {
            [`modules.${moduleIndex}.assignments`]: updatedAssignments,
            updatedAt: new Date()
          }
        }
        
        console.log('✅ Will update assignments array with', updatedAssignments.length, 'assignments')
      } else {
        // Replace entire module (existing behavior)
        console.log('🔄 Replacing entire module:', {
          moduleIndex,
          totalAssignments: updatedModule.assignments?.length || 0,
          documentSizeKB: Math.round(estimatedSize / 1024)
        })
        
        updateOperation = {
          $set: {
            [`modules.${moduleIndex}`]: updatedModule,
            updatedAt: new Date()
          }
        }
      }
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
    console.log('🔄 Executing database update:', {
      courseId: resolvedParams.id,
      updateOperation: JSON.stringify(updateOperation, null, 2)
    })
    
    let result
    try {
      result = await db.collection("courses").updateOne(
        { _id: new ObjectId(resolvedParams.id) },
        updateOperation
      )
      console.log('📊 Database update result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged
      })
    } catch (dbError) {
      console.error('❌ Database update failed:', {
        error: dbError.message,
        stack: dbError.stack,
        updateOperation: JSON.stringify(updateOperation, null, 2)
      })
      throw new Error(`Database update failed: ${dbError.message}`)
    }

    if (result.matchedCount === 0) {
      console.error('❌ No course matched the update criteria')
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
    const duration = Date.now() - startTime
    console.error('❌ PUT /api/academic-courses/[id] failed:', {
      error: error.message,
      stack: error.stack,
      context: operationContext,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
    
    // Provide specific error responses based on error type
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return NextResponse.json({ 
        error: "Database connection timeout",
        details: "Please try again in a moment",
        code: "DB_TIMEOUT"
      }, { status: 504 })
    }
    
    if (error.message.includes('authentication') || error.message.includes('token')) {
      return NextResponse.json({ 
        error: "Authentication error",
        details: error.message,
        code: "AUTH_ERROR"
      }, { status: 401 })
    }
    
    if (error.message.includes('ObjectId') || error.message.includes('Invalid')) {
      return NextResponse.json({ 
        error: "Invalid request data",
        details: error.message,
        code: "VALIDATION_ERROR"
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Failed to update academic course",
      details: error.message,
      code: "INTERNAL_ERROR",
      context: operationContext
    }, { status: 500 })
  }
}

// DELETE /api/academic-courses/[id] - Delete academic course
export async function DELETE(request, { params }) {
  let client = null;
  try {
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await params
    const connection = await connectToDatabase()
    const client = connection.client
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