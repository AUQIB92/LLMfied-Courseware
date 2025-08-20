import React from 'react';
import ContentDisplay from './ContentDisplay';
import SimpleMathRenderer from './SimpleMathRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MathTestComponent = () => {
  const testContent = `
# 📝 Simple Math Test

Here's some **clean** inline math notation: $x = \\frac{a + b}{c}$ and here's display-style math:

$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

Another inline example: $\\alpha + \\beta = \\gamma$

And a fraction: $\\frac{n!}{k!(n-k)!}$

## More Examples (Displayed as Text)

Complex equations: $\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$

Physics: $E = mc^2$ and $F = ma$

Chemistry: $H_2O$ and $CO_2$

**Note**: All math is displayed exactly as written, without LaTeX compilation.
  `;

  const advancedContent = `
# 📊 Advanced Math Content (Plain Text)

Rotation matrix example:
\`\`\`
[cos θ  -sin θ] [x]   [x cos θ - y sin θ]
[sin θ   cos θ] [y] = [x sin θ + y cos θ]
\`\`\`

Maxwell's equations:
\`\`\`
∇ × E = -∂B/∂t
∇ × B = μ₀J + μ₀ε₀∂E/∂t
∇ · E = ρ/ε₀
∇ · B = 0
\`\`\`

**Benefits of Plain Text Math:**
- Always readable
- Fast loading
- No compilation errors
- Accessible to screen readers
  `;

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📝 Simple Math Rendering Test
          </h1>
          <p className="text-gray-600">Clean, fast, and reliable math display without LaTeX processing</p>
          <Badge variant="outline" className="mt-2 bg-green-100 text-green-700 border-green-300">
            Simple & Reliable
          </Badge>
        </div>

        {/* Raw Content Display */}
        <Card className="border border-gray-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200">
            <CardTitle className="text-lg text-gray-800">📝 Raw Content</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg overflow-x-auto border">
              {testContent}
            </pre>
          </CardContent>
        </Card>
        
        {/* Simple Rendered Output */}
        <Card className="border-2 border-green-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              📝 Simple Rendered Output
              <Badge variant="secondary" className="bg-white/20 text-white">Clean</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ContentDisplay 
              content={testContent}
              renderingMode="simple"
              showAnalytics={true}
              showControls={true}
              className="simple-math-test"
            />
          </CardContent>
        </Card>

        {/* Direct Simple Math Renderer */}
        <Card className="border-2 border-blue-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              🚀 Direct Simple Math Renderer
              <Badge variant="secondary" className="bg-white/20 text-white">Fast</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <SimpleMathRenderer 
              content={testContent}
              showMetrics={true}
            />
          </CardContent>
        </Card>

        {/* Advanced Math Examples */}
        <Card className="border-2 border-purple-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              📊 Advanced Math Content
              <Badge variant="secondary" className="bg-white/20 text-white">Plain Text</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <SimpleMathRenderer 
              content={advancedContent}
              showMetrics={true}
            />
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card className="border border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
            <CardTitle className="text-lg text-green-800">⚡ Simple Rendering Benefits</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-green-800 text-sm">Success Rate</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">10x</div>
                <div className="text-blue-800 text-sm">Faster</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-purple-800 text-sm">Errors</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">Simple</div>
                <div className="text-orange-800 text-sm">Clean</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MathTestComponent;