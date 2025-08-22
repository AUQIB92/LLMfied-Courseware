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
      difficulty,
      references
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

ACADEMIC REFERENCES AND SOURCES:
${references ? `
The problems should be inspired by and reference the following academic sources:
${references}

IMPORTANT: When generating problems, draw inspiration from the style, difficulty level, and problem types typically found in these references. Mention the relevant source or type of problem in the assignment where appropriate.
` : "Use standard academic mathematics textbooks and established problem-solving approaches for this academic level."}

MODULE CONTENT CONTEXT:
${moduleContent || "N/A"}

DETAILED CONTENT:
${JSON.stringify(detailedContent, null, 2)}

Please generate a complete assignment with the following EXACT structure:

# Assignment Title: ${moduleTitle} - Mathematical Problem Set

## Instructions for Students
- Time limit: 3 hours
- Show all work and calculations step-by-step
- Use proper mathematical notation and LaTeX formatting
- Round final answers to 2 decimal places where applicable
- Each question has ONE solved example followed by THREE similar problems for you to solve
- Study the solved example carefully before attempting the unsolved problems
- For the unsolved problems, only the problem statement is provided - determine what is given and what is required based on the problem context

${references ? `## Academic References Used
This assignment draws problems and concepts from the following sources:
${references.split('\n').filter(line => line.trim()).map(ref => `- ${ref.trim()}`).join('\n')}

**Note:** All problems in this assignment are inspired by concepts and methodologies from the above academic references. Students are encouraged to refer to these sources for additional practice and understanding.

` : ''}

## Assignment Problems

Generate exactly 10 questions, each following this EXACT format:

### Question [Number]: [Topic/Concept Name]
**Source Reference:** [Mention which reference book/source this type of problem comes from]

#### Part A: Solved Example
**Problem:** [State the problem clearly with given values]

**Given:**
- [List all given values with proper units]
- [Any constants or known values]

**Required:** [What needs to be found]

**Solution:**
Step 1: [Explanation of first step]
\\[Mathematical equation or formula\\]

Step 2: [Explanation of second step]  
\\[Calculations with substituted values\\]

Step 3: [Continue with remaining steps]
\\[Final calculations\\]

**Final Answer:** [Highlighted final result with units]

#### Part B: Problems for Students to Solve

**Problem 1:** [Similar problem with different values - UNSOLVED, state the complete problem in one clear sentence]

**Problem 2:** [Similar problem with different values - UNSOLVED, state the complete problem in one clear sentence]

**Problem 3:** [Similar problem with different values - UNSOLVED, state the complete problem in one clear sentence]

---

Repeat this exact format for all 10 questions, ensuring:
1. Each question covers a different mathematical concept/topic
2. Problems progress from basic to advanced difficulty
3. Each solved example demonstrates the complete solution method
4. The 3 unsolved problems are similar in structure but with different numerical values, stated as complete problem sentences without separate Given/Required sections
5. All mathematical expressions use proper LaTeX formatting
6. Reference sources are mentioned for each question type

## CRITICAL REQUIREMENTS:

1. **EXACTLY 10 Questions** - No more, no less
2. **Each Question MUST have:**
   - ONE completely solved example with full step-by-step solution
   - THREE unsolved problems for students (same concept, different values, stated as complete sentences)
   - Clear reference to academic source
3. **Mathematical Rigor:** Use proper formulas, correct calculations, appropriate units
4. **LaTeX Formatting:** All mathematical expressions in proper LaTeX syntax
5. **Progressive Difficulty:** Questions should range from basic to advanced
6. **Reference Integration:** Each question should specify which reference source it's based on

## LATEX FORMATTING RULES:
- Display math: \\[expression\\] (for main equations, formulas)
- Inline math: \\(expression\\) (for variables, small expressions)
- Fractions: \\(\\frac{numerator}{denominator}\\)
- Powers/Exponents: \\(x^n\\), \\(e^{-x}\\), \\(10^{-3}\\)
- Subscripts: \\(x_1\\), \\(v_0\\), \\(F_{net}\\)
- Square roots: \\(\\sqrt{expression}\\), \\(\\sqrt[n]{expression}\\)
- Trigonometry: \\(\\sin\\theta\\), \\(\\cos\\phi\\), \\(\\tan\\alpha\\)
- Greek letters: \\(\\alpha\\), \\(\\beta\\), \\(\\gamma\\), \\(\\delta\\), \\(\\pi\\), \\(\\omega\\)
- Calculus: \\(\\frac{dy}{dx}\\), \\(\\int_a^b f(x)dx\\), \\(\\lim_{x \\to 0} f(x)\\)
- Vectors: \\(\\vec{v}\\), \\(\\hat{i}\\), \\(\\vec{F}\\)
- Units: \\(\\text{m/s}\\), \\(\\text{kg}\\), \\(\\text{N}\\), \\(\\text{°C}\\)

## EXAMPLE FORMAT (Follow this EXACTLY):

### Question 1: Projectile Motion
**Source Reference:** Physics: Principles with Applications by Giancoli, Chapter 3

#### Part A: Solved Example
**Problem:** A projectile is launched at an angle of \\(45°\\) with initial velocity \\(v_0 = 20 \\text{ m/s}\\). Find the maximum height reached.

**Given:**
- Initial velocity: \\(v_0 = 20 \\text{ m/s}\\)  
- Launch angle: \\(\\theta = 45°\\)
- Acceleration due to gravity: \\(g = 9.8 \\text{ m/s}^2\\)

**Required:** Maximum height \\(h_{max}\\)

**Solution:**
Step 1: Apply the kinematic equation for maximum height
\\[h_{max} = \\frac{v_0^2 \\sin^2\\theta}{2g}\\]

Step 2: Substitute the given values
\\[h_{max} = \\frac{(20)^2 \\sin^2(45°)}{2(9.8)}\\]

Step 3: Calculate \\(\\sin(45°) = 0.707\\)
\\[h_{max} = \\frac{400 \\times (0.707)^2}{19.6} = \\frac{400 \\times 0.5}{19.6}\\]

Step 4: Final calculation
\\[h_{max} = \\frac{200}{19.6} = 10.2 \\text{ m}\\]

**Final Answer:** The maximum height is \\(h_{max} = 10.2 \\text{ m}\\)

#### Part B: Problems for Students to Solve

**Problem 1:** A ball is thrown at a \\(30°\\) angle with initial velocity of \\(15 \\text{ m/s}\\). Find the maximum height reached.

**Problem 2:** A projectile launched at \\(60°\\) reaches a maximum height of \\(8 \\text{ m}\\). Determine the initial velocity.

**Problem 3:** Find the launch angle required if the initial velocity is \\(25 \\text{ m/s}\\) and the maximum height reached is \\(12 \\text{ m}\\).

---

Continue this EXACT format for all 10 questions with different mathematical concepts, ensuring each draws from the specified academic references.

**IMPORTANT:** Generate the COMPLETE assignment with all 10 questions. Do not truncate or summarize. Each question must be fully detailed with the solved example and 3 unsolved problems. The final output should be a comprehensive, ready-to-use academic assignment.`;

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