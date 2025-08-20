import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const DirectMathTest = () => {
  const testContent = `Here is inline math: $x = \\frac{a + b}{c}$ and display math:

$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

Another test: $n = 5$ and $\\alpha + \\beta = \\gamma$.`;

  return (
    <div className="p-8 bg-white max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Direct Math Rendering Test</h1>
      
      <div className="space-y-6">
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Raw Content:</h2>
          <pre className="text-sm text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-wrap">
            {testContent}
          </pre>
        </div>
        
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Direct ReactMarkdown + KaTeX:</h2>
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {testContent}
          </ReactMarkdown>
        </div>
        
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Simple HTML test:</h2>
          <div 
            dangerouslySetInnerHTML={{
              __html: `Here is inline math: <span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>n</mi><mo>=</mo><mn>5</mn></mrow><annotation encoding="application/x-tex">n = 5</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.6444em;"></span><span class="mord">5</span></span></span></span>`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DirectMathTest;