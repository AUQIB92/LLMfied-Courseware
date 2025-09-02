import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY_NANO) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY_NANO is not configured" },
        { status: 500 }
      );
    }

    // Get prompt from request body
    const body = await request.json();
    const prompt = body.prompt || "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

    // Initialize Google Generative AI
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_NANO);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    // Generate content
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    console.log("Generated text description:", text);

    // Return the text description
    // Note: Current Gemini models don't support direct image generation
    // This would need to be connected to image generation services like DALL-E or Midjourney
    return NextResponse.json({
      success: true,
      description: text,
      note: "Image generation not available with current Gemini models. Use description to generate with other services."
    });

  } catch (error) {
    console.error("💥 Error in image generation API:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate image description", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}