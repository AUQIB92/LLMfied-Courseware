import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const educatorId = searchParams.get("educatorId");
    
    const { db } = await connectToDatabase();
    
    let filter = {};
    
    if (courseId) {
      filter._id = new ObjectId(courseId);
    }
    
    if (educatorId) {
      filter.educatorId = new ObjectId(educatorId);
    }
    
    // Add filter for ExamGenius courses
    filter.$or = [
      { isExamGenius: true },
      { isCompetitiveExam: true }
    ];
    
    const courses = await db.collection("courses").find(filter).toArray();
    
    // Add detailed debug info
    const coursesWithDebugInfo = courses.map(course => ({
      ...course,
      _debug: {
        hasStatus: !!course.status,
        status: course.status,
        isPublished: course.isPublished,
        isExamGenius: course.isExamGenius,
        isCompetitiveExam: course.isCompetitiveExam,
        moduleCount: course.modules?.length || 0,
        educatorIdType: typeof course.educatorId,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }
    }));
    
    return NextResponse.json(coursesWithDebugInfo);
  } catch (error) {
    console.error("Error in debug-courses:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 