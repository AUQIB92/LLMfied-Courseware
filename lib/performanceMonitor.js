/**
 * Performance Monitor for Content Rendering System
 * 
 * This module provides comprehensive monitoring of content rendering
 * performance, error rates, and system health metrics.
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderAttempts: 0,
      renderSuccesses: 0,
      renderErrors: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      errorsByType: {},
      providerUsage: {},
      contentComplexity: {},
      renderStrategies: {},
      lastUpdated: null
    };
    
    this.errorLog = [];
    this.performanceLog = [];
    this.maxLogSize = 1000;
    
    // Enable analytics in development or when explicitly enabled
    this.analyticsEnabled = process.env.NODE_ENV === 'development' || 
                           process.env.ENABLE_RENDER_METRICS === 'true';
    
    if (this.analyticsEnabled) {
      console.log('📊 Content Rendering Performance Monitor initialized');
    }
  }

  /**
   * Track a successful render
   */
  trackRenderSuccess(metrics) {
    if (!this.analyticsEnabled) return;

    const {
      renderTime = 0,
      strategy = 'unknown',
      complexity = 'simple',
      provider = 'unknown',
      contentLength = 0,
      hasMath = false,
      hasMarkdown = false,
      attempt = 1
    } = metrics;

    this.metrics.renderAttempts++;
    this.metrics.renderSuccesses++;
    this.metrics.totalRenderTime += renderTime;
    this.metrics.averageRenderTime = this.metrics.totalRenderTime / this.metrics.renderSuccesses;
    this.metrics.lastUpdated = new Date().toISOString();

    // Track provider usage
    this.metrics.providerUsage[provider] = (this.metrics.providerUsage[provider] || 0) + 1;

    // Track complexity distribution
    this.metrics.contentComplexity[complexity] = (this.metrics.contentComplexity[complexity] || 0) + 1;

    // Track render strategies
    this.metrics.renderStrategies[strategy] = (this.metrics.renderStrategies[strategy] || 0) + 1;

    // Log performance data
    const performanceEntry = {
      timestamp: Date.now(),
      type: 'success',
      renderTime,
      strategy,
      complexity,
      provider,
      contentLength,
      hasMath,
      hasMarkdown,
      attempt
    };

    this.performanceLog.push(performanceEntry);
    this.trimLog(this.performanceLog);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Render Success: ${renderTime}ms | ${strategy} | ${complexity} | ${provider}`);
    }

    return performanceEntry;
  }

  /**
   * Track a render error
   */
  trackRenderError(errorInfo) {
    if (!this.analyticsEnabled) return;

    const {
      error = 'Unknown error',
      context = {},
      strategy = 'unknown',
      complexity = 'simple',
      provider = 'unknown',
      attempt = 1,
      contentLength = 0
    } = errorInfo;

    this.metrics.renderAttempts++;
    this.metrics.renderErrors++;
    this.metrics.lastUpdated = new Date().toISOString();

    // Track error types
    const errorType = this.categorizeError(error);
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;

    // Log error data
    const errorEntry = {
      timestamp: Date.now(),
      type: 'error',
      error: typeof error === 'string' ? error : error.message || 'Unknown error',
      errorType,
      context,
      strategy,
      complexity,
      provider,
      attempt,
      contentLength
    };

    this.errorLog.push(errorEntry);
    this.trimLog(this.errorLog);

    // Log to console
    console.warn(`❌ Render Error: ${errorEntry.error} | ${strategy} | ${provider} | Attempt ${attempt}`);

    return errorEntry;
  }

  /**
   * Track content processing metrics
   */
  trackContentProcessing(metrics) {
    if (!this.analyticsEnabled) return;

    const {
      originalLength = 0,
      processedLength = 0,
      processingTime = 0,
      issuesFixed = 0,
      mathExpressions = 0,
      markdownElements = 0
    } = metrics;

    const processingEntry = {
      timestamp: Date.now(),
      type: 'processing',
      originalLength,
      processedLength,
      processingTime,
      issuesFixed,
      mathExpressions,
      markdownElements,
      compressionRatio: originalLength > 0 ? processedLength / originalLength : 1
    };

    this.performanceLog.push(processingEntry);
    this.trimLog(this.performanceLog);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Content Processed: ${processingTime}ms | ${issuesFixed} issues fixed | ${mathExpressions} math expressions`);
    }

    return processingEntry;
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    const successRate = this.metrics.renderAttempts > 0 ? 
      (this.metrics.renderSuccesses / this.metrics.renderAttempts) * 100 : 100;

    const errorRate = this.metrics.renderAttempts > 0 ? 
      (this.metrics.renderErrors / this.metrics.renderAttempts) * 100 : 0;

    return {
      ...this.metrics,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      analyticsEnabled: this.analyticsEnabled
    };
  }

  /**
   * Get recent performance trends
   */
  getPerformanceTrends(timeWindowMs = 300000) { // 5 minutes default
    const cutoff = Date.now() - timeWindowMs;
    const recentEntries = this.performanceLog.filter(entry => entry.timestamp > cutoff);

    if (recentEntries.length === 0) {
      return {
        recentRenders: 0,
        averageRenderTime: 0,
        successRate: 100,
        commonErrors: [],
        trendDirection: 'stable'
      };
    }

    const successes = recentEntries.filter(entry => entry.type === 'success');
    const errors = recentEntries.filter(entry => entry.type === 'error');

    const averageRenderTime = successes.length > 0 ? 
      successes.reduce((sum, entry) => sum + (entry.renderTime || 0), 0) / successes.length : 0;

    const successRate = recentEntries.length > 0 ? 
      (successes.length / recentEntries.length) * 100 : 100;

    // Get common error types
    const errorCounts = {};
    errors.forEach(entry => {
      const errorType = entry.errorType || 'unknown';
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    const commonErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return {
      recentRenders: recentEntries.length,
      averageRenderTime: Math.round(averageRenderTime),
      successRate: Math.round(successRate * 100) / 100,
      commonErrors,
      trendDirection: this.calculateTrend(recentEntries)
    };
  }

  /**
   * Get error analysis
   */
  getErrorAnalysis() {
    const recentErrors = this.errorLog.slice(-100); // Last 100 errors
    
    const errorsByType = {};
    const errorsByStrategy = {};
    const errorsByProvider = {};

    recentErrors.forEach(error => {
      // By type
      const type = error.errorType || 'unknown';
      errorsByType[type] = (errorsByType[type] || 0) + 1;

      // By strategy
      const strategy = error.strategy || 'unknown';
      errorsByStrategy[strategy] = (errorsByStrategy[strategy] || 0) + 1;

      // By provider
      const provider = error.provider || 'unknown';
      errorsByProvider[provider] = (errorsByProvider[provider] || 0) + 1;
    });

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByStrategy,
      errorsByProvider,
      recentErrors: recentErrors.slice(-10) // Last 10 errors for debugging
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const trends = this.getPerformanceTrends();
    const errors = this.getErrorAnalysis();

    const report = {
      summary: {
        totalRenders: metrics.renderAttempts,
        successRate: metrics.successRate,
        averageRenderTime: metrics.averageRenderTime,
        lastUpdated: metrics.lastUpdated
      },
      performance: {
        trends,
        providerUsage: metrics.providerUsage,
        renderStrategies: metrics.renderStrategies,
        contentComplexity: metrics.contentComplexity
      },
      errors: errors,
      recommendations: this.generateRecommendations(metrics, trends, errors)
    };

    return report;
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.metrics = {
      renderAttempts: 0,
      renderSuccesses: 0,
      renderErrors: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      errorsByType: {},
      providerUsage: {},
      contentComplexity: {},
      renderStrategies: {},
      lastUpdated: null
    };
    
    this.errorLog = [];
    this.performanceLog = [];

    if (this.analyticsEnabled) {
      console.log('📊 Performance metrics reset');
    }
  }

  /**
   * Categorize error types for analysis
   */
  categorizeError(error) {
    const errorStr = typeof error === 'string' ? error : error.message || '';
    const lowerError = errorStr.toLowerCase();

    if (lowerError.includes('latex') || lowerError.includes('math')) {
      return 'latex-error';
    }
    if (lowerError.includes('markdown') || lowerError.includes('parsing')) {
      return 'markdown-error';
    }
    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return 'network-error';
    }
    if (lowerError.includes('timeout')) {
      return 'timeout-error';
    }
    if (lowerError.includes('validation')) {
      return 'validation-error';
    }
    if (lowerError.includes('render')) {
      return 'render-error';
    }

    return 'unknown-error';
  }

  /**
   * Calculate performance trend
   */
  calculateTrend(entries) {
    if (entries.length < 2) return 'stable';

    const midpoint = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, midpoint);
    const secondHalf = entries.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, entry) => 
      sum + (entry.renderTime || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, entry) => 
      sum + (entry.renderTime || 0), 0) / secondHalf.length;

    const difference = secondHalfAvg - firstHalfAvg;
    const threshold = firstHalfAvg * 0.1; // 10% threshold

    if (difference > threshold) return 'degrading';
    if (difference < -threshold) return 'improving';
    return 'stable';
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics, trends, errors) {
    const recommendations = [];

    // Performance recommendations
    if (trends.averageRenderTime > 1000) {
      recommendations.push({
        type: 'performance',
        severity: 'high',
        message: 'Average render time is high (>1s). Consider optimizing content complexity or caching.',
        suggestion: 'Review content with high complexity scores and consider breaking into smaller chunks.'
      });
    }

    // Error rate recommendations
    if (metrics.errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        severity: 'high',
        message: `Error rate is ${metrics.errorRate}%. Target is <5%.`,
        suggestion: 'Review error logs and improve content validation before rendering.'
      });
    }

    // Provider recommendations
    const providerEntries = Object.entries(metrics.providerUsage);
    if (providerEntries.length > 1) {
      const totalUsage = providerEntries.reduce((sum, [, count]) => sum + count, 0);
      const primaryProvider = providerEntries.reduce((max, current) => 
        current[1] > max[1] ? current : max);
      
      if (primaryProvider[1] / totalUsage > 0.9) {
        recommendations.push({
          type: 'diversity',
          severity: 'medium',
          message: `${primaryProvider[0]} is used for ${Math.round(primaryProvider[1] / totalUsage * 100)}% of renders.`,
          suggestion: 'Consider load balancing across multiple providers for better resilience.'
        });
      }
    }

    // Content complexity recommendations
    const complexityEntries = Object.entries(metrics.contentComplexity);
    const complexContent = complexityEntries.filter(([complexity]) => 
      complexity === 'complex' || complexity === 'advanced').reduce((sum, [, count]) => sum + count, 0);
    const totalContent = complexityEntries.reduce((sum, [, count]) => sum + count, 0);
    
    if (totalContent > 0 && complexContent / totalContent > 0.3) {
      recommendations.push({
        type: 'content',
        severity: 'medium',
        message: `${Math.round(complexContent / totalContent * 100)}% of content is high complexity.`,
        suggestion: 'Consider breaking complex content into simpler, more digestible sections.'
      });
    }

    return recommendations;
  }

  /**
   * Trim logs to prevent memory issues
   */
  trimLog(log) {
    if (log.length > this.maxLogSize) {
      log.splice(0, log.length - this.maxLogSize);
    }
  }

  /**
   * Export performance data
   */
  exportData() {
    return {
      metrics: this.metrics,
      errorLog: this.errorLog.slice(-100), // Last 100 errors
      performanceLog: this.performanceLog.slice(-100), // Last 100 entries
      report: this.generateReport(),
      exportedAt: new Date().toISOString()
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export hooks for React components
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState(performanceMonitor.getMetrics());
  const [trends, setTrends] = React.useState(performanceMonitor.getPerformanceTrends());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
      setTrends(performanceMonitor.getPerformanceTrends());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    trends,
    trackSuccess: (metrics) => performanceMonitor.trackRenderSuccess(metrics),
    trackError: (error) => performanceMonitor.trackRenderError(error),
    trackProcessing: (metrics) => performanceMonitor.trackContentProcessing(metrics),
    generateReport: () => performanceMonitor.generateReport(),
    reset: () => performanceMonitor.reset()
  };
};

export default performanceMonitor; 