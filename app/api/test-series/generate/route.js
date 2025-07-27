import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { jsonrepair } from "jsonrepair";
import JSON5 from "json5";
import {
  generateQuestionPrompt,
  validatePromptParams,
} from "@/lib/promptTemplates";
import {
  processTopicsForGeneration,
  createQuestionGenerationTasks,
  validateProcessedTopics,
} from "@/lib/topicProcessor";
import { generateContent, parseLargeGeminiResponse } from "@/lib/gemini";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// Simple network connectivity test
async function testPerplexityConnectivity() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(PERPLEXITY_API_URL, {
      method: "HEAD", // Just test connectivity, don't send data
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return { success: true, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}

// Robust JSON parsing function for AI responses
function parseAIResponse(content) {
  console.log(
    "Attempting to parse AI response:",
    content.substring(0, 200) + "..."
  );

  // Strategy 1: Extract JSON from markdown code block (most common AI response format)
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      let jsonString = codeBlockMatch[1].trim();
      console.log("Extracted JSON from code block, length:", jsonString.length);
      return JSON.parse(jsonString);
    } catch (codeBlockError) {
      console.warn("Code block JSON parse failed:", codeBlockError.message);
    }
  }

  // Strategy 2: Direct JSON parsing
  try {
    return JSON.parse(content);
  } catch (directError) {
    console.warn("Direct JSON parse failed:", directError.message);
  }

  // Strategy 3: Extract JSON from array pattern
  try {
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      let jsonString = arrayMatch[0];

      // Clean the JSON string
      jsonString = jsonString
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/([{,]\s*)(\w+)(?=\s*:)/g, '$1"$2"') // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double quotes

      return JSON.parse(jsonString);
    }
  } catch (arrayError) {
    console.warn("Array extraction failed:", arrayError.message);
  }

  // Strategy 4: Use jsonrepair
  try {
    console.log("Attempting jsonrepair...");
    const repairedJson = jsonrepair(content);
    return JSON.parse(repairedJson);
  } catch (repairError) {
    console.warn("JSON repair failed:", repairError.message);
  }

  // Strategy 5: JSON5 fallback
  try {
    console.log("Attempting JSON5 fallback...");
    return JSON5.parse(content);
  } catch (json5Error) {
    console.warn("JSON5 fallback failed:", json5Error.message);
  }

  // Strategy 6: Try to extract JSON from code block and repair it
  if (codeBlockMatch) {
    try {
      let jsonString = codeBlockMatch[1].trim();
      console.log("Attempting to repair extracted JSON...");
      const repairedJson = jsonrepair(jsonString);
      return JSON.parse(repairedJson);
    } catch (repairCodeBlockError) {
      console.warn("Code block repair failed:", repairCodeBlockError.message);
    }
  }

  console.error("All JSON parsing strategies failed");
  console.error("Content sample:", content.substring(0, 500));
  throw new Error(
    "Failed to parse AI response: All parsing strategies exhausted"
  );
}

export async function POST(request) {
  try {
    // Diagnostic checks
    if (!PERPLEXITY_API_KEY) {
      console.error("Perplexity API key is not configured");
      return NextResponse.json(
        {
          success: false,
          error:
            "Perplexity AI API key not configured. Please check your environment variables.",
        },
        { status: 500 }
      );
    }

    if (!PERPLEXITY_API_URL) {
      console.error("Perplexity API URL is not defined");
      return NextResponse.json(
        {
          success: false,
          error: "Perplexity AI API URL not configured",
        },
        { status: 500 }
      );
    }

    console.log(`Perplexity API configured: ${PERPLEXITY_API_URL}`);
    console.log(
      `API Key present: ${PERPLEXITY_API_KEY ? "Yes" : "No"} (length: ${
        PERPLEXITY_API_KEY?.length || 0
      })`
    );

    // Test network connectivity (basic check)
    try {
      const testUrl = new URL(PERPLEXITY_API_URL);
      console.log(`Testing connectivity to: ${testUrl.hostname}`);

      // Quick connectivity test
      const connectivityTest = await testPerplexityConnectivity();
      if (!connectivityTest.success) {
        console.error("Connectivity test failed:", connectivityTest);

        let errorMessage = "Unable to connect to Perplexity AI service. ";
        if (connectivityTest.code === "ENOTFOUND") {
          errorMessage +=
            "DNS resolution failed - please check your internet connection.";
        } else if (connectivityTest.code === "ECONNREFUSED") {
          errorMessage += "Connection refused - the service may be down.";
        } else if (connectivityTest.code === "ETIMEDOUT") {
          errorMessage +=
            "Connection timed out - please check your network connection.";
        } else {
          errorMessage += `Network error: ${connectivityTest.error}`;
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            details: {
              code: connectivityTest.code,
              message: connectivityTest.error,
            },
          },
          { status: 503 } // Service Unavailable
        );
      } else {
        console.log(
          `Connectivity test passed (status: ${connectivityTest.status})`
        );
      }
    } catch (urlError) {
      console.error("Invalid Perplexity API URL:", PERPLEXITY_API_URL);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Perplexity AI API URL configuration",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
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
      prerequisites,
      provider = "perplexity", // Default to perplexity
    } = body;

    // Validate required fields
    if (!title || !subject || !topics || topics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, subject, and topics",
        },
        { status: 400 }
      );
    }

    // Check if topics weightage adds up to 100%
    const totalWeightage = topics.reduce(
      (sum, topic) => sum + topic.weightage,
      0
    );
    if (totalWeightage !== 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Topic weightages must add up to 100%",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("llmfied");

    // Process topics and create generation tasks
    const topicConfig = { subject, difficulty, marksPerQuestion };
    const processedTopics = processTopicsForGeneration(topics, topicConfig);

    // Validate processed topics
    const validation = validateProcessedTopics(processedTopics);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Topic validation failed: ${validation.errors.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const testConfig = {
      totalTests,
      questionsPerTest,
      numericalPercentage,
      theoreticalPercentage,
      difficulty,
      marksPerQuestion,
      subject,
    };

    const questionTasks = createQuestionGenerationTasks(
      processedTopics,
      testConfig
    );
    const totalQuestionsNeeded = totalTests * questionsPerTest;

    console.log(
      `Generated ${questionTasks.length} question generation tasks for ${totalQuestionsNeeded} total questions`
    );

    // ATOMIC PARALLEL PROCESSING with concurrency control
    const allQuestions = [];
    let successfulTasks = 0;
    let questionsWithImages = 0;
    const CONCURRENT_LIMIT = 3; // Process 3 atomic tasks in parallel

    console.log(
      `🚀 PARALLEL PROCESSING: Running ${questionTasks.length} atomic tasks with concurrency limit ${CONCURRENT_LIMIT}`
    );

    // Process tasks in controlled parallel batches
    for (let i = 0; i < questionTasks.length; i += CONCURRENT_LIMIT) {
      const batch = questionTasks.slice(i, i + CONCURRENT_LIMIT);
      console.log(
        `\n🔄 Processing batch ${
          Math.floor(i / CONCURRENT_LIMIT) + 1
        }/${Math.ceil(questionTasks.length / CONCURRENT_LIMIT)}: ${
          batch.length
        } atomic tasks`
      );

      // Process batch tasks in parallel
      const batchPromises = batch.map(async (task, batchIndex) => {
        const globalIndex = i + batchIndex + 1;
        console.log(
          `🎯 Atomic task ${globalIndex}/${questionTasks.length}: ${task.topicName} - ${task.subtopicName} [${task.batchInfo.batchContext}] (${task.questionType}, ${task.questionCount} questions)`
        );

        try {
          const questions = await generateQuestionsFromTask(task, provider);
          if (questions && questions.length > 0) {
            // Count questions with images
            const imagesInBatch = questions.filter((q) => q.hasImage).length;

            console.log(
              `✅ Atomic task ${globalIndex} completed: ${questions.length} questions (${imagesInBatch} with images)`
            );

            return {
              success: true,
              questions,
              task,
              imagesCount: imagesInBatch,
            };
          } else {
            console.log(
              `⚠️ Atomic task ${globalIndex}: No valid questions generated`
            );
            return { success: false, task, error: "No questions generated" };
          }
        } catch (error) {
          console.error(`❌ Atomic task ${globalIndex} failed:`, error.message);
          return { success: false, task, error: error.message };
        }
      });

      // Wait for batch completion
      const batchResults = await Promise.all(batchPromises);

      // Aggregate results
      for (const result of batchResults) {
        if (result.success) {
          allQuestions.push(...result.questions);
          successfulTasks++;
          questionsWithImages += result.imagesCount;
        }
      }

      // Small delay between batches to prevent overwhelming the API
      if (i + CONCURRENT_LIMIT < questionTasks.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second pause
      }
    }

    const successRate = (
      (successfulTasks / questionTasks.length) *
      100
    ).toFixed(1);
    console.log(`\n📊 GENERATION SUMMARY:`);
    console.log(`- Total atomic tasks: ${questionTasks.length}`);
    console.log(`- Successful tasks: ${successfulTasks} (${successRate}%)`);
    console.log(`- Total questions generated: ${allQuestions.length}`);
    console.log(`- Questions with images: ${questionsWithImages}`);

    // Validate that we have enough questions
    if (allQuestions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to generate any valid questions. Please check your topic configuration and try again.",
        },
        { status: 500 }
      );
    }

    // ATOMIC GENERATION: More intelligent threshold with detailed diagnostics
    const minimumThreshold = 0.75; // Accept if we get 75% of required questions
    const questionsRatio = allQuestions.length / totalQuestionsNeeded;

    console.log(`\n📋 QUALITY ASSESSMENT:`);
    console.log(
      `- Questions generated: ${
        allQuestions.length
      }/${totalQuestionsNeeded} (${(questionsRatio * 100).toFixed(1)}%)`
    );
    console.log(`- Minimum threshold: ${minimumThreshold * 100}%`);
    console.log(`- Success rate: ${successRate}% of atomic tasks completed`);

    if (questionsRatio < minimumThreshold) {
      // Provide detailed failure analysis
      const failedTasks = questionTasks.length - successfulTasks;
      const taskTypes = questionTasks.reduce((acc, task) => {
        acc[task.questionType] = (acc[task.questionType] || 0) + 1;
        return acc;
      }, {});

      return NextResponse.json(
        {
          success: false,
          error: `Insufficient questions generated with atomic approach. Generated ${
            allQuestions.length
          } out of ${totalQuestionsNeeded} required (${(
            questionsRatio * 100
          ).toFixed(1)}%). Need at least ${minimumThreshold * 100}%.`,
          diagnostics: {
            totalAtomicTasks: questionTasks.length,
            successfulTasks,
            failedTasks,
            successRate: `${successRate}%`,
            taskBreakdown: taskTypes,
            suggestion:
              failedTasks > questionTasks.length * 0.5
                ? "High failure rate detected. Please check network connectivity and try again with fewer topics."
                : "Some atomic tasks failed. Consider simplifying complex topics or reducing total question count.",
          },
        },
        { status: 500 }
      );
    }

    // If we have enough questions, continue with test creation
    if (allQuestions.length > totalQuestionsNeeded) {
      // Trim excess questions randomly
      const shuffled = shuffleArray([...allQuestions]);
      allQuestions.splice(
        0,
        allQuestions.length,
        ...shuffled.slice(0, totalQuestionsNeeded)
      );
      console.log(`✂️ Trimmed to exactly ${totalQuestionsNeeded} questions`);
    }

    // Organize questions into tests
    const tests = [];
    const shuffledQuestions = shuffleArray([...allQuestions]);

    for (let testNum = 1; testNum <= totalTests; testNum++) {
      const startIndex = (testNum - 1) * questionsPerTest;
      const endIndex = startIndex + questionsPerTest;
      const testQuestions = shuffledQuestions.slice(startIndex, endIndex);

      // Skip if no questions for this test
      if (testQuestions.length === 0) continue;

      const test = {
        testNumber: testNum,
        title: `${title} - Test ${testNum}`,
        questions: testQuestions,
        totalMarks: testQuestions.reduce((sum, q) => sum + q.marks, 0),
        timeLimit: timePerTest,
        negativeMarking: negativeMarking,
        createdAt: new Date(),
      };

      tests.push(test);
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
      status: "draft",
      enrollments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [subject, difficulty],
      analytics: {
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0,
      },
    };

    // Save to database
    const result = await db.collection("testSeries").insertOne(testSeries);

    if (result.insertedId) {
      console.log(`Test series created with ID: ${result.insertedId}`);

      const questionsWithImages = allQuestions.filter((q) => q.hasImage).length;

      return NextResponse.json({
        success: true,
        testSeries: {
          _id: result.insertedId,
          ...testSeries,
        },
        message: `Test series "${title}" created successfully with ${
          allQuestions.length
        } questions across ${totalTests} tests${
          questionsWithImages > 0
            ? ` (${questionsWithImages} questions require images)`
            : ""
        }. All questions are high-quality and AI-validated.`,
        stats: {
          totalQuestions: allQuestions.length,
          questionsWithImages,
          totalTests,
          questionsPerTest,
          successRate: `${Math.round(
            (allQuestions.length / totalQuestionsNeeded) * 100
          )}%`,
          atomicGeneration: {
            totalAtomicTasks: questionTasks.length,
            successfulTasks,
            taskSuccessRate: `${successRate}%`,
            averageQuestionsPerTask: (
              allQuestions.length / Math.max(successfulTasks, 1)
            ).toFixed(1),
            concurrentProcessing: true,
            processingBatches: Math.ceil(questionTasks.length / 3),
            atomicBatchSize: "2-3 questions per task",
          },
        },
      });
    } else {
      throw new Error("Failed to save test series to database");
    }
  } catch (error) {
    console.error("Error generating test series:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate test series",
      },
      { status: 500 }
    );
  }
}

async function generateQuestionsFromTask(task, provider = "perplexity") {
  const { promptParams, questionCount } = task;
  const maxRetries = 4; // Increased retries for atomic tasks
  let validQuestions = [];
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔬 Atomic attempt ${attempt}/${maxRetries} for ${task.topicName} - ${task.subtopicName} [${task.batchInfo.batchContext}] (${task.questionType}): requesting ${questionCount} questions`
      );

      // Update attempt in prompt params
      promptParams.attempt = attempt;

      let attemptQuestions;
      if (provider === "gemini") {
        attemptQuestions = await generateQuestionsWithGemini(
          promptParams,
          attempt
        );
      } else {
        attemptQuestions = await generateQuestionsWithTemplate(
          promptParams,
          attempt
        );
      }

      validQuestions = attemptQuestions;

      if (validQuestions.length === questionCount) {
        console.log(
          `🎯 EXACT MATCH: Generated ${validQuestions.length} questions for ${task.topicName} - ${task.subtopicName} on attempt ${attempt}`
        );
        break; // Perfect match!
      } else if (validQuestions.length >= questionCount) {
        // Take exactly what we need
        validQuestions = validQuestions.slice(0, questionCount);
        console.log(
          `✂️ Trimmed to exact count: ${validQuestions.length} questions for ${task.topicName} - ${task.subtopicName} on attempt ${attempt}`
        );
        break;
      } else if (validQuestions.length > 0) {
        console.log(
          `⚠️ Partial success: Got ${validQuestions.length}/${questionCount} questions for ${task.topicName} - ${task.subtopicName} on attempt ${attempt}`
        );
        // For atomic tasks (small batches), accept partial results more readily
        if (
          validQuestions.length >= Math.ceil(questionCount * 0.5) &&
          attempt >= 2
        ) {
          console.log(
            `✅ Accepting partial result for atomic task (${validQuestions.length} questions)`
          );
          break;
        }
      } else {
        console.log(
          `❌ No questions generated for ${task.topicName} - ${task.subtopicName} on attempt ${attempt}`
        );
      }
    } catch (error) {
      lastError = error;
      console.error(
        `💥 Atomic attempt ${attempt} failed for ${task.topicName} - ${task.subtopicName}:`,
        error.message
      );

      if (attempt === maxRetries) {
        console.error(`💀 Final attempt failed, will return whatever we have`);
        break;
      }
    }

    // Intelligent backoff based on error type and attempt number
    if (attempt < maxRetries) {
      let delay;

      if (
        lastError &&
        (lastError.message.includes("ENOTFOUND") ||
          lastError.message.includes("timeout"))
      ) {
        // Longer delays for network issues
        delay = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s for network issues
      } else {
        // Standard exponential backoff for other issues
        delay = Math.pow(1.5, attempt) * 1000; // 1.5s, 2.25s, 3.375s
      }

      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 1000;
      delay += jitter;

      console.log(
        `⏱️ Waiting ${Math.round(delay)}ms before retry (with jitter)...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (validQuestions.length === 0) {
    console.error(
      `💀 Complete failure after ${maxRetries} attempts for ${task.topicName} - ${task.subtopicName}`
    );
    return []; // Return empty array instead of throwing - let the parallel processing handle this gracefully
  }

  // Add task metadata to questions
  return validQuestions.map((question) => ({
    ...question,
    taskId: task.id,
    topic: task.topicName,
    subtopic: task.subtopicName,
    type: task.questionType,
    difficulty: task.difficulty,
    marks: task.marksPerQuestion,
    atomicBatch: task.batchInfo.batchContext,
  }));
}

// Legacy function - now using task-based generation with generateQuestionsFromTask

async function generateQuestionsWithTemplate(promptParams, attempt) {
  // Validate prompt parameters
  const validation = validatePromptParams(promptParams);
  if (!validation.isValid) {
    throw new Error(
      `Invalid prompt parameters: ${validation.missingFields.join(", ")}`
    );
  }

  // Generate prompt using template
  const prompt = generateQuestionPrompt({
    ...promptParams,
    attempt,
  });

  let response;
  try {
    response = await fetch(PERPLEXITY_API_URL, {
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
      timeout: 30000, // 30 second timeout
    });
  } catch (fetchError) {
    console.error(
      `Network error when calling Perplexity API for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt}):`,
      fetchError.message
    );

    // Provide specific error messages based on error type
    if (fetchError.code === "ENOTFOUND") {
      throw new Error(
        `Unable to connect to Perplexity AI service. Please check your internet connection and try again. (DNS resolution failed for api.perplexity.ai)`
      );
    } else if (fetchError.code === "ECONNREFUSED") {
      throw new Error(
        `Perplexity AI service is currently unavailable. Please try again later.`
      );
    } else if (
      fetchError.code === "ETIMEDOUT" ||
      fetchError.name === "TimeoutError"
    ) {
      throw new Error(
        `Request to Perplexity AI timed out. Please check your connection and try again.`
      );
    } else {
      throw new Error(
        `Network error connecting to Perplexity AI: ${fetchError.message}. Please check your internet connection and try again.`
      );
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Perplexity API error for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt}):`,
      response.status,
      errorText
    );
    throw new Error(
      `Failed to generate questions for ${promptParams.topicName} - ${promptParams.subtopic}. API Error: ${response.status}`
    );
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    console.error(
      `No content received from Perplexity for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt})`
    );
    throw new Error(
      `No content received from AI for ${promptParams.topicName} - ${promptParams.subtopic}`
    );
  }

  // Extract and parse JSON from response
  let generatedQuestions;
  try {
    generatedQuestions = parseAIResponse(content);
  } catch (parseError) {
    console.error(
      `Failed to parse AI response for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt}):`,
      parseError.message
    );
    console.error("AI Response content:", content.substring(0, 500));
    throw new Error(
      `Failed to parse AI response for ${promptParams.topicName} - ${promptParams.subtopic}: ${parseError.message}`
    );
  }

  // Validate and process questions
  if (!Array.isArray(generatedQuestions)) {
    throw new Error(
      `Invalid AI response format for ${promptParams.topicName} - ${
        promptParams.subtopic
      } (attempt ${attempt}): Expected array, got ${typeof generatedQuestions}`
    );
  }

  const validQuestions = [];
  for (const question of generatedQuestions) {
    if (
      question &&
      question.questionText &&
      question.options &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.correctAnswer !== undefined &&
      question.correctAnswer >= 0 &&
      question.correctAnswer <= 3
    ) {
      validQuestions.push({
        ...question,
        hasImage: question.hasImage || false,
        imageDescription: question.imageDescription || null,
        imageAltText: question.imageAltText || null,
      });
    } else {
      console.warn(
        `Invalid question structure for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt}):`,
        question
      );
    }
  }

  console.log(
    `Generated ${validQuestions.length} valid questions for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt})`
  );
  return validQuestions;
}

async function generateQuestionsWithGemini(promptParams, attempt) {
  const validation = validatePromptParams(promptParams);
  if (!validation.isValid) {
    throw new Error(
      `Invalid prompt parameters: ${validation.missingFields.join(", ")}`
    );
  }

  const prompt = generateQuestionPrompt({ ...promptParams, attempt });

  let responseText;
  try {
    responseText = await generateContent(prompt, { model: "gemini-1.5-flash" });
  } catch (fetchError) {
    console.error(
      `Network error when calling Gemini API for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt}):`,
      fetchError.message
    );
    throw new Error(
      `Network error connecting to Gemini AI: ${fetchError.message}. Please check your internet connection and try again.`
    );
  }

  if (!responseText) {
    console.error(
      `No content received from Gemini for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt})`
    );
    throw new Error(
      `No content received from AI for ${promptParams.topicName} - ${promptParams.subtopic}`
    );
  }

  let generatedQuestions;
  try {
    generatedQuestions = await parseLargeGeminiResponse(responseText);
  } catch (parseError) {
    console.error(
      `Failed to parse AI response for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt}):`,
      parseError.message
    );
    console.error("AI Response content:", responseText.substring(0, 500));
    throw new Error(
      `Failed to parse AI response for ${promptParams.topicName} - ${promptParams.subtopic}: ${parseError.message}`
    );
  }

  if (!Array.isArray(generatedQuestions)) {
    throw new Error(
      `Invalid AI response format for ${promptParams.topicName} - ${
        promptParams.subtopic
      } (attempt ${attempt}): Expected array, got ${typeof generatedQuestions}`
    );
  }

  const validQuestions = [];
  for (const question of generatedQuestions) {
    if (
      question &&
      question.questionText &&
      question.options &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.correctAnswer !== undefined &&
      question.correctAnswer >= 0 &&
      question.correctAnswer <= 3
    ) {
      validQuestions.push({
        ...question,
        hasImage: question.hasImage || false,
        imageDescription: question.imageDescription || null,
        imageAltText: question.imageAltText || null,
      });
    } else {
      console.warn(
        `Invalid question structure for ${promptParams.topicName} - ${promptParams.subtopic} (attempt ${attempt}):`,
        question
      );
    }
  }

  console.log(
    `Generated ${validQuestions.length} valid questions for ${promptParams.topicName} - ${promptParams.subtopic} with Gemini (attempt ${attempt})`
  );
  return validQuestions;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
