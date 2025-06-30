import nodemailer from 'nodemailer'

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email environment variables not set. Using test configuration.')
    // Return a test transporter that logs instead of sending
    return {
      sendMail: async (options) => {
        console.log('📧 [TEST MODE] Would send email:', {
          from: options.from,
          to: options.to,
          subject: options.subject
        })
        return { messageId: 'test-' + Date.now() }
      },
      verify: async () => {
        console.log('✅ [TEST MODE] Email verification skipped')
        return true
      }
    }
  }

  // For Gmail, you'll need to use App Passwords
  // Go to Google Account settings -> Security -> 2-Step Verification -> App passwords
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail App Password
      },
      // Add timeout settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000 // 60 seconds
    })
  } catch (error) {
    console.error('❌ Failed to create Gmail transporter:', error)
    // Fallback to alternative configuration
    return createAlternativeTransporter()
  }
}

// Alternative configuration for other email providers or fallback
const createAlternativeTransporter = () => {
  // Try different SMTP configurations
  const configs = [
    // Gmail SMTP (alternative)
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    },
    // Gmail SSL
    {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    }
  ]

  // Try first available config
  for (const config of configs) {
    try {
      return nodemailer.createTransport({
        ...config,
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      })
    } catch (error) {
      console.warn('⚠️ Failed config:', config.host + ':' + config.port)
      continue
    }
  }

  // If all fail, return test transporter
  console.warn('⚠️ All email configurations failed. Using test mode.')
  return {
    sendMail: async (options) => {
      console.log('📧 [FALLBACK MODE] Would send email:', {
        from: options.from,
        to: options.to,
        subject: options.subject
      })
      return { messageId: 'fallback-' + Date.now() }
    },
    verify: async () => {
      console.log('✅ [FALLBACK MODE] Email verification skipped')
      return true
    }
  }
}

// Send learner registration notification
export const sendLearnerRegistrationNotification = async (learnerData) => {
  try {
    const transporter = createTransporter()
    
    const { name, email, role } = learnerData
    
    // Email to admin (you)
    const adminMailOptions = {
      from: `"LLMfied Courseware" <${process.env.EMAIL_USER}>`,
      to: 'auqib92@gmail.com',
      subject: '🎓 New Learner Registration - LLMfied Platform',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <!-- Header -->
          <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
              🎓 LLMfied Platform
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              New Learner Registration Alert
            </p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: white; font-size: 36px;">👨‍🎓</span>
              </div>
              <h2 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: 600;">
                New Learner Just Joined!
              </h2>
            </div>
            
            <!-- Learner Details -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #4f46e5;">
              <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                📋 Learner Information
              </h3>
              
              <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="background: #e0e7ff; color: #4338ca; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; margin-right: 10px;">👤</span>
                  <strong style="color: #374151; margin-right: 8px;">Name:</strong>
                  <span style="color: #6b7280;">${name}</span>
                </div>
              </div>
              
              <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="background: #ddd6fe; color: #7c3aed; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; margin-right: 10px;">📧</span>
                  <strong style="color: #374151; margin-right: 8px;">Email:</strong>
                  <span style="color: #6b7280;">${email}</span>
                </div>
              </div>
              
              <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="background: #dcfce7; color: #16a34a; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; margin-right: 10px;">🎯</span>
                  <strong style="color: #374151; margin-right: 8px;">Role:</strong>
                  <span style="color: #6b7280; text-transform: capitalize;">${role}</span>
                </div>
              </div>
              
              <div style="margin-bottom: 0;">
                <div style="display: flex; align-items: center;">
                  <span style="background: #fef3c7; color: #d97706; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; margin-right: 10px;">⏰</span>
                  <strong style="color: #374151; margin-right: 8px;">Registered:</strong>
                  <span style="color: #6b7280;">${new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <!-- Stats -->
            <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
              <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">
                🚀 Platform Growing!
              </h4>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Another learner has joined your AI-powered education platform. Keep up the great work!
              </p>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center;">
              <a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-weight: 600; margin-right: 15px;">
                📊 View Dashboard
              </a>
              <a href="mailto:${email}" style="display: inline-block; background: #f3f4f6; color: #374151; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-weight: 600; border: 2px solid #e5e7eb;">
                📧 Contact Learner
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This notification was sent automatically from your LLMfied Platform
            </p>
            <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
              © 2025 LLMfied - AI-Powered Learning Platform
            </p>
          </div>
        </div>
      `
    }
    
    // Welcome email to learner
    const learnerMailOptions = {
      from: `"LLMfied Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to LLMfied Courseware- Your AI Learning Journey Begins!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <!-- Header -->
          <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
              🎓 Welcome to LLMfied!
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              Your AI-powered learning adventure starts now
            </p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
                Hi ${name}! 👋
              </h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
                Thank you for joining LLMfied, the next-generation AI-powered learning platform. 
                We're excited to help you transform your learning experience!
              </p>
            </div>
            
            <!-- Features -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; text-align: center;">
                🚀 What You Can Do Now
              </h3>
              
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; background: #f0f9ff; padding: 15px; border-radius: 10px; border-left: 4px solid #0ea5e9;">
                  <span style="font-size: 24px; margin-right: 15px;">📚</span>
                  <div>
                    <strong style="color: #0c4a6e;">Browse Course Library</strong>
                    <p style="color: #075985; margin: 5px 0 0 0; font-size: 14px;">
                      Discover AI-enhanced courses tailored to your learning style
                    </p>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; background: #f0fdf4; padding: 15px; border-radius: 10px; border-left: 4px solid #22c55e;">
                  <span style="font-size: 24px; margin-right: 15px;">🤖</span>
                  <div>
                    <strong style="color: #14532d;">AI Tutor Assistance</strong>
                    <p style="color: #166534; margin: 5px 0 0 0; font-size: 14px;">
                      Get personalized help and explanations from our AI tutor
                    </p>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; background: #fef7ff; padding: 15px; border-radius: 10px; border-left: 4px solid #a855f7;">
                  <span style="font-size: 24px; margin-right: 15px;">📊</span>
                  <div>
                    <strong style="color: #581c87;">Track Your Progress</strong>
                    <p style="color: #7c2d92; margin: 5px 0 0 0; font-size: 14px;">
                      Monitor your learning journey with detailed analytics
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                🎯 Start Learning Now
              </a>
            </div>
            
            <!-- Tips -->
            <div style="background: #fffbeb; border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b;">
              <h4 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                💡 Pro Tips for Success
              </h4>
              <ul style="color: #a16207; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Complete your profile to get personalized course recommendations</li>
                <li>Set learning goals to track your progress effectively</li>
                <li>Join our community discussions to connect with other learners</li>
                <li>Take advantage of our AI tutor for instant help and clarifications</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center;">
            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
              Need help? We're here for you!
            </p>
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 LLMfied - Transforming Education with AI
            </p>
          </div>
        </div>
      `
    }
    
    // Send both emails
    const results = await Promise.allSettled([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(learnerMailOptions)
    ])
    
    // Check results
    const adminEmailResult = results[0]
    const learnerEmailResult = results[1]
    
    console.log('✅ Email notifications sent:')
    console.log('Admin notification:', adminEmailResult.status === 'fulfilled' ? '✅ Success' : '❌ Failed')
    console.log('Learner welcome email:', learnerEmailResult.status === 'fulfilled' ? '✅ Success' : '❌ Failed')
    
    return {
      success: true,
      adminEmail: adminEmailResult.status === 'fulfilled',
      learnerEmail: learnerEmailResult.status === 'fulfilled',
      results
    }
    
  } catch (error) {
    console.error('❌ Email service error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Send educator registration notification (optional)
export const sendEducatorRegistrationNotification = async (educatorData) => {
  try {
    const transporter = createTransporter()
    
    const { name, email, role } = educatorData
    
    const mailOptions = {
      from: `"LLMfied Platform" <${process.env.EMAIL_USER}>`,
      to: 'auqib92@gmail.com',
      subject: '👨‍🏫 New Educator Registration - LLMfied Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 12px; overflow: hidden;">
          <div style="background: rgba(255,255,255,0.1); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">👨‍🏫 New Educator Joined!</h1>
          </div>
          <div style="background: white; padding: 30px;">
            <h2>Educator Registration Details</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${role}</p>
            <p><strong>Registered:</strong> ${new Date().toLocaleString()}</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:3000" style="background: #059669; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold;">View Dashboard</a>
            </div>
          </div>
        </div>
      `
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Educator registration email sent:', result.messageId)
    
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ Educator email service error:', error)
    return { success: false, error: error.message }
  }
}

// Send OTP email for registration
export const sendOTPEmail = async (otpData) => {
  try {
    const transporter = createTransporter()
    
    const { email, name, otp } = otpData
    
    // Email to user with OTP
    const mailOptions = {
      from: `"LLMfied Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Verification Code - LLMfied Platform',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <!-- Header -->
          <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
              🎓 LLMfied Platform
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              Email Verification Required
            </p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 40px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 36px;">🔐</span>
              </div>
              <h2 style="color: #2d3748; margin: 0; font-size: 24px;">
                Hi ${name}!
              </h2>
              <p style="color: #718096; margin: 10px 0 0 0; font-size: 16px;">
                Complete your registration with this verification code
              </p>
            </div>
            
            <!-- OTP Display -->
            <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px dashed #667eea; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #4a5568; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                Your Verification Code
              </p>
              <div style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0;">
                ${otp}
              </div>
              <p style="color: #718096; margin: 15px 0 0 0; font-size: 12px;">
                This code expires in 10 minutes
              </p>
            </div>
            
            <!-- Instructions -->
            <div style="background: #f0fff4; border-left: 4px solid #48bb78; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #22543d; margin: 0 0 10px 0; font-size: 16px;">
                📝 What to do next:
              </h3>
              <ol style="color: #2f855a; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Go back to the LLMfied registration page</li>
                <li>Enter this 6-digit code in the verification field</li>
                <li>Complete your password setup</li>
                <li>Start your learning journey!</li>
              </ol>
            </div>
            
            <!-- Security Notice -->
            <div style="background: #fef5e7; border: 1px solid #f6e05e; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #744210; margin: 0; font-size: 14px; line-height: 1.5;">
                <strong>🔒 Security Note:</strong> This code is valid for 10 minutes only. 
                If you didn't request this verification, please ignore this email.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.2);">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">
              Welcome to the future of AI-powered learning! 🚀
            </p>
            <p style="color: rgba(255,255,255,0.6); margin: 10px 0 0 0; font-size: 12px;">
              © 2024 LLMfied Platform. All rights reserved.
            </p>
          </div>
        </div>
      `
    }
    
    console.log('📧 Sending OTP email to:', email)
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ OTP email sent:', result.messageId)
    
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ OTP email service error:', error)
    return { success: false, error: error.message }
  }
}

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('✅ Email configuration is working!')
    return { success: true }
  } catch (error) {
    console.error('❌ Email configuration error:', error)
    return { success: false, error: error.message }
  }
}
