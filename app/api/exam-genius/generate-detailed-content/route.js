import { NextResponse } from "next/server"
import { generateCompetitiveExamModuleSummary } from "@/lib/gemini"
import { processMarkdown } from "@/lib/fileProcessor"
import clientPromise from "@/lib/mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function POST(request) {
  try {
    // Get user session
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("llmfied")

    const { curriculum, courseData } = await request.json()

    if (!curriculum) {
      return NextResponse.json({ error: "Curriculum content is required" }, { status: 400 })
    }

    console.log(`📚 Processing competitive exam curriculum for: ${courseData.examType} - ${courseData.subject}`)

    // Enhanced context for competitive exams
    const context = {
      learnerLevel: courseData.learnerLevel || 'intermediate',
      subject: courseData.subject || 'Quantitative Aptitude',
      examType: courseData.examType || 'SSC',
      title: courseData.title,
      description: courseData.description,
      isCompetitiveExam: true
    }

    // Process the curriculum markdown using the original method
    const rawModules = await processMarkdown(curriculum, context)

    if (!rawModules || rawModules.length === 0) {
      return NextResponse.json({ error: "Failed to extract modules from curriculum" }, { status: 400 })
    }

    console.log(`✅ Extracted ${rawModules.length} modules from competitive exam curriculum`)

    // Enhanced competitive exam module processing
    const processedModules = []
    let processed = 0

    for (const module of rawModules) {
      try {
        console.log(`🔄 Processing competitive exam module ${processed + 1}/${rawModules.length}: ${module.title}`)

        // Use the enhanced competitive exam module summary function
        const enhancedModule = await generateCompetitiveExamModuleSummary(module.content, {
          learnerLevel: context.learnerLevel,
          subject: context.subject,
          examType: context.examType,
          moduleIndex: processed + 1,
          totalModules: rawModules.length,
          courseTitle: courseData.title,
          moduleTitle: module.title
        })

        // Create enhanced competitive exam module structure
        const finalModule = {
          id: module.id,
          title: module.title,
          content: module.content,
          order: module.order,
          
          // Enhanced content using competitive exam method
          summary: enhancedModule.summary,
          objectives: enhancedModule.objectives,
          examples: enhancedModule.examples,
          resources: enhancedModule.resources,
          visualizationSuggestions: enhancedModule.visualizationSuggestions,
          beautifulSummaryElements: enhancedModule.beautifulSummaryElements,
          detailedSubsections: enhancedModule.detailedSubsections,
          
          // Competitive exam specific metadata
          examType: context.examType,
          subject: context.subject,
          estimatedTime: enhancedModule.beautifulSummaryElements?.estimatedStudyTime || "3-4 hours",
          difficulty: enhancedModule.beautifulSummaryElements?.difficultyLevel || context.learnerLevel,
          learnerLevel: context.learnerLevel,
          isCompetitiveExam: true,
          
          // Add competitive exam specific features
          speedSolvingTechniques: enhancedModule.speedSolvingTechniques || [],
          commonTraps: enhancedModule.commonTraps || [],
          memoryTricks: enhancedModule.memoryTricks || [],
          examPatterns: enhancedModule.examPatterns || [],
          timeAllocation: enhancedModule.timeAllocation || "45-60 minutes"
        }

        processedModules.push(finalModule)
        processed++

        console.log(`✅ Competitive exam module ${processed}/${rawModules.length} processed successfully`)

      } catch (moduleError) {
        console.error(`❌ Error processing competitive exam module ${module.title}:`, moduleError)
        
        // Create a fallback module structure for competitive exams
        const fallbackModule = {
          id: module.id,
          title: module.title,
          content: module.content,
          order: module.order,
          summary: `Learn ${module.title} for ${context.examType} ${context.subject} exam`,
          objectives: [
            `Master ${module.title} concepts for ${context.examType} exam`,
            "Apply speed-solving techniques",
            "Identify common question patterns",
            "Practice with exam-level problems"
          ],
          examples: [
            `${context.examType} exam style questions`,
            "Time-saving calculation methods",
            "Previous year question patterns"
          ],
          resources: { 
            books: [], 
            courses: [], 
            articles: [], 
            videos: [], 
            tools: [], 
            websites: [], 
            exercises: [] 
          },
          visualizationSuggestions: {
            hasFlowcharts: true,
            hasComparisons: true,
            hasTimelines: false,
            hasFormulas: true,
            hasProcessSteps: true,
            hasCyclicalProcesses: false,
            hasHierarchies: false,
            hasRelationships: true,
            codeSimulationTopics: [],
            interactiveElements: ["Formula calculators", "Speed calculation tools"]
          },
          beautifulSummaryElements: {
            keyInsights: [`Essential ${module.title} concepts for ${context.examType}`],
            practicalApplications: [`${context.examType} exam preparation`],
            whyItMatters: `Critical for ${context.examType} exam success`,
            careerRelevance: "Opens competitive career opportunities",
            difficultyLevel: context.learnerLevel,
            prerequisites: ["Basic mathematical concepts"],
            estimatedStudyTime: "3-4 hours"
          },
          detailedSubsections: [
            {
              title: `${module.title} Fundamentals`,
              summary: "Core concepts and basic understanding",
              keyPoints: ["Fundamental concepts", "Basic formulas", "Simple applications"],
              pages: [
                {
                  pageNumber: 1,
                  pageTitle: "Introduction & Foundation",
                  content: `Introduction to ${module.title} for ${context.examType} exam. This section covers fundamental concepts and provides necessary background knowledge.`,
                  codeExamples: [],
                  mathematicalContent: [
                    {
                      type: "formula",
                      title: "Basic Formula",
                      content: "Mathematical expression will be provided",
                      explanation: "Step-by-step explanation for exam context",
                      example: "Numerical example with solution"
                    }
                  ],
                  keyTakeaway: `Understanding ${module.title} basics`
                },
                {
                  pageNumber: 2,
                  pageTitle: "Exam Strategies & Shortcuts",
                  content: `Speed-solving techniques for ${module.title} in ${context.examType} exam. Time-saving methods and mental calculation techniques.`,
                  codeExamples: [],
                  mathematicalContent: [
                    {
                      type: "calculation",
                      title: "Quick Method",
                      content: "Fast calculation technique",
                      explanation: "How to solve quickly in exam",
                      example: "Practice problem with timing"
                    }
                  ],
                  keyTakeaway: "Mastering speed and accuracy"
                },
                {
                  pageNumber: 3,
                  pageTitle: "Practice & Application",
                  content: `Practice problems and exam applications for ${module.title}. Real ${context.examType} exam scenarios and solution strategies.`,
                  codeExamples: [],
                  mathematicalContent: [
                    {
                      type: "example",
                      title: "Exam Problem",
                      content: "Typical exam question",
                      explanation: "Solution approach",
                      example: "Step-by-step solution"
                    }
                  ],
                  keyTakeaway: "Applying concepts in exam conditions"
                }
              ],
              practicalExample: `Practical ${module.title} example for ${context.examType}`,
              commonPitfalls: [`Common ${module.title} mistakes`, "Time management issues"],
              difficulty: context.learnerLevel,
              estimatedTime: "45-60 minutes"
            }
          ],
          
          // Competitive exam specific fields
          examType: context.examType,
          subject: context.subject,
          learnerLevel: context.learnerLevel,
          isCompetitiveExam: true,
          speedSolvingTechniques: [],
          commonTraps: [],
          memoryTricks: [],
          examPatterns: [],
          timeAllocation: "45-60 minutes"
        }
        
        processedModules.push(fallbackModule)
        processed++
      }
    }

    // Calculate additional competitive exam metrics
    const totalSubsections = processedModules.reduce((sum, module) => 
      sum + (module.detailedSubsections?.length || 0), 0
    )

    const totalPages = processedModules.reduce((sum, module) => 
      sum + (module.detailedSubsections?.reduce((pageSum, subsection) => 
        pageSum + (subsection.pages?.length || 0), 0) || 0), 0
    )

    console.log(`✅ Successfully processed ${processedModules.length} competitive exam modules with enhanced content`)

    // Create the final course structure
    const finalCourse = {
      title: courseData.title,
      description: courseData.description || `Comprehensive ${context.examType} ${context.subject} preparation course`,
      examType: context.examType,
      subject: context.subject,
      learnerLevel: context.learnerLevel,
      modules: processedModules,
      isCompetitiveExam: true,
      
      // Enhanced metadata for competitive exams
      totalModules: processedModules.length,
      totalSubsections: totalSubsections,
      totalPages: totalPages,
      estimatedStudyTime: courseData.estimatedTime || "40-50 hours",
      
      // Competitive exam specific metadata
      examFocus: {
        speedSolving: true,
        formulaMastery: true,
        timeManagement: true,
        accuracyImprovement: true,
        examPatterns: true
      },
      
      metadata: {
        createdAt: new Date().toISOString(),
        processingMethod: "competitive_exam_enhanced",
        learnerLevel: context.learnerLevel,
        subject: context.subject,
        examType: context.examType,
        enhancementsApplied: true,
        isCompetitiveExam: true
      }
    }

    return NextResponse.json({
      success: true,
      course: finalCourse,
      metadata: {
        totalModules: processedModules.length,
        totalSubsections: totalSubsections,
        totalPages: totalPages,
        processedAt: new Date().toISOString(),
        processingMethod: "competitive_exam_enhanced",
        examType: context.examType,
        subject: context.subject,
        learnerLevel: context.learnerLevel,
        isCompetitiveExam: true
      }
    })

  } catch (error) {
    console.error("Competitive exam content generation error:", error)
    
    // Provide more specific error messages
    if (error.message?.includes('extract modules')) {
      return NextResponse.json(
        { error: "Could not extract modules from curriculum. Please ensure the curriculum has clear module structure." },
        { status: 400 }
      )
    }
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: "AI service configuration error. Please contact support." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: "Failed to generate detailed competitive exam content. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 