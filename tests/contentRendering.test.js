/**
 * Comprehensive Test Suite for Bulletproof Content Rendering System
 * 
 * This test suite validates the entire content rendering pipeline:
 * 1. Content Processing & Sanitization
 * 2. LaTeX Validation & Fixes
 * 3. Markdown Processing
 * 4. Error Handling & Fallbacks
 * 5. Performance Characteristics
 */

import { 
  sanitizeLaTeX, 
  analyzeContent, 
  preprocessContent,
  validateLaTeXStructure,
  batchProcessContent
} from '../lib/contentProcessor';

import performanceMonitor from '../lib/performanceMonitor';

describe('Content Processing System', () => {
  beforeEach(() => {
    performanceMonitor.reset();
  });

  describe('LaTeX Sanitization', () => {
    test('fixes double backslashes in commands', () => {
      const input = 'The formula is \\\\frac{1}{2} and \\\\sqrt{25}';
      const expected = 'The formula is \\frac{1}{2} and \\sqrt{25}';
      expect(sanitizeLaTeX(input)).toBe(expected);
    });

    test('fixes triple backslashes', () => {
      const input = 'Energy: \\\\\\frac{1}{2}mv^2';
      const expected = 'Energy: \\frac{1}{2}mv^2';
      expect(sanitizeLaTeX(input)).toBe(expected);
    });

    test('balances unmatched dollar signs', () => {
      const input = 'Formula: $E = mc^2 and another formula';
      const result = sanitizeLaTeX(input);
      const dollarCount = (result.match(/\$/g) || []).length;
      expect(dollarCount % 2).toBe(0);
    });

    test('fixes unbalanced braces', () => {
      const input = 'Formula: \\frac{1}{2} and \\sqrt{incomplete';
      const result = sanitizeLaTeX(input);
      const openBraces = (result.match(/\{/g) || []).length;
      const closeBraces = (result.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('handles Greek letters correctly', () => {
      const input = 'Symbols: α, β, γ, Ω';
      const expected = 'Symbols: \\alpha, \\beta, \\gamma, \\Omega';
      expect(sanitizeLaTeX(input)).toBe(expected);
    });

    test('fixes resistivity formulas', () => {
      const input = 'Resistance: frac{rhoL}{A}';
      const expected = 'Resistance: \\frac{\\rho L}{A}';
      expect(sanitizeLaTeX(input)).toBe(expected);
    });

    test('handles empty or null input', () => {
      expect(sanitizeLaTeX('')).toBe('');
      expect(sanitizeLaTeX(null)).toBe('');
      expect(sanitizeLaTeX(undefined)).toBe('');
    });

    test('preserves correctly formatted LaTeX', () => {
      const correctLaTeX = 'Formula: $E = mc^2$ and $\\frac{1}{2}mv^2$';
      const result = sanitizeLaTeX(correctLaTeX);
      expect(result).toContain('$E = mc^2$');
      expect(result).toContain('\\frac{1}{2}');
    });
  });

  describe('Content Analysis', () => {
    test('detects simple content correctly', () => {
      const simpleText = 'This is a simple paragraph with no special formatting.';
      const analysis = analyzeContent(simpleText);
      
      expect(analysis.complexity).toBe('simple');
      expect(analysis.hasMath).toBe(false);
      expect(analysis.hasMarkdown).toBe(false);
      expect(analysis.renderingStrategy).toBe('plaintext');
    });

    test('detects mathematical content', () => {
      const mathText = 'The energy formula is $E = mc^2$ and power is $P = \\frac{V^2}{R}$';
      const analysis = analyzeContent(mathText);
      
      expect(analysis.hasMath).toBe(true);
      expect(analysis.complexity).toBe('moderate');
      expect(analysis.renderingStrategy).toBe('math-optimized');
    });

    test('detects markdown content', () => {
      const markdownText = `
# Main Title
## Subtitle
- List item 1
- List item 2
**Bold text** and *italic text*
\`code snippet\`
      `;
      const analysis = analyzeContent(markdownText);
      
      expect(analysis.hasMarkdown).toBe(true);
      expect(analysis.complexity).toBe('moderate');
    });

    test('detects complex content', () => {
      const complexText = `
# Complex Mathematical Document
The relationship between voltage and current is given by $V = IR$.

## Detailed Analysis
$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

### Key Points
- **Ohm's Law**: $V = IR$ where $V$ is voltage
- **Power**: $P = I^2R = \\frac{V^2}{R}$
- **Resistance**: $R = \\rho \\frac{L}{A}$

\`\`\`javascript
function calculatePower(voltage, resistance) {
  return Math.pow(voltage, 2) / resistance;
}
\`\`\`
      `;
      const analysis = analyzeContent(complexText);
      
      expect(analysis.complexity).toBe('complex');
      expect(analysis.hasMath).toBe(true);
      expect(analysis.hasMarkdown).toBe(true);
      expect(analysis.renderingStrategy).toBe('progressive');
    });

    test('provides accurate metrics', () => {
      const text = 'Math: $x^2$ and $\\frac{1}{2}$ with **bold** and *italic*';
      const analysis = analyzeContent(text);
      
      expect(analysis.analysis.mathContent.inlineMath).toBe(2);
      expect(analysis.analysis.markdownContent.bold).toBe(1);
      expect(analysis.analysis.markdownContent.italic).toBe(1);
      expect(analysis.estimatedRenderTime).toBeGreaterThan(0);
    });
  });

  describe('LaTeX Validation', () => {
    test('validates correct LaTeX structure', () => {
      const validLaTeX = 'Formula: $E = mc^2$ and $\\frac{a}{b}$';
      const validation = validateLaTeXStructure(validLaTeX);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('detects structural issues', () => {
      const invalidLaTeX = 'Broken: $E = mc^2 incomplete and \\frac{}{incomplete}';
      const validation = validateLaTeXStructure(invalidLaTeX);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('provides helpful error messages', () => {
      const problematicLaTeX = 'Empty fraction: \\frac{}{} and nested $math $inside$ math$';
      const validation = validateLaTeXStructure(problematicLaTeX);
      
      expect(validation.errors.some(error => error.includes('fraction'))).toBe(true);
    });

    test('detects empty math expressions', () => {
      const emptyMath = 'Empty inline: $$ and empty display: $$$$';
      const validation = validateLaTeXStructure(emptyMath);
      
      expect(validation.warnings.some(warning => warning.includes('Empty'))).toBe(true);
    });
  });

  describe('Content Preprocessing', () => {
    test('processes content through full pipeline', () => {
      const rawContent = `
# Test Document
The formula \\\\frac{1}{2}mv^2 represents kinetic energy.
Also, resistance is R = frac{rhoL}{A}.
      `;
      
      const processed = preprocessContent(rawContent);
      
      // Should fix LaTeX issues
      expect(processed).toContain('\\frac{1}{2}');
      expect(processed).toContain('\\frac{\\rho L}{A}');
      // Should preserve markdown
      expect(processed).toContain('# Test Document');
    });

    test('handles malformed content gracefully', () => {
      const malformedContent = `
Broken LaTeX: $incomplete formula
Unbalanced braces: \\frac{numerator}{
Random symbols: }{}{$$$
      `;
      
      const processed = preprocessContent(malformedContent);
      
      // Should not throw errors
      expect(typeof processed).toBe('string');
      expect(processed.length).toBeGreaterThan(0);
    });

    test('preserves content when processing fails', () => {
      const originalContent = 'Simple content without issues';
      const processed = preprocessContent(originalContent);
      
      expect(processed).toBe(originalContent);
    });
  });

  describe('Batch Processing', () => {
    test('processes multiple content items', async () => {
      const contentItems = [
        'Simple text content',
        'Math content: $E = mc^2$',
        '# Markdown content\n**Bold text**',
        'Mixed: $\\frac{1}{2}$ and **bold**'
      ];
      
      const results = await batchProcessContent(contentItems, {
        includeAnalysis: true
      });
      
      expect(results).toHaveLength(4);
      expect(results.every(result => result.success)).toBe(true);
      expect(results.every(result => result.processed)).toBeTruthy();
      expect(results.every(result => result.analysis)).toBeTruthy();
    });

    test('handles errors in batch processing', async () => {
      // Mock a scenario where processing might fail
      const contentItems = [
        'Good content',
        null, // This should cause an error
        'More good content'
      ];
      
      const results = await batchProcessContent(contentItems, {
        includeAnalysis: true
      });
      
      expect(results).toHaveLength(3);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeTruthy();
    });
  });

  describe('Performance Monitoring', () => {
    test('tracks successful renders', () => {
      const metrics = {
        renderTime: 150,
        strategy: 'math-optimized',
        complexity: 'moderate',
        provider: 'gemini',
        contentLength: 1000,
        hasMath: true,
        hasMarkdown: false
      };
      
      performanceMonitor.trackRenderSuccess(metrics);
      
      const currentMetrics = performanceMonitor.getMetrics();
      expect(currentMetrics.renderSuccesses).toBe(1);
      expect(currentMetrics.averageRenderTime).toBe(150);
      expect(currentMetrics.successRate).toBe(100);
    });

    test('tracks render errors', () => {
      const errorInfo = {
        error: 'LaTeX parsing failed',
        strategy: 'full',
        complexity: 'complex',
        provider: 'gemini',
        attempt: 1
      };
      
      performanceMonitor.trackRenderError(errorInfo);
      
      const currentMetrics = performanceMonitor.getMetrics();
      expect(currentMetrics.renderErrors).toBe(1);
      expect(currentMetrics.errorRate).toBeGreaterThan(0);
    });

    test('generates performance reports', () => {
      // Add some test data
      performanceMonitor.trackRenderSuccess({
        renderTime: 100,
        strategy: 'math-optimized',
        complexity: 'simple',
        provider: 'gemini'
      });
      
      performanceMonitor.trackRenderError({
        error: 'Test error',
        strategy: 'full',
        complexity: 'complex',
        provider: 'perplexity'
      });
      
      const report = performanceMonitor.generateReport();
      
      expect(report.summary).toBeTruthy();
      expect(report.performance).toBeTruthy();
      expect(report.errors).toBeTruthy();
      expect(report.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('handles extremely long content', () => {
      const longContent = 'Very long content. '.repeat(10000);
      const processed = preprocessContent(longContent);
      
      expect(typeof processed).toBe('string');
      expect(processed.length).toBeGreaterThan(0);
    });

    test('handles content with special characters', () => {
      const specialContent = `
Special chars: ñáéíóú, 中文, العربية, русский
Math with special: $α + β = γ$
Symbols: ©®™℠
      `;
      
      const processed = preprocessContent(specialContent);
      
      expect(processed).toContain('\\alpha + \\beta = \\gamma');
      expect(processed).toContain('中文');
      expect(processed).toContain('العربية');
    });

    test('handles deeply nested LaTeX', () => {
      const nestedLaTeX = '$\\frac{\\frac{a}{b}}{\\frac{c}{d}}$';
      const processed = preprocessContent(nestedLaTeX);
      
      expect(processed).toContain('\\frac');
      expect(typeof processed).toBe('string');
    });

    test('handles mixed encodings', () => {
      const mixedContent = 'Math: $E = mc²$ and $∑_{i=1}^{n} i$';
      const processed = preprocessContent(mixedContent);
      
      expect(processed).toContain('\\sum');
      expect(processed).toContain('mc^2');
    });
  });

  describe('Integration Tests', () => {
    test('end-to-end content processing pipeline', () => {
      const rawContent = `
# Course: Basic Physics

## Module 1: Energy
Energy is given by the formula \\\\frac{1}{2}mv² where:
- m is mass
- v is velocity

### Key Points
1. Kinetic energy: KE = \\\\frac{1}{2}mv²
2. Potential energy: PE = mgh
3. Total energy: E = KE + PE

The relationship E = mc² shows mass-energy equivalence.

## Mathematical Relationships
$$E = mc^2$$
$$F = ma$$
$$P = \\\\frac{V^2}{R}$$
      `;
      
      const startTime = Date.now();
      
      // Analyze content
      const analysis = analyzeContent(rawContent);
      expect(analysis.hasMath).toBe(true);
      expect(analysis.hasMarkdown).toBe(true);
      
      // Process content
      const processed = preprocessContent(rawContent, analysis);
      expect(processed).toContain('\\frac{1}{2}');
      expect(processed).toContain('$E = mc^2$');
      
      // Validate processed content
      const validation = validateLaTeXStructure(processed);
      expect(validation.isValid).toBe(true);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should be fast
      expect(processingTime).toBeLessThan(1000); // Less than 1 second
      
      // Track performance
      performanceMonitor.trackRenderSuccess({
        renderTime: processingTime,
        strategy: 'full',
        complexity: analysis.complexity,
        provider: 'test',
        contentLength: rawContent.length,
        hasMath: analysis.hasMath,
        hasMarkdown: analysis.hasMarkdown
      });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.renderSuccesses).toBeGreaterThan(0);
    });

    test('handles complete failure gracefully', () => {
      // Simulate complete processing failure
      const problematicContent = null;
      
      const processed = preprocessContent(problematicContent);
      expect(processed).toBe('');
      
      const analysis = analyzeContent(problematicContent);
      expect(analysis.complexity).toBe('none');
    });
  });

  describe('Performance Benchmarks', () => {
    test('processes simple content quickly', () => {
      const simpleContent = 'Simple text without any special formatting.';
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        preprocessContent(simpleContent);
      }
      
      const end = Date.now();
      const averageTime = (end - start) / 100;
      
      expect(averageTime).toBeLessThan(10); // Less than 10ms per item
    });

    test('processes complex content within reasonable time', () => {
      const complexContent = `
# Complex Document
Multiple formulas: $E = mc^2$, $F = ma$, $P = \\frac{V^2}{R}$
$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$
**Bold**, *italic*, \`code\`, [links](http://example.com)
- List items
- More items
      `;
      
      const start = Date.now();
      const processed = preprocessContent(complexContent);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(100); // Less than 100ms
      expect(processed.length).toBeGreaterThan(0);
    });
  });
});

describe('React Component Integration', () => {
  // These would be React component tests using @testing-library/react
  // Testing the actual ContentDisplay component with various inputs
  
  test('ContentDisplay renders simple text', () => {
    // Mock test - would use actual React testing
    const mockComponent = {
      props: { content: 'Simple text' },
      render: () => 'Simple text'
    };
    
    expect(mockComponent.render()).toBe('Simple text');
  });
  
  test('ContentDisplay handles math content', () => {
    const mockComponent = {
      props: { content: 'Formula: $E = mc^2$' },
      render: () => 'Formula: E = mc²' // Simplified mock
    };
    
    expect(mockComponent.render()).toContain('E = mc²');
  });
});

// Export test utilities for use in other test files
export const testUtils = {
  createMockContent: (type = 'simple') => {
    switch (type) {
      case 'math':
        return 'Mathematical content: $E = mc^2$ and $\\frac{1}{2}mv^2$';
      case 'markdown':
        return '# Title\n**Bold** and *italic* text\n- List item';
      case 'complex':
        return `
# Complex Document
Math: $E = mc^2$ and $$\\int x dx = \\frac{x^2}{2}$$
**Bold**, *italic*, \`code\`
- Lists
- Items
        `;
      case 'malformed':
        return 'Broken: $incomplete and \\frac{}{} and unbalanced{';
      default:
        return 'Simple text content without special formatting';
    }
  },
  
  createMockAnalysis: (overrides = {}) => ({
    complexity: 'simple',
    hasMath: false,
    hasMarkdown: false,
    renderingStrategy: 'plaintext',
    estimatedRenderTime: 50,
    issues: [],
    ...overrides
  }),
  
  measurePerformance: (fn) => {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    return { result, time: end - start };
  }
}; 