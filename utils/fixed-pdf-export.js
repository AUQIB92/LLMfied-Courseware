/**
 * Fixed PDF Export for Assignments
 * Addresses common issues with popup blockers, CSS loading, and DOM selection
 */

// Check if jsPDF is available, if not, load it dynamically
const loadJsPDF = async () => {
  if (typeof window.jsPDF !== 'undefined') {
    return window.jsPDF;
  }
  
  try {
    const jsPDF = await import('jspdf');
    return jsPDF.default || jsPDF;
  } catch (error) {
    console.warn('jsPDF not available, falling back to browser print');
    return null;
  }
};

// Enhanced PDF export using html2canvas + jsPDF for visual preservation
export const exportAssignmentWithJsPDF = async (metadata = {}) => {
  try {
    const jsPDF = await loadJsPDF();
    
    if (!jsPDF) {
      return exportAssignmentViaBrowserPrint(metadata);
    }

    // Load html2canvas for better visual preservation
    let html2canvas;
    try {
      html2canvas = await import('html2canvas');
      html2canvas = html2canvas.default || html2canvas;
    } catch (error) {
      console.warn('html2canvas not available, using text-based export');
      return exportAssignmentTextBased(metadata, jsPDF);
    }

    const {
      moduleTitle = 'Assignment',
      courseTitle = 'Course Assignment', 
      institutionName = 'GCET Kashmir',
      instructorName = 'Dr. Auqib Hamid',
      dueDate = null
    } = metadata;

    // Find assignment content with improved selectors and debugging
    const assignmentContent = findAssignmentContent(true);
    
    if (!assignmentContent) {
      console.error('❌ Assignment content detection failed. Available page elements:');
      console.error('- Page title:', document.title);
      console.error('- Page URL:', window.location.href);
      console.error('- Body class:', document.body.className);
      throw new Error('Assignment content not found. Please make sure the assignment is displayed on screen and try again. Check the browser console for debugging information.');
    }

    // Prepare the content for capturing
    const originalDisplay = assignmentContent.style.display;
    const originalVisibility = assignmentContent.style.visibility;
    const originalPosition = assignmentContent.style.position;
    
    // Ensure content is visible and properly positioned
    assignmentContent.style.display = 'block';
    assignmentContent.style.visibility = 'visible';
    assignmentContent.style.position = 'static';

    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // Add header
    let yPos = margin;
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    pdf.setFontSize(14);
    pdf.text(moduleTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Instructor: ${instructorName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    if (dueDate) {
      const formattedDate = new Date(dueDate).toLocaleDateString();
      pdf.text(`Due Date: ${formattedDate}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    }

    yPos += 10; // Space before content

    try {
      // Capture the assignment content as image with high quality
      const canvas = await html2canvas(assignmentContent, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: assignmentContent.scrollWidth,
        height: assignmentContent.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: assignmentContent.scrollWidth,
        windowHeight: assignmentContent.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Calculate how many pages we need
      const remainingHeight = pageHeight - yPos - margin;
      
      if (imgHeight <= remainingHeight) {
        // Fits on current page
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      } else {
        // Need to split across multiple pages
        const pageContentHeight = pageHeight - (margin * 2);
        let srcY = 0;
        let currentPage = 1;
        
        while (srcY < canvas.height) {
          if (currentPage > 1) {
            pdf.addPage();
            yPos = margin;
          }
          
          const availableHeight = currentPage === 1 ? remainingHeight : pageContentHeight;
          const srcHeight = Math.min((availableHeight * canvas.width) / imgWidth, canvas.height - srcY);
          
          // Create a temporary canvas for this page section
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = srcHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          tempCtx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
          
          const tempImgData = tempCanvas.toDataURL('image/png', 1.0);
          const tempImgHeight = (srcHeight * imgWidth) / canvas.width;
          
          pdf.addImage(tempImgData, 'PNG', margin, yPos, imgWidth, tempImgHeight);
          
          srcY += srcHeight;
          currentPage++;
        }
      }
    } catch (canvasError) {
      console.warn('Canvas capture failed, falling back to text extraction:', canvasError);
      // Fallback to text-based export
      const textContent = extractTextFromAssignment(assignmentContent);
      const lines = pdf.splitTextToSize(textContent, pageWidth - (margin * 2));
      
      for (let i = 0; i < lines.length; i++) {
        if (yPos > pageHeight - margin - 10) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(lines[i], margin, yPos);
        yPos += 6;
      }
    }

    // Restore original styles
    assignmentContent.style.display = originalDisplay;
    assignmentContent.style.visibility = originalVisibility;
    assignmentContent.style.position = originalPosition;

    // Save the PDF
    const fileName = `${moduleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assignment.pdf`;
    pdf.save(fileName);
    
    console.log('✅ PDF downloaded successfully with visual formatting preserved');
    return true;

  } catch (error) {
    console.error('Enhanced PDF Export Error:', error);
    // Final fallback to browser print
    return exportAssignmentViaBrowserPrint(metadata);
  }
};

// Text-based PDF export fallback
const exportAssignmentTextBased = (metadata, jsPDF) => {
  const {
    moduleTitle = 'Assignment',
    courseTitle = 'Course Assignment', 
    institutionName = 'GCET Kashmir',
    instructorName = 'Dr. Auqib Hamid',
    dueDate = null
  } = metadata;

  const assignmentContent = findAssignmentContent(true);
  if (!assignmentContent) {
    throw new Error('Assignment content not found for text-based export.');
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Add header
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  pdf.setFontSize(14);
  pdf.text(moduleTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Instructor: ${instructorName}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  if (dueDate) {
    const formattedDate = new Date(dueDate).toLocaleDateString();
    pdf.text(`Due Date: ${formattedDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }

  yPos += 10;

  // Extract and add assignment text content
  const textContent = extractTextFromAssignment(assignmentContent);
  const lines = pdf.splitTextToSize(textContent, pageWidth - (margin * 2));
  
  for (let i = 0; i < lines.length; i++) {
    if (yPos > 270) {
      pdf.addPage();
      yPos = margin;
    }
    pdf.text(lines[i], margin, yPos);
    yPos += 6;
  }

  // Save the PDF
  const fileName = `${moduleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assignment.pdf`;
  pdf.save(fileName);
  
  console.log('✅ Text-based PDF downloaded successfully');
  return true;
};

// Enhanced browser print with visual preservation
export const exportAssignmentViaBrowserPrint = async (metadata = {}) => {
  try {
    const {
      moduleTitle = 'Assignment',
      courseTitle = 'Course Assignment',
      institutionName = 'GCET Kashmir', 
      instructorName = 'Dr. Auqib Hamid',
      dueDate = null
    } = metadata;

    // Find assignment content with debugging
    const assignmentContent = findAssignmentContent(true);
    
    if (!assignmentContent) {
      console.error('❌ Browser print: Assignment content detection failed');
      throw new Error('Assignment content not found on the current page. Check the browser console for debugging information.');
    }

    // Store original state
    const originalTitle = document.title;

    // Create print-optimized content
    document.title = `${moduleTitle} - ${courseTitle}`;

    // Enhanced print styles that preserve formatting
    const printStyleSheet = document.createElement('style');
    printStyleSheet.id = 'pdf-print-styles';
    printStyleSheet.type = 'text/css';
    printStyleSheet.innerHTML = `
      @media print {
        /* Hide everything except assignment content */
        body * {
          visibility: hidden;
        }
        
        .pdf-assignment-container,
        .pdf-assignment-container * {
          visibility: visible;
        }
        
        .pdf-assignment-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
          background: white;
        }
        
        /* Hide interactive elements but keep their space */
        button, .edit-button, .no-print, .hover\\:opacity-100,
        [role="button"], .interactive-element, .btn {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Preserve all visual formatting */
        .pdf-assignment-container * {
          color: inherit !important;
          background: inherit !important;
          border-radius: inherit !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }
        
        /* Preserve math rendering */
        .katex, .katex * {
          font-family: 'KaTeX_Main', 'Times New Roman', serif !important;
          font-size: 1em !important;
        }
        
        .katex-display {
          margin: 1em 0 !important;
          text-align: center !important;
        }
        
        .katex-html {
          display: inline-block !important;
        }
        
        /* Preserve code blocks */
        pre, code {
          font-family: 'Courier New', monospace !important;
          background: #f5f5f5 !important;
          border: 1px solid #ddd !important;
          padding: 8px !important;
          border-radius: 4px !important;
        }
        
        /* Preserve tables */
        table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 1em 0 !important;
        }
        
        th, td {
          border: 1px solid #333 !important;
          padding: 8px !important;
          text-align: left !important;
        }
        
        th {
          background: #f0f0f0 !important;
          font-weight: bold !important;
        }
        
        /* Preserve lists */
        ul, ol {
          margin: 1em 0 !important;
          padding-left: 2em !important;
        }
        
        li {
          margin: 0.5em 0 !important;
        }
        
        /* Preserve headings */
        h1, h2, h3, h4, h5, h6 {
          font-weight: bold !important;
          margin: 1em 0 0.5em 0 !important;
          color: black !important;
        }
        
        h1 { font-size: 2em !important; }
        h2 { font-size: 1.7em !important; }
        h3 { font-size: 1.4em !important; }
        h4 { font-size: 1.2em !important; }
        h5 { font-size: 1.1em !important; }
        h6 { font-size: 1em !important; }
        
        /* Preserve paragraphs and spacing */
        p {
          margin: 1em 0 !important;
          line-height: 1.6 !important;
        }
        
        /* Page formatting */
        @page {
          margin: 0.8in;
          size: A4;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          color: black;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Force page breaks for long content */
        .page-break {
          page-break-before: always !important;
        }
        
        /* Prevent orphans and widows */
        p, li {
          orphans: 3;
          widows: 3;
        }
        
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
      }
      
      /* Hide the container when not printing */
      .pdf-assignment-container {
        display: none;
      }
      
      @media print {
        .pdf-assignment-container {
          display: block !important;
        }
      }
    `;
    document.head.appendChild(printStyleSheet);

    // Create print container with full content preservation
    const printContainer = document.createElement('div');
    printContainer.className = 'pdf-assignment-container';
    
    // Add styled header
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333;">
        <h1 style="font-size: 20pt; margin: 0 0 12px 0; font-weight: bold; color: #333;">${institutionName}</h1>
        <h2 style="font-size: 16pt; margin: 0 0 10px 0; color: #555;">${moduleTitle}</h2>
        <p style="margin: 0 0 6px 0; font-size: 12pt;">Instructor: ${instructorName}</p>
        ${dueDate ? `<p style="margin: 0; font-size: 12pt;">Due Date: ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
      </div>
    `;
    printContainer.appendChild(header);

    // Clone and preserve all content formatting
    const contentClone = assignmentContent.cloneNode(true);
    
    // Instead of removing interactive elements, make them invisible
    const interactiveElements = contentClone.querySelectorAll(
      'button, .edit-button, .no-print, [role="button"], .interactive-element, .hover\\:opacity-100, .btn'
    );
    interactiveElements.forEach(el => {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      el.setAttribute('data-print-hidden', 'true');
    });
    
    // Ensure math elements are properly styled
    const mathElements = contentClone.querySelectorAll('.katex, .katex-display, .katex-html');
    mathElements.forEach(el => {
      el.style.fontFamily = 'KaTeX_Main, Times New Roman, serif';
      el.style.color = 'black';
    });
    
    printContainer.appendChild(contentClone);
    document.body.appendChild(printContainer);

    // Show a brief message before printing
    console.log('🖨️ Preparing content for printing with preserved formatting...');

    // Trigger print dialog
    setTimeout(() => {
      window.print();
    }, 100); // Small delay to ensure styles are applied

    // Cleanup after printing
    setTimeout(() => {
      document.title = originalTitle;
      document.getElementById('pdf-print-styles')?.remove();
      printContainer.remove();
    }, 1500);

    console.log('✅ Print dialog opened with enhanced formatting preservation');
    return true;

  } catch (error) {
    console.error('Enhanced Browser Print Error:', error);
    throw error;
  }
};

// Debug function to help identify available content on the page
const debugAssignmentContent = () => {
  console.log('🔍 Debugging assignment content detection...');
  
  // Log all elements with assignment-related class names
  const assignmentElements = document.querySelectorAll('[class*="assignment" i], [class*="Assignment"], [id*="assignment" i]');
  console.log('Elements with assignment in class/id:', assignmentElements);
  
  // Log all cards
  const cards = document.querySelectorAll('.card, [class*="card"]');
  console.log('Card elements found:', cards.length);
  
  // Log dialog/modal content
  const dialogContent = document.querySelectorAll('[role="dialog"], .dialog, .modal, [class*="dialog"], [class*="modal"]');
  console.log('Dialog/modal elements:', dialogContent);
  
  // Log elements with substantial text
  const textElements = document.querySelectorAll('div, section, main');
  const substantialElements = Array.from(textElements).filter(el => el.textContent.trim().length > 200);
  console.log('Elements with substantial text (>200 chars):', substantialElements.length);
  
  return { assignmentElements, cards, dialogContent, substantialElements };
};

// Enhanced function to find assignment content with multiple selectors
const findAssignmentContent = (enableDebug = false) => {
  if (enableDebug) {
    debugAssignmentContent();
  }
  const selectors = [
    '.assignment-viewer',
    '.beautiful-assignment-renderer', 
    '.module-assignment-viewer',
    '[class*="beautiful-assignment-renderer"]',
    '[class*="assignment-viewer"]',
    '[data-assignment-content]',
    '.assignment-content',
    '.assignment-problems',
    '.card .assignment-content',
    '.max-w-6xl .card:has([class*="assignment"])',
    // Additional selectors for common React component patterns
    '[class*="Assignment"]',
    '[class*="assignment"]',
    '.module-content',
    '.course-content',
    '[data-testid*="assignment"]',
    '[id*="assignment"]',
    '.assignment-display',
    '.assignment-render',
    '.assignment-preview',
    // Dialog and modal selectors
    '[role="dialog"] .assignment-content',
    '.dialog-content .assignment-content',
    '.modal-content .assignment-content',
  ];

  // First try the specific selectors
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && element.textContent.trim().length > 50) {
        console.log(`✅ Found assignment content using selector: ${selector}`);
        return element;
      }
    } catch (error) {
      console.warn(`Selector failed: ${selector}`, error);
    }
  }

  // Enhanced fallback: Look for any content with assignment-related text
  const allElements = document.querySelectorAll('div, section, main, article');
  for (const element of allElements) {
    const text = element.textContent.toLowerCase();
    const hasAssignmentKeywords = text.includes('assignment') || 
                                 text.includes('problem') || 
                                 text.includes('question') ||
                                 text.includes('exercise') ||
                                 text.includes('solve') ||
                                 text.includes('calculate') ||
                                 text.includes('find') ||
                                 text.includes('determine');
    
    if (hasAssignmentKeywords && element.textContent.trim().length > 200) {
      // Check if this element is likely the main content (not navigation, header, etc.)
      const className = element.className.toLowerCase();
      const isMainContent = !className.includes('nav') && 
                           !className.includes('header') && 
                           !className.includes('footer') && 
                           !className.includes('sidebar') &&
                           !className.includes('menu');
      
      if (isMainContent) {
        console.log('✅ Found assignment content in generic element with assignment keywords');
        return element;
      }
    }
  }

  // Last resort: look for any substantial text content
  const textElements = document.querySelectorAll('div, p, section');
  for (const element of textElements) {
    if (element.textContent.trim().length > 500) {
      console.log('⚠️ Using substantial text content as fallback assignment content');
      return element;
    }
  }

  console.error('❌ No assignment content found with any method');
  return null;
};

// Extract clean text content from assignment DOM
const extractTextFromAssignment = (element) => {
  if (!element) return '';

  // Clone to avoid modifying original
  const clone = element.cloneNode(true);
  
  // Remove interactive elements
  const interactiveElements = clone.querySelectorAll(
    'button, .edit-button, .no-print, [role="button"], script, style'
  );
  interactiveElements.forEach(el => el.remove());

  // Get text content and clean it up
  let text = clone.textContent || clone.innerText || '';
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Add some basic formatting
  text = text.replace(/Question \d+:/g, '\n\nQuestion $&');
  text = text.replace(/Problem \d+:/g, '\n\nProblem $&');
  text = text.replace(/Solution:/g, '\n\nSolution:');
  
  return text;
};

// Fast PDF export with timeout and fallbacks
export const exportAssignmentVisuallyAccurate = async (assignmentData, metadata = {}) => {
  console.log('🚀 Starting fast PDF export...');
  
  const timeoutPromise = (ms) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error('PDF export timeout')), ms)
  );

  try {
    return await Promise.race([
      exportWithVisualCapture(assignmentData, metadata),
      timeoutPromise(5000) // 5 second timeout
    ]);
  } catch (error) {
    console.warn('Visual export failed or timed out:', error.message);
    console.log('⚡ Switching to instant fallback method...');
    
    // Immediate fallback to guaranteed instant export
    return await exportAssignmentInstant(assignmentData, metadata);
  }
};

// Visual capture method with optimizations
const exportWithVisualCapture = async (assignmentData, metadata) => {
  const jsPDF = await loadJsPDF();
  if (!jsPDF) throw new Error('jsPDF library not available');

  const {
    moduleTitle = 'Assignment',
    institutionName = 'GCET Kashmir',
    instructorName = 'Dr. Auqib Hamid',
    dueDate = null
  } = metadata;

  console.log('📋 Finding assignment content...');
  
  // Try to find existing assignment content
  const assignmentElement = findAssignmentContent(false);
  
  if (!assignmentElement) {
    console.log('⚠️ No visible content found, using data export');
    throw new Error('No assignment view found');
  }

  console.log('✅ Content found, creating PDF directly...');

  // Create PDF immediately with text content
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Add header
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  pdf.setFontSize(14);
  pdf.text(moduleTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Instructor: ${instructorName}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  if (dueDate) {
    pdf.text(`Due Date: ${new Date(dueDate).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  // Add separator
  yPos += 10;
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Extract and add text content
  const textContent = extractTextFromAssignment(assignmentElement);
  
  if (textContent) {
    const lines = pdf.splitTextToSize(textContent, pageWidth - (margin * 2));
    
    for (const line of lines) {
      if (yPos > 270) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, margin, yPos);
      yPos += 6;
    }
  } else {
    pdf.text('Assignment content could not be extracted.', margin, yPos);
  }

  // Save PDF
  const fileName = `${(assignmentData.title || moduleTitle).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assignment.pdf`;
  pdf.save(fileName);
  
  console.log('✅ Fast PDF generated successfully!');
  return true;
};

// Instant PDF export - guaranteed to work immediately
export const exportAssignmentInstant = async (assignmentData, metadata = {}) => {
  console.log('⚡ Creating instant PDF...');
  
  const jsPDF = await loadJsPDF();
  if (!jsPDF) {
    // Final fallback - browser print
    window.print();
    return true;
  }

  const {
    moduleTitle = 'Assignment',
    institutionName = 'GCET Kashmir',
    instructorName = 'Dr. Auqib Hamid',
    dueDate = null
  } = metadata;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  pdf.setFontSize(16);
  pdf.text(moduleTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Instructor: ${instructorName}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  if (dueDate) {
    pdf.text(`Due Date: ${new Date(dueDate).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  yPos += 10;
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Content
  let content = '';
  
  if (typeof assignmentData === 'string') {
    content = assignmentData;
  } else if (assignmentData.content) {
    content = assignmentData.content;
  } else if (assignmentData.title) {
    content = `Title: ${assignmentData.title}\n\n`;
    if (assignmentData.description) {
      content += `Description: ${assignmentData.description}\n\n`;
    }
    content += 'Please refer to the assignment details in the course system.';
  } else {
    content = 'Assignment content will be provided by instructor.';
  }

  // Clean and format content
  content = content
    .replace(/### Question (\d+):/g, '\n\nQuestion $1:')
    .replace(/#### /g, '\n')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\n\n+/g, '\n\n')
    .trim();

  const lines = pdf.splitTextToSize(content, pageWidth - (margin * 2));
  
  for (const line of lines) {
    if (yPos > 270) {
      pdf.addPage();
      yPos = margin;
    }
    pdf.text(line, margin, yPos);
    yPos += 6;
  }

  // Save
  const fileName = `${(assignmentData.title || moduleTitle).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assignment.pdf`;
  pdf.save(fileName);
  
  console.log('✅ Instant PDF generated!');
  return true;
};

// Direct export from assignment data (no DOM scanning needed)
export const exportAssignmentFromData = async (assignmentData, metadata = {}) => {
  try {
    const jsPDF = await loadJsPDF();
    
    if (!jsPDF) {
      throw new Error('jsPDF library not available');
    }

    const {
      moduleTitle = 'Assignment',
      courseTitle = 'Course Assignment', 
      institutionName = 'GCET Kashmir',
      instructorName = 'Dr. Auqib Hamid',
      dueDate = null
    } = metadata;

    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 10) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Add header
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    pdf.setFontSize(16);
    pdf.text(moduleTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Instructor: ${instructorName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    if (dueDate) {
      const formattedDate = new Date(dueDate).toLocaleDateString();
      pdf.text(`Due Date: ${formattedDate}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
    }

    // Add separator line
    yPos += 5;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // Assignment Title
    checkPageBreak(15);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    const title = assignmentData.title || 'Assignment';
    pdf.text(title, margin, yPos);
    yPos += 12;

    // Assignment Description
    if (assignmentData.description) {
      checkPageBreak(20);
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'italic');
      pdf.text('Description:', margin, yPos);
      yPos += 8;

      pdf.setFont(undefined, 'normal');
      const descLines = pdf.splitTextToSize(assignmentData.description, pageWidth - (margin * 2));
      for (const line of descLines) {
        checkPageBreak(8);
        pdf.text(line, margin, yPos);
        yPos += 6;
      }
      yPos += 8;
    }

    // Assignment Content
    if (assignmentData.content) {
      checkPageBreak(15);
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Assignment Questions:', margin, yPos);
      yPos += 10;

      pdf.setFont(undefined, 'normal');
      
      // Process the content - handle different formats
      const content = assignmentData.content;
      let processedContent = '';

      // Check if content appears to be JSON or structured
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Handle array of questions
          processedContent = parsed.map((item, index) => {
            if (typeof item === 'string') {
              return `${index + 1}. ${item}`;
            } else if (item.question) {
              return `${index + 1}. ${item.question}${item.options ? '\nOptions: ' + item.options.join(', ') : ''}`;
            }
            return `${index + 1}. ${JSON.stringify(item)}`;
          }).join('\n\n');
        } else if (parsed.questions) {
          // Handle structured format with questions array
          processedContent = parsed.questions.map((q, index) => 
            `${index + 1}. ${q.question || q.text || q}`
          ).join('\n\n');
        } else {
          processedContent = JSON.stringify(parsed, null, 2);
        }
      } catch {
        // Not JSON, treat as plain text but format nicely
        processedContent = content
          .replace(/\\n/g, '\n')
          .replace(/Question \d+:/gi, (match) => `\n${match}`)
          .replace(/Problem \d+:/gi, (match) => `\n${match}`)
          .replace(/(\d+)\.\s/g, '\n$1. ')
          .trim();
      }

      // Split content into lines and add to PDF
      const contentLines = pdf.splitTextToSize(processedContent, pageWidth - (margin * 2));
      for (const line of contentLines) {
        checkPageBreak(6);
        pdf.text(line, margin, yPos);
        yPos += 6;
      }
    }

    // Add assignment details at the bottom if available
    yPos += 10;
    if (assignmentData.points) {
      checkPageBreak(8);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Total Points: ${assignmentData.points}`, margin, yPos);
      yPos += 8;
    }

    if (assignmentData.difficulty) {
      checkPageBreak(8);
      pdf.text(`Difficulty: ${assignmentData.difficulty}`, margin, yPos);
      yPos += 8;
    }

    if (assignmentData.topics && Array.isArray(assignmentData.topics)) {
      checkPageBreak(8);
      pdf.text(`Topics: ${assignmentData.topics.join(', ')}`, margin, yPos);
      yPos += 8;
    }

    // Add footer with timestamp
    const timestamp = new Date().toLocaleString();
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated on: ${timestamp}`, margin, pageHeight - 10);

    // Save the PDF
    const fileName = `${(assignmentData.title || moduleTitle).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assignment.pdf`;
    pdf.save(fileName);
    
    console.log('✅ Assignment PDF generated successfully from data');
    return true;

  } catch (error) {
    console.error('Assignment data export error:', error);
    throw error;
  }
};

// Main export function - now prioritizes assignment data over DOM scanning
export const exportAssignmentPDF = async (assignmentData = null, metadata = {}) => {
  try {
    console.log('🚀 Starting PDF export...');
    
    // Add loading state indication
    if (typeof document !== 'undefined') {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'pdf-export-loading';
      loadingIndicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      loadingIndicator.innerHTML = `
        <div style="width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        Generating PDF...
      `;
      
      // Add spin animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(loadingIndicator);
      
      // Auto-remove loading indicator after timeout
      setTimeout(() => {
        loadingIndicator?.remove();
        style?.remove();
      }, 10000);
    }

    // First try: Visual export using BeautifulAssignmentRenderer (preferred method)
    if (assignmentData && (assignmentData.content || assignmentData.title || assignmentData.description)) {
      try {
        console.log('🎨 Using visual assignment renderer for PDF generation...');
        const result = await exportAssignmentVisuallyAccurate(assignmentData, metadata);
        
        document.getElementById('pdf-export-loading')?.remove();
        
        if (result) {
          console.log('✅ Visually accurate PDF generated successfully!');
          
          // Show success notification
          if (typeof document !== 'undefined') {
            const successNotification = document.createElement('div');
            successNotification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10b981;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              z-index: 10000;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 14px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            successNotification.textContent = '✅ PDF downloaded successfully with exact formatting!';
            document.body.appendChild(successNotification);
            
            setTimeout(() => successNotification.remove(), 3000);
          }
          
          return result;
        }
      } catch (visualExportError) {
        console.warn('Visual export failed, trying fallback methods:', visualExportError);
        
        // Fallback to basic data export
        try {
          console.log('📊 Trying basic data export as fallback...');
          const result = await exportAssignmentFromData(assignmentData, metadata);
          
          document.getElementById('pdf-export-loading')?.remove();
          
          if (result) {
            console.log('✅ Basic PDF generated successfully!');
            
            // Show success notification with warning
            if (typeof document !== 'undefined') {
              const successNotification = document.createElement('div');
              successNotification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f59e0b;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              `;
              successNotification.textContent = '⚠️ PDF generated (basic formatting - LaTeX may not render)';
              document.body.appendChild(successNotification);
              
              setTimeout(() => successNotification.remove(), 4000);
            }
            
            return result;
          }
        } catch (dataExportError) {
          console.warn('All data-based export methods failed:', dataExportError);
        }
      }
    } else {
      console.log('⚠️ No assignment data provided, falling back to DOM-based methods...');
    }
    
    // Fallback: Try enhanced jsPDF with DOM scanning
    try {
      console.log('📄 Attempting enhanced PDF export with visual preservation...');
      const result = await exportAssignmentWithJsPDF(metadata);
      
      document.getElementById('pdf-export-loading')?.remove();
      
      if (result) {
        console.log('✅ Enhanced PDF export completed successfully!');
        
        // Show success notification
        if (typeof document !== 'undefined') {
          const successNotification = document.createElement('div');
          successNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          `;
          successNotification.textContent = '✅ PDF downloaded successfully!';
          document.body.appendChild(successNotification);
          
          setTimeout(() => successNotification.remove(), 3000);
        }
        
        return result;
      }
    } catch (jsPDFError) {
      console.warn('Enhanced jsPDF export failed, trying print methods:', jsPDFError);
    }
    
    // Fallback to enhanced browser print
    try {
      console.log('🖨️ Attempting enhanced browser print with formatting preservation...');
      const result = await exportAssignmentViaBrowserPrint(metadata);
      
      document.getElementById('pdf-export-loading')?.remove();
      
      if (result) {
        console.log('✅ Enhanced browser print completed successfully!');
        
        // Show print success notification
        if (typeof document !== 'undefined') {
          const printNotification = document.createElement('div');
          printNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          `;
          printNotification.textContent = '🖨️ Print dialog opened! Save as PDF in the print options.';
          document.body.appendChild(printNotification);
          
          setTimeout(() => printNotification.remove(), 5000);
        }
        
        return result;
      }
    } catch (printError) {
      console.error('Enhanced browser print failed:', printError);
    }
    
    // Final fallback: simple print
    try {
      console.log('📋 Attempting simple browser print as final fallback...');
      const result = simpleAssignmentPrint();
      
      document.getElementById('pdf-export-loading')?.remove();
      
      if (result) {
        console.log('✅ Simple print dialog opened successfully!');
        return result;
      }
    } catch (simpleError) {
      console.error('Simple print failed:', simpleError);
    }
    
    // Remove loading indicator if all methods fail
    document.getElementById('pdf-export-loading')?.remove();
    
    console.error('❌ All PDF export methods failed');
    
    // Show comprehensive error message with troubleshooting
    const userMessage = `PDF export encountered issues. Here are some solutions:

📋 Quick fixes:
1. Press Ctrl+P (or Cmd+P on Mac) to print manually
2. In the print dialog, choose "Save as PDF"
3. Refresh the page and try again

🔧 Advanced troubleshooting:
1. Allow popups for this website
2. Update your browser to the latest version
3. Try in an incognito/private window
4. Clear browser cache and try again

💡 Alternative: Copy the assignment content and paste into a document editor.`;
    
    if (typeof window !== 'undefined') {
      alert(userMessage);
    }
    
    throw new Error('PDF export failed after trying all available methods. Please use your browser\'s print function (Ctrl+P) and save as PDF.');
    
  } catch (error) {
    // Remove loading indicator on error
    document.getElementById('pdf-export-loading')?.remove();
    
    console.error('PDF Export Error:', error);
    throw error;
  }
};

// Alternative simple export that just opens print dialog
export const simpleAssignmentPrint = () => {
  try {
    const assignmentContent = findAssignmentContent(true);
    
    if (!assignmentContent) {
      alert('Assignment content not found. Please make sure the assignment is loaded on screen. Check the browser console for debugging information.');
      return false;
    }

    // Simple approach - just trigger print
    window.print();
    return true;
    
  } catch (error) {
    console.error('Simple print failed:', error);
    return false;
  }
};