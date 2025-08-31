import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"
import jwt from "jsonwebtoken"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function POST(request) {
  let client = null;
  try {
    // Get user session
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Connect to MongoDB
    const connection = await connectToDatabase()
    const client = connection.client
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

Please ensure the curriculum is:
- Appropriately scaled for ${learnerLevel} level
- Progressive in difficulty from basic to advanced concepts
- Logically structured
- Industry-relevant

CRITICAL OUTPUT REQUIREMENTS:
Please return the output in a markdown code block. If the output is large, break it into pieces no larger than 9000 characters each.

Use this structure for large responses:
\`\`\`json
{
  "part1": "# Course Title\\n\\n## Course Overview\\n[Brief description and objectives]\\n\\n## Module 1: [Title]\\n**Objective:** [One sentence objective]\\n**Key Concepts:**\\n- Concept 1\\n- Concept 2",
  "part2": "## Module 5: [Title]\\n**Objective:** [One sentence objective]\\n**Key Concepts:**\\n- Concept 1\\n- Concept 2"
}
\`\`\`

For smaller responses, use a single part:
\`\`\`json
{
  "complete": "# Course Title\\n\\n## Course Overview\\n[Brief description and objectives]\\n\\n## Module 1: [Title]\\n**Objective:** [One sentence objective]\\n**Key Concepts:**\\n- Concept 1\\n- Concept 2\\n- Concept 3\\n- Concept 4\\n\\n## Module 2: [Title]\\n... and so on"
}
\`\`\`

IMPORTANT OUTPUT FORMAT:
• Respond with ONLY valid JSON inside a single Markdown code block.
• Begin the response with three backticks followed by the word json (\`\`\`json) on its own line.
• End the response with three backticks (\`\`\`).
• Do NOT include any additional commentary, explanation, or prose outside the code block.
• Ensure the JSON is completely valid and self-contained.
• If content is too large, break it into numbered parts (part1, part2, etc.) within the JSON structure.
• Use proper Markdown formatting with clear module sections.
    `

    // Generate curriculum using Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(curriculumPrompt)
    let responseText = result.response.text()
    
    // Extract JSON from markdown code block
    const codeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    let curriculum = "";
    
    if (!codeBlockMatch) {
      console.log("No JSON code block found in curriculum response, using direct response...");
      // If no JSON structure, return the text directly as fallback
      curriculum = responseText;
    } else {
      responseText = codeBlockMatch[1];
      console.log("Successfully extracted JSON from markdown code block for curriculum");
      
      try {
        // Parse the JSON with safeguards
        let parsed = JSON.parse(responseText);
        
        // Handle chunked response format
        if (parsed.part1 || parsed.part2) {
          console.log("Detected chunked curriculum response, merging parts...");
          let mergedCurriculum = "";
          
          // Merge all parts into a single curriculum string
          Object.keys(parsed).forEach(partKey => {
            if (partKey.startsWith('part') && parsed[partKey]) {
              mergedCurriculum += parsed[partKey] + "\\n\\n";
            }
          });
          
          curriculum = mergedCurriculum.trim();
          console.log("Successfully merged chunked curriculum response parts");
        } else if (parsed.complete) {
          // Handle single complete response
          curriculum = parsed.complete;
          console.log("Using complete curriculum response format");
        } else {
          // Fallback to original text if JSON doesn't have expected structure
          curriculum = responseText;
        }
      } catch (parseError) {
        console.log("Failed to parse curriculum response JSON, using raw response...");
        curriculum = responseText;
      }
    }

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