import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { processMarkdown } from "@/lib/fileProcessor";
import {
  generateOrProcessCurriculum,
  generateCompetitiveExamModuleSummary,
} from "@/lib/gemini";
import jwt from "jsonwebtoken";

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
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

    let processedCurriculum = curriculum;

    // If no curriculum is provided, generate it from the course title
    if (!processedCurriculum?.trim() && courseData.title?.trim()) {
      console.log(
        `🚀 No curriculum found. Generating from title: "${courseData.title}"`
      );
      processedCurriculum = await generateOrProcessCurriculum(
        "GENERATE",
        courseData.title
      );
    } else if (processedCurriculum) {
      // If curriculum is provided, process it
      console.log(`🔄 Processing provided curriculum text...`);
      processedCurriculum = await generateOrProcessCurriculum(
        "PROCESS",
        processedCurriculum
      );
    } else {
      return NextResponse.json(
        { error: "Curriculum content or course title is required" },
        { status: 400 }
      );
    }

    if (!processedCurriculum) {
      return NextResponse.json(
        { error: "Curriculum content is required" },
        { status: 400 }
      );
    }

    if (!courseData.title?.trim()) {
      return NextResponse.json(
        { error: "Course title is required" },
        { status: 400 }
      );
    }

    if (
      !courseData.examType ||
      !courseData.subject ||
      !courseData.learnerLevel
    ) {
      return NextResponse.json(
        { error: "Exam type, subject, and learner level are required" },
        { status: 400 }
      );
    }

    console.log(
      `📚 Processing ExamGenius curriculum for course: ${courseData.title}`
    );
    console.log(
      `🎯 Exam: ${courseData.examType} | Subject: ${courseData.subject} | Level: ${courseData.learnerLevel}`
    );

    // Enhanced context for competitive exams
    const context = {
      learnerLevel: courseData.learnerLevel || "intermediate",
      subject: courseData.subject || "general",
      examType: courseData.examType || "competitive",
      title: courseData.title,
      description: courseData.description || "",
      duration: courseData.duration || "",
      isCompetitiveExam: true,
      isExamGenius: true,
    };

    // Process the curriculum markdown using the original method
    const rawModules = await processMarkdown(processedCurriculum, context);

    if (!rawModules || rawModules.length === 0) {
      return NextResponse.json(
        { error: "Failed to extract modules from curriculum" },
        { status: 400 }
      );
    }

    console.log(
      `✅ Extracted ${rawModules.length} modules from ExamGenius curriculum`
    );

    // Enhanced competitive exam module processing
    const processedModules = [];
    let processed = 0;

    for (const module of rawModules) {
      try {
        console.log(
          `🔄 Processing ExamGenius module ${processed + 1}/${
            rawModules.length
          }: ${module.title}`
        );

        // Use the enhanced competitive exam module summary function (returns Markdown)
        const enhancedMarkdown = await generateCompetitiveExamModuleSummary(
          module.content,
          {
            learnerLevel: context.learnerLevel,
            subject: context.subject,
            examType: context.examType,
            moduleIndex: processed + 1,
            totalModules: rawModules.length,
            courseTitle: courseData.title,
            moduleTitle: module.title,
          }
        );

        // Create enhanced competitive exam module structure
        const finalModule = {
          id: module.id,
          title: module.title,
          content: module.content,
          order: module.order,

          // Store the Markdown content for later parsing
          enhancedMarkdown: enhancedMarkdown,

          // Basic metadata extracted from context
          summary: `Learn ${module.title} for ${context.examType} ${context.subject} exam`,
          objectives: [
            `Master ${module.title} concepts for ${context.examType} exam`,
            "Apply speed-solving techniques and shortcuts",
            "Identify common question patterns and traps",
            "Practice with exam-level problems and time constraints",
          ],
          examples: [
            `${context.examType} exam style questions for ${module.title}`,
            "Time-saving calculation methods and mental math",
            "Previous year question patterns and solutions",
          ],
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
            hasFlowcharts: true,
            hasComparisons: true,
            hasTimelines: false,
            hasFormulas: true,
            hasProcessSteps: true,
            hasCyclicalProcesses: false,
            hasDecisionTrees: true,
            hasMatrices: true,
          },
          beautifulSummaryElements: {
            keyPoints: [`Master ${module.title} for ${context.examType}`],
            estimatedStudyTime: "3-4 hours",
            difficultyLevel: context.learnerLevel,
            practiceExercises: 5,
            realWorldApplications: [`${context.examType} exam applications`],
            prerequisites: ["Basic mathematical concepts"],
            learningOutcomes: [
              `Excel in ${module.title} for competitive exams`,
            ],
          },
          // detailedSubsections will be generated dynamically from enhancedMarkdown when needed
          detailedSubsections: [],

          // Competitive exam specific metadata
          examType: context.examType,
          subject: context.subject,
          estimatedTime: "3-4 hours",
          difficulty: context.learnerLevel,
          learnerLevel: context.learnerLevel,
          isCompetitiveExam: true,
          isExamGenius: true,

          // Add competitive exam specific features
          speedSolvingTechniques: [],
          commonTraps: [],
          memoryTricks: [],
          examPatterns: [],
          timeAllocation: "45-60 minutes",
        };

        processedModules.push(finalModule);
        processed++;

        console.log(
          `✅ ExamGenius module ${processed}/${rawModules.length} processed successfully`
        );
      } catch (moduleError) {
        console.error(
          `❌ Error processing ExamGenius module ${module.title}:`,
          moduleError
        );

        // Create a fallback module structure for competitive exams
        const fallbackModule = {
          id: module.id,
          title: module.title,
          content: module.content,
          order: module.order,
          summary: `Learn ${module.title} for ${context.examType} ${context.subject} exam`,
          objectives: [
            `Master ${module.title} concepts for ${context.examType} exam`,
            "Apply speed-solving techniques and shortcuts",
            "Identify common question patterns and traps",
            "Practice with exam-level problems and time constraints",
          ],
          examples: [
            `${context.examType} exam style questions for ${module.title}`,
            "Time-saving calculation methods and mental math",
            "Previous year question patterns and solutions",
          ],
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
            hasFlowcharts: true,
            hasComparisons: true,
            hasTimelines: false,
            hasFormulas: true,
            hasProcessSteps: true,
            hasCyclicalProcesses: false,
            hasDecisionTrees: true,
            hasMatrices: true,
          },
          beautifulSummaryElements: {
            keyPoints: [`Master ${module.title} for ${context.examType}`],
            estimatedStudyTime: "3-4 hours",
            difficultyLevel: context.learnerLevel,
            practiceExercises: 5,
            realWorldApplications: [`${context.examType} exam applications`],
            prerequisites: ["Basic mathematical concepts"],
            learningOutcomes: [
              `Excel in ${module.title} for competitive exams`,
            ],
          },
          detailedSubsections: [],
          examType: context.examType,
          subject: context.subject,
          learnerLevel: context.learnerLevel,
          isCompetitiveExam: true,
          isExamGenius: true,
          speedSolvingTechniques: [],
          commonTraps: [],
          memoryTricks: [],
          examPatterns: [],
          timeAllocation: "45-60 minutes",
        };

        processedModules.push(fallbackModule);
        processed++;
      }
    }

    console.log(
      `🎉 ExamGenius curriculum processing completed: ${processedModules.length} modules generated`
    );

    return NextResponse.json({
      success: true,
      modules: processedModules,
      metadata: {
        examType: context.examType,
        subject: context.subject,
        learnerLevel: context.learnerLevel,
        totalModules: processedModules.length,
        processedAt: new Date().toISOString(),
        processingMethod: "examgenius_enhanced",
        isCompetitiveExam: true,
        isExamGenius: true,
      },
    });
  } catch (error) {
    console.error("ExamGenius curriculum processing error:", error);

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

    if (error.message?.includes("quota") || error.message?.includes("limit")) {
      return NextResponse.json(
        {
          error: "AI service temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to process ExamGenius curriculum. Please try again or contact support.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
