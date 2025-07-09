// Script to check if ExamGenius courses have multiple pages in their subsections
import clientPromise from "./lib/mongodb.js";

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    const client = await clientPromise;
    const db = client.db("llmfied");
    console.log("Connected to MongoDB");

    // Find all ExamGenius courses
    const examGeniusCourses = await db
      .collection("courses")
      .find({ $or: [{ isExamGenius: true }, { isCompetitiveExam: true }] })
      .toArray();

    console.log(`Found ${examGeniusCourses.length} ExamGenius courses`);

    // Check detailed content for each course
    for (const course of examGeniusCourses) {
      console.log(`\n========================================`);
      console.log(`Checking course: ${course.title} (${course._id})`);

      // Find detailed content for this course
      const detailedContent = await db
        .collection("detailed-content")
        .findOne({ courseId: course._id.toString() });

      if (!detailedContent) {
        console.log(`No detailed content found for course ${course.title}`);
        continue;
      }

      console.log(`Found detailed content with ID: ${detailedContent._id}`);

      // Check structure of detailed content
      if (!detailedContent.detailedContent) {
        console.log("No detailedContent field found");
        continue;
      }

      const moduleKeys = Object.keys(detailedContent.detailedContent);
      console.log(
        `Course has ${moduleKeys.length} modules with detailed content`
      );

      // Count subsections with multiple pages
      let totalSubsections = 0;
      let subsectionsWithMultiplePages = 0;

      // Analyze each module
      for (const moduleKey of moduleKeys) {
        const module = detailedContent.detailedContent[moduleKey];
        const subsectionKeys = Object.keys(module);

        console.log(
          `\nModule ${moduleKey} has ${subsectionKeys.length} subsections`
        );
        totalSubsections += subsectionKeys.length;

        // Analyze each subsection
        for (const subsectionKey of subsectionKeys) {
          const subsection = module[subsectionKey];

          if (!subsection.pages || !Array.isArray(subsection.pages)) {
            console.log(`  - Subsection ${subsectionKey}: NO PAGES ARRAY`);
            continue;
          }

          console.log(
            `  - Subsection ${subsectionKey}: ${subsection.pages.length} pages`
          );

          // Check if there are multiple pages
          if (subsection.pages.length > 1) {
            subsectionsWithMultiplePages++;
            console.log(
              `    ✅ MULTIPLE PAGES FOUND: ${subsection.pages.length} pages`
            );
            console.log(
              `    Page titles: ${subsection.pages
                .map((p) => p.pageTitle || "Untitled")
                .join(", ")}`
            );
          }
        }
      }

      console.log(`\nSummary for course "${course.title}":`);
      console.log(`Total subsections: ${totalSubsections}`);
      console.log(
        `Subsections with multiple pages: ${subsectionsWithMultiplePages} (${Math.round(
          (subsectionsWithMultiplePages / totalSubsections) * 100
        )}%)`
      );
    }

    console.log("\nAnalysis complete");
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
