// Simple PDF Export using browser's print functionality
// Fallback solution for assignment PDF generation

export const exportAssignmentToPDF = async (assignment, metadata = {}) => {
  try {
    const {
      moduleTitle = 'Assignment',
      topics = '',
      difficulty = 'medium',
      dueDate = null,
      studentName = '',
      courseTitle = '',
      institutionName = 'Academic Institution'
    } = metadata;

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for PDF export.');
    }

    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    // Process assignment content for better display
    let processedContent = assignment;
    
    // Convert LaTeX to readable text (simplified)
    processedContent = processedContent
      .replace(/\\\[(.*?)\\\]/gs, (match, formula) => {
        return `<div class="math-display">[${formula}]</div>`;
      })
      .replace(/\\\((.*?)\\\)/g, (match, formula) => {
        return `<span class="math-inline">${formula}</span>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${moduleTitle} - Assignment</title>
          <style>
              @media print {
                  @page {
                      margin: 1in;
                      size: A4;
                  }
                  
                  body {
                      -webkit-print-color-adjust: exact !important;
                      color-adjust: exact !important;
                      print-color-adjust: exact !important;
                  }
              }
              
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: 'Times New Roman', Times, serif;
                  line-height: 1.6;
                  color: #333;
                  background: white;
                  font-size: 12pt;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
              }
              
              .header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding-bottom: 20px;
                  border-bottom: 2px solid #333;
              }
              
              .institution {
                  font-size: 18pt;
                  font-weight: bold;
                  margin-bottom: 10px;
              }
              
              .course-title {
                  font-size: 14pt;
                  margin-bottom: 10px;
                  color: #666;
              }
              
              .assignment-title {
                  font-size: 16pt;
                  font-weight: bold;
                  margin: 15px 0;
              }
              
              .metadata {
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 20px;
                  margin: 20px 0;
                  padding: 15px;
                  background: #f8f9fa;
                  border: 1px solid #ddd;
                  border-radius: 5px;
              }
              
              .metadata-item {
                  text-align: center;
              }
              
              .metadata-label {
                  font-weight: bold;
                  font-size: 10pt;
                  color: #666;
                  display: block;
                  margin-bottom: 5px;
              }
              
              .metadata-value {
                  font-size: 11pt;
              }
              
              .student-info {
                  margin: 20px 0;
                  padding: 15px;
                  border: 1px solid #ddd;
                  background: #fafafa;
                  border-radius: 5px;
              }
              
              .student-fields {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
              }
              
              .field {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  margin-bottom: 15px;
              }
              
              .field-label {
                  font-weight: bold;
                  min-width: 100px;
              }
              
              .field-line {
                  flex: 1;
                  border-bottom: 1px solid #333;
                  height: 25px;
                  display: inline-block;
              }
              
              .content {
                  margin-top: 30px;
              }
              
              h1 {
                  font-size: 16pt;
                  margin: 25px 0 15px 0;
                  color: #333;
                  border-bottom: 1px solid #ccc;
                  padding-bottom: 5px;
                  page-break-after: avoid;
              }
              
              h2 {
                  font-size: 14pt;
                  margin: 20px 0 10px 0;
                  color: #444;
                  page-break-after: avoid;
              }
              
              h3 {
                  font-size: 13pt;
                  margin: 15px 0 8px 0;
                  color: #555;
                  page-break-after: avoid;
              }
              
              p {
                  margin-bottom: 12px;
                  text-align: justify;
                  orphans: 3;
                  widows: 3;
              }
              
              .math-display {
                  text-align: center;
                  margin: 15px 0;
                  font-style: italic;
                  font-size: 14pt;
                  font-family: 'Times New Roman', serif;
                  background: #f9f9f9;
                  padding: 10px;
                  border: 1px solid #e0e0e0;
                  border-radius: 3px;
              }
              
              .math-inline {
                  font-style: italic;
                  font-family: 'Times New Roman', serif;
                  background: #f5f5f5;
                  padding: 2px 4px;
                  border-radius: 2px;
              }
              
              strong {
                  font-weight: bold;
              }
              
              em {
                  font-style: italic;
              }
              
              ul, ol {
                  margin-left: 25px;
                  margin-bottom: 15px;
              }
              
              li {
                  margin-bottom: 8px;
                  page-break-inside: avoid;
              }
              
              .no-print {
                  display: none !important;
              }
              
              @media screen {
                  .print-instructions {
                      background: #e3f2fd;
                      border: 1px solid #2196f3;
                      border-radius: 5px;
                      padding: 15px;
                      margin-bottom: 20px;
                      text-align: center;
                  }
                  
                  .print-button {
                      background: #2196f3;
                      color: white;
                      border: none;
                      padding: 10px 20px;
                      border-radius: 5px;
                      cursor: pointer;
                      font-size: 14px;
                      margin: 10px;
                  }
                  
                  .print-button:hover {
                      background: #1976d2;
                  }
              }
              
              @media print {
                  .print-instructions {
                      display: none !important;
                  }
              }
          </style>
      </head>
      <body>
          <div class="print-instructions">
              <h3>Assignment PDF Export</h3>
              <p>Click the print button below, then select "Save as PDF" or "Microsoft Print to PDF" in the print dialog.</p>
              <button class="print-button" onclick="window.print()">🖨️ Print to PDF</button>
              <button class="print-button" onclick="window.close()">❌ Close</button>
          </div>
          
          <div class="header">
              <div class="institution">${institutionName}</div>
              ${courseTitle ? `<div class="course-title">${courseTitle}</div>` : ''}
              <div class="assignment-title">${moduleTitle} - Mathematical Assignment</div>
          </div>
          
          <div class="metadata">
              <div class="metadata-item">
                  <span class="metadata-label">Topics</span>
                  <div class="metadata-value">${topics}</div>
              </div>
              <div class="metadata-item">
                  <span class="metadata-label">Difficulty</span>
                  <div class="metadata-value">${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
              </div>
              ${formattedDueDate ? `
                  <div class="metadata-item">
                      <span class="metadata-label">Due Date</span>
                      <div class="metadata-value">${formattedDueDate}</div>
                  </div>
              ` : '<div></div>'}
          </div>
          
          <div class="student-info">
              <h3 style="margin-bottom: 15px;">Student Information</h3>
              <div class="student-fields">
                  <div class="field">
                      <span class="field-label">Name:</span>
                      <span class="field-line">${studentName}</span>
                  </div>
                  <div class="field">
                      <span class="field-label">Student ID:</span>
                      <span class="field-line"></span>
                  </div>
                  <div class="field">
                      <span class="field-label">Date Submitted:</span>
                      <span class="field-line"></span>
                  </div>
                  <div class="field">
                      <span class="field-label">Score:</span>
                      <span class="field-line">_____ / 100</span>
                  </div>
              </div>
          </div>
          
          <div class="content">
              ${processedContent}
          </div>
          
          <script>
              // Auto-print for better UX (optional)
              setTimeout(() => {
                  if (window.location.search.includes('autoprint=true')) {
                      window.print();
                  }
              }, 1000);
          </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Focus the print window
    printWindow.focus();

    return { success: true, message: 'PDF export window opened. Use browser print dialog to save as PDF.' };

  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

// Alternative: Direct download as HTML file
export const downloadAssignmentAsHTML = (assignment, metadata = {}) => {
  const {
    moduleTitle = 'Assignment',
  } = metadata;

  const htmlContent = createAssignmentHTML(assignment, metadata);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${moduleTitle.replace(/[^a-z0-9]/gi, '_')}_Assignment.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default { exportAssignmentToPDF, downloadAssignmentAsHTML };