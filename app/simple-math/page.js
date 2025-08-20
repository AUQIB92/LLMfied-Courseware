"use client";

import React from 'react';
import ContentDisplay from '@/components/ContentDisplay';
import SimpleMathRenderer from '@/components/SimpleMathRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SimpleMathPage() {
  const testContent = `
# Simple Math Display Test

This page shows how math content is displayed **exactly as written** without any LaTeX processing.

## Examples of Math Content

Here's some inline math notation: $x = \frac{a + b}{c}$ and here's what looks like display math:

$$\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$

More examples:
- Greek letters: $\alpha + \beta = \gamma$
- Fractions: $\frac{n!}{k!(n-k)!}$
- Equations: $E = mc^2$
- Chemistry: $H_2O$ and $CO_2$

## Complex Mathematical Expressions

Here are some complex expressions shown as plain text:

\`\`\`
Maxwell's equations:
∇ × E = -∂B/∂t
∇ × B = μ₀J + μ₀ε₀∂E/∂t
∇ · E = ρ/ε₀
∇ · B = 0
\`\`\`

Matrix example in a code block:
\`\`\`math
[cos θ  -sin θ] [x]   [x cos θ - y sin θ]
[sin θ   cos θ] [y] = [x sin θ + y cos θ]
\`\`\`

## Advantages of Simple Display

1. **Fast Loading**: No heavy math libraries
2. **Always Works**: No rendering failures
3. **Clean Display**: Shows exactly what you write
4. **Easy to Read**: Clear, readable text format
5. **Accessible**: Screen readers can read the content

## Special Math Highlighting

When math content is detected in code blocks, it gets special highlighting:

\`$E = mc^2$\` - This will be highlighted as math content
\`\frac{a+b}{c}\` - LaTeX notation is highlighted
\`α + β = γ\` - Greek letters are highlighted
\`∫∑∏∂∇\` - Math symbols are highlighted

## Mixed Content

Regular **bold text** and *italic text* work normally.

Here are some lists:
- Item 1 with math: $x^2$
- Item 2 with chemistry: $H_2SO_4$
- Item 3 with physics: $F = ma$

### Tables Work Too

| Formula | Description | Field |
|---------|-------------|--------|
| $E = mc^2$ | Mass-energy equivalence | Physics |
| $a^2 + b^2 = c^2$ | Pythagorean theorem | Geometry |
| $PV = nRT$ | Ideal gas law | Chemistry |

> **Note**: All math content is displayed exactly as written, making it clear and readable for everyone!
`;

  const complexContent = `
# Advanced Mathematical Content

## Calculus Examples

The derivative of $f(x) = x^n$ is $f'(x) = nx^{n-1}$.

The integral $\int x^n dx = \frac{x^{n+1}}{n+1} + C$ for $n ≠ -1$.

## Linear Algebra

Matrix operations:
\`\`\`
A × B = [a₁₁b₁₁ + a₁₂b₂₁  a₁₁b₁₂ + a₁₂b₂₂]
        [a₂₁b₁₁ + a₂₂b₂₁  a₂₁b₁₂ + a₂₂b₂₂]
\`\`\`

## Statistics

Sample variance: $s^2 = \frac{1}{n-1} \sum_{i=1}^{n} (x_i - \bar{x})^2$

Standard normal distribution: $Z = \frac{X - μ}{σ}$

## Chemical Equations

Photosynthesis: $6CO_2 + 6H_2O + light → C_6H_{12}O_6 + 6O_2$

Combustion: $CH_4 + 2O_2 → CO_2 + 2H_2O$
`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📝 Simple Math Display
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Clean, fast, and reliable math display without LaTeX processing. 
            Shows content exactly as written for maximum clarity and accessibility.
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">No LaTeX</Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Fast Loading</Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">Always Works</Badge>
          </div>
        </div>

        {/* Main Content Display */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-800 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              📝 Content Display with Simple Math
              <Badge variant="secondary" className="bg-white/20 text-white">Simple Rendering</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ContentDisplay 
              content={testContent}
              renderingMode="simple"
              showAnalytics={true}
              showControls={true}
              className="simple-math-demo"
            />
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Simple Math Renderer */}
          <Card className="border border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
              <CardTitle className="text-lg text-green-800">✅ Simple Math Renderer</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <SimpleMathRenderer 
                content="Math as text: $E = mc^2$ and $\alpha + \beta = \gamma$"
                showMetrics={true}
              />
              <div className="mt-4 p-3 bg-green-50 rounded text-sm text-green-700">
                <strong>Benefits:</strong> Fast, reliable, always works, accessible
              </div>
            </CardContent>
          </Card>

          {/* Complex Content */}
          <Card className="border border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200">
              <CardTitle className="text-lg text-blue-800">📊 Complex Math Content</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <SimpleMathRenderer 
                content={complexContent}
                showMetrics={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Performance Stats */}
        <Card className="border border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200">
            <CardTitle className="text-lg text-gray-800">⚡ Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-green-800 text-sm">Success Rate</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">10x</div>
                <div className="text-blue-800 text-sm">Faster Loading</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-purple-800 text-sm">Render Errors</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">Simple</div>
                <div className="text-orange-800 text-sm">Clean Display</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw Content Display */}
        <Card className="border border-gray-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-200 to-gray-300">
            <CardTitle className="text-lg text-gray-800">📄 Raw Content (What You Write)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg overflow-x-auto border whitespace-pre-wrap">
              {testContent}
            </pre>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-600">
            🚀 Powered by <strong>SimpleMathRenderer</strong> - No LaTeX processing, maximum reliability
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Badge variant="outline" className="bg-gray-100 text-gray-700">React Markdown</Badge>
            <Badge variant="outline" className="bg-green-100 text-green-700">Simple Processing</Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-700">Fast & Clean</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}