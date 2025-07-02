import { GoogleGenerativeAI } from "@google/generative-ai"

// Check if API key is configured
if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY environment variable is not set!")
  console.log("Please set your Gemini API key in your environment variables:")
  console.log("For development: Create a .env.local file with GEMINI_API_KEY=your_api_key_here")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Helper function for robust Gemini API calls with retry logic
async function callGeminiWithRetry(model, prompt, maxRetries = 3, retryDelay = 2000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Attempting Gemini API call (attempt ${attempt}/${maxRetries})`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      console.log(`✅ Gemini API call successful on attempt ${attempt}`);
      return responseText;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Gemini API call failed on attempt ${attempt}:`, error.message);
      
      // Check if it's a rate limiting error
      if (error.message.includes('quota') || error.message.includes('rate')) {
        console.log(`⏳ Rate limit detected, waiting ${retryDelay * 2}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * 2));
      }
      // Check if it's a network error
      else if (error.message.includes('fetch failed') || error.message.includes('network')) {
        console.log(`🌐 Network error detected, waiting ${retryDelay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      // For other errors, wait shorter time
      else {
        console.log(`⚠️ API error detected, waiting ${retryDelay / 2}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, retryDelay / 2));
      }
      
      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff
        retryDelay *= 1.5;
      }
    }
  }
  
  // If all retries failed, throw the last error with context
  throw new Error(`Gemini API failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

// Test function to verify API connection
export async function testGeminiConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const responseText = await callGeminiWithRetry(model, "Say 'Hello World' if you can read this.", 2, 1000);
    return { success: true, response: responseText }
  } catch (error) {
    console.error("Gemini connection test failed:", error)
    return { success: false, error: error.message }
  }
}

// Generic content generation function for various AI tasks
export async function generateContent(prompt, options = {}) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: options.model || "gemini-2.0-flash",
      generationConfig: {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxOutputTokens || 8192,
      }
    });

    const responseText = await callGeminiWithRetry(model, prompt, 3, 2000);
    return responseText;
  } catch (error) {
    console.error("Generate content failed:", error);
    throw error;
  }
}

// Helper function to repair common JSON syntax issues
function repairJsonString(jsonStr) {
  console.log("Attempting to repair JSON string...");
  
  let repaired = jsonStr.trim();
  
  try {
    // First, try to clean up the string structure
    
    // 1. Remove markdown code blocks
    repaired = repaired.replace(/```json\s*/gi, '');
    repaired = repaired.replace(/```\s*$/gi, '');
    
    // 2. Remove any text before first { and after last }
    const firstBrace = repaired.indexOf('{');
    const lastBrace = repaired.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      repaired = repaired.substring(firstBrace, lastBrace + 1);
    }
    
    // 3. Fix unescaped quotes inside strings (more robust approach)
    // Look for quotes that should be escaped
    repaired = repaired.replace(/([^\\])"([^"]*[^\\])"([^,:}\]\s])/g, '$1\\"$2\\"$3');
    
    // 4. Fix common control characters that break JSON parsing
    repaired = repaired.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
    repaired = repaired.replace(/\n/g, '\\n'); // Escape actual newlines in strings
    repaired = repaired.replace(/\r/g, '\\r'); // Escape carriage returns
    repaired = repaired.replace(/\t/g, '\\t'); // Escape tabs
    
    // 5. Fix trailing commas before closing braces/brackets
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // 6. Fix missing commas between array elements and object properties
    repaired = repaired.replace(/}(\s*){/g, '},$1{');
    repaired = repaired.replace(/](\s*)\[/g, '],$1[');
    repaired = repaired.replace(/}(\s*)"[^"]*":/g, '},$1"$&":');
    
    // 7. Fix multiple consecutive commas
    repaired = repaired.replace(/,(\s*,)+/g, ',');
    
    // 8. Fix empty values (replace empty after colon with null)
    repaired = repaired.replace(/:\s*,/g, ': null,');
    repaired = repaired.replace(/:\s*}/g, ': null}');
    repaired = repaired.replace(/:\s*]/g, ': null]');
    
    // 9. Ensure proper string closure
    let inString = false;
    let escaped = false;
    let quoteCount = 0;
    
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        quoteCount++;
        inString = !inString;
      }
    }
    
    // If we have an odd number of quotes, close the string
    if (quoteCount % 2 !== 0) {
      repaired += '"';
    }
    
    // 10. Balance brackets and braces
    let braceCount = 0;
    let bracketCount = 0;
    
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }
    
    // Add missing closing characters
    while (braceCount > 0) {
      repaired += '}';
      braceCount--;
    }
    
    while (bracketCount > 0) {
      repaired += ']';
      bracketCount--;
    }
    
    // Final cleanup - remove trailing commas again after balancing
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    console.log("JSON repair completed");
    return repaired;
    
  } catch (error) {
    console.log("JSON repair encountered error:", error.message);
    return jsonStr; // Return original if repair fails
  }
}

// Helper function to parse JSON progressively (try smaller chunks)
function parseJsonProgressive(jsonStr) {
  console.log("Attempting progressive JSON parsing...");
  
  try {
    // Start with aggressive truncation percentages
    const percentages = [95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10];
    
    for (const percentage of percentages) {
      try {
        const length = Math.floor(jsonStr.length * (percentage / 100));
        let truncated = jsonStr.substring(0, length);
        
        // Find a good break point by looking for complete sections
        truncated = findLastCompleteSection(truncated);
        
        // Apply repairs to the truncated version
        const repaired = repairJsonString(truncated);
        
        // Try to parse
        const parsed = JSON.parse(repaired);
        
        console.log(`Successfully parsed JSON at ${length} characters (${percentage}% of original)`);
        return parsed;
        
      } catch (error) {
        console.log(`Failed to parse at ${percentage}%, trying shorter...`);
        continue;
      }
    }
    
    // Final attempt - extract minimal structure
    console.log("Attempting minimal JSON extraction...");
    const minimalJson = extractMinimalJson(jsonStr);
    if (minimalJson) {
      console.log("Extracting minimal JSON structure...");
      const parsed = JSON.parse(minimalJson);
      console.log("Successfully parsed minimal JSON structure");
      return parsed;
    }
    
  } catch (error) {
    console.log("Progressive parsing failed:", error.message);
  }
  
  console.log("Progressive parsing failed");
  return null;
}

// Helper function to find the last complete JSON section
function findLastCompleteSection(jsonStr) {
  try {
    // Look for patterns that indicate complete sections
    const patterns = [
      /},\s*"[^"]*":\s*{[^}]*}$/m,  // Complete object property
      /],\s*"[^"]*":\s*\[[^\]]*\]$/m, // Complete array property
      /"\s*}$/m,  // String ending an object
      /\]\s*}$/m, // Array ending an object
      /}\s*$/m    // Just object ending
    ];
    
    // Try each pattern to find a good cut point
    for (const pattern of patterns) {
      const match = jsonStr.match(pattern);
      if (match) {
        const cutPoint = match.index + match[0].length;
        if (cutPoint < jsonStr.length * 0.9) { // Don't cut too little
          return jsonStr.substring(0, cutPoint);
        }
      }
    }
    
    // Fallback: look for complete braces/brackets
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escaped = false;
    let lastValidIndex = 0;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && bracketCount === 0) {
            lastValidIndex = i + 1;
          }
        } else if (char === '[') {
          bracketCount++;
        } else if (char === ']') {
          bracketCount--;
          if (braceCount === 0 && bracketCount === 0) {
            lastValidIndex = i + 1;
          }
        }
      }
    }
    
    return lastValidIndex > 0 ? jsonStr.substring(0, lastValidIndex) : jsonStr;
    
  } catch (error) {
    console.log("Error in findLastCompleteSection:", error.message);
    return jsonStr;
  }
}

// Helper function to extract minimal JSON with just essential fields
function extractMinimalJson(jsonStr) {
  console.log("Extracting minimal JSON structure...");
  
  try {
    // Try to extract just the essential fields in order
    const summaryMatch = jsonStr.match(/"summary"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    const objectivesMatch = jsonStr.match(/"objectives"\s*:\s*\[(.*?)\]/s);
    const examplesMatch = jsonStr.match(/"examples"\s*:\s*\[(.*?)\]/s);
    
    let minimalJson = '{';
    
    if (summaryMatch) {
      minimalJson += `"summary": ${JSON.stringify(summaryMatch[1])},`;
    }
    
    if (objectivesMatch) {
      minimalJson += `"objectives": [${objectivesMatch[1]}],`;
    }
    
    if (examplesMatch) {
      minimalJson += `"examples": [${examplesMatch[1]}],`;
    }
    
    // Add minimal required structures
    minimalJson += `"resources": {
      "books": [],
      "courses": [],
      "articles": [],
      "videos": [],
      "tools": [],
      "websites": [],
      "exercises": []
    },
    "visualizationSuggestions": {
      "hasFlowcharts": false,
      "hasComparisons": false,
      "hasTimelines": false,
      "hasFormulas": false,
      "hasProcessSteps": false,
      "hasCyclicalProcesses": false,
      "hasHierarchies": false,
      "hasRelationships": false,
      "codeSimulationTopics": [],
      "interactiveElements": []
    },
    "beautifulSummaryElements": {
      "keyInsights": [],
      "practicalApplications": [],
      "whyItMatters": "This topic is important for understanding the subject area.",
      "careerRelevance": "Understanding this topic can enhance your professional skills.",
      "difficultyLevel": "Intermediate",
      "prerequisites": [],
      "estimatedStudyTime": "2-3 hours"
    },
    "detailedSubsections": []`;
    
    minimalJson += '}';
    
    return minimalJson;
  } catch (error) {
    console.log("Failed to create minimal JSON:", error);
    return null;
  }
}

// Helper function to extract data using regex when JSON parsing fails
function extractDataWithRegex(responseText) {
  console.log("Extracting data with regex fallback...");
  
  const result = {
    summary: "",
    objectives: [],
    examples: [],
    resources: {
      books: [],
      courses: [],
      articles: [],
      videos: [],
      tools: [],
      websites: [],
      exercises: []
    },
    visualizationSuggestions: {
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
    beautifulSummaryElements: {
      keyInsights: [],
      practicalApplications: [],
      whyItMatters: "This topic is important for understanding the subject area.",
      careerRelevance: "Understanding this topic can enhance your professional skills.",
      difficultyLevel: "Intermediate",
      prerequisites: [],
      estimatedStudyTime: "2-3 hours"
    },
    detailedSubsections: []
  };
  
  try {
    // Extract summary
    const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]+)"/);
    if (summaryMatch && summaryMatch[1]) {
      result.summary = summaryMatch[1];
    } else {
      // Fallback: use first 200 characters
      result.summary = responseText.substring(0, 200).replace(/[{}"]/g, '') + '...';
    }
    
    // Extract objectives array
    const objectivesMatch = responseText.match(/"objectives"\s*:\s*\[(.*?)\]/s);
    if (objectivesMatch && objectivesMatch[1]) {
      const objectiveItems = objectivesMatch[1].match(/"([^"]+)"/g);
      if (objectiveItems) {
        result.objectives = objectiveItems.map(item => item.replace(/"/g, ''));
      }
    }
    
    // Extract examples array
    const examplesMatch = responseText.match(/"examples"\s*:\s*\[(.*?)\]/s);
    if (examplesMatch && examplesMatch[1]) {
      const exampleItems = examplesMatch[1].match(/"([^"]+)"/g);
      if (exampleItems) {
        result.examples = exampleItems.map(item => item.replace(/"/g, ''));
      }
    }
    
    // Enhanced detailed subsections extraction with multiple strategies
    const detailedSubsections = [];
    
    // Strategy 1: Try to extract complete detailedSubsections array
    const subsectionsMatch = responseText.match(/"detailedSubsections"\s*:\s*\[(.*?)\]/s);
    if (subsectionsMatch && subsectionsMatch[1]) {
      try {
        // Try to parse individual subsections from the array content
        const subsectionContent = subsectionsMatch[1];
        
        // Find all complete subsection objects
        const subsectionObjectMatches = subsectionContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (subsectionObjectMatches) {
          subsectionObjectMatches.forEach((subsectionStr, index) => {
            try {
              // Try to parse each subsection individually
              const repairedSubsection = repairJsonString(subsectionStr);
              const subsection = JSON.parse(repairedSubsection);
              detailedSubsections.push(subsection);
            } catch (error) {
              // If parsing fails, extract manually with regex
              const title = extractFieldFromObject(subsectionStr, 'title') || `Section ${index + 1}`;
              const summary = extractFieldFromObject(subsectionStr, 'summary') || `AI-generated content for ${title}`;
              
              detailedSubsections.push({
                title: title,
                summary: summary,
                keyPoints: extractArrayFromObject(subsectionStr, 'keyPoints') || [],
                explanation: extractFieldFromObject(subsectionStr, 'explanation') || `Detailed explanation for ${title}`,
                practicalExample: extractFieldFromObject(subsectionStr, 'practicalExample') || `Practical example for ${title}`,
                difficulty: extractFieldFromObject(subsectionStr, 'difficulty') || "Intermediate",
                estimatedTime: extractFieldFromObject(subsectionStr, 'estimatedTime') || "15-20 minutes"
              });
            }
          });
        }
      } catch (error) {
        console.log("Failed to parse subsections array, using basic extraction");
      }
    }
    
    // Strategy 2: If Strategy 1 failed or found no subsections, try individual title extraction
    if (detailedSubsections.length === 0) {
      const titleMatches = responseText.match(/"title"\s*:\s*"([^"]+)"/g);
      if (titleMatches && titleMatches.length > 3) { // Skip the first few which might be from other sections
        // Take titles that appear to be from detailedSubsections (usually later in the response)
        const subsectionTitles = titleMatches.slice(-Math.min(8, titleMatches.length - 2)); // Take last 8 or skip first 2
        
        subsectionTitles.forEach((match, index) => {
          const title = match.match(/"title"\s*:\s*"([^"]+)"/)[1];
          detailedSubsections.push({
            title: title,
            summary: `AI-generated content for ${title}`,
            keyPoints: [],
            explanation: `Detailed explanation for ${title} will be available once the full content is processed.`,
            practicalExample: `Practical example for ${title}`,
            difficulty: "Intermediate",
            estimatedTime: "15-20 minutes"
          });
        });
      }
    }
    
    // Strategy 3: If still no subsections, create some based on common patterns
    if (detailedSubsections.length === 0) {
      // Look for section headings or common educational patterns
      const headingPatterns = [
        /"([^"]*(?:Introduction|Basics|Fundamentals|Overview)[^"]*)"/gi,
        /"([^"]*(?:Implementation|Application|Practice)[^"]*)"/gi,
        /"([^"]*(?:Advanced|Expert|Complex)[^"]*)"/gi,
        /"([^"]*(?:Examples|Case Studies|Real-world)[^"]*)"/gi
      ];
      
      headingPatterns.forEach(pattern => {
        const matches = responseText.match(pattern);
        if (matches && matches.length > 0) {
          matches.slice(0, 2).forEach(match => { // Limit to 2 per pattern
            const title = match.replace(/"/g, '');
            if (title.length > 10 && !detailedSubsections.some(s => s.title === title)) {
              detailedSubsections.push({
                title: title,
                summary: `AI-generated content for ${title}`,
                keyPoints: [],
                explanation: `Detailed explanation for ${title}`,
                practicalExample: `Practical example for ${title}`,
                difficulty: "Intermediate",
                estimatedTime: "15-20 minutes"
              });
            }
          });
        }
      });
    }
    
    result.detailedSubsections = detailedSubsections;
    
    console.log("Successfully extracted data with regex fallback");
    console.log("Extracted content:", {
      summaryLength: result.summary.length,
      objectivesCount: result.objectives.length,
      examplesCount: result.examples.length,
      subsectionsCount: result.detailedSubsections.length
    });
    
  } catch (regexError) {
    console.error("Even regex extraction failed:", regexError);
    result.summary = "Content processing encountered an error, but the module was created successfully.";
  }
  
  return result;
}

// Helper functions for extracting fields from malformed JSON objects
function extractFieldFromObject(objectStr, fieldName) {
  try {
    const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i');
    const match = objectStr.match(pattern);
    return match ? match[1].replace(/\\"/g, '"') : null;
  } catch (error) {
    return null;
  }
}

function extractArrayFromObject(objectStr, fieldName) {
  try {
    const pattern = new RegExp(`"${fieldName}"\\s*:\\s*\\[(.*?)\\]`, 'si');
    const match = objectStr.match(pattern);
    if (match && match[1]) {
      const arrayContent = match[1];
      const items = arrayContent.match(/"([^"]*(?:\\.[^"]*)*)"/g);
      return items ? items.map(item => item.replace(/^"|"$/g, '').replace(/\\"/g, '"')) : [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

export async function generateModuleSummary(content, context = {}) {
  // Ensure responseText is defined in outer scope for error handling
  let responseText = "";

  const { 
    learnerLevel = "intermediate", 
    subject = "general", 
    moduleIndex = 1, 
    totalModules = 1 
  } = context

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

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
       - Video tutorials/lectures (see note below)
       - Practice exercises/assignments (with difficulty levels appropriate for ${learnerLevel})
       - Tools and software recommendations (with types, descriptions, and use cases)
       - Interactive websites and platforms for hands-on practice
    6. Enhanced learning elements:
       - Beautiful summary elements with key insights and practical applications
       - Career relevance for ${subject} field
       - Estimated study time for ${learnerLevel} learners
       - Prerequisites and recommended preparation
       - Difficulty assessment for this specific level
    7. Detailed subsections with MULTI-PAGE EXPLANATIONS:
       - Core concepts broken down for ${learnerLevel} understanding
       - Key terminology with clear definitions
       - Step-by-step explanations where appropriate
       - Common pitfalls and how to avoid them (especially for ${learnerLevel} level)
       - Websites and online resources (with URLs when known and detailed descriptions)
       - Industry case studies (with real-world applications)
       
       IMPORTANT: For each detailed subsection, create MULTIPLE PAGES of explanation:
       - Page 1: Introduction & Foundation (200-300 words) - Basic concepts, definitions, context
       - Page 2: Deep Dive & Analysis (200-300 words) - Technical details, mechanisms, processes  
       - Page 3: Applications & Implementation (200-300 words) - Real-world uses, advanced concepts
       - Create 2-4 pages per subsection depending on complexity
       - Each page should have a clear title and key takeaway
       - Content should flow naturally from basic to advanced across pages
    
    Content: ${content}
    
    CRITICAL REQUIREMENTS:
    1. ALL resources MUST include working URLs/links whenever possible. Prioritize authoritative and reputable sources (e.g., academic institutions, established publishers, official documentation).
    2. For books: Include Amazon, Google Books, or publisher links
    3. For courses: Include direct course URLs from platforms like Coursera, edX, Udemy, etc.
    4. For videos: 
       - Provide the EXACT, working URL for the video if found. 
       - If an exact URL cannot be found, provide a \`searchQuery\` and explicitly state that the URL is unconfirmed.
       - Prioritize videos from official channels, educational institutions, or highly reputable creators.
       - Include: Video Title, Creator/Channel Name, Source Platform (e.g., YouTube, Vimeo, Khan Academy), Short Description, and Duration (if known).
    5. For articles: Include DOI links, journal URLs, or article URLs
    6. For tools: Include official website URLs
    7. For websites: Include the actual website URLs
    8. If you cannot find a specific URL, provide the most likely official website or search result.
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
            "source_platform": "YouTube|Vimeo|Khan Academy|etc.",
            "exact_url": "https://www.youtube.com/watch?v=... (if found, otherwise null)",
            "searchQuery": "site:youtube.com Video Title Creator Name (if exact_url is null)",
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
          "explanationPages": [
            {
              "pageNumber": 1,
              "pageTitle": "Introduction to [Concept]",
              "content": "First page of detailed explanation - foundational concepts, definitions, and overview (200-300 words)",
              "keyTakeaway": "Main point for this page"
            },
            {
              "pageNumber": 2,
              "pageTitle": "Deep Dive into [Specific Aspect]",
              "content": "Second page of detailed explanation - deeper analysis, technical details, or specific mechanisms (200-300 words)",
              "keyTakeaway": "Main point for this page"
            },
            {
              "pageNumber": 3,
              "pageTitle": "Advanced Applications & Implementation",
              "content": "Third page of detailed explanation - advanced concepts, real-world applications, or implementation details (200-300 words)",
              "keyTakeaway": "Main point for this page"
            }
          ],
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

    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON inside a single Markdown code block.
    • Begin the response with three backticks followed by the word json (\`\`\`json) on its own line.
    • End the response with three backticks (\`\`\`).
    • Do NOT include any additional commentary, explanation, or prose outside the code block.
    • Ensure the JSON is completely valid and self-contained.
  `;

  try {
    console.log("Processing LLM response for module summary...");
    
    responseText = await callGeminiWithRetry(model, prompt, 5, 3000); // More retries for complex operations
    
    console.log(`Response size: ${responseText.length} characters`);
    
    // Early detection of problematic characters in the response
    const problematicChars = responseText.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g);
    if (problematicChars) {
      console.log(`⚠️ Found ${problematicChars.length} problematic control characters in response`);
    }
    
    // Check for malformed escape sequences
    const badEscapes = responseText.match(/\\[^"\\\/bfnrt]/g);
    if (badEscapes) {
      console.log(`⚠️ Found ${badEscapes.length} potentially malformed escape sequences`);
    }

    // Check for extremely large responses and truncate if necessary
    let processedResponseText = responseText;
    const MAX_RESPONSE_SIZE = 100000; // 100KB limit
    
    if (responseText.length > MAX_RESPONSE_SIZE) {
      console.log(`Response is very large (${responseText.length} chars), truncating to ${MAX_RESPONSE_SIZE} chars`);
      processedResponseText = responseText.substring(0, MAX_RESPONSE_SIZE);
      
      // Try to find a natural break point (complete JSON sections)
      const lastBraceIndex = processedResponseText.lastIndexOf('}');
      const lastBracketIndex = processedResponseText.lastIndexOf(']');
      const cutoffPoint = Math.max(lastBraceIndex, lastBracketIndex);
      
      if (cutoffPoint > MAX_RESPONSE_SIZE * 0.8) { // If we find a good cutoff point within 80% of the limit
        processedResponseText = processedResponseText.substring(0, cutoffPoint + 1);
        console.log(`Truncated at natural break point: ${processedResponseText.length} characters`);
      }
    }
    
    // Enhanced JSON parsing with multiple fallback strategies
    let parsed = null;
    let jsonText = null;
    
    // Strategy 1: Try to find and parse complete JSON
    const jsonMatch = processedResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
      console.log(`Found JSON in the response (${jsonText.length} characters)`);
      
      try {
        // Pre-sanitize JSON before parsing to handle common issues
        let sanitizedJson = jsonText;
        
        // Remove or escape problematic characters that commonly cause parse errors
        sanitizedJson = sanitizedJson.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Remove control chars
        sanitizedJson = sanitizedJson.replace(/\\'/g, "'"); // Fix escaped single quotes
        sanitizedJson = sanitizedJson.replace(/\\"/g, '"'); // Normalize escaped quotes
        sanitizedJson = sanitizedJson.replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2'); // Fix unescaped backslashes
        
        parsed = JSON.parse(sanitizedJson);
        console.log("Successfully parsed JSON response");
      } catch (parseError) {
        console.log("Initial JSON parse failed, trying repair strategies...");
        console.log(`Parse error: ${parseError.message}`);
        
        // Strategy 2: Try to repair common JSON issues
        try {
          const repairedJson = repairJsonString(jsonText);
          parsed = JSON.parse(repairedJson);
          console.log("Successfully parsed repaired JSON");
        } catch (repairError) {
          console.log("JSON repair failed, attempting progressive parsing...");
          console.log(`Repair error: ${repairError.message}`);
          
          // Strategy 3: Progressive parsing - try parsing truncated versions
          try {
            parsed = parseJsonProgressive(jsonText);
            if (parsed) {
              console.log("Successfully parsed with progressive method");
            }
          } catch (progressiveError) {
            console.log("Progressive parsing also failed:", progressiveError.message);
          }
        }
      }
    }
    
    // Strategy 4: If all JSON parsing fails, extract data with regex
    if (!parsed) {
      console.log("All JSON parsing strategies failed, using regex extraction...");
      try {
        parsed = extractDataWithRegex(processedResponseText);
      } catch (regexError) {
        console.log("Regex extraction also failed, creating minimal fallback structure...");
        
        // Ultimate fallback - create a basic structure that will work
        parsed = {
          summary: "AI-generated content is being processed. Please try again in a moment.",
          objectives: [
            "Understand the key concepts covered in this module",
            "Apply the learned principles to practical scenarios",
            "Identify important relationships and patterns"
          ],
          examples: [
            "Real-world application example",
            "Practical implementation case",
            "Industry use case scenario"
          ],
          resources: {
            books: [],
            courses: [],
            articles: [],
            videos: [],
            tools: [],
            websites: [],
            exercises: []
          },
          visualizationSuggestions: {
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
          beautifulSummaryElements: {
            keyInsights: ["Important concepts will be available once processing completes"],
            practicalApplications: ["Real-world applications will be identified"],
            whyItMatters: "This topic provides foundational knowledge for the subject area.",
            careerRelevance: "Understanding these concepts enhances professional capabilities.",
            difficultyLevel: context.learnerLevel || "Intermediate",
            prerequisites: [],
            estimatedStudyTime: "2-3 hours"
          },
          detailedSubsections: [
            {
              title: "Core Concepts",
              summary: "Fundamental concepts and principles",
              keyPoints: ["Key concept 1", "Key concept 2", "Key concept 3"],
              explanation: "Detailed explanations will be available once the content is fully processed.",
              practicalExample: "Practical examples will be provided",
              difficulty: context.learnerLevel || "Intermediate",
              estimatedTime: "30-45 minutes"
            }
          ]
        };
        
        console.log("Created minimal fallback structure for module content");
            }
    }

    // Validate and ensure parsed result has required structure
    if (parsed && typeof parsed === 'object') {
      console.log("✅ Successfully obtained parsed module data");
      
      // Ensure required properties exist with defaults
      parsed.summary = parsed.summary || "AI-generated content for this module";
      parsed.objectives = Array.isArray(parsed.objectives) ? parsed.objectives : [];
      parsed.examples = Array.isArray(parsed.examples) ? parsed.examples : [];
      parsed.resources = parsed.resources || {};
      parsed.visualizationSuggestions = parsed.visualizationSuggestions || {};
      parsed.beautifulSummaryElements = parsed.beautifulSummaryElements || {};
      parsed.detailedSubsections = Array.isArray(parsed.detailedSubsections) ? parsed.detailedSubsections : [];
      
      console.log(`Resources are already in categorized format`);
    } else {
      console.log("❌ Parsing failed completely, parsed result is null or invalid");
      throw new Error("Failed to parse any valid module data from AI response");
    }

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
    
    // Batched LLM-powered search query optimization
    const generateOptimizedSearchQueries = async (resources, type) => {
      try {
        // Filter resources that need optimization (have title and author/creator)
        const resourcesNeedingOptimization = resources.filter(resource => {
          const title = resource.title || resource.name;
          const author = resource.author || resource.creator;
          return title && author && (!resource.url || resource.url.trim() === '');
        });

        if (resourcesNeedingOptimization.length === 0) {
          return {}; // No resources need optimization
        }

        console.log(`🤖 Batching ${resourcesNeedingOptimization.length} ${type} resources for search optimization`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const resourceList = resourcesNeedingOptimization.map((resource, index) => 
          `${index + 1}. Title: "${resource.title || resource.name}"
   Author/Creator: "${resource.author || resource.creator}"
   Description: "${resource.description || 'Not provided'}"`
        ).join('\n\n');

        const prompt = `
You are a search query optimization expert. Based on the given resource information, generate the BEST possible search queries to find these specific resources online.

Resource Type: ${type}
Resources to optimize:

${resourceList}

Instructions:
1. Generate a precise search query for each resource that would find it online
2. Include author/creator name when available
3. Add relevant keywords for the resource type (${type})
4. Make queries specific enough to avoid generic results
5. Consider popular platforms for this resource type

Respond with ONLY a JSON object mapping each resource number to its optimized search query:

{
  "1": "optimized search query for resource 1",
  "2": "optimized search query for resource 2",
  "3": "optimized search query for resource 3"
}

Examples for ${type}:
${type === 'books' ? '- "Python Crash Course Eric Matthes programming book"' : ''}
${type === 'courses' ? '- "Machine Learning Andrew Ng Coursera Stanford"' : ''}
${type === 'videos' ? '- "React Tutorial Traversy Media JavaScript"' : ''}
${type === 'articles' ? '- "Deep Learning Nature paper Hinton LeCun"' : ''}
${type === 'tools' ? '- "Visual Studio Code Microsoft IDE download"' : ''}
`;

        const responseText = await callGeminiWithRetry(model, prompt, 3, 1500);
        
        try {
          // Extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonText = jsonMatch ? jsonMatch[0] : responseText;
          const optimizedQueries = JSON.parse(jsonText);
          
          console.log(`✅ Generated ${Object.keys(optimizedQueries).length} optimized search queries for ${type}`);
          return optimizedQueries;
          
        } catch (parseError) {
          console.log(`⚠️ Failed to parse batched optimization response, using fallback`);
          return {};
        }
        
      } catch (error) {
        console.log(`⚠️ Batched LLM optimization failed for ${type}, using fallback: ${error.message}`);
        return {};
      }
    };

    // Simple fallback search query generation
    const generateFallbackSearchQuery = (resource, type) => {
      const title = resource.title || resource.name || 'resource';
      const author = resource.author || resource.creator || '';
      const typeKeywords = {
        books: 'book',
        courses: 'course tutorial',
        articles: 'article paper',
        videos: 'video tutorial',
        tools: 'tool software',
        websites: 'website',
        exercises: 'exercise practice'
      };
      
      const keyword = typeKeywords[type] || '';
      return author ? `${title} ${author} ${keyword}`.trim() : `${title} ${keyword}`.trim();
    };

    // Simplified URL validation using Google Custom Search only
    // --- ENHANCED: YouTube API with view count sorting and fallback ---
    const findYoutubeVideoUrl = async (searchQuery, creator = "") => {
      try {
        if (!process.env.YOUTUBE_API_KEY) {
          console.log("🔑 YouTube API key not configured, skipping YouTube search");
          return null;
        }

        const fullQuery = creator ? `${searchQuery} ${creator}` : searchQuery;
        
        // Enhanced search with view count ordering and more results for fallback
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&order=viewCount&q=${encodeURIComponent(fullQuery)}&key=${process.env.YOUTUBE_API_KEY}`;

        console.log(`🎬 Searching YouTube for: "${fullQuery}"`);
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
          console.log(`❌ YouTube API search failed (${res.status}): ${res.statusText}`);
          return null;
        }

        const data = await res.json();
        if (!data.items || data.items.length === 0) {
          console.log(`🔍 No YouTube videos found for: "${fullQuery}"`);
          return null;
        }

        // Try to get video statistics to sort by actual view count
        const videoIds = data.items.map(item => item.id.videoId).filter(Boolean);
        if (videoIds.length === 0) {
          console.log("⚠️ No valid video IDs found in search results");
          return null;
        }

        // Get detailed video statistics including view count
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,status&id=${videoIds.join(',')}&key=${process.env.YOUTUBE_API_KEY}`;
        
        try {
          const statsRes = await fetch(statsUrl);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            
            // Combine search results with statistics and filter out unavailable videos
            const videosWithStats = data.items
              .map(item => {
                const stats = statsData.items?.find(stat => stat.id === item.id.videoId);
                return {
                  ...item,
                  viewCount: stats?.statistics?.viewCount ? parseInt(stats.statistics.viewCount) : 0,
                  isAvailable: stats?.status?.privacyStatus === 'public' && 
                              stats?.status?.uploadStatus === 'processed' &&
                              !stats?.status?.rejectionReason
                };
              })
              .filter(video => video.isAvailable && video.viewCount > 0)
              .sort((a, b) => b.viewCount - a.viewCount); // Sort by view count (highest first)

            if (videosWithStats.length > 0) {
              const topVideo = videosWithStats[0];
              const url = `https://www.youtube.com/watch?v=${topVideo.id.videoId}`;
              const viewCountFormatted = topVideo.viewCount.toLocaleString();
              
              console.log(`✅ Found YouTube video (${viewCountFormatted} views): ${topVideo.snippet.title}`);
              console.log(`🔗 URL: ${url}`);
              
              // Return additional metadata for potential use
              return {
                url: url,
                title: topVideo.snippet.title,
                channel: topVideo.snippet.channelTitle,
                viewCount: topVideo.viewCount,
                publishedAt: topVideo.snippet.publishedAt,
                description: topVideo.snippet.description?.substring(0, 200) + '...',
                thumbnailUrl: topVideo.snippet.thumbnails?.medium?.url
              };
            }
          }
        } catch (statsError) {
          console.log("⚠️ Failed to fetch video statistics, using first available result");
        }

        // Fallback: Use first video from search results if statistics failed
        const firstVideo = data.items[0];
        if (firstVideo?.id?.videoId) {
          const url = `https://www.youtube.com/watch?v=${firstVideo.id.videoId}`;
          console.log(`🎬 Using first search result: ${firstVideo.snippet.title}`);
          console.log(`🔗 URL: ${url}`);
          
          return {
            url: url,
            title: firstVideo.snippet.title,
            channel: firstVideo.snippet.channelTitle,
            viewCount: 0, // Unknown
            publishedAt: firstVideo.snippet.publishedAt,
            description: firstVideo.snippet.description?.substring(0, 200) + '...',
            thumbnailUrl: firstVideo.snippet.thumbnails?.medium?.url
          };
        }

        console.log("❌ No valid YouTube videos found");
        return null;
        
      } catch (err) {
        console.log("❌ YouTube API error:", err.message);
        return null;
      }
    };

    const findRealUrlWithGoogle = async (searchQuery, type) => {
      try {
        // Special handling for videos – try enhanced YouTube Data API first
        if (type === 'videos') {
          const ytResult = await findYoutubeVideoUrl(searchQuery);
          if (ytResult) {
            // Return just the URL string for compatibility, but log the extra info
            if (typeof ytResult === 'object' && ytResult.url) {
              console.log(`📊 Video details: ${ytResult.channel} | ${ytResult.viewCount.toLocaleString()} views`);
              return ytResult.url;
            }
            return ytResult;
          }
        }
        
        // Only use Google Custom Search API if available
        if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
          const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=3`;
          
          const response = await fetch(searchUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              // Filter results based on type
              const filteredResults = filterSearchResults(data.items, type);
              if (filteredResults.length > 0) {
                return filteredResults[0].link;
              }
            }
          }
        }
        
        return null; // No real URL found
        
      } catch (error) {
        console.error(`Google search failed for "${searchQuery}":`, error.message);
        return null;
      }
    };
    
    // Filter search results based on resource type
    const filterSearchResults = (results, type) => {
      const typeFilters = {
        books: ['amazon.com', 'goodreads.com', 'books.google.com', 'barnesandnoble.com', 'bookdepository.com'],
        courses: ['coursera.org', 'edx.org', 'udemy.com', 'khanacademy.org', 'codecademy.com', 'pluralsight.com'],
        articles: ['scholar.google.com', 'arxiv.org', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov', 'researchgate.net'],
        videos: ['youtube.com', 'vimeo.com', 'ted.com', 'coursera.org', 'edx.org'],
        tools: ['github.com', 'stackoverflow.com', 'sourceforge.net', 'pypi.org', 'npmjs.com'],
        websites: [], // No specific filter for websites
        exercises: ['github.com', 'codepen.io', 'jsfiddle.net', 'repl.it', 'codesandbox.io']
      };
      
      const filters = typeFilters[type] || [];
      if (filters.length === 0) return results; // No filtering for general websites
      
      return results.filter(result => 
        filters.some(domain => result.link.toLowerCase().includes(domain.toLowerCase()))
      );
    };
    
    // Enhanced batch URL processing for resource categories
    const processResourceCategory = async (resources, type) => {
      if (!Array.isArray(resources) || resources.length === 0) {
        return [];
      }

      console.log(`🔄 Processing ${resources.length} ${type} resources`);

      // Step 1: Get optimized search queries for all resources in one API call
      const optimizedQueries = await generateOptimizedSearchQueries(resources, type);

      // Step 2: Process each resource with its optimized query
      const processedResources = [];
      
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        
      if (!resource.url || resource.url.trim() === '') {
        const title = resource.title || resource.name || 'resource';
          
          // Use optimized query if available, otherwise fallback
          const searchQuery = optimizedQueries[String(i + 1)] || generateFallbackSearchQuery(resource, type);
          
          console.log(`🔍 Validating URL for ${type}: "${title}"`);
          
          // Try to find a real URL using Google Custom Search
          const realUrl = await findRealUrlWithGoogle(searchQuery, type);
          
          if (realUrl && realUrl.startsWith('http')) {
            resource.url = realUrl;
            console.log(`✅ Found real URL: ${realUrl}`);
          } else {
            // Simple fallback to search page URLs
            const encodedQuery = encodeURIComponent(searchQuery);
        
        switch(type) {
          case 'books':
                resource.url = `https://www.amazon.com/s?k=${encodedQuery}`;
            break;
          case 'courses':
                resource.url = `https://www.coursera.org/search?query=${encodedQuery}`;
            break;
          case 'articles':
                resource.url = `https://scholar.google.com/scholar?q=${encodedQuery}`;
            break;
          case 'videos':
                resource.url = `https://www.youtube.com/results?search_query=${encodedQuery}`;
            break;
          case 'tools':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+tool+software`;
            break;
          case 'websites':
                resource.url = `https://www.google.com/search?q=${encodedQuery}`;
            break;
          case 'exercises':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+exercise+tutorial`;
            break;
          default:
                resource.url = `https://www.google.com/search?q=${encodedQuery}`;
            }
            console.log(`⚠️ Using search page fallback for: "${title}"`);
          }
        }
        
        processedResources.push(resource);
      }

      return processedResources;
    };
    
    if (parsed.resources) {
      // Check if resources is already categorized
      if (typeof parsed.resources === 'object' && !Array.isArray(parsed.resources)) {
        console.log("Resources are already in categorized format");
        // It's already in the format we want, just make sure all arrays exist and have URLs
        formattedResources = {
          books: Array.isArray(parsed.resources.books) ? await processResourceCategory(parsed.resources.books, 'books') : [],
          courses: Array.isArray(parsed.resources.courses) ? await processResourceCategory(parsed.resources.courses, 'courses') : [],
          articles: Array.isArray(parsed.resources.articles) ? await processResourceCategory(parsed.resources.articles, 'articles') : [],
          videos: Array.isArray(parsed.resources.videos) ? await processResourceCategory(parsed.resources.videos, 'videos') : [],
          tools: Array.isArray(parsed.resources.tools) ? await processResourceCategory(parsed.resources.tools, 'tools') : [],
          websites: Array.isArray(parsed.resources.websites) ? await processResourceCategory(parsed.resources.websites, 'websites') : [],
          exercises: Array.isArray(parsed.resources.exercises) ? await processResourceCategory(parsed.resources.exercises, 'exercises') : []
        };
      } 
      // If resources is an array of typed resources, categorize them
      else if (Array.isArray(parsed.resources)) {
        console.log("Resources are in array format, categorizing...");
        for (const resource of parsed.resources) {
          if (!resource || !resource.type) continue;
          
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
          const processedResource = await processResourceCategory([resource], category);
          formattedResources[category].push(...processedResource);
        }
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
    
    // Final check to ensure all resources have URLs with proper async handling
    for (const resourceType of Object.keys(formattedResources)) {
      formattedResources[resourceType] = await processResourceCategory(formattedResources[resourceType], resourceType);
    }
    
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
    console.error("Error processing Gemini response:", error);
    if (responseText && responseText.length > 0) {
      console.error("Response excerpt:", responseText.substring(0, 200));
    } else {
      console.error("No response text available (likely due to quota or network error)");
    }
    
    // Use robust regex extraction fallback
    console.log("Falling back to regex extraction due to JSON parsing failure or missing response.");
    return extractDataWithRegex(responseText || "");
  }
}

export async function generateQuiz(moduleContent, difficulty = "medium") {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

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
  `;

  try {
    const responseText = await callGeminiWithRetry(model, prompt, 3, 2000);
    
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

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

  try {
    const responseText = await callGeminiWithRetry(model, context, 3, 2000);
    return responseText;
  } catch (error) {
    console.error("Error generating tutor response:", error);
    return "I apologize, but I'm having trouble generating a response right now. Please try asking your question again, or check your internet connection.";
  }
}
