# Environment Setup Guide

## Fix for "Failed to fetch" Error

The error you're experiencing is due to missing environment variables, specifically the `GEMINI_API_KEY`. Here's how to fix it:

## 1. Create Environment Variables File

Create a file named `.env.local` in your project root with the following content:

```env
# JWT Secret for authentication (required)
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_characters_long

# Google Gemini AI API Key (REQUIRED for course processing)
GEMINI_API_KEY=your_google_gemini_api_key_here

# MongoDB Connection String (required for data persistence)
MONGODB_URI=your_mongodb_connection_string

# Next.js Environment
NODE_ENV=development

# Application URL
NEXTAUTH_URL=http://localhost:3000
```

## 2. Get Your Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Replace `your_google_gemini_api_key_here` in your `.env.local` file with the actual key

## 3. Generate a Secure JWT Secret

Run this command in your terminal to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and replace `your_super_secure_jwt_secret_key_here_at_least_32_characters_long` in your `.env.local` file.

## 4. Set Up MongoDB (if needed)

If you don't have MongoDB set up:

- **Local MongoDB**: Install MongoDB locally and use `mongodb://localhost:27017/llmfied`
- **MongoDB Atlas** (recommended): 
  1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
  2. Create a free cluster
  3. Get your connection string
  4. Replace `your_mongodb_connection_string` in your `.env.local` file

## 5. Restart Your Development Server

After setting up the environment variables:

```bash
npm run dev
```

## 6. Verify Setup

The updated Gemini library now includes:
- ✅ Robust JSON parsing with `jsonrepair` and `JSON5`
- ✅ Better error handling and retry logic
- ✅ Improved parsing for large responses
- ✅ Fallback mechanisms for malformed JSON

## Example `.env.local` File

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
GEMINI_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/llmfied
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
```

## What Was Fixed

1. **Added robust JSON parsing**: The new implementation uses `jsonrepair` and `JSON5` libraries for better parsing reliability
2. **Improved error handling**: Better error messages and fallback mechanisms
3. **Enhanced retry logic**: More intelligent retry strategies for API calls
4. **Sanitization improvements**: Better handling of malformed JSON responses from Gemini

This should resolve the "Failed to fetch" error you were experiencing when uploading files for course creation. 