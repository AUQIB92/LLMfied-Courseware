import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ImageManager from '@/components/ui/image-manager';
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
  Redo,
  Clipboard,
  Wand2,
  AlertCircle,
  CheckCircle,
  Calculator
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
  const [latexStatus, setLatexStatus] = useState('good'); // 'good', 'issues', 'fixed'

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
    
    const contentToSet = value || '';
    console.log("🔄 HtmlEditor: Setting initial content", {
      contentLength: contentToSet.length,
      contentPreview: contentToSet.substring(0, 100)
    });
    setHtmlContent(contentToSet);
  }, []);

  // Update content when value changes (optimized to prevent editing interference)
  useEffect(() => {
    // Only update if the editor is not currently focused (to prevent interference during typing)
    if (document.activeElement === editorRef.current) {
      console.log("⚠️ HtmlEditor: Skipping value update - editor is focused");
      return;
    }

    console.log("🔄 HtmlEditor: Value changed", {
      valueLength: value?.length || 0,
      currentHtmlLength: htmlContent?.length || 0,
      hasValue: !!value,
      isHtml: /<[^>]*>/g.test(value || "")
    });
    
    if (value !== htmlContent) {
      const contentToSet = value || '';
      console.log("🔄 HtmlEditor: Updating content", {
        contentLength: contentToSet.length,
        contentPreview: contentToSet.substring(0, 100)
      });
      setHtmlContent(contentToSet);
    }
  }, [value]);

  // Monitor LaTeX status
  useEffect(() => {
    const currentContent = htmlContent || '';
    const hasIssues = /\*\*MATH\*(INLINE|BLOCK)\*\d+\*\*/g.test(currentContent);
    setLatexStatus(hasIssues ? 'issues' : 'good');
  }, [htmlContent]);

  // Force content update after render with better synchronization (DISABLED during editing)
  useEffect(() => {
    // Skip force updates if the editor is actively being used
    if (isFocused || document.activeElement === editorRef.current) {
      console.log("⚠️ HtmlEditor: Skipping force update - editor is active");
      return;
    }

    if (value && value !== htmlContent) {
      console.log("🔄 HtmlEditor: Force updating content after render", {
        valueLength: value.length,
        valuePreview: value.substring(0, 100)
      });
      
      setHtmlContent(value);
    }
  }, [value, isFocused]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.innerHTML || '';
    
    // Only update if content actually changed to prevent unnecessary re-renders
    if (content === htmlContent) {
      return;
    }
    
    // Preserve cursor position
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const cursorOffset = range ? range.startOffset : 0;
    const cursorContainer = range ? range.startContainer : null;
    
    setHtmlContent(content);
    if (onChange) {
      onChange(content);
    }
    
    // Restore cursor position after content update (only if needed)
    if (cursorContainer && range && editorRef.current) {
      setTimeout(() => {
        try {
          const newRange = document.createRange();
          newRange.setStart(cursorContainer, Math.min(cursorOffset, cursorContainer.textContent?.length || 0));
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          // Fallback: place cursor at end
          editorRef.current.focus();
        }
      }, 0);
    }
  };

  // Smart paste handler with LaTeX detection and fixing
  const handlePaste = (e) => {
    e.preventDefault();
    
    // Get both plain text and HTML from clipboard
    const plainText = e.clipboardData.getData('text/plain');
    const htmlText = e.clipboardData.getData('text/html');
    
    let processedContent = htmlText || plainText;
    
    // Process the content for LaTeX improvements
    processedContent = smartLatexProcessing(processedContent);
    
    // For multi-line content, use better insertion method
    if (processedContent.includes('\n') || processedContent.includes('<br>') || processedContent.includes('<p>')) {
      // Convert line breaks to HTML if needed
      if (!htmlText && plainText.includes('\n')) {
        processedContent = processedContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
        processedContent = `<p>${processedContent}</p>`;
      }
      insertMultiLineContent(processedContent);
    } else {
      // For single line content, use simple text insertion
      document.execCommand('insertText', false, processedContent);
      updateContent();
    }
  };

  // Enhanced Smart LaTeX processing function with alignment environment support
  const smartLatexProcessing = (content) => {
    if (!content || typeof content !== 'string') return content;
    
    let processed = content;
    
    // Fix corrupted math placeholders
    const mathRestorations = [
      { pattern: /\*\*MATH\*INLINE\*0\*\*/g, replacement: '$R$' },
      { pattern: /\*\*MATH\*INLINE\*1\*\*/g, replacement: '$A$' },
      { pattern: /\*\*MATH\*INLINE\*2\*\*/g, replacement: '$\\subseteq$' },
      { pattern: /\*\*MATH\*INLINE\*3\*\*/g, replacement: '$\\in$' },
      { pattern: /\*\*MATH\*INLINE\*4\*\*/g, replacement: '$=$' },
      { pattern: /\*\*MATH\*INLINE\*5\*\*/g, replacement: '$\\forall$' },
      { pattern: /\*\*MATH\*INLINE\*6\*\*/g, replacement: '$\\exists$' },
      { pattern: /\*\*MATH\*INLINE\*7\*\*/g, replacement: '$\\implies$' },
      { pattern: /\*\*MATH\*INLINE\*8\*\*/g, replacement: '$\\iff$' },
      { pattern: /\*\*MATH\*INLINE\*9\*\*/g, replacement: '$\\neg$' },
      { pattern: /\*\*MATH\*BLOCK\*0\*\*/g, replacement: '$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$' },
      { pattern: /\*\*MATH\*BLOCK\*1\*\*/g, replacement: '$$\\int_{a}^{b} f(x) dx$$' },
      { pattern: /\*\*MATH\*BLOCK\*2\*\*/g, replacement: '$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$' },
      { pattern: /\*\*MATH\*BLOCK\*3\*\*/g, replacement: '$$\\lim_{x \\to \\infty} f(x)$$' },
      { pattern: /\*\*MATH\*BLOCK\*4\*\*/g, replacement: '$$\\frac{d}{dx}[f(x)]$$' }
    ];
    
    mathRestorations.forEach(({ pattern, replacement }) => {
      processed = processed.replace(pattern, replacement);
    });

    // Enhanced multi-line equation detection and alignment environment wrapping
    
    // First, handle consecutive single-dollar equations like the user's example
    processed = processed.replace(/\$([^$\n]+)\$\s*\n\s*\$([^$\n]+)\$/g, (match, eq1, eq2) => {
      console.log('🔧 Consecutive single-dollar equations detected, converting to align environment');
      
      // Check if both equations have equals signs (mathematical equations)
      if (eq1.includes('=') && eq2.includes('=')) {
        let alignContent1 = eq1.trim().replace(/=/g, '&=');
        let alignContent2 = eq2.trim().replace(/=/g, '&=');
        
        return `$$\\begin{align}\n${alignContent1}\\\\\n${alignContent2}\n\\end{align}$$`;
      }
      
      return match; // Keep original if not mathematical equations
    });
    
    // Then handle display math ($$) equations
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathContent) => {
      const trimmed = mathContent.trim();
      
      // Skip if already has alignment environment
      if (/\\begin\{(align|equation|gather|split|multline)\}/.test(trimmed)) {
        return match;
      }
      
      // Check for consecutive equations like the example you provided
      const consecutiveEquations = trimmed.split(/\n\s*\n|\$\$\s*\$\$/);
      
      if (consecutiveEquations.length > 1) {
        console.log('🔧 Multiple equations detected, adding align environment');
        
        let alignContent = consecutiveEquations
          .map(eq => eq.trim())
          .filter(eq => eq.length > 0)
          .map(eq => {
            // Remove any existing $$ delimiters
            eq = eq.replace(/\$\$/g, '').trim();
            // Add alignment at equals signs
            return eq.includes('=') ? eq.replace(/=/g, '&=') : '&' + eq;
          })
          .join(' \\\\\n');
          
        return `$$\\begin{align}\n${alignContent}\n\\end{align}$$`;
      }
      
      // Check for single equations with equals signs that are complex enough for alignment
      if (trimmed.includes('=')) {
        // Count equals signs and check length to determine if alignment is needed
        const equalsCount = (trimmed.match(/=/g) || []).length;
        const hasComplexMath = /\\[a-zA-Z]+/.test(trimmed); // Has LaTeX commands
        
        if (equalsCount >= 1 && (trimmed.length > 40 || hasComplexMath)) {
          console.log('🔧 Complex equation with equals detected, adding align environment');
          
          let alignContent = trimmed.replace(/=/g, '&=');
          return `$$\\begin{align}\n${alignContent}\n\\end{align}$$`;
        }
      }
      
      return match; // Return unchanged for simple equations
    });
    
    // Process consecutive $$ blocks that were separated
    processed = processed.replace(/\$\$(.*?)\$\$\s*\$\$(.*?)\$\$/g, (match, eq1, eq2) => {
      console.log('🔧 Consecutive separate equations detected, combining with align');
      
      // Clean up the equations
      let content1 = eq1.replace(/\\begin\{align\}|\\end\{align\}/g, '').trim();
      let content2 = eq2.replace(/\\begin\{align\}|\\end\{align\}/g, '').trim();
      
      // Add alignment markers
      if (!content1.includes('&')) content1 = content1.replace(/=/g, '&=');
      if (!content2.includes('&')) content2 = content2.replace(/=/g, '&=');
      
      return `$$\\begin{align}\n${content1}\\\\\n${content2}\n\\end{align}$$`;
    });
    
    // Fix common LaTeX formatting issues
    processed = processed
      // Fix double backslashes
      .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
      // Ensure proper math delimiters
      .replace(/\\\(/g, '$')
      .replace(/\\\)/g, '$')
      .replace(/\\\[/g, '$$')
      .replace(/\\\]/g, '$$')
      // Fix escaped dollar signs
      .replace(/\\\$/g, '$');
    
    return processed;
  };

  const handleKeyDown = (e) => {
    // Handle Enter key for proper line breaks
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Insert line break
        e.preventDefault();
        document.execCommand('insertHTML', false, '<br>');
        return;
      } else {
        // Enter: Create new paragraph
        e.preventDefault();
        document.execCommand('insertHTML', false, '<p><br></p>');
        return;
      }
    }
    
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: Outdent
        document.execCommand('outdent', false, null);
      } else {
        // Tab: Indent
        document.execCommand('indent', false, null);
      }
      return;
    }
    
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
        case 'a':
          // Allow Ctrl+A for select all
          break;
        case 'c':
          // Allow Ctrl+C for copy
          break;
        case 'v':
          // Ctrl+V will be handled by handlePaste
          break;
        case 'x':
          // Allow Ctrl+X for cut
          break;
        default:
          // Prevent other Ctrl shortcuts from interfering
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

  const handleImageInsert = (imageHtml, imageData) => {
    // Insert the image HTML directly into the editor
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      
      if (range) {
        range.deleteContents();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = imageHtml;
        while (tempDiv.firstChild) {
          range.insertNode(tempDiv.firstChild);
        }
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback: append to end
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = imageHtml;
        editorRef.current.appendChild(tempDiv.firstChild);
      }
      
      updateContent();
      editorRef.current.focus();
    }
  };

  // Smart paste function for toolbar
  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const processedContent = smartLatexProcessing(text);
        
        // Handle multi-line content properly
        if (processedContent.includes('\n')) {
          const htmlContent = processedContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
          insertMultiLineContent(`<p>${htmlContent}</p>`);
        } else {
          document.execCommand('insertText', false, processedContent);
          updateContent();
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      alert('Please use Ctrl+V to paste content');
    }
  };

  // Quick LaTeX fixes
  const fixLatexPlaceholders = () => {
    const content = editorRef.current?.innerHTML || '';
    const fixedContent = smartLatexProcessing(content);
    if (content !== fixedContent) {
      setHtmlContent(fixedContent);
      if (onChange) {
        onChange(fixedContent);
      }
      setLatexStatus('fixed');
      // Reset status after 3 seconds
      setTimeout(() => setLatexStatus('good'), 3000);
    }
  };

  // Detect corrupted math placeholders
  const hasCorruptedMath = () => {
    const content = editorRef.current?.innerHTML || htmlContent || '';
    return /\*\*MATH\*(INLINE|BLOCK)\*\d+\*\*/g.test(content);
  };

  // Insert common math expressions
  const insertMathExpression = (expression) => {
    document.execCommand('insertText', false, expression);
    updateContent();
  };

  // Helper function to ensure proper line breaks and formatting
  const normalizeContent = (content) => {
    if (!content || typeof content !== 'string') return '';
    
    // Replace multiple consecutive <br> tags with paragraph breaks
    let normalized = content
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>')
      .replace(/^(<br\s*\/?>)+/gi, '') // Remove leading br tags
      .replace(/(<br\s*\/?>)+$/gi, ''); // Remove trailing br tags
    
    // Ensure content is wrapped in paragraphs if it's not already in block elements
    if (normalized && !normalized.match(/^<(p|div|h[1-6]|ul|ol|blockquote|pre)/i)) {
      normalized = `<p>${normalized}</p>`;
    }
    
    // Clean up empty paragraphs at the end
    normalized = normalized.replace(/<p><\/p>$/gi, '');
    
    return normalized;
  };

  // Better content insertion for multi-line content
  const insertMultiLineContent = (content) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // If we're in the middle of a text node, split it properly
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      range.splitText && range.splitText(range.startOffset);
    }
    
    // Insert the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = normalizeContent(content);
    
    while (tempDiv.firstChild) {
      range.insertNode(tempDiv.firstChild);
    }
    
    // Move cursor to end of inserted content
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    updateContent();
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('formatBlock', '<p>')}
            title="New Paragraph"
            className="h-8 px-2 text-xs"
          >
            ¶
          </Button>
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('indent')}
            title="Indent (Tab)"
            className="h-8 px-2 text-xs"
          >
            →
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('outdent')}
            title="Outdent (Shift+Tab)"
            className="h-8 px-2 text-xs"
          >
            ←
          </Button>
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
            title="Insert Image URL"
          />
          <ImageManager 
            onImageInsert={handleImageInsert}
            buttonText=""
            className="h-8 w-8 p-0 hover:bg-gray-100"
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

        {/* LaTeX and Smart Paste Tools */}
        <div className="flex gap-1">
          <ToolbarButton 
            icon={Clipboard} 
            onClick={handleSmartPaste} 
            title="Smart Paste (Auto-fix LaTeX)"
          />
          <ToolbarButton 
            icon={latexStatus === 'issues' ? AlertCircle : latexStatus === 'fixed' ? Wand2 : CheckCircle} 
            onClick={fixLatexPlaceholders} 
            title={latexStatus === 'issues' ? "Fix Corrupted Math Placeholders" : latexStatus === 'fixed' ? "LaTeX Fixed!" : "Math looks good!"}
            active={latexStatus === 'fixed'}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMathExpression('$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$')}
            title="Insert Quadratic Formula"
            className="h-8 px-2 text-xs"
          >
            <Calculator className="h-3 w-3 mr-1" />
            √
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMathExpression('$$\\int_{a}^{b} f(x) dx$$')}
            title="Insert Integral"
            className="h-8 px-2 text-xs"
          >
            ∫
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMathExpression('$$\\sum_{i=1}^{n} i$$')}
            title="Insert Summation"
            className="h-8 px-2 text-xs"
          >
            Σ
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* LaTeX Quick Fixes */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const content = editorRef.current?.innerHTML || '';
              const fixedContent = content
                .replace(/\\\(/g, '$')
                .replace(/\\\)/g, '$')
                .replace(/\\\[/g, '$$')
                .replace(/\\\]/g, '$$');
              setHtmlContent(fixedContent);
              if (onChange) onChange(fixedContent);
            }}
            title="Convert \\( \\) and \\[ \\] to $ and $$"
            className="h-8 px-2 text-xs"
          >
            <Wand2 className="h-3 w-3 mr-1" />
            Fix $
          </Button>
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
              setHtmlContent(testContent);
              if (onChange) {
                onChange(testContent);
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
              setHtmlContent(testMathContent);
              if (onChange) {
                onChange(testMathContent);
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
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
        onInput={updateContent}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className="p-3 min-h-[200px] focus:outline-none prose prose-sm max-w-none whitespace-pre-wrap"
        style={{ 
          minHeight: `${rows * 1.5}rem`,
          maxHeight: '500px',
          overflowY: 'auto',
          lineHeight: '1.6',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
        data-content={htmlContent || ''}
        spellCheck="true"
        autoCorrect="on"
        autoCapitalize="sentences"
      />
      
      {/* LaTeX Status Bar */}
      {latexStatus === 'issues' && (
        <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Corrupted LaTeX placeholders detected. Click the fix button above to restore proper math notation.</span>
        </div>
      )}
      
      {latexStatus === 'fixed' && (
        <div className="px-3 py-2 bg-green-50 border-t border-green-200 text-green-800 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>LaTeX placeholders have been fixed! Math expressions should now render properly.</span>
        </div>
      )}
      
      {/* Multi-line Editing Help */}
      {isFocused && (
        <div className="px-3 py-1 bg-blue-50 border-t border-blue-200 text-blue-700 text-xs">
          <strong>Editing shortcuts:</strong> Enter = New paragraph | Shift+Enter = Line break | Tab = Indent | Shift+Tab = Outdent | Ctrl+B/I/U = Bold/Italic/Underline
        </div>
      )}
    </div>
  );
};

export default HtmlEditor;
