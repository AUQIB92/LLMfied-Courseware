import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function SimpleTestRender({ content }) {
  // Show what content we're actually receiving
  const debugContent = () => {
    console.log('Raw content received:', JSON.stringify(content));
    console.log('Content type:', typeof content);
    console.log('Content length:', content?.length);
    console.log('First 300 chars:', content?.substring(0, 300));
  };

  React.useEffect(() => {
    debugContent();
  }, [content]);

  return (
    <div className="border-2 border-red-500 p-4 m-4">
      <h3 className="text-lg font-bold mb-2">Simple Test Render</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold">Debug Info:</h4>
        <div className="text-xs bg-gray-100 p-2 rounded">
          <div>Type: {typeof content}</div>
          <div>Length: {content?.length}</div>
          <div>Has $: {content?.includes('$') ? 'YES' : 'NO'}</div>
          <div>$ count: {(content?.match(/\$/g) || []).length}</div>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold">Raw Content:</h4>
        <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap overflow-auto max-h-32">
          {content}
        </pre>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold">No Processing - Direct ReactMarkdown:</h4>
        <div className="border p-2 bg-white">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {content || 'No content'}
          </ReactMarkdown>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold">Plain Text (no markdown):</h4>
        <div className="border p-2 bg-yellow-50">
          {content}
        </div>
      </div>
    </div>
  );
}