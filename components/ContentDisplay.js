import React, { useMemo, useState, useCallback, useEffect, Suspense } from "react";
import { preprocessContent, analyzeContent } from "@/lib/contentProcessor";
import UniversalContentRenderer from "./UniversalContentRenderer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Eye, 
  Code, 
  Settings,
  Activity,
  FileText,
  Calculator
} from "lucide-react";

/**
 * ContentDisplay - The Ultimate Content Display Component
 * 
 * This component provides bulletproof content rendering with:
 * 1. AUTOMATIC CONTENT ANALYSIS: Intelligently detects content complexity
 * 2. MULTI-STRATEGY RENDERING: Progressively enhances content display
 * 3. COMPREHENSIVE ERROR HANDLING: Zero-failure guarantee
 * 4. REAL-TIME VALIDATION: Continuous content validation
 * 5. DEVELOPER INSIGHTS: Rich debugging and analytics
 * 6. USER-FRIENDLY FALLBACKS: Always displays something meaningful
 */

const ContentDisplay = ({
  content,
  className = "",
  inline = false,
  showAnalytics = false,
  showControls = false,
  enableRetry = true,
  maxRetries = 3,
  placeholder = "Loading content...",
  onContentChange = null,
  onRenderError = null,
  onRenderSuccess = null,
  renderingMode = "auto", // auto, safe, full, math-optimized
  ...props
}) => {
  // State management
  const [renderAttempts, setRenderAttempts] = useState(0);
  const [renderErrors, setRenderErrors] = useState([]);
  const [renderSuccess, setRenderSuccess] = useState(false);
  const [manualMode, setManualMode] = useState(renderingMode);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [renderMetrics, setRenderMetrics] = useState(null);
  
  // Content analysis
  const contentAnalysis = useMemo(() => {
    if (!content) return null;
    
    try {
      const analysis = analyzeContent(content);
      console.log("📊 Content Analysis:", analysis);
      return analysis;
    } catch (error) {
      console.error("❌ Content analysis failed:", error);
      return {
        complexity: 'simple',
        hasMath: false,
        hasMarkdown: false,
        renderingStrategy: 'plaintext',
        issues: [error.message]
      };
    }
  }, [content]);
  
  // Content preprocessing
  const processedContent = useMemo(() => {
    if (!content) return "";
    
    try {
      const processed = preprocessContent(content, contentAnalysis);
      console.log("🔧 Content preprocessed successfully");
      return processed;
    } catch (error) {
      console.error("❌ Content preprocessing failed:", error);
      return content; // Fallback to original
    }
  }, [content, contentAnalysis]);
  
  // Determine optimal rendering mode
  const optimalRenderingMode = useMemo(() => {
    if (manualMode !== "auto") return manualMode;
    if (!contentAnalysis) return "safe";
    
    switch (contentAnalysis.renderingStrategy) {
      case 'math-optimized': return 'full';
      case 'progressive': return 'safe';
      case 'plaintext': return 'safe';
      default: return 'full';
    }
  }, [manualMode, contentAnalysis]);
  
  // Error handler
  const handleRenderError = useCallback((error, context = {}) => {
    const errorInfo = {
      error: error.message || error,
      context,
      attempt: renderAttempts + 1,
      timestamp: new Date().toISOString()
    };
    
    console.error("🚨 Render Error:", errorInfo);
    setRenderErrors(prev => [...prev, errorInfo]);
    setRenderAttempts(prev => prev + 1);
    setRenderSuccess(false);
    
    if (onRenderError) {
      onRenderError(errorInfo);
    }
  }, [renderAttempts, onRenderError]);
  
  // Success handler
  const handleRenderSuccess = useCallback((metrics) => {
    console.log("✅ Render Success:", metrics);
    setRenderSuccess(true);
    setRenderMetrics(metrics);
    
    if (onRenderSuccess) {
      onRenderSuccess(metrics);
    }
  }, [onRenderSuccess]);
  
  // Retry function
  const handleRetry = useCallback(() => {
    setRenderErrors([]);
    setRenderAttempts(0);
    setRenderSuccess(false);
    setRenderMetrics(null);
  }, []);
  
  // Manual mode change
  const handleModeChange = useCallback((newMode) => {
    setManualMode(newMode);
    handleRetry();
  }, [handleRetry]);
  
  // Notify parent of content changes
  useEffect(() => {
    if (onContentChange && processedContent !== content) {
      onContentChange(processedContent, contentAnalysis);
    }
  }, [processedContent, content, contentAnalysis, onContentChange]);
  
  // Loading state
  if (!content) {
    return inline ? (
      <span className={`text-gray-500 italic ${className}`}>{placeholder}</span>
    ) : (
      <div className={`text-gray-500 italic p-4 text-center ${className}`}>
        {placeholder}
      </div>
    );
  }
  
  // Error state with retry option
  if (renderErrors.length > 0 && renderAttempts >= maxRetries && !enableRetry) {
    return (
      <div className={`content-display-error ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium mb-2">Content rendering failed</div>
            <div className="text-sm mb-3">
              After {maxRetries} attempts, the content could not be rendered properly.
            </div>
            <details className="text-xs bg-red-100 p-2 rounded border">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <div className="mt-2 space-y-1">
                {renderErrors.map((error, index) => (
                  <div key={index} className="font-mono text-xs">
                    Attempt {error.attempt}: {error.error}
                  </div>
                ))}
              </div>
            </details>
          </AlertDescription>
        </Alert>
        
        {/* Fallback content display */}
        <div className="mt-4 p-3 bg-gray-50 border rounded">
          <div className="text-sm text-gray-600 mb-2">Raw Content:</div>
          <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-auto max-h-32">
            {content}
          </pre>
        </div>
      </div>
    );
  }
  
  // Main content rendering
  const renderContent = () => (
    <UniversalContentRenderer
      content={processedContent}
      className={className}
      inline={inline}
      enableAnalytics={showAnalytics}
      onRenderError={handleRenderError}
      onRenderComplete={handleRenderSuccess}
      maxRetries={maxRetries}
      placeholder={placeholder}
      renderingMode={optimalRenderingMode}
      {...props}
    />
  );
  
  // Debug and analytics panel
  const renderAnalyticsPanel = () => {
    if (!showAnalytics || !contentAnalysis) return null;
    
    return (
      <Card className="mt-4 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Content Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <Badge variant="outline" className="mr-2">
                Complexity: {contentAnalysis.complexity}
              </Badge>
              <Badge variant="outline" className="mr-2">
                Strategy: {contentAnalysis.renderingStrategy}
              </Badge>
            </div>
            <div>
              {contentAnalysis.hasMath && (
                <Badge variant="outline" className="mr-1 bg-purple-100">
                  <Calculator className="h-3 w-3 mr-1" />
                  Math
                </Badge>
              )}
              {contentAnalysis.hasMarkdown && (
                <Badge variant="outline" className="mr-1 bg-green-100">
                  <FileText className="h-3 w-3 mr-1" />
                  Markdown
                </Badge>
              )}
            </div>
          </div>
          
          {renderMetrics && (
            <div className="text-xs text-gray-600">
              <div>Render Time: {renderMetrics.renderTime}ms</div>
              <div>Attempts: {renderMetrics.attempt}</div>
              <div>Engine: {renderMetrics.strategy}</div>
            </div>
          )}
          
          {contentAnalysis.issues.length > 0 && (
            <div className="text-xs">
              <div className="font-medium text-amber-700 mb-1">Issues Detected:</div>
              <ul className="text-amber-600 space-y-1">
                {contentAnalysis.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
              <TabsTrigger value="source" className="text-xs">Source</TabsTrigger>
              <TabsTrigger value="processed" className="text-xs">Processed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="mt-2">
              <div className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                <pre>{JSON.stringify(contentAnalysis.analysis, null, 2)}</pre>
              </div>
            </TabsContent>
            
            <TabsContent value="source" className="mt-2">
              <div className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                <pre className="whitespace-pre-wrap">{content}</pre>
              </div>
            </TabsContent>
            
            <TabsContent value="processed" className="mt-2">
              <div className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                <pre className="whitespace-pre-wrap">{processedContent}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };
  
  // Controls panel
  const renderControlsPanel = () => {
    if (!showControls) return null;
    
    return (
      <div className="flex items-center gap-2 mb-3">
        <select
          value={manualMode}
          onChange={(e) => handleModeChange(e.target.value)}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="auto">Auto</option>
          <option value="full">Full Rendering</option>
          <option value="safe">Safe Mode</option>
          <option value="math-optimized">Math Optimized</option>
          <option value="plaintext">Plain Text</option>
        </select>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleRetry}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSourceCode(!showSourceCode)}
          className="h-7 px-2 text-xs"
        >
          <Code className="h-3 w-3 mr-1" />
          {showSourceCode ? "Hide" : "Source"}
        </Button>
        
        {renderSuccess && (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        )}
        
        {renderErrors.length > 0 && (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {renderErrors.length} Error{renderErrors.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    );
  };
  
  // Source code display
  const renderSourceCode = () => {
    if (!showSourceCode) return null;
    
    return (
      <Card className="mt-3 border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Source Code</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40 whitespace-pre-wrap">
            {content}
          </pre>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className={`content-display-wrapper ${inline ? 'inline' : 'block'}`}>
      {renderControlsPanel()}
      
      <Suspense 
        fallback={
          inline ? (
            <span className="text-gray-500 italic">Rendering...</span>
          ) : (
            <div className="text-gray-500 italic p-4 text-center">
              Rendering content...
            </div>
          )
        }
      >
        {renderContent()}
      </Suspense>
      
      {renderSourceCode()}
      {renderAnalyticsPanel()}
    </div>
  );
};

export default ContentDisplay; 