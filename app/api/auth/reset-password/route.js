import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request) {
  let client = null;
  try {
    const { token, password } = await request.json()

    console.log('Reset password request received:', {
      hasToken: !!token,
      tokenLength: token?.length,
      hasPassword: !!password,
      passwordLength: password?.length
    })

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Hash the provided token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    console.log('Token processing:', {
      originalTokenLength: token.length,
      hashedTokenLength: hashedToken.length
    })

    // Connect to MongoDB
    const connection = await connectToDatabase()
    const client = connection.client
    const db = client.db("llmfied")

    // Find user with this reset token and check if it's not expired
    const user = await db.collection("users").findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      console.log('Invalid or expired reset token')
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset.' },
        { status: 400 }
      )
    }

    console.log('User found for password reset:', user.email)

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset token
    const result = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          passwordHashed: true,
          updatedAt: new Date()
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        }
      }
    )

    if (result.modifiedCount === 0) {
      console.error('Failed to update user password')
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Password reset completed successfully for:', user.email)

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    )
  }
} 