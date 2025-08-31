import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  let client = null;
  try {
    console.log("🔍 Debug: Checking test series in database...")
    
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    
    // Get all test series (regardless of status)
    const allTestSeries = await db.collection("testSeries").find({}).toArray()
    console.log(`📊 Total test series in database: ${allTestSeries.length}`)
    
    // Get published test series
    const publishedTestSeries = await db.collection("testSeries").find({
      status: "published"
    }).toArray()
    console.log(`📊 Published test series: ${publishedTestSeries.length}`)
    
    // Get test series by status
    const statusCounts = await db.collection("testSeries").aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).toArray()
    
    // Get sample test series data
    const sampleTestSeries = allTestSeries.slice(0, 3).map(ts => ({
      _id: ts._id,
      title: ts.title,
      status: ts.status,
      educatorId: ts.educatorId,
      createdAt: ts.createdAt,
      subject: ts.subject,
      difficulty: ts.difficulty
    }))
    
    const debugInfo = {
      totalTestSeries: allTestSeries.length,
      publishedTestSeries: publishedTestSeries.length,
      statusBreakdown: statusCounts,
      sampleData: sampleTestSeries,
      databaseName: "llmfied",
      collectionName: "testSeries",
      timestamp: new Date().toISOString()
    }
    
    console.log("📋 Debug info:", debugInfo)
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
    
  } catch (error) {
    console.error("❌ Debug error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 