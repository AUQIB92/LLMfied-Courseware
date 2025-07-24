/**
 * Enhanced Content Processor for bulletproof LaTeX and Markdown rendering
 * 
 * This module provides comprehensive content processing with:
 * 1. Multi-layer LaTeX sanitization and validation
 * 2. Intelligent error detection and correction
 * 3. Content complexity analysis
 * 4. Progressive enhancement strategies
 * 5. Performance monitoring and caching
 */

// Common LaTeX command fixes and corrections (SAFE PATTERNS ONLY)
const LATEX_COMMAND_FIXES = {
  // Double backslash fixes (common copy-paste errors)
  '\\\\frac': '\\frac',
  '\\\\sqrt': '\\sqrt',
  '\\\\sum': '\\sum',
  '\\\\prod': '\\prod', 
  '\\\\int': '\\int',
  '\\\\lim': '\\lim',
  '\\\\sin': '\\sin',
  '\\\\cos': '\\cos',
  '\\\\tan': '\\tan',
  '\\\\log': '\\log',
  '\\\\ln': '\\ln',
  '\\\\exp': '\\exp',
  '\\\\text': '\\text',
  '\\\\mathrm': '\\mathrm',
  '\\\\alpha': '\\alpha',
  '\\\\beta': '\\beta',
  '\\\\gamma': '\\gamma',
  '\\\\delta': '\\delta',
  '\\\\epsilon': '\\epsilon',
  '\\\\theta': '\\theta',
  '\\\\lambda': '\\lambda',
  '\\\\mu': '\\mu',
  '\\\\pi': '\\pi',
  '\\\\rho': '\\rho',
  '\\\\sigma': '\\sigma',
  '\\\\phi': '\\phi',
  '\\\\omega': '\\omega',
  '\\\\Omega': '\\Omega',
  '\\\\infty': '\\infty',
  '\\\\partial': '\\partial',
  '\\\\nabla': '\\nabla',
  
  // Triple backslash fixes
  '\\\\\\frac': '\\frac',
  '\\\\\\sqrt': '\\sqrt',
  '\\\\\\sum': '\\sum',
  '\\\\\\int': '\\int',
  
  // Common spacing issues
  '\\ frac': '\\frac',
  '\\ sqrt': '\\sqrt',
  '\\ sum': '\\sum',
  '\\ int': '\\int',
  
  // Common fraction fixes
  '\\frac {': '\\frac{',
  
  // Degree symbol fixes
  '°': '^\\circ',
  '°C': '^\\circ\\text{C}',
  '°F': '^\\circ\\text{F}',
  
  // Unit fixes
  'ohms': '\\Omega',
  'ohm': '\\Omega',
  '∞': '\\infty',
  '∑': '\\sum',
  '∏': '\\prod',
  '∫': '\\int',
  '∂': '\\partial',
  '∇': '\\nabla',
  'α': '\\alpha',
  'β': '\\beta',
  'γ': '\\gamma',
  'δ': '\\delta',
  'ε': '\\epsilon',
  'θ': '\\theta',
  'λ': '\\lambda',
  'μ': '\\mu',
  'π': '\\pi',
  'ρ': '\\rho',
  'σ': '\\sigma',
  'φ': '\\phi',
  'ω': '\\omega',
  'Ω': '\\Omega'
};

// Pre-compiled safe regex patterns
const SAFE_LATEX_PATTERNS = {
  // LaTeX delimiters (using literal strings, not regex patterns in the object)
  DISPLAY_DELIM_OPEN: /\\\[/g,
  DISPLAY_DELIM_CLOSE: /\\\]/g,
  INLINE_DELIM_OPEN: /\\\(/g,
  INLINE_DELIM_CLOSE: /\\\)/g,
  
  // Command patterns
  COMMANDS: /\\([a-zA-Z]+)(\{[^}]*\}|\[[^\]]*\])?/g,
  
  // Brace patterns
  UNMATCHED_BRACES: /\{[^}]*$|^[^{]*\}/g,
  
  // Mathematical content
  FRACTIONS: /\\frac\{([^}]*)\}\{([^}]*)\}/g,
  ROOTS: /\\sqrt(\[[^\]]*\])?\{([^}]*)\}/g,
  
  // Greek letters
  GREEK_LETTERS: /\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)/g,
  
  // Mathematical operators
  OPERATORS: /\\(sum|prod|int|lim|sin|cos|tan|log|ln|exp|sinh|cosh|tanh)/g,
  
  // Subscripts and superscripts
  SUBSCRIPTS: /([a-zA-Z])_(\w+)/g,
  SUPERSCRIPTS: /([a-zA-Z])\^(\w+)/g,
};

/**
 * Comprehensive LaTeX sanitization function with safe regex handling
 * @param {string} content - Raw content to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized content
 */
export function sanitizeLaTeX(content, options = {}) {
  if (!content || typeof content !== 'string') return '';
  
  const {
    preserveLineBreaks = true,
    fixCommonErrors = true,
    validateCommands = true,
    balanceDelimiters = true,
    logErrors = process.env.NODE_ENV === 'development'
  } = options;
  
  let sanitized = content;
  const errors = [];
  
  try {
    // Step 1: Fix common command errors with safe string replacement
    if (fixCommonErrors) {
      Object.entries(LATEX_COMMAND_FIXES).forEach(([wrong, correct]) => {
        try {
          // Use simple string replacement for simple patterns
          if (!wrong.includes('(') && !wrong.includes(')') && !wrong.includes('[') && !wrong.includes(']')) {
            sanitized = sanitized.replaceAll(wrong, correct);
          } else {
            // Skip problematic patterns for now
            if (logErrors) {
              console.warn(`Skipping complex pattern: ${wrong}`);
            }
          }
        } catch (error) {
          if (logErrors) {
            console.warn(`Error processing pattern "${wrong}":`, error.message);
          }
          errors.push(`Pattern error: ${wrong}`);
        }
      });
      
      // Handle delimiter fixes with pre-compiled safe patterns
      sanitized = sanitized.replace(SAFE_LATEX_PATTERNS.DISPLAY_DELIM_OPEN, '$$');
      sanitized = sanitized.replace(SAFE_LATEX_PATTERNS.DISPLAY_DELIM_CLOSE, '$$');
      sanitized = sanitized.replace(SAFE_LATEX_PATTERNS.INLINE_DELIM_OPEN, '$');
      sanitized = sanitized.replace(SAFE_LATEX_PATTERNS.INLINE_DELIM_CLOSE, '$');
    }
    
    // Step 2: Validate and fix LaTeX commands
    if (validateCommands) {
      sanitized = sanitized.replace(SAFE_LATEX_PATTERNS.COMMANDS, (match, command, args) => {
        // Validate common commands
        const validCommands = [
          'frac', 'sqrt', 'sum', 'prod', 'int', 'lim', 'sin', 'cos', 'tan',
          'log', 'ln', 'exp', 'alpha', 'beta', 'gamma', 'delta', 'epsilon',
          'theta', 'lambda', 'mu', 'pi', 'sigma', 'phi', 'omega', 'Omega',
          'infty', 'partial', 'nabla', 'text', 'mathrm', 'mathbf', 'mathit',
          'left', 'right', 'cdot', 'times', 'div', 'pm', 'mp', 'leq', 'geq',
          'neq', 'approx', 'propto', 'subset', 'supset', 'in', 'notin', 'circ',
          'to', 'dots', 'ldots', 'cdots', 'vdots', 'ddots', 'rightarrow', 'leftarrow',
          'Rightarrow', 'Leftarrow', 'iff', 'implies', 'mapsto', 'rightleftarrows',
          'uparrow', 'downarrow', 'Uparrow', 'Downarrow', 'updownarrow', 'Updownarrow',
          'cap', 'cup', 'subseteq', 'supseteq', 'varnothing', 'emptyset', 'exists', 'forall',
          'equiv', 'cong', 'sim', 'simeq', 'parallel', 'perp', 'angle', 'triangle',
          'square', 'diamond', 'star', 'ast', 'oplus', 'ominus', 'otimes', 'oslash',
          'wedge', 'vee', 'neg', 'lnot', 'models', 'vdash', 'dashv', 'top', 'bot'
        ];
        
        if (!validCommands.includes(command)) {
          if (logErrors) {
            errors.push(`Unknown LaTeX command: \\${command}`);
          }
          return `\\text{${command}}${args || ''}`;
        }
        
        return match;
      });
    }
    
    // Step 3: Balance delimiters
    if (balanceDelimiters) {
      sanitized = balanceLaTeXDelimiters(sanitized);
    }
    
    // Step 4: Clean up any remaining issues
    sanitized = sanitized
      .replace(/\$\$\s*\$\$/g, '') // Remove empty display math
      .replace(/\$\s*\$/g, '') // Remove empty inline math
      .replace(/\{\s*\}/g, '{}') // Clean empty braces
      .trim();
    
    if (logErrors && errors.length > 0) {
      console.log('LaTeX sanitization completed with warnings:', errors);
    }
    
    return sanitized;
    
  } catch (error) {
    if (logErrors) {
      console.error('LaTeX sanitization failed:', error);
    }
    // Return original content if sanitization fails
    return content;
  }
}

/**
 * Balance LaTeX delimiters to prevent rendering errors
 */
function balanceLaTeXDelimiters(content) {
  let balanced = content;
  
  // Count and balance dollar signs
  const dollarCount = (balanced.match(/\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    balanced += '$'; // Add missing closing dollar
  }
  
  // Count and balance double dollars
  const doubleDollarMatches = balanced.match(/\$\$/g) || [];
  if (doubleDollarMatches.length % 2 !== 0) {
    balanced += '$$'; // Add missing closing double dollar
  }
  
  // Balance braces
  const openBraces = (balanced.match(/\{/g) || []).length;
  const closeBraces = (balanced.match(/\}/g) || []).length;
  
  if (openBraces > closeBraces) {
    balanced += '}'.repeat(openBraces - closeBraces);
  } else if (closeBraces > openBraces) {
    balanced = '{'.repeat(closeBraces - openBraces) + balanced;
  }
  
  return balanced;
}

/**
 * Validate LaTeX structure for common issues
 * @param {string} content - Content to validate
 * @returns {Object} - Validation result with errors
 */
export function validateLaTeXStructure(content) {
  const errors = [];
  const warnings = [];
  
  try {
    // Check for common structural issues
    
    // 1. Nested math delimiters
    if (content.match(/\$[^$]*\$[^$]*\$/)) {
      errors.push('Potentially nested math delimiters detected');
    }
    
    // 2. Empty math expressions
    if (content.match(/\$\s*\$/)) {
      warnings.push('Empty inline math expressions found');
    }
    if (content.match(/\$\$\s*\$\$/)) {
      warnings.push('Empty display math expressions found');
    }
    
    // 3. Unescaped special characters
    const unescapedChars = content.match(/[&%#_{}]/g);
    if (unescapedChars) {
      warnings.push(`Unescaped special characters: ${unescapedChars.join(', ')}`);
    }
    
    // 4. Malformed commands
    const malformedCommands = content.match(/\\[a-zA-Z]+[^a-zA-Z\s{]/g);
    if (malformedCommands) {
      errors.push(`Malformed commands: ${malformedCommands.join(', ')}`);
    }
    
    // 5. Check for proper fraction structure
    const fractions = content.match(/\\frac\{[^}]*\}\{[^}]*\}/g) || [];
    fractions.forEach(frac => {
      if (frac.includes('\\frac{}') || frac.includes('{}{}')) {
        errors.push(`Invalid fraction structure: ${frac}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        mathExpressions: (content.match(/\$[^$]+\$/g) || []).length,
        displayMath: (content.match(/\$\$[^$]+\$\$/g) || []).length,
        commands: (content.match(/\\[a-zA-Z]+/g) || []).length,
        fractions: fractions.length
      }
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error.message}`],
      warnings: [],
      stats: {}
    };
  }
}

/**
 * Process markdown content for optimal rendering
 * @param {string} content - Raw markdown content
 * @param {Object} options - Processing options
 * @returns {string} - Processed markdown
 */
export function processMarkdown(content, options = {}) {
  if (!content || typeof content !== 'string') return '';
  
  const {
    preserveHTML = false,
    fixLists = true,
    fixLinks = true,
    fixTables = true,
    normalizeLineBreaks = true
  } = options;
  
  let processed = content;
  
  try {
    // Fix common markdown issues
    
    // 1. Normalize line breaks
    if (normalizeLineBreaks) {
      processed = processed
        .replace(/\r\n/g, '\n')  // Windows line breaks
        .replace(/\r/g, '\n');   // Mac line breaks
    }
    
    // 2. Fix list formatting
    if (fixLists) {
      processed = processed
        // Ensure proper spacing before lists
        .replace(/([^\n])\n([-*+]|\d+\.)\s/g, '$1\n\n$2 ')
        // Fix nested list indentation
        .replace(/^(\s*)([-*+]|\d+\.)\s/gm, (match, indent, marker) => {
          const level = Math.floor(indent.length / 2);
          return '  '.repeat(level) + marker + ' ';
        });
    }
    
    // 3. Fix link formatting
    if (fixLinks) {
      processed = processed
        // Fix malformed links
        .replace(/\[([^\]]*)\]\s*\(([^)]*)\)/g, '[$1]($2)')
        // Fix reference links
        .replace(/\[([^\]]*)\]\s*\[([^\]]*)\]/g, '[$1][$2]');
    }
    
    // 4. Fix table formatting
    if (fixTables) {
      processed = processed
        // Ensure proper table spacing
        .replace(/([^\n])\n\|/g, '$1\n\n|')
        .replace(/\|\n([^\n|])/g, '|\n\n$1');
    }
    
    // 5. Clean up HTML if not preserving it
    if (!preserveHTML) {
      processed = processed
        .replace(/<[^>]*>/g, '')  // Remove HTML tags
        .replace(/&[a-zA-Z0-9#]+;/g, ''); // Remove HTML entities
    }
    
    // 6. Final cleanup
    processed = processed
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
      .replace(/[ \t]+$/gm, '')    // Remove trailing whitespace
      .trim();
    
    return processed;
    
  } catch (error) {
    console.error('Markdown processing failed:', error);
    return content;
  }
}

/**
 * Comprehensive content analysis for rendering optimization
 * @param {string} content - Content to analyze
 * @returns {Object} - Analysis results
 */
export function analyzeContent(content) {
  if (!content || typeof content !== 'string') {
    return {
      complexity: 'none',
      hasMath: false,
      hasMarkdown: false,
      hasHTML: false,
      renderingStrategy: 'plaintext',
      estimatedRenderTime: 0,
      issues: []
    };
  }
  
  const analysis = {
    length: content.length,
    lines: content.split('\n').length,
    words: content.split(/\s+/).length,
    
    // Math content analysis
    mathContent: {
      inlineMath: (content.match(/\$[^$\n]+\$/g) || []).length,
      displayMath: (content.match(/\$\$[^$]+\$\$/g) || []).length,
      latexCommands: (content.match(/\\[a-zA-Z]+/g) || []).length,
      greekLetters: (content.match(/[αβγδεζηθλμπρστφχψω]/g) || []).length,
      mathSymbols: (content.match(/[∑∏∫∂∇∞]/g) || []).length
    },
    
    // Markdown content analysis
    markdownContent: {
      headers: (content.match(/^#{1,6}\s/gm) || []).length,
      lists: (content.match(/^\s*[-*+]\s/gm) || []).length,
      numberedLists: (content.match(/^\s*\d+\.\s/gm) || []).length,
      codeBlocks: (content.match(/```[\s\S]*?```/g) || []).length,
      inlineCode: (content.match(/`[^`]+`/g) || []).length,
      links: (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length,
      images: (content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length,
      tables: (content.match(/\|.*\|/g) || []).length,
      blockquotes: (content.match(/^\s*>/gm) || []).length,
      bold: (content.match(/\*\*[^*]+\*\*/g) || []).length,
      italic: (content.match(/\*[^*]+\*/g) || []).length
    },
    
    // HTML content analysis
    htmlContent: {
      tags: (content.match(/<[^>]+>/g) || []).length,
      entities: (content.match(/&[a-zA-Z0-9#]+;/g) || []).length
    }
  };
  
  // Calculate complexity
  const mathScore = analysis.mathContent.inlineMath * 2 + 
                   analysis.mathContent.displayMath * 3 + 
                   analysis.mathContent.latexCommands * 1;
  
  const markdownScore = analysis.markdownContent.headers * 1 +
                       analysis.markdownContent.lists * 1 +
                       analysis.markdownContent.codeBlocks * 2 +
                       analysis.markdownContent.tables * 3 +
                       analysis.markdownContent.links * 1;
  
  let complexity = 'simple';
  if (mathScore > 20 || markdownScore > 15) complexity = 'complex';
  else if (mathScore > 5 || markdownScore > 5) complexity = 'moderate';
  
  // Determine rendering strategy
  let renderingStrategy = 'full';
  if (mathScore === 0 && markdownScore === 0) renderingStrategy = 'plaintext';
  else if (complexity === 'complex') renderingStrategy = 'progressive';
  else if (mathScore > 0) renderingStrategy = 'math-optimized';
  
  // Estimate render time (in milliseconds)
  const estimatedRenderTime = Math.max(50, mathScore * 10 + markdownScore * 5 + analysis.length * 0.01);
  
  // Detect potential issues
  const issues = [];
  const validation = validateLaTeXStructure(content);
  if (!validation.isValid) {
    issues.push(...validation.errors);
  }
  
  return {
    complexity,
    hasMath: mathScore > 0,
    hasMarkdown: markdownScore > 0,
    hasHTML: analysis.htmlContent.tags > 0,
    renderingStrategy,
    estimatedRenderTime,
    issues,
    analysis,
    validation
  };
}

/**
 * Smart content preprocessing based on analysis
 * @param {string} content - Raw content
 * @param {Object} analysisResult - Result from analyzeContent
 * @returns {string} - Preprocessed content
 */
export function preprocessContent(content, analysisResult = null) {
  if (!content) return '';
  
  const analysis = analysisResult || analyzeContent(content);
  let processed = content;
  
  try {
    // Apply preprocessing based on complexity and content type
    if (analysis.hasMath) {
      processed = sanitizeLaTeX(processed, {
        preserveLineBreaks: true,
        fixCommonErrors: true,
        validateCommands: true,
        balanceDelimiters: true
      });
    }
    
    if (analysis.hasMarkdown) {
      processed = processMarkdown(processed, {
        preserveHTML: analysis.hasHTML,
        fixLists: true,
        fixLinks: true,
        fixTables: true,
        normalizeLineBreaks: true
      });
    }
    
    return processed;
    
  } catch (error) {
    console.error('Content preprocessing failed:', error);
    return content;
  }
}

/**
 * Batch process multiple content items
 * @param {Array} contentItems - Array of content strings
 * @param {Object} options - Processing options
 * @returns {Array} - Array of processed content with metadata
 */
export function batchProcessContent(contentItems, options = {}) {
  const { 
    parallel = true,
    includeAnalysis = true,
    onProgress = null 
  } = options;
  
  const processItem = (content, index) => {
    try {
      const analysis = includeAnalysis ? analyzeContent(content) : null;
      const processed = preprocessContent(content, analysis);
      
      if (onProgress) {
        onProgress(index + 1, contentItems.length);
      }
      
      return {
        original: content,
        processed,
        analysis,
        index,
        success: true
      };
    } catch (error) {
      return {
        original: content,
        processed: content,
        analysis: null,
        index,
        success: false,
        error: error.message
      };
    }
  };
  
  if (parallel && contentItems.length > 1) {
    return Promise.all(contentItems.map(processItem));
  } else {
    return contentItems.map(processItem);
  }
}

// Export for use in other modules
export { LATEX_COMMAND_FIXES, SAFE_LATEX_PATTERNS }; 