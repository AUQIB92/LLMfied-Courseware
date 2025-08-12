import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db("llmfied");

    // Helper function to normalize question options
    const normalizeQuestionOptions = (question) => {
      if (!question.options) return [];
      
      // If options is already an array, return as is
      if (Array.isArray(question.options)) {
        return question.options;
      }
      
      // If options is an object with A, B, C, D keys, convert to array
      if (typeof question.options === 'object' && question.options !== null) {
        const optionKeys = Object.keys(question.options).sort(); // Sort to ensure A, B, C, D order
        return optionKeys.map(key => question.options[key]);
      }
      
      return [];
    };

    // Get all test series
    const testSeries = await db.collection("testSeries").find({}).toArray();
    
    let fixedCount = 0;
    let totalQuestions = 0;

    for (const series of testSeries) {
      let needsUpdate = false;
      
      if (series.tests && Array.isArray(series.tests)) {
        for (const test of series.tests) {
          if (test.questions && Array.isArray(test.questions)) {
            for (const question of test.questions) {
              totalQuestions++;
              
              // Check if options need normalization
              if (question.options && typeof question.options === 'object' && !Array.isArray(question.options)) {
                question.options = normalizeQuestionOptions(question);
                needsUpdate = true;
                fixedCount++;
              }
            }
          }
        }
      }
      
      // Update the test series if any questions were fixed
      if (needsUpdate) {
        await db.collection("testSeries").updateOne(
          { _id: series._id },
          { $set: { tests: series.tests } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} questions out of ${totalQuestions} total questions`,
      stats: {
        totalTestSeries: testSeries.length,
        totalQuestions,
        fixedQuestions: fixedCount,
        questionsNeedingFix: fixedCount
      }
    });

  } catch (error) {
    console.error("Error fixing test series options:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fix test series options",
      },
      { status: 500 }
    );
  }
}
