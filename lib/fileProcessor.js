import { PDFExtract } from "pdf-extract";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseLargeGeminiResponse } from './gemini.js';

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
export async function processMarkdown(content, context = {}) {
  console.log("📘 Processing markdown with Gemini module extraction");

  if (!content || content.trim().length === 0) {
    console.warn("⚠️ No content provided");
    return [];
  }

  try {
    const modules = await generateContent(content, context);

    if (!modules || modules.length === 0) {
      console.warn("⚠️ No modules returned by Gemini, using fallback");
      return createSimpleFallbackModules(content, context);
    }

    console.log(
      `✅ Successfully extracted ${modules.length} modules from markdown`
    );
    return modules;
  } catch (err) {
    console.error("❌ Error processing markdown:", err.message);
    return createSimpleFallbackModules(content, context);
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
async function generateContent(content, context = {}) {
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze the following educational content and intelligently divide it into logical learning modules.
      
      CONTEXT:
      - Target Learner Level: ${learnerLevel}
      - Subject Category: ${subject}
      - Content Title: ${title}
      
      INSTRUCTIONS:
      1. Identify distinct topics, concepts, or learning units within the content
      2. Each module should be substantial and meaningful (minimum 200 characters)
      3. Include ALL content from the original - do not omit any text
      4. Create clear, descriptive titles for each module
      5. Ensure logical flow from one module to the next
      6. Create between 2-8 modules based on content complexity
      
      Content to analyze:
      ---
      ${content}
      ---

      RESPONSE FORMAT:
      Return a valid JSON array of module objects. No additional text or markdown formatting.
      
      [
        {
          "id": "module-1",
          "title": "Clear, descriptive module title",
          "content": "The complete content for this module from the original text",
          "order": 1
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
    "🔄 Legacy classifyContentIntoModules called, redirecting to generateContent"
  );
  return await generateContent(content, context);
}

// Helper: Extract concepts from module content using Gemini
async function extractConceptsFromModule(moduleContent) {
  if (!genAI) {
    console.warn("GEMINI_API_KEY not set. Skipping concept extraction.");
    return [];
  }
  const prompt = `Given the following module content, list all the key concepts or topics that should be covered as subsections. Return ONLY a JSON array of strings, where each string is a concept or topic name.\n\nModule Content:\n${moduleContent}\n\nOutput format:\n[\"Concept 1\", \"Concept 2\", \"Concept 3\"]`;
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
