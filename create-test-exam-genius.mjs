import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/llmfied';

async function createTestExamGeniusCourse() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db("llmfied");
    const coursesCollection = db.collection("courses");
    const detailedContentCollection = db.collection("detailed-content");
    
    // Create a test Exam Genius course with malformed LaTeX
    const testCourse = {
      title: "Test SSC Quantitative Aptitude Course",
      description: "Test course with malformed LaTeX for demonstration",
      examType: "SSC",
      subject: "Quantitative Aptitude",
      learnerLevel: "intermediate",
      isExamGenius: true,
      isCompetitiveExam: true,
      educatorId: "675f56782090c466cfc976ae", // Test educator ID
      modules: [
        {
          id: "test-module-1",
          title: "Fractions and Percentages",
          order: 1,
          summary: "Learn about fractions like rac{1}{2} and percentages. The formula for percentage is rac{part}{whole} × 100.",
          content: "This module covers fractions and percentages with examples like rac{3}{4} = 0.75",
          objectives: [
            "Understand fractions like rac{1}{2}, rac{3}{4}",
            "Calculate percentages using rac{part}{whole} × 100",
            "Solve problems involving rac{numerator}{denominator}"
          ],
          examples: [
            "Example 1: rac{1}{4} = 0.25 = 25%",
            "Example 2: rac{3}{5} = 0.6 = 60%"
          ],
          detailedSubsections: [
            {
              title: "Understanding Fractions",
              summary: "Basic concepts of fractions",
              explanation: "A fraction represents a part of a whole. For example, rac{1}{2} means one half, and rac{3}{4} means three quarters. The general form is rac{numerator}{denominator}.",
              pages: [
                {
                  pageNumber: 1,
                  pageTitle: "Introduction to Fractions",
                  content: "Fractions are mathematical expressions that represent parts of a whole. The basic form is rac{a}{b} where 'a' is the numerator and 'b' is the denominator. Common fractions include rac{1}{2}, rac{1}{3}, rac{1}{4}, etc.",
                  keyTakeaway: "Fractions like rac{1}{2} represent parts of a whole",
                  mathematicalContent: [
                    {
                      type: "formula",
                      title: "Basic Fraction Formula",
                      content: "rac{numerator}{denominator}",
                      explanation: "The numerator is the top number, denominator is the bottom number",
                      example: "rac{3}{4} means 3 parts out of 4 total parts"
                    }
                  ]
                },
                {
                  pageNumber: 2,
                  pageTitle: "Fraction Operations",
                  content: "To add fractions with the same denominator: rac{a}{c} + rac{b}{c} = rac{a+b}{c}. To multiply fractions: rac{a}{b} × rac{c}{d} = rac{a×c}{b×d}.",
                  keyTakeaway: "Fraction operations follow specific rules",
                  mathematicalContent: [
                    {
                      type: "formula",
                      title: "Fraction Addition",
                      content: "rac{a}{c} + rac{b}{c} = rac{a+b}{c}",
                      explanation: "Add numerators when denominators are the same",
                      example: "rac{1}{4} + rac{2}{4} = rac{3}{4}"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the test course
    const courseResult = await coursesCollection.insertOne(testCourse);
    console.log(`✅ Created test Exam Genius course with ID: ${courseResult.insertedId}`);
    
    // Create detailed content with more malformed LaTeX
    const detailedContent = {
      courseId: courseResult.insertedId.toString(),
      modules: [
        {
          id: "test-module-1",
          title: "Fractions and Percentages",
          summary: "Advanced content with fractions like rac{1}{2} and complex formulas",
          detailedSubsections: [
            {
              title: "Advanced Fraction Calculations",
              summary: "Complex fraction operations",
              explanation: "Advanced fraction work involves expressions like rac{x+1}{x-1} and rac{a²+b²}{2ab}",
              pages: [
                {
                  pageNumber: 1,
                  pageTitle: "Complex Fractions",
                  content: "Complex fractions involve multiple levels like rac{rac{1}{2}}{rac{3}{4}} = rac{1}{2} × rac{4}{3} = rac{4}{6} = rac{2}{3}. Another example is rac{x²-1}{x+1} = rac{(x-1)(x+1)}{x+1} = x-1.",
                  keyTakeaway: "Complex fractions can be simplified step by step",
                  mathematicalContent: [
                    {
                      type: "formula",
                      title: "Complex Fraction Simplification",
                      content: "rac{rac{a}{b}}{rac{c}{d}} = rac{a}{b} × rac{d}{c} = rac{ad}{bc}",
                      explanation: "Dividing by a fraction is the same as multiplying by its reciprocal",
                      example: "rac{rac{2}{3}}{rac{4}{5}} = rac{2}{3} × rac{5}{4} = rac{10}{12} = rac{5}{6}"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert detailed content
    const detailedResult = await detailedContentCollection.insertOne(detailedContent);
    console.log(`✅ Created detailed content with ID: ${detailedResult.insertedId}`);
    
    console.log(`\n📊 Test data created with malformed LaTeX patterns:`);
    console.log(`   🔧 "rac{1}{2}" should become "\\frac{1}{2}"`);
    console.log(`   🔧 "rac{part}{whole}" should become "\\frac{part}{whole}"`);
    console.log(`   🔧 "rac{numerator}{denominator}" should become "\\frac{numerator}{denominator}"`);
    
    return courseResult.insertedId;
    
  } catch (error) {
    console.error("❌ Error creating test course:", error);
    throw error;
  } finally {
    await client.close();
  }
}

createTestExamGeniusCourse().catch(console.error); 