// Enhanced Math PDF Export using SmartMathRenderer
// Simplified approach for reliable math rendering

export const exportMathRenderedPDF = async (assignment, metadata = {}) => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('PDF export is only available in browser environment');
    }

    const {
      moduleTitle = 'Assignment',
      topics = '',
      difficulty = 'medium',
      dueDate = null,
      studentName = '',
      courseTitle = 'Course Assignment',
      institutionName = 'Govt. College of Engineering Safapora Ganderbal Kashmir, India 193504',
      instructorName = 'Dr. Auqib Hamid Lone',
      references = ''
    } = metadata;

    // Process assignment content for better math rendering
    const processedAssignment = processAssignmentForPDF(assignment);

    const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    
    if (!printWindow) {
      throw new Error('Please allow popups for PDF export to function properly.');
    }

    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    }) : '';

    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${moduleTitle} - Assignment | GCES Ganderbal</title>
          
          <!-- KaTeX CSS -->
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" crossorigin="anonymous">
          
          <!-- KaTeX JavaScript -->
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js" crossorigin="anonymous"></script>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
          
          <!-- Google Fonts -->
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              :root {
                  --primary-blue: #1e40af;
                  --secondary-blue: #3b82f6;
                  --accent-gold: #f59e0b;
                  --dark-gray: #1f2937;
                  --medium-gray: #6b7280;
                  --light-gray: #f3f4f6;
                  --border-color: #e5e7eb;
              }
              
              @media print {
                  @page { margin: 0.75in; size: A4; }
                  body { -webkit-print-color-adjust: exact !important; }
                  .no-print { display: none !important; }
                  .avoid-break { page-break-inside: avoid; }
              }
              
              body {
                  font-family: 'Inter', 'Times New Roman', serif;
                  line-height: 1.6;
                  color: var(--dark-gray);
                  background: white;
                  font-size: 11pt;
                  max-width: 210mm;
                  margin: 0 auto;
                  padding: 20px;
              }
              
              /* Header Styling */
              .header {
                  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-radius: 15px;
                  margin-bottom: 20px;
                  box-shadow: 0 8px 25px rgba(30, 64, 175, 0.15);
              }
              
              .institution-name {
                  font-size: 22pt;
                  font-weight: 800;
                  margin-bottom: 8px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              
              .institution-address {
                  font-size: 11pt;
                  opacity: 0.9;
                  margin-bottom: 15px;
              }
              
              .instructor-info {
                  background: rgba(255, 255, 255, 0.15);
                  padding: 12px 20px;
                  border-radius: 10px;
                  display: inline-block;
                  margin-top: 10px;
              }
              
              .instructor-label {
                  font-size: 9pt;
                  opacity: 0.8;
                  margin-bottom: 3px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
              }
              
              .instructor-name {
                  font-size: 13pt;
                  font-weight: 600;
                  color: var(--accent-gold);
              }
              
              /* Assignment Header */
              .assignment-header {
                  background: white;
                  padding: 25px;
                  border-radius: 15px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
                  border: 1px solid var(--border-color);
                  margin-bottom: 25px;
              }
              
              .assignment-title {
                  font-size: 18pt;
                  font-weight: 700;
                  color: var(--primary-blue);
                  text-align: center;
                  margin-bottom: 20px;
              }
              
              /* Metadata Grid */
              .metadata-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                  gap: 15px;
                  margin: 20px 0;
              }
              
              .metadata-card {
                  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                  padding: 15px;
                  border-radius: 10px;
                  border-left: 3px solid var(--secondary-blue);
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              }
              
              .metadata-label {
                  font-size: 9pt;
                  color: var(--medium-gray);
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 5px;
              }
              
              .metadata-value {
                  font-size: 11pt;
                  font-weight: 600;
                  color: var(--primary-blue);
              }
              
              .difficulty-badge {
                  display: inline-block;
                  padding: 6px 12px;
                  border-radius: 15px;
                  font-size: 9pt;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              
              .difficulty-easy { background: #d1fae5; color: #065f46; }
              .difficulty-medium { background: #fef3c7; color: #92400e; }
              .difficulty-hard { background: #fee2e2; color: #991b1b; }
              
              /* Student Info */
              .student-info {
                  background: white;
                  border-radius: 15px;
                  padding: 25px;
                  margin: 25px 0;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
                  border: 1px solid var(--border-color);
              }
              
              .student-info h3 {
                  color: var(--primary-blue);
                  margin-bottom: 20px;
                  font-size: 14pt;
                  display: flex;
                  align-items: center;
                  gap: 8px;
              }
              
              .student-info h3::before {
                  content: '👤';
                  font-size: 16pt;
              }
              
              .student-fields {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 20px;
              }
              
              .field {
                  display: flex;
                  flex-direction: column;
                  gap: 5px;
              }
              
              .field-label {
                  font-weight: 600;
                  color: var(--medium-gray);
                  font-size: 10pt;
              }
              
              .field-input {
                  width: 100%;
                  height: 35px;
                  border: none;
                  border-bottom: 2px solid var(--border-color);
                  background: transparent;
                  font-size: 11pt;
                  padding: 5px 0;
              }
              
              /* Content Container */
              .content-container {
                  background: white;
                  border-radius: 15px;
                  padding: 30px;
                  margin: 25px 0;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
                  border: 1px solid var(--border-color);
              }
              
              /* Enhanced Math Styling */
              .katex {
                  font-size: 1.1em !important;
              }
              
              .katex-display {
                  margin: 1.5em 0 !important;
                  padding: 15px !important;
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                  border: 2px solid #bae6fd !important;
                  border-radius: 10px !important;
                  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1) !important;
                  position: relative !important;
              }
              
              .katex-display::before {
                  content: '📐';
                  position: absolute;
                  top: 8px;
                  right: 12px;
                  font-size: 14pt;
                  opacity: 0.6;
              }
              
              .katex-display .katex {
                  font-size: 1.2em !important;
                  color: var(--primary-blue) !important;
              }
              
              /* Inline math */
              .katex:not(.katex-display) {
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                  padding: 2px 6px !important;
                  border-radius: 4px !important;
                  border: 1px solid #bae6fd !important;
                  color: var(--primary-blue) !important;
                  margin: 0 2px !important;
              }
              
              /* Content Typography */
              .assignment-content h1 {
                  font-size: 16pt;
                  font-weight: 700;
                  color: var(--primary-blue);
                  margin: 25px 0 15px 0;
                  padding-bottom: 8px;
                  border-bottom: 2px solid var(--accent-gold);
              }
              
              .assignment-content h2 {
                  font-size: 14pt;
                  font-weight: 600;
                  color: var(--dark-gray);
                  margin: 20px 0 12px 0;
                  padding: 12px 18px;
                  background: var(--light-gray);
                  border-left: 4px solid var(--secondary-blue);
                  border-radius: 8px;
              }
              
              .assignment-content h3 {
                  font-size: 12pt;
                  font-weight: 600;
                  color: var(--medium-gray);
                  margin: 15px 0 8px 0;
              }
              
              .assignment-content p {
                  margin-bottom: 12px;
                  text-align: justify;
                  line-height: 1.6;
              }
              
              .assignment-content strong {
                  background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-weight: 700;
              }
              
              .assignment-content em {
                  color: var(--secondary-blue);
                  font-weight: 500;
              }
              
              /* Problem/Solution Headers */
              .problem-header {
                  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                  color: white;
                  padding: 15px 20px;
                  border-radius: 10px;
                  margin: 20px 0 12px 0;
                  font-weight: 600;
                  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
              }
              
              .solution-header {
                  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
                  color: white;
                  padding: 12px 20px;
                  border-radius: 8px;
                  margin: 15px 0 10px 0;
                  font-weight: 600;
              }
              
              .answer-header {
                  background: linear-gradient(135deg, var(--accent-gold) 0%, #fbbf24 100%);
                  color: white;
                  padding: 12px 20px;
                  border-radius: 8px;
                  margin: 15px 0 8px 0;
                  font-weight: 700;
              }
              
              /* Print Controls */
              .print-controls {
                  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 15px;
                  text-align: center;
                  margin-bottom: 25px;
                  box-shadow: 0 8px 25px rgba(30, 64, 175, 0.15);
              }
              
              .print-title {
                  font-size: 16pt;
                  font-weight: 700;
                  margin-bottom: 10px;
              }
              
              .print-description {
                  font-size: 11pt;
                  margin-bottom: 15px;
                  opacity: 0.9;
              }
              
              .print-buttons {
                  display: flex;
                  gap: 12px;
                  justify-content: center;
                  flex-wrap: wrap;
              }
              
              .print-button {
                  background: linear-gradient(135deg, var(--accent-gold) 0%, #fbbf24 100%);
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 20px;
                  font-size: 11pt;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .print-button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
              }
              
              .close-button {
                  background: rgba(255, 255, 255, 0.2);
                  border: 1px solid rgba(255, 255, 255, 0.3);
              }
              
              /* Footer */
              .footer {
                  text-align: center;
                  padding: 15px;
                  color: var(--medium-gray);
                  font-size: 9pt;
                  border-top: 1px solid var(--border-color);
                  margin-top: 30px;
              }
              
              /* Responsive */
              @media screen and (max-width: 768px) {
                  body { padding: 10px; }
                  .metadata-grid { grid-template-columns: 1fr; }
                  .student-fields { grid-template-columns: 1fr; }
                  .print-buttons { flex-direction: column; }
              }
          </style>
      </head>
      <body>
          <!-- Print Controls -->
          <div class="print-controls no-print">
              <div class="print-title">📄 Mathematics Assignment PDF</div>
              <div class="print-description">
                  Mathematical expressions are rendered with KaTeX. Click "Generate PDF" to create your document.
              </div>
              <div class="print-buttons">
                  <button class="print-button" onclick="window.print()">
                      🖨️ Generate PDF
                  </button>
                  <button class="print-button close-button" onclick="window.close()">
                      ❌ Close
                  </button>
              </div>
          </div>
          
          <!-- Header -->
          <div class="header avoid-break">
              <div class="institution-name">Govt. College of Engineering Safapora</div>
              <div class="institution-address">Ganderbal Kashmir, India 193504</div>
              <div class="instructor-info">
                  <div class="instructor-label">Course Instructor</div>
                  <div class="instructor-name">${instructorName}</div>
              </div>
          </div>
          
          <!-- Assignment Header -->
          <div class="assignment-header avoid-break">
              <div class="assignment-title">${moduleTitle} - Mathematical Problem Set</div>
              
              <div class="metadata-grid">
                  <div class="metadata-card">
                      <div class="metadata-label">📚 Topics</div>
                      <div class="metadata-value">${topics || 'General Mathematics'}</div>
                  </div>
                  <div class="metadata-card">
                      <div class="metadata-label">⚡ Difficulty</div>
                      <div class="metadata-value">
                          <span class="difficulty-badge difficulty-${difficulty}">
                              ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </span>
                      </div>
                  </div>
                  ${formattedDueDate ? `
                      <div class="metadata-card">
                          <div class="metadata-label">📅 Due Date</div>
                          <div class="metadata-value">${formattedDueDate}</div>
                      </div>
                  ` : ''}
                  <div class="metadata-card">
                      <div class="metadata-label">📄 Generated</div>
                      <div class="metadata-value">${currentDate}</div>
                  </div>
              </div>
              
              ${references ? `
                  <div class="metadata-card" style="margin-top: 15px;">
                      <div class="metadata-label">📚 Academic References</div>
                      <div style="font-size: 9pt; line-height: 1.4; color: var(--medium-gray);">
                          ${references.split('\n').filter(line => line.trim()).slice(0, 3).map(ref => `• ${ref.trim()}`).join('<br>')}
                          ${references.split('\n').filter(line => line.trim()).length > 3 ? '<br>... and more (see assignment)' : ''}
                      </div>
                  </div>
              ` : ''}
          </div>
          
          <!-- Student Information -->
          <div class="student-info avoid-break">
              <h3>Student Information</h3>
              <div class="student-fields">
                  <div class="field">
                      <label class="field-label">Full Name</label>
                      <input type="text" class="field-input" value="${studentName}">
                  </div>
                  <div class="field">
                      <label class="field-label">Registration Number</label>
                      <input type="text" class="field-input">
                  </div>
                  <div class="field">
                      <label class="field-label">Semester/Year</label>
                      <input type="text" class="field-input">
                  </div>
                  <div class="field">
                      <label class="field-label">Submission Date</label>
                      <input type="text" class="field-input">
                  </div>
                  <div class="field">
                      <label class="field-label">Score</label>
                      <input type="text" class="field-input" placeholder="_____ / 100">
                  </div>
                  <div class="field">
                      <label class="field-label">Grade</label>
                      <input type="text" class="field-input" placeholder="A+ / A / B+ / B / C">
                  </div>
              </div>
          </div>
          
          <!-- Assignment Content -->
          <div class="content-container">
              <div class="assignment-content" id="math-content">
                  ${processedAssignment}
              </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
              <p><strong>Govt. College of Engineering Safapora Ganderbal Kashmir</strong></p>
              <p>📧 registrar@gces.edu.in | 📞 +91-194-XXX-XXXX | 🌐 www.gces.edu.in</p>
              <p style="margin-top: 8px; opacity: 0.7;">
                  Generated: ${currentDate} | Session ${new Date().getFullYear()}-${(new Date().getFullYear() + 1) % 100}
              </p>
          </div>
          
          <script>
              document.addEventListener('DOMContentLoaded', function() {
                  // Render math expressions
                  renderMathInDocument(() => {
                      console.log('Math rendering completed');
                  });
                  
                  // Auto-focus first input
                  const firstInput = document.querySelector('.field-input');
                  if (firstInput && !firstInput.value) {
                      firstInput.focus();
                  }
              });
              
              function renderMathInDocument(callback) {
                  if (typeof renderMathInElement !== 'undefined') {
                      renderMathInElement(document.getElementById('math-content'), {
                          delimiters: [
                              {left: '$$', right: '$$', display: true},
                              {left: '$', right: '$', display: false},
                              {left: '\\\\[', right: '\\\\]', display: true},
                              {left: '\\\\(', right: '\\\\)', display: false}
                          ],
                          throwOnError: false,
                          errorColor: '#cc0000',
                          strict: false,
                          trust: false,
                          macros: {
                              "\\\\f": "\\\\frac{#1}{#2}",
                              "\\\\half": "\\\\frac{1}{2}",
                              "\\\\degree": "^\\\\circ"
                          }
                      });
                      setTimeout(callback, 500);
                  } else {
                      setTimeout(() => renderMathInDocument(callback), 100);
                  }
              }
              
              window.addEventListener('beforeprint', function() {
                  document.title = '${moduleTitle.replace(/[^a-zA-Z0-9]/g, '_')}_GCES_Math_Assignment';
              });
          </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    return { 
      success: true, 
      message: 'PDF with rendered mathematics ready! Mathematical expressions will display properly in the generated PDF.' 
    };

  } catch (error) {
    console.error('Enhanced Math PDF Export Error:', error);
    throw new Error(`Failed to export PDF with math rendering: ${error.message}`);
  }
};

// Process assignment content for better PDF rendering
const processAssignmentForPDF = (assignment) => {
  if (!assignment) return '';
  
  let processed = assignment;
  
  // Convert LaTeX delimiters to KaTeX-friendly format
  processed = processed
    // Display math: \[ ... \] to $$ ... $$
    .replace(/\\\[(.*?)\\\]/gs, (match, content) => {
      return `$$${content}$$`;
    })
    // Inline math: \( ... \) to $ ... $
    .replace(/\\\((.*?)\\\)/g, (match, content) => {
      return `$${content}$`;
    })
    // Enhanced markdown processing
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    // Problem/Solution headers
    .replace(/^\*\*Problem \d+:\*\*(.*$)/gim, '<div class="problem-header">Problem:$1</div>')
    .replace(/^\*\*Solution:\*\*(.*$)/gim, '<div class="solution-header">Solution:</div>')
    .replace(/^\*\*Answer:\*\*(.*$)/gim, '<div class="answer-header">Final Answer:</div>')
    // Lists
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>');
  
  // Wrap in paragraph tags
  if (processed && !processed.startsWith('<')) {
    processed = `<p>${processed}</p>`;
  }
  
  return processed;
};

export default { exportMathRenderedPDF };