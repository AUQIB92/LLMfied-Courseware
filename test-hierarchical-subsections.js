// Test script to demonstrate hierarchical subsection generation from module content
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://auqib:arwaa123@cluster0.gjsxg.mongodb.net/llmfied?retryWrites=true&w=majority&appName=Cluster0";

// Helper function to parse markdown hierarchy from module content
function parseModuleContentHierarchy(content) {
  if (!content) return [];
  
  const lines = content.split('\n');
  const hierarchy = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || [''])[0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      
      if (text && level >= 3) { // Only process ### and deeper for detailed subsections
        hierarchy.push({
          level,
          text,
          raw: trimmed,
          children: []
        });
      }
    }
  }
  
  return hierarchy;
}

// Helper function to build hierarchical structure from flat markdown items
function buildHierarchicalStructure(flatItems) {
  const result = [];
  const stack = [];
  
  for (const item of flatItems) {
    // Remove items from stack that are at same or deeper level
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    
    // Add to parent if exists, otherwise to root
    if (stack.length > 0) {
      stack[stack.length - 1].children = stack[stack.length - 1].children || [];
      stack[stack.length - 1].children.push(item);
    } else {
      result.push(item);
    }
    
    stack.push(item);
  }
  
  return result;
}

// Helper function to generate detailed subsections from hierarchical structure
function generateDetailedSubsectionsFromHierarchy(hierarchicalStructure, moduleTitle, examType, learnerLevel) {
  const detailedSubsections = [];
  
  function processNode(node, parentPath = "", depth = 0) {
    const currentPath = parentPath ? `${parentPath} > ${node.text}` : node.text;
    
    // Create detailed subsection for this node
    const subsection = {
      title: node.text,
      hierarchyLevel: node.level,
      hierarchyPath: currentPath,
      summary: `Comprehensive coverage of ${node.text} in the context of ${moduleTitle} for ${examType} examination`,
      keyPoints: [
        `Understanding core concepts of ${node.text}`,
        `Practical applications and exam strategies`,
        `Speed-solving techniques and shortcuts`,
        `Common traps and error prevention methods`
      ],
      pages: generateHierarchicalMultipageContent(node.text, moduleTitle, examType, node.level, learnerLevel),
      practicalExample: `Real ${examType} exam problem demonstrating ${node.text} concepts`,
      commonPitfalls: [
        `Common misconceptions about ${node.text}`,
        "Time management issues during problem-solving",
        "Calculation errors and prevention strategies"
      ],
      difficulty: node.level === 3 ? "Intermediate" : "Advanced",
      estimatedTime: node.level === 3 ? "25-30 minutes" : "15-20 minutes",
      examRelevance: `How ${node.text} specifically helps with ${examType} exam success`,
      hasChildren: node.children && node.children.length > 0,
      childrenCount: node.children ? node.children.length : 0,
      hierarchyDepth: depth
    };
    
    detailedSubsections.push(subsection);
    
    // Process children recursively
    if (node.children) {
      for (const child of node.children) {
        processNode(child, currentPath, depth + 1);
      }
    }
  }
  
  for (const rootNode of hierarchicalStructure) {
    processNode(rootNode);
  }
  
  return detailedSubsections;
}

// Helper function to generate multipage content based on hierarchy level
function generateHierarchicalMultipageContent(title, moduleContext, examType, hierarchyLevel, learnerLevel) {
  const pages = [
    {
      pageNumber: 1,
      pageTitle: "Introduction & Foundation",
      content: `# ${title} - Introduction & Foundation

## Understanding ${title}

${title} is a crucial concept in ${moduleContext} for ${examType} examination success. This topic forms the foundation for advanced problem-solving and appears frequently in competitive exam patterns.

## Key Definitions and Context

- **Core Concept**: The fundamental principle underlying ${title}
- **Exam Relevance**: Why this topic is essential for ${examType} success
- **Application Scope**: How this concept applies in various question types

## Learning Objectives

By mastering this section, you will:
1. Define and explain ${title} with clarity
2. Identify key components and relationships
3. Apply speed-solving techniques effectively
4. Avoid common traps and mistakes

## Foundation Building

This topic connects to other important concepts in ${moduleContext} and serves as a stepping stone for more advanced topics. Understanding the hierarchy and relationships is crucial for ${examType} exam success.`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "definition",
          title: `Fundamental Definition of ${title}`,
          content: `Basic mathematical or conceptual framework for ${title}`,
          explanation: `Step-by-step explanation of the core concept`,
          example: `Simple example demonstrating the basic principle`
        }
      ],
      keyTakeaway: `${title} is a foundational concept requiring solid understanding of basic principles and exam-specific applications.`
    }
  ];
  
  // Add more pages based on hierarchy level
  if (hierarchyLevel === 3) {
    // Main sections get comprehensive treatment (8 pages)
    pages.push(
      {
        pageNumber: 2,
        pageTitle: "Core Theory & Principles - Part 1",
        content: `# ${title} - Core Theory & Principles (Part 1)

## Fundamental Theoretical Framework

The theoretical foundation of ${title} encompasses several key principles essential for ${examType} examination success.

### Primary Concepts
1. **Basic Structure**: Understanding the fundamental framework
2. **Key Components**: Identifying essential elements and their roles
3. **Relationships**: How different parts interact and influence each other

### Theoretical Foundations
- **Core Theory**: The underlying theoretical basis
- **Supporting Principles**: Related concepts that reinforce understanding
- **Interconnections**: Links to other topics in ${moduleContext}

## Exam-Specific Understanding

For ${examType} success, focus on how these principles translate to quick problem identification and efficient solution strategies.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "principle",
            title: `Core Theoretical Principle of ${title}`,
            content: `Mathematical or logical principle governing ${title}`,
            explanation: `Detailed theoretical explanation with derivation`,
            example: `Complex example showing principle application`
          }
        ],
        keyTakeaway: `Master the fundamental principles and theoretical framework that govern ${title} for ${examType} success.`
      },
      {
        pageNumber: 3,
        pageTitle: "Core Theory & Principles - Part 2",
        content: `# ${title} - Core Theory & Principles (Part 2)

## Advanced Theoretical Concepts

Building on Part 1, we explore more sophisticated aspects of ${title} for ${examType} examination mastery.

### Advanced Principles
- **Complex Interactions**: How multiple components work together
- **System Behavior**: Understanding overall performance patterns
- **Optimization Strategies**: Methods to improve efficiency and accuracy

### Deeper Analysis Techniques
1. **Analytical Approach**: Breaking down complex problems systematically
2. **Strategic Thinking**: Approaching problems with exam-focused methodology
3. **Critical Evaluation**: Assessing different solution approaches

## Integration with Exam Strategy

${title} connects with other important topics in ${moduleContext}, creating a comprehensive framework for ${examType} success.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "advanced",
            title: `Advanced Application of ${title}`,
            content: `Complex mathematical relationship or advanced concept`,
            explanation: `Detailed explanation of advanced theoretical aspects`,
            example: `Sophisticated example requiring deep understanding`
          }
        ],
        keyTakeaway: `Advanced theoretical understanding enables efficient problem-solving in ${examType} exam scenarios.`
      },
      {
        pageNumber: 4,
        pageTitle: "Essential Formulas & Derivations",
        content: `# ${title} - Essential Formulas & Derivations

## Key Formulas for ${examType} Success

### Primary Formulas
1. **Formula 1**: Core calculation method with step-by-step derivation
2. **Formula 2**: Advanced formula with practical applications
3. **Formula 3**: Shortcut formula for time-saving in exams

### Memory Techniques and Shortcuts

For ${examType} exam success:
- Mnemonic devices for formula recall
- Pattern recognition techniques
- Quick verification methods
- Common mistake prevention`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "formula",
            title: `Essential Formula for ${title}`,
            content: `Key mathematical formula with proper notation`,
            explanation: `Complete derivation with step-by-step process`,
            example: `Numerical example with exam-style application`
          }
        ],
        keyTakeaway: `Master essential formulas, derivations, and shortcuts for efficient problem-solving in ${title}.`
      },
      {
        pageNumber: 5,
        pageTitle: "Concept Applications & Examples",
        content: `# ${title} - Concept Applications & Examples

## Real-World Applications in ${examType} Context

${title} appears in various ${examType} exam scenarios with different complexity levels.

### Application Type 1: Direct Problems
- **Context**: Straightforward application of concepts
- **Strategy**: Quick identification and solution approach

### Application Type 2: Complex Scenarios
- **Context**: Multi-step problems requiring integration
- **Strategy**: Breaking down complex problems systematically

### Detailed Worked Examples

Complete step-by-step solutions with timing and strategic insights for ${examType} exam success.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "application",
            title: `Practical Application of ${title}`,
            content: `Real exam problem demonstrating concept use`,
            explanation: `Complete solution with strategic approach`,
            example: `Additional practice problem with solution`
          }
        ],
        keyTakeaway: `Practical applications demonstrate effective use of ${title} concepts in ${examType} exam conditions.`
      },
      {
        pageNumber: 6,
        pageTitle: "Exam Strategies & Speed Techniques",
        content: `# ${title} - Exam Strategies & Speed Techniques

## Time-Saving Strategies for ${examType}

### Quick Recognition Patterns
- **Pattern 1**: Instant identification of ${title} questions
- **Pattern 2**: Common question formats and structures
- **Pattern 3**: Key words and phrases that signal approach

### Speed Calculation Methods
1. **Method 1**: Rapid estimation techniques for quick answers
2. **Method 2**: Mental math shortcuts specific to ${title}
3. **Method 3**: Elimination strategies for multiple choice

## ${examType} Exam-Specific Tips

Strategic approach for optimal performance in ${title} questions.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "strategy",
            title: `Speed Technique for ${title} in ${examType}`,
            content: `Quick calculation method or shortcut`,
            explanation: `How to apply this technique under exam pressure`,
            example: `Practice problem with timing and strategy notes`
          }
        ],
        keyTakeaway: `Efficient exam strategies and speed techniques maximize performance in ${title} questions during ${examType}.`
      },
      {
        pageNumber: 7,
        pageTitle: "Common Traps & Error Prevention",
        content: `# ${title} - Common Traps & Error Prevention

## Typical Mistakes in ${examType} Exams

### Mistake Category 1: Conceptual Errors
- **Common Error**: Fundamental misunderstanding of ${title}
- **Prevention**: Systematic concept building and verification

### Mistake Category 2: Calculation Errors
- **Common Error**: Arithmetic mistakes in ${title} problems
- **Prevention**: Double-checking methods and estimation

### ${examType} Exam Traps to Avoid

Systematic approach to identify and avoid common traps in ${title} questions.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "trap",
            title: `Common ${examType} Exam Trap in ${title}`,
            content: `Typical trap question or misleading scenario`,
            explanation: `How to identify and avoid this specific trap`,
            example: `Example showing both trap and correct approach`
          }
        ],
        keyTakeaway: `Systematic error prevention and trap awareness significantly improve accuracy in ${title} questions.`
      },
      {
        pageNumber: 8,
        pageTitle: "Key Takeaways & Exam Readiness",
        content: `# ${title} - Key Takeaways & Exam Readiness

## Essential Points Summary for ${examType}

### Must-Know Concepts
1. **Core Concept 1**: Brief but complete explanation with exam relevance
2. **Core Concept 2**: Essential understanding required for success
3. **Core Concept 3**: Critical knowledge for competitive advantage

### ${examType} Exam Preparation Checklist

Complete preparation verification for ${title} mastery and exam readiness.

## Final Confidence Statement

You are now fully prepared to excel in ${title} questions on your ${examType} exam!`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "mastery",
            title: `Final Mastery Challenge for ${title}`,
            content: `Comprehensive exam-level problem integrating all concepts`,
            explanation: `Complete solution demonstrating mastery with exam strategy`,
            example: `Additional challenge problem for confidence building`
          }
        ],
        keyTakeaway: `Complete mastery of ${title} achieved through systematic review and confident exam readiness for ${examType} success.`
      }
    );
  } else {
    // Subsections get focused approach (6 pages)
    pages.push(
      {
        pageNumber: 2,
        pageTitle: "Core Concepts & Theory",
        content: `# ${title} - Core Concepts & Theory

## Fundamental Understanding

Essential theoretical foundation of ${title} for ${examType} examination success.

### Key Principles
- **Principle 1**: Core concept explanation
- **Principle 2**: Supporting theory
- **Principle 3**: Application framework

## Exam Context

How ${title} fits within the broader ${moduleContext} framework for ${examType} success.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "concept",
            title: `Core Concept of ${title}`,
            content: `Essential mathematical or logical framework`,
            explanation: `Clear explanation with exam focus`,
            example: `Practical example for understanding`
          }
        ],
        keyTakeaway: `Solid understanding of core concepts in ${title} for ${examType} exam application.`
      },
      {
        pageNumber: 3,
        pageTitle: "Practical Applications",
        content: `# ${title} - Practical Applications

## Application in ${examType} Context

How ${title} appears in actual exam questions and problem-solving scenarios.

### Common Question Types
- **Type 1**: Direct application questions
- **Type 2**: Integrated problem scenarios
- **Type 3**: Complex multi-step problems

## Solution Strategies

Effective approaches for ${title} questions in ${examType} examination.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "application",
            title: `${title} Application Example`,
            content: `Practical problem demonstrating concept use`,
            explanation: `Step-by-step solution approach`,
            example: `Additional practice scenario`
          }
        ],
        keyTakeaway: `Practical application skills in ${title} for effective ${examType} exam performance.`
      },
      {
        pageNumber: 4,
        pageTitle: "Exam Strategies & Speed Techniques",
        content: `# ${title} - Exam Strategies & Speed Techniques

## Quick Problem-Solving for ${examType}

### Recognition Patterns
- **Pattern 1**: How to instantly identify ${title} questions
- **Pattern 2**: Common formats and question structures
- **Pattern 3**: Key indicators and solution triggers

### Speed Methods
Rapid calculation techniques and shortcuts specific to ${title} for ${examType} success.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "technique",
            title: `Speed Technique for ${title}`,
            content: `Quick solution method for exam conditions`,
            explanation: `How to apply rapidly under time pressure`,
            example: `Practice problem with timing notes`
          }
        ],
        keyTakeaway: `Efficient strategies and speed techniques optimize performance in ${title} questions during ${examType}.`
      },
      {
        pageNumber: 5,
        pageTitle: "Common Traps & Error Prevention",
        content: `# ${title} - Common Traps & Error Prevention

## Frequent Mistakes in ${title}

### Error Prevention Strategies
- **Error Type 1**: Conceptual confusion and prevention
- **Error Type 2**: Calculation mistakes and verification
- **Error Type 3**: Method selection and optimization

## ${examType} Exam Traps

Common traps specific to ${title} questions and how to avoid them.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "prevention",
            title: `Error Prevention in ${title}`,
            content: `Common mistake and correct approach`,
            explanation: `How to identify and avoid this error`,
            example: `Example showing both wrong and right methods`
          }
        ],
        keyTakeaway: `Systematic error prevention and awareness significantly improve accuracy in ${title} questions.`
      },
      {
        pageNumber: 6,
        pageTitle: "Key Takeaways & Integration",
        content: `# ${title} - Key Takeaways & Integration

## Essential Points for ${examType} Success

### Core Understanding
- **Main Concept**: Key principle with exam application
- **Primary Method**: Most important solution technique
- **Critical Connection**: How this links to broader topics

## Integration with ${moduleContext}

How ${title} supports and connects with other topics for comprehensive ${examType} exam preparation.

## Mastery Confirmation

Complete understanding of ${title} and its role in ${examType} exam success.`,
        codeExamples: [],
        mathematicalContent: [
          {
            type: "integration",
            title: `${title} Integration Challenge`,
            content: `Problem combining ${title} with other concepts`,
            explanation: `Solution showing integration with broader topics`,
            example: `Additional integration practice problem`
          }
        ],
        keyTakeaway: `Complete understanding of ${title} and its integration within ${moduleContext} for ${examType} exam success.`
      }
    );
  }
  
  return pages;
}

async function main() {
  console.log("Testing hierarchical subsection generation...");
  console.log("Connecting to MongoDB...");
  
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("llmfied");
    const coursesCollection = db.collection("courses");

    // Find the ExamGenius course
    const course = await coursesCollection.findOne({ 
      $or: [{ isExamGenius: true }, { isCompetitiveExam: true }] 
    });

    if (!course) {
      console.log("No ExamGenius course found");
      return;
    }

    console.log(`\nTesting with course: ${course.title}`);
    console.log(`Course ID: ${course._id}`);

    // Test with the first module that has content
    const moduleWithContent = course.modules.find(module => module.content && module.content.trim().length > 0);
    
    if (!moduleWithContent) {
      console.log("No module with content found");
      return;
    }

    console.log(`\nTesting with module: ${moduleWithContent.title}`);
    console.log(`Content length: ${moduleWithContent.content.length} characters`);

    // Parse the markdown hierarchy
    console.log(`\n=== PARSING MARKDOWN HIERARCHY ===`);
    const flatHierarchy = parseModuleContentHierarchy(moduleWithContent.content);
    console.log(`Found ${flatHierarchy.length} hierarchical items:`);
    
    flatHierarchy.forEach((item, index) => {
      const indent = '  '.repeat(item.level - 3);
      console.log(`${index + 1}. ${indent}${item.raw}`);
    });

    // Build hierarchical structure
    console.log(`\n=== BUILDING HIERARCHICAL STRUCTURE ===`);
    const hierarchicalStructure = buildHierarchicalStructure(flatHierarchy);
    console.log(`Organized into ${hierarchicalStructure.length} main sections:`);
    
    function displayHierarchy(nodes, indent = "") {
      for (const node of nodes) {
        console.log(`${indent}${node.level === 3 ? '📚' : '📖'} ${node.text} (Level ${node.level})`);
        if (node.children && node.children.length > 0) {
          displayHierarchy(node.children, indent + "  ");
        }
      }
    }
    
    displayHierarchy(hierarchicalStructure);

    // Generate detailed subsections from hierarchy
    console.log(`\n=== GENERATING DETAILED SUBSECTIONS ===`);
    const detailedSubsections = generateDetailedSubsectionsFromHierarchy(
      hierarchicalStructure, 
      moduleWithContent.title, 
      course.examType || "Computer Proficiency",
      "intermediate"
    );
    
    console.log(`Generated ${detailedSubsections.length} detailed subsections:`);
    detailedSubsections.forEach((subsection, index) => {
      const indent = "  ".repeat(subsection.hierarchyDepth);
      console.log(`${indent}${index + 1}. ${subsection.title}`);
      console.log(`${indent}   - Level: ${subsection.hierarchyLevel}`);
      console.log(`${indent}   - Pages: ${subsection.pages.length}`);
      console.log(`${indent}   - Path: ${subsection.hierarchyPath}`);
      console.log(`${indent}   - Children: ${subsection.childrenCount}`);
      console.log(`${indent}   - Time: ${subsection.estimatedTime}`);
      
      // Show page titles
      if (subsection.pages.length > 0) {
        console.log(`${indent}   - Page Titles:`);
        subsection.pages.forEach((page, pageIndex) => {
          console.log(`${indent}     ${pageIndex + 1}. ${page.pageTitle}`);
        });
      }
      console.log('');
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Successfully generated hierarchical detailed subsections!`);
    console.log(`   Total subsections: ${detailedSubsections.length}`);
    console.log(`   Total pages: ${detailedSubsections.reduce((sum, sub) => sum + sub.pages.length, 0)}`);
    console.log(`   Hierarchy levels: ${Math.min(...detailedSubsections.map(s => s.hierarchyLevel))} to ${Math.max(...detailedSubsections.map(s => s.hierarchyLevel))}`);
    console.log(`   Main sections: ${detailedSubsections.filter(s => s.hierarchyLevel === 3).length}`);
    console.log(`   Subsections: ${detailedSubsections.filter(s => s.hierarchyLevel > 3).length}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

main().catch(console.error);