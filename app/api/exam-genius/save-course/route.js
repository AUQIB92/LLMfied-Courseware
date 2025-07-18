import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { generateCompetitiveExamModuleSummary } from '@/lib/gemini';

export async function POST(request) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const courseData = await request.json();
    const db = await getDb();

    // Ensure detailedSubsections and their pages are populated before saving
    for (let i = 0; i < courseData.modules.length; i++) {
      const module = courseData.modules[i];
      
      const needsRegeneration = 
        !module.detailedSubsections || 
        !Array.isArray(module.detailedSubsections) ||
        module.detailedSubsections.length === 0 || 
        module.detailedSubsections.some(sub => !sub || !Array.isArray(sub.pages) || sub.pages.length === 0);

      if (needsRegeneration) {
        console.log(`[Save Course] Regenerating content for module ${i} before saving: ${module.title}`);
        
        const context = {
          learnerLevel: courseData.level || 'Intermediate',
          subject: courseData.subject,
          examType: courseData.examType,
          moduleIndex: i + 1,
          totalModules: courseData.modules.length,
        };
        
        const generatedContent = await generateCompetitiveExamModuleSummary(module.content, context);
        
        if (generatedContent && generatedContent.detailedSubsections && generatedContent.detailedSubsections.length > 0) {
          // Preserve user-editable fields while updating AI-generated content
          courseData.modules[i] = {
            ...module,
            ...generatedContent,
          };
          console.log(`[Save Course] Module ${i} content was regenerated.`);
        } else {
          console.log(`[Save Course] AI generation failed for module ${i}. Saving as is.`);
        }
      }
    }

    let result;
    if (courseData._id) {
      // Update existing course
      const id = courseData._id;
      delete courseData._id;
      result = await db.collection('courses').updateOne(
        { _id: new ObjectId(id) },
        { $set: courseData }
      );
      result.courseId = id;
    } else {
      // Insert new course
      courseData.educatorId = token.sub;
      courseData.createdAt = new Date();
      const insertResult = await db.collection('courses').insertOne(courseData);
      result = { ...insertResult, courseId: insertResult.insertedId };
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in /api/exam-genius/save-course:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 