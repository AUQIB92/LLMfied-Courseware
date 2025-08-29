import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// JWT verification function
async function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null; // Allow unauthenticated access for some endpoints
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const learnerView = searchParams.get('learnerView') === 'true';
    const includeExpired = searchParams.get('includeExpired') === 'true';
    
    // Verify user authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'Authentication required',
          success: false
        },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('llmfied');
    
    let assignments = [];

    if (learnerView) {
      // For learners: Get assignments from courses they're enrolled in
      console.log('📚 Fetching assignments for learner:', user.userId);
      
      // Get enrolled courses
      const enrollments = await db.collection('enrollments').find({
        learnerId: new ObjectId(user.userId),
        status: 'active'
      }).toArray();

      console.log(`📋 Found ${enrollments.length} active enrollments for learner ${user.userId}`);
      
      if (enrollments.length === 0) {
        console.log('⚠️ No enrolled courses found for learner');
        return NextResponse.json({
          success: true,
          assignments: [],
          message: 'No enrolled courses found'
        });
      }

      // Get courses and extract assignments from modules
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      console.log('🔍 Looking for courses with IDs:', enrolledCourseIds.map(id => id.toString()));
      
      const courses = await db.collection('courses').find({
        _id: { $in: enrolledCourseIds },
        status: 'published'
      }).toArray();

      console.log(`📚 Found ${courses.length} published enrolled courses`);
      courses.forEach(course => {
        console.log(`  - Course: ${course.title} (${course._id}) - Modules: ${course.modules?.length || 0}`);
      });

      // Extract assignments from course modules
      for (const course of courses) {
        if (course.modules && Array.isArray(course.modules)) {
          console.log(`🔍 Checking modules in course: ${course.title}`);
          for (const [moduleIndex, module] of course.modules.entries()) {
            console.log(`  Module ${moduleIndex + 1}: ${module.title} - Assignments: ${module.assignments?.length || 0}`);
            if (module.assignments && Array.isArray(module.assignments)) {
              for (const [assignmentIndex, assignment] of module.assignments.entries()) {
                console.log(`    Assignment ${assignmentIndex + 1}: ${assignment.title} - Active: ${assignment.isActive !== false}`);
                if (assignment.isActive !== false) {
                  const assignmentData = {
                    ...assignment,
                    courseId: course._id.toString(),
                    courseTitle: course.title,
                    educatorId: course.educatorId?.toString(),
                    educatorName: course.educatorName || 'Course Instructor',
                    // Ensure consistent date handling
                    dueDate: new Date(assignment.dueDate),
                    publishedDate: new Date(assignment.publishedDate),
                    enrollmentId: enrollments.find(e => e.courseId.toString() === course._id.toString())?._id
                  };
                  assignments.push(assignmentData);
                  console.log(`      ✅ Added assignment: ${assignment.title}`);
                }
              }
            }
          }
        } else {
          console.log(`  ⚠️ Course ${course.title} has no modules or modules is not an array`);
        }
      }
      
      console.log(`📋 Total assignments collected: ${assignments.length}`);
      
    } else if (courseId) {
      // For specific course: Get assignments from that course's modules
      console.log('📋 Fetching assignments for course:', courseId);
      
      const course = await db.collection('courses').findOne({
        _id: new ObjectId(courseId)
      });

      if (!course) {
        return NextResponse.json(
          {
            error: 'Course not found',
            success: false
          },
          { status: 404 }
        );
      }

      // Extract assignments from course modules
      if (course.modules && Array.isArray(course.modules)) {
        for (const module of course.modules) {
          if (module.assignments && Array.isArray(module.assignments)) {
            for (const assignment of module.assignments) {
              if (assignment.isActive !== false) {
                assignments.push({
                  ...assignment,
                  courseId: course._id.toString(),
                  courseTitle: course.title,
                  educatorId: course.educatorId?.toString(),
                  educatorName: course.educatorName || 'Course Instructor',
                  dueDate: new Date(assignment.dueDate),
                  publishedDate: new Date(assignment.publishedDate)
                });
              }
            }
          }
        }
      }
      
    } else {
      // For educators: Get assignments from all their courses
      if (user.role === 'educator') {
        console.log('🎓 Fetching assignments for educator:', user.userId);
        
        const courses = await db.collection('courses').find({
          educatorId: new ObjectId(user.userId)
        }).toArray();

        // Extract assignments from all educator's courses
        for (const course of courses) {
          if (course.modules && Array.isArray(course.modules)) {
            for (const module of course.modules) {
              if (module.assignments && Array.isArray(module.assignments)) {
                for (const assignment of module.assignments) {
                  if (assignment.isActive !== false) {
                    assignments.push({
                      ...assignment,
                      courseId: course._id.toString(),
                      courseTitle: course.title,
                      educatorId: course.educatorId?.toString(),
                      educatorName: course.educatorName || user.name || 'Course Instructor',
                      dueDate: new Date(assignment.dueDate),
                      publishedDate: new Date(assignment.publishedDate)
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // Filter out expired assignments unless explicitly requested
    if (!includeExpired) {
      const now = new Date();
      const gracePeriod = 24 * 60 * 60 * 1000; // 24 hours grace period
      assignments = assignments.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        return (dueDate.getTime() + gracePeriod) > now.getTime();
      });
    }

    // Sort assignments by due date (closest first)
    assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    console.log(`✅ Successfully fetched ${assignments.length} assignments`);

    return NextResponse.json({
      success: true,
      assignments,
      count: assignments.length,
      message: assignments.length > 0 ? 'Assignments fetched successfully' : 'No assignments found'
    });

  } catch (error) {
    console.error('❌ Error fetching published assignments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch assignments',
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}
// Course-integrated assignment system - assignments are stored within course modules
// No separate assignment collection needed


// POST is no longer needed - assignments are saved directly to course modules
// Use PUT /api/academic-courses/[id] to update modules with assignments

// PUT and DELETE are no longer needed for separate assignment entities
// Assignments are managed through the course module structure
// Use PUT /api/academic-courses/[id] to update or modify assignments within modules