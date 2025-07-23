import { NextResponse } from "next/server";
import { generateCompetitiveExamSubsectionDetails } from "@/lib/gemini";

export async function POST(request) {
    try {
        const body = await request.json();
        const { content, context } = body;

        if (!content || !context) {
            return NextResponse.json({ error: 'Missing content or context' }, { status: 400 });
        }

        console.log(`🚀 Generating content for subsection: "${context.subsectionTitle}" in module "${context.moduleTitle}"`);
        console.log(`Context: ${JSON.stringify(context)}`);
        console.log(`Content length: ${content.length} characters`);

        // Generate content for this specific subsection
        try {
            console.log(`🧠 Calling Gemini API for subsection "${context.subsectionTitle}"...`);
            const startTime = Date.now();
            
            const subsectionData = await generateCompetitiveExamSubsectionDetails(
                content,
                context
            );
            
            const endTime = Date.now();
            console.log(`✅ Gemini API call completed in ${(endTime - startTime) / 1000} seconds`);
            
            // Handle JSON response properly
            if (typeof subsectionData === 'object' && subsectionData !== null) {
                console.log(`Generated JSON data with ${Object.keys(subsectionData).length} top-level properties`);
                console.log(`Properties: ${Object.keys(subsectionData).join(', ')}`);
                
                // Log new categorized flashcard structure
                console.log(`Concept Flashcards: ${subsectionData.conceptFlashCards?.length || 0}`);
                console.log(`Formula Flashcards: ${subsectionData.formulaFlashCards?.length || 0}`);
                console.log(`Total Flashcards: ${(subsectionData.conceptFlashCards?.length || 0) + (subsectionData.formulaFlashCards?.length || 0)}`);
                
                // Legacy structure logging (for backward compatibility)
                console.log(`Legacy - Concept Groups: ${subsectionData.conceptGroups?.length || 0}`);
                console.log(`Legacy - Unified Flashcards: ${subsectionData.flashCards?.length || 0}`);
                console.log(`Legacy - Problem-Solving Workflows: ${subsectionData.problemSolvingWorkflows?.length || 0}`);
                
                console.log(`Has pages property: ${!!subsectionData.pages}`);
                console.log(`Summary length: ${subsectionData.summary?.length || 0}`);
                console.log(`Difficulty: ${subsectionData.difficulty || 'Not specified'}`);
                console.log(`Estimated Time: ${subsectionData.estimatedTime || 'Not specified'}`);
                
                // Log sample flashcards if available
                if (subsectionData.conceptFlashCards && subsectionData.conceptFlashCards.length > 0) {
                    console.log(`📚 First concept flashcard: "${subsectionData.conceptFlashCards[0].question}"`);
                }
                if (subsectionData.formulaFlashCards && subsectionData.formulaFlashCards.length > 0) {
                    console.log(`🧮 First formula flashcard: "${subsectionData.formulaFlashCards[0].question}"`);
                }
                
                if ((subsectionData.conceptFlashCards?.length || 0) === 0 && (subsectionData.formulaFlashCards?.length || 0) === 0) {
                    console.log(`⚠️ No flashcards found in new structure - checking legacy formats`);
                    if (!subsectionData.conceptGroups && !subsectionData.flashCards) {
                        console.log(`⚠️ No content found in any flashcard format - may need to regenerate`);
                    }
                }
            } else {
                console.log(`Generated content length: ${subsectionData?.length || 0} characters`);
            }

            return NextResponse.json({ 
                success: true, 
                content: subsectionData 
            });
        } catch (error) {
            console.error(`Error generating content for subsection "${context.subsectionTitle}":`, error);
            return NextResponse.json({ 
                error: `Failed to generate content: ${error.message}` 
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in generate-subsection-content route:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 