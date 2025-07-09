import clientPromise from '../lib/mongodb.js';

// Common LaTeX patterns that might be malformed
const LATEX_PATTERNS = [
  // Missing backslashes before frac, sqrt, etc.
  {
    pattern: /(?<!\\)frac\{/g,
    fix: text => text.replace(/(?<!\\)frac\{/g, '\\frac{'),
    description: 'Missing backslash before frac'
  },
  {
    pattern: /(?<!\\)sqrt\{/g,
    fix: text => text.replace(/(?<!\\)sqrt\{/g, '\\sqrt{'),
    description: 'Missing backslash before sqrt'
  },
  {
    pattern: /(?<!\\)sum\b/g,
    fix: text => text.replace(/(?<!\\)sum\b/g, '\\sum'),
    description: 'Missing backslash before sum'
  },
  {
    pattern: /(?<!\\)int\b/g,
    fix: text => text.replace(/(?<!\\)int\b/g, '\\int'),
    description: 'Missing backslash before int'
  },
  {
    pattern: /(?<!\\)lim\b/g,
    fix: text => text.replace(/(?<!\\)lim\b/g, '\\lim'),
    description: 'Missing backslash before lim'
  },
  {
    pattern: /(?<!\\)alpha\b/g,
    fix: text => text.replace(/(?<!\\)alpha\b/g, '\\alpha'),
    description: 'Missing backslash before alpha'
  },
  {
    pattern: /(?<!\\)beta\b/g,
    fix: text => text.replace(/(?<!\\)beta\b/g, '\\beta'),
    description: 'Missing backslash before beta'
  },
  {
    pattern: /(?<!\\)theta\b/g,
    fix: text => text.replace(/(?<!\\)theta\b/g, '\\theta'),
    description: 'Missing backslash before theta'
  },
  {
    pattern: /(?<!\\)pi\b/g,
    fix: text => text.replace(/(?<!\\)pi\b/g, '\\pi'),
    description: 'Missing backslash before pi'
  },
  {
    pattern: /(?<!\\)infty\b/g,
    fix: text => text.replace(/(?<!\\)infty\b/g, '\\infty'),
    description: 'Missing backslash before infty'
  }
];

function findLatexIssues(text, identifier) {
  const issues = [];
  
  for (const pattern of LATEX_PATTERNS) {
    const matches = text.match(pattern.pattern);
    if (matches) {
      issues.push({
        identifier,
        issue: pattern.description,
        count: matches.length,
        examples: matches.slice(0, 3), // Show first 3 examples
        pattern: pattern.pattern.toString()
      });
    }
  }
  
  return issues;
}

function extractTextFromContent(content) {
  if (!content) return '';
  
  let text = '';
  
  // Handle different content structures
  if (typeof content === 'string') {
    text += content + ' ';
  } else if (Array.isArray(content)) {
    content.forEach(item => {
      text += extractTextFromContent(item) + ' ';
    });
  } else if (typeof content === 'object') {
    Object.values(content).forEach(value => {
      text += extractTextFromContent(value) + ' ';
    });
  }
  
  return text;
}

async function checkExamGeniusLatex() {
  const client = await clientPromise;
  const db = client.db("llmfied");
  const coursesCollection = db.collection("courses");
  const detailedContentCollection = db.collection("detailed-content");

  console.log("🔍 Checking Exam Genius courses for LaTeX issues...");

  try {
    // Get all Exam Genius courses
    const examGeniusCourses = await coursesCollection.find({
      $or: [
        { isExamGenius: true },
        { isCompetitiveExam: true }
      ]
    }).toArray();

    console.log(`📊 Found ${examGeniusCourses.length} Exam Genius courses to check`);

    let totalIssues = [];
    let coursesWithIssues = 0;

    for (const course of examGeniusCourses) {
      console.log(`\n📚 Checking course: ${course.title}`);
      console.log(`   📋 Exam Type: ${course.examType || 'N/A'}`);
      console.log(`   📝 Subject: ${course.subject || 'N/A'}`);
      console.log(`   🎯 Modules: ${course.modules?.length || 0}`);

      let courseIssues = [];

      // Check course-level content
      const courseText = extractTextFromContent(course);
      const courseLatexIssues = findLatexIssues(courseText, `Course: ${course.title}`);
      courseIssues.push(...courseLatexIssues);

      // Check modules
      if (course.modules && Array.isArray(course.modules)) {
        for (const module of course.modules) {
          const moduleText = extractTextFromContent(module);
          const moduleLatexIssues = findLatexIssues(moduleText, `Module: ${module.title || 'Untitled'}`);
          courseIssues.push(...moduleLatexIssues);
        }
      }

      // Check detailed content collection
      const detailedContent = await detailedContentCollection.findOne({
        courseId: course._id.toString()
      });

      if (detailedContent) {
        console.log(`   📖 Found detailed content`);
        const detailedText = extractTextFromContent(detailedContent);
        const detailedLatexIssues = findLatexIssues(detailedText, `Detailed Content: ${course.title}`);
        courseIssues.push(...detailedLatexIssues);
      }

      if (courseIssues.length > 0) {
        coursesWithIssues++;
        console.log(`   ❌ Found ${courseIssues.length} LaTeX issues in this course`);
        
        courseIssues.forEach(issue => {
          console.log(`      • ${issue.issue}: ${issue.count} instances`);
          console.log(`        Examples: ${issue.examples.join(', ')}`);
        });
      } else {
        console.log(`   ✅ No LaTeX issues found in this course`);
      }

      totalIssues.push(...courseIssues);
    }

    // Summary report
    console.log(`\n📊 EXAM GENIUS LaTeX CHECK SUMMARY:`);
    console.log(`   📚 Total courses checked: ${examGeniusCourses.length}`);
    console.log(`   ❌ Courses with issues: ${coursesWithIssues}`);
    console.log(`   🔧 Total issues found: ${totalIssues.length}`);

    if (totalIssues.length > 0) {
      console.log(`\n🔍 DETAILED ISSUE BREAKDOWN:`);
      
      // Group issues by type
      const issueGroups = {};
      totalIssues.forEach(issue => {
        if (!issueGroups[issue.issue]) {
          issueGroups[issue.issue] = {
            count: 0,
            instances: []
          };
        }
        issueGroups[issue.issue].count += issue.count;
        issueGroups[issue.issue].instances.push(...issue.examples);
      });

      Object.entries(issueGroups).forEach(([issueType, data]) => {
        console.log(`\n   📝 ${issueType}:`);
        console.log(`      Total instances: ${data.count}`);
        console.log(`      Examples: ${data.instances.slice(0, 5).join(', ')}${data.instances.length > 5 ? '...' : ''}`);
      });

      console.log(`\n💡 To fix these issues, run: npm run fix-latex`);
    } else {
      console.log(`\n✅ Great! No LaTeX issues found in Exam Genius courses.`);
    }

  } catch (error) {
    console.error("❌ Error checking LaTeX:", error);
    throw error;
  } finally {
    await client.close();
  }
}

checkExamGeniusLatex().catch(console.error); 