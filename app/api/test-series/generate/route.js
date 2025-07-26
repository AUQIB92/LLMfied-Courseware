import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { jsonrepair } from "jsonrepair"
import JSON5 from "json5"

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

// Robust JSON parsing function for AI responses
function parseAIResponse(content) {
  console.log("Attempting to parse AI response:", content.substring(0, 200) + "...")
  
  // Strategy 1: Extract JSON from markdown code block (most common AI response format)
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    try {
      let jsonString = codeBlockMatch[1].trim()
      console.log("Extracted JSON from code block, length:", jsonString.length)
      return JSON.parse(jsonString)
    } catch (codeBlockError) {
      console.warn("Code block JSON parse failed:", codeBlockError.message)
    }
  }
  
  // Strategy 2: Direct JSON parsing
  try {
    return JSON.parse(content)
  } catch (directError) {
    console.warn("Direct JSON parse failed:", directError.message)
  }
  
  // Strategy 3: Extract JSON from array pattern
  try {
    const arrayMatch = content.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      let jsonString = arrayMatch[0]
      
      // Clean the JSON string
      jsonString = jsonString
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+)(?=\s*:)/g, '$1"$2"') // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
      
      return JSON.parse(jsonString)
    }
  } catch (arrayError) {
    console.warn("Array extraction failed:", arrayError.message)
  }
  
  // Strategy 4: Use jsonrepair
  try {
    console.log("Attempting jsonrepair...")
    const repairedJson = jsonrepair(content)
    return JSON.parse(repairedJson)
  } catch (repairError) {
    console.warn("JSON repair failed:", repairError.message)
  }
  
  // Strategy 5: JSON5 fallback
  try {
    console.log("Attempting JSON5 fallback...")
    return JSON5.parse(content)
  } catch (json5Error) {
    console.warn("JSON5 fallback failed:", json5Error.message)
  }
  
  // Strategy 6: Try to extract JSON from code block and repair it
  if (codeBlockMatch) {
    try {
      let jsonString = codeBlockMatch[1].trim()
      console.log("Attempting to repair extracted JSON...")
      const repairedJson = jsonrepair(jsonString)
      return JSON.parse(repairedJson)
    } catch (repairCodeBlockError) {
      console.warn("Code block repair failed:", repairCodeBlockError.message)
    }
  }
  
  console.error("All JSON parsing strategies failed")
  console.error("Content sample:", content.substring(0, 500))
  throw new Error("Failed to parse AI response: All parsing strategies exhausted")
}

export async function POST(request) {
  try {
    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: "Perplexity AI API key not configured" 
      }, { status: 500 })
    }

    const body = await request.json()
    const {
      title,
      description,
      subject,
      difficulty,
      totalTests,
      questionsPerTest,
      timePerTest,
      marksPerQuestion,
      negativeMarking,
      numericalPercentage,
      theoreticalPercentage,
      topics,
      educatorId,
      educatorName,
      targetAudience,
      prerequisites
    } = body

    // Validate required fields
    if (!title || !subject || !topics || topics.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: title, subject, and topics" 
      }, { status: 400 })
    }

    // Check if topics weightage adds up to 100%
    const totalWeightage = topics.reduce((sum, topic) => sum + topic.weightage, 0)
    if (totalWeightage !== 100) {
      return NextResponse.json({ 
        success: false, 
        error: "Topic weightages must add up to 100%" 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("llmfied")

    // Generate questions for each topic
    const allQuestions = []
    const totalQuestionsNeeded = totalTests * questionsPerTest
    const numericalQuestionsNeeded = Math.round((totalQuestionsNeeded * numericalPercentage) / 100)
    const theoreticalQuestionsNeeded = totalQuestionsNeeded - numericalQuestionsNeeded

    console.log(`Generating ${totalQuestionsNeeded} total questions (${numericalQuestionsNeeded} numerical, ${theoreticalQuestionsNeeded} theoretical)`)

    for (const topic of topics) {
      const topicQuestionsCount = Math.ceil((totalQuestionsNeeded * topic.weightage) / 100)
      const topicNumerical = Math.round((topicQuestionsCount * numericalPercentage) / 100)
      const topicTheoretical = topicQuestionsCount - topicNumerical

      console.log(`Generating ${topicQuestionsCount} questions for ${topic.name} (${topicNumerical} numerical, ${topicTheoretical} theoretical)`)

      // Generate numerical questions for this topic
      if (topicNumerical > 0) {
        const numericalQuestions = await generateQuestionsForTopic(
          topic,
          "numerical",
          topicNumerical,
          { difficulty, marksPerQuestion, subject }
        )
        allQuestions.push(...numericalQuestions)
      }

      // Generate theoretical questions for this topic
      if (topicTheoretical > 0) {
        const theoreticalQuestions = await generateQuestionsForTopic(
          topic,
          "theoretical", 
          topicTheoretical,
          { difficulty, marksPerQuestion, subject }
        )
        allQuestions.push(...theoreticalQuestions)
      }
    }

    console.log(`Generated ${allQuestions.length} total questions`)

    // Organize questions into tests
    const tests = []
    const shuffledQuestions = shuffleArray([...allQuestions])

    for (let testNum = 1; testNum <= totalTests; testNum++) {
      const startIndex = (testNum - 1) * questionsPerTest
      const endIndex = startIndex + questionsPerTest
      const testQuestions = shuffledQuestions.slice(startIndex, endIndex)

      const test = {
        testNumber: testNum,
        title: `${title} - Test ${testNum}`,
        questions: testQuestions,
        totalMarks: testQuestions.reduce((sum, q) => sum + q.marks, 0),
        timeLimit: timePerTest,
        negativeMarking: negativeMarking,
        createdAt: new Date()
      }

      tests.push(test)
    }

    // Create test series document
    const testSeries = {
      title,
      description,
      subject,
      difficulty,
      totalTests,
      questionsPerTest,
      timePerTest,
      marksPerQuestion,
      negativeMarking,
      numericalPercentage,
      theoreticalPercentage,
      topics,
      tests,
      educatorId: new ObjectId(educatorId),
      educatorName,
      targetAudience,
      prerequisites,
      status: "published",
      enrollments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [subject, difficulty],
      analytics: {
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0
      }
    }

    // Save to database
    const result = await db.collection("testSeries").insertOne(testSeries)
    
    if (result.insertedId) {
      console.log(`Test series created with ID: ${result.insertedId}`)
      
      return NextResponse.json({
        success: true,
        testSeries: {
          _id: result.insertedId,
          ...testSeries
        },
        message: `Test series "${title}" created successfully with ${allQuestions.length} questions across ${totalTests} tests`
      })
    } else {
      throw new Error("Failed to save test series to database")
    }

  } catch (error) {
    console.error("Error generating test series:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to generate test series" 
    }, { status: 500 })
  }
}

async function generateQuestionsForTopic(topic, type, count, config) {
  const questions = []
  
  // Distribute questions across subtopics
  const questionsPerSubtopic = Math.ceil(count / topic.subtopics.length)
  
  for (const subtopic of topic.subtopics) {
    const subtopicQuestionCount = Math.min(questionsPerSubtopic, count - questions.length)
    
    if (subtopicQuestionCount <= 0) break

    try {
      const prompt = `You are an expert educator creating ${config.difficulty.toLowerCase()} level multiple-choice questions for academic assessment.

Subject: ${config.subject}
Topic: ${topic.name}
Subtopic: ${subtopic}
Question Type: ${type} 
Difficulty: ${config.difficulty}

Please generate ${subtopicQuestionCount} high-quality multiple-choice questions with the following requirements:

1. Each question should be relevant to the specific subtopic "${subtopic}" within the broader topic "${topic.name}"
2. Questions should reflect current knowledge and real-world applications
3. For ${config.difficulty} difficulty:
   - Easy: Basic concepts, definitions, and direct applications
   - Medium: Analysis, comparison, and problem-solving  
   - Hard: Synthesis, evaluation, and complex scenarios

4. For ${type} questions:
   - Numerical: Focus on calculations, formulas, and quantitative problem-solving
   - Theoretical: Focus on concepts, principles, and qualitative understanding

5. Each question must include:
   - Clear, unambiguous question text
   - 4 distinct options (A, B, C, D)
   - Only one correct answer
   - Options should be plausible but clearly distinguishable

6. Use your search capabilities to ensure questions reflect:
   - Latest developments in the field
   - Industry standards and best practices
   - Real-world applications and case studies
   - Current terminology and concepts

Format your response as a JSON array with this exact structure:
[
  {
    "questionText": "Question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct",
    "marks": ${config.marksPerQuestion}
  }
]

Generate exactly ${subtopicQuestionCount} questions. Ensure variety in question types and avoid repetition.`

      const response = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        console.error(`Perplexity API error for ${topic.name} - ${subtopic}:`, response.status)
        // Create fallback questions
        for (let i = 0; i < subtopicQuestionCount; i++) {
          questions.push(createFallbackQuestion(topic.name, subtopic, type, config.marksPerQuestion))
        }
        continue
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        console.error(`No content received from Perplexity for ${topic.name} - ${subtopic}`)
        // Create fallback questions
        for (let i = 0; i < subtopicQuestionCount; i++) {
          questions.push(createFallbackQuestion(topic.name, subtopic, type, config.marksPerQuestion))
        }
        continue
      }

      // Extract and parse JSON from response
      let generatedQuestions
      try {
        generatedQuestions = parseAIResponse(content)
      } catch (parseError) {
        console.error(`Failed to parse AI response for ${topic.name} - ${subtopic}:`, parseError.message)
        // Create fallback questions
        generatedQuestions = []
        for (let i = 0; i < subtopicQuestionCount; i++) {
          generatedQuestions.push(createFallbackQuestion(topic.name, subtopic, type, config.marksPerQuestion))
        }
      }

      // Validate and process questions
      if (Array.isArray(generatedQuestions)) {
        for (const question of generatedQuestions.slice(0, subtopicQuestionCount)) {
          if (question && question.questionText && question.options && question.correctAnswer !== undefined) {
            questions.push({
              ...question,
              topic: topic.name,
              subtopic: subtopic,
              type: type,
              difficulty: config.difficulty,
              marks: config.marksPerQuestion
            })
          }
        }
      }

      // Fill remaining with fallback if needed
      while (questions.length < Math.min(count, questions.length + subtopicQuestionCount)) {
        questions.push(createFallbackQuestion(topic.name, subtopic, type, config.marksPerQuestion))
      }

    } catch (error) {
      console.error(`Error generating questions for ${topic.name} - ${subtopic}:`, error)
      // Create fallback questions
      for (let i = 0; i < subtopicQuestionCount; i++) {
        questions.push(createFallbackQuestion(topic.name, subtopic, type, config.marksPerQuestion))
      }
    }
  }

  return questions.slice(0, count)
}

function createFallbackQuestion(topicName, subtopic, type, marks) {
  const questionTypes = type === "numerical" 
    ? [`Calculate the value in ${subtopic}`, `Find the result for ${subtopic}`, `Determine the answer for ${subtopic}`]
    : [`What is the main concept of ${subtopic}?`, `Which statement about ${subtopic} is correct?`, `Identify the key principle in ${subtopic}`]
  
  const questionText = questionTypes[Math.floor(Math.random() * questionTypes.length)]
  
  return {
    questionText: `${questionText} (This is a placeholder question for ${topicName} - ${subtopic})`,
    options: [
      "Option A (placeholder)",
      "Option B (placeholder)", 
      "Option C (placeholder)",
      "Option D (placeholder)"
    ],
    correctAnswer: 0,
    explanation: `This is a fallback question created when AI generation failed for ${subtopic}.`,
    marks: marks,
    topic: topicName,
    subtopic: subtopic,
    type: type,
    isFallback: true
  }
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}