import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}
import { ObjectId } from "mongodb"

export async function POST(request) {
  try {
    // Get user session
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("llmfied")
    const collection = db.collection("courses")
    const detailedContentCollection = db.collection("course_detailed_content")

    const { course, metadata } = await request.json()

    if (!course) {
      return NextResponse.json({ error: "Course data is required" }, { status: 400 })
    }

    console.log(`💾 Saving competitive exam course: ${course.title}`)

    // Extract and separate detailed content to avoid document size limit
    const detailedContent = []
    const lightweightModules = []

    // Process modules to separate detailed content
    if (course.modules && Array.isArray(course.modules)) {
      course.modules.forEach((module, moduleIndex) => {
        if (module.detailedSubsections && Array.isArray(module.detailedSubsections)) {
          module.detailedSubsections.forEach((subsection, subsectionIndex) => {
            if (subsection.pages && Array.isArray(subsection.pages)) {
              // Store detailed content separately
              const contentId = `${course._id || 'temp'}_m${moduleIndex}_s${subsectionIndex}`
              detailedContent.push({
                contentId: contentId,
                courseId: course._id,
                moduleIndex: moduleIndex,
                subsectionIndex: subsectionIndex,
                subsectionTitle: subsection.title,
                pages: subsection.pages,
                practicalExample: subsection.practicalExample,
                commonPitfalls: subsection.commonPitfalls,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              
              // Keep only lightweight subsection info in main course
              const lightweightSubsection = {
                title: subsection.title,
                summary: subsection.summary,
                keyPoints: subsection.keyPoints,
                difficulty: subsection.difficulty,
                estimatedTime: subsection.estimatedTime,
                examRelevance: subsection.examRelevance,
                contentId: contentId, // Reference to detailed content
                pageCount: subsection.pages ? subsection.pages.length : 0
              }
              
              // Replace detailed subsection with lightweight version
              subsection.pages = undefined
              subsection.practicalExample = undefined
              subsection.commonPitfalls = undefined
              Object.assign(subsection, lightweightSubsection)
            }
          })
        }
        
        lightweightModules.push(module)
      })
    }

    // Create enhanced course document for competitive exams (without heavy content)
    const courseDocument = {
      // Basic course information
      title: course.title,
      description: course.description,
      educatorId: new ObjectId(user.userId),
      
      // Competitive exam specific fields
      examType: course.examType || metadata?.examType,
      subject: course.subject || metadata?.subject,
      learnerLevel: course.learnerLevel || metadata?.learnerLevel,
      isCompetitiveExam: true,
      
      // Course content (lightweight modules)
      modules: lightweightModules,
      
      // Enhanced metadata
      category: `${course.examType} - ${course.subject}`,
      level: course.learnerLevel,
      status: course.status || "draft",
      isPublished: course.status === "published",
      isExamGenius: true,
      
      // Competitive exam specific metadata
      examFocus: course.examFocus || {
        speedSolving: true,
        formulaMastery: true,
        timeManagement: true,
        accuracyImprovement: true,
        examPatterns: true
      },
      
      // Course metrics
      totalModules: course.modules?.length || 0,
      totalSubsections: course.totalSubsections || 0,
      totalPages: course.totalPages || 0,
      estimatedStudyTime: course.estimatedStudyTime || "40-50 hours",
      
      // Enhanced features for competitive exams
      features: {
        multiPageExplanations: true,
        speedSolvingTechniques: true,
        formulaDerivations: true,
        examPatternAnalysis: true,
        timeManagementStrategies: true,
        commonTrapAnalysis: true,
        memoryTricks: true,
        progressiveQuestions: true,
        realExamSimulation: true
      },
      
      // Learning outcomes specific to competitive exams
      learningOutcomes: [
        `Master ${course.subject} concepts for ${course.examType} exam`,
        "Develop speed-solving techniques and shortcuts",
        "Identify and avoid common question traps",
        "Improve accuracy under time pressure",
        "Practice with exam-pattern questions",
        "Build confidence for competitive examination"
      ],
      
      // Prerequisites and recommendations
      prerequisites: course.prerequisites || [
        "Basic mathematical knowledge",
        "Logical thinking ability",
        "Commitment to regular practice"
      ],
      
      // Target audience
      targetAudience: [
        `${course.examType} exam aspirants`,
        `${course.learnerLevel} level students`,
        "Competitive exam preparation students",
        "Government job seekers",
        "Career advancement seekers"
      ],
      
      // Course structure information
      courseStructure: {
        hasMultiPageContent: true,
        hasFormulasAndDerivations: true,
        hasSpeedSolvingTechniques: true,
        hasExamPatterns: true,
        hasPracticeQuestions: true,
        hasTimeManagementTips: true,
        hasMemoryAids: true,
        usesDetailedContentCollection: true // Flag to indicate content is stored separately
      },
      
      // Enrollment and engagement metrics
      enrollmentCount: 0,
      rating: 0,
      totalRatings: 0,
      completionRate: 0,
      averageStudyTime: course.estimatedStudyTime || "40-50 hours",
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Processing metadata
      processingMetadata: {
        method: course.metadata?.processingMethod || "competitive_exam_enhanced",
        aiEnhanced: true,
        contentGenerated: new Date(),
        enhancementsApplied: true,
        isCompetitiveExam: true,
        originalSource: course.metadata?.originalFileName || "ai_generated"
      },
      
      // Additional competitive exam features
      examSpecificFeatures: {
        examType: course.examType,
        subject: course.subject,
        difficultyProgression: true,
        timeBasedPractice: true,
        errorAnalysis: true,
        performanceTracking: true,
        examSimulation: true,
        previousYearPatterns: true
      }
    }

    // Check if this is an update (course has _id) or create (no _id)
    const isUpdate = course._id && course._id !== 'undefined'
    
    if (isUpdate) {
      console.log(`🔄 Updating existing competitive exam course: ${course.title} (ID: ${course._id})`)
      
      // For updates, get the original course to preserve createdAt
      const originalCourse = await collection.findOne({ _id: new ObjectId(course._id) })
      
      if (!originalCourse) {
        throw new Error("Course not found")
      }
      
      // For updates, preserve the original creation timestamp and update the updatedAt
      const updateDocument = {
        ...courseDocument,
        createdAt: originalCourse.createdAt, // Preserve original createdAt
        updatedAt: new Date()
      }
      
      // Update detailed content collection (remove old content first)
      await detailedContentCollection.deleteMany({ courseId: course._id })
      
      // Insert new detailed content
      if (detailedContent.length > 0) {
        // Update content IDs to use actual course ID
        const updatedDetailedContent = detailedContent.map(content => ({
          ...content,
          courseId: course._id,
          contentId: content.contentId.replace('temp', course._id)
        }))
        
        await detailedContentCollection.insertMany(updatedDetailedContent)
        console.log(`📝 Updated ${updatedDetailedContent.length} detailed content documents`)
      }
      
      // Update the existing course using replaceOne
      const result = await collection.replaceOne(
        { _id: new ObjectId(course._id) },
        updateDocument
      )

      if (result.matchedCount === 0) {
        throw new Error("Course not found")
      }

      if (result.modifiedCount === 0) {
        console.log("No changes detected in course update")
      }

      console.log(`✅ Competitive exam course updated: ${course._id}`)

      // Fetch the updated course
      const savedCourse = await collection.findOne({ _id: new ObjectId(course._id) })

      return NextResponse.json({
        success: true,
        course: {
          ...savedCourse,
          _id: savedCourse._id.toString(),
          educatorId: savedCourse.educatorId.toString()
        },
        message: `Competitive exam course "${course.title}" updated successfully`,
        metadata: {
          courseId: course._id,
          examType: course.examType,
          subject: course.subject,
          learnerLevel: course.learnerLevel,
          totalModules: course.modules?.length || 0,
          isCompetitiveExam: true,
          isUpdate: true,
          updatedAt: new Date().toISOString()
        }
      })
      
    } else {
      console.log(`💾 Creating new competitive exam course: ${course.title}`)
      
      // Insert the course document
      const result = await collection.insertOne(courseDocument)

      if (!result.insertedId) {
        throw new Error("Failed to insert course document")
      }

      console.log(`✅ Competitive exam course saved with ID: ${result.insertedId}`)

      // Insert detailed content for new course
      if (detailedContent.length > 0) {
        // Update content IDs to use actual course ID
        const updatedDetailedContent = detailedContent.map(content => ({
          ...content,
          courseId: result.insertedId.toString(),
          contentId: content.contentId.replace('temp', result.insertedId.toString())
        }))
        
        await detailedContentCollection.insertMany(updatedDetailedContent)
        console.log(`📝 Inserted ${updatedDetailedContent.length} detailed content documents`)
      }

      // Fetch the complete saved course
      const savedCourse = await collection.findOne({ _id: result.insertedId })

      // Update user's course creation stats (optional)
      try {
        const usersCollection = db.collection("users")
        await usersCollection.updateOne(
          { _id: new ObjectId(user.userId) },
          { 
            $inc: { 
              "stats.coursesCreated": 1,
              "stats.competitiveExamCourses": 1
            },
            $set: { 
              "lastActivity": new Date(),
              "lastCourseCreated": new Date()
            }
          }
        )
      } catch (statsError) {
        console.warn("Failed to update user stats:", statsError)
        // Don't fail the entire operation for stats update failure
      }

      return NextResponse.json({
        success: true,
        course: {
          ...savedCourse,
          _id: savedCourse._id.toString(), // Convert ObjectId to string for frontend
          educatorId: savedCourse.educatorId.toString()
        },
        message: `Competitive exam course "${course.title}" saved successfully`,
        metadata: {
          courseId: result.insertedId.toString(),
          examType: course.examType,
          subject: course.subject,
          learnerLevel: course.learnerLevel,
          totalModules: course.modules?.length || 0,
          totalDetailedContentDocs: detailedContent.length,
          isCompetitiveExam: true,
          createdAt: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error("Save competitive exam course error:", error)
    
    // Provide specific error messages
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: "A course with this title already exists. Please choose a different title." },
        { status: 400 }
      )
    }
    
    if (error.message?.includes('validation')) {
      return NextResponse.json(
        { error: "Course data validation failed. Please check all required fields." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: "Failed to save competitive exam course. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 