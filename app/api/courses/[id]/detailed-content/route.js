import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sanitizeContentForDisplay } from "@/lib/fileProcessor";

// Define the route handler function
export async function GET(request, { params }) {
  try {
    // Properly await the params object before accessing its properties
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    console.log(`Processing detailed content request for course ID: ${id}`);

    const client = await clientPromise;
    const db = client.db("llmfied");

    // First, check if this is an Exam Genius course
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(id),
    });

    if (!course) {
      console.log(`Course not found with ID: ${id}`);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Determine which collection to use based on course type
    const isExamGenius = course.isExamGenius || course.isCompetitiveExam;
    
    // Check multiple collections for content
    let detailedContent = null;
    
    // First try the primary collection based on course type
    const primaryCollection = isExamGenius ? "detailed-content" : "module-content";
    console.log(`Checking primary collection: ${primaryCollection} for course ${id}`);
    
    detailedContent = await db.collection(primaryCollection).findOne({
      courseId: id,
    });
    
    // If not found and this is an exam genius course, try alternative collections
    if (!detailedContent && isExamGenius) {
      console.log(`No content found in ${primaryCollection}, checking alternative collections`);
      
      // Try exam-genius-content collection
      detailedContent = await db.collection("exam-genius-content").findOne({
        courseId: id,
      });
      
      if (detailedContent) {
        console.log(`Found content in exam-genius-content collection`);
      } else {
        // Try course_detailed_content as a fallback and reconstruct the data
        const subsectionDocs = await db.collection("course_detailed_content").find({
            courseId: id,
        }).toArray();

        if (subsectionDocs && subsectionDocs.length > 0) {
            console.log(`Found ${subsectionDocs.length} subsection documents in course_detailed_content`);

            const reconstructedContent = {};
            subsectionDocs.forEach(doc => {
                if (reconstructedContent[doc.moduleIndex] === undefined) {
                    reconstructedContent[doc.moduleIndex] = {};
                }
                reconstructedContent[doc.moduleIndex][doc.subsectionIndex] = {
                    subsectionTitle: doc.subsectionTitle,
                    pages: doc.pages,
                    practicalExample: doc.practicalExample,
                    commonPitfalls: doc.commonPitfalls,
                };
            });

            detailedContent = {
                courseId: id,
                detailedContent: reconstructedContent,
                isFromReconstruction: true,
            };
            console.log("Reconstructed detailed content from course_detailed_content collection");
        }
      }
    }

    if (!detailedContent) {
      console.log(
        `No detailed content found for course ${id} in any collection`
      );

      // Try to build content from course structure as fallback
      console.log(`Attempting to build fallback content from course structure`);
      
      // Get modules from the course
      const modules = course.modules || [];
      
      // Create an empty structure that matches the expected format
      const fallbackContent = {};
      
      // Build detailed content structure from modules
      modules.forEach((module, moduleIndex) => {
        fallbackContent[moduleIndex] = {};
        
        const subsections = module.detailedSubsections || [];
        subsections.forEach((subsection, subsectionIndex) => {
          // Check if subsection has pages
          let pages = [];
          
          if (subsection.pages && Array.isArray(subsection.pages) && subsection.pages.length > 0) {
            // Use existing pages if available
            pages = subsection.pages;
            console.log(`Using ${pages.length} existing pages for module ${moduleIndex}, subsection ${subsectionIndex}`);
          } else {
            // Create default pages
            pages = [
              {
                pageNumber: 1,
                pageTitle: "Introduction & Foundation",
                content: subsection.summary || `Introduction to ${subsection.title}. This section covers the fundamental concepts and provides necessary background knowledge for ${course.examType} exam preparation. We'll explore the core principles, key terminology, and establish a strong foundation that will help you tackle more complex problems in future sections.`,
                keyTakeaway: "Understanding the basic concepts and principles essential for competitive exams",
                speedSolvingTechniques: `Quick recognition techniques for ${subsection.title} problems in ${course.examType} exams. Look for key patterns and identifiers that signal which approach to use.`,
                commonTraps: `Common mistakes students make when approaching ${subsection.title} problems include misinterpreting the question, applying the wrong formula, or making calculation errors under time pressure. Watch for these specific pitfalls in ${course.examType} exams.`,
                timeManagementTips: `For ${subsection.title} questions in ${course.examType}, allocate approximately 1-2 minutes per question. Skip complex calculations initially and return to them if time permits.`,
                examSpecificStrategies: `${course.examType} exams frequently test ${subsection.title} concepts through multiple-choice questions that require quick application of fundamentals. Focus on understanding core principles rather than memorizing complex derivations.`
              },
              {
                pageNumber: 2,
                pageTitle: "Core Theory & Principles - Part 1",
                content: `Core theoretical concepts of ${subsection.title} for ${course.examType} exam preparation. This section covers the fundamental principles, key theoretical frameworks, and essential formulas you'll need to master. We'll focus on building a solid understanding that will serve as the foundation for more advanced applications.`,
                keyTakeaway: "Mastering the fundamental theoretical principles required for competitive exams",
                speedSolvingTechniques: `When solving ${subsection.title} problems in ${course.examType} exams, first identify the core principle being tested. This quick classification will help you select the right formula and approach immediately.`,
                commonTraps: `Examiners often create ${course.examType} questions with subtle variations of standard ${subsection.title} problems. Be careful of slightly altered conditions that change which formula applies.`,
                timeManagementTips: `For theoretical questions on ${subsection.title}, spend 30 seconds identifying the concept being tested before attempting the solution.`,
                examSpecificStrategies: `${course.examType} exams typically include 3-5 questions on ${subsection.title} fundamentals. Mastering these core concepts can secure easy marks.`
              },
              {
                pageNumber: 3,
                pageTitle: "Core Theory & Principles - Part 2",
                content: `Advanced theoretical concepts of ${subsection.title} specifically tailored for ${course.examType} examination. This section builds on the fundamental principles with more complex theoretical frameworks that frequently appear in competitive exams. We'll explore how these concepts are tested and the most efficient ways to approach them.`,
                keyTakeaway: "Applying advanced theoretical principles to competitive exam scenarios",
                speedSolvingTechniques: `For complex ${subsection.title} problems, use the elimination method to quickly remove obviously incorrect options before detailed calculation, saving precious exam time.`,
                commonTraps: `In ${course.examType} exams, ${subsection.title} questions often include unnecessary information to confuse candidates. Learn to identify only the relevant variables needed for solution.`,
                timeManagementTips: `Complex theoretical questions should take no more than 2-3 minutes. If you're spending longer, mark for review and move on.`,
                examSpecificStrategies: `${course.examType} exam setters often combine multiple concepts from ${subsection.title} in single questions. Practice identifying which principles apply to different parts of the same problem.`
              },
              {
                pageNumber: 4,
                pageTitle: "Core Theory & Principles - Part 3",
                content: `Specialized theoretical aspects of ${subsection.title} crucial for ${course.examType} success. This section explores specialized theoretical concepts and their implications in competitive exam contexts. We'll analyze previous year questions and identify patterns in how these concepts are tested.`,
                keyTakeaway: "Mastering specialized theoretical aspects frequently tested in competitive exams",
                speedSolvingTechniques: `Create mental shortcuts for specialized ${subsection.title} calculations by memorizing common value patterns and results that appear frequently in ${course.examType} exams.`,
                commonTraps: `Specialized ${subsection.title} questions in ${course.examType} often test edge cases and exceptions to rules. Be vigilant about conditions where standard formulas need modification.`,
                timeManagementTips: `For specialized concept questions, quickly determine if you know the approach within 20 seconds. If uncertain, flag for later review.`,
                examSpecificStrategies: `${course.examType} often tests specialized ${subsection.title} concepts through comparison questions. Practice quickly identifying which principle yields the larger/smaller result.`
              },
              {
                pageNumber: 5,
                pageTitle: "Core Theory & Principles - Part 4",
                content: `Theoretical applications of ${subsection.title} in ${course.examType} exam context. This section demonstrates how theoretical principles apply to practical scenarios commonly found in competitive exams. We'll work through representative problems and develop systematic solution approaches.`,
                keyTakeaway: "Connecting theoretical principles to practical competitive exam applications",
                speedSolvingTechniques: `When applying ${subsection.title} theory to practical problems, first classify the problem type before calculation. This pattern recognition saves significant time in ${course.examType} exams.`,
                commonTraps: `Application questions often contain practical constraints not found in theoretical problems. In ${course.examType} exams, watch for real-world limitations that affect your answer.`,
                timeManagementTips: `Application problems typically require 2-3 minutes. Break complex applications into smaller steps with time checkpoints.`,
                examSpecificStrategies: `${course.examType} exams increasingly focus on application over theory. Practice translating theoretical ${subsection.title} concepts into varied practical contexts.`
              },
              {
                pageNumber: 6,
                pageTitle: "Core Theory & Principles - Part 5",
                content: `Advanced theoretical applications of ${subsection.title} specifically designed for ${course.examType} preparation. This section explores sophisticated applications of theoretical principles in complex competitive exam scenarios. We'll analyze challenging problems and develop expert-level approaches.`,
                keyTakeaway: "Handling advanced theoretical applications in high-stakes competitive exams",
                speedSolvingTechniques: `For advanced ${subsection.title} applications, develop the ability to estimate answers before detailed calculation. This allows quick verification and error detection in ${course.examType} exams.`,
                commonTraps: `Advanced application questions in ${course.examType} often contain multiple concepts that must be applied sequentially. Missing intermediate steps leads to incorrect final answers.`,
                timeManagementTips: `Advanced applications may require up to 4 minutes. If you're confident in this topic, invest the time as these questions often have higher discrimination value.`,
                examSpecificStrategies: `${course.examType} sometimes includes advanced ${subsection.title} applications as tie-breaker questions. Mastering these can distinguish top performers.`
              },
              {
                pageNumber: 7,
                pageTitle: "Essential Formulas & Derivations - Part 1",
                content: `Key formulas and derivations for ${subsection.title} essential for ${course.examType} success. This section presents essential mathematical formulas, step-by-step derivations, and memory techniques to ensure quick recall during exams. We'll focus on the most frequently tested equations and their applications.`,
                keyTakeaway: "Mastering essential formulas and derivations for competitive exam success",
                speedSolvingTechniques: `Create formula sheets organized by problem type rather than alphabetically. This approach speeds up formula selection during ${course.examType} exams.`,
                commonTraps: `Formula-based questions in ${course.examType} often require unit conversions before application. Missing this step leads to incorrect answers despite using the right formula.`,
                timeManagementTips: `Spend 10 minutes daily reviewing ${subsection.title} formulas. During the exam, formula recall should take seconds, not minutes.`,
                examSpecificStrategies: `${course.examType} exams frequently test formula manipulation rather than direct application. Practice deriving variations of standard ${subsection.title} formulas.`
              },
              {
                pageNumber: 8,
                pageTitle: "Essential Formulas & Derivations - Part 2",
                content: `Advanced formulas and complex derivations for ${subsection.title} tailored to ${course.examType} examination requirements. This section covers more sophisticated mathematical approaches, formula interrelationships, and advanced derivation techniques that distinguish top performers in competitive exams.`,
                keyTakeaway: "Applying advanced formulas and complex derivations to competitive exam problems",
                speedSolvingTechniques: `For complex ${subsection.title} derivations, memorize key transformation steps rather than entire derivations. This allows quick reconstruction during ${course.examType} exams.`,
                commonTraps: `Advanced formula questions often test conceptual understanding by presenting equations in unfamiliar forms. Practice recognizing equivalent expressions in ${course.examType} context.`,
                timeManagementTips: `When facing complex derivations, determine if you can skip to the final formula. Many ${course.examType} questions test application, not derivation ability.`,
                examSpecificStrategies: `${course.examType} sometimes includes questions requiring synthesis of multiple ${subsection.title} formulas. Practice identifying which combinations of equations solve complex problems.`
              },
              {
                pageNumber: 9,
                pageTitle: "Concept Applications & Examples - Part 1",
                content: `Practical applications and examples of ${subsection.title} specifically selected from ${course.examType} examination patterns. This section demonstrates real-world applications through worked examples based on previous competitive exam questions. We'll develop systematic approaches to recognize and solve different problem types.`,
                keyTakeaway: "Solving competitive exam-style application problems efficiently",
                speedSolvingTechniques: `Categorize ${subsection.title} problems into 3-4 standard types. This pattern recognition enables instant solution strategy selection in ${course.examType} exams.`,
                commonTraps: `Application examples in ${course.examType} often contain distractors - information that seems relevant but isn't needed for solution. Practice identifying only essential variables.`,
                timeManagementTips: `For application problems, allocate 30 seconds for problem classification, 1 minute for solution planning, and 1-2 minutes for execution.`,
                examSpecificStrategies: `${course.examType} application questions frequently test transfer of learning to novel contexts. Practice applying ${subsection.title} principles to unfamiliar scenarios.`
              },
              {
                pageNumber: 10,
                pageTitle: "Concept Applications & Examples - Part 2",
                content: `Advanced applications and complex examples of ${subsection.title} based on challenging ${course.examType} examination patterns. This section explores sophisticated real-world scenarios that test deeper understanding and application skills. We'll analyze difficult competitive exam questions and develop expert solution strategies.`,
                keyTakeaway: "Tackling advanced competitive exam application problems with confidence",
                speedSolvingTechniques: `For advanced ${subsection.title} applications, develop estimation skills to quickly verify if your approach is yielding reasonable results before completing full calculations.`,
                commonTraps: `Complex applications in ${course.examType} often require identifying implicit constraints not directly stated in the problem. Develop the habit of considering practical limitations.`,
                timeManagementTips: `Complex application problems deserve up to 5 minutes if you're confident in your approach. These questions often carry higher marks or discrimination value.`,
                examSpecificStrategies: `${course.examType} includes multi-step ${subsection.title} applications that test process as much as final answers. Practice showing organized work even when calculating mentally.`
              },
              {
                pageNumber: 11,
                pageTitle: "Conceptual Problem Solving",
                content: `Problem-solving approaches for ${subsection.title} specifically designed for ${course.examType} examination success. This section provides strategies for tackling complex problems and exercises that require conceptual mastery rather than formula application. We'll develop critical thinking skills essential for competitive exam excellence.`,
                keyTakeaway: "Developing effective problem-solving strategies for competitive exam success",
                speedSolvingTechniques: `For conceptual ${subsection.title} problems, first identify the governing principle before attempting calculations. This approach prevents wasted time on incorrect solution paths in ${course.examType} exams.`,
                commonTraps: `Conceptual problems in ${course.examType} often have answers that seem intuitively correct but are actually wrong. Verify answers with quick calculations even when the solution seems obvious.`,
                timeManagementTips: `Conceptual problems typically require 2-3 minutes. If you're spending longer, you may be overthinking - ${course.examType} questions are designed to be solvable within time constraints.`,
                examSpecificStrategies: `${course.examType} increasingly tests conceptual understanding over calculation ability. Focus on understanding why certain approaches work rather than memorizing solution steps.`
              },
              {
                pageNumber: 12,
                pageTitle: "Short Tricks & Speed Techniques",
                content: `Time-saving techniques and shortcuts for ${subsection.title} crucial for ${course.examType} examination time constraints. This section presents methods to solve problems quickly and efficiently under competitive exam conditions. We'll learn mental math techniques, estimation methods, and strategic approaches to maximize your score.`,
                keyTakeaway: "Mastering speed techniques and shortcuts for competitive exam excellence",
                speedSolvingTechniques: `Develop calculation shortcuts specific to ${subsection.title} problems. For example, [specific technique relevant to subject]. These methods can save 30-60 seconds per question in ${course.examType} exams.`,
                commonTraps: `Speed techniques sometimes sacrifice accuracy. Know exactly when shortcuts are reliable for ${course.examType} questions and when full calculations are necessary.`,
                timeManagementTips: `Practice solving ${subsection.title} problems with decreasing time allocations. Start with 3 minutes per problem, then reduce to 2 minutes, then 1 minute to build speed.`,
                examSpecificStrategies: `${course.examType} rewards both accuracy and speed. Develop a personal strategy for which ${subsection.title} questions to solve first based on your strengths.`
              }
            ];
            console.log(`Created ${pages.length} default pages for module ${moduleIndex}, subsection ${subsectionIndex}`);
          }
          
          fallbackContent[moduleIndex][subsectionIndex] = {
            subsectionTitle: subsection.title,
            summary: subsection.summary || `Comprehensive overview of ${subsection.title}`,
            pages: pages,
            practicalExample: subsection.practicalExample || `Practical example demonstrating ${subsection.title}`,
            commonPitfalls: subsection.commonPitfalls || [`Common issues with ${subsection.title}`, "Best practices to avoid problems"],
            difficulty: subsection.difficulty || "Intermediate",
            estimatedTime: subsection.estimatedTime || "15-20 minutes"
          };
        });
      });
      
      console.log(`Returning fallback content structure with ${Object.keys(fallbackContent).length} modules`);
      
      return NextResponse.json({
        detailedContent: fallbackContent,
        courseId: id,
        message: "Generated fallback content from course structure",
        isFallback: true
      });
    }

    // Validate the content structure before sanitizing
    console.log(`Validating content structure before sending response`);
    
    // Ensure detailedContent has the right structure
    if (!detailedContent.detailedContent) {
      detailedContent.detailedContent = {};
    }
    
    // Check each module and subsection to ensure pages exist
    Object.keys(detailedContent.detailedContent).forEach(moduleIndex => {
      const module = detailedContent.detailedContent[moduleIndex];
      
      Object.keys(module).forEach(subsectionIndex => {
        const subsection = module[subsectionIndex];
        
        // Ensure pages array exists
        if (!subsection.pages || !Array.isArray(subsection.pages) || subsection.pages.length === 0) {
          console.log(`Adding default pages for module ${moduleIndex}, subsection ${subsectionIndex}`);
          
          // Get title from subsection
          const title = subsection.subsectionTitle || `Section ${subsectionIndex}`;
          
          // Create default pages
          subsection.pages = [
            {
              pageNumber: 1,
              pageTitle: "Introduction & Foundation",
              content: subsection.summary || `Introduction to ${title}. This section covers the fundamental concepts and provides necessary background knowledge for ${course.examType} exam preparation. We'll explore the core principles, key terminology, and establish a strong foundation that will help you tackle more complex problems in future sections.`,
              keyTakeaway: "Understanding the basic concepts and principles essential for competitive exams",
              speedSolvingTechniques: `Quick recognition techniques for ${title} problems in ${course.examType} exams. Look for key patterns and identifiers that signal which approach to use.`,
              commonTraps: `Common mistakes students make when approaching ${title} problems include misinterpreting the question, applying the wrong formula, or making calculation errors under time pressure. Watch for these specific pitfalls in ${course.examType} exams.`,
              timeManagementTips: `For ${title} questions in ${course.examType}, allocate approximately 1-2 minutes per question. Skip complex calculations initially and return to them if time permits.`,
              examSpecificStrategies: `${course.examType} exams frequently test ${title} concepts through multiple-choice questions that require quick application of fundamentals. Focus on understanding core principles rather than memorizing complex derivations.`
            },
            {
              pageNumber: 2,
              pageTitle: "Core Theory & Principles - Part 1",
              content: `Core theoretical concepts of ${title} for ${course.examType} exam preparation. This section covers the fundamental principles, key theoretical frameworks, and essential formulas you'll need to master. We'll focus on building a solid understanding that will serve as the foundation for more advanced applications.`,
              keyTakeaway: "Mastering the fundamental theoretical principles required for competitive exams",
              speedSolvingTechniques: `When solving ${title} problems in ${course.examType} exams, first identify the core principle being tested. This quick classification will help you select the right formula and approach immediately.`,
              commonTraps: `Examiners often create ${course.examType} questions with subtle variations of standard ${title} problems. Be careful of slightly altered conditions that change which formula applies.`,
              timeManagementTips: `For theoretical questions on ${title}, spend 30 seconds identifying the concept being tested before attempting the solution.`,
              examSpecificStrategies: `${course.examType} exams typically include 3-5 questions on ${title} fundamentals. Mastering these core concepts can secure easy marks.`
            },
            {
              pageNumber: 3,
              pageTitle: "Core Theory & Principles - Part 2",
              content: `Advanced theoretical concepts of ${title} specifically tailored for ${course.examType} examination. This section builds on the fundamental principles with more complex theoretical frameworks that frequently appear in competitive exams. We'll explore how these concepts are tested and the most efficient ways to approach them.`,
              keyTakeaway: "Applying advanced theoretical principles to competitive exam scenarios",
              speedSolvingTechniques: `For complex ${title} problems, use the elimination method to quickly remove obviously incorrect options before detailed calculation, saving precious exam time.`,
              commonTraps: `In ${course.examType} exams, ${title} questions often include unnecessary information to confuse candidates. Learn to identify only the relevant variables needed for solution.`,
              timeManagementTips: `Complex theoretical questions should take no more than 2-3 minutes. If you're spending longer, mark for review and move on.`,
              examSpecificStrategies: `${course.examType} exam setters often combine multiple concepts from ${title} in single questions. Practice identifying which principles apply to different parts of the same problem.`
            },
            {
              pageNumber: 4,
              pageTitle: "Core Theory & Principles - Part 3",
              content: `Specialized theoretical aspects of ${title} crucial for ${course.examType} success. This section explores specialized theoretical concepts and their implications in competitive exam contexts. We'll analyze previous year questions and identify patterns in how these concepts are tested.`,
              keyTakeaway: "Mastering specialized theoretical aspects frequently tested in competitive exams",
              speedSolvingTechniques: `Create mental shortcuts for specialized ${title} calculations by memorizing common value patterns and results that appear frequently in ${course.examType} exams.`,
              commonTraps: `Specialized ${title} questions in ${course.examType} often test edge cases and exceptions to rules. Be vigilant about conditions where standard formulas need modification.`,
              timeManagementTips: `For specialized concept questions, quickly determine if you know the approach within 20 seconds. If uncertain, flag for later review.`,
              examSpecificStrategies: `${course.examType} often tests specialized ${title} concepts through comparison questions. Practice quickly identifying which principle yields the larger/smaller result.`
            },
            {
              pageNumber: 5,
              pageTitle: "Core Theory & Principles - Part 4",
              content: `Theoretical applications of ${title} in ${course.examType} exam context. This section demonstrates how theoretical principles apply to practical scenarios commonly found in competitive exams. We'll work through representative problems and develop systematic solution approaches.`,
              keyTakeaway: "Connecting theoretical principles to practical competitive exam applications",
              speedSolvingTechniques: `When applying ${title} theory to practical problems, first classify the problem type before calculation. This pattern recognition saves significant time in ${course.examType} exams.`,
              commonTraps: `Application questions often contain practical constraints not found in theoretical problems. In ${course.examType} exams, watch for real-world limitations that affect your answer.`,
              timeManagementTips: `Application problems typically require 2-3 minutes. Break complex applications into smaller steps with time checkpoints.`,
              examSpecificStrategies: `${course.examType} exams increasingly focus on application over theory. Practice translating theoretical ${title} concepts into varied practical contexts.`
            },
            {
              pageNumber: 6,
              pageTitle: "Core Theory & Principles - Part 5",
              content: `Advanced theoretical applications of ${title} specifically designed for ${course.examType} preparation. This section explores sophisticated applications of theoretical principles in complex competitive exam scenarios. We'll analyze challenging problems and develop expert-level approaches.`,
              keyTakeaway: "Handling advanced theoretical applications in high-stakes competitive exams",
              speedSolvingTechniques: `For advanced ${title} applications, develop the ability to estimate answers before detailed calculation. This allows quick verification and error detection in ${course.examType} exams.`,
              commonTraps: `Advanced application questions in ${course.examType} often contain multiple concepts that must be applied sequentially. Missing intermediate steps leads to incorrect final answers.`,
              timeManagementTips: `Advanced applications may require up to 4 minutes. If you're confident in this topic, invest the time as these questions often have higher discrimination value.`,
              examSpecificStrategies: `${course.examType} sometimes includes advanced ${title} applications as tie-breaker questions. Mastering these can distinguish top performers.`
            },
            {
              pageNumber: 7,
              pageTitle: "Essential Formulas & Derivations - Part 1",
              content: `Key formulas and derivations for ${title} essential for ${course.examType} success. This section presents essential mathematical formulas, step-by-step derivations, and memory techniques to ensure quick recall during exams. We'll focus on the most frequently tested equations and their applications.`,
              keyTakeaway: "Mastering essential formulas and derivations for competitive exam success",
              speedSolvingTechniques: `Create formula sheets organized by problem type rather than alphabetically. This approach speeds up formula selection during ${course.examType} exams.`,
              commonTraps: `Formula-based questions in ${course.examType} often require unit conversions before application. Missing this step leads to incorrect answers despite using the right formula.`,
              timeManagementTips: `Spend 10 minutes daily reviewing ${title} formulas. During the exam, formula recall should take seconds, not minutes.`,
              examSpecificStrategies: `${course.examType} exams frequently test formula manipulation rather than direct application. Practice deriving variations of standard ${title} formulas.`
            },
            {
              pageNumber: 8,
              pageTitle: "Essential Formulas & Derivations - Part 2",
              content: `Advanced formulas and complex derivations for ${title} tailored to ${course.examType} examination requirements. This section covers more sophisticated mathematical approaches, formula interrelationships, and advanced derivation techniques that distinguish top performers in competitive exams.`,
              keyTakeaway: "Applying advanced formulas and complex derivations to competitive exam problems",
              speedSolvingTechniques: `For complex ${title} derivations, memorize key transformation steps rather than entire derivations. This allows quick reconstruction during ${course.examType} exams.`,
              commonTraps: `Advanced formula questions often test conceptual understanding by presenting equations in unfamiliar forms. Practice recognizing equivalent expressions in ${course.examType} context.`,
              timeManagementTips: `When facing complex derivations, determine if you can skip to the final formula. Many ${course.examType} questions test application, not derivation ability.`,
              examSpecificStrategies: `${course.examType} sometimes includes questions requiring synthesis of multiple ${title} formulas. Practice identifying which combinations of equations solve complex problems.`
            },
            {
              pageNumber: 9,
              pageTitle: "Concept Applications & Examples - Part 1",
              content: `Practical applications and examples of ${title} specifically selected from ${course.examType} examination patterns. This section demonstrates real-world applications through worked examples based on previous competitive exam questions. We'll develop systematic approaches to recognize and solve different problem types.`,
              keyTakeaway: "Solving competitive exam-style application problems efficiently",
              speedSolvingTechniques: `Categorize ${title} problems into 3-4 standard types. This pattern recognition enables instant solution strategy selection in ${course.examType} exams.`,
              commonTraps: `Application examples in ${course.examType} often contain distractors - information that seems relevant but isn't needed for solution. Practice identifying only essential variables.`,
              timeManagementTips: `For application problems, allocate 30 seconds for problem classification, 1 minute for solution planning, and 1-2 minutes for execution.`,
              examSpecificStrategies: `${course.examType} application questions frequently test transfer of learning to novel contexts. Practice applying ${title} principles to unfamiliar scenarios.`
            },
            {
              pageNumber: 10,
              pageTitle: "Concept Applications & Examples - Part 2",
              content: `Advanced applications and complex examples of ${title} based on challenging ${course.examType} examination patterns. This section explores sophisticated real-world scenarios that test deeper understanding and application skills. We'll analyze difficult competitive exam questions and develop expert solution strategies.`,
              keyTakeaway: "Tackling advanced competitive exam application problems with confidence",
              speedSolvingTechniques: `For advanced ${title} applications, develop estimation skills to quickly verify if your approach is yielding reasonable results before completing full calculations.`,
              commonTraps: `Complex applications in ${course.examType} often require identifying implicit constraints not directly stated in the problem. Develop the habit of considering practical limitations.`,
              timeManagementTips: `Complex application problems deserve up to 5 minutes if you're confident in your approach. These questions often carry higher marks or discrimination value.`,
              examSpecificStrategies: `${course.examType} includes multi-step ${title} applications that test process as much as final answers. Practice showing organized work even when calculating mentally.`
            },
            {
              pageNumber: 11,
              pageTitle: "Conceptual Problem Solving",
              content: `Problem-solving approaches for ${title} specifically designed for ${course.examType} examination success. This section provides strategies for tackling complex problems and exercises that require conceptual mastery rather than formula application. We'll develop critical thinking skills essential for competitive exam excellence.`,
              keyTakeaway: "Developing effective problem-solving strategies for competitive exam success",
              speedSolvingTechniques: `For conceptual ${title} problems, first identify the governing principle before attempting calculations. This approach prevents wasted time on incorrect solution paths in ${course.examType} exams.`,
              commonTraps: `Conceptual problems in ${course.examType} often have answers that seem intuitively correct but are actually wrong. Verify answers with quick calculations even when the solution seems obvious.`,
              timeManagementTips: `Conceptual problems typically require 2-3 minutes. If you're spending longer, you may be overthinking - ${course.examType} questions are designed to be solvable within time constraints.`,
              examSpecificStrategies: `${course.examType} increasingly tests conceptual understanding over calculation ability. Focus on understanding why certain approaches work rather than memorizing solution steps.`
            },
            {
              pageNumber: 12,
              pageTitle: "Short Tricks & Speed Techniques",
              content: `Time-saving techniques and shortcuts for ${title} crucial for ${course.examType} examination time constraints. This section presents methods to solve problems quickly and efficiently under competitive exam conditions. We'll learn mental math techniques, estimation methods, and strategic approaches to maximize your score.`,
              keyTakeaway: "Mastering speed techniques and shortcuts for competitive exam excellence",
              speedSolvingTechniques: `Develop calculation shortcuts specific to ${title} problems. For example, [specific technique relevant to subject]. These methods can save 30-60 seconds per question in ${course.examType} exams.`,
              commonTraps: `Speed techniques sometimes sacrifice accuracy. Know exactly when shortcuts are reliable for ${course.examType} questions and when full calculations are necessary.`,
              timeManagementTips: `Practice solving ${title} problems with decreasing time allocations. Start with 3 minutes per problem, then reduce to 2 minutes, then 1 minute to build speed.`,
              examSpecificStrategies: `${course.examType} rewards both accuracy and speed. Develop a personal strategy for which ${title} questions to solve first based on your strengths.`
            }
          ];
        }
      });
    });

    // Sanitize the content before sending it to the client
    const sanitizedContent = sanitizeContentForDisplay(detailedContent);

    console.log(`Successfully processed detailed content for course ${id}`);
    
    return NextResponse.json({
      ...sanitizedContent,
      message: "Detailed content retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching detailed content:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
