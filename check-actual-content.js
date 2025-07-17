// Script to check the actual content structure of modules
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://auqib:arwaa123@cluster0.gjsxg.mongodb.net/llmfied?retryWrites=true&w=majority&appName=Cluster0";

async function main() {
  console.log("Checking actual module content structure...");
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("llmfied");
    const coursesCollection = db.collection("courses");

    // Find the ExamGenius course
    const course = await coursesCollection.findOne({ 
      $or: [{ isExamGenius: true }, { isCompetitiveExam: true }] 
    });

    if (!course) {
      console.log("No ExamGenius course found");
      return;
    }

    console.log(`\nAnalyzing course: ${course.title}`);
    console.log(`Course ID: ${course._id}`);

    // Check each module's content
    for (let i = 0; i < Math.min(3, course.modules.length); i++) {
      const module = course.modules[i];
      console.log(`\n========================================`);
      console.log(`Module ${i + 1}: ${module.title}`);
      console.log(`Content length: ${module.content?.length || 0} characters`);
      
      if (module.content) {
        console.log(`\nActual content preview (first 500 chars):`);
        console.log('---');
        console.log(module.content.substring(0, 500));
        console.log('---');
        
        // Check for markdown headers
        const lines = module.content.split('\n');
        const headers = lines.filter(line => line.trim().startsWith('#'));
        console.log(`\nFound ${headers.length} markdown headers:`);
        headers.forEach((header, index) => {
          console.log(`${index + 1}. ${header.trim()}`);
        });
        
        // Check current detailed subsections
        console.log(`\nCurrent detailed subsections: ${module.detailedSubsections?.length || 0}`);
        if (module.detailedSubsections && module.detailedSubsections.length > 0) {
          module.detailedSubsections.slice(0, 3).forEach((sub, index) => {
            console.log(`  ${index + 1}. ${sub.title} (${sub.pages?.length || 0} pages)`);
          });
          if (module.detailedSubsections.length > 3) {
            console.log(`  ... and ${module.detailedSubsections.length - 3} more`);
          }
        }
      } else {
        console.log("❌ No content found");
      }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

main().catch(console.error);