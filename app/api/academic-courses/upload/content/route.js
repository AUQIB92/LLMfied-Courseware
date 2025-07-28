import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink, readFile } from "fs/promises";
import { join } from "path";
import { processPDF, processMarkdown } from "@/lib/fileProcessor";
import jwt from "jsonwebtoken";

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

export async function POST(request) {
  try {
    console.log("📚 Processing academic course syllabus upload...");

    // Verify authentication
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can upload academic course content" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title") || "Academic Course";
    const description = formData.get("description") || "";
    const subject = formData.get("subject") || "General";
    const academicLevel = formData.get("academicLevel") || "undergraduate";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log(`📄 Processing academic file: ${file.name} (${file.size} bytes)`);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.log("📁 Uploads directory already exists");
    }

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `academic_${Date.now()}_${file.name}`;
    const filePath = join(uploadsDir, fileName);

    await writeFile(filePath, buffer);
    console.log(`💾 File saved to: ${filePath}`);

    let content = "";

    try {
      // Process file based on type
      if (file.type === "application/pdf") {
        console.log("📄 Processing PDF file...");
        content = await processPDF(filePath);
      } else if (file.name.endsWith('.md') || file.type === "text/markdown" || file.type === "application/x-markdown") {
        console.log("📝 Processing Markdown file...");
        // Read the file content first, then process it
        const fileContent = await readFile(filePath, 'utf-8');
        const processedModules = await processMarkdown(fileContent, { title });
        content = processedModules.map(module => module.content).join('\n\n');
      } else {
        console.log("📝 Processing text file...");
        // Read the file content first, then process it
        const fileContent = await readFile(filePath, 'utf-8');
        const processedModules = await processMarkdown(fileContent, { title });
        content = processedModules.map(module => module.content).join('\n\n');
      }

      console.log(`📊 Extracted content length: ${content.length} characters`);

      if (!content || content.length < 100) {
        throw new Error("Insufficient content extracted from file");
      }

      // Clean up uploaded file
      try {
        await unlink(filePath);
        console.log("🗑️ Temporary file cleaned up");
      } catch (cleanupError) {
        console.warn("⚠️ Failed to clean up temporary file:", cleanupError);
      }

      console.log(`✅ Academic course content extraction complete!`);

      return NextResponse.json({
        success: true,
        content,
        extractedLength: content.length,
        fileName: file.name,
        courseInfo: {
          title,
          description,
          subject,
          academicLevel
        },
        message: `Successfully extracted ${content.length} characters from ${file.name}`
      });

    } catch (processingError) {
      console.error("❌ Content processing error:", processingError);
      
      // Clean up file on error
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.warn("⚠️ Failed to clean up file after error:", cleanupError);
      }

      return NextResponse.json(
        { 
          error: `Failed to process academic content: ${processingError.message}`,
          details: processingError.toString()
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Academic course upload error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process academic course upload",
        details: error.message
      },
      { status: 500 }
    );
  }
} 