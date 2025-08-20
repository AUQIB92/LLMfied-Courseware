import { NextResponse } from "next/server";
import { generateAcademicResources } from "@/lib/gemini";

export async function POST(request) {
  try {
    console.log("🎓 Academic Courses: Generating learning resources...");

    const {
      moduleTitle,
      moduleContent,
      academicLevel = "undergraduate",
      subject = "General Studies",
      semester = "1"
    } = await request.json();

    if (!moduleTitle) {
      return NextResponse.json(
        { error: "Module title is required" },
        { status: 400 }
      );
    }

    if (!moduleContent || moduleContent.trim().length < 10) {
      return NextResponse.json(
        { error: "Module content is required and must be substantial" },
        { status: 400 }
      );
    }

    console.log(`🔍 Generating resources for: ${moduleTitle}`);
    console.log(`📚 Academic level: ${academicLevel}, Subject: ${subject}`);

    // Use the enhanced academic resource generation function
    const context = {
      academicLevel: academicLevel,
      subject: subject,
      semester: semester,
      moduleTitle: moduleTitle,
    };

    const resources = await generateAcademicResources(
      moduleContent,
      context
    );

    console.log(`✅ Generated resources successfully:`, {
      hasVideos: !!resources?.videos?.length,
      hasArticles: !!resources?.articles?.length,
      hasBooks: !!resources?.books?.length,
      hasCourses: !!resources?.courses?.length,
      hasTools: !!resources?.tools?.length,
      hasWebsites: !!resources?.websites?.length,
      hasExercises: !!resources?.exercises?.length,
      totalResources: Object.values(resources || {}).reduce((total, arr) => 
        total + (Array.isArray(arr) ? arr.length : 0), 0
      )
    });

    return NextResponse.json({
      success: true,
      resources: resources,
      message: `Generated learning resources for "${moduleTitle}"`,
    });

  } catch (error) {
    console.error("❌ Error generating resources:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate resources", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}