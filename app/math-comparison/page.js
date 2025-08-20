import React from 'react';
import ContentDisplay from '@/components/ContentDisplay';
import EnhancedContentRenderer from '@/components/EnhancedContentRenderer';
import { ProfessionalMathProvider } from '@/components/ProfessionalMathRenderer';

export default function MathComparisonPage() {
  const testContent = `# Mathematical Relations Test

## Introduction to Relations

In mathematics and computer science, a **relation** is a fundamental concept used to describe relationships between elements of sets. Formally, a relation between two sets $A$ and $B$ is a subset of the Cartesian product $A \\times B$.

### Key Definitions

1. **Cartesian Product**: For sets $A = \\{1, 2, 3\\}$ and $B = \\{4, 5, 6\\}$, the Cartesian product is:
   $$A \\times B = \\{(1,4), (1,5), (1,6), (2,4), (2,5), (2,6), (3,4), (3,5), (3,6)\\}$$

2. **Relation**: A relation $R$ from $A$ to $B$ could be:
   $$R = \\{(1, 4), (2, 5), (3, 6)\\}$$

3. **Function**: A special type of relation where each element in the domain maps to exactly one element in the codomain.

### Mathematical Examples

#### Fractions and Equations
The quadratic formula is given by:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

#### Integrals and Limits
The fundamental theorem of calculus states:
$$\\int_a^b f'(x) \\, dx = f(b) - f(a)$$

And the limit definition of a derivative:
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

#### Set Theory
For any sets $A$ and $B$:
- Union: $A \\cup B = \\{x : x \\in A \\text{ or } x \\in B\\}$
- Intersection: $A \\cap B = \\{x : x \\in A \\text{ and } x \\in B\\}$
- Complement: $A^c = \\{x : x \\notin A\\}$

#### Matrix Operations
Given matrices $\\mathbf{A}$ and $\\mathbf{B}$:
$$\\mathbf{AB} = \\begin{bmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{bmatrix} \\begin{bmatrix} b_{11} & b_{12} \\\\ b_{21} & b_{22} \\end{bmatrix} = \\begin{bmatrix} a_{11}b_{11} + a_{12}b_{21} & a_{11}b_{12} + a_{12}b_{22} \\\\ a_{21}b_{11} + a_{22}b_{21} & a_{21}b_{12} + a_{22}b_{22} \\end{bmatrix}$$

### Complex Analysis

The Euler's identity is often called the most beautiful equation in mathematics:
$$e^{i\\pi} + 1 = 0$$

This connects five fundamental mathematical constants: $e$, $i$, $\\pi$, $1$, and $0$.

### Statistics and Probability

The probability density function of a normal distribution:
$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$

Where $\\mu$ is the mean and $\\sigma$ is the standard deviation.

### Physics Applications

Einstein's mass-energy equivalence:
$$E = mc^2$$

And Schrödinger's equation:
$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)$$`;

  return (
    <ProfessionalMathProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Math Rendering Comparison</h1>
            <p className="text-gray-600">LibreTexts-Quality vs Standard Rendering</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Professional Rendering */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                ✨ Professional LibreTexts-Quality
              </div>
              <EnhancedContentRenderer 
                content={testContent}
                showMathControls={true}
                enableInteractive={true}
                showAnalytics={false}
              />
            </div>

            {/* Standard Rendering */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                📝 Standard Rendering
              </div>
              <ContentDisplay 
                content={testContent}
                renderingMode="math-optimized"
                showAnalytics={false}
              />
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-semibold">Feature</th>
                    <th className="px-4 py-2 text-center font-semibold text-green-700">Professional</th>
                    <th className="px-4 py-2 text-center font-semibold text-blue-700">Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3">Rendering Engine</td>
                    <td className="px-4 py-3 text-center">MathJax 3 (SVG)</td>
                    <td className="px-4 py-3 text-center">KaTeX</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Typography Quality</td>
                    <td className="px-4 py-3 text-center">⭐⭐⭐⭐⭐</td>
                    <td className="px-4 py-3 text-center">⭐⭐⭐</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Interactive Features</td>
                    <td className="px-4 py-3 text-center">✅ Zoom, Copy, Menu</td>
                    <td className="px-4 py-3 text-center">❌ Limited</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Chemical Equations</td>
                    <td className="px-4 py-3 text-center">✅ mhchem support</td>
                    <td className="px-4 py-3 text-center">❌ No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Custom Macros</td>
                    <td className="px-4 py-3 text-center">✅ Extensive library</td>
                    <td className="px-4 py-3 text-center">❌ Basic</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Accessibility</td>
                    <td className="px-4 py-3 text-center">✅ Full support</td>
                    <td className="px-4 py-3 text-center">✅ Basic support</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Error Handling</td>
                    <td className="px-4 py-3 text-center">✅ Advanced</td>
                    <td className="px-4 py-3 text-center">⚠️ Basic</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Mobile Responsive</td>
                    <td className="px-4 py-3 text-center">✅ Optimized</td>
                    <td className="px-4 py-3 text-center">✅ Good</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProfessionalMathProvider>
  );
}