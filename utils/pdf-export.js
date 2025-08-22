// PDF Export Utility for Assignments
// Uses html2pdf.js for client-side PDF generation

export const exportAssignmentToPDF = async (assignment, metadata = {}) => {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF export is only available in browser environment');
    }

    // Dynamic import for client-side only
    let html2pdf;
    try {
      const html2pdfModule = await import('html2pdf.js');
      html2pdf = html2pdfModule.default || html2pdfModule;
    } catch (importError) {
      console.error('Failed to import html2pdf.js:', importError);
      throw new Error('PDF library not available. Please install html2pdf.js');
    }
    
    const {
      moduleTitle = 'Assignment',
      topics = '',
      difficulty = 'medium',
      dueDate = null,
      studentName = '',
      courseTitle = ''
    } = metadata;

    // Create a styled HTML document
    const htmlContent = createAssignmentHTML(assignment, metadata);
    
    const options = {
      margin: [15, 15, 15, 15],
      filename: `${moduleTitle.replace(/[^a-z0-9]/gi, '_')}_Assignment.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after'
      }
    };

    // Generate and download PDF
    await html2pdf().set(options).from(htmlContent).save();
    
    return { success: true };
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

const createAssignmentHTML = (assignment, metadata) => {
  const {
    moduleTitle = 'Assignment',
    topics = '',
    difficulty = 'medium',
    dueDate = null,
    studentName = '',
    courseTitle = '',
    institutionName = 'Academic Institution'
  } = metadata;

  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  // Process LaTeX content for PDF (using MathJax or KaTeX rendering)
  let processedContent = assignment;
  
  // Convert LaTeX to HTML with proper styling
  processedContent = processedContent
    // Display math blocks
    .replace(/\\\[(.*?)\\\]/gs, (match, formula) => {
      return `<div class="math-display">${formula}</div>`;
    })
    // Inline math
    .replace(/\\\((.*?)\\\)/g, (match, formula) => {
      return `<span class="math-inline">${formula}</span>`;
    })
    // Markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${moduleTitle} - Assignment</title>
        <style>
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
                margin-bottom: 5px;
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
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
                padding: 10px;
                background: #f8f9fa;
                border: 1px solid #ddd;
            }
            
            .metadata-item {
                text-align: center;
            }
            
            .metadata-label {
                font-weight: bold;
                font-size: 10pt;
                color: #666;
            }
            
            .metadata-value {
                font-size: 11pt;
                margin-top: 2px;
            }
            
            .student-info {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #ddd;
                background: #fafafa;
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
            }
            
            .field-label {
                font-weight: bold;
                min-width: 100px;
            }
            
            .field-line {
                flex: 1;
                border-bottom: 1px solid #333;
                height: 20px;
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
            }
            
            h2 {
                font-size: 14pt;
                margin: 20px 0 10px 0;
                color: #444;
            }
            
            h3 {
                font-size: 13pt;
                margin: 15px 0 8px 0;
                color: #555;
            }
            
            p {
                margin-bottom: 12px;
                text-align: justify;
            }
            
            .math-display {
                text-align: center;
                margin: 15px 0;
                font-style: italic;
                font-size: 14pt;
            }
            
            .math-inline {
                font-style: italic;
            }
            
            strong {
                font-weight: bold;
            }
            
            em {
                font-style: italic;
            }
            
            ul, ol {
                margin-left: 20px;
                margin-bottom: 12px;
            }
            
            li {
                margin-bottom: 6px;
            }
            
            .page-break-before {
                page-break-before: always;
            }
            
            .page-break-after {
                page-break-after: always;
            }
            
            .footer {
                position: fixed;
                bottom: 10mm;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 10pt;
                color: #666;
            }
            
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .page-break-before {
                    page-break-before: always;
                }
                
                .page-break-after {
                    page-break-after: always;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="institution">${institutionName}</div>
            ${courseTitle ? `<div class="course-title">${courseTitle}</div>` : ''}
            <div class="assignment-title">${moduleTitle} - Mathematical Assignment</div>
        </div>
        
        <div class="metadata">
            <div class="metadata-item">
                <div class="metadata-label">Topics</div>
                <div class="metadata-value">${topics}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Difficulty</div>
                <div class="metadata-value">${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
            </div>
            ${formattedDueDate ? `
                <div class="metadata-item">
                    <div class="metadata-label">Due Date</div>
                    <div class="metadata-value">${formattedDueDate}</div>
                </div>
            ` : ''}
        </div>
        
        <div class="student-info">
            <div class="student-fields">
                <div class="field">
                    <span class="field-label">Name:</span>
                    <div class="field-line">${studentName}</div>
                </div>
                <div class="field">
                    <span class="field-label">Student ID:</span>
                    <div class="field-line"></div>
                </div>
                <div class="field">
                    <span class="field-label">Date:</span>
                    <div class="field-line"></div>
                </div>
                <div class="field">
                    <span class="field-label">Score:</span>
                    <div class="field-line">_____ / 100</div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <p>${processedContent}</p>
        </div>
        
        <div class="footer">
            Generated on ${new Date().toLocaleDateString('en-US')} | Page <span class="pageNumber"></span>
        </div>
    </body>
    </html>
  `;
};

export default { exportAssignmentToPDF };