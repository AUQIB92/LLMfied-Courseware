// Test script to verify hierarchical detailed subsections generation
import { MongoClient } from "mongodb";
import { generateCompetitiveExamModuleSummary } from './lib/gemini.js';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://auqib:arwaa123@cluster0.gjsxg.mongodb.net/llmfied?retryWrites=true&w=majority&appName=Cluster0";

async function testHierarchicalGeneration() {
  console.log("🧪 Testing hierarchical detailed subsections generation...");
  
  try {
    // Sample module content with hierarchical structure
    const sampleContent = `
# Module: Basic Electrical Concepts

## Overview
This module covers fundamental electrical concepts essential for competitive exams.

### 1.1 Basic concepts
Understanding the fundamental electrical quantities and their relationships.

#### 1.1.1 Resistance
The opposition to current flow in electrical circuits.

#### 1.1.2 Inductance  
The property of electrical circuits that opposes changes in current.

#### 1.1.3 Capacitance
The ability to store electrical charge in an electric field.

#### 1.1.4 Influencing factors
Various factors that affect electrical circuit behavior.

### 1.2 Circuit laws
Fundamental laws governing electrical circuit analysis.

#### 1.2.1 Ohm's law
The relationship between voltage, current, and resistance.

#### 1.2.2 KCL
Kirchhoff's Current Law for circuit analysis.

#### 1.2.3 KVL
Kirchhoff's Voltage Law for circuit analysis.
`;

    const context = {
      learnerLevel: "intermediate",
      subject: "Electrical Engineering",
      examType: "SSC",
      moduleIndex: 1,
      totalModules: 8,
      moduleTitle: "Basic Electrical Concepts"
    };

    console.log("📝 Generating hierarchical detailed subsections...");
    const result = await generateCompetitiveExamModuleSummary(sampleContent, context);
    
    console.log("\n✅ Generation completed!");
    console.log(`📊 Summary: ${result.summary}`);
    console.log(`🎯 Objectives: ${result.objectives.length} items`);
    console.log(`📚 Detailed Subsections: ${result.detailedSubsections.length} items`);
    
    console.log("\n📋 Detailed Subsections Structure:");
    result.detailedSubsections.forEach((subsection, index) => {
      const indent = "  ".repeat((subsection.hierarchyLevel || 3) - 3);
      console.log(`${indent}${index + 1}. ${subsection.title}`);
      console.log(`${indent}   - Level: ${subsection.hierarchyLevel || 'N/A'}`);
      console.log(`${indent}   - Pages: ${subsection.pages?.length || 0}`);
      console.log(`${indent}   - Is Main Section: ${subsection.isMainSection || false}`);
      if (subsection.hierarchyPath) {
        console.log(`${indent}   - Path: ${subsection.hierarchyPath}`);
      }
    });
    
    // Test with database connection
    console.log("\n🔗 Testing with actual database course...");
    await testWithDatabaseCourse();
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function testWithDatabaseCourse() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db("llmfied");
    
    // Find an ExamGenius course
    const course = await db.collection("courses").findOne({ 
      $or: [{ isExamGenius: true }, { isCompetitiveExam: true }] 
    });
    
    if (!course) {
      console.log("⚠️ No ExamGenius course found in database");
      return;
    }
    
    console.log(`📖 Testing with course: ${course.title}`);
    
    if (course.modules && course.modules.length > 0) {
      const firstModule = course.modules[0];
      console.log(`📄 Testing with module: ${firstModule.title}`);
      
      if (firstModule.content) {
        const context = {
          learnerLevel: "intermediate",
          subject: course.subject || "Computer Science",
          examType: course.examType || "Computer Proficiency",
          moduleIndex: 1,
          totalModules: course.modules.length,
          moduleTitle: firstModule.title
        };
        
        console.log("🚀 Generating with real course data...");
        const result = await generateCompetitiveExamModuleSummary(firstModule.content, context);
        
        console.log("\n✅ Real course generation completed!");
        console.log(`📊 Generated ${result.detailedSubsections.length} detailed subsections`);
        
        // Show first few subsections
        console.log("\n📋 First 5 Detailed Subsections:");
        result.detailedSubsections.slice(0, 5).forEach((subsection, index) => {
          console.log(`${index + 1}. ${subsection.title}`);
          console.log(`   - Level: ${subsection.hierarchyLevel || 'N/A'}`);
          console.log(`   - Pages: ${subsection.pages?.length || 0}`);
          console.log(`   - Main Section: ${subsection.isMainSection || false}`);
        });
        
      } else {
        console.log("⚠️ Module has no content to test with");
      }
    } else {
      console.log("⚠️ Course has no modules to test with");
    }
    
  } catch (error) {
    console.error("❌ Database test failed:", error);
  } finally {
    await client.close();
  }
}

// Run the test
testHierarchicalGeneration().catch(console.error);