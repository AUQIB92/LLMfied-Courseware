/**
 * Script to sanitize all LaTeX in the database
 * Run with: node scripts/sanitize-all-latex.js
 */

import { connectToDatabase } from "../lib/mongodb.js";
import { sanitizeLaTeX } from "../lib/utils.js";

async function sanitizeAllLatex() {
  console.log("🧹 Starting database-wide LaTeX sanitization...");

  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Collections to process
    const collections = [
      { name: "courses", count: 0, updated: 0 },
      { name: "detailed-content", count: 0, updated: 0 },
      { name: "module-content", count: 0, updated: 0 },
    ];

    // Process each collection
    for (const collection of collections) {
      console.log(`\n📚 Processing collection: ${collection.name}`);

      // Get all documents
      const docs = await db.collection(collection.name).find({}).toArray();
      collection.count = docs.length;

      console.log(`   Found ${docs.length} documents`);

      // Process each document
      for (const doc of docs) {
        let updated = false;

        // Helper function to sanitize a field
        const sanitizeField = (obj, field) => {
          if (obj[field]) {
            if (typeof obj[field] === "string") {
              const original = obj[field];
              const sanitized = sanitizeLaTeX(original);
              if (original !== sanitized) {
                obj[field] = sanitized;
                return true;
              }
            } else if (Array.isArray(obj[field])) {
              let arrayUpdated = false;
              obj[field] = obj[field].map((item) => {
                if (typeof item === "string") {
                  const original = item;
                  const sanitized = sanitizeLaTeX(original);
                  if (original !== sanitized) {
                    arrayUpdated = true;
                    return sanitized;
                  }
                }
                return item;
              });
              return arrayUpdated;
            }
          }
          return false;
        };

        // Process course-level fields
        const courseFields = ["title", "description", "summary", "content"];
        for (const field of courseFields) {
          if (sanitizeField(doc, field)) updated = true;
        }

        // Process modules
        if (doc.modules && Array.isArray(doc.modules)) {
          for (const module of doc.modules) {
            // Module fields
            const moduleFields = ["title", "content", "summary"];
            for (const field of moduleFields) {
              if (sanitizeField(module, field)) updated = true;
            }

            // Arrays like objectives, examples
            const arrayFields = ["objectives", "examples", "keyPoints"];
            for (const field of arrayFields) {
              if (sanitizeField(module, field)) updated = true;
            }

            // Process detailed subsections
            if (
              module.detailedSubsections &&
              Array.isArray(module.detailedSubsections)
            ) {
              for (const subsection of module.detailedSubsections) {
                // Subsection fields
                const subsectionFields = [
                  "title",
                  "summary",
                  "content",
                  "explanation",
                ];
                for (const field of subsectionFields) {
                  if (sanitizeField(subsection, field)) updated = true;
                }

                // Arrays
                const subsectionArrayFields = [
                  "keyPoints",
                  "practicalExamples",
                  "commonPitfalls",
                ];
                for (const field of subsectionArrayFields) {
                  if (sanitizeField(subsection, field)) updated = true;
                }

                // Process pages
                if (subsection.pages && Array.isArray(subsection.pages)) {
                  for (const page of subsection.pages) {
                    // Page fields
                    const pageFields = ["pageTitle", "content", "keyTakeaway"];
                    for (const field of pageFields) {
                      if (sanitizeField(page, field)) updated = true;
                    }

                    // Process mathematical content
                    if (
                      page.mathematicalContent &&
                      Array.isArray(page.mathematicalContent)
                    ) {
                      for (const math of page.mathematicalContent) {
                        const mathFields = [
                          "title",
                          "content",
                          "explanation",
                          "example",
                        ];
                        for (const field of mathFields) {
                          if (sanitizeField(math, field)) updated = true;
                        }
                      }
                    }

                    // Process code examples
                    if (page.codeExamples && Array.isArray(page.codeExamples)) {
                      for (const code of page.codeExamples) {
                        const codeFields = ["title", "code", "explanation"];
                        for (const field of codeFields) {
                          if (sanitizeField(code, field)) updated = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Update the document if changes were made
        if (updated) {
          await db
            .collection(collection.name)
            .updateOne({ _id: doc._id }, { $set: doc });
          collection.updated++;
          console.log(`   ✅ Updated document: ${doc._id}`);
        }
      }
    }

    // Print summary
    console.log("\n📊 Sanitization Summary:");
    for (const collection of collections) {
      console.log(
        `   ${collection.name}: ${collection.updated}/${collection.count} documents updated`
      );
    }

    console.log("\n✅ LaTeX sanitization complete!");
  } catch (error) {
    console.error("❌ Error sanitizing LaTeX:", error);
  }
}

// Run the sanitization
sanitizeAllLatex();
