import { NextResponse } from "next/server"
import { generateContent } from "@/lib/gemini"
import clientPromise from "@/lib/mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) throw new Error("No token provided")

  return jwt.verify(token, process.env.JWT_SECRET)
}

export async function POST(request) {
  try {
    // Get user session
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("llmfied")

    const { 
      title, 
      examType, 
      subject, 
      learnerLevel, 
      numberOfModules, 
      moduleTopics, 
      teachingNotes, 
      estimatedTime,
      description 
    } = await request.json()

    if (!title || !examType || !subject || !learnerLevel) {
      return NextResponse.json({ error: "Title, exam type, subject, and learner level are required" }, { status: 400 })
    }

    console.log(`📚 Generating competitive exam curriculum for: ${examType} - ${subject}`)

    // Enhanced competitive exam curriculum generation prompt
    const curriculumPrompt = `
Create a comprehensive, exam-focused curriculum for competitive exam preparation.

EXAM DETAILS:
- Exam Type: ${examType}
- Subject: ${subject}
- Target Level: ${learnerLevel}
- Course Title: ${title}
- Number of Modules: ${numberOfModules || 8}
- Estimated Study Time: ${estimatedTime || "40-50 hours"}

SPECIFIC REQUIREMENTS FOR ${examType} ${subject}:

${examType === 'SSC' && subject === 'Quantitative Aptitude' ? `
- Number Systems, HCF/LCM, Percentages, Profit & Loss
- Simple & Compound Interest, Time & Work, Time & Distance
- Ratio & Proportion, Averages, Mixtures & Allegations
- Geometry, Mensuration, Trigonometry
- Data Interpretation, Statistics, Probability
- Algebra, Quadratic Equations, Logarithms
` : ''}

${examType === 'CAT' && subject === 'Quantitative Ability' ? `
- Number Systems, Arithmetic (Percentages, Ratios, Averages)
- Algebra (Linear & Quadratic Equations, Functions)
- Geometry (Coordinate, Mensuration, Trigonometry)
- Modern Math (Permutation-Combination, Probability, Set Theory)
- Data Interpretation (Tables, Charts, Graphs, Caselets)
` : ''}

${examType === 'Bank PO' && subject === 'Quantitative Aptitude' ? `
- Number Series, Wrong Number Series, Missing Number Series
- Simplification, Approximation, Quadratic Equations
- Data Interpretation (Bar Charts, Line Graphs, Pie Charts, Tables)
- Arithmetic (Percentage, Profit Loss, SI CI, Time Work, Boats Streams)
- Mensuration, Probability, Permutation Combination
` : ''}

${examType === 'UPSC' && subject === 'Quantitative Aptitude' ? `
- Basic Numeracy, Number Relations, Fundamental Arithmetical Operations
- Percentages, Ratio & Proportion, Square roots, Averages
- Interest (Simple and Compound), Profit and Loss, Discount
- Partnership Business, Mixture and Alligation, Time and Distance
- Time and Work, Basic algebraic identities, Graphs of Linear Equations
- Triangle and its various kinds of centres, Congruence and similarity of triangles
- Circle and its chords, tangents, angles subtended by chords of a circle
- Common tangents to two or more circles
` : ''}

ADDITIONAL CONTEXT:
${moduleTopics ? `Specific Topics to Cover: ${moduleTopics}` : ''}
${teachingNotes ? `Teaching Notes: ${teachingNotes}` : ''}
${description ? `Course Description: ${description}` : ''}

CURRICULUM STRUCTURE REQUIREMENTS:

1. **Course Overview**
   - Compelling description highlighting exam relevance
   - 4-5 specific learning objectives for ${examType} success
   - Prerequisites and recommended preparation
   - Study timeline and exam strategy overview

2. **Module Structure** (${numberOfModules || 8} modules)
   For each module, provide:
   - Module number and exam-focused title
   - Module objective (1-2 sentences focused on exam success)
   - 5-8 key concepts/topics with exam relevance
   - Expected time allocation for ${learnerLevel} level
   - Difficulty progression (Basic → Intermediate → Advanced → Exam Level)

3. **Competitive Exam Focus**
   - Include time-saving techniques and shortcuts for each topic
   - Mention common question patterns from ${examType} exams
   - Add difficulty levels: Easy, Moderate, Hard, Tricky
   - Include memory tricks and mnemonics where applicable
   - Reference previous year question trends

4. **Learning Outcomes**
   - Speed and accuracy improvement targets
   - Concept mastery benchmarks
   - Practice question solving capacity
   - Time management skills for ${examType} format

IMPORTANT GUIDELINES:
- Ensure content is specifically tailored for ${examType} examination patterns
- Include exam-specific strategies and approaches
- Focus on speed-solving techniques appropriate for ${learnerLevel} level
- Maintain logical progression from fundamentals to advanced concepts
- Include regular practice and assessment points

CRITICAL OUTPUT REQUIREMENTS:
Please return the output in a markdown code block with JSON format.

Use this structure:
\`\`\`json
{
  "complete": "# ${title}\\n\\n## Course Overview\\n[Exam-focused description and objectives]\\n\\n## Module 1: [Title]\\n**Objective:** [Exam-focused objective]\\n**Key Concepts:**\\n- Concept 1 (with exam relevance)\\n- Concept 2 (with time-saving techniques)\\n- Concept 3 (with common question patterns)\\n\\n**Difficulty Progression:** Basic → Advanced → Exam Level\\n**Time Allocation:** X hours for ${learnerLevel} level\\n\\n## Module 2: [Title]\\n... and so on"
}
\`\`\`

IMPORTANT OUTPUT FORMAT:
• Respond with ONLY valid JSON inside a single Markdown code block.
• Begin the response with three backticks followed by the word json (\`\`\`json) on its own line.
• End the response with three backticks (\`\`\`).
• DO NOT include any additional commentary, explanation, or prose outside the code block.
• Ensure the JSON is completely valid and self-contained.
• Use proper Markdown formatting with clear module sections.
• Focus on ${examType} exam-specific content and strategies.
    `

    // Generate curriculum using enhanced competitive exam prompt
    const responseText = await generateContent(curriculumPrompt, {
      temperature: 0.7,
      maxOutputTokens: 8192
    })
    
    // Extract JSON from markdown code block
    const codeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    let curriculum = "";
    
    if (!codeBlockMatch) {
      console.log("No JSON code block found in curriculum response, using direct response...");
      curriculum = responseText;
    } else {
      const jsonText = codeBlockMatch[1];
      console.log("Successfully extracted JSON from markdown code block for curriculum");
      
      try {
        const parsed = JSON.parse(jsonText);
        
        // Handle chunked response format
        if (parsed.part1 || parsed.part2) {
          console.log("Detected chunked curriculum response, merging parts...");
          let mergedCurriculum = "";
          
          Object.keys(parsed).forEach(partKey => {
            if (partKey.startsWith('part') && parsed[partKey]) {
              mergedCurriculum += parsed[partKey] + "\\n\\n";
            }
          });
          
          curriculum = mergedCurriculum.trim();
          console.log("Successfully merged chunked curriculum response parts");
        } else if (parsed.complete) {
          curriculum = parsed.complete;
          console.log("Using complete curriculum response format");
        } else {
          curriculum = responseText;
        }
      } catch (parseError) {
        console.log("Failed to parse curriculum response JSON, using raw response...");
        curriculum = responseText;
      }
    }

    // Count estimated modules from the generated content
    const moduleMatches = curriculum.match(/## Module \d+/g) || curriculum.match(/### Module \d+/g) || []
    const moduleCount = moduleMatches.length || parseInt(numberOfModules) || 8

    console.log(`✅ Generated ${examType} ${subject} curriculum - ${moduleCount} modules estimated`)

    return NextResponse.json({
      success: true,
      curriculum: curriculum,
      moduleCount: moduleCount,
      metadata: {
        examType: examType,
        subject: subject,
        learnerLevel: learnerLevel,
        title: title,
        generatedAt: new Date().toISOString(),
        estimatedModules: moduleCount,
        isCompetitiveExam: true
      }
    })

  } catch (error) {
    console.error("Competitive exam curriculum generation error:", error)
    
    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: "AI service configuration error. Please contact support." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: "Failed to generate competitive exam curriculum. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 