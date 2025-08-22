// Enhanced PDF Export with Proper Math Rendering
// Uses SmartMathRenderer for professional mathematical display

import { createRoot } from 'react-dom/client';
import SmartMathRenderer from '../components/SmartMathRenderer';

export const exportAssignmentWithMathToPDF = async (assignment, metadata = {}) => {
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

    // Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);

    // Create React root for rendering
    const root = createRoot(tempContainer);

    try {
      // Render the assignment with proper math
      await new Promise((resolve, reject) => {
        const AssignmentContent = () => {
          React.useEffect(() => {
            // Wait for math rendering to complete
            setTimeout(resolve, 2000);
          }, []);

          return (
            <div style={{ fontFamily: 'Times New Roman, serif', lineHeight: '1.6', color: '#333' }}>
              <SmartMathRenderer content={assignment} className="assignment-content" />
            </div>
          );
        };

        root.render(<AssignmentContent />);
      });

      // Get the rendered HTML with properly formatted math
      const renderedHTML = tempContainer.innerHTML;

      // Create print window with the rendered content
      const printWindow = await createPrintWindow(renderedHTML, metadata);
      
      return { 
        success: true, 
        message: 'Premium PDF with rendered mathematics ready! Click "Generate PDF" to create your professional document.' 
      };

    } finally {
      // Cleanup
      root.unmount();
      document.body.removeChild(tempContainer);
    }

  } catch (error) {
    console.error('Math PDF Export Error:', error);
    throw new Error(`Failed to export PDF with math rendering: ${error.message}`);
  }
};

const createPrintWindow = async (renderedContent, metadata) => {
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

  const premiumHtmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${moduleTitle} - Assignment | GCES Ganderbal</title>
        
        <!-- KaTeX CSS for Math Rendering -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn" crossorigin="anonymous">
        
        <!-- Google Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
        
        <style>
            /* Enhanced CSS with Math Support */
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
                --success-green: #10b981;
                --border-color: #e5e7eb;
            }
            
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
            
            body {
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: var(--dark-gray);
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                font-size: 11pt;
                max-width: 210mm;
                margin: 0 auto;
                padding: 20px;
            }
            
            /* Enhanced Header */
            .header {
                background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                border-radius: 20px 20px 0 0;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                margin-bottom: 0;
                position: relative;
                overflow: hidden;
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
            
            /* Assignment Header */
            .assignment-header {
                background: white;
                padding: 30px;
                border-radius: 0 0 20px 20px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
            
            /* Enhanced Math Styling */
            .katex {
                font-size: 1.1em !important;
            }
            
            .katex-display {
                margin: 1.5em 0 !important;
                padding: 1em !important;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                border: 2px solid #bae6fd !important;
                border-radius: 15px !important;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
            }
            
            .katex-display .katex {
                font-size: 1.3em !important;
                color: var(--primary-blue) !important;
            }
            
            /* Math inline styling */
            .katex:not(.katex-display) {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                padding: 3px 6px !important;
                border-radius: 6px !important;
                border: 1px solid #bae6fd !important;
                color: var(--primary-blue) !important;
            }
            
            /* Content Styling */
            .content-container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                margin: 30px 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                border: 1px solid var(--border-color);
            }
            
            .assignment-content {
                line-height: 1.8;
                font-size: 12pt;
            }
            
            .assignment-content h1 {
                font-size: 18pt;
                font-weight: 700;
                color: var(--primary-blue);
                margin: 30px 0 20px 0;
                padding-bottom: 10px;
                border-bottom: 2px solid var(--accent-gold);
            }
            
            .assignment-content h2 {
                font-size: 15pt;
                font-weight: 600;
                color: var(--dark-gray);
                margin: 25px 0 15px 0;
                padding: 15px 20px;
                background: var(--light-gray);
                border-left: 4px solid var(--secondary-blue);
                border-radius: 10px;
            }
            
            .assignment-content h3 {
                font-size: 13pt;
                font-weight: 600;
                color: var(--medium-gray);
                margin: 20px 0 10px 0;
            }
            
            .assignment-content p {
                margin-bottom: 15px;
                text-align: justify;
                line-height: 1.7;
            }
            
            .assignment-content strong {
                background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 700;
                color: var(--dark-gray);
            }
            
            .assignment-content em {
                color: var(--secondary-blue);
                font-weight: 500;
            }
            
            /* Enhanced Metadata */
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
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
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
            
            /* Student Info */
            .student-info-container {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin: 30px 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
                color: var(--dark-gray);
            }
            
            /* Print Controls */
            .print-controls {
                background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                color: white;
                padding: 25px;
                border-radius: 20px;
                text-align: center;
                margin-bottom: 30px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .print-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
            
            /* Footer */
            .footer {
                text-align: center;
                padding: 20px;
                color: var(--medium-gray);
                font-size: 10pt;
                border-top: 1px solid var(--border-color);
                margin-top: 40px;
            }
            
            /* Responsive */
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
        <!-- Print Controls -->
        <div class="print-controls no-print">
            <div class="print-title">📄 Premium PDF with Rendered Mathematics</div>
            <div class="print-description">
                Mathematical expressions are now properly rendered! Click "Generate PDF" to create your professional assignment document.
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
        
        <!-- Header -->
        <div class="header avoid-break">
            <div class="institution-name">
                Govt. College of Engineering Safapora
            </div>
            <div class="institution-address">
                Ganderbal Kashmir, India 193504
            </div>
            <div class="instructor-info">
                <div class="instructor-label">Course Instructor</div>
                <div class="instructor-name">${instructorName}</div>
            </div>
        </div>
        
        <!-- Assignment Header -->
        <div class="assignment-header avoid-break">
            <div class="assignment-title">${moduleTitle}</div>
            <div class="assignment-title" style="font-size: 14pt; margin-top: 10px; color: var(--medium-gray);">
                Mathematical Problem Set
            </div>
            
            <!-- Metadata Grid -->
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
        
        <!-- Student Information -->
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
        
        <!-- Assignment Content with Rendered Math -->
        <div class="content-container">
            <div class="assignment-content">
                ${renderedContent}
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>Govt. College of Engineering Safapora Ganderbal Kashmir</strong></p>
            <p>📧 Contact: registrar@gces.edu.in | 📞 Phone: +91-194-XXX-XXXX | 🌐 Website: www.gces.edu.in</p>
            <p style="margin-top: 10px; font-size: 9pt; opacity: 0.7;">
                Generated on ${currentDate} | Academic Session ${new Date().getFullYear()}-${(new Date().getFullYear() + 1) % 100}
            </p>
        </div>
        
        <script>
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
            
            window.addEventListener('beforeprint', function() {
                document.title = '${moduleTitle.replace(/[^a-zA-Z0-9]/g, '_')}_GCES_Assignment_Math';
            });
        </script>
    </body>
    </html>
  `;

  printWindow.document.write(premiumHtmlContent);
  printWindow.document.close();
  printWindow.focus();

  return printWindow;
};

export default { exportAssignmentWithMathToPDF };