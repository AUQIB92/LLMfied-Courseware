import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { courseId } = await request.json();
    
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }
    
    console.log(`🔍 Debug publishing course: ${courseId}`);
    
    const { db } = await connectToDatabase();
    
    // Get the course
    let course;
    try {
      course = await db.collection("courses").findOne({ _id: new ObjectId(courseId) });
    } catch (error) {
      return NextResponse.json({ error: `Invalid course ID: ${error.message}` }, { status: 400 });
    }
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    
    console.log("📊 Current course state:", {
      id: course._id,
      title: course.title,
      status: course.status,
      isPublished: course.isPublished,
      isExamGenius: course.isExamGenius,
      isCompetitiveExam: course.isCompetitiveExam
    });
    
    // Update the course to be published
    const result = await db.collection("courses").findOneAndUpdate(
      { _id: new ObjectId(courseId) },
      { 
        $set: { 
          status: "published",
          isPublished: true,
          updatedAt: new Date()
        } 
      },
      { returnDocument: "after" }
    );
    
    if (!result) {
      return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
    
    console.log("✅ Course published successfully:", {
      id: result._id,
      title: result.title,
      status: result.status,
      isPublished: result.isPublished
    });
    
    return NextResponse.json({
      success: true,
      course: result
    });
  } catch (error) {
    console.error("💥 Error in debug-publish:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 