# AI Provider Setup Guide

This guide explains how to set up and use the dual AI provider system that gives educators the choice between Google Gemini and Perplexity AI for different tasks.

## Environment Variables

Add these to your `.env.local` file:

```bash
# AI Providers - You need at least one of these
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Other existing variables...
MONGODB_URI=mongodb://localhost:27017/llmfied
JWT_SECRET=your_jwt_secret_here
```

## Getting API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env.local`

### Perplexity API Key
1. Go to [Perplexity API](https://www.perplexity.ai/settings/api)
2. Create an account and navigate to API settings
3. Generate a new API key
4. Copy the key and add it to your `.env.local`

## Provider Capabilities

### Google Gemini
- **Best for**: Content structuring, mathematical formatting, educational content
- **Features**: 
  - Advanced content generation
  - Excellent mathematical LaTeX support
  - Structured educational formatting
  - Creative content generation
- **Use Cases**: Module summaries, competitive exam content, structured learning materials

### Perplexity AI
- **Best for**: Research, current information, resource finding
- **Features**:
  - Real-time web search
  - Current information and statistics
  - Source citations
  - Research capabilities
- **Use Cases**: Quiz generation with current examples, finding learning resources, research-based content

## How to Use

### 1. Provider Selection Component

Use the `AIProviderSelector` component in your educator dashboard:

```jsx
import AIProviderSelector from '@/components/educator/AIProviderSelector';

function EducatorDashboard() {
  const [selectedProviders, setSelectedProviders] = useState({
    content: 'gemini',
    quiz: 'perplexity',
    resources: 'perplexity'
  });

  return (
    <AIProviderSelector 
      selectedProviders={selectedProviders}
      onProviderChange={setSelectedProviders}
    />
  );
}
```

### 2. API Endpoints

#### Content Generation
```javascript
// POST /api/exam-genius/generate-content
{
  "content": "Your content here",
  "provider": "gemini", // or "perplexity"
  "contentType": "module", // or "competitive-exam"
  "subject": "Mathematics",
  "learnerLevel": "intermediate"
}
```

#### Quiz Generation
```javascript
// POST /api/exam-genius/generate-quiz
{
  "concept": "Algebra",
  "content": "Your content here",
  "provider": "perplexity", // or "gemini"
  "examType": "SSC",
  "subject": "Mathematics"
}
```

#### Resource Generation
```javascript
// POST /api/resources/generate
{
  "content": "Your content here",
  "provider": "perplexity", // or "gemini"
  "subject": "Mathematics",
  "learnerLevel": "intermediate"
}
```

### 3. Provider Testing

Test your provider connections:

```javascript
// GET /api/providers - Get available providers
// POST /api/providers - Test all provider connections
```

## Recommended Configurations

### For General Education
- **Content**: Gemini (better structure and formatting)
- **Quizzes**: Perplexity (current examples and research)
- **Resources**: Perplexity (real URLs and current materials)

### For Competitive Exams
- **Content**: Gemini (excellent mathematical formatting)
- **Quizzes**: Perplexity (current exam patterns and statistics)
- **Resources**: Perplexity (latest study materials and resources)

### For Programming/Technical Subjects
- **Content**: Gemini (good code formatting and structure)
- **Quizzes**: Perplexity (current technology trends)
- **Resources**: Perplexity (latest tools and documentation)

## Fallback System

The system includes automatic fallback:
- If your primary provider fails, it automatically falls back to the secondary provider
- You can disable fallback by setting `fallback: false` in your API calls
- Fallback order: Perplexity → Gemini (since Gemini is more reliable for basic tasks)

## Enhanced Mode

Use enhanced mode for the best of both providers:

```javascript
// Enhanced module generation
{
  "content": "Your content",
  "mode": "enhanced",
  "provider": "gemini",        // For content structure
  "resourceProvider": "perplexity"  // For resources
}
```

## Provider Status Monitoring

The system provides real-time provider status:
- ✅ Available: API key configured and working
- ❌ Not Configured: Missing API key
- ⚠️ Connection Failed: API key present but connection issues

## Cost Considerations

### Gemini
- Generally more cost-effective
- Good for high-volume content generation
- Excellent value for mathematical content

### Perplexity
- Higher cost due to web search capabilities
- Best used selectively for research-heavy tasks
- Most valuable for resource finding and current information

## Best Practices

1. **Test Connections Regularly**: Use the provider test feature to ensure both APIs are working
2. **Monitor Usage**: Keep track of which provider you're using for different tasks
3. **Optimize for Cost**: Use Perplexity for tasks that benefit from real-time data, Gemini for structured content
4. **Enable Fallback**: Always keep fallback enabled for production environments
5. **Provider Selection**: Choose providers based on task requirements, not just preference

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Check your environment variables and restart the server
2. **Provider Not Available**: Ensure the API key is correctly set and the service is accessible
3. **Fallback Not Working**: Check that the fallback provider has a valid API key
4. **Rate Limiting**: Implement proper retry logic and respect API limits

### Error Messages

- `Provider not available`: API key missing or invalid
- `Connection failed`: Network or API service issues
- `Fallback failed`: Both providers are unavailable

## Support

If you encounter issues:
1. Check the provider status in the AI Provider Selection component
2. Test individual provider connections
3. Review the console logs for detailed error messages
4. Ensure your environment variables are correctly set

## Future Enhancements

Planned features:
- Usage analytics and cost tracking
- Custom provider preferences per course
- A/B testing between providers
- Additional AI provider integrations 