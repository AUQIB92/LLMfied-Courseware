import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const getUserIdFromToken = (request) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error("Failed to verify token:", error);
    return null;
  }
};

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, style = "educational", size = "1024x1024" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log(`🎨 Generating image for prompt: "${prompt}"`);

    // Check if OpenAI API key is available, provide fallback if not
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY not found, using placeholder image service");
      
      // Generate a placeholder image URL with text
      const fallbackImageUrl = `https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=${encodeURIComponent(prompt.substring(0, 50))}`;
      
      return NextResponse.json({
        success: true,
        imageUrl: fallbackImageUrl,
        originalPrompt: prompt,
        enhancedPrompt: `Placeholder for: ${prompt}`,
        isPlaceholder: true,
        message: "OpenAI API not configured. Placeholder image generated."
      });
    }

    // Enhanced educational prompt
    const enhancedPrompt = `Educational illustration: ${prompt}. Clean, professional style suitable for academic content. High quality, clear details, educational diagram style.${style === "diagram" ? " Technical diagram with labels and clear annotations." : ""}`;

    console.log(`🔧 Enhanced prompt: "${enhancedPrompt}"`);

    // Use OpenAI DALL-E API for image generation
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: "standard",
        style: "natural"
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      console.error("OpenAI API error:", {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorData
      });

      // Provide specific error messages based on OpenAI's response
      let userFriendlyMessage = "Failed to generate image";
      if (openaiResponse.status === 401) {
        userFriendlyMessage = "API authentication failed";
      } else if (openaiResponse.status === 429) {
        userFriendlyMessage = "Rate limit exceeded. Please try again later";
      } else if (openaiResponse.status === 400) {
        userFriendlyMessage = errorData.error?.message || "Invalid prompt or parameters";
      }

      return NextResponse.json(
        { 
          error: userFriendlyMessage,
          details: errorData.error?.message || errorText
        },
        { status: 500 }
      );
    }

    const data = await openaiResponse.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error("❌ Invalid response from OpenAI:", data);
      return NextResponse.json(
        { error: "Invalid response from image generation service" },
        { status: 500 }
      );
    }

    const imageUrl = data.data[0].url;
    console.log(`✅ Image generated successfully: ${imageUrl}`);

    // Optional: Save to Cloudinary for permanent storage
    let permanentUrl = imageUrl;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const { v2: cloudinary } = await import("cloudinary");
        
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "course-images",
          public_id: `generated_${userId}_${Date.now()}`,
        });

        permanentUrl = uploadResult.secure_url;
        console.log("✅ Image uploaded to Cloudinary:", permanentUrl);
      } catch (cloudinaryError) {
        console.warn("Cloudinary upload failed, using original URL:", cloudinaryError.message);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: permanentUrl,
      originalPrompt: prompt,
      enhancedPrompt: enhancedPrompt,
    });

  } catch (error) {
    console.error("💥 Error generating image:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error.message,
      },
      { status: 500 }
    );
  }
}