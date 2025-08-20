/**
 * Math Showcase Component
 * 
 * Demonstrates the professional LibreTexts-quality math rendering
 * capabilities with various mathematical content types
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnhancedContentRenderer from './EnhancedContentRenderer';
import { ProfessionalMathProvider } from './ProfessionalMathRenderer';

const MathShowcase = () => {
  const showcaseItems = [
    {
      title: "Basic Mathematics",
      badge: "Elementary",
      content: `
### Linear Equations
The slope-intercept form of a line: $y = mx + b$

### Quadratic Formula
For equation $ax^2 + bx + c = 0$, the solutions are:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
      `
    },
    {
      title: "Calculus",
      badge: "Advanced",
      content: `
### Derivatives
The derivative of $f(x) = x^n$ is:
$$f'(x) = nx^{n-1}$$

### Integrals
The fundamental theorem of calculus:
$$\\int_a^b f'(x) \\, dx = f(b) - f(a)$$

### Limits
$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$
      `
    },
    {
      title: "Linear Algebra",
      badge: "Matrices",
      content: `
### Matrix Multiplication
$$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} \\begin{bmatrix} e & f \\\\ g & h \\end{bmatrix} = \\begin{bmatrix} ae+bg & af+bh \\\\ ce+dg & cf+dh \\end{bmatrix}$$

### Determinant
$$\\det(A) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc$$

### Eigenvalues
For matrix $A$, eigenvalues $\\lambda$ satisfy:
$$\\det(A - \\lambda I) = 0$$
      `
    },
    {
      title: "Statistics",
      badge: "Probability",
      content: `
### Normal Distribution
The probability density function:
$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$

### Bayes' Theorem
$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

### Central Limit Theorem
$$\\bar{X}_n \\sim N\\left(\\mu, \\frac{\\sigma^2}{n}\\right)$$
      `
    },
    {
      title: "Complex Analysis",
      badge: "Advanced",
      content: `
### Euler's Identity
$$e^{i\\pi} + 1 = 0$$

### Complex Numbers
$$z = r e^{i\\theta} = r(\\cos\\theta + i\\sin\\theta)$$

### Cauchy-Riemann Equations
$$\\frac{\\partial u}{\\partial x} = \\frac{\\partial v}{\\partial y}, \\quad \\frac{\\partial u}{\\partial y} = -\\frac{\\partial v}{\\partial x}$$
      `
    },
    {
      title: "Set Theory",
      badge: "Logic",
      content: `
### Set Operations
- Union: $A \\cup B = \\{x : x \\in A \\text{ or } x \\in B\\}$
- Intersection: $A \\cap B = \\{x : x \\in A \\text{ and } x \\in B\\}$
- Complement: $A^c = \\{x : x \\notin A\\}$

### Power Set
If $|A| = n$, then $|\\mathcal{P}(A)| = 2^n$

### Cartesian Product
$$A \\times B = \\{(a,b) : a \\in A \\text{ and } b \\in B\\}$$
      `
    }
  ];

  const getBadgeColor = (badge) => {
    const colors = {
      'Elementary': 'bg-green-100 text-green-800',
      'Advanced': 'bg-red-100 text-red-800',
      'Matrices': 'bg-blue-100 text-blue-800',
      'Probability': 'bg-purple-100 text-purple-800',
      'Logic': 'bg-orange-100 text-orange-800'
    };
    return colors[badge] || 'bg-gray-100 text-gray-800';
  };

  return (
    <ProfessionalMathProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Math Rendering Showcase
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              LibreTexts-Quality Mathematical Typography
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge className="bg-blue-500 text-white">MathJax 3 Engine</Badge>
              <Badge className="bg-green-500 text-white">Interactive Features</Badge>
              <Badge className="bg-purple-500 text-white">Professional Typography</Badge>
              <Badge className="bg-orange-500 text-white">Accessibility Ready</Badge>
            </div>
          </div>

          {/* Math Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseItems.map((item, index) => (
              <Card key={index} className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {item.title}
                    </CardTitle>
                    <Badge className={getBadgeColor(item.badge)}>
                      {item.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <EnhancedContentRenderer
                    content={item.content}
                    showMathControls={true}
                    enableInteractive={true}
                    className="text-sm"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Highlights */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="text-3xl mb-4">🎨</div>
              <h3 className="font-semibold mb-2">Beautiful Typography</h3>
              <p className="text-sm text-gray-600">Professional academic-quality math rendering</p>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-semibold mb-2">Interactive Features</h3>
              <p className="text-sm text-gray-600">Zoom, copy, and context menus</p>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="font-semibold mb-2">Responsive Design</h3>
              <p className="text-sm text-gray-600">Optimized for all screen sizes</p>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl mb-4">♿</div>
              <h3 className="font-semibold mb-2">Accessibility</h3>
              <p className="text-sm text-gray-600">Screen reader and high contrast support</p>
            </Card>
          </div>

          {/* Complex Example */}
          <Card className="mt-12 p-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center mb-6">
                Complex Mathematical Example
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedContentRenderer
                content={`
## Maxwell's Equations

The four fundamental equations of electromagnetism:

### Gauss's Law
$$\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}$$

### Gauss's Law for Magnetism
$$\\nabla \\cdot \\mathbf{B} = 0$$

### Faraday's Law
$$\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}$$

### Ampère-Maxwell Law
$$\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}$$

These equations can be combined to derive the wave equation:
$$\\nabla^2 \\mathbf{E} - \\mu_0 \\varepsilon_0 \\frac{\\partial^2 \\mathbf{E}}{\\partial t^2} = 0$$

where the wave speed is $c = \\frac{1}{\\sqrt{\\mu_0 \\varepsilon_0}}$.
                `}
                showMathControls={true}
                enableInteractive={true}
                showAnalytics={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfessionalMathProvider>
  );
};

export default MathShowcase;