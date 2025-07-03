import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import crypto from "crypto"

export async function POST(request) {
  try {
    const data = await request.formData()
    const file = data.get("avatar") || data.get("file")

    if (!file) {
      console.log("❌ No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // ✅ Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    console.log("🔐 Received Authorization header:", authHeader)

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid Authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log("🔑 Token extracted:", token)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      console.log("✅ Token decoded:", decoded)

      // ✅ Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        console.log("❌ Invalid file type:", file.type)
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
          { status: 400 }
        )
      }

      // ✅ Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        console.log("❌ File too large:", file.size)
        return NextResponse.json(
          { error: "File too large. Maximum size is 5MB." },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // ✅ Ensure uploads directory
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars")
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (mkdirErr) {
        console.warn("⚠️ mkdir error (ignored):", mkdirErr)
      }

      // ✅ Safe unique filename
      const timestamp = Date.now()
      const ext = file.type.split("/")[1] || "png"
      const fileName = `${decoded.userId}_${timestamp}_${crypto.randomUUID()}.${ext}`
      const filePath = path.join(uploadsDir, fileName)

      // ✅ Write file to disk
      await writeFile(filePath, buffer)

      // ✅ Update avatar URL in DB
      const { db } = await connectToDatabase()
      const avatarUrl = `/uploads/avatars/${fileName}`

      const updateResult = await db.collection("users").updateOne(
        { _id: new ObjectId(decoded.userId) },
        {
          $set: {
            avatar: avatarUrl,
            updatedAt: new Date(),
          },
        }
      )
      console.log("✅ DB update result:", updateResult)

      return NextResponse.json({
        message: "Avatar uploaded successfully",
        avatarUrl,
      })

    } catch (jwtError) {
      console.error("❌ Invalid token:", jwtError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

  } catch (error) {
    console.error("❌ Avatar upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
