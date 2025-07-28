import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { processMarkdown, processPDF } from "@/lib/fileProcessor";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

// EXAMGENIUS PATTERN: Process files without AI calls - just extract structure
export async function POST(request) {
  let filepath = null;

  try {
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const learnerLevel = formData.get("learnerLevel") || "undergraduate";
    const subject = formData.get("subject") || "general";
    const title = formData.get("title") || "";
    const description = formData.get("description") || "";
    const duration = formData.get("duration") || "";
    const examType = formData.get("examType") || "academic";
    const isAcademicCourse = formData.get("isAcademicCourse") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title.trim()) {
      return NextResponse.json(
        { error: "Course title is required" },
        { status: 400 }
      );
    }

    console.log(
      "Processing file:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size
    );
    console.log("Course data:", { title, learnerLevel, subject, duration });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure tmp directory exists
    const tmpDir = join(process.cwd(), "tmp");
    await mkdir(tmpDir, { recursive: true });

    // Save file temporarily
    const filename = `${Date.now()}-${file.name}`;
    filepath = join(tmpDir, filename);
    await writeFile(filepath, buffer);

    console.log("File saved temporarily at:", filepath);

    let content = "";
    let rawModules = [];

    // EXAMGENIUS PATTERN: Context for processing without AI
    const context = {
      learnerLevel: learnerLevel,
      subject: subject,
      title: title,
      description: description,
      duration: duration,
      fileName: file.name,
      examType: examType,
      isAcademicCourse: isAcademicCourse,
    };

    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      console.log("Processing PDF file...");
      content = await processPDF(filepath);
      // Convert content to markdown-like format for consistent processing
      const markdownContent = `# ${title}\n\n${content}`;
      rawModules = await processMarkdown(markdownContent, context);
    } else if (
      file.type === "text/markdown" ||
      file.name.toLowerCase().endsWith(".md")
    ) {
      console.log("Processing Markdown file...");
      content = buffer.toString();
      rawModules = await processMarkdown(content, context);
    } else if (
      file.type === "text/plain" ||
      file.name.toLowerCase().endsWith(".txt")
    ) {
      console.log("Processing Text file...");
      content = buffer.toString();
      // Convert content to markdown-like format for consistent processing
      const markdownContent = `# ${title}\n\n${content}`;
      rawModules = await processMarkdown(markdownContent, context);
    } else {
      console.log("Unsupported file type:", file.type);
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Please upload a PDF, Markdown (.md), or Text (.txt) file.`,
        },
        { status: 400 }
      );
    }

    if (!rawModules || rawModules.length === 0) {
      return NextResponse.json(
        { error: "Failed to extract modules from file content" },
        { status: 400 }
      );
    }

    console.log(
      `✅ Extracted ${rawModules.length} modules from file WITHOUT AI calls`
    );

    // EXAMGENIUS PATTERN: Create module structure WITHOUT AI enhancement
    const processedModules = rawModules.map((module, index) => ({
      id: module.id || `module-${Date.now()}-${index}`,
      title: module.title || `Module ${index + 1}`,
      content: module.content || "",
      order: module.order || index + 1,

      // EXAMGENIUS STRUCTURE: Basic structure without AI-generated content
      summary: `Academic module covering ${module.title || "key concepts"}`,
      objectives: [
        `Understand the fundamentals of ${module.title || "this topic"}`,
        "Apply concepts in academic contexts",
        "Demonstrate mastery through assessments",
      ],
      examples: [],
      resources: {
        books: [],
        courses: [],
        articles: [],
        videos: [],
        tools: [],
        websites: [],
        exercises: [],
      },

      // EXAMGENIUS PATTERN: No enhancedMarkdown yet - will be generated later in curriculum processing
      detailedSubsections: [], // Will be populated from content structure

      // Academic course properties
      isAcademicCourse: true,
      courseType: "academic",
      examType: "academic",
      academicLevel: learnerLevel,
      estimatedTime: "3-4 hours",
      difficulty: learnerLevel,
      learnerLevel: learnerLevel,
      subject: subject,
    }));

    console.log(
      `✅ Successfully processed ${processedModules.length} modules WITHOUT AI calls - structure only`
    );

    // EXAMGENIUS RESPONSE: Same structure as courses/process but without AI content
    return NextResponse.json({
      success: true,
      modules: processedModules,
      subject: subject,
      title: title,
      description: description,
      metadata: {
        originalFileName: file.name,
        title: title,
        description: description,
        learnerLevel: learnerLevel,
        subject: subject,
        duration: duration,
        processingDate: new Date().toISOString(),
        totalModules: processedModules.length,
        processingMethod: "structure_only", // No AI calls
        enhancementsApplied: false, // Will be applied later in curriculum processing
        isAcademicCourse: true,
        examType: "academic",
      },
    });
  } catch (error) {
    console.error("File processing error:", error);

    return NextResponse.json(
      {
        error: "Failed to process file into modules. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    // Clean up temporary file
    if (filepath) {
      try {
        await unlink(filepath);
        console.log("Temporary file cleaned up");
      } catch (cleanupError) {
        console.warn(
          "Warning: Could not clean up temporary file:",
          cleanupError
        );
      }
    }
  }
}
