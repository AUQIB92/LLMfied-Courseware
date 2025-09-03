import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { 
      courseId, 
      moduleData, 
      style = 'academic', 
      theme = 'professional', 
      context 
    } = await request.json();

    // Validate required fields
    if (!moduleData || (!moduleData.moduleContent && !moduleData.detailedSubsections?.length)) {
      return NextResponse.json({
        success: false,
        error: 'Module data with content or detailed subsections is required'
      }, { status: 400 });
    }

    console.log('🎨 Generating slide deck:', {
      moduleTitle: moduleData.moduleTitle,
      style,
      theme,
      hasContent: !!moduleData.moduleContent,
      subsectionsCount: moduleData.detailedSubsections?.length || 0
    });

    // Prepare content for slide generation
    let contentToProcess = '';
    
    console.log('📝 Processing module data for slide generation:', {
      moduleTitle: moduleData.moduleTitle,
      hasObjectives: !!moduleData.objectives?.length,
      objectivesCount: moduleData.objectives?.length || 0,
      hasModuleContent: !!moduleData.moduleContent,
      moduleContentLength: moduleData.moduleContent?.length || 0,
      hasDetailedSubsections: !!moduleData.detailedSubsections?.length,
      detailedSubsectionsCount: moduleData.detailedSubsections?.length || 0
    });
    
    // Add module title and basic info
    contentToProcess += `# ${moduleData.moduleTitle || 'Academic Module'}\n\n`;
    
    // Add objectives if available
    if (moduleData.objectives && moduleData.objectives.length > 0) {
      contentToProcess += `## Learning Objectives:\n`;
      moduleData.objectives.forEach((obj, index) => {
        contentToProcess += `${index + 1}. ${obj}\n`;
      });
      contentToProcess += '\n';
      console.log(`📋 Added ${moduleData.objectives.length} learning objectives`);
    }
    
    // Add main module content
    if (moduleData.moduleContent) {
      contentToProcess += `## Module Content:\n${moduleData.moduleContent}\n\n`;
      console.log(`📄 Added main module content: ${moduleData.moduleContent.length} characters`);
    }
    
    // Add detailed subsections
    if (moduleData.detailedSubsections && moduleData.detailedSubsections.length > 0) {
      contentToProcess += `## Detailed Topics:\n`;
      moduleData.detailedSubsections.forEach((subsection, index) => {
        contentToProcess += `### ${subsection.title || `Topic ${index + 1}`}\n`;
        
        let addedContent = false;
        
        // Add content from various possible sources
        if (subsection.explanation) {
          contentToProcess += `${subsection.explanation}\n\n`;
          addedContent = true;
          console.log(`🔍 Added explanation for ${subsection.title}: ${subsection.explanation.length} chars`);
        } else if (subsection.content) {
          contentToProcess += `${subsection.content}\n\n`;
          addedContent = true;
          console.log(`🔍 Added content for ${subsection.title}: ${subsection.content.length} chars`);
        } else if (subsection.generatedMarkdown) {
          contentToProcess += `${subsection.generatedMarkdown}\n\n`;
          addedContent = true;
          console.log(`🔍 Added markdown for ${subsection.title}: ${subsection.generatedMarkdown.length} chars`);
        }
        
        // Add pages if available
        if (subsection.pages && Array.isArray(subsection.pages)) {
          subsection.pages.forEach((page, pageIndex) => {
            if (page.content || page.html) {
              contentToProcess += `#### ${page.pageTitle || page.title || `Page ${pageIndex + 1}`}\n`;
              contentToProcess += `${page.content || page.html}\n\n`;
              addedContent = true;
              console.log(`📖 Added page content for ${subsection.title}: page ${pageIndex + 1}`);
            }
          });
        }
        
        if (!addedContent) {
          // Add placeholder content
          contentToProcess += `This section covers ${subsection.title}. Detailed content will be provided during the lesson.\n\n`;
          console.log(`⚠️ No content found for ${subsection.title}, added placeholder`);
        }
      });
      console.log(`📚 Processed ${moduleData.detailedSubsections.length} detailed subsections`);
    }
    
    console.log(`📝 Final content length: ${contentToProcess.length} characters`);
    console.log(`📝 Content preview:`, contentToProcess.substring(0, 500));

    // Create the simplified slide generation prompt
    const slidePrompt = `
You are an expert presentation designer. Create a comprehensive slide deck with rich, detailed content for every slide.

**Content to Convert:**
${contentToProcess}

**Requirements:**
- Style: ${style}
- Theme: ${theme}
- Academic Level: ${context?.academicLevel || 'undergraduate'}
- Subject: ${context?.subject || 'General Studies'}

**Create 10-12 slides with RICH CONTENT:**
Each slide must have:
- 250-400 words of detailed, meaningful content
- Comprehensive explanations with examples
- Visual suggestions for diagrams and charts
- Interactive elements for student engagement
- Detailed speaker notes

**JSON Structure Required:**
{
  "slides": [
    {
      "title": "Clear Slide Title",
      "content": "Rich HTML content with detailed explanations, examples, and visual descriptions (250-400 words)",
      "visualSuggestions": ["Specific diagram description", "Chart type and data", "Interactive visual element"],
      "interactiveElements": ["Poll question", "Discussion prompt", "Hands-on activity"],
      "notes": "Comprehensive speaker notes with teaching guidance",
      "type": "title|content|practice|summary|assessment",
      "estimatedTime": "5-8 minutes"
    }
  ]
}

**Slide Types Needed:**
1. Title slide with course overview
2. Learning objectives with clear goals
3. 6-8 content slides covering major concepts
4. Practice/application slide with exercises
5. Summary slide with key takeaways

**Content Guidelines:**
- Use HTML formatting: <h3>, <p>, <ul>, <li>, <strong>, <em>, <div>
- Include LaTeX math: \\(x^2\\) for inline, \\[E=mc^2\\] for display
- Add visual placeholders: [DIAGRAM: specific description]
- Provide detailed examples and real-world applications
- Include step-by-step explanations

**Visual Requirements:**
- 3-4 visual suggestions per slide
- Specific diagram and chart descriptions
- Interactive element ideas
- Accessibility considerations

Generate the complete slide deck with substantial, detailed content for each slide. Return only valid JSON:`;

    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const startTime = Date.now();

    // Generate the slides
    const result = await model.generateContent(slidePrompt);
    const response = await result.response;
    const text = response.text();

    const generationTime = `${Date.now() - startTime}ms`;

    console.log('🎨 Raw slide generation response length:', text.length);
    console.log('🎨 Raw response preview:', text.substring(0, 500));

    // Parse the JSON response
    let slidesData;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      
      // More robust cleaning of markdown code blocks
      if (cleanedText.includes('```json')) {
        const jsonStart = cleanedText.indexOf('```json') + 7;
        const jsonEnd = cleanedText.lastIndexOf('```');
        cleanedText = cleanedText.substring(jsonStart, jsonEnd).trim();
      } else if (cleanedText.includes('```')) {
        const jsonStart = cleanedText.indexOf('```') + 3;
        const jsonEnd = cleanedText.lastIndexOf('```');
        cleanedText = cleanedText.substring(jsonStart, jsonEnd).trim();
      }
      
      // Also try to extract JSON from between { and }
      if (!cleanedText.startsWith('{')) {
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
      }

      console.log('🔧 Cleaned text for parsing:', cleanedText.substring(0, 300));
      
      slidesData = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed slide data:', {
        hasSlides: !!slidesData.slides,
        slideCount: slidesData.slides?.length || 0,
        firstSlideTitle: slidesData.slides?.[0]?.title || 'No title',
        firstSlideContentLength: slidesData.slides?.[0]?.content?.length || 0
      });
      
    } catch (parseError) {
      console.error('❌ Failed to parse slide generation response:', parseError);
      console.log('🔍 Response text that failed to parse:', text.substring(0, 1000));
      
      // Try alternative parsing approaches before fallback
      try {
        // Try to find JSON in the response text
        const possibleJson = text.match(/\{[\s\S]*"slides"[\s\S]*\}/);
        if (possibleJson) {
          console.log('🔄 Attempting alternative JSON parsing...');
          slidesData = JSON.parse(possibleJson[0]);
          console.log('✅ Alternative parsing successful!');
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (secondParseError) {
        console.error('❌ Alternative parsing also failed, using fallback');
        // Fallback: create basic slides from content
        slidesData = createFallbackSlides(moduleData);
      }
    }

    // Validate slides structure
    if (!slidesData || !slidesData.slides || !Array.isArray(slidesData.slides)) {
      console.warn('⚠️ Invalid slides structure, creating fallback');
      slidesData = createFallbackSlides(moduleData);
    }

    // Ensure each slide has required fields with enhanced visual features
    slidesData.slides = slidesData.slides.map((slide, index) => ({
      title: slide.title || `Slide ${index + 1}`,
      content: slide.content || '<div class="content-section"><p>Rich content will be available soon with visual elements and interactive components.</p></div>',
      visualSuggestions: slide.visualSuggestions || [
        `Relevant diagram for ${slide.title || 'this topic'}`,
        `Interactive chart showing key concepts`,
        `Visual aid to reinforce learning`
      ],
      interactiveElements: slide.interactiveElements || [
        `Discussion: What are your thoughts on ${slide.title || 'this topic'}?`,
        `Quick poll to gauge understanding`,
        `Hands-on activity to apply concepts`
      ],
      notes: slide.notes || `Detailed speaker notes for slide ${index + 1}. Include examples, encourage interaction, and provide additional context.`,
      type: slide.type || 'content',
      estimatedTime: slide.estimatedTime || '5-7 minutes'
    }));

    console.log('✅ Slide deck generated successfully:', {
      totalSlides: slidesData.slides.length,
      generationTime,
      style,
      theme
    });

    return NextResponse.json({
      success: true,
      slides: slidesData.slides,
      metadata: {
        generatedWith: 'gemini-1.5-flash',
        generationTime,
        style,
        theme,
        totalSlides: slidesData.slides.length,
        moduleTitle: moduleData.moduleTitle,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Slide generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate slide deck',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Fallback function to create basic slides when AI parsing fails
function createFallbackSlides(moduleData) {
  console.log('🔄 Creating fallback slides from module data:', {
    hasTitle: !!moduleData.moduleTitle,
    hasContent: !!moduleData.moduleContent,
    hasObjectives: !!moduleData.objectives?.length,
    hasSubsections: !!moduleData.detailedSubsections?.length,
    contentLength: moduleData.moduleContent?.length || 0
  });

  const slides = [];
  
  // Enhanced Title slide with visual suggestions
  slides.push({
    title: moduleData.moduleTitle || 'Academic Module',
    content: `
      <div class="content-section text-center py-8">
        <div class="highlight-box mb-6">
          <h1 class="text-5xl font-bold text-blue-900 mb-6">${moduleData.moduleTitle || 'Academic Module'}</h1>
          <div class="w-24 h-1 bg-blue-500 mx-auto mb-6"></div>
          <p class="text-2xl text-gray-700 mb-4">${moduleData.subject || 'Academic Content'}</p>
          <p class="text-xl text-gray-500">${moduleData.academicLevel || 'Undergraduate'} Level</p>
          ${moduleData.context?.semester ? `<p class="text-lg text-gray-400 mt-2">Semester ${moduleData.context.semester}</p>` : ''}
        </div>
        
        <div class="visual-placeholder bg-gray-100 p-4 rounded-lg mt-6">
          [VISUAL: Course branding with institutional logo and thematic imagery related to ${moduleData.subject || 'the subject'}]
        </div>
        
        <div class="intro-text mt-6 text-lg text-gray-700">
          <p>Welcome to an engaging learning journey where theory meets practice!</p>
          <p>This module combines comprehensive content with interactive elements to enhance your understanding.</p>
        </div>
      </div>
    `,
    visualSuggestions: [
      `Institutional branding with logo and course banner`,
      `Subject-related imagery or icons (${moduleData.subject || 'academic'})`,
      `Interactive course roadmap showing module progression`,
      `Student engagement metrics or progress indicators`
    ],
    interactiveElements: [
      `Icebreaker: Quick introduction poll about students' background in ${moduleData.subject || 'the subject'}`,
      `Interactive course expectations survey`,
      `Pre-assessment quiz to gauge current knowledge level`
    ],
    notes: `Welcome slide introducing ${moduleData.moduleTitle}. Begin with an engaging opener, explain the course structure, and set clear expectations. Use visuals to create immediate engagement and establish the learning atmosphere. Encourage student introductions and gauge prior knowledge.`,
    type: 'title',
    estimatedTime: '5-8 minutes'
  });

  // Enhanced Learning objectives slide with visual mapping
  if (moduleData.objectives && moduleData.objectives.length > 0) {
    slides.push({
      title: 'Learning Objectives & Goals',
      content: `
        <div class="content-section">
          <div class="highlight-box mb-6">
            <h3 class="text-2xl font-bold text-blue-900 mb-4">By the end of this module, you will be able to:</h3>
          </div>
          
          <div class="objectives-grid space-y-4">
            ${moduleData.objectives.map((obj, index) => `
              <div class="objective-item flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div class="objective-number bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  ${index + 1}
                </div>
                <div class="objective-text flex-1">
                  <p class="text-gray-800 font-medium">${obj}</p>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="visual-placeholder bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mt-6">
            [VISUAL: Interactive goal mapping diagram showing progression from basic concepts to advanced applications]
            [INTERACTIVE: Progress tracking system where students can check off completed objectives]
          </div>
          
          <div class="success-metrics mt-6 p-4 bg-green-50 rounded-lg">
            <h4 class="font-bold text-green-800 mb-2">Success Indicators:</h4>
            <ul class="text-green-700 space-y-1">
              <li>✓ Demonstrate understanding through practical applications</li>
              <li>✓ Complete hands-on exercises with confidence</li>
              <li>✓ Connect theoretical concepts to real-world scenarios</li>
            </ul>
          </div>
        </div>
      `,
      visualSuggestions: [
        `Interactive objectives checklist with progress bars`,
        `Visual learning pathway showing skill development stages`,
        `Competency matrix diagram mapping objectives to assessments`,
        `Animated timeline showing module progression`
      ],
      interactiveElements: [
        `Self-assessment: Rate your current confidence level for each objective (1-10 scale)`,
        `Goal-setting activity: Students write personal learning targets`,
        `Interactive poll: Which objective are you most excited to achieve?`
      ],
      notes: `Review learning objectives thoroughly, allowing students to ask questions and relate objectives to their goals. Use the visual elements to make abstract concepts concrete. Encourage students to bookmark this slide for reference throughout the module.`,
      type: 'content',
      estimatedTime: '6-8 minutes'
    });
  }

  // Content slides from subsections
  if (moduleData.detailedSubsections && moduleData.detailedSubsections.length > 0) {
    moduleData.detailedSubsections.slice(0, 8).forEach((subsection, index) => {
      let content = '';
      
      // Extract content from various sources
      if (subsection.explanation) {
        content = subsection.explanation;
      } else if (subsection.content) {
        content = subsection.content;
      } else if (subsection.generatedMarkdown) {
        content = subsection.generatedMarkdown;
      } else if (subsection.pages && subsection.pages.length > 0) {
        const firstPage = subsection.pages[0];
        content = firstPage.content || firstPage.html || 'Page content available in detailed view.';
      } else {
        content = `This section covers ${subsection.title}. Key concepts and detailed explanations will be provided during the lesson.`;
      }

      // Clean and format content for slides
      const cleanContent = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold markdown
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic markdown
        .substring(0, 1000);

      slides.push({
        title: subsection.title || `Topic ${index + 1}`,
        content: `
          <div class="content-section space-y-6">
            <div class="topic-header">
              <h3 class="text-3xl font-bold text-gray-800 mb-2">${subsection.title}</h3>
              <div class="w-16 h-1 bg-blue-500 mb-4"></div>
            </div>
            
            <div class="main-content">
              <div class="concept-explanation bg-white p-6 rounded-lg border shadow-sm">
                <h4 class="font-bold text-blue-900 mb-4">Core Concepts:</h4>
                <div class="prose prose-lg max-w-none">
                  ${cleanContent.substring(0, 500)}${content.length > 500 ? '<br><br><em>...detailed examples and applications follow</em>' : ''}
                </div>
              </div>
              
              ${content.length > 500 ? `
                <div class="extended-content mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 class="font-bold text-gray-800 mb-3">Detailed Explanation:</h4>
                  <div class="prose prose-lg max-w-none">
                    ${cleanContent.substring(500, 1200)}${content.length > 1200 ? '<br><em>...continued with examples and practice</em>' : ''}
                  </div>
                </div>
              ` : ''}
              
              <div class="visual-placeholder bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-dashed border-purple-300 mt-6">
                [DIAGRAM: Conceptual visualization of ${subsection.title}]<br>
                [CHART: Data representation or process flow]<br>
                [INTERACTIVE: Clickable elements for deeper exploration]
              </div>
            </div>
            
            ${subsection.keyTakeaway ? `
              <div class="key-takeaway mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h4 class="font-bold text-green-800 mb-3 flex items-center">
                  <span class="mr-2">🎯</span> Key Takeaway:
                </h4>
                <p class="text-green-700 text-lg">${subsection.keyTakeaway}</p>
              </div>
            ` : `
              <div class="key-takeaway mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 class="font-bold text-blue-800 mb-3 flex items-center">
                  <span class="mr-2">🎯</span> Remember:
                </h4>
                <p class="text-blue-700 text-lg">Master ${subsection.title} concepts through practice and real-world application.</p>
              </div>
            `}
          </div>
        `,
        visualSuggestions: [
          `Detailed concept diagram showing ${subsection.title} components and relationships`,
          `Interactive flowchart demonstrating process steps or decision points`,
          `Comparative chart showing before/after or different approaches`,
          `Real-world example gallery with case studies and applications`
        ],
        interactiveElements: [
          `Concept check: Quick quiz on ${subsection.title} fundamentals`,
          `Discussion forum: Share real-world examples of ${subsection.title}`,
          `Hands-on simulation or interactive demo`,
          `Group activity: Collaborative problem-solving exercise`
        ],
        notes: `Comprehensive explanation of ${subsection.title}. Start with core concepts, use visuals extensively, provide concrete examples, and encourage active participation. Allow time for questions and practical application.`,
        type: 'content',
        estimatedTime: '8-12 minutes'
      });
    });
  } else if (moduleData.moduleContent) {
    // Create slides from main content - split into meaningful sections
    const contentSections = moduleData.moduleContent.split(/\n\n+/).filter(section => section.trim().length > 50);
    const maxSlides = Math.min(6, contentSections.length);
    
    for (let i = 0; i < maxSlides; i++) {
      const section = contentSections[i] || moduleData.moduleContent.substring(i * 500, (i + 1) * 500);
      
      slides.push({
        title: `Module Content ${i + 1}`,
        content: `
          <div class="content-section space-y-4">
            <h3 class="text-2xl font-semibold text-gray-800 mb-4">Content Overview ${i + 1}</h3>
            <div class="prose prose-lg max-w-none bg-white p-6 rounded-lg border shadow-sm">
              ${section.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
            </div>
            <div class="visual-placeholder bg-gray-100 p-4 rounded-lg">
              [VISUAL: Supporting diagram or chart for this content section]
            </div>
          </div>
        `,
        visualSuggestions: [
          `Supporting diagram for content section ${i + 1}`,
          `Interactive chart showing key data points`,
          `Real-world application examples`
        ],
        interactiveElements: [
          `Discussion: How does this relate to your experience?`,
          `Quick comprehension check`,
          `Practical application exercise`
        ],
        notes: `Content section ${i + 1}. Provide additional context, examples, and engage with students.`,
        type: 'content',
        estimatedTime: '6-8 minutes'
      });
    }
  }

  // Summary slide
  slides.push({
    title: 'Summary & Key Takeaways',
    content: `
      <div class="content-section">
        <h3 class="text-2xl font-bold text-blue-900 mb-6">Key Takeaways:</h3>
        <div class="takeaways-grid space-y-4">
          <div class="takeaway-item bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
            <strong>Core Concepts:</strong> We covered the fundamental principles of ${moduleData.moduleTitle || 'this academic topic'}
          </div>
          <div class="takeaway-item bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-l-4 border-green-500">
            <strong>Applications:</strong> Important real-world applications and practical examples were discussed
          </div>
          <div class="takeaway-item bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-500">
            <strong>Foundation:</strong> You now have the groundwork to explore advanced topics and applications
          </div>
        </div>
        
        <div class="next-steps mt-8 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
          <h4 class="font-bold text-orange-800 mb-3">Next Steps:</h4>
          <ul class="text-orange-700 space-y-2">
            <li>• Continue with practice exercises and hands-on applications</li>
            <li>• Review additional readings and supplementary materials</li>
            <li>• Apply concepts to real-world scenarios and projects</li>
            <li>• Prepare for assessments and advanced modules</li>
          </ul>
        </div>
        
        <div class="visual-placeholder bg-gray-100 p-6 rounded-lg mt-6">
          [VISUAL: Mind map or concept web showing connections between all major topics]
          [INTERACTIVE: Final knowledge check or reflection activity]
        </div>
      </div>
    `,
    visualSuggestions: [
      `Comprehensive mind map connecting all module concepts`,
      `Visual summary timeline of learning progression`,
      `Interactive concept web for review`,
      `Progress celebration graphics showing achievement`
    ],
    interactiveElements: [
      `Final reflection: What was your biggest learning from this module?`,
      `Knowledge check: Quick review quiz covering main concepts`,
      `Goal setting: What will you apply from this learning?`,
      `Peer sharing: Discuss key insights with classmates`
    ],
    notes: 'Comprehensive wrap-up emphasizing key learning outcomes. Encourage reflection, celebrate progress, and provide clear guidance for continued learning. Use this time for Q&A and final clarifications.',
    type: 'summary',
    estimatedTime: '8-10 minutes'
  });

  return { slides };
}