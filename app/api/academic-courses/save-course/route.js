import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";

// Enhanced database connection with timeout
async function connectWithTimeout(timeoutMs = 15000) {
  return Promise.race([
    connectToDatabase(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs)
    )
  ]);
}

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

export async function POST(request) {
  let client = null;
  try {
    console.log("💾 Saving academic course...");
    console.log("📅 Timestamp:", new Date().toISOString());

    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not configured");
      return NextResponse.json(
        { error: "Database configuration error" },
        { status: 500 }
      );
    }

    // Verify authentication
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can save academic courses" },
        { status: 403 }
      );
    }

    console.log("🔗 Connecting to database with timeout...");
    const connection = await connectWithTimeout(12000); // 12 second timeout
    client = connection.client;
    const db = connection.db;
    console.log("✅ Database connected successfully");

    const body = await Promise.race([
      request.json(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request body parsing timeout')), 5000)
      )
    ]);
    
    console.log("📖 Request body parsed successfully");
    console.log(`📊 Body size: ${JSON.stringify(body).length} characters`);
    
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
    console.log(`📊 Module count: ${modules?.length || 0}`);
    
    const isUpdating = !!_id;
    console.log(`🔄 Operation: ${isUpdating ? 'UPDATE' : 'CREATE'}`);

    const coursesCollection = db.collection("courses");
    let result;
    let courseId;

    if (isUpdating) {
      // Update existing course
      console.log(`📝 Updating existing academic course with ID: ${_id}`);
      
      // First, let's get the existing course data to preserve fields not being updated
      const existingCourse = await Promise.race([
        coursesCollection.findOne({ _id: new ObjectId(_id) }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database findOne timeout')), 8000)
        )
      ]);
      
      if (!existingCourse) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }
      
      console.log("✅ Existing course found, preparing update...");

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
    
    // Provide specific error guidance based on error type
    let errorMessage = "Failed to save academic course";
    let errorDetails = error.message;
    
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT') || error.message.includes('ETIMEOUT')) {
      errorMessage = "Database connection timeout";
      errorDetails = "The database connection timed out. This could be due to network issues or MongoDB server overload. Please try again.";
      console.error("💡 Connection timeout detected. Suggestions:");
      console.error("   1. Check your internet connection");
      console.error("   2. Verify MongoDB Atlas IP whitelist settings");
      console.error("   3. Check if MongoDB cluster is experiencing issues");
    } else if (error.message.includes('authentication failed')) {
      errorMessage = "Database authentication failed";
      errorDetails = "Invalid database credentials. Please check your MongoDB connection string.";
    } else if (error.message.includes('MONGODB_URI is not set')) {
      errorMessage = "Database not configured";
      errorDetails = "MongoDB connection string is not configured.";
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    // Only close client if it was successfully created
    if (client) {
      try {
        await client.close();
        console.log("🔌 Database connection closed");
      } catch (closeError) {
        console.error("⚠️ Error closing database connection:", closeError.message);
      }
    }
  }
} 