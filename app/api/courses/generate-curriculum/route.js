import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"
import jwt from "jsonwebtoken"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

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

    const { topic, learnerLevel, subject, duration, objectives, title, description } = await request.json()

    if (!topic || !learnerLevel) {
      return NextResponse.json({ error: "Topic and learner level are required" }, { status: 400 })
    }

    // Simple curriculum generation prompt - just modules and key concepts
    const curriculumPrompt = `
Create a simple, structured curriculum outline for a course on "${topic}" targeted at ${learnerLevel} level learners.

Course Details:
- Title: ${title || topic}
- Subject: ${subject || 'General'}
- Target Level: ${learnerLevel}

Generate a clean, simple curriculum structure with:

1. **Course Overview**
   - Brief description (2-3 sentences)
   - 3-5 main learning objectives
   - Prerequisites (if any)

2. **Module Structure** (6-10 modules)
   For each module, provide ONLY:
   - Module number and title
   - 4-6 key concepts/topics to be covered
   - Brief module objective (1 sentence)

Keep it simple and focused. This curriculum will later be processed to generate detailed content, resources, and interactive elements.

Format as clean Markdown with clear module sections:

# Course Title

## Course Overview
[Brief description and objectives]

## Module 1: [Title]
**Objective:** [One sentence objective]
**Key Concepts:**
- Concept 1
- Concept 2
- Concept 3
- Concept 4

## Module 2: [Title]
... and so on

Please ensure the curriculum is:
- Appropriately scaled for ${learnerLevel} level
- Progressive in difficulty from basic to advanced concepts
- Logically structured
- Industry-relevant

Format as a clean Markdown document with clear module structure.
    `

    // Generate curriculum using Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(curriculumPrompt)
    const curriculum = result.response.text()

    // Count estimated modules from the generated content
    const moduleMatches = curriculum.match(/## Module \d+/g) || curriculum.match(/### Module \d+/g) || []
    const moduleCount = moduleMatches.length || 8 // Default estimate

    console.log(`✅ Generated curriculum for "${topic}" - ${moduleCount} modules estimated`)

    return NextResponse.json({
      success: true,
      curriculum,
      moduleCount,
      metadata: {
        topic,
        learnerLevel,
        subject,
        duration,
        generatedAt: new Date().toISOString(),
        estimatedModules: moduleCount
      }
    })

  } catch (error) {
    console.error("Curriculum generation error:", error)
    
    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: "AI service configuration error. Please contact support." },
        { status: 500 }
      )
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again later." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        error: "Failed to generate curriculum. Please try again or contact support.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
