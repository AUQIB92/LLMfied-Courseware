import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

const getUserIdFromToken = (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error("Failed to verify token:", error);
    return null;
  }
};

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📝 Processing course save request for user:", userId);
    const { course: courseData } = await request.json();
    const { db } = await connectToDatabase();

    // Ensure status and isPublished are consistent
    if (courseData.status === "published" && !courseData.isPublished) {
      courseData.isPublished = true;
      console.log("🔄 Setting isPublished=true to match status=published");
    } else if (courseData.isPublished && courseData.status !== "published") {
      courseData.status = "published";
      console.log("🔄 Setting status=published to match isPublished=true");
    }

    console.log("📊 Course data:", {
      title: courseData.title,
      status: courseData.status,
      isPublished: courseData.isPublished,
      hasId: !!courseData._id,
      moduleCount: courseData.modules?.length || 0,
      isExamGenius: courseData.isExamGenius,
      isCompetitiveExam: courseData.isCompetitiveExam
    });

    let result;
    let savedCourse;
    
    if (courseData._id) {
      // Update existing course
      const courseId = courseData._id;
      delete courseData._id; // Remove _id from the update data
      
      // Make sure educatorId is an ObjectId
      if (courseData.educatorId && typeof courseData.educatorId === 'string') {
        courseData.educatorId = new ObjectId(courseData.educatorId);
      }
      
      // Add updatedAt timestamp
      courseData.updatedAt = new Date();
      
      console.log(`🔄 Updating existing course: ${courseId}`, {
        status: courseData.status,
        isPublished: courseData.isPublished
      });
      
      // Update the course
      result = await db.collection('courses').findOneAndUpdate(
        { _id: new ObjectId(courseId) },
        { $set: courseData },
        { returnDocument: 'after' } // Return the updated document
      );
      
      savedCourse = result;
      console.log(`✅ Course updated successfully: ${courseId}`, {
        status: savedCourse.status,
        isPublished: savedCourse.isPublished
      });
    } else {
      // Insert new course
      // Make sure educatorId is an ObjectId
      courseData.educatorId = new ObjectId(userId);
      courseData.createdAt = new Date();
      courseData.updatedAt = new Date();
      
      console.log("🆕 Creating new course", {
        status: courseData.status,
        isPublished: courseData.isPublished
      });
      
      // Insert the course
      const insertResult = await db.collection('courses').insertOne(courseData);
      
      // Fetch the complete inserted document
      savedCourse = await db.collection('courses').findOne({ _id: insertResult.insertedId });
      
      console.log(`✅ New course created with ID: ${insertResult.insertedId}`, {
        status: savedCourse.status,
        isPublished: savedCourse.isPublished
      });
    }

    // Return the complete course data
    return NextResponse.json({ 
      success: true, 
      course: savedCourse,
      courseId: savedCourse._id
    });
  } catch (error) {
    console.error('💥 Error in /api/exam-genius/save-course:', error);
    return NextResponse.json({ 
      error: 'Failed to save course', 
      details: error.message 
    }, { status: 500 });
  }
} 