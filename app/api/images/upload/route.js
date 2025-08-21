import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getUserIdFromToken = (request) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error("Failed to verify token:", error);
    return null;
  }
};

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get("image") || data.get("file");
    const altText = data.get("altText") || "Course image";
    const caption = data.get("caption") || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: JPEG, PNG, WebP, GIF, SVG" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    console.log(`📸 Uploading image: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Convert to buffer and upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: "course-images",
      public_id: `uploaded_${userId}_${Date.now()}`,
      resource_type: "auto",
      transformation: [
        { width: 1200, height: 800, crop: "limit", quality: "auto", format: "auto" }
      ]
    });

    const imageData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      size: uploadResult.bytes,
      altText: altText,
      caption: caption,
      uploadedBy: userId,
      uploadedAt: new Date(),
      originalName: file.name,
    };

    console.log("✅ Image uploaded successfully:", uploadResult.secure_url);

    return NextResponse.json({
      success: true,
      image: imageData,
      message: "Image uploaded successfully",
    });

  } catch (error) {
    console.error("💥 Error uploading image:", error);
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error.message,
      },
      { status: 500 }
    );
  }
}