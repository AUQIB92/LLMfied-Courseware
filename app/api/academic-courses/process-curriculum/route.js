import { NextResponse } from "next/server";
import { generateModuleSummary } from "@/lib/gemini";
import jwt from "jsonwebtoken";

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

// Helper function to determine assignment due date
function getAssignmentDueDate(isPublished = false, weekOffset = 1) {
  if (isPublished) {
    // For published assignments, use fixed date
    return "10-09-2025";
  } else {
    // For new assignments, use relative week format (educator can modify)
    return `Week ${weekOffset}`;
  }
}

// Process curriculum into modules without AI generation
async function processCurriculumIntoModules(curriculum, title, description, subject, academicLevel, credits, semester, objectives) {
  console.log("📚 Processing curriculum into module structure...");
  
  // Extract module sections from curriculum
  const moduleMatches = [...curriculum.matchAll(/^##\s+Module\s+\d+:\s*(.+?)(?=\n##|\n#|$)/gms)];
  const modules = [];
  
  console.log(`🎓 Found ${moduleMatches.length} modules in curriculum...`);
  
  for (let i = 0; i < moduleMatches.length; i++) {
    const match = moduleMatches[i];
    const moduleTitle = match[1].trim();
    
    // Extract content between this module and the next
    const startIndex = match.index;
    const nextMatch = moduleMatches[i + 1];
    const endIndex = nextMatch ? nextMatch.index : curriculum.length;
    const moduleText = curriculum.substring(startIndex, endIndex).trim();
    
    console.log(`📝 Processing module: "${moduleTitle}"`);
    
    try {
      // Create basic module structure without AI generation
      const module = {
        id: Date.now() + i,
        title: moduleTitle || `Module ${i + 1}`,
        content: moduleText,
        summary: `Academic module covering ${moduleTitle}`,
        order: i + 1,
        objectives: [],
        examples: [],
        topics: [],
        detailedSubsections: [], // Empty - will be generated later in UI
        assignments: [
          {
            id: `assignment_${Date.now()}_${i}_1`,
            title: `${moduleTitle} Research Assignment`,
            type: "Research Paper",
            description: "Critical analysis and research assignment",
            points: 100,
            dueDate: getAssignmentDueDate(false, i + 1),
            requirements: "1500-2000 words, minimum 5 scholarly sources"
          },
          {
            id: `assignment_${Date.now()}_${i}_2`,
            title: `${moduleTitle} Application Project`,
            type: "Problem Solving",
            description: "Practical application and implementation project",
            points: 100,
            dueDate: getAssignmentDueDate(false, i + 2),
            requirements: "Demonstrate practical understanding and real-world application"
          }
        ],
        quiz: {
          id: `quiz_${Date.now()}_${i}`,
          title: `${moduleTitle} Assessment Quiz`,
          type: "Multiple Choice/Short Answer",
          description: "Comprehensive assessment of module learning objectives",
          questions: 15,
          points: 50,
          timeLimit: 45,
          topics: [`Key concepts from ${moduleTitle}`]
        },
        resources: { books: [], articles: [], websites: [] },
        visualizationSuggestions: {},
        beautifulSummaryElements: {},
        estimatedStudyTime: "6-8 hours",
        difficultyLevel: academicLevel === 'undergraduate' ? 'intermediate' : 'advanced',
        academicLevel: academicLevel,
        subject: subject,
        moduleType: 'academic',
        isTechnicalCourse: true, // Mark as technical style for UI
        isAcademicCourse: true,
        courseType: "academic"
      };
      
      modules.push(module);
      console.log(`✅ Module "${moduleTitle}" processed successfully`);
      
    } catch (error) {
      console.error(`❌ Error processing module "${moduleTitle}":`, error);
      
      // Create fallback module
      modules.push({
        id: Date.now() + i,
        title: moduleTitle || `Academic Module ${i + 1}`,
        content: moduleText,
        summary: `Academic content for ${subject} course`,
        order: i + 1,
        objectives: [],
        examples: [],
        topics: [],
        detailedSubsections: [], // Empty - will be generated later
        assignments: [
          {
            id: `assignment_${Date.now()}_${i}_1`,
            title: `Assignment ${i + 1}.1`,
            type: "Research Paper",
            description: "Complete a research assignment based on module content",
            points: 100,
            dueDate: getAssignmentDueDate(false, i + 1)
          },
          {
            id: `assignment_${Date.now()}_${i}_2`,
            title: `Assignment ${i + 1}.2`,
            type: "Problem Solving",
            description: "Apply concepts learned in practical exercises",
            points: 100,
            dueDate: getAssignmentDueDate(false, i + 2)
          }
        ],
        quiz: {
          id: `quiz_${Date.now()}_${i}`,
          title: `Module ${i + 1} Quiz`,
          type: "Multiple Choice",
          description: "Quiz covering key concepts from this module",
          questions: 10,
          points: 50,
          timeLimit: 30
        },
        resources: { books: [], articles: [], websites: [] },
        estimatedStudyTime: "4-6 hours",
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

// Parse detailed module content
function parseDetailedModule(content) {
  const result = {
    title: null,
    summary: null,
    objectives: [],
    topics: [],
    examples: [],
    assignments: [],
    quiz: null,
    discussions: [],
    resources: { books: [], articles: [], websites: [] },
    rubric: [],
    estimatedStudyTime: null,
    difficultyLevel: null,
    prerequisites: [],
    connections: null
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

  // Extract discussion questions
  const discussionsMatch = content.match(/\*\*Discussion Questions:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (discussionsMatch) {
    result.discussions = discussionsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(discussion => discussion.length > 0);
  }

  return result;
}

export async function POST(request) {
  try {
    console.log("🎓 Processing curriculum into detailed academic modules...");

    // Verify authentication
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can process academic curricula" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      curriculum,
      title,
      description,
      subject,
      academicLevel,
      credits,
      semester,
      objectives
    } = body;

    if (!curriculum || !title || !subject || !academicLevel) {
      return NextResponse.json(
        { error: "Curriculum, title, subject, and academic level are required" },
        { status: 400 }
      );
    }

    console.log(`📚 Processing curriculum for: ${title} (${subject} - ${academicLevel})`);

    const courseInfo = {
      title: title.trim(),
      description: description?.trim() || '',
      subject,
      academicLevel,
      credits: credits || 3,
      semester: semester?.trim() || ''
    };

    const modules = await processCurriculumIntoModules(curriculum, title, description, subject, academicLevel, credits, semester, objectives);

    console.log(`✅ Curriculum processing complete! Generated ${modules.length} detailed modules`);

    return NextResponse.json({
      success: true,
      modules,
      moduleCount: modules.length,
      totalAssignments: modules.length * 2,
      totalQuizzes: modules.length,
      message: `Successfully processed curriculum into ${modules.length} comprehensive modules with ${modules.length * 2} assignments and ${modules.length} quizzes`,
      courseInfo: {
        title,
        subject,
        academicLevel,
        credits,
        totalModules: modules.length
      }
    });

  } catch (error) {
    console.error("❌ Curriculum processing error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process curriculum",
        details: error.message
      },
      { status: 500 }
    );
  }
} 