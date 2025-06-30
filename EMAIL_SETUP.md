# Email Notification Setup for LLMfied Platform

## 📧 Email Configuration

The platform now sends email notifications whenever a new learner registers!

### Setup Instructions

1. **Environment Variables** (Already configured in `.env.local`):
   ```bash
   EMAIL_USER=auqib92@gmail.com
   EMAIL_PASS=dyhz ejya rlbe tgoz  # Your Gmail App Password
   ```

2. **Gmail App Password Setup**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "LLMfied Platform"
   - Use this password in the `EMAIL_PASS` environment variable

### 🚀 Features

#### For Learner Registration:
- **Admin Notification**: You (`auqib92@gmail.com`) receive a beautiful HTML email with:
  - Learner's name, email, and registration time
  - Professional styling with gradients and icons
  - Quick action buttons to view dashboard or contact learner
  
- **Welcome Email**: New learner receives a welcome email with:
  - Personalized greeting
  - Platform feature highlights
  - Getting started tips
  - Call-to-action button to start learning

#### For Educator Registration:
- **Admin Notification**: Similar notification for educator registrations

### 🧪 Testing

#### Test Email Configuration:
```bash
# GET request to test email config
curl http://localhost:3000/api/test-email
```

#### Send Test Registration Email:
```bash
# POST request to send test emails
curl -X POST http://localhost:3000/api/test-email
```

### 📋 Email Templates

The emails feature:
- **Professional Design**: Modern gradient backgrounds, glassmorphism effects
- **Responsive Layout**: Works on all devices
- **Rich Content**: Icons, badges, action buttons
- **Branded**: Consistent with LLMfied platform design
- **Actionable**: Direct links to dashboard and contact options

### 🔧 Technical Details

- **Library**: Nodemailer
- **Service**: Gmail SMTP
- **Security**: App passwords (more secure than regular passwords)
- **Error Handling**: Graceful fallback if emails fail
- **Logging**: Detailed console logs for debugging

### 📤 Email Flow

1. User registers as learner on the platform
2. User data is saved to MongoDB
3. Two emails are sent simultaneously:
   - Admin notification to `auqib92@gmail.com`
   - Welcome email to the new learner
4. JWT token is generated and returned to user
5. Registration completes successfully

## 🔧 Troubleshooting

If emails aren't working:

1. **Check Environment Variables**: Ensure `EMAIL_USER` and `EMAIL_PASS` are set correctly
2. **Test Configuration**: Use the `/api/test-email` endpoint
3. **Gmail Security**: Make sure 2-Factor Authentication is enabled and App Password is generated
4. **Network**: Check if your network blocks SMTP connections
5. **Logs**: Check server console for detailed error messages

### Connection Timeout Issues
If you're getting `ETIMEDOUT` errors:

1. **Check Firewall/Antivirus**: Temporarily disable to test
2. **Network Restrictions**: Some networks block SMTP ports (465, 587)
3. **Gmail App Password**: Ensure you're using App Password, not regular password
4. **Environment Variables**: Verify `.env.local` has correct credentials

### Fallback Test Mode
The system automatically enables "test mode" when email fails:
- ✅ Registration still works normally
- ✅ No actual emails sent (logged to console instead)
- ✅ You can see email content in server logs
- ✅ Perfect for development without email setup

### Alternative SMTP Providers
If Gmail doesn't work, try these in `.env.local`:

#### Outlook/Hotmail:
```bash
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-app-password
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

#### Yahoo Mail:
```bash
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Test Commands
```bash
# Test email configuration
curl http://localhost:3000/api/test-email

# Check server logs for email attempts
npm run dev  # Watch console for email logs
```

### 🎯 Next Steps

- Monitor email delivery rates
- Add email preferences for users
- Implement email templates for other events (course completion, etc.)
- Add email analytics and tracking

The email system is now fully functional and will notify you immediately when new learners join your platform! 🎉
