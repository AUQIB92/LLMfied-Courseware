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
  try {
    const user = await verifyToken(request)
    const client = await clientPromise
    const db = client.db("llmfied")
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'educator' or 'learner'
    
    if (user.role === "educator" || type === "educator") {
      // Get educator statistics
      const courses = await db.collection("courses")
        .find({ educatorId: new ObjectId(user.userId) })
        .toArray()
      
      const publishedCourses = courses.filter(c => c.status === "published")
      const draftCourses = courses.filter(c => c.status === "draft")
      
      // Get total enrollment count across all educator's courses
      const totalEnrollments = await db.collection("enrollments")
        .countDocuments({
          courseId: { $in: courses.map(c => c._id) }
        })
      
      // Get recent enrollments (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentEnrollments = await db.collection("enrollments")
        .countDocuments({
          courseId: { $in: courses.map(c => c._id) },
          enrolledAt: { $gte: thirtyDaysAgo }
        })
      
      // Get course completion stats
      const completionStats = await db.collection("enrollments")
        .aggregate([
          { $match: { courseId: { $in: courses.map(c => c._id) } } },
          {
            $group: {
              _id: null,
              totalEnrollments: { $sum: 1 },
              completedCount: {
                $sum: { $cond: [{ $gte: ["$progress", 100] }, 1, 0] }
              },
              averageProgress: { $avg: "$progress" }
            }
          }
        ]).toArray()
      
      const stats = completionStats[0] || {
        totalEnrollments: 0,
        completedCount: 0,
        averageProgress: 0
      }
      
      return NextResponse.json({
        totalCourses: courses.length,
        publishedCourses: publishedCourses.length,
        draftCourses: draftCourses.length,
        totalStudents: totalEnrollments,
        recentEnrollments,
        completionRate: stats.totalEnrollments > 0 
          ? Math.round((stats.completedCount / stats.totalEnrollments) * 100) 
          : 0,
        averageProgress: Math.round(stats.averageProgress || 0),
        courses: courses.map(course => ({
          _id: course._id,
          title: course.title,
          status: course.status,
          enrollmentCount: 0 // Will be populated below
        }))
      })
      
    } else if (user.role === "learner" || type === "learner") {
      // Get learner statistics
      const enrollments = await db.collection("enrollments")
        .find({ learnerId: new ObjectId(user.userId) })
        .toArray()
      
      const enrolledCourseIds = enrollments.map(e => e.courseId)
      const enrolledCourses = await db.collection("courses")
        .find({ 
          _id: { $in: enrolledCourseIds },
          status: "published" 
        })
        .toArray()
      
      // Calculate completion statistics
      const completedCourses = enrollments.filter(e => e.progress >= 100).length
      const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length
      const notStartedCourses = enrollments.filter(e => e.progress === 0).length
      
      // Calculate average progress
      const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0)
      const averageProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0
      
      // Calculate learning streak (placeholder - could be enhanced with actual activity tracking)
      const recentActivity = await db.collection("enrollments")
        .find({ 
          learnerId: new ObjectId(user.userId),
          lastAccessedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        })
        .toArray()
      
      // Calculate total time spent (placeholder - would need activity tracking)
      const totalTimeSpent = enrollments.length * 45 // Placeholder: 45 minutes per course average
      
      return NextResponse.json({
        coursesEnrolled: enrollments.length,
        coursesCompleted: completedCourses,
        coursesInProgress: inProgressCourses,
        coursesNotStarted: notStartedCourses,
        totalTimeSpent, // in minutes
        averageProgress: Math.round(averageProgress),
        averageScore: 85, // Placeholder - would need quiz/assessment tracking
        streak: Math.min(recentActivity.length, 30), // Placeholder streak calculation
        certificates: completedCourses, // Assuming 1 certificate per completed course
        enrollments: enrollments.map(enrollment => {
          const course = enrolledCourses.find(c => c._id.toString() === enrollment.courseId.toString())
          return {
            ...enrollment,
            courseTitle: course?.title || "Unknown Course",
            courseDescription: course?.description || ""
          }
        })
      })
    }
    
    return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
    
  } catch (error) {
    console.error("Error in GET /api/stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
