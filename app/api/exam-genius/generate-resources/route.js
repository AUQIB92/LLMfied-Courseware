import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { generateContent } from "@/lib/gemini"

// JWT verification function
async function verifyToken(request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization header")
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded
  } catch (error) {
    throw new Error("Invalid token")
  }
}

export async function POST(request) {
  try {
    // Verify user authentication
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { moduleTitle, moduleContent, examType, subject, learnerLevel } = await request.json()

    if (!moduleTitle || !moduleContent) {
      return NextResponse.json({ error: "Module title and content are required" }, { status: 400 })
    }

    console.log(`🔍 Generating resources for module: ${moduleTitle}`)

    // Enhanced resource generation prompt
    const resourcePrompt = `
Generate a comprehensive set of high-quality learning resources for the following module.

MODULE TITLE: ${moduleTitle}
MODULE CONTENT: ${moduleContent}
EXAM TYPE: ${examType || 'General'}
SUBJECT: ${subject || 'General'}
LEARNER LEVEL: ${learnerLevel || 'intermediate'}

Create a curated collection of the BEST resources in each category. Each resource MUST include:
1. Title - Clear, descriptive title
2. URL - Working, direct link to the resource (CRITICAL)
3. Description - Brief explanation of the resource's value (2-3 sentences)
4. Author/Creator - Name of the author, creator, or platform

Generate resources in these categories:
1. Videos (YouTube tutorials, lectures)
2. Articles (blog posts, tutorials, documentation)
3. Books (textbooks, guides, references)
4. Courses (online courses, MOOCs)
5. Tools (software, calculators, simulators)
6. Websites (reference sites, documentation)
7. GitHub repositories (code examples, libraries, projects)
8. Exercises (practice problems, challenges)

CRITICAL REQUIREMENTS:
- Focus on QUALITY over quantity (3-5 excellent resources per category)
- Include ONLY real, accessible resources with WORKING URLs
- Prioritize free resources when possible
- Include a mix of beginner-friendly and advanced resources
- For GitHub links, include ONLY real repositories with substantial content
- For videos, include channel name and direct YouTube links
- For books, include author, publication info, and link to purchase/access
- For tools, include direct download/access links

Return a JSON object with the following structure:
\`\`\`json
{
  "videos": [
    {
      "title": "Complete Guide to [Topic]",
      "url": "https://www.youtube.com/watch?v=example",
      "description": "Comprehensive tutorial covering all aspects of [topic] with practical examples.",
      "creator": "Channel Name"
    }
  ],
  "articles": [...],
  "books": [...],
  "courses": [...],
  "tools": [...],
  "websites": [...],
  "githubRepos": [...],
  "exercises": [...]
}
\`\`\`
`

    let rawResponse = "";
    try {
      rawResponse = await generateContent(resourcePrompt, {
        temperature: 0.7,
        maxOutputTokens: 8192
      })

      console.log("AI Response received, length:", rawResponse?.length)

      // Extract JSON from the response
      let resourceData = null
      
      try {
        // Strategy 1: Try to find and parse complete JSON block
        let jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          let jsonString = jsonMatch[1]
          
          console.log("Raw JSON match (first 200 chars):", jsonString.substring(0, 200))
          
          // Clean the JSON string
          jsonString = jsonString
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .trim()
          
          // Try to fix common JSON issues
          jsonString = jsonString
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)(\w+)(?=\s*:)/g, '$1"$2"') // Add quotes to unquoted keys
            .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
          
          resourceData = JSON.parse(jsonString)
          console.log("Successfully parsed with strategy 1")
        } else {
          // Strategy 2: Try to find JSON without code block markers
          let jsonString = rawResponse.match(/(\{[\s\S]*\})/)?.[1]
          if (jsonString) {
            jsonString = jsonString
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/([{,]\s*)(\w+)(?=\s*:)/g, '$1"$2"')
              .replace(/:\s*'([^']*)'/g, ': "$1"')
              .trim()
            
            resourceData = JSON.parse(jsonString)
            console.log("Successfully parsed with strategy 2")
          }
        }
      } catch (parseError) {
        console.log("JSON parsing failed:", parseError.message)
      }

      // If parsing failed, create a fallback structure
      if (!resourceData) {
        console.log("Creating fallback resource structure")
        resourceData = createFallbackResources(moduleTitle, subject, examType)
      }

      // Validate and clean up resources
      const validatedResources = validateResources(resourceData)

      console.log(`Successfully generated resources with ${countTotalResources(validatedResources)} items`)

      return NextResponse.json({
        success: true,
        resources: validatedResources
      })

    } catch (aiError) {
      console.error("AI generation error:", aiError)
      console.error("Full error details:", {
        message: aiError.message,
        stack: aiError.stack,
        responsePreview: rawResponse ? rawResponse.substring(0, 500) : "No response received"
      })
      
      // Return fallback resources
      const fallbackResources = createFallbackResources(moduleTitle, subject, examType)
      
      return NextResponse.json({
        success: true,
        resources: fallbackResources,
        note: "Generated using fallback method"
      })
    }

  } catch (error) {
    console.error("Resource generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate resources" },
      { status: 500 }
    )
  }
}

// Helper function to create fallback resources
function createFallbackResources(moduleTitle, subject, examType) {
  const searchTerm = encodeURIComponent(`${moduleTitle} ${subject} ${examType}`.trim())
  
  return {
    videos: [
      {
        title: `${moduleTitle} - Complete Tutorial`,
        url: `https://www.youtube.com/results?search_query=${searchTerm}+tutorial`,
        description: `Comprehensive video tutorials explaining ${moduleTitle} concepts with practical examples.`,
        creator: "YouTube"
      },
      {
        title: `${moduleTitle} for ${examType || 'Beginners'}`,
        url: `https://www.youtube.com/results?search_query=${searchTerm}+for+beginners`,
        description: `Step-by-step video guide for learning ${moduleTitle}, perfect for ${examType || 'beginners'}.`,
        creator: "YouTube"
      }
    ],
    articles: [
      {
        title: `Understanding ${moduleTitle}`,
        url: `https://medium.com/search?q=${searchTerm}`,
        description: `In-depth articles explaining the core concepts of ${moduleTitle} with practical applications.`,
        author: "Medium"
      },
      {
        title: `${moduleTitle} - Comprehensive Guide`,
        url: `https://dev.to/search?q=${searchTerm}`,
        description: `Developer-focused tutorials and guides on mastering ${moduleTitle}.`,
        author: "Dev.to"
      }
    ],
    books: [
      {
        title: `${moduleTitle}: A Complete Reference`,
        url: `https://www.amazon.com/s?k=${searchTerm}+book`,
        description: `Comprehensive textbook covering all aspects of ${moduleTitle} with detailed explanations and examples.`,
        author: "Various Authors",
        publisher: "Major Technical Publishers"
      }
    ],
    courses: [
      {
        title: `${moduleTitle} - Comprehensive Course`,
        url: `https://www.coursera.org/search?query=${searchTerm}`,
        description: `Structured online course teaching ${moduleTitle} from fundamentals to advanced concepts.`,
        platform: "Coursera"
      },
      {
        title: `${moduleTitle} Masterclass`,
        url: `https://www.udemy.com/courses/search/?q=${searchTerm}`,
        description: `Hands-on course with projects and exercises to master ${moduleTitle}.`,
        platform: "Udemy"
      }
    ],
    tools: [
      {
        title: `${moduleTitle} Calculator`,
        url: `https://www.google.com/search?q=${searchTerm}+calculator+tool`,
        description: `Online tool for solving ${moduleTitle} problems quickly and accurately.`,
        creator: "Various"
      }
    ],
    websites: [
      {
        title: `${moduleTitle} Documentation`,
        url: `https://www.google.com/search?q=${searchTerm}+documentation`,
        description: `Official documentation and references for ${moduleTitle}.`,
        creator: "Various"
      }
    ],
    githubRepos: [
      {
        title: `${moduleTitle} Examples`,
        url: `https://github.com/search?q=${searchTerm}`,
        description: `Collection of code examples, implementations, and projects related to ${moduleTitle}.`,
        creator: "GitHub Community"
      }
    ],
    exercises: [
      {
        title: `${moduleTitle} Practice Problems`,
        url: `https://www.google.com/search?q=${searchTerm}+practice+problems+exercises`,
        description: `Curated set of practice problems to test and strengthen your understanding of ${moduleTitle}.`,
        creator: "Various"
      }
    ]
  }
}

// Helper function to validate resources
function validateResources(resources) {
  const validatedResources = {}
  const categories = [
    'videos', 'articles', 'books', 'courses', 
    'tools', 'websites', 'githubRepos', 'exercises'
  ]
  
  categories.forEach(category => {
    if (!resources[category] || !Array.isArray(resources[category])) {
      validatedResources[category] = []
    } else {
      validatedResources[category] = resources[category]
        .filter(resource => resource && resource.title && typeof resource.title === 'string')
        .map(resource => ({
          title: resource.title,
          url: resource.url || `https://www.google.com/search?q=${encodeURIComponent(resource.title)}`,
          description: resource.description || `A helpful resource about ${resource.title}`,
          author: resource.author || resource.creator || resource.platform || 'Unknown'
        }))
        .slice(0, 5) // Limit to 5 resources per category
    }
  })
  
  return validatedResources
}

// Helper function to count total resources
function countTotalResources(resources) {
  return Object.values(resources)
    .reduce((total, categoryResources) => total + categoryResources.length, 0)
} 