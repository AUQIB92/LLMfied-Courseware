import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sanitizeContentForDisplay } from "@/lib/fileProcessor";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("llmfied");

    // First, check if this is an Exam Genius course
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(id),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Determine which collection to use based on course type
    const isExamGenius = course.isExamGenius || course.isCompetitiveExam;
    const collection = isExamGenius ? "detailed-content" : "module-content";

    console.log(
      `Fetching detailed content for course ${id} from ${collection} collection`
    );

    // Find the detailed content
    const detailedContent = await db.collection(collection).findOne({
      courseId: id,
    });

    if (!detailedContent) {
      console.log(
        `No detailed content found for course ${id} in ${collection} collection`
      );

      // Instead of returning a 404, return an empty structure
      return NextResponse.json({
        detailedContent: {},
        courseId: id,
        message: "No detailed content found, returning empty structure",
      });
    }

    // Sanitize the content before sending it to the client
    const sanitizedContent = sanitizeContentForDisplay(detailedContent);

    return NextResponse.json(sanitizedContent);
  } catch (error) {
    console.error("Error fetching detailed content:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
