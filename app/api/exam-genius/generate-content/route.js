import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { 
  generateModuleSummaryWithProvider,
  generateCompetitiveExamModuleSummaryWithProvider,
  generateEnhancedModuleSummary 
} from "@/lib/gemini";
import { preprocessContent, analyzeContent } from "@/lib/contentProcessor";

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
    console.log("🎯 Provider-based Content generation API called");

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
      content,
      contentType = "module", // module, competitive-exam, enhanced
      context = {},
      provider = "gemini",
      enhancedMode = false
    } = body;

    // Validate required fields
    if (!content) {
      console.error("❌ Missing required field: content");
      return NextResponse.json(
        { success: false, error: "Missing content" },
        { status: 400 }
      );
    }

    console.log(`🚀 Generating ${contentType} content with provider: ${provider}`);
    console.log(`📚 Input content length: ${content.length} characters`);

    let generatedContent;
    let generationMetadata = {};

    // Generate content based on type
    switch (contentType) {
      case "competitive-exam":
        console.log("📝 Generating competitive exam content...");
        generatedContent = await generateCompetitiveExamModuleSummaryWithProvider(
          content, 
          {
            ...context,
            userId: user.userId
          }, 
          provider
        );
        generationMetadata.type = "competitive-exam";
        break;

      case "enhanced":
        console.log("✨ Generating enhanced content with dual providers...");
        const { contentProvider = provider, resourceProvider = "perplexity" } = context;
        generatedContent = await generateEnhancedModuleSummary(
          content,
          {
            ...context,
            userId: user.userId
          },
          contentProvider,
          resourceProvider
        );
        generationMetadata.type = "enhanced";
        generationMetadata.providers = { content: contentProvider, resources: resourceProvider };
        break;

      case "module":
      default:
        console.log("📚 Generating standard module content...");
        generatedContent = await generateModuleSummaryWithProvider(
          content, 
          {
            ...context,
            userId: user.userId
          }, 
          provider
        );
        generationMetadata.type = "module";
        break;
    }

    if (!generatedContent) {
      console.error("❌ Content generation failed - no content returned");
      return NextResponse.json(
        { 
          success: false, 
          error: "Content generation failed",
          provider: provider,
          contentType: contentType
        },
        { status: 500 }
      );
    }

    console.log(`✅ Content generated successfully`);
    console.log(`🔧 Generated with: ${generatedContent.generatedWith || provider}`);

    // **CRITICAL: Process all content through our bulletproof system**
    let processedContent;

    try {
      if (typeof generatedContent === 'string') {
        // Handle markdown content (competitive-exam type)
        console.log("🔧 Processing markdown content...");
        processedContent = preprocessContent(generatedContent);
        
        // Analyze the processed content
        const analysis = analyzeContent(processedContent);
        
        processedContent = {
          content: processedContent,
          contentAnalysis: analysis,
          type: "markdown"
        };
      } else if (generatedContent && typeof generatedContent === 'object') {
        // Handle structured content (module/enhanced type)
        console.log("🔧 Processing structured content...");
        
        processedContent = {
          ...generatedContent,
          // Process summary
          summary: generatedContent.summary ? 
            preprocessContent(generatedContent.summary) : "",
          
          // Process objectives
          objectives: (generatedContent.objectives || []).map(obj => 
            preprocessContent(obj)
          ),
          
          // Process examples
          examples: (generatedContent.examples || []).map(example => 
            preprocessContent(example)
          ),
          
          // Process detailed subsections
          detailedSubsections: (generatedContent.detailedSubsections || []).map(subsection => ({
            ...subsection,
            summary: preprocessContent(subsection.summary || ""),
            keyPoints: (subsection.keyPoints || []).map(point => 
              preprocessContent(point)
            ),
            practicalExample: preprocessContent(subsection.practicalExample || ""),
            commonPitfalls: (subsection.commonPitfalls || []).map(pitfall => 
              preprocessContent(pitfall)
            ),
            // Process pages within subsections
            pages: (subsection.pages || []).map(page => ({
              ...page,
              content: preprocessContent(page.content || ""),
              keyTakeaway: preprocessContent(page.keyTakeaway || "")
            }))
          })),
          
          // Process beautifulSummaryElements if present
          beautifulSummaryElements: generatedContent.beautifulSummaryElements ? {
            ...generatedContent.beautifulSummaryElements,
            keyInsights: (generatedContent.beautifulSummaryElements.keyInsights || []).map(insight => 
              preprocessContent(insight)
            ),
            practicalApplications: (generatedContent.beautifulSummaryElements.practicalApplications || []).map(app => 
              preprocessContent(app)
            ),
            whyItMatters: preprocessContent(generatedContent.beautifulSummaryElements.whyItMatters || ""),
            careerRelevance: preprocessContent(generatedContent.beautifulSummaryElements.careerRelevance || "")
          } : undefined
        };
      } else {
        throw new Error("Unexpected content format");
      }

      console.log("✅ Content processing complete");

    } catch (processingError) {
      console.warn("⚠️ Content processing error:", processingError.message);
      // Return original content if processing fails
      processedContent = generatedContent;
    }

    // Generate content analysis
    const contentAnalysis = analyzeContent(
      typeof processedContent === 'string' ? 
        processedContent : 
        processedContent.summary || JSON.stringify(processedContent)
    );

    return NextResponse.json({
      success: true,
      content: processedContent,
      metadata: {
        ...generationMetadata,
        generatedWith: generatedContent.generatedWith || provider,
        originalProvider: provider,
        contentValidated: true,
        processingTimestamp: new Date().toISOString(),
        contentAnalysis: {
          complexity: contentAnalysis.complexity,
          hasMath: contentAnalysis.hasMath,
          hasMarkdown: contentAnalysis.hasMarkdown,
          estimatedRenderTime: contentAnalysis.estimatedRenderTime
        }
      }
    });

  } catch (error) {
    console.error("❌ Content generation API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during content generation",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 