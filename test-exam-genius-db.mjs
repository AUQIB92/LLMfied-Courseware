import clientPromise from './lib/mongodb.js';

async function checkDatabase() {
  const client = await clientPromise;
  const db = client.db("llmfied");
  
  try {
    // Check courses collection
    const coursesCollection = db.collection("courses");
    const courses = await coursesCollection.find({}).toArray();
    
    console.log(`📚 Total courses in database: ${courses.length}`);
    
    courses.forEach((course, index) => {
      console.log(`\n📖 Course ${index + 1}:`);
      console.log(`   📝 Title: ${course.title || 'No title'}`);
      console.log(`   🏷️  ID: ${course._id}`);
      console.log(`   🎯 Exam Type: ${course.examType || 'N/A'}`);
      console.log(`   📚 Subject: ${course.subject || 'N/A'}`);
      console.log(`   🏆 Is Exam Genius: ${course.isExamGenius || false}`);
      console.log(`   🎖️  Is Competitive Exam: ${course.isCompetitiveExam || false}`);
      console.log(`   📊 Modules: ${course.modules?.length || 0}`);
      console.log(`   👨‍🏫 Educator ID: ${course.educatorId || 'N/A'}`);
      
      // Check for LaTeX content samples
      if (course.modules && course.modules.length > 0) {
        const firstModule = course.modules[0];
        let hasLatex = false;
        let sampleLatex = '';
        
        // Check summary for LaTeX
        if (firstModule.summary && typeof firstModule.summary === 'string') {
          if (firstModule.summary.includes('frac') || firstModule.summary.includes('$')) {
            hasLatex = true;
            sampleLatex = firstModule.summary.substring(0, 100) + '...';
          }
        }
        
        // Check detailed subsections
        if (firstModule.detailedSubsections && firstModule.detailedSubsections.length > 0) {
          const firstSubsection = firstModule.detailedSubsections[0];
          if (firstSubsection.explanation && typeof firstSubsection.explanation === 'string') {
            if (firstSubsection.explanation.includes('frac') || firstSubsection.explanation.includes('$')) {
              hasLatex = true;
              sampleLatex = firstSubsection.explanation.substring(0, 100) + '...';
            }
          }
        }
        
        console.log(`   🧮 Has LaTeX: ${hasLatex}`);
        if (hasLatex) {
          console.log(`   📐 Sample: ${sampleLatex}`);
        }
      }
    });
    
    // Check detailed-content collection
    const detailedContentCollection = db.collection("detailed-content");
    const detailedContents = await detailedContentCollection.find({}).toArray();
    
    console.log(`\n📖 Detailed content documents: ${detailedContents.length}`);
    
    detailedContents.forEach((content, index) => {
      console.log(`\n📚 Detailed Content ${index + 1}:`);
      console.log(`   🔗 Course ID: ${content.courseId}`);
      console.log(`   📊 Modules: ${content.modules?.length || 0}`);
      
      // Check for LaTeX in detailed content
      if (content.modules && content.modules.length > 0) {
        const firstModule = content.modules[0];
        let hasLatex = false;
        let sampleLatex = '';
        
        if (firstModule.detailedSubsections && firstModule.detailedSubsections.length > 0) {
          const firstSubsection = firstModule.detailedSubsections[0];
          if (firstSubsection.pages && firstSubsection.pages.length > 0) {
            const firstPage = firstSubsection.pages[0];
            if (firstPage.content && typeof firstPage.content === 'string') {
              if (firstPage.content.includes('frac') || firstPage.content.includes('$')) {
                hasLatex = true;
                sampleLatex = firstPage.content.substring(0, 100) + '...';
              }
            }
          }
        }
        
        console.log(`   🧮 Has LaTeX: ${hasLatex}`);
        if (hasLatex) {
          console.log(`   📐 Sample: ${sampleLatex}`);
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await client.close();
  }
}

checkDatabase().catch(console.error); 