import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { generateCompetitiveExamModuleSummary } from '@/lib/gemini';

export async function GET(request, { params }) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const moduleIndex = parseInt(searchParams.get('moduleIndex'), 10);

  if (isNaN(moduleIndex)) {
    return NextResponse.json({ error: 'Missing or invalid moduleIndex' }, { status: 400 });
  }

  try {
    const db = await getDb();
    const course = await db.collection('courses').findOne({ _id: new ObjectId(params.id) });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (moduleIndex < 0 || moduleIndex >= course.modules.length) {
      return NextResponse.json({ error: 'Module index out of bounds' }, { status: 400 });
    }

    const module = course.modules[moduleIndex];
    let detailedSubsections = module.detailedSubsections;

    console.log(`[Module ${moduleIndex}] Initial detailedSubsections from DB:`, JSON.stringify(detailedSubsections, null, 2));

    const needsRegeneration = 
      !Array.isArray(detailedSubsections) || 
      detailedSubsections.length === 0 || 
      detailedSubsections.some(sub => !sub || !Array.isArray(sub.pages) || sub.pages.length === 0);

    console.log(`[Module ${moduleIndex}] Needs regeneration: ${needsRegeneration}`);

    if (needsRegeneration) {
      console.log(`Regenerating content for module ${moduleIndex}: ${module.title}`);
      
      const context = {
        learnerLevel: course.level || 'Intermediate',
        subject: course.subject,
        examType: course.examType,
        moduleIndex: moduleIndex + 1,
        totalModules: course.modules.length,
      };
      
      const generatedContent = await generateCompetitiveExamModuleSummary(module.content, context);
      
      if (generatedContent && Array.isArray(generatedContent.detailedSubsections) && generatedContent.detailedSubsections.length > 0) {
        detailedSubsections = generatedContent.detailedSubsections;
        const updatePath = `modules.${moduleIndex}.detailedSubsections`;
        await db.collection('courses').updateOne(
          { _id: new ObjectId(params.id) },
          { $set: { [updatePath]: detailedSubsections } }
        );
        console.log(`Course module ${moduleIndex} updated with regenerated content.`);
      } else {
        console.log(`[Module ${moduleIndex}] AI generation failed to return valid detailedSubsections.`);
        detailedSubsections = []; 
      }
    }

    return NextResponse.json({ detailedSubsections: detailedSubsections || [] });
  } catch (error) {
    console.error(`Error fetching detailed content for module ${moduleIndex}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 