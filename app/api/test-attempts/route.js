import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

// GET - Fetch test attempts for a test series
export async function GET(request) {
  let client = null;
  try {
    const user = await verifyToken(request)
    const { searchParams } = new URL(request.url)
    const testSeriesId = searchParams.get("testSeriesId")

    if (!testSeriesId) {
      return NextResponse.json(
        { error: "Test series ID is required" },
        { status: 400 }
      )
    }

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Fetch all attempts for this user and test series
    const attempts = await db.collection("testAttempts").find({
      learnerId: new ObjectId(user.userId),
      testSeriesId: new ObjectId(testSeriesId)
    }).toArray()

    return NextResponse.json({ attempts })

  } catch (error) {
    console.error("Error fetching test attempts:", error)
    return NextResponse.json(
      { error: "Failed to fetch test attempts" },
      { status: 500 }
    )
  }
}

// POST - Save or submit test attempt
export async function POST(request) {
  let client = null;
  try {
    const user = await verifyToken(request)
    const body = await request.json()
    
    const {
      testSeriesId,
      testNumber,
      answers,
      flaggedQuestions = [],
      timeRemaining,
      completed,
      autoSubmitted = false
    } = body

    if (!testSeriesId || !testNumber) {
      return NextResponse.json(
        { error: "Test series ID and test number are required" },
        { status: 400 }
      )
    }

    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Get the test series to access questions and scoring info
    const testSeries = await db.collection("testSeries").findOne({
      _id: new ObjectId(testSeriesId)
    })

    if (!testSeries) {
      return NextResponse.json(
        { error: "Test series not found" },
        { status: 404 }
      )
    }

    // Find the specific test
    const test = testSeries.tests.find(t => t.testNumber === testNumber)
    if (!test) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      )
    }

    const attemptData = {
      learnerId: new ObjectId(user.userId),
      testSeriesId: new ObjectId(testSeriesId),
      testNumber,
      answers,
      flaggedQuestions,
      timeRemaining,
      completed,
      autoSubmitted,
      updatedAt: new Date()
    }

    if (completed) {
      // Calculate score
      const scoreData = calculateScore(test.questions, answers, testSeries.marksPerQuestion, testSeries.negativeMarking)
      
      Object.assign(attemptData, {
        ...scoreData,
        completedAt: new Date(),
        timeTaken: (test.timeLimit * 60) - timeRemaining // in seconds
      })
    }

    // For completed attempts, always create a new record to track multiple attempts
    // For in-progress attempts, update existing or create new
    let result

    if (completed) {
      // Always insert a new completed attempt
      const insertResult = await db.collection("testAttempts").insertOne({
        ...attemptData,
        createdAt: new Date()
      })
      result = { value: { _id: insertResult.insertedId, ...attemptData } }
    } else {
      // For in-progress, update existing incomplete attempt or create new
      result = await db.collection("testAttempts").findOneAndUpdate(
        {
          learnerId: new ObjectId(user.userId),
          testSeriesId: new ObjectId(testSeriesId),
          testNumber,
          completed: false // Only update incomplete attempts
        },
        {
          $set: attemptData,
          $setOnInsert: { createdAt: new Date() }
        },
        {
          upsert: true,
          returnDocument: 'after'
        }
      )
    }

    return NextResponse.json({ 
      success: true, 
      attempt: result.value || result 
    })

  } catch (error) {
    console.error("Error saving test attempt:", error)
    return NextResponse.json(
      { error: "Failed to save test attempt" },
      { status: 500 }
    )
  }
}

function calculateScore(questions, answers, marksPerQuestion, negativeMarking) {
  let correctAnswers = 0
  let wrongAnswers = 0
  let skippedAnswers = 0
  let totalMarks = 0

  questions.forEach((question, index) => {
    const userAnswer = answers[index]
    
    if (userAnswer === undefined || userAnswer === null) {
      skippedAnswers++
    } else if (userAnswer === question.correctAnswer) {
      correctAnswers++
      totalMarks += marksPerQuestion
    } else {
      wrongAnswers++
      totalMarks -= negativeMarking
    }
  })

  // Ensure total marks doesn't go below 0
  totalMarks = Math.max(0, totalMarks)

  // Calculate percentage
  const maxPossibleMarks = questions.length * marksPerQuestion
  const score = maxPossibleMarks > 0 ? (totalMarks / maxPossibleMarks) * 100 : 0

  return {
    correctAnswers,
    wrongAnswers,
    skippedAnswers,
    totalMarks,
    maxPossibleMarks,
    score: Math.round(score * 100) / 100 // Round to 2 decimal places
  }
} 