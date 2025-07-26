import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

// Enhanced database connection with timeout
async function getDBWithTimeout(timeoutMs = 10000) {
  return Promise.race([
    clientPromise.then(client => client.db("llmfied")),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs)
    )
  ])
}

export async function GET(request) {
  try {
    console.log("📊 Stats API called")
    
    const user = await verifyToken(request)
    console.log("✅ User verified:", { userId: user.userId, role: user.role })
    
    console.log("🔗 Connecting to database with timeout...")
    const db = await getDBWithTimeout(10000) // 10 second timeout
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
      
      const courses = await Promise.race([
        db.collection("courses").find(courseFilter).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 8000)
        )
      ])
      
      console.log("📚 Found courses:", courses.length)
      
      const publishedCourses = courses.filter(c => c.status === "published")
      const draftCourses = courses.filter(c => c.status === "draft")
      
      console.log("📊 Course breakdown:", {
        total: courses.length,
        published: publishedCourses.length,
        draft: draftCourses.length
      })
      
      // Get total enrollment count across all educator's courses
      const totalEnrollments = await Promise.race([
        db.collection("enrollments").countDocuments({
          courseId: { $in: courses.map(c => c._id) }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Enrollment count timeout')), 5000)
        )
      ])
      
      console.log("👥 Total enrollments:", totalEnrollments)
      
      // Get recent enrollments (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentEnrollments = await Promise.race([
        db.collection("enrollments").countDocuments({
          courseId: { $in: courses.map(c => c._id) },
          enrolledAt: { $gte: thirtyDaysAgo }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Recent enrollments timeout')), 5000)
        )
      ])
      
      console.log("📈 Recent enrollments (30 days):", recentEnrollments)
      
      // Get course completion stats
      const completionStats = await Promise.race([
        db.collection("enrollments").aggregate([
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
        ]).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Completion stats timeout')), 5000)
        )
      ])
      
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
      const weeklyEnrollments = await Promise.race([
        db.collection("enrollments").aggregate([
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
        ]).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Weekly enrollments timeout')), 5000)
        )
      ])
      
      console.log("📅 Weekly enrollments:", weeklyEnrollments.length)
      
      // Get course performance data
      const coursePerformance = await Promise.race([
        db.collection("enrollments").aggregate([
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
        ]).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Course performance timeout')), 5000)
        )
      ])
      
      console.log("🎯 Course performance data:", coursePerformance.length)
      
      // Get active learners (learners who accessed courses in last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const activeLearners = await Promise.race([
        db.collection("enrollments").countDocuments({
          courseId: { $in: courses.map(c => c._id) },
          lastAccessedAt: { $gte: sevenDaysAgo }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Active learners timeout')), 5000)
        )
      ])
      
      console.log("🚀 Active learners:", activeLearners)
      
      // Calculate additional metrics
      const retentionRate = totalEnrollments > 0 ? Math.round((activeLearners / totalEnrollments) * 100) : 0
      const monthlyGrowth = recentEnrollments // Simplified calculation
      
      // Get top performing courses
      const topCourses = coursePerformance
        .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
        .slice(0, 5)
        .map(perf => {
          const course = courses.find(c => c._id.toString() === perf._id.toString())
          return {
            _id: perf._id,
            title: course?.title || "Unknown Course",
            enrollments: perf.totalEnrollments,
            completionRate: perf.totalEnrollments > 0 
              ? Math.round((perf.completedCount / perf.totalEnrollments) * 100)
              : 0,
            averageProgress: Math.round(perf.averageProgress || 0)
          }
        })
      
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
      const enrollments = await Promise.race([
        db.collection("enrollments").find({ learnerId: new ObjectId(user.userId) }).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Learner enrollments timeout')), 5000)
        )
      ])
      
      const enrolledCourseIds = enrollments.map(e => e.courseId)
      const enrolledCourses = await Promise.race([
        db.collection("courses").find({ 
          _id: { $in: enrolledCourseIds },
          status: "published" 
        }).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Enrolled courses timeout')), 5000)
        )
      ])
      
      // Calculate completion statistics
      const completedCourses = enrollments.filter(e => e.progress >= 100).length
      const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length
      const notStartedCourses = enrollments.filter(e => e.progress === 0).length
      
      // Calculate average progress
      const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0)
      const averageProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0
      
      // Calculate learning streak (placeholder - could be enhanced with actual activity tracking)
      const recentActivity = await Promise.race([
        db.collection("enrollments").find({ 
          learnerId: new ObjectId(user.userId),
          lastAccessedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Recent activity timeout')), 5000)
        )
      ])
      
      // Calculate total time spent (placeholder - would need activity tracking)
      const totalTimeSpent = enrollments.length * 45 // Placeholder: 45 minutes per course average
      
      // Get learning streak (consecutive days of activity)
      const learningStreak = recentActivity.length > 0 ? Math.min(recentActivity.length, 7) : 0
      
      // Get achievements (placeholder - could be enhanced with actual achievement system)
      const achievements = [
        ...(completedCourses >= 1 ? ["First Course Completed"] : []),
        ...(completedCourses >= 5 ? ["5 Courses Mastered"] : []),
        ...(learningStreak >= 3 ? ["3-Day Learning Streak"] : []),
        ...(averageProgress >= 80 ? ["High Achiever"] : [])
      ]
      
      const learnerStats = {
        // Enrollment stats
        totalEnrollments: enrollments.length,
        completedCourses,
        inProgressCourses,
        notStartedCourses,
        
        // Progress stats
        averageProgress: Math.round(averageProgress),
        totalTimeSpent: Math.round(totalTimeSpent),
        learningStreak,
        
        // Achievement stats
        achievements,
        certificatesEarned: completedCourses,
        
        // Course details
        enrolledCourses: enrolledCourses.map(course => {
          const enrollment = enrollments.find(e => e.courseId.toString() === course._id.toString())
          return {
            _id: course._id,
            title: course.title,
            progress: enrollment?.progress || 0,
            enrolledAt: enrollment?.enrolledAt,
            lastAccessedAt: enrollment?.lastAccessedAt,
            status: enrollment?.status || "active"
          }
        }),
        
        // Recent activity
        recentActivity: recentActivity.length,
        lastActiveDate: recentActivity.length > 0 
          ? Math.max(...recentActivity.map(a => new Date(a.lastAccessedAt)))
          : null
      }
      
      console.log("✅ Learner stats prepared successfully")
      return NextResponse.json(learnerStats)
    }
    
    return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
    
  } catch (error) {
    console.error("💥 Error in GET /api/stats:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    
    let errorMessage = "Failed to fetch statistics"
    let statusCode = 500
    
    if (error.message.includes('timeout')) {
      errorMessage = "Database connection timeout. Please try again."
      statusCode = 503
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ETIMEOUT')) {
      errorMessage = "Network connection timeout. Please check your connection and try again."
      statusCode = 503
    } else if (error.message.includes('No token provided')) {
      errorMessage = "Authentication required"
      statusCode = 401
    } else if (error.message.includes('authentication')) {
      errorMessage = "Database authentication failed"
      statusCode = 500
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}
