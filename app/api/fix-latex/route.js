import { connectToDatabase } from '@/lib/mongodb'
import { NextResponse } from 'next/server'

function fixMalformedLatex(text) {
  if (!text || typeof text !== 'string') return text;
  
  let fixed = text;
  let changesCount = 0;
  
  // Fix common LaTeX issues
  const fixes = [
    // Fix rac{a}{b} -> \frac{a}{b} (most common issue)
    {
      pattern: /rac\{([^}]+)\}\{([^}]+)\}/g,
      replacement: '\\frac{$1}{$2}',
      description: 'malformed fraction syntax (rac -> \\frac)'
    },
    
    // Fix missing backslash in fractions: frac{a}{b} -> \frac{a}{b}
    {
      pattern: /(?<!\\)frac\{([^}]+)\}\{([^}]+)\}/g,
      replacement: '\\frac{$1}{$2}',
      description: 'missing backslash in fraction'
    },
    
    // Fix qrt{a} -> \sqrt{a}
    {
      pattern: /qrt\{([^}]+)\}/g,
      replacement: '\\sqrt{$1}',
      description: 'malformed square root (qrt -> \\sqrt)'
    },
    
    // Fix missing backslash in sqrt: sqrt{a} -> \sqrt{a}
    {
      pattern: /(?<!\\)sqrt\{([^}]+)\}/g,
      replacement: '\\sqrt{$1}',
      description: 'missing backslash in square root'
    },
    
    // Fix sum_{a}^{b} -> \sum_{a}^{b}
    {
      pattern: /(?<!\\)sum_\{([^}]+)\}\^\{([^}]+)\}/g,
      replacement: '\\sum_{$1}^{$2}',
      description: 'missing backslash in summation'
    },
    
    // Fix int_{a}^{b} -> \int_{a}^{b}
    {
      pattern: /(?<!\\)int_\{([^}]+)\}\^\{([^}]+)\}/g,
      replacement: '\\int_{$1}^{$2}',
      description: 'missing backslash in integral'
    },
    
    // Fix lim_{x \to a} -> \lim_{x \to a}
    {
      pattern: /(?<!\\)lim_\{([^}]+)\}/g,
      replacement: '\\lim_{$1}',
      description: 'missing backslash in limit'
    },
    
    // Fix Greek letters without backslash
    {
      pattern: /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|tau|phi|psi|omega)\b/g,
      replacement: '\\$1',
      description: 'missing backslash in Greek letters'
    },
    
    // Fix infinity symbol
    {
      pattern: /(?<!\\)infty\b/g,
      replacement: '\\infty',
      description: 'missing backslash in infinity'
    }
  ];
  
  for (const fix of fixes) {
    const beforeCount = (fixed.match(fix.pattern) || []).length;
    fixed = fixed.replace(fix.pattern, fix.replacement);
    changesCount += beforeCount;
  }
  
  return { fixed, changesCount };
}

export async function POST(request) {
  try {
    console.log('🔧 Starting LaTeX syntax fix API...');
    
    const { db } = await connectToDatabase();
    const coursesCollection = db.collection('courses');
    const detailedContentCollection = db.collection('detailed-content');
    
    // Find all courses, with special focus on Exam Genius courses
    const courses = await coursesCollection.find({}).toArray();
    const examGeniusCourses = courses.filter(course => course.isExamGenius || course.isCompetitiveExam);
    
    console.log(`📚 Found ${courses.length} total courses to check`);
    console.log(`🎯 Found ${examGeniusCourses.length} Exam Genius courses to check`);
    
    let totalFixed = 0;
    let coursesUpdated = 0;
    const fixDetails = [];
    
    for (const course of courses) {
      console.log(`🔍 Checking course: ${course.title}`);
      let courseUpdated = false;
      let courseFixCount = 0;
      
      if (course.modules && Array.isArray(course.modules)) {
        for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
          const module = course.modules[moduleIndex];
          
          // Check and fix various content fields
          const fieldsToCheck = ['content', 'summary', 'objectives', 'examples'];
          
          for (const field of fieldsToCheck) {
            if (module[field]) {
              let originalContent = module[field];
              let fixedContent;
              
              if (Array.isArray(originalContent)) {
                // Handle arrays (like objectives, examples)
                fixedContent = originalContent.map(item => {
                  if (typeof item === 'string') {
                    const result = fixMalformedLatex(item);
                    courseFixCount += result.changesCount;
                    return result.fixed;
                  }
                  return item;
                });
              } else if (typeof originalContent === 'string') {
                // Handle strings
                const result = fixMalformedLatex(originalContent);
                fixedContent = result.fixed;
                courseFixCount += result.changesCount;
              }
              
              if (JSON.stringify(originalContent) !== JSON.stringify(fixedContent)) {
                module[field] = fixedContent;
                courseUpdated = true;
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
                  const result = fixMalformedLatex(subsection[field]);
                  if (result.changesCount > 0) {
                    subsection[field] = result.fixed;
                    courseUpdated = true;
                    courseFixCount += result.changesCount;
                  }
                }
              }
              
              // Fix pages content
              if (subsection.pages && Array.isArray(subsection.pages)) {
                for (const page of subsection.pages) {
                  const pageFields = ['content', 'keyTakeaway'];
                  for (const field of pageFields) {
                    if (page[field] && typeof page[field] === 'string') {
                      const result = fixMalformedLatex(page[field]);
                      if (result.changesCount > 0) {
                        page[field] = result.fixed;
                        courseUpdated = true;
                        courseFixCount += result.changesCount;
                      }
                    }
                  }
                  
                  // Fix mathematical content
                  if (page.mathematicalContent && Array.isArray(page.mathematicalContent)) {
                    for (const math of page.mathematicalContent) {
                      const mathFields = ['content', 'explanation', 'example'];
                      for (const field of mathFields) {
                        if (math[field] && typeof math[field] === 'string') {
                          const result = fixMalformedLatex(math[field]);
                          if (result.changesCount > 0) {
                            math[field] = result.fixed;
                            courseUpdated = true;
                            courseFixCount += result.changesCount;
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
      
      // For Exam Genius courses, also check detailed content collection
      if (course.isExamGenius || course.isCompetitiveExam) {
        console.log(`🎯 Checking detailed content for Exam Genius course: ${course.title}`);
        
        const detailedContent = await detailedContentCollection.findOne({
          courseId: course._id.toString()
        });
        
        if (detailedContent) {
          let detailedContentUpdated = false;
          let detailedFixCount = 0;
          
          // Fix detailed content modules
          if (detailedContent.modules && Array.isArray(detailedContent.modules)) {
            for (const module of detailedContent.modules) {
              // Check all module fields
              const moduleFields = ['summary', 'content', 'objectives', 'examples'];
              for (const field of moduleFields) {
                if (module[field]) {
                  let originalContent = module[field];
                  let fixedContent;
                  
                  if (Array.isArray(originalContent)) {
                    fixedContent = originalContent.map(item => {
                      if (typeof item === 'string') {
                        const result = fixMalformedLatex(item);
                        detailedFixCount += result.changesCount;
                        return result.fixed;
                      }
                      return item;
                    });
                  } else if (typeof originalContent === 'string') {
                    const result = fixMalformedLatex(originalContent);
                    fixedContent = result.fixed;
                    detailedFixCount += result.changesCount;
                  }
                  
                  if (JSON.stringify(originalContent) !== JSON.stringify(fixedContent)) {
                    module[field] = fixedContent;
                    detailedContentUpdated = true;
                  }
                }
              }
              
              // Check detailed subsections in detailed content
              if (module.detailedSubsections && Array.isArray(module.detailedSubsections)) {
                for (const subsection of module.detailedSubsections) {
                  const subsectionFields = ['summary', 'explanation', 'content'];
                  for (const field of subsectionFields) {
                    if (subsection[field] && typeof subsection[field] === 'string') {
                      const result = fixMalformedLatex(subsection[field]);
                      if (result.changesCount > 0) {
                        subsection[field] = result.fixed;
                        detailedContentUpdated = true;
                        detailedFixCount += result.changesCount;
                      }
                    }
                  }
                  
                  // Fix pages in detailed content
                  if (subsection.pages && Array.isArray(subsection.pages)) {
                    for (const page of subsection.pages) {
                      const pageFields = ['content', 'keyTakeaway'];
                      for (const field of pageFields) {
                        if (page[field] && typeof page[field] === 'string') {
                          const result = fixMalformedLatex(page[field]);
                          if (result.changesCount > 0) {
                            page[field] = result.fixed;
                            detailedContentUpdated = true;
                            detailedFixCount += result.changesCount;
                          }
                        }
                      }
                      
                      // Fix mathematical content in detailed content
                      if (page.mathematicalContent && Array.isArray(page.mathematicalContent)) {
                        for (const math of page.mathematicalContent) {
                          const mathFields = ['content', 'explanation', 'example'];
                          for (const field of mathFields) {
                            if (math[field] && typeof math[field] === 'string') {
                              const result = fixMalformedLatex(math[field]);
                              if (result.changesCount > 0) {
                                math[field] = result.fixed;
                                detailedContentUpdated = true;
                                detailedFixCount += result.changesCount;
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
          
          // Update detailed content if changes were made
          if (detailedContentUpdated) {
            await detailedContentCollection.updateOne(
              { courseId: course._id.toString() },
              { $set: { modules: detailedContent.modules } }
            );
            
            courseFixCount += detailedFixCount;
            console.log(`✅ Updated detailed content for: ${course.title} (${detailedFixCount} additional fixes)`);
          }
        }
      }

      // Update the course if changes were made
      if (courseUpdated) {
        await coursesCollection.updateOne(
          { _id: course._id },
          { $set: { modules: course.modules } }
        );
        coursesUpdated++;
        totalFixed += courseFixCount;
        
        fixDetails.push({
          courseTitle: course.title,
          fixCount: courseFixCount,
          isExamGenius: course.isExamGenius || course.isCompetitiveExam
        });
        
        console.log(`✅ Updated course: ${course.title} (${courseFixCount} total fixes)`);
      } else if (courseFixCount > 0) {
        // This handles cases where only detailed content was updated
        coursesUpdated++;
        totalFixed += courseFixCount;
        
        fixDetails.push({
          courseTitle: course.title,
          fixCount: courseFixCount,
          isExamGenius: course.isExamGenius || course.isCompetitiveExam
        });
        
        console.log(`✅ Updated detailed content for: ${course.title} (${courseFixCount} fixes)`);
      }
    }
    
    // Separate Exam Genius course stats
    const examGeniusFixed = fixDetails.filter(detail => detail.isExamGenius);
    const examGeniusFixCount = examGeniusFixed.reduce((sum, detail) => sum + detail.fixCount, 0);
    
    const result = {
      success: true,
      message: `LaTeX fix complete! Fixed ${totalFixed} instances of malformed LaTeX across ${coursesUpdated} courses`,
      totalFixed,
      coursesUpdated,
      coursesChecked: courses.length,
      examGeniusStats: {
        coursesChecked: examGeniusCourses.length,
        coursesFixed: examGeniusFixed.length,
        totalFixes: examGeniusFixCount
      },
      fixDetails
    };
    
    console.log('🎉 LaTeX fix API completed:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Error fixing LaTeX syntax:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  return NextResponse.json({ 
    message: "LaTeX fix endpoint. Use POST to run the fix process.",
    instructions: "This endpoint will find and fix malformed LaTeX syntax like 'rac{1}{R}' and convert it to '\\frac{1}{R}'"
  });
} 