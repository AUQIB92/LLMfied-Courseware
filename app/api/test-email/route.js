import { NextResponse } from "next/server"
import { testEmailConfig, sendLearnerRegistrationNotification } from "@/lib/emailService"

export async function GET() {
  try {
    console.log("Testing email configuration...")
    
    const testResult = await testEmailConfig()
    
    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: "Email configuration is working correctly!",
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Email configuration failed",
        details: testResult.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json({
      success: false,
      error: "Email test failed",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log("Sending test learner registration email...")
    
    const testLearnerData = {
      name: "Test Learner",
      email: "auqib92@gmail.com", // Send to your email for testing
      role: "learner"
    }
    
    const emailResult = await sendLearnerRegistrationNotification(testLearnerData)
    
    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "Test registration emails sent successfully!",
        details: {
          adminEmail: emailResult.adminEmail,
          learnerEmail: emailResult.learnerEmail
        },
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to send test emails",
        details: emailResult.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Test email send error:", error)
    return NextResponse.json({
      success: false,
      error: "Test email send failed",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
