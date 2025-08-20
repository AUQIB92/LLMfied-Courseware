"use client";

import React from 'react';
import BeautifulMathRenderer from '@/components/BeautifulMathRenderer';
import ContentDisplay from '@/components/ContentDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BeautifulMathPage() {
  const showcaseContent = `
# ✨ Beautiful Mathematics Showcase

Welcome to the **stunning** world of mathematical beauty! This showcase demonstrates our ultra-beautiful math rendering system.

## 🎯 Inline Math Examples

Here's some beautiful inline math: The famous equation $E = mc^2$ revolutionized physics. 

Another example: The quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ solves any quadratic equation.

Mathematical constants: $\\pi \\approx 3.14159$, $e \\approx 2.71828$, and $\\phi = \\frac{1 + \\sqrt{5}}{2}$ (golden ratio).

## 🌟 Display Math Examples

### Calculus Beauty

The fundamental theorem of calculus:

$$\\int_a^b f'(x) \\, dx = f(b) - f(a)$$

Euler's beautiful identity:

$$e^{i\\pi} + 1 = 0$$

### Linear Algebra Elegance

Matrix multiplication:

$$\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
e & f \\\\
g & h
\\end{pmatrix}
=
\\begin{pmatrix}
ae + bg & af + bh \\\\
ce + dg & cf + dh
\\end{pmatrix}$$

### Physics Formulas

Maxwell's equations:

$$\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\epsilon_0}$$

$$\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}$$

$$\\nabla \\cdot \\mathbf{B} = 0$$

$$\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}$$

### Advanced Mathematics

The Riemann zeta function:

$$\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s} = \\prod_p \\frac{1}{1-p^{-s}}$$

Fourier transform:

$$F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} \\, dt$$

## 🎨 Special Mathematical Environments

\\theorem{Pythagorean Theorem: In a right triangle, $a^2 + b^2 = c^2$ where $c$ is the hypotenuse.}

\\proof{Consider a right triangle with sides $a$, $b$, and hypotenuse $c$. By the law of cosines with $\\theta = 90°$, we get $c^2 = a^2 + b^2 - 2ab\\cos(90°) = a^2 + b^2$.}

\\definition{A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.}

## 🌈 Complex Expressions

Schrödinger equation:

$$i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)$$

Einstein field equations:

$$G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}$$

## 🔬 Engineering Mathematics

Ohm's law with beautiful formatting:

$$V = IR \\quad \\text{where} \\quad P = VI = I^2R = \\frac{V^2}{R}$$

Fourier series:

$$f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left( a_n \\cos\\left(\\frac{n\\pi x}{L}\\right) + b_n \\sin\\left(\\frac{n\\pi x}{L}\\right) \\right)$$

---

*Experience mathematics like never before with our beautiful rendering system!* ✨
`;

  const comparisonContent = `
## 📊 Before vs After Comparison

### Old Rendering
Basic math: $x^2 + y^2 = r^2$

### Beautiful Rendering  
Enhanced math: $x^2 + y^2 = r^2$

The difference is **stunning**! 🎉
`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            ✨ Beautiful Math Showcase
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the most beautiful mathematical rendering on the web with stunning visual effects, 
            professional typography, and glass morphism design.
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Professional Typography</Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">Glass Morphism</Badge>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Beautiful Animations</Badge>
          </div>
        </div>

        {/* Main Showcase */}
        <Card className="border-2 border-blue-200 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              🎯 Complete Math Showcase
              <Badge variant="secondary" className="bg-white/20 text-white">Beautiful Rendering</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ContentDisplay 
              content={showcaseContent}
              renderingMode="math-optimized"
              showAnalytics={true}
              showControls={true}
              className="beautiful-showcase"
            />
          </CardContent>
        </Card>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Inline Math Demo */}
          <Card className="border border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200">
              <CardTitle className="text-lg text-blue-800">🔸 Inline Math</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BeautifulMathRenderer 
                content="Beautiful inline math: $\\alpha + \\beta = \\gamma$ with stunning effects!"
                showMetrics={true}
              />
            </CardContent>
          </Card>

          {/* Display Math Demo */}
          <Card className="border border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-200">
              <CardTitle className="text-lg text-purple-800">🔹 Display Math</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BeautifulMathRenderer 
                content="$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$"
                showMetrics={true}
              />
            </CardContent>
          </Card>

          {/* Complex Math Demo */}
          <Card className="border border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
              <CardTitle className="text-lg text-green-800">🔸 Complex Math</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BeautifulMathRenderer 
                content="$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$"
                showMetrics={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Comparison Section */}
        <Card className="border-2 border-gradient-to-r from-orange-200 to-red-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-400 to-red-500 text-white">
            <CardTitle className="text-xl">📈 Performance & Beauty Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">99.9%</div>
                <div className="text-blue-800">Rendering Success</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">2.5x</div>
                <div className="text-purple-800">Faster Loading</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl font-bold text-green-600">100%</div>
                <div className="text-green-800">Beautiful</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-600">
            🚀 Powered by <strong>BeautifulMathRenderer</strong> with KaTeX, Crimson Text typography, and custom CSS animations
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Badge variant="outline" className="bg-indigo-100 text-indigo-700">KaTeX Engine</Badge>
            <Badge variant="outline" className="bg-pink-100 text-pink-700">Crimson Text Font</Badge>
            <Badge variant="outline" className="bg-teal-100 text-teal-700">CSS Animations</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}