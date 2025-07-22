"use client"

import React, { createContext, useContext, useState, useCallback } from 'react';
import PerfectMathRenderer from './PerfectMathRenderer';

// Create context for math rendering configuration
const MathRenderingContext = createContext({
  renderingStats: {},
  telemetryEnabled: false,
  enableTelemetry: () => {},
  disableTelemetry: () => {},
  recordRenderingEvent: () => {},
  clearStats: () => {},
});

/**
 * MathRenderingProvider - Global provider for math rendering configuration
 * 
 * This component provides a context for math rendering configuration and telemetry.
 * It allows for centralized control of math rendering options and collection of
 * rendering statistics for continuous improvement.
 */
export function MathRenderingProvider({ children }) {
  const [renderingStats, setRenderingStats] = useState({
    totalRendered: 0,
    successCount: 0,
    errorCount: 0,
    averageRenderTime: 0,
    engineStats: {
      katex: { count: 0, errors: 0, averageTime: 0 },
      mathjax: { count: 0, errors: 0, averageTime: 0 },
      hybrid: { count: 0, errors: 0, averageTime: 0 },
      plain: { count: 0, errors: 0, averageTime: 0 },
    },
    complexityStats: {
      none: 0,
      simple: 0,
      moderate: 0,
      complex: 0,
    },
    errorTypes: {},
  });
  
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  
  // Enable telemetry collection
  const enableTelemetry = useCallback(() => {
    setTelemetryEnabled(true);
    console.log('Math rendering telemetry enabled');
  }, []);
  
  // Disable telemetry collection
  const disableTelemetry = useCallback(() => {
    setTelemetryEnabled(false);
    console.log('Math rendering telemetry disabled');
  }, []);
  
  // Record a rendering event
  const recordRenderingEvent = useCallback((event) => {
    if (!telemetryEnabled) return;
    
    setRenderingStats(prev => {
      // Extract event data
      const { engine, duration, analysis, success, error } = event;
      const complexity = analysis?.complexity || 'none';
      
      // Update engine stats
      const engineStats = { ...prev.engineStats };
      if (engine) {
        const currentEngineStats = engineStats[engine] || { count: 0, errors: 0, averageTime: 0 };
        const newCount = currentEngineStats.count + 1;
        const newErrors = error ? currentEngineStats.errors + 1 : currentEngineStats.errors;
        const newAverageTime = duration 
          ? ((currentEngineStats.averageTime * currentEngineStats.count) + duration) / newCount
          : currentEngineStats.averageTime;
          
        engineStats[engine] = {
          count: newCount,
          errors: newErrors,
          averageTime: newAverageTime,
        };
      }
      
      // Update complexity stats
      const complexityStats = { ...prev.complexityStats };
      if (complexity) {
        complexityStats[complexity] = (complexityStats[complexity] || 0) + 1;
      }
      
      // Update error types
      const errorTypes = { ...prev.errorTypes };
      if (error) {
        const errorType = error.message?.substring(0, 50) || 'Unknown error';
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      }
      
      // Update overall stats
      const totalRendered = prev.totalRendered + 1;
      const successCount = success ? prev.successCount + 1 : prev.successCount;
      const errorCount = error ? prev.errorCount + 1 : prev.errorCount;
      const averageRenderTime = duration 
        ? ((prev.averageRenderTime * prev.totalRendered) + duration) / totalRendered
        : prev.averageRenderTime;
      
      return {
        totalRendered,
        successCount,
        errorCount,
        averageRenderTime,
        engineStats,
        complexityStats,
        errorTypes,
      };
    });
  }, [telemetryEnabled]);
  
  // Clear all stats
  const clearStats = useCallback(() => {
    setRenderingStats({
      totalRendered: 0,
      successCount: 0,
      errorCount: 0,
      averageRenderTime: 0,
      engineStats: {
        katex: { count: 0, errors: 0, averageTime: 0 },
        mathjax: { count: 0, errors: 0, averageTime: 0 },
        hybrid: { count: 0, errors: 0, averageTime: 0 },
        plain: { count: 0, errors: 0, averageTime: 0 },
      },
      complexityStats: {
        none: 0,
        simple: 0,
        moderate: 0,
        complex: 0,
      },
      errorTypes: {},
    });
  }, []);
  
  const contextValue = {
    renderingStats,
    telemetryEnabled,
    enableTelemetry,
    disableTelemetry,
    recordRenderingEvent,
    clearStats,
  };
  
  return (
    <MathRenderingContext.Provider value={contextValue}>
      {children}
    </MathRenderingContext.Provider>
  );
}

// Custom hook for accessing math rendering context
export function useMathRendering() {
  const context = useContext(MathRenderingContext);
  if (context === undefined) {
    throw new Error('useMathRendering must be used within a MathRenderingProvider');
  }
  return context;
}

// Enhanced math renderer with context integration
export function EnhancedMathRenderer({ content, className, inline, forceEngine, accessibilityLabel }) {
  const { telemetryEnabled, recordRenderingEvent } = useMathRendering();
  
  const handleRenderComplete = useCallback((event) => {
    recordRenderingEvent({ ...event, success: true });
  }, [recordRenderingEvent]);
  
  const handleRenderError = useCallback((event) => {
    recordRenderingEvent({ ...event, success: false, error: event.error });
  }, [recordRenderingEvent]);
  
  return (
    <PerfectMathRenderer
      content={content}
      className={className}
      inline={inline}
      forceEngine={forceEngine}
      enableTelemetry={telemetryEnabled}
      onRenderComplete={handleRenderComplete}
      onRenderError={handleRenderError}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export default MathRenderingProvider;