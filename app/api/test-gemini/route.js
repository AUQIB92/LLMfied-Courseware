import { NextResponse } from "next/server"
import { testGeminiConnection } from "@/lib/gemini"

export async function GET() {
  try {
    const result = await testGeminiConnection()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Gemini API is working correctly",
        model: "gemini-2.0-flash"
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        suggestions: [
          "Check if GEMINI_API_KEY is set in your environment variables",
          "Verify your API key is valid at https://aistudio.google.com/app/apikey",
          "Make sure you have enabled the Gemini API in your Google Cloud project"
        ]
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      suggestions: [
        "Check if GEMINI_API_KEY is set in your environment variables",
        "Verify your API key is valid",
        "Check your internet connection"
      ]
    }, { status: 500 })
  }
}
