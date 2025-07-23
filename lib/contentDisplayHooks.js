import { useState, useEffect, useMemo, useCallback } from 'react';
import { preprocessContent, analyzeContent, validateLaTeXStructure } from './contentProcessor';

/**
 * React Hooks for Content Processing and Display
 * 
 * These hooks provide a consistent interface for processing and displaying
 * content throughout the application, ensuring all content goes through
 * proper sanitization and validation.
 */

/**
 * Hook for processing and validating content
 * @param {string} rawContent - The raw content to process
 * @param {Object} options - Processing options
 * @returns {Object} - Processed content with metadata
 */
export function useContentProcessor(rawContent, options = {}) {
  const {
    autoProcess = true,
    enableValidation = true,
    enableAnalytics = false,
    onProcessingError = null,
    onValidationError = null
  } = options;

  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [errors, setErrors] = useState([]);

  // Content analysis
  const analysis = useMemo(() => {
    if (!rawContent || !autoProcess) return null;
    
    try {
      const result = analyzeContent(rawContent);
      if (enableAnalytics) {
        console.log('🔍 Content Analysis:', result);
      }
      return result;
    } catch (error) {
      const errorInfo = { type: 'analysis', error: error.message, timestamp: Date.now() };
      setErrors(prev => [...prev, errorInfo]);
      if (onProcessingError) onProcessingError(errorInfo);
      return null;
    }
  }, [rawContent, autoProcess, enableAnalytics, onProcessingError]);

  // Processed content
  const processedContent = useMemo(() => {
    if (!rawContent || !autoProcess) return rawContent;
    
    try {
      setProcessing(true);
      const result = preprocessContent(rawContent, analysis);
      setProcessed(true);
      setProcessing(false);
      
      if (enableAnalytics) {
        console.log('🔧 Content Processed Successfully');
      }
      
      return result;
    } catch (error) {
      const errorInfo = { type: 'processing', error: error.message, timestamp: Date.now() };
      setErrors(prev => [...prev, errorInfo]);
      setProcessing(false);
      if (onProcessingError) onProcessingError(errorInfo);
      return rawContent; // Fallback to original
    }
  }, [rawContent, analysis, autoProcess, enableAnalytics, onProcessingError]);

  // Validation
  const validation = useMemo(() => {
    if (!processedContent || !enableValidation) return null;
    
    try {
      const result = validateLaTeXStructure(processedContent);
      if (!result.isValid && onValidationError) {
        onValidationError(result);
      }
      return result;
    } catch (error) {
      const errorInfo = { type: 'validation', error: error.message, timestamp: Date.now() };
      setErrors(prev => [...prev, errorInfo]);
      if (onValidationError) onValidationError(errorInfo);
      return { isValid: false, errors: [error.message], warnings: [] };
    }
  }, [processedContent, enableValidation, onValidationError]);

  // Manual processing function
  const processManually = useCallback(() => {
    if (!rawContent) return;
    
    try {
      setProcessing(true);
      const newAnalysis = analyzeContent(rawContent);
      const newProcessed = preprocessContent(rawContent, newAnalysis);
      setProcessed(true);
      setProcessing(false);
      return { content: newProcessed, analysis: newAnalysis };
    } catch (error) {
      setProcessing(false);
      const errorInfo = { type: 'manual', error: error.message, timestamp: Date.now() };
      setErrors(prev => [...prev, errorInfo]);
      if (onProcessingError) onProcessingError(errorInfo);
      return null;
    }
  }, [rawContent, onProcessingError]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    // Content
    originalContent: rawContent,
    processedContent,
    
    // Metadata
    analysis,
    validation,
    
    // State
    processing,
    processed,
    errors,
    
    // Actions
    processManually,
    clearErrors,
    
    // Computed properties
    isValid: validation?.isValid ?? true,
    hasErrors: errors.length > 0,
    hasMath: analysis?.hasMath ?? false,
    hasMarkdown: analysis?.hasMarkdown ?? false,
    complexity: analysis?.complexity ?? 'simple'
  };
}

/**
 * Hook for managing content display state
 * @param {string} content - Content to display
 * @param {Object} options - Display options
 * @returns {Object} - Display state and controls
 */
export function useContentDisplay(content, options = {}) {
  const {
    renderingMode = 'auto',
    enableRetry = true,
    maxRetries = 3,
    enableAnalytics = false,
    onRenderError = null,
    onRenderSuccess = null
  } = options;

  const [currentMode, setCurrentMode] = useState(renderingMode);
  const [renderAttempts, setRenderAttempts] = useState(0);
  const [renderErrors, setRenderErrors] = useState([]);
  const [renderSuccess, setRenderSuccess] = useState(false);
  const [renderMetrics, setRenderMetrics] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Process content
  const { 
    processedContent, 
    analysis, 
    validation, 
    isValid, 
    hasErrors: processingErrors 
  } = useContentProcessor(content, { 
    enableAnalytics,
    onProcessingError: (error) => {
      console.warn('Processing Error:', error);
    }
  });

  // Handle render error
  const handleRenderError = useCallback((error, context = {}) => {
    const errorInfo = {
      error: error.message || error,
      context,
      attempt: renderAttempts + 1,
      mode: currentMode,
      timestamp: Date.now()
    };

    console.error('🚨 Render Error:', errorInfo);
    setRenderErrors(prev => [...prev, errorInfo]);
    setRenderAttempts(prev => prev + 1);
    setRenderSuccess(false);

    if (onRenderError) {
      onRenderError(errorInfo);
    }

    // Auto-fallback to safer mode if enabled
    if (enableRetry && renderAttempts < maxRetries) {
      setTimeout(() => {
        if (currentMode === 'full') setCurrentMode('safe');
        else if (currentMode === 'safe') setCurrentMode('plaintext');
      }, 100);
    }
  }, [renderAttempts, currentMode, enableRetry, maxRetries, onRenderError]);

  // Handle render success
  const handleRenderSuccess = useCallback((metrics) => {
    console.log('✅ Render Success:', metrics);
    setRenderSuccess(true);
    setRenderMetrics(metrics);

    if (onRenderSuccess) {
      onRenderSuccess({
        ...metrics,
        mode: currentMode,
        attempts: renderAttempts + 1
      });
    }
  }, [currentMode, renderAttempts, onRenderSuccess]);

  // Retry rendering
  const retryRender = useCallback(() => {
    setRenderErrors([]);
    setRenderAttempts(0);
    setRenderSuccess(false);
    setRenderMetrics(null);
  }, []);

  // Change rendering mode
  const changeMode = useCallback((newMode) => {
    setCurrentMode(newMode);
    retryRender();
  }, [retryRender]);

  // Determine if should show fallback
  const shouldShowFallback = renderErrors.length > 0 && 
                           renderAttempts >= maxRetries && 
                           !enableRetry;

  // Get render status
  const renderStatus = useMemo(() => {
    if (shouldShowFallback) return 'failed';
    if (renderSuccess) return 'success';
    if (renderAttempts > 0) return 'retrying';
    return 'ready';
  }, [shouldShowFallback, renderSuccess, renderAttempts]);

  return {
    // Content
    content: processedContent,
    originalContent: content,
    
    // Analysis
    analysis,
    validation,
    isValid,
    
    // Render state
    renderStatus,
    renderAttempts,
    renderErrors,
    renderSuccess,
    renderMetrics,
    shouldShowFallback,
    
    // Settings
    currentMode,
    showDebug,
    
    // Actions
    handleRenderError,
    handleRenderSuccess,
    retryRender,
    changeMode,
    setShowDebug,
    
    // Computed
    canRetry: enableRetry && renderAttempts < maxRetries,
    hasRenderErrors: renderErrors.length > 0,
    hasProcessingErrors: processingErrors
  };
}

/**
 * Hook for batch processing multiple content items
 * @param {Array} contentItems - Array of content strings
 * @param {Object} options - Processing options
 * @returns {Object} - Batch processing state and results
 */
export function useBatchContentProcessor(contentItems = [], options = {}) {
  const {
    autoProcess = true,
    batchSize = 10,
    onProgress = null,
    onComplete = null,
    onError = null
  } = options;

  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState([]);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);

  // Process batch
  const processBatch = useCallback(async () => {
    if (!contentItems.length || processing) return;

    setProcessing(true);
    setProcessed([]);
    setProgress(0);
    setErrors([]);

    try {
      const results = [];
      
      for (let i = 0; i < contentItems.length; i += batchSize) {
        const batch = contentItems.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (content, batchIndex) => {
            try {
              const analysis = analyzeContent(content);
              const processedContent = preprocessContent(content, analysis);
              const validation = validateLaTeXStructure(processedContent);
              
              return {
                index: i + batchIndex,
                original: content,
                processed: processedContent,
                analysis,
                validation,
                success: true
              };
            } catch (error) {
              return {
                index: i + batchIndex,
                original: content,
                processed: content,
                analysis: null,
                validation: null,
                success: false,
                error: error.message
              };
            }
          })
        );

        // Process batch results
        batchResults.forEach((result, batchIndex) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            if (!result.value.success) {
              setErrors(prev => [...prev, {
                index: i + batchIndex,
                error: result.value.error,
                content: result.value.original
              }]);
            }
          } else {
            const errorInfo = {
              index: i + batchIndex,
              error: result.reason?.message || 'Unknown error',
              content: batch[batchIndex]
            };
            setErrors(prev => [...prev, errorInfo]);
            results.push({
              index: i + batchIndex,
              original: batch[batchIndex],
              processed: batch[batchIndex],
              success: false,
              error: errorInfo.error
            });
          }
        });

        const newProgress = Math.min(((i + batchSize) / contentItems.length) * 100, 100);
        setProgress(newProgress);
        
        if (onProgress) {
          onProgress(newProgress, results.length, contentItems.length);
        }
      }

      setProcessed(results);
      setProcessing(false);

      if (onComplete) {
        onComplete(results, errors);
      }

      return results;

    } catch (error) {
      setProcessing(false);
      const errorInfo = { error: error.message, timestamp: Date.now() };
      setErrors(prev => [...prev, errorInfo]);
      
      if (onError) {
        onError(errorInfo);
      }
      
      return null;
    }
  }, [contentItems, processing, batchSize, onProgress, onComplete, onError]);

  // Auto-process when content changes
  useEffect(() => {
    if (autoProcess && contentItems.length > 0) {
      processBatch();
    }
  }, [contentItems, autoProcess]); // Removed processBatch from deps to avoid infinite loop

  return {
    // State
    processing,
    processed,
    progress,
    errors,
    
    // Actions
    processBatch,
    
    // Computed
    hasErrors: errors.length > 0,
    successCount: processed.filter(item => item.success).length,
    totalCount: contentItems.length,
    isComplete: !processing && processed.length === contentItems.length
  };
}

/**
 * Hook for real-time content validation
 * @param {string} content - Content to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation state and results
 */
export function useContentValidation(content, options = {}) {
  const {
    realtime = true,
    debounceMs = 300,
    validateLaTeX = true,
    validateMarkdown = true
  } = options;

  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation
  useEffect(() => {
    if (!content || !realtime) return;

    const timer = setTimeout(() => {
      setIsValidating(true);
      
      try {
        const analysis = analyzeContent(content);
        let validation = { isValid: true, errors: [], warnings: [] };
        
        if (validateLaTeX && analysis.hasMath) {
          validation = validateLaTeXStructure(content);
        }
        
        setValidationResult({
          ...validation,
          analysis,
          timestamp: Date.now()
        });
      } catch (error) {
        setValidationResult({
          isValid: false,
          errors: [error.message],
          warnings: [],
          analysis: null,
          timestamp: Date.now()
        });
      } finally {
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [content, realtime, debounceMs, validateLaTeX, validateMarkdown]);

  // Manual validation
  const validateManually = useCallback(() => {
    if (!content) return null;
    
    setIsValidating(true);
    
    try {
      const analysis = analyzeContent(content);
      let validation = { isValid: true, errors: [], warnings: [] };
      
      if (validateLaTeX && analysis.hasMath) {
        validation = validateLaTeXStructure(content);
      }
      
      const result = {
        ...validation,
        analysis,
        timestamp: Date.now()
      };
      
      setValidationResult(result);
      return result;
    } catch (error) {
      const result = {
        isValid: false,
        errors: [error.message],
        warnings: [],
        analysis: null,
        timestamp: Date.now()
      };
      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [content, validateLaTeX, validateMarkdown]);

  return {
    validationResult,
    isValidating,
    validateManually,
    isValid: validationResult?.isValid ?? true,
    errors: validationResult?.errors ?? [],
    warnings: validationResult?.warnings ?? [],
    analysis: validationResult?.analysis
  };
} 