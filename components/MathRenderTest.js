"use client"

import React from 'react'
import ReliableMathRenderer from './ReliableMathRenderer'
import StackExchangeMathRenderer from './StackExchangeMathRenderer'

const MathRenderTest = () => {
  const testContent = `
# Math Rendering Test

Here are some test equations:

## Inline Math
The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ which is very useful.

## Display Math
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

$$E = mc^2$$

$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$

## Matrix
$$\\mathbf{A} = \\begin{pmatrix}
a_{11} & a_{12} \\\\
a_{21} & a_{22}
\\end{pmatrix}$$

Some more inline math: $\\alpha + \\beta = \\gamma$ and $\\int_0^1 x^2 dx = \\frac{1}{3}$.
`

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-600">ReliableMathRenderer Test</h2>
        <ReliableMathRenderer 
          content={testContent}
          showMetrics={true}
        />
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4 text-purple-600">StackExchangeMathRenderer Test</h2>
        <StackExchangeMathRenderer 
          content={testContent}
          showMetrics={true}
        />
      </div>
    </div>
  )
}

export default MathRenderTest