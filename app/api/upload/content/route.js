import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { generateOrProcessCurriculum } from '@/lib/gemini';
import { parseStructuredMarkdown } from '@/lib/fileProcessor';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const courseId = formData.get('courseId');
    const moduleId = formData.get('moduleId');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Get file details
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;
    
    console.log(`📄 Processing file: ${fileName} (${fileType}, ${fileSize} bytes)`);
    
    // Create a temporary file to process
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, fileName);
    
    // Write the file to the temporary location
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempFilePath, fileBuffer);
    
    // Read the file content based on file type
    let content = '';
    
    if (fileType === 'application/pdf') {
      // For PDF files, we would need a PDF parsing library
      return NextResponse.json({ error: 'PDF parsing not implemented yet. Please upload a markdown (.md) file.' }, { status: 501 });
    } else {
      // For text files (markdown, txt, etc.)
      content = fs.readFileSync(tempFilePath, 'utf8');
    }
    
    // Process the content with Gemini's AI to clean up and standardize the markdown
    const processedContent = await generateOrProcessCurriculum('PROCESS', content);
    
    // Parse the structured markdown to extract modules, sections, and subsections
    const structuredData = parseStructuredMarkdown(processedContent);
    
    // Save to database if courseId is provided
    if (courseId) {
      const { db } = await connectToDatabase();
      
      await db.collection('courses').updateOne(
        { _id: new ObjectId(courseId) },
        { 
          $set: { 
            'structuredContent': structuredData,
            'rawContent': content,
            'processedContent': processedContent,
            'lastUpdated': new Date()
          } 
        }
      );
    }
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }
    
    return NextResponse.json({ 
      success: true, 
      content: content,
      processedContent: processedContent,
      structure: structuredData,
      fileName,
      fileType,
      fileSize
    });
    
  } catch (error) {
    console.error('Content upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 });
  }
}
