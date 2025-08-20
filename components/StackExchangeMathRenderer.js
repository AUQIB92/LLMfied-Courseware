"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
// CSS will be imported in the app

/**
 * StackExchangeMathRenderer - Math rendering using StackExchange's MathJax configuration
 * 
 * This component replicates the exact MathJax setup used by Math StackExchange:
 * - MathJax v3 with TeX input and CommonHTML output
 * - Same configuration as SE for consistent rendering
 * - Proper error handling and fallbacks
 * - Optimized for performance like SE
 */

// StackExchange's exact MathJax configuration
const STACK_EXCHANGE_MATHJAX_CONFIG = {
  loader: {
    load: ['[tex]/ams', '[tex]/physics', '[tex]/color', '[tex]/cancel', '[tex]/mhchem']
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    tags: 'none',
    packages: {
      '[+]': ['base', 'ams', 'newcommand', 'configmacros', 'physics', 'color', 'cancel', 'mhchem']
    },
    macros: {
      // StackExchange common macros
      "\\R": "\\mathbb{R}",
      "\\Q": "\\mathbb{Q}",
      "\\Z": "\\mathbb{Z}",
      "\\N": "\\mathbb{N}",
      "\\C": "\\mathbb{C}",
      "\\F": "\\mathbb{F}",
      "\\d": "\\mathrm{d}",
      "\\e": "\\mathrm{e}",
      "\\i": "\\mathrm{i}",
      "\\Re": "\\operatorname{Re}",
      "\\Im": "\\operatorname{Im}",
      "\\rank": "\\operatorname{rank}",
      "\\trace": "\\operatorname{trace}",
      "\\Tr": "\\operatorname{Tr}",
      "\\det": "\\operatorname{det}",
      "\\deg": "\\operatorname{deg}",
      "\\gcd": "\\operatorname{gcd}",
      "\\lcm": "\\operatorname{lcm}",
      "\\max": "\\operatorname{max}",
      "\\min": "\\operatorname{min}",
      "\\sup": "\\operatorname{sup}",
      "\\inf": "\\operatorname{inf}",
      "\\lim": "\\operatorname*{lim}",
      "\\limsup": "\\operatorname*{lim\\,sup}",
      "\\liminf": "\\operatorname*{lim\\,inf}",
      "\\argmax": "\\operatorname*{arg\\,max}",
      "\\argmin": "\\operatorname*{arg\\,min}",
      "\\dim": "\\operatorname{dim}",
      "\\ker": "\\operatorname{ker}",
      "\\span": "\\operatorname{span}",
      "\\null": "\\operatorname{null}",
      "\\range": "\\operatorname{range}",
      "\\col": "\\operatorname{col}",
      "\\row": "\\operatorname{row}",
      "\\adj": "\\operatorname{adj}",
      "\\sign": "\\operatorname{sign}",
      "\\sinc": "\\operatorname{sinc}",
      "\\csch": "\\operatorname{csch}",
      "\\sech": "\\operatorname{sech}",
      "\\arcsec": "\\operatorname{arcsec}",
      "\\arccsc": "\\operatorname{arccsc}",
      "\\arccot": "\\operatorname{arccot}",
      "\\arccosh": "\\operatorname{arccosh}",
      "\\arcsinh": "\\operatorname{arcsinh}",
      "\\arctanh": "\\operatorname{arctanh}",
      "\\arcsech": "\\operatorname{arcsech}",
      "\\arccsch": "\\operatorname{arccsch}",
      "\\arccoth": "\\operatorname{arccoth}",
      "\\Pr": "\\operatorname{Pr}",
      "\\Var": "\\operatorname{Var}",
      "\\Cov": "\\operatorname{Cov}",
      "\\Corr": "\\operatorname{Corr}",
      "\\E": "\\operatorname{E}",
      "\\card": "\\operatorname{card}",
      "\\lceil": "\\left\\lceil",
      "\\rceil": "\\right\\rceil",
      "\\lfloor": "\\left\\lfloor",
      "\\rfloor": "\\right\\rfloor",
      "\\langle": "\\left\\langle",
      "\\rangle": "\\right\\rangle",
      "\\implies": "\\Rightarrow",
      "\\iff": "\\Leftrightarrow",
      "\\land": "\\wedge",
      "\\lor": "\\vee",
      "\\lnot": "\\neg",
      "\\top": "\\mathord{\\top}",
      "\\bot": "\\mathord{\\bot}",
      "\\models": "\\vDash",
      "\\vdash": "\\vdash",
      "\\dashv": "\\dashv",
      "\\therefore": "\\therefore",
      "\\because": "\\because",
      "\\owns": "\\ni",
      "\\subseteq": "\\subseteq",
      "\\supseteq": "\\supseteq",
      "\\subset": "\\subset",
      "\\supset": "\\supset",
      "\\subsetneq": "\\subsetneq",
      "\\supsetneq": "\\supsetneq",
      "\\emptyset": "\\varnothing",
      "\\O": "\\emptyset",
      "\\Alpha": "\\mathrm{A}",
      "\\Beta": "\\mathrm{B}",
      "\\Epsilon": "\\mathrm{E}",
      "\\Zeta": "\\mathrm{Z}",
      "\\Eta": "\\mathrm{H}",
      "\\Iota": "\\mathrm{I}",
      "\\Kappa": "\\mathrm{K}",
      "\\Mu": "\\mathrm{M}",
      "\\Nu": "\\mathrm{N}",
      "\\Omicron": "\\mathrm{O}",
      "\\Rho": "\\mathrm{P}",
      "\\Tau": "\\mathrm{T}",
      "\\Chi": "\\mathrm{X}",
      "\\epsilon": "\\varepsilon",
      "\\phi": "\\varphi",
      "\\rho": "\\varrho",
      "\\sigma": "\\varsigma",
      "\\theta": "\\vartheta"
    }
  },
  // Use CommonHTML output like StackExchange
  chtml: {
    scale: 1,
    minScale: 0.5,
    matchFontHeight: false,
    mtextInheritFont: false,
    merrorInheritFont: false,
    fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2',
    displayAlign: 'center',
    displayIndent: '0'
  },
  options: {
    skipHtmlTags: {
      '[-]': ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml']
    },
    includeHtmlTags: {
      '[+]': ['span']
    },
    processHtmlClass: 'tex2jax_process',
    ignoreHtmlClass: 'tex2jax_ignore'
  },
  startup: {
    typeset: false,
    ready: () => {
      console.log('MathJax ready with StackExchange config');
    }
  }
};

// Global MathJax loader with StackExchange config
let mathJaxPromise = null;
let mathJaxLoadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 3;

const loadStackExchangeMathJax = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  
  // Check if MathJax is already loaded and working
  if (window.MathJax && window.MathJax.version && typeof window.MathJax.typesetPromise === 'function') {
    return Promise.resolve(window.MathJax);
  }

  if (!mathJaxPromise && mathJaxLoadAttempts < MAX_LOAD_ATTEMPTS) {
    mathJaxLoadAttempts++;
    
    mathJaxPromise = new Promise((resolve, reject) => {
      let timeoutId;
      
      // Configure MathJax before loading with startup callback
      window.MathJax = {
        ...STACK_EXCHANGE_MATHJAX_CONFIG,
        startup: {
          ready: () => {
            console.log('🔬 MathJax startup ready callback triggered');
            // Call the default ready function
            if (window.MathJax.startup && window.MathJax.startup.defaultReady) {
              window.MathJax.startup.defaultReady();
            }
            
            // Wait for MathJax to be fully ready
            const checkReady = () => {
              if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
                console.log('✅ MathJax fully initialized with Stack Exchange config');
                if (timeoutId) clearTimeout(timeoutId);
                resolve(window.MathJax);
              } else {
                console.log('⏳ MathJax still initializing...');
                setTimeout(checkReady, 100);
              }
            };
            
            // Check immediately and then with delays
            checkReady();
          }
        }
      };

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
      script.async = true;
      
      timeoutId = setTimeout(() => {
        script.onload = script.onerror = null;
        console.error('❌ MathJax load timeout after 20 seconds');
        reject(new Error('MathJax load timeout'));
      }, 20000); // 20 second timeout
      
      script.onload = () => {
        console.log('📦 MathJax script loaded, waiting for initialization...');
        // Don't resolve here - let the startup ready callback handle it
      };
      
      script.onerror = (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('❌ Failed to load MathJax script:', error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
    
    // Handle errors and cleanup
    mathJaxPromise = mathJaxPromise.catch(error => {
      console.error(`MathJax load attempt ${mathJaxLoadAttempts} failed:`, error);
      mathJaxPromise = null;
      throw error;
    });
  }

  return mathJaxPromise || Promise.reject(new Error('Max load attempts reached'));
};

const StackExchangeMathRenderer = ({ 
  content, 
  className = "", 
  inline = false,
  showMetrics = false,
  contentType = 'general', // 'general', 'proof', 'theorem', 'example', 'definition'
  enableHover = true,
  enableCopy = true,
  autoScale = true
}) => {
  const containerRef = useRef(null);
  const [renderState, setRenderState] = useState('loading'); // loading, success, error
  const [renderTime, setRenderTime] = useState(0);
  const [mathJaxReady, setMathJaxReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [renderedHtml, setRenderedHtml] = useState('');

  // Process content to clean up and prepare for MathJax
  const processedContent = useMemo(() => {
    if (!content || typeof content !== 'string') return '';
    
    let processed = content;
    
    // Clean up common LaTeX issues that might cause MathJax to fail
    processed = processed
      // Fix escaped dollar signs
      .replace(/\\\$/g, '$')
      // Fix double backslashes in commands
      .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
      // Ensure proper spacing around math delimiters
      .replace(/\$([^$]+)\$/g, ' $$$1$$ ')
      .replace(/\$\$([^$]+)\$\$/g, '\n\n$$$$1$$\n\n')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return processed;
  }, [content]);

  // Load MathJax
  useEffect(() => {
    let isCancelled = false;
    
    const loadMathJax = async () => {
      try {
        setRenderState('loading');
        const mj = await loadStackExchangeMathJax();
        
        if (!isCancelled && mj) {
          setMathJaxReady(true);
          console.log('📐 MathJax ready for rendering');
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('❌ MathJax loading failed:', error);
          setRenderState('error');
        }
      }
    };

    loadMathJax();
    
    return () => {
      isCancelled = true;
    };
  }, []);

  // Render math when content changes and MathJax is ready
  useEffect(() => {
    if (!mathJaxReady || !containerRef.current || !processedContent) return;

    let isCancelled = false;
    
    const renderMath = async () => {
      try {
        const startTime = Date.now();
        setRenderState('loading');
        
        // Process content with MathJax in a temporary container
        if (!window.MathJax) {
          throw new Error('MathJax not available on window');
        }

        if (!window.MathJax.typesetPromise) {
          throw new Error('MathJax.typesetPromise not available');
        }

        // Create temporary container for MathJax processing
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedContent;
        
        // Process with MathJax
        await window.MathJax.typesetPromise([tempDiv]);
        
        if (!isCancelled) {
          // Set the processed HTML content
          setRenderedHtml(tempDiv.innerHTML);
          setRenderKey(prev => prev + 1);
          
          const endTime = Date.now();
          setRenderTime(endTime - startTime);
          setRenderState('success');
          console.log(`✅ Math rendered successfully in ${endTime - startTime}ms`);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('❌ MathJax rendering failed, trying KaTeX fallback:', error);
          
          // Try KaTeX as fallback
          try {
            const katex = (await import('katex')).default;
            await import('katex/dist/katex.min.css');
            
            let katexProcessed = processedContent;
            
            // Handle display math
            katexProcessed = katexProcessed.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
              try {
                return katex.renderToString(math, { displayMode: true });
              } catch (katexError) {
                console.warn('KaTeX display math error:', katexError);
                return `<div class="math-error" style="color: red; font-style: italic;">[Math Error: ${math}]</div>`;
              }
            });
            
            // Handle inline math  
            katexProcessed = katexProcessed.replace(/\$([^$\n]+)\$/g, (match, math) => {
              try {
                return katex.renderToString(math, { displayMode: false });
              } catch (katexError) {
                console.warn('KaTeX inline math error:', katexError);
                return `<span class="math-error" style="color: red; font-style: italic;">[${math}]</span>`;
              }
            });
            
            if (!isCancelled) {
              setRenderedHtml(katexProcessed);
              setRenderKey(prev => prev + 1);
              setRenderState('success');
              console.log('✅ Math rendered successfully with KaTeX fallback');
              return;
            }
          } catch (katexError) {
            console.error('❌ KaTeX fallback also failed:', katexError);
          }
          
          // Final fallback - show formatted content
          setRenderState('error');
          
          // Show more user-friendly fallback content using React-safe approach
          const fallbackContent = processedContent
            .replace(/\$\$([^$]+)\$\$/g, '<div style="text-align: center; font-style: italic; color: #666; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">Math: $1</div>')
            .replace(/\$([^$]+)\$/g, '<span style="font-style: italic; color: #666; background: #f0f0f0; padding: 2px 4px; border-radius: 2px;">$1</span>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
          
          const errorHtml = `
            <div style="border: 2px solid #ffd700; background: #fffbf0; padding: 12px; border-radius: 8px; margin: 10px 0;">
              <div style="color: #b8860b; font-weight: bold; margin-bottom: 8px;">⚠️ Math rendering temporarily unavailable</div>
              <div style="color: #8b7355; font-size: 14px; margin-bottom: 10px;">Showing content with basic formatting:</div>
              <div>${fallbackContent}</div>
            </div>
          `;
          
          setRenderedHtml(errorHtml);
        }
      }
    };

    renderMath();
    
    return () => {
      isCancelled = true;
    };
  }, [mathJaxReady, processedContent]);

  // Copy to clipboard functionality
  const handleCopy = async () => {
    if (processedContent) {
      try {
        await navigator.clipboard.writeText(processedContent);
        console.log('📋 Math content copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const WrapperComponent = inline ? 'span' : 'div';
  const contentTypeClass = contentType !== 'general' ? `${contentType}-content` : '';

  if (!processedContent) {
    return (
      <WrapperComponent className={`stack-math-renderer empty ${className}`}>
        <span className="text-gray-400 italic">No content</span>
      </WrapperComponent>
    );
  }

  return (
    <WrapperComponent 
      className={`stack-math-renderer ${renderState} ${inline ? 'inline' : 'block'} ${contentTypeClass} ${className}`}
      style={{
        transform: autoScale && !inline && renderState === 'success' ? 'scale(1)' : undefined,
        transition: 'transform 0.2s ease-in-out'
      }}
    >
      <div style={{ position: 'relative' }}>
        {renderState === 'loading' ? (
          <div
            key={renderKey}
            ref={containerRef}
            className={inline ? 'inline-block' : 'block'}
            style={{
              minHeight: inline ? 'auto' : '20px',
              lineHeight: inline ? 'inherit' : '1.6',
              position: 'relative'
            }}
          >
            <div className="stack-math-loading">
              <span className="text-blue-600 text-sm">
                {mathJaxReady ? '🔄 Rendering math...' : '📐 Loading MathJax...'}
              </span>
            </div>
          </div>
        ) : (
          <div
            key={renderKey}
            ref={containerRef}
            className={inline ? 'inline-block' : 'block'}
            dangerouslySetInnerHTML={{ __html: renderedHtml || processedContent }}
            style={{
              minHeight: inline ? 'auto' : '20px',
              lineHeight: inline ? 'inherit' : '1.6',
              position: 'relative'
            }}
            onMouseEnter={enableHover && !inline ? (e) => {
              if (renderState === 'success') {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            } : undefined}
            onMouseLeave={enableHover && !inline ? (e) => {
              if (renderState === 'success') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            } : undefined}
          />
        )}
        
        {enableCopy && !inline && renderState === 'success' && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white shadow-sm border border-gray-200 rounded p-1 text-xs text-gray-600 hover:text-gray-800"
            title="Copy LaTeX to clipboard"
            style={{ zIndex: 10 }}
          >
            📋
          </button>
        )}
      </div>
      
      {showMetrics && renderState === 'success' && (
        <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200 flex items-center gap-2">
          <span>✅ Rendered with StackExchange MathJax in {renderTime}ms</span>
          {contentType !== 'general' && (
            <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
              {contentType.toUpperCase()}
            </span>
          )}
        </div>
      )}
      
      {renderState === 'error' && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          ❌ Math rendering failed - showing fallback content
          {enableCopy && (
            <button
              onClick={handleCopy}
              className="ml-2 underline hover:no-underline"
              title="Copy raw LaTeX"
            >
              Copy LaTeX
            </button>
          )}
        </div>
      )}
    </WrapperComponent>
  );
};

export default StackExchangeMathRenderer;