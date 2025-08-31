import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { generateCompetitiveExamModuleSummary } from "@/lib/gemini";

// Function to parse Markdown content and convert to expected structure
function parseMarkdownToDetailedSubsections(markdownContent) {
  console.log("Parsing Markdown content to detailed subsections...");

  if (!markdownContent || typeof markdownContent !== "string") {
    return [];
  }

  const subsections = [];

  // Split by ### headings (subsections)
  const sections = markdownContent.split(/(?=###\s+[^#])/);

  sections.forEach((section, index) => {
    if (!section.trim()) return;

    // Extract subsection title
    const titleMatch = section.match(/###\s+(.+)/);
    if (!titleMatch) return;

    const title = titleMatch[1].trim();

    // Extract summary
    const summaryMatch = section.match(/\*\*Summary:\*\*\s*\n(.+?)(?:\n|$)/);
    const summary = summaryMatch
      ? summaryMatch[1].trim()
      : `Learn about ${title}`;

    // Extract key points
    const keyPointsMatch = section.match(
      /\*\*Key Learning Points:\*\*\s*\n((?:\s*-\s*.+\n?)+)/
    );
    const keyPoints = keyPointsMatch
      ? keyPointsMatch[1]
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().substring(1).trim())
      : [
          `Key concepts in ${title}`,
          `Applications of ${title}`,
          `Understanding ${title} principles`,
        ];

    // Extract individual page content by #### headings
    const pageMatches = section.match(/####\s+(.+?)\n([\s\S]*?)(?=####|$)/g);
    const pages = [];

    if (pageMatches) {
      pageMatches.forEach((pageMatch, pageIndex) => {
        const pageTitleMatch = pageMatch.match(/####\s+(.+)/);
        const pageTitle = pageTitleMatch
          ? pageTitleMatch[1].trim()
          : `Page ${pageIndex + 1}`;

        // Extract content between title and key takeaway
        const contentMatch = pageMatch.match(
          /####\s+.+?\n([\s\S]*?)(?:\*\*Key Takeaway:\*\*|$)/
        );
        const content = contentMatch
          ? contentMatch[1].trim()
          : `Content for ${pageTitle}`;

        // Extract key takeaway
        const takeawayMatch = pageMatch.match(
          /\*\*Key Takeaway:\*\*\s*(.+?)(?:\n|$)/
        );
        const keyTakeaway = takeawayMatch
          ? takeawayMatch[1].trim()
          : `Understanding ${pageTitle}`;

        pages.push({
          pageNumber: pageIndex + 1,
          pageTitle: pageTitle,
          content: content,
          keyTakeaway: keyTakeaway,
          codeExamples: [],
          mathematicalContent: [],
        });
      });
    } else {
      // If no #### headings found, create default pages from content
      const contentWithoutTitle = section.replace(/###\s+.+?\n/, "").trim();
      const contentLength = contentWithoutTitle.length;
      const wordsPerPage = 300;
      const words = contentWithoutTitle.split(" ");

      if (words.length > wordsPerPage) {
        // Split into multiple pages
        for (let i = 0; i < words.length; i += wordsPerPage) {
          const pageWords = words.slice(i, i + wordsPerPage);
          const pageContent = pageWords.join(" ");

          pages.push({
            pageNumber: Math.floor(i / wordsPerPage) + 1,
            pageTitle: `${title} - Part ${Math.floor(i / wordsPerPage) + 1}`,
            content: pageContent,
            keyTakeaway: `Understanding key concepts in ${title}`,
            codeExamples: [],
            mathematicalContent: [],
          });
        }
      } else {
        // Single page
        pages.push({
          pageNumber: 1,
          pageTitle: `${title} - Complete Guide`,
          content: contentWithoutTitle || `Comprehensive overview of ${title}`,
          keyTakeaway: `Mastering ${title} concepts`,
          codeExamples: [],
          mathematicalContent: [],
        });
      }
    }

    // Extract practical example
    const exampleMatch = section.match(
      /\*\*Practical Example:\*\*\s*\n(.+?)(?:\n\*\*|$)/s
    );
    const practicalExample = exampleMatch
      ? exampleMatch[1].trim()
      : `Practical application of ${title}`;

    // Extract common pitfalls
    const pitfallsMatch = section.match(
      /\*\*Common Pitfalls:\*\*\s*\n((?:\s*-\s*.+\n?)+)/
    );
    const commonPitfalls = pitfallsMatch
      ? pitfallsMatch[1]
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().substring(1).trim())
      : [`Common mistakes in ${title}`, `Best practices for ${title}`];

    subsections.push({
      title: title,
      summary: summary,
      keyPoints: keyPoints,
      pages: pages,
      practicalExample: practicalExample,
      commonPitfalls: commonPitfalls,
      difficulty: "intermediate",
      estimatedTime: "15-20 minutes",
    });
  });

  console.log(
    `Successfully parsed ${subsections.length} subsections from Markdown`
  );
  return subsections;
}

// Create fallback detailed subsections when AI generation fails
function createFallbackDetailedSubsections(module) {
  console.log(
    "Creating fallback detailed subsections for module:",
    module.title
  );

  return [
    {
      title: "Introduction to " + module.title,
      summary: `Learn the fundamentals of ${module.title} and understand its core concepts.`,
      keyPoints: [
        `Understand the basic concepts of ${module.title}`,
        `Learn practical applications`,
        `Master the fundamental principles`,
      ],
      pages: [
        {
          pageNumber: 1,
          pageTitle: "Overview",
          content:
            module.content ||
            `This module covers the essential concepts of ${module.title}. Please refer to the module materials for detailed information.`,
          keyTakeaway: `Understanding the basics of ${module.title}`,
          codeExamples: [],
          mathematicalContent: [],
        },
        {
          pageNumber: 2,
          pageTitle: "Key Concepts",
          content: `The key concepts in ${module.title} form the foundation for advanced understanding. These concepts are essential for mastering the subject.`,
          keyTakeaway: `Mastering the fundamental concepts`,
          codeExamples: [],
          mathematicalContent: [],
        },
      ],
      practicalExample: `Real-world application of ${module.title}`,
      commonPitfalls: [
        `Common misunderstandings in ${module.title}`,
        `Best practices to follow`,
      ],
      difficulty: "intermediate",
      estimatedTime: "15-20 minutes",
    },
  ];
}

export async function GET(request, { params }) {
  let client = null;
  console.log("🚀 Starting detailed content fetch for course:", params.id);

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ Unauthorized request - missing or invalid auth header");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  const { searchParams } = new URL(request.url);
  const moduleIndex = parseInt(searchParams.get("moduleIndex"), 10);

  if (isNaN(moduleIndex)) {
    console.error("❌ Invalid moduleIndex:", searchParams.get("moduleIndex"));
    return NextResponse.json(
      { error: "Missing or invalid moduleIndex" },
      { status: 400 }
    );
  }

  console.log(`📊 Processing request for module index: ${moduleIndex}`);

  try {
    const db = await getDb();
    console.log("✅ Database connection established");

    const course = await db
      .collection("courses")
      .findOne({ _id: new ObjectId(params.id) });

    if (!course) {
      console.error("❌ Course not found:", params.id);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    console.log(
      `✅ Course found: ${course.title}, modules: ${
        course.modules?.length || 0
      }`
    );

    if (moduleIndex < 0 || moduleIndex >= course.modules.length) {
      console.error(
        `❌ Module index ${moduleIndex} out of bounds for course with ${course.modules.length} modules`
      );
      return NextResponse.json(
        { error: "Module index out of bounds" },
        { status: 400 }
      );
    }

    const module = course.modules[moduleIndex];
    console.log(`📝 Processing module: ${module.title}`);

    let detailedSubsections = module.detailedSubsections;

    console.log(
      `[Module ${moduleIndex}] Initial detailedSubsections from DB:`,
      detailedSubsections
        ? `Found ${detailedSubsections.length} subsections`
        : "No subsections found"
    );

    const needsRegeneration =
      !Array.isArray(detailedSubsections) ||
      detailedSubsections.length === 0 ||
      detailedSubsections.some(
        (sub) => !sub || !Array.isArray(sub.pages) || sub.pages.length === 0
      );

    console.log(
      `[Module ${moduleIndex}] Needs regeneration: ${needsRegeneration}`
    );

    if (needsRegeneration) {
      console.log(
        `🔄 Regenerating content for module ${moduleIndex}: ${module.title}`
      );

      let markdownContent = null;

      // First, check if module already has enhancedMarkdown stored
      if (
        module.enhancedMarkdown &&
        typeof module.enhancedMarkdown === "string"
      ) {
        console.log(
          `✅ Using stored enhancedMarkdown for module ${moduleIndex}`
        );
        markdownContent = module.enhancedMarkdown;
      } else {
        try {
          // Generate new content using AI
          const context = {
            learnerLevel: course.level || "Intermediate",
            subject: course.subject,
            examType: course.examType,
            moduleIndex: moduleIndex + 1,
            totalModules: course.modules.length,
          };

          console.log(
            `🤖 Generating new AI content for module ${moduleIndex} with context:`,
            context
          );

          // Check if we have valid module content
          if (!module.content || typeof module.content !== "string") {
            console.warn(
              `⚠️ Module ${moduleIndex} has no valid content, using fallback`
            );
            detailedSubsections = createFallbackDetailedSubsections(module);
          } else {
            markdownContent = await generateCompetitiveExamModuleSummary(
              module.content,
              context
            );
            console.log(
              `✅ AI content generated, length: ${
                markdownContent?.length || 0
              } characters`
            );
          }
        } catch (aiError) {
          console.error(
            `❌ AI generation failed for module ${moduleIndex}:`,
            aiError
          );
          console.log(`🔧 Using fallback content for module ${moduleIndex}`);
          detailedSubsections = createFallbackDetailedSubsections(module);
        }
      }

      if (markdownContent && typeof markdownContent === "string") {
        try {
          // Parse the Markdown into the expected structure
          detailedSubsections =
            parseMarkdownToDetailedSubsections(markdownContent);

          if (detailedSubsections.length > 0) {
            console.log(
              `✅ Successfully parsed ${detailedSubsections.length} subsections from markdown`
            );

            try {
              const updatePath = `modules.${moduleIndex}.detailedSubsections`;
              await db
                .collection("courses")
                .updateOne(
                  { _id: new ObjectId(params.id) },
                  { $set: { [updatePath]: detailedSubsections } }
                );
              console.log(
                `✅ Course module ${moduleIndex} updated with parsed detailedSubsections`
              );
            } catch (updateError) {
              console.error(
                `❌ Failed to update course in database:`,
                updateError
              );
              // Continue with the content even if database update fails
            } finally {
    if (client) {
      await client.close()
    }
  }
          } else {
            console.warn(
              `⚠️ No subsections parsed from markdown, using fallback`
            );
            detailedSubsections = createFallbackDetailedSubsections(module);
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse markdown content:`, parseError);
          detailedSubsections = createFallbackDetailedSubsections(module);
        } finally {
    if (client) {
      await client.close()
    }
  }
      } else if (!detailedSubsections || detailedSubsections.length === 0) {
        console.log(
          `⚠️ No valid markdown content and no existing subsections, using fallback`
        );
        detailedSubsections = createFallbackDetailedSubsections(module);
      }
    }

    // Ensure we always return valid detailed subsections
    if (
      !detailedSubsections ||
      !Array.isArray(detailedSubsections) ||
      detailedSubsections.length === 0
    ) {
      console.log(
        `🔧 Final fallback: creating basic subsections for module ${moduleIndex}`
      );
      detailedSubsections = createFallbackDetailedSubsections(module);
    }

    console.log(
      `✅ Returning ${detailedSubsections.length} detailed subsections for module ${moduleIndex}`
    );

    return NextResponse.json({
      detailedSubsections: detailedSubsections,
      moduleTitle: module.title,
      moduleIndex: moduleIndex,
    });
  } catch (error) {
    console.error(
      `❌❌❌ Critical error fetching detailed content for module ${moduleIndex}:`,
      error
    );
    console.error("Error stack:", error.stack);

    // Return a more informative error response with fallback data
    return NextResponse.json(
      {
        error: "Failed to generate content",
        message:
          "Content generation is temporarily unavailable. Please try again later.",
        detailedSubsections: [], // Provide empty array as fallback
        debug:
          process.env.NODE_ENV === "development"
            ? {
                errorMessage: error.message,
                stack: error.stack,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
