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
    // Handle both direct course data and nested course object
    const requestData = body.course || body;
    const {
      _id,
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
    } = requestData;

    if (!title?.trim() || !subject || !academicLevel) {
      return NextResponse.json(
        { error: "Title, subject, and academic level are required" },
        { status: 400 }
      );
    }

    console.log(`📚 Saving academic course: ${title} (${subject} - ${academicLevel})`);

    await client.connect();
    const db = client.db("llmfied");
    const coursesCollection = db.collection("courses");

    const isUpdating = !!_id;
    let result;
    let courseId;

    if (isUpdating) {
      // Update existing course
      console.log(`📝 Updating existing academic course with ID: ${_id}`);
      
      const updateData = {
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
        isPublished: status === "published",
        isAcademicCourse: true,
        courseType: "academic",
        stats: {
          totalModules: modules?.length || 0,
          totalAssignments: (modules?.length || 0) * 2,
          totalQuizzes: modules?.length || 0,
          estimatedWeeks: (modules?.length || 0) * 2
        },
        updatedAt: new Date()
      };

      result = await coursesCollection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateData }
      );
      
      courseId = _id;
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: "Academic course not found" },
          { status: 404 }
        );
      }
      
      console.log(`✅ Academic course updated successfully: ${_id}`);
    } else {
      // Create new course
      console.log(`📚 Creating new academic course: ${title}`);
      
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
        isPublished: status === "published",
        isAcademicCourse: true,
        courseType: "academic",
        educatorId: new ObjectId(user.userId),
        stats: {
          totalModules: modules?.length || 0,
          totalAssignments: (modules?.length || 0) * 2,
          totalQuizzes: modules?.length || 0,
          estimatedWeeks: (modules?.length || 0) * 2
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      result = await coursesCollection.insertOne(courseData);
      courseId = result.insertedId;
      
      console.log(`✅ Academic course created successfully with ID: ${courseId}`);
    }

    return NextResponse.json({
      success: true,
      courseId: courseId,
      course: {
        _id: courseId,
        title: title.trim(),
        status: status || "draft"
      },
      message: `Academic course "${title}" ${isUpdating ? 'updated' : 'created'} successfully`
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