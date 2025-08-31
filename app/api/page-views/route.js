import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request) {
  let client = null;
  try {
    console.log("📊 Getting page views statistics...")
    
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    
    // Get total page views
    const pageViewsCollection = db.collection("pageViews")
    const stats = await pageViewsCollection.findOne({ _id: "homepage" })
    
    const totalViews = stats?.count || 0
    
    // Get recent views (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentViews = await pageViewsCollection.countDocuments({
      timestamp: { $gte: sevenDaysAgo },
      type: "view"
    })
    
    // Get today's views
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayViews = await pageViewsCollection.countDocuments({
      timestamp: { $gte: todayStart },
      type: "view"
    })
    
    console.log("✅ Page views stats retrieved:", { totalViews, recentViews, todayViews })
    
    return NextResponse.json({
      totalViews,
      recentViews,
      todayViews,
      lastUpdated: new Date()
    })
    
  } catch (error) {
    console.error("❌ Error getting page views:", error)
    return NextResponse.json(
      { error: "Failed to get page views" },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  let client = null;
  try {
    console.log("👁️ Recording page view...")
    
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")
    
    // Get client IP and user agent for basic tracking
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Create a simple hash for deduplication (basic spam prevention)
    const viewId = `${clientIp}-${new Date().toDateString()}`
    
    const pageViewsCollection = db.collection("pageViews")
    
    // Check if this IP has already been counted today
    const existingView = await pageViewsCollection.findOne({
      viewId,
      type: "view"
    })
    
    if (!existingView) {
      // Record the individual view
      await pageViewsCollection.insertOne({
        viewId,
        type: "view",
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
        page: "homepage"
      })
      
      // Increment total count
      await pageViewsCollection.updateOne(
        { _id: "homepage" },
        { 
          $inc: { count: 1 },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true }
      )
      
      console.log("✅ Page view recorded successfully")
    } else {
      console.log("ℹ️ Page view already recorded for this IP today")
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("❌ Error recording page view:", error)
    return NextResponse.json(
      { error: "Failed to record page view" },
      { status: 500 }
    )
  }
} 