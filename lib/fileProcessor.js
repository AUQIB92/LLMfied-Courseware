import { PDFExtract } from "pdf-extract"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function processPDF(filePath) {
  return new Promise((resolve, reject) => {
    const extract = new PDFExtract()
    extract.extract(filePath, {}, (err, data) => {
      if (err) reject(err)

      const text = data.pages.map((page) => page.content.map((item) => item.str).join(" ")).join("\n\n")

      resolve(text)
    })
  })
}

export async function processMarkdown(content, context = {}) {
  console.log("Processing markdown content with context:", context)
  
  // First try to split by headers intelligently
  const headerSections = content.split(/^#{1,3}\s+/gm).filter(Boolean)
  
  if (headerSections.length > 1) {
    // Has proper headers - use them as modules
    const modules = headerSections.map((section, index) => {
      const lines = section.split("\n")
      const title = lines[0].trim()
      const content = lines.slice(1).join("\n").trim()
      
      return {
        id: `module-${index + 1}`,
        title: title || `Module ${index + 1}`,
        content: content,
        order: index + 1,
      }
    }).filter(module => module.content.length > 50) // Filter out very short sections
    
    console.log(`Found ${modules.length} modules from headers`)
    return modules
  } else {
    // No clear headers - use AI to intelligently classify
    console.log("No clear headers found, using AI classification...")
    return await classifyContentIntoModules(content, context)
  }
}

export async function chunkContent(text, context = {}) {
  console.log("Chunking content intelligently with context:", context)
  
  // First try to use AI to intelligently classify the content
  const intelligentModules = await classifyContentIntoModules(text, context)
  
  if (intelligentModules && intelligentModules.length > 1) {
    console.log(`AI classified content into ${intelligentModules.length} modules`)
    return intelligentModules
  }
  
  // Fallback to sentence-based chunking if AI fails
  console.log("Falling back to sentence-based chunking...")
  const maxChunkSize = 2000
  const sentences = text.split(/[.!?]+/)
  const chunks = []
  let currentChunk = ""

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += sentence + ". "
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks.map((chunk, index) => ({
    id: `module-${index + 1}`,
    title: `Module ${index + 1}`,
    content: chunk,
    order: index + 1,
  }))
}

// Enhanced AI-powered content classification function
export async function classifyContentIntoModules(content, context = {}) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set, skipping AI classification")
      return null
    }

    const { learnerLevel = "intermediate", subject = "general" } = context

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
      Analyze the following educational content and intelligently divide it into logical learning modules.
      
      CONTEXT:
      - Target Learner Level: ${learnerLevel}
      - Subject Category: ${subject}
      
      INSTRUCTIONS:
      Please identify distinct topics, chapters, or learning units and structure them appropriately for ${learnerLevel} level learners.
      Each module should be substantial enough to be a meaningful learning unit (at least 300 characters).
      
      For ${learnerLevel} level learners:
      - ${learnerLevel === 'beginner' ? 'Include more foundational concepts and step-by-step explanations' : ''}
      - ${learnerLevel === 'intermediate' ? 'Balance theory with practical applications' : ''}
      - ${learnerLevel === 'advanced' ? 'Focus on complex concepts and real-world scenarios' : ''}
      - ${learnerLevel === 'expert' ? 'Emphasize advanced techniques and industry best practices' : ''}
      
      Content to analyze:
      ${content}
      
      Return your response as a JSON array with this exact structure:
      [
        {
          "id": "module-1",
          "title": "Clear, descriptive module title",
          "content": "The actual content for this module",
          "order": 1
        }
      ]
      
      Guidelines:
      - Create 3-8 modules maximum
      - Each module should cover a distinct topic or concept
      - Module titles should be descriptive and educational
      - Include all important content, don't skip anything
      - Ensure content flows logically from one module to the next
    `

    console.log("Sending content to Gemini for classification...")
    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()
    
    console.log("Received response from Gemini")
    
    // Clean the response text to extract JSON
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn("No JSON array found in Gemini response")
      return null
    }
    
    const modules = JSON.parse(jsonMatch[0])
    
    // Validate the structure
    if (!Array.isArray(modules) || modules.length === 0) {
      console.warn("Invalid module structure returned by Gemini")
      return null
    }
    
    // Ensure all modules have required fields
    const validModules = modules.filter(module => 
      module.title && 
      module.content && 
      module.content.length > 50
    ).map((module, index) => ({
      id: module.id || `module-${index + 1}`,
      title: module.title,
      content: module.content,
      order: module.order || index + 1
    }))
    
    console.log(`Successfully classified content into ${validModules.length} intelligent modules`)
    return validModules
    
  } catch (error) {
    console.error("Error in AI content classification:", error)
    return null
  }
}
