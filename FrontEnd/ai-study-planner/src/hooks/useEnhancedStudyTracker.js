import { useState, useEffect, useCallback, useRef } from 'react';

// Constants
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const SESSION_UPDATE_INTERVAL = 1000; // 1 second for UI timer updates
const NETWORK_THROTTLE_INTERVAL = 15000; // min 15s between network updates
const MAX_BATCH_SIZE = 5; // batch up to 5 small deltas
const MAX_RETRY_DELAY = 60 * 1000; // cap backoff at 60s
const MIN_SESSION_DURATION = 60 * 1000; // 1 minute minimum to count as a study session
const API_BASE_URL = 'http://localhost:5000';

export function useEnhancedStudyTracker(courseId, courseName, currentFile = null) {
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState(null);
  const [currentReadingSession, setCurrentReadingSession] = useState(null);

  const inactivityTimer = useRef(null);
  const sessionUpdateTimer = useRef(null);
  const lastNetworkUpdateAt = useRef(0);
  const pendingUpdates = useRef([]);
  const retryState = useRef({ attempts: 0, timeoutId: null });
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
    }
  }, [courseId]);

  // Start slide reading session
  const startReadingSession = useCallback(async (filename, extractedText = null) => {
    if (!filename || !courseId) return null;

    try {
      // Resolve real user id
      let userId = 'current_user';
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData && (userData.id || userData._id)) {
          userId = userData.id || userData._id;
        }
      } catch {}

      // Calculate word count for reading time estimation
      const wordCount = extractedText ? extractedText.split(/\s+/).length : 0;
      
      const response = await fetch(`${API_BASE_URL}/slide-reading-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          courseId: courseId,
          courseName: courseName,
          filename: filename,
          wordCount: wordCount,
          progress: 0,
          currentPage: 1,
          totalPages: 1
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentReadingSession({
          sessionId: data.session_id,
          filename: filename,
          startTime: data.start_time,
          wordCount: data.word_count,
          estimatedReadingTime: data.estimated_reading_time_minutes
        });
        return data.session_id;
      }
    } catch (error) {
      console.error('Error starting reading session:', error);
    }
    return null;
  }, [courseId, courseName]);

  // Update reading session progress
  const sendBatchedUpdate = useCallback(async (batchedPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/slide-reading-session/${currentReadingSession.sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchedPayload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      retryState.current.attempts = 0;
      return true;
    } catch (error) {
      // Exponential backoff
      retryState.current.attempts += 1;
      const delay = Math.min(1000 * 2 ** (retryState.current.attempts - 1), MAX_RETRY_DELAY);
      if (retryState.current.timeoutId) clearTimeout(retryState.current.timeoutId);
      retryState.current.timeoutId = setTimeout(() => {
        // Retry sending current pending batch
        if (pendingUpdates.current.length > 0 && currentReadingSession) {
          const merged = mergePendingUpdates(pendingUpdates.current);
          pendingUpdates.current = [];
          sendBatchedUpdate(merged);
        }
      }, delay);
      return false;
    }
  }, [currentReadingSession]);

  const mergePendingUpdates = (updates) => {
    // Combine time increments and concatenate interactions
    const merged = updates.reduce((acc, u) => {
      acc.progress = u.progress; // latest progress wins
      acc.timeIncrement = (acc.timeIncrement || 0) + (u.timeIncrement || 0);
      acc.activeTimeIncrement = (acc.activeTimeIncrement || 0) + (u.activeTimeIncrement || 0);
      acc.newScrollEvents = (acc.newScrollEvents || 0) + (u.newScrollEvents || 0);
      if (u.newInteractions) {
        acc.newInteractions = (acc.newInteractions || []).concat(u.newInteractions);
      }
      if (u.comprehensionUpdates) {
        acc.comprehensionUpdates = {
          ...(acc.comprehensionUpdates || {}),
          ...u.comprehensionUpdates
        };
      }
      return acc;
    }, {});
    return merged;
  };

  const maybeFlushPending = useCallback(() => {
    const now = Date.now();
    const shouldSend = (
      now - lastNetworkUpdateAt.current >= NETWORK_THROTTLE_INTERVAL ||
      pendingUpdates.current.length >= MAX_BATCH_SIZE
    );
    if (!shouldSend || !currentReadingSession || pendingUpdates.current.length === 0) return;
    const payload = mergePendingUpdates(pendingUpdates.current);
    pendingUpdates.current = [];
    lastNetworkUpdateAt.current = now;
    sendBatchedUpdate(payload);
  }, [sendBatchedUpdate, currentReadingSession]);

  const updateReadingProgress = useCallback(async (progress, interactions = {}) => {
    if (!currentReadingSession) return;

    try {
      const now = Date.now();
      const lastUpdate = lastActivityTime || sessionStartTime || now;
      const timeIncrement = now - lastUpdate;
      
      // Only count as active time if user was recently active (within 30 seconds)
      const activeTimeIncrement = timeIncrement < 30000 ? timeIncrement / 1000 : 0;

      const updateData = {
        progress: progress,
        timeIncrement: Math.round(timeIncrement / 1000), // total time in seconds
        activeTimeIncrement: activeTimeIncrement, // active time in seconds
        newScrollEvents: interactions.scrollEvents || 0,
        newInteractions: interactions.events || []
      };

      // Add comprehension updates if provided
      if (interactions.comprehensionUpdates) {
        updateData.comprehensionUpdates = interactions.comprehensionUpdates;
      }

      // Queue update; throttled batch send to reduce backend load
      pendingUpdates.current.push(updateData);
      maybeFlushPending();
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  }, [currentReadingSession, lastActivityTime, sessionStartTime, maybeFlushPending]);

  // Complete reading session
  const completeReadingSession = useCallback(async (finalProgress = 100, notes = '', satisfaction = 5, difficulty = 3) => {
    if (!currentReadingSession) return;

    try {
      // Flush any pending updates before completing
      if (pendingUpdates.current.length > 0) {
        const payload = mergePendingUpdates(pendingUpdates.current);
        pendingUpdates.current = [];
        await sendBatchedUpdate(payload);
      }
      const response = await fetch(`${API_BASE_URL}/slide-reading-session/${currentReadingSession.sessionId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalProgress: finalProgress,
          notes: notes,
          satisfaction: satisfaction,
          difficulty: difficulty
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Reading session completed:', data.session_summary);
        setCurrentReadingSession(null);
        return data.session_summary;
      }
    } catch (error) {
      console.error('Error completing reading session:', error);
    }
    setCurrentReadingSession(null);
    return null;
  }, [currentReadingSession]);

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

  // Track user activity with reading progress update
  const trackActivity = useCallback((interactions = {}) => {
    if (isActive) {
      resetInactivityTimer();
      
      // If we have a reading session, update progress
      if (currentReadingSession && interactions.progress !== undefined) {
        updateReadingProgress(interactions.progress, interactions);
      }
    }
  }, [isActive, currentReadingSession]);

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
  const stopSession = useCallback(async () => {
    if (isActive && sessionStartTime) {
      const sessionDuration = Date.now() - sessionStartTime;
      
      // Complete any active reading session
      if (currentReadingSession) {
        await completeReadingSession();
      }
      
      // Only count sessions longer than 1 minute
      if (sessionDuration >= MIN_SESSION_DURATION) {
        const newTotalTime = totalStudyTime + sessionDuration;
        setTotalStudyTime(newTotalTime);
        
        // Save to localStorage
        const data = {
          totalTime: newTotalTime,
          lastUpdated: new Date().toISOString(),
          courseId
        };
        localStorage.setItem(`study_time_${courseId}`, JSON.stringify(data));
        
        // Record the session in behavior data
        const sessionData = {
          courseId,
          courseName,
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
  }, [isActive, sessionStartTime, totalStudyTime, courseId, courseName, currentReadingSession, completeReadingSession]);

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
    currentReadingSession,
    startSession,
    stopSession,
    trackActivity,
    startReadingSession,
    updateReadingProgress,
    completeReadingSession,
    formatTime: (time) => formatTime(time || currentSessionTime)
  };
}

