// Script to generate hierarchical detailed subsections based on actual module content
// Structure: Module → Sections → Subsections with proper content analysis
const { MongoClient } = require("mongodb");

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

// Generate detailed content for each subsection
function generateSubsectionContent(moduleName, sectionTitle, subsectionTitle, examType = "SSC") {
  console.log(`Generating content for: ${moduleName} → ${sectionTitle} → ${subsectionTitle}`);
  
  return {
    title: subsectionTitle,
    summary: `Comprehensive coverage of ${subsectionTitle} within ${sectionTitle} for ${examType} exam preparation. This subsection focuses on essential concepts, practical applications, and exam-specific strategies.`,
    keyPoints: [
      `Master the fundamentals of ${subsectionTitle}`,
      `Apply speed-solving techniques and shortcuts`,
      `Identify common exam patterns and question types`,
      `Avoid typical mistakes and time-wasting traps`
    ],
    pages: generateSubsectionPages(subsectionTitle, sectionTitle, examType),
    practicalExample: `Real ${examType} exam problem involving ${subsectionTitle} concepts with step-by-step solution and time-saving techniques.`,
    commonPitfalls: [
      `Common conceptual mistakes in ${subsectionTitle} problems`,
      "Time management issues and calculation errors",
      "Misinterpretation of question requirements"
    ],
    difficulty: "Intermediate",
    estimatedTime: "15-20 minutes",
    examRelevance: `Critical subsection for ${examType} exam success in ${sectionTitle}. Frequently appears in exam questions with moderate to high difficulty.`
  };
}

// Generate multiple pages for each subsection
function generateSubsectionPages(subsectionTitle, sectionTitle, examType) {
  return [
    {
      pageNumber: 1,
      pageTitle: "Introduction & Foundation",
      content: `# ${subsectionTitle} - Introduction & Foundation

## Understanding ${subsectionTitle} in Context

${subsectionTitle} is a crucial component within the broader topic of ${sectionTitle}. This subsection forms an essential building block for mastering ${examType} competitive examination questions in this domain.

## Key Definitions and Core Concepts

**Primary Definition**: ${subsectionTitle} refers to the fundamental principles and methodologies that govern this specific area within ${sectionTitle}.

**Core Components**:
- Basic theoretical framework
- Mathematical foundations and formulas
- Practical application methods
- Problem-solving approaches

## Importance in ${examType} Examinations

This subsection is particularly important because:
- It appears frequently in ${examType} question papers
- Forms the basis for more complex problems
- Tests both conceptual understanding and calculation speed
- Often combined with other topics in multi-step problems

## Learning Objectives

By mastering this subsection, you will be able to:
1. Define and explain ${subsectionTitle} concepts clearly
2. Apply fundamental principles to solve basic problems
3. Recognize question patterns in ${examType} exams
4. Build foundation for advanced topics in ${sectionTitle}

## Prerequisites and Preparation

Before studying this subsection, ensure you have:
- Basic mathematical skills and operations
- Understanding of fundamental concepts in ${sectionTitle}
- Familiarity with ${examType} exam pattern and requirements
- Time management skills for competitive exams

## Connection to Other Topics

${subsectionTitle} connects to other important areas:
- Related concepts within ${sectionTitle}
- Applications in other sections of ${examType} syllabus
- Integration with quantitative aptitude topics
- Real-world applications and examples`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "definition",
          title: `Basic Definition of ${subsectionTitle}`,
          content: "Mathematical definition and fundamental formula",
          explanation: "Step-by-step explanation of the core concept",
          example: "Simple numerical example demonstrating the principle"
        }
      ],
      keyTakeaway: `${subsectionTitle} is a foundational concept within ${sectionTitle} that requires solid understanding of basic principles and definitions for ${examType} exam success.`
    },
    {
      pageNumber: 2,
      pageTitle: "Core Theory & Mathematical Principles",
      content: `# ${subsectionTitle} - Core Theory & Mathematical Principles

## Mathematical Framework

The theoretical foundation of ${subsectionTitle} is built on several key mathematical principles essential for ${examType} exam success:

### Fundamental Formulas
- **Primary Formula**: Core mathematical expression for ${subsectionTitle}
- **Derived Formulas**: Variations and special cases
- **Relationship Equations**: How variables interact
- **Calculation Methods**: Step-by-step solution approaches

### Theoretical Principles
1. **Basic Theory**: Underlying mathematical concepts
2. **Logical Framework**: How principles connect logically
3. **Mathematical Proofs**: Why formulas work
4. **Pattern Recognition**: Common mathematical patterns

## Formula Derivations and Proofs

### Step-by-Step Derivation
Starting from basic principles:
1. Initial assumptions and given conditions
2. Mathematical manipulation and algebraic steps
3. Logical progression to final formula
4. Verification through examples

### Understanding the Logic
- Why each step is necessary
- How mathematical operations preserve equality
- Connection to fundamental mathematical principles
- Practical implications of the derived formula

## Applications in Problem Solving

### Direct Application
- When to use the primary formula
- How to identify appropriate scenarios
- Substitution techniques and calculations
- Verification of results

### Modified Applications
- Variations for different problem types
- Adaptation for complex scenarios
- Integration with other mathematical concepts
- Optimization for exam conditions

## Mathematical Properties and Relationships
- **Symmetry**: Balanced relationships in formulas
- **Proportionality**: Direct and inverse relationships
- **Limits**: Boundary conditions and constraints
- **Optimization**: Maximum and minimum values`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "formula",
          title: `Core Formula for ${subsectionTitle}`,
          content: "Primary mathematical formula with proper notation",
          explanation: "Detailed explanation of each component",
          example: "Worked example showing formula application"
        },
        {
          type: "derivation",
          title: "Mathematical Derivation",
          content: "Step-by-step derivation process",
          explanation: "Logical reasoning behind each step",
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

For ${examType} exam success in ${subsectionTitle}, follow this proven methodology:

### Phase 1: Problem Analysis
- **Careful Reading**: Understand exactly what is being asked
- **Information Extraction**: Identify all given data and conditions
- **Goal Identification**: Determine what needs to be calculated
- **Method Selection**: Choose the most efficient solution approach

### Phase 2: Strategy Implementation
- **Formula Selection**: Pick appropriate mathematical tools
- **Step Planning**: Organize solution into logical steps
- **Calculation Execution**: Perform mathematical operations carefully
- **Progress Monitoring**: Check intermediate results for reasonableness

### Phase 3: Verification and Optimization
- **Answer Checking**: Verify result makes logical sense
- **Alternative Methods**: Use different approaches to confirm
- **Time Assessment**: Evaluate efficiency of solution method
- **Learning Integration**: Connect to similar problem types

## Common Problem Categories

### Type 1: Direct Calculation Problems
**Characteristics**: Straightforward application of formulas
**Approach**: Direct substitution and computation
**Time Target**: 30-60 seconds
**Success Factors**: Accurate formula recall and careful calculation

### Type 2: Multi-Step Analysis Problems
**Characteristics**: Require breaking down into components
**Approach**: Sequential problem-solving with intermediate steps
**Time Target**: 1-2 minutes
**Success Factors**: Logical organization and step verification

### Type 3: Complex Integration Problems
**Characteristics**: Combine ${subsectionTitle} with other concepts
**Approach**: Identify all relevant concepts and apply systematically
**Time Target**: 2-3 minutes
**Success Factors**: Comprehensive understanding and strategic thinking

## Advanced Problem-Solving Techniques
- **Pattern Recognition**: Identifying recurring problem structures
- **Elimination Methods**: Ruling out incorrect options systematically
- **Approximation Skills**: Quick estimation for answer verification
- **Time Optimization**: Balancing speed with accuracy requirements`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "example",
          title: `Typical ${examType} Problem`,
          content: "Representative exam problem with complete solution",
          explanation: "Step-by-step solution methodology",
          example: "Alternative approaches and verification techniques"
        },
        {
          type: "strategy",
          title: "Problem-Solving Framework",
          content: "Systematic approach to ${subsectionTitle} problems",
          explanation: "Decision-making process for method selection",
          example: "Application to different problem variations"
        }
      ],
      keyTakeaway: `Develop systematic problem-solving techniques and strategic thinking for efficient handling of ${subsectionTitle} problems in ${examType} exams.`
    },
    {
      pageNumber: 4,
      pageTitle: "Speed Techniques & Shortcuts",
      content: `# ${subsectionTitle} - Speed Techniques & Shortcuts

## Time-Saving Calculation Methods

Master these speed techniques for ${subsectionTitle} in ${examType} exams:

### Mental Math Shortcuts
1. **Quick Multiplication**: Techniques for rapid calculation
   - Using patterns and number properties
   - Breaking down complex multiplications
   - Leveraging mathematical shortcuts

2. **Division Optimization**: Fast division methods
   - Factorization approaches
   - Decimal conversion tricks
   - Remainder calculation shortcuts

3. **Percentage and Fraction Speed**: Instant calculations
   - Common percentage equivalents
   - Fraction-decimal conversions
   - Proportional reasoning shortcuts

### Formula Optimization Techniques
- **Simplified Forms**: Reduced versions of complex formulas
- **Pattern-Based Solutions**: Recognizing and using recurring patterns
- **Elimination Strategies**: Quickly ruling out incorrect options
- **Approximation Methods**: Strategic rounding for speed

## Recognition and Application Patterns

### Instant Problem Identification
Learn to quickly recognize:
- **Problem Types**: Immediate categorization of questions
- **Solution Pathways**: Direct route to correct method
- **Answer Ranges**: Reasonable boundaries for results
- **Trap Indicators**: Warning signs of common mistakes

### Speed Enhancement Strategies
- **Calculation Order**: Optimal sequence for operations
- **Strategic Rounding**: When and how to round for efficiency
- **Cross-Multiplication**: Faster comparison techniques
- **Substitution Tricks**: Smart value choices for quick solutions

## Memory Aids and Quick References

### Formula Mnemonics
- **Memory Devices**: Easy ways to remember key formulas
- **Visual Associations**: Connecting formulas to memorable images
- **Logical Connections**: Understanding relationships between concepts
- **Practice Patterns**: Regular reinforcement techniques

### Quick Reference Systems
- **Common Values**: Frequently used numbers and relationships
- **Conversion Factors**: Standard conversions for quick use
- **Pattern Libraries**: Collection of recurring problem patterns
- **Error Prevention**: Checklist for avoiding common mistakes

## Time Management Integration
- **Problem Prioritization**: Which questions to attempt first
- **Time Allocation**: Optimal time distribution per problem type
- **Speed vs Accuracy**: Balancing efficiency with correctness
- **Recovery Strategies**: What to do when stuck or behind schedule`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "shortcut",
          title: `Speed Technique for ${subsectionTitle}`,
          content: "Quick calculation method or mental math trick",
          explanation: "How to apply this technique effectively in exams",
          example: "Practice problem with timing comparison"
        },
        {
          type: "pattern",
          title: "Recognition Pattern",
          content: "Common pattern in ${subsectionTitle} problems",
          explanation: "How to quickly identify and utilize this pattern",
          example: "Multiple examples showing pattern application"
        }
      ],
      keyTakeaway: `Master speed techniques and shortcuts to solve ${subsectionTitle} problems efficiently within ${examType} exam time constraints while maintaining accuracy.`
    },
    {
      pageNumber: 5,
      pageTitle: "Common Traps & Error Prevention",
      content: `# ${subsectionTitle} - Common Traps & Error Prevention

## Typical Mistakes in ${examType} Exams

Understanding and avoiding common errors is crucial for success:

### Conceptual Misunderstandings
1. **Formula Confusion**: Using wrong formulas for specific scenarios
   - **Prevention**: Clear understanding of when each formula applies
   - **Recognition**: Double-check formula selection before calculation
   - **Recovery**: Verify answer reasonableness to catch errors

2. **Problem Misinterpretation**: Incorrect understanding of question requirements
   - **Prevention**: Careful reading and question analysis
   - **Recognition**: Answers that seem too easy or complex
   - **Recovery**: Re-read question if answer seems unreasonable

### Calculation and Procedural Errors
- **Arithmetic Mistakes**: Basic computation errors under time pressure
- **Unit Inconsistencies**: Mixing different measurement units
- **Decimal Point Errors**: Misplacing decimal points in calculations
- **Sign Errors**: Incorrect handling of positive and negative values

## Exam-Specific Traps in ${subsectionTitle}

### Trap 1: Misleading Information Overload
**How it appears**: Questions with excessive data where only some is relevant
**Warning signs**: Multiple numerical values with unclear relevance
**Avoidance strategy**: Identify exactly what the question asks before using data
**Example scenario**: Word problems with extra information designed to confuse

### Trap 2: Answer Choice Manipulation
**How it appears**: Incorrect options that match common mistake patterns
**Warning signs**: Multiple "reasonable-looking" answers
**Avoidance strategy**: Work through the problem systematically, don't guess
**Example scenario**: Options that result from typical calculation errors

### Trap 3: Time Pressure Induced Errors
**How it appears**: Rushing leads to careless mistakes and poor decisions
**Warning signs**: Feeling panicked or behind schedule
**Avoidance strategy**: Maintain steady pace, skip difficult questions initially
**Example scenario**: Making calculation errors due to time anxiety

## Error Prevention Strategies

### Pre-Calculation Verification
- **Problem Understanding**: Ensure complete comprehension before starting
- **Method Validation**: Confirm chosen approach is appropriate
- **Formula Check**: Verify correct formula selection
- **Unit Consistency**: Ensure all measurements use compatible units

### During Calculation Monitoring
- **Step-by-Step Verification**: Check each calculation stage
- **Intermediate Result Testing**: Ensure partial answers make sense
- **Order of Operations**: Follow mathematical precedence rules
- **Sign Tracking**: Carefully monitor positive and negative values

### Post-Calculation Review
- **Answer Reasonableness**: Check if result makes logical sense
- **Unit Verification**: Confirm final answer has appropriate units
- **Range Testing**: Ensure answer falls within expected boundaries
- **Alternative Method**: Use different approach to verify when possible`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "trap",
          title: `Common ${examType} Exam Trap`,
          content: "Typical mistake pattern in ${subsectionTitle} problems",
          explanation: "How to identify and avoid this specific trap",
          example: "Problem demonstrating trap and correct solution approach"
        },
        {
          type: "prevention",
          title: "Error Prevention Checklist",
          content: "Systematic approach to avoiding common mistakes",
          explanation: "Step-by-step error prevention methodology",
          example: "Application of prevention techniques to sample problems"
        }
      ],
      keyTakeaway: `Develop systematic error prevention strategies and awareness of common traps to maximize accuracy in ${subsectionTitle} problems during ${examType} exams.`
    },
    {
      pageNumber: 6,
      pageTitle: "Practice Problems & Applications",
      content: `# ${subsectionTitle} - Practice Problems & Applications

## Graduated Practice Problem Sets

Build expertise through progressive difficulty levels:

### Level 1: Foundation Problems (Easy)
**Objective**: Master basic concepts and direct applications
**Time Target**: 30-60 seconds per problem
**Skills Developed**: Formula recognition, basic calculation, concept understanding

**Problem Structure**:
- Direct application of primary formulas
- Single-step calculations
- Clear, straightforward question format
- Minimal interpretation required

**Practice Approach**:
1. Focus on accuracy over speed initially
2. Ensure complete understanding of each step
3. Verify answers using alternative methods
4. Build confidence with consistent success

### Level 2: Application Problems (Medium)
**Objective**: Develop problem-solving skills and pattern recognition
**Time Target**: 1-2 minutes per problem
**Skills Developed**: Multi-step reasoning, method selection, strategic thinking

**Problem Structure**:
- Multi-step solution processes
- Moderate interpretation requirements
- Integration of multiple concepts
- Real-world application contexts

**Practice Approach**:
1. Analyze problem structure before solving
2. Plan solution strategy systematically
3. Monitor progress through intermediate steps
4. Develop speed while maintaining accuracy

### Level 3: Integration Problems (Hard)
**Objective**: Master complex scenarios and exam-level challenges
**Time Target**: 2-3 minutes per problem
**Skills Developed**: Advanced reasoning, concept integration, optimization

**Problem Structure**:
- Complex multi-concept integration
- Advanced interpretation requirements
- Time-pressure simulation
- Competitive exam difficulty level

**Practice Approach**:
1. Simulate actual exam conditions
2. Focus on efficient solution pathways
3. Develop backup strategies for difficult problems
4. Build confidence for exam performance

## Real ${examType} Exam Applications

### Historical Question Analysis
- **Frequency**: ${subsectionTitle} appears in approximately X% of ${examType} questions
- **Difficulty Distribution**: Easy (30%), Medium (50%), Hard (20%)
- **Question Formats**: Multiple choice, numerical answer, comparison-based
- **Integration Patterns**: Common combinations with other topics

### Strategic Exam Approach
- **Priority Assessment**: High/Medium/Low based on exam weightage and personal strength
- **Time Management**: Optimal time allocation per difficulty level
- **Attempt Strategy**: Order of problem-solving for maximum efficiency
- **Backup Planning**: Alternative approaches when primary method fails

## Comprehensive Practice Recommendations

### Daily Practice Routine
- **Concept Reinforcement**: 5-10 basic problems daily
- **Skill Development**: 3-5 medium problems for method practice
- **Challenge Training**: 1-2 hard problems for advanced preparation
- **Speed Building**: Weekly timed practice sessions

### Progress Monitoring System
- **Accuracy Tracking**: Monitor percentage of correct solutions
- **Speed Development**: Track time improvement over practice sessions
- **Concept Mastery**: Identify and address knowledge gaps
- **Exam Readiness**: Regular assessment of overall preparation level`,
      codeExamples: [],
      mathematicalContent: [
        {
          type: "practice",
          title: "Comprehensive Problem Set",
          content: "Collection of problems across all difficulty levels",
          explanation: "Solution strategies and timing guidelines",
          example: "Detailed solutions with alternative approaches"
        },
        {
          type: "application",
          title: `Real ${examType} Exam Problem`,
          content: "Authentic exam-style problem with full context",
          explanation: "Complete solution with exam strategy insights",
          example: "Time management and verification techniques"
        }
      ],
      keyTakeaway: `Regular, systematic practice with graduated difficulty levels and authentic exam problems builds comprehensive mastery of ${subsectionTitle} for ${examType} exam success.`
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
        
        // Limit subsections to avoid overwhelming content (max 4 per section)
        const subsectionsToProcess = section.subsections.slice(0, 4);
        
        for (const subsectionTitle of subsectionsToProcess) {
          console.log(`      Generating Subsection: ${subsectionTitle}`);
          
          const subsectionContent = generateSubsectionContent(
            module.title,
            section.title,
            subsectionTitle,
            course.examType || "SSC"
          );
          
          detailedSubsections.push(subsectionContent);
          totalSubsectionsGenerated++;
          
          console.log(`        ✅ Generated: ${subsectionTitle}`);
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