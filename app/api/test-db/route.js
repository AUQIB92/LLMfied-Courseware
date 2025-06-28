import { NextResponse } from "next/server"
import { testMongoConnection } from "@/lib/mongodb"

export async function GET() {
  try {
    const result = await testMongoConnection()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}
