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

    const client = await clientPromise
    const db = client.db("llmfied")

    const progress = await db.collection("progress").findOne({
      learnerId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId),
    })

    return NextResponse.json(progress || { moduleProgress: [], overallProgress: 0 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await verifyToken(request)
    const { courseId, moduleId, completed, timeSpent, quizScore } = await request.json()

    const client = await clientPromise
    const db = client.db("llmfied")

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
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
  }
}
