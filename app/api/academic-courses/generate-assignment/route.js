import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const {
      courseId,
      moduleTitle,
      moduleContent,
      detailedContent,
      academicLevel,
      subject,
      topics,
      instructions,
      difficulty
    } = await request.json();

    // Validate required fields
    if (!topics || !moduleTitle) {
      return NextResponse.json(
        { error: "Missing required fields: topics and moduleTitle" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a comprehensive academic assignment with mathematical questions in LaTeX format.

REQUIREMENTS:
- Academic Level: ${academicLevel}
- Subject: ${subject}
- Module: ${moduleTitle}
- Topics: ${topics}
- Difficulty: ${difficulty}
- Instructions: ${instructions || "Standard academic assignment"}

MODULE CONTENT CONTEXT:
${moduleContent || "N/A"}

DETAILED CONTENT:
${JSON.stringify(detailedContent, null, 2)}

Please generate a complete assignment with the following structure:

# Assignment Title: [Module Title] - Mathematical Problem Set

## Instructions
- Time limit: 3 hours
- Show all work and calculations
- Use proper mathematical notation
- Round final answers to 2 decimal places where applicable

## Section A: Basic Problems (20 points each)
Generate 4 basic numerical problems with complete step-by-step solutions

## Section B: Intermediate Problems (25 points each) 
Generate 4 intermediate numerical problems with complete step-by-step solutions

## Section C: Advanced Problems (30 points each)
Generate 4 advanced numerical problems with complete step-by-step solutions

## Answer Key with Complete Solutions
Provide detailed solutions for all problems

FORMAT REQUIREMENTS FOR EACH PROBLEM:
1. Clear problem statement with context
2. Given values and what needs to be found
3. Relevant formulas in LaTeX
4. Complete step-by-step solution
5. Final answer highlighted

LATEX FORMATTING RULES:
- Inline math: \\(expression\\)
- Display math: \\[expression\\]
- Fractions: \\(\\frac{numerator}{denominator}\\)
- Powers: \\(x^n\\), \\(e^{-x}\\)
- Subscripts: \\(x_1, y_2\\)
- Square roots: \\(\\sqrt{expression}\\)
- Integrals: \\(\\int_a^b f(x)dx\\)
- Derivatives: \\(\\frac{dy}{dx}\\), \\(f'(x)\\)
- Summations: \\(\\sum_{i=1}^n x_i\\)
- Limits: \\(\\lim_{x \\to 0} f(x)\\)
- Matrices: \\(\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}\\)
- Trigonometry: \\(\\sin\\theta\\), \\(\\cos\\phi\\), \\(\\tan\\alpha\\)

EXAMPLE PROBLEM FORMAT:
**Problem 1:** A projectile is launched at an angle of \\(45°\\) with initial velocity \\(v_0 = 20 m/s\\). Find the maximum height reached.

**Given:**
- Initial velocity: \\(v_0 = 20 m/s\\)
- Launch angle: \\(\\theta = 45°\\)
- Acceleration due to gravity: \\(g = 9.8 m/s^2\\)

**Solution:**
The maximum height formula is:
\\[h_{max} = \\frac{v_0^2 \\sin^2\\theta}{2g}\\]

Substituting values:
\\[h_{max} = \\frac{(20)^2 \\sin^2(45°)}{2(9.8)}\\]
\\[h_{max} = \\frac{400 \\times (0.707)^2}{19.6}\\]
\\[h_{max} = \\frac{400 \\times 0.5}{19.6} = 10.2 m\\]

**Answer:** The maximum height is \\(10.2 m\\)

Generate similar detailed problems covering the specified topics with proper mathematical rigor and LaTeX formatting.`;

    console.log("🔄 Generating assignment with Gemini...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const assignment = response.text();

    if (!assignment || assignment.trim().length === 0) {
      throw new Error("Generated assignment is empty");
    }

    console.log("✅ Assignment generated successfully");

    return NextResponse.json({
      success: true,
      assignment: assignment,
      metadata: {
        courseId,
        moduleTitle,
        topics,
        difficulty,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Assignment generation error:", error);
    
    return NextResponse.json(
      {
        error: "Failed to generate assignment",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}