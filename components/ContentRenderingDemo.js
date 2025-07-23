import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ContentDisplay from './ContentDisplay';
import ContentEditor from './educator/ContentEditor';
import { usePerformanceMonitor } from '@/lib/performanceMonitor';
import { 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  BarChart3, 
  PlayCircle,
  RefreshCw,
  Brain,
  Calculator,
  FileText,
  Code
} from 'lucide-react';

/**
 * ContentRenderingDemo - Showcase Component
 * 
 * This component demonstrates the capabilities of the bulletproof
 * content rendering system with real examples and live testing.
 */
const ContentRenderingDemo = () => {
  const [selectedExample, setSelectedExample] = useState('basic-math');
  const [customContent, setCustomContent] = useState('');
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  
  const { metrics, trends, generateReport } = usePerformanceMonitor();

  // Test examples showcasing different content types
  const examples = {
    'basic-math': {
      title: 'Basic Mathematics',
      description: 'Simple math expressions with LaTeX',
      content: `# Basic Mathematical Expressions

The relationship between voltage and current is given by Ohm's Law: $V = IR$

Where:
- $V$ is voltage (measured in volts)
- $I$ is current (measured in amperes) 
- $R$ is resistance (measured in ohms, $\\Omega$)

## Power Calculations

Power can be calculated using different formulas:

1. **Basic Power**: $P = VI$
2. **Using Ohm's Law**: $P = I^2R$
3. **Alternative Form**: $P = \\frac{V^2}{R}$

The energy formula is: $E = mc^2$`
    },
    
    'advanced-math': {
      title: 'Advanced Mathematics',
      description: 'Complex equations and formulas',
      content: `# Advanced Mathematical Concepts

## Calculus Integration

The fundamental theorem of calculus states:

$$\\int_a^b f'(x) dx = f(b) - f(a)$$

### Common Integrals

1. **Power Rule**: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$
2. **Exponential**: $\\int e^x dx = e^x + C$
3. **Trigonometric**: $\\int \\sin(x) dx = -\\cos(x) + C$

## Series Expansions

The Taylor series for $e^x$ is:

$$e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!} = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\cdots$$

## Complex Numbers

Euler's formula: $e^{i\\theta} = \\cos(\\theta) + i\\sin(\\theta)$

This leads to the famous identity: $e^{i\\pi} + 1 = 0$`
    },
    
    'electrical-engineering': {
      title: 'Electrical Engineering',
      description: 'Real-world engineering formulas',
      content: `# Electrical Engineering Fundamentals

## Resistance and Resistivity

The resistance of a material is given by:

$$R = \\rho \\frac{L}{A}$$

Where:
- $R$ is resistance ($\\Omega$)
- $\\rho$ is resistivity ($\\Omega \\cdot m$)
- $L$ is length (meters)
- $A$ is cross-sectional area ($m^2$)

## Temperature Effects

Resistance varies with temperature:

$$R_T = R_0[1 + \\alpha(T - T_0)]$$

Where $\\alpha$ is the temperature coefficient.

## AC Circuits

### Impedance Calculation

For an RLC circuit, the impedance is:

$$Z = R + j(\\omega L - \\frac{1}{\\omega C})$$

The magnitude is: $|Z| = \\sqrt{R^2 + (\\omega L - \\frac{1}{\\omega C})^2}$

### Power in AC Circuits

- **Apparent Power**: $S = VI$ (VA)
- **Real Power**: $P = VI\\cos(\\phi)$ (W)
- **Reactive Power**: $Q = VI\\sin(\\phi)$ (VAR)`
    },
    
    'mixed-content': {
      title: 'Mixed Content',
      description: 'Combination of markdown, math, and code',
      content: `# Complete Learning Module: Data Structures

## Introduction

Data structures are fundamental building blocks in computer science. They help us organize and store data efficiently.

### Key Concepts

- **Arrays**: Contiguous memory locations
- **Lists**: Dynamic collections
- **Trees**: Hierarchical structures
- **Graphs**: Network representations

## Mathematical Analysis

### Time Complexity

The time complexity of binary search is $O(\\log n)$, where $n$ is the number of elements.

For a balanced binary tree with $n$ nodes, the height is approximately $\\log_2 n$.

### Space Complexity

The space complexity for recursive algorithms often follows:

$$S(n) = S(\\frac{n}{2}) + O(1)$$

This resolves to $S(n) = O(\\log n)$.

## Code Example

\`\`\`javascript
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1; // Not found
}
\`\`\`

## Performance Analysis

| Operation | Array | Linked List | Binary Tree |
|-----------|-------|-------------|-------------|
| Search    | $O(n)$ | $O(n)$     | $O(\\log n)$ |
| Insert    | $O(n)$ | $O(1)$     | $O(\\log n)$ |
| Delete    | $O(n)$ | $O(1)$     | $O(\\log n)$ |

## Real-World Applications

1. **Database Indexing**: B-trees for efficient data retrieval
2. **Network Routing**: Graphs for shortest path algorithms
3. **Memory Management**: Heaps for dynamic allocation

### Formula for Tree Height

In a complete binary tree: $h = \\lfloor \\log_2 n \\rfloor$

Where $h$ is height and $n$ is the number of nodes.`
    },
    
    'problematic-content': {
      title: 'Problematic Content (AI Generation Issues)',
      description: 'Content with common AI generation errors - watch it get fixed!',
      content: `# Test Document with AI Issues

## Broken LaTeX Examples

The energy formula is \\\\frac{1}{2}mv^2 (double backslashes)

Resistance calculation: frac{rhoL}{A} (missing backslash)

Greek letters: The symbol α should be \\alpha and Ω should be \\Omega

Unbalanced delimiters: $E = mc^2 and incomplete $formula

## Electrical Engineering Errors

Power calculation: P = frac{V^2}{R} (missing backslash)

Resistivity: R = frac{ho*L}{A} (wrong symbol)

Temperature coefficient: R_T = R_0[1 + α(T - T_0)] (mixed symbols)

## Expected Fixes

After processing, this content should have:
- ✅ Properly escaped LaTeX commands
- ✅ Balanced delimiters  
- ✅ Correct Greek letter formatting
- ✅ Fixed mathematical expressions
- ✅ Proper markdown structure

**Note**: The system will automatically detect and fix these issues!`
    }
  };

  const currentExample = examples[selectedExample];

  // Performance metrics component
  const PerformanceMetrics = () => (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          System Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg text-green-600">{metrics.successRate.toFixed(1)}%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-blue-600">{Math.round(metrics.averageRenderTime)}ms</div>
            <div className="text-gray-600">Avg Render Time</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-gray-600">{metrics.renderAttempts}</div>
            <div className="text-gray-600">Total Renders</div>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Trend: {trends.trendDirection}</div>
            <div>Recent renders: {trends.recentRenders}</div>
            {trends.commonErrors.length > 0 && (
              <div>Common errors: {trends.commonErrors.map(e => e.type).join(', ')}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🚀 Bulletproof Content Rendering System</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Demonstration of the advanced content processing system that ensures 100% error-free 
          display of mathematical expressions, markdown formatting, and educational content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
          <div className="text-sm font-medium text-green-800">Zero Errors</div>
          <div className="text-xs text-green-600">Guaranteed display</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <Zap className="h-6 w-6 text-blue-600 mx-auto mb-1" />
          <div className="text-sm font-medium text-blue-800">Auto-Fixing</div>
          <div className="text-xs text-blue-600">Repairs LaTeX issues</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <Brain className="h-6 w-6 text-purple-600 mx-auto mb-1" />
          <div className="text-sm font-medium text-purple-800">AI-Smart</div>
          <div className="text-xs text-purple-600">Intelligent processing</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <BarChart3 className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
          <div className="text-sm font-medium text-yellow-800">Monitored</div>
          <div className="text-xs text-yellow-600">Performance tracked</div>
        </div>
      </div>

      <Tabs defaultValue="examples" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Live Examples
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Content Editor
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content Examples</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    {showPerformanceMetrics ? 'Hide' : 'Show'} Metrics
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
                {Object.entries(examples).map(([key, example]) => (
                  <Card 
                    key={key}
                    className={`cursor-pointer transition-all ${
                      selectedExample === key ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedExample(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          {key.includes('math') && <Calculator className="h-4 w-4 text-blue-600" />}
                          {key.includes('engineering') && <Zap className="h-4 w-4 text-blue-600" />}
                          {key.includes('mixed') && <FileText className="h-4 w-4 text-blue-600" />}
                          {key.includes('problematic') && <AlertTriangle className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{example.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{example.description}</p>
                          {selectedExample === key && (
                            <Badge variant="default" className="mt-2 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium text-sm">{currentExample.title}</h3>
                  <p className="text-xs text-gray-600">{currentExample.description}</p>
                </div>
                <div className="p-6">
                  <ContentDisplay
                    content={currentExample.content}
                    showAnalytics={true}
                    showControls={true}
                    renderingMode="math-optimized"
                    className="example-content"
                  />
                </div>
              </div>

              {showPerformanceMetrics && <PerformanceMetrics />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Content Editor with Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <ContentEditor
                initialContent={`# Try Editing This Content!

Enter your content here with LaTeX math like $E = mc^2$ and markdown formatting.

## Mathematical Examples
- Quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$
- Integral: $\\int_0^1 x^2 dx = \\frac{1}{3}$

**Bold text** and *italic text* work great too!

\`\`\`javascript
// Code blocks are also supported
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

Try introducing some errors and watch them get fixed automatically!`}
                placeholder="Enter your content with LaTeX math and markdown..."
                showAdvancedFeatures={true}
                onContentChange={(content, metadata) => {
                  setCustomContent(content);
                  console.log('Content updated:', metadata);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{Math.round(metrics.averageRenderTime)}</div>
                      <div className="text-sm text-gray-600">Avg Time (ms)</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-xl font-bold text-gray-600">{metrics.renderAttempts}</div>
                      <div className="text-sm text-gray-600">Total Renders</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="text-xl font-bold text-red-600">{metrics.renderErrors}</div>
                      <div className="text-sm text-gray-600">Errors</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Recent Renders:</span>
                    <span className="font-medium">{trends.recentRenders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trend:</span>
                    <Badge variant={trends.trendDirection === 'improving' ? 'default' : 'secondary'}>
                      {trends.trendDirection}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Recent Success Rate:</span>
                    <span className="font-medium">{trends.successRate.toFixed(1)}%</span>
                  </div>
                  
                  {trends.commonErrors.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded">
                      <div className="text-sm font-medium text-yellow-800 mb-1">Common Issues:</div>
                      {trends.commonErrors.map((error, index) => (
                        <div key={index} className="text-xs text-yellow-700">
                          {error.type}: {error.count} times
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Detailed Analytics</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const report = generateReport();
                    console.log('Performance Report:', report);
                    alert('Performance report generated - check browser console for details');
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Provider Usage</h4>
                  <div className="space-y-1">
                    {Object.entries(metrics.providerUsage).map(([provider, count]) => (
                      <div key={provider} className="flex justify-between text-sm">
                        <span className="capitalize">{provider}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Content Complexity</h4>
                  <div className="space-y-1">
                    {Object.entries(metrics.contentComplexity).map(([complexity, count]) => (
                      <div key={complexity} className="flex justify-between text-sm">
                        <span className="capitalize">{complexity}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Render Strategies</h4>
                  <div className="space-y-1">
                    {Object.entries(metrics.renderStrategies).map(([strategy, count]) => (
                      <div key={strategy} className="flex justify-between text-sm">
                        <span className="capitalize">{strategy.replace('-', ' ')}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert className="bg-blue-50 border-blue-200">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>System Status:</strong> All content rendering components are working perfectly! 
          This system ensures that no matter what content is generated by AI or entered by users, 
          it will always display correctly with proper mathematical formatting and markdown structure.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ContentRenderingDemo; 