/**
 * Lightweight PDF Export - Uses current assignment view
 * Much more efficient than creating heavy HTML structures
 */

export const exportCurrentAssignmentView = async (metadata = {}) => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('PDF export is only available in browser environment');
    }

    const {
      moduleTitle = 'Assignment',
      courseTitle = 'Course Assignment',
      institutionName = 'GCET Kashmir',
      instructorName = 'Dr. Auqib Hamid',
      studentName = '',
      dueDate = null
    } = metadata;

    // Find the assignment content container - try multiple selectors
    let assignmentContainer = document.querySelector('.assignment-viewer, .beautiful-assignment-renderer, .module-assignment-viewer');
    
    // If not found, look for the BeautifulAssignmentRenderer within cards (LearnerAssignmentViewer case)
    if (!assignmentContainer) {
      assignmentContainer = document.querySelector('[class*="beautiful-assignment-renderer"], [class*="assignment-viewer"]');
    }
    
    // Fallback: look for the main assignment content area
    if (!assignmentContainer) {
      const cardContent = document.querySelector('.max-w-6xl');
      if (cardContent) {
        // Look for the card containing assignment problems
        const assignmentCard = Array.from(cardContent.querySelectorAll('.card')).find(card => 
          card.textContent.includes('Assignment Problems') || card.textContent.includes('Assignment Content')
        );
        if (assignmentCard) {
          assignmentContainer = assignmentCard.querySelector('[class*="beautiful-assignment-renderer"], [class*="assignment-content"]') || assignmentCard;
        }
      }
    }
    
    if (!assignmentContainer) {
      throw new Error('Assignment content not found. Please make sure the assignment is loaded.');
    }

    // Clone the assignment content to avoid modifying the original
    const clonedContent = assignmentContainer.cloneNode(true);
    
    // Remove any edit buttons or interactive elements for PDF
    const interactiveElements = clonedContent.querySelectorAll(
      'button, .edit-button, .no-print, [role="button"], .interactive-element, .hover\\:opacity-100'
    );
    interactiveElements.forEach(el => el.remove());

    // Create a minimal print window
    const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    
    if (!printWindow) {
      throw new Error('Please allow popups for PDF export to function properly.');
    }

    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    // Get existing styles from the main document
    const existingStyles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${moduleTitle} - ${courseTitle}</title>
          
          <!-- Import existing Tailwind and custom styles -->
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          
          <style>
            /* Existing styles from the main document */
            ${existingStyles}
            
            /* Print-specific optimizations */
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              body {
                margin: 0;
                padding: 20px;
                font-family: 'Times New Roman', serif;
                background: white;
              }
              
              .page-break-after {
                page-break-after: always;
              }
              
              .page-break-before {
                page-break-before: always;
              }
              
              .no-print {
                display: none !important;
              }
              
              /* Hide interactive elements */
              button, .edit-button, [role="button"] {
                display: none !important;
              }
              
              /* Optimize spacing for print */
              .assignment-content {
                max-width: none !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
            }
            
            /* General styles */
            body {
              line-height: 1.6;
              color: #333;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 1in;
            }
            
            .assignment-header {
              text-align: center;
              margin-bottom: 3rem;
              padding-bottom: 2rem;
            }
            
            .institution-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 2rem;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .assignment-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 1.5rem;
            }
            
            .instructor-info {
              font-size: 16px;
              margin-bottom: 1rem;
            }
            
            .due-date {
              font-size: 16px;
              margin-bottom: 1rem;
            }
            
            .assignment-content {
              margin-top: 2rem;
            }
            
            /* Math rendering styles */
            .katex {
              font-size: 1.1em !important;
            }
            
            .katex-display {
              margin: 1em 0 !important;
              text-align: center !important;
            }
          </style>
      </head>
      <body>
          <!-- Minimalistic Assignment Front Page -->
          <div class="assignment-header">
              <div class="institution-name">Government College of Engineering and Technology Kashmir</div>
              <div class="assignment-title">${moduleTitle}</div>
              <div class="instructor-info">Instructor: ${instructorName}</div>
              ${dueDate ? `<div class="due-date">Due Date: ${formattedDueDate}</div>` : ''}
          </div>
          
          <!-- Assignment Content (from current view) -->
          <div class="assignment-content">
              ${clonedContent.innerHTML}
          </div>
          
          <script>
              // Auto-print when loaded
              window.onload = function() {
                  // Give a moment for styles to load
                  setTimeout(() => {
                      window.print();
                  }, 1000);
              };
              
              // Close window after printing
              window.onafterprint = function() {
                  setTimeout(() => {
                      window.close();
                  }, 1000);
              };
          </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    return true;

  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  }
};

// Alternative: Export using browser's built-in print functionality
export const exportAssignmentAsPDF = async (metadata = {}) => {
  try {
    // Store original title
    const originalTitle = document.title;
    
    // Set document title for PDF
    document.title = `${metadata.moduleTitle || 'Assignment'} - ${metadata.courseTitle || 'Course'}`;
    
    // Hide non-essential elements
    const elementsToHide = document.querySelectorAll(
      '.no-print, button:not(.print-button), .edit-button, .fixed, .sticky, .hover\\:opacity-100, [role="button"]:not(.print-button)'
    );
    
    const originalDisplay = [];
    elementsToHide.forEach((el, index) => {
      originalDisplay[index] = el.style.display;
      el.style.display = 'none';
    });
    
    // Add print styles
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.innerHTML = `
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          margin: 0 !important;
          padding: 20px !important;
          background: white !important;
        }
        
        .assignment-viewer, .beautiful-assignment-renderer {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          max-width: none !important;
        }
        
        .no-print, button, .edit-button, .fixed, .sticky {
          display: none !important;
        }
        
        .page-break-after {
          page-break-after: always !important;
        }
        
        .katex {
          font-size: 1.1em !important;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Trigger print dialog
    window.print();
    
    // Cleanup after printing
    setTimeout(() => {
      // Restore original title
      document.title = originalTitle;
      
      // Remove print styles
      const printStylesEl = document.getElementById('print-styles');
      if (printStylesEl) {
        printStylesEl.remove();
      }
      
      // Restore hidden elements
      elementsToHide.forEach((el, index) => {
        el.style.display = originalDisplay[index];
      });
    }, 1000);
    
    return true;
    
  } catch (error) {
    console.error('Print Export Error:', error);
    throw error;
  }
};