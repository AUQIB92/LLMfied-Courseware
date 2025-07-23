import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentDisplay from '@/components/ContentDisplay';
import { useContentValidation, useContentProcessor } from '@/lib/contentDisplayHooks';
import { 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Code, 
  Zap,
  BarChart3,
  Brain,
  AlertCircle,
  Info
} from 'lucide-react';

/**
 * ContentEditor - Advanced content editing with real-time validation
 * 
 * This component provides:
 * 1. REAL-TIME VALIDATION: Live feedback on content quality
 * 2. LIVE PREVIEW: See exactly how content will render
 * 3. CONTENT ANALYSIS: Detailed insights into content complexity
 * 4. ERROR PREVENTION: Catch issues before they reach students
 * 5. PERFORMANCE METRICS: Understand rendering characteristics
 */
const ContentEditor = ({
  initialContent = "",
  placeholder = "Enter your content with LaTeX math and markdown...",
  onContentChange = null,
  onValidationChange = null,
  className = "",
  showAdvancedFeatures = true,
  autoSave = false,
  debounceMs = 500
}) => {
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState('editor');

  // Real-time content validation
  const {
    validationResult,
    isValidating,
    validateManually,
    isValid,
    errors,
    warnings,
    analysis
  } = useContentValidation(content, {
    realtime: true,
    debounceMs: debounceMs,
    validateLaTeX: true,
    validateMarkdown: true
  });

  // Content processing for analysis
  const {
    processedContent,
    analysis: processingAnalysis,
    processing,
    hasErrors: processingErrors
  } = useContentProcessor(content, {
    autoProcess: true,
    enableValidation: true,
    enableAnalytics: showAdvancedFeatures
  });

  // Handle content changes
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    
    if (onContentChange) {
      onContentChange(newContent, {
        processed: processedContent,
        analysis: analysis || processingAnalysis,
        validation: validationResult,
        isValid
      });
    }
  }, [onContentChange, processedContent, analysis, processingAnalysis, validationResult, isValid]);

  // Handle validation changes
  React.useEffect(() => {
    if (onValidationChange && validationResult) {
      onValidationChange(validationResult);
    }
  }, [validationResult, onValidationChange]);

  // Get validation status
  const getValidationStatus = () => {
    if (isValidating) return { status: 'validating', label: 'Validating...', color: 'blue' };
    if (!isValid) return { status: 'error', label: 'Has Issues', color: 'red' };
    if (warnings.length > 0) return { status: 'warning', label: 'Has Warnings', color: 'yellow' };
    return { status: 'valid', label: 'Valid', color: 'green' };
  };

  const validationStatus = getValidationStatus();

  // Render validation feedback
  const renderValidationFeedback = () => {
    if (!showAdvancedFeatures) return null;

    return (
      <div className="space-y-3">
        {/* Validation Status */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={validationStatus.color === 'green' ? 'default' : 'secondary'}
            className={`
              ${validationStatus.color === 'green' ? 'bg-green-100 text-green-800' : ''}
              ${validationStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${validationStatus.color === 'red' ? 'bg-red-100 text-red-800' : ''}
              ${validationStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
            `}
          >
            {validationStatus.color === 'green' && <CheckCircle className="h-3 w-3 mr-1" />}
            {validationStatus.color === 'yellow' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {validationStatus.color === 'red' && <AlertCircle className="h-3 w-3 mr-1" />}
            {validationStatus.color === 'blue' && <Zap className="h-3 w-3 mr-1" />}
            {validationStatus.label}
          </Badge>
          
          {analysis && (
            <Badge variant="outline" className="text-xs">
              {analysis.complexity} complexity
            </Badge>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="font-medium text-red-800 mb-1">Validation Errors:</div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-red-500">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="font-medium text-yellow-800 mb-1">Warnings:</div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-yellow-500">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Analysis Info */}
        {analysis && isValid && errors.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="text-sm text-blue-700">
                <strong>Analysis:</strong> {analysis.hasMath && "Contains math expressions. "}
                {analysis.hasMarkdown && "Contains markdown formatting. "}
                Estimated render time: {analysis.estimatedRenderTime}ms
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  // Render content analysis
  const renderContentAnalysis = () => {
    if (!showAdvancedFeatures || !analysis) return null;

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Content Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium text-gray-700">Content Type</div>
              <div className="text-gray-600">
                {analysis.hasMath && analysis.hasMarkdown ? "Math + Markdown" :
                 analysis.hasMath ? "Mathematical" :
                 analysis.hasMarkdown ? "Markdown" : "Plain Text"}
              </div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700">Complexity</div>
              <div className="text-gray-600 capitalize">{analysis.complexity}</div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700">Render Strategy</div>
              <div className="text-gray-600 capitalize">{analysis.renderingStrategy.replace('-', ' ')}</div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700">Est. Render Time</div>
              <div className="text-gray-600">{Math.round(analysis.estimatedRenderTime)}ms</div>
            </div>
          </div>

          {analysis.analysis && (
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500 space-y-1">
                <div>Math expressions: {analysis.analysis.mathContent?.inlineMath || 0} inline, {analysis.analysis.mathContent?.displayMath || 0} display</div>
                <div>Markdown elements: {analysis.analysis.markdownContent?.headers || 0} headers, {analysis.analysis.markdownContent?.lists || 0} lists</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`content-editor ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Content Editor</CardTitle>
                <div className="flex items-center gap-2">
                  {processing && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1 animate-pulse" />
                      Processing...
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateManually}
                    disabled={isValidating}
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={placeholder}
                className="min-h-[300px] font-mono text-sm"
                style={{ resize: 'vertical' }}
              />
              
              {renderValidationFeedback()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px]">
                <ContentDisplay 
                  content={content}
                  renderingMode="math-optimized"
                  showAnalytics={showAdvancedFeatures}
                  showControls={showAdvancedFeatures}
                  className="preview-content"
                  placeholder="Enter content in the editor to see preview..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Content Analysis & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {content ? (
                <div className="space-y-4">
                  {renderValidationFeedback()}
                  {renderContentAnalysis()}
                  
                  {/* Raw analysis data for debugging */}
                  {showAdvancedFeatures && process.env.NODE_ENV === 'development' && (
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-600">Debug Info</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                          {JSON.stringify({ 
                            analysis, 
                            validation: validationResult,
                            processing: { processing, processingErrors }
                          }, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Enter content to see detailed analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentEditor; 