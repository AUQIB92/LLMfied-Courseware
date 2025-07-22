import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (user.role !== 'learner') {
      return NextResponse.json({ error: "Only learners can submit quizzes" }, { status: 403 });
    }

    const { quizId, courseId, answers } = await request.json();

    if (!quizId || !courseId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("llmfied");

    const quiz = await db.collection("quizzes").findOne({ _id: new ObjectId(quizId) });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correct) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / quiz.questions.length) * 100;

    await db.collection("enrollments").updateOne(
      { 
        learnerId: new ObjectId(user.userId),
        courseId: new ObjectId(courseId)
      },
      { 
        $push: { 
          quizAttempts: { 
            quizId: new ObjectId(quizId), 
            score, 
            answeredAt: new Date() 
      }
        },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ success: true, score });
  } catch (error) {
    console.error("Error in POST /api/quiz:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
