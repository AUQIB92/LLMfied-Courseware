import { PDFExtract } from "pdf-extract";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateModuleSummary } from "./gemini.js";

// Ensure the API key is loaded from environment variables
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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

    console.log(`✅ Successfully extracted ${modules.length} modules from markdown`);
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
    order: i + 1
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
    const { learnerLevel = "intermediate", subject = "general", title = "Learning Content" } = context;
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
        },
        {
          "id": "module-2", 
          "title": "Next module title",
          "content": "The complete content for this module from the original text",
          "order": 2
        }
      ]
    `;

    console.log("🤖 Sending content to Gemini for module extraction...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log("📥 Received response from Gemini, length:", responseText.length);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("No valid JSON array found in Gemini response");
      return null;
    }

    const modules = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(modules) || modules.length === 0) {
      console.warn("Invalid or empty module structure returned by Gemini");
      return null;
    }

    // Validate and clean modules
    const validModules = modules
      .filter(module => 
        module && 
        module.title && 
        module.content && 
        module.content.length > 50
      )
      .map((module, index) => ({
        id: module.id || `module-${index + 1}`,
        title: module.title,
        content: module.content,
        order: module.order || index + 1
      }));

    if (validModules.length === 0) {
      console.warn("No valid modules after filtering");
      return null;
    }

    console.log(`✅ Successfully generated ${validModules.length} modules`);
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

  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);

  if (paragraphs.length > 1) {
    console.log(`📄 Creating ${paragraphs.length} modules from paragraphs`);
    return paragraphs.map((paragraph, i) => ({
      id: `module-${i + 1}`,
      title: `Section ${i + 1}`,
      content: paragraph.trim(),
      order: i + 1
    }));
  }

  // Single module fallback
  console.log("📄 Creating single module fallback");
  return [{
    id: "module-1",
    title: context.title || "Learning Module",
    content: content,
    order: 1
  }];
}

// Legacy function for backward compatibility
export async function classifyContentIntoModules(content, context = {}, hints = {}) {
  console.log("🔄 Legacy classifyContentIntoModules called, redirecting to generateContent");
  return await generateContent(content, context);
}
