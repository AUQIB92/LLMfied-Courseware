// Atomic Generation Prompt Template - Optimized for small, precise batches
export const QUESTION_GENERATION_TEMPLATE = `
🎯 ATOMIC GENERATION TASK - PRECISION REQUIRED

You are an expert AI question generator with a 100% accuracy mandate for atomic batch processing.

📊 ATOMIC BATCH DETAILS:
- Required Questions: EXACTLY {subtopicQuestionCount} (atomic batch size)
- Subject: {subject}
- Topic: {topicName}
- Subtopic: {subtopic}
- Type: {type} questions
- Difficulty: {difficulty}
- Worth: {marksPerQuestion} marks each
- Attempt: {attempt}/4 (previous attempts may have failed count requirement)

🚨 ATOMIC SUCCESS CRITERIA:
1. EXACT COUNT MANDATE: Generate precisely {subtopicQuestionCount} questions - verify count before responding
2. ZERO TOLERANCE: Any deviation from {subtopicQuestionCount} questions = complete failure
3. ATOMIC PRECISION: This small batch approach ensures maximum accuracy
4. FACTUAL ACCURACY: Every question must be 100% scientifically/academically correct
5. COMPLETE STRUCTURE: All required JSON fields must be present and valid

🔬 ATOMIC QUALITY STANDARDS:
- Each question tests specific, deep understanding of "{subtopic}"
- Questions are challenging yet fair, appropriate for {difficulty} level
- All 4 options are plausible but clearly distinguishable
- Explanations provide comprehensive reasoning with step-by-step logic
- {type} questions focus on precise mathematical/conceptual requirements
- Real-world applications demonstrate practical relevance

🖼️ VISUAL ELEMENT INTEGRATION:
- Set hasImage: true for subjects requiring visual aids (circuits, diagrams, graphs, structures)
- Provide detailed imageDescription for AI image generation when hasImage: true
- Include accessibility-focused imageAltText for screen readers
- Visual elements enhance learning effectiveness and assessment accuracy

📋 MANDATORY JSON FORMAT (exactly {subtopicQuestionCount} elements):
[
  {
    "questionText": "Complete, precise question with specific details?",
    "options": ["Specific Option A", "Specific Option B", "Specific Option C", "Specific Option D"],
    "correctAnswer": 0,
    "explanation": "Comprehensive explanation with detailed reasoning and methodology",
    "marks": {marksPerQuestion},
    "hasImage": false,
    "imageDescription": "Detailed description if hasImage is true",
    "imageAltText": "Accessibility text if hasImage is true"
  }
]

⚡ ATOMIC VERIFICATION CHECKPOINT:
Before submitting your response:
1. Count your questions: You MUST have exactly {subtopicQuestionCount}
2. Verify JSON structure is valid and complete
3. Ensure all content is factually accurate
4. Confirm all explanations are comprehensive

This is attempt {attempt} - previous attempts failed the exact count requirement.
Generate your atomic batch of exactly {subtopicQuestionCount} {type} questions for "{subtopic}" NOW:
`;

/**
 * Replace placeholders in template with actual values
 * @param {string} template - The template string with {placeholder} syntax
 * @param {object} values - Object containing key-value pairs for replacement
 * @returns {string} - Template with all placeholders replaced
 */
export function replaceTemplatePlaceholders(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (key in values) {
      return values[key];
    }
    console.warn(`Template placeholder "${key}" not found in values`);
    return match; // Return the placeholder if value not found
  });
}

/**
 * Generate prompt for question creation
 * @param {object} params - Parameters for prompt generation
 * @returns {string} - Generated prompt string
 */
export function generateQuestionPrompt(params) {
  const {
    subtopicQuestionCount,
    subject,
    topicName,
    subtopic,
    type,
    difficulty,
    marksPerQuestion,
    attempt = 1,
  } = params;

  return replaceTemplatePlaceholders(QUESTION_GENERATION_TEMPLATE, {
    subtopicQuestionCount,
    subject,
    topicName,
    subtopic,
    type,
    difficulty,
    marksPerQuestion,
    attempt,
  });
}

/**
 * Validate that all required parameters are present
 * @param {object} params - Parameters to validate
 * @returns {object} - { isValid: boolean, missingFields: string[] }
 */
export function validatePromptParams(params) {
  const requiredFields = [
    "subtopicQuestionCount",
    "subject",
    "topicName",
    "subtopic",
    "type",
    "difficulty",
    "marksPerQuestion",
  ];

  const missingFields = requiredFields.filter(
    (field) =>
      params[field] === undefined ||
      params[field] === null ||
      params[field] === ""
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
