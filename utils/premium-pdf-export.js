// Premium PDF Export with State-of-the-Art Design
// Govt. College of Engineering Safapora Ganderbal Kashmir

export const exportAssignmentToPDF = async (assignment, metadata = {}) => {
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
      references = ''
    } = metadata;

    // Create premium print window
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

    // Enhanced content processing with better LaTeX handling
    let processedContent = assignment;
    
    // Advanced LaTeX to HTML conversion
    processedContent = processedContent
      // Display math with enhanced styling
      .replace(/\\\[(.*?)\\\]/gs, (match, formula) => {
        return `<div class="math-display-container">
          <div class="math-display">${formula}</div>
        </div>`;
      })
      // Inline math with better formatting
      .replace(/\\\((.*?)\\\)/g, (match, formula) => {
        return `<span class="math-inline">${formula}</span>`;
      })
      // Enhanced markdown processing
      .replace(/\*\*(.*?)\*\*/g, '<strong class="highlight">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="emphasis">$1</em>')
      .replace(/^# (.*$)/gim, '<h1 class="section-title">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="subsection-title">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="subsubsection-title">$1</h3>')
      .replace(/^\*\*Problem \d+:\*\*(.*$)/gim, '<div class="problem-header"><span class="problem-number">Problem</span>$1</div>')
      .replace(/^\*\*Solution:\*\*(.*$)/gim, '<div class="solution-header">Solution:</div>')
      .replace(/^\*\*Answer:\*\*(.*$)/gim, '<div class="answer-header">Final Answer:</div>')
      .replace(/^- (.*$)/gim, '<li class="bullet-item">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="numbered-item">$1</li>')
      .replace(/\n\n/g, '</p><p class="paragraph">');

    const premiumHtmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${moduleTitle} - Assignment | GCES Ganderbal</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
          <style>
              /* Modern CSS Reset */
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              /* CSS Variables for consistent theming */
              :root {
                  --primary-blue: #1e40af;
                  --secondary-blue: #3b82f6;
                  --accent-gold: #f59e0b;
                  --dark-gray: #1f2937;
                  --medium-gray: #6b7280;
                  --light-gray: #f3f4f6;
                  --success-green: #10b981;
                  --border-color: #e5e7eb;
                  --shadow-light: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                  --shadow-medium: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  --shadow-heavy: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              }
              
              /* Print-specific optimizations */
              @media print {
                  @page {
                      margin: 0.75in;
                      size: A4;
                  }
                  
                  body {
                      -webkit-print-color-adjust: exact !important;
                      color-adjust: exact !important;
                      print-color-adjust: exact !important;
                  }
                  
                  .no-print { display: none !important; }
                  .page-break { page-break-before: always; }
                  .avoid-break { page-break-inside: avoid; }
              }
              
              /* Base typography */
              body {
                  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: var(--dark-gray);
                  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                  font-size: 11pt;
                  max-width: 210mm;
                  margin: 0 auto;
                  padding: 20px;
                  position: relative;
              }
              
              /* Modern header with institutional branding */
              .header {
                  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                  color: white;
                  padding: 40px 30px;
                  text-align: center;
                  border-radius: 20px 20px 0 0;
                  box-shadow: var(--shadow-heavy);
                  position: relative;
                  overflow: hidden;
                  margin-bottom: 0;
              }
              
              .header::before {
                  content: '';
                  position: absolute;
                  top: -50%;
                  left: -50%;
                  width: 200%;
                  height: 200%;
                  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                  animation: float 20s ease-in-out infinite;
                  pointer-events: none;
              }
              
              @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-10px) rotate(1deg); }
              }
              
              .institution-name {
                  font-size: 24pt;
                  font-weight: 800;
                  margin-bottom: 8px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  letter-spacing: -0.5px;
                  position: relative;
                  z-index: 2;
              }
              
              .institution-address {
                  font-size: 12pt;
                  font-weight: 400;
                  opacity: 0.9;
                  margin-bottom: 20px;
                  position: relative;
                  z-index: 2;
              }
              
              .instructor-info {
                  background: rgba(255, 255, 255, 0.15);
                  backdrop-filter: blur(10px);
                  padding: 15px 25px;
                  border-radius: 15px;
                  display: inline-block;
                  margin-top: 10px;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  position: relative;
                  z-index: 2;
              }
              
              .instructor-label {
                  font-size: 10pt;
                  opacity: 0.8;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  font-weight: 500;
              }
              
              .instructor-name {
                  font-size: 14pt;
                  font-weight: 600;
                  color: var(--accent-gold);
                  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
              }
              
              /* Assignment title section */
              .assignment-header {
                  background: white;
                  padding: 30px;
                  border-radius: 0 0 20px 20px;
                  box-shadow: var(--shadow-medium);
                  border-top: 4px solid var(--accent-gold);
                  margin-bottom: 30px;
              }
              
              .assignment-title {
                  font-size: 20pt;
                  font-weight: 700;
                  color: var(--primary-blue);
                  text-align: center;
                  margin-bottom: 20px;
                  position: relative;
              }
              
              .assignment-title::after {
                  content: '';
                  position: absolute;
                  bottom: -10px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 100px;
                  height: 3px;
                  background: linear-gradient(90deg, var(--primary-blue), var(--accent-gold));
                  border-radius: 2px;
              }
              
              /* Modern metadata grid */
              .metadata-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 20px;
                  margin: 25px 0;
              }
              
              .metadata-card {
                  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                  padding: 20px;
                  border-radius: 15px;
                  border-left: 4px solid var(--secondary-blue);
                  box-shadow: var(--shadow-light);
                  transition: transform 0.2s ease;
              }
              
              .metadata-card:hover {
                  transform: translateY(-2px);
                  box-shadow: var(--shadow-medium);
              }
              
              .metadata-label {
                  font-size: 10pt;
                  color: var(--medium-gray);
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 8px;
              }
              
              .metadata-value {
                  font-size: 13pt;
                  font-weight: 600;
                  color: var(--primary-blue);
              }
              
              .difficulty-badge {
                  display: inline-block;
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-size: 10pt;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .difficulty-easy { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
              .difficulty-medium { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
              .difficulty-hard { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
              
              /* Premium student info section */
              .student-info-container {
                  background: white;
                  border-radius: 20px;
                  padding: 30px;
                  margin: 30px 0;
                  box-shadow: var(--shadow-medium);
                  border: 1px solid var(--border-color);
              }
              
              .student-info-title {
                  font-size: 16pt;
                  font-weight: 700;
                  color: var(--primary-blue);
                  margin-bottom: 25px;
                  display: flex;
                  align-items: center;
                  gap: 10px;
              }
              
              .student-info-title::before {
                  content: '👤';
                  font-size: 18pt;
              }
              
              .student-fields-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 25px;
              }
              
              .field-group {
                  position: relative;
              }
              
              .field-label {
                  font-weight: 600;
                  color: var(--medium-gray);
                  font-size: 11pt;
                  margin-bottom: 8px;
                  display: block;
              }
              
              .field-input {
                  width: 100%;
                  height: 40px;
                  border: none;
                  border-bottom: 2px solid var(--border-color);
                  background: transparent;
                  font-size: 12pt;
                  padding: 5px 0;
                  transition: border-color 0.3s ease;
                  color: var(--dark-gray);
              }
              
              .field-input:focus {
                  outline: none;
                  border-bottom-color: var(--secondary-blue);
              }
              
              /* Enhanced content styling */
              .content-container {
                  background: white;
                  border-radius: 20px;
                  padding: 40px;
                  margin: 30px 0;
                  box-shadow: var(--shadow-medium);
                  border: 1px solid var(--border-color);
              }
              
              .section-title {
                  font-size: 18pt;
                  font-weight: 700;
                  color: var(--primary-blue);
                  margin: 30px 0 20px 0;
                  padding-bottom: 10px;
                  border-bottom: 2px solid var(--accent-gold);
                  position: relative;
              }
              
              .subsection-title {
                  font-size: 15pt;
                  font-weight: 600;
                  color: var(--dark-gray);
                  margin: 25px 0 15px 0;
                  padding-left: 20px;
                  border-left: 4px solid var(--secondary-blue);
                  background: var(--light-gray);
                  padding: 15px 20px;
                  border-radius: 10px;
              }
              
              .subsubsection-title {
                  font-size: 13pt;
                  font-weight: 600;
                  color: var(--medium-gray);
                  margin: 20px 0 10px 0;
              }
              
              /* Problem and solution styling */
              .problem-header {
                  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                  color: white;
                  padding: 20px 25px;
                  border-radius: 15px;
                  margin: 25px 0 15px 0;
                  font-weight: 600;
                  font-size: 13pt;
                  box-shadow: var(--shadow-medium);
              }
              
              .problem-number {
                  background: var(--accent-gold);
                  padding: 5px 12px;
                  border-radius: 20px;
                  font-size: 11pt;
                  font-weight: 700;
                  margin-right: 15px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .solution-header {
                  background: linear-gradient(135deg, var(--success-green) 0%, #34d399 100%);
                  color: white;
                  padding: 15px 25px;
                  border-radius: 10px;
                  margin: 20px 0 15px 0;
                  font-weight: 600;
                  font-size: 12pt;
                  box-shadow: var(--shadow-light);
              }
              
              .answer-header {
                  background: linear-gradient(135deg, var(--accent-gold) 0%, #fbbf24 100%);
                  color: white;
                  padding: 15px 25px;
                  border-radius: 10px;
                  margin: 20px 0 10px 0;
                  font-weight: 700;
                  font-size: 12pt;
                  box-shadow: var(--shadow-light);
              }
              
              /* Advanced mathematical expressions */
              .math-display-container {
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                  border: 2px solid #bae6fd;
                  border-radius: 15px;
                  padding: 25px;
                  margin: 20px 0;
                  text-align: center;
                  box-shadow: var(--shadow-light);
                  position: relative;
              }
              
              .math-display-container::before {
                  content: '📐';
                  position: absolute;
                  top: 10px;
                  right: 15px;
                  font-size: 16pt;
                  opacity: 0.7;
              }
              
              .math-display {
                  font-family: 'JetBrains Mono', 'Fira Code', monospace;
                  font-size: 14pt;
                  font-weight: 500;
                  color: var(--primary-blue);
                  line-height: 1.8;
                  letter-spacing: 0.3px;
              }
              
              .math-inline {
                  font-family: 'JetBrains Mono', 'Fira Code', monospace;
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 11pt;
                  font-weight: 500;
                  color: var(--primary-blue);
                  border: 1px solid #bae6fd;
              }
              
              /* Enhanced typography */
              .paragraph {
                  margin-bottom: 15px;
                  text-align: justify;
                  line-height: 1.7;
                  font-size: 11pt;
              }
              
              .highlight {
                  background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-weight: 700;
                  color: var(--dark-gray);
              }
              
              .emphasis {
                  color: var(--secondary-blue);
                  font-weight: 500;
              }
              
              /* Lists with modern styling */
              .bullet-item, .numbered-item {
                  margin-bottom: 10px;
                  padding-left: 20px;
                  position: relative;
                  line-height: 1.6;
              }
              
              .bullet-item::before {
                  content: '▶';
                  position: absolute;
                  left: 0;
                  color: var(--secondary-blue);
                  font-weight: bold;
              }
              
              /* Print controls */
              .print-controls {
                  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                  color: white;
                  padding: 25px;
                  border-radius: 20px;
                  text-align: center;
                  margin-bottom: 30px;
                  box-shadow: var(--shadow-heavy);
              }
              
              .print-title {
                  font-size: 18pt;
                  font-weight: 700;
                  margin-bottom: 15px;
              }
              
              .print-description {
                  font-size: 12pt;
                  margin-bottom: 20px;
                  opacity: 0.9;
                  line-height: 1.5;
              }
              
              .print-buttons {
                  display: flex;
                  gap: 15px;
                  justify-content: center;
                  flex-wrap: wrap;
              }
              
              .print-button {
                  background: linear-gradient(135deg, var(--accent-gold) 0%, #fbbf24 100%);
                  color: white;
                  border: none;
                  padding: 15px 30px;
                  border-radius: 25px;
                  font-size: 13pt;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  box-shadow: var(--shadow-medium);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .print-button:hover {
                  transform: translateY(-2px);
                  box-shadow: var(--shadow-heavy);
                  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              }
              
              .close-button {
                  background: rgba(255, 255, 255, 0.2);
                  border: 2px solid rgba(255, 255, 255, 0.3);
              }
              
              .close-button:hover {
                  background: rgba(255, 255, 255, 0.3);
                  transform: translateY(-2px);
              }
              
              /* Footer with institutional info */
              .footer {
                  text-align: center;
                  padding: 20px;
                  color: var(--medium-gray);
                  font-size: 10pt;
                  border-top: 1px solid var(--border-color);
                  margin-top: 40px;
              }
              
              /* Responsive design */
              @media screen and (max-width: 768px) {
                  body { padding: 10px; }
                  .header { padding: 20px 15px; }
                  .institution-name { font-size: 18pt; }
                  .metadata-grid { grid-template-columns: 1fr; }
                  .student-fields-grid { grid-template-columns: 1fr; }
                  .print-buttons { flex-direction: column; }
              }
          </style>
      </head>
      <body>
          <!-- Modern Print Controls -->
          <div class="print-controls no-print">
              <div class="print-title">📄 Premium Assignment PDF Export</div>
              <div class="print-description">
                  Generate a professional PDF by clicking the print button below, then select "Save as PDF" or "Microsoft Print to PDF" in your browser's print dialog.
              </div>
              <div class="print-buttons">
                  <button class="print-button" onclick="window.print()">
                      🖨️ Generate PDF
                  </button>
                  <button class="print-button close-button" onclick="window.close()">
                      ❌ Close Window
                  </button>
              </div>
          </div>
          
          <!-- Premium Header with Institutional Branding -->
          <div class="header avoid-break">
              <div class="institution-name">
                  Govt. College of Engineering Safapora
              </div>
              <div class="institution-address">
                  Ganderbal Kashmir, India 193504
              </div>
              <div class="instructor-info">
                  <div class="instructor-label">Course Instructor</div>
                  <div class="instructor-name">Dr. Auqib Hamid Lone</div>
              </div>
          </div>
          
          <!-- Assignment Header -->
          <div class="assignment-header avoid-break">
              <div class="assignment-title">${moduleTitle}</div>
              <div class="assignment-title" style="font-size: 14pt; margin-top: 10px; color: var(--medium-gray);">
                  Mathematical Problem Set
              </div>
              
              <!-- Enhanced Metadata Grid -->
              <div class="metadata-grid">
                  <div class="metadata-card">
                      <div class="metadata-label">📚 Course Topics</div>
                      <div class="metadata-value">${topics || 'General Mathematics'}</div>
                  </div>
                  <div class="metadata-card">
                      <div class="metadata-label">⚡ Difficulty Level</div>
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
                  ${references ? `
                      <div class="metadata-card" style="grid-column: 1 / -1;">
                          <div class="metadata-label">📚 Academic References</div>
                          <div class="metadata-value" style="font-size: 10pt; line-height: 1.4; white-space: pre-line;">
                              ${references.split('\n').filter(line => line.trim()).slice(0, 3).join('\n')}
                              ${references.split('\n').filter(line => line.trim()).length > 3 ? '\n... (see complete reference list in assignment)' : ''}
                          </div>
                      </div>
                  ` : ''}
              </div>
          </div>
          
          <!-- Premium Student Information Section -->
          <div class="student-info-container avoid-break">
              <div class="student-info-title">Student Information</div>
              <div class="student-fields-grid">
                  <div class="field-group">
                      <label class="field-label">Full Name</label>
                      <input type="text" class="field-input" value="${studentName}" placeholder="Enter student name">
                  </div>
                  <div class="field-group">
                      <label class="field-label">Registration Number</label>
                      <input type="text" class="field-input" placeholder="Enter registration number">
                  </div>
                  <div class="field-group">
                      <label class="field-label">Semester/Year</label>
                      <input type="text" class="field-input" placeholder="e.g., 3rd Semester">
                  </div>
                  <div class="field-group">
                      <label class="field-label">Submission Date</label>
                      <input type="text" class="field-input" placeholder="DD/MM/YYYY">
                  </div>
                  <div class="field-group">
                      <label class="field-label">Total Score</label>
                      <input type="text" class="field-input" placeholder="_____ / 100 marks">
                  </div>
                  <div class="field-group">
                      <label class="field-label">Grade</label>
                      <input type="text" class="field-input" placeholder="A+ / A / B+ / B / C">
                  </div>
              </div>
          </div>
          
          <!-- Enhanced Assignment Content -->
          <div class="content-container">
              <div class="paragraph">${processedContent}</div>
          </div>
          
          <!-- Premium Footer -->
          <div class="footer">
              <p><strong>Govt. College of Engineering Safapora Ganderbal Kashmir</strong></p>
              <p>📧 Contact: registrar@gces.edu.in | 📞 Phone: +91-194-XXX-XXXX | 🌐 Website: www.gces.edu.in</p>
              <p style="margin-top: 10px; font-size: 9pt; opacity: 0.7;">
                  Generated on ${currentDate} | Academic Session ${new Date().getFullYear()}-${(new Date().getFullYear() + 1) % 100}
              </p>
          </div>
          
          <script>
              // Enhanced print functionality
              document.addEventListener('DOMContentLoaded', function() {
                  // Auto-focus first input field
                  const firstInput = document.querySelector('.field-input');
                  if (firstInput && !firstInput.value) {
                      firstInput.focus();
                  }
                  
                  // Auto-print option
                  const urlParams = new URLSearchParams(window.location.search);
                  if (urlParams.get('autoprint') === 'true') {
                      setTimeout(() => window.print(), 1500);
                  }
              });
              
              // Enhanced print handling
              window.addEventListener('beforeprint', function() {
                  document.title = '${moduleTitle.replace(/[^a-zA-Z0-9]/g, '_')}_GCES_Assignment';
              });
          </script>
      </body>
      </html>
    `;

    // Write content to new window
    printWindow.document.write(premiumHtmlContent);
    printWindow.document.close();
    printWindow.focus();

    return { 
      success: true, 
      message: 'Premium PDF export window opened! Click "Generate PDF" to create your professional assignment document.' 
    };

  } catch (error) {
    console.error('Premium PDF Export Error:', error);
    throw new Error(`Failed to export premium PDF: ${error.message}`);
  }
};

// Alternative: Enhanced HTML download
export const downloadPremiumAssignmentHTML = (assignment, metadata = {}) => {
  const { moduleTitle = 'Assignment' } = metadata;
  
  const htmlContent = createPremiumAssignmentHTML(assignment, metadata);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${moduleTitle.replace(/[^a-z0-9]/gi, '_')}_GCES_Assignment_Premium.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default { exportAssignmentToPDF, downloadPremiumAssignmentHTML };