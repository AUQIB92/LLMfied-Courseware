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
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")

    // Check enrollment status for learners
    if (user.role === "learner") {
      const enrollment = await db.collection("enrollments").findOne({
        learnerId: new ObjectId(user.userId),
        courseId: new ObjectId(courseId)
      })
      
      if (!enrollment) {
        return NextResponse.json({ 
          error: "Access denied: You must be enrolled in this course to view progress" 
        }, { status: 403 })
      }
    } else if (user.role === "educator") {
      // Educators can view progress for their own courses
      const course = await db.collection("courses").findOne({
        _id: new ObjectId(courseId),
        educatorId: new ObjectId(user.userId)
      })
      
      if (!course) {
        return NextResponse.json({ 
          error: "Access denied: You can only view progress for your own courses" 
        }, { status: 403 })
      }
    }

    const progress = await db.collection("progress").findOne({
      learnerId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId),
    })

    return NextResponse.json(progress || { moduleProgress: [], overallProgress: 0 })
  } catch (error) {
    console.error("Progress fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await verifyToken(request)
    const { courseId, moduleId, completed, timeSpent, quizScore } = await request.json()

    if (!courseId || !moduleId) {
      return NextResponse.json({ error: "Course ID and Module ID are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")

    // Check enrollment status for learners
    if (user.role === "learner") {
      const enrollment = await db.collection("enrollments").findOne({
        learnerId: new ObjectId(user.userId),
        courseId: new ObjectId(courseId)
      })
      
      if (!enrollment) {
        return NextResponse.json({ 
          error: "Access denied: You must be enrolled in this course to update progress" 
        }, { status: 403 })
      }
    } else {
      return NextResponse.json({ 
        error: "Access denied: Only learners can update progress" 
      }, { status: 403 })
    }

    const filter = {
      learnerId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId),
    }

    const update = {
      $set: {
        "moduleProgress.$.completed": completed,
        "moduleProgress.$.lastAccessed": new Date(),
        updatedAt: new Date(),
      },
      $inc: {
        "moduleProgress.$.timeSpent": timeSpent || 0,
      },
    }

    if (quizScore !== undefined) {
      update.$push = { "moduleProgress.$.quizScores": quizScore }
    }

    // Try to update existing progress
    const result = await db.collection("progress").updateOne({ ...filter, "moduleProgress.moduleId": moduleId }, update)

    if (result.matchedCount === 0) {
      // Create new progress entry or add new module progress
      await db.collection("progress").updateOne(
        filter,
        {
          $setOnInsert: {
            learnerId: new ObjectId(user.userId),
            courseId: new ObjectId(courseId),
            createdAt: new Date(),
          },
          $push: {
            moduleProgress: {
              moduleId,
              completed: completed || false,
              timeSpent: timeSpent || 0,
              quizScores: quizScore !== undefined ? [quizScore] : [],
              lastAccessed: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Progress update error:", error)
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
  }
}
