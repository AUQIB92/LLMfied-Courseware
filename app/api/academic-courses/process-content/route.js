import { NextResponse } from "next/server";
import { generateModuleSummary } from "@/lib/gemini";
import { chunkContent } from "@/lib/fileProcessor";
import jwt from "jsonwebtoken";

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

// Generate academic modules with 2 assignments and 1 quiz each - WITHOUT AI generation
async function generateAcademicModulesFromContent(content, title, description, subject, academicLevel, credits, semester, objectives) {
  console.log(`🔍 Debug: Content type: ${typeof content}, length: ${content?.length || 'undefined'}`);
  console.log(`🔍 Debug: Content preview: ${content?.slice(0, 200) || 'Content is undefined'}`);
  
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    console.error("❌ Invalid content provided to generateAcademicModulesFromContent");
    return [];
  }
  
  const chunks = chunkContent(content, 8000);
  console.log(`🔍 Debug: Chunks type: ${typeof chunks}, length: ${chunks?.length || 'undefined'}`);
  
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    console.error("❌ chunkContent returned invalid chunks");
    // Fallback: treat entire content as single chunk
    return [{
      id: Date.now(),
      title: `${title} - Main Module`,
      content: content,
      summary: `Academic module covering key concepts in ${subject}`,
      order: 1,
      objectives: [],
      examples: [],
      topics: [],
      detailedSubsections: [], // Empty - will be generated later in UI
      assignments: [
        {
          id: `assignment_${Date.now()}_1`,
          title: `${title} Research Assignment`,
          type: "Research Paper",
          description: "Complete a research assignment based on module content and theoretical foundations",
          points: 100,
          dueDate: "Week 1"
        },
        {
          id: `assignment_${Date.now()}_2`,
          title: `${title} Application Project`,
          type: "Problem Solving",
          description: "Apply concepts learned in practical exercises and real-world implementation",
          points: 100,
          dueDate: "Week 2"
        }
      ],
      quiz: {
        id: `quiz_${Date.now()}`,
        title: `${title} Quiz`,
        type: "Multiple Choice",
        description: "Quiz covering key concepts and practical applications from this module",
        questions: 10,
        points: 50,
        timeLimit: 30
      },
      resources: { books: [], articles: [], websites: [] },
      visualizationSuggestions: {},
      beautifulSummaryElements: {},
      estimatedStudyTime: "4-6 hours",
      difficultyLevel: academicLevel === 'undergraduate' ? 'intermediate' : 'advanced',
      academicLevel: academicLevel,
      subject: subject,
      moduleType: 'academic',
      isTechnicalCourse: true,
      isAcademicCourse: true,
      courseType: "academic"
    }];
  }
  
  const modules = [];

  console.log(`🎓 Processing ${chunks.length} content chunks for academic course...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`📚 Creating module ${i + 1}/${chunks.length} from content chunk...`);

    try {
      // Create basic module structure WITHOUT AI generation - just like Exam Genius
      const module = {
        id: Date.now() + i,
        title: `${title} - Module ${i + 1}`,
        content: chunk, // Use original chunk content
        summary: `Academic module covering key concepts in ${subject}`,
        order: i + 1,
        objectives: [],
        examples: [],
        topics: [],
        detailedSubsections: [], // Empty - will be generated later in UI
        assignments: [
          {
            id: `assignment_${Date.now()}_${i}_1`,
            title: `Module ${i + 1} Research Assignment`,
            type: "Research Paper",
            description: "Complete a research assignment based on module content and theoretical foundations",
            points: 100,
            dueDate: `Week ${i + 1}`
          },
          {
            id: `assignment_${Date.now()}_${i}_2`,
            title: `Module ${i + 1} Application Project`,
            type: "Problem Solving",
            description: "Apply concepts learned in practical exercises and real-world implementation",
            points: 100,
            dueDate: `Week ${i + 2}`
          }
        ],
        quiz: {
          id: `quiz_${Date.now()}_${i}`,
          title: `Module ${i + 1} Quiz`,
          type: "Multiple Choice",
          description: "Quiz covering key concepts and practical applications from this module",
          questions: 10,
          points: 50,
          timeLimit: 30
        },
        resources: { books: [], articles: [], websites: [] },
        visualizationSuggestions: {},
        beautifulSummaryElements: {},
        estimatedStudyTime: "4-6 hours",
        difficultyLevel: academicLevel === 'undergraduate' ? 'intermediate' : 'advanced',
        academicLevel: academicLevel,
        subject: subject,
        moduleType: 'academic',
        isTechnicalCourse: true, // Mark as technical style for UI
        isAcademicCourse: true,
        courseType: "academic"
      };

      modules.push(module);
      console.log(`✅ Academic module "${module.title}" created successfully`);

    } catch (error) {
      console.error(`❌ Error creating academic module ${i + 1}:`, error);
      
      // Create fallback module with required assignments and quiz
      modules.push({
        id: Date.now() + i,
        title: `Academic Module ${i + 1}`,
        content: chunk,
        summary: `Academic content for ${subject} course`,
        order: i + 1,
        objectives: [],
        examples: [],
        topics: [],
        detailedSubsections: [], // Empty - will be generated later
        assignments: [
          {
            id: `assignment_${Date.now()}_1`,
            title: `Assignment ${i + 1}.1`,
            type: "Research Paper",
            description: "Complete a research assignment based on module content",
            points: 100,
            dueDate: `Week ${i + 1}`
          },
          {
            id: `assignment_${Date.now()}_2`,
            title: `Assignment ${i + 1}.2`,
            type: "Problem Solving",
            description: "Apply concepts learned in practical exercises",
            points: 100,
            dueDate: `Week ${i + 2}`
          }
        ],
        quiz: {
          id: `quiz_${Date.now()}`,
          title: `Module ${i + 1} Quiz`,
          type: "Multiple Choice",
          description: "Quiz covering key concepts from this module",
          questions: 10,
          points: 50,
          timeLimit: 30
        },
        resources: { books: [], articles: [], websites: [] },
        visualizationSuggestions: {},
        beautifulSummaryElements: {},
        estimatedStudyTime: "3-4 hours",
        difficultyLevel: academicLevel === 'undergraduate' ? 'intermediate' : 'advanced',
        academicLevel: academicLevel,
        subject: subject,
        moduleType: 'academic',
        isTechnicalCourse: true,
        isAcademicCourse: true,
        courseType: "academic"
      });
    }
  }

  return modules;
}

// Parse generated module content
function parseAcademicModule(content) {
  const result = {
    title: null,
    summary: null,
    objectives: [],
    topics: [],
    examples: [],
    assignments: [],
    quiz: null,
    resources: { books: [], articles: [], websites: [] },
    estimatedStudyTime: null,
    difficultyLevel: null
  };

  // Extract title
  const titleMatch = content.match(/\*\*Module Title:\*\*\s*([^\n]+)/i);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  // Extract summary
  const summaryMatch = content.match(/\*\*Summary:\*\*\s*\n([^\n]+(?:\n[^\n#*]+)*)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  // Extract learning objectives
  const objectivesMatch = content.match(/\*\*Learning Objectives:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (objectivesMatch) {
    result.objectives = objectivesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(obj => obj.length > 0);
  }

  // Extract topics
  const topicsMatch = content.match(/\*\*Topics Covered:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (topicsMatch) {
    result.topics = topicsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(topic => topic.length > 0);
  }

  // Extract examples
  const examplesMatch = content.match(/\*\*Examples:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (examplesMatch) {
    result.examples = examplesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(ex => ex.length > 0);
  }

  // Extract assignments
  const assignment1Match = content.match(/\*\*Assignment 1:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  const assignment2Match = content.match(/\*\*Assignment 2:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  
  if (assignment1Match && assignment2Match) {
    // Parse assignment details from the matched content
    result.assignments = [
      {
        id: `assignment_${Date.now()}_1`,
        title: "Assignment 1",
        type: "Research Paper",
        description: "Research assignment based on module content",
        points: 100,
        dueDate: "Week 1"
      },
      {
        id: `assignment_${Date.now()}_2`,
        title: "Assignment 2", 
        type: "Problem Solving",
        description: "Apply concepts in practical exercises",
        points: 100,
        dueDate: "Week 2"
      }
    ];
  }

  // Extract quiz information
  const quizMatch = content.match(/\*\*Quiz:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (quizMatch) {
    result.quiz = {
      id: `quiz_${Date.now()}`,
      title: "Module Quiz",
      type: "Multiple Choice",
      description: "Quiz covering key concepts from this module",
      questions: 10,
      points: 50,
      timeLimit: 30
    };
  }

  // Extract recommended books
  const booksMatch = content.match(/\*\*Recommended Books:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (booksMatch) {
    result.resources.books = booksMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(book => book.length > 0);
  }

  // Extract estimated study time
  const timeMatch = content.match(/\*\*Estimated Study Time:\*\*\s*([^\n]+)/i);
  if (timeMatch) {
    result.estimatedStudyTime = timeMatch[1].trim();
  }

  // Extract difficulty level
  const difficultyMatch = content.match(/\*\*Difficulty Level:\*\*\s*([^\n]+)/i);
  if (difficultyMatch) {
    result.difficultyLevel = difficultyMatch[1].trim().toLowerCase();
  }

  return result;
}

export async function POST(request) {
  try {
    console.log("🎓 Processing academic content into modules...");

    // Verify authentication
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can process academic course content" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      content,
      title,
      description,
      subject,
      academicLevel,
      credits,
      semester,
      objectives
    } = body;

    if (!content || !title || !subject || !academicLevel) {
      return NextResponse.json(
        { error: "Content, title, subject, and academic level are required" },
        { status: 400 }
      );
    }

    console.log(`📚 Processing content for: ${title} (${subject} - ${academicLevel})`);

    const courseInfo = {
      title: title.trim(),
      description: description?.trim() || '',
      subject,
      academicLevel,
      credits: credits || 3,
      semester: semester?.trim() || ''
    };

    const modules = await generateAcademicModulesFromContent(content, title, description, subject, academicLevel, credits, semester, objectives);

    // Extract learning objectives from content if not provided
    let extractedObjectives = objectives || [];
    if (!extractedObjectives.length) {
      const objectivesPattern = /(?:learning objectives?|objectives?|goals?):\s*\n((?:[-*]\s*[^\n]+\n?)+)/gi;
      const objectivesMatches = [...content.matchAll(objectivesPattern)];
      
      objectivesMatches.forEach(match => {
        const objs = match[1]
          .split('\n')
          .filter(line => line.trim().match(/^[-*]\s*/))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .filter(obj => obj.length > 0);
        extractedObjectives.push(...objs);
      });
    }

    console.log(`✅ Academic course processing complete! Generated ${modules.length} modules`);

    return NextResponse.json({
      success: true,
      modules,
      objectives: extractedObjectives.slice(0, 10), // Limit to 10 objectives
      syllabus: content.slice(0, 2000), // First 2000 characters as syllabus preview
      moduleCount: modules.length,
      totalAssignments: modules.length * 2, // 2 assignments per module
      totalQuizzes: modules.length, // 1 quiz per module
      message: `Successfully processed academic content and generated ${modules.length} comprehensive modules with ${modules.length * 2} assignments and ${modules.length} quizzes`
    });

  } catch (error) {
    console.error("❌ Academic content processing error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process academic content",
        details: error.message
      },
      { status: 500 }
    );
  }
} 