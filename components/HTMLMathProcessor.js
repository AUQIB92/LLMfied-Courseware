/**
 * HTML Math Processor
 * 
 * Specialized processor for HTML content that contains mathematical
 * expressions wrapped in parentheses like (A \times B)
 */

import React, { useMemo } from 'react';
import { ProfessionalMathRenderer, ProfessionalMathProvider } from './ProfessionalMathRenderer';

// Smart HTML + Math processor
const processHTMLWithMath = (htmlContent) => {
  if (!htmlContent) return '';
  
  console.log('🔧 Processing HTML with parentheses-wrapped math:', htmlContent.substring(0, 200));
  
  let processed = htmlContent;
  
  // Step 1: Convert HTML to markdown-like format
  processed = processed
    // Remove HTML tags but preserve structure
    .replace(/<h([1-6])>/g, (match, level) => '\n' + '#'.repeat(parseInt(level)) + ' ')
    .replace(/<\/h[1-6]>/g, '\n\n')
    .replace(/<p>/g, '\n')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<em>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/<br\s*\/?>/g, '\n')
    
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Step 2: Convert parentheses-wrapped math to proper LaTeX
  processed = processed
    // Handle complex math expressions in parentheses
    .replace(/\(([^()]*\\[a-zA-Z]+[^()]*)\)/g, (match, mathContent) => {
      console.log('Found math in parentheses:', mathContent);
      // Check if it's actually math (contains LaTeX commands)
      if (/\\[a-zA-Z]+/.test(mathContent)) {
        return `$${mathContent}$`;
      }
      return match; // Keep original if not math
    })
    
    // Handle set notation like {1, 2, 3}
    .replace(/\(([^()]*\{[^}]+\}[^()]*)\)/g, (match, setContent) => {
      console.log('Found set notation:', setContent);
      return `$${setContent}$`;
    })
    
    // Handle variable names in parentheses that are clearly mathematical
    .replace(/\(([A-Z])\s*=\s*([^)]+)\)/g, (match, variable, expression) => {
      console.log('Found variable assignment:', variable, '=', expression);
      return `$${variable} = ${expression}$`;
    })
    
    // Handle single variables in parentheses that appear to be mathematical
    .replace(/\(([A-Z])\s*\\times\s*([A-Z])\)/g, '$$$1 \\times $2$$')
    .replace(/\(([A-Z])\s*\\cup\s*([A-Z])\)/g, '$$$1 \\cup $2$$')
    .replace(/\(([A-Z])\s*\\cap\s*([A-Z])\)/g, '$$$1 \\cap $2$$')
    
    // Handle single mathematical variables
    .replace(/\(([A-Z])\)/g, (match, variable) => {
      // Only convert if it appears in mathematical context
      const beforeMatch = processed.substring(0, processed.indexOf(match));
      const afterMatch = processed.substring(processed.indexOf(match) + match.length);
      
      const mathematicalContext = /(?:sets?|relation|function|variable|element|belongs?\s+to)\s*$/i.test(beforeMatch) ||
                                /^\s*(?:and|or|is|are|where)\s+/i.test(afterMatch);
      
      if (mathematicalContext) {
        console.log('Converting variable to math:', variable);
        return `$${variable}$`;
      }
      return match;
    })
    
    // Handle ordered pairs like (a, b)
    .replace(/\(([a-z]),\s*([a-z])\)/g, '$($$1, $2$$)$')
    
    // Fix any double dollar signs that might have been created
    .replace(/\$\$+/g, '$$')
    .replace(/\$\s*\$/g, '')
    
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  
  console.log('✅ Processed content preview:', processed.substring(0, 300));
  
  return processed;
};

// Component to render HTML content with math
const HTMLMathProcessor = ({ 
  htmlContent, 
  className = '',
  showControls = false,
  showDebug = false 
}) => {
  // Process the HTML content
  const processedContent = useMemo(() => {
    return processHTMLWithMath(htmlContent);
  }, [htmlContent]);
  
  if (showDebug) {
    return (
      <div className={`html-math-processor-debug ${className}`}>
        <div className="mb-6 space-y-4">
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-semibold mb-2">Original HTML:</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
              {htmlContent}
            </pre>
          </div>
          
          <div className="border border-blue-200 rounded p-4">
            <h3 className="font-semibold mb-2 text-blue-700">Processed Markdown:</h3>
            <pre className="text-xs bg-blue-50 p-2 rounded overflow-auto max-h-40">
              {processedContent}
            </pre>
          </div>
        </div>
        
        <div className="border border-green-200 rounded p-4">
          <h3 className="font-semibold mb-2 text-green-700">Rendered Output:</h3>
          <ProfessionalMathRenderer 
            content={processedContent}
            showControls={showControls}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`html-math-processor ${className}`}>
      <ProfessionalMathRenderer 
        content={processedContent}
        showControls={showControls}
      />
    </div>
  );
};

// Enhanced version that works with your EnhancedContentRenderer
const HTMLMathContentRenderer = ({ 
  htmlContent, 
  className = '',
  showControls = false,
  showDebug = false 
}) => {
  const processedContent = useMemo(() => {
    return processHTMLWithMath(htmlContent);
  }, [htmlContent]);
  
  // Import EnhancedContentRenderer dynamically to avoid circular dependencies
  const [EnhancedContentRenderer, setEnhancedContentRenderer] = React.useState(null);
  
  React.useEffect(() => {
    import('./EnhancedContentRenderer').then(module => {
      setEnhancedContentRenderer(() => module.default);
    });
  }, []);
  
  if (!EnhancedContentRenderer) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }
  
  if (showDebug) {
    return (
      <div className={`html-math-content-renderer-debug ${className}`}>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-semibold mb-2">Original HTML:</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
              {htmlContent}
            </pre>
          </div>
          
          <div className="border border-blue-200 rounded p-4">
            <h3 className="font-semibold mb-2 text-blue-700">Processed Content:</h3>
            <pre className="text-xs bg-blue-50 p-2 rounded overflow-auto max-h-32">
              {processedContent}
            </pre>
          </div>
        </div>
        
        <div className="border border-green-200 rounded p-4">
          <h3 className="font-semibold mb-2 text-green-700">Final Rendered Output:</h3>
          <EnhancedContentRenderer 
            content={processedContent}
            showMathControls={showControls}
            enableInteractive={true}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`html-math-content-renderer ${className}`}>
      <EnhancedContentRenderer 
        content={processedContent}
        showMathControls={showControls}
        enableInteractive={true}
      />
    </div>
  );
};

export { HTMLMathProcessor, HTMLMathContentRenderer, processHTMLWithMath };
export default HTMLMathContentRenderer;