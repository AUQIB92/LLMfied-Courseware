// Script to analyze module content markdown hierarchy and generate structured detailed subsections
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://auqib:arwaa123@cluster0.gjsxg.mongodb.net/llmfied?retryWrites=true&w=majority&appName=Cluster0";

function parseMarkdownHierarchy(content) {
  if (!content) return [];
  
  const lines = content.split('\n');
  const hierarchy = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || [''])[0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      
      if (text && level >= 3) { // Only process ### and deeper
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
      stack[stack.length - 1].children.push(item);
    } else {
      result.push(item);
    }
    
    stack.push(item);
  }
  
  return result;
}

function generateDetailedSubsectionsFromHierarchy(hierarchicalStructure, moduleTitle, examType = "Computer Proficiency") {
  const detailedSubsections = [];
  
  function processNode(node, parentPath = "") {
    const currentPath = parentPath ? `${parentPath} > ${node.text}` : node.text;
    
    // Create detailed subsection for this node
    const subsection = {
      title: node.text,
      hierarchyLevel: node.level,
      hierarchyPath: currentPath,
      summary: `Comprehensive coverage of ${node.text} in the context of ${moduleTitle}`,
      keyPoints: [
        `Understanding core concepts of ${node.text}`,
        `Practical applications and examples`,
        `Common challenges and solutions`,
        `Exam-specific strategies and shortcuts`
      ],
      pages: generateMultipageContent(node.text, moduleTitle, examType, node.level),
      practicalExample: `Real-world application of ${node.text} in ${examType} context`,
      commonPitfalls: [
        `Common misconceptions about ${node.text}`,
        "Time management issues during problem-solving",
        "Calculation errors and how to avoid them"
      ],
      difficulty: node.level === 3 ? "Intermediate" : "Advanced",
      estimatedTime: node.level === 3 ? "25-30 minutes" : "15-20 minutes",
      hasChildren: node.children.length > 0,
      childrenCount: node.children.length
    };
    
    detailedSubsections.push(subsection);
    
    // Process children recursively
    for (const child of node.children) {
      processNode(child, currentPath);
    }
  }
  
  for (const rootNode of hierarchicalStructure) {
    processNode(rootNode);
  }
  
  return detailedSubsections;
}

function generateMultipageContent(title, moduleContext, examType, hierarchyLevel) {
  const pageCount = hierarchyLevel === 3 ? 8 : 6; // Main sections get 8 pages, subsections get 6
  
  const pages = [
    {
      pageNumber: 1,
      pageTitle: "Introduction & Foundation",
      content: `# ${title} - Introduction & Foundation

## What is ${title}?

${title} is a fundamental concept in ${moduleContext}. Understanding this topic is crucial for ${examType} examinations as it forms the foundation for more advanced concepts.

## Key Definitions

- **Core Concept**: The basic principle underlying ${title}
- **Application**: How this concept is used in real-world scenarios
- **Importance**: Why this topic is essential for ${examType} exam success

## Learning Objectives

By the end of this section, you will be able to:
1. Define and explain ${title}
2. Identify key components and characteristics
3. Understand the practical applications
4. Apply this knowledge in exam scenarios

## Context and Background

This topic builds upon previous knowledge and connects to other important concepts in ${moduleContext}. It's particularly relevant for competitive exams because it appears frequently in question patterns and requires both conceptual understanding and practical application skills.`,
      keyTakeaway: `${title} is a foundational concept that requires solid understanding of basic principles and definitions.`
    },
    {
      pageNumber: 2,
      pageTitle: "Core Theory & Principles - Part 1",
      content: `# ${title} - Core Theory & Principles (Part 1)

## Fundamental Principles

The core principles of ${title} include:

### Primary Concepts
1. **Basic Structure**: Understanding the fundamental structure
2. **Key Components**: Identifying essential elements
3. **Relationships**: How different parts interact

### Theoretical Framework
- **Foundation Theory**: The underlying theoretical basis
- **Supporting Concepts**: Related ideas that support the main concept
- **Interconnections**: How this connects to other topics

## Detailed Explanation

${title} operates on several key principles:

1. **Principle 1**: Detailed explanation of the first key principle
2. **Principle 2**: Comprehensive coverage of the second principle
3. **Principle 3**: In-depth analysis of the third principle

## Visual Understanding

Think of ${title} as a system where each component plays a specific role in achieving the overall objective. Understanding these relationships is crucial for mastering the concept.`,
      keyTakeaway: `Master the fundamental principles and theoretical framework that govern ${title}.`
    },
    {
      pageNumber: 3,
      pageTitle: "Core Theory & Principles - Part 2",
      content: `# ${title} - Core Theory & Principles (Part 2)

## Advanced Theoretical Concepts

Building on the foundation from Part 1, we now explore more complex aspects:

### Advanced Principles
- **Complex Interactions**: How multiple components work together
- **System Behavior**: Understanding overall system performance
- **Optimization**: Methods to improve efficiency and effectiveness

### Deeper Analysis
1. **Analytical Approach**: Breaking down complex problems
2. **Systematic Thinking**: Approaching problems methodically
3. **Critical Evaluation**: Assessing different solutions

## Practical Implications

The theoretical concepts translate to practical applications in:
- Real-world scenarios
- Exam problem-solving
- Professional environments

## Integration with Other Topics

${title} connects with other important topics in ${moduleContext}, creating a comprehensive understanding framework that enhances overall learning and application.`,
      keyTakeaway: `Advanced theoretical understanding enables practical application and problem-solving in complex scenarios.`
    }
  ];
  
  // Add more pages based on hierarchy level
  if (hierarchyLevel === 3) {
    // Main sections get full 8-page treatment
    pages.push(
      {
        pageNumber: 4,
        pageTitle: "Essential Formulas & Key Points",
        content: `# ${title} - Essential Formulas & Key Points

## Key Formulas and Rules

### Primary Formulas
1. **Formula 1**: Basic calculation method
   - When to use: Specific scenarios
   - Example: Practical application

2. **Formula 2**: Advanced calculation
   - Application: Complex problems
   - Tips: Memory aids and shortcuts

### Important Rules
- **Rule 1**: Fundamental guideline
- **Rule 2**: Exception handling
- **Rule 3**: Best practices

## Step-by-Step Procedures

### Standard Procedure
1. **Step 1**: Initial assessment
2. **Step 2**: Data collection
3. **Step 3**: Analysis and calculation
4. **Step 4**: Verification and conclusion

## Quick Reference Guide

For exam preparation, remember these key points:
- Essential facts to memorize
- Common patterns to recognize
- Typical question formats`,
        keyTakeaway: `Master essential formulas, rules, and procedures for efficient problem-solving in ${title}.`
      },
      {
        pageNumber: 5,
        pageTitle: "Concept Applications & Examples",
        content: `# ${title} - Concept Applications & Examples

## Real-World Applications

${title} is applied in various real-world scenarios:

### Application 1: Professional Environment
- **Context**: Where this is used professionally
- **Example**: Specific real-world example
- **Benefits**: Why this application is important

### Application 2: Daily Life
- **Context**: How this appears in everyday situations
- **Example**: Relatable example
- **Relevance**: Connection to exam topics

## Detailed Examples

### Example 1: Basic Application
**Problem**: Sample problem statement
**Solution**: Step-by-step solution
**Explanation**: Why this approach works

### Example 2: Intermediate Application
**Problem**: More complex scenario
**Solution**: Detailed solution process
**Analysis**: Key insights and learning points

### Example 3: Advanced Application
**Problem**: Complex real-world scenario
**Solution**: Comprehensive solution approach
**Takeaways**: Important lessons learned`,
        keyTakeaway: `Practical applications and examples demonstrate how ${title} concepts work in real scenarios.`
      },
      {
        pageNumber: 6,
        pageTitle: "Exam Strategies & Speed Techniques",
        content: `# ${title} - Exam Strategies & Speed Techniques

## Time-Saving Strategies

### Quick Recognition Patterns
- **Pattern 1**: How to quickly identify this type of question
- **Pattern 2**: Common question formats and structures
- **Pattern 3**: Key words and phrases to look for

### Speed Calculation Methods
1. **Method 1**: Rapid estimation techniques
2. **Method 2**: Mental math shortcuts
3. **Method 3**: Elimination strategies

## Memory Techniques

### Mnemonics
- **Acronym**: Easy-to-remember acronym for key points
- **Visual Memory**: Mental images to remember concepts
- **Association**: Connecting to familiar concepts

### Quick Recall Methods
- Essential facts to memorize
- Formula shortcuts
- Common mistake patterns to avoid

## Exam-Specific Tips

For ${examType} exams:
- Typical question difficulty levels
- Time allocation strategies
- Priority topics within ${title}`,
        keyTakeaway: `Efficient exam strategies and speed techniques maximize performance in ${title} questions.`
      },
      {
        pageNumber: 7,
        pageTitle: "Common Traps & Error Prevention",
        content: `# ${title} - Common Traps & Error Prevention

## Typical Mistakes Students Make

### Mistake 1: Conceptual Confusion
- **What happens**: Common misunderstanding
- **Why it happens**: Root cause of confusion
- **How to avoid**: Prevention strategy

### Mistake 2: Calculation Errors
- **Common error**: Typical calculation mistake
- **Impact**: How this affects the answer
- **Prevention**: Double-checking methods

### Mistake 3: Application Errors
- **Wrong application**: Misapplying concepts
- **Consequences**: What goes wrong
- **Correct approach**: Right way to handle it

## Exam Traps to Watch For

### Trap 1: Misleading Information
- **How it appears**: Deceptive question format
- **Recognition**: Warning signs to look for
- **Response**: How to handle these questions

### Trap 2: Time Pressure Mistakes
- **Pressure point**: Where students rush and make errors
- **Prevention**: Time management strategies
- **Recovery**: How to catch and correct mistakes

## Error Prevention Checklist

Before submitting answers:
- [ ] Check calculations
- [ ] Verify concept application
- [ ] Review answer reasonableness
- [ ] Confirm units and format`,
        keyTakeaway: `Awareness of common traps and systematic error prevention significantly improves exam performance.`
      },
      {
        pageNumber: 8,
        pageTitle: "Key Takeaways & Exam Readiness",
        content: `# ${title} - Key Takeaways & Exam Readiness

## Essential Points Summary

### Must-Know Concepts
1. **Core Concept 1**: Brief but complete explanation
2. **Core Concept 2**: Essential understanding required
3. **Core Concept 3**: Critical knowledge for exams

### Key Formulas and Rules
- **Formula 1**: When and how to use
- **Formula 2**: Application scenarios
- **Rule 1**: Important guideline to remember

## Quick Revision Notes

### 5-Minute Review
- Main concept definition
- Key applications
- Common question types
- Essential formulas

### Last-Minute Tips
- Most important points to remember
- Common mistakes to avoid
- Time-saving shortcuts
- Confidence boosters

## Exam Preparation Checklist

### Knowledge Check
- [ ] Can explain ${title} clearly
- [ ] Know all essential formulas
- [ ] Understand practical applications
- [ ] Can solve typical problems quickly

### Practice Recommendations
- Solve 10-15 practice questions
- Time yourself on problem-solving
- Review common mistakes
- Practice speed techniques

## Final Confidence Builder

You're now ready to tackle ${title} questions with confidence! Remember the key strategies, avoid common traps, and apply the speed techniques you've learned.`,
        keyTakeaway: `Complete mastery of ${title} through systematic review, practice, and confidence-building preparation.`
      }
    );
  } else {
    // Subsections get 6 pages (skip formulas and applications pages)
    pages.push(
      {
        pageNumber: 4,
        pageTitle: "Exam Strategies & Speed Techniques",
        content: `# ${title} - Exam Strategies & Speed Techniques

## Time-Saving Strategies

### Quick Recognition Patterns
- **Pattern 1**: How to quickly identify this type of question
- **Pattern 2**: Common question formats and structures
- **Pattern 3**: Key words and phrases to look for

### Speed Calculation Methods
1. **Method 1**: Rapid estimation techniques
2. **Method 2**: Mental math shortcuts
3. **Method 3**: Elimination strategies

## Memory Techniques

### Mnemonics
- **Acronym**: Easy-to-remember acronym for key points
- **Visual Memory**: Mental images to remember concepts
- **Association**: Connecting to familiar concepts

### Quick Recall Methods
- Essential facts to memorize
- Formula shortcuts
- Common mistake patterns to avoid

## Exam-Specific Tips

For ${examType} exams:
- Typical question difficulty levels
- Time allocation strategies
- Priority topics within ${title}`,
        keyTakeaway: `Efficient exam strategies and speed techniques maximize performance in ${title} questions.`
      },
      {
        pageNumber: 5,
        pageTitle: "Common Traps & Error Prevention",
        content: `# ${title} - Common Traps & Error Prevention

## Typical Mistakes Students Make

### Mistake 1: Conceptual Confusion
- **What happens**: Common misunderstanding
- **Why it happens**: Root cause of confusion
- **How to avoid**: Prevention strategy

### Mistake 2: Calculation Errors
- **Common error**: Typical calculation mistake
- **Impact**: How this affects the answer
- **Prevention**: Double-checking methods

### Mistake 3: Application Errors
- **Wrong application**: Misapplying concepts
- **Consequences**: What goes wrong
- **Correct approach**: Right way to handle it

## Exam Traps to Watch For

### Trap 1: Misleading Information
- **How it appears**: Deceptive question format
- **Recognition**: Warning signs to look for
- **Response**: How to handle these questions

### Trap 2: Time Pressure Mistakes
- **Pressure point**: Where students rush and make errors
- **Prevention**: Time management strategies
- **Recovery**: How to catch and correct mistakes

## Error Prevention Checklist

Before submitting answers:
- [ ] Check calculations
- [ ] Verify concept application
- [ ] Review answer reasonableness
- [ ] Confirm units and format`,
        keyTakeaway: `Awareness of common traps and systematic error prevention significantly improves exam performance.`
      },
      {
        pageNumber: 6,
        pageTitle: "Key Takeaways & Mastery",
        content: `# ${title} - Key Takeaways & Mastery

## Essential Points Summary

### Must-Know Concepts
1. **Core Concept 1**: Brief but complete explanation
2. **Core Concept 2**: Essential understanding required
3. **Core Concept 3**: Critical knowledge for exams

### Key Applications
- **Application 1**: Primary use case
- **Application 2**: Secondary application
- **Connection**: How this relates to broader topics

## Quick Revision Notes

### 3-Minute Review
- Main concept definition
- Key applications
- Common question types
- Essential points

### Practice Recommendations
- Solve 5-8 practice questions
- Review connection to main topics
- Practice speed techniques
- Understand relationship to other concepts

## Mastery Confirmation

You've mastered ${title} when you can:
- [ ] Explain the concept clearly
- [ ] Apply it in different contexts
- [ ] Solve related problems quickly
- [ ] Connect it to broader topics

## Next Steps

Continue to the next subsection, keeping in mind how ${title} connects to and supports the broader understanding of ${moduleContext}.`,
        keyTakeaway: `Complete understanding of ${title} and its role in the broader context of ${moduleContext}.`
      }
    );
  }
  
  return pages;
}

async function main() {
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

    console.log(`\nAnalyzing course: ${course.title}`);
    console.log(`Course ID: ${course._id}`);

    let updatedModules = [...course.modules];
    let totalSubsectionsGenerated = 0;

    // Process each module
    for (let moduleIndex = 0; moduleIndex < updatedModules.length; moduleIndex++) {
      const module = updatedModules[moduleIndex];
      console.log(`\n========================================`);
      console.log(`Module ${moduleIndex + 1}: ${module.title}`);
      
      if (module.content) {
        console.log(`\nAnalyzing markdown hierarchy...`);
        
        // Parse the markdown hierarchy
        const flatHierarchy = parseMarkdownHierarchy(module.content);
        console.log(`Found ${flatHierarchy.length} hierarchical items`);
        
        // Build hierarchical structure
        const hierarchicalStructure = buildHierarchicalStructure(flatHierarchy);
        console.log(`Organized into ${hierarchicalStructure.length} main sections`);
        
        // Display the hierarchy
        function displayHierarchy(nodes, indent = "") {
          for (const node of nodes) {
            console.log(`${indent}${node.level === 3 ? '📚' : '📖'} ${node.text} (Level ${node.level})`);
            if (node.children.length > 0) {
              displayHierarchy(node.children, indent + "  ");
            }
          }
        }
        
        console.log(`\nHierarchical Structure:`);
        displayHierarchy(hierarchicalStructure);
        
        // Generate detailed subsections from hierarchy
        const detailedSubsections = generateDetailedSubsectionsFromHierarchy(
          hierarchicalStructure, 
          module.title, 
          course.examType || "Computer Proficiency"
        );
        
        console.log(`\nGenerated ${detailedSubsections.length} detailed subsections:`);
        detailedSubsections.forEach((subsection, index) => {
          const indent = "  ".repeat(subsection.hierarchyLevel - 3);
          console.log(`${indent}${index + 1}. ${subsection.title} (Level ${subsection.hierarchyLevel}, ${subsection.pages.length} pages)`);
        });
        
        // Update the module with new hierarchical detailed subsections
        updatedModules[moduleIndex].detailedSubsections = detailedSubsections;
        totalSubsectionsGenerated += detailedSubsections.length;
        
      } else {
        console.log(`❌ No content found for this module`);
      }
    }

    // Update the course in database
    const updateResult = await coursesCollection.updateOne(
      { _id: course._id },
      { $set: { modules: updatedModules } }
    );

    console.log(`\n✅ Successfully updated course with hierarchical detailed subsections!`);
    console.log(`   Total subsections generated: ${totalSubsectionsGenerated}`);
    console.log(`   Modules updated: ${updatedModules.length}`);
    console.log(`   Database update result: ${updateResult.modifiedCount} document(s) modified`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

main().catch(console.error);