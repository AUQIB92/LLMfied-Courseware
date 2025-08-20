'use client'

import { useState } from 'react'
import MathMarkdownRenderer from '@/components/MathMarkdownRenderer'
import HtmlMathViewer from '@/components/HtmlMathViewer'
import StackExchangeMathRenderer from '@/components/StackExchangeMathRenderer'
import ReliableMathRenderer from '@/components/ReliableMathRenderer'
import TruthTable, { ModusPonensTable, ModusTollensTable } from '@/components/ui/truth-table'

export default function MathTestPage() {
  const [activeTab, setActiveTab] = useState('markdown')

  const sampleMarkdown = `# Math Test

This is a test of mathematical expressions using KaTeX.

## Inline Math
Here is some inline math: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ within a sentence.

## Display Math
Here is a display equation:

$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

## More Complex Math
The Schrödinger equation:
$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)$$

## Greek Letters and Symbols
Greek letters: $\\alpha, \\beta, \\gamma, \\delta, \\epsilon, \\zeta, \\eta, \\theta, \\lambda, \\mu, \\pi, \\rho, \\sigma, \\tau, \\phi, \\chi, \\psi, \\omega$

Special symbols: $\\sum_{i=1}^{n} x_i, \\prod_{i=1}^{n} x_i, \\int_0^1 f(x) dx$

## Matrices
$$\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}$$

## Truth Tables

### Basic Logical Operations
| P | Q | P ∧ Q | P ∨ Q | P → Q |
|---|---|-------|-------|-------|
| T | T |   T   |   T   |   T   |
| T | F |   F   |   T   |   F   |
| F | T |   F   |   T   |   T   |
| F | F |   F   |   F   |   T   |

### Modus Ponens Example
| P | Q | P → Q | P ∧ (P → Q) | (P ∧ (P → Q)) → Q |
|---|---|-------|-------------|-------------------|
| T | T |   T   |      T      |         T         |
| T | F |   F   |      F      |         T         |
| F | T |   T   |      F      |         T         |
| F | F |   T   |      F      |         T         |
`

  const sampleHtml = `<h1>HTML Math Test</h1>
<p>This tests math rendering in HTML content.</p>
<p>Inline math: $E = mc^2$ and display math:</p>
<p>$$F = ma$$</p>
<h2>More Examples</h2>
<p>The area of a circle is $A = \\pi r^2$</p>
<p>Taylor series expansion:</p>
<p>$$e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!} = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\cdots$$</p>

<h2>Truth Table Example</h2>
<table>
<thead>
<tr><th>P</th><th>Q</th><th>P ∧ Q</th><th>P ∨ Q</th><th>P → Q</th></tr>
</thead>
<tbody>
<tr><td>T</td><td>T</td><td>T</td><td>T</td><td>T</td></tr>
<tr><td>T</td><td>F</td><td>F</td><td>T</td><td>F</td></tr>
<tr><td>F</td><td>T</td><td>F</td><td>T</td><td>T</td></tr>
<tr><td>F</td><td>F</td><td>F</td><td>F</td><td>T</td></tr>
</tbody>
</table>`

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Math Rendering Test</h1>
      
      {/* Tab buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('markdown')}
          className={`px-4 py-2 rounded ${
            activeTab === 'markdown'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Markdown Renderer
        </button>
        <button
          onClick={() => setActiveTab('html')}
          className={`px-4 py-2 rounded ${
            activeTab === 'html'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          HTML Viewer
        </button>
        <button
          onClick={() => setActiveTab('truthtables')}
          className={`px-4 py-2 rounded ${
            activeTab === 'truthtables'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Truth Tables
        </button>
        <button
          onClick={() => setActiveTab('stackexchange')}
          className={`px-4 py-2 rounded ${
            activeTab === 'stackexchange'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Stack Exchange Style
        </button>
        <button
          onClick={() => setActiveTab('reliable')}
          className={`px-4 py-2 rounded ${
            activeTab === 'reliable'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Reliable Renderer
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeTab === 'markdown' && (
          <div>
            <h2 className="text-xl font-bold mb-4">MathMarkdownRenderer Test</h2>
            <MathMarkdownRenderer content={sampleMarkdown} />
          </div>
        )}
        
        {activeTab === 'html' && (
          <div>
            <h2 className="text-xl font-bold mb-4">HtmlMathViewer Test</h2>
            <HtmlMathViewer html={sampleHtml} />
          </div>
        )}

        {activeTab === 'truthtables' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Professional Truth Tables</h2>
            
            <div className="space-y-8">
              <ModusPonensTable />
              <ModusTollensTable />
              
              <TruthTable
                title="Custom Truth Table Example"
                headers={['P', 'Q', '¬P', '¬Q', 'P ∨ ¬Q']}
                rows={[
                  ['T', 'T', 'F', 'F', 'T'],
                  ['T', 'F', 'F', 'T', 'T'],
                  ['F', 'T', 'T', 'F', 'F'],
                  ['F', 'F', 'T', 'T', 'T']
                ]}
                showRowNumbers={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'stackexchange' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Stack Exchange Style Math Rendering</h2>
            
            <div className="space-y-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">🔬 Direct Stack Exchange Renderer</h3>
                <StackExchangeMathRenderer
                  content={sampleMarkdown}
                  contentType="general"
                  showMetrics={true}
                  enableCopy={true}
                  enableHover={true}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-3">📐 Theorem Example</h3>
                <StackExchangeMathRenderer
                  content={`
# Pythagorean Theorem

**Theorem**: In a right triangle with legs of length $a$ and $b$, and hypotenuse of length $c$:

$$a^2 + b^2 = c^2$$

**Proof**: Consider a square with side length $(a + b)$...
                  `}
                  contentType="theorem"
                  showMetrics={true}
                  enableCopy={true}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">🧮 Complex Math with Stack Exchange Macros</h3>
                <StackExchangeMathRenderer
                  content={`
## Advanced Mathematics

Using Stack Exchange macros:

- Real numbers: $\\R$
- Complex numbers: $\\C$ 
- Integers: $\\Z$
- Natural numbers: $\\N$

**Limit definition**: $\\lim_{x \\to \\infty} f(x) = L$

**Integration by parts**:
$$\\int u \\, dv = uv - \\int v \\, du$$

**Matrix operations**:
$$\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$$
                  `}
                  contentType="example"
                  showMetrics={true}
                  enableCopy={true}
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">🔍 Logic & Set Theory</h3>
                <StackExchangeMathRenderer
                  content={`
## Logic and Set Theory

**Logical operators**:
- Conjunction: $P \\land Q$
- Disjunction: $P \\lor Q$ 
- Implication: $P \\implies Q$
- Equivalence: $P \\iff Q$
- Negation: $\\lnot P$

**Set operations**:
- Union: $A \\cup B$
- Intersection: $A \\cap B$
- Subset: $A \\subseteq B$
- Empty set: $\\emptyset$
- Element: $x \\in A$

**Quantifiers**:
$$\\forall x \\in \\R, \\exists y \\in \\R : y > x$$
                  `}
                  contentType="definition"
                  showMetrics={true}
                  enableCopy={true}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reliable' && (
          <div>
            <h2 className="text-xl font-bold mb-4">🛡️ Reliable Math Renderer (MathJax → KaTeX → Fallback)</h2>
            
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-3">✅ Robust Math Rendering</h3>
                <p className="text-green-700 mb-4">This renderer tries multiple approaches to ensure math always displays properly:</p>
                <ol className="text-green-700 text-sm mb-4 ml-4 list-decimal space-y-1">
                  <li><strong>MathJax first</strong> - Stack Exchange style with full macro support</li>
                  <li><strong>KaTeX fallback</strong> - Fast and reliable for most math</li>
                  <li><strong>Formatted fallback</strong> - Basic formatting when all else fails</li>
                </ol>
                
                <ReliableMathRenderer
                  content={sampleMarkdown}
                  showMetrics={true}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">🧮 Complex Mathematics Test</h3>
                <ReliableMathRenderer
                  content={`
# Advanced Mathematical Expressions

**Calculus**: $\\frac{d}{dx}\\int_0^x f(t)dt = f(x)$

**Linear Algebra**: $\\det(A) = \\sum_{\\sigma \\in S_n} \\text{sgn}(\\sigma) \\prod_{i=1}^n a_{i,\\sigma(i)}$

**Complex Analysis**: $f(z) = \\sum_{n=0}^{\\infty} a_n (z-c)^n$

**Probability**: $P(A|B) = \\frac{P(B|A)P(A)}{P(B)}$

**Set Theory**: $\\bigcup_{i \\in I} A_i = \\{x : \\exists i \\in I, x \\in A_i\\}$
                  `}
                  showMetrics={true}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">🔍 Logic & Proof Theory</h3>
                <ReliableMathRenderer
                  content={`
## Formal Logic

**Propositional Logic**:
- $P \\land Q \\rightarrow P \\lor Q$
- $(P \\rightarrow Q) \\land P \\rightarrow Q$ (Modus Ponens)
- $(P \\rightarrow Q) \\land \\neg Q \\rightarrow \\neg P$ (Modus Tollens)

**Predicate Logic**:
- $\\forall x (P(x) \\rightarrow Q(x)) \\land P(a) \\rightarrow Q(a)$
- $\\exists x P(x) \\leftrightarrow \\neg \\forall x \\neg P(x)$

**Set Operations**:
$$A \\cup B = \\{x : x \\in A \\lor x \\in B\\}$$
$$A \\cap B = \\{x : x \\in A \\land x \\in B\\}$$
$$A \\setminus B = \\{x : x \\in A \\land x \\notin B\\}$$
                  `}
                  showMetrics={true}
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">⚡ Performance Test</h3>
                <p className="text-purple-700 text-sm mb-4">Testing rendering speed and reliability with various mathematical content:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Inline Math: $x^2 + y^2 = z^2$</h4>
                    <ReliableMathRenderer
                      content="The equation $E = mc^2$ demonstrates mass-energy equivalence."
                      inline={false}
                      showMetrics={true}
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Display Math Block:</h4>
                    <ReliableMathRenderer
                      content="$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$"
                      inline={false}
                      showMetrics={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}