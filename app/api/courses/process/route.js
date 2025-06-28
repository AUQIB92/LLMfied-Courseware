import { NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { processPDF, processMarkdown, chunkContent } from "@/lib/fileProcessor"
import { generateModuleSummary } from "@/lib/gemini"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function POST(request) {
  let filepath = null
  
  try {
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const learnerLevel = formData.get("learnerLevel") || "intermediate"
    const subject = formData.get("subject") || "general"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size)
    console.log("Learner Level:", learnerLevel, "Subject:", subject)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure tmp directory exists
    const tmpDir = join(process.cwd(), "tmp")
    await mkdir(tmpDir, { recursive: true })

    // Save file temporarily
    const filename = `${Date.now()}-${file.name}`
    filepath = join(tmpDir, filename)
    await writeFile(filepath, buffer)

    console.log("File saved temporarily at:", filepath)

    let content = ""
    let modules = []

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
      console.log("Processing as PDF")
      content = await processPDF(filepath)
      modules = await chunkContent(content, { learnerLevel, subject }) // Pass context
    } else if (file.type === "text/markdown" || file.name.toLowerCase().endsWith('.md')) {
      console.log("Processing as Markdown")
      content = buffer.toString()
      modules = await processMarkdown(content, { learnerLevel, subject }) // Pass context  
    } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith('.txt')) {
      console.log("Processing as Text")
      content = buffer.toString()
      modules = await chunkContent(content, { learnerLevel, subject }) // Pass context
    } else {
      console.log("Unsupported file type:", file.type)
      return NextResponse.json({ error: `Unsupported file type: ${file.type}. Please upload a PDF, Markdown (.md), or Text (.txt) file.` }, { status: 400 })
    }

    console.log("Generated", modules.length, "modules")

    // Enrich modules with AI-generated content
    const enrichedModules = await Promise.all(
      modules.map(async (module, index) => {
        try {
          console.log(`Generating AI content for module ${index + 1}: ${module.title}`)
          const aiContent = await generateModuleSummary(module.content, { 
            learnerLevel, 
            subject,
            moduleIndex: index + 1,
            totalModules: modules.length 
          })
          return {
            ...module,
            summary: aiContent.summary,
            objectives: aiContent.objectives,
            examples: aiContent.examples,
            resources: aiContent.resources || {
              books: [],
              courses: [],
              articles: [],
              videos: [],
              tools: [],
              websites: [],
              exercises: []
            },
            // Add new enhanced fields
            visualizationSuggestions: aiContent.visualizationSuggestions,
            beautifulSummaryElements: aiContent.beautifulSummaryElements,
            detailedSubsections: aiContent.detailedSubsections || []
          }
        } catch (error) {
          console.error("Failed to generate AI content for module:", module.title, error)
          return {
            ...module,
            summary: "AI content generation failed - please add summary manually",
            objectives: [],
            examples: [],
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
              hasFlowcharts: false,
              hasComparisons: false,
              hasTimelines: false,
              hasFormulas: false,
              hasProcessSteps: false,
              hasCyclicalProcesses: false,
              hasHierarchies: false,
              hasRelationships: false,
              codeSimulationTopics: [],
              interactiveElements: []
            },
            beautifulSummaryElements: {
              keyInsights: [],
              practicalApplications: [],
              whyItMatters: "This topic is important for understanding the subject area.",
              careerRelevance: "Understanding this topic can enhance your professional skills.",
              difficultyLevel: "Intermediate",
              prerequisites: [],
              estimatedStudyTime: "2-3 hours"
            },
            detailedSubsections: []
          }
        }
      }),
    )

    console.log("Successfully processed file and enriched modules with enhanced AI content")
    return NextResponse.json({ 
      modules: enrichedModules,
      subject: subject,
      metadata: {
        originalFileName: file.name,
        learnerLevel: learnerLevel,
        subject: subject,
        processingDate: new Date().toISOString(),
        enhancementsApplied: true
      }
    })
  } catch (error) {
    console.error("File processing error:", error)
    return NextResponse.json({ 
      error: "Failed to process file", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  } finally {
    // Clean up temporary file
    if (filepath) {
      try {
        await unlink(filepath)
        console.log("Cleaned up temporary file:", filepath)
      } catch (cleanupError) {
        console.error("Failed to cleanup temporary file:", cleanupError)
      }
    }
  }
}
