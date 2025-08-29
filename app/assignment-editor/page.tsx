"use client"

import React, { useState } from 'react'
import EditableAssignmentRenderer from '@/components/ui/editable-assignment-renderer'

const AssignmentEditorPage = () => {
  const [savedContent, setSavedContent] = useState<string>("")

  const handleSave = (content: any) => {
    console.log('Saving assignment:', content)
    setSavedContent(JSON.stringify(content, null, 2))
    
    // Here you would typically save to a database or localStorage
    localStorage.setItem('assignment-draft', JSON.stringify(content))
  }

  const handleExport = (content: any) => {
    console.log('Exporting assignment:', content)
    
    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Assignment - ${content.title}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              max-width: 8.5in; 
              margin: 0 auto; 
              padding: 1in;
              line-height: 1.6;
            }
            .math { font-family: 'KaTeX_Main', 'Times New Roman', serif; }
            .question { page-break-inside: avoid; margin-bottom: 2em; }
            .front-page { page-break-after: always; }
            @media print { 
              body { margin: 0; padding: 0.5in; } 
              .no-print { display: none !important; }
            }
          </style>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
        </head>
        <body>
          <div class="front-page">
            <div style="border: 4px solid black; padding: 2em; text-align: center;">
              <h1>GCET KASHMIR</h1>
              <h2>Government College of Engineering and Technology</h2>
              <hr>
              <h2 style="margin: 2em 0;">${content.title}</h2>
              <div style="text-align: left; margin: 2em 0;">
                <p>Name: _________________________</p>
                <p>Enrollment: ____________________</p>
                <p>Date: __________________________</p>
                <p>Total Marks: ${content.questions?.reduce((total: number, q: any) => 
                  total + (q.marks || 0) + q.unsolvedProblems?.reduce((subTotal: number, p: any) => subTotal + (p.marks || 0), 0), 0) || 0}</p>
              </div>
            </div>
          </div>
          <div class="assignment-content">
            ${content.questions?.map((q: any, i: number) => `
              <div class="question">
                <h3>${q.number}. ${q.title} ${q.marks ? `[${q.marks} marks]` : ''}</h3>
                ${q.solvedExample?.problem ? `
                  <div style="background: #f5f5f5; padding: 1em; margin: 1em 0;">
                    <h4>Worked Example:</h4>
                    <p>${q.solvedExample.problem}</p>
                    <p><strong>Solution:</strong> ${q.solvedExample.solution}</p>
                    <p><strong>Answer:</strong> ${q.solvedExample.answer}</p>
                  </div>
                ` : ''}
                ${q.unsolvedProblems?.map((p: any, j: number) => `
                  <div style="margin: 1em 0;">
                    <p><strong>(${String.fromCharCode(97 + j)})</strong> ${p.problem} ${p.marks ? `[${p.marks} marks]` : ''}</p>
                  </div>
                `).join('') || ''}
              </div>
            `).join('') || ''}
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const sampleContent = `# Advanced Calculus Assignment

## Instructions for Students
- Read all questions carefully before starting
- Show all work step by step
- Use proper mathematical notation
- Time limit: 3 hours

### Question 1: Limits and Continuity
**Source Reference:** Stewart Calculus, Chapter 2

**Problem:** Find the limit of (x^2 - 4)/(x - 2) as x approaches 2

**Given:**
- Function: f(x) = (x^2 - 4)/(x - 2)
- We need to find lim(x->2) f(x)

**Required:** Evaluate the limit using algebraic manipulation

**Solution:**
First, factor the numerator:
x^2 - 4 = (x + 2)(x - 2)

So: (x^2 - 4)/(x - 2) = (x + 2)(x - 2)/(x - 2) = x + 2 (for x ≠ 2)

Therefore: lim(x->2) (x^2 - 4)/(x - 2) = lim(x->2) (x + 2) = 2 + 2 = 4

**Final Answer:** 4

**Problem 1:** Find lim(x->3) (x^2 - 9)/(x - 3)
**Problem 2:** Determine if f(x) = {x^2 if x ≤ 1; 2x if x > 1} is continuous at x = 1`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Assignment Editor</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create and edit mathematical assignments with LaTeX support. Click "Edit" to modify content, 
            use the LaTeX helper for mathematical notation, and export as PDF when ready.
          </p>
        </div>

        <EditableAssignmentRenderer
          initialContent={sampleContent}
          onSave={handleSave}
          onExport={handleExport}
          className="bg-white shadow-lg rounded-lg p-8"
        />

        {/* Debug/Save Panel */}
        {savedContent && (
          <div className="mt-8 p-6 bg-gray-900 text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Last Saved Content (JSON)</h3>
            <pre className="text-xs overflow-auto max-h-64 bg-gray-800 p-4 rounded">
              {savedContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignmentEditorPage