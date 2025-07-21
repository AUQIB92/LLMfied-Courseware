import { GoogleGenerativeAI } from "@google/generative-ai"
import { jsonrepair } from "jsonrepair"
import JSON5 from "json5"

// Check if API key is configured
if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY environment variable is not set!")
  console.log("Please set your Gemini API key in your environment variables:")
  console.log("For development: Create a .env.local file with GEMINI_API_KEY=your_api_key_here")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Retry logic for Gemini API call
async function callGeminiWithRetry(model, prompt, maxRetries = 3, retryDelay = 2000) {
  let lastError;
  
  // Log prompt length for debugging
  console.log(`📝 Gemini prompt length: ${prompt.length} characters`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Gemini call attempt ${attempt}/${maxRetries}`);
      const startTime = Date.now();
      
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`✅ Gemini call successful in ${duration.toFixed(2)} seconds, response length: ${responseText.length} characters`);
      
      return responseText;
    } catch (error) {
      lastError = error;
      console.warn(`❌ Gemini attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // Log more details about the error
      if (error.response) {
        console.error(`Error status: ${error.response.status}`);
        console.error(`Error details:`, error.response.data);
      }
      
      // Wait longer for each retry
      const waitTime = retryDelay * attempt;
      console.log(`Waiting ${waitTime/1000} seconds before retry...`);
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }
  
  console.error(`❌❌❌ Gemini failed after ${maxRetries} attempts.`);
  throw new Error(`Gemini failed after ${maxRetries} attempts. Last error: ${lastError}`);
}

// Sanitize for parse
function sanitizeForParsing(jsonStr) {
  let safe = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  safe = safe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
  return safe;
}

// Repair JSON string using jsonrepair
function repairJsonString(jsonStr) {
  console.log("🔧 Attempting to repair JSON string using jsonrepair...");
  try {
    return jsonrepair(jsonStr);
  } catch (e) {
    console.warn("⚠️ jsonrepair failed:", e.message);
    return jsonStr;
  }
}

// Loose fallback using JSON5
function tryJson5Parse(jsonStr) {
  try {
    console.log("🧪 Attempting JSON5 fallback parse...");
    return JSON5.parse(jsonStr);
  } catch (e) {
    console.warn("❌ JSON5 fallback also failed:", e.message);
    return null;
  }
}

// Extract JSON from Markdown code block
function extractJsonCodeBlock(responseText) {
  const match = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
  return match ? match[1] : responseText;
}

// Main parsing function
export async function parseLargeGeminiResponse(rawResponse) {
  console.log(`📏 Response size: ${rawResponse.length} chars`);

  let extracted = extractJsonCodeBlock(rawResponse);
  let repaired = repairJsonString(extracted);
  let sanitized = sanitizeForParsing(repaired);

  try {
    return JSON.parse(sanitized);
  } catch (e1) {
    console.warn("⚠️ Standard JSON.parse failed:", e1.message);
    const fallback = tryJson5Parse(sanitized);
    if (fallback) return fallback;
  }

  console.error("❌ All parsing strategies failed.");
  return null;
}

// Test function to verify API connection
export async function testGeminiConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
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
      model: options.model || "gemini-2.5-flash",
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
                pages: extractPagesFromObject(subsectionStr, title),
                practicalExample: extractFieldFromObject(subsectionStr, 'practicalExample') || `Practical example for ${title}`,
                commonPitfalls: extractArrayFromObject(subsectionStr, 'commonPitfalls') || [`Common issues with ${title}`, "Best practices to avoid problems"],
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
            pages: [
              {
                pageNumber: 1,
                pageTitle: "Introduction & Foundation",
                content: `Introduction to ${title}. This section covers the fundamental concepts and provides the necessary background knowledge for understanding the topic.`,
                codeExamples: [],
                mathematicalContent: [],
                keyTakeaway: `Understanding the basics of ${title}`
              },
              {
                pageNumber: 2,
                pageTitle: "Deep Dive & Analysis",
                content: `Detailed analysis of ${title}. This section explores the technical details, mechanisms, and processes involved in this topic.`,
                codeExamples: [],
                mathematicalContent: [],
                keyTakeaway: `Mastering the technical aspects of ${title}`
              },
              {
                pageNumber: 3,
                pageTitle: "Applications & Implementation",
                content: `Practical applications of ${title}. This section demonstrates how to apply the concepts in real-world scenarios and implementation strategies.`,
                codeExamples: [],
                mathematicalContent: [],
                keyTakeaway: `Applying ${title} in practice`
              }
            ],
            practicalExample: `Practical example for ${title}`,
            commonPitfalls: [`Common issues with ${title}`, "Best practices to avoid problems"],
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
                pages: [
                  {
                    pageNumber: 1,
                    pageTitle: "Introduction & Foundation",
                    content: `Introduction to ${title}. This section covers the fundamental concepts and provides the necessary background knowledge for understanding the topic.`,
                    keyTakeaway: `Understanding the basics of ${title}`
                  },
                  {
                    pageNumber: 2,
                    pageTitle: "Deep Dive & Analysis",
                    content: `Detailed analysis of ${title}. This section explores the technical details, mechanisms, and processes involved in this topic.`,
                    keyTakeaway: `Mastering the technical aspects of ${title}`
                  },
                  {
                    pageNumber: 3,
                    pageTitle: "Applications & Implementation",
                    content: `Practical applications of ${title}. This section demonstrates how to apply the concepts in real-world scenarios and implementation strategies.`,
                    keyTakeaway: `Applying ${title} in practice`
                  }
                ],
                practicalExample: `Practical example for ${title}`,
                commonPitfalls: [`Common issues with ${title}`, "Best practices to avoid problems"],
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

// Helper function to extract pages from subsection object
function extractPagesFromObject(objectStr, title) {
  try {
    const pagesPattern = /"pages"\s*:\s*\[(.*?)\]/si;
    const pagesMatch = objectStr.match(pagesPattern);
    
    if (pagesMatch && pagesMatch[1]) {
      const pagesContent = pagesMatch[1];
      const pageObjects = pagesContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      
      if (pageObjects && pageObjects.length > 0) {
        const pages = pageObjects.map((pageStr, index) => {
          const pageNumber = index + 1;
          const pageTitle = extractFieldFromObject(pageStr, 'pageTitle') || `Page ${pageNumber}`;
          const content = extractFieldFromObject(pageStr, 'content') || `Content for ${pageTitle}`;
          const keyTakeaway = extractFieldFromObject(pageStr, 'keyTakeaway') || `Key learning from ${pageTitle}`;
          
          return {
            pageNumber: pageNumber,
            pageTitle: pageTitle,
            content: content,
            codeExamples: extractCodeExamplesFromObject(pageStr),
            mathematicalContent: extractMathematicalContentFromObject(pageStr),
            keyTakeaway: keyTakeaway
          };
        });
        
        return pages;
      }
    }
    
    // Fallback: create default pages for competitive exam
    return [
      {
        pageNumber: 1,
        pageTitle: "Introduction & Foundation",
        content: `Introduction to ${title}. This section covers the fundamental concepts and provides the necessary background knowledge for understanding the topic in competitive exam context.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Understanding the basics of ${title}`
      },
      {
        pageNumber: 2,
        pageTitle: "Shortcuts & Speed Techniques",
        content: `Speed-solving techniques and shortcuts for ${title}. This section provides time-saving methods and mental math techniques for competitive exams.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Mastering speed and efficiency for ${title}`
      },
      {
        pageNumber: 3,
        pageTitle: "Practice & Exam Application",
        content: `Real exam problems and strategic approaches for ${title}. This section demonstrates how to apply concepts in actual competitive exam conditions.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Applying ${title} in competitive exam scenarios`
      },
      {
        pageNumber: 4,
        pageTitle: "Advanced Tricks & Common Traps",
        content: `Advanced shortcuts, pitfalls, and expert techniques for ${title}. This section covers complex problem-solving strategies and common mistakes to avoid.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Advanced mastery and trap avoidance for ${title}`
      },
      {
        pageNumber: 5,
        pageTitle: "Mastery & Review",
        content: `Practice problems, review techniques, and final tips for ${title}. This section consolidates learning and prepares for excellence in competitive exams.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Complete mastery and exam readiness for ${title}`
      }
    ];
  } catch (error) {
    console.log("Error extracting pages:", error);
    return [
      {
        pageNumber: 1,
        pageTitle: "Introduction & Foundation",
        content: `Introduction to ${title}. This section covers the fundamental concepts and provides the necessary background knowledge for understanding the topic in competitive exam context.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Understanding the basics of ${title}`
      },
      {
        pageNumber: 2,
        pageTitle: "Shortcuts & Speed Techniques",
        content: `Speed-solving techniques and shortcuts for ${title}. This section provides time-saving methods and mental math techniques for competitive exams.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Mastering speed and efficiency for ${title}`
      },
      {
        pageNumber: 3,
        pageTitle: "Practice & Exam Application",
        content: `Real exam problems and strategic approaches for ${title}. This section demonstrates how to apply concepts in actual competitive exam conditions.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Applying ${title} in competitive exam scenarios`
      },
      {
        pageNumber: 4,
        pageTitle: "Advanced Tricks & Common Traps",
        content: `Advanced shortcuts, pitfalls, and expert techniques for ${title}. This section covers complex problem-solving strategies and common mistakes to avoid.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Advanced mastery and trap avoidance for ${title}`
      },
      {
        pageNumber: 5,
        pageTitle: "Mastery & Review",
        content: `Practice problems, review techniques, and final tips for ${title}. This section consolidates learning and prepares for excellence in competitive exams.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Complete mastery and exam readiness for ${title}`
      }
    ];
    }
}

// Helper function to extract code examples from page object
function extractCodeExamplesFromObject(pageStr) {
  try {
    const codeExamplesPattern = /"codeExamples"\s*:\s*\[(.*?)\]/si;
    const codeExamplesMatch = pageStr.match(codeExamplesPattern);
    
    if (codeExamplesMatch && codeExamplesMatch[1]) {
      const codeExamplesContent = codeExamplesMatch[1];
      const codeObjects = codeExamplesContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      
      if (codeObjects && codeObjects.length > 0) {
        return codeObjects.map(codeStr => {
          return {
            language: extractFieldFromObject(codeStr, 'language') || 'javascript',
            title: extractFieldFromObject(codeStr, 'title') || 'Code Example',
            code: extractFieldFromObject(codeStr, 'code') || '// Code example will be provided',
            explanation: extractFieldFromObject(codeStr, 'explanation') || 'Explanation will be provided'
          };
        });
      }
    }
    
    return [];
  } catch (error) {
    console.log("Error extracting code examples:", error);
    return [];
  }
}

// Helper function to extract mathematical content from page object
function extractMathematicalContentFromObject(pageStr) {
  try {
    const mathContentPattern = /"mathematicalContent"\s*:\s*\[(.*?)\]/si;
    const mathContentMatch = pageStr.match(mathContentPattern);
    
    if (mathContentMatch && mathContentMatch[1]) {
      const mathContentContent = mathContentMatch[1];
      const mathObjects = mathContentContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      
      if (mathObjects && mathObjects.length > 0) {
        return mathObjects.map(mathStr => {
          return {
            type: extractFieldFromObject(mathStr, 'type') || 'formula',
            title: extractFieldFromObject(mathStr, 'title') || 'Mathematical Concept',
            content: extractFieldFromObject(mathStr, 'content') || 'Mathematical content will be provided',
            explanation: extractFieldFromObject(mathStr, 'explanation') || 'Explanation will be provided',
            example: extractFieldFromObject(mathStr, 'example') || 'Example will be provided'
          };
        });
      }
    }
    
    return [];
  } catch (error) {
    console.log("Error extracting mathematical content:", error);
    return [];
  }
}

// Enhanced competitive exam module summary generation
export async function generateCompetitiveExamModuleSummary(content, context = {}) {
  // Ensure responseText is defined in outer scope for error handling
  let responseText = "";

  const { 
    learnerLevel = "intermediate", 
    subject = "Quantitative Aptitude", 
    examType = "SSC",
    moduleIndex = 1, 
    totalModules = 1 
  } = context

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  const prompt = `
    Analyze the following educational content and provide a comprehensive, exam-focused module breakdown tailored for Competitive Exams like SSC, UPSC, CAT, Bank PO, GRE, etc., specifically in the domain of ${subject} for ${examType} examination.

    CONTEXT:
    - Target Learner Level: ${learnerLevel}
    - Subject Category: ${subject}
    - Exam Type: ${examType}
    - Module Position: ${moduleIndex} of ${totalModules}

    REQUIREMENTS FOR ${learnerLevel.toUpperCase()} LEVEL:
    ${learnerLevel === 'beginner' ? `
    - Use simple, clear language and avoid jargon
    - Include foundational concepts and prerequisites
    - Provide step-by-step explanations with exam shortcuts
    - Focus on building confidence and understanding basics for competitive exams
    ` : ''}
    ${learnerLevel === 'intermediate' ? `
    - Balance theory with practical competitive exam applications
    - Include moderate complexity examples with time-saving techniques
    - Connect to real exam scenarios and patterns
    - Build on assumed foundational knowledge with speed-solving methods
    ` : ''}
    ${learnerLevel === 'advanced' ? `
    - Include complex concepts and advanced competitive exam strategies
    - Focus on optimization, shortcuts, and best practices for high scores
    - Provide challenging, exam-relevant examples with tricky scenarios
    - Assume strong foundational knowledge with expert-level techniques
    ` : ''}
    ${learnerLevel === 'expert' ? `
    - Cover cutting-edge competitive exam techniques and advanced strategies
    - Include expert-level shortcuts and time-saving methods
    - Focus on mentoring aspects and teaching others
    - Provide expert-level insights for achieving top rankings
    ` : ''}

    COMPETITIVE EXAM SPECIFIC FOCUS:
    - Emphasize concept clarity, formula mastery, and shortcut techniques
    - Include all essential formulas with derivations, variations, and memory tricks
    - Deliver speed-solving strategies for time-bound environments
    - Create practice problems with progressive difficulty: Easy, Moderate, Hard, Tricky
    - Include analysis of common traps, typical errors, and time-wasting pitfalls
    - Focus on accuracy, speed, and exam-relevant thinking
    - Cover previous year question formats when applicable

    MATHEMATICAL CONTENT FORMATTING RULES:

1. Use LaTeX syntax for all math expressions.
2. For inline math, enclose equations in single dollar signs: $...$
   - Example: $E = mc^2$
3. For block or display math, use double dollar signs on separate lines:
   - Example:
     $$
     \sum_{i=1}^{n} i = \frac{n(n+1)}{2}
     $$

4. Use the following LaTeX commands (with a **single backslash**, NOT double):
   - Fractions: \frac{numerator}{denominator}
   - Exponents: x^2 or x^{n+1}
   - Subscripts: x_1 or x_{min}
   - Square roots: \sqrt{expression}
   - Summation: \sum_{i=1}^{n}
   - Integrals: \int_{a}^{b} f(x) dx
   - Limits: \lim_{x \to 0} f(x)
   - Greek letters: \alpha, \beta, \theta, \pi, \infty
   - Text inside math: \text{Total Cost} = \$50

5. DO NOT:
   - Use double backslashes (\\) in LaTeX commands
   - Wrap math in code blocks (no triple backticks)
   - Use invalid symbols like \ec, @rac, \f100/20, etc.

6. Good Examples:
   - Inline: $F = ma$
   - Block:
     $$
     \int_{0}^{1} x^2 dx = \frac{1}{3}
     $$

ALWAYS follow the above formatting rules strictly to ensure correct math rendering.


    Please provide:
    1. A compelling summary (2-3 sentences appropriate for ${learnerLevel} level, written in an engaging tone with competitive exam focus)
    2. 4-5 specific, actionable learning objectives (appropriate complexity for ${learnerLevel} learners, focused on exam success)
    3. 3-5 concrete, exam-relevant examples relevant to ${subject} and ${examType} exam
    4. Interactive learning components identification:
       - Concepts that would benefit from visual diagrams (flowcharts, formulas, shortcut visualizations, etc.)
       - Topics suitable for speed calculation simulations or interactive demonstrations
       - Mathematical concepts that need formula visualizations and memory tricks
       - Process-oriented content suitable for step-by-step competitive exam simulators
    5. Comprehensive, high-quality learning resources appropriate for ${learnerLevel} level and ${examType} exam including:
       - Recommended books/textbooks specifically for ${examType} preparation (with authors, publication years, and compelling descriptions)
       - Online courses/tutorials for ${examType} exam (with platform names, URLs when possible, and detailed descriptions)
       - Research papers/articles relevant to ${subject} and competitive exams (with sources, authors, and summaries)
       - Video tutorials/lectures specifically for ${examType} exam preparation (see note below)
       - Practice exercises/mock tests (with difficulty levels appropriate for ${learnerLevel} and ${examType})
       - Tools and software recommendations for ${examType} exam preparation (with types, descriptions, and use cases)
       - Interactive websites and platforms for ${examType} exam practice
    6. Enhanced learning elements:
       - Beautiful summary elements with key insights and practical applications for ${examType} exam
       - Career relevance for ${examType} exam success and job opportunities
       - Estimated study time for ${learnerLevel} learners preparing for ${examType}
       - Prerequisites and recommended preparation for ${examType} exam
       - Difficulty assessment for this specific level in competitive exam context
    7. Detailed subsections with MULTI-PAGE EXPLANATIONS:
       - The provided module content below is in Markdown format.
       - This content includes section headings (e.g., "### 1.1 Basic Concepts") and subsection headings (e.g., "#### 1.1.1 Resistance").
       - Your task is to generate detailed content ONLY for the subsections marked with "####".
       - You MUST generate a "detailedSubsections" entry for EACH AND EVERY "####" heading found in the provided content. Do not invent new subsections or omit any.
       - The "title" of each entry in your generated "detailedSubsections" array MUST EXACTLY match the corresponding subsection heading from the content (e.g., "1.1.1 Resistance").

        For each of these subsections from the provided content, create the following structure:
        - Core concepts broken down for ${learnerLevel} understanding with exam focus
        - Key terminology with clear definitions and exam relevance
        - Step-by-step explanations with speed-solving techniques
        - Common pitfalls and exam traps (especially for ${learnerLevel} level)
        - Competitive exam strategies and time management
        - Memory tricks and shortcuts for ${examType} exam
        
        CRITICAL: For each detailed subsection, you MUST create content that follows the hierarchical structure:
        MODULE → SECTIONS → SUBSECTIONS based on actual module content analysis.
        
        Each detailed subsection should represent a SUBSECTION within a larger SECTION of the MODULE.
        The subsection title should clearly indicate its place in the hierarchy by including the number (e.g., "1.1.1 Resistance").
        
        For each detailed subsection, create EXACTLY 6 PAGES of focused explanation:
        
       FOUNDATIONAL PAGES (Pages 1-3):
       - MANDATORY: Page 1: "Introduction & Foundation" (300-400 words) - Basic concepts, definitions, context within the section, why this subsection matters for the overall section understanding
       - MANDATORY: Page 2: "Core Theory & Mathematical Principles" (300-400 words) - Deep dive into theoretical understanding, formulas, and mathematical foundations specific to this subsection
       - MANDATORY: Page 3: "Problem-Solving Techniques & Strategies" (300-400 words) - Systematic approaches to solving problems related to this specific subsection
       
       EXAM-FOCUSED PAGES (Pages 4-6):
       - MANDATORY: Page 4: "Speed Techniques & Shortcuts" (300-400 words) - Time-saving methods, mental math tricks, and rapid calculation techniques specific to this subsection
       - MANDATORY: Page 5: "Common Traps & Error Prevention" (300-400 words) - Typical mistakes, question traps, and error prevention strategies for this subsection in ${examType} exams
       - MANDATORY: Page 6: "Practice Problems & Applications" (300-400 words) - Real exam problems, practice exercises, and application scenarios for this specific subsection
       
       REQUIREMENTS FOR EACH PAGE:
       - Each page MUST have a clear, descriptive title
       - Each page MUST contain 300-400 words of substantive content
       - Each page MUST have a key takeaway that summarizes the main learning point
       - Content should flow from basic concepts to advanced competitive exam strategies
       - Include examples, shortcuts, and practical applications appropriate for ${learnerLevel} level
       - Include common exam traps and misconceptions where relevant
       - Format all mathematical content using LaTeX syntax as specified above
       
       SPECIAL CONTENT REQUIREMENTS FOR COMPETITIVE EXAMS:
       - FOR MATHEMATICAL CONCEPTS: Include formulas using LaTeX syntax, quick calculation techniques, memory tricks, and numerical examples
       - FOR LOGICAL REASONING: Provide shortcut methods, pattern recognition, and elimination techniques
       - FOR VERBAL ABILITY: Include grammar tricks, vocabulary building, and reading comprehension strategies
       - FOR GENERAL KNOWLEDGE: Show memory techniques, current affairs integration, and fact recall methods
       - FOR QUANTITATIVE APTITUDE: Include speed math, approximation techniques, and formula shortcuts using proper LaTeX notation

    Content: ${content}
    
    CRITICAL REQUIREMENTS:
    1. ALL resources MUST include working URLs/links whenever possible. Prioritize authoritative and reputable sources specifically for ${examType} exam preparation.
    2. For books: Include Amazon, Google Books, or publisher links for ${examType} exam preparation books
    3. For courses: Include direct course URLs from platforms like Unacademy, BYJU'S, Khan Academy, Coursera, etc. for ${examType} preparation
    4. For videos: 
       - Provide the EXACT, working URL for the video if found. 
       - If an exact URL cannot be found, provide a \`searchQuery\` and explicitly state that the URL is unconfirmed.
       - Prioritize videos from exam preparation channels, coaching institutes, or highly reputable educators for ${examType}.
       - Include: Video Title, Creator/Channel Name, Source Platform, Short Description, and Duration (if known).
    5. For articles: Include links to exam preparation websites, coaching institute blogs, or educational articles
    6. For tools: Include official websites for exam preparation tools, mock test platforms, etc.
    7. For websites: Include actual URLs for ${examType} exam preparation websites
    8. If you cannot find a specific URL, provide the most likely official website or search result.
    9. Format ALL URLs as complete, clickable links starting with https://

    CRITICAL OUTPUT REQUIREMENTS:
    Please return the output in a markdown code block with JSON format. If the output is large, break it into pieces no larger than 9000 characters each.
    
    Use this structure for large responses:
    \`\`\`json
    {
      "part1": {
        "summary": "...",
        "objectives": [...],
        "examples": [...]
      },
      "part2": {
        "visualizationSuggestions": {...},
        "beautifulSummaryElements": {...}
      },
      "part3": {
        "resources": {...}
      },
      "part4": {
        "detailedSubsections": [...]
      }
    }
    \`\`\`
    
    For smaller responses, use a single part:
    \`\`\`json
    {
      "complete": {
        "summary": "Engaging module summary focused on ${examType} exam success",
        "objectives": ["Students will be able to solve ${examType} problems efficiently...", "Students will master shortcut techniques for...", "Students will identify common traps in...", "etc."],
        "examples": ["${examType} exam question pattern 1", "${examType} previous year problem", "Speed-solving technique example", "etc."],
        "visualizationSuggestions": {
          "hasFlowcharts": true/false,
          "hasComparisons": true/false,
          "hasTimelines": true/false,
          "hasFormulas": true/false,
          "hasProcessSteps": true/false,
          "hasCyclicalProcesses": true/false,
          "hasHierarchies": true/false,
          "hasRelationships": true/false,
          "codeSimulationTopics": ["Speed calculation demo", "Interactive formula practice", "etc."],
          "interactiveElements": ["Formula calculators for quick practice", "Speed test timers", "etc."]
        },
        "beautifulSummaryElements": {
          "keyInsights": ["Key insight for ${examType} success", "Important shortcut technique", "Common trap awareness"],
          "practicalApplications": ["How this applies in ${examType} exam", "Real exam scenario application", "Career applications post-exam"],
          "whyItMatters": "Compelling explanation of importance for ${examType} exam success and career prospects",
          "careerRelevance": "How mastering this topic impacts ${examType} exam performance and subsequent career opportunities",
          "difficultyLevel": "Beginner|Intermediate|Advanced",
          "prerequisites": ["Prerequisite 1 for ${examType}", "Prerequisite 2", "etc."],
          "estimatedStudyTime": "X hours of focused study time for ${examType} preparation"
        },
        "resources": {
          "books": [
            {
              "title": "Complete Book Title for ${examType} Preparation",
              "author": "Author Name",
              "description": "Compelling description explaining why this book is valuable for ${examType} exam and what students will gain",
              "year": "2023",
              "difficulty": "Beginner|Intermediate|Advanced",
              "examRelevance": "How this book specifically helps with ${examType} exam",
              "url": "https://amazon.com/... or https://books.google.com/... or publisher URL"
            }
          ],
          "courses": [
            {
              "title": "Complete Course Title for ${examType} Preparation",
              "platform": "Platform Name (e.g., Unacademy, BYJU'S, Khan Academy, Coursera)",
              "url": "https://unacademy.com/... or https://byjus.com/... or course URL",
              "description": "Detailed course description focused on ${examType} exam preparation",
              "difficulty": "Beginner|Intermediate|Advanced",
              "duration": "Estimated time to complete",
              "examRelevance": "How this course specifically helps with ${examType} exam"
            }
          ],
          "articles": [
            {
              "title": "Article Title Related to ${examType} Exam",
              "source": "Publication/Website Name",
              "description": "Article summary and key insights for ${examType} exam preparation",
              "examRelevance": "How this article helps with ${examType} exam",
              "url": "https://exam-prep-website.com/... or article URL"
            }
          ],
          "videos": [
            {
              "title": "Video Title for ${examType} Exam Preparation",
              "creator": "Creator/Channel Name (preferably exam coaching channel)",
              "source_platform": "YouTube|Vimeo|Unacademy|BYJU'S|etc.",
              "exact_url": "https://www.youtube.com/watch?v=... (if found, otherwise null)",
              "searchQuery": "site:youtube.com ${examType} Video Title Creator Name (if exact_url is null)",
              "description": "Engaging description of video content for ${examType} exam preparation",
              "duration": "Video length if known",
              "examRelevance": "How this video helps with ${examType} exam"
            }
          ],
          "tools": [
            {
              "name": "Tool Name for ${examType} Exam Preparation",
              "type": "Mock Test Platform|Calculator|Mobile App|etc.",
              "description": "How this tool helps with ${examType} exam preparation and practice",
              "examRelevance": "Specific benefits for ${examType} exam",
              "url": "https://tool-official-website.com"
            }
          ],
          "websites": [
            {
              "name": "Website/Resource Name for ${examType} Exam",
              "url": "https://exam-prep-website.com",
              "description": "What students can find here for ${examType} exam preparation",
              "examRelevance": "How this website supports ${examType} exam preparation"
            }
          ],
          "exercises": [
            {
              "title": "Exercise/Practice Set Title for ${examType}",
              "difficulty": "Beginner|Intermediate|Advanced",
              "description": "Clear description of the exercise and learning outcomes for ${examType} exam",
              "estimatedTime": "Time to complete",
              "type": "Mock Test|Practice Problems|Speed Test|Chapter Test",
              "examRelevance": "How this exercise helps with ${examType} exam preparation",
              "url": "https://exercise-or-practice-website.com (if available)"
            }
          ]
        },
        "detailedSubsections": [
          {
            "title": "1.1.1 Subsection Title",
            "summary": "Brief overview focused on ${examType} exam relevance",
            "keyPoints": ["Key point 1 for ${examType}", "Key point 2", "Key point 3"],
            "pages": [
              {
                "pageNumber": 1,
                "pageTitle": "Introduction & Foundation",
                "content": "Basic concepts, definitions, and context for this subsection (300-400 words).",
                "mathematicalContent": [],
                "keyTakeaway": "Core foundational understanding of the topic."
              },
              {
                "pageNumber": 2,
                "pageTitle": "Core Theory & Mathematical Principles",
                "content": "Deep dive into theoretical understanding and formulas for this subsection (300-400 words).",
                "mathematicalContent": [],
                "keyTakeaway": "Mastery of core theory and formulas."
              },
              {
                "pageNumber": 3,
                "pageTitle": "Problem-Solving Techniques & Strategies",
                "content": "Systematic approaches to solving problems for this subsection (300-400 words).",
                "mathematicalContent": [],
                "keyTakeaway": "Effective problem-solving strategies."
              },
              {
                "pageNumber": 4,
                "pageTitle": "Speed Techniques & Shortcuts",
                "content": "Time-saving methods and shortcuts for this subsection (300-400 words).",
                "mathematicalContent": [],
                "keyTakeaway": "Increased speed and efficiency in solving problems."
              },
              {
                "pageNumber": 5,
                "pageTitle": "Common Traps & Error Prevention",
                "content": "Typical mistakes and error prevention strategies for this subsection (300-400 words).",
                "mathematicalContent": [],
                "keyTakeaway": "Avoidance of common exam traps."
              },
              {
                "pageNumber": 6,
                "pageTitle": "Practice Problems & Applications",
                "content": "Real exam problems and applications for this subsection (300-400 words).",
                "mathematicalContent": [],
                "keyTakeaway": "Practical application and exam readiness."
              }
            ],
            "practicalExample": "Real ${examType} exam problem or scenario",
            "commonPitfalls": ["Common mistake in ${examType} exam", "Typical trap in questions", "Time management error"],
            "difficulty": "Beginner|Intermediate|Advanced",
            "estimatedTime": "Time to master this for ${examType} exam",
            "examRelevance": "How this subsection specifically helps with ${examType} exam"
          }
        ]
      }
    }
    \`\`\`

    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON inside a single Markdown code block.
    • Begin the response with three backticks followed by the word json (\`\`\`json) on its own line.
    • End the response with three backticks (\`\`\`).
    • Do NOT include any additional commentary, explanation, or prose outside the code block.
    • Ensure the JSON is completely valid and self-contained.
    • If content is too large, break it into numbered parts (part1, part2, etc.) within the JSON structure.
  `;

  try {
    console.log("Processing LLM response for competitive exam module summary...");
    
    responseText = await callGeminiWithRetry(model, prompt, 5, 3000);
    
    console.log(`Response size: ${responseText.length} characters`);
    
    // Extract JSON from markdown code block
    const codeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (!codeBlockMatch) {
      console.log("No JSON code block found, trying to extract JSON directly...");
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
    } else {
      responseText = codeBlockMatch[1];
      console.log("Successfully extracted JSON from markdown code block");
    }
    
    // Use the existing robust parsing approach
    let parsed = await parseLargeGeminiResponse(responseText);
    
    if (parsed) {
      console.log("✅ Successfully parsed competitive exam JSON response");
      
      // Handle chunked response format
      if (parsed.part1 || parsed.part2 || parsed.part3 || parsed.part4) {
        console.log("Detected chunked response, merging parts...");
        const mergedData = {};
        
        Object.keys(parsed).forEach(partKey => {
          if (partKey.startsWith('part')) {
            Object.assign(mergedData, parsed[partKey]);
          }
        });
        
        parsed = mergedData;
        console.log("Successfully merged chunked response parts");
      } else if (parsed.complete) {
        parsed = parsed.complete;
        console.log("Using complete response format");
      }
    }
    
    // Strategy 4: If all JSON parsing fails, extract data with regex
    if (!parsed) {
      console.log("All JSON parsing strategies failed, using regex extraction...");
      try {
        parsed = extractDataWithRegex(responseText);
      } catch (regexError) {
        console.log("Regex extraction also failed, creating competitive exam fallback structure...");
        
        // Ultimate fallback - create a basic structure for competitive exams
        parsed = {
          summary: `AI-generated content for ${subject} in ${examType} examination. This module covers essential concepts with exam-specific strategies.`,
          objectives: [
            `Master key concepts of ${subject} for ${examType} exam`,
            "Apply speed-solving techniques and shortcuts",
            "Identify and avoid common traps in questions",
            "Practice with exam-pattern questions"
          ],
          examples: [
            `Real-world application in ${examType} exam context`,
            "Previous year question patterns",
            "Time-saving calculation techniques"
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
            hasFlowcharts: true,
            hasComparisons: true,
            hasTimelines: false,
            hasFormulas: true,
            hasProcessSteps: true,
            hasCyclicalProcesses: false,
            hasHierarchies: false,
            hasRelationships: true,
            codeSimulationTopics: [],
            interactiveElements: ["Formula calculators", "Speed calculation tools"]
          },
          beautifulSummaryElements: {
            keyInsights: [`Essential ${subject} concepts for ${examType}`, "Speed-solving strategies", "Common exam traps"],
            practicalApplications: [`${examType} exam questions`, "Time-bound problem solving", "Accuracy improvement techniques"],
            whyItMatters: `Mastering ${subject} is crucial for success in ${examType} examination and competitive career opportunities.`,
            careerRelevance: `Strong ${subject} skills open doors to government jobs, banking sector, and other competitive career paths.`,
            difficultyLevel: context.learnerLevel || "Intermediate",
            prerequisites: ["Basic mathematics", "Logical thinking"],
            estimatedStudyTime: "3-4 hours"
          },
          detailedSubsections: [
            {
              title: "Core Concepts",
              summary: "Fundamental concepts and principles",
              keyPoints: ["Key concept 1", "Key concept 2", "Key concept 3"],
              pages: [
                {
                  pageNumber: 1,
                  pageTitle: "Introduction & Foundation",
                  content: `Introduction to ${subject} concepts for ${examType} exam. This section covers the fundamental ideas and provides necessary background knowledge for competitive exam success.`,
                  codeExamples: [],
                  mathematicalContent: [
                    {
                      type: "formula",
                      title: "Basic Formula",
                      content: "Mathematical expression will be provided",
                      explanation: "Step-by-step explanation for exam context",
                      example: "Numerical example with time-saving technique"
                    }
                  ],
                  keyTakeaway: "Understanding the foundational concepts"
                },
                {
                  pageNumber: 2,
                  pageTitle: "Exam Strategies & Shortcuts",
                  content: `Speed-solving techniques and shortcuts for ${subject} in ${examType} exam. This section provides time-saving methods and mental math techniques.`,
                  codeExamples: [],
                  mathematicalContent: [
                    {
                      type: "calculation",
                      title: "Quick Calculation Method",
                      content: "Fast calculation technique",
                      explanation: "How to solve in minimal time",
                      example: "Practice problem with timing"
                    }
                  ],
                  keyTakeaway: "Mastering speed and accuracy"
                },
                {
                  pageNumber: 3,
                  pageTitle: "Practice & Application",
                  content: `Practice problems and real exam applications for ${subject} in ${examType}. This section demonstrates how to apply concepts in actual exam conditions.`,
                  codeExamples: [],
                  mathematicalContent: [
                    {
                      type: "example",
                      title: "Exam-Style Problem",
                      content: "Typical exam question format",
                      explanation: "Solution approach and strategy",
                      example: "Step-by-step solution"
                    }
                  ],
                  keyTakeaway: "Applying knowledge in exam scenarios"
                }
              ],
              practicalExample: `Practical example for ${subject} in ${examType} context`,
              commonPitfalls: [`Common mistakes in ${subject}`, "Time management issues", "Calculation errors"],
              difficulty: context.learnerLevel || "Intermediate",
              estimatedTime: "45-60 minutes"
            }
          ]
        };
        
        console.log("Created competitive exam fallback structure");
      }
    }

    // Process resources with comprehensive exam-specific enhancements (using same logic as general function)
    if (parsed && parsed.resources) {
      console.log("Processing competitive exam resources with comprehensive URL validation...");
    }

    // Batched LLM-powered search query optimization (same as general function)
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

        console.log(`🤖 Batching ${resourcesNeedingOptimization.length} ${type} resources for competitive exam search optimization`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const resourceList = resourcesNeedingOptimization.map((resource, index) => 
          `${index + 1}. Title: "${resource.title || resource.name}"
   Author/Creator: "${resource.author || resource.creator}"
   Description: "${resource.description || 'Not provided'}"
   Exam Type: "${examType}"`
        ).join('\n\n');

        const prompt = `
You are a search query optimization expert for competitive exam preparation. Based on the given resource information, generate the BEST possible search queries to find these specific resources online for ${examType} exam preparation.

Resource Type: ${type}
Exam Type: ${examType}
Subject: ${subject}
Resources to optimize:

${resourceList}

Instructions:
1. Generate a precise search query for each resource that would find it online
2. Include author/creator name when available
3. Add relevant keywords for the resource type (${type}) and ${examType} exam
4. Make queries specific enough to avoid generic results
5. Consider popular platforms for this resource type and exam preparation

Respond with ONLY a JSON object mapping each resource number to its optimized search query:

{
  "1": "optimized search query for resource 1",
  "2": "optimized search query for resource 2",
  "3": "optimized search query for resource 3"
}

Examples for ${type} in ${examType} preparation:
${type === 'books' ? `- "${subject} ${examType} book author name exam preparation"` : ''}
${type === 'courses' ? `- "${examType} ${subject} course Unacademy BYJU'S online preparation"` : ''}
${type === 'videos' ? `- "${examType} ${subject} tutorial video channel exam preparation"` : ''}
${type === 'articles' ? `- "${examType} ${subject} article exam strategy tips"` : ''}
${type === 'tools' ? `- "${examType} exam preparation tool mock test software"` : ''}
`;

        const responseText = await callGeminiWithRetry(model, prompt, 3, 1500);
        
        try {
          // Extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonText = jsonMatch ? jsonMatch[0] : responseText;
          const optimizedQueries = await parseLargeGeminiResponse(jsonText);
          
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

    // Simple fallback search query generation (same as general function)
    const generateFallbackSearchQuery = (resource, type) => {
      const title = resource.title || resource.name || 'resource';
      const author = resource.author || resource.creator || '';
      const typeKeywords = {
        books: `book ${examType} exam preparation`,
        courses: `course ${examType} exam online tutorial`,
        articles: `article ${examType} exam strategy`,
        videos: `video ${examType} exam tutorial`,
        tools: `tool ${examType} exam preparation software`,
        websites: `website ${examType} exam preparation`,
        exercises: `exercise ${examType} exam practice test`
      };
      
      const keyword = typeKeywords[type] || `${examType} exam`;
      return author ? `${title} ${author} ${keyword}`.trim() : `${title} ${keyword}`.trim();
    };

    // Enhanced YouTube API with competitive exam focus
    const findYoutubeVideoUrl = async (searchQuery, creator = "") => {
      try {
        if (!process.env.YOUTUBE_API_KEY) {
          console.log("🔑 YouTube API key not configured, skipping YouTube search");
          return null;
        }

        const fullQuery = creator ? `${searchQuery} ${creator} ${examType} exam` : `${searchQuery} ${examType} exam`;
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&order=viewCount&q=${encodeURIComponent(fullQuery)}&key=${process.env.YOUTUBE_API_KEY}`;

        console.log(`🎬 Searching YouTube for ${examType} exam: "${fullQuery}"`);
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

        const videoIds = data.items.map(item => item.id.videoId).filter(Boolean);
        if (videoIds.length === 0) {
          console.log("⚠️ No valid video IDs found in search results");
          return null;
        }

        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,status&id=${videoIds.join(',')}&key=${process.env.YOUTUBE_API_KEY}`;
        
        try {
          const statsRes = await fetch(statsUrl);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            
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
              .sort((a, b) => b.viewCount - a.viewCount);

            if (videosWithStats.length > 0) {
              const topVideo = videosWithStats[0];
              const url = `https://www.youtube.com/watch?v=${topVideo.id.videoId}`;
              const viewCountFormatted = topVideo.viewCount.toLocaleString();
              
              console.log(`✅ Found ${examType} exam YouTube video (${viewCountFormatted} views): ${topVideo.snippet.title}`);
              return url;
            }
          }
        } catch (statsError) {
          console.log("⚠️ Failed to fetch video statistics, using first available result");
        }

        const firstVideo = data.items[0];
        if (firstVideo?.id?.videoId) {
          const url = `https://www.youtube.com/watch?v=${firstVideo.id.videoId}`;
          console.log(`🎬 Using first ${examType} exam search result: ${firstVideo.snippet.title}`);
          return url;
        }

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
            return ytResult;
          }
        }
        
        // Only use Google Custom Search API if available
        if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
          const examSpecificQuery = `${searchQuery} ${examType} exam preparation`;
          const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(examSpecificQuery)}&num=3`;
          
          const response = await fetch(searchUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              const filteredResults = filterSearchResults(data.items, type);
              if (filteredResults.length > 0) {
                return filteredResults[0].link;
              }
            }
          }
        }
        
        return null;
        
      } catch (error) {
        console.error(`Google search failed for "${searchQuery}":`, error.message);
        return null;
      }
    };
    
    // Filter search results based on resource type and exam relevance
    const filterSearchResults = (results, type) => {
      const typeFilters = {
        books: ['amazon.com', 'goodreads.com', 'books.google.com', 'barnesandnoble.com'],
        courses: ['unacademy.com', 'byjus.com', 'coursera.org', 'edx.org', 'udemy.com'],
        articles: ['scholar.google.com', 'testbook.com', 'gradeup.co'],
        videos: ['youtube.com', 'vimeo.com', 'unacademy.com', 'byjus.com'],
        tools: ['testbook.com', 'gradeup.co', 'oliveboard.in', 'adda247.com'],
        websites: [],
        exercises: ['testbook.com', 'gradeup.co', 'oliveboard.in', 'indiabix.com']
      };
      
      const filters = typeFilters[type] || [];
      if (filters.length === 0) return results;
      
      return results.filter(result => 
        filters.some(domain => result.link.toLowerCase().includes(domain.toLowerCase()))
      );
    };
    
    // Enhanced batch URL processing for resource categories with exam focus
    const processResourceCategory = async (resources, type) => {
      if (!Array.isArray(resources) || resources.length === 0) {
        return [];
      }

      console.log(`🔄 Processing ${resources.length} ${type} resources for ${examType} exam`);

      const optimizedQueries = await generateOptimizedSearchQueries(resources, type);

      const processedResources = [];
      
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        
        if (!resource.url || resource.url.trim() === '') {
          const title = resource.title || resource.name || 'resource';
            
          const searchQuery = optimizedQueries[String(i + 1)] || generateFallbackSearchQuery(resource, type);
          
          console.log(`🔍 Validating URL for ${examType} ${type}: "${title}"`);
          
          const realUrl = await findRealUrlWithGoogle(searchQuery, type);
          
          if (realUrl && realUrl.startsWith('http')) {
            if (type === 'videos') {
              resource.exact_url = realUrl;
              resource.searchQuery = null;
              console.log(`✅ Found real YouTube URL for ${examType} exam: ${realUrl}`);
            } else {
              resource.url = realUrl;
              console.log(`✅ Found real URL for ${examType} exam: ${realUrl}`);
            }
          } else {
            const encodedQuery = encodeURIComponent(searchQuery);
        
            switch(type) {
              case 'books':
                resource.url = `https://www.amazon.com/s?k=${encodedQuery}`;
                break;
              case 'courses':
                resource.url = `https://unacademy.com/search?q=${encodedQuery}`;
                break;
              case 'articles':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam+preparation`;
                break;
              case 'videos':
                resource.exact_url = null;
                const videoTitle = resource.title || 'video';
                const creatorName = resource.creator || resource.channel || '';
                resource.searchQuery = `site:youtube.com ${videoTitle} ${creatorName}`.trim();
                resource.url = `https://www.youtube.com/results?search_query=${encodedQuery}`;
                console.log(`⚠️ Video not found, setting searchQuery: "${resource.searchQuery}"`);
                break;
              case 'tools':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam+tool`;
                break;
              case 'websites':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam`;
                break;
              case 'exercises':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam+practice`;
                break;
              default:
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam`;
            }
            if (type !== 'videos') {
              console.log(`⚠️ Using ${examType} exam search page fallback for: "${title}"`);
            }
          }
        }
        
        processedResources.push(resource);
      }

      return processedResources;
    };
    
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
    
    if (parsed.resources) {
      // Check if resources is already categorized
      if (typeof parsed.resources === 'object' && !Array.isArray(parsed.resources)) {
        console.log("Competitive exam resources are already in categorized format");
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
        console.log("Competitive exam resources are in array format, categorizing...");
        for (const resource of parsed.resources) {
          if (!resource || !resource.type) continue;
          
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
          
          const processedResource = await processResourceCategory([resource], category);
          formattedResources[category].push(...processedResource);
        }
        console.log("Categorized competitive exam resources:", {
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
    
    // Final check to ensure all competitive exam resources have URLs
    for (const resourceType of Object.keys(formattedResources)) {
      formattedResources[resourceType] = await processResourceCategory(formattedResources[resourceType], resourceType);
    }

    const result = {
      summary: parsed.summary || `AI-generated content for ${subject} in ${examType} examination`,
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
      examples: Array.isArray(parsed.examples) ? parsed.examples : [],
      resources: formattedResources,
      visualizationSuggestions: parsed.visualizationSuggestions || {
        hasFlowcharts: true,
        hasComparisons: true,
        hasTimelines: false,
        hasFormulas: true,
        hasProcessSteps: true,
        hasCyclicalProcesses: false,
        hasHierarchies: false,
        hasRelationships: true,
        codeSimulationTopics: [],
        interactiveElements: ["Formula calculators", "Speed calculation tools"]
      },
      beautifulSummaryElements: parsed.beautifulSummaryElements || {
        keyInsights: [`Essential ${subject} concepts for ${examType} exam preparation`],
        practicalApplications: [`${examType} exam preparation`],
        whyItMatters: `Critical for ${examType} exam success`,
        careerRelevance: "Opens competitive career opportunities",
        difficultyLevel: context.learnerLevel || "Intermediate",
        prerequisites: [],
        estimatedStudyTime: "3-4 hours"
      },
      detailedSubsections: Array.isArray(parsed.detailedSubsections) ? parsed.detailedSubsections : [],
      
      // Competitive exam specific features
      speedSolvingTechniques: parsed.speedSolvingTechniques || [],
      commonTraps: parsed.commonTraps || [],
      memoryTricks: parsed.memoryTricks || [],
      examPatterns: parsed.examPatterns || [],
      timeAllocation: parsed.timeAllocation || "45-60 minutes"
    };
    
    console.log("Successfully processed competitive exam module summary with comprehensive resources");

    // After parsing detailedSubsections, add flashcards to each (ExamGenius only)
    if (result.isExamGenius && Array.isArray(result.detailedSubsections)) {
      result.detailedSubsections = result.detailedSubsections.map((subsection) => {
        // Extract formulas from all pages
        let formulas = [];
        if (Array.isArray(subsection.pages)) {
          subsection.pages.forEach(page => {
            if (Array.isArray(page.mathematicalContent)) {
              page.mathematicalContent.forEach(math => {
                if (math.content) {
                  formulas.push(math.content);
                }
              });
            }
          });
        }
        // Use summary or first page as explanation
        const explanation = subsection.summary || (subsection.pages && subsection.pages[0]?.content) || "";
        return {
          ...subsection,
          flashcards: [
            {
              type: "concept",
              explanation,
            },
            {
              type: "formulas",
              formulas,
            }
          ]
        };
      });
    }

    return result;
  } catch (error) {
    console.error("Error processing competitive exam Gemini response:", error);
    return extractDataWithRegex(responseText || "");
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

  const prompt1 = `
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
       
       CRITICAL: For each detailed subsection, you MUST create MULTIPLE PAGES of explanation:
       - MANDATORY: Page 1: "Introduction & Foundation" (200-300 words) - Basic concepts, definitions, context, why this topic matters
       - MANDATORY: Page 2: "Deep Dive & Analysis" (200-300 words) - Technical details, mechanisms, processes, how it works
       - MANDATORY: Page 3: "Applications & Implementation" (200-300 words) - Real-world uses, advanced concepts, practical applications
       - OPTIONAL: Page 4: "Advanced Topics & Future Directions" (200-300 words) - For complex topics only
       
       REQUIREMENTS FOR EACH PAGE:
       - Each page MUST have a clear, descriptive title
       - Each page MUST contain 200-300 words of substantive content
       - Each page MUST have a key takeaway that summarizes the main learning point
       - Content should flow naturally from basic to advanced across pages
       - Use examples, analogies, and practical applications appropriate for ${learnerLevel} level
       - Include common pitfalls and misconceptions where relevant
       
       SPECIAL CONTENT REQUIREMENTS:
       - FOR PROGRAMMING TOPICS: Include practical code examples in relevant languages (JavaScript, Python, Java, C++, etc.)
       - FOR MATHEMATICAL CONCEPTS: Include formulas, equations, step-by-step calculations, and numerical examples
       - FOR ALGORITHMS: Provide pseudocode and implementation examples
       - FOR DATA STRUCTURES: Show code implementations and visual representations
       - FOR THEORETICAL CONCEPTS: Include mathematical proofs, derivations, and formal definitions when appropriate
    
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

    CRITICAL CONTENT INCLUSION RULES:
    
    FOR PROGRAMMING/CODING TOPICS:
    - ALWAYS include practical, runnable code examples in each page
    - Use the most relevant programming language for the topic (JavaScript for web dev, Python for data science, etc.)
    - Provide complete, working code snippets that students can run and modify
    - Include comments explaining each part of the code
    - Show progression from basic to advanced implementations across pages
    - Include common debugging scenarios and solutions
    
    FOR MATHEMATICAL TOPICS:
    - ALWAYS include mathematical formulas, equations, or calculations
    - Use LaTeX notation for complex mathematical expressions
    - Provide step-by-step mathematical derivations
    - Include numerical examples with specific values
    - Show how to solve problems using the mathematical concepts
    - Connect abstract math to practical applications
    
    FOR ALGORITHM TOPICS:
    - Include both pseudocode and actual implementation
    - Show time and space complexity analysis
    - Provide multiple implementation approaches
    - Include visualization descriptions for complex algorithms
    
    FOR DATA STRUCTURE TOPICS:
    - Show code implementations in multiple languages
    - Include visual representations and operations
    - Demonstrate insertion, deletion, and search operations
    - Compare different data structures for similar use cases

    CRITICAL OUTPUT REQUIREMENTS:
    Please return the output in a markdown code block with JSON format. If the output is large, break it into pieces no larger than 9000 characters each.
    
    Use this structure for large responses:
    \`\`\`json
    {
      "part1": {
        "summary": "...",
        "objectives": [...],
        "examples": [...]
      },
      "part2": {
        "visualizationSuggestions": {...},
        "beautifulSummaryElements": {...}
      },
      "part3": {
        "resources": {...}
      },
      "part4": {
        "detailedSubsections": [...]
      }
    }
    \`\`\`
    
    For smaller responses, use a single part:
    \`\`\`json
    {
      "complete": {
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
            "pages": [
              {
                "pageNumber": 1,
                "pageTitle": "Introduction & Foundation",
                "content": "Basic concepts, definitions, and context (200-300 words). This page introduces the fundamental ideas and provides the necessary background knowledge.",
                "codeExamples": [
                  {
                    "language": "javascript|python|java|cpp|etc.",
                    "title": "Example Title",
                    "code": "// Complete, runnable code example\nconst example = 'Hello World';",
                    "explanation": "Clear explanation of what the code does and why it's relevant"
                  }
                ],
                "mathematicalContent": [
                  {
                    "type": "formula|equation|calculation|proof",
                    "title": "Mathematical Concept Title",
                    "content": "LaTeX or plain text mathematical expression",
                    "explanation": "Step-by-step explanation of the mathematical concept",
                    "example": "Numerical example with specific values"
                  }
                ],
                "keyTakeaway": "Main learning point for this foundational page"
              },
              {
                "pageNumber": 2,
                "pageTitle": "Deep Dive & Analysis",
                "content": "Technical details, mechanisms, and processes (200-300 words). This page explores the topic in greater depth with detailed explanations.",
                "codeExamples": [
                  {
                    "language": "javascript|python|java|cpp|etc.",
                    "title": "Advanced Example Title",
                    "code": "// More complex code example\nfunction advancedExample() {\n  // implementation\n}",
                    "explanation": "Detailed explanation of advanced concepts"
                  }
                ],
                "mathematicalContent": [
                  {
                    "type": "formula|equation|calculation|proof",
                    "title": "Advanced Mathematical Concept",
                    "content": "More complex mathematical expressions",
                    "explanation": "Detailed mathematical analysis",
                    "example": "Complex numerical example"
                  }
                ],
                "keyTakeaway": "Main learning point for this analytical page"
              },
              {
                "pageNumber": 3,
                "pageTitle": "Applications & Implementation",
                "content": "Real-world uses, advanced concepts, and practical applications (200-300 words). This page shows how the concepts are used in practice.",
                "codeExamples": [
                  {
                    "language": "javascript|python|java|cpp|etc.",
                    "title": "Real-world Implementation",
                    "code": "// Practical implementation example\nclass PracticalExample {\n  // real-world code\n}",
                    "explanation": "How this code is used in real applications"
                  }
                ],
                "mathematicalContent": [
                  {
                    "type": "formula|equation|calculation|proof",
                    "title": "Applied Mathematics",
                    "content": "Mathematical formulas used in practice",
                    "explanation": "How mathematics applies to real-world problems",
                    "example": "Practical calculation example"
                  }
                ],
                "keyTakeaway": "Main learning point for this application-focused page"
              }
            ],
            "practicalExample": "Real-world example or application",
            "commonPitfalls": ["Common mistake 1", "Common mistake 2", "How to avoid these issues"],
            "difficulty": "Beginner|Intermediate|Advanced",
            "estimatedTime": "Time to complete this subsection"
          }
        ]
      }
    }
    \`\`\`
    
    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON inside a single Markdown code block.
    • Begin the response with three backticks followed by the word json (\`\`\`json) on its own line.
    • End the response with three backticks (\`\`\`).
    • Do NOT include any additional commentary, explanation, or prose outside the code block.
    • Ensure the JSON is completely valid and self-contained.
    • If content is too large, break it into numbered parts (part1, part2, etc.) within the JSON structure.
  `;

  try {
    console.log("Processing LLM response for module summary...");
    
    responseText = await callGeminiWithRetry(model, prompt, 5, 3000); // More retries for complex operations
    
    console.log(`Response size: ${responseText.length} characters`);
    
    // Extract JSON from markdown code block
    const codeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (!codeBlockMatch) {
      console.log("No JSON code block found, trying to extract JSON directly...");
      // Fallback to old extraction method
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
    } else {
      responseText = codeBlockMatch[1];
      console.log("Successfully extracted JSON from markdown code block");
    }
    
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

    // Enhanced JSON parsing with chunked response support
    let parsed = null;
    let jsonText = responseText;
    
    // Use the new robust parsing approach
    parsed = await parseLargeGeminiResponse(responseText);
    
    if (parsed) {
      console.log("✅ Successfully parsed JSON response using robust parsing");
      
      // Handle chunked response format
      if (parsed.part1 || parsed.part2 || parsed.part3 || parsed.part4) {
        console.log("Detected chunked response, merging parts...");
        const mergedData = {};
        
        // Merge all parts into a single object
        Object.keys(parsed).forEach(partKey => {
          if (partKey.startsWith('part')) {
            Object.assign(mergedData, parsed[partKey]);
          }
        });
        
        parsed = mergedData;
        console.log("Successfully merged chunked response parts");
      } else if (parsed.complete) {
        // Handle single complete response
        parsed = parsed.complete;
        console.log("Using complete response format");
      }
    }
    
    // Strategy 4: If all JSON parsing fails, extract data with regex
    if (!parsed) {
      console.log("All JSON parsing strategies failed, using regex extraction...");
      try {
        parsed = extractDataWithRegex(responseText);
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
              pages: [
                {
                  pageNumber: 1,
                  pageTitle: "Introduction & Foundation",
                  content: "Fundamental concepts and principles will be explained in detail once the content is fully processed. This page will introduce the basic ideas and provide necessary background knowledge.",
                  codeExamples: [],
                  mathematicalContent: [],
                  keyTakeaway: "Understanding the foundational concepts"
                },
                {
                  pageNumber: 2,
                  pageTitle: "Deep Dive & Analysis",
                  content: "Technical details and mechanisms will be explored in depth once processing is complete. This page will provide detailed explanations of how things work.",
                  codeExamples: [],
                  mathematicalContent: [],
                  keyTakeaway: "Mastering the technical details"
                },
                {
                  pageNumber: 3,
                  pageTitle: "Applications & Implementation",
                  content: "Real-world applications and practical implementations will be demonstrated once the content is ready. This page will show how to apply the concepts in practice.",
                  codeExamples: [],
                  mathematicalContent: [],
                  keyTakeaway: "Applying knowledge in real-world scenarios"
                }
              ],
              practicalExample: "Practical examples will be provided",
              commonPitfalls: ["Common issues will be identified", "Best practices will be shared"],
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
5. Consider popular platforms for this resource type and exam preparation

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
          const optimizedQueries = await parseLargeGeminiResponse(jsonText);
          
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

    // Simple fallback search query generation (same as general function)
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
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
          console.log("🔑 YouTube API key not configured");
          return null;
        }

        const fullQuery = creator ? `${searchQuery} ${creator}` : searchQuery;
        const encodedQuery = encodeURIComponent(fullQuery);
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodedQuery}&order=relevance&safeSearch=none&key=${apiKey}`;

        console.log(`🎬 Searching YouTube for: "${fullQuery}"`);
        
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) {
          console.log(`❌ YouTube search failed (${searchRes.status}): ${searchRes.statusText}`);
          return null;
        }

        const searchData = await searchRes.json();
        const videoIds = searchData.items?.map(item => item.id.videoId).filter(Boolean);
        if (!videoIds || videoIds.length === 0) {
          console.log("⚠️ No video IDs found");
          return null;
        }

        // Fetch video stats and status
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${videoIds.join(',')}&key=${apiKey}`;
          const statsRes = await fetch(statsUrl);
    
        if (!statsRes.ok) {
          console.log("⚠️ Stats fetch failed, using fallback");
        } else {
            const statsData = await statsRes.json();
            
          const validVideos = statsData.items
            .filter(video =>
              video.status?.privacyStatus === 'public' &&
              video.status?.uploadStatus === 'processed' &&
              !video.status?.rejectionReason
            )
            .map(video => ({
              videoId: video.id,
              title: video.snippet.title,
              viewCount: parseInt(video.statistics?.viewCount || '0', 10),
              relevanceTitleMatch: video.snippet.title.toLowerCase().includes(searchQuery.toLowerCase())
            }))
            .sort((a, b) => {
              // Prioritize relevance match, then views
              if (a.relevanceTitleMatch && !b.relevanceTitleMatch) return -1;
              if (!a.relevanceTitleMatch && b.relevanceTitleMatch) return 1;
              return b.viewCount - a.viewCount;
            });
    
          if (validVideos.length > 0) {
            const top = validVideos[0];
            console.log(`✅ Top matched video: ${top.title} (${top.viewCount.toLocaleString()} views)`);
            return `https://www.youtube.com/watch?v=${top.videoId}`;
          }
        }
    
        // Fallback to first result from search if everything else fails
        const fallback = searchData.items[0];
        if (fallback?.id?.videoId) {
          console.log(`🎬 Fallback video used: ${fallback.snippet.title}`);
          return `https://www.youtube.com/watch?v=${fallback.id.videoId}`;
        }
    
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
        books: ['amazon.com', 'goodreads.com', 'books.google.com', 'barnesandnoble.com'],
        courses: ['unacademy.com', 'byjus.com', 'coursera.org', 'edx.org', 'udemy.com'],
        articles: ['scholar.google.com', 'testbook.com', 'gradeup.co'],
        videos: ['youtube.com', 'vimeo.com', 'unacademy.com', 'byjus.com'],
        tools: ['testbook.com', 'gradeup.co', 'oliveboard.in', 'adda247.com'],
        websites: [],
        exercises: ['testbook.com', 'gradeup.co', 'oliveboard.in', 'indiabix.com']
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

      console.log(`🔄 Processing ${resources.length} ${type} resources for ${examType} exam`);

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
          
          console.log(`🔍 Validating URL for ${examType} ${type}: "${title}"`);
          
          // Try to find a real URL using Google Custom Search
          const realUrl = await findRealUrlWithGoogle(searchQuery, type);
          
          if (realUrl && realUrl.startsWith('http')) {
            if (type === 'videos') {
              resource.exact_url = realUrl;
              resource.searchQuery = null;
              console.log(`✅ Found real YouTube URL for ${examType} exam: ${realUrl}`);
            } else {
              resource.url = realUrl;
              console.log(`✅ Found real URL for ${examType} exam: ${realUrl}`);
            }
          } else {
            // Exam-specific fallback to search page URLs
            const encodedQuery = encodeURIComponent(searchQuery);
        
        switch(type) {
          case 'books':
                resource.url = `https://www.amazon.com/s?k=${encodedQuery}`;
            break;
          case 'courses':
                resource.url = `https://unacademy.com/search?q=${encodedQuery}`;
            break;
          case 'articles':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam+preparation`;
            break;
          case 'videos':
                resource.exact_url = null;
                const videoTitle = resource.title || 'video';
                const creatorName = resource.creator || resource.channel || '';
                resource.searchQuery = `site:youtube.com ${videoTitle} ${creatorName}`.trim();
                resource.url = `https://www.youtube.com/results?search_query=${encodedQuery}`;
                console.log(`⚠️ Video not found, setting searchQuery: "${resource.searchQuery}"`);
            break;
          case 'tools':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam+tool`;
            break;
          case 'websites':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam`;
            break;
          case 'exercises':
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam+practice`;
            break;
          default:
                resource.url = `https://www.google.com/search?q=${encodedQuery}+${examType}+exam`;
            }
            if (type !== 'videos') {
              console.log(`⚠️ Using ${examType} exam search page fallback for: "${title}"`);
            }
          }
        }
        
        processedResources.push(resource);
      }

      return processedResources;
    };
    
    if (parsed.resources) {
      // Check if resources is already categorized
      if (typeof parsed.resources === 'object' && !Array.isArray(parsed.resources)) {
        console.log("Competitive exam resources are already in categorized format");
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
        console.log("Competitive exam resources are in array format, categorizing...");
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
        console.log("Categorized competitive exam resources:", {
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
    
    // Final check to ensure all competitive exam resources have URLs with proper async handling
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
    
    console.log("Successfully processed competitive exam module summary with comprehensive resources");
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
    
    MATHEMATICAL CONTENT FORMATTING REQUIREMENTS:
    - Format all mathematical equations and formulas using LaTeX syntax with PROPER ESCAPING
    - For inline equations, use $...$ delimiters (e.g., $E = mc^2$)
    - For block/display equations, use $$...$$ delimiters 
    - CRITICAL: Always use double backslashes for LaTeX commands: \\frac{numerator}{denominator}, \\sqrt{expression}, \\sum, \\int
    - For fractions: ALWAYS use \\frac{numerator}{denominator} (with double backslash)
    - For exponents: x^{power} or x^2 
    - For subscripts: x_{index} or x_1
    - For square roots: \\sqrt{expression} (with double backslash)
    - For summations: \\sum_{i=1}^{n} (with double backslash)
    - For integrals: \\int_{a}^{b} f(x) dx (with double backslash)
    - For limits: \\lim_{x \\to 0} f(x) (with double backslashes)
    - For Greek letters: \\alpha, \\beta, \\theta, \\pi, \\infty (with double backslashes)
    - Use \\text{} for text within equations: $\\text{area} = \\pi r^2$
    - EXAMPLES OF CORRECT FORMATTING:
      * Fraction: $\\frac{1}{2}$ or $$\\frac{numerator}{denominator}$$
      * Square root: $\\sqrt{25} = 5$
      * Summation: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
      * Integration: $\\int_{0}^{1} x^2 dx = \\frac{1}{3}$
    
    Content: ${moduleContent}
    
    REQUIREMENTS:
    - Each question should test understanding of key concepts
    - Include mathematical formulas and calculations where appropriate using LaTeX syntax
    - Options should be plausible but only one clearly correct
    - Explanations should be clear and educational, using LaTeX for mathematical content
    - Questions should be appropriate for ${difficulty} difficulty level
    
    CRITICAL OUTPUT REQUIREMENTS:
    Please return the output in a markdown code block with JSON format. If the output is large, break it into pieces no larger than 9000 characters each.
    
    Use this structure for large responses:
    \`\`\`json
    {
      "part1": {
        "questions": [
          {
            "question": "Question text with LaTeX formatting for math: $x^2 + y^2 = z^2$",
            "options": ["Option A with math: $a = \\frac{b}{c}$", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": "Explanation with LaTeX math: The formula $E = mc^2$ shows..."
          }
        ]
      },
      "part2": {
        "questions": [...]
      }
    }
    \`\`\`
    
    For smaller responses, use a single part:
    \`\`\`json
    {
      "complete": {
        "questions": [
          {
            "question": "Question text with LaTeX formatting for math: $x^2 + y^2 = z^2$",
            "options": ["Option A with math: $a = \\frac{b}{c}$", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": "Explanation with LaTeX math: The formula $E = mc^2$ shows..."
          }
        ]
      }
    }
    \`\`\`
    
    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON inside a single Markdown code block.
    • Begin the response with three backticks followed by the word json (\`\`\`json) on its own line.
    • End the response with three backticks (\`\`\`).
    • Do NOT include any additional commentary, explanation, or prose outside the code block.
    • Ensure the JSON is completely valid and self-contained.
    • If content is too large, break it into numbered parts (part1, part2, etc.) within the JSON structure.
  `;

  try {
    let responseText = await callGeminiWithRetry(model, prompt, 3, 2000);
    
    // Extract JSON from markdown code block
    const codeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (!codeBlockMatch) {
      console.log("No JSON code block found in quiz response, trying to extract JSON directly...");
      // Fallback to old extraction method
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
    } else {
      responseText = codeBlockMatch[1];
      console.log("Successfully extracted JSON from markdown code block for quiz");
    }
    
    // Parse the JSON with robust parsing
    let parsed = await parseLargeGeminiResponse(responseText);
    
    if (parsed) {
      // Handle chunked response format
      if (parsed.part1 || parsed.part2) {
        console.log("Detected chunked quiz response, merging parts...");
        const mergedQuestions = [];
        
        // Merge all parts into a single questions array
        Object.keys(parsed).forEach(partKey => {
          if (partKey.startsWith('part') && parsed[partKey].questions) {
            mergedQuestions.push(...parsed[partKey].questions);
          }
        });
        
        parsed = { questions: mergedQuestions };
        console.log("Successfully merged chunked quiz response parts");
      } else if (parsed.complete) {
        // Handle single complete response
        parsed = parsed.complete;
        console.log("Using complete quiz response format");
      }
    }
    
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
    
    CRITICAL OUTPUT REQUIREMENTS:
    Please return the output in a markdown code block with JSON format. If the output is large, break it into pieces no larger than 9000 characters each.
    
    Use this structure for large responses:
    \`\`\`json
    {
      "part1": {
        "response": "First part of your helpful response..."
      },
      "part2": {
        "response": "Second part of your response..."
      }
    }
    \`\`\`
    
    For smaller responses, use a single part:
    \`\`\`json
    {
      "complete": {
        "response": "Your complete helpful, encouraging tutor response that directly answers the question, uses simple language, provides examples when helpful, and encourages further learning."
      }
    }
    \`\`\`
    
    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON inside a single Markdown code block.
    • Begin the response with three backticks followed by the word json (\`\`\`json) on its own line.
    • End the response with three backticks (\`\`\`).
    • Do NOT include any additional commentary, explanation, or prose outside the code block.
    • Ensure the JSON is completely valid and self-contained.
    • If content is too large, break it into numbered parts (part1, part2, etc.) within the JSON structure.
  `

  try {
    let responseText = await callGeminiWithRetry(model, context, 3, 2000);
    
    // Extract JSON from markdown code block
    const codeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (!codeBlockMatch) {
      console.log("No JSON code block found in tutor response, using direct response...");
      // If no JSON structure, return the text directly as fallback
      return responseText;
    } else {
      responseText = codeBlockMatch[1];
      console.log("Successfully extracted JSON from markdown code block for tutor response");
    }
    
    try {
      // Parse the JSON with robust parsing
      let parsed = await parseLargeGeminiResponse(responseText);
      
      if (parsed) {
        // Handle chunked response format
        if (parsed.part1 || parsed.part2) {
          console.log("Detected chunked tutor response, merging parts...");
          let mergedResponse = "";
          
          // Merge all parts into a single response string
          Object.keys(parsed).forEach(partKey => {
            if (partKey.startsWith('part') && parsed[partKey].response) {
              mergedResponse += parsed[partKey].response + " ";
            }
          });
          
          console.log("Successfully merged chunked tutor response parts");
          return mergedResponse.trim();
        } else if (parsed.complete && parsed.complete.response) {
          // Handle single complete response
          console.log("Using complete tutor response format");
          return parsed.complete.response;
        } else if (parsed.response) {
          // Handle direct response format
          return parsed.response;
        }
      }
      
      // Fallback to original text if parsing fails or no expected structure
      console.log("Using raw response as fallback");
      return responseText;
    } catch (parseError) {
      console.log("Failed to parse tutor response JSON, using raw response...");
      return responseText;
    }
  } catch (error) {
    console.error("Error generating tutor response:", error);
    return "I apologize, but I'm having trouble generating a response right now. Please try asking your question again, or check your internet connection.";
  }
}

export async function generateOrProcessCurriculum(mode, inputTextOrCourseName) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an expert curriculum processor and generator.

## Task Modes:
There are two modes: 
- \`PROCESS\` – Convert raw text from syllabus files into structured markdown
- \`GENERATE\` – Create syllabus from scratch based on course name

Respond in valid Markdown only.

---

## MODE: ${mode}   (use PROCESS or GENERATE)

## INPUT:
${inputTextOrCourseName}

---

## OUTPUT FORMAT:
Generate the output in the following nested Markdown structure:

# {Course Title}

## Module {n}: {Module Name}
### {n.1} {Main Topic}
#### {n.1.1} {Subtopic 1}
#### {n.1.2} {Subtopic 2}
...

## EXAMPLE:

### INPUT
Module 1: Electric Circuits and Fields
- Basic concepts: resistance, inductance, capacitance, and influencing factors
- Circuit laws: Ohm's law, KCL, KVL

### OUTPUT
## Module 1: Electric Circuits and Fields

### 1.1 Basic concepts
#### 1.1.1 Resistance
#### 1.1.2 Inductance
#### 1.1.3 Capacitance
#### 1.1.4 Influencing factors

### 1.2 Circuit laws
#### 1.2.1 Ohm's law
#### 1.2.2 KCL
#### 1.2.3 KVL

---

## RULES:
- Start every module with \`## Module n: Title\`
- For every bullet line like \`- A: B, C\`, split B, C into subtopics and nest under A
- Output must only include well-structured Markdown ready for \`.md\` file
- Avoid extra commentary unless asked in a separate instruction

Return only the markdown content for saving directly to file.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean up the response to ensure it's valid markdown
    return text.replace(/```markdown/g, "").replace(/```/g, "").trim();
  } catch (error) {
    console.error("Error generating or processing curriculum:", error);
    throw new Error("Failed to process curriculum with AI.");
  }
}

export async function generateCompetitiveExamSubsectionDetails(content, context = {}) {
 const {
   subject = "Quantitative Aptitude",
   examType = "SSC",
   moduleTitle = "Module",
   subsectionTitle = "Subsection"
 } = context

 const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
 const prompt = `
   Analyze the following content for a single subsection titled "${subsectionTitle}" from the module "${moduleTitle}". Generate a detailed breakdown for this subsection, tailored for the ${examType} competitive exam in the subject of ${subject}.

   MATHEMATICAL CONTENT FORMATTING RULES (CRITICAL):
   - Use proper LaTeX syntax for all mathematical expressions.
   - For inline math, enclose expressions in SINGLE dollar signs: $...$ (never double dollar signs for inline)
   - For block/display math, use DOUBLE dollar signs on separate lines:
     $$
     equation here
     $$
   - Use SINGLE backslashes for LaTeX commands: $\\frac{a}{b}$, $\\sqrt{x}$, $\\sum_{i=1}^{n}$
   - NEVER use double backslashes (\\\\) in LaTeX commands
   - NEVER duplicate math expressions (don't repeat the same equation twice)
   - For fractions, always use proper syntax: $\\frac{numerator}{denominator}$
   - For Greek letters, always use backslash: $\\alpha$, $\\beta$, $\\theta$, etc.
   - For subscripts and superscripts, use proper syntax: $x_{i}$, $y^{2}$
   - For multi-character subscripts, use curly braces: $x_{\\text{total}}$
   - Always close all LaTeX environments and brackets
   - NEVER mix markdown formatting inside LaTeX expressions

   Please provide for this SINGLE subsection:
   1. A brief summary (2-3 sentences).
   2. 3-5 key learning points.
   3. Exactly 6 pages of focused explanation, each 250-350 words:
       - Page 1: "Introduction & Foundation"
       - Page 2: "Core Theory & Mathematical Principles"
       - Page 3: "Problem-Solving Techniques & Strategies"
       - Page 4: "Speed Techniques & Shortcuts"
       - Page 5: "Common Traps & Error Prevention"
       - Page 6: "Practice Problems & Applications"
   4. A practical example relevant to the subsection.
   5. A list of common pitfalls.

   Content for subsection "${subsectionTitle}":
   ${content}

   CRITICAL OUTPUT REQUIREMENTS:
   Return the output as a single JSON object inside a markdown code block.
   DO NOT include any explanations or text outside the JSON code block.
   ONLY return valid, parseable JSON.
   ENSURE all LaTeX is properly formatted according to the rules above.
   VERIFY that no mathematical expressions are duplicated.

   Use this structure:
   \`\`\`json
   {
     "summary": "A brief and engaging summary of the subsection's content.",
     "keyPoints": [
       "First key point.",
       "Second key point.",
       "Third key point."
     ],
     "pages": [
       { "pageNumber": 1, "pageTitle": "Introduction & Foundation", "content": "...", "keyTakeaway": "..." },
       { "pageNumber": 2, "pageTitle": "Core Theory & Mathematical Principles", "content": "...", "keyTakeaway": "..." },
       { "pageNumber": 3, "pageTitle": "Problem-Solving Techniques & Strategies", "content": "...", "keyTakeaway": "..." },
       { "pageNumber": 4, "pageTitle": "Speed Techniques & Shortcuts", "content": "...", "keyTakeaway": "..." },
       { "pageNumber": 5, "pageTitle": "Common Traps & Error Prevention", "content": "...", "keyTakeaway": "..." },
       { "pageNumber": 6, "pageTitle": "Practice Problems & Applications", "content": "...", "keyTakeaway": "..." }
     ],
     "practicalExample": "A relevant, practical example.",
     "commonPitfalls": [
       "A common mistake learners make.",
       "Another potential trap."
     ]
   }
   \`\`\`
 `;

 try {
   console.log(`Generating content for subsection: "${subsectionTitle}"`);
   const responseText = await callGeminiWithRetry(model, prompt, 3, 2000);
   
   // First, try to extract JSON from code block
   const jsonCodeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
   let jsonStr = jsonCodeBlockMatch ? jsonCodeBlockMatch[1].trim() : responseText;
   
   // Try multiple parsing strategies
   console.log("Attempting to parse AI response...");
   let parsedData = null;
   
   // Strategy 1: Direct JSON.parse
   try {
     parsedData = JSON.parse(jsonStr);
     console.log("✅ Direct JSON.parse successful");
   } catch (parseError) {
     console.log("⚠️ Standard JSON.parse failed:", parseError.message);
     
     // Strategy 2: Try to repair the JSON
     try {
       console.log("🔧 Attempting to repair JSON string...");
       const repairedJson = await repairJsonString(jsonStr);
       parsedData = JSON.parse(repairedJson);
       console.log("✅ JSON repair successful");
     } catch (repairError) {
       console.log("⚠️ JSON repair failed:", repairError.message);
       
       // Strategy 3: Try JSON5 as a fallback
       try {
         console.log("🧪 Attempting JSON5 fallback parse...");
         parsedData = tryJson5Parse(jsonStr);
         console.log("✅ JSON5 parse successful");
       } catch (json5Error) {
         console.log("❌ JSON5 fallback also failed:", json5Error.message);
         
         // Strategy 4: Use regex extraction as last resort
         console.log("🔍 Attempting regex-based extraction...");
         parsedData = extractDataWithRegex(responseText);
       }
     }
   }

   // If we still don't have valid data, return a fallback structure
   if (!parsedData || !parsedData.pages || parsedData.pages.length === 0) {
     console.warn("❌ All parsing strategies failed. Using fallback structure.");
     return createFallbackSubsectionContent(subsectionTitle);
   }
   
   // Ensure the structure is complete and valid
   const validatedData = validateAndFixSubsectionData(parsedData, subsectionTitle);
   console.log(`✅ Successfully generated and parsed content for "${subsectionTitle}"`);
   return validatedData;

 } catch (error) {
   console.error(`Error generating subsection details for "${subsectionTitle}":`, error);
   return createFallbackSubsectionContent(subsectionTitle);
 }
}

// Helper function to create fallback content when generation fails
function createFallbackSubsectionContent(subsectionTitle) {
  return {
    title: subsectionTitle,
    summary: "Content for this subsection will be available soon.",
    keyPoints: ["This section is being prepared.", "Check back later for complete content."],
    pages: [
      {
        pageNumber: 1,
        pageTitle: "Introduction & Foundation",
        content: "We're currently preparing comprehensive content for this section. In the meantime, you can explore other sections of the course.",
        keyTakeaway: "Content coming soon."
      },
      {
        pageNumber: 2,
        pageTitle: "Core Theory & Mathematical Principles",
        content: "This section is under development.",
        keyTakeaway: "Check back later."
      },
      {
        pageNumber: 3,
        pageTitle: "Problem-Solving Techniques & Strategies",
        content: "This section is under development.",
        keyTakeaway: "Check back later."
      },
      {
        pageNumber: 4,
        pageTitle: "Speed Techniques & Shortcuts",
        content: "This section is under development.",
        keyTakeaway: "Check back later."
      },
      {
        pageNumber: 5,
        pageTitle: "Common Traps & Error Prevention",
        content: "This section is under development.",
        keyTakeaway: "Check back later."
      },
      {
        pageNumber: 6,
        pageTitle: "Practice Problems & Applications",
        content: "This section is under development.",
        keyTakeaway: "Check back later."
      }
    ],
    practicalExample: "Examples will be provided in the complete version.",
    commonPitfalls: ["Content coming soon."]
  };
}

// Helper function to validate and fix subsection data
function validateAndFixSubsectionData(data, subsectionTitle) {
  // Ensure all required fields exist
  const result = {
    title: subsectionTitle,
    summary: data.summary || "Summary not available",
    keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : ["Key points not available"],
    pages: [],
    practicalExample: data.practicalExample || "Example not available",
    commonPitfalls: Array.isArray(data.commonPitfalls) ? data.commonPitfalls : ["Common pitfalls not available"]
  };
  
  // Ensure we have exactly 6 pages with all required fields
  const expectedPages = [
    { pageNumber: 1, pageTitle: "Introduction & Foundation" },
    { pageNumber: 2, pageTitle: "Core Theory & Mathematical Principles" },
    { pageNumber: 3, pageTitle: "Problem-Solving Techniques & Strategies" },
    { pageNumber: 4, pageTitle: "Speed Techniques & Shortcuts" },
    { pageNumber: 5, pageTitle: "Common Traps & Error Prevention" },
    { pageNumber: 6, pageTitle: "Practice Problems & Applications" }
  ];
  
  // Process existing pages
  const existingPages = Array.isArray(data.pages) ? data.pages : [];
  
  // Create the final pages array with all required fields
  for (let i = 0; i < 6; i++) {
    const expectedPage = expectedPages[i];
    const existingPage = existingPages[i] || {};
    
    result.pages.push({
      pageNumber: expectedPage.pageNumber,
      pageTitle: existingPage.pageTitle || expectedPage.pageTitle,
      content: existingPage.content || `Content for ${expectedPage.pageTitle} will be available soon.`,
      keyTakeaway: existingPage.keyTakeaway || "Key takeaway not available"
    });
  }
  
  return result;
}