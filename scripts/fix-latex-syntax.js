const { connectToDatabase } = require('../lib/mongodb');

async function fixLatexSyntax() {
  console.log('🔧 Starting LaTeX syntax fix...');
  
  try {
    const { db } = await connectToDatabase();
    const coursesCollection = db.collection('courses');
    
    // Find all courses
    const courses = await coursesCollection.find({}).toArray();
    console.log(`📚 Found ${courses.length} courses to check`);
    
    let totalFixed = 0;
    
    for (const course of courses) {
      console.log(`\n🔍 Checking course: ${course.title}`);
      let courseUpdated = false;
      
      if (course.modules && Array.isArray(course.modules)) {
        for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
          const module = course.modules[moduleIndex];
          console.log(`  📖 Checking module: ${module.title}`);
          
          // Check and fix various content fields
          const fieldsToCheck = [
            'content', 'summary', 'objectives', 'examples'
          ];
          
          for (const field of fieldsToCheck) {
            if (module[field]) {
              let originalContent = module[field];
              let fixedContent;
              
              if (Array.isArray(originalContent)) {
                // Handle arrays (like objectives, examples)
                fixedContent = originalContent.map(item => {
                  if (typeof item === 'string') {
                    return fixMalformedLatex(item);
                  }
                  return item;
                });
              } else if (typeof originalContent === 'string') {
                // Handle strings
                fixedContent = fixMalformedLatex(originalContent);
              }
              
              if (JSON.stringify(originalContent) !== JSON.stringify(fixedContent)) {
                console.log(`    ✏️  Fixed LaTeX in ${field}`);
                module[field] = fixedContent;
                courseUpdated = true;
                totalFixed++;
              }
            }
          }
          
          // Check detailed subsections
          if (module.detailedSubsections && Array.isArray(module.detailedSubsections)) {
            for (const subsection of module.detailedSubsections) {
              // Fix subsection content
              const subsectionFields = ['summary', 'explanation', 'content'];
              for (const field of subsectionFields) {
                if (subsection[field] && typeof subsection[field] === 'string') {
                  const originalContent = subsection[field];
                  const fixedContent = fixMalformedLatex(originalContent);
                  
                  if (originalContent !== fixedContent) {
                    console.log(`    ✏️  Fixed LaTeX in subsection ${field}`);
                    subsection[field] = fixedContent;
                    courseUpdated = true;
                    totalFixed++;
                  }
                }
              }
              
              // Fix pages content
              if (subsection.pages && Array.isArray(subsection.pages)) {
                for (const page of subsection.pages) {
                  const pageFields = ['content', 'keyTakeaway'];
                  for (const field of pageFields) {
                    if (page[field] && typeof page[field] === 'string') {
                      const originalContent = page[field];
                      const fixedContent = fixMalformedLatex(originalContent);
                      
                      if (originalContent !== fixedContent) {
                        console.log(`    ✏️  Fixed LaTeX in page ${field}`);
                        page[field] = fixedContent;
                        courseUpdated = true;
                        totalFixed++;
                      }
                    }
                  }
                  
                  // Fix mathematical content
                  if (page.mathematicalContent && Array.isArray(page.mathematicalContent)) {
                    for (const math of page.mathematicalContent) {
                      const mathFields = ['content', 'explanation', 'example'];
                      for (const field of mathFields) {
                        if (math[field] && typeof math[field] === 'string') {
                          const originalContent = math[field];
                          const fixedContent = fixMalformedLatex(originalContent);
                          
                          if (originalContent !== fixedContent) {
                            console.log(`    ✏️  Fixed LaTeX in mathematical ${field}`);
                            math[field] = fixedContent;
                            courseUpdated = true;
                            totalFixed++;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // Update the course if changes were made
      if (courseUpdated) {
        await coursesCollection.updateOne(
          { _id: course._id },
          { $set: { modules: course.modules } }
        );
        console.log(`  ✅ Updated course: ${course.title}`);
      }
    }
    
    console.log(`\n🎉 LaTeX fix complete! Fixed ${totalFixed} instances of malformed LaTeX`);
    
  } catch (error) {
    console.error('❌ Error fixing LaTeX syntax:', error);
  }
}

function fixMalformedLatex(text) {
  if (!text || typeof text !== 'string') return text;
  
  let fixed = text;
  
  // Fix common LaTeX issues
  const fixes = [
    // Fix missing backslash in fractions: rac{a}{b} -> \frac{a}{b}
    {
      pattern: /(?<!\\)frac\{([^}]+)\}\{([^}]+)\}/g,
      replacement: '\\frac{$1}{$2}',
      description: 'fraction syntax'
    },
    
    // Fix rac{a}{b} -> \frac{a}{b}
    {
      pattern: /rac\{([^}]+)\}\{([^}]+)\}/g,
      replacement: '\\frac{$1}{$2}',
      description: 'malformed fraction syntax'
    },
    
    // Fix missing backslash in sqrt: qrt{a} -> \sqrt{a}
    {
      pattern: /(?<!\\)sqrt\{([^}]+)\}/g,
      replacement: '\\sqrt{$1}',
      description: 'square root syntax'
    },
    
    // Fix missing backslash in sum: sum_{a}^{b} -> \sum_{a}^{b}
    {
      pattern: /(?<!\\)sum_\{([^}]+)\}\^\{([^}]+)\}/g,
      replacement: '\\sum_{$1}^{$2}',
      description: 'summation syntax'
    },
    
    // Fix missing backslash in integral: int_{a}^{b} -> \int_{a}^{b}
    {
      pattern: /(?<!\\)int_\{([^}]+)\}\^\{([^}]+)\}/g,
      replacement: '\\int_{$1}^{$2}',
      description: 'integral syntax'
    },
    
    // Fix missing backslash in limit: lim_{x \to a} -> \lim_{x \to a}
    {
      pattern: /(?<!\\)lim_\{([^}]+)\}/g,
      replacement: '\\lim_{$1}',
      description: 'limit syntax'
    },
    
    // Fix Greek letters without backslash
    {
      pattern: /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|tau|phi|psi|omega)\b/g,
      replacement: '\\$1',
      description: 'Greek letters'
    },
    
    // Fix infinity symbol
    {
      pattern: /(?<!\\)infty\b/g,
      replacement: '\\infty',
      description: 'infinity symbol'
    }
  ];
  
  for (const fix of fixes) {
    const originalFixed = fixed;
    fixed = fixed.replace(fix.pattern, fix.replacement);
    
    if (originalFixed !== fixed) {
      console.log(`      🔧 Fixed ${fix.description}`);
    }
  }
  
  return fixed;
}

// Run the script
if (require.main === module) {
  fixLatexSyntax().then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixLatexSyntax, fixMalformedLatex }; 