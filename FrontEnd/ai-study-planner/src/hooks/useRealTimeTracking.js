import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for real-time time tracking updates
 * Provides live dashboard data with automatic polling and WebSocket support
 */
const useRealTimeTracking = (userId, options = {}) => {
  const {
    pollingInterval = 30000, // 30 seconds default
    timeRange = 7, // days
    enablePolling = true,
    onStatusChange = null,
    onError = null
  } = options;

  // State management
  const [realTimeData, setRealTimeData] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [todaysStats, setTodaysStats] = useState({
    total_minutes: 0,
    reading_minutes: 0,
    study_minutes: 0,
    quiz_minutes: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Refs for cleanup
  const pollingIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch real-time status data
  const fetchRealTimeStatus = useCallback(async () => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `http://localhost:5000/real-time-study-status/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const statusData = result.real_time_status;
        
        // Update active session info
        setActiveSession(statusData.current_sessions?.[0] || null);
        setTodaysStats(statusData.todays_time || {});
        setRealTimeData(statusData);
        setIsConnected(true);
        setLastUpdate(new Date());
        setError(null);

        // Call status change callback if provided
        if (onStatusChange) {
          onStatusChange(statusData);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch real-time status');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching real-time status:', err);
        setError(err.message);
        setIsConnected(false);
        
        if (onError) {
          onError(err);
        }
      }
    }
  }, [userId, onStatusChange, onError]);

  // Fetch comprehensive dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/unified-dashboard-data/${userId}?days=${timeRange}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.dashboard_data;
      } else {
        throw new Error(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      return null;
    }
  }, [userId, timeRange]);

  // Start real-time polling
  const startPolling = useCallback(() => {
    if (!enablePolling || !userId) return;

    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Initial fetch
    fetchRealTimeStatus();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchRealTimeStatus();
    }, pollingInterval);

    console.log(`Real-time tracking started for user ${userId} (${pollingInterval}ms interval)`);
  }, [enablePolling, userId, pollingInterval, fetchRealTimeStatus]);

  // Stop real-time polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsConnected(false);
    console.log('Real-time tracking stopped');
  }, []);

  // Manual refresh function
  const refreshData = useCallback(() => {
    fetchRealTimeStatus();
  }, [fetchRealTimeStatus]);

  // Update active session progress (for reading sessions)
  const updateSessionProgress = useCallback(async (sessionId, progressData) => {
    try {
      const response = await fetch(
        `http://localhost:5000/slide-reading-session/${sessionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(progressData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update session progress');
      }

      const result = await response.json();
      
      // Refresh real-time data after update
      if (result.status === 'success') {
        fetchRealTimeStatus();
      }
      
      return result;
    } catch (err) {
      console.error('Error updating session progress:', err);
      setError(err.message);
      return { status: 'error', error: err.message };
    }
  }, [fetchRealTimeStatus]);

  // Complete active session
  const completeActiveSession = useCallback(async (sessionId, completionData = {}) => {
    try {
      const response = await fetch(
        `http://localhost:5000/slide-reading-session/${sessionId}/complete`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completionData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to complete session');
      }

      const result = await response.json();
      
      // Refresh real-time data after completion
      if (result.status === 'success') {
        setActiveSession(null);
        fetchRealTimeStatus();
      }
      
      return result;
    } catch (err) {
      console.error('Error completing session:', err);
      setError(err.message);
      return { status: 'error', error: err.message };
    }
  }, [fetchRealTimeStatus]);

  // Calculate current session duration
  const getCurrentSessionDuration = useCallback(() => {
    if (!activeSession?.start_time) return 0;
    
    const startTime = new Date(activeSession.start_time);
    const now = new Date();
    return Math.floor((now - startTime) / (1000 * 60)); // Return minutes
  }, [activeSession]);

  // Format duration for display
  const formatDuration = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  // Initialize and cleanup
  useEffect(() => {
    if (userId && enablePolling) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [userId, enablePolling, startPolling, stopPolling]);

  // Handle visibility change (pause/resume polling when tab is not visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enablePolling && userId) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enablePolling, userId, startPolling, stopPolling]);

  return {
    // Real-time data
    realTimeData,
    activeSession,
    todaysStats,
    isConnected,
    lastUpdate,
    error,

    // Actions
    refreshData,
    startPolling,
    stopPolling,
    updateSessionProgress,
    completeActiveSession,
    fetchDashboardData,

    // Utilities
    getCurrentSessionDuration,
    formatDuration,

    // Status helpers
    hasActiveSession: !!activeSession,
    isStudyingNow: realTimeData?.has_active_session || false,
    sessionCount: realTimeData?.active_session_count || 0
  };
};

export default useRealTimeTracking;
