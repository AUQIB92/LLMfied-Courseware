import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { generateCompetitiveExamModuleSummary } from "@/lib/gemini";
import { withAuth } from "@/lib/auth";

async function handler(req, { user }) {
  try {
    const db = await getDb();
    const courseData = await req.json();

    // The user object from JWT should be used for authorization
    const { userId, role } = user;

    if (role !== "educator") {
      return NextResponse.json(
        { error: "Forbidden: Only educators can save courses" },
        { status: 403 }
      );
    }

    // Ensure detailedSubsections and their pages are populated before saving
    for (let i = 0; i < courseData.modules.length; i++) {
      const module = courseData.modules[i];

      const needsRegeneration =
        !module.detailedSubsections ||
        !Array.isArray(module.detailedSubsections) ||
        module.detailedSubsections.length === 0 ||
        module.detailedSubsections.some(
          (sub) => !sub || !Array.isArray(sub.pages) || sub.pages.length === 0
        );

      if (needsRegeneration) {
        console.log(
          `[Save Course] Regenerating content for module ${i} before saving: ${module.title}`
        );

        const context = {
          learnerLevel: courseData.level || "Intermediate",
          subject: courseData.subject,
          examType: courseData.examType,
          moduleIndex: i + 1,
          totalModules: courseData.modules.length,
        };

        const generatedContent = await generateCompetitiveExamModuleSummary(
          module.content,
          context
        );

        if (
          generatedContent &&
          generatedContent.detailedSubsections &&
          generatedContent.detailedSubsections.length > 0
        ) {
          // Preserve user-editable fields while updating AI-generated content
          courseData.modules[i] = {
            ...module,
            ...generatedContent,
          };
          console.log(`[Save Course] Module ${i} content was regenerated.`);
        } else {
          console.log(
            `[Save Course] AI generation failed for module ${i}. Saving as is.`
          );
        }
      }
    }

    let result;
    if (courseData.course._id) {
      // Update existing course
      const id = courseData.course._id;
      delete courseData.course._id;
      const courseToSave = {
        ...courseData.course,
        updatedAt: new Date(),
      };
      const result = await db
        .collection("courses")
        .findOneAndUpdate(
          {
            _id: new ObjectId(courseData.course._id),
            ownerId: new ObjectId(userId),
          },
          { $set: courseToSave },
          { returnDocument: "after" }
        );

      if (!result.value) {
        // Check if the course exists but the owner is different
        const courseExists = await db
          .collection("courses")
          .findOne({ _id: new ObjectId(courseData.course._id) });
        if (courseExists) {
          return NextResponse.json(
            { error: "Forbidden: You do not own this course" },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }

      console.log("✅ Course updated successfully:", result.value._id);
      return NextResponse.json({ course: result.value });
    } else {
      // Create new course
      const courseToCreate = {
        ...courseData.course,
        ownerId: new ObjectId(userId), // Set owner from token
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("courses").insertOne(courseToCreate);
      console.log("✅ Course created successfully:", result.insertedId);

      const newCourse = await db
        .collection("courses")
        .findOne({ _id: result.insertedId });
      return NextResponse.json({ course: newCourse });
    }
  } catch (error) {
    console.error("Error in /api/exam-genius/save-course:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
