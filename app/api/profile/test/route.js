import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ 
    message: "Profile API is working",
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: "Profile API POST is working",
    timestamp: new Date().toISOString()
  })
}
