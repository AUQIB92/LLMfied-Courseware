// Script to generate multipage detailed subsections for ExamGenius courses
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://auqib:arwaa123@cluster0.gjsxg.mongodb.net/llmfied?retryWrites=true&w=majority&appName=Cluster0";

// Template for generating multipage content based on subsection topic
function generateMultipageContent(subsectionTitle, moduleContext, examType = "Computer Proficiency") {
  const pages = [
    {
      pageTitle: "Introduction & Foundation",
      content: `# ${subsectionTitle} - Introduction & Foundation

## What is ${subsectionTitle}?

${subsectionTitle} is a fundamental concept in ${moduleContext}. Understanding this topic is crucial for ${examType} examinations as it forms the foundation for more advanced concepts.

## Key Definitions

- **Core Concept**: The basic principle underlying ${subsectionTitle}
- **Application**: How this concept is used in real-world scenarios
- **Importance**: Why this topic is essential for ${examType} exam success

## Learning Objectives

By the end of this section, you will be able to:
1. Define and explain ${subsectionTitle}
2. Identify key components and characteristics
3. Understand the practical applications
4. Apply this knowledge in exam scenarios

## Context and Background

This topic builds upon previous knowledge and connects to other important concepts in ${moduleContext}. It's particularly relevant for competitive exams because...`,
      keyTakeaway: `${subsectionTitle} is a foundational concept that requires solid understanding of basic principles and definitions.`
    },
    {
      pageTitle: "Core Theory & Principles - Part 1",
      content: `# ${subsectionTitle} - Core Theory & Principles (Part 1)

## Fundamental Principles

The core principles of ${subsectionTitle} include:

### Primary Concepts
1. **Basic Structure**: Understanding the fundamental structure
2. **Key Components**: Identifying essential elements
3. **Relationships**: How different parts interact

### Theoretical Framework
- **Foundation Theory**: The underlying theoretical basis
- **Supporting Concepts**: Related ideas that support the main concept
- **Interconnections**: How this connects to other topics

## Detailed Explanation

${subsectionTitle} operates on several key principles:

1. **Principle 1**: Detailed explanation of the first key principle
2. **Principle 2**: Comprehensive coverage of the second principle
3. **Principle 3**: In-depth analysis of the third principle

## Visual Understanding

Think of ${subsectionTitle} as a system where each component plays a specific role...`,
      keyTakeaway: `Master the fundamental principles and theoretical framework that govern ${subsectionTitle}.`
    },
    {
      pageTitle: "Core Theory & Principles - Part 2",
      content: `# ${subsectionTitle} - Core Theory & Principles (Part 2)

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

${subsectionTitle} connects with other important topics in ${moduleContext}, creating a comprehensive understanding framework.`,
      keyTakeaway: `Advanced theoretical understanding enables practical application and problem-solving in complex scenarios.`
    },
    {
      pageTitle: "Essential Formulas & Key Points",
      content: `# ${subsectionTitle} - Essential Formulas & Key Points

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
      keyTakeaway: `Master essential formulas, rules, and procedures for efficient problem-solving in ${subsectionTitle}.`
    },
    {
      pageTitle: "Concept Applications & Examples",
      content: `# ${subsectionTitle} - Concept Applications & Examples

## Real-World Applications

${subsectionTitle} is applied in various real-world scenarios:

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
      keyTakeaway: `Practical applications and examples demonstrate how ${subsectionTitle} concepts work in real scenarios.`
    },
    {
      pageTitle: "Exam Strategies & Speed Techniques",
      content: `# ${subsectionTitle} - Exam Strategies & Speed Techniques

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
- Priority topics within ${subsectionTitle}`,
      keyTakeaway: `Efficient exam strategies and speed techniques maximize performance in ${subsectionTitle} questions.`
    },
    {
      pageTitle: "Common Traps & Error Prevention",
      content: `# ${subsectionTitle} - Common Traps & Error Prevention

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
      pageTitle: "Key Takeaways & Exam Readiness",
      content: `# ${subsectionTitle} - Key Takeaways & Exam Readiness

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
- [ ] Can explain ${subsectionTitle} clearly
- [ ] Know all essential formulas
- [ ] Understand practical applications
- [ ] Can solve typical problems quickly

### Practice Recommendations
- Solve 10-15 practice questions
- Time yourself on problem-solving
- Review common mistakes
- Practice speed techniques

## Final Confidence Builder

You're now ready to tackle ${subsectionTitle} questions with confidence! Remember the key strategies, avoid common traps, and apply the speed techniques you've learned.`,
      keyTakeaway: `Complete mastery of ${subsectionTitle} through systematic review, practice, and confidence-building preparation.`
    }
  ];

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

    console.log(`\nProcessing course: ${course.title}`);
    console.log(`Course ID: ${course._id}`);

    let updatedModules = [...course.modules];
    let totalPagesGenerated = 0;

    // Process each module
    for (let moduleIndex = 0; moduleIndex < updatedModules.length; moduleIndex++) {
      const module = updatedModules[moduleIndex];
      console.log(`\n  Processing Module ${moduleIndex + 1}: ${module.title}`);

      if (module.detailedSubsections && module.detailedSubsections.length > 0) {
        // Update each detailed subsection with multipage content
        for (let subIndex = 0; subIndex < module.detailedSubsections.length; subIndex++) {
          const subsection = module.detailedSubsections[subIndex];
          console.log(`    Generating pages for: ${subsection.title}`);

          // Generate multipage content
          const pages = generateMultipageContent(
            subsection.title, 
            module.title, 
            course.examType || "Computer Proficiency"
          );

          // Update the subsection with pages
          updatedModules[moduleIndex].detailedSubsections[subIndex] = {
            ...subsection,
            pages: pages,
            estimatedTime: 25, // 25 minutes for 8 pages
            difficulty: 'Intermediate'
          };

          totalPagesGenerated += pages.length;
          console.log(`      ✅ Generated ${pages.length} pages`);
        }
      }
    }

    // Update the course in database
    const updateResult = await coursesCollection.updateOne(
      { _id: course._id },
      { $set: { modules: updatedModules } }
    );

    console.log(`\n✅ Successfully updated course!`);
    console.log(`   Total pages generated: ${totalPagesGenerated}`);
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