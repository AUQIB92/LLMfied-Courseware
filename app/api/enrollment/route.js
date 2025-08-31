import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

// GET - Check enrollment status or get enrolled courses/test series
export async function GET(request) {
  let client = null;
  try {
    console.log("📋 Enrollment GET request received")
    console.log("📅 Timestamp:", new Date().toISOString())
    
    // Verify user authentication
    console.log("🔐 Verifying user token...")
    const user = await verifyToken(request)
    console.log("✅ User verified:", { userId: user.userId, role: user.role })
    
    // Connect to database
    console.log("🔗 Connecting to database...")
    const connection = await connectToDatabase()
    client = connection.client
    const db = connection.db
    console.log("✅ Database connected")
    
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const testSeriesId = searchParams.get("testSeriesId")
    const learnerId = searchParams.get("learnerId") || user.userId

    console.log("🔍 Query params:", { courseId, testSeriesId, learnerId })

    if (courseId) {
      console.log("📚 Checking specific course enrollment...")
      // Check specific course enrollment
      const enrollment = await Promise.race([
        db.collection("enrollments").findOne({
          learnerId: new ObjectId(learnerId),
          courseId: new ObjectId(courseId)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Course enrollment query timeout')), 5000)
        )
      ])
      
      console.log("📊 Course enrollment result:", !!enrollment)
      return NextResponse.json({ 
        isEnrolled: !!enrollment,
        enrollment: enrollment 
      })
    } else if (testSeriesId) {
      console.log("📝 Checking specific test series enrollment...")
      // Check specific test series enrollment
      const enrollment = await Promise.race([
        db.collection("enrollments").findOne({
          learnerId: new ObjectId(learnerId),
          testSeriesId: new ObjectId(testSeriesId)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test series enrollment query timeout')), 5000)
        )
      ])
      
      console.log("📊 Test series enrollment result:", !!enrollment)
      return NextResponse.json({ 
        isEnrolled: !!enrollment,
        enrollment: enrollment 
      })
    } else {
      console.log("📚 Fetching all enrollments for learner...")
      // Get all enrollments for learner
      const enrollments = await Promise.race([
        db.collection("enrollments").find({ learnerId: new ObjectId(learnerId) }).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('All enrollments query timeout')), 8000)
        )
      ])
      
      console.log("📊 Found enrollments:", enrollments.length)
      
      // Separate course and test series enrollments
      const courseEnrollments = enrollments.filter(e => e.courseId)
      const testSeriesEnrollments = enrollments.filter(e => e.testSeriesId)
      
      console.log("📊 Enrollment breakdown:", {
        total: enrollments.length,
        courses: courseEnrollments.length,
        testSeries: testSeriesEnrollments.length
      })
      
      // Get course details for enrolled courses
      const courseIds = courseEnrollments.map(e => e.courseId).filter(Boolean)
      const courses = courseIds.length > 0 ? await Promise.race([
        db.collection("courses").find({ 
          _id: { $in: courseIds },
          $or: [
            { status: "published" },
            { isPublished: true }
          ]
        }).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Course details query timeout')), 5000)
        )
      ]) : []
      
      console.log("📚 Found course details:", courses.length)
      
      // Get test series details for enrolled test series
      const testSeriesIds = testSeriesEnrollments.map(e => e.testSeriesId).filter(Boolean)
      const testSeries = testSeriesIds.length > 0 ? await Promise.race([
        db.collection("testSeries").find({ 
          _id: { $in: testSeriesIds },
          status: "published"
        }).toArray(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test series details query timeout')), 5000)
        )
      ]) : []
      
      console.log("📝 Found test series details:", testSeries.length)
      
      const responseData = {
        enrollments,
        courses,
        testSeries
      }
      
      console.log("✅ Enrollment data prepared successfully")
      return NextResponse.json(responseData)
    }
  } catch (error) {
    console.error("💥 Error in GET /api/enrollment:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    
    let errorMessage = "Failed to fetch enrollment data"
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
    } else if (error.message.includes('JsonWebTokenError') || error.message.includes('invalid')) {
      errorMessage = "Invalid authentication token"
      statusCode = 401
    } else if (error.message.includes('TokenExpiredError') || error.message.includes('expired')) {
      errorMessage = "Authentication token expired"
      statusCode = 401
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// POST - Enroll in a course or test series
export async function POST(request) {
  let client = null;
  try {
    const user = await verifyToken(request)
    
    if (user.role !== "learner") {
      return NextResponse.json(
        { error: "Only learners can enroll in courses and test series" },
        { status: 403 }
      )
    }

    const { courseId, testSeriesId, type } = await request.json()
    
    if (!courseId && !testSeriesId) {
      return NextResponse.json(
        { error: "Course ID or Test Series ID is required" },
        { status: 400 }
      )
    }

    const connection = await connectToDatabase()
    client = connection.client
    const db = connection.db
    
    let item, itemType, itemId, collectionName, updateCollection
    
    if (courseId) {
      // Handle course enrollment
      itemId = courseId
      itemType = "course"
      collectionName = "courses"
      updateCollection = "courses"
      
      // Check if course exists and is published
      item = await Promise.race([
        db.collection("courses").findOne({
          _id: new ObjectId(courseId),
          $or: [
            { status: "published" },
            { isPublished: true }
          ]
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Course lookup timeout')), 5000)
        )
      ])
      
      if (!item) {
        return NextResponse.json(
          { error: "Course not found or not published" },
          { status: 404 }
        )
      }
      
      // Check if already enrolled
      const existingEnrollment = await Promise.race([
        db.collection("enrollments").findOne({
          learnerId: new ObjectId(user.userId),
          courseId: new ObjectId(courseId)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Enrollment check timeout')), 5000)
        )
      ])
      
      if (existingEnrollment) {
        return NextResponse.json(
          { error: "Already enrolled in this course" },
          { status: 409 }
        )
      }
    } else if (testSeriesId) {
      // Handle test series enrollment
      itemId = testSeriesId
      itemType = "test-series"
      collectionName = "testSeries"
      updateCollection = "testSeries"
      
      // Check if test series exists and is published
      item = await Promise.race([
        db.collection("testSeries").findOne({
          _id: new ObjectId(testSeriesId),
          status: "published"
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test series lookup timeout')), 5000)
        )
      ])
      
      if (!item) {
        return NextResponse.json(
          { error: "Test series not found or not published" },
          { status: 404 }
        )
      }
      
      // Check if already enrolled
      const existingEnrollment = await Promise.race([
        db.collection("enrollments").findOne({
          learnerId: new ObjectId(user.userId),
          testSeriesId: new ObjectId(testSeriesId)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test series enrollment check timeout')), 5000)
        )
      ])
      
      if (existingEnrollment) {
        return NextResponse.json(
          { error: "Already enrolled in this test series" },
          { status: 409 }
        )
      }
    }
    
    // Create enrollment
    const enrollment = {
      learnerId: new ObjectId(user.userId),
      ...(courseId ? { courseId: new ObjectId(courseId) } : { testSeriesId: new ObjectId(testSeriesId) }),
      type: itemType,
      enrolledAt: new Date(),
      progress: 0,
      status: "active"
    }
    
    const result = await Promise.race([
      db.collection("enrollments").insertOne(enrollment),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Enrollment creation timeout')), 5000)
      )
    ])
    
    // Update enrollment count
    await Promise.race([
      db.collection(updateCollection).updateOne(
        { _id: new ObjectId(itemId) },
        { $inc: { enrollments: 1 } }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Enrollment count update timeout')), 5000)
      )
    ])
    
    return NextResponse.json({
      message: `Successfully enrolled in ${itemType}`,
      enrollmentId: result.insertedId,
      enrollment: enrollment
    }, { status: 201 })
    
  } catch (error) {
    console.error("💥 Error in POST /api/enrollment:", error)
    
    let errorMessage = "Failed to create enrollment"
    let statusCode = 500
    
    if (error.message.includes('timeout')) {
      errorMessage = "Database operation timeout. Please try again."
      statusCode = 503
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ETIMEOUT')) {
      errorMessage = "Network connection timeout. Please check your connection and try again."
      statusCode = 503
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// DELETE - Unenroll from a course or test series
export async function DELETE(request) {
  let client = null;
  try {
    const user = await verifyToken(request)
    
    if (user.role !== "learner") {
      return NextResponse.json(
        { error: "Only learners can unenroll from courses and test series" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const testSeriesId = searchParams.get("testSeriesId")
    
    if (!courseId && !testSeriesId) {
      return NextResponse.json(
        { error: "Course ID or Test Series ID is required" },
        { status: 400 }
      )
    }

    const connection = await connectToDatabase()
    client = connection.client
    const db = connection.db
    
    let filter, updateFilter, itemType
    
    if (courseId) {
      filter = {
        learnerId: new ObjectId(user.userId),
        courseId: new ObjectId(courseId)
      }
      updateFilter = { _id: new ObjectId(courseId) }
      itemType = "course"
    } else {
      filter = {
        learnerId: new ObjectId(user.userId),
        testSeriesId: new ObjectId(testSeriesId)
      }
      updateFilter = { _id: new ObjectId(testSeriesId) }
      itemType = "test-series"
    }
    
    // Check if enrollment exists
    const enrollment = await Promise.race([
      db.collection("enrollments").findOne(filter),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Enrollment lookup timeout')), 5000)
      )
    ])
    
    if (!enrollment) {
      return NextResponse.json(
        { error: `Not enrolled in this ${itemType}` },
        { status: 404 }
      )
    }
    
    // Delete enrollment
    await Promise.race([
      db.collection("enrollments").deleteOne(filter),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Enrollment deletion timeout')), 5000)
      )
    ])
    
    // Update enrollment count
    const updateCollection = courseId ? "courses" : "testSeries"
    await Promise.race([
      db.collection(updateCollection).updateOne(
        updateFilter,
        { $inc: { enrollments: -1 } }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Enrollment count update timeout')), 5000)
      )
    ])
    
    return NextResponse.json({
      message: `Successfully unenrolled from ${itemType}`
    })
    
  } catch (error) {
    console.error("💥 Error in DELETE /api/enrollment:", error)
    
    let errorMessage = "Failed to delete enrollment"
    let statusCode = 500
    
    if (error.message.includes('timeout')) {
      errorMessage = "Database operation timeout. Please try again."
      statusCode = 503
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ETIMEOUT')) {
      errorMessage = "Network connection timeout. Please check your connection and try again."
      statusCode = 503
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
