import { useState, useEffect, useCallback, useRef } from 'react';

export function useActivityTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [totalActiveTime, setTotalActiveTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const sessionStartTime = useRef(null);
  const activeTimeRef = useRef(0);
  const inactivityTimeoutRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  
  const INACTIVITY_THRESHOLD = 3 * 60 * 1000; // 3 minutes in milliseconds
  const TRACKING_INTERVAL = 1000; // Update every second

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    if (isTracking) {
      // If was paused due to inactivity, resume tracking
      if (isPaused) {
        setIsPaused(false);
        console.log('📚 Study session resumed - activity detected');
      }
      
      // Set new inactivity timeout
      inactivityTimeoutRef.current = setTimeout(() => {
        if (isTracking) {
          setIsPaused(true);
          console.log('⏸️ Study session paused - user inactive for 3 minutes');
        }
      }, INACTIVITY_THRESHOLD);
    }
  }, [isTracking, isPaused, INACTIVITY_THRESHOLD]);

  // Track user activity events
  const trackActivity = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Start activity tracking
  const startTracking = useCallback((courseId, courseName) => {
    if (isTracking) {
      console.log('Already tracking a session');
      return;
    }

    const startTime = Date.now();
    sessionStartTime.current = startTime;
    activeTimeRef.current = 0;
    
    setIsTracking(true);
    setIsPaused(false);
    setCurrentSession({
      courseId,
      courseName,
      startTime,
      activeTime: 0
    });
    
    // Start the tracking interval
    trackingIntervalRef.current = setInterval(() => {
      if (!isPaused) {
        activeTimeRef.current += 1000; // Add 1 second
        setTotalActiveTime(activeTimeRef.current);
        
        // Update current session
        setCurrentSession(prev => prev ? {
          ...prev,
          activeTime: activeTimeRef.current
        } : null);
      }
    }, TRACKING_INTERVAL);
    
    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });
    
    // Initialize inactivity timer
    resetInactivityTimer();
    
    console.log(`🎯 Started tracking study session for ${courseName}`);
  }, [isTracking, isPaused, trackActivity, resetInactivityTimer]);

  // Stop activity tracking
  const stopTracking = useCallback(() => {
    if (!isTracking || !currentSession) {
      console.log('No active session to stop');
      return null;
    }

    // Clear all timers and intervals
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    // Remove activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, trackActivity, true);
    });

    const endTime = Date.now();
    const sessionData = {
      ...currentSession,
      endTime,
      totalDuration: endTime - currentSession.startTime,
      activeTime: activeTimeRef.current,
      inactiveTime: (endTime - currentSession.startTime) - activeTimeRef.current,
      timestamp: new Date().toISOString()
    };

    // Reset state
    setIsTracking(false);
    setIsPaused(false);
    setCurrentSession(null);
    setTotalActiveTime(0);
    activeTimeRef.current = 0;
    sessionStartTime.current = null;

    console.log(`✅ Study session completed:`, {
      course: sessionData.courseName,
      activeTime: Math.round(sessionData.activeTime / 1000 / 60), // minutes
      totalTime: Math.round(sessionData.totalDuration / 1000 / 60), // minutes
      efficiency: Math.round((sessionData.activeTime / sessionData.totalDuration) * 100) // percentage
    });

    return sessionData;
  }, [isTracking, currentSession, trackActivity]);

  // Pause/Resume manually
  const togglePause = useCallback(() => {
    if (!isTracking) return;
    
    if (isPaused) {
      setIsPaused(false);
      resetInactivityTimer();
      console.log('▶️ Study session manually resumed');
    } else {
      setIsPaused(true);
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      console.log('⏸️ Study session manually paused');
    }
  }, [isTracking, isPaused, resetInactivityTimer]);

  // Format time for display
  const formatTime = useCallback((milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Get session statistics
  const getSessionStats = useCallback(() => {
    if (!currentSession) return null;
    
    const now = Date.now();
    const totalDuration = now - currentSession.startTime;
    const efficiency = totalDuration > 0 ? (activeTimeRef.current / totalDuration) * 100 : 0;
    
    return {
      activeTime: formatTime(activeTimeRef.current),
      totalTime: formatTime(totalDuration),
      efficiency: Math.round(efficiency),
      isPaused,
      courseName: currentSession.courseName
    };
  }, [currentSession, isPaused, formatTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      
      // Remove activity listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, []); // Remove trackActivity from dependencies to prevent infinite loop

  return {
    isTracking,
    isPaused,
    currentSession,
    totalActiveTime,
    startTracking,
    stopTracking,
    togglePause,
    getSessionStats,
    formatTime
  };
}

export default useActivityTracker;
