import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { generateAcademicSubsectionSummary } from "@/lib/gemini";

// Minimal markdown → HTML converter that preserves LaTeX delimiters
function basicMarkdownToHtml(markdown = "") {
  if (typeof markdown !== "string") return "";
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // fenced code blocks
  let html = markdown.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${escape(code)}</code></pre>`);
  // headings
  html = html.replace(/^######\s*(.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s*(.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s*(.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s*(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s*(.*)$/gm, '<h1>$1</h1>');
  // emphasis/code
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // lists
  html = html.replace(/^(\s*[-*+]\s+.*(?:\n\s*[-*+]\s+.*)*)/gm, (m) => {
    const items = m.split(/\n/).map((l) => l.replace(/^\s*[-*+]\s+/, "")).join('</li><li>');
    return `<ul><li>${items}</li></ul>`;
  });
  // paragraphs
  html = html
    .split(/\n{2,}/)
    .map((b) => {
      const t = b.trim();
      if (!t) return "";
      if (/^<h\d|^<ul|^<pre|^<table|^<blockquote/.test(t)) return t;
      return `<p>${t.replace(/\n/g, '<br/>')}</p>`;
    })
    .join("\n");
  return html;
}

function ensureHtmlOnPages(pages) {
  const arr = Array.isArray(pages) ? pages : [];
  return arr.map((p) => {
    // If the page already has HTML content, use it directly
    if (typeof p?.html === 'string' && p.html.trim() !== '') {
      return { 
        pageTitle: p?.pageTitle || p?.title || 'Page', 
        html: p.html,
        math: p?.math || [] // Include math field if present
      };
    }
    
    // Otherwise, convert from markdown content
    const html = basicMarkdownToHtml(typeof p?.content === 'string' ? p.content : '');
    return { 
      pageTitle: p?.pageTitle || p?.title || 'Page', 
      html,
      math: p?.math || []
    };
  });
}

// Function to generate AI-powered multipage academic content
async function generateAcademicMultipageContent(
  subsectionTitle,
  moduleContext,
  academicLevel = "undergraduate",
  subject = "General Studies"
) {
  // Generate exactly 5 flashcards for academic subsections
  const flashcardPrompt = `
Create exactly 5 academic flashcards for "${subsectionTitle}" within the context of "${moduleContext}" for ${academicLevel} level ${subject} students.

REQUIREMENTS:
- Create 10 detailed academic pages with substantial, meaningful content
- Focus on theoretical depth, critical analysis, and scholarly approach
- Include specific examples, case studies, and real-world applications
- Use proper academic language and structure with comprehensive mathematical coverage
- Provide detailed explanations, not generic templates
- Include comprehensive mathematical equations with proper LaTeX formatting

CONTENT STRUCTURE (10 pages):
1. Introduction & Theoretical Foundation
2. Core Theory & Principles (Part 1)
3. Core Theory & Principles (Part 2)
4. Mathematical Formulations & Models
5. Essential Mathematical Equations & Formulas
6. Advanced Mathematical Relationships & Derivations
7. Practical Applications & Case Studies
8. Research Methods & Analytical Frameworks
9. Current Developments & Future Directions
10. Summary & Academic Integration

MATHEMATICAL CONTENT REQUIREMENTS:
- Pages 4-6 MUST contain extensive mathematical equations using proper LaTeX syntax
- Include fundamental equations, derived formulas, and advanced mathematical relationships
- Use proper mathematical notation: $$equation$$ for display math, $inline$ for inline math
- Include step-by-step derivations where appropriate
- Provide clear explanations for each mathematical concept
- Cover both basic and advanced mathematical aspects of the topic

Return ONLY a JSON object with this exact structure:
{
  "flashcards": [
    {
      "id": 1,
      "question": "Clear, specific question about a key concept",
      "answer": "Comprehensive but concise answer with academic depth",
      "category": "definition|concept|application|example|analysis",
      "difficulty": "basic|intermediate|advanced"
    },
    {
      "id": 2,
      "question": "Second flashcard question",
      "answer": "Second flashcard answer", 
      "category": "definition|concept|application|example|analysis",
      "difficulty": "basic|intermediate|advanced"
    },
    {
      "id": 3,
      "question": "Third flashcard question",
      "answer": "Third flashcard answer",
      "category": "definition|concept|application|example|analysis", 
      "difficulty": "basic|intermediate|advanced"
    },
    {
      "id": 4,
      "question": "Fourth flashcard question",
      "answer": "Fourth flashcard answer",
      "category": "definition|concept|application|example|analysis",
      "difficulty": "basic|intermediate|advanced"
    },
    {
      "id": 5,
      "question": "Fifth flashcard question", 
      "answer": "Fifth flashcard answer",
      "category": "definition|concept|application|example|analysis",
      "difficulty": "basic|intermediate|advanced"
    }
    // ... continue for all 10 pages
  ]
}

Generate real, substantive academic flashcards about ${subsectionTitle} - no templates or placeholders.
`;

  try {
    console.log(`🤖 Generating enhanced AI content for: ${subsectionTitle}`);

    // Use the enhanced subsection generation function
    const context = {
      learnerLevel: academicLevel === "graduate" ? "advanced" : "intermediate",
      subject: subject,
      moduleIndex: 1,
      totalModules: 1,
    };

    const enhancedContent = await generateAcademicSubsectionSummary(
      `Topic: ${subsectionTitle}\nContext: ${moduleContext}\nAcademic Level: ${academicLevel}\nSubject: ${subject}\n\nSPECIAL REQUIREMENTS:\n- Return content directly in HTML format with proper LaTeX math handling\n- Wrap all math in \\( ... \\) for inline or \\[ ... \\] for display\n- Escape backslashes twice (\\\\ for each \\) in JSON output\n- Include comprehensive mathematical equations and formulas with proper LaTeX formatting\n- Provide detailed mathematical derivations and proofs where applicable\n- Cover both fundamental and advanced mathematical concepts related to this topic\n- Use only semantic HTML tags (h2/h3/p/ul/ol/li/table/thead/tbody/tr/th/td/pre/code/blockquote)\n- Return JSON with separate "html" and "math" fields for each page`,
      context
    );

    // Transform the enhanced content into the expected format with pages only
    let aiContent;
    if (
      enhancedContent.detailedSubsections &&
      enhancedContent.detailedSubsections.length > 0
    ) {
      // Use the detailed subsections to create pages
      aiContent = {
        pages: enhancedContent.detailedSubsections.flatMap(
          (subsection, index) => {
            if (subsection.pages && Array.isArray(subsection.pages)) {
              return ensureHtmlOnPages(subsection.pages);
            } else {
              // Create a single page from subsection data
              return [
                {
                  pageNumber: index + 1,
                  pageTitle:
                    subsection.title ||
                    `${subsectionTitle} - Part ${index + 1}`,
                  content:
                    subsection.explanation ||
                    subsection.summary ||
                    `Academic content for ${subsection.title}`,
                  keyTakeaway: subsection.keyPoints
                    ? subsection.keyPoints.join(". ")
                    : `Key insights about ${subsection.title}`,
                },
              ];
            }
          }
        ),
      };
    } else {
      // Fallback: create pages from the summary content
      aiContent = {
        pages: ensureHtmlOnPages([
          {
            pageNumber: 1,
            pageTitle: `${subsectionTitle} - Introduction`,
            content:
              enhancedContent.summary ||
              `Comprehensive study of ${subsectionTitle}`,
            keyTakeaway:
              enhancedContent.objectives &&
              enhancedContent.objectives.length > 0
                ? enhancedContent.objectives[0]
                : `Understanding ${subsectionTitle} is essential for academic success.`,
          },
          {
            pageNumber: 2,
            pageTitle: `${subsectionTitle} - Core Concepts`,
            content:
              enhancedContent.examples && enhancedContent.examples.length > 0
                ? `Key examples and applications:\n\n${enhancedContent.examples.join(
                    "\n\n"
                  )}`
                : `Core academic concepts related to ${subsectionTitle}`,
            keyTakeaway: `Apply theoretical knowledge through practical examples and real-world scenarios.`,
          },
        ]),
      };
    }

    if (aiContent.pages && Array.isArray(aiContent.pages)) {
      console.log(
        `✅ Generated ${aiContent.pages.length} enhanced AI-powered pages with additional metadata`
      );
      return aiContent;
    } else {
      throw new Error("Invalid enhanced AI response structure");
    }
  } catch (aiError) {
    console.error("❌ Enhanced AI generation failed, using fallback:", aiError);

    // Fallback to a structured response with enhanced metadata
    return {
      pages: [
        {
          pageNumber: 1,
          pageTitle: `${subsectionTitle} - Academic Overview`,
          content: `# ${subsectionTitle} - Academic Study

## Introduction

${subsectionTitle} is an important topic within ${moduleContext} that requires comprehensive academic understanding at the ${academicLevel} level in ${subject}.

## Core Concepts

This section covers the fundamental principles and theoretical frameworks that underpin ${subsectionTitle}. Students should focus on:

1. **Theoretical Foundation**: Understanding the basic principles
2. **Academic Context**: How this fits within the broader discipline
3. **Practical Applications**: Real-world relevance and applications
4. **Critical Analysis**: Developing analytical skills

This topic connects to other areas within ${moduleContext} and provides foundation for advanced study in ${subject}.`,
          keyTakeaway: `${subsectionTitle} requires systematic academic study combining theoretical understanding with practical application.`,
        },
        {
          pageNumber: 2,
          pageTitle: `${subsectionTitle} - Mathematical Foundations`,
          content: `# Mathematical Foundations of ${subsectionTitle}

## Fundamental Equations

The mathematical representation of ${subsectionTitle} involves several key equations and relationships that form the foundation of theoretical understanding.

### Basic Mathematical Framework

For ${subsectionTitle}, we consider the fundamental relationship:

$$f(x) = ax + b$$

Where:
- $a$ represents the coefficient
- $b$ represents the constant term
- $x$ represents the variable

### Advanced Mathematical Relationships

More complex relationships in ${subsectionTitle} can be expressed as:

$$\\sum_{i=1}^{n} f(x_i) = \\int_{a}^{b} f(x) dx$$

This integral relationship demonstrates the connection between discrete and continuous mathematical representations.

## Mathematical Analysis

The mathematical framework provides the foundation for understanding the theoretical principles and practical applications of ${subsectionTitle}.`,
          keyTakeaway: `Mathematical equations provide the quantitative foundation for understanding ${subsectionTitle}.`,
        },
        {
          pageNumber: 3,
          pageTitle: `${subsectionTitle} - Advanced Mathematical Models`,
          content: `# Advanced Mathematical Models for ${subsectionTitle}

## Complex Mathematical Relationships

Advanced studies of ${subsectionTitle} require understanding of sophisticated mathematical models and their derivations.

### Differential Equations

The dynamic behavior of systems related to ${subsectionTitle} can be modeled using differential equations:

$$\\frac{dy}{dx} = f(x, y)$$

### Matrix Representations

For multi-dimensional analysis, we use matrix notation:

$$\\mathbf{A} = \\begin{pmatrix}
a_{11} & a_{12} & \\cdots & a_{1n} \\\\
a_{21} & a_{22} & \\cdots & a_{2n} \\\\
\\vdots & \\vdots & \\ddots & \\vdots \\\\
a_{m1} & a_{m2} & \\cdots & a_{mn}
\\end{pmatrix}$$

### Statistical Models

For probabilistic analysis in ${subsectionTitle}:

$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

This Bayesian framework is essential for understanding uncertainty and making predictions.

## Mathematical Derivations

Step-by-step derivations help students understand how these mathematical relationships are developed and applied in the context of ${subsectionTitle}.`,
          keyTakeaway: `Advanced mathematical models enable sophisticated analysis and prediction in ${subsectionTitle}.`,
        },
      ],
      summary: `Comprehensive academic study of ${subsectionTitle} within ${moduleContext}`,
      objectives: [
        `Understand the fundamental concepts of ${subsectionTitle}`,
        `Apply theoretical knowledge in practical contexts`,
      ],
      examples: [
        `Academic applications in ${subject}`,
        `Real-world relevance of ${subsectionTitle}`,
      ],
      resources: {
        books: [],
        courses: [],
        articles: [],
        videos: [],
        tools: [],
        websites: [],
        exercises: [],
      },
      visualizationSuggestions: {
        hasFlowcharts: false,
        hasComparisons: false,
        hasTimelines: false,
        hasFormulas: true,
        hasProcessSteps: false,
        hasCyclicalProcesses: false,
        hasHierarchies: false,
        hasRelationships: true,
        codeSimulationTopics: [],
        interactiveElements: [
          "Mathematical equation solvers",
          "Formula calculators",
        ],
      },
      beautifulSummaryElements: {
        keyInsights: [
          `${subsectionTitle} is fundamental to understanding ${subject}`,
        ],
        practicalApplications: [
          `Academic research in ${subject}`,
          `Professional applications`,
        ],
        whyItMatters: `Understanding ${subsectionTitle} is essential for academic and professional success in ${subject}`,
        careerRelevance: `Mastery of ${subsectionTitle} enhances career prospects in ${subject} fields`,
        difficultyLevel:
          academicLevel === "graduate" ? "Advanced" : "Intermediate",
        prerequisites: [`Basic understanding of ${subject}`],
        estimatedStudyTime: "2-3 hours",
      },
    };
  }
}

// Function to parse markdown content and identify subsections
function parseMarkdownToSubsections(markdownContent) {
  if (!markdownContent || typeof markdownContent !== "string") {
    return [];
  }

  const subsections = [];
  const lines = markdownContent.split("\n");
  let currentSubsection = null;

  lines.forEach((line) => {
    // Match ###, ####, etc. but NOT ##
    const match = line.match(/^(###+)\s+(.*)/);
    if (match) {
      if (currentSubsection) {
        subsections.push(currentSubsection);
      }
      currentSubsection = {
        title: match[2].trim(),
        content: "",
      };
    } else if (currentSubsection && !line.match(/^##\s+.*/)) {
      // Ignore module titles
      currentSubsection.content += line + "\n";
    }
  });

  if (currentSubsection) {
    subsections.push(currentSubsection);
  }

  return subsections.map((sub) => ({ ...sub, content: sub.content.trim() }));
}

export async function POST(request) {
  try {
    console.log(
      "🎓 Academic Courses: Generating detailed multipage content..."
    );

    const {
      courseId,
      moduleIndex,
      academicLevel = "undergraduate",
      subject = "General Studies",
      singleSubsection = false,
      subsectionTitle,
      moduleTitle,
    } = await request.json();

    // Handle individual subsection generation
    if (singleSubsection && subsectionTitle) {
      console.log(`🎯 Generating individual subsection: ${subsectionTitle}`);

      // Generate enhanced multipage content for the single subsection
      const enhancedContent = await generateAcademicMultipageContent(
        subsectionTitle,
        moduleTitle || "Academic Module",
        academicLevel,
        subject
      );

      // Debug: log any returned HTML snippets for verification
      try {
        const pagesForLog = Array.isArray(enhancedContent?.pages?.pages)
          ? enhancedContent.pages.pages
          : enhancedContent?.pages;
        if (Array.isArray(pagesForLog)) {
          pagesForLog.forEach((p, idx) => {
            if (p?.html) {
              console.log(
                `[HTML TEST][API] Single subsection page ${idx + 1} HTML:`,
                typeof p.html === 'string' ? p.html.slice(0, 400) : p.html
              );
            }
          });
        }
      } catch (e) {
        console.warn('[HTML TEST][API] Failed to log single subsection HTML:', e);
      }

      // Return minimal payload: title + pages (HTML ensured)
      const pagesNorm = Array.isArray(enhancedContent?.pages?.pages)
        ? enhancedContent.pages.pages
        : enhancedContent?.pages || [];
      const academicContent = {
        title: subsectionTitle,
        pages: ensureHtmlOnPages(pagesNorm),
      };

      console.log(
        `✅ Generated ${
          enhancedContent.pages?.length || 0
        } pages for individual subsection: ${subsectionTitle}`
      );

      return NextResponse.json({
        success: true,
        content: academicContent,
        message: `Generated ${
          enhancedContent.pages?.length || 0
        } pages of enhanced academic content for "${subsectionTitle}"`,
      });
    }

    if (!courseId || moduleIndex === undefined) {
      return NextResponse.json(
        { error: "Course ID and module index are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("llmfied");
    const coursesCollection = db.collection("courses");

    // Find the course
    const course = await coursesCollection.findOne({
      _id: new ObjectId(courseId),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    console.log(`🔍 Processing module: ${module.title}`);
    console.log(`📚 Academic Level: ${academicLevel}, Subject: ${subject}`);

    // Parse the module content to identify subsections
    const subsections = parseMarkdownToSubsections(module.content);
    console.log(`📋 Found ${subsections.length} subsections to process`);

    if (subsections.length === 0) {
      return NextResponse.json(
        { error: "No subsections found in module content" },
        { status: 400 }
      );
    }

    // Generate multipage content for each subsection
    const detailedSubsections = [];

    for (let i = 0; i < subsections.length; i++) {
      const subsection = subsections[i];
      console.log(`📖 Generating pages for: ${subsection.title}`);

      // Generate multipage content using AI
      const pages = await generateAcademicMultipageContent(
        subsection.title,
        module.title,
        academicLevel,
        subject
      );

      // Debug: log any HTML snippets for verification
      try {
        const pagesForLog = Array.isArray(pages?.pages) ? pages.pages : pages;
        if (Array.isArray(pagesForLog)) {
          pagesForLog.forEach((p, pIdx) => {
            if (p?.html) {
              console.log(
                `[HTML TEST][API] Subsection '${subsection.title}' page ${pIdx + 1} HTML:`,
                typeof p.html === 'string' ? p.html.slice(0, 400) : p.html
              );
            }
          });
        }
      } catch (e) {
        console.warn('[HTML TEST][API] Failed to log bulk subsection HTML:', e);
      }

      const detailedSubsection = {
        title: subsection.title,
        pages: ensureHtmlOnPages(Array.isArray(pages?.pages) ? pages.pages : pages),
      };

      detailedSubsections.push(detailedSubsection);
      console.log(
        `✅ Generated ${(Array.isArray(pages.pages) ? pages.pages : pages).length} pages for: ${subsection.title}`
      );
    }

    // Update the module with detailed subsections
    const updateResult = await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      {
        $set: {
          [`modules.${moduleIndex}.detailedSubsections`]: detailedSubsections,
          [`modules.${moduleIndex}.hasDetailedContent`]: true,
          [`modules.${moduleIndex}.lastUpdated`]: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    console.log(
      `✅ Successfully generated detailed content for ${detailedSubsections.length} subsections`
    );

    return NextResponse.json({
      success: true,
      detailedSubsections,
      message: `Generated ${detailedSubsections.length} detailed subsections with multipage content`,
    });
  } catch (error) {
    console.error("❌ Error generating detailed content:", error);
    return NextResponse.json(
      { error: "Failed to generate detailed content", details: error.message },
      { status: 500 }
    );
  }
}
