import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { generateQuiz } from "@/lib/gemini"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function POST(request) {
  try {
    const user = await verifyToken(request)
    const { courseId, moduleId, difficulty = "medium" } = await request.json()

    const client = await clientPromise
    const db = client.db("llmfied")

    // Check if course exists
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(courseId),
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check enrollment status for learners
    if (user.role === "learner") {
      const enrollment = await db.collection("enrollments").findOne({
        learnerId: new ObjectId(user.userId),
        courseId: new ObjectId(courseId)
      })
      
      if (!enrollment) {
        return NextResponse.json({ 
          error: "Access denied: You must be enrolled in this course to access quizzes" 
        }, { status: 403 })
      }
    } else if (user.role === "educator") {
      // Educators can only access quizzes for their own courses
      if (course.educatorId.toString() !== user.userId.toString()) {
        return NextResponse.json({ 
          error: "Access denied: You can only access quizzes for your own courses" 
        }, { status: 403 })
      }
    } else {
      return NextResponse.json({ 
        error: "Access denied: Invalid user role" 
      }, { status: 403 })
    }

    const module = course.modules.find((m) => m.id === moduleId)
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const quiz = await generateQuiz(module.content, difficulty)

    return NextResponse.json(quiz)
  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
