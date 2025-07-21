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
            
            const subsectionContent = await generateCompetitiveExamSubsectionDetails(
                content,
                context
            );
            
            const endTime = Date.now();
            console.log(`✅ Gemini API call completed in ${(endTime - startTime) / 1000} seconds`);
            console.log(`Response structure: ${JSON.stringify(Object.keys(subsectionContent))}`);
            console.log(`Response has pages: ${subsectionContent.pages ? subsectionContent.pages.length : 0} pages`);

            return NextResponse.json({ 
                success: true, 
                content: subsectionContent
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