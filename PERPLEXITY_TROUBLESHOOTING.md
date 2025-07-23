# Perplexity API Troubleshooting Guide

## Common Issues and Solutions

### 1. 400 Bad Request Error

**Symptoms:**

- `HTTP error! status: 400 - Bad Request`
- Perplexity connection test fails
- Quiz generation with Perplexity fails

**Common Causes:**

#### A. Invalid API Key

- **Check:** Verify `PERPLEXITY_API_KEY` is set in your environment
- **Solution:**
  ```bash
  # In .env.local file
  PERPLEXITY_API_KEY=your_actual_api_key_here
  ```

#### B. API Key Format Issues

- **Check:** API key should start with `pplx-` prefix
- **Solution:** Ensure you're using the correct API key from Perplexity dashboard

#### C. Model Name Changes

- **Check:** Old `llama-3.1-sonar-*` models have been deprecated as of 2024
- **Current Models (2024):**
  - `sonar` (basic model, recommended)
  - `sonar-reasoning` (reasoning model)
  - `sonar-pro` (advanced model)
  - `sonar-deep-research` (research model)

#### D. Request Format Issues

- **Check:** Ensure all required fields are present
- **Required Fields:**
  - `model`: String
  - `messages`: Array with role and content
  - `max_tokens`: Number (optional but recommended)

#### E. Search Domain Filter Issues

- **Symptoms:** `search_domain_filters must be a valid domain name, but got edu`
- **Cause:** Perplexity expects full domain names, not TLDs
- **Solution:** Use full domains like `"stanford.edu"` or remove the filter entirely
- **Fixed:** Domain filters have been removed from our implementation for broader search results

### 2. Environment Configuration

#### Development Setup

1. Create `.env.local` file in project root:

   ```
   PERPLEXITY_API_KEY=pplx-your-key-here
   GEMINI_API_KEY=your-gemini-key-here
   ```

2. Restart your development server after adding environment variables

#### Production Setup

- Set environment variables in your hosting platform
- Ensure the key has proper permissions for the API

### 3. Testing the Connection

#### Manual Test

1. Open browser developer tools
2. Go to the educator dashboard
3. Open a course in Exam Genius
4. Click "Provider" button in quiz section
5. Click "Test Connections"
6. Check console for detailed error messages

#### API Test

```javascript
// Test payload that should work
{
  "model": "sonar",
  "messages": [
    {
      "role": "user",
      "content": "Hello, can you respond with 'Connection successful'?"
    }
  ],
  "max_tokens": 50,
  "temperature": 0.2
}
```

### 4. Debugging Steps

1. **Check API Key:**

   ```bash
   echo $PERPLEXITY_API_KEY  # Should show your key
   ```

2. **Check Console Logs:**

   - Look for "🔑 API Key configured: true/false"
   - Look for "🔍 Failed request payload"
   - Look for detailed error messages

3. **Test with cURL:**
   ```bash
   curl -X POST "https://api.perplexity.ai/chat/completions" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
     -d '{
       "model": "sonar",
       "messages": [{"role": "user", "content": "Hello"}],
       "max_tokens": 50
     }'
   ```

### 5. Fallback Behavior

When Perplexity fails:

- System automatically falls back to Gemini
- Users see a notification indicating fallback was used
- Quiz generation continues with alternative provider

### 6. Known Limitations

- Perplexity requires internet connectivity for web search
- Some models have usage limits
- API responses may be slower due to web search functionality

### 7. Getting Help

If issues persist:

1. **Check Perplexity Status:** Visit Perplexity's status page
2. **Review API Documentation:** Check for recent API changes
3. **Update API Key:** Generate a new API key if current one is invalid
4. **Contact Support:** Reach out to Perplexity support if API issues continue

### 8. Alternative Configuration

If Perplexity continues to fail, you can:

1. **Use Gemini Only:**

   - Remove `PERPLEXITY_API_KEY` from environment
   - System will default to Gemini for all operations

2. **Switch Model in Code:**
   ```javascript
   // In lib/perplexity.js, try different models
   model: "sonar"; // Basic model (recommended)
   model: "sonar-pro"; // Advanced model (higher cost)
   ```

---

**Last Updated:** Current date
**Next Review:** Check for API updates monthly
