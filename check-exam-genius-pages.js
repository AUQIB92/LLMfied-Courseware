// Script to check if ExamGenius courses have multiple pages in their subsections
const { MongoClient, ObjectId } = require("mongodb");

// MongoDB connection URI - replace with your actual connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/llmfied";

async function main() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("llmfied");

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

      // Analyze each module
      for (const moduleKey of moduleKeys) {
        const module = detailedContent.detailedContent[moduleKey];
        const subsectionKeys = Object.keys(module);

        console.log(
          `\nModule ${moduleKey} has ${subsectionKeys.length} subsections`
        );

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

          // Check the structure of the first page
          if (subsection.pages.length > 0) {
            const firstPage = subsection.pages[0];
            console.log(
              `    First page title: ${firstPage.pageTitle || "No title"}`
            );
            console.log(`    First page has content: ${!!firstPage.content}`);
            console.log(
              `    First page has keyTakeaway: ${!!firstPage.keyTakeaway}`
            );
            console.log(
              `    First page has mathematicalContent: ${!!(
                firstPage.mathematicalContent &&
                firstPage.mathematicalContent.length > 0
              )}`
            );
          }

          // Check if there are multiple pages
          if (subsection.pages.length > 1) {
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
    }

    console.log("\nAnalysis complete");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

main().catch(console.error);
