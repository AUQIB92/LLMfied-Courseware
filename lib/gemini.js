import { GoogleGenerativeAI } from "@google/generative-ai"

// Check if API key is configured
if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY environment variable is not set!")
  console.log("Please set your Gemini API key in your environment variables:")
  console.log("For development: Create a .env.local file with GEMINI_API_KEY=your_api_key_here")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Test function to verify API connection
export async function testGeminiConnection() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set")
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent("Say hello")
    const response = await result.response
    console.log("✅ Gemini API connection successful")
    return { success: true, message: "Connected successfully" }
  } catch (error) {
    console.error("❌ Gemini API connection failed:", error.message)
    return { success: false, error: error.message }
  }
}

export async function generateModuleSummary(content, context = {}) {
  const { 
    learnerLevel = "intermediate", 
    subject = "general", 
    moduleIndex = 1, 
    totalModules = 1 
  } = context

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const prompt = `
    Analyze the following educational content and provide a comprehensive, engaging module breakdown that will be displayed in a beautiful, modern UI with interactive visualizers and simulators.
    
    CONTEXT:
    - Target Learner Level: ${learnerLevel}
    - Subject Category: ${subject}
    - Module Position: ${moduleIndex} of ${totalModules}
    
    REQUIREMENTS FOR ${learnerLevel.toUpperCase()} LEVEL:
    ${learnerLevel === 'beginner' ? `
    - Use simple, clear language and avoid jargon
    - Include foundational concepts and prerequisites
    - Provide step-by-step explanations
    - Focus on building confidence and understanding basics
    ` : ''}
    ${learnerLevel === 'intermediate' ? `
    - Balance theory with practical applications
    - Include moderate complexity examples
    - Connect to real-world scenarios
    - Build on assumed foundational knowledge
    ` : ''}
    ${learnerLevel === 'advanced' ? `
    - Include complex concepts and edge cases
    - Focus on optimization and best practices
    - Provide challenging, industry-relevant examples
    - Assume strong foundational knowledge
    ` : ''}
    ${learnerLevel === 'expert' ? `
    - Cover cutting-edge techniques and research
    - Include advanced architectural patterns
    - Focus on leadership and mentoring aspects
    - Provide expert-level insights and strategies
    ` : ''}
    
    Please provide:
    1. A compelling summary (2-3 sentences appropriate for ${learnerLevel} level, written in an engaging tone)
    2. 4-5 specific, actionable learning objectives (appropriate complexity for ${learnerLevel} learners)
    3. 3-5 concrete, real-world examples relevant to ${subject} and ${learnerLevel} level
    4. Interactive learning components identification:
       - Concepts that would benefit from visual diagrams (flowcharts, comparisons, timelines, etc.)
       - Topics suitable for code simulations or interactive demonstrations
       - Mathematical concepts that need formula visualizations
       - Process-oriented content suitable for step-by-step simulators
    5. Comprehensive, high-quality learning resources appropriate for ${learnerLevel} level including:
       - Recommended books/textbooks (with authors, publication years, and compelling descriptions)
       - Online courses/tutorials (with platform names, URLs when possible, and detailed descriptions)
       - Research papers/articles (with sources, authors, and summaries)
       - Video tutorials/lectures (with creator names, URLs when possible, and engaging descriptions)
       - Practice exercises/assignments (with difficulty levels appropriate for ${learnerLevel})
       - Tools and software recommendations (with types, descriptions, and use cases)
       - Interactive websites and platforms for hands-on practice
    6. Enhanced learning elements:
       - Beautiful summary elements with key insights and practical applications
       - Career relevance for ${subject} field
       - Estimated study time for ${learnerLevel} learners
       - Prerequisites and recommended preparation
       - Difficulty assessment for this specific level
    7. Detailed subsections with:
       - Core concepts broken down for ${learnerLevel} understanding
       - Key terminology with clear definitions
       - Step-by-step explanations where appropriate
       - Common pitfalls and how to avoid them (especially for ${learnerLevel} level)
       - Websites and online resources (with URLs when known and detailed descriptions)
       - Industry case studies (with real-world applications)
    
    Content: ${content}
    
    CRITICAL REQUIREMENTS:
    1. ALL resources MUST include working URLs/links whenever possible
    2. For books: Include Amazon, Google Books, or publisher links
    3. For courses: Include direct course URLs from platforms like Coursera, edX, Udemy, etc.
    4. For videos: Include actual YouTube or Vimeo URLs (https://www.youtube.com/watch?v=... or https://vimeo.com/...)
    5. For articles: Include DOI links, journal URLs, or article URLs
    6. For tools: Include official website URLs
    7. For websites: Include the actual website URLs
    8. If you cannot find a specific URL, provide the most likely official website or search result
    9. Format ALL URLs as complete, clickable links starting with https://
    
    Format your response as JSON with the following enhanced structure:
    {
      "summary": "Engaging module summary that highlights why this topic matters and captures student interest",
      "objectives": ["Students will be able to analyze...", "Students will be able to implement...", "Students will be able to evaluate...", "etc."],
      "examples": ["Concrete real-world example 1 with specific context", "Concrete real-world example 2 with specific context", "etc."],
      "visualizationSuggestions": {
        "hasFlowcharts": true/false,
        "hasComparisons": true/false,
        "hasTimelines": true/false,
        "hasFormulas": true/false,
        "hasProcessSteps": true/false,
        "hasCyclicalProcesses": true/false,
        "hasHierarchies": true/false,
        "hasRelationships": true/false,
        "codeSimulationTopics": ["Topic 1 that needs code demo", "Topic 2 that needs interactive coding", "etc."],
        "interactiveElements": ["Mathematical concepts for sliders/calculators", "Visual concepts for drag-drop", "etc."]
      },
      "beautifulSummaryElements": {
        "keyInsights": ["Compelling insight 1", "Compelling insight 2", "Compelling insight 3"],
        "practicalApplications": ["How this applies in industry", "How this applies in daily life", "How this applies in research"],
        "whyItMatters": "Compelling explanation of the importance and relevance of this topic",
        "careerRelevance": "How mastering this topic impacts career prospects and professional growth",
        "difficultyLevel": "Beginner|Intermediate|Advanced",
        "prerequisites": ["Prerequisite 1", "Prerequisite 2", "etc."],
        "estimatedStudyTime": "X hours of focused study time"
      },
      "resources": {
        "books": [
          {
            "title": "Complete Book Title",
            "author": "Author Name",
            "description": "Compelling description explaining why this book is valuable and what students will gain",
            "year": "2023",
            "difficulty": "Beginner|Intermediate|Advanced",
            "url": "https://amazon.com/... or https://books.google.com/... or publisher URL"
          }
        ],
        "courses": [
          {
            "title": "Complete Course Title",
            "platform": "Platform Name (e.g., Coursera, edX, Udemy)",
            "url": "https://coursera.org/... or https://edx.org/... or https://udemy.com/...",
            "description": "Detailed course description and what students will learn",
            "difficulty": "Beginner|Intermediate|Advanced",
            "duration": "Estimated time to complete"
          }
        ],
        "articles": [
          {
            "title": "Article Title",
            "source": "Publication/Journal Name",
            "description": "Article summary and key insights",
            "url": "https://doi.org/... or https://journal-website.com/... or article URL"
          }
        ],
        "videos": [
          {
            "title": "Video Title",
            "creator": "Creator/Channel Name",
            "url": "https://www.youtube.com/watch?v=... or https://vimeo.com/...",
            "description": "Engaging description of video content and learning value",
            "duration": "Video length if known"
          }
        ],
        "tools": [
          {
            "name": "Tool Name",
            "type": "Software|Online Tool|Mobile App|etc.",
            "description": "How this tool helps with learning and practical application",
            "url": "https://tool-official-website.com"
          }
        ],
        "websites": [
          {
            "name": "Website/Resource Name",
            "url": "https://website-url.com",
            "description": "What students can find here and how it supports learning"
          }
        ],
        "exercises": [
          {
            "title": "Exercise/Project Title",
            "difficulty": "Beginner|Intermediate|Advanced",
            "description": "Clear description of the exercise and learning outcomes",
            "estimatedTime": "Time to complete",
            "type": "Coding|Theory|Design|Analysis|Practical",
            "url": "https://exercise-or-tutorial-website.com (if available)"
          }
        ]
      },
      "detailedSubsections": [
        {
          "title": "Subsection Title",
          "summary": "Brief overview of what this subsection covers",
          "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
          "explanation": "Detailed explanation that will be displayed as beautiful formatted content",
          "practicalExample": "Real-world example that demonstrates the concept",
          "needsVisualization": true/false,
          "visualizationType": "flowchart|comparison|timeline|formula|process|cycle|hierarchy|relationship",
          "needsCodeSimulation": true/false,
          "simulationType": "algorithm|data-structure|mathematical|visual|interactive",
          "difficulty": "Beginner|Intermediate|Advanced",
          "estimatedTime": "5-10 minutes"
        }
      ]
    }
  `

  const result = await model.generateContent(prompt)
  const response = await result.response
  const responseText = response.text()

  try {
    console.log("Processing LLM response for module summary...")
    
    // Try to find valid JSON in the response (sometimes the model adds extra text before/after the JSON)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No valid JSON object found in response");
      throw new Error("No valid JSON found in response");
    }
    
    const jsonText = jsonMatch[0];
    console.log("Found JSON in the response");
    
    // Parse the JSON with extra safeguards
    const parsed = JSON.parse(jsonText);
    console.log("Successfully parsed JSON response");
    
    // Handle both structured resources object and array of resources
    let formattedResources = {
      books: [],
      courses: [],
      articles: [],
      videos: [],
      tools: [],
      websites: [],
      exercises: []
    };
    
    // Helper function to ensure all resources have URLs
    const ensureResourceUrl = (resource, type) => {
      if (!resource.url || resource.url.trim() === '') {
        const title = resource.title || resource.name || 'resource';
        console.log(`Adding fallback URL for ${type} resource: "${title}"`);
        
        const searchQuery = encodeURIComponent(title);
        
        switch(type) {
          case 'books':
            resource.url = `https://www.amazon.com/s?k=${searchQuery}`;
            break;
          case 'courses':
            resource.url = `https://www.coursera.org/search?query=${searchQuery}`;
            break;
          case 'articles':
            resource.url = `https://scholar.google.com/scholar?q=${searchQuery}`;
            break;
          case 'videos':
            resource.url = `https://www.youtube.com/results?search_query=${searchQuery}`;
            break;
          case 'tools':
            resource.url = `https://www.google.com/search?q=${searchQuery}+tool+software`;
            break;
          case 'websites':
            resource.url = `https://www.google.com/search?q=${searchQuery}`;
            break;
          case 'exercises':
            resource.url = `https://www.google.com/search?q=${searchQuery}+exercise+tutorial`;
            break;
          default:
            resource.url = `https://www.google.com/search?q=${searchQuery}`;
        }
      }
      return resource;
    };
    
    if (parsed.resources) {
      // Check if resources is already categorized
      if (typeof parsed.resources === 'object' && !Array.isArray(parsed.resources)) {
        console.log("Resources are already in categorized format");
        // It's already in the format we want, just make sure all arrays exist and have URLs
        formattedResources = {
          books: Array.isArray(parsed.resources.books) ? parsed.resources.books.map(r => ensureResourceUrl(r, 'books')) : [],
          courses: Array.isArray(parsed.resources.courses) ? parsed.resources.courses.map(r => ensureResourceUrl(r, 'courses')) : [],
          articles: Array.isArray(parsed.resources.articles) ? parsed.resources.articles.map(r => ensureResourceUrl(r, 'articles')) : [],
          videos: Array.isArray(parsed.resources.videos) ? parsed.resources.videos.map(r => ensureResourceUrl(r, 'videos')) : [],
          tools: Array.isArray(parsed.resources.tools) ? parsed.resources.tools.map(r => ensureResourceUrl(r, 'tools')) : [],
          websites: Array.isArray(parsed.resources.websites) ? parsed.resources.websites.map(r => ensureResourceUrl(r, 'websites')) : [],
          exercises: Array.isArray(parsed.resources.exercises) ? parsed.resources.exercises.map(r => ensureResourceUrl(r, 'exercises')) : []
        };
      } 
      // If resources is an array of typed resources, categorize them
      else if (Array.isArray(parsed.resources)) {
        console.log("Resources are in array format, categorizing...");
        parsed.resources.forEach(resource => {
          if (!resource || !resource.type) return;
          
          // Determine resource type
          const type = resource.type.toLowerCase();
          let category;
          
          switch(type) {
            case 'book':
              category = 'books';
              break;
            case 'course':
              category = 'courses';
              break;
            case 'article':
              category = 'articles';
              break;
            case 'video':
              category = 'videos';
              break;
            case 'tool':
              category = 'tools';
              break;
            case 'website':
              category = 'websites';
              break;
            case 'exercise':
              category = 'exercises';
              break;
            default:
              category = 'websites';
          }
          
          // Ensure URL exists and push to appropriate category
          formattedResources[category].push(ensureResourceUrl(resource, category));
        });
        console.log("Categorized resources:", {
          books: formattedResources.books.length,
          courses: formattedResources.courses.length,
          articles: formattedResources.articles.length,
          videos: formattedResources.videos.length,
          tools: formattedResources.tools.length,
          websites: formattedResources.websites.length,
          exercises: formattedResources.exercises.length
        });
      }
    }
    
    // Final check to ensure all resources have URLs
    Object.keys(formattedResources).forEach(resourceType => {
      formattedResources[resourceType] = formattedResources[resourceType].map(resource => {
        return ensureResourceUrl(resource, resourceType);
      });
    });
    
    const result = {
      summary: parsed.summary || responseText.substring(0, 150) + '...',
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
      examples: Array.isArray(parsed.examples) ? parsed.examples : [],
      resources: formattedResources,
      // Add new enhanced fields
      visualizationSuggestions: parsed.visualizationSuggestions || {
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
      beautifulSummaryElements: parsed.beautifulSummaryElements || {
        keyInsights: [],
        practicalApplications: [],
        whyItMatters: "This topic is important for understanding the subject area.",
        careerRelevance: "Understanding this topic can enhance your professional skills.",
        difficultyLevel: "Intermediate",
        prerequisites: [],
        estimatedStudyTime: "2-3 hours"
      },
      detailedSubsections: Array.isArray(parsed.detailedSubsections) ? parsed.detailedSubsections : []
    };
    
    console.log("Successfully processed module summary");
    return result;
  } catch (error) {
    console.error("Error processing Gemini response:", error)
    console.error("Response excerpt:", responseText.substring(0, 200))
    
    // Try to extract at least some content if possible
    let summary = responseText.substring(0, 150) + '...';
    let objectives = [];
    let examples = [];
    
    // Try to extract sections with regex even if JSON parsing fails
    try {
      // Extract summary if possible
      const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]+)"/);
      if (summaryMatch && summaryMatch[1]) {
        summary = summaryMatch[1];
      }
      
      // Extract objectives if possible
      const objectivesMatch = responseText.match(/"objectives"\s*:\s*\[(.*?)\]/s);
      if (objectivesMatch && objectivesMatch[1]) {
        const objectiveItems = objectivesMatch[1].match(/"([^"]+)"/g);
        if (objectiveItems) {
          objectives = objectiveItems.map(item => item.replace(/"/g, ''));
        }
      }
      
      // Extract examples if possible
      const examplesMatch = responseText.match(/"examples"\s*:\s*\[(.*?)\]/s);
      if (examplesMatch && examplesMatch[1]) {
        const exampleItems = examplesMatch[1].match(/"([^"]+)"/g);
        if (exampleItems) {
          examples = exampleItems.map(item => item.replace(/"/g, ''));
        }
      }
      
      console.log("Extracted partial content despite parsing error");
    } catch (extractError) {
      console.error("Failed to extract partial content:", extractError);
    }
    
    // Even in error case, try to extract any resource mentions and create fallback URLs
    let extractedResources = {
      books: [],
      courses: [],
      articles: [],
      videos: [],
      tools: [],
      websites: [],
      exercises: []
    };
    
    // Try to at least extract resource titles and create fallback URLs
    try {
      // Common patterns for resources in the text
      const bookMatches = responseText.match(/"title"\s*:\s*"([^"]+)".*?"book/gi);
      const courseMatches = responseText.match(/"title"\s*:\s*"([^"]+)".*?"course/gi);
      const videoMatches = responseText.match(/"title"\s*:\s*"([^"]+)".*?"video/gi);
      
      // Create basic resources with fallback URLs from any matches
      if (bookMatches) {
        bookMatches.forEach(match => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.books.push({
              title,
              description: `A book related to this topic`,
              url: `https://www.amazon.com/s?k=${encodeURIComponent(title)}`
            });
          }
        });
      }
      
      if (courseMatches) {
        courseMatches.forEach(match => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.courses.push({
              title,
              description: `A course related to this topic`,
              url: `https://www.coursera.org/search?query=${encodeURIComponent(title)}`
            });
          }
        });
      }
      
      if (videoMatches) {
        videoMatches.forEach(match => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.videos.push({
              title,
              description: `A video related to this topic`,
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`
            });
          }
        });
      }
      
      console.log("Extracted basic resources despite parsing error");
    } catch (extractError) {
      console.error("Failed to extract resources from malformed response:", extractError);
    }
    
    return {
      summary,
      objectives,
      examples,
      resources: extractedResources
    }
  }
}

export async function generateQuiz(moduleContent, difficulty = "medium") {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const prompt = `
    Based on this educational content, generate a ${difficulty} difficulty quiz with 5 multiple choice questions.
    
    Content: ${moduleContent}
    
    Format as JSON with structure:
    {
      "questions": [
        {
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correct": 0,
          "explanation": "Why this answer is correct"
        }
      ]
    }
  `

  const result = await model.generateContent(prompt)
  const response = await result.response
  const responseText = response.text()

  try {
    // Try to find valid JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    // Parse the JSON with safeguards
    const parsed = JSON.parse(jsonText);
    return parsed && parsed.questions ? parsed : { questions: [] }
  } catch (error) {
    console.error("Error parsing quiz response:", error);
    return { questions: [] }
  }
}

export async function generateTutorResponse(question, moduleContent, chatHistory = []) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const context = `
    You are an AI tutor helping a student learn about this topic:
    ${moduleContent}
    
    Previous conversation:
    ${chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}
    
    Student question: ${question}
    
    Provide a helpful, encouraging response that:
    - Directly answers their question
    - Uses simple language
    - Provides examples when helpful
    - Encourages further learning
  `

  const result = await model.generateContent(context)
  const response = await result.response
  return response.text()
}
