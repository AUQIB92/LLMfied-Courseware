import { generateCompetitiveExamModuleSummary } from './lib/gemini.js';

async function testLatexGeneration() {
  console.log('🧪 Testing LaTeX generation with updated prompts...');
  
  try {
    const testContent = `
      Fractions and Basic Arithmetic
      
      This module covers fundamental concepts of fractions and their applications in competitive exams.
      Students will learn how to work with fractions, convert between different forms, and solve 
      fraction-based problems efficiently.
      
      Key topics include:
      - Understanding fractions as parts of a whole
      - Adding and subtracting fractions
      - Multiplying and dividing fractions
      - Converting between fractions, decimals, and percentages
      - Solving word problems involving fractions
    `;
    
    const context = {
      learnerLevel: 'intermediate',
      subject: 'Quantitative Aptitude',
      examType: 'SSC',
      moduleIndex: 1,
      totalModules: 8
    };
    
    console.log('📚 Generating module summary with mathematical content...');
    
    const result = await generateCompetitiveExamModuleSummary(testContent, context);
    
    console.log('✅ Generation completed! Checking for LaTeX formatting...');
    
    // Check if the result contains proper LaTeX formatting
    const resultStr = JSON.stringify(result, null, 2);
    
    // Look for proper LaTeX patterns
    const hasProperFractions = resultStr.includes('\\\\frac{');
    const hasMalformedFractions = resultStr.includes('rac{') && !resultStr.includes('\\\\frac{');
    const hasProperSqrt = resultStr.includes('\\\\sqrt{');
    const hasMalformedSqrt = resultStr.includes('qrt{') && !resultStr.includes('\\\\sqrt{');
    
    console.log('\n📊 LaTeX Formatting Analysis:');
    console.log(`   ✅ Proper fractions (\\\\frac): ${hasProperFractions ? 'Found' : 'Not found'}`);
    console.log(`   ❌ Malformed fractions (rac): ${hasMalformedFractions ? 'Found' : 'Not found'}`);
    console.log(`   ✅ Proper square roots (\\\\sqrt): ${hasProperSqrt ? 'Found' : 'Not found'}`);
    console.log(`   ❌ Malformed square roots (qrt): ${hasMalformedSqrt ? 'Found' : 'Not found'}`);
    
    // Show sample mathematical content
    if (result.detailedSubsections && result.detailedSubsections.length > 0) {
      const firstSubsection = result.detailedSubsections[0];
      if (firstSubsection.pages && firstSubsection.pages.length > 0) {
        const firstPage = firstSubsection.pages[0];
        if (firstPage.mathematicalContent && firstPage.mathematicalContent.length > 0) {
          console.log('\n🧮 Sample Mathematical Content:');
          firstPage.mathematicalContent.forEach((math, index) => {
            console.log(`   ${index + 1}. ${math.title || 'Formula'}:`);
            console.log(`      Content: ${math.content}`);
            console.log(`      Example: ${math.example}`);
          });
        }
      }
    }
    
    // Check summary for mathematical content
    if (result.summary && (result.summary.includes('frac') || result.summary.includes('$'))) {
      console.log('\n📝 Mathematical content in summary:');
      console.log(`   "${result.summary}"`);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLatexGeneration().catch(console.error); 