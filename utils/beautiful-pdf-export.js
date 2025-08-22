// Beautiful PDF Export with SVG Icons and Enhanced Styling
// Uses advanced CSS and SVG graphics for stunning visual design

export const exportBeautifulAssignmentPDF = async (assignment, metadata = {}) => {
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

    // Process assignment content for beautiful rendering
    const processedAssignment = processAssignmentForBeautifulPDF(assignment);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${moduleTitle} - Beautiful Assignment | GCES Ganderbal</title>
          
          <!-- KaTeX CSS -->
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" crossorigin="anonymous">
          
          <!-- KaTeX JavaScript -->
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js" crossorigin="anonymous"></script>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
          
          <!-- Google Fonts -->
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
          
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              :root {
                  --primary-purple: #8b5cf6;
                  --primary-blue: #3b82f6;
                  --primary-indigo: #6366f1;
                  --emerald: #10b981;
                  --emerald-light: #d1fae5;
                  --blue-light: #dbeafe;
                  --purple-light: #e9d5ff;
                  --amber: #f59e0b;
                  --amber-light: #fef3c7;
                  --rose: #f43f5e;
                  --rose-light: #fce7f3;
                  --gray-50: #f9fafb;
                  --gray-100: #f3f4f6;
                  --gray-200: #e5e7eb;
                  --gray-700: #374151;
                  --gray-800: #1f2937;
                  --gray-900: #111827;
              }
              
              @media print {
                  @page { 
                      margin: 0.5in; 
                      size: A4; 
                  }
                  body { 
                      -webkit-print-color-adjust: exact !important; 
                      print-color-adjust: exact !important;
                  }
                  .no-print { display: none !important; }
                  .page-break { page-break-before: always; }
                  .avoid-break { page-break-inside: avoid; }
                  
                  /* Print-specific adjustments */
                  .question-header { margin-bottom: 1.5rem; }
                  .solved-example { margin-bottom: 1.5rem; }
                  .unsolved-problem { margin-bottom: 1rem; }
              }
              
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                  line-height: 1.6;
                  color: var(--gray-800);
                  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                  font-size: 11pt;
                  max-width: 210mm;
                  margin: 0 auto;
                  padding: 15px;
              }
              
              /* Beautiful Header with Institution Branding */
              .header {
                  background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-blue) 50%, var(--primary-indigo) 100%);
                  color: white;
                  padding: 2rem 1.5rem;
                  text-align: center;
                  border-radius: 20px;
                  margin-bottom: 1.5rem;
                  box-shadow: 0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04);
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
                  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                  animation: float 30s ease-in-out infinite;
                  pointer-events: none;
              }
              
              @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  25% { transform: translateY(-5px) rotate(0.5deg); }
                  50% { transform: translateY(-10px) rotate(1deg); }
                  75% { transform: translateY(-5px) rotate(0.5deg); }
              }
              
              .institution-name {
                  font-size: 20pt;
                  font-weight: 900;
                  margin-bottom: 0.5rem;
                  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
                  letter-spacing: -0.5px;
                  position: relative;
                  z-index: 2;
              }
              
              .institution-address {
                  font-size: 10pt;
                  opacity: 0.9;
                  margin-bottom: 1rem;
                  position: relative;
                  z-index: 2;
                  font-weight: 400;
              }
              
              .instructor-info {
                  background: rgba(255, 255, 255, 0.15);
                  backdrop-filter: blur(10px);
                  padding: 0.75rem 1.25rem;
                  border-radius: 12px;
                  display: inline-block;
                  margin-top: 0.5rem;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  position: relative;
                  z-index: 2;
              }
              
              .instructor-label {
                  font-size: 8pt;
                  opacity: 0.9;
                  margin-bottom: 2px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  font-weight: 600;
              }
              
              .instructor-name {
                  font-size: 12pt;
                  font-weight: 700;
                  color: var(--amber);
                  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
              }
              
              /* Assignment Title Section */
              .assignment-header {
                  background: white;
                  padding: 1.5rem;
                  border-radius: 16px;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                  border: 1px solid var(--gray-200);
                  margin-bottom: 1.5rem;
              }
              
              .assignment-title {
                  font-size: 18pt;
                  font-weight: 800;
                  background: linear-gradient(135deg, var(--primary-purple), var(--primary-blue));
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                  text-align: center;
                  margin-bottom: 1rem;
              }
              
              /* Question Headers with Beautiful SVG Icons */
              .question-header {
                  background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-blue) 100%);
                  color: white;
                  padding: 1.25rem;
                  border-radius: 16px;
                  margin: 1.5rem 0 1rem 0;
                  box-shadow: 0 10px 25px rgba(139, 92, 246, 0.2);
                  position: relative;
                  overflow: hidden;
              }
              
              .question-header::before {
                  content: '';
                  position: absolute;
                  top: -2px;
                  left: -2px;
                  right: -2px;
                  bottom: -2px;
                  background: linear-gradient(135deg, var(--primary-purple), var(--primary-blue), var(--primary-indigo));
                  border-radius: 18px;
                  z-index: -1;
              }
              
              .question-header-content {
                  display: flex;
                  align-items: center;
                  gap: 1rem;
              }
              
              .question-number {
                  background: rgba(255, 255, 255, 0.2);
                  backdrop-filter: blur(10px);
                  padding: 0.5rem 1rem;
                  border-radius: 20px;
                  font-size: 10pt;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .question-title {
                  font-size: 16pt;
                  font-weight: 700;
                  flex: 1;
              }
              
              .question-reference {
                  font-size: 9pt;
                  opacity: 0.9;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 0.25rem 0.75rem;
                  border-radius: 8px;
                  border: 1px solid rgba(255, 255, 255, 0.2);
              }
              
              /* Solved Example with Emerald Green Theme */
              .solved-example {
                  background: linear-gradient(135deg, var(--emerald-light) 0%, #ecfdf5 100%);
                  border: 2px solid var(--emerald);
                  border-radius: 16px;
                  padding: 1.25rem;
                  margin: 1rem 0;
                  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.1);
                  position: relative;
              }
              
              .solved-example::before {
                  content: '';
                  position: absolute;
                  top: -1px;
                  left: -1px;
                  right: -1px;
                  bottom: -1px;
                  background: linear-gradient(135deg, var(--emerald), #059669);
                  border-radius: 17px;
                  z-index: -1;
              }
              
              .solved-header {
                  display: flex;
                  align-items: center;
                  gap: 0.75rem;
                  margin-bottom: 1rem;
                  padding-bottom: 0.75rem;
                  border-bottom: 2px solid var(--emerald);
              }
              
              .solved-icon {
                  width: 32px;
                  height: 32px;
                  background: var(--emerald);
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              }
              
              .solved-title {
                  font-size: 14pt;
                  font-weight: 800;
                  color: #065f46;
              }
              
              .solved-subtitle {
                  font-size: 9pt;
                  color: #047857;
                  font-weight: 500;
              }
              
              /* Problem Statements */
              .problem-statement {
                  background: white;
                  border: 2px solid var(--blue-light);
                  border-radius: 12px;
                  padding: 1rem;
                  margin: 0.75rem 0;
                  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
              }
              
              .problem-label {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  font-size: 10pt;
                  font-weight: 700;
                  color: var(--primary-blue);
                  margin-bottom: 0.5rem;
              }
              
              .problem-content {
                  color: var(--gray-800);
                  line-height: 1.5;
              }
              
              /* Given and Required Sections */
              .given-required-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 1rem;
                  margin: 0.75rem 0;
              }
              
              .given-section {
                  background: var(--blue-light);
                  border: 2px solid var(--primary-blue);
                  border-radius: 12px;
                  padding: 0.75rem;
              }
              
              .required-section {
                  background: var(--purple-light);
                  border: 2px solid var(--primary-purple);
                  border-radius: 12px;
                  padding: 0.75rem;
              }
              
              .section-label {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  font-size: 9pt;
                  font-weight: 700;
                  margin-bottom: 0.5rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .given-label { color: #1e40af; }
              .required-label { color: #7c3aed; }
              
              .section-content {
                  font-size: 10pt;
                  line-height: 1.4;
              }
              
              .given-item {
                  display: flex;
                  align-items: start;
                  gap: 0.5rem;
                  margin: 0.25rem 0;
                  color: #1e40af;
              }
              
              .given-bullet {
                  width: 6px;
                  height: 6px;
                  background: var(--primary-blue);
                  border-radius: 50%;
                  margin-top: 0.4rem;
                  flex-shrink: 0;
              }
              
              /* Solution Section */
              .solution-section {
                  background: white;
                  border: 2px solid var(--emerald);
                  border-radius: 12px;
                  padding: 1rem;
                  margin: 0.75rem 0;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
              }
              
              .solution-label {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  font-size: 10pt;
                  font-weight: 700;
                  color: #065f46;
                  margin-bottom: 0.75rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              /* Final Answer */
              .final-answer {
                  background: linear-gradient(135deg, var(--emerald) 0%, #059669 100%);
                  color: white;
                  border-radius: 12px;
                  padding: 1rem;
                  margin: 0.75rem 0;
                  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
              }
              
              .answer-label {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  font-size: 10pt;
                  font-weight: 700;
                  margin-bottom: 0.5rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .answer-content {
                  font-size: 12pt;
                  font-weight: 700;
              }
              
              /* Unsolved Problems with Blue Theme */
              .unsolved-problem {
                  background: linear-gradient(135deg, var(--blue-light) 0%, #f0f9ff 100%);
                  border: 2px solid var(--primary-blue);
                  border-radius: 16px;
                  padding: 1rem;
                  margin: 0.75rem 0;
                  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.1);
                  position: relative;
              }
              
              .unsolved-header {
                  display: flex;
                  align-items: center;
                  gap: 0.75rem;
                  margin-bottom: 0.75rem;
                  padding-bottom: 0.5rem;
                  border-bottom: 2px solid var(--primary-blue);
              }
              
              .unsolved-icon {
                  width: 28px;
                  height: 28px;
                  background: var(--primary-blue);
                  border-radius: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
              }
              
              .unsolved-title {
                  font-size: 12pt;
                  font-weight: 700;
                  color: #1e40af;
              }
              
              .unsolved-subtitle {
                  font-size: 8pt;
                  color: #2563eb;
                  font-weight: 500;
              }
              
              /* Solution Space */
              .solution-space {
                  background: var(--gray-50);
                  border: 2px dashed var(--gray-200);
                  border-radius: 8px;
                  padding: 1rem;
                  margin-top: 0.75rem;
                  text-align: center;
              }
              
              .solution-space-label {
                  font-size: 9pt;
                  color: var(--gray-700);
                  font-weight: 600;
                  margin-bottom: 0.5rem;
              }
              
              .solution-lines {
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
              }
              
              .solution-line {
                  height: 16px;
                  border-bottom: 1px dotted var(--gray-200);
              }
              
              /* Enhanced Math Styling */
              .katex {
                  font-size: 1.1em !important;
              }
              
              .katex-display {
                  margin: 1rem 0 !important;
                  padding: 1rem !important;
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                  border: 2px solid #bae6fd !important;
                  border-radius: 12px !important;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1) !important;
                  position: relative !important;
              }
              
              .katex-display::before {
                  content: '📐';
                  position: absolute;
                  top: 8px;
                  right: 12px;
                  font-size: 12pt;
                  opacity: 0.6;
              }
              
              .katex-display .katex {
                  font-size: 1.2em !important;
                  color: var(--primary-blue) !important;
              }
              
              .katex:not(.katex-display) {
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                  padding: 2px 6px !important;
                  border-radius: 4px !important;
                  border: 1px solid #bae6fd !important;
                  color: var(--primary-blue) !important;
                  margin: 0 2px !important;
              }
              
              /* Print Controls */
              .print-controls {
                  background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-blue) 100%);
                  color: white;
                  padding: 1.5rem;
                  border-radius: 16px;
                  text-align: center;
                  margin-bottom: 1.5rem;
                  box-shadow: 0 10px 25px rgba(139, 92, 246, 0.2);
              }
              
              .print-title {
                  font-size: 16pt;
                  font-weight: 800;
                  margin-bottom: 0.75rem;
              }
              
              .print-description {
                  font-size: 10pt;
                  margin-bottom: 1rem;
                  opacity: 0.9;
              }
              
              .print-buttons {
                  display: flex;
                  gap: 1rem;
                  justify-content: center;
                  flex-wrap: wrap;
              }
              
              .print-button {
                  background: linear-gradient(135deg, var(--amber) 0%, #f59e0b 100%);
                  color: white;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 20px;
                  font-size: 10pt;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
              }
              
              .print-button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
              }
              
              .close-button {
                  background: rgba(255, 255, 255, 0.2);
                  border: 2px solid rgba(255, 255, 255, 0.3);
                  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
              }
              
              /* Separator */
              .question-separator {
                  display: flex;
                  justify-content: center;
                  margin: 2rem 0;
              }
              
              .separator-line {
                  width: 120px;
                  height: 4px;
                  background: linear-gradient(90deg, transparent, var(--primary-purple), var(--primary-blue), transparent);
                  border-radius: 2px;
              }
              
              /* Enhanced Table Styles */
              .truth-table-container,
              .markdown-table-container,
              .enhanced-html-table {
                  margin: 1rem 0;
                  page-break-inside: avoid;
              }
              
              .truth-table,
              .markdown-table,
              .enhanced-html-table {
                  width: 100%;
                  border-collapse: collapse;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0.75rem 0;
                  font-size: 9pt;
              }
              
              .truth-table th,
              .markdown-table th,
              .enhanced-html-table th {
                  background: linear-gradient(135deg, var(--primary-purple), var(--primary-blue));
                  color: white;
                  padding: 8px 12px;
                  text-align: center;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  font-size: 8pt;
              }
              
              .truth-table td,
              .markdown-table td,
              .enhanced-html-table td {
                  padding: 8px 12px;
                  text-align: center;
                  border: 1px solid var(--gray-200);
                  font-family: 'JetBrains Mono', monospace;
                  font-size: 8pt;
              }
              
              .truth-table tbody tr:nth-child(even),
              .markdown-table tbody tr:nth-child(even),
              .enhanced-html-table tbody tr:nth-child(even) {
                  background-color: var(--gray-50);
              }
              
              .truth-table tbody tr:nth-child(odd),
              .markdown-table tbody tr:nth-child(odd),
              .enhanced-html-table tbody tr:nth-child(odd) {
                  background-color: white;
              }
              
              /* Truth table specific styling */
              .truth-table .text-green-600 {
                  color: #059669 !important;
                  font-weight: 700;
                  background-color: #d1fae5 !important;
              }
              
              .truth-table .text-red-600 {
                  color: #dc2626 !important;
                  font-weight: 700;
                  background-color: #fee2e2 !important;
              }
              
              /* Code blocks */
              .code-block-container {
                  margin: 1rem 0;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              
              .code-block-container pre {
                  background: var(--gray-900);
                  color: var(--gray-100);
                  padding: 1rem;
                  margin: 0;
                  font-family: 'JetBrains Mono', monospace;
                  font-size: 8pt;
                  line-height: 1.4;
                  overflow-x: auto;
              }
              
              /* Chart and Visualization Styles */
              .chart-container,
              .plot-container {
                  background: white;
                  border: 2px solid #e5e7eb;
                  border-radius: 12px;
                  padding: 1rem;
                  margin: 1rem 0;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  page-break-inside: avoid;
              }
              
              .chart-container h4,
              .plot-container h4 {
                  font-size: 12pt;
                  font-weight: 700;
                  color: #1f2937;
                  margin: 0 0 0.5rem 0;
                  text-align: center;
              }
              
              .chart-container p,
              .plot-container p {
                  font-size: 9pt;
                  color: #6b7280;
                  margin: 0 0 1rem 0;
                  text-align: center;
                  font-style: italic;
              }
              
              .chart-placeholder,
              .plot-placeholder {
                  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                  border: 1px dashed #d1d5db;
                  border-radius: 8px;
                  padding: 2rem;
                  text-align: center;
                  min-height: 200px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
              }
              
              .chart-placeholder .text-2xl,
              .plot-placeholder .text-2xl {
                  font-size: 24pt;
                  margin-bottom: 0.5rem;
              }
              
              .chart-placeholder .text-gray-600,
              .plot-placeholder .text-gray-600 {
                  font-size: 11pt;
                  font-weight: 600;
                  color: #4b5563;
                  margin-bottom: 0.25rem;
              }
              
              .chart-placeholder .text-gray-500,
              .plot-placeholder .text-gray-500 {
                  font-size: 9pt;
                  color: #6b7280;
                  font-style: italic;
              }
              
              /* Chart Error Styles */
              .chart-error {
                  background: #fef2f2;
                  border: 2px solid #fecaca;
                  border-radius: 8px;
                  padding: 1rem;
                  margin: 1rem 0;
              }
              
              .chart-error .text-red-600 {
                  color: #dc2626;
                  font-weight: 700;
                  font-size: 10pt;
                  margin-bottom: 0.25rem;
              }
              
              .chart-error .text-red-500 {
                  color: #ef4444;
                  font-size: 9pt;
              }

              /* Footer */
              .footer {
                  text-align: center;
                  padding: 1rem;
                  color: var(--gray-700);
                  font-size: 9pt;
                  border-top: 2px solid var(--gray-200);
                  margin-top: 2rem;
                  background: var(--gray-50);
                  border-radius: 12px;
              }
          </style>
      </head>
      <body>
          <!-- Print Controls -->
          <div class="print-controls no-print">
              <div class="print-title">✨ Beautiful Assignment PDF Export</div>
              <div class="print-description">
                  Stunning visual design with SVG icons, beautiful mathematics rendering, and clear problem/solution differentiation.
              </div>
              <div class="print-buttons">
                  <button class="print-button" onclick="window.print()">
                      🖨️ Generate Beautiful PDF
                  </button>
                  <button class="print-button close-button" onclick="window.close()">
                      ❌ Close Window
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
              <div style="text-align: center; color: var(--gray-700); font-size: 10pt;">
                  Beautiful Design • Enhanced Mathematics • Professional Quality
              </div>
          </div>
          
          <!-- Assignment Content -->
          <div id="math-content">
              ${processedAssignment}
          </div>
          
          <!-- Footer -->
          <div class="footer">
              <p><strong>Govt. College of Engineering Safapora Ganderbal Kashmir</strong></p>
              <p>📧 registrar@gces.edu.in | 📞 +91-194-XXX-XXXX | 🌐 www.gces.edu.in</p>
              <p style="margin-top: 8px; opacity: 0.7;">
                  Generated: ${currentDate} | Academic Session ${new Date().getFullYear()}-${(new Date().getFullYear() + 1) % 100}
              </p>
          </div>
          
          <script>
              document.addEventListener('DOMContentLoaded', function() {
                  renderMathInDocument();
              });
              
              function renderMathInDocument() {
                  if (typeof renderMathInElement !== 'undefined') {
                      renderMathInElement(document.getElementById('math-content'), {
                          delimiters: [
                              {left: '$$', right: '$$', display: true},
                              {left: '$', right: '$', display: false},
                              {left: '\\\\[', right: '\\\\]', display: true},
                              {left: '\\\\(', right: '\\\\)', display: false}
                          ],
                          throwOnError: false,
                          errorColor: '#dc2626',
                          strict: false,
                          trust: false
                      });
                  }
              }
              
              window.addEventListener('beforeprint', function() {
                  document.title = '${moduleTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Beautiful_GCES_Assignment';
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
      message: 'Beautiful PDF with stunning visual design ready! Enhanced mathematics, SVG icons, and clear differentiation between problems and solutions.' 
    };

  } catch (error) {
    console.error('Beautiful PDF Export Error:', error);
    throw new Error(`Failed to export beautiful PDF: ${error.message}`);
  }
};

// Process assignment content for beautiful PDF rendering
const processAssignmentForBeautifulPDF = (assignment) => {
  if (!assignment) return '';
  
  let processed = assignment;
  
  // Convert LaTeX delimiters
  processed = processed
    .replace(/\\\[(.*?)\\\]/gs, (match, content) => `$$${content}$$`)
    .replace(/\\\((.*?)\\\)/g, (match, content) => `$${content}$`);
  
  // Process questions with beautiful styling
  processed = processed.replace(
    /### Question (\d+): ([^\n]+)\n\*\*Source Reference:\*\* ([^\n]+)/g,
    (match, num, title, ref) => `
      <div class="question-header avoid-break">
          <div class="question-header-content">
              <div class="question-number">Question ${num}</div>
              <div class="question-title">${title}</div>
              <div class="question-reference">📚 ${ref}</div>
          </div>
      </div>
    `
  );
  
  // Process solved examples
  processed = processed.replace(
    /#### Part A: Solved Example\n\*\*Problem:\*\* ([^\n]+)/g,
    (match, problem) => `
      <div class="solved-example avoid-break">
          <div class="solved-header">
              <div class="solved-icon">
                  <svg width="20" height="20" fill="white" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
              </div>
              <div>
                  <div class="solved-title">✅ Solved Example</div>
                  <div class="solved-subtitle">Complete step-by-step solution</div>
              </div>
          </div>
          <div class="problem-statement">
              <div class="problem-label">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Problem Statement
              </div>
              <div class="problem-content">${problem}</div>
          </div>
    `
  );
  
  // Process Given/Required sections
  processed = processed.replace(
    /\*\*Given:\*\*\n([\s\S]*?)\n\*\*Required:\*\* ([^\n]+)/g,
    (match, given, required) => {
      const givenItems = given.split('\n')
        .filter(line => line.trim() && line.includes('-'))
        .map(line => line.replace(/^- /, '').trim());
      
      const givenHtml = givenItems.map(item => 
        `<div class="given-item">
           <div class="given-bullet"></div>
           <div>${item}</div>
         </div>`
      ).join('');
      
      return `
        <div class="given-required-grid">
            <div class="given-section">
                <div class="section-label given-label">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Given Information
                </div>
                <div class="section-content">${givenHtml}</div>
            </div>
            <div class="required-section">
                <div class="section-label required-label">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                    Required to Find
                </div>
                <div class="section-content">${required}</div>
            </div>
        </div>
      `;
    }
  );
  
  // Process Solution section
  processed = processed.replace(
    /\*\*Solution:\*\*\n([\s\S]*?)\n\*\*Final Answer:\*\* ([^\n]+)/g,
    (match, solution, answer) => `
      <div class="solution-section">
          <div class="solution-label">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
              </svg>
              Step-by-Step Solution
          </div>
          <div>${solution}</div>
      </div>
      <div class="final-answer">
          <div class="answer-label">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              Final Answer
          </div>
          <div class="answer-content">${answer}</div>
      </div>
      </div>
    `
  );
  
  // Process unsolved problems
  let problemCounter = 1;
  processed = processed.replace(
    /\*\*Problem (\d+):\*\* ([^\n]+)\n\*\*Given:\*\* ([^\n]+)\n\*\*Required:\*\* ([^\n]+)/g,
    (match, num, problem, given, required) => {
      const givenItems = given.split(',').map(item => item.trim()).filter(item => item.length > 0);
      const givenHtml = givenItems.map(item => 
        `<div class="given-item">
           <div class="given-bullet"></div>
           <div>${item}</div>
         </div>`
      ).join('');
      
      const result = `
        <div class="unsolved-problem">
            <div class="unsolved-header">
                <div class="unsolved-icon">
                    <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div>
                    <div class="unsolved-title">❓ Problem ${num}</div>
                    <div class="unsolved-subtitle">For students to solve</div>
                </div>
            </div>
            <div class="problem-statement">
                <div class="problem-label">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Problem Statement
                </div>
                <div class="problem-content">${problem}</div>
            </div>
            <div class="given-required-grid">
                <div class="given-section">
                    <div class="section-label given-label">Given</div>
                    <div class="section-content">${givenHtml}</div>
                </div>
                <div class="required-section">
                    <div class="section-label required-label">Required</div>
                    <div class="section-content">${required}</div>
                </div>
            </div>
            <div class="solution-space">
                <div class="solution-space-label">✏️ Student Solution Space</div>
                <div class="solution-lines">
                    <div class="solution-line"></div>
                    <div class="solution-line"></div>
                    <div class="solution-line"></div>
                    <div class="solution-line"></div>
                </div>
            </div>
        </div>
      `;
      
      return result;
    }
  );
  
  // Add separators between questions
  processed = processed.replace(
    /---/g,
    '<div class="question-separator"><div class="separator-line"></div></div>'
  );
  
  return processed;
};

export default { exportBeautifulAssignmentPDF };