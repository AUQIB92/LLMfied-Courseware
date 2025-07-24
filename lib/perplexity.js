// Perplexity AI Integration for Educational Content Generation
import { jsonrepair } from "jsonrepair";
import JSON5 from "json5";

// Check if API key is configured
if (!process.env.PERPLEXITY_API_KEY) {
  console.error("⚠️  PERPLEXITY_API_KEY environment variable is not set!");
  console.log(
    "Please set your Perplexity API key in your environment variables:"
  );
  console.log(
    "For development: Create a .env.local file with PERPLEXITY_API_KEY=your_api_key_here"
  );
}

// Retry logic for Perplexity API call
async function callPerplexityWithRetry(
  payload,
  maxRetries = 3,
  retryDelay = 2000
) {
  let lastError;

  console.log(
    `📝 Perplexity prompt length: ${payload.messages[0].content.length} characters`
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 Perplexity call attempt ${attempt}/${maxRetries}`);
      const startTime = Date.now();

      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorDetails = "";
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
          console.error("❌ Perplexity API error details:", errorData);
        } catch (e) {
          const errorText = await response.text();
          errorDetails = errorText;
          console.error("❌ Perplexity API error text:", errorText);
        }
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}. Details: ${errorDetails}`
        );
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(
        `✅ Perplexity call successful in ${duration.toFixed(
          2
        )} seconds, response length: ${responseText.length} characters`
      );

      return responseText;
    } catch (error) {
      lastError = error;
      console.warn(
        `❌ Perplexity attempt ${attempt}/${maxRetries} failed:`,
        error.message
      );

      // Log payload for debugging on failure
      if (attempt === 1) {
        console.log(
          "🔍 Failed request payload:",
          JSON.stringify(payload, null, 2)
        );
        console.log("🔑 API Key configured:", !!process.env.PERPLEXITY_API_KEY);
        console.log(
          "🔑 API Key prefix:",
          process.env.PERPLEXITY_API_KEY
            ? process.env.PERPLEXITY_API_KEY.substring(0, 10) + "..."
            : "Not set"
        );
      }

      // Wait longer for each retry
      const waitTime = retryDelay * attempt;
      console.log(`Waiting ${waitTime / 1000} seconds before retry...`);
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }

  console.error(`❌❌❌ Perplexity failed after ${maxRetries} attempts.`);
  throw new Error(
    `Perplexity failed after ${maxRetries} attempts. Last error: ${lastError}`
  );
}

// Parse JSON response with robust error handling
async function parsePerplexityResponse(rawResponse) {
  console.log(`📏 Perplexity response size: ${rawResponse.length} chars`);

  // First try to parse as pure JSON
  try {
    return JSON.parse(rawResponse);
  } catch (e1) {
    console.log("🔧 Pure JSON parse failed, trying markdown extraction...");

    // Fallback: Extract JSON from markdown code block if present
    const codeBlockMatch = rawResponse.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    let jsonStr = codeBlockMatch ? codeBlockMatch[1] : rawResponse;

    try {
      return JSON.parse(jsonStr);
    } catch (e2) {
      console.warn("⚠️ Standard JSON.parse failed:", e2.message);

      try {
        const repaired = jsonrepair(jsonStr);
        return JSON.parse(repaired);
      } catch (e3) {
        console.warn("⚠️ jsonrepair failed:", e3.message);

        try {
          return JSON5.parse(jsonStr);
        } catch (e4) {
          console.warn("❌ JSON5 fallback also failed:", e4.message);
          return null;
        }
      }
    }
  }
}

// Test Perplexity connection
export async function testPerplexityConnection() {
  try {
    // Check if API key is available
    if (!process.env.PERPLEXITY_API_KEY) {
      return {
        success: false,
        error: "PERPLEXITY_API_KEY environment variable is not set",
      };
    }

    console.log("🧪 Testing Perplexity connection with simplified request...");

    // Try different model names in order of preference
    const modelsToTry = ["sonar", "sonar-pro"];

    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Trying model: ${modelName}`);

        const payload = {
          model: modelName,
          messages: [
            {
              role: "user",
              content: "Hello, can you respond with 'Connection successful'?",
            },
          ],
          max_tokens: 50,
          temperature: 0.2,
        };

        console.log("🔍 Test payload:", JSON.stringify(payload, null, 2));

        const responseText = await callPerplexityWithRetry(payload, 1, 1000);
        return {
          success: true,
          response: responseText,
          modelUsed: modelName,
        };
      } catch (modelError) {
        console.warn(`❌ Model ${modelName} failed:`, modelError.message);
        // Continue to next model
        continue;
      }
    }

    // If all models failed
    throw new Error("All Perplexity models failed during connection test");
  } catch (error) {
    console.error("Perplexity connection test failed:", error);
    return { success: false, error: error.message };
  }
}

// Generate quiz using Perplexity (enhanced with real-time web search)
export async function generatePerplexityQuiz(
  moduleContent,
  difficulty = "medium",
  context = {}
) {
  const {
    subject = "general",
    examType = "general",
    learnerLevel = "intermediate",
  } = context;

  const payload = {
    model: "sonar",
    messages: [
      {
        role: "user",
        content: `
Based on this educational content about ${subject}, generate a ${difficulty} difficulty quiz with 5 multiple choice questions. Use real-time web search to find current examples, statistics, and updated information to make the quiz more relevant and accurate.

SUBJECT: ${subject}
EXAM TYPE: ${examType}
LEARNER LEVEL: ${learnerLevel}
DIFFICULTY: ${difficulty}

MATHEMATICAL CONTENT FORMATTING REQUIREMENTS:
- Format all mathematical equations and formulas using LaTeX syntax with PROPER ESCAPING
- For inline equations, use $...$ delimiters (e.g., $E = mc^2$)
- For block/display equations, use $$...$$ delimiters 
- CRITICAL: Use SINGLE backslash for LaTeX commands: \\frac{numerator}{denominator}, \\sqrt{expression}, \\sum, \\int
- For fractions: ALWAYS use \\frac{numerator}{denominator} (with single backslash)
- For exponents: x^{power} or x^2 
- For subscripts: x_{index} or x_1
- For square roots: \\sqrt{expression} (with single backslash)
- For summations: \\sum_{i=1}^{n} (with single backslash)
- For integrals: \\int_{a}^{b} f(x) dx (with single backslash)
- For limits: \\lim_{x \\to 0} f(x) (with single backslashes)
- For Greek letters: \\alpha, \\beta, \\theta, \\pi, \\infty (with single backslashes)
- Use \\text{} for text within equations: $\\text{area} = \\pi r^2$
- EXAMPLES OF CORRECT FORMATTING:
  * Fraction: $\\frac{1}{2}$ or $$\\frac{numerator}{denominator}$$
  * Square root: $\\sqrt{25} = 5$
  * Summation: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
  * Integration: $\\int_{0}^{1} x^2 dx = \\frac{1}{3}$

CONTENT TO BASE QUIZ ON:
${moduleContent}

REQUIREMENTS:
- Search the web for current examples, recent developments, and updated statistics related to this topic
- Each question should test understanding of key concepts
- Include mathematical formulas and calculations where appropriate using LaTeX syntax
- Options should be plausible but only one clearly correct
- Explanations should be clear and educational, using LaTeX for mathematical content
- Questions should be appropriate for ${difficulty} difficulty level
- Include citations/sources for any real-time information used

CRITICAL OUTPUT REQUIREMENTS:
Return ONLY valid JSON in this exact format:

{
  "questions": [
    {
      "question": "Question text with LaTeX formatting for math: $x^2 + y^2 = z^2$",
      "options": ["Option A with math: $a = \\\\frac{b}{c}$", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Explanation with LaTeX math and citations: The formula $E = mc^2$ shows... [Source: citation]",
      "sources": ["https://example.com/source1", "https://example.com/source2"]
    }
  ]
}

IMPORTANT:
- Respond with ONLY valid JSON
- Do NOT include any markdown code blocks, commentary, or additional text
- Ensure mathematical formulas use proper LaTeX escaping
- Include sources array for each question when using web-searched information
        `,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    return_citations: true,
  };

  try {
    const responseText = await callPerplexityWithRetry(payload, 3, 2000);
    let parsed = await parsePerplexityResponse(responseText);

    if (parsed && parsed.questions) {
      console.log(
        `✅ Successfully generated ${parsed.questions.length} quiz questions with Perplexity`
      );
      return parsed;
    } else {
      console.warn(
        "⚠️ Perplexity response doesn't have expected questions format"
      );
      return { questions: [] };
    }
  } catch (error) {
    console.error("Error generating quiz with Perplexity:", error);
    return { questions: [] };
  }
}

// Generate learning resources using Perplexity (enhanced with real-time web search)
export async function generatePerplexityResources(moduleContent, context = {}) {
  const {
    subject = "general",
    learnerLevel = "intermediate",
    moduleTitle = "Learning Module",
  } = context;

  const payload = {
    model: "sonar",
    messages: [
      {
        role: "user",
        content: `
Find current, high-quality learning resources for this educational topic. Use real-time web search to find the most up-to-date books, courses, articles, videos, tools, and websites.

TOPIC: ${moduleTitle}
SUBJECT: ${subject}
LEARNER LEVEL: ${learnerLevel}

CONTENT TO RESEARCH:
${moduleContent}

REQUIREMENTS:
- Search for the most current and highly-rated resources available online
- Find resources appropriate for ${learnerLevel} level learners
- Include real URLs, publication years, and specific details
- Prioritize recent publications (2020-2025) where possible
- Look for resources from reputable educational institutions, publishers, and platforms
- Include a mix of free and paid resources
- Verify that URLs are accessible and current

Find resources in these categories:
1. BOOKS: Recent textbooks, guides, and reference materials with real Amazon/publisher URLs
2. COURSES: Online courses from platforms like Coursera, edX, Udemy, Khan Academy, etc.
3. ARTICLES: Recent academic papers, blog posts, and educational articles
4. VIDEOS: YouTube channels, educational video series, and tutorials
5. TOOLS: Software, online tools, simulators, and practical applications
6. WEBSITES: Educational websites, documentation, and reference sites
7. EXERCISES: Practice problems, coding challenges, and hands-on projects

CRITICAL OUTPUT REQUIREMENTS:
Return ONLY valid JSON in this exact format:

{
  "books": [
    {
      "title": "Complete Book Title",
      "author": "Author Name",
      "description": "Detailed description explaining why this book is valuable",
      "year": "2023",
      "difficulty": "Beginner|Intermediate|Advanced",
      "url": "https://amazon.com/... or publisher URL",
      "isbn": "ISBN if available",
      "rating": "4.5/5 or rating if available"
    }
  ],
  "courses": [
    {
      "title": "Complete Course Title",
      "platform": "Platform Name",
      "url": "https://coursera.org/... or course URL",
      "description": "Detailed course description and learning outcomes",
      "difficulty": "Beginner|Intermediate|Advanced",
      "duration": "Estimated time to complete",
      "instructor": "Instructor name if available",
      "rating": "4.5/5 or rating if available",
      "price": "Free or $X"
    }
  ],
  "articles": [
    {
      "title": "Article Title",
      "source": "Publication/Journal Name",
      "description": "Article summary and key insights",
      "url": "https://example.com/article",
      "author": "Author name if available",
      "publishDate": "2023 or publication date",
      "type": "Research Paper|Blog Post|Tutorial|Guide"
    }
  ],
  "videos": [
    {
      "title": "Video Title",
      "creator": "Creator/Channel Name",
      "source_platform": "YouTube|Vimeo|Khan Academy|etc.",
      "url": "https://www.youtube.com/watch?v=...",
      "description": "Video content description and learning value",
      "duration": "Video length",
      "views": "View count if available",
      "rating": "Like ratio or rating if available"
    }
  ],
  "tools": [
    {
      "name": "Tool Name",
      "type": "Software|Online Tool|Mobile App|etc.",
      "description": "How this tool helps with learning and practical application",
      "url": "https://tool-official-website.com",
      "price": "Free or $X",
      "platforms": ["Web", "iOS", "Android", "Windows", "Mac"],
      "rating": "4.5/5 or rating if available"
    }
  ],
  "websites": [
    {
      "name": "Website/Resource Name",
      "url": "https://website-url.com",
      "description": "What students can find here and how it supports learning",
      "type": "Documentation|Reference|Tutorial|Practice|Community",
      "lastUpdated": "2023 or last update date if available"
    }
  ],
  "exercises": [
    {
      "title": "Exercise/Project Title",
      "difficulty": "Beginner|Intermediate|Advanced",
      "description": "Clear description of the exercise and learning outcomes",
      "estimatedTime": "Time to complete",
      "type": "Coding|Theory|Design|Analysis|Practical",
      "url": "https://exercise-website.com",
      "platform": "Platform name if applicable"
    }
  ]
}

IMPORTANT:
- Respond with ONLY valid JSON
- Do NOT include markdown code blocks, commentary, or additional text
- All URLs must be real and accessible
- Include specific details like ratings, prices, and publication dates
- Prioritize high-quality, current resources from reputable sources
        `,
      },
    ],
    temperature: 0.3, // Lower temperature for more factual accuracy
    max_tokens: 6000,
    return_citations: true,
  };

  try {
    const responseText = await callPerplexityWithRetry(payload, 3, 2000);
    let parsed = await parsePerplexityResponse(responseText);

    if (parsed) {
      console.log(`✅ Successfully generated resources with Perplexity`);
      return parsed;
    } else {
      console.warn(
        "⚠️ Perplexity response doesn't have expected resources format"
      );
      return {
        books: [],
        courses: [],
        articles: [],
        videos: [],
        tools: [],
        websites: [],
        exercises: [],
      };
    }
  } catch (error) {
    console.error("Error generating resources with Perplexity:", error);
    return {
      books: [],
      courses: [],
      articles: [],
      videos: [],
      tools: [],
      websites: [],
      exercises: [],
    };
  }
}

// Generate module summary using Perplexity
export async function generatePerplexityModuleSummary(content, context = {}) {
  const {
    learnerLevel = "intermediate",
    subject = "general",
    moduleIndex = 1,
    totalModules = 1,
  } = context;

  const payload = {
    model: "sonar",
    messages: [
      {
        role: "user",
        content: `
Analyze the following educational content and provide a comprehensive, engaging module breakdown. Use real-time web search to find current examples, statistics, and up-to-date information to enhance the content.

CONTEXT:
- Target Learner Level: ${learnerLevel}
- Subject Category: ${subject}
- Module Position: ${moduleIndex} of ${totalModules}

REQUIREMENTS FOR ${learnerLevel.toUpperCase()} LEVEL:
${
  learnerLevel === "beginner"
    ? `
- Use simple, clear language and avoid jargon
- Include foundational concepts and prerequisites
- Provide step-by-step explanations
- Focus on building confidence and understanding basics
`
    : ""
}
${
  learnerLevel === "intermediate"
    ? `
- Balance theory with practical applications
- Include moderate complexity examples
- Connect to real-world scenarios
- Build on assumed foundational knowledge
`
    : ""
}
${
  learnerLevel === "advanced"
    ? `
- Include complex concepts and edge cases
- Focus on optimization and best practices
- Provide challenging, industry-relevant examples
- Assume strong foundational knowledge
`
    : ""
}
${
  learnerLevel === "expert"
    ? `
- Cover cutting-edge techniques and research
- Include advanced architectural patterns
- Focus on leadership and mentoring aspects
- Provide expert-level insights and strategies
`
    : ""
}

CONTENT: ${content}

SPECIAL CONTENT REQUIREMENTS:
- FOR PROGRAMMING TOPICS: Include practical code examples in relevant languages (JavaScript, Python, Java, C++, etc.)
- FOR MATHEMATICAL CONCEPTS: Include formulas, equations, step-by-step calculations, and numerical examples
- FOR ALGORITHMS: Provide pseudocode and implementation examples
- FOR DATA STRUCTURES: Show code implementations and visual representations
- FOR THEORETICAL CONCEPTS: Include mathematical proofs, derivations, and formal definitions when appropriate

CRITICAL: Use web search to find current examples, recent developments, and up-to-date statistics to enhance the content.

CRITICAL OUTPUT REQUIREMENTS:
Return ONLY valid JSON in this exact format:

{
  "summary": "Engaging module summary that highlights why this topic matters and captures student interest",
  "objectives": ["Students will be able to analyze...", "Students will be able to implement...", "Students will be able to evaluate...", "etc."],
  "examples": ["Concrete real-world example 1 with specific context", "Concrete real-world example 2 with specific context", "etc."],
  "visualizationSuggestions": {
    "hasFlowcharts": true/false,
    "hasComparisons": true/false,
    "hasTimelines": true/false,
    "hasFormulas": true/false,
    "hasProcessSteps": true/false,
    "hasCyclicalProcesses": true/false,
    "hasHierarchies": true/false,
    "hasRelationships": true/false,
    "codeSimulationTopics": ["Topic 1 that needs code demo", "Topic 2 that needs interactive coding", "etc."],
    "interactiveElements": ["Mathematical concepts for sliders/calculators", "Visual concepts for drag-drop", "etc."]
  },
  "beautifulSummaryElements": {
    "keyInsights": ["Compelling insight 1", "Compelling insight 2", "Compelling insight 3"],
    "practicalApplications": ["How this applies in industry", "How this applies in daily life", "How this applies in research"],
    "whyItMatters": "Compelling explanation of the importance and relevance of this topic",
    "careerRelevance": "How mastering this topic impacts career prospects and professional growth",
    "difficultyLevel": "Beginner|Intermediate|Advanced",
    "prerequisites": ["Prerequisite 1", "Prerequisite 2", "etc."],
    "estimatedStudyTime": "X hours of focused study time"
  },
  "detailedSubsections": [
    {
      "title": "Subsection Title",
      "summary": "Brief overview of what this subsection covers",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "pages": [
        {
          "pageNumber": 1,
          "pageTitle": "Introduction & Foundation",
          "content": "Basic concepts, definitions, and context (200-300 words). This page introduces the fundamental ideas and provides the necessary background knowledge.",
          "keyTakeaway": "Main learning point for this introductory page"
        },
        {
          "pageNumber": 2,
          "pageTitle": "Deep Dive & Analysis",
          "content": "Technical details, mechanisms, and processes (200-300 words). This page explores how things work and the underlying principles.",
          "keyTakeaway": "Main learning point for this detailed analysis page"
        },
        {
          "pageNumber": 3,
          "pageTitle": "Applications & Implementation",
          "content": "Real-world applications and implementation details (200-300 words). This page shows practical applications and how to apply the knowledge.",
          "keyTakeaway": "Main learning point for this application-focused page"
        }
      ],
      "practicalExample": "Real-world example or application",
      "commonPitfalls": ["Common mistake 1", "Common mistake 2", "How to avoid these issues"],
      "difficulty": "Beginner|Intermediate|Advanced",
      "estimatedTime": "Time to complete this subsection"
    }
  ]
}

IMPORTANT:
- Respond with ONLY valid JSON
- Do NOT include any markdown code blocks, commentary, or additional text
- Ensure the JSON is completely valid and self-contained
- Use web search results to enhance content with current information
        `,
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    return_citations: true,
  };

  try {
    const responseText = await callPerplexityWithRetry(payload, 5, 3000);
    let parsed = await parsePerplexityResponse(responseText);

    if (parsed && parsed.summary) {
      console.log(`✅ Successfully generated module summary with Perplexity`);
      return parsed;
    } else {
      console.warn(
        "⚠️ Perplexity response doesn't have expected module summary format"
      );
      return {
        summary: `Learn about ${content.slice(0, 50)}...`,
        objectives: ["Understand key concepts"],
        examples: [],
        visualizationSuggestions: {
          hasFlowcharts: false,
          hasComparisons: false,
          hasTimelines: false,
          hasFormulas: false,
          hasProcessSteps: false,
          hasCyclicalProcesses: false,
          hasHierarchies: false,
          hasRelationships: false,
          codeSimulationTopics: [],
          interactiveElements: [],
        },
        beautifulSummaryElements: {
          keyInsights: [],
          practicalApplications: [],
          whyItMatters:
            "This topic is important for understanding the subject area.",
          careerRelevance:
            "Understanding this topic can enhance your professional skills.",
          difficultyLevel: "Intermediate",
          prerequisites: [],
          estimatedStudyTime: "2-3 hours",
        },
        detailedSubsections: [],
      };
    }
  } catch (error) {
    console.error("Error generating module summary with Perplexity:", error);
    return {
      summary: `Learn about ${content.slice(0, 50)}...`,
      objectives: ["Understand key concepts"],
      examples: [],
      visualizationSuggestions: {
        hasFlowcharts: false,
        hasComparisons: false,
        hasTimelines: false,
        hasFormulas: false,
        hasProcessSteps: false,
        hasCyclicalProcesses: false,
        hasHierarchies: false,
        hasRelationships: false,
        codeSimulationTopics: [],
        interactiveElements: [],
      },
      beautifulSummaryElements: {
        keyInsights: [],
        practicalApplications: [],
        whyItMatters:
          "This topic is important for understanding the subject area.",
        careerRelevance:
          "Understanding this topic can enhance your professional skills.",
        difficultyLevel: "Intermediate",
        prerequisites: [],
        estimatedStudyTime: "2-3 hours",
      },
      detailedSubsections: [],
    };
  }
}

// Generate competitive exam module summary using Perplexity with JSON output
export async function generatePerplexityCompetitiveExamModuleSummary(
  content,
  context = {}
) {
  const {
    learnerLevel = "intermediate",
    subject = "Quantitative Aptitude",
    examType = "SSC",
    moduleIndex = 1,
    totalModules = 1,
  } = context;

  const payload = {
    model: "sonar",
    messages: [
      {
        role: "user",
        content: `
Analyze the following educational content and provide a comprehensive, exam-focused module breakdown in JSON format for Competitive Exams like SSC, UPSC, CAT, Bank PO, GRE, etc., in the domain of ${subject} for the ${examType} examination.

Use real-time web search to find current exam patterns, recent changes in syllabi, updated statistics, and latest resources for competitive exams.

CONTEXT:
- Target Learner Level: ${learnerLevel}
- Subject Category: ${subject}
- Exam Type: ${examType}
- Module Position: ${moduleIndex} of ${totalModules}

MATHEMATICAL CONTENT FORMATTING RULES (CRITICAL):
- Use LaTeX syntax for all math expressions.
- Inline math: $...$ (e.g., $E = mc^2$)
- Block/display math: $$ ... $$ on separate lines.
- Use SINGLE backslash for LaTeX commands: \\frac, \\sqrt, \\sum, etc.
- For fractions: $\\frac{numerator}{denominator}$
- For square roots: $\\sqrt{expression}$
- For units: $\\Omega$ (ohms), $\\text{kg}$ (kilograms), $\\text{m/s}$ (meters per second)
- For Greek letters: $\\rho$, $\\alpha$, $\\sigma$, $\\pi$, $\\theta$, etc.
- For mathematical operators: $\\sum$, $\\int$, $\\prod$, $\\lim$
- For functions: $\\sin$, $\\cos$, $\\tan$, $\\log$, $\\ln$, $\\exp$
- For text in math: $\\text{resistance} = \\frac{V}{I}$
- For arrows: Use $\\rightarrow$, $\\leftarrow$, $\\uparrow$, $\\downarrow$, $\\leftrightarrow$
- For limits: $\\lim_{x \\rightarrow 0}$, $\\lim_{n \\rightarrow \\infty}$
- For mappings: $f: A \\rightarrow B$, $x \\mapsto f(x)$
- For implies: $\\Rightarrow$, $\\Leftarrow$, $\\Leftrightarrow$
- Ensure all braces are balanced: $\\frac{a + b}{c + d}$
- Use proper spacing: $a + b = c$ not $a+b=c$

Please provide a comprehensive JSON response with current, up-to-date information:
{
  "summary": "Compelling 2-3 sentence summary focused on ${examType} exam success with current exam patterns",
  "objectives": ["Current exam-focused objective 1", "Updated objective 2", "Objective 3", "Objective 4", "Objective 5"],
  "examples": ["Recent ${examType} exam example 1", "Current pattern example 2", "Updated example 3"],
  "visualizationSuggestions": {
    "hasFlowcharts": true,
    "hasComparisons": true,
    "hasTimelines": false,
    "hasFormulas": true,
    "hasProcessSteps": true,
    "hasCyclicalProcesses": false,
    "hasHierarchies": true,
    "hasRelationships": true,
    "codeSimulationTopics": ["Speed calculation demos", "Shortcut technique demos"],
    "interactiveElements": ["Quick calculators", "Timer-based practice", "Current exam simulators"]
  },
  "beautifulSummaryElements": {
    "keyInsights": ["Current ${examType} exam insight", "Latest speed-solving technique", "Updated exam strategy"],
    "practicalApplications": ["Recent ${examType} question applications", "Current exam scenarios", "Updated time-saving methods"],
    "whyItMatters": "Current importance for ${examType} exam and career opportunities in 2024",
    "careerRelevance": "Latest career impact of ${examType} success and job market trends",
    "difficultyLevel": "${learnerLevel}",
    "prerequisites": ["Current ${examType} prerequisites", "Updated foundational knowledge", "Recent syllabus requirements"],
    "estimatedStudyTime": "Updated study time estimate for ${learnerLevel} learner in current ${examType} format"
  },
  "resources": {
    "books": [
      {
        "title": "Latest ${examType} book title (2024 edition)",
        "author": "Author Name",
        "description": "Current description emphasizing 2024 ${examType} patterns and techniques",
        "year": "2024",
        "difficulty": "${learnerLevel}",
        "url": "Current Amazon/publisher URL"
      }
    ],
    "courses": [
      {
        "title": "Current ${examType} course (2024)",
        "platform": "Platform Name",
        "url": "Current course URL",
        "description": "Updated course description for ${examType} 2024 patterns",
        "difficulty": "${learnerLevel}",
        "duration": "Duration"
      }
    ],
    "articles": [
      {
        "title": "Recent ${examType} article or strategy guide",
        "source": "Current publication",
        "description": "Latest insights for ${examType} preparation",
        "url": "Current article URL"
      }
    ],
    "videos": [
      {
        "title": "Latest ${examType} video tutorial",
        "creator": "Current educator",
        "source_platform": "YouTube",
        "description": "Recent video focused on ${examType} 2024 techniques",
        "duration": "Video length"
      }
    ],
    "tools": [
      {
        "name": "Current ${examType} preparation tool",
        "type": "Online Tool/App",
        "description": "Latest tool for ${examType} practice and preparation",
        "url": "Current tool URL"
      }
    ],
    "websites": [
      {
        "name": "Updated ${examType} resource website",
        "url": "Current website URL", 
        "description": "Latest resources for ${examType} aspirants"
      }
    ],
    "exercises": [
      {
        "title": "Current ${examType} practice set",
        "difficulty": "${learnerLevel}",
        "description": "Updated exercises based on recent ${examType} patterns",
        "estimatedTime": "Time to complete",
        "type": "Current Practice Pattern/Mock Test"
      }
    ]
  },
  "detailedSubsections": [
    {
      "title": "Subsection Title",
      "summary": "Overview with current ${examType} exam relevance and recent pattern changes",
      "keyPoints": ["Updated key point for exam success", "Current speed technique", "Recent question pattern"],
      "pages": [
        {
          "pageNumber": 1,
          "pageTitle": "Introduction & Current Foundation",
          "content": "Basic concepts with current ${examType} exam context and recent updates (200-300 words with LaTeX)",
          "keyTakeaway": "Fundamental understanding for current ${examType} success"
        },
        {
          "pageNumber": 2,
          "pageTitle": "Latest Speed Techniques & Shortcuts",
          "content": "Current time-saving methods and updated shortcuts for ${examType} (200-300 words with LaTeX)",
          "keyTakeaway": "Master latest speed techniques for ${examType}"
        },
        {
          "pageNumber": 3,
          "pageTitle": "Current Exam Applications & Practice",
          "content": "Recent ${examType} question patterns and updated strategies (200-300 words with LaTeX)",
          "keyTakeaway": "Apply knowledge in current ${examType} exam format"
        },
        {
          "pageNumber": 4,
          "pageTitle": "Updated Tricks & Recent Common Traps",
          "content": "Latest shortcuts and current question traps in ${examType} (200-300 words with LaTeX)",
          "keyTakeaway": "Advanced mastery for current ${examType} patterns"
        },
        {
          "pageNumber": 5,
          "pageTitle": "Current Mastery & Updated Review",
          "content": "Latest practice problems and current preparation strategies for ${examType} (200-300 words with LaTeX)",
          "keyTakeaway": "Complete readiness for current ${examType} format"
        }
      ],
      "practicalExample": "Recent ${examType} exam question with current solution approach using LaTeX",
      "commonPitfalls": ["Current calculation errors in ${examType}", "Recent time management issues", "Updated conceptual traps", "Modern formula application errors"],
      "difficulty": "${learnerLevel}",
      "estimatedTime": "Time to master for current ${examType} exam"
    }
  ]
}

IMPORTANT OUTPUT FORMAT:
• Respond with ONLY valid JSON.
• Use real-time web search to ensure all information is current and accurate.
• Include recent exam pattern changes, updated statistics, and latest resources.
• Ensure mathematical expressions use proper LaTeX formatting.

Content to process:
${content}
        `,
      },
    ],
    temperature: 0.2,
    max_tokens: 8000,
    top_p: 0.9,
    return_citations: true,
    search_recency_filter: "month",
  };

  try {
    console.log(
      `🔍 Generating current competitive exam content for ${examType} with Perplexity...`
    );
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(
      `✅ Perplexity competitive exam response received (${content.length} chars)`
    );

    // Try to parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`✅ Successfully parsed Perplexity competitive exam JSON`);
        return parsed;
      } else {
        console.log(
          `⚠️ No JSON found in Perplexity response, using text processing`
        );
        // Extract data with regex if JSON parsing fails
        return extractDataWithRegex(content);
      }
    } catch (parseError) {
      console.log(
        `⚠️ JSON parsing failed, using text processing:`,
        parseError.message
      );
      return extractDataWithRegex(content);
    }
  } catch (error) {
    console.error("Perplexity competitive exam error:", error);
    return {
      summary: `Current ${examType} exam preparation content for ${subject}`,
      objectives: ["Master current exam patterns", "Learn updated techniques"],
      examples: [],
      resources: {
        books: [],
        courses: [],
        articles: [],
        videos: [],
        tools: [],
        websites: [],
        exercises: [],
      },
      detailedSubsections: [],
    };
  }
}
