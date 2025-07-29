import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { generateModuleSummary } from "@/lib/gemini";

// Function to generate AI-powered multipage academic content
async function generateAcademicMultipageContent(
  subsectionTitle,
  moduleContext,
  academicLevel = "undergraduate",
  subject = "General Studies"
) {
  // Generate AI-powered academic content using Gemini
  const academicPrompt = `
Create comprehensive academic content for "${subsectionTitle}" within the context of "${moduleContext}" for ${academicLevel} level ${subject} students.

REQUIREMENTS:
- Create 8 detailed academic pages with substantial, meaningful content
- Focus on theoretical depth, critical analysis, and scholarly approach
- Include specific examples, case studies, and real-world applications
- Use proper academic language and structure
- Provide detailed explanations, not generic templates

CONTENT STRUCTURE (8 pages):
1. Introduction & Theoretical Foundation
2. Core Theory & Principles (Part 1)
3. Core Theory & Principles (Part 2)
4. Mathematical Formulations & Models (if applicable)
5. Practical Applications & Case Studies
6. Research Methods & Analytical Frameworks
7. Current Developments & Future Directions
8. Summary & Academic Integration

Return ONLY a JSON object with this exact structure:
{
  "pages": [
    {
      "pageNumber": 1,
      "pageTitle": "Specific Page Title",
      "content": "Detailed markdown content with proper academic depth...",
      "keyTakeaway": "Specific key insight for this page"
    }
    // ... continue for all 8 pages
  ]
}

Generate real, substantive academic content about ${subsectionTitle} - not generic templates or placeholders.
`;

  try {
    console.log(`🤖 Generating AI content for: ${subsectionTitle}`);
    const aiResponse = await generateModuleSummary(academicPrompt);

    // Parse the AI response
    let aiContent;
    try {
      aiContent = JSON.parse(aiResponse);
    } catch (parseError) {
      console.log(
        "📝 AI response not valid JSON, creating structured content..."
      );

      // Fallback: create one comprehensive page with AI content
      aiContent = {
        pages: [
          {
            pageNumber: 1,
            pageTitle: `${subsectionTitle} - Comprehensive Academic Study`,
            content: aiResponse,
            keyTakeaway: `Understanding ${subsectionTitle} requires comprehensive academic analysis and critical thinking.`,
          },
        ],
      };
    }

    if (aiContent.pages && Array.isArray(aiContent.pages)) {
      console.log(`✅ Generated ${aiContent.pages.length} AI-powered pages`);
      return aiContent.pages;
    } else {
      throw new Error("Invalid AI response structure");
    }
  } catch (aiError) {
    console.error("❌ AI generation failed, using fallback:", aiError);

    // Fallback to a single meaningful page
    return [
      {
        pageNumber: 1,
        pageTitle: `${subsectionTitle} - Academic Overview`,
        content: `# ${subsectionTitle} - Academic Study

## Introduction

${subsectionTitle} is an important topic within ${moduleContext} that requires comprehensive academic understanding at the ${academicLevel} level in ${subject}.

## Core Concepts

This section covers the fundamental principles and theoretical frameworks that underpin ${subsectionTitle}. Students should focus on:

1. **Theoretical Foundation**: Understanding the basic principles
2. **Academic Context**: How this fits within the broader discipline
3. **Practical Applications**: Real-world relevance and applications
4. **Critical Analysis**: Developing analytical skills

## Learning Outcomes

Upon completing this section, students will be able to demonstrate understanding of ${subsectionTitle} through theoretical knowledge and practical application.

## Further Study

This topic connects to other areas within ${moduleContext} and provides foundation for advanced study in ${subject}.`,
        keyTakeaway: `${subsectionTitle} requires systematic academic study combining theoretical understanding with practical application.`,
      },
    ];
  }
}

// Function to parse markdown content and identify subsections
function parseMarkdownToSubsections(markdownContent) {
  if (!markdownContent || typeof markdownContent !== "string") {
    return [];
  }

  const subsections = [];
  const lines = markdownContent.split("\n");
  let currentSubsection = null;

  lines.forEach((line) => {
    // Match ###, ####, etc. but NOT ##
    const match = line.match(/^(###+)\s+(.*)/);
    if (match) {
      if (currentSubsection) {
        subsections.push(currentSubsection);
      }
      currentSubsection = {
        title: match[2].trim(),
        content: "",
      };
    } else if (currentSubsection && !line.match(/^##\s+.*/)) {
      // Ignore module titles
      currentSubsection.content += line + "\n";
    }
  });

  if (currentSubsection) {
    subsections.push(currentSubsection);
  }

  return subsections.map((sub) => ({ ...sub, content: sub.content.trim() }));
}

export async function POST(request) {
  try {
    console.log(
      "🎓 Academic Courses: Generating detailed multipage content..."
    );

    const {
      courseId,
      moduleIndex,
      academicLevel = "undergraduate",
      subject = "General Studies",
      singleSubsection = false,
      subsectionTitle,
      moduleTitle,
    } = await request.json();

    // Handle individual subsection generation
    if (singleSubsection && subsectionTitle) {
      console.log(`🎯 Generating individual subsection: ${subsectionTitle}`);

      // Generate multipage content for the single subsection
      const pages = await generateAcademicMultipageContent(
        subsectionTitle,
        moduleTitle || "Academic Module",
        academicLevel,
        subject
      );

      const academicContent = {
        title: subsectionTitle,
        summary: `Academic study of ${subsectionTitle} within ${
          moduleTitle || "Academic Module"
        }`,
        keyPoints: [
          `Theoretical foundations of ${subsectionTitle}`,
          `Academic analysis and critical thinking`,
          `Practical applications and case studies`,
          `Research methods and scholarly approaches`,
        ],
        pages: pages,
        practicalExample: `Academic exploration of ${subsectionTitle} through theoretical analysis and practical application`,
        commonPitfalls: [
          `Oversimplifying complex academic concepts`,
          "Confusing correlation with causation in analysis",
          "Failing to consider multiple theoretical perspectives",
        ],
        difficulty:
          academicLevel === "undergraduate" ? "Intermediate" : "Advanced",
        estimatedTime: "25-30 minutes",
        hasChildren: false,
        childrenCount: 0,
        academicLevel: academicLevel,
        subject: subject,
        isAcademicContent: true,
        type: "pages",
      };

      console.log(
        `✅ Generated ${pages.length} pages for individual subsection: ${subsectionTitle}`
      );

      return NextResponse.json({
        success: true,
        content: academicContent,
        message: `Generated ${pages.length} pages of academic content for "${subsectionTitle}"`,
      });
    }

    if (!courseId || moduleIndex === undefined) {
      return NextResponse.json(
        { error: "Course ID and module index are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("llmfied");
    const coursesCollection = db.collection("courses");

    // Find the course
    const course = await coursesCollection.findOne({
      _id: new ObjectId(courseId),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    console.log(`🔍 Processing module: ${module.title}`);
    console.log(`📚 Academic Level: ${academicLevel}, Subject: ${subject}`);

    // Parse the module content to identify subsections
    const subsections = parseMarkdownToSubsections(module.content);
    console.log(`📋 Found ${subsections.length} subsections to process`);

    if (subsections.length === 0) {
      return NextResponse.json(
        { error: "No subsections found in module content" },
        { status: 400 }
      );
    }

    // Generate multipage content for each subsection
    const detailedSubsections = [];

    for (let i = 0; i < subsections.length; i++) {
      const subsection = subsections[i];
      console.log(`📖 Generating pages for: ${subsection.title}`);

      // Generate multipage content using AI
      const pages = await generateAcademicMultipageContent(
        subsection.title,
        module.title,
        academicLevel,
        subject
      );

      const detailedSubsection = {
        title: subsection.title,
        summary: `Academic study of ${subsection.title} within ${module.title}`,
        keyPoints: [
          `Theoretical foundations of ${subsection.title}`,
          `Academic analysis and critical thinking`,
          `Practical applications and case studies`,
          `Research methods and scholarly approaches`,
        ],
        pages: pages,
        practicalExample: `Academic exploration of ${subsection.title} through theoretical analysis and practical application`,
        commonPitfalls: [
          `Oversimplifying complex academic concepts`,
          "Confusing correlation with causation in analysis",
          "Failing to consider multiple theoretical perspectives",
        ],
        difficulty:
          academicLevel === "undergraduate" ? "Intermediate" : "Advanced",
        estimatedTime: "25-30 minutes",
        hasChildren: false,
        childrenCount: 0,
        academicLevel: academicLevel,
        subject: subject,
        isAcademicContent: true,
      };

      detailedSubsections.push(detailedSubsection);
      console.log(
        `✅ Generated ${pages.length} pages for: ${subsection.title}`
      );
    }

    // Update the module with detailed subsections
    const updateResult = await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      {
        $set: {
          [`modules.${moduleIndex}.detailedSubsections`]: detailedSubsections,
          [`modules.${moduleIndex}.hasDetailedContent`]: true,
          [`modules.${moduleIndex}.lastUpdated`]: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    console.log(
      `✅ Successfully generated detailed content for ${detailedSubsections.length} subsections`
    );

    return NextResponse.json({
      success: true,
      detailedSubsections,
      message: `Generated ${detailedSubsections.length} detailed subsections with multipage content`,
    });
  } catch (error) {
    console.error("❌ Error generating detailed content:", error);
    return NextResponse.json(
      { error: "Failed to generate detailed content", details: error.message },
      { status: 500 }
    );
  }
}
