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

    const course = await db.collection("courses").findOne({
      _id: new ObjectId(courseId),
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const module = course.modules.find((m) => m.id === moduleId)
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const quiz = await generateQuiz(module.content, difficulty)

    return NextResponse.json(quiz)
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
