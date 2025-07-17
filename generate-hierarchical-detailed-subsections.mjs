// Script to generate hierarchical detailed subsections based on actual module content
// Structure: Module → Sections → Subsections with proper content analysis
import { MongoClient } from "mongodb";
import pkg from "./lib/gemini.js";
const { generateCompetitiveExamModuleSummary } = pkg;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://auqib:arwaa123@cluster0.gjsxg.mongodb.net/llmfied?retryWrites=true&w=majority&appName=Cluster0";

// Function to analyze module content and extract hierarchical structure
function analyzeModuleContent(moduleContent) {
  console.log("Analyzing module content for hierarchical structure...");
  
  // Extract sections from module content
  const sections = [];
  const lines = moduleContent.split('\n');
  let currentSection = null;
  let currentSubsections = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect section headers (## or ### or numbered sections)
    if (trimmedLine.match(/^##\s+/) || trimmedLine.match(/^\d+\.\s+/) || trimmedLine.match(/^[A-Z][^.]*:$/)) {
      // Save previous section if exists
      if (currentSection) {
        sections.push({
          title: currentSection,
          subsections: [...currentSubsections]
        });
      }
      
      // Start new section
      currentSection = trimmedLine.replace(/^##\s+/, '').replace(/^\d+\.\s+/, '').replace(/:$/, '');
      currentSubsections = [];
    }
    // Detect subsection items (bullet points, numbered items, or sub-headers)
    else if (trimmedLine.match(/^[-*]\s+/) || trimmedLine.match(/^\d+\.\d+\s+/) || trimmedLine.match(/^###\s+/)) {
      const subsection = trimmedLine
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+\.\d+\s+/, '')
        .replace(/^###\s+/, '')
        .trim();
      
      if (subsection && subsection.length > 3) {
        currentSubsections.push(subsection);
      }
    }
    // Detect key concepts in paragraphs
    else if (trimmedLine.length > 20 && !trimmedLine.includes('http') && currentSection) {
      // Extract key concepts from sentences
      const concepts = extractKeyConceptsFromText(trimmedLine);
      currentSubsections.push(...concepts);
    }
  }
  
  // Add the last section
  if (currentSection) {
    sections.push({
      title: currentSection,
      subsections: [...currentSubsections]
    });
  }
  
  // If no clear structure found, create default sections based on content analysis
  if (sections.length === 0) {
    return createDefaultSections(moduleContent);
  }
  
  return sections;
}

// Extract key concepts from text content
function extractKeyConceptsFromText(text) {
  const concepts = [];
  
  // Look for key patterns that indicate important concepts
  const patterns = [
    /understanding\s+([^,.]+)/gi,
    /learning\s+([^,.]+)/gi,
    /mastering\s+([^,.]+)/gi,
    /concepts?\s+of\s+([^,.]+)/gi,
    /principles?\s+of\s+([^,.]+)/gi,
    /fundamentals?\s+of\s+([^,.]+)/gi,
    /basics?\s+of\s+([^,.]+)/gi,
    /introduction\s+to\s+([^,.]+)/gi,
    /overview\s+of\s+([^,.]+)/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const concept = match[1].trim();
      if (concept.length > 5 && concept.length < 50) {
        concepts.push(concept);
      }
    }
  });
  
  return concepts.slice(0, 3); // Limit to 3 concepts per text block
}

// Create default sections when no clear structure is found
function createDefaultSections(content) {
  const defaultSections = [
    {
      title: "Introduction & Foundation",
      subsections: [
        "Basic concepts and definitions",
        "Historical background and context",
        "Importance and applications",
        "Prerequisites and preparation"
      ]
    },
    {
      title: "Core Theory & Principles",
      subsections: [
        "Fundamental principles",
        "Key theoretical concepts",
        "Mathematical foundations",
        "Scientific basis and derivations"
      ]
    },
    {
      title: "Practical Applications",
      subsections: [
        "Real-world implementations",
        "Industry use cases",
        "Problem-solving techniques",
        "Best practices and methodologies"
      ]
    },
    {
      title: "Advanced Topics",
      subsections: [
        "Complex scenarios and edge cases",
        "Advanced techniques and strategies",
        "Integration with other concepts",
        "Future developments and trends"
      ]
    }
  ];
  
  return defaultSections;
}

// Generate detailed content for each subsection using AI
async function generateSubsectionContent(moduleName, sectionTitle, subsectionTitle, examType = "SSC") {
  console.log(`Generating content for: ${moduleName} → ${sectionTitle} → ${subsectionTitle}`);
  
  const context = {
    learnerLevel: "intermediate",
    subject: "Quantitative Aptitude",
    examType: examType,
    moduleIndex: 1,
    totalModules: 1
  };
  
  const contentPrompt = `
    Module: ${moduleName}
    Section: ${sectionTitle}
    Subsection: ${subsectionTitle}
    
    Generate detailed educational content for this specific subsection in the context of ${examType} competitive exam preparation.
    Focus on practical exam strategies, shortcuts, and time-saving techniques.
  `;
  
  try {
    const aiContent = await generateCompetitiveExamModuleSummary(contentPrompt, context);
    
    return {
      title: subsectionTitle,
      summary: aiContent.summary || `Comprehensive coverage of ${subsectionTitle} for ${examType} exam preparation`,
      keyPoints: aiContent.objectives || [
        `Master the fundamentals of ${subsectionTitle}`,
        `Apply speed-solving techniques`,
        `Identify common exam patterns`,
        `Avoid typical mistakes and traps`
      ],
      pages: generateSubsectionPages(subsectionTitle, sectionTitle, examType),
      practicalExample: `Real ${examType} exam problem involving ${subsectionTitle}`,
      commonPitfalls: [
        `Common mistakes in ${subsectionTitle} problems`,
        "Time management issues",
        "Calculation errors and shortcuts misuse"
      ],
      difficulty: "Intermediate",
      estimatedTime: "15-20 minutes",
      examRelevance: `Critical for ${examType} exam success in ${sectionTitle} section`
    };
  } catch (error) {
    console.error(`Error generating AI content for ${subsectionTitle}:`, error);
    
    // Fallback content
    return {
      title: subsectionTitle,
      summary: `Essential concepts and techniques for ${subsectionTitle} in ${examType} competitive exams`,
      keyPoints: [
        `Understand core principles of ${subsectionTitle}`,
        `Master calculation techniques and shortcuts`,
        `Practice with exam-pattern questions`,
        `Develop speed and accuracy`
      ],
      pages: generateSubsectionPages(subsectionTitle, sectionTitle, examType),
      practicalExample: `Typical ${examType} exam question on ${subsectionTitle}`,
      commonPitfalls: [
        "Conceptual misunderstandings",
        "Calculation errors",
        "Time pressure mistakes"
      ],
      difficulty: "Intermediate",
      estimatedTime: "15-20 minutes",
      examRelevance: `Important topic for ${examType} exam preparation`
    };
  }
}

// Generate multiple pages for each subsection
function generateSubsectionPages(subsectionTitle, sectionTitle, examType) {
  return [
    {
      pageNumber: 1,
      pageTitle: "Introduction & Foundation",
      content: `# ${subsectionTitle} - Introduction & Foundation

## What is ${subsectionTitle}?

${subsectionTitle} is a fundamental concept within ${sectionTitle} that plays a crucial role in ${examType} competitive examinations. Understanding this topic is essential for building a strong foundation in quantitative aptitude and problem-solving skills.

## Key Definitions and Concepts

- **Core Principle**: The basic underlying principle of ${subsectionTitle}
- **Mathematical Foundation**: The mathematical basis and formulas involved
- **Practical Application**: How this concept applies in real exam scenarios
- **Strategic Importance**: Why mastering this topic is crucial for ${examType} success

## Learning Objectives

By the end of this section, you will be able to:
1. Define and explain ${subsectionTitle} clearly
2. Identify the key components and characteristics
3. Understand the mathematical relationships involved
4. Apply basic problem-solving techniques

## Context in ${examType} Exam

This topic typically appears in ${examType} examinations as:
- Direct calculation problems
- Word problems requiring concept application
- Multi-step problems combining with other topics
- Time-bound questions testing speed and accuracy

## Foundation Building

Before diving deeper, ensure you understand:
- Basic mathematical operations
- Fundamental concepts in ${sectionTitle}
- Problem-solving strategies
- Time management techniques`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "definition",
          title: `Basic Definition of ${subsectionTitle}`,
          content: "Mathematical definition and notation will be provided based on the specific topic",
          explanation: "Step-by-step explanation of the fundamental concept",
          example: "Simple numerical example to illustrate the concept"
        }
      ],
      keyTakeaway: `${subsectionTitle} is a foundational concept that requires solid understanding of basic principles and definitions for ${examType} exam success.`
    },
    {
      pageNumber: 2,
      pageTitle: "Core Theory & Mathematical Principles",
      content: `# ${subsectionTitle} - Core Theory & Mathematical Principles

## Fundamental Mathematical Framework

The mathematical foundation of ${subsectionTitle} is built on several key principles that are essential for ${examType} exam preparation:

### Primary Mathematical Concepts
1. **Basic Formulas**: Essential formulas and their derivations
2. **Mathematical Relationships**: How different variables interact
3. **Calculation Methods**: Standard approaches to problem-solving
4. **Formula Variations**: Different forms of the same concept

### Theoretical Understanding
- **Conceptual Framework**: The theoretical basis underlying ${subsectionTitle}
- **Mathematical Proofs**: Understanding why formulas work
- **Logical Connections**: How this concept connects to other topics
- **Pattern Recognition**: Identifying common problem patterns

## Essential Formulas and Derivations

### Primary Formula
The main formula for ${subsectionTitle} problems in ${examType} exams:
[Formula will be specific to the actual topic]

### Derivation Process
Step-by-step derivation showing:
1. Starting assumptions and given conditions
2. Mathematical manipulation and algebraic steps
3. Final formula and its practical form
4. Verification through examples

### Formula Variations
Different forms of the formula for various scenarios:
- Standard form for basic problems
- Modified form for complex scenarios
- Shortcut versions for time-saving
- Special cases and exceptions

## Mathematical Properties
- **Symmetry**: Understanding symmetrical relationships
- **Proportionality**: Direct and inverse relationships
- **Limits**: Boundary conditions and constraints
- **Optimization**: Finding maximum and minimum values`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "formula",
          title: `Core Formula for ${subsectionTitle}`,
          content: "Main mathematical formula with proper notation",
          explanation: "Detailed explanation of each component in the formula",
          example: "Worked example showing formula application"
        },
        {
          type: "derivation",
          title: "Mathematical Derivation",
          content: "Step-by-step derivation of the core formula",
          explanation: "Logical reasoning behind each mathematical step",
          example: "Verification example proving the derivation"
        }
      ],
      keyTakeaway: `Master the fundamental mathematical principles and formulas that govern ${subsectionTitle} for effective problem-solving in ${examType} exams.`
    },
    {
      pageNumber: 3,
      pageTitle: "Problem-Solving Techniques & Strategies",
      content: `# ${subsectionTitle} - Problem-Solving Techniques & Strategies

## Systematic Problem-Solving Approach

For ${examType} exam success in ${subsectionTitle}, follow this systematic approach:

### Step 1: Problem Analysis
- **Read Carefully**: Understand what is being asked
- **Identify Given Information**: List all provided data
- **Determine Required Output**: Clarify what needs to be found
- **Choose Appropriate Method**: Select the best solving technique

### Step 2: Strategy Selection
- **Direct Formula Application**: When to use standard formulas
- **Multi-Step Approach**: Breaking complex problems into parts
- **Elimination Method**: Ruling out incorrect options
- **Approximation Techniques**: Quick estimation methods

### Step 3: Execution and Verification
- **Careful Calculation**: Avoiding computational errors
- **Unit Consistency**: Ensuring proper units throughout
- **Answer Verification**: Checking if the result makes sense
- **Time Management**: Balancing accuracy with speed

## Common Problem Types in ${examType} Exams

### Type 1: Direct Application Problems
- **Characteristics**: Straightforward use of formulas
- **Approach**: Direct substitution and calculation
- **Time Allocation**: 1-2 minutes per problem
- **Common Mistakes**: Calculation errors, wrong formula selection

### Type 2: Word Problems
- **Characteristics**: Real-world scenarios requiring interpretation
- **Approach**: Translation to mathematical form, then solving
- **Time Allocation**: 2-3 minutes per problem
- **Common Mistakes**: Misinterpretation, incorrect setup

### Type 3: Multi-Concept Problems
- **Characteristics**: Combining ${subsectionTitle} with other topics
- **Approach**: Sequential application of multiple concepts
- **Time Allocation**: 3-4 minutes per problem
- **Common Mistakes**: Missing connections, incomplete solutions

## Advanced Problem-Solving Techniques
- **Pattern Recognition**: Identifying recurring problem structures
- **Shortcut Methods**: Time-saving calculation techniques
- **Elimination Strategies**: Ruling out options systematically
- **Approximation Skills**: Quick estimation for verification`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "example",
          title: `Typical ${examType} Problem`,
          content: "Representative exam problem with complete solution",
          explanation: "Step-by-step solution methodology",
          example: "Alternative solution methods and verification"
        },
        {
          type: "strategy",
          title: "Problem-Solving Strategy",
          content: "Systematic approach to tackling ${subsectionTitle} problems",
          explanation: "Decision-making process for method selection",
          example: "Application of strategy to different problem types"
        }
      ],
      keyTakeaway: `Develop systematic problem-solving techniques and strategic thinking for efficient handling of ${subsectionTitle} problems in ${examType} exams.`
    },
    {
      pageNumber: 4,
      pageTitle: "Speed Techniques & Shortcuts",
      content: `# ${subsectionTitle} - Speed Techniques & Shortcuts

## Time-Saving Calculation Methods

For ${examType} exam success, speed is crucial. Master these techniques for ${subsectionTitle}:

### Mental Math Shortcuts
1. **Quick Multiplication**: Techniques for rapid calculation
2. **Division Shortcuts**: Fast division methods
3. **Percentage Calculations**: Instant percentage computations
4. **Fraction Simplification**: Rapid fraction operations

### Formula Shortcuts
- **Simplified Forms**: Reduced versions of complex formulas
- **Approximation Methods**: Quick estimation techniques
- **Pattern-Based Solutions**: Recognizing and using patterns
- **Elimination Techniques**: Quickly ruling out wrong answers

## Speed Enhancement Strategies

### Recognition Patterns
Learn to quickly identify:
- **Problem Types**: Instant categorization of questions
- **Solution Methods**: Immediate method selection
- **Answer Ranges**: Reasonable answer boundaries
- **Common Traps**: Typical mistake patterns to avoid

### Calculation Optimization
- **Order of Operations**: Optimal sequence for calculations
- **Intermediate Rounding**: Strategic rounding for speed
- **Cross-Multiplication**: Faster comparison methods
- **Substitution Tricks**: Smart value substitutions

### Memory Techniques
- **Formula Mnemonics**: Memory aids for formulas
- **Number Patterns**: Recognizing numerical relationships
- **Common Values**: Memorizing frequently used numbers
- **Quick References**: Mental lookup tables

## Time Management in ${examType} Exams

### Time Allocation Strategy
- **Easy Problems**: 30-60 seconds each
- **Medium Problems**: 1-2 minutes each
- **Difficult Problems**: 2-3 minutes maximum
- **Review Time**: 5-10% of total time

### Speed vs. Accuracy Balance
- **Accuracy First**: Ensure correctness before speed
- **Progressive Speed**: Gradually increase solving pace
- **Error Prevention**: Techniques to avoid common mistakes
- **Quick Verification**: Rapid answer checking methods`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "shortcut",
          title: `Speed Technique for ${subsectionTitle}`,
          content: "Quick calculation method or mental math trick",
          explanation: "How to apply this technique effectively",
          example: "Practice problem with timing comparison"
        },
        {
          type: "pattern",
          title: "Recognition Pattern",
          content: "Common pattern in ${subsectionTitle} problems",
          explanation: "How to quickly identify and use this pattern",
          example: "Multiple examples showing pattern application"
        }
      ],
      keyTakeaway: `Master speed techniques and shortcuts to solve ${subsectionTitle} problems efficiently within ${examType} exam time constraints.`
    },
    {
      pageNumber: 5,
      pageTitle: "Common Traps & Error Prevention",
      content: `# ${subsectionTitle} - Common Traps & Error Prevention

## Typical Mistakes in ${examType} Exams

Understanding common errors helps prevent them during actual exams:

### Conceptual Mistakes
1. **Misunderstanding the Problem**: Incorrect interpretation of questions
2. **Wrong Formula Selection**: Using inappropriate formulas
3. **Incomplete Analysis**: Missing key aspects of the problem
4. **Logical Errors**: Flawed reasoning in multi-step problems

### Calculation Errors
- **Arithmetic Mistakes**: Basic computation errors
- **Unit Confusion**: Mixing different units of measurement
- **Decimal Point Errors**: Misplacing decimal points
- **Rounding Mistakes**: Inappropriate rounding at wrong stages

## Exam-Specific Traps in ${subsectionTitle}

### Trap 1: Misleading Information
- **How it appears**: Extra information designed to confuse
- **Recognition signs**: Irrelevant data in problem statement
- **Avoidance strategy**: Focus only on necessary information
- **Example**: Problems with multiple values where only some are needed

### Trap 2: Answer Choice Manipulation
- **How it appears**: Incorrect answers that result from common mistakes
- **Recognition signs**: Options that match typical error patterns
- **Avoidance strategy**: Double-check calculations and logic
- **Example**: Wrong answers from formula misapplication

### Trap 3: Time Pressure Errors
- **How it appears**: Rushing leads to careless mistakes
- **Recognition signs**: Feeling pressured to solve quickly
- **Avoidance strategy**: Maintain steady pace, don't panic
- **Example**: Skipping verification steps due to time pressure

## Error Prevention Strategies

### Pre-Calculation Checks
- **Problem Understanding**: Ensure clear comprehension
- **Method Selection**: Verify appropriate technique choice
- **Formula Verification**: Confirm correct formula usage
- **Unit Consistency**: Check all units match properly

### During Calculation
- **Step-by-Step Approach**: Don't skip intermediate steps
- **Regular Verification**: Check calculations at each stage
- **Reasonableness Test**: Ensure answers make logical sense
- **Alternative Methods**: Use different approaches to verify

### Post-Calculation Review
- **Answer Verification**: Check if result answers the question
- **Order of Magnitude**: Ensure answer is in reasonable range
- **Unit Check**: Verify final answer has correct units
- **Common Sense Test**: Does the answer make practical sense?`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "trap",
          title: `Common ${examType} Exam Trap`,
          content: "Typical mistake pattern in ${subsectionTitle} problems",
          explanation: "How to identify and avoid this specific trap",
          example: "Problem showing trap and correct solution approach"
        },
        {
          type: "prevention",
          title: "Error Prevention Technique",
          content: "Systematic method to avoid common mistakes",
          explanation: "Step-by-step error prevention process",
          example: "Application of prevention technique to sample problems"
        }
      ],
      keyTakeaway: `Develop awareness of common traps and systematic error prevention strategies to maximize accuracy in ${subsectionTitle} problems during ${examType} exams.`
    },
    {
      pageNumber: 6,
      pageTitle: "Practice Problems & Applications",
      content: `# ${subsectionTitle} - Practice Problems & Applications

## Graduated Practice Problems

Practice with problems of increasing difficulty to build confidence and skill:

### Level 1: Basic Application (Easy)
**Problem Type**: Direct formula application
**Time Target**: 30-60 seconds
**Skills Tested**: Basic understanding and calculation

**Sample Problem**: [Specific problem based on the subsection topic]
**Solution Approach**:
1. Identify given information
2. Select appropriate formula
3. Substitute values
4. Calculate result
5. Verify answer

### Level 2: Intermediate Application (Medium)
**Problem Type**: Multi-step problems with interpretation
**Time Target**: 1-2 minutes
**Skills Tested**: Problem analysis and method selection

**Sample Problem**: [More complex problem requiring analysis]
**Solution Approach**:
1. Analyze problem structure
2. Break into manageable steps
3. Apply concepts systematically
4. Combine intermediate results
5. Verify final answer

### Level 3: Advanced Application (Hard)
**Problem Type**: Complex scenarios with multiple concepts
**Time Target**: 2-3 minutes
**Skills Tested**: Integration of concepts and strategic thinking

**Sample Problem**: [Challenging problem combining multiple concepts]
**Solution Approach**:
1. Identify all relevant concepts
2. Plan solution strategy
3. Execute step-by-step solution
4. Check intermediate results
5. Verify comprehensive solution

## Real ${examType} Exam Applications

### Previous Year Question Patterns
- **Frequency**: How often ${subsectionTitle} appears in ${examType}
- **Difficulty Distribution**: Easy (40%), Medium (45%), Hard (15%)
- **Question Formats**: Multiple choice, numerical answer, comparison
- **Integration**: How it combines with other topics

### Exam Strategy for ${subsectionTitle}
- **Priority Level**: High/Medium/Low based on exam weightage
- **Time Allocation**: Recommended time per problem type
- **Attempt Strategy**: Which problems to attempt first
- **Backup Methods**: Alternative approaches when stuck

## Practice Recommendations

### Daily Practice Routine
- **Basic Problems**: 5-10 problems daily for concept reinforcement
- **Mixed Practice**: 3-5 problems combining different difficulty levels
- **Timed Practice**: Weekly timed sessions simulating exam conditions
- **Error Analysis**: Review and understand all mistakes

### Progress Tracking
- **Accuracy Rate**: Track percentage of correct answers
- **Speed Improvement**: Monitor time taken per problem
- **Concept Mastery**: Identify strong and weak areas
- **Exam Readiness**: Assess overall preparation level`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "practice",
          title: "Practice Problem Set",
          content: "Collection of problems at different difficulty levels",
          explanation: "Solution strategies and common approaches",
          example: "Detailed solutions with timing and tips"
        },
        {
          type: "application",
          title: `Real ${examType} Application`,
          content: "Actual exam-style problem with context",
          explanation: "Complete solution with exam strategy",
          example: "Alternative methods and verification techniques"
        }
      ],
      keyTakeaway: `Regular practice with graduated difficulty levels and exam-style problems builds confidence and expertise in ${subsectionTitle} for ${examType} exam success.`
    }
  ];
}

async function main() {
  console.log("Starting hierarchical detailed subsections generation...");
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
    let totalSubsectionsGenerated = 0;

    // Process each module
    for (let moduleIndex = 0; moduleIndex < updatedModules.length; moduleIndex++) {
      const module = updatedModules[moduleIndex];
      console.log(`\n  Processing Module ${moduleIndex + 1}: ${module.title}`);

      // Analyze module content to extract hierarchical structure
      const moduleContent = module.content || module.description || module.title;
      const hierarchicalSections = analyzeModuleContent(moduleContent);
      
      console.log(`    Found ${hierarchicalSections.length} sections in module`);

      // Generate detailed subsections based on hierarchical structure
      const detailedSubsections = [];
      
      for (const section of hierarchicalSections) {
        console.log(`    Processing Section: ${section.title}`);
        
        // Limit subsections to avoid overwhelming content
        const subsectionsToProcess = section.subsections.slice(0, 4);
        
        for (const subsectionTitle of subsectionsToProcess) {
          console.log(`      Generating Subsection: ${subsectionTitle}`);
          
          try {
            const subsectionContent = await generateSubsectionContent(
              module.title,
              section.title,
              subsectionTitle,
              course.examType || "SSC"
            );
            
            detailedSubsections.push(subsectionContent);
            totalSubsectionsGenerated++;
            
            console.log(`        ✅ Generated: ${subsectionTitle}`);
          } catch (error) {
            console.error(`        ❌ Error generating ${subsectionTitle}:`, error.message);
            
            // Add fallback subsection
            detailedSubsections.push({
              title: subsectionTitle,
              summary: `Essential concepts for ${subsectionTitle} in ${course.examType || "SSC"} exam preparation`,
              keyPoints: [
                `Master fundamentals of ${subsectionTitle}`,
                "Apply speed-solving techniques",
                "Practice with exam-pattern questions",
                "Avoid common mistakes and traps"
              ],
              pages: generateSubsectionPages(subsectionTitle, section.title, course.examType || "SSC"),
              practicalExample: `Real exam problem involving ${subsectionTitle}`,
              commonPitfalls: ["Conceptual errors", "Calculation mistakes", "Time management issues"],
              difficulty: "Intermediate",
              estimatedTime: "15-20 minutes",
              examRelevance: `Important for ${course.examType || "SSC"} exam success`
            });
            
            totalSubsectionsGenerated++;
          }
          
          // Add small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update module with hierarchical detailed subsections
      updatedModules[moduleIndex].detailedSubsections = detailedSubsections;
      updatedModules[moduleIndex].hierarchicalStructure = hierarchicalSections;
      
      console.log(`    ✅ Module completed with ${detailedSubsections.length} detailed subsections`);
    }

    // Update the course in database
    const updateResult = await coursesCollection.updateOne(
      { _id: course._id },
      { $set: { modules: updatedModules } }
    );

    console.log(`\n✅ Successfully updated course with hierarchical structure!`);
    console.log(`   Total detailed subsections generated: ${totalSubsectionsGenerated}`);
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