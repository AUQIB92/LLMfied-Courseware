import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";
import JSON5 from "json5";

// Check if API key is configured
if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY environment variable is not set!");
  console.log("Please set your Gemini API key in your environment variables:");
  console.log(
    "For development: Create a .env.local file with GEMINI_API_KEY=your_api_key_here"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Retry logic for Gemini API call
async function callGeminiWithRetry(
  model,
  prompt,
  maxRetries = 3,
  retryDelay = 2000
) {
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
      console.log(
        `✅ Gemini call successful in ${duration.toFixed(
          2
        )} seconds, response length: ${responseText.length} characters`
      );

      return responseText;
    } catch (error) {
      lastError = error;
      console.warn(
        `❌ Gemini attempt ${attempt}/${maxRetries} failed:`,
        error.message
      );

      // Log more details about the error
      if (error.response) {
        console.error(`Error status: ${error.response.status}`);
        console.error(`Error details:`, error.response.data);
      }

      // Wait longer for each retry
      const waitTime = retryDelay * attempt;
      console.log(`Waiting ${waitTime / 1000} seconds before retry...`);
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }

  console.error(`❌❌❌ Gemini failed after ${maxRetries} attempts.`);
  throw new Error(
    `Gemini failed after ${maxRetries} attempts. Last error: ${lastError}`
  );
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const responseText = await callGeminiWithRetry(
      model,
      "Say 'Hello World' if you can read this.",
      2,
      1000
    );
    return { success: true, response: responseText };
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return { success: false, error: error.message };
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
      },
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
    const percentages = [
      95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10,
    ];

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

        console.log(
          `Successfully parsed JSON at ${length} characters (${percentage}% of original)`
        );
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
      /},\s*"[^"]*":\s*{[^}]*}$/m, // Complete object property
      /],\s*"[^"]*":\s*\[[^\]]*\]$/m, // Complete array property
      /"\s*}$/m, // String ending an object
      /\]\s*}$/m, // Array ending an object
      /}\s*$/m, // Just object ending
    ];

    // Try each pattern to find a good cut point
    for (const pattern of patterns) {
      const match = jsonStr.match(pattern);
      if (match) {
        const cutPoint = match.index + match[0].length;
        if (cutPoint < jsonStr.length * 0.9) {
          // Don't cut too little
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

      if (char === "\\" && inString) {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
          if (braceCount === 0 && bracketCount === 0) {
            lastValidIndex = i + 1;
          }
        } else if (char === "[") {
          bracketCount++;
        } else if (char === "]") {
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
    const summaryMatch = jsonStr.match(
      /"summary"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/
    );
    const objectivesMatch = jsonStr.match(/"objectives"\s*:\s*\[(.*?)\]/s);
    const examplesMatch = jsonStr.match(/"examples"\s*:\s*\[(.*?)\]/s);

    let minimalJson = "{";

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

    minimalJson += "}";

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
      exercises: [],
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
      interactiveElements: [],
    },
    beautifulSummaryElements: {
      keyInsights: [],
      practicalApplications: [],
      whyItMatters:
        "This topic is important for understanding the subject area.",
      careerRelevance:
        "Understanding this topic can enhance your professional skills.",
      difficultyLevel: "Intermediate",
      prerequisites: [],
      estimatedStudyTime: "2-3 hours",
    },
    detailedSubsections: [],
  };

  try {
    // Extract summary
    const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]+)"/);
    if (summaryMatch && summaryMatch[1]) {
      result.summary = summaryMatch[1];
    } else {
      // Fallback: use first 200 characters
      result.summary =
        responseText.substring(0, 200).replace(/[{}"]/g, "") + "...";
    }

    // Extract objectives array
    const objectivesMatch = responseText.match(/"objectives"\s*:\s*\[(.*?)\]/s);
    if (objectivesMatch && objectivesMatch[1]) {
      const objectiveItems = objectivesMatch[1].match(/"([^"]+)"/g);
      if (objectiveItems) {
        result.objectives = objectiveItems.map((item) =>
          item.replace(/"/g, "")
        );
      }
    }

    // Extract examples array
    const examplesMatch = responseText.match(/"examples"\s*:\s*\[(.*?)\]/s);
    if (examplesMatch && examplesMatch[1]) {
      const exampleItems = examplesMatch[1].match(/"([^"]+)"/g);
      if (exampleItems) {
        result.examples = exampleItems.map((item) => item.replace(/"/g, ""));
      }
    }

    // Enhanced detailed subsections extraction with multiple strategies
    const detailedSubsections = [];

    // Strategy 1: Try to extract complete detailedSubsections array
    const subsectionsMatch = responseText.match(
      /"detailedSubsections"\s*:\s*\[(.*?)\]/s
    );
    if (subsectionsMatch && subsectionsMatch[1]) {
      try {
        // Try to parse individual subsections from the array content
        const subsectionContent = subsectionsMatch[1];

        // Find all complete subsection objects
        const subsectionObjectMatches = subsectionContent.match(
          /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
        );
        if (subsectionObjectMatches) {
          subsectionObjectMatches.forEach((subsectionStr, index) => {
            try {
              // Try to parse each subsection individually
              const repairedSubsection = repairJsonString(subsectionStr);
              const subsection = JSON.parse(repairedSubsection);
              detailedSubsections.push(subsection);
            } catch (error) {
              // If parsing fails, extract manually with regex
              const title =
                extractFieldFromObject(subsectionStr, "title") ||
                `Section ${index + 1}`;
              const summary =
                extractFieldFromObject(subsectionStr, "summary") ||
                `AI-generated content for ${title}`;

              detailedSubsections.push({
                title: title,
                summary: summary,
                keyPoints:
                  extractArrayFromObject(subsectionStr, "keyPoints") || [],
                pages: extractPagesFromObject(subsectionStr, title),
                practicalExample:
                  extractFieldFromObject(subsectionStr, "practicalExample") ||
                  `Practical example for ${title}`,
                commonPitfalls: extractArrayFromObject(
                  subsectionStr,
                  "commonPitfalls"
                ) || [
                  `Common issues with ${title}`,
                  "Best practices to avoid problems",
                ],
                difficulty:
                  extractFieldFromObject(subsectionStr, "difficulty") ||
                  "Intermediate",
                estimatedTime:
                  extractFieldFromObject(subsectionStr, "estimatedTime") ||
                  "15-20 minutes",
              });
            }
          });
        }
      } catch (error) {
        console.log(
          "Failed to parse subsections array, using basic extraction"
        );
      }
    }

    // Strategy 2: If Strategy 1 failed or found no subsections, try individual title extraction
    if (detailedSubsections.length === 0) {
      const titleMatches = responseText.match(/"title"\s*:\s*"([^"]+)"/g);
      if (titleMatches && titleMatches.length > 3) {
        // Skip the first few which might be from other sections
        // Take titles that appear to be from detailedSubsections (usually later in the response)
        const subsectionTitles = titleMatches.slice(
          -Math.min(8, titleMatches.length - 2)
        ); // Take last 8 or skip first 2

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
                keyTakeaway: `Understanding the basics of ${title}`,
              },
              {
                pageNumber: 2,
                pageTitle: "Deep Dive & Analysis",
                content: `Detailed analysis of ${title}. This section explores the technical details, mechanisms, and processes involved in this topic.`,
                codeExamples: [],
                mathematicalContent: [],
                keyTakeaway: `Mastering the technical aspects of ${title}`,
              },
              {
                pageNumber: 3,
                pageTitle: "Applications & Implementation",
                content: `Practical applications of ${title}. This section demonstrates how to apply the concepts in real-world scenarios and implementation strategies.`,
                codeExamples: [],
                mathematicalContent: [],
                keyTakeaway: `Applying ${title} in practice`,
              },
            ],
            practicalExample: `Practical example for ${title}`,
            commonPitfalls: [
              `Common issues with ${title}`,
              "Best practices to avoid problems",
            ],
            difficulty: "Intermediate",
            estimatedTime: "15-20 minutes",
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
        /"([^"]*(?:Examples|Case Studies|Real-world)[^"]*)"/gi,
      ];

      headingPatterns.forEach((pattern) => {
        const matches = responseText.match(pattern);
        if (matches && matches.length > 0) {
          matches.slice(0, 2).forEach((match) => {
            // Limit to 2 per pattern
            const title = match.replace(/"/g, "");
            if (
              title.length > 10 &&
              !detailedSubsections.some((s) => s.title === title)
            ) {
              detailedSubsections.push({
                title: title,
                summary: `AI-generated content for ${title}`,
                keyPoints: [],
                pages: [
                  {
                    pageNumber: 1,
                    pageTitle: "Introduction & Foundation",
                    content: `Introduction to ${title}. This section covers the fundamental concepts and provides the necessary background knowledge for understanding the topic.`,
                    keyTakeaway: `Understanding the basics of ${title}`,
                  },
                  {
                    pageNumber: 2,
                    pageTitle: "Deep Dive & Analysis",
                    content: `Detailed analysis of ${title}. This section explores the technical details, mechanisms, and processes involved in this topic.`,
                    keyTakeaway: `Mastering the technical aspects of ${title}`,
                  },
                  {
                    pageNumber: 3,
                    pageTitle: "Applications & Implementation",
                    content: `Practical applications of ${title}. This section demonstrates how to apply the concepts in real-world scenarios and implementation strategies.`,
                    keyTakeaway: `Applying ${title} in practice`,
                  },
                ],
                practicalExample: `Practical example for ${title}`,
                commonPitfalls: [
                  `Common issues with ${title}`,
                  "Best practices to avoid problems",
                ],
                difficulty: "Intermediate",
                estimatedTime: "15-20 minutes",
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
      subsectionsCount: result.detailedSubsections.length,
    });
  } catch (regexError) {
    console.error("Even regex extraction failed:", regexError);
    result.summary =
      "Content processing encountered an error, but the module was created successfully.";
  }

  return result;
}

// Helper functions for extracting fields from malformed JSON objects
function extractFieldFromObject(objectStr, fieldName) {
  try {
    const pattern = new RegExp(
      `"${fieldName}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`,
      "i"
    );
    const match = objectStr.match(pattern);
    return match ? match[1].replace(/\\"/g, '"') : null;
  } catch (error) {
    return null;
  }
}

function extractArrayFromObject(objectStr, fieldName) {
  try {
    const pattern = new RegExp(`"${fieldName}"\\s*:\\s*\\[(.*?)\\]`, "si");
    const match = objectStr.match(pattern);
    if (match && match[1]) {
      const arrayContent = match[1];
      const items = arrayContent.match(/"([^"]*(?:\\.[^"]*)*)"/g);
      return items
        ? items.map((item) => item.replace(/^"|"$/g, "").replace(/\\"/g, '"'))
        : [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Helper function to extract pages from subsection object
function extractPagesFromObject(objectStr, title) {
  try {
    const pagesPattern = /"pages"\s*:\s*\[(.*?)\]/is;
    const pagesMatch = objectStr.match(pagesPattern);

    if (pagesMatch && pagesMatch[1]) {
      const pagesContent = pagesMatch[1];
      const pageObjects = pagesContent.match(
        /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
      );

      if (pageObjects && pageObjects.length > 0) {
        const pages = pageObjects.map((pageStr, index) => {
          const pageNumber = index + 1;
          const pageTitle =
            extractFieldFromObject(pageStr, "pageTitle") ||
            `Page ${pageNumber}`;
          const content =
            extractFieldFromObject(pageStr, "content") ||
            `Content for ${pageTitle}`;
          const keyTakeaway =
            extractFieldFromObject(pageStr, "keyTakeaway") ||
            `Key learning from ${pageTitle}`;

          return {
            pageNumber: pageNumber,
            pageTitle: pageTitle,
            content: content,
            codeExamples: extractCodeExamplesFromObject(pageStr),
            mathematicalContent: extractMathematicalContentFromObject(pageStr),
            keyTakeaway: keyTakeaway,
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
        keyTakeaway: `Understanding the basics of ${title}`,
      },
      {
        pageNumber: 2,
        pageTitle: "Shortcuts & Speed Techniques",
        content: `Speed-solving techniques and shortcuts for ${title}. This section provides time-saving methods and mental math techniques for competitive exams.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Mastering speed and efficiency for ${title}`,
      },
      {
        pageNumber: 3,
        pageTitle: "Practice & Exam Application",
        content: `Real exam problems and strategic approaches for ${title}. This section demonstrates how to apply concepts in actual competitive exam conditions.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Applying ${title} in competitive exam scenarios`,
      },
      {
        pageNumber: 4,
        pageTitle: "Advanced Tricks & Common Traps",
        content: `Advanced shortcuts, pitfalls, and expert techniques for ${title}. This section covers complex problem-solving strategies and common mistakes to avoid.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Advanced mastery and trap avoidance for ${title}`,
      },
      {
        pageNumber: 5,
        pageTitle: "Mastery & Review",
        content: `Practice problems, review techniques, and final tips for ${title}. This section consolidates learning and prepares for excellence in competitive exams.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Complete mastery and exam readiness for ${title}`,
      },
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
        keyTakeaway: `Understanding the basics of ${title}`,
      },
      {
        pageNumber: 2,
        pageTitle: "Shortcuts & Speed Techniques",
        content: `Speed-solving techniques and shortcuts for ${title}. This section provides time-saving methods and mental math techniques for competitive exams.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Mastering speed and efficiency for ${title}`,
      },
      {
        pageNumber: 3,
        pageTitle: "Practice & Exam Application",
        content: `Real exam problems and strategic approaches for ${title}. This section demonstrates how to apply concepts in actual competitive exam conditions.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Applying ${title} in competitive exam scenarios`,
      },
      {
        pageNumber: 4,
        pageTitle: "Advanced Tricks & Common Traps",
        content: `Advanced shortcuts, pitfalls, and expert techniques for ${title}. This section covers complex problem-solving strategies and common mistakes to avoid.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Advanced mastery and trap avoidance for ${title}`,
      },
      {
        pageNumber: 5,
        pageTitle: "Mastery & Review",
        content: `Practice problems, review techniques, and final tips for ${title}. This section consolidates learning and prepares for excellence in competitive exams.`,
        codeExamples: [],
        mathematicalContent: [],
        keyTakeaway: `Complete mastery and exam readiness for ${title}`,
      },
    ];
  }
}

// Helper function to extract code examples from page object
function extractCodeExamplesFromObject(pageStr) {
  try {
    const codeExamplesPattern = /"codeExamples"\s*:\s*\[(.*?)\]/is;
    const codeExamplesMatch = pageStr.match(codeExamplesPattern);

    if (codeExamplesMatch && codeExamplesMatch[1]) {
      const codeExamplesContent = codeExamplesMatch[1];
      const codeObjects = codeExamplesContent.match(
        /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
      );

      if (codeObjects && codeObjects.length > 0) {
        return codeObjects.map((codeStr) => {
          return {
            language:
              extractFieldFromObject(codeStr, "language") || "javascript",
            title: extractFieldFromObject(codeStr, "title") || "Code Example",
            code:
              extractFieldFromObject(codeStr, "code") ||
              "// Code example will be provided",
            explanation:
              extractFieldFromObject(codeStr, "explanation") ||
              "Explanation will be provided",
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
    const mathContentPattern = /"mathematicalContent"\s*:\s*\[(.*?)\]/is;
    const mathContentMatch = pageStr.match(mathContentPattern);

    if (mathContentMatch && mathContentMatch[1]) {
      const mathContentContent = mathContentMatch[1];
      const mathObjects = mathContentContent.match(
        /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
      );

      if (mathObjects && mathObjects.length > 0) {
        return mathObjects.map((mathStr) => {
          return {
            type: extractFieldFromObject(mathStr, "type") || "formula",
            title:
              extractFieldFromObject(mathStr, "title") ||
              "Mathematical Concept",
            content:
              extractFieldFromObject(mathStr, "content") ||
              "Mathematical content will be provided",
            explanation:
              extractFieldFromObject(mathStr, "explanation") ||
              "Explanation will be provided",
            example:
              extractFieldFromObject(mathStr, "example") ||
              "Example will be provided",
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
export async function generateCompetitiveExamModuleSummary(
  content,
  context = {}
) {
  const {
    learnerLevel = "intermediate",
    subject = "Quantitative Aptitude",
    examType = "SSC",
    moduleIndex = 1,
    totalModules = 1,
  } = context;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `
    Analyze the following educational content and provide a comprehensive, exam-focused module breakdown as a beautiful and well-structured Markdown document. This is for Competitive Exams like SSC, UPSC, CAT, Bank PO, GRE, etc., in the domain of ${subject} for the ${examType} examination.

    CONTEXT:
    - Target Learner Level: ${learnerLevel}
    - Subject Category: ${subject}
    - Exam Type: ${examType}
    - Module Position: ${moduleIndex} of ${totalModules}

    MATHEMATICAL CONTENT FORMATTING RULES (CRITICAL):
    - Use LaTeX syntax for all math expressions.
    - Inline math: $...$ (e.g., $E = mc^2$)
    - Block/display math: $$ ... $$ on separate lines.
    - Use a single backslash for LaTeX commands: \\frac, \\sqrt, \\sum, etc.
    - DO NOT use double backslashes (\\\\) in commands.
    - Good Example (inline): $F = ma$
    - Good Example (block):
      $$
      \\int_{0}^{1} x^2 dx = \\frac{1}{3}
      $$

    CRITICAL OUTPUT REQUIREMENTS:
    - Respond with ONLY valid, well-structured Markdown.
    - Use headings, bold text, lists, and other features to make it beautiful and readable for learners.
    - Do NOT wrap the output in a JSON or markdown code block.

    Use the following Markdown structure:

    # {Module Title}

    **Summary:**
    (A compelling 2-3 sentence summary appropriate for the learner level, with an engaging tone and competitive exam focus.)

    **Learning Objectives:**
    - (Objective 1: Specific, actionable, focused on exam success)
    - (Objective 2)
    - (Objective 3)
    - (Objective 4)
    - (Objective 5)

    **Real-World Examples:**
    - (Example 1: Concrete, exam-relevant example for ${subject} and ${examType})
    - (Example 2)
    - (Example 3)

    ---

    ## Detailed Curriculum

    (The provided module content below is in Markdown format. It includes section headings like "### 1.1 Basic Concepts" and subsection headings like "#### 1.1.1 Resistance". Your task is to re-structure this into a clean, readable format. For EACH "####" heading, simply list it. Do not generate detailed content for it here; that will be done in a separate step. Just ensure the structure is preserved.)

    ### 1.1 Section Title
    #### 1.1.1 Subsection Title
    #### 1.1.2 Subsection Title

    ### 1.2 Section Title
    #### 1.2.1 Subsection Title
    #### 1.2.2 Subsection Title

    ---

    ## Enhanced Learning Elements

    **Key Insights & Practical Applications:**
    - (Key insight for ${examType} success)
    - (How this applies in a real exam scenario)

    **Career Relevance:**
    (How mastering this topic impacts ${examType} exam performance and career opportunities.)

    **Difficulty Level:** ${learnerLevel}
    **Prerequisites:** (List of prerequisites for ${examType} preparation)
    **Estimated Study Time:** (Estimated study time for an ${learnerLevel} learner preparing for ${examType})

    ---

    ## Learning Resources

    ### Recommended Books
    - **[Book Title]** by [Author] - [Compelling description for ${examType} prep]. [Amazon/Google Books Link]

    ### Online Courses
    - **[Course Title]** on [Platform] - [Detailed description for ${examType} prep]. [Course URL]

    ### Articles & Blogs
    - **[Article Title]** from [Source] - [Summary for ${examType} prep]. [Article URL]

    ### Video Tutorials
    - **[Video Title]** by [Creator] - [Engaging description for ${examType} prep]. [YouTube/Vimeo URL]

    ---

    Content to process:
    ${content}
  `;

  try {
    console.log(
      "Processing LLM response for competitive exam module summary..."
    );
    const responseText = await callGeminiWithRetry(model, prompt, 5, 3000);
    console.log(
      `✅ Successfully generated markdown for module summary. Length: ${responseText.length}`
    );
    return responseText
      .replace(/```markdown/g, "")
      .replace(/```/g, "")
      .trim();
  } catch (error) {
    console.error("Error processing competitive exam Gemini response:", error);
    return `## Error Generating Content\n\nAn error occurred while generating the curriculum. Please try again later.`;
  }
}

export async function generateModuleSummary(content, context = {}) {
  // Ensure responseText is defined in outer scope for error handling
  let responseText = "";

  const {
    learnerLevel = "intermediate",
    subject = "general",
    moduleIndex = 1,
    totalModules = 1,
  } = context;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `
    Analyze the following educational content and provide a comprehensive, engaging module breakdown that will be displayed in a beautiful, modern UI with interactive visualizers and simulators.
    
    CONTEXT:
    - Target Learner Level: ${learnerLevel}
    - Subject Category: ${subject}
    - Module Position: ${moduleIndex} of ${totalModules}
    
    REQUIREMENTS FOR ${learnerLevel.toUpperCase()} LEVEL:
    ${
      learnerLevel === "beginner"
        ? `
    - Use simple, clear language and avoid jargon
    - Include foundational concepts and prerequisites
    - Provide step-by-step explanations
    - Focus on building confidence and understanding basics
    `
        : ""
    }
    ${
      learnerLevel === "intermediate"
        ? `
    - Balance theory with practical applications
    - Include moderate complexity examples
    - Connect to real-world scenarios
    - Build on assumed foundational knowledge
    `
        : ""
    }
    ${
      learnerLevel === "advanced"
        ? `
    - Include complex concepts and edge cases
    - Focus on optimization and best practices
    - Provide challenging, industry-relevant examples
    - Assume strong foundational knowledge
    `
        : ""
    }
    ${
      learnerLevel === "expert"
        ? `
    - Cover cutting-edge techniques and research
    - Include advanced architectural patterns
    - Focus on leadership and mentoring aspects
    - Provide expert-level insights and strategies
    `
        : ""
    }
    
    Please provide:
    1. A compelling summary (2-3 sentences appropriate for ${learnerLevel} level, written in an engaging tone)
    2. 4-5 specific, actionable learning objectives (appropriate complexity for ${learnerLevel} learners)
    3. 3-5 concrete, real-world examples relevant to ${subject} and ${learnerLevel}
    4. Comprehensive learning resources with real URLs when possible:
       - Books (with Amazon/Google Books links when known and detailed descriptions)
       - Online courses (with direct course URLs from platforms like Coursera, edX, Udemy, etc.)
       - Articles and research papers (with DOI links, journal URLs, or article URLs when known)
       - Video tutorials (with YouTube/Vimeo URLs when known, or detailed search guidance)
       - Tools and software (with official website URLs)
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
          "pages": [
            {
              "pageNumber": 1,
              "pageTitle": "Introduction & Foundation",
              "content": "Basic concepts, definitions, and context (200-300 words). This page introduces the fundamental ideas and provides the necessary background knowledge.",
              "keyTakeaway": "Main learning point for this introductory page"
            },
            {
              "pageNumber": 2,
              "pageTitle": "Deep Dive & Analysis",
              "content": "Technical details, mechanisms, and processes (200-300 words). This page explores how things work and the underlying principles.",
              "keyTakeaway": "Main learning point for this detailed analysis page"
            },
            {
              "pageNumber": 3,
              "pageTitle": "Applications & Implementation",
              "content": "Real-world applications and implementation details (200-300 words). This page shows practical applications and how to apply the knowledge.",
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

    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON.
    • Do NOT include any additional commentary, explanation, or prose outside the JSON.
    • Ensure the JSON is completely valid and self-contained.
  `;

  try {
    console.log("Processing LLM response for module summary...");
    responseText = await callGeminiWithRetry(model, prompt, 5, 3000);

    // Parse the JSON with robust parsing
    let parsed = await parseLargeGeminiResponse(responseText);

    return parsed && parsed.summary
      ? parsed
      : {
          summary: `Learn about ${content.slice(0, 50)}...`,
          objectives: ["Understand key concepts"],
          examples: [],
          resources: {
            books: [],
            courses: [],
            articles: [],
            videos: [],
            tools: [],
            websites: [],
            exercises: [],
          },
          detailedSubsections: [],
        };
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    return {
      summary: `Learn about ${content.slice(0, 50)}...`,
      objectives: ["Understand key concepts"],
      examples: [],
      resources: {
        books: [],
        courses: [],
        articles: [],
        videos: [],
        tools: [],
        websites: [],
        exercises: [],
      },
      detailedSubsections: [],
    };
  }
}

// New function for general Markdown output (non-competitive exams)
export async function generateMarkdownModuleSummary(content, context = {}) {
  const {
    learnerLevel = "intermediate",
    subject = "general",
    moduleIndex = 1,
    totalModules = 1,
  } = context;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `
    Analyze the following educational content and provide a comprehensive, engaging module breakdown as a beautiful and well-structured Markdown document.
    
    CONTEXT:
    - Target Learner Level: ${learnerLevel}
    - Subject Category: ${subject}
    - Module Position: ${moduleIndex} of ${totalModules}
    
    MATHEMATICAL CONTENT FORMATTING RULES (CRITICAL):
    - Use LaTeX syntax for all math expressions.
    - Inline math: $...$ (e.g., $E = mc^2$)
    - Block/display math: $$ ... $$ on separate lines.
    - Use a single backslash for LaTeX commands: \\frac, \\sqrt, \\sum, etc.
    - DO NOT use double backslashes (\\\\) in commands.
    - Good Example (inline): $F = ma$
    - Good Example (block):
      $$
      \\int_{0}^{1} x^2 dx = \\frac{1}{3}
      $$

    CRITICAL OUTPUT REQUIREMENTS:
    - Respond with ONLY valid, well-structured Markdown.
    - Use headings, bold text, lists, and other features to make it beautiful and readable for learners.
    - Do NOT wrap the output in a JSON or markdown code block.

    Use the following Markdown structure:

    # Module Title

    **Summary:**
    (A compelling 2-3 sentence summary appropriate for the learner level, with an engaging tone.)

    **Learning Objectives:**
    - (Objective 1: Specific, actionable learning goal)
    - (Objective 2)
    - (Objective 3)
    - (Objective 4)
    - (Objective 5)

    **Real-World Examples:**
    - (Example 1: Concrete, relevant example for ${subject})
    - (Example 2)
    - (Example 3)

    ---

    ## Detailed Content

    ### Section 1: Introduction & Foundation
    #### Page 1: Basic Concepts
    (Detailed explanation of fundamental concepts, definitions, and overview - 200-300 words)

    **Key Takeaway:** Main learning point for this page

    #### Page 2: Deep Dive & Analysis  
    (Deeper analysis, technical details, or specific mechanisms - 200-300 words)

    **Key Takeaway:** Main learning point for this page

    #### Page 3: Applications & Implementation
    (Real-world applications, advanced concepts, or implementation details - 200-300 words)

    **Key Takeaway:** Main learning point for this page

    ### Section 2: Advanced Topics
    #### Page 1: Advanced Concepts
    (Advanced material building on previous sections - 200-300 words)

    **Key Takeaway:** Main learning point for this page

    #### Page 2: Practical Applications
    (Hands-on applications and real-world scenarios - 200-300 words)

    **Key Takeaway:** Main learning point for this page

    #### Page 3: Problem Solving
    (Problem-solving techniques and methodologies - 200-300 words)

    **Key Takeaway:** Main learning point for this page

    ---

    ## Enhanced Learning Elements

    **Key Insights & Practical Applications:**
    - (Key insight for ${subject} mastery)
    - (How this applies in real-world scenarios)
    - (Career relevance and professional applications)

    **Difficulty Level:** ${learnerLevel}
    **Prerequisites:** (List of prerequisites)
    **Estimated Study Time:** (Estimated study time for ${learnerLevel} level)

    ---

    ## Learning Resources

    ### Recommended Books
    - **[Book Title]** by [Author] - [Compelling description]. [Amazon/Google Books Link]

    ### Online Courses
    - **[Course Title]** on [Platform] - [Detailed description]. [Course URL]

    ### Articles & Blogs
    - **[Article Title]** from [Source] - [Summary]. [Article URL]

    ### Video Tutorials
    - **[Video Title]** by [Creator] - [Engaging description]. [YouTube/Vimeo URL]

    ### Tools & Software
    - **[Tool Name]** - [Description of how it helps]. [Tool URL]

    ### Practice Exercises
    - **[Exercise Title]** - [Description and learning outcomes]. [Exercise URL if available]

    ---

    Content to process:
    ${content}
  `;

  try {
    console.log("Processing LLM response for markdown module summary...");
    const responseText = await callGeminiWithRetry(model, prompt, 5, 3000);
    console.log(
      `✅ Successfully generated markdown for module summary. Length: ${responseText.length}`
    );

    // Clean up any markdown code block artifacts
    const cleanedResponse = responseText
      .replace(/```markdown/g, "")
      .replace(/```/g, "")
      .trim();
    return cleanedResponse;
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    return `## Error Generating Content\n\nAn error occurred while generating the curriculum. Please try again later.`;
  }
}

export async function generateQuiz(moduleContent, difficulty = "medium") {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      console.log(
        "No JSON code block found in quiz response, trying to extract JSON directly..."
      );
      // Fallback to old extraction method
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
    } else {
      responseText = codeBlockMatch[1];
      console.log(
        "Successfully extracted JSON from markdown code block for quiz"
      );
    }

    // Parse the JSON with robust parsing
    let parsed = await parseLargeGeminiResponse(responseText);

    if (parsed) {
      // Handle chunked response format
      if (parsed.part1 || parsed.part2) {
        console.log("Detected chunked quiz response, merging parts...");
        const mergedQuestions = [];

        // Merge all parts into a single questions array
        Object.keys(parsed).forEach((partKey) => {
          if (partKey.startsWith("part") && parsed[partKey].questions) {
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

    return parsed && parsed.questions ? parsed : { questions: [] };
  } catch (error) {
    console.error("Error parsing quiz response:", error);
    return { questions: [] };
  }
}

export async function generateTutorResponse(
  question,
  moduleContent,
  chatHistory = []
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  `;

  try {
    let responseText = await callGeminiWithRetry(model, context, 3, 2000);

    // Extract JSON from markdown code block
    const codeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (!codeBlockMatch) {
      console.log(
        "No JSON code block found in tutor response, using direct response..."
      );
      // If no JSON structure, return the text directly as fallback
      return responseText;
    } else {
      responseText = codeBlockMatch[1];
      console.log(
        "Successfully extracted JSON from markdown code block for tutor response"
      );
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
          Object.keys(parsed).forEach((partKey) => {
            if (partKey.startsWith("part") && parsed[partKey].response) {
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
    return text
      .replace(/```markdown/g, "")
      .replace(/```/g, "")
      .trim();
  } catch (error) {
    console.error("Error generating or processing curriculum:", error);
    throw new Error("Failed to process curriculum with AI.");
  }
}

export async function generateCompetitiveExamSubsectionDetails(
  content,
  context = {}
) {
  const {
    subject = "Quantitative Aptitude",
    examType = "SSC",
    moduleTitle = "Module",
    subsectionTitle = "Subsection",
  } = context;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `
    Analyze the following content for a single subsection titled "${subsectionTitle}" from the module "${moduleTitle}". Generate a detailed, beautiful, and well-structured Markdown document for this subsection, tailored for the ${examType} competitive exam in the subject of ${subject}.

    MATHEMATICAL CONTENT FORMATTING RULES (CRITICAL - FOLLOW EXACTLY):
    
    1. INLINE MATH (within sentences):
       - Wrap ALL mathematical expressions in single dollar signs: $...$
       - Examples: $V = IR$, $R = \\rho \\frac{L}{A}$, $P = I^2R$, $\\Omega$, $\\alpha$
       
    2. DISPLAY MATH (standalone equations):
       - Use double dollar signs on separate lines for important formulas:
       $$
       V = IR
       $$
       
    3. SPECIFIC FORMATTING FOR ELECTRICAL/PHYSICS CONTENT:
       - Ohm's Law: $V = IR$ (always in math mode)
       - Resistance formula: $R = \\rho \\frac{L}{A}$ 
       - Power formulas: $P = IV$, $P = I^2R$, $P = \\frac{V^2}{R}$
       - Units: $\\Omega$ (ohms), $\\Omega \\cdot m$ (ohm-meters)
       - Greek letters: $\\rho$ (resistivity), $\\alpha$ (temp coefficient), $\\sigma$ (conductivity)
       - Temperature: $20^\\circ C$, $\\Delta T$
       - Fractions: ALWAYS use $\\frac{numerator}{denominator}$
       - Exponents: $x^2$, $I^2$, $V^2$ 
       - Subscripts: $R_{th}$, $V_{out}$, $I_0$
       
    4. EXAMPLES OF CORRECT FORMATTING:
       ✅ "The relationship between voltage and current is given by $V = IR$."
       ✅ "Resistance depends on material properties: $R = \\rho \\frac{L}{A}$"
       ✅ "Power dissipation can be calculated as $P = I^2R$ or $P = \\frac{V^2}{R}$"
       ✅ "The unit of resistance is the ohm ($\\Omega$)"
       ✅ "Temperature coefficient $\\alpha$ affects resistance"
       
       ❌ "The relationship between voltage and current is given by V = IR."
       ❌ "R = ρL/A" (missing LaTeX formatting)
       ❌ "Power = I²R" (use LaTeX instead)

    5. USE LATEX FOR ALL:
       - Variable names (V, I, R, P)
       - Equations and formulas
       - Units and symbols
       - Greek letters
       - Mathematical operations
       - Numbers with units

    CRITICAL OUTPUT REQUIREMENTS:
    - Respond with ONLY valid, well-structured Markdown.
    - Use headings, bold text, lists, and other features to make it beautiful and readable for learners.
    - Do NOT wrap the output in a JSON or markdown code block.
    - EVERY mathematical expression MUST be properly formatted in LaTeX.

    Use the following Markdown structure:

    ### ${subsectionTitle}

    **Summary:**
    (A brief and engaging summary of the subsection's content, 2-3 sentences. Include mathematical expressions in LaTeX format.)

    **Key Learning Points:**
    - (First key point with math in LaTeX if applicable)
    - (Second key point with math in LaTeX if applicable)
    - (Third key point with math in LaTeX if applicable)
    - (Fourth key point)
    - (Fifth key point)

    ---

    ### In-Depth Explanation

    #### Introduction & Foundation
    (250-350 words of content for this page. Explain the basic concepts, definitions, and context. Use LaTeX for ALL mathematical expressions, formulas, units, and variables.)
    
    **Key Takeaway:** (A sentence summarizing the main learning point of this page.)

    #### Core Theory & Mathematical Principles
    (250-350 words of content. Deep dive into the theoretical understanding, formulas, and mathematical foundations. Include properly formatted equations using LaTeX.)
    
    **Key Takeaway:** (A sentence summarizing the main learning point of this page.)

    #### Problem-Solving Techniques & Strategies
    (250-350 words of content. Provide systematic approaches to solving problems related to this subsection. Show step-by-step solutions with LaTeX math.)
    
    **Key Takeaway:** (A sentence summarizing the main learning point of this page.)

    #### Speed Techniques & Shortcuts
    (250-350 words of content. Focus on time-saving methods, mental math tricks, and rapid calculation techniques. Use LaTeX for all formulas and calculations.)
    
    **Key Takeaway:** (A sentence summarizing the main learning point of this page.)

    #### Common Traps & Error Prevention
    (250-350 words of content. Highlight typical mistakes, question traps, and error prevention strategies for the ${examType} exam. Show common incorrect vs correct formulations using LaTeX.)
    
    **Key Takeaway:** (A sentence summarizing the main learning point of this page.)

    #### Practice Problems & Applications
    (250-350 words of content. Include real exam problems, practice exercises, and application scenarios. Show all calculations in proper LaTeX format.)
    
    **Key Takeaway:** (A sentence summarizing the main learning point of this page.)

    ---

    **Practical Example:**
    (A relevant, practical example demonstrating the concepts of the subsection. Use LaTeX for all mathematical content.)

    **Common Pitfalls:**
    - (A common mistake learners make, with correct vs incorrect formulations in LaTeX)
    - (Another potential trap with mathematical examples)
    - (Error prevention strategy with proper mathematical notation)

    ---

    Content for subsection "${subsectionTitle}":
    ${content}
  `;

  try {
    console.log(
      `Generating markdown content for subsection: "${subsectionTitle}"`
    );
    const responseText = await callGeminiWithRetry(model, prompt, 3, 2000);
    console.log(
      `✅ Successfully generated markdown for subsection "${subsectionTitle}". Length: ${responseText.length}`
    );
    return responseText
      .replace(/```markdown/g, "")
      .replace(/```/g, "")
      .trim();
  } catch (error) {
    console.error(
      `Error generating subsection details for "${subsectionTitle}":`,
      error
    );
    return `### Error Generating Content for ${subsectionTitle}\n\nAn error occurred while generating the content for this subsection. Please try again later.`;
  }
}

// Helper function to create fallback content when generation fails
function createFallbackSubsectionContent(subsectionTitle) {
  return {
    title: subsectionTitle,
    summary: "Content for this subsection will be available soon.",
    keyPoints: [
      "This section is being prepared.",
      "Check back later for complete content.",
    ],
    pages: [
      {
        pageNumber: 1,
        pageTitle: "Introduction & Foundation",
        content:
          "We're currently preparing comprehensive content for this section. In the meantime, you can explore other sections of the course.",
        keyTakeaway: "Content coming soon.",
      },
      {
        pageNumber: 2,
        pageTitle: "Core Theory & Mathematical Principles",
        content: "This section is under development.",
        keyTakeaway: "Check back later.",
      },
      {
        pageNumber: 3,
        pageTitle: "Problem-Solving Techniques & Strategies",
        content: "This section is under development.",
        keyTakeaway: "Check back later.",
      },
      {
        pageNumber: 4,
        pageTitle: "Speed Techniques & Shortcuts",
        content: "This section is under development.",
        keyTakeaway: "Check back later.",
      },
      {
        pageNumber: 5,
        pageTitle: "Common Traps & Error Prevention",
        content: "This section is under development.",
        keyTakeaway: "Check back later.",
      },
      {
        pageNumber: 6,
        pageTitle: "Practice Problems & Applications",
        content: "This section is under development.",
        keyTakeaway: "Check back later.",
      },
    ],
    practicalExample: "Examples will be provided in the complete version.",
    commonPitfalls: ["Content coming soon."],
  };
}

// Helper function to validate and fix subsection data
function validateAndFixSubsectionData(data, subsectionTitle) {
  // Ensure all required fields exist
  const result = {
    title: subsectionTitle,
    summary: data.summary || "Summary not available",
    keyPoints: Array.isArray(data.keyPoints)
      ? data.keyPoints
      : ["Key points not available"],
    pages: [],
    practicalExample: data.practicalExample || "Example not available",
    commonPitfalls: Array.isArray(data.commonPitfalls)
      ? data.commonPitfalls
      : ["Common pitfalls not available"],
  };

  // Ensure we have exactly 6 pages with all required fields
  const expectedPages = [
    { pageNumber: 1, pageTitle: "Introduction & Foundation" },
    { pageNumber: 2, pageTitle: "Core Theory & Mathematical Principles" },
    { pageNumber: 3, pageTitle: "Problem-Solving Techniques & Strategies" },
    { pageNumber: 4, pageTitle: "Speed Techniques & Shortcuts" },
    { pageNumber: 5, pageTitle: "Common Traps & Error Prevention" },
    { pageNumber: 6, pageTitle: "Practice Problems & Applications" },
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
      content:
        existingPage.content ||
        `Content for ${expectedPage.pageTitle} will be available soon.`,
      keyTakeaway: existingPage.keyTakeaway || "Key takeaway not available",
    });
  }

  return result;
}
