import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { generateQuizWithProvider } from "@/lib/gemini";
import { preprocessContent } from "@/lib/contentProcessor";

// JWT verification function
async function verifyToken(request) {
  try {
    console.log("🔐 Starting JWT verification...");
    const authHeader = request.headers.get("authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(
        "❌ No valid authorization header:",
        authHeader ? authHeader.substring(0, 20) + "..." : "null"
      );
      throw new Error("No valid authorization header");
    }

    const token = authHeader.substring(7);
    console.log("Token extracted, length:", token.length);

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET environment variable not set");
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ JWT verification successful for user:", decoded.userId);
    return decoded;
  } catch (error) {
    console.error("❌ JWT verification failed:", error.message);
    throw new Error("Invalid token");
  }
}

export async function POST(request) {
  try {
    console.log("🎯 Provider-based Quiz generation API called");

    // Verify authentication
    let user;
    try {
      user = await verifyToken(request);
    } catch (authError) {
      console.error("❌ Authentication failed:", authError.message);
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("📝 Request body parsed successfully");
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { 
      moduleContent, 
      difficulty = "medium", 
      context = {},
      provider = "gemini" // Default to Gemini if not specified
    } = body;

    // Validate required fields
    if (!moduleContent) {
      console.error("❌ Missing required field: moduleContent");
      return NextResponse.json(
        { success: false, error: "Missing moduleContent" },
        { status: 400 }
      );
    }

    console.log(`🚀 Generating ${difficulty} quiz with provider: ${provider}`);
    console.log(`📚 Module content length: ${moduleContent.length} characters`);

    // Generate quiz with selected provider
    const quizResult = await generateQuizWithProvider(
      moduleContent, 
      difficulty, 
      {
        ...context,
        userId: user.userId,
        fallback: true // Enable fallback to other providers if primary fails
      }, 
      provider
    );

    if (!quizResult || !quizResult.questions) {
      console.error("❌ Quiz generation failed - no questions returned");
      return NextResponse.json(
        { 
          success: false, 
          error: "Quiz generation failed",
          provider: provider,
          fallbackUsed: quizResult?.generatedWith?.includes('fallback') || false
        },
        { status: 500 }
      );
    }

    console.log(`✅ Quiz generated successfully with ${quizResult.questions.length} questions`);
    console.log(`🔧 Generated with: ${quizResult.generatedWith || provider}`);

    // **CRITICAL: Process all content through our bulletproof system**
    const processedQuiz = {
      ...quizResult,
      questions: quizResult.questions.map((question, index) => {
        try {
          console.log(`🔧 Processing question ${index + 1}...`);
          
          return {
            ...question,
            question: preprocessContent(question.question || ""),
            explanation: preprocessContent(question.explanation || ""),
            options: (question.options || []).map(option => preprocessContent(option || ""))
          };
        } catch (processingError) {
          console.warn(`⚠️ Error processing question ${index + 1}:`, processingError.message);
          // Return original content if processing fails
          return question;
        }
      })
    };

    // Validate processed content
    const validQuestions = processedQuiz.questions.filter(q => 
      q.question && 
      q.options && 
      q.options.length > 0 && 
      typeof q.correct === 'number'
    );

    if (validQuestions.length === 0) {
      console.error("❌ No valid questions after processing");
      return NextResponse.json(
        { 
          success: false, 
          error: "Content processing failed - no valid questions",
          originalCount: quizResult.questions.length
        },
        { status: 500 }
      );
    }

    // Update quiz with valid questions only
    processedQuiz.questions = validQuestions;

    console.log(`✅ Content processing complete: ${validQuestions.length} valid questions`);
    console.log(`📊 Processing stats: ${validQuestions.length}/${quizResult.questions.length} questions valid`);

      return NextResponse.json({
        success: true,
      ...processedQuiz,
      metadata: {
        generatedWith: quizResult.generatedWith || provider,
        originalProvider: provider,
        questionsProcessed: validQuestions.length,
        totalGenerated: quizResult.questions.length,
        contentValidated: true,
        processingTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Quiz generation API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during quiz generation",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
