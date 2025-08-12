import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react';

const HtmlEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Enter content...',
  className = '',
  rows = 15 
}) => {
  const [htmlContent, setHtmlContent] = useState(value);
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Immediate debugging on component render
  console.log("🔄 HtmlEditor: Component rendered", {
    valueLength: value?.length || 0,
    valuePreview: value?.substring(0, 100),
    htmlContentLength: htmlContent?.length || 0,
    hasValue: !!value,
    hasHtmlContent: !!htmlContent
  });

  // Initialize content when component mounts
  useEffect(() => {
    console.log("🔄 HtmlEditor: Component mounted", {
      valueLength: value?.length || 0,
      hasValue: !!value
    });
    
    if (editorRef.current) {
      const contentToSet = value || '';
      console.log("🔄 HtmlEditor: Setting initial content", {
        contentLength: contentToSet.length,
        contentPreview: contentToSet.substring(0, 100)
      });
      editorRef.current.innerHTML = contentToSet;
      setHtmlContent(contentToSet);
    }
  }, []);

  // Update content when value changes
  useEffect(() => {
    console.log("🔄 HtmlEditor: Value changed", {
      valueLength: value?.length || 0,
      currentHtmlLength: htmlContent?.length || 0,
      hasValue: !!value,
      isHtml: /<[^>]*>/g.test(value || "")
    });
    
    if (editorRef.current && value !== htmlContent) {
      const contentToSet = value || '';
      console.log("🔄 HtmlEditor: Updating content", {
        contentLength: contentToSet.length,
        contentPreview: contentToSet.substring(0, 100)
      });
      editorRef.current.innerHTML = contentToSet;
      setHtmlContent(contentToSet);
    }
  }, [value, htmlContent]);

  // Force content update after render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorRef.current && value) {
        console.log("🔄 HtmlEditor: Force updating content after render", {
          valueLength: value.length,
          valuePreview: value.substring(0, 100)
        });
        editorRef.current.innerHTML = value;
        setHtmlContent(value);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    const content = editorRef.current?.innerHTML || '';
    setHtmlContent(content);
    if (onChange) {
      onChange(content);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('redo');
          } else {
            e.preventDefault();
            execCommand('undo');
          }
          break;
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const ToolbarButton = ({ icon: Icon, onClick, title, active = false }) => (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0 hover:bg-gray-100"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={`border rounded-md ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'} ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        <div className="flex gap-1">
          <ToolbarButton 
            icon={Bold} 
            onClick={() => execCommand('bold')} 
            title="Bold (Ctrl+B)"
          />
          <ToolbarButton 
            icon={Italic} 
            onClick={() => execCommand('italic')} 
            title="Italic (Ctrl+I)"
          />
          <ToolbarButton 
            icon={Underline} 
            onClick={() => execCommand('underline')} 
            title="Underline (Ctrl+U)"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex gap-1">
          <ToolbarButton 
            icon={Heading1} 
            onClick={() => execCommand('formatBlock', '<h1>')} 
            title="Heading 1"
          />
          <ToolbarButton 
            icon={Heading2} 
            onClick={() => execCommand('formatBlock', '<h2>')} 
            title="Heading 2"
          />
          <ToolbarButton 
            icon={Heading3} 
            onClick={() => execCommand('formatBlock', '<h3>')} 
            title="Heading 3"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex gap-1">
          <ToolbarButton 
            icon={List} 
            onClick={() => execCommand('insertUnorderedList')} 
            title="Bullet List"
          />
          <ToolbarButton 
            icon={ListOrdered} 
            onClick={() => execCommand('insertOrderedList')} 
            title="Numbered List"
          />
          <ToolbarButton 
            icon={Quote} 
            onClick={() => execCommand('formatBlock', '<blockquote>')} 
            title="Quote"
          />
          <ToolbarButton 
            icon={Code} 
            onClick={() => execCommand('formatBlock', '<pre>')} 
            title="Code Block"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex gap-1">
          <ToolbarButton 
            icon={Undo} 
            onClick={() => execCommand('undo')} 
            title="Undo (Ctrl+Z)"
          />
          <ToolbarButton 
            icon={Redo} 
            onClick={() => execCommand('redo')} 
            title="Redo (Ctrl+Shift+Z)"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex gap-1">
          <ToolbarButton 
            icon={Link} 
            onClick={insertLink} 
            title="Insert Link"
          />
          <ToolbarButton 
            icon={Image} 
            onClick={insertImage} 
            title="Insert Image"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex gap-1">
          <ToolbarButton 
            icon={AlignLeft} 
            onClick={() => execCommand('justifyLeft')} 
            title="Align Left"
          />
          <ToolbarButton 
            icon={AlignCenter} 
            onClick={() => execCommand('justifyCenter')} 
            title="Align Center"
          />
          <ToolbarButton 
            icon={AlignRight} 
            onClick={() => execCommand('justifyRight')} 
            title="Align Right"
          />
        </div>

        {/* Test button for debugging */}
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const testContent = '<h2>Test Content</h2><p>This is a <strong>test</strong> to see if the HTML editor is working.</p><ul><li>Item 1</li><li>Item 2</li></ul>';
              console.log("🔄 Setting test content:", testContent);
              if (editorRef.current) {
                editorRef.current.innerHTML = testContent;
                setHtmlContent(testContent);
                if (onChange) {
                  onChange(testContent);
                }
              }
            }}
            title="Test Content"
            className="h-8 px-2 text-xs"
          >
            Test
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const testMathContent = `<h3>Math Test</h3><p>Here is an inline equation: \\(E = mc^2\\) and a display equation:</p><p>\\[\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\\]</p><p>And another inline: \\(\\frac{a + b}{c + d}\\)</p>`;
              console.log("🔄 Setting test math content:", testMathContent);
              if (editorRef.current) {
                editorRef.current.innerHTML = testMathContent;
                setHtmlContent(testMathContent);
                if (onChange) {
                  onChange(testMathContent);
                }
              }
            }}
            title="Test Math Content"
            className="h-8 px-2 text-xs"
          >
            Test Math
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        dangerouslySetInnerHTML={{ __html: htmlContent || value || placeholder }}
        onInput={updateContent}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className="p-3 min-h-[200px] focus:outline-none prose prose-sm max-w-none"
        style={{ 
          minHeight: `${rows * 1.5}rem`,
          maxHeight: '500px',
          overflowY: 'auto'
        }}
        data-content={htmlContent || value || ''}
      />
    </div>
  );
};

export default HtmlEditor;
