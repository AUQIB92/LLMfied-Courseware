# Perplexity Quiz Generation Integration

## Overview

This document outlines the integration of Perplexity AI as an alternative provider for quiz generation in the LLMfied Courseware platform. Users can now choose between Google Gemini and Perplexity AI for generating quizzes, leveraging each provider's unique strengths.

## Changes Made

### 1. Frontend Components Updated

#### ExamModuleEditorEnhanced.js

- Added provider selection state management
- Integrated AIProviderSelector component for quiz provider selection
- Updated quiz generation requests to include selected provider
- Enhanced UI to show current provider and allow switching
- Added provider-specific visual indicators and success messages

### 2. Backend API Support

#### API Route: `/api/exam-genius/generate-quiz`

- Already supported provider selection via `provider` parameter
- Uses `generateQuizWithProvider()` function from `lib/gemini.js`
- Supports fallback mechanism when primary provider fails

### 3. Provider Capabilities

#### Google Gemini

- **Strengths**: Advanced content structuring, excellent mathematical formatting, detailed explanations
- **Best for**: Complex subjects, mathematical content, structured learning
- **Features**:
  - LaTeX formatting support
  - Comprehensive explanations
  - Structured quiz format

#### Perplexity AI

- **Strengths**: Real-time web search, current information, source citations
- **Best for**: Current events, recent developments, fact-based questions
- **Features**:
  - Web search integration
  - Current statistics and examples
  - Source citations
  - Recent developments

## How to Use

### For Educators

1. **Access Provider Selection**:

   - Open any course module in the Exam Genius editor
   - Navigate to the Quiz Generation section for any subsection
   - Click the "Provider" button next to the provider badge

2. **Choose Provider**:

   - Select your preferred provider in the dialog
   - Current selection is indicated by the colored badge:
     - 🧠 Blue badge = Gemini
     - 🔍 Purple badge = Perplexity

3. **Generate Quizzes**:
   - Click "Create" for any difficulty level (Easy, Medium, Hard)
   - The system will use your selected provider
   - Success message will indicate which provider was used
   - Quiz metadata will show the generating provider

### Provider Selection Guidelines

#### Choose Gemini when:

- Creating quizzes for mathematical subjects
- Need detailed, structured explanations
- Working with theoretical concepts
- Require consistent formatting

#### Choose Perplexity when:

- Need current, up-to-date information
- Creating quizzes about recent developments
- Want real-world, current examples
- Need fact-checked information with sources

## Technical Implementation

### Request Format

```javascript
{
  moduleContent: "Content to base quiz on",
  difficulty: "easy|medium|hard",
  context: {
    concept: "Topic name",
    examType: "SSC|UPSC|etc",
    subject: "Subject category",
    learnerLevel: "beginner|intermediate|advanced"
  },
  provider: "gemini|perplexity"
}
```

### Response Format

```javascript
{
  success: true,
  questions: [
    {
      question: "Question text with LaTeX support",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0,
      explanation: "Detailed explanation"
    }
  ],
  metadata: {
    generatedWith: "provider-name",
    originalProvider: "requested-provider",
    questionsProcessed: 5,
    contentValidated: true
  }
}
```

## Benefits

1. **Provider Diversity**: Leverage strengths of different AI providers
2. **Fallback Support**: Automatic fallback if primary provider fails
3. **Real-time Information**: Perplexity provides current, web-searched content
4. **Flexibility**: Educators can choose the best provider for their content
5. **Transparency**: Clear indication of which provider generated each quiz

## Environment Setup

Ensure both API keys are configured in your environment:

```bash
GEMINI_API_KEY=your_gemini_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

## Future Enhancements

1. **Provider Analytics**: Track performance metrics for each provider
2. **Auto-Selection**: Intelligent provider selection based on content type
3. **Hybrid Generation**: Combine outputs from multiple providers
4. **Provider-Specific Settings**: Fine-tune parameters for each provider
5. **Batch Generation**: Generate multiple quizzes with different providers

## Troubleshooting

### Common Issues

1. **Provider Selection Not Saving**:

   - Check if you're logged in as an educator
   - Verify the dialog is closing properly

2. **Quiz Generation Fails**:

   - Check API key configuration
   - Verify internet connection for Perplexity
   - Check console for detailed error messages

3. **Provider Not Available**:
   - Verify API keys are set correctly
   - Test provider connections using the test feature

### Error Messages

- "Provider not available": API key missing or invalid
- "Fallback provider used": Primary provider failed, secondary provider succeeded
- "Authentication failed": User not logged in or not an educator

## Support

For issues or questions regarding the Perplexity quiz integration:

1. Check the browser console for detailed error messages
2. Verify API key configuration
3. Test provider connections using the built-in test feature
4. Review the provider selection in the UI

---

**Note**: This integration maintains backward compatibility. Existing quizzes and functionality remain unchanged, with new provider selection being an additional feature for enhanced quiz generation capabilities.
