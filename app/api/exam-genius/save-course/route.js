import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";

const getUserIdFromToken = (request) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

// Function to specifically handle the new enhanced JSON structure
const optimizeCourseDataStructure = (courseData) => {
  // Clone the course data to avoid modifying the original
  const optimized = JSON.parse(JSON.stringify(courseData));

  // Optimize modules and subsections
  if (optimized.modules && Array.isArray(optimized.modules)) {
    optimized.modules = optimized.modules.map((module) => {
      if (
        module.detailedSubsections &&
        Array.isArray(module.detailedSubsections)
      ) {
        module.detailedSubsections = module.detailedSubsections.map(
          (subsection) => {
            const optimizedSubsection = { ...subsection };

            // Handle new simplified flashcard-only structure
            if (subsection.flashCards && Array.isArray(subsection.flashCards)) {
              optimizedSubsection.flashCards = subsection.flashCards
                .slice(0, 10)
                .map((card) => ({
                  question: (card.question || "").substring(0, 200),
                  answer: (card.answer || "").substring(0, 200),
                }));

              // Keep only essential fields for the simplified structure
              optimizedSubsection.title = subsection.title || "";
              optimizedSubsection.summary = (
                subsection.summary || ""
              ).substring(0, 300);
              optimizedSubsection.difficulty =
                subsection.difficulty || "Intermediate";
              optimizedSubsection.estimatedTime =
                subsection.estimatedTime || "5-10 minutes";

              // Remove old complex structures if they exist
              delete optimizedSubsection.conceptGroups;
              delete optimizedSubsection.problemSolvingWorkflows;
              delete optimizedSubsection.conceptBullets;
              delete optimizedSubsection.practicalUseCase;
              delete optimizedSubsection.pages;
              delete optimizedSubsection.keyPoints;

              return optimizedSubsection;
            }

            // Legacy support: If we have the old complex structure, convert to flashcards
            if (
              subsection.conceptGroups &&
              Array.isArray(subsection.conceptGroups)
            ) {
              const flashCards = [];

              // Convert conceptGroups to flashcards
              subsection.conceptGroups.slice(0, 5).forEach((group) => {
                if (group.title && group.description) {
                  flashCards.push({
                    question: `What is ${group.title}?`,
                    answer: group.description.substring(0, 200),
                  });
                }
                if (group.formulas && group.formulas.length > 0) {
                  group.formulas.slice(0, 2).forEach((formula) => {
                    flashCards.push({
                      question: `What is the formula for ${group.title}?`,
                      answer: formula,
                    });
                  });
                }
              });

              // Add existing flashCards if any
              if (
                subsection.flashCards &&
                Array.isArray(subsection.flashCards)
              ) {
                flashCards.push(...subsection.flashCards.slice(0, 5));
              }

              return {
                title: subsection.title || "",
                summary: (subsection.summary || "").substring(0, 300),
                flashCards: flashCards.slice(0, 10),
                difficulty: subsection.difficulty || "Intermediate",
                estimatedTime: subsection.estimatedTime || "5-10 minutes",
              };
            }

            // Keep original structure for any other cases
            return optimizedSubsection;
          }
        );
      }

      return module;
    });
  }

  return optimized;
};

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📝 Processing course save request for user:", userId);

    // Debug: Check what's being sent in the request
    const requestBody = await request.json();
    console.log("🔍 DEBUG: Raw request body:", {
      hasBody: !!requestBody,
      bodyKeys: Object.keys(requestBody || {}),
      hasCourse: requestBody?.course !== undefined,
      courseType: typeof requestBody?.course,
      requestBody: requestBody,
    });

    const { course: courseData } = requestBody || {};
    const { db } = await connectToDatabase();

    // Safety check: Ensure courseData exists
    if (!courseData) {
      console.error("❌ No courseData found in request body:", requestBody);
      return NextResponse.json(
        { error: "Invalid request: course data is required" },
        { status: 400 }
      );
    }

    // Safety check: Ensure status is defined (especially for Academic courses)
    if (!courseData.status) {
      courseData.status = courseData.isPublished ? "published" : "draft";
      console.log(
        `🔧 Setting missing status field to: ${courseData.status} (Academic course compatibility)`
      );
    }

    // Safety check: Ensure isPublished is defined
    if (courseData.isPublished === undefined) {
      courseData.isPublished = courseData.status === "published";
      console.log(
        `🔧 Setting missing isPublished field to: ${courseData.isPublished}`
      );
    }

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
      isCompetitiveExam: courseData.isCompetitiveExam,
    });

    let result;
    let savedCourse;

    if (courseData._id) {
      // Update existing course
      const courseId = courseData._id;
      delete courseData._id; // Remove _id from the update data

      // Make sure educatorId is an ObjectId
      if (courseData.educatorId && typeof courseData.educatorId === "string") {
        courseData.educatorId = new ObjectId(courseData.educatorId);
      }

      // Add updatedAt timestamp
      courseData.updatedAt = new Date();

      console.log(`🔄 Updating existing course: ${courseId}`, {
        status: courseData.status,
        isPublished: courseData.isPublished,
      });

      // Update the course
      result = await db.collection("courses").findOneAndUpdate(
        { _id: new ObjectId(courseId) },
        { $set: courseData },
        { returnDocument: "after" } // Return the updated document
      );

      savedCourse = result;
      console.log(`✅ Course updated successfully: ${courseId}`, {
        status: savedCourse.status,
        isPublished: savedCourse.isPublished,
      });
    } else {
      // Insert new course
      // Make sure educatorId is an ObjectId
      courseData.educatorId = new ObjectId(userId);
      courseData.createdAt = new Date();
      courseData.updatedAt = new Date();

      console.log("🆕 Creating new course", {
        status: courseData.status,
        isPublished: courseData.isPublished,
      });

      // Insert the course
      const insertResult = await db.collection("courses").insertOne(courseData);

      // Fetch the complete inserted document
      savedCourse = await db
        .collection("courses")
        .findOne({ _id: insertResult.insertedId });

      console.log(`✅ New course created with ID: ${insertResult.insertedId}`, {
        status: savedCourse.status,
        isPublished: savedCourse.isPublished,
      });
    }

    // Return the complete course data
    return NextResponse.json({
      success: true,
      course: savedCourse,
      courseId: savedCourse._id,
    });
  } catch (error) {
    console.error("💥 Error in /api/exam-genius/save-course:", error);
    return NextResponse.json(
      {
        error: "Failed to save course",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
