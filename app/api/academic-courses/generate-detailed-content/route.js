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
  // Generate exactly 5 flashcards for academic subsections
  const flashcardPrompt = `
Create exactly 5 academic flashcards for "${subsectionTitle}" within the context of "${moduleContext}" for ${academicLevel} level ${subject} students.

REQUIREMENTS:
- Create exactly 5 flashcards - no more, no less
- Focus on key concepts, definitions, principles, and applications
- Use appropriate academic language for ${academicLevel} level
- Include a mix of: definitions, concepts, applications, examples, and analytical questions
- Make questions clear and answers comprehensive but concise

Return ONLY a valid JSON object with this exact structure:
{
  "flashcards": [
    {
      "id": 1,
      "question": "Clear, specific question about a key concept",
      "answer": "Comprehensive but concise answer with academic depth",
      "category": "definition|concept|application|example|analysis",
      "difficulty": "basic|intermediate|advanced"
    },
    {
      "id": 2,
      "question": "Second flashcard question",
      "answer": "Second flashcard answer", 
      "category": "definition|concept|application|example|analysis",
      "difficulty": "basic|intermediate|advanced"
    },
    {
      "id": 3,
      "question": "Third flashcard question",
      "answer": "Third flashcard answer",
      "category": "definition|concept|application|example|analysis", 
      "difficulty": "basic|intermediate|advanced"
    },
    {
      "id": 4,
      "question": "Fourth flashcard question",
      "answer": "Fourth flashcard answer",
      "category": "definition|concept|application|example|analysis",
      "difficulty": "basic|intermediate|advanced"
    },
    {
      "id": 5,
      "question": "Fifth flashcard question", 
      "answer": "Fifth flashcard answer",
      "category": "definition|concept|application|example|analysis",
      "difficulty": "basic|intermediate|advanced"
    }
  ]
}

Generate real, substantive academic flashcards about ${subsectionTitle} - no templates or placeholders.
`;

  try {
    console.log(`🃏 Generating 5 flashcards for: ${subsectionTitle}`);
    
    // Use direct content generation for flashcards
    const { generateContent } = await import('@/lib/gemini');
    const aiResponse = await generateContent(flashcardPrompt, {
      temperature: 0.7,
      maxOutputTokens: 4096
    });

    // Parse the JSON response
    let parsedContent;
    try {
      // Use our enhanced parsing function
      const { parseLargeGeminiResponse } = await import('@/lib/gemini');
      parsedContent = await parseLargeGeminiResponse(aiResponse);
      
      if (parsedContent && parsedContent.flashcards && Array.isArray(parsedContent.flashcards)) {
        // Ensure exactly 5 flashcards
        const flashcards = parsedContent.flashcards.slice(0, 5);
        if (flashcards.length === 5) {
          console.log(`✅ Generated exactly 5 flashcards for ${subsectionTitle}`);
          
          // Convert flashcards to pages format for compatibility with existing UI
          const flashcardPages = [{
            pageNumber: 1,
            pageTitle: `${subsectionTitle} - Study Cards`,
            content: `# ${subsectionTitle} - Academic Flashcards\n\nThis subsection contains 5 study cards covering key concepts in ${subsectionTitle}.`,
            keyTakeaway: `Master these 5 key concepts to understand ${subsectionTitle}.`,
            flashcards: flashcards,
            isFlashcardContent: true
          }];
          
          return flashcardPages;
        }
      }
    } catch (parseError) {
      console.log("📝 JSON parsing failed for flashcards, creating fallback...");
    }

    // Fallback: Create 5 structured flashcards
    console.log("🔧 Creating fallback flashcards");
    const fallbackFlashcards = [
      {
        id: 1,
        question: `What is ${subsectionTitle}?`,
        answer: `${subsectionTitle} is a fundamental concept in ${subject} that ${academicLevel} students must understand as part of ${moduleContext}.`,
        category: "definition",
        difficulty: "basic"
      },
      {
        id: 2,
        question: `Why is ${subsectionTitle} important in ${subject}?`,
        answer: `${subsectionTitle} is crucial because it provides the theoretical foundation for understanding advanced concepts in ${subject} at the ${academicLevel} level.`,
        category: "concept",
        difficulty: "intermediate"
      },
      {
        id: 3,
        question: `How does ${subsectionTitle} relate to ${moduleContext}?`,
        answer: `${subsectionTitle} serves as a key component within ${moduleContext}, connecting theoretical principles with practical applications in ${subject}.`,
        category: "application",
        difficulty: "intermediate"
      },
      {
        id: 4,
        question: `What are the main principles of ${subsectionTitle}?`,
        answer: `The main principles include systematic analysis, theoretical understanding, and practical application within the academic framework of ${subject}.`,
        category: "concept",
        difficulty: "intermediate"
      },
      {
        id: 5,
        question: `How should ${academicLevel} students approach studying ${subsectionTitle}?`,
        answer: `Students should begin with foundational concepts, progress to theoretical analysis, and then apply knowledge through practical examples and case studies.`,
        category: "analysis",
        difficulty: "advanced"
      }
    ];

    const fallbackPages = [{
      pageNumber: 1,
      pageTitle: `${subsectionTitle} - Study Cards`,
      content: `# ${subsectionTitle} - Academic Flashcards\n\nThis subsection contains 5 study cards covering key concepts in ${subsectionTitle}.`,
      keyTakeaway: `Master these 5 key concepts to understand ${subsectionTitle}.`,
      flashcards: fallbackFlashcards,
      isFlashcardContent: true
    }];

    console.log(`✅ Generated 5 fallback flashcards for ${subsectionTitle}`);
    return fallbackPages;

  } catch (aiError) {
    console.error("❌ Flashcard generation failed:", aiError);

    // Final fallback with basic flashcards
    const basicFlashcards = [
      {
        id: 1,
        question: `Define ${subsectionTitle}`,
        answer: `${subsectionTitle} is an important academic concept in ${subject}.`,
        category: "definition",
        difficulty: "basic"
      },
      {
        id: 2,
        question: `What is the significance of ${subsectionTitle}?`,
        answer: `It provides foundational knowledge for ${academicLevel} students in ${subject}.`,
        category: "concept", 
        difficulty: "basic"
      },
      {
        id: 3,
        question: `How does ${subsectionTitle} apply in practice?`,
        answer: `It can be applied through systematic study and analysis.`,
        category: "application",
        difficulty: "basic"
      },
      {
        id: 4,
        question: `What should students know about ${subsectionTitle}?`,
        answer: `Students should understand its role in ${moduleContext} and ${subject}.`,
        category: "concept",
        difficulty: "basic"
      },
      {
        id: 5,
        question: `Why study ${subsectionTitle} at the ${academicLevel} level?`,
        answer: `It prepares students for advanced coursework and professional application.`,
        category: "analysis",
        difficulty: "basic"
      }
    ];

    const basicPages = [{
      pageNumber: 1,
      pageTitle: `${subsectionTitle} - Study Cards`, 
      content: `# ${subsectionTitle} - Academic Flashcards\n\nThis subsection contains 5 study cards covering key concepts in ${subsectionTitle}.`,
      keyTakeaway: `Master these 5 key concepts to understand ${subsectionTitle}.`,
      flashcards: basicFlashcards,
      isFlashcardContent: true
    }];

    console.log(`✅ Generated 5 basic flashcards for ${subsectionTitle}`);
    return basicPages;
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
