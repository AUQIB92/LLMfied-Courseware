import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request) {
  try {
    const data = await request.formData()
    const file = data.get("avatar") || data.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // 🔐 Get token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

      // ✅ Validate file
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
      }

      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
      }

      // ✅ Read and upload to Cloudinary
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

      const uploadResult = await cloudinary.uploader.upload(base64, {
        folder: "avatars",
        public_id: `${decoded.userId}_${Date.now()}`,
        overwrite: true,
      })

      // ✅ Save URL to MongoDB
      const { db } = await connectToDatabase()
      const avatarUrl = uploadResult.secure_url

      await db.collection("users").updateOne(
        { _id: new ObjectId(decoded.userId) },
        {
          $set: {
            avatar: avatarUrl,
            updatedAt: new Date(),
          },
        }
      )

      return NextResponse.json({
        message: "Avatar uploaded successfully",
        avatarUrl,
      })
    } catch (jwtError) {
      console.error("Invalid token:", jwtError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
