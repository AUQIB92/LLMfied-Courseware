import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/gemini'

export async function POST(request) {
  try {
    const body = await request.json()
    const { concept, type, learnerLevel, moduleContent } = body

    if (!concept) {
      return NextResponse.json(
        { error: 'Concept is required' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Visualizer type is required' },
        { status: 400 }
      )
    }

    // Generate comprehensive visualizer using AI
    const prompt = `Create an interactive educational visualizer for the following concept:

**Concept**: ${concept}
**Visualizer Type**: ${type}
**Learner Level**: ${learnerLevel || 'intermediate'}
**Module Context**: ${moduleContent ? moduleContent.substring(0, 500) + '...' : 'General educational context'}

Generate a complete visualizer specification with the following structure:

**REQUIRED RESPONSE FORMAT** (JSON):
{
  "id": "unique-visualizer-id",
  "title": "Engaging title for the visualizer",
  "concept": "${concept}",
  "type": "${type}",
  "difficulty": "${learnerLevel || 'intermediate'}",
  "description": "Clear description of what students will learn",
  "explanation": "Detailed explanation of the concept being visualized",
  "estimatedTime": "X-Y minutes",
  "learningObjectives": [
    "Specific learning objective 1",
    "Specific learning objective 2",
    "Specific learning objective 3"
  ],
  "interactiveElements": [
    {
      "element": "Interactive feature name",
      "description": "What this feature does",
      "type": "button|slider|input|dropdown|toggle"
    }
  ],
  "visualizerCode": {
    "html": "Complete HTML structure for the visualizer",
    "css": "Complete CSS styling for responsive design",
    "javascript": "Complete JavaScript for interactivity"
  },
  "mermaidDiagram": "Mermaid diagram code if applicable",
  "keyInsights": [
    "Key insight 1 students will gain",
    "Key insight 2 students will gain"
  ],
  "realWorldApplications": [
    "Real-world application 1",
    "Real-world application 2"
  ]
}

**VISUALIZER TYPE GUIDELINES**:

**Flowchart**: Create interactive decision trees, process flows, algorithm visualizations with clickable nodes, step-by-step progression, and branching logic.

**Comparison**: Build side-by-side interactive comparisons with toggleable features, pros/cons analysis, feature matrices, and visual contrasts.

**Timeline**: Design chronological visualizations with interactive milestones, expandable events, zoom functionality, and temporal relationships.

**Formula**: Develop mathematical visualizers with interactive variables, real-time calculations, graphical representations, and parameter manipulation.

**Hierarchy**: Create organizational structures with expandable/collapsible nodes, level navigation, relationship visualization, and drill-down capabilities.

**Relationship**: Build network diagrams with interactive nodes, connection highlighting, clustering, and relationship strength visualization.

**Simulation**: Design dynamic models with adjustable parameters, real-time updates, scenario testing, and outcome visualization.

**Process**: Create step-by-step procedure visualizations with interactive progression, checkpoint validation, and progress tracking.

**TECHNICAL REQUIREMENTS**:
- Make it fully responsive and mobile-friendly
- Use modern CSS (flexbox/grid, animations, gradients)
- Include interactive JavaScript with event handlers
- Add smooth transitions and hover effects
- Ensure accessibility with proper ARIA labels
- Create engaging visual design with color coding
- Add loading states and progress indicators where appropriate
- Include helpful tooltips and guidance
- Make it self-contained (no external dependencies)

**EDUCATIONAL REQUIREMENTS**:
- Clear learning progression from basic to advanced concepts
- Interactive elements that reinforce understanding
- Visual feedback for user actions
- Multiple ways to explore the concept
- Connection to real-world applications
- Assessment or reflection opportunities
- Adaptive complexity based on learner level

Create a professional, engaging, and educationally effective visualizer that helps students truly understand "${concept}" through interactive exploration.`

    const aiResponse = await generateContent(prompt)
    
    // Parse the AI response to extract JSON
    let visualizerData
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        visualizerData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in AI response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      
      // Create a fallback visualizer object
      visualizerData = {
        id: `visualizer-${Date.now()}`,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Visualizer: ${concept}`,
        concept,
        type,
        difficulty: learnerLevel || 'intermediate',
        description: `Interactive ${type} visualization to help understand ${concept}`,
        explanation: aiResponse.substring(0, 500) + '...',
        estimatedTime: getDefaultTimeEstimate(type),
        learningObjectives: [
          `Understand the core concepts of ${concept}`,
          `Apply knowledge through interactive exploration`,
          `Connect learning to real-world applications`
        ],
        interactiveElements: getDefaultInteractiveElements(type),
        visualizerCode: getDefaultVisualizerCode(concept, type),
        mermaidDiagram: getDefaultMermaidDiagram(concept, type),
        keyInsights: [
          `Key insight about ${concept}`,
          `Important relationship or pattern`
        ],
        realWorldApplications: [
          `Real-world application of ${concept}`,
          `Practical use case in industry`
        ]
      }
    }

    // Ensure required fields are present
    if (!visualizerData.id) {
      visualizerData.id = `visualizer-${Date.now()}`
    }

    if (!visualizerData.title) {
      visualizerData.title = `${type.charAt(0).toUpperCase() + type.slice(1)} Visualizer: ${concept}`
    }

    return NextResponse.json(visualizerData)

  } catch (error) {
    console.error('Visualizer generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate visualizer' },
      { status: 500 }
    )
  }
}

// Helper functions for fallback visualizer creation
function getDefaultTimeEstimate(type) {
  const timeMap = {
    flowchart: '5-8 minutes',
    comparison: '3-5 minutes',
    timeline: '4-6 minutes',
    formula: '6-10 minutes',
    hierarchy: '4-6 minutes',
    relationship: '5-7 minutes',
    simulation: '8-12 minutes',
    process: '5-7 minutes'
  }
  return timeMap[type] || '5-8 minutes'
}

function getDefaultInteractiveElements(type) {
  const elementMap = {
    flowchart: [
      { element: 'Clickable Nodes', description: 'Click to explore each step', type: 'button' },
      { element: 'Path Highlighting', description: 'Shows decision paths', type: 'toggle' }
    ],
    comparison: [
      { element: 'Feature Toggle', description: 'Compare different aspects', type: 'toggle' },
      { element: 'Side-by-Side View', description: 'Visual comparison layout', type: 'button' }
    ],
    timeline: [
      { element: 'Time Scrubber', description: 'Navigate through timeline', type: 'slider' },
      { element: 'Event Details', description: 'Expandable event information', type: 'button' }
    ],
    formula: [
      { element: 'Variable Input', description: 'Adjust formula parameters', type: 'input' },
      { element: 'Graph Visualization', description: 'Real-time graph updates', type: 'toggle' }
    ],
    hierarchy: [
      { element: 'Expand/Collapse', description: 'Navigate hierarchy levels', type: 'button' },
      { element: 'Level Filter', description: 'Focus on specific levels', type: 'dropdown' }
    ],
    relationship: [
      { element: 'Node Selection', description: 'Highlight connections', type: 'button' },
      { element: 'Connection Strength', description: 'Adjust relationship visibility', type: 'slider' }
    ],
    simulation: [
      { element: 'Parameter Controls', description: 'Adjust simulation variables', type: 'slider' },
      { element: 'Play/Pause', description: 'Control simulation timing', type: 'button' }
    ],
    process: [
      { element: 'Step Navigation', description: 'Move through process steps', type: 'button' },
      { element: 'Progress Tracker', description: 'Visual progress indication', type: 'toggle' }
    ]
  }
  return elementMap[type] || elementMap.flowchart
}

function getDefaultVisualizerCode(concept, type) {
  return {
    html: `<div class="visualizer-container">
      <div class="visualizer-header">
        <h3>${concept} - ${type.charAt(0).toUpperCase() + type.slice(1)} Visualizer</h3>
      </div>
      <div class="visualizer-content">
        <div class="interactive-area">
          <!-- Interactive visualization will be rendered here -->
          <p>This ${type} visualizer helps you understand: <strong>${concept}</strong></p>
        </div>
        <div class="controls-panel">
          <button class="control-btn">Explore</button>
          <button class="control-btn">Reset</button>
        </div>
      </div>
    </div>`,
    css: `.visualizer-container {
      font-family: 'Inter', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .visualizer-header h3 {
      color: #2d3748;
      margin-bottom: 20px;
      text-align: center;
    }
    .interactive-area {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      min-height: 300px;
    }
    .controls-panel {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    .control-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      background: #4299e1;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .control-btn:hover {
      background: #3182ce;
      transform: translateY(-2px);
    }`,
    javascript: `// Interactive visualizer functionality
    class ${type.charAt(0).toUpperCase() + type.slice(1)}Visualizer {
      constructor() {
        this.init();
      }
      
      init() {
        console.log('${concept} ${type} visualizer initialized');
        this.setupEventListeners();
      }
      
      setupEventListeners() {
        const exploreBtn = document.querySelector('.control-btn:first-child');
        const resetBtn = document.querySelector('.control-btn:last-child');
        
        if (exploreBtn) {
          exploreBtn.addEventListener('click', () => {
            this.explore();
          });
        }
        
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            this.reset();
          });
        }
      }
      
      explore() {
        console.log('Exploring ${concept}...');
        // Add exploration logic here
      }
      
      reset() {
        console.log('Resetting visualizer...');
        // Add reset logic here
      }
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      new ${type.charAt(0).toUpperCase() + type.slice(1)}Visualizer();
    });`
  }
}

function getDefaultMermaidDiagram(concept, type) {
  const diagramMap = {
    flowchart: `graph TD
      A[Start: ${concept}] --> B{Decision Point}
      B -->|Yes| C[Action 1]
      B -->|No| D[Action 2]
      C --> E[Result]
      D --> E[Result]`,
    comparison: `graph LR
      A[${concept} Option A] --> C[Comparison]
      B[${concept} Option B] --> C[Comparison]
      C --> D[Decision]`,
    timeline: `timeline
      title ${concept} Timeline
      section Early Stage
        Event 1 : First milestone
        Event 2 : Development
      section Later Stage
        Event 3 : Major change
        Event 4 : Current state`,
    hierarchy: `graph TD
      A[${concept} Root] --> B[Branch 1]
      A --> C[Branch 2]
      B --> D[Sub-item 1]
      B --> E[Sub-item 2]
      C --> F[Sub-item 3]`,
    relationship: `graph LR
      A[${concept} Element A] <--> B[Element B]
      B <--> C[Element C]
      A <--> C
      C <--> D[Element D]`,
    simulation: `graph TD
      A[Input Parameters] --> B[${concept} Model]
      B --> C[Processing]
      C --> D[Output Results]
      D --> E[Visualization]`,
    process: `graph TD
      A[Start Process] --> B[Step 1: ${concept}]
      B --> C[Step 2: Processing]
      C --> D[Step 3: Validation]
      D --> E[Complete]`
  }
  return diagramMap[type] || diagramMap.flowchart
} 