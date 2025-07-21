import { NextResponse } from "next/server";
import { processMarkdown } from "@/lib/fileProcessor";
import { connectToDatabase } from "@/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
        const body = await request.json();
        const { markdownContent, courseData } = body;

        if (!markdownContent || !courseData) {
            return NextResponse.json({ error: 'Missing markdownContent or courseData' }, { status: 400 });
        }

        console.log("🚀 Initializing background job for detailed subsection content generation...");

        const { db } = await connectToDatabase();
        const jobId = uuidv4();
        let totalJobs = 0;
        const generationJobs = [];

        // Process each module to extract subsections
        for (const module of courseData.modules) {
            console.log(`Processing module: "${module.title}"`);
            
            // Extract subsection titles using regex (#### headings)
            const subsectionTitles = (module.content.match(/####(.*?)\n/g) || [])
                .map(t => t.replace(/####\s*/, "").trim())
                .filter(title => title); // Filter out empty titles
            
            console.log(`Found ${subsectionTitles.length} subsections in module "${module.title}"`);
            
            if (subsectionTitles.length > 0) {
                totalJobs += subsectionTitles.length;
                
                for (const subsectionTitle of subsectionTitles) {
                    // Extract the specific content for this subsection with more context
                    const subsectionRegex = new RegExp(
                        `####\\s*${subsectionTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?(?=####|###|##|#|$)`
                    );
                    const subsectionContentMatch = module.content.match(subsectionRegex);
                    
                    // If we don't have specific content for this subsection, create a more descriptive prompt
                    let focusedContent;
                    if (subsectionContentMatch && subsectionContentMatch[0]) {
                        focusedContent = subsectionContentMatch[0];
                        console.log(`✅ Extracted content for subsection "${subsectionTitle}" (${focusedContent.length} chars)`);
                    } else {
                        // Create a more informative prompt with module context
                        focusedContent = `#### ${subsectionTitle}\n\nThis is a subsection of the module "${module.title}" for ${courseData.examType} exam preparation in ${courseData.subject}.\n\nPlease generate comprehensive content for this subsection based on the title and context.`;
                        console.log(`⚠️ No specific content found for subsection "${subsectionTitle}", using generated prompt`);
                    }
                    
                    // Add module context to help the AI understand the broader topic
                    const moduleContext = `Module: ${module.title}\nSubject: ${courseData.subject}\nExam: ${courseData.examType}\n\n${focusedContent}`;

                    generationJobs.push({
                        jobId,
                        courseId: courseData._id, // Will be null for new courses
                        moduleTitle: module.title,
                        moduleIndex: courseData.modules.indexOf(module),
                        subsectionTitle,
                        focusedContent: moduleContext,
                        context: {
                            subject: courseData.subject,
                            examType: courseData.examType,
                            moduleTitle: module.title,
                            subsectionTitle: subsectionTitle
                        },
                        status: 'pending',
                        retries: 0,
                        createdAt: new Date(),
                    });
                }
            }
        }
        
        if (generationJobs.length > 0) {
            await db.collection('generation_jobs').insertMany(generationJobs);
            console.log(`✅ Queued ${generationJobs.length} subsection content generation jobs with Job ID: ${jobId}`);
        } else {
            console.log("⚠️ No subsections found to generate. Completing job immediately.");
    }

    return NextResponse.json({
            message: "Content generation jobs queued successfully.",
            jobId: jobId,
            totalJobs: totalJobs,
            initialModules: courseData.modules // Send back the basic structure
        });

  } catch (error) {
        console.error("Error queuing content generation jobs:", error);
        return NextResponse.json({ error: "Failed to queue content generation jobs." }, { status: 500 });
  }
} 