import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.error("No token provided in request")
      throw new Error("No token provided")
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set")
      throw new Error("JWT_SECRET not configured")
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("Token verified successfully for user:", decoded.userId)
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error.message)
    throw error
  }
}

export async function GET(request) {
  try {
    console.log("📊 Stats API called")
    
    const user = await verifyToken(request)
    console.log("✅ User verified:", { userId: user.userId, role: user.role })
    
    const client = await clientPromise
    const db = client.db("llmfied")
    console.log("✅ Database connected")
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'educator' or 'learner'
    const excludeExamGenius = searchParams.get("excludeExamGenius") === "true"
    
    console.log("🔍 Query params:", { type, excludeExamGenius })
    
    if (user.role === "educator" || type === "educator") {
      console.log("📚 Fetching educator statistics...")
      
      // Get educator statistics
      const courseFilter = { educatorId: new ObjectId(user.userId) }
      
      // Exclude ExamGenius courses from general educator stats if requested
      if (excludeExamGenius) {
        courseFilter.$and = [
          { $or: [{ isExamGenius: { $ne: true } }, { isExamGenius: { $exists: false } }] },
          { $or: [{ isCompetitiveExam: { $ne: true } }, { isCompetitiveExam: { $exists: false } }] }
        ]
      }
      
      console.log("🔍 Course filter:", JSON.stringify(courseFilter, null, 2))
      
      const courses = await db.collection("courses")
        .find(courseFilter)
        .toArray()
      
      console.log("📚 Found courses:", courses.length)
      
      const publishedCourses = courses.filter(c => c.status === "published")
      const draftCourses = courses.filter(c => c.status === "draft")
      
      console.log("📊 Course breakdown:", {
        total: courses.length,
        published: publishedCourses.length,
        draft: draftCourses.length
      })
      
      // Get total enrollment count across all educator's courses
      const totalEnrollments = await db.collection("enrollments")
        .countDocuments({
          courseId: { $in: courses.map(c => c._id) }
        })
      
      console.log("👥 Total enrollments:", totalEnrollments)
      
      // Get recent enrollments (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentEnrollments = await db.collection("enrollments")
        .countDocuments({
          courseId: { $in: courses.map(c => c._id) },
          enrolledAt: { $gte: thirtyDaysAgo }
        })
      
      console.log("📈 Recent enrollments (30 days):", recentEnrollments)
      
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
      
      console.log("📊 Completion stats:", stats)
      
      // Calculate revenue (if courses have pricing)
      const revenue = courses.reduce((total, course) => {
        const price = course.price || 0
        const enrollmentCount = course.enrollmentCount || 0
        return total + (price * enrollmentCount)
      }, 0)
      
      console.log("💰 Revenue calculated:", revenue)
      
      // Get engagement metrics
      const weeklyEnrollments = await db.collection("enrollments")
        .aggregate([
          { $match: { courseId: { $in: courses.map(c => c._id) } } },
          {
            $group: {
              _id: {
                week: { $week: "$enrolledAt" },
                year: { $year: "$enrolledAt" }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": -1, "_id.week": -1 } },
          { $limit: 4 }
        ]).toArray()
      
      console.log("📅 Weekly enrollments:", weeklyEnrollments.length)
      
      // Get course performance data
      const coursePerformance = await db.collection("enrollments")
        .aggregate([
          { $match: { courseId: { $in: courses.map(c => c._id) } } },
          {
            $group: {
              _id: "$courseId",
              totalEnrollments: { $sum: 1 },
              completedCount: {
                $sum: { $cond: [{ $gte: ["$progress", 100] }, 1, 0] }
              },
              averageProgress: { $avg: "$progress" },
              averageRating: { $avg: "$rating" }
            }
          }
        ]).toArray()
      
      console.log("🎯 Course performance data:", coursePerformance.length)
      
      // Get active learners (learners who accessed courses in last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const activeLearners = await db.collection("enrollments")
        .countDocuments({
          courseId: { $in: courses.map(c => c._id) },
          lastAccessedAt: { $gte: sevenDaysAgo }
        })
      
      console.log("🚀 Active learners:", activeLearners)
      
      // Calculate retention rate (learners who completed at least 50% of any course)
      const retentionStats = await db.collection("enrollments")
        .aggregate([
          { $match: { courseId: { $in: courses.map(c => c._id) } } },
          {
            $group: {
              _id: null,
              totalLearners: { $sum: 1 },
              retainedLearners: {
                $sum: { $cond: [{ $gte: ["$progress", 50] }, 1, 0] }
              }
            }
          }
        ]).toArray()
      
      const retentionData = retentionStats[0] || { totalLearners: 0, retainedLearners: 0 }
      const retentionRate = retentionData.totalLearners > 0 
        ? Math.round((retentionData.retainedLearners / retentionData.totalLearners) * 100)
        : 0
      
      console.log("📊 Retention data:", { retentionData, retentionRate })
      
      // Get top performing courses
      const topCourses = coursePerformance
        .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
        .slice(0, 5)
        .map(perf => {
          const course = courses.find(c => c._id.toString() === perf._id.toString())
          return {
            _id: course._id,
            title: course.title,
            enrollments: perf.totalEnrollments,
            completionRate: perf.totalEnrollments > 0 
              ? Math.round((perf.completedCount / perf.totalEnrollments) * 100)
              : 0,
            averageProgress: Math.round(perf.averageProgress || 0),
            averageRating: Math.round((perf.averageRating || 0) * 10) / 10
          }
        })
      
      console.log("🏆 Top courses:", topCourses.length)
      
      // Calculate monthly growth
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      const currentMonthEnrollments = await db.collection("enrollments")
        .countDocuments({
          courseId: { $in: courses.map(c => c._id) },
          enrolledAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1)
          }
        })
      
      const lastMonthEnrollments = await db.collection("enrollments")
        .countDocuments({
          courseId: { $in: courses.map(c => c._id) },
          enrolledAt: {
            $gte: new Date(lastMonthYear, lastMonth, 1),
            $lt: new Date(lastMonthYear, lastMonth + 1, 1)
          }
        })
      
      const monthlyGrowth = lastMonthEnrollments > 0 
        ? Math.round(((currentMonthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) * 100)
        : 0
      
      console.log("📈 Monthly growth:", { currentMonthEnrollments, lastMonthEnrollments, monthlyGrowth })
      
      const responseData = {
        // Basic stats
        totalCourses: courses.length,
        publishedCourses: publishedCourses.length,
        draftCourses: draftCourses.length,
        totalStudents: totalEnrollments,
        recentEnrollments,
        completionRate: stats.totalEnrollments > 0 
          ? Math.round((stats.completedCount / stats.totalEnrollments) * 100) 
          : 0,
        averageProgress: Math.round(stats.averageProgress || 0),
        
        // Enhanced stats
        revenue: Math.round(revenue),
        activeLearners,
        retentionRate,
        monthlyGrowth,
        
        // Performance data
        weeklyEnrollments: weeklyEnrollments.map(item => ({
          week: item._id.week,
          year: item._id.year,
          enrollments: item.count
        })),
        
        topCourses,
        
        // Engagement metrics
        engagementMetrics: {
          averageSessionDuration: 35, // minutes (placeholder - would need session tracking)
          averageCoursesPerStudent: totalEnrollments > 0 ? Math.round((totalEnrollments / activeLearners) * 10) / 10 : 0,
          studentSatisfaction: 4.2, // out of 5 (placeholder - would need feedback system)
          certificatesIssued: stats.completedCount
        },
        
        courses: courses.map(course => {
          const perf = coursePerformance.find(p => p._id.toString() === course._id.toString())
          return {
            _id: course._id,
            title: course.title,
            status: course.status,
            enrollmentCount: perf?.totalEnrollments || 0,
            completionRate: perf?.totalEnrollments > 0 
              ? Math.round((perf.completedCount / perf.totalEnrollments) * 100)
              : 0,
            averageProgress: Math.round(perf?.averageProgress || 0),
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
          }
        })
      }
      
      console.log("✅ Stats response prepared successfully")
      return NextResponse.json(responseData)
      
    } else if (user.role === "learner" || type === "learner") {
      console.log("🎓 Fetching learner statistics...")
      
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
      
      // Calculate learning goals progress
      const learningGoals = {
        weeklyGoal: 5, // hours per week
        monthlyGoal: 20, // hours per month
        currentWeekProgress: Math.min(recentActivity.length * 2, 10), // placeholder
        currentMonthProgress: Math.min(enrollments.length * 3, 25) // placeholder
      }
      
      console.log("✅ Learner stats compiled successfully")
      
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
        learningGoals,
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
    
    console.log("❌ Invalid user role:", user.role)
    return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
    
  } catch (error) {
    console.error("💥 Error in GET /api/stats:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    
    // Return more specific error information
    let errorMessage = "Failed to fetch statistics"
    let statusCode = 500
    
    if (error.name === 'JsonWebTokenError') {
      errorMessage = "Invalid authentication token"
      statusCode = 401
    } else if (error.name === 'TokenExpiredError') {
      errorMessage = "Authentication token expired"
      statusCode = 401
    } else if (error.message.includes('No token provided')) {
      errorMessage = "Authentication required"
      statusCode = 401
    } else if (error.message.includes('JWT_SECRET')) {
      errorMessage = "Server configuration error"
      statusCode = 500
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        type: error.name
      },
      { status: statusCode }
    )
  }
}
