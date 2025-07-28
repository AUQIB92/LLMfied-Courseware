import { NextResponse } from "next/server";
import { generateModuleSummary } from "@/lib/gemini";
import jwt from "jsonwebtoken";

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

export async function POST(request) {
  try {
    console.log("🎓 Generating academic curriculum with AI...");

    // Verify authentication
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can generate academic curricula" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      topic,
      subject,
      academicLevel,
      credits,
      semester,
      title,
      description,
      moduleTopics,
      teachingNotes,
      numberOfModules,
      objectives
    } = body;

    if (!topic?.trim() || !subject || !academicLevel) {
      return NextResponse.json(
        { error: "Topic, subject, and academic level are required" },
        { status: 400 }
      );
    }

    console.log(`📚 Generating curriculum for: ${topic} (${subject} - ${academicLevel})`);

    const prompt = `You are an expert academic curriculum developer specializing in ${subject} education. Create a comprehensive academic curriculum for a ${academicLevel} level course.

Course Information:
- Topic: ${topic}
- Subject: ${subject}
- Academic Level: ${academicLevel}
- Credits: ${credits || 3}
- Semester: ${semester || 'Not specified'}
- Title: ${title || topic}
- Description: ${description || 'Not specified'}
- Number of Modules: ${numberOfModules || 8}

${moduleTopics ? `Specific Module Topics to Cover:\n${moduleTopics}` : ''}
${teachingNotes ? `Teaching Notes:\n${teachingNotes}` : ''}
${objectives?.length ? `Learning Objectives:\n${objectives.join('\n')}` : ''}

Create a detailed academic curriculum with the following structure:

# ${title || topic} - Academic Curriculum

## Course Overview
[Comprehensive overview of the course, its importance in the academic field, and learning outcomes]

## Course Objectives
[List of specific, measurable learning objectives using Bloom's taxonomy]

## Prerequisites
[Required prior knowledge or courses]

## Assessment Structure
- Assignments: 40% (2 assignments per module)
- Quizzes: 20% (1 quiz per module) 
- Midterm Exam: 20%
- Final Exam: 20%

## Module Structure

### Module 1: [Module Title]
**Duration:** 1-2 weeks
**Learning Objectives:**
- [Specific objective 1]
- [Specific objective 2]

**Content Overview:**
[Detailed description of what will be covered]

**Assignments:**
1. [Assignment 1 description - Research/Analysis focus]
2. [Assignment 2 description - Application/Problem-solving focus]

**Quiz:** [Quiz description covering key concepts]

**Resources:**
- [Academic books/articles]
- [Additional materials]

---

[Continue this pattern for all ${numberOfModules || 8} modules]

## Recommended Textbooks
[List of essential academic textbooks and resources]

## Grading Scale
- A: 90-100%
- B: 80-89%
- C: 70-79%
- D: 60-69%
- F: Below 60%

## Course Policies
[Academic integrity, attendance, late submission policies]

## Additional Resources
[Supplementary materials, online resources, professional organizations]

Format the curriculum in clear Markdown with proper academic structure. Ensure the content is rigorous, scholarly, and appropriate for ${academicLevel} students in ${subject}. Each module should build upon previous knowledge and prepare students for subsequent modules.

Focus on:
- Academic rigor and depth
- Critical thinking development
- Research and analysis skills
- Practical application of theoretical concepts
- Professional development in the field
- Current trends and developments in ${subject}`;

    const curriculum = await generateModuleSummary(prompt);

    if (!curriculum || curriculum.length < 500) {
      throw new Error("Generated curriculum is too short or empty");
    }

    console.log(`✅ Academic curriculum generated successfully! Length: ${curriculum.length} characters`);

    return NextResponse.json({
      success: true,
      curriculum,
      moduleCount: numberOfModules || 8,
      topic,
      subject,
      academicLevel,
      message: `Successfully generated comprehensive academic curriculum for ${topic}`,
      stats: {
        totalModules: numberOfModules || 8,
        totalAssignments: (numberOfModules || 8) * 2,
        totalQuizzes: numberOfModules || 8,
        estimatedWeeks: (numberOfModules || 8) * 2,
        curriculumLength: curriculum.length
      }
    });

  } catch (error) {
    console.error("❌ Academic curriculum generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate academic curriculum",
        details: error.message
      },
      { status: 500 }
    );
  }
} 