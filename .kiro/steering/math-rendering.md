# Math Rendering Excellence Guidelines

## Core Math Rendering Architecture

The LLMfied platform uses a sophisticated multi-layered approach to mathematical content rendering that ensures 100% perfect display across all educational content. The system employs:

1. **Adaptive Rendering Strategy**: The `AdaptiveMathRenderer` component intelligently selects the optimal rendering approach based on content complexity analysis, performance requirements, and error probability assessment.

2. **Content Analysis Engine**: Before rendering, mathematical content undergoes deep analysis to determine:
   - Complexity level (simple, moderate, complex)
   - Error probability
   - Performance requirements
   - Context (inline vs. block)

3. **Multi-Engine Rendering**: The platform leverages multiple specialized rendering engines:
   - **KaTeX**: For simple and moderate math (fastest performance)
   - **MathJax**: For complex math with superior error handling
   - **Custom Hybrid Renderer**: For edge cases and specialized notation

4. **Error Recovery System**: A sophisticated error boundary system with multiple fallback levels ensures content is always displayed, even when encountering malformed LaTeX.

## LaTeX Sanitization Requirements

To achieve 100% perfect math rendering, all LaTeX content must undergo comprehensive sanitization:

1. **Pre-Processing**:
   - Fix missing backslashes in LaTeX commands
   - Repair malformed fractions, square roots, and other common structures
   - Handle Greek letters and special symbols correctly
   - Normalize mathematical operators and relations
   - Clean up encoding artifacts and invisible characters

2. **Context-Aware Processing**:
   - Only apply LaTeX-specific fixes to actual mathematical content
   - Preserve regular text content without unwanted transformations
   - Handle edge cases like "to" vs. "\to" based on context

3. **Post-Processing**:
   - Remove duplicate expressions
   - Fix spacing issues around delimiters
   - Ensure proper nesting of environments
   - Validate final LaTeX syntax

## Implementation Best Practices

When working with math rendering components:

1. **Component Selection**:
   - Use `AdaptiveMathRenderer` as the primary entry point for all math content
   - For simple inline math, consider `SmartMathRenderer` with `inline={true}`
   - For complex block math, use `MathJaxRenderer` with appropriate options
   - For markdown with embedded math, use `MathMarkdownRenderer`

2. **Performance Optimization**:
   - Lazy load heavy renderers using React.lazy and Suspense
   - Implement memoization for content processing
   - Use progressive enhancement for better perceived performance

3. **Error Handling**:
   - Always implement proper error boundaries
   - Provide meaningful fallbacks for rendering failures
   - Log rendering errors for debugging and improvement

4. **Accessibility**:
   - Ensure all math content has proper ARIA attributes
   - Provide text alternatives for complex equations
   - Support screen readers with MathML output when possible

## Common Math Rendering Issues and Solutions

| Issue | Solution |
|-------|----------|
| Missing backslashes | Implement regex-based preprocessing to add missing backslashes before LaTeX commands |
| Malformed fractions | Convert patterns like `frac{a}{b}` to `\frac{a}{b}` |
| Broken square roots | Fix `sqrt{x}` to `\sqrt{x}` and handle nested roots |
| Greek letter encoding | Convert Unicode Greek letters to LaTeX commands (e.g., `μ` to `\mu`) |
| Incorrect "to" usage | Only convert "to" to `\to` in mathematical contexts |
| Nested delimiters | Ensure proper nesting and matching of braces and brackets |
| Line breaks in inline math | Remove or replace with appropriate spacing |
| Double backslashes | Clean up escaped backslashes from JSON strings |

## Testing and Validation

To ensure 100% perfect math rendering:

1. **Comprehensive Testing**:
   - Test with a diverse set of mathematical content
   - Include edge cases and complex expressions
   - Verify rendering in both light and dark modes
   - Test across different browsers and devices

2. **Validation Tools**:
   - Use LaTeX syntax validators before rendering
   - Implement visual regression testing for math components
   - Monitor rendering errors in production

3. **Continuous Improvement**:
   - Regularly update sanitization rules based on error patterns
   - Keep rendering libraries up to date
   - Collect and analyze rendering failures for systematic improvements

## Integration with AI Content

When generating or processing AI-created mathematical content:

1. **Pre-Generation Guidelines**:
   - Instruct AI to use proper LaTeX syntax
   - Specify preferred notation for consistency
   - Request explicit delimiters for inline and block math

2. **Post-Generation Processing**:
   - Apply enhanced sanitization to AI-generated content
   - Validate and fix common AI-specific LaTeX errors
   - Ensure consistent notation throughout the content

3. **Feedback Loop**:
   - Track rendering issues with AI-generated content
   - Update AI prompts based on common error patterns
   - Implement automatic correction for recurring issues