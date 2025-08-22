import { NextResponse } from 'next/server';

// In a real application, this would connect to your database
// For now, we'll use in-memory storage (this will reset on server restart)
let publishedAssignments = [
  {
    id: "assign_sample_1",
    courseId: "math_101",
    moduleId: "algebra_basics",
    title: "Linear Equations - Mathematical Problem Set",
    content: `# Linear Equations Assignment

## Instructions for Students
Solve the following mathematical problems. Show all your work and provide clear explanations for each step.

## Academic References Used
- Mathematics Textbook Chapter 3: Linear Equations
- Khan Academy: Solving Linear Equations

### Question 1: Basic Linear Equations
**Source Reference:** Mathematics Textbook, Exercise 3.1

**Problem:** Solve for x: 3x + 7 = 22

**Given:**
- 3x + 7 = 22

**Required:** Find the value of x

**Solution:**
Step 1: Subtract 7 from both sides
3x + 7 - 7 = 22 - 7
3x = 15

Step 2: Divide both sides by 3
3x ÷ 3 = 15 ÷ 3
x = 5

**Final Answer:** x = 5

\`\`\`chart:bar
{
  "title": "Linear Equation Solutions Comparison",
  "description": "Comparison of variable values in different linear equations",
  "chartData": [
    {"equation": "3x + 7 = 22", "variable": "x", "value": 5},
    {"equation": "2y - 5 = 11", "variable": "y", "value": 8},
    {"equation": "4z + 8 = 32", "variable": "z", "value": 6},
    {"equation": "7w - 14 = 21", "variable": "w", "value": 5}
  ],
  "config": {
    "value": {"label": "Solution Value", "color": "#8884d8"}
  }
}
\`\`\`

**Problem 1:** Solve for y: 2y - 5 = 11
**Problem 2:** Solve for z: 4z + 8 = 32
**Problem 3:** Solve for w: 7w - 14 = 21`,
    moduleTitle: "Algebra Basics",
    topics: "Linear Equations, Algebraic Manipulation",
    instructions: "Complete all problems with step-by-step solutions",
    difficulty: "medium",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    publishedDate: new Date(),
    references: "Mathematics Textbook Chapter 3",
    instructorName: "Prof. Smith",
    courseTitle: "Mathematical Foundations",
    maxScore: 100,
    publishedBy: "system",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "assign_sample_2",
    courseId: "logic_101",
    moduleId: "truth_tables",
    title: "Truth Tables - Logical Problem Set",
    content: `# Truth Tables and Logic Assignment

## Instructions for Students
Complete the truth tables and logical reasoning problems below. Ensure accuracy in your logical evaluations.

### Question 1: Basic Truth Tables
**Source Reference:** Logic Textbook, Chapter 2

**Problem:** Complete the truth table for p ∧ q

**Given:**
- Logical operators: AND (∧), OR (∨), NOT (¬)

**Required:** Complete truth table for p ∧ q

**Solution:**
| p | q | p ∧ q |
|---|---|-------|
| T | T | T     |
| T | F | F     |
| F | T | F     |
| F | F | F     |

**Final Answer:** Truth table completed as shown above

\`\`\`chart:pie
{
  "title": "Truth Value Distribution in p ∧ q",
  "description": "Distribution of True vs False outcomes in conjunction operation",
  "chartData": [
    {"name": "True", "value": 1, "percentage": 25},
    {"name": "False", "value": 3, "percentage": 75}
  ],
  "config": {
    "True": {"label": "True Results", "color": "#10b981"},
    "False": {"label": "False Results", "color": "#ef4444"}
  }
}
\`\`\`

\`\`\`chart:bar
{
  "title": "Logical Operations Comparison",
  "description": "Number of True outcomes for different logical operations",
  "chartData": [
    {"operation": "p ∧ q", "trueCount": 1, "falseCount": 3},
    {"operation": "p ∨ q", "trueCount": 3, "falseCount": 1},
    {"operation": "¬p", "trueCount": 2, "falseCount": 2},
    {"operation": "p → q", "trueCount": 3, "falseCount": 1}
  ],
  "config": {
    "trueCount": {"label": "True Outcomes", "color": "#10b981"},
    "falseCount": {"label": "False Outcomes", "color": "#ef4444"}
  }
}
\`\`\`

**Problem 1:** Create truth table for p ∨ q
**Problem 2:** Create truth table for ¬p ∧ q
**Problem 3:** Evaluate (p → q) ∧ (q → p)`,
    moduleTitle: "Truth Tables",
    topics: "Logical Operations, Truth Tables, Boolean Logic",
    instructions: "Complete all truth tables accurately",
    difficulty: "easy",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    publishedDate: new Date(),
    references: "Logic Textbook Chapter 2",
    instructorName: "Dr. Johnson",
    courseTitle: "Introduction to Logic",
    maxScore: 100,
    publishedBy: "system",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "assign_sample_3",
    courseId: "calculus_101",
    moduleId: "derivatives",
    title: "Derivatives - Advanced Problem Set",
    content: `# Calculus Derivatives Assignment

## Instructions for Students
Solve the derivative problems using appropriate differentiation rules. Show all steps clearly.

### Question 1: Basic Derivatives
**Source Reference:** Calculus Textbook, Chapter 4

**Problem:** Find the derivative of f(x) = 3x² + 2x - 5

**Given:**
- f(x) = 3x² + 2x - 5
- Power rule: d/dx[xⁿ] = nxⁿ⁻¹

**Required:** Find f'(x)

**Solution:**
Using the power rule and sum rule:
f'(x) = d/dx[3x²] + d/dx[2x] - d/dx[5]
f'(x) = 3(2x) + 2(1) - 0
f'(x) = 6x + 2

**Final Answer:** f'(x) = 6x + 2

\`\`\`plot
{
  "title": "Function and Its Derivative",
  "description": "Visualization of f(x) = 3x² + 2x - 5 and its derivative f'(x) = 6x + 2",
  "function": "3x² + 2x - 5",
  "xRange": [-3, 3]
}
\`\`\`

\`\`\`chart:line
{
  "title": "Derivative Values at Different Points",
  "description": "How the derivative f'(x) = 6x + 2 changes with x",
  "chartData": [
    {"x": -2, "fx": 1, "derivative": -10},
    {"x": -1, "fx": -4, "derivative": -4},
    {"x": 0, "fx": -5, "derivative": 2},
    {"x": 1, "fx": 0, "derivative": 8},
    {"x": 2, "fx": 9, "derivative": 14}
  ],
  "config": {
    "fx": {"label": "f(x)", "color": "#8884d8"},
    "derivative": {"label": "f'(x)", "color": "#82ca9d"}
  }
}
\`\`\`

**Problem 1:** Find derivative of g(x) = x³ - 4x² + 7x
**Problem 2:** Find derivative of h(x) = 5x⁴ + 3x² - 2
**Problem 3:** Find derivative of k(x) = √x + 1/x`,
    moduleTitle: "Derivatives",
    topics: "Calculus, Derivatives, Differentiation Rules",
    instructions: "Apply differentiation rules correctly",
    difficulty: "hard",
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    publishedDate: new Date(),
    references: "Calculus Textbook Chapter 4",
    instructorName: "Prof. Martinez",
    courseTitle: "Calculus I",
    maxScore: 150,
    publishedBy: "system",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');
    const includeExpired = searchParams.get('includeExpired') === 'true';

    let filteredAssignments = publishedAssignments;

    // Filter by course ID if provided
    if (courseId) {
      filteredAssignments = filteredAssignments.filter(assignment => 
        assignment.courseId === courseId
      );
    }

    // Filter out expired assignments unless explicitly requested
    if (!includeExpired) {
      const now = new Date();
      filteredAssignments = filteredAssignments.filter(assignment => {
        // Show assignments that are either not yet due or have a grace period
        const dueDate = new Date(assignment.dueDate);
        const gracePeriod = 24 * 60 * 60 * 1000; // 24 hours grace period for viewing
        return (dueDate.getTime() + gracePeriod) > now.getTime();
      });
    }

    // Sort by due date (earliest first)
    filteredAssignments.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    console.log("📋 Fetched published assignments:", {
      total: filteredAssignments.length,
      courseId,
      includeExpired
    });

    return NextResponse.json({
      success: true,
      assignments: filteredAssignments
    });

  } catch (error) {
    console.error("❌ Error fetching published assignments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch assignments",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      courseId,
      moduleId,
      moduleTitle,
      content,
      topics,
      instructions,
      difficulty,
      dueDate,
      references,
      instructorName,
      courseTitle,
      maxScore,
      publishedBy
    } = body;

    // Validate required fields
    if (!courseId || !moduleId || !content || !dueDate) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "courseId, moduleId, content, and dueDate are required",
          success: false
        },
        { status: 400 }
      );
    }

    // Validate due date is in the future
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    
    if (dueDateObj <= now) {
      return NextResponse.json(
        {
          error: "Invalid due date",
          details: "Due date must be in the future",
          success: false
        },
        { status: 400 }
      );
    }

    const assignmentId = `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const publishedAt = new Date();

    const assignment = {
      id: assignmentId,
      courseId,
      moduleId,
      title: `${moduleTitle} - Mathematical Problem Set`,
      content,
      moduleTitle,
      topics: topics || 'Mathematical Problems',
      instructions: instructions || 'Standard academic assignment',
      difficulty: difficulty || 'medium',
      dueDate: dueDateObj,
      publishedDate: publishedAt,
      references: references || '',
      instructorName: instructorName || 'Course Instructor',
      courseTitle: courseTitle || 'Academic Course',
      maxScore: maxScore || 100,
      publishedBy: publishedBy || 'system',
      isActive: true,
      createdAt: publishedAt,
      updatedAt: publishedAt
    };

    publishedAssignments.push(assignment);

    console.log("✅ Assignment published:", {
      id: assignmentId,
      courseId,
      moduleTitle,
      dueDate: dueDateObj.toISOString()
    });

    return NextResponse.json({
      success: true,
      assignment,
      message: "Assignment published successfully"
    });

  } catch (error) {
    console.error("❌ Error publishing assignment:", error);
    return NextResponse.json(
      {
        error: "Failed to publish assignment",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      assignmentId,
      content,
      topics,
      instructions,
      difficulty,
      dueDate,
      references,
      maxScore,
      isActive
    } = body;

    if (!assignmentId) {
      return NextResponse.json(
        {
          error: "Missing assignment ID",
          success: false
        },
        { status: 400 }
      );
    }

    const assignmentIndex = publishedAssignments.findIndex(
      assignment => assignment.id === assignmentId
    );

    if (assignmentIndex === -1) {
      return NextResponse.json(
        {
          error: "Assignment not found",
          success: false
        },
        { status: 404 }
      );
    }

    // Update assignment
    const updatedAssignment = {
      ...publishedAssignments[assignmentIndex],
      content: content || publishedAssignments[assignmentIndex].content,
      topics: topics || publishedAssignments[assignmentIndex].topics,
      instructions: instructions || publishedAssignments[assignmentIndex].instructions,
      difficulty: difficulty || publishedAssignments[assignmentIndex].difficulty,
      dueDate: dueDate ? new Date(dueDate) : publishedAssignments[assignmentIndex].dueDate,
      references: references !== undefined ? references : publishedAssignments[assignmentIndex].references,
      maxScore: maxScore || publishedAssignments[assignmentIndex].maxScore,
      isActive: isActive !== undefined ? isActive : publishedAssignments[assignmentIndex].isActive,
      updatedAt: new Date()
    };

    publishedAssignments[assignmentIndex] = updatedAssignment;

    console.log("📝 Assignment updated:", {
      id: assignmentId,
      isActive: updatedAssignment.isActive
    });

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      message: "Assignment updated successfully"
    });

  } catch (error) {
    console.error("❌ Error updating assignment:", error);
    return NextResponse.json(
      {
        error: "Failed to update assignment",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json(
        {
          error: "Missing assignment ID",
          success: false
        },
        { status: 400 }
      );
    }

    const assignmentIndex = publishedAssignments.findIndex(
      assignment => assignment.id === assignmentId
    );

    if (assignmentIndex === -1) {
      return NextResponse.json(
        {
          error: "Assignment not found",
          success: false
        },
        { status: 404 }
      );
    }

    // Instead of deleting, mark as inactive (soft delete)
    publishedAssignments[assignmentIndex].isActive = false;
    publishedAssignments[assignmentIndex].updatedAt = new Date();

    console.log("🗑️ Assignment deactivated:", {
      id: assignmentId
    });

    return NextResponse.json({
      success: true,
      message: "Assignment deactivated successfully"
    });

  } catch (error) {
    console.error("❌ Error deactivating assignment:", error);
    return NextResponse.json(
      {
        error: "Failed to deactivate assignment",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}