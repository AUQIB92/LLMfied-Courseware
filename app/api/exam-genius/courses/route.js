import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function GET(request) {
  let client = null;
  try {
    // Get user session
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Connect to MongoDB
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    const coursesCollection = db.collection("courses")
    const enrollmentsCollection = db.collection("enrollments")

    console.log(`📚 Fetching competitive exam courses for educator: ${user.userId}`)

    // Build query filter for competitive exam courses
    const filter = {
      educatorId: new ObjectId(user.userId),
      isCompetitiveExam: true // Only fetch competitive exam courses
    }

    // Get URL parameters for additional filtering
    const { searchParams } = new URL(request.url)
    const examType = searchParams.get('examType')
    const subject = searchParams.get('subject')
    const status = searchParams.get('status')

    // Add additional filters if provided
    if (examType) {
      filter.examType = examType
    }
    if (subject) {
      filter.subject = subject
    }
    if (status) {
      filter.status = status
    }

    console.log("Query filter:", filter)

    // Fetch competitive exam courses
    const courses = await coursesCollection
      .find(filter)
      .sort({ createdAt: -1 }) // Most recent first
      .toArray()

    console.log(`Found ${courses.length} competitive exam courses`)

    // Add enrollment counts to courses
    if (courses.length > 0) {
      const courseIds = courses.map(course => course._id)
      
      // Get enrollment counts for all courses
      const enrollmentCounts = await enrollmentsCollection.aggregate([
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

    // Calculate overall stats for competitive exam courses
    const stats = await calculateCompetitiveExamStats(coursesCollection, enrollmentsCollection, user.userId)

    // Format courses for frontend
    const formattedCourses = courses.map(course => ({
      ...course,
      _id: course._id.toString(),
      educatorId: course.educatorId.toString(),
      
      // Ensure competitive exam specific fields
      examType: course.examType || 'SSC',
      subject: course.subject || 'Quantitative Aptitude',
      isCompetitiveExam: true,
      
      // Add computed fields
      moduleCount: course.modules?.length || 0,
      subsectionCount: course.totalSubsections || 0,
      pageCount: course.totalPages || 0,
      
      // Format dates
      createdAt: course.createdAt?.toISOString(),
      updatedAt: course.updatedAt?.toISOString(),
      
      // Add status indicators
      isPublished: course.status === 'published',
      isDraft: course.status === 'draft',
      
      // Add engagement metrics
      engagementScore: calculateEngagementScore(course),
      
      // Add course quality indicators
      qualityScore: calculateQualityScore(course)
    }))

    console.log("=== GET /api/exam-genius/courses completed successfully ===")
    
    return NextResponse.json({
      success: true,
      courses: formattedCourses,
      stats: stats,
      metadata: {
        totalCourses: formattedCourses.length,
        examTypes: [...new Set(formattedCourses.map(c => c.examType))],
        subjects: [...new Set(formattedCourses.map(c => c.subject))],
        fetchedAt: new Date().toISOString(),
        isCompetitiveExam: true
      }
    })

  } catch (error) {
    console.error("Fetch competitive exam courses error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch competitive exam courses. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate competitive exam course stats
async function calculateCompetitiveExamStats(coursesCollection, enrollmentsCollection, userId) {
  try {
    const filter = {
      educatorId: new ObjectId(userId),
      isCompetitiveExam: true
    }

    // Total courses
    const totalCourses = await coursesCollection.countDocuments(filter)

    // Total students across all competitive exam courses
    const enrollmentStats = await enrollmentsCollection.aggregate([
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      {
        $match: {
          "course.educatorId": new ObjectId(userId),
          "course.isCompetitiveExam": true
        }
      },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          averageProgress: { $avg: "$progress" },
          completedCount: {
            $sum: {
              $cond: [{ $gte: ["$progress", 100] }, 1, 0]
            }
          }
        }
      }
    ]).toArray()

    const enrollmentData = enrollmentStats[0] || {
      totalStudents: 0,
      averageProgress: 0,
      completedCount: 0
    }

    // Calculate completion rate
    const completionRate = enrollmentData.totalStudents > 0 
      ? Math.round((enrollmentData.completedCount / enrollmentData.totalStudents) * 100)
      : 0

    // Calculate average rating
    const ratingStats = await coursesCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: "$totalRatings" }
        }
      }
    ]).toArray()

    const avgRating = ratingStats[0]?.averageRating || 0

    return {
      totalCourses: totalCourses,
      totalStudents: enrollmentData.totalStudents,
      completionRate: completionRate,
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
      
      // Additional competitive exam specific stats
      examTypes: await getExamTypeStats(coursesCollection, userId),
      subjects: await getSubjectStats(coursesCollection, userId),
      performanceMetrics: {
        averageProgress: Math.round(enrollmentData.averageProgress || 0),
        completedCourses: enrollmentData.completedCount,
        activeStudents: enrollmentData.totalStudents - enrollmentData.completedCount
      }
    }

  } catch (error) {
    console.error("Error calculating competitive exam stats:", error)
    return {
      totalCourses: 0,
      totalStudents: 0,
      completionRate: 0,
      avgRating: 0,
      examTypes: [],
      subjects: [],
      performanceMetrics: {
        averageProgress: 0,
        completedCourses: 0,
        activeStudents: 0
      } finally {
    if (client) {
      await client.close()
    }
  }
    }
  }
}

// Helper function to get exam type statistics
async function getExamTypeStats(coursesCollection, userId) {
  try {
    const stats = await coursesCollection.aggregate([
      {
        $match: {
          educatorId: new ObjectId(userId),
          isCompetitiveExam: true
        }
      },
      {
        $group: {
          _id: "$examType",
          count: { $sum: 1 },
          totalEnrollments: { $sum: "$enrollmentCount" }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()

    return stats.map(stat => ({
      examType: stat._id,
      courseCount: stat.count,
      enrollmentCount: stat.totalEnrollments || 0
    }))
  } catch (error) {
    console.error("Error getting exam type stats:", error)
    return []
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// Helper function to get subject statistics
async function getSubjectStats(coursesCollection, userId) {
  try {
    const stats = await coursesCollection.aggregate([
      {
        $match: {
          educatorId: new ObjectId(userId),
          isCompetitiveExam: true
        }
      },
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 },
          totalEnrollments: { $sum: "$enrollmentCount" }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()

    return stats.map(stat => ({
      subject: stat._id,
      courseCount: stat.count,
      enrollmentCount: stat.totalEnrollments || 0
    }))
  } catch (error) {
    console.error("Error getting subject stats:", error)
    return []
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// Helper function to calculate engagement score
function calculateEngagementScore(course) {
  let score = 0
  
  // Base score from enrollments
  score += Math.min(course.enrollmentCount * 2, 20) // Max 20 points
  
  // Rating contribution
  if (course.rating > 0) {
    score += course.rating * 4 // Max 20 points for 5-star rating
  }
  
  // Content richness
  score += Math.min(course.moduleCount * 2, 15) // Max 15 points
  score += Math.min((course.totalSubsections || 0) * 0.5, 10) // Max 10 points
  
  // Competitive exam features
  if (course.examFocus?.speedSolving) score += 5
  if (course.examFocus?.formulaMastery) score += 5
  if (course.examFocus?.timeManagement) score += 5
  
  // Completion rate bonus
  if (course.completionRate > 80) score += 10
  else if (course.completionRate > 60) score += 5
  
  return Math.min(Math.round(score), 100) // Cap at 100
}

// Helper function to calculate quality score
function calculateQualityScore(course) {
  let score = 0
  
  // Content completeness
  if (course.modules && course.modules.length > 0) score += 20
  if (course.totalSubsections > 0) score += 15
  if (course.totalPages > 0) score += 15
  
  // Competitive exam specific features
  if (course.examFocus?.speedSolving) score += 10
  if (course.examFocus?.formulaMastery) score += 10
  if (course.examFocus?.examPatterns) score += 10
  
  // Course metadata quality
  if (course.description && course.description.length > 50) score += 5
  if (course.learningOutcomes && course.learningOutcomes.length > 0) score += 5
  if (course.prerequisites && course.prerequisites.length > 0) score += 5
  
  // Enhancement indicators
  if (course.processingMetadata?.aiEnhanced) score += 5
  
  return Math.min(Math.round(score), 100) // Cap at 100
} 