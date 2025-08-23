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

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }
    
    // For academic courses, set default values if missing
    const courseSubject = subject || "General";
    const courseAcademicLevel = academicLevel || "Undergraduate";

    console.log(`📚 Saving academic course: ${title} (${courseSubject} - ${courseAcademicLevel})`);

    await client.connect();
    const db = client.db("llmfied");
    const coursesCollection = db.collection("courses");

    const isUpdating = !!_id;
    let result;
    let courseId;

    if (isUpdating) {
      // Update existing course
      console.log(`📝 Updating existing academic course with ID: ${_id}`);
      
      // First, let's get the existing course data to preserve fields not being updated
      const existingCourse = await coursesCollection.findOne({ _id: new ObjectId(_id) });
      
      if (!existingCourse) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }

      const updateData = {
        title: title?.trim() || existingCourse.title,
        description: description?.trim() || existingCourse.description || '',
        subject: courseSubject || existingCourse.subject,
        academicLevel: courseAcademicLevel || existingCourse.academicLevel,
        semester: semester?.trim() || existingCourse.semester || '',
        credits: credits || existingCourse.credits || 3,
        dueDate: dueDate !== undefined ? dueDate : existingCourse.dueDate,
        objectives: Array.isArray(objectives) ? objectives.filter(obj => obj?.trim()) : (existingCourse.objectives || []),
        prerequisites: Array.isArray(prerequisites) ? prerequisites.filter(req => req?.trim()) : (existingCourse.prerequisites || []),
        modules: Array.isArray(modules) ? modules : (existingCourse.modules || []),
        assessmentCriteria: assessmentCriteria || existingCourse.assessmentCriteria || {
          assignments: 40,
          quizzes: 20,
          midterm: 20,
          final: 20
        },
        allowDiscussions: allowDiscussions !== undefined ? allowDiscussions !== false : (existingCourse.allowDiscussions !== false),
        allowGroupWork: allowGroupWork !== undefined ? allowGroupWork === true : (existingCourse.allowGroupWork === true),
        gradingScale: gradingScale || existingCourse.gradingScale || "percentage",
        status: status || existingCourse.status || "draft",
        isPublished: status === "published" || (status === undefined && existingCourse.isPublished),
        isAcademicCourse: true,
        courseType: "academic",
        stats: {
          totalModules: (modules?.length || existingCourse.modules?.length || 0),
          totalAssignments: ((modules?.length || existingCourse.modules?.length || 0) * 2),
          totalQuizzes: modules?.length || existingCourse.modules?.length || 0,
          estimatedWeeks: ((modules?.length || existingCourse.modules?.length || 0) * 2)
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
        subject: courseSubject,
        academicLevel: courseAcademicLevel,
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

    // Fetch the complete course data to return to the client
    const savedCourse = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
    
    return NextResponse.json({
      success: true,
      courseId: courseId,
      course: savedCourse,
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