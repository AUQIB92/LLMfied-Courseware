/**
 * LaTeX Validation Script
 * 
 * This script validates LaTeX expressions in course content and identifies potential rendering issues.
 * It helps ensure 100% perfect math rendering by catching and fixing common LaTeX errors.
 * 
 * Usage:
 * node scripts/validate-latex.js [--fix] [--verbose] [path/to/content]
 * 
 * Options:
 *   --fix        Automatically fix common LaTeX errors
 *   --verbose    Show detailed information about each issue
 */

const fs = require('fs');
const path = require('path');
const { sanitizeLaTeX } = require('../lib/utils');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');
const targetPath = args.find(arg => !arg.startsWith('--')) || './data/courses';

// Common LaTeX errors to check for
const latexErrors = [
  {
    name: 'Missing backslash in frac',
    pattern: /(?<!\\)frac\{([^}]+)\}\{([^}]+)\}/g,
    fix: '\\frac{$1}{$2}',
    severity: 'high'
  },
  {
    name: 'Missing backslash in sqrt',
    pattern: /(?<!\\)sqrt\{([^}]+)\}/g,
    fix: '\\sqrt{$1}',
    severity: 'high'
  },
  {
    name: 'Unbalanced dollar signs',
    pattern: /(\$[^$\n]*\n[^$\n]*(?!\$))|([^$\n]*\$[^$\n]*(?!\$))/g,
    fix: null, // Requires manual inspection
    severity: 'critical'
  },
  {
    name: 'Unbalanced braces',
    pattern: /(\{[^{}]*$)|(\}[^{}]*\{)/g,
    fix: null, // Requires manual inspection
    severity: 'critical'
  },
  {
    name: 'Double backslashes in commands',
    pattern: /\\\\(frac|sqrt|sum|int|lim|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|phi|omega)/g,
    fix: '\\$1',
    severity: 'medium'
  },
  {
    name: 'Missing braces in subscripts',
    pattern: /([A-Za-z0-9])_([A-Za-z0-9]{2,})/g,
    fix: '$1_{$2}',
    severity: 'medium'
  },
  {
    name: 'Missing braces in superscripts',
    pattern: /([A-Za-z0-9])\^([A-Za-z0-9]{2,})/g,
    fix: '$1^{$2}',
    severity: 'medium'
  },
  {
    name: 'Unicode math symbols',
    pattern: /[μπθφσ∞ρα-ωΑ-Ω∑∏∫∮∇∂∆∈∉∋⊂⊃⊆⊇∪∩≠≤≥≈≡±∓×÷→←↔⇒⇐⇔]/g,
    fix: null, // Handled by sanitizeLaTeX
    severity: 'low'
  }
];

// Statistics
const stats = {
  filesProcessed: 0,
  filesWithErrors: 0,
  totalErrors: 0,
  errorsByType: {},
  filesFixed: 0
};

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let hasErrors = false;
    let fileErrors = [];
    
    // Check for LaTeX errors
    latexErrors.forEach(error => {
      const matches = [...content.matchAll(error.pattern)];
      if (matches.length > 0) {
        hasErrors = true;
        stats.totalErrors += matches.length;
        stats.errorsByType[error.name] = (stats.errorsByType[error.name] || 0) + matches.length;
        
        if (verbose) {
          matches.forEach(match => {
            const context = content.substring(
              Math.max(0, match.index - 20),
              Math.min(content.length, match.index + match[0].length + 20)
            );
            fileErrors.push({
              type: error.name,
              severity: error.severity,
              match: match[0],
              context: `...${context}...`,
              position: match.index
            });
          });
        }
      }
    });
    
    if (hasErrors) {
      stats.filesWithErrors++;
      console.log(`\n[${hasErrors ? '❌' : '✅'}] ${filePath}`);
      
      if (verbose && fileErrors.length > 0) {
        fileErrors.sort((a, b) => a.position - b.position);
        fileErrors.forEach(err => {
          const severityColor = 
            err.severity === 'critical' ? '\x1b[31m' : // red
            err.severity === 'high' ? '\x1b[33m' : // yellow
            err.severity === 'medium' ? '\x1b[36m' : // cyan
            '\x1b[37m'; // white
          
          console.log(`  ${severityColor}${err.severity.toUpperCase()}\x1b[0m: ${err.type}`);
          console.log(`  ${err.context.replace(err.match, `\x1b[41m${err.match}\x1b[0m`)}`);
          console.log();
        });
      }
      
      // Fix errors if requested
      if (shouldFix) {
        let fixedContent = sanitizeLaTeX(content);
        if (fixedContent !== content) {
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          console.log(`  ✅ Fixed LaTeX errors in ${filePath}`);
          stats.filesFixed++;
        } else {
          console.log(`  ⚠️ Could not automatically fix all errors in ${filePath}`);
        }
      }
    }
    
    stats.filesProcessed++;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Process a directory recursively
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (
      entry.name.endsWith('.json') || 
      entry.name.endsWith('.js') || 
      entry.name.endsWith('.jsx') ||
      entry.name.endsWith('.ts') ||
      entry.name.endsWith('.tsx')
    )) {
      processFile(fullPath);
    }
  }
}

// Main execution
console.log(`\n🔍 Validating LaTeX in ${targetPath}${shouldFix ? ' (with auto-fix)' : ''}\n`);

if (fs.existsSync(targetPath)) {
  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    processDirectory(targetPath);
  } else if (stats.isFile()) {
    processFile(targetPath);
  }
} else {
  console.error(`Error: Path ${targetPath} does not exist.`);
  process.exit(1);
}

// Print summary
console.log('\n📊 Summary:');
console.log(`Files processed: ${stats.filesProcessed}`);
console.log(`Files with errors: ${stats.filesWithErrors}`);
console.log(`Total errors found: ${stats.totalErrors}`);

if (stats.totalErrors > 0) {
  console.log('\nErrors by type:');
  Object.entries(stats.errorsByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
}

if (shouldFix) {
  console.log(`\nFiles fixed: ${stats.filesFixed}`);
}

console.log('\n✅ LaTeX validation complete!\n');