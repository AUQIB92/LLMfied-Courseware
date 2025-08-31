/**
 * Test the save-course API directly
 * Run with: node test-save-course-api.mjs
 */

const API_URL = 'http://localhost:3000/api/academic-courses/save-course';

// Sample course data
const testCourseData = {
  title: "Test Course for Timeout Fix",
  description: "This is a test course to verify the timeout fix",
  subject: "Computer Science",
  academicLevel: "Undergraduate",
  semester: "1",
  credits: 3,
  objectives: ["Learn the basics", "Practice exercises"],
  prerequisites: ["Basic math"],
  modules: [
    {
      title: "Module 1: Introduction",
      content: "This is the first module content",
      summary: "Introduction to the subject",
      objectives: ["Understand basics"],
      resources: {
        videos: [
          {
            title: "Introduction Video",
            url: "https://youtube.com/watch?v=example",
            description: "Basic introduction"
          }
        ],
        articles: [
          {
            title: "Getting Started Article",
            url: "https://example.com/article",
            description: "How to get started"
          }
        ]
      }
    }
  ],
  status: "draft"
};

// You'll need to replace this with a valid JWT token
// You can get this from the browser's localStorage or by logging in
const JWT_TOKEN = "your_jwt_token_here"; // Replace with actual token

async function testSaveCourse() {
  console.log("🧪 Testing Save Course API");
  console.log("==========================\n");
  
  if (JWT_TOKEN === "your_jwt_token_here") {
    console.log("❌ Please update JWT_TOKEN with a valid token");
    console.log("You can get this from:");
    console.log("1. Login to the app");
    console.log("2. Open browser DevTools");
    console.log("3. Go to Application/Storage → Local Storage");
    console.log("4. Copy the 'token' value");
    return;
  }
  
  try {
    console.log("📤 Sending save course request...");
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      body: JSON.stringify(testCourseData)
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️  Request completed in ${duration}ms`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Save successful! Course ID: ${result.courseId}`);
      console.log(`📝 Course title: ${result.course?.title}`);
    } else {
      const error = await response.json();
      console.log(`❌ Save failed (${response.status}): ${error.error}`);
      console.log(`📋 Details: ${error.details || 'No additional details'}`);
      
      if (error.details?.includes('timeout') || error.details?.includes('ETIMEOUT')) {
        console.log("\n🚨 TIMEOUT ERROR IN API");
        console.log("This confirms the timeout issue is in the API layer");
      }
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    
    if (error.message.includes('fetch')) {
      console.log("💡 This might be a network issue or the server is not running");
      console.log("Make sure: npm run dev is running on port 3000");
    }
  }
}

console.log("🔧 To run this test:");
console.log("1. Make sure your Next.js app is running (npm run dev)");
console.log("2. Login to get a JWT token");
console.log("3. Update JWT_TOKEN in this script");
console.log("4. Run: node test-save-course-api.mjs\n");

// testSaveCourse().catch(console.error);