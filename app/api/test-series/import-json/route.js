import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const jsonData = await request.json();
    const client = await clientPromise;
    const db = client.db("llmfied");

    // Helper function to normalize question options
    const normalizeQuestionOptions = (question) => {
      if (!question.options) return [];
      if (Array.isArray(question.options)) {
        return question.options;
      }
      if (typeof question.options === 'object' && question.options !== null) {
        const optionKeys = Object.keys(question.options).sort();
        return optionKeys.map(key => question.options[key]);
      }
      return [];
    };

    // Helper function to process image references
    const processImageReference = (question) => {
      if (question.hasImage && question.imagePath) {
        return {
          hasImage: true,
          imageDescription: question.imageDescription || `Image for question ${question.question_id}`,
          imageAltText: question.imageAltText || `Question ${question.question_id} diagram`,
          imagePath: question.imagePath
        };
      }
      return {
        hasImage: false,
        imageDescription: null,
        imageAltText: null,
        imagePath: null
      };
    };

    // Process questions from the imported data
    const processedQuestions = jsonData.questions.map((question, index) => ({
      question_id: question.question_id || index + 1,
      question_text: question.question_text || question.question || question.text,
      options: normalizeQuestionOptions(question),
      correct: question.correct || 0,
      explanation: question.explanation || "",
      difficulty: question.difficulty || "Medium",
      topic: question.topic || "General",
      marks: question.marks || 1,
      ...processImageReference(question)
    }));

    console.log("JSON structure detected:", {
      hasQuestions: !!jsonData.questions,
      questionsLength: jsonData.questions?.length || 0,
      imagesCount: processedQuestions.filter(q => q.hasImage).length
    });

    console.log(`Processed ${processedQuestions.length} questions from JSON`);
    if (processedQuestions.length > 0) {
      console.log("Sample question structure:", {
        question_id: processedQuestions[0].question_id,
        hasImage: processedQuestions[0].hasImage,
        imagePath: processedQuestions[0].imagePath,
        options: processedQuestions[0].options,
        optionsType: typeof processedQuestions[0].options,
        isArray: Array.isArray(processedQuestions[0].options)
      });
    }

    // Create test object
    const test = {
      testNumber: 1,
      title: jsonData.title || "Test 1",
      description: jsonData.description || "Imported test",
      questions: processedQuestions,
      timeLimit: jsonData.timeLimit || 120,
      totalMarks: processedQuestions.length * (jsonData.marksPerQuestion || 1),
      difficultyDistribution: jsonData.difficultyDistribution || {
        easy: Math.floor(processedQuestions.length * 0.4),
        medium: Math.floor(processedQuestions.length * 0.5),
        hard: Math.floor(processedQuestions.length * 0.1)
      }
    };

    // Create test series object
    const testSeries = {
      title: jsonData.title || "Imported Test Series",
      description: jsonData.description || "Test series imported from JSON",
      subject: jsonData.subject || "Electrical Engineering",
      totalTests: 1,
      questionsPerTest: processedQuestions.length,
      totalQuestions: processedQuestions.length,
      timeLimit: jsonData.timeLimit || 120,
      marksPerQuestion: jsonData.marksPerQuestion || 1,
      negativeMarking: jsonData.negativeMarking || 0,
      difficultyDistribution: jsonData.difficultyDistribution || {
        easy: Math.floor(processedQuestions.length * 0.4),
        medium: Math.floor(processedQuestions.length * 0.5),
        hard: Math.floor(processedQuestions.length * 0.1)
      },
      tests: [test],
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into database
    const result = await db.collection("testSeries").insertOne(testSeries);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${processedQuestions.length} questions with ${processedQuestions.filter(q => q.hasImage).length} images`,
      testSeries: {
        ...testSeries,
        _id: result.insertedId
      }
    });

  } catch (error) {
    console.error("Error importing JSON test series:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to import test series from JSON",
      },
      { status: 500 }
    );
  }
}
