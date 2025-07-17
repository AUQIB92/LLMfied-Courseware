import { PDFExtract } from "pdf-extract";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseLargeGeminiResponse } from './gemini.js';
import { generateContent as generateContentFromAI } from './gemini'; // Renaming the import

// Ensure the API key is loaded from environment variables
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Helper function to repair JSON string (local implementation)
function repairJsonString(jsonStr) {
  console.log("🔧 Attempting to repair JSON string locally...");
  try {
    // Basic cleanup
    let repaired = jsonStr
      // Fix trailing commas in arrays and objects
      .replace(/,\s*([\]}])/g, "$1")
      // Fix missing quotes around property names
      .replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3')
      // Fix single quotes to double quotes
      .replace(/'/g, '"')
      // Fix unquoted values that should be strings
      .replace(/([{,]\s*"[^"]+"\s*:\s*)([a-zA-Z][a-zA-Z0-9_$]*)(\s*[,}])/g, '$1"$2"$3');
    
    return repaired;
  } catch (e) {
    console.warn("⚠️ JSON repair failed:", e.message);
    return jsonStr;
  }
}

/**
 * Extracts text content from a PDF file.
 * @param {string} filePath - The path to the PDF file.
 * @returns {Promise<string>} A promise that resolves with the extracted text.
 */
export async function processPDF(filePath) {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      return reject(new Error("File path is required."));
    }
    const extract = new PDFExtract();
    extract.extract(filePath, {}, (err, data) => {
      if (err) {
        console.error("Error extracting PDF:", err);
        return reject(err);
      }
      if (!data || !data.pages) {
        console.warn("No content found in PDF.");
        return resolve("");
      }
      const text = data.pages
        .map((page) => page.content.map((item) => item.str).join(" "))
        .join("\n\n");
      resolve(text);
    });
  });
}

/**
 * Process Markdown into modules using Gemini AI for intelligent extraction
 * @param {string} content - The Markdown content
 * @param {object} context - Processing context (learnerLevel, subject, etc.)
 * @returns {Promise<Array<object>>} Array of module objects
 */
export async function processMarkdown(markdown, context) {
  console.log("📘 Processing markdown with improved module extraction");

  const prompt = `
You are an expert curriculum designer. Your task is to analyze the provided raw text, which is a syllabus or table of contents, and structure it into a clear list of modules.

**Context:**
- Course Title: ${context.title || 'Untitled Course'}
- Exam Type: ${context.examType || 'General'}
- Subject: ${context.subject || 'General'}

**Input Text:**
---
${markdown}
---

**Instructions:**
1.  Identify the main modules or sections in the text.
2.  Assign a clear, concise title to each module.
3.  The "content" for each module should be the raw text that belongs to it, including all its topics and sub-topics.
4.  Respond with ONLY a valid JSON array of module objects.

**JSON Output Format:**
[
  {
    "id": "module-1",
    "title": "Module 1 Title",
    "content": "All the raw text content for Module 1...",
    "order": 1
  },
  {
    "id": "module-2",
    "title": "Module 2 Title",
    "content": "All the raw text content for Module 2...",
    "order": 2
  }
]

**Example:**

**Input Text:**
Module 1: Electric Circuits
- Basic concepts: KVL, KCL
- Network Theorems

Module 2: Electrical Machines
- DC Machines
- Transformers

**JSON Output:**
[
  {
    "id": "module-1",
    "title": "Electric Circuits",
    "content": "- Basic concepts: KVL, KCL\\n- Network Theorems",
    "order": 1
  },
  {
    "id": "module-2",
    "title": "Electrical Machines",
    "content": "- DC Machines\\n- Transformers",
    "order": 2
  }
]

CRITICAL: Return ONLY the JSON array. Do not include any other text, explanations, or markdown formatting.
`;

  try {
    console.log("🤖 Sending content to Gemini for module extraction...");
    const responseText = await generateContentFromAI(prompt, { model: 'gemini-1.5-flash-latest' });
    console.log(`📥 Received response from Gemini, length: ${responseText.length}`);

    // Clean and parse the response
    const cleanedResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const modules = JSON.parse(cleanedResponse);

    if (!Array.isArray(modules) || modules.length === 0) {
      throw new Error("AI response did not contain a valid array of modules.");
    }

    // Validate that modules have titles
    const validModules = modules.filter(m => m.title && m.title.trim() !== '');
    if (validModules.length === 0) {
      console.log("No valid modules after filtering");
      throw new Error("AI response did not contain any modules with titles.");
    }

    return validModules;

  } catch (error) {
    console.error("⚠️ Error during module extraction:", error);
    console.log("⚠️ Creating a single fallback module due to error.");
    
    // Improved fallback
    return [
      {
        id: "module-1",
        title: context.title || "Main Module",
        content: markdown, // Use the original markdown as content
        order: 1,
      },
    ];
  }
}

/**
 * Chunk raw text into manageable learning segments
 * @param {string} text - Raw text content
 * @param {object} context - Processing context
 * @returns {Promise<Array<object>>} Array of chunk objects
 */
export async function chunkContent(text, context = {}) {
  console.log("✂️ Chunking raw content");

  const maxChunkSize = 2500;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + " ";
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks.map((chunk, i) => ({
    id: `module-${i + 1}`,
    title: `Chunk ${i + 1}`,
    content: chunk,
    order: i + 1,
  }));
}

/**
 * Generate content modules using Gemini AI
 * @param {string} content - Content to process
 * @param {object} context - Processing context
 * @returns {Promise<Array<object>>} Array of module objects
 */
async function generateModulesFromContent(content, context = {}) { // Renamed the function
  if (!genAI) {
    console.warn("GEMINI_API_KEY not set. Skipping AI generation.");
    return null;
  }

  if (!content || content.trim().length < 100) {
    console.warn("Content too short for AI processing");
    return null;
  }

  try {
    const {
      learnerLevel = "intermediate",
      subject = "general",
      title = "Learning Content",
    } = context;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are a syllabus analyzer and intelligent curriculum structurer.
    
    CONTEXT:
    - Target Learner Level: ${learnerLevel}
    - Subject Category: ${subject}
    - Content Title: ${title}
    
    TASK:
    Analyze the following educational syllabus or course content and organize it into well-structured learning modules. Each module should contain logically grouped topics and their subtopics, inferred from the provided text. Treat all bullet points and colon-separated items as important concepts to be preserved.
    
    INSTRUCTIONS:
    1. Identify each major section or "Module" from the content and group its topics accordingly.
    2. Each module must include:
       - A clear, descriptive title
       - An ordered list of "topics", each having a title and an optional list of subtopics
    3. Subtopics must be extracted from colon-separated or comma-separated items where applicable.
    4. Do not omit any part of the original input. Every line must be accounted for.
    5. Preserve ordering and logical flow — modules should build on each other.
    6. Ensure topics are grouped meaningfully — do not merge unrelated ideas.
    7. Generate between 2 and 8 modules depending on input length and complexity.
    
    CONTENT TO ANALYZE:
    ---
    ${content}
    ---
    
    RESPONSE FORMAT:
    Return a valid JSON array of module objects. Do NOT include any Markdown, commentary, or extra text.
    
    [
      {
        "id": "module-1",
        "title": "Clear module title",
        "order": 1,
        "topics": [
          {
            "title": "Main topic name",
            "subtopics": ["subtopic1", "subtopic2"]
          }
        ]
      }
    ]
    `;
    

    console.log("🤖 Sending content to Gemini for module extraction...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log(
      "📥 Received response from Gemini, length:",
      responseText.length
    );

    // Extract JSON from response
    let modules;
    try {
      modules = await parseLargeGeminiResponse(responseText);
    } catch (parseError) {
      console.warn("⚠️ Advanced parsing failed, attempting repair...");
      const repaired = repairJsonString(responseText);
      modules = JSON.parse(repaired);
    }

    if (!Array.isArray(modules) || modules.length === 0) {
      console.warn("Invalid or empty module structure returned by Gemini");
      return null;
    }

    // Validate and clean modules
    const validModules = modules
      .filter(
        (module) =>
          module && module.title && module.content && module.content.length > 50
      )
      .map((module, index) => ({
        id: module.id || `module-${index + 1}`,
        title: module.title,
        content: module.content,
        order: module.order || index + 1,
      }));

    if (validModules.length === 0) {
      console.warn("No valid modules after filtering");
      return null;
    }

    // NEW: For each module, extract concepts and generate detailed content for each concept
    for (const module of validModules) {
      module.detailedSubsections = [];
      const concepts = await extractConceptsFromModule(module.content);
      if (concepts.length === 0) {
        console.warn(`No concepts found for module: ${module.title}`);
        continue;
      }
      for (const concept of concepts) {
        // Generate detailed content for each concept (subsection)
        try {
          const detailed = await import('./gemini.js').then(m => m.generateCompetitiveExamModuleSummary(concept, { ...context, subject, moduleIndex: module.order, totalModules: validModules.length }));
          if (detailed && detailed.detailedSubsections && Array.isArray(detailed.detailedSubsections) && detailed.detailedSubsections.length > 0) {
            // Use the first detailedSubsection (since the function returns an array)
            module.detailedSubsections.push({
              ...detailed.detailedSubsections[0],
              title: concept
            });
          } else {
            // Fallback: create a simple subsection
            module.detailedSubsections.push({
              title: concept,
              summary: `Content for ${concept} will be available soon.`,
              pages: []
            });
          }
        } catch (e) {
          console.warn(`Failed to generate detailed content for concept: ${concept}`, e.message);
          module.detailedSubsections.push({
            title: concept,
            summary: `Content for ${concept} will be available soon.`,
            pages: []
          });
        }
      }
    }

    console.log(`✅ Successfully generated ${validModules.length} modules with detailed subsections`);
    return validModules;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    return null;
  }
}

/**
 * Legacy fallback for non-Gemini chunking
 * @param {string} content - Content to process
 * @param {object} context - Processing context
 * @returns {Array<object>} Array of fallback module objects
 */
export function createSimpleFallbackModules(content, context = {}) {
  console.log("⚠️ Creating simple fallback modules");

  if (!content || content.trim().length === 0) {
    return [];
  }

  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 100);

  if (paragraphs.length > 1) {
    console.log(`📄 Creating ${paragraphs.length} modules from paragraphs`);
    return paragraphs.map((paragraph, i) => ({
      id: `module-${i + 1}`,
      title: `Section ${i + 1}`,
      content: paragraph.trim(),
      order: i + 1,
    }));
  }

  // Single module fallback
  console.log("📄 Creating single module fallback");
  return [
    {
      id: "module-1",
      title: context.title || "Learning Module",
      content: content,
      order: 1,
    },
  ];
}

// Legacy function for backward compatibility
export async function classifyContentIntoModules(
  content,
  context = {},
  hints = {}
) {
  console.log(
    "🔄 Legacy classifyContentIntoModules called, redirecting to generateModulesFromContent"
  );
  return await generateModulesFromContent(content, context); // Use the renamed local function
}

// Helper: Extract concepts from module content using Gemini
async function extractConceptsFromModule(moduleContent) {
  if (!genAI) {
    console.warn("GEMINI_API_KEY not set. Skipping concept extraction.");
    return [];
  }
  const prompt = `Given the following module content, list all the key concepts or topics that should be covered as subsections. Return ONLY a JSON array of strings, where each string is a concept or topic name.\n\nModule Content:\n${moduleContent}\n\nOutput format:\n[\"Concept 1\", \"Concept 2\", \"Concept 3\"]`;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  try {
    const concepts = await parseLargeGeminiResponse(responseText);
    if (Array.isArray(concepts)) return concepts;
    // Fallback: try to extract array from text
    const match = responseText.match(/\[(.*?)\]/s);
    if (match) {
      return JSON.parse(`[${match[1]}]`);
    }
    return [];
  } catch (e) {
    console.warn("Concept extraction failed:", e.message);
    return [];
  }
}

// Import the sanitizeLaTeX function
import { sanitizeLaTeX } from "./utils";

/**
 * Sanitizes all content fields in a module or course object for display
 * This ensures all LaTeX is properly formatted before being sent to the client
 *
 * @param {Object} data - The module or course data object
 * @returns {Object} - The sanitized data object
 */
export function sanitizeContentForDisplay(data) {
  if (!data) return data;

  // Create a deep copy to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(data));

  // Helper function to sanitize string fields
  const sanitizeField = (obj, field) => {
    if (obj[field]) {
      if (typeof obj[field] === "string") {
        obj[field] = sanitizeLaTeX(obj[field]);
      } else if (Array.isArray(obj[field])) {
        obj[field] = obj[field].map((item) =>
          typeof item === "string" ? sanitizeLaTeX(item) : item
        );
      }
    }
  };

  // Process course-level fields
  const courseFields = ["title", "description", "summary"];
  courseFields.forEach((field) => sanitizeField(sanitized, field));

  // Process modules
  if (sanitized.modules && Array.isArray(sanitized.modules)) {
    sanitized.modules.forEach((module) => {
      // Module fields
      const moduleFields = ["title", "content", "summary"];
      moduleFields.forEach((field) => sanitizeField(module, field));

      // Arrays like objectives, examples
      const arrayFields = ["objectives", "examples", "keyPoints"];
      arrayFields.forEach((field) => sanitizeField(module, field));

      // Process detailed subsections
      if (
        module.detailedSubsections &&
        Array.isArray(module.detailedSubsections)
      ) {
        module.detailedSubsections.forEach((subsection) => {
          // Subsection fields
          const subsectionFields = [
            "title",
            "summary",
            "content",
            "explanation",
          ];
          subsectionFields.forEach((field) => sanitizeField(subsection, field));

          // Arrays
          const subsectionArrayFields = [
            "keyPoints",
            "practicalExamples",
            "commonPitfalls",
          ];
          subsectionArrayFields.forEach((field) =>
            sanitizeField(subsection, field)
          );

          // Process pages
          if (subsection.pages && Array.isArray(subsection.pages)) {
            subsection.pages.forEach((page) => {
              // Page fields
              const pageFields = ["pageTitle", "content", "keyTakeaway"];
              pageFields.forEach((field) => sanitizeField(page, field));

              // Process mathematical content
              if (
                page.mathematicalContent &&
                Array.isArray(page.mathematicalContent)
              ) {
                page.mathematicalContent.forEach((math) => {
                  const mathFields = [
                    "title",
                    "content",
                    "explanation",
                    "example",
                  ];
                  mathFields.forEach((field) => sanitizeField(math, field));
                });
              }

              // Process code examples
              if (page.codeExamples && Array.isArray(page.codeExamples)) {
                page.codeExamples.forEach((code) => {
                  const codeFields = ["title", "code", "explanation"];
                  codeFields.forEach((field) => sanitizeField(code, field));
                });
              }
            });
          }
        });
      }
    });
  }

  return sanitized;
}
