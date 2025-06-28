import { generateModuleSummary } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sampleContent = `
      Module: Introduction to Machine Learning
      
      Machine Learning is a field of study that gives computers the ability to learn without being explicitly programmed.
      It focuses on developing algorithms that can learn from and make predictions on data.
      
      Key topics include supervised learning, unsupervised learning, and reinforcement learning.
      
      Machine Learning is used in various applications like recommendation systems, image recognition, and natural language processing.
    `;
    
    const result = await generateModuleSummary(sampleContent);
    
    // Check if all resources have URLs
    let missingUrls = [];
    Object.keys(result.resources).forEach(resourceType => {
      result.resources[resourceType].forEach(resource => {
        if (!resource.url) {
          missingUrls.push(`${resourceType} resource: ${resource.title || resource.name || 'Unnamed'}`);
        }
      });
    });
    
    return NextResponse.json({
      success: true,
      result,
      urlValidation: {
        allResourcesHaveUrls: missingUrls.length === 0,
        missingUrls: missingUrls
      }
    });
  } catch (error) {
    console.error("Test URL links error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
