import React from 'react';
import HtmlMathViewer from '@/components/HtmlMathViewer';
import SimpleMathRenderer from '@/components/SimpleMathRenderer';
import UniversalContentRenderer from '@/components/UniversalContentRenderer';

export default function HTMLMathTestPage() {
  // Your exact problematic content
  const testContent = `<h3>Introduction to Relations</h3>
<p>In mathematics and computer science, a relation is a fundamental concept used to describe relationships between elements of sets. Formally, a relation between two sets (A) and (B) is a subset of the Cartesian product (A \\times B). In simpler terms, it's a collection of ordered pairs ((a, b)) where (a) belongs to (A) and (b) belongs to (B). These ordered pairs signify that (a) is related to (b) in some way.</p>
<p>For instance, if (A = \\{1, 2, 3\\}) and (B = \\{4, 5, 6\\}), then a relation (R) from (A) to (B) could be (R = \\{(1, 4), (2, 5), (3, 6)\\}). This means 1 is related to 4, 2 is related to 5, and 3 is related to 6.</p>
<p>Relations can be defined on a single set as well. In this case, we talk about a relation on a set (A), which is a subset of (A \\times A). Such relations are essential in defining concepts like ordering, equivalence, and more.</p>
<p>Understanding relations is crucial for various areas in computer science, including database management, data structures, and formal methods.</p>`;

  // Additional test content with more complex math
  const advancedContent = `<h3>Advanced Mathematical Relations</h3>
<p>Consider the function $f: A \\to B$ where $A = \\{x \\in \\mathbb{R} | x > 0\\}$ and $B = \\mathbb{R}$. The relation $R$ defined by $f(x) = \\ln(x)$ establishes a bijective mapping.</p>
<p>For equivalence relations, we require three properties:</p>
<ul>
<li><strong>Reflexivity:</strong> $a \\sim a$ for all $a \\in A$</li>
<li><strong>Symmetry:</strong> If $a \\sim b$, then $b \\sim a$</li>
<li><strong>Transitivity:</strong> If $a \\sim b$ and $b \\sim c$, then $a \\sim c$</li>
</ul>
<p>The equivalence classes partition the set $A$ into disjoint subsets $A/\\sim = \\{[a] | a \\in A\\}$.</p>

<h3>Calculus Example</h3>
<p>The derivative of $f(x) = x^2 + 3x + 5$ is:</p>
<p>$$\\frac{d}{dx}f(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} = 2x + 3$$</p>
<p>For the integral: $\\int x^2 dx = \\frac{x^3}{3} + C$ where $C \\in \\mathbb{R}$.</p>`;

  return (
    <div>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">HTML Math Processing Test</h1>
            <p className="text-gray-600">Testing conversion of HTML with parentheses-wrapped math</p>
          </div>

          {/* Debug Mode - Shows conversion process */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-700">🔧 Debug Mode - Your Exact Content</h2>
            <HtmlMathViewer 
              html={testContent}
            />
          </div>

          {/* Direct Math render */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">📐 Direct Math Render (No LaTeX)</h2>
            <UniversalContentRenderer 
              content={testContent}
              enableAnalytics={true}
              className="direct-math-test"
            />
          </div>

          {/* Simple fallback render */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">✨ Simple Fallback Render</h2>
            <SimpleMathRenderer 
              content={testContent}
              showMetrics={true}
            />
          </div>

          {/* Advanced content test with Direct Math */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-700">🎯 Advanced Direct Math Test</h2>
            <UniversalContentRenderer 
              content={advancedContent}
              enableAnalytics={true}
              className="advanced-direct-math-test"
            />
          </div>

          {/* Processing explanation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-green-800 mb-3">📐 How Direct Math Processing Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">HTML Conversion:</h4>
                <ul className="space-y-1 text-green-600">
                  <li>• <code>&lt;h3&gt;</code> → <code>### </code></li>
                  <li>• <code>&lt;p&gt;</code> → paragraph breaks</li>
                  <li>• <code>&lt;strong&gt;</code> → <code>**bold**</code></li>
                  <li>• Clean up excessive whitespace</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">Direct Math Conversion:</h4>
                <ul className="space-y-1 text-green-600">
                  <li>• <code>$A \\times B$</code> → <code>A × B</code></li>
                  <li>• <code>\\mathbb{'{R}'}</code> → <code>ℝ</code></li>
                  <li>• <code>\\frac{'{a}'}{'{b}'}</code> → <code>(a)/(b)</code></li>
                  <li>• <code>\\alpha</code> → <code>α</code></li>
                  <li>• <code>\\to</code> → <code>→</code></li>
                  <li>• Remove all LaTeX syntax</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
              <p className="text-green-800 font-semibold">✨ Result: Clean mathematical equations displayed directly without LaTeX syntax!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}