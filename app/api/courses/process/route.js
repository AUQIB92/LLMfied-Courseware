import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { processPDF, processMarkdown, chunkContent } from "@/lib/fileProcessor";
import { generateModuleSummary } from "@/lib/gemini";
import jwt from "jsonwebtoken";

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

// Parse Markdown content into structured data for UI components
function parseMarkdownContent(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return {
      summary: null,
      objectives: [],
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
      detailedSubsections: [],
      estimatedStudyTime: "2-3 hours",
      difficultyLevel: "intermediate",
    };
  }

  const result = {
    summary: null,
    objectives: [],
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
    detailedSubsections: [],
    estimatedStudyTime: "2-3 hours",
    difficultyLevel: "intermediate",
  };

  // Extract summary
  const summaryMatch = markdown.match(
    /\*\*Summary:\*\*\s*\n([^\n]+(?:\n[^\n#*-]+)*)/i
  );
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  // Extract learning objectives
  const objectivesMatch = markdown.match(
    /\*\*Learning Objectives:\*\*\s*\n((?:- [^\n]+\n?)+)/i
  );
  if (objectivesMatch) {
    result.objectives = objectivesMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.trim().substring(1).trim())
      .filter((obj) => obj.length > 0);
  }

  // Extract examples
  const examplesMatch = markdown.match(
    /\*\*Real-World Examples:\*\*\s*\n((?:- [^\n]+\n?)+)/i
  );
  if (examplesMatch) {
    result.examples = examplesMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.trim().substring(1).trim())
      .filter((ex) => ex.length > 0);
  }

  // Extract estimated study time
  const timeMatch = markdown.match(/\*\*Estimated Study Time:\*\*\s*([^\n]+)/i);
  if (timeMatch) {
    result.estimatedStudyTime = timeMatch[1].trim();
  }

  // Extract difficulty level
  const difficultyMatch = markdown.match(
    /\*\*Difficulty Level:\*\*\s*([^\n]+)/i
  );
  if (difficultyMatch) {
    result.difficultyLevel = difficultyMatch[1].trim().toLowerCase();
  }

  // Parse detailed subsections from the markdown
  const sections = markdown.split(/(?=###\s+Section\s+\d+:)/i);

  sections.forEach((section, index) => {
    if (index === 0) return; // Skip the header part

    const sectionTitleMatch = section.match(/###\s+Section\s+\d+:\s*([^\n]+)/i);
    const sectionTitle = sectionTitleMatch
      ? sectionTitleMatch[1].trim()
      : `Section ${index}`;

    // Extract pages within this section
    const pages = [];
    const pageMatches = section.match(
      /####\s+Page\s+\d+:\s*([^\n]+)\n((?:(?!####)[^\n]+\n?)*)/gi
    );

    if (pageMatches) {
      pageMatches.forEach((pageContent, pageIndex) => {
        const pageTitleMatch = pageContent.match(
          /####\s+Page\s+\d+:\s*([^\n]+)/i
        );
        const pageTitle = pageTitleMatch
          ? pageTitleMatch[1].trim()
          : `Page ${pageIndex + 1}`;

        // Extract the content between the title and key takeaway
        const contentMatch = pageContent.match(
          /####\s+Page\s+\d+:\s*[^\n]+\n((?:(?!\*\*Key Takeaway:\*\*)[^\n]+\n?)*)/i
        );
        const content = contentMatch ? contentMatch[1].trim() : "";

        // Extract key takeaway
        const takeawayMatch = pageContent.match(
          /\*\*Key Takeaway:\*\*\s*([^\n]+)/i
        );
        const keyTakeaway = takeawayMatch ? takeawayMatch[1].trim() : "";

        if (content || keyTakeaway) {
          pages.push({
            pageNumber: pageIndex + 1,
            pageTitle: pageTitle,
            content: content,
            keyTakeaway: keyTakeaway,
          });
        }
      });
    }

    if (pages.length > 0) {
      result.detailedSubsections.push({
        id: `section-${index}`,
        title: sectionTitle,
        summary: `Learn about ${sectionTitle}`,
        pages: pages,
        estimatedTime: "15-20 minutes",
      });
    }
  });

  return result;
}

export async function POST(request) {
  let filepath = null;

  try {
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const learnerLevel = formData.get("learnerLevel") || "intermediate";
    const subject = formData.get("subject") || "general";
    const title = formData.get("title") || "";
    const description = formData.get("description") || "";
    const duration = formData.get("duration") || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title.trim()) {
      return NextResponse.json(
        { error: "Course title is required" },
        { status: 400 }
      );
    }

    if (!learnerLevel) {
      return NextResponse.json(
        { error: "Learner level is required" },
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

    // CONSISTENT PROCESSING: Use same approach as curriculum processing
    const context = {
      learnerLevel: learnerLevel,
      subject: subject,
      title: title,
      description: description,
      duration: duration,
      fileName: file.name,
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

    console.log(`✅ Extracted ${rawModules.length} modules from file`);

    // CONSISTENT ENHANCEMENT: Use same approach as curriculum processing
    const processedModules = [];
    let processed = 0;

    for (const module of rawModules) {
      try {
        console.log(
          `🔄 Processing module ${processed + 1}/${rawModules.length}: ${
            module.title
          }`
        );

        // Use IDENTICAL approach to curriculum processing
        const enhancedModule = await generateModuleSummary(module.content, {
          learnerLevel: context.learnerLevel,
          subject: context.subject,
          moduleIndex: processed + 1,
          totalModules: rawModules.length,
          courseTitle: title,
          moduleTitle: module.title,
        });

        // Create IDENTICAL structure to curriculum processing
        const finalModule = {
          id: module.id,
          title: module.title,
          content: module.content,
          order: module.order,

          // Enhanced content using SAME method as curriculum
          summary: enhancedModule.summary,
          objectives: enhancedModule.objectives,
          examples: enhancedModule.examples,
          resources: enhancedModule.resources,
          visualizationSuggestions: enhancedModule.visualizationSuggestions,
          beautifulSummaryElements: enhancedModule.beautifulSummaryElements,
          detailedSubsections: enhancedModule.detailedSubsections,

          // Metadata - SAME as curriculum processing
          estimatedTime:
            enhancedModule.beautifulSummaryElements?.estimatedStudyTime ||
            "2-3 hours",
          difficulty:
            enhancedModule.beautifulSummaryElements?.difficultyLevel ||
            context.learnerLevel,
          learnerLevel: context.learnerLevel,
          subject: context.subject,
        };

        processedModules.push(finalModule);
        processed++;

        console.log(
          `✅ Module ${processed}/${rawModules.length} processed successfully`
        );
      } catch (moduleError) {
        console.error(
          `❌ Error processing module ${module.title}:`,
          moduleError
        );

        // IDENTICAL fallback structure to curriculum processing
        const fallbackModule = {
          id: module.id,
          title: module.title,
          content: module.content,
          order: module.order,
          summary: `Learn about ${module.title}`,
          objectives: [`Understand the key concepts of ${module.title}`],
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
          visualizationSuggestions: {
            hasFlowcharts: false,
            hasComparisons: false,
            hasTimelines: false,
            hasFormulas: false,
            hasProcessSteps: false,
            hasCyclicalProcesses: false,
            hasHierarchies: false,
            hasRelationships: false,
            codeSimulationTopics: [],
            interactiveElements: [],
          },
          beautifulSummaryElements: {
            keyInsights: [],
            practicalApplications: [],
            whyItMatters:
              "This topic is important for understanding the subject area.",
            careerRelevance:
              "Understanding this topic can enhance your professional skills.",
            difficultyLevel: context.learnerLevel,
            prerequisites: [],
            estimatedStudyTime: "2-3 hours",
          },
          detailedSubsections: [],
          estimatedTime: "2-3 hours",
          difficulty: context.learnerLevel,
          learnerLevel: context.learnerLevel,
          subject: context.subject,
        };

        processedModules.push(fallbackModule);
        processed++;
      }
    }

    console.log(
      `✅ Successfully processed ${processedModules.length} modules with enhanced content using CONSISTENT processing engine`
    );

    // IDENTICAL response structure to curriculum processing
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
        processingMethod: "consistent_enhanced", // Updated to match curriculum processing
        enhancementsApplied: true,
      },
    });
  } catch (error) {
    console.error("File processing error:", error);

    // More specific error messages like curriculum processing
    if (error.message?.includes("extract modules")) {
      return NextResponse.json(
        {
          error:
            "Could not extract modules from file. Please ensure the file has clear structure.",
        },
        { status: 400 }
      );
    }

    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "AI service configuration error. Please contact support." },
        { status: 500 }
      );
    }

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
        console.log("Cleaned up temporary file:", filepath);
      } catch (cleanupError) {
        console.error("Failed to cleanup temporary file:", cleanupError);
      }
    }
  }
}
