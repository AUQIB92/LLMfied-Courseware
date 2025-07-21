import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const courseId = searchParams.get("courseId");
    
    console.log("Debug ExamGenius courses request:", { userId, courseId });
    
    const { db } = await connectToDatabase();
    let filter = {};
    
    // Add filter for ExamGenius courses
    filter.$or = [
      { isExamGenius: true },
      { isCompetitiveExam: true }
    ];
    
    // Add userId filter if provided
    if (userId) {
      try {
        filter.educatorId = new ObjectId(userId);
      } catch (error) {
        console.error("Invalid userId format:", error);
      }
    }
    
    // Add courseId filter if provided
    if (courseId) {
      try {
        filter._id = new ObjectId(courseId);
      } catch (error) {
        console.error("Invalid courseId format:", error);
      }
    }
    
    console.log("Database query filter:", filter);
    
    // Get all courses matching the filter
    const courses = await db.collection("courses").find(filter).toArray();
    
    console.log(`Found ${courses.length} ExamGenius courses`);
    
    // Add detailed debug info for each course
    const coursesWithDebugInfo = courses.map(course => ({
      ...course,
      _debug: {
        id: course._id.toString(),
        hasStatus: !!course.status,
        status: course.status,
        isPublished: !!course.isPublished,
        isExamGenius: !!course.isExamGenius,
        isCompetitiveExam: !!course.isCompetitiveExam,
        educatorIdType: typeof course.educatorId,
        educatorIdString: course.educatorId ? course.educatorId.toString() : null,
        moduleCount: course.modules?.length || 0,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }
    }));
    
    return NextResponse.json({
      count: coursesWithDebugInfo.length,
      courses: coursesWithDebugInfo
    });
  } catch (error) {
    console.error("Error in debug-exam-courses:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 