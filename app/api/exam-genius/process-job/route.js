import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { generateCompetitiveExamSubsectionDetails } from "@/lib/gemini";
import { ObjectId } from 'mongodb';

export async function POST(request) {
    try {
        const { jobId } = await request.json();

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const jobCollection = db.collection('generation_jobs');
        const courseCollection = db.collection('courses');

        // Get the next pending job for this jobId
        const job = await jobCollection.findOneAndUpdate(
            { jobId, status: 'pending' },
            { $set: { status: 'processing', startedAt: new Date() } },
            { sort: { createdAt: 1 }, returnDocument: 'after' }
        );

        if (!job.value) {
            return NextResponse.json({ message: "No pending jobs to process or job already taken." });
        }
        
        const currentJob = job.value;

        try {
            console.log(`Processing job for subsection: "${currentJob.subsectionTitle}" in module "${currentJob.moduleTitle}"`);
            console.log(`Context for generation: ${JSON.stringify(currentJob.context)}`);
            console.log(`Content length for generation: ${currentJob.focusedContent.length} characters`);
            
            // Generate content for this specific subsection
            console.log(`🧠 Calling Gemini API for subsection "${currentJob.subsectionTitle}"...`);
            const startTime = Date.now();
            
            const subsectionContent = await generateCompetitiveExamSubsectionDetails(
                currentJob.focusedContent,
                currentJob.context
            );
            
            const endTime = Date.now();
            console.log(`✅ Gemini API call completed in ${(endTime - startTime) / 1000} seconds`);
            console.log(`Response structure: ${JSON.stringify(Object.keys(subsectionContent))}`);
            console.log(`Response has pages: ${subsectionContent.pages ? subsectionContent.pages.length : 0} pages`);

            // Add the title to the subsection content
            const subsectionWithTitle = {
                title: currentJob.subsectionTitle,
                ...subsectionContent
            };

            console.log(`Generated content for subsection: "${currentJob.subsectionTitle}"`);
            
            // First, check if the module exists and if it has a detailedSubsections array
            const course = await courseCollection.findOne(
                { 
                    $or: [
                        { _id: currentJob.courseId ? new ObjectId(currentJob.courseId) : null },
                        { "modules.title": currentJob.moduleTitle }
                    ]
                }
            );
            
            if (!course) {
                throw new Error(`Course not found for module "${currentJob.moduleTitle}"`);
            }
            
            // Find the module in the course
            const moduleIndex = course.modules.findIndex(m => m.title === currentJob.moduleTitle);
            
            if (moduleIndex === -1) {
                throw new Error(`Module "${currentJob.moduleTitle}" not found in course`);
            }
            
            // Check if the module has a detailedSubsections array
            const hasDetailedSubsections = course.modules[moduleIndex].detailedSubsections !== undefined;
            
            // Update strategy depends on whether detailedSubsections exists
            let updateOperation;
            
            if (hasDetailedSubsections) {
                // If detailedSubsections exists, push to it
                updateOperation = {
                    $push: { [`modules.${moduleIndex}.detailedSubsections`]: subsectionWithTitle }
                };
            } else {
                // If detailedSubsections doesn't exist, create it with the first subsection
                updateOperation = {
                    $set: { [`modules.${moduleIndex}.detailedSubsections`]: [subsectionWithTitle] }
                };
            }
            
            // Update the course with the new subsection content
            const updateResult = await courseCollection.updateOne(
                { _id: course._id },
                updateOperation
            );
            
            console.log(`Update result: ${JSON.stringify(updateResult)}`);

            // Mark job as complete
            await jobCollection.updateOne(
                { _id: currentJob._id },
                { $set: { status: 'completed', completedAt: new Date() } }
            );

            console.log(`✅ Successfully processed and saved subsection: "${currentJob.subsectionTitle}"`);

            return NextResponse.json({ 
                success: true, 
                processedJobId: currentJob._id,
                subsectionTitle: currentJob.subsectionTitle,
                moduleTitle: currentJob.moduleTitle
            });

        } catch (e) {
            console.error(`Failed to process job ${currentJob._id}:`, e);
            
            // Handle retries
            const newRetryCount = (currentJob.retries || 0) + 1;
            if (newRetryCount > 3) {
                 await jobCollection.updateOne(
                    { _id: currentJob._id }, 
                    { $set: { status: 'failed', error: e.message || 'Unknown error' } }
                 );
                 console.log(`❌ Job for "${currentJob.subsectionTitle}" failed after ${newRetryCount} attempts`);
            } else {
                 await jobCollection.updateOne(
                    { _id: currentJob._id }, 
                    { 
                        $set: { 
                            status: 'pending', 
                            retries: newRetryCount,
                            lastError: e.message || 'Unknown error',
                            retryAt: new Date(Date.now() + 5000) // Wait 5 seconds before retry
                        } 
                    }
                 );
                 console.log(`⚠️ Job for "${currentJob.subsectionTitle}" failed, scheduled for retry #${newRetryCount}`);
            }

            return NextResponse.json({ 
                success: false, 
                error: 'Job processing failed', 
                subsectionTitle: currentJob.subsectionTitle 
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Error in process-job route:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 