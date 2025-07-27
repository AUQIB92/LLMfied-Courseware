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

// Parse Markdown content into structured academic data
function parseAcademicContent(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return {
      summary: null,
      objectives: [],
      examples: [],
      resources: {
        books: [],
        articles: [],
        videos: [],
        websites: [],
      },
      assignments: [],
      topics: [],
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
      articles: [],
      videos: [],
      websites: [],
    },
    assignments: [],
    topics: [],
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

  // Extract topics
  const topicsMatch = markdown.match(
    /\*\*Topics Covered:\*\*\s*\n((?:- [^\n]+\n?)+)/i
  );
  if (topicsMatch) {
    result.topics = topicsMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.trim().substring(1).trim())
      .filter((topic) => topic.length > 0);
  }

  // Extract assignments
  const assignmentsMatch = markdown.match(
    /\*\*Assignments:\*\*\s*\n((?:- [^\n]+\n?)+)/i
  );
  if (assignmentsMatch) {
    result.assignments = assignmentsMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.trim().substring(1).trim())
      .filter((assignment) => assignment.length > 0);
  }

  // Extract examples
  const examplesMatch = markdown.match(
    /\*\*Examples:\*\*\s*\n((?:- [^\n]+\n?)+)/i
  );
  if (examplesMatch) {
    result.examples = examplesMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.trim().substring(1).trim())
      .filter((ex) => ex.length > 0);
  }

  // Extract resources - books
  const booksMatch = markdown.match(
    /\*\*(?:Recommended )?Books?:\*\*\s*\n((?:- [^\n]+\n?)+)/i
  );
  if (booksMatch) {
    result.resources.books = booksMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.trim().substring(1).trim())
      .filter((book) => book.length > 0);
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

  return result;
}

// Generate academic course modules from content
async function generateAcademicModules(content, courseInfo) {
  const chunks = chunkContent(content, 8000);
  const modules = [];

  console.log(`🎓 Processing ${chunks.length} content chunks for academic course...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`📚 Generating academic module ${i + 1}/${chunks.length}...`);

    try {
      const prompt = `You are an expert academic curriculum developer. Create a comprehensive academic course module from the following content for a ${courseInfo.academicLevel} level ${courseInfo.subject} course.

Course Information:
- Title: ${courseInfo.title}
- Subject: ${courseInfo.subject}
- Academic Level: ${courseInfo.academicLevel}
- Credits: ${courseInfo.credits}

Content to process:
${chunk}

Create a detailed academic module with:

**Module Title:** [Clear, descriptive title]

**Summary:** [Brief overview of what this module covers and its importance in the academic curriculum]

**Learning Objectives:**
- [Specific learning outcome 1]
- [Specific learning outcome 2]
- [Specific learning outcome 3]

**Detailed Content:**
[Comprehensive academic content including:
- Theoretical concepts and foundations
- Detailed explanations with academic rigor
- Key principles and theories
- Academic context and background
- Important terminology and definitions
- Connections to other academic areas]

**Topics Covered:**
- [Specific topic 1]
- [Specific topic 2]
- [Specific topic 3]

**Examples:**
- [Relevant academic example 1]
- [Relevant academic example 2]

**Assignments:**
- [Suggested assignment or exercise 1]
- [Suggested assignment or exercise 2]

**Recommended Books:**
- [Academic book/resource 1]
- [Academic book/resource 2]

**Estimated Study Time:** [e.g., "4-6 hours"]

**Difficulty Level:** ${courseInfo.academicLevel === 'undergraduate' ? 'intermediate' : 'advanced'}

Format the response in clear Markdown with proper headers and structure. Focus on academic depth, critical thinking, and scholarly approach appropriate for ${courseInfo.academicLevel} students.`;

      const moduleContent = await generateModuleSummary(prompt);
      const parsedModule = parseAcademicContent(moduleContent);

      // Extract module title from content or generate one
      const titleMatch = moduleContent.match(/\*\*Module Title:\*\*\s*([^\n]+)/i);
      const moduleTitle = titleMatch ? titleMatch[1].trim() : `Module ${i + 1}`;

      const module = {
        id: Date.now() + i,
        title: moduleTitle,
        content: moduleContent,
        summary: parsedModule.summary || `Academic module covering key concepts in ${courseInfo.subject}`,
        order: i + 1,
        objectives: parsedModule.objectives,
        examples: parsedModule.examples,
        topics: parsedModule.topics,
        assignments: parsedModule.assignments,
        resources: parsedModule.resources,
        estimatedStudyTime: parsedModule.estimatedStudyTime,
        difficultyLevel: parsedModule.difficultyLevel,
        academicLevel: courseInfo.academicLevel,
        subject: courseInfo.subject
      };

      modules.push(module);
      console.log(`✅ Academic module "${moduleTitle}" generated successfully`);

    } catch (error) {
      console.error(`❌ Error generating academic module ${i + 1}:`, error);
      // Create fallback module
      modules.push({
        id: Date.now() + i,
        title: `Academic Module ${i + 1}`,
        content: chunk,
        summary: `Academic content for ${courseInfo.subject} course`,
        order: i + 1,
        objectives: [],
        examples: [],
        topics: [],
        assignments: [],
        resources: { books: [], articles: [], videos: [], websites: [] },
        estimatedStudyTime: "3-4 hours",
        difficultyLevel: courseInfo.academicLevel === 'undergraduate' ? 'intermediate' : 'advanced',
        academicLevel: courseInfo.academicLevel,
        subject: courseInfo.subject
      });
    }
  }

  return modules;
}

export async function POST(request) {
  try {
    console.log("🎓 Processing academic course syllabus upload...");

    // Verify authentication
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can process academic course content" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title") || "Academic Course";
    const description = formData.get("description") || "";
    const subject = formData.get("subject") || "General";
    const academicLevel = formData.get("academicLevel") || "undergraduate";
    const credits = parseInt(formData.get("credits")) || 3;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log(`📚 Processing academic file: ${file.name} (${file.size} bytes)`);

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
        content = await processMarkdown(filePath);
      } else {
        console.log("📝 Processing text file...");
        content = await processMarkdown(filePath); // Can handle plain text too
      }

      console.log(`📊 Extracted content length: ${content.length} characters`);

      if (!content || content.length < 100) {
        throw new Error("Insufficient content extracted from file");
      }

      // Generate academic modules
      const courseInfo = {
        title,
        description,
        subject,
        academicLevel,
        credits
      };

      console.log("🧠 Generating academic modules with AI...");
      const modules = await generateAcademicModules(content, courseInfo);

      // Extract learning objectives from content
      const objectivesPattern = /(?:learning objectives?|objectives?|goals?):\s*\n((?:[-*]\s*[^\n]+\n?)+)/gi;
      const objectivesMatches = [...content.matchAll(objectivesPattern)];
      const extractedObjectives = [];

      objectivesMatches.forEach(match => {
        const objectives = match[1]
          .split('\n')
          .filter(line => line.trim().match(/^[-*]\s*/))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .filter(obj => obj.length > 0);
        extractedObjectives.push(...objectives);
      });

      // Clean up uploaded file
      try {
        await unlink(filePath);
        console.log("🗑️ Temporary file cleaned up");
      } catch (cleanupError) {
        console.warn("⚠️ Failed to clean up temporary file:", cleanupError);
      }

      console.log(`✅ Academic course processing complete! Generated ${modules.length} modules`);

      return NextResponse.json({
        success: true,
        modules,
        objectives: extractedObjectives.slice(0, 10), // Limit to 10 objectives
        syllabus: content.slice(0, 2000), // First 2000 characters as syllabus preview
        extractedContent: content.slice(0, 500), // Preview of extracted content
        moduleCount: modules.length,
        message: `Successfully processed academic syllabus and generated ${modules.length} comprehensive modules`
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
    console.error("❌ Academic syllabus processing error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process academic syllabus upload",
        details: error.message
      },
      { status: 500 }
    );
  }
} 