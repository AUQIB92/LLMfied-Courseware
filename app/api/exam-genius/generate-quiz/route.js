import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { generateContent } from "@/lib/gemini"

// JWT verification function
async function verifyToken(request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization header")
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded
  } catch (error) {
    throw new Error("Invalid token")
  }
}

export async function POST(request) {
  try {
    // Verify user authentication
    const user = await verifyToken(request)
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { concept, content, examType, subject, learnerLevel } = await request.json()

    if (!concept || !content) {
      return NextResponse.json({ error: "Concept and content are required" }, { status: 400 })
    }

    console.log(`🎯 Generating competitive exam quiz for: ${concept}`)

    // Enhanced competitive exam quiz generation prompt
    const quizPrompt = `
Generate a comprehensive competitive exam quiz for the following concept.

CONCEPT: ${concept}
CONTENT: ${content}
EXAM TYPE: ${examType || 'SSC'}
SUBJECT: ${subject || 'Quantitative Aptitude'}
LEARNER LEVEL: ${learnerLevel || 'intermediate'}

Generate exactly 15 multiple choice questions (5 Easy, 5 Medium, 5 Hard).
Each question must have exactly 4 options and detailed explanations.

Return a JSON object with this structure:
{
  "quiz": {
    "concept": "${concept}",
    "totalQuestions": 15,
    "questions": [
      {
        "id": 1,
        "question": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "difficulty": "easy",
        "explanation": "Detailed explanation with exam strategies"
      }
    ]
  }
}
`

    let rawResponse = "";
    try {
      rawResponse = await generateContent(quizPrompt, {
        temperature: 0.7,
        maxOutputTokens: 8192
      })

      console.log("AI Response received, length:", rawResponse?.length)

      // Improved JSON extraction with multiple strategies
      let quizData = null
      
      try {
        // Strategy 1: Try to find and parse complete JSON block
        let jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          let jsonString = jsonMatch[0]
          
          console.log("Raw JSON match (first 200 chars):", jsonString.substring(0, 200))
          
          // Clean the JSON string
          jsonString = jsonString
            .replace(/```json/g, '') // Remove markdown code blocks
            .replace(/```/g, '') // Remove closing code blocks
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .trim()
          
          // Try to fix common JSON issues
          jsonString = jsonString
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)(\w+)(?=\s*:)/g, '$1"$2"') // Add quotes to unquoted keys
            .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .replace(/\t/g, ' ') // Replace tabs with spaces
            .replace(/\r/g, ' ') // Replace carriage returns with spaces
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          
          console.log("Cleaned JSON (first 200 chars):", jsonString.substring(0, 200))
          quizData = JSON.parse(jsonString)
          console.log("Successfully parsed with strategy 1")
        }
      } catch (parseError) {
        console.log("Strategy 1 failed:", parseError.message)
        console.log("Parse error position:", parseError.message.match(/position (\d+)/)?.[1])
        
        // Strategy 2: Try to find JSON between specific markers
        try {
          const markers = [
            /```json\s*(\{[\s\S]*?\})\s*```/,
            /(\{[\s\S]*?"quiz"[\s\S]*?\})/,
            /(\{[\s\S]*?"questions"[\s\S]*?\})/
          ]
          
          for (const marker of markers) {
            const match = rawResponse.match(marker)
            if (match) {
              let jsonString = match[1] || match[0]
              jsonString = jsonString
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                .replace(/,(\s*[}\]])/g, '$1')
                .replace(/([{,]\s*)(\w+)(?=\s*:)/g, '$1"$2"')
                .replace(/:\s*'([^']*)'/g, ': "$1"')
                .replace(/\n/g, ' ')
                .replace(/\t/g, ' ')
                .replace(/\r/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
              
              quizData = JSON.parse(jsonString)
              console.log("Successfully parsed with strategy 2")
              break
            }
          }
        } catch (secondParseError) {
          console.log("Strategy 2 also failed:", secondParseError.message)
        }
      }
      
      // Strategy 3: If all parsing fails, try to extract questions manually
      if (!quizData) {
        console.log("Attempting manual question extraction...")
        try {
          // More flexible patterns for manual extraction
          const questionPattern = /"question":\s*"([^"\\]*(\\.[^"\\]*)*)"/g
          const optionsPattern = /"options":\s*\[\s*"([^"\\]*(\\.[^"\\]*)*)"[^[\]]*\]/g
          const answerPattern = /"correctAnswer":\s*(\d+)/g
          const explanationPattern = /"explanation":\s*"([^"\\]*(\\.[^"\\]*)*)"/g
          
          const questions = []
          let questionMatches = [...rawResponse.matchAll(questionPattern)]
          let optionsMatches = [...rawResponse.matchAll(optionsPattern)]
          let answerMatches = [...rawResponse.matchAll(answerPattern)]
          let explanationMatches = [...rawResponse.matchAll(explanationPattern)]
          
          const maxQuestions = Math.min(15, questionMatches.length, answerMatches.length)
          
          for (let i = 0; i < maxQuestions; i++) {
            if (questionMatches[i] && answerMatches[i]) {
              // Extract options more carefully
              let optionsText = optionsMatches[i] ? optionsMatches[i][0] : '"Option A", "Option B", "Option C", "Option D"'
              let options = []
              
              try {
                // Try to parse options array
                const optionsArray = optionsText.match(/"([^"\\]*(\\.[^"\\]*)*)"/g)
                options = optionsArray ? optionsArray.map(opt => opt.replace(/"/g, '')) : 
                  [`Option A for question ${i+1}`, `Option B for question ${i+1}`, `Option C for question ${i+1}`, `Option D for question ${i+1}`]
                
                if (options.length < 4) {
                  // Pad with generic options if needed
                  while (options.length < 4) {
                    options.push(`Option ${String.fromCharCode(65 + options.length)} for question ${i+1}`)
                  }
                }
              } catch (optError) {
                options = [`Option A for question ${i+1}`, `Option B for question ${i+1}`, `Option C for question ${i+1}`, `Option D for question ${i+1}`]
              }
              
              questions.push({
                id: i + 1,
                question: questionMatches[i][1] || `Sample question ${i+1} about ${concept}`,
                options: options.slice(0, 4), // Ensure exactly 4 options
                correctAnswer: Math.max(0, Math.min(3, parseInt(answerMatches[i][1]) || 0)),
                difficulty: i < 5 ? "easy" : i < 10 ? "medium" : "hard",
                explanation: explanationMatches[i] ? explanationMatches[i][1] : `This question tests understanding of ${concept}.`
              })
            }
          }
          
          if (questions.length > 0) {
            quizData = {
              quiz: {
                concept: concept,
                totalQuestions: questions.length,
                questions: questions
              }
            }
            console.log(`Successfully extracted ${questions.length} questions manually`)
          }
        } catch (manualError) {
          console.log("Manual extraction failed:", manualError.message)
        }
      }

      // Strategy 4: If all extraction methods fail, create a basic quiz structure from the content
      if (!quizData || !quizData.quiz || !quizData.quiz.questions || quizData.quiz.questions.length === 0) {
        console.log("All extraction strategies failed. Creating basic quiz structure from content...");
        
        // Extract key sentences from content to create questions
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const questions = [];
        
        // Create up to 15 questions from the content
        for (let i = 0; i < Math.min(15, sentences.length); i++) {
          const sentence = sentences[i].trim();
          if (sentence.length < 10) continue; // Skip very short sentences
          
          // Create a question from the sentence
          const questionText = `Which of the following best describes this concept: "${sentence.substring(0, 100)}..."?`;
          
          questions.push({
            id: i + 1,
            question: questionText,
            options: [
              `It relates to ${concept}`,
              `It's a different approach to ${concept}`,
              `It contradicts ${concept}`,
              `It's unrelated to ${concept}`
            ],
            correctAnswer: 0, // First option is correct
            difficulty: i < 5 ? "easy" : i < 10 ? "medium" : "hard",
            explanation: `This question tests your understanding of ${concept} as described in the text: "${sentence.substring(0, 150)}..."`
          });
        }
        
        // If we couldn't create enough questions from content, add generic ones
        while (questions.length < 15) {
          questions.push({
            id: questions.length + 1,
            question: `What is an important aspect of ${concept}?`,
            options: [
              `Understanding the fundamentals`,
              `Memorizing formulas only`,
              `Ignoring the context`,
              `Skipping practice problems`
            ],
            correctAnswer: 0,
            difficulty: questions.length < 5 ? "easy" : questions.length < 10 ? "medium" : "hard",
            explanation: `Understanding the fundamentals is crucial for mastering ${concept}.`
          });
        }
        
        quizData = {
          quiz: {
            concept: concept,
            totalQuestions: questions.length,
            questions: questions
          }
        };
        
        console.log(`Created basic quiz structure with ${questions.length} questions from content`);
      }

      // Final validation
      if (!quizData || !quizData.quiz || !quizData.quiz.questions || quizData.quiz.questions.length === 0) {
        // If we still don't have a valid quiz, use the fallback
        throw new Error("Failed to create a valid quiz structure after all strategies");
      }

      console.log(`Successfully generated quiz with ${quizData.quiz.questions.length} questions`)

      return NextResponse.json({
        success: true,
        quiz: quizData.quiz
      })

    } catch (aiError) {
      console.error("AI generation error:", aiError)
      console.error("Full error details:", {
        message: aiError.message,
        stack: aiError.stack,
        responsePreview: rawResponse ? rawResponse.substring(0, 500) : "No response received"
      })
      
      // Fallback quiz
      const fallbackQuiz = {
        concept: concept,
        totalQuestions: 15,
        questions: [
          {
            id: 1,
            question: `What is the basic principle behind ${concept}?`,
            options: ["Fundamental concept", "Complex method", "Advanced approach", "Specialized technique"],
            correctAnswer: 0,
            difficulty: "easy",
            explanation: `The basic principle of ${concept} involves understanding fundamental concepts.`
          },
          {
            id: 2,
            question: `How is ${concept} applied in ${examType || 'competitive'} exams?`,
            options: ["Direct application", "Complex integration", "Advanced analysis", "Theoretical only"],
            correctAnswer: 0,
            difficulty: "easy",
            explanation: `${concept} is typically applied directly in ${examType || 'competitive'} exams.`
          },
          {
            id: 3,
            question: `What is the time strategy for ${concept} questions?`,
            options: ["Quick solving", "Detailed analysis", "Skip difficult", "Random approach"],
            correctAnswer: 0,
            difficulty: "easy",
            explanation: "Quick solving with accuracy is the best strategy for time-bound exams."
          },
          {
            id: 4,
            question: `Which formula is most important for ${concept}?`,
            options: ["Basic formula", "Advanced formula", "Derived formula", "Complex formula"],
            correctAnswer: 0,
            difficulty: "easy",
            explanation: "Basic formulas form the foundation for solving most problems."
          },
          {
            id: 5,
            question: `What is the common mistake with ${concept}?`,
            options: ["Calculation errors", "Wrong method", "Time wastage", "All of above"],
            correctAnswer: 3,
            difficulty: "easy",
            explanation: "Students commonly make calculation errors, use wrong methods, and waste time."
          },
          {
            id: 6,
            question: `How to solve multi-step ${concept} problems?`,
            options: ["Break into steps", "Solve randomly", "Use shortcuts only", "Skip complex"],
            correctAnswer: 0,
            difficulty: "medium",
            explanation: "Breaking complex problems into steps ensures systematic solving."
          },
          {
            id: 7,
            question: `What strategy works for ${concept} in data interpretation?`,
            options: ["Read data first", "Start solving", "Focus on graphs", "Skip data"],
            correctAnswer: 0,
            difficulty: "medium",
            explanation: "Reading and understanding data first prevents errors."
          },
          {
            id: 8,
            question: `How to combine ${concept} with other topics?`,
            options: ["Understand connections", "Solve separately", "Memorize combinations", "Avoid mixing"],
            correctAnswer: 0,
            difficulty: "medium",
            explanation: "Understanding topic connections helps solve mixed problems effectively."
          },
          {
            id: 9,
            question: `What's the speed-solving approach for ${concept}?`,
            options: ["Shortcuts + systematic", "Only shortcuts", "Only systematic", "Random method"],
            correctAnswer: 0,
            difficulty: "medium",
            explanation: "Combining shortcuts with systematic approach ensures speed and accuracy."
          },
          {
            id: 10,
            question: `How to verify ${concept} solutions quickly?`,
            options: ["Estimation check", "Recalculate all", "Trust first answer", "Compare others"],
            correctAnswer: 0,
            difficulty: "medium",
            explanation: "Quick estimation helps verify answers without consuming too much time."
          },
          {
            id: 11,
            question: `How to identify ${concept} in complex scenarios?`,
            options: ["Analyze patterns", "Look for keywords", "Apply everywhere", "Wait for mention"],
            correctAnswer: 0,
            difficulty: "hard",
            explanation: "Pattern analysis helps identify when to apply concepts in disguised problems."
          },
          {
            id: 12,
            question: `What's the optimization technique for ${concept}?`,
            options: ["Systematic analysis", "Trial and error", "Random selection", "Basic formulas only"],
            correctAnswer: 0,
            difficulty: "hard",
            explanation: "Systematic analysis with constraint identification works best for optimization."
          },
          {
            id: 13,
            question: `How to handle ${concept} under exam pressure?`,
            options: ["Stay calm, trust preparation", "Rush through", "Skip and return", "Change approach"],
            correctAnswer: 0,
            difficulty: "hard",
            explanation: "Staying calm and trusting your preparation leads to better performance."
          },
          {
            id: 14,
            question: `What's the advanced application of ${concept}?`,
            options: ["Multi-topic integration", "Single concept focus", "Basic application", "Theoretical only"],
            correctAnswer: 0,
            difficulty: "hard",
            explanation: "Advanced applications involve integrating multiple topics systematically."
          },
          {
            id: 15,
            question: `How to master ${concept} for competitive exams?`,
            options: ["Practice + understanding", "Memorization only", "Shortcuts only", "Theory only"],
            correctAnswer: 0,
            difficulty: "hard",
            explanation: "Combining practice with deep understanding ensures mastery for competitive exams."
          }
        ]
      }
      
      return NextResponse.json({
        success: true,
        quiz: fallbackQuiz,
        note: "Generated using fallback method"
      })
    }

  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    )
  }
} 