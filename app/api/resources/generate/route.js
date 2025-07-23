import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { generateResourcesWithProvider } from "@/lib/gemini";
import { preprocessContent } from "@/lib/contentProcessor";

// JWT verification function
async function verifyToken(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization header");
    }

    const token = authHeader.substring(7);
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export async function POST(request) {
  try {
    console.log("🎯 Provider-based Resources generation API called");

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
      context = {},
      provider = "perplexity" // Default to Perplexity for resources (better for current info)
    } = body;

    // Validate required fields
    if (!moduleContent) {
      console.error("❌ Missing required field: moduleContent");
      return NextResponse.json(
        { success: false, error: "Missing moduleContent" },
        { status: 400 }
      );
    }

    console.log(`🚀 Generating resources with provider: ${provider}`);
    console.log(`📚 Module content length: ${moduleContent.length} characters`);

    // Generate resources with selected provider
    const resourcesResult = await generateResourcesWithProvider(
      moduleContent, 
      {
        ...context,
        userId: user.userId,
        fallback: true // Enable fallback to other providers if primary fails
      }, 
      provider
    );

    if (!resourcesResult || !resourcesResult.resources) {
      console.error("❌ Resources generation failed - no resources returned");
      return NextResponse.json(
        { 
          success: false, 
          error: "Resources generation failed",
          provider: provider,
          fallbackUsed: resourcesResult?.generatedWith?.includes('fallback') || false
        },
        { status: 500 }
      );
    }

    console.log(`✅ Resources generated successfully`);
    console.log(`🔧 Generated with: ${resourcesResult.generatedWith || provider}`);

    // **CRITICAL: Process all resource content through our bulletproof system**
    let processedResources = {
      ...resourcesResult.resources
    };

    try {
      // Process each resource category
      for (const [category, resources] of Object.entries(resourcesResult.resources)) {
        if (Array.isArray(resources)) {
          console.log(`🔧 Processing ${category} resources (${resources.length} items)...`);
          
          processedResources[category] = resources.map((resource, index) => {
            try {
              return {
                ...resource,
                // Process description field
                description: resource.description ? 
                  preprocessContent(resource.description) : "",
                
                // Process title if it contains math/markdown
                title: resource.title ? 
                  preprocessContent(resource.title) : resource.title,
                
                // Process any other text fields that might contain math
                summary: resource.summary ? 
                  preprocessContent(resource.summary) : resource.summary,
                
                content: resource.content ? 
                  preprocessContent(resource.content) : resource.content
              };
            } catch (processingError) {
              console.warn(`⚠️ Error processing ${category} resource ${index + 1}:`, processingError.message);
              // Return original resource if processing fails
              return resource;
            }
          });
        }
      }

      console.log("✅ Resources content processing complete");

    } catch (processingError) {
      console.warn("⚠️ Resources processing error:", processingError.message);
      // Use original resources if processing fails
      processedResources = resourcesResult.resources;
    }

    // Count processed resources
    const resourceCounts = {};
    let totalResources = 0;
    
    for (const [category, resources] of Object.entries(processedResources)) {
      if (Array.isArray(resources)) {
        resourceCounts[category] = resources.length;
        totalResources += resources.length;
      }
    }

    console.log(`📊 Processing stats: ${totalResources} total resources across ${Object.keys(resourceCounts).length} categories`);

    return NextResponse.json({
      success: true,
      resources: processedResources,
      metadata: {
        generatedWith: resourcesResult.generatedWith || provider,
        originalProvider: provider,
        totalResources: totalResources,
        resourceCounts: resourceCounts,
        contentValidated: true,
        processingTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Resources generation API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during resources generation",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 