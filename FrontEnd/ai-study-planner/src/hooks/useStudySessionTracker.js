import { useState, useEffect, useCallback, useRef } from 'react';

// Constants
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const SESSION_UPDATE_INTERVAL = 1000; // 1 second for real-time updates
const MIN_SESSION_DURATION = 60 * 1000; // 1 minute minimum to count as a study session

export function useStudySessionTracker(courseId) {
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState(null);

  const inactivityTimer = useRef(null);
  const sessionUpdateTimer = useRef(null);
  const activityListeners = useRef([]);

  // Load total study time from localStorage for specific course
  useEffect(() => {
    if (courseId) {
      const savedData = localStorage.getItem(`study_time_${courseId}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setTotalStudyTime(parsed.totalTime || 0);
        } catch (error) {
          console.error('Error loading study time data:', error);
        }
      }

      // Also update the course's study time in the courses list
      updateCourseStudyTime(courseId, 0); // Initialize if needed
    }
  }, [courseId]);

  // Update course study time in the courses list
  const updateCourseStudyTime = useCallback((courseId, additionalTime) => {
    try {
      const savedCourses = localStorage.getItem('courses');
      if (savedCourses) {
        const courses = JSON.parse(savedCourses);
        const courseIndex = courses.findIndex(c => c.id === courseId);
        
        if (courseIndex !== -1) {
          // Update the course's study time
          courses[courseIndex].timeSpent = (courses[courseIndex].timeSpent || 0) + additionalTime;
          courses[courseIndex].lastStudied = new Date().toISOString();
          
          // Save back to localStorage
          localStorage.setItem('courses', JSON.stringify(courses));
        }
      }
    } catch (error) {
      console.error('Error updating course study time:', error);
    }
  }, []);

  // Save total study time to localStorage
  const saveStudyTime = useCallback((time) => {
    if (courseId) {
      const data = {
        totalTime: time,
        lastUpdated: new Date().toISOString(),
        courseId
      };
      localStorage.setItem(`study_time_${courseId}`, JSON.stringify(data));
      
      // Also update the course in the courses list
      updateCourseStudyTime(courseId, 0); // Just update timestamp
    }
  }, [courseId, updateCourseStudyTime]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    setLastActivityTime(Date.now());

    inactivityTimer.current = setTimeout(() => {
      console.log('User inactive for 5 minutes, stopping study session');
      setIsActive(false);
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Track user activity
  const trackActivity = useCallback(() => {
    if (isActive) {
      resetInactivityTimer();
    }
  }, [isActive, resetInactivityTimer]);

  // Add event listeners for user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => trackActivity();

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
      activityListeners.current.push({ event, handler: handleActivity });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      activityListeners.current = [];
    };
  }, [trackActivity]);

  // Start study session
  const startSession = useCallback(() => {
    if (!isActive) {
      const now = Date.now();
      setIsActive(true);
      setSessionStartTime(now);
      setCurrentSessionTime(0);
      resetInactivityTimer();
      console.log('Study session started');
    }
  }, [isActive, resetInactivityTimer]);

  // Stop study session
  const stopSession = useCallback(() => {
    if (isActive && sessionStartTime) {
      const sessionDuration = Date.now() - sessionStartTime;
      
      // Only count sessions longer than 1 minute
      if (sessionDuration >= MIN_SESSION_DURATION) {
        const newTotalTime = totalStudyTime + sessionDuration;
        setTotalStudyTime(newTotalTime);
        saveStudyTime(newTotalTime);
        
        // Update the specific course's total study time (convert milliseconds to minutes)
        const sessionMinutes = Math.round(sessionDuration / (1000 * 60));
        updateCourseStudyTime(courseId, sessionMinutes);
        
        // Record the session in behavior data
        const sessionData = {
          courseId,
          startTime: new Date(sessionStartTime).toISOString(),
          endTime: new Date().toISOString(),
          duration: sessionDuration,
          timestamp: new Date().toISOString()
        };

        // Save to behavior tracking
        const behaviorData = JSON.parse(localStorage.getItem('cwa_behavior_data') || '{}');
        behaviorData.studySessions = [...(behaviorData.studySessions || []), sessionData];
        behaviorData.totalStudyTime = (behaviorData.totalStudyTime || 0) + sessionDuration;
        localStorage.setItem('cwa_behavior_data', JSON.stringify(behaviorData));

        console.log(`Study session ended. Duration: ${Math.round(sessionDuration / 1000)} seconds`);
      }

      setIsActive(false);
      setSessionStartTime(null);
      setCurrentSessionTime(0);
      
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    }
  }, [isActive, sessionStartTime, totalStudyTime, saveStudyTime, courseId]);

  // Update current session time
  useEffect(() => {
    if (isActive && sessionStartTime) {
      sessionUpdateTimer.current = setInterval(() => {
        const elapsed = Date.now() - sessionStartTime;
        setCurrentSessionTime(elapsed);
      }, SESSION_UPDATE_INTERVAL);
    } else {
      if (sessionUpdateTimer.current) {
        clearInterval(sessionUpdateTimer.current);
      }
    }

    return () => {
      if (sessionUpdateTimer.current) {
        clearInterval(sessionUpdateTimer.current);
      }
    };
  }, [isActive, sessionStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (sessionUpdateTimer.current) {
        clearInterval(sessionUpdateTimer.current);
      }
    };
  }, []);

  // Auto-start session on component mount if user is interacting
  useEffect(() => {
    const handleInitialActivity = () => {
      startSession();
      // Remove the listener after first activity
      document.removeEventListener('mousedown', handleInitialActivity);
      document.removeEventListener('keypress', handleInitialActivity);
    };

    document.addEventListener('mousedown', handleInitialActivity);
    document.addEventListener('keypress', handleInitialActivity);

    return () => {
      document.removeEventListener('mousedown', handleInitialActivity);
      document.removeEventListener('keypress', handleInitialActivity);
    };
  }, [startSession]);

  // Format time for display
  const formatTime = useCallback((milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  return {
    isActive,
    currentSessionTime,
    totalStudyTime,
    lastActivityTime,
    startSession,
    stopSession,
    trackActivity,
    formatTime: (time) => formatTime(time || currentSessionTime)
  };
}
