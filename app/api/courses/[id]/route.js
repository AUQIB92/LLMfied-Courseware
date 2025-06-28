import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db("llmfied")

    const course = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params
    const user = await verifyToken(request)
    const updates = await request.json()
    const client = await clientPromise
    const db = client.db("llmfied")

    const course = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (user.role === "educator" && course.educatorId.toString() !== user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db.collection("courses").updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const user = await verifyToken(request)
    const client = await clientPromise
    const db = client.db("llmfied")

    const course = await db.collection("courses").findOne({
      _id: new ObjectId(resolvedParams.id),
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (user.role === "educator" && course.educatorId.toString() !== user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db.collection("courses").deleteOne({
      _id: new ObjectId(resolvedParams.id),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}