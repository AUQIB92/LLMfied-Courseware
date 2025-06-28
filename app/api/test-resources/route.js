import { NextResponse } from "next/server"
import { generateModuleSummary } from "@/lib/gemini"

export async function POST(request) {
  try {
    const { content } = await request.json()
    
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    console.log("Testing new array-based resource generation...")
    
    const result = await generateModuleSummary(content)
    
    console.log("Generated resources:", result.resources)
    
    return NextResponse.json({
      success: true,
      data: result,
      resourceTypes: {
        books: result.resources.books?.length || 0,
        courses: result.resources.courses?.length || 0,
        articles: result.resources.articles?.length || 0,
        videos: result.resources.videos?.length || 0,
        tools: result.resources.tools?.length || 0,
        websites: result.resources.websites?.length || 0,
        exercises: result.resources.exercises?.length || 0
      }
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
