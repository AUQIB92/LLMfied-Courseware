import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
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

export async function GET(request, { params }) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const moduleIndex = parseInt(searchParams.get("moduleIndex"), 10);

  if (isNaN(moduleIndex)) {
    return NextResponse.json(
      { error: "Missing or invalid moduleIndex" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const course = await db
      .collection("courses")
      .findOne({ _id: new ObjectId(params.id) });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (moduleIndex < 0 || moduleIndex >= course.modules.length) {
      return NextResponse.json(
        { error: "Module index out of bounds" },
        { status: 400 }
      );
    }

    const module = course.modules[moduleIndex];
    let detailedSubsections = module.detailedSubsections;

    console.log(
      `[Module ${moduleIndex}] Initial detailedSubsections from DB:`,
      JSON.stringify(detailedSubsections, null, 2)
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
        `Regenerating content for module ${moduleIndex}: ${module.title}`
      );

      let markdownContent = null;

      // First, check if module already has enhancedMarkdown stored
      if (
        module.enhancedMarkdown &&
        typeof module.enhancedMarkdown === "string"
      ) {
        console.log(`Using stored enhancedMarkdown for module ${moduleIndex}`);
        markdownContent = module.enhancedMarkdown;
      } else {
        // Generate new content using AI
        const context = {
          learnerLevel: course.level || "Intermediate",
          subject: course.subject,
          examType: course.examType,
          moduleIndex: moduleIndex + 1,
          totalModules: course.modules.length,
        };

        console.log(`Generating new content for module ${moduleIndex}`);
        markdownContent = await generateCompetitiveExamModuleSummary(
          module.content,
          context
        );
      }

      if (markdownContent && typeof markdownContent === "string") {
        // Parse the Markdown into the expected structure
        detailedSubsections =
          parseMarkdownToDetailedSubsections(markdownContent);

        if (detailedSubsections.length > 0) {
          const updatePath = `modules.${moduleIndex}.detailedSubsections`;
          await db
            .collection("courses")
            .updateOne(
              { _id: new ObjectId(params.id) },
              { $set: { [updatePath]: detailedSubsections } }
            );
          console.log(
            `Course module ${moduleIndex} updated with parsed detailedSubsections.`
          );
        }
      } else {
        console.log(
          `[Module ${moduleIndex}] AI generation failed to return valid markdown.`
        );
        detailedSubsections = [];
      }
    }

    return NextResponse.json({
      detailedSubsections: detailedSubsections || [],
    });
  } catch (error) {
    console.error(
      `Error fetching detailed content for module ${moduleIndex}:`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
