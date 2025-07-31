import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";
import JSON5 from "json5";
import {
  sanitizeLaTeX,
  analyzeContent,
  preprocessContent,
  validateLaTeXStructure,
} from "./contentProcessor.js";

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

// Save problematic response for debugging
async function saveProblematicResponse(rawResponse, sanitized, error) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gemini-parse-error-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'tmp', filename);
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      originalResponseLength: rawResponse.length,
      sanitizedLength: sanitized.length,
      rawResponse: rawResponse,
      sanitizedResponse: sanitized
    };
    
    await fs.writeFile(filepath, JSON.stringify(debugInfo, null, 2));
    console.log(`🐛 Saved problematic response to: ${filepath}`);
  } catch (saveError) {
    console.warn("⚠️ Failed to save problematic response:", saveError.message);
  }
}

// Analyze JSON parsing errors for debugging
function analyzeJsonError(jsonStr, error) {
  console.log("🔍 Analyzing JSON parsing error...");
  
  // Extract position information from error message
  const positionMatch = error.message.match(/position (\d+)/);
  const position = positionMatch ? parseInt(positionMatch[1]) : -1;
  
  if (position > 0) {
    const start = Math.max(0, position - 50);
    const end = Math.min(jsonStr.length, position + 50);
    const context = jsonStr.substring(start, end);
    const errorChar = jsonStr.charAt(position);
    
    console.log(`📍 Error at position ${position} (character: '${errorChar}')`);
    console.log(`🔍 Context: ...${context}...`);
    
    // Check for common issues
    if (errorChar === '\\') {
      console.log("⚠️ Likely issue: Invalid escape sequence");
    } else if (errorChar === '"') {
      console.log("⚠️ Likely issue: Unescaped quote or improper string termination");
    } else if (errorChar === ',') {
      console.log("⚠️ Likely issue: Trailing comma or missing value");
    } else if (errorChar === '\n' || errorChar === '\r') {
      console.log("⚠️ Likely issue: Unescaped newline in string");
    }
  }
  
  // Check for structural issues
  const openBraces = (jsonStr.match(/\{/g) || []).length;
  const closeBraces = (jsonStr.match(/\}/g) || []).length;
  const openBrackets = (jsonStr.match(/\[/g) || []).length;
  const closeBrackets = (jsonStr.match(/\]/g) || []).length;
  
  if (openBraces !== closeBraces) {
    console.log(`⚠️ Brace mismatch: ${openBraces} open vs ${closeBraces} close`);
  }
  if (openBrackets !== closeBrackets) {
    console.log(`⚠️ Bracket mismatch: ${openBrackets} open vs ${closeBrackets} close`);
  }
  
  // Check for unescaped characters in strings
  const unescapedNewlines = (jsonStr.match(/"[^"]*\n[^"]*"/g) || []).length;
  const unescapedTabs = (jsonStr.match(/"[^"]*\t[^"]*"/g) || []).length;
  
  if (unescapedNewlines > 0) {
    console.log(`⚠️ Found ${unescapedNewlines} strings with unescaped newlines`);
  }
  if (unescapedTabs > 0) {
    console.log(`⚠️ Found ${unescapedTabs} strings with unescaped tabs`);
  }
}

// Enhanced sanitize for parse
function sanitizeForParsing(jsonStr) {
  let safe = jsonStr;
  
  // Remove any non-printable control characters
  safe = safe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
  
  // Fix the specific issue: {\"summary\": should be {"summary":
  // This fixes the escape sequence problem at position 4
  safe = safe.replace(/\{\s*\\"/g, '{"');
  safe = safe.replace(/\\"\s*:/g, '":');
  
  // Fix escaped quotes that should not be escaped (common Gemini issue)
  safe = safe.replace(/\\"/g, '"');
  
  // Fix unescaped newlines and carriage returns in strings
  safe = safe.replace(/("(?:[^"\\]|\\.)*?)(\r?\n)((?:[^"\\]|\\.)*?")/g, (match, start, newline, end) => {
    return start + '\\n' + end;
  });
  
  // Fix unescaped tabs in strings
  safe = safe.replace(/("(?:[^"\\]|\\.)*?)(\t)((?:[^"\\]|\\.)*?")/g, (match, start, tab, end) => {
    return start + '\\t' + end;
  });
  
  // Fix unescaped backslashes (but preserve valid escape sequences)
  safe = safe.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  
  // Fix trailing commas that break JSON
  safe = safe.replace(/,\s*([}\]])/g, '$1');
  
  // Fix incomplete escape sequences at end of strings
  safe = safe.replace(/\\$/g, '');
  
  // Fix malformed object keys (unquoted keys)
  safe = safe.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  
  // Fix single quotes to double quotes
  safe = safe.replace(/'/g, '"');
  
  // Fix multiple consecutive commas
  safe = safe.replace(/,+/g, ',');
  
  // Ensure proper object/array closure
  let openBraces = (safe.match(/\{/g) || []).length;
  let closeBraces = (safe.match(/\}/g) || []).length;
  let openBrackets = (safe.match(/\[/g) || []).length;
  let closeBrackets = (safe.match(/\]/g) || []).length;
  
  // Add missing closing braces/brackets
  if (openBraces > closeBraces) {
    safe += '}'.repeat(openBraces - closeBraces);
  }
  if (openBrackets > closeBrackets) {
    safe += ']'.repeat(openBrackets - closeBrackets);
  }
  
  return safe;
}

// Fix LaTeX arrow syntax
function fixLatexArrows(text) {
  if (!text || typeof text !== "string") return text;

  // Replace common arrow text patterns with proper LaTeX arrows
  let fixed = text;
  let hasChanges = false;

  // Fix "to" in limits and mappings
  const limitToRegex = /\\lim_\{([^}]+)\s+to\s+([^}]+)\}/g;
  if (limitToRegex.test(text)) {
    fixed = fixed.replace(limitToRegex, "\\lim_{$1 \\rightarrow $2}");
    hasChanges = true;
  }

  const approachesRegex = /\\lim_\{([^}]+)\s+approaches\s+([^}]+)\}/g;
  if (approachesRegex.test(text)) {
    fixed = fixed.replace(approachesRegex, "\\lim_{$1 \\rightarrow $2}");
    hasChanges = true;
  }

  // Fix function mappings with "to"
  const mappingRegex = /([a-zA-Z]):\s*([A-Z])\s+to\s+([A-Z])/g;
  if (mappingRegex.test(text)) {
    fixed = fixed.replace(mappingRegex, "$1: $2 \\rightarrow $3");
    hasChanges = true;
  }

  const mapToRegex = /([a-zA-Z])\s+to\s+([a-zA-Z]\([^)]+\))/g;
  if (mapToRegex.test(text)) {
    fixed = fixed.replace(mapToRegex, "$1 \\mapsto $2");
    hasChanges = true;
  }

  // Fix standalone "to" in math expressions
  const inlineToRegex = /\$([^$]*)\s+to\s+([^$]*)\$/g;
  if (inlineToRegex.test(text)) {
    fixed = fixed.replace(inlineToRegex, "$$$1 \\rightarrow $2$$");
    hasChanges = true;
  }

  // Fix double dollar block math with "to"
  const blockToRegex = /\$\$([^$]*)\s+to\s+([^$]*)\$\$/g;
  if (blockToRegex.test(text)) {
    fixed = fixed.replace(blockToRegex, "$$$$1 \\rightarrow $2$$$$");
    hasChanges = true;
  }

  // Fix text{to} patterns
  const textToRegex = /\\text\{\s*to\s*\}/g;
  if (textToRegex.test(text)) {
    fixed = fixed.replace(textToRegex, "\\rightarrow");
    hasChanges = true;
  }

  // Fix \\to to \\rightarrow
  const backslashToRegex = /\\to\b/g;
  if (backslashToRegex.test(text)) {
    fixed = fixed.replace(backslashToRegex, "\\rightarrow");
    hasChanges = true;
  }

  if (hasChanges) {
    console.log("🔧 Fixed LaTeX arrows in text:", {
      original: text.substring(0, 100) + "...",
      fixed: fixed.substring(0, 100) + "...",
    });
  }

  return fixed;
}

// Enhanced JSON repair function
function repairJsonString(jsonStr) {
  console.log("🔧 Attempting to repair JSON string using jsonrepair...");
  
  // First try basic string cleaning
  let cleaned = jsonStr;
  
  // Special handling for Gemini's escaped JSON pattern
  // Check if the entire JSON is wrapped in escaped quotes
  if (cleaned.startsWith('{\\"') && cleaned.includes('\\":\\"')) {
    console.log("🔧 Detected escaped JSON pattern, attempting to unescape...");
    // This appears to be a JSON string that's been incorrectly escaped
    try {
      // Try to parse it as a JSON string first
      const unescaped = JSON.parse('"' + cleaned + '"');
      if (typeof unescaped === 'string' && unescaped.startsWith('{')) {
        cleaned = unescaped;
        console.log("✅ Successfully unescaped JSON string");
      }
    } catch (e) {
      console.log("⚠️ Failed to unescape JSON string, continuing with original");
    }
  }
  
  // Remove any leading/trailing whitespace and non-JSON characters
  cleaned = cleaned.trim();
  
  // Remove any text before the first { or [
  const firstJsonChar = Math.min(
    cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
    cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('[')
  );
  if (firstJsonChar !== Infinity && firstJsonChar > 0) {
    cleaned = cleaned.substring(firstJsonChar);
  }
  
  // Remove any text after the last } or ]
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const lastJsonChar = Math.max(lastBrace, lastBracket);
  if (lastJsonChar !== -1 && lastJsonChar < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastJsonChar + 1);
  }
  
  try {
    // Try jsonrepair on the cleaned string
    const repaired = jsonrepair(cleaned);
    console.log("✅ jsonrepair succeeded on cleaned string");
    return repaired;
  } catch (e) {
    console.warn("⚠️ jsonrepair failed:", e.message);
    
    // Try manual fixes for common issues
    try {
      let manualFix = cleaned;
      
      // Fix common quote issues
      manualFix = manualFix.replace(/'/g, '"'); // Replace single quotes with double quotes
      manualFix = manualFix.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Quote unquoted keys
      
      // Fix trailing commas
      manualFix = manualFix.replace(/,(\s*[}\]])/g, '$1');
      
      // Try jsonrepair again after manual fixes
      const repairedAfterManual = jsonrepair(manualFix);
      console.log("✅ jsonrepair succeeded after manual fixes");
      return repairedAfterManual;
    } catch (e2) {
      console.warn("⚠️ Manual fixes + jsonrepair also failed:", e2.message);
      return cleaned; // Return the cleaned version even if repair failed
    }
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

// Enhanced JSON extraction from various formats
function extractJsonCodeBlock(responseText) {
  // First try to parse as pure JSON
  try {
    JSON.parse(responseText.trim());
    return responseText.trim(); // Return as-is if it's valid JSON
  } catch (e) {
    // Strategy 1: Extract from markdown code block with json tag
    let match = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Strategy 2: Extract from any code block (``` without json tag)
    match = responseText.match(/```\s*\n([\s\S]*?)\n\s*```/);
    if (match && match[1]) {
      const content = match[1].trim();
      // Check if it looks like JSON
      if (content.startsWith('{') && content.includes('"')) {
        return content;
      }
    }
    
    // Strategy 3: Look for JSON-like content between { and }
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    // Strategy 4: Extract everything between first { and last }
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return responseText.substring(firstBrace, lastBrace + 1);
    }
    
    // Fallback: return as-is and let other parsing strategies handle it
    return responseText;
  }
}

// Main parsing function
export async function parseLargeGeminiResponse(rawResponse) {
  console.log(`📏 Response size: ${rawResponse.length} chars`);

  let extracted = extractJsonCodeBlock(rawResponse);
  let repaired = repairJsonString(extracted);
  let sanitized = sanitizeForParsing(repaired);

  try {
    const parsed = JSON.parse(sanitized);
    // Fix LaTeX arrows in the parsed content
    return fixLatexInObject(parsed);
  } catch (e1) {
    console.warn("⚠️ Standard JSON.parse failed:", e1.message);
    
    // Analyze the error for debugging
    analyzeJsonError(sanitized, e1);
    
    // Save problematic response for debugging
    await saveProblematicResponse(rawResponse, sanitized, e1);
    
    const fallback = tryJson5Parse(sanitized);
    if (fallback) return fixLatexInObject(fallback);
    
    // Try progressive parsing if initial attempts fail
    console.log("🔧 Attempting progressive JSON parsing...");
    const progressiveParsed = parseJsonProgressive(sanitized);
    if (progressiveParsed) {
      console.log("✅ Progressive parsing successful");
      return fixLatexInObject(progressiveParsed);
    }
    
    // Final fallback: extract with regex
    console.log("🔧 Attempting regex data extraction...");
    const regexExtracted = extractDataWithRegex(rawResponse);
    if (regexExtracted) {
      console.log("✅ Regex extraction successful");
      return fixLatexInObject(regexExtracted);
    }
  }

  console.error("❌ All parsing strategies failed.");
  return null;
}

// Fix LaTeX arrows recursively in an object
function fixLatexInObject(obj) {
  if (!obj) return obj;

  if (typeof obj === "string") {
    return fixLatexArrows(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => fixLatexInObject(item));
  }

  if (typeof obj === "object") {
    const fixed = {};
    for (const [key, value] of Object.entries(obj)) {
      fixed[key] = fixLatexInObject(value);
    }
    return fixed;
  }

  return obj;
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
    // First, try to find and fix the specific issue at position 342
    if (jsonStr.length > 342) {
      const problemArea = jsonStr.substring(335, 350);
      console.log(`🔍 Examining problem area around position 342: "${problemArea}"`);
      
      // Try to identify and fix the issue
      let fixed = jsonStr;
      
      // Common issue: missing quotes around object keys
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
      
      // Try parsing the fixed version
      try {
        const parsed = JSON.parse(fixed);
        console.log("✅ Fixed position 342 issue and parsed successfully");
        return parsed;
      } catch (fixError) {
        console.log("⚠️ Fix attempt failed, continuing with progressive parsing");
      }
    }

    // Start with aggressive truncation percentages
    const percentages = [
      98, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10,
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
          `✅ Successfully parsed JSON at ${length} characters (${percentage}% of original)`
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

// Enhanced competitive exam module summary generation with JSON output
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
    Analyze the following educational content and provide a comprehensive, exam-focused module breakdown for Competitive Exams like SSC, UPSC, CAT, Bank PO, GRE, etc., in the domain of ${subject} for the ${examType} examination.

    CONTEXT:
    - Target Learner Level: ${learnerLevel}
    - Subject Category: ${subject}
    - Exam Type: ${examType}
    - Module Position: ${moduleIndex} of ${totalModules}

    MATHEMATICAL CONTENT FORMATTING RULES (CRITICAL):
    - Use LaTeX syntax for all math expressions.
    - Inline math: $...$ (e.g., $E = mc^2$)
    - Block/display math: $$ ... $$ on separate lines.
    - Use SINGLE backslash for LaTeX commands: \\frac, \\sqrt, \\sum, etc.
    - For fractions: $\\frac{numerator}{denominator}$
    - For square roots: $\\sqrt{expression}$
    - For units: $\\Omega$ (ohms), $\\text{kg}$ (kilograms), $\\text{m/s}$ (meters per second)
    - For Greek letters: $\\rho$, $\\alpha$, $\\sigma$, $\\pi$, $\\theta$, etc.
    - For mathematical operators: $\\sum$, $\\int$, $\\prod$, $\\lim$
    - For functions: $\\sin$, $\\cos$, $\\tan$, $\\log$, $\\ln$, $\\exp$
    - For text in math: $\\text{resistance} = \\frac{V}{I}$
    - For arrows: Use $\\rightarrow$, $\\leftarrow$, $\\uparrow$, $\\downarrow$, $\\leftrightarrow$
    - For limits: $\\lim_{x \\rightarrow 0}$, $\\lim_{n \\rightarrow \\infty}$
    - For mappings: $f: A \\rightarrow B$, $x \\mapsto f(x)$
    - For implies: $\\Rightarrow$, $\\Leftarrow$, $\\Leftrightarrow$
    - Ensure all braces are balanced: $\\frac{a + b}{c + d}$
    - Use proper spacing: $a + b = c$ not $a+b=c$
    - Center math expressions properly for flashcard display
    - Good Example (inline): $F = ma$
    - Good Example (block):
      $$
      \\int_{0}^{1} x^2 dx = \\frac{1}{3}
      $$
    - Good Example (arrows): $\\lim_{x \\rightarrow 0} \\frac{\\sin x}{x} = 1$

    Please provide a comprehensive JSON response with the following structure:
    {
      "summary": "Compelling 2-3 sentence summary focused on ${examType} exam success",
      "objectives": ["Exam-focused objective 1", "Exam-focused objective 2", "Exam-focused objective 3", "Exam-focused objective 4", "Exam-focused objective 5"],
      "examples": ["Exam-relevant example 1 for ${subject}", "Exam-relevant example 2", "Exam-relevant example 3"],
      "visualizationSuggestions": {
        "hasFlowcharts": true,
        "hasComparisons": true,
        "hasTimelines": false,
        "hasFormulas": true,
        "hasProcessSteps": true,
        "hasCyclicalProcesses": false,
        "hasHierarchies": true,
        "hasRelationships": true,
        "codeSimulationTopics": ["Speed calculation demos", "Shortcut technique demos"],
        "interactiveElements": ["Quick calculators", "Speed-solving techniques", "Timer-based practice"]
      },
      "beautifulSummaryElements": {
        "keyInsights": ["Key insight for ${examType} success", "Speed-solving technique insight", "Exam strategy insight"],
        "practicalApplications": ["How this applies in ${examType} questions", "Real exam scenario application", "Time-saving application"],
        "whyItMatters": "Explanation focused on ${examType} exam performance and career opportunities",
        "careerRelevance": "How mastering this topic impacts ${examType} exam performance and career opportunities",
        "difficultyLevel": "${learnerLevel}",
        "prerequisites": ["Prerequisite 1 for ${examType}", "Prerequisite 2", "Basic math skills"],
        "estimatedStudyTime": "2-4 hours for ${learnerLevel} learner preparing for ${examType}"
      },
      "resources": {
        "books": [
          {
            "title": "Book Title focused on ${examType}",
            "author": "Author Name",
            "description": "Description emphasizing ${examType} preparation value and speed techniques",
            "year": "2023",
            "difficulty": "${learnerLevel}",
            "url": "Amazon/Google Books URL"
          }
        ],
        "courses": [
          {
            "title": "Course Title for ${examType} preparation",
            "platform": "Platform Name",
            "url": "Course URL",
            "description": "Course description focused on ${examType} success and time management",
            "difficulty": "${learnerLevel}",
            "duration": "Duration"
          }
        ],
        "articles": [
          {
            "title": "Article Title relevant to ${examType}",
            "source": "Publication Name",
            "description": "Article summary for ${examType} preparation with shortcuts and tips",
            "url": "Article URL"
          }
        ],
        "videos": [
          {
            "title": "Video Title for ${examType} preparation",
            "creator": "Creator Name",
            "source_platform": "YouTube",
            "description": "Video description focused on ${examType} techniques and speed methods",
            "duration": "Video length"
          }
        ],
        "tools": [
          {
            "name": "Tool Name for ${examType}",
            "type": "Online Tool/Calculator/App",
            "description": "How this tool helps with ${examType} preparation and practice",
            "url": "Tool URL"
          }
        ],
        "websites": [
          {
            "name": "Website Name for ${examType}",
            "url": "Website URL",
            "description": "What ${examType} aspirants can find here for practice and preparation"
          }
        ],
        "exercises": [
          {
            "title": "Practice Exercise for ${examType}",
            "difficulty": "${learnerLevel}",
            "description": "Exercise description focused on ${examType} question patterns and time management",
            "estimatedTime": "Time to complete",
            "type": "Speed Practice/Mock Test/Concept Practice"
          }
        ]
      },
      "detailedSubsections": [
        {
          "title": "Subsection Title",
          "summary": "Brief overview focused on ${examType} exam relevance",
          "keyPoints": ["Key point 1 for exam success", "Speed technique point", "Common question pattern"],
          "pages": [
            {
              "pageNumber": 1,
              "pageTitle": "Introduction & Foundation",
              "content": "Basic concepts with ${examType} exam context, fundamental definitions, and importance for exam success (200-300 words with proper LaTeX formatting for all mathematical expressions)",
              "keyTakeaway": "Fundamental understanding needed for ${examType} success"
            },
            {
              "pageNumber": 2,
              "pageTitle": "Speed Techniques & Shortcuts", 
              "content": "Time-saving methods, mental math techniques, and shortcuts specifically for ${examType} questions (200-300 words with LaTeX formatting for formulas and calculations)",
              "keyTakeaway": "Master speed-solving techniques for ${examType} time constraints"
            },
            {
              "pageNumber": 3,
              "pageTitle": "Exam Applications & Practice",
              "content": "Real ${examType} question patterns, strategic approaches, and practice problems with step-by-step solutions (200-300 words with LaTeX for mathematical content)",
              "keyTakeaway": "Apply knowledge effectively in ${examType} exam conditions"
            },
            {
              "pageNumber": 4,
              "pageTitle": "Advanced Tricks & Common Traps",
              "content": "Advanced shortcuts, common question traps in ${examType}, and expert techniques to avoid errors and save time (200-300 words with LaTeX formatting)",
              "keyTakeaway": "Advanced mastery and trap avoidance for ${examType} excellence"
            },
            {
              "pageNumber": 5,
              "pageTitle": "Mastery & Review",
              "content": "Comprehensive practice problems, review techniques, and final preparation tips for ${examType} excellence (200-300 words with LaTeX mathematical expressions)",
              "keyTakeaway": "Complete mastery and exam readiness for ${examType}"
            }
          ],
          "practicalExample": "Real ${examType} exam question example with detailed step-by-step solution using proper LaTeX formatting",
          "commonPitfalls": ["Common calculation error in ${examType} questions", "Time management mistake", "Conceptual trap to avoid", "Formula application error"],
          "difficulty": "${learnerLevel}",
          "estimatedTime": "30-45 minutes to master for ${examType} exam"
        }
      ]
    }

    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON.
    • Do NOT include any additional commentary, explanation, or prose outside the JSON.
    • Ensure the JSON is completely valid and self-contained.
    • Use proper LaTeX formatting for all mathematical expressions in the content.

    Content to process:
    ${content}
  `;

  try {
    console.log(
      "Processing LLM response for competitive exam module summary..."
    );

    // Validate input content
    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      console.warn(
        "Invalid content provided to generateCompetitiveExamModuleSummary"
      );
      throw new Error("Content is required and must be a non-empty string");
    }

    // Limit content length to prevent API issues
    const maxContentLength = 50000; // Adjust based on Gemini's limits
    const truncatedContent =
      content.length > maxContentLength
        ? content.substring(0, maxContentLength) +
          "...\n[Content truncated due to length]"
        : content;

    console.log(
      `📏 Content length: ${content.length}, using ${truncatedContent.length} characters`
    );

    // Replace the content placeholder in the prompt
    const finalPrompt = prompt.replace("${content}", truncatedContent);

    const responseText = await callGeminiWithRetry(model, finalPrompt, 5, 3000);

    if (!responseText || responseText.trim().length === 0) {
      console.warn("Empty response from Gemini API");
      throw new Error("Empty response from AI service");
    }

    // Parse the JSON with robust parsing
    let parsed = await parseLargeGeminiResponse(responseText);

    // Create fallback title for error recovery
    const contentTitle = content
      ? content.substring(0, 100).replace(/[^\w\s]/g, "").trim()
      : "this topic";
    const fallbackTitle = contentTitle.length > 0 ? contentTitle : "this module";

    // Validate and enhance the parsed response structure
    if (parsed && typeof parsed === "object") {
      // Check if we have the minimal required structure
      const hasBasicStructure = parsed.summary || parsed.objectives || parsed.detailedSubsections;
      
      if (hasBasicStructure) {
        console.log("✅ Successfully parsed competitive exam module summary with basic structure");
        
        // Ensure all required fields exist with defaults
        const enhancedParsed = {
          summary: parsed.summary || `Learn about ${fallbackTitle} for ${examType} exam success.`,
          objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [
            `Understand key concepts in ${fallbackTitle}`,
            `Apply knowledge for ${examType} exam questions`,
            `Master problem-solving techniques`
          ],
          examples: Array.isArray(parsed.examples) ? parsed.examples : [
            `Example 1: Basic application of ${fallbackTitle}`,
            `Example 2: Advanced problem solving`
          ],
          resources: parsed.resources || {
            books: [], courses: [], articles: [], videos: [], tools: [], websites: [], exercises: []
          },
          detailedSubsections: Array.isArray(parsed.detailedSubsections) ? parsed.detailedSubsections : [],
          visualizationSuggestions: parsed.visualizationSuggestions || {
            hasFlowcharts: false, hasComparisons: false, hasTimelines: false, hasFormulas: false,
            hasProcessSteps: false, hasCyclicalProcesses: false, hasHierarchies: false,
            hasRelationships: false, codeSimulationTopics: [], interactiveElements: []
          },
          beautifulSummaryElements: parsed.beautifulSummaryElements || {
            keyInsights: [`Key insight about ${fallbackTitle}`],
            practicalApplications: [`How ${fallbackTitle} applies in ${examType} exams`],
            whyItMatters: `Understanding ${fallbackTitle} is important for ${examType} exam success`,
            careerRelevance: `Knowledge of ${fallbackTitle} helps in career advancement`,
            difficultyLevel: learnerLevel,
            prerequisites: ["Basic mathematical skills"],
            estimatedStudyTime: "2-4 hours"
          }
        };
        
        // Apply LaTeX arrow fixes to the enhanced response
        return fixLatexInObject(enhancedParsed);
      } else {
        console.warn("Parsed response lacks basic structure:", Object.keys(parsed));
        // Continue to fallback creation
      }
    } else {
      console.warn("Parsed response is not a valid object:", typeof parsed, parsed);
      // Continue to fallback creation
    }
  } catch (error) {
    console.error("Error processing competitive exam Gemini response:", error);
    console.error("Error stack:", error.stack);

    // Use the already created fallback title
    const contentTitle = content
      ? content.substring(0, 100).replace(/[^\w\s]/g, "").trim()
      : "this topic";
    const fallbackTitle = contentTitle.length > 0 ? contentTitle : "this module";

    return {
      summary: `Learn about ${fallbackTitle} for ${examType} exam success. This content is being processed and will be available soon.`,
      objectives: [
        `Understand key concepts in ${fallbackTitle}`,
        `Apply knowledge for ${examType} exam questions`,
        `Master problem-solving techniques`,
        `Practice with exam-style questions`,
        `Develop speed and accuracy`,
      ],
      examples: [
        `Example 1: Basic application of ${fallbackTitle}`,
        `Example 2: Advanced problem solving`,
        `Example 3: Real exam scenario`,
      ],
      resources: {
        books: [],
        courses: [],
        articles: [],
        videos: [],
        tools: [],
        websites: [],
        exercises: [],
      },
      detailedSubsections: [
        {
          title: `Introduction to ${fallbackTitle}`,
          summary: `Basic concepts and fundamentals of ${fallbackTitle}`,
          keyPoints: [
            `Core concepts of ${fallbackTitle}`,
            `Key principles to remember`,
            `Common applications`,
          ],
          pages: [
            {
              pageNumber: 1,
              pageTitle: "Overview",
              content:
                content ||
                `This section covers the essential concepts of ${fallbackTitle}. Content is being generated and will be available soon.`,
              keyTakeaway: `Understanding the fundamentals of ${fallbackTitle}`,
              codeExamples: [],
              mathematicalContent: [],
            },
          ],
          practicalExample: `Real-world application of ${fallbackTitle}`,
          commonPitfalls: [
            `Common mistakes in ${fallbackTitle}`,
            `Best practices to follow`,
          ],
          difficulty: "intermediate",
          estimatedTime: "15-20 minutes",
        },
      ],
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
        keyInsights: [`Key insight about ${fallbackTitle}`],
        practicalApplications: [
          `How ${fallbackTitle} applies in ${examType} exams`,
        ],
        whyItMatters: `Understanding ${fallbackTitle} is important for ${examType} exam success`,
        careerRelevance: `Knowledge of ${fallbackTitle} helps in career advancement`,
        difficultyLevel: learnerLevel,
        prerequisites: ["Basic mathematical skills"],
        estimatedStudyTime: "2-4 hours",
      },
    };
  }
}

export async function generateModuleSummary(content, context = {}) {
  const {
    learnerLevel = "intermediate",
    subject = "general",
    moduleIndex = 1,
    totalModules = 1,
  } = context;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const responseText = response.text();

  try {
    console.log("Processing LLM response for module summary...");

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
      exercises: [],
    };

    // Helper function to ensure all resources have URLs
    const ensureResourceUrl = (resource, type) => {
      if (!resource.url || resource.url.trim() === "") {
        const title = resource.title || resource.name || "resource";
        console.log(`Adding fallback URL for ${type} resource: "${title}"`);

        const searchQuery = encodeURIComponent(title);

        switch (type) {
          case "books":
            resource.url = `https://www.amazon.com/s?k=${searchQuery}`;
            break;
          case "courses":
            resource.url = `https://www.coursera.org/search?query=${searchQuery}`;
            break;
          case "articles":
            resource.url = `https://scholar.google.com/scholar?q=${searchQuery}`;
            break;
          case "videos":
            resource.url = `https://www.youtube.com/results?search_query=${searchQuery}`;
            break;
          case "tools":
            resource.url = `https://www.google.com/search?q=${searchQuery}+tool+software`;
            break;
          case "websites":
            resource.url = `https://www.google.com/search?q=${searchQuery}`;
            break;
          case "exercises":
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
      if (
        typeof parsed.resources === "object" &&
        !Array.isArray(parsed.resources)
      ) {
        console.log("Resources are already in categorized format");
        // It's already in the format we want, just make sure all arrays exist and have URLs
        formattedResources = {
          books: Array.isArray(parsed.resources.books)
            ? parsed.resources.books.map((r) => ensureResourceUrl(r, "books"))
            : [],
          courses: Array.isArray(parsed.resources.courses)
            ? parsed.resources.courses.map((r) =>
                ensureResourceUrl(r, "courses")
              )
            : [],
          articles: Array.isArray(parsed.resources.articles)
            ? parsed.resources.articles.map((r) =>
                ensureResourceUrl(r, "articles")
              )
            : [],
          videos: Array.isArray(parsed.resources.videos)
            ? parsed.resources.videos.map((r) => ensureResourceUrl(r, "videos"))
            : [],
          tools: Array.isArray(parsed.resources.tools)
            ? parsed.resources.tools.map((r) => ensureResourceUrl(r, "tools"))
            : [],
          websites: Array.isArray(parsed.resources.websites)
            ? parsed.resources.websites.map((r) =>
                ensureResourceUrl(r, "websites")
              )
            : [],
          exercises: Array.isArray(parsed.resources.exercises)
            ? parsed.resources.exercises.map((r) =>
                ensureResourceUrl(r, "exercises")
              )
            : [],
        };
      }
      // If resources is an array of typed resources, categorize them
      else if (Array.isArray(parsed.resources)) {
        console.log("Resources are in array format, categorizing...");
        parsed.resources.forEach((resource) => {
          if (!resource || !resource.type) return;

          // Determine resource type
          const type = resource.type.toLowerCase();
          let category;

          switch (type) {
            case "book":
              category = "books";
              break;
            case "course":
              category = "courses";
              break;
            case "article":
              category = "articles";
              break;
            case "video":
              category = "videos";
              break;
            case "tool":
              category = "tools";
              break;
            case "website":
              category = "websites";
              break;
            case "exercise":
              category = "exercises";
              break;
            default:
              category = "websites";
          }

          // Ensure URL exists and push to appropriate category
          formattedResources[category].push(
            ensureResourceUrl(resource, category)
          );
        });
        console.log("Categorized resources:", {
          books: formattedResources.books.length,
          courses: formattedResources.courses.length,
          articles: formattedResources.articles.length,
          videos: formattedResources.videos.length,
          tools: formattedResources.tools.length,
          websites: formattedResources.websites.length,
          exercises: formattedResources.exercises.length,
        });
      }
    }

    // Final check to ensure all resources have URLs
    Object.keys(formattedResources).forEach((resourceType) => {
      formattedResources[resourceType] = formattedResources[resourceType].map(
        (resource) => {
          return ensureResourceUrl(resource, resourceType);
        }
      );
    });

    const result = {
      summary: parsed.summary || responseText.substring(0, 150) + "...",
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
        interactiveElements: [],
      },
      beautifulSummaryElements: parsed.beautifulSummaryElements || {
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
      detailedSubsections: Array.isArray(parsed.detailedSubsections)
        ? parsed.detailedSubsections
        : [],
    };

    console.log("Successfully processed module summary");
    return result;
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    console.error("Response excerpt:", responseText.substring(0, 200));

    // Try to extract at least some content if possible
    let summary = responseText.substring(0, 150) + "...";
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
      const objectivesMatch = responseText.match(
        /"objectives"\s*:\s*\[(.*?)\]/s
      );
      if (objectivesMatch && objectivesMatch[1]) {
        const objectiveItems = objectivesMatch[1].match(/"([^"]+)"/g);
        if (objectiveItems) {
          objectives = objectiveItems.map((item) => item.replace(/"/g, ""));
        }
      }

      // Extract examples if possible
      const examplesMatch = responseText.match(/"examples"\s*:\s*\[(.*?)\]/s);
      if (examplesMatch && examplesMatch[1]) {
        const exampleItems = examplesMatch[1].match(/"([^"]+)"/g);
        if (exampleItems) {
          examples = exampleItems.map((item) => item.replace(/"/g, ""));
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
      exercises: [],
    };

    // Try to at least extract resource titles and create fallback URLs
    try {
      // Common patterns for resources in the text
      const bookMatches = responseText.match(
        /"title"\s*:\s*"([^"]+)".*?"book/gi
      );
      const courseMatches = responseText.match(
        /"title"\s*:\s*"([^"]+)".*?"course/gi
      );
      const videoMatches = responseText.match(
        /"title"\s*:\s*"([^"]+)".*?"video/gi
      );

      // Create basic resources with fallback URLs from any matches
      if (bookMatches) {
        bookMatches.forEach((match) => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.books.push({
              title,
              description: `A book related to this topic`,
              url: `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
            });
          }
        });
      }

      if (courseMatches) {
        courseMatches.forEach((match) => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.courses.push({
              title,
              description: `A course related to this topic`,
              url: `https://www.coursera.org/search?query=${encodeURIComponent(
                title
              )}`,
            });
          }
        });
      }

      if (videoMatches) {
        videoMatches.forEach((match) => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.videos.push({
              title,
              description: `A video related to this topic`,
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                title
              )}`,
            });
          }
        });
      }

      console.log("Extracted basic resources despite parsing error");
    } catch (extractError) {
      console.error(
        "Failed to extract resources from malformed response:",
        extractError
      );
    }

    return {
      summary,
      objectives,
      examples,
      resources: extractedResources,
    };
  }
}

// Enhanced module summary generation with JSON output
export async function generateMarkdownModuleSummary(content, context = {}) {
  const {
    learnerLevel = "intermediate",
    subject = "general",
    moduleIndex = 1,
    totalModules = 1,
  } = context;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `
  You are an expert AI flashcard generator helping learners master "${subsectionTitle}" for competitive exams like ${examType} (${subject}).
  
  🎯 GOAL:
  Create highly engaging, premium-quality flashcards that help students rapidly revise and remember concepts. The learner should feel it's worth paying for this experience.
  
  📘 SECTION: "Concept Flashcards" (7–10 cards)
  - Cover essential definitions, problem-solving ideas, tips, tricks, and use-cases
  - Include common exam traps and what to watch out for
  - Use short, conversational questions (like a personal coach or mentor would ask)
  
  🧮 SECTION: "Formula Flashcards" (5–10 cards)
  - Each card contains:
    • A key formula using LaTeX ($...$ or $$...$$)
    • Definitions of all variables + units
    • When and how to use it (briefly)
  
  🧠 TONE & STYLE:
  - Conversational, clear, concise (answers < 50 words)
  - Avoid dry textbook style – make it feel like you're tutoring a real student
  - Add motivational, exam-oriented cues where helpful
  
  📐 FORMATTING RULES (STRICT):
  - Use inline math: $...$
  - LaTeX: \\frac, \\sqrt, \\sum, etc. (SINGLE backslash)
  - Units: $\\Omega$, $\\text{kg}$, $\\text{m/s}$, etc.
  - Center formulas if needed
  - Arrows: Use "to" instead of \\to
  - Balanced braces: $\\frac{a + b}{c}$
  
  💡 OUTPUT FORMAT:
  Respond ONLY with VALID JSON using this structure:
  
  {
    "title": "${subsectionTitle}",
    "summary": "One-liner overview of what this subsection teaches.",
    "conceptFlashCards": [
      {
        "question": "How can you quickly identify ... in ${examType} exams?",
        "answer": "Use [technique]. It works best when [situation]. Avoid [trap]."
      },
      ...
    ],
    "formulaFlashCards": [
      {
        "question": "What is the formula for [concept]?",
        "answer": "$F = ma$, where F = force (N), m = mass (kg), a = acceleration (m/s^2)"
      },
      ...
    ],
    "difficulty": "Beginner | Intermediate | Advanced",
    "estimatedTime": "5–10 minutes"
  }
  
  RULES:
  - Do NOT include markdown blocks or commentary.
  - Separate formulas from conceptual flashcards.
  - Use ONLY JSON.
  - Focus on exam-relevant concepts (not exhaustive theory).
  - Assume learner is smart but short on time.
  - Make them feel confident and ready.
  
  Content to process:
  ${content}
  `;

  try {
    console.log("Processing LLM response for module summary...");
    const responseText = await callGeminiWithRetry(model, prompt, 5, 3000);

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
    console.error("Error processing module summary:", error);
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

export async function generateQuiz(moduleContent, difficulty = "medium") {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Based on this educational content, generate a ${difficulty} difficulty quiz with 5 multiple choice questions.
    
    MATHEMATICAL CONTENT FORMATTING REQUIREMENTS:
    - Format all mathematical equations and formulas using LaTeX syntax
    - For inline equations, use $...$ delimiters (e.g., $E = mc^2$)
    - For block/display equations, use $$...$$ delimiters 
    - Use SINGLE backslash for LaTeX commands: \\frac{numerator}{denominator}, \\sqrt{expression}, \\sum, \\int
    - For fractions: \\frac{numerator}{denominator}
    - For square roots: \\sqrt{expression}
    - For summations: \\sum_{i=1}^{n}
    - For integrals: \\int_{a}^{b} f(x) dx
    - For limits: \\lim_{x \\text{ to } 0} f(x) (use "to" instead of "\\to")
    - For Greek letters: \\alpha, \\beta, \\theta, \\pi, \\infty
    - Use \\text{} for text within equations: $\\text{area} = \\pi r^2$
    - For arrows: Use "to" instead of "\\to" (e.g., "$f: A \\text{ to } B$")
    - Center math expressions properly for display
    
    Content: ${moduleContent}
    
    REQUIREMENTS:
    - Each question should test understanding of key concepts
    - Include mathematical formulas and calculations where appropriate using LaTeX syntax
    - Options should be plausible but only one clearly correct
    - Explanations should be clear and educational, using LaTeX for mathematical content
    - Questions should be appropriate for ${difficulty} difficulty level
    
    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON.
    • Do NOT include any markdown code blocks, backticks, or additional formatting.
    • Do NOT include any commentary, explanation, or prose outside the JSON.
    • Ensure the JSON is completely valid and self-contained.
    
    Use this JSON structure:
    {
        "questions": [
          {
            "question": "Question text with LaTeX formatting for math: $x^2 + y^2 = z^2$",
            "options": ["Option A with math: $a = \\frac{b}{c}$", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": "Explanation with LaTeX math: The formula $E = mc^2$ shows..."
          }
        ]
    }
  `;

  try {
    let responseText = await callGeminiWithRetry(model, prompt, 3, 2000);

    console.log("🔧 Processing pure JSON quiz response...");

    // Parse the JSON directly (no more markdown extraction needed)
    let parsed = await parseLargeGeminiResponse(responseText);

    if (parsed && parsed.questions) {
      console.log("✅ Successfully parsed quiz JSON response");
      return parsed;
    } else {
      console.log("⚠️ No questions found in response, returning empty quiz");
      return { questions: [] };
    }
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
    
    IMPORTANT OUTPUT FORMAT:
    • Respond with ONLY valid JSON.
    • Do NOT include any markdown code blocks, backticks, or additional formatting.
    • Do NOT include any commentary, explanation, or prose outside the JSON.
    • Ensure the JSON is completely valid and self-contained.
    
    Use this JSON structure:
    {
        "response": "Your complete helpful, encouraging tutor response that directly answers the question, uses simple language, provides examples when helpful, and encourages further learning."
      }
  `;

  try {
    let responseText = await callGeminiWithRetry(model, context, 3, 2000);

    console.log("🔧 Processing pure JSON tutor response...");

    // Parse the JSON directly (no more markdown extraction needed)
    let parsed = await parseLargeGeminiResponse(responseText);

    if (parsed && parsed.response) {
      console.log("✅ Successfully parsed tutor JSON response");
      return parsed.response;
    } else {
      console.log(
        "⚠️ No response found in JSON, using raw response as fallback"
      );
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
  You are an expert academic AI creating ORGANIZED flashcards for competitive exam preparation (${examType}) in ${subject}.
  
  For the subsection: "${subsectionTitle}"
  
  Create TWO SEPARATE CATEGORIES:
  
  1. **CONCEPT FLASHCARDS** (5-10 cards):
     - Important conceptual understanding
     - Key definitions and explanations
     - Problem-solving strategies
     - Exam tips and tricks
  
  2. **FORMULA FLASHCARDS** (5-10 cards):
     - Essential mathematical formulas
     - Variable definitions
     - Units and conversions
     - Formula applications
  
  🎯 **REQUIREMENTS**:
  - Concept cards: Focus on WHY and HOW
  - Formula cards: Focus on mathematical expressions with LaTeX
  - Keep answers under 50 words
  - Make questions exam-specific
  
  🧮 **MATH FORMAT (STRICT)**:
  - Use single backslashes: \\frac{a}{b}, \\sqrt{x}, \\sum, \\int
  - Inline math: $P = I^2R$
  - Units: $\\Omega$, $\\text{kg}$, $\\text{m/s}$
  - Greek letters: $\\alpha$, $\\beta$, $\\pi$, $\\theta$
  - For arrows: Use "to" instead of "\\to" (e.g., "$x \\text{ to } 0$")
  - Center math properly for flashcard display
  
  🚨 **OUTPUT FORMAT - ONLY JSON**:
  {
    "title": "${subsectionTitle}",
    "summary": "One sentence overview of this subsection.",
    "conceptFlashCards": [
      {
        "question": "What is the key strategy for solving [concept] problems?",
        "answer": "Clear conceptual explanation in simple terms"
      },
      {
        "question": "When should you use [technique] in ${examType} exams?",
        "answer": "Specific exam context and application"
      }
    ],
    "formulaFlashCards": [
      {
        "question": "What is the formula for [concept]?",
        "answer": "$F = ma$ where F = force (N), m = mass (kg), a = acceleration (m/s²)"
      },
      {
        "question": "How do you calculate [quantity]?",
        "answer": "$E = \\frac{1}{2}mv^2$ where E = kinetic energy, m = mass, v = velocity"
      }
    ],
    "difficulty": "Beginner | Intermediate | Advanced",
    "estimatedTime": "5-10 minutes"
  }
  
  **RULES**:
  - NO markdown blocks or extra text
  - Separate concepts from formulas clearly
  - Focus on exam-critical content only
  - Include variable definitions in formula answers
  
  Content: ${content}
  `;

  try {
    console.log(`Generating categorized flashcards for: "${subsectionTitle}"`);
    const responseText = await callGeminiWithRetry(model, prompt, 3, 2000);

    // Parse the JSON with robust parsing
    let parsed = await parseLargeGeminiResponse(responseText);

    if (parsed && (parsed.conceptFlashCards || parsed.formulaFlashCards)) {
      console.log(
        `✅ Generated ${
          parsed.conceptFlashCards?.length || 0
        } concept cards and ${
          parsed.formulaFlashCards?.length || 0
        } formula cards for "${subsectionTitle}"`
      );
      return {
        title: parsed.title || subsectionTitle,
        summary: parsed.summary || "Summary not available",
        conceptFlashCards: parsed.conceptFlashCards || [],
        formulaFlashCards: parsed.formulaFlashCards || [],
        difficulty: parsed.difficulty || "Intermediate",
        estimatedTime: parsed.estimatedTime || "5-10 minutes",
      };
    } else {
      console.log(
        `⚠️ No flashcards generated for "${subsectionTitle}", using fallback`
      );
      return createCategorizedFallbackContent(subsectionTitle);
    }
  } catch (error) {
    console.error(
      `Error generating flashcards for "${subsectionTitle}":`,
      error
    );
    return createCategorizedFallbackContent(subsectionTitle);
  }
}

// Categorized fallback content
function createCategorizedFallbackContent(subsectionTitle) {
  return {
    title: subsectionTitle,
    summary: `Important concepts and formulas for ${subsectionTitle}.`,
    conceptFlashCards: [
      {
        question: `What is the key concept in ${subsectionTitle}?`,
        answer: "Fundamental understanding will be available soon.",
      },
      {
        question: `What strategy works best for ${subsectionTitle} problems?`,
        answer: "Problem-solving strategies will be provided soon.",
      },
    ],
    formulaFlashCards: [
      {
        question: `What is the main formula for ${subsectionTitle}?`,
        answer: "Mathematical formula will be provided soon.",
      },
      {
        question: `How do you calculate values in ${subsectionTitle}?`,
        answer: "Calculation methods will be available soon.",
      },
    ],
    difficulty: "Intermediate",
    estimatedTime: "5-10 minutes",
  };
}

// Import Perplexity functions
import {
  generatePerplexityQuiz,
  generatePerplexityResources,
  generatePerplexityModuleSummary,
  generatePerplexityCompetitiveExamModuleSummary,
} from "./perplexity.js";

// Flexible provider choice functions for educators

// Multi-provider quiz generation
export async function generateQuizWithProvider(
  moduleContent,
  difficulty = "medium",
  context = {},
  provider = "gemini"
) {
  const { fallback = true } = context;

  console.log(`🎯 Generating quiz with provider: ${provider}`);

  try {
    if (provider === "perplexity") {
      const result = await generatePerplexityQuiz(
        moduleContent,
        difficulty,
        context
      );
      if (result && result.questions && result.questions.length > 0) {
        console.log(`✅ Successfully generated quiz with Perplexity`);
        return { ...result, generatedWith: "perplexity" };
      } else if (fallback) {
        console.log("⚠️ Perplexity failed, falling back to Gemini");
        const geminiResult = await generateQuiz(moduleContent, difficulty);
        return { ...geminiResult, generatedWith: "gemini-fallback" };
      } else {
        throw new Error("Perplexity quiz generation failed");
      }
    } else {
      // Default to Gemini
      const result = await generateQuiz(moduleContent, difficulty);
      return { ...result, generatedWith: "gemini" };
    }
  } catch (error) {
    console.error(`Error with ${provider} quiz generation:`, error);
    if (fallback && provider === "perplexity") {
      console.log("⚠️ Falling back to Gemini due to error");
      const geminiResult = await generateQuiz(moduleContent, difficulty);
      return { ...geminiResult, generatedWith: "gemini-fallback" };
    }
    throw error;
  }
}

// Multi-provider module summary generation
export async function generateModuleSummaryWithProvider(
  content,
  context = {},
  provider = "gemini"
) {
  const { fallback = true } = context;

  console.log(`🎯 Generating module summary with provider: ${provider}`);

  try {
    if (provider === "perplexity") {
      const result = await generatePerplexityModuleSummary(content, context);
      if (result && result.summary) {
        console.log(`✅ Successfully generated module summary with Perplexity`);
        return { ...result, generatedWith: "perplexity" };
      } else if (fallback) {
        console.log("⚠️ Perplexity failed, falling back to Gemini");
        const geminiResult = await generateModuleSummary(content, context);
        return { ...geminiResult, generatedWith: "gemini-fallback" };
      } else {
        throw new Error("Perplexity module summary generation failed");
      }
    } else {
      // Default to Gemini
      const result = await generateModuleSummary(content, context);
      return { ...result, generatedWith: "gemini" };
    }
  } catch (error) {
    console.error(`Error with ${provider} module summary generation:`, error);
    if (fallback && provider === "perplexity") {
      console.log("⚠️ Falling back to Gemini due to error");
      const geminiResult = await generateModuleSummary(content, context);
      return { ...geminiResult, generatedWith: "gemini-fallback" };
    }
    throw error;
  }
}

// Multi-provider competitive exam module summary generation
export async function generateCompetitiveExamModuleSummaryWithProvider(
  content,
  context = {},
  provider = "gemini"
) {
  const { fallback = true } = context;

  console.log(
    `🎯 Generating competitive exam module summary with provider: ${provider}`
  );

  try {
    if (provider === "perplexity") {
      const result = await generatePerplexityCompetitiveExamModuleSummary(
        content,
        context
      );
      if (result && result.length > 100) {
        console.log(
          `✅ Successfully generated competitive exam module summary with Perplexity`
        );
        return result;
      } else if (fallback) {
        console.log("⚠️ Perplexity failed, falling back to Gemini");
        return await generateCompetitiveExamModuleSummary(content, context);
      } else {
        throw new Error(
          "Perplexity competitive exam module summary generation failed"
        );
      }
    } else {
      // Default to Gemini
      return await generateCompetitiveExamModuleSummary(content, context);
    }
  } catch (error) {
    console.error(
      `Error with ${provider} competitive exam module summary generation:`,
      error
    );
    if (fallback && provider === "perplexity") {
      console.log("⚠️ Falling back to Gemini due to error");
      return await generateCompetitiveExamModuleSummary(content, context);
    }
    throw error;
  }
}

// Multi-provider resources generation (standalone function)
export async function generateResourcesWithProvider(
  moduleContent,
  context = {},
  provider = "gemini"
) {
  const { fallback = true } = context;

  console.log(`🎯 Generating resources with provider: ${provider}`);

  try {
    if (provider === "perplexity") {
      const result = await generatePerplexityResources(moduleContent, context);
      if (result && (result.books || result.courses || result.articles)) {
        console.log(`✅ Successfully generated resources with Perplexity`);
        return { resources: result, generatedWith: "perplexity" };
      } else if (fallback) {
        console.log("⚠️ Perplexity resources failed, falling back to Gemini");
        // Generate with Gemini's module summary function and extract resources
        const geminiResult = await generateModuleSummary(
          moduleContent,
          context
        );
        return {
          resources: geminiResult.resources || {},
          generatedWith: "gemini-fallback",
        };
      } else {
        throw new Error("Perplexity resources generation failed");
      }
    } else {
      // Default to Gemini - extract resources from module summary
      const geminiResult = await generateModuleSummary(moduleContent, context);
      return {
        resources: geminiResult.resources || {},
        generatedWith: "gemini",
      };
    }
  } catch (error) {
    console.error(`Error with ${provider} resources generation:`, error);
    if (fallback && provider === "perplexity") {
      console.log("⚠️ Falling back to Gemini due to error");
      const geminiResult = await generateModuleSummary(moduleContent, context);
      return {
        resources: geminiResult.resources || {},
        generatedWith: "gemini-fallback",
      };
    }
    throw error;
  }
}

// Enhanced module summary with separate resource generation (hybrid approach)
export async function generateEnhancedModuleSummary(
  content,
  context = {},
  contentProvider = "gemini",
  resourceProvider = "perplexity"
) {
  console.log(
    `🎯 Generating enhanced module summary with content provider: ${contentProvider}, resource provider: ${resourceProvider}`
  );

  try {
    // Generate main content structure
    let moduleResult;
    if (contentProvider === "perplexity") {
      moduleResult = await generatePerplexityModuleSummary(content, context);
    } else {
      moduleResult = await generateModuleSummary(content, context);
    }

    // Generate enhanced resources separately
    let resourcesResult;
    if (resourceProvider === "perplexity") {
      const perplexityResources = await generatePerplexityResources(content, {
        subject: context.subject || "general",
        learnerLevel: context.learnerLevel || "intermediate",
        moduleTitle:
          moduleResult.summary?.substring(0, 100) || "Learning Module",
      });
      resourcesResult = perplexityResources;
    } else {
      // Use resources from the module result
      resourcesResult = moduleResult.resources || {};
    }

    // Merge results
    const finalResult = {
      ...moduleResult,
      resources: resourcesResult,
      generatedWith: {
        content: contentProvider,
        resources: resourceProvider,
      },
    };

    console.log(
      `✅ Successfully generated enhanced module summary with ${contentProvider} content and ${resourceProvider} resources`
    );
    return finalResult;
  } catch (error) {
    console.error("Error in enhanced module summary generation:", error);
    // Fallback to pure Gemini
    const fallbackResult = await generateModuleSummary(content, context);
    return {
      ...fallbackResult,
      generatedWith: {
        content: "gemini-fallback",
        resources: "gemini-fallback",
      },
    };
  }
}

// Get available providers
export function getAvailableProviders() {
  const providers = {
    gemini: {
      name: "Google Gemini",
      available: !!process.env.GEMINI_API_KEY,
      features: [
        "Content Generation",
        "Quiz Generation",
        "Resource Finding",
        "Mathematical Formatting",
      ],
      description:
        "Advanced content structuring and educational formatting with excellent mathematical content support",
    },
    perplexity: {
      name: "Perplexity AI",
      available: !!process.env.PERPLEXITY_API_KEY,
      features: [
        "Real-time Web Search",
        "Current Information",
        "Source Citations",
        "Research",
      ],
      description:
        "Real-time web search with current information and source citations",
    },
  };

  return providers;
}

// Test provider connections
export async function testAllProviders() {
  const results = {};

  // Test Gemini
  try {
    const geminiTest = await testGeminiConnection();
    results.gemini = geminiTest;
  } catch (error) {
    results.gemini = { success: false, error: error.message };
  }

  // Test Perplexity
  try {
    const { testPerplexityConnection } = await import("./perplexity.js");
    const perplexityTest = await testPerplexityConnection();
    results.perplexity = perplexityTest;
  } catch (error) {
    results.perplexity = { success: false, error: error.message };
  }

  return results;
}

// Helper function to create fallback content when generation fails
function createFallbackSubsectionContent(subsectionTitle) {
  return {
    title: subsectionTitle,
    summary: `Important concepts and formulas for ${subsectionTitle}.`,
    flashCards: [
      {
        question: `What is the key concept in ${subsectionTitle}?`,
        answer: "Content will be available soon.",
      },
      {
        question: `What is the main formula for ${subsectionTitle}?`,
        answer: "Formula will be provided soon.",
      },
    ],
    difficulty: "Intermediate",
    estimatedTime: "5-10 minutes",
  };
}

// Helper function to validate and fix subsection data
function validateAndFixSubsectionData(data, subsectionTitle) {
  // Check if we have the new categorized flashcard structure
  if (data.conceptFlashCards || data.formulaFlashCards) {
    console.log(
      `✅ Using categorized flashcard structure for "${subsectionTitle}"`
    );
    return {
      title: data.title || subsectionTitle,
      summary: data.summary || "Summary not available",
      conceptFlashCards: (data.conceptFlashCards || []).slice(0, 8), // Limit to 8 concept cards max
      formulaFlashCards: (data.formulaFlashCards || []).slice(0, 6), // Limit to 6 formula cards max
      difficulty: data.difficulty || "Intermediate",
      estimatedTime: data.estimatedTime || "5-10 minutes",
    };
  }

  // Check if we have the old unified flashcard structure
  if (data.flashCards && Array.isArray(data.flashCards)) {
    console.log(
      `🔄 Converting unified flashCards to categorized structure for "${subsectionTitle}"`
    );

    const conceptFlashCards = [];
    const formulaFlashCards = [];

    data.flashCards.forEach((card) => {
      // Check if the question or answer contains mathematical formulas ($ symbols)
      const hasFormula = (card.question + " " + card.answer).includes("$");
      const isFormula =
        card.question.toLowerCase().includes("formula") ||
        card.question.toLowerCase().includes("equation") ||
        card.question.toLowerCase().includes("calculate");

      if (hasFormula || isFormula) {
        formulaFlashCards.push(card);
      } else {
        conceptFlashCards.push(card);
      }
    });

    return {
      title: data.title || subsectionTitle,
      summary: data.summary || "Summary not available",
      conceptFlashCards: conceptFlashCards.slice(0, 8),
      formulaFlashCards: formulaFlashCards.slice(0, 6),
      difficulty: data.difficulty || "Intermediate",
      estimatedTime: data.estimatedTime || "5-10 minutes",
    };
  }

  // Legacy fallback: Check for old conceptGroups structure
  if (data.conceptGroups && Array.isArray(data.conceptGroups)) {
    console.log(
      `🔄 Converting conceptGroups to categorized flashcards for "${subsectionTitle}"`
    );

    const conceptFlashCards = [];
    const formulaFlashCards = [];

    data.conceptGroups.forEach((group, index) => {
      if (group.title && group.description) {
        conceptFlashCards.push({
          question: `What is ${group.title}?`,
          answer: group.description.substring(0, 200),
        });
      }

      // Add formulas as formula flashcards
      if (group.formulas && group.formulas.length > 0) {
        group.formulas.forEach((formula, fIndex) => {
          formulaFlashCards.push({
            question: `What is the formula for ${group.title}?`,
            answer: formula,
          });
        });
      }
    });

    return {
      title: data.title || subsectionTitle,
      summary: data.summary || "Summary not available",
      conceptFlashCards: conceptFlashCards.slice(0, 8),
      formulaFlashCards: formulaFlashCards.slice(0, 6),
      difficulty: data.difficulty || "Intermediate",
      estimatedTime: data.estimatedTime || "5-10 minutes",
    };
  }

  // Legacy page structure fallback
  console.log(
    `⚠️ Converting legacy pages to categorized flashcards for "${subsectionTitle}"`
  );
  const conceptFlashCards = [
    {
      question: `What is the main concept of ${subsectionTitle}?`,
      answer: data.summary || "Key concepts for this subsection",
    },
  ];

  const formulaFlashCards = [
    {
      question: `What are the key formulas for ${subsectionTitle}?`,
      answer: "Mathematical formulas will be provided soon.",
    },
  ];

  if (data.keyPoints && Array.isArray(data.keyPoints)) {
    data.keyPoints.slice(0, 4).forEach((point, index) => {
      conceptFlashCards.push({
        question: `Key Point ${index + 1}: What should you remember?`,
        answer: point,
      });
    });
  }

  return {
    title: subsectionTitle,
    summary: data.summary || "Summary not available",
    conceptFlashCards: conceptFlashCards,
    formulaFlashCards: formulaFlashCards,
    difficulty: "Intermediate",
    estimatedTime: "5-10 minutes",
  };
}

export async function generateAcademicSubsectionSummary(content, context = {}) {
  const {
    learnerLevel = "intermediate",
    subject = "general",
    moduleIndex = 1,
    totalModules = 1,
  } = context;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const responseText = response.text();

  try {
    console.log("Processing LLM response for academic subsection summary...");

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
      exercises: [],
    };

    // Helper function to ensure all resources have URLs
    const ensureResourceUrl = (resource, type) => {
      if (!resource.url || resource.url.trim() === "") {
        const title = resource.title || resource.name || "resource";
        console.log(`Adding fallback URL for ${type} resource: "${title}"`);

        const searchQuery = encodeURIComponent(title);

        switch (type) {
          case "books":
            resource.url = `https://www.amazon.com/s?k=${searchQuery}`;
            break;
          case "courses":
            resource.url = `https://www.coursera.org/search?query=${searchQuery}`;
            break;
          case "articles":
            resource.url = `https://scholar.google.com/scholar?q=${searchQuery}`;
            break;
          case "videos":
            resource.url = `https://www.youtube.com/results?search_query=${searchQuery}`;
            break;
          case "tools":
            resource.url = `https://www.google.com/search?q=${searchQuery}+tool+software`;
            break;
          case "websites":
            resource.url = `https://www.google.com/search?q=${searchQuery}`;
            break;
          case "exercises":
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
      if (
        typeof parsed.resources === "object" &&
        !Array.isArray(parsed.resources)
      ) {
        console.log("Resources are already in categorized format");
        // It's already in the format we want, just make sure all arrays exist and have URLs
        formattedResources = {
          books: Array.isArray(parsed.resources.books)
            ? parsed.resources.books.map((r) => ensureResourceUrl(r, "books"))
            : [],
          courses: Array.isArray(parsed.resources.courses)
            ? parsed.resources.courses.map((r) =>
                ensureResourceUrl(r, "courses")
              )
            : [],
          articles: Array.isArray(parsed.resources.articles)
            ? parsed.resources.articles.map((r) =>
                ensureResourceUrl(r, "articles")
              )
            : [],
          videos: Array.isArray(parsed.resources.videos)
            ? parsed.resources.videos.map((r) => ensureResourceUrl(r, "videos"))
            : [],
          tools: Array.isArray(parsed.resources.tools)
            ? parsed.resources.tools.map((r) => ensureResourceUrl(r, "tools"))
            : [],
          websites: Array.isArray(parsed.resources.websites)
            ? parsed.resources.websites.map((r) =>
                ensureResourceUrl(r, "websites")
              )
            : [],
          exercises: Array.isArray(parsed.resources.exercises)
            ? parsed.resources.exercises.map((r) =>
                ensureResourceUrl(r, "exercises")
              )
            : [],
        };
      }
      // If resources is an array of typed resources, categorize them
      else if (Array.isArray(parsed.resources)) {
        console.log("Resources are in array format, categorizing...");
        parsed.resources.forEach((resource) => {
          if (!resource || !resource.type) return;

          // Determine resource type
          const type = resource.type.toLowerCase();
          let category;

          switch (type) {
            case "book":
              category = "books";
              break;
            case "course":
              category = "courses";
              break;
            case "article":
              category = "articles";
              break;
            case "video":
              category = "videos";
              break;
            case "tool":
              category = "tools";
              break;
            case "website":
              category = "websites";
              break;
            case "exercise":
              category = "exercises";
              break;
            default:
              category = "websites";
          }

          // Ensure URL exists and push to appropriate category
          formattedResources[category].push(
            ensureResourceUrl(resource, category)
          );
        });
        console.log("Categorized resources:", {
          books: formattedResources.books.length,
          courses: formattedResources.courses.length,
          articles: formattedResources.articles.length,
          videos: formattedResources.videos.length,
          tools: formattedResources.tools.length,
          websites: formattedResources.websites.length,
          exercises: formattedResources.exercises.length,
        });
      }
    }

    // Final check to ensure all resources have URLs
    Object.keys(formattedResources).forEach((resourceType) => {
      formattedResources[resourceType] = formattedResources[resourceType].map(
        (resource) => {
          return ensureResourceUrl(resource, resourceType);
        }
      );
    });

    const result = {
      summary: parsed.summary || responseText.substring(0, 150) + "...",
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
        interactiveElements: [],
      },
      beautifulSummaryElements: parsed.beautifulSummaryElements || {
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
      detailedSubsections: Array.isArray(parsed.detailedSubsections)
        ? parsed.detailedSubsections
        : [],
    };

    console.log("Successfully processed academic subsection summary");
    return result;
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    console.error("Response excerpt:", responseText.substring(0, 200));

    // Try to extract at least some content if possible
    let summary = responseText.substring(0, 150) + "...";
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
      const objectivesMatch = responseText.match(
        /"objectives"\s*:\s*\[(.*?)\]/s
      );
      if (objectivesMatch && objectivesMatch[1]) {
        const objectiveItems = objectivesMatch[1].match(/"([^"]+)"/g);
        if (objectiveItems) {
          objectives = objectiveItems.map((item) => item.replace(/"/g, ""));
        }
      }

      // Extract examples if possible
      const examplesMatch = responseText.match(/"examples"\s*:\s*\[(.*?)\]/s);
      if (examplesMatch && examplesMatch[1]) {
        const exampleItems = examplesMatch[1].match(/"([^"]+)"/g);
        if (exampleItems) {
          examples = exampleItems.map((item) => item.replace(/"/g, ""));
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
      exercises: [],
    };

    // Try to at least extract resource titles and create fallback URLs
    try {
      // Common patterns for resources in the text
      const bookMatches = responseText.match(
        /"title"\s*:\s*"([^"]+)".*?"book/gi
      );
      const courseMatches = responseText.match(
        /"title"\s*:\s*"([^"]+)".*?"course/gi
      );
      const videoMatches = responseText.match(
        /"title"\s*:\s*"([^"]+)".*?"video/gi
      );

      // Create basic resources with fallback URLs from any matches
      if (bookMatches) {
        bookMatches.forEach((match) => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.books.push({
              title,
              description: `A book related to this topic`,
              url: `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
            });
          }
        });
      }

      if (courseMatches) {
        courseMatches.forEach((match) => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.courses.push({
              title,
              description: `A course related to this topic`,
              url: `https://www.coursera.org/search?query=${encodeURIComponent(
                title
              )}`,
            });
          }
        });
      }

      if (videoMatches) {
        videoMatches.forEach((match) => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            extractedResources.videos.push({
              title,
              description: `A video related to this topic`,
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                title
              )}`,
            });
          }
        });
      }

      console.log("Extracted basic resources despite parsing error");
    } catch (extractError) {
      console.error(
        "Failed to extract resources from malformed response:",
        extractError
      );
    }

    return {
      summary,
      objectives,
      examples,
      resources: extractedResources,
    };
  }
}
