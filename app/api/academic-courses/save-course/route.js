import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

export async function POST(request) {
  try {
    console.log("💾 Saving academic course...");

    // Verify authentication
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can save academic courses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      modules,
      subject,
      academicLevel,
      semester,
      credits,
      dueDate,
      objectives,
      prerequisites,
      assessmentCriteria,
      allowDiscussions,
      allowGroupWork,
      gradingScale,
      status,
      isAcademicCourse,
      courseType
    } = body;

    if (!title?.trim() || !subject || !academicLevel) {
      return NextResponse.json(
        { error: "Title, subject, and academic level are required" },
        { status: 400 }
      );
    }

    console.log(`📚 Saving academic course: ${title} (${subject} - ${academicLevel})`);

    await client.connect();
    const db = client.db("courseware");
    const coursesCollection = db.collection("academicCourses");

    // Prepare course data
    const courseData = {
      title: title.trim(),
      description: description?.trim() || '',
      subject,
      academicLevel,
      semester: semester?.trim() || '',
      credits: credits || 3,
      dueDate: dueDate || null,
      objectives: Array.isArray(objectives) ? objectives.filter(obj => obj?.trim()) : [],
      prerequisites: Array.isArray(prerequisites) ? prerequisites.filter(req => req?.trim()) : [],
      modules: Array.isArray(modules) ? modules : [],
      assessmentCriteria: assessmentCriteria || {
        assignments: 40,
        quizzes: 20,
        midterm: 20,
        final: 20
      },
      allowDiscussions: allowDiscussions !== false,
      allowGroupWork: allowGroupWork === true,
      gradingScale: gradingScale || "percentage",
      status: status || "draft",
      isAcademicCourse: true,
      courseType: "academic",
      educator: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      stats: {
        totalModules: modules?.length || 0,
        totalAssignments: (modules?.length || 0) * 2,
        totalQuizzes: modules?.length || 0,
        estimatedWeeks: (modules?.length || 0) * 2
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the course
    const result = await coursesCollection.insertOne(courseData);
    
    console.log(`✅ Academic course saved successfully with ID: ${result.insertedId}`);

    return NextResponse.json({
      success: true,
      courseId: result.insertedId,
      course: {
        ...courseData,
        _id: result.insertedId
      },
      message: `Academic course "${title}" saved successfully`,
      stats: courseData.stats
    });

  } catch (error) {
    console.error("❌ Save academic course error:", error);
    return NextResponse.json(
      { 
        error: "Failed to save academic course",
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 