import { NextResponse } from "next/server";
import { generateModuleSummary } from "@/lib/gemini";
import jwt from "jsonwebtoken";

async function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.JWT_SECRET);
}

// Generate comprehensive academic modules using AI
async function generateAcademicCurriculum(courseInfo) {
  const { title, description, subject, academicLevel, credits, semester, objectives, numberOfModules = 8 } = courseInfo;
  
  const modules = [];
  
  console.log(`🎓 Generating ${numberOfModules} academic modules for ${title}...`);

  // Create module topics based on subject and level
  const moduleTopics = await generateModuleTopics(courseInfo);
  
  for (let i = 0; i < numberOfModules; i++) {
    const moduleNumber = i + 1;
    const topicName = moduleTopics[i] || `Advanced Topics in ${subject} ${moduleNumber}`;
    
    console.log(`📚 Generating academic module ${moduleNumber}/${numberOfModules}: ${topicName}...`);

    try {
      const prompt = `You are an expert academic curriculum developer specializing in ${subject} education. Create a comprehensive academic course module for a ${academicLevel} level course.

Course Information:
- Title: ${title}
- Subject: ${subject}
- Academic Level: ${academicLevel}
- Credits: ${credits}
- Semester: ${semester || 'Not specified'}
- Overall Description: ${description}

Module to Create:
- Module Number: ${moduleNumber} of ${numberOfModules}
- Module Topic: ${topicName}
- Target Learning Objectives: ${objectives.join(', ') || 'Not specified'}

Create a detailed academic module with the following structure:

**Module Title:** ${topicName}

**Summary:** [Comprehensive overview of this module's importance in the academic curriculum and how it builds upon previous knowledge]

**Learning Objectives:**
- [Specific, measurable learning outcome 1 using Bloom's taxonomy]
- [Specific, measurable learning outcome 2 using Bloom's taxonomy]
- [Specific, measurable learning outcome 3 using Bloom's taxonomy]
- [Additional objective if relevant]

**Detailed Content:**
[Comprehensive academic content (1500-2000 words) including:
- Theoretical foundations and key concepts
- Historical context and development
- Current research and trends
- Detailed explanations with academic rigor
- Key principles, theories, and methodologies
- Critical analysis and evaluation criteria
- Connections to other academic disciplines
- Important terminology with precise definitions
- Real-world applications and case studies
- Contemporary debates and perspectives]

**Topics Covered:**
- [Specific academic topic 1]
- [Specific academic topic 2]
- [Specific academic topic 3]
- [Specific academic topic 4]
- [Additional topics as needed]

**Examples:**
- [Relevant academic example with detailed explanation]
- [Contemporary case study with analysis]
- [Historical example showing evolution of concepts]

**Assignments:**
- [Research-based assignment focusing on critical analysis]
- [Problem-solving exercise requiring application of concepts]
- [Collaborative project promoting deeper understanding]

**Discussion Questions:**
- [Thought-provoking question encouraging critical thinking]
- [Analytical question connecting theory to practice]
- [Evaluative question requiring synthesis of knowledge]

**Recommended Books:**
- [Essential academic textbook with author and publication info]
- [Scholarly journal articles or research papers]
- [Supplementary reading for extended learning]

**Additional Resources:**
- [Relevant academic websites or databases]
- [Professional organizations or societies]
- [Multimedia resources (videos, simulations, etc.)]

**Assessment Methods:**
- [Formative assessment approach]
- [Summative assessment strategy]
- [Alternative assessment option]

**Estimated Study Time:** [Realistic time estimate based on credit hours and academic level]

**Difficulty Level:** ${academicLevel === 'undergraduate' ? 'intermediate to advanced' : 'advanced to expert'}

**Prerequisites:** [Knowledge or skills students should have before this module]

**Connections:** [How this module connects to other modules in the course]

Format the response in clear Markdown with proper academic structure. Ensure content is rigorous, scholarly, and appropriate for ${academicLevel} students in ${subject}. Include recent developments and current research where applicable.`;

      const moduleContent = await generateModuleSummary(prompt);
      
      // Parse the generated content
      const parsedModule = parseGeneratedModule(moduleContent);
      
      const module = {
        id: Date.now() + i,
        title: parsedModule.title || topicName,
        content: moduleContent,
        summary: parsedModule.summary || `Academic module covering ${topicName} in ${subject}`,
        order: moduleNumber,
        objectives: parsedModule.objectives || [],
        examples: parsedModule.examples || [],
        topics: parsedModule.topics || [],
        assignments: parsedModule.assignments || [],
        discussions: parsedModule.discussions || [],
        resources: parsedModule.resources || { books: [], articles: [], websites: [] },
        assessments: parsedModule.assessments || [],
        estimatedStudyTime: parsedModule.estimatedStudyTime || `${credits * 2}-${credits * 3} hours`,
        difficultyLevel: parsedModule.difficultyLevel || (academicLevel === 'undergraduate' ? 'intermediate' : 'advanced'),
        prerequisites: parsedModule.prerequisites || [],
        connections: parsedModule.connections || '',
        academicLevel: academicLevel,
        subject: subject,
        moduleType: 'academic',
        credits: credits
      };

      modules.push(module);
      console.log(`✅ Academic module "${module.title}" generated successfully`);

    } catch (error) {
      console.error(`❌ Error generating academic module ${moduleNumber}:`, error);
      
      // Create fallback module
      const fallbackModule = {
        id: Date.now() + i,
        title: topicName,
        content: `# ${topicName}\n\nThis module covers important concepts in ${subject} at the ${academicLevel} level.\n\n## Learning Objectives\n- Understand key concepts in ${topicName}\n- Apply theoretical knowledge to practical scenarios\n- Analyze and evaluate different approaches\n\n## Content\nDetailed content will be developed based on ${subject} curriculum standards for ${academicLevel} students.`,
        summary: `Academic module covering ${topicName} in ${subject}`,
        order: moduleNumber,
        objectives: [`Understand key concepts in ${topicName}`, `Apply theoretical knowledge`, `Analyze different approaches`],
        examples: [],
        topics: [topicName],
        assignments: [`Research assignment on ${topicName}`, `Analysis exercise`],
        discussions: [`Discussion on ${topicName} applications`],
        resources: { books: [], articles: [], websites: [] },
        assessments: ['Formative quiz', 'Module assignment'],
        estimatedStudyTime: `${credits * 2}-${credits * 3} hours`,
        difficultyLevel: academicLevel === 'undergraduate' ? 'intermediate' : 'advanced',
        prerequisites: [],
        connections: '',
        academicLevel: academicLevel,
        subject: subject,
        moduleType: 'academic',
        credits: credits
      };
      
      modules.push(fallbackModule);
    }
  }

  return modules;
}

// Generate module topics based on subject and academic level
async function generateModuleTopics(courseInfo) {
  const { title, subject, academicLevel, numberOfModules = 8 } = courseInfo;
  
  try {
    const prompt = `Generate ${numberOfModules} specific module topics for an academic course titled "${title}" in ${subject} at the ${academicLevel} level.

Requirements:
- Topics should be logically sequenced from foundational to advanced
- Each topic should be distinct and comprehensive
- Topics should cover the breadth of ${subject} appropriate for ${academicLevel} students
- Topics should build upon each other progressively
- Include both theoretical and practical aspects where applicable

Return only a numbered list of ${numberOfModules} module topics, one per line:
1. [Topic 1]
2. [Topic 2]
...`;

    const response = await generateModuleSummary(prompt);
    
    // Parse the topics from the response
    const topics = response
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(topic => topic.length > 0);
    
    // If we didn't get enough topics, generate defaults
    if (topics.length < numberOfModules) {
      const defaultTopics = generateDefaultTopics(subject, academicLevel, numberOfModules);
      return [...topics, ...defaultTopics.slice(topics.length)];
    }
    
    return topics.slice(0, numberOfModules);
    
  } catch (error) {
    console.error('Error generating module topics:', error);
    return generateDefaultTopics(subject, academicLevel, numberOfModules);
  }
}

// Generate default topics if AI generation fails
function generateDefaultTopics(subject, academicLevel, count) {
  const topicTemplates = {
    'Computer Science': [
      'Introduction to Programming Fundamentals',
      'Data Structures and Algorithms',
      'Object-Oriented Programming',
      'Database Systems and Design',
      'Software Engineering Principles',
      'Computer Networks and Security',
      'Web Development Technologies',
      'Advanced Programming Concepts'
    ],
    'Mathematics': [
      'Mathematical Foundations',
      'Algebra and Functions',
      'Calculus and Analysis',
      'Statistics and Probability',
      'Linear Algebra',
      'Discrete Mathematics',
      'Mathematical Modeling',
      'Advanced Topics in Mathematics'
    ],
    'Business': [
      'Introduction to Business Principles',
      'Management and Leadership',
      'Marketing Strategies',
      'Financial Management',
      'Operations Management',
      'Business Ethics and Law',
      'Strategic Planning',
      'International Business'
    ]
  };

  const defaultTopics = topicTemplates[subject] || [
    'Foundational Concepts',
    'Core Principles',
    'Theoretical Framework',
    'Practical Applications',
    'Advanced Methods',
    'Contemporary Issues',
    'Research and Analysis',
    'Synthesis and Integration'
  ];

  // Adjust for academic level
  if (academicLevel === 'graduate' || academicLevel === 'postgraduate') {
    return defaultTopics.map(topic => `Advanced ${topic}`).slice(0, count);
  }

  return defaultTopics.slice(0, count);
}

// Parse generated module content
function parseGeneratedModule(content) {
  const result = {
    title: null,
    summary: null,
    objectives: [],
    topics: [],
    examples: [],
    assignments: [],
    discussions: [],
    resources: { books: [], articles: [], websites: [] },
    assessments: [],
    estimatedStudyTime: null,
    difficultyLevel: null,
    prerequisites: [],
    connections: null
  };

  // Extract title
  const titleMatch = content.match(/\*\*Module Title:\*\*\s*([^\n]+)/i);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  // Extract summary
  const summaryMatch = content.match(/\*\*Summary:\*\*\s*\n([^\n]+(?:\n[^\n#*]+)*)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  // Extract learning objectives
  const objectivesMatch = content.match(/\*\*Learning Objectives:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (objectivesMatch) {
    result.objectives = objectivesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(obj => obj.length > 0);
  }

  // Extract topics
  const topicsMatch = content.match(/\*\*Topics Covered:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (topicsMatch) {
    result.topics = topicsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(topic => topic.length > 0);
  }

  // Extract examples
  const examplesMatch = content.match(/\*\*Examples:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (examplesMatch) {
    result.examples = examplesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(ex => ex.length > 0);
  }

  // Extract assignments
  const assignmentsMatch = content.match(/\*\*Assignments:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (assignmentsMatch) {
    result.assignments = assignmentsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(assignment => assignment.length > 0);
  }

  // Extract discussion questions
  const discussionsMatch = content.match(/\*\*Discussion Questions:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (discussionsMatch) {
    result.discussions = discussionsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(discussion => discussion.length > 0);
  }

  // Extract recommended books
  const booksMatch = content.match(/\*\*Recommended Books:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (booksMatch) {
    result.resources.books = booksMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(book => book.length > 0);
  }

  // Extract assessment methods
  const assessmentsMatch = content.match(/\*\*Assessment Methods:\*\*\s*\n((?:- [^\n]+\n?)+)/i);
  if (assessmentsMatch) {
    result.assessments = assessmentsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(assessment => assessment.length > 0);
  }

  // Extract estimated study time
  const timeMatch = content.match(/\*\*Estimated Study Time:\*\*\s*([^\n]+)/i);
  if (timeMatch) {
    result.estimatedStudyTime = timeMatch[1].trim();
  }

  // Extract difficulty level
  const difficultyMatch = content.match(/\*\*Difficulty Level:\*\*\s*([^\n]+)/i);
  if (difficultyMatch) {
    result.difficultyLevel = difficultyMatch[1].trim().toLowerCase();
  }

  // Extract prerequisites
  const prerequisitesMatch = content.match(/\*\*Prerequisites:\*\*\s*([^\n]+)/i);
  if (prerequisitesMatch) {
    result.prerequisites = prerequisitesMatch[1].split(',').map(p => p.trim()).filter(p => p.length > 0);
  }

  // Extract connections
  const connectionsMatch = content.match(/\*\*Connections:\*\*\s*([^\n]+)/i);
  if (connectionsMatch) {
    result.connections = connectionsMatch[1].trim();
  }

  return result;
}

export async function POST(request) {
  try {
    console.log("🎓 Generating academic course modules with AI...");

    // Verify authentication
    const user = await verifyToken(request);
    if (user.role !== "educator") {
      return NextResponse.json(
        { error: "Only educators can generate academic course modules" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      subject,
      academicLevel,
      credits,
      semester,
      objectives,
      numberOfModules = 8
    } = body;

    if (!title?.trim() || !subject || !academicLevel) {
      return NextResponse.json(
        { error: "Course title, subject, and academic level are required" },
        { status: 400 }
      );
    }

    console.log(`📚 Generating modules for: ${title} (${subject} - ${academicLevel})`);

    const courseInfo = {
      title: title.trim(),
      description: description?.trim() || '',
      subject,
      academicLevel,
      credits: credits || 3,
      semester: semester?.trim() || '',
      objectives: Array.isArray(objectives) ? objectives.filter(obj => obj?.trim()) : [],
      numberOfModules: Math.min(Math.max(numberOfModules, 4), 12) // Limit between 4-12 modules
    };

    const modules = await generateAcademicCurriculum(courseInfo);

    console.log(`✅ Academic module generation complete! Generated ${modules.length} modules`);

    return NextResponse.json({
      success: true,
      modules,
      moduleCount: modules.length,
      message: `Successfully generated ${modules.length} comprehensive academic modules for ${title}`,
      courseInfo: {
        title,
        subject,
        academicLevel,
        credits,
        totalModules: modules.length
      }
    });

  } catch (error) {
    console.error("❌ Academic module generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate academic modules",
        details: error.message
      },
      { status: 500 }
    );
  }
} 