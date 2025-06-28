import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { processEducationalContent } from '@/lib/gemini'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const courseId = formData.get('courseId')
    const moduleId = formData.get('moduleId')
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Get file content based on type
    let content = ''
    const fileName = file.name
    const fileType = fileName.split('.').pop().toLowerCase()

    if (fileType === 'md' || fileType === 'txt') {
      content = await file.text()
    } else if (fileType === 'pdf') {
      // For PDF processing, you would typically use a library like pdf-parse
      // For now, we'll return an error asking for MD/TXT files
      return NextResponse.json({ 
        error: 'PDF processing not implemented yet. Please upload MD or TXT files.' 
      }, { status: 400 })
    } else {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload MD, TXT, or PDF files.' 
      }, { status: 400 })
    }

    // Process the content with the centralized LLM function
    const processedContent = await processEducationalContent(content, fileName)

    // Save to database if courseId and moduleId are provided
    if (courseId && moduleId) {
      const { db } = await connectToDatabase()
      
      await db.collection('courses').updateOne(
        { 
          _id: new ObjectId(courseId),
          'modules._id': new ObjectId(moduleId)
        },
        {
          $set: {
            'modules.$.enhancedContent': processedContent,
            'modules.$.lastProcessed': new Date()
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      fileName,
      fileType,
      processedContent
    })

  } catch (error) {
    console.error('Content upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process content' },
      { status: 500 }
    )
  }
}
