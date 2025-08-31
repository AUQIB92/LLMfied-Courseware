import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { generateTutorResponse } from "@/lib/gemini"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function POST(request) {
  let client = null;
  try {
    const user = await verifyToken(request)
    const { courseId, moduleId, message, action } = await request.json()

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Get course and module content
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

    // Get or create chat session
    let chatSession = await db.collection("chatSessions").findOne({
      learnerId: new ObjectId(user.userId),
      courseId: new ObjectId(courseId),
      moduleId,
    })

    if (!chatSession) {
      chatSession = await db.collection("chatSessions").insertOne({
        learnerId: new ObjectId(user.userId),
        courseId: new ObjectId(courseId),
        moduleId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      chatSession = { _id: chatSession.insertedId, messages: [] }
    }

    // Generate AI response based on action
    let prompt = message
    if (action === "simplify") {
      prompt = `Please explain this in simpler terms: ${message}`
    } else if (action === "example") {
      prompt = `Can you provide a real-world example of: ${message}`
    } else if (action === "quiz") {
      prompt = `Create a quick quiz question about: ${message}`
    }

    const aiResponse = await generateTutorResponse(
      prompt,
      module.content,
      chatSession.messages.slice(-10), // Last 10 messages for context
    )

    // Update chat session
    const newMessages = [
      { role: "user", content: message, timestamp: new Date() },
      { role: "assistant", content: aiResponse, timestamp: new Date() },
    ]

    await db.collection("chatSessions").updateOne(
      { _id: chatSession._id },
      {
        $push: { messages: { $each: newMessages } },
        $set: { updatedAt: new Date() },
      },
    )

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
