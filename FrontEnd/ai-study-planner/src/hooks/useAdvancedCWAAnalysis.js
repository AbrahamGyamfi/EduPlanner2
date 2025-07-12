/**
 * React Hook for Advanced CWA Analysis
 * 
 * This hook provides a React interface to the Advanced CWA Analyzer,
 * managing state and integrating with the existing UI components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AdvancedCWAAnalyzer from '../services/AdvancedCWAAnalyzer';

export const useAdvancedCWAAnalysis = () => {
  // State management
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Refs for persistent instances
  const analyzerRef = useRef(null);
  const analysisTimeoutRef = useRef(null);

  // Initialize analyzer
  useEffect(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new AdvancedCWAAnalyzer();
    }

    // Cleanup on unmount
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  // Load cached results on mount
  useEffect(() => {
    const loadCachedResults = () => {
      try {
        const cachedResults = localStorage.getItem('advanced_cwa_results');
        const cachedTimestamp = localStorage.getItem('advanced_cwa_timestamp');
        
        if (cachedResults && cachedTimestamp) {
          const results = JSON.parse(cachedResults);
          const timestamp = new Date(cachedTimestamp);
          
          // Use cached results if they're less than 1 hour old
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (timestamp > oneHourAgo) {
            setAnalysisResults(results);
            setLastUpdateTime(timestamp);
          }
        }
      } catch (error) {
        console.warn('Error loading cached CWA results:', error);
      }
    };

    loadCachedResults();
  }, []);

  /**
   * Simulate progress updates during analysis
   */
  const updateProgress = useCallback((targetProgress, duration = 1000) => {
    const startProgress = analysisProgress;
    const progressDiff = targetProgress - startProgress;
    const steps = 20;
    const stepSize = progressDiff / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      currentStep++;
      const newProgress = startProgress + (stepSize * currentStep);
      setAnalysisProgress(Math.min(targetProgress, newProgress));

      if (currentStep >= steps || newProgress >= targetProgress) {
        clearInterval(progressInterval);
        setAnalysisProgress(targetProgress);
      }
    }, stepDuration);

    return progressInterval;
  }, [analysisProgress]);

  /**
   * Perform complete CWA analysis
   */
  const performAnalysis = useCallback(async () => {
    if (!analyzerRef.current || isAnalyzing) {
      return null;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    try {
      // Step 1: Initialize (10%)
      updateProgress(10, 500);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Data collection (30%)
      updateProgress(30, 1000);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: CWA calculations (50%)
      updateProgress(50, 1000);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 4: Analysis and projections (70%)
      updateProgress(70, 1000);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 5: Recommendations generation (85%)
      updateProgress(85, 1000);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 6: Schedule generation (95%)
      updateProgress(95, 500);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 7: Complete analysis
      const results = await analyzerRef.current.performCompleteAnalysis();
      
      updateProgress(100, 200);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Cache results
      const timestamp = new Date();
      localStorage.setItem('advanced_cwa_results', JSON.stringify(results));
      localStorage.setItem('advanced_cwa_timestamp', timestamp.toISOString());

      setAnalysisResults(results);
      setLastUpdateTime(timestamp);
      setError(null);

      return results;

    } catch (error) {
      console.error('Advanced CWA Analysis failed:', error);
      setError({
        message: error.message || 'Analysis failed',
        type: 'analysis_error',
        timestamp: new Date().toISOString()
      });
      return null;
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [isAnalyzing, updateProgress]);

  /**
   * Get quick analysis summary without full processing
   */
  const getQuickSummary = useCallback(async () => {
    if (!analyzerRef.current) {
      return null;
    }

    try {
      const systemData = await analyzerRef.current.pullSystemData();
      const currentCWA = analyzerRef.current.calculateCurrentCWA(systemData);
      const projectedCWA = analyzerRef.current.calculateProjectedCWA(currentCWA, systemData);

      return {
        currentCWA: currentCWA.cwa,
        projectedCWA: projectedCWA.projected,
        changeDirection: projectedCWA.changeDirection,
        academicStanding: currentCWA.academicStanding,
        totalCourses: systemData.courses.length,
        dataQuality: analyzerRef.current.assessDataQuality(systemData)
      };
    } catch (error) {
      console.error('Quick summary failed:', error);
      return null;
    }
  }, []);

  /**
   * Clear cached results and force new analysis
   */
  const clearCache = useCallback(() => {
    localStorage.removeItem('advanced_cwa_results');
    localStorage.removeItem('advanced_cwa_timestamp');
    setAnalysisResults(null);
    setLastUpdateTime(null);
    setError(null);
  }, []);

  /**
   * Check if analysis data is stale
   */
  const isDataStale = useCallback(() => {
    if (!lastUpdateTime) return true;
    
    const staleThreshold = 2 * 60 * 60 * 1000; // 2 hours
    return (Date.now() - lastUpdateTime.getTime()) > staleThreshold;
  }, [lastUpdateTime]);

  /**
   * Get formatted analysis status
   */
  const getAnalysisStatus = useCallback(() => {
    if (isAnalyzing) {
      let statusText = 'Analyzing...';
      if (analysisProgress < 20) statusText = 'Collecting data...';
      else if (analysisProgress < 40) statusText = 'Calculating CWA...';
      else if (analysisProgress < 60) statusText = 'Analyzing trends...';
      else if (analysisProgress < 80) statusText = 'Generating recommendations...';
      else if (analysisProgress < 95) statusText = 'Creating schedule...';
      else statusText = 'Finalizing...';

      return {
        status: 'analyzing',
        message: statusText,
        progress: analysisProgress
      };
    }

    if (error) {
      return {
        status: 'error',
        message: error.message,
        progress: 0
      };
    }

    if (!analysisResults) {
      return {
        status: 'ready',
        message: 'Ready to analyze',
        progress: 0
      };
    }

    if (isDataStale()) {
      return {
        status: 'stale',
        message: 'Data needs updating',
        progress: 100
      };
    }

    return {
      status: 'complete',
      message: 'Analysis complete',
      progress: 100
    };
  }, [isAnalyzing, error, analysisResults, analysisProgress, isDataStale]);

  /**
   * Extract specific parts of analysis for components
   */
  const getAnalysisSection = useCallback((section) => {
    if (!analysisResults) return null;

    switch (section) {
      case 'current':
        return analysisResults.currentCWA;
      case 'projected':
        return analysisResults.projectedCWA;
      case 'trends':
        return analysisResults.performanceTrend;
      case 'recommendations':
        return analysisResults.recommendations;
      case 'schedule':
        return analysisResults.studySchedule;
      case 'system':
        return analysisResults.systemData;
      default:
        return analysisResults;
    }
  }, [analysisResults]);

  /**
   * Get recommendations by priority
   */
  const getRecommendationsByPriority = useCallback((priority = 'all') => {
    const recommendations = getAnalysisSection('recommendations');
    if (!recommendations) return [];

    const allRecommendations = [
      ...recommendations.immediate,
      ...recommendations.shortTerm,
      ...recommendations.longTerm,
      ...recommendations.studyStrategies,
      ...recommendations.timeManagement
    ];

    if (priority === 'all') return allRecommendations;
    return allRecommendations.filter(rec => rec.priority === priority);
  }, [getAnalysisSection]);

  /**
   * Get course-specific insights
   */
  const getCourseInsights = useCallback((courseId = null) => {
    const currentCWA = getAnalysisSection('current');
    if (!currentCWA || !currentCWA.courseBreakdown) return null;

    if (courseId) {
      return currentCWA.courseBreakdown.find(course => course.courseId === courseId);
    }

    return currentCWA.courseBreakdown;
  }, [getAnalysisSection]);

  /**
   * Get performance metrics summary
   */
  const getPerformanceMetrics = useCallback(() => {
    if (!analysisResults) return null;

    const { currentCWA, projectedCWA, performanceTrend } = analysisResults;

    return {
      current: {
        cwa: currentCWA.cwa,
        standing: currentCWA.academicStanding,
        creditHours: currentCWA.totalCreditHours
      },
      projected: {
        cwa: projectedCWA.projected,
        change: projectedCWA.change,
        direction: projectedCWA.changeDirection,
        confidence: projectedCWA.confidenceInterval.confidence
      },
      trends: {
        overall: performanceTrend.overall,
        momentum: performanceTrend.overall.momentum,
        riskFactors: performanceTrend.riskFactors.length,
        opportunities: performanceTrend.opportunities.length
      }
    };
  }, [analysisResults]);

  /**
   * Auto-refresh analysis when data changes
   */
  const scheduleAutoRefresh = useCallback((delayMs = 300000) => { // 5 minutes default
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      if (!isAnalyzing && isDataStale()) {
        performAnalysis();
      }
    }, delayMs);
  }, [isAnalyzing, isDataStale, performAnalysis]);

  // Schedule auto-refresh when data becomes stale
  useEffect(() => {
    if (analysisResults && !isAnalyzing) {
      scheduleAutoRefresh();
    }
  }, [analysisResults, isAnalyzing, scheduleAutoRefresh]);

  return {
    // State
    isAnalyzing,
    analysisResults,
    error,
    lastUpdateTime,
    analysisProgress,

    // Actions
    performAnalysis,
    getQuickSummary,
    clearCache,
    scheduleAutoRefresh,

    // Status
    isDataStale: isDataStale(),
    analysisStatus: getAnalysisStatus(),

    // Data accessors
    getAnalysisSection,
    getRecommendationsByPriority,
    getCourseInsights,
    getPerformanceMetrics,

    // Computed values
    hasResults: !!analysisResults,
    needsAnalysis: !analysisResults || isDataStale(),
    isReady: !isAnalyzing && !error
  };
};

export default useAdvancedCWAAnalysis;
