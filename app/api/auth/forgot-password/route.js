import { NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { connectToDatabase } from "@/lib/mongodb"

// Configure email transporter (you'll need to set these environment variables)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function POST(request) {
  let client = null;
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if email configuration is set up
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration missing:', {
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASS: !!process.env.EMAIL_PASS
      })
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Connect to MongoDB
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Check if user exists
    const user = await db.collection("users").findOne({ email })
    if (!user) {
      console.log('Password reset requested for non-existent user:', email)
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with this email exists, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Hash the token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    // Store the reset token in the database
    const result = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken: hashedToken,
          resetTokenExpiry: resetTokenExpiry,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      console.error('Failed to store reset token for user:', email)
      return NextResponse.json(
        { error: 'Failed to process password reset request. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Reset token stored for user:', email)

    // Create reset URL with fallback
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
    
    console.log('Reset URL generated:', resetUrl)

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - LLMfied',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hello! We received a request to reset your password for your LLMfied account.
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Click the button below to reset your password. This link will expire in 1 hour.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="color: #333; font-size: 12px; line-height: 1.6; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you didn't request this password reset, you can safely ignore this email. 
              Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated message from LLMfied. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    }

    console.log('Attempting to send email to:', email)

    // Send email
    const emailResult = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', {
      messageId: emailResult.messageId,
      to: email
    })

    return NextResponse.json(
      { message: 'Password reset email sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send reset email. Please try again.'
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your email configuration.'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Unable to connect to email server. Please try again later.'
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Email request timed out. Please try again.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 