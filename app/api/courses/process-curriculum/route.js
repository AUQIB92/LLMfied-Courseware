import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { processMarkdown } from "@/lib/fileProcessor";
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
  try {
    // Get user session
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("llmfied");

    const { curriculum, courseData } = await request.json();

    if (!curriculum) {
      return NextResponse.json(
        { error: "Curriculum content is required" },
        { status: 400 }
      );
    }

    console.log(`📚 Processing curriculum for course: ${courseData.title}`);

    // Use original file processing method to convert curriculum to modules
    const context = {
      learnerLevel: courseData.learnerLevel || "intermediate",
      subject: courseData.subject || "general",
    };

    // Process the curriculum markdown using the original method
    const rawModules = await processMarkdown(curriculum, context);

    if (!rawModules || rawModules.length === 0) {
      return NextResponse.json(
        { error: "Failed to extract modules from curriculum" },
        { status: 400 }
      );
    }

    console.log(`✅ Extracted ${rawModules.length} modules from curriculum`);

    // Use original approach: enhance each module with detailed content, resources, visualizers
    const processedModules = [];
    let processed = 0;

    for (const module of rawModules) {
      try {
        console.log(
          `🔄 Processing module ${processed + 1}/${rawModules.length}: ${
            module.title
          }`
        );

        // Use the original generateModuleSummary function for rich content (JSON format)
        const enhancedModule = await generateModuleSummary(module.content, {
          learnerLevel: context.learnerLevel,
          subject: context.subject,
          moduleIndex: processed + 1,
          totalModules: rawModules.length,
        });

        // Combine original module structure with enhanced content
        const finalModule = {
          id: module.id,
          title: module.title,
          content: module.content,
          order: module.order,

          // Enhanced content from original method
          summary: enhancedModule.summary,
          objectives: enhancedModule.objectives,
          examples: enhancedModule.examples,
          resources: enhancedModule.resources,
          visualizationSuggestions: enhancedModule.visualizationSuggestions,
          beautifulSummaryElements: enhancedModule.beautifulSummaryElements,
          detailedSubsections: enhancedModule.detailedSubsections,

          // Metadata
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

        // Create a fallback module structure
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
          },
          beautifulSummaryElements: {
            keyInsights: [],
            difficultyLevel: context.learnerLevel,
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
      `✅ Successfully processed ${processedModules.length} modules with enhanced content`
    );

    return NextResponse.json({
      success: true,
      modules: processedModules,
      metadata: {
        totalModules: processedModules.length,
        processedAt: new Date().toISOString(),
        processingMethod: "original_enhanced",
        learnerLevel: context.learnerLevel,
        subject: context.subject,
      },
    });
  } catch (error) {
    console.error("Curriculum processing error:", error);

    // Provide more specific error messages
    if (error.message?.includes("extract modules")) {
      return NextResponse.json(
        {
          error:
            "Could not extract modules from curriculum. Please ensure the curriculum has clear module structure.",
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
        error: "Failed to process curriculum into modules. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
