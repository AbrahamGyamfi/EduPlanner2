import { useState, useEffect, useCallback } from 'react';

export function useBehaviorTracking(courses = []) {
  const [behaviorData, setBehaviorData] = useState(null);
  const [behaviorMetrics, setBehaviorMetrics] = useState({
    studyConsistency: 0,
    assignmentCompletion: 0,
    studyPatterns: [],
    procrastinationLevel: 0,
    plannerUsage: 0,
    deadlineAdherence: 0,
    averageEfficiency: 0,
    totalActiveTime: 0
  });
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);

  const calculateBehaviorMetrics = useCallback((data, currentCourses = []) => {
    if (!data) return;
    
    // Enhanced study consistency calculation with efficiency
    const studySessions = data.studySessions || [];
    let studyConsistency = 0;
    let averageEfficiency = 0;
    let totalActiveTime = 0;
    
    if (studySessions.length > 0) {
      // Calculate total active time and average efficiency
      totalActiveTime = studySessions.reduce((sum, session) => {
        return sum + (session.activeTime || session.duration || 0);
      }, 0);
      
      const efficiencySum = studySessions.reduce((sum, session) => {
        return sum + (session.efficiency || 100);
      }, 0);
      averageEfficiency = efficiencySum / studySessions.length;
      
      // Calculate consistency based on frequency and regularity
      if (studySessions.length > 1) {
        const sessionDates = studySessions.map(s => new Date(s.timestamp || s.date));
        sessionDates.sort((a, b) => a - b);
        
        let totalGap = 0;
        for (let i = 1; i < sessionDates.length; i++) {
          const gap = (sessionDates[i] - sessionDates[i-1]) / (1000 * 60 * 60 * 24); // gap in days
          totalGap += gap;
        }
        
        const avgGap = totalGap / (sessionDates.length - 1);
        // Enhanced consistency calculation considering efficiency
        const baseConsistency = avgGap <= 2 ? 100 :
                               avgGap <= 3 ? 80 :
                               avgGap <= 5 ? 60 :
                               avgGap <= 7 ? 40 : 20;
        
        // Boost consistency based on efficiency
        const efficiencyBonus = averageEfficiency > 80 ? 10 : averageEfficiency > 60 ? 5 : 0;
        studyConsistency = Math.min(100, baseConsistency + efficiencyBonus);
      } else {
        studyConsistency = 30; // Only one session recorded
      }
    }
    
    // Assignment completion ratio
    const assignments = (currentCourses || []).flatMap(c => c.assignments || []);
    const totalAssignments = assignments.length;
    const assignmentSubmissions = data.assignmentSubmissions || [];
    
    const assignmentCompletion = totalAssignments > 0 
      ? Math.min(100, (assignmentSubmissions.length / totalAssignments) * 100)
      : 0;
    
    // Enhanced procrastination level based on efficiency and gaps
    const baseProcrast = Math.max(1, 10 - Math.floor(studyConsistency / 10));
    const efficiencyPenalty = averageEfficiency < 60 ? 2 : averageEfficiency < 80 ? 1 : 0;
    const procrastinationLevel = Math.min(10, baseProcrast + efficiencyPenalty);
    
    // Planner usage - based on page visits, actions, and study session frequency
    const pageVisits = data.pageVisits || [];
    const actions = data.actions || [];
    const totalInteractions = pageVisits.length + actions.length + (studySessions.length * 2);
    const plannerUsage = Math.min(100, totalInteractions * 3); // 3% per interaction, capped at 100%
    
    // Deadline adherence - enhanced with efficiency consideration
    const baseAdherence = assignmentCompletion;
    const efficiencyBonus = averageEfficiency > 75 ? 10 : 0;
    const deadlineAdherence = Math.min(100, baseAdherence + efficiencyBonus);
    
    // Enhanced study patterns analysis
    const studyPatterns = [];
    const morningStudy = studySessions.filter(s => {
      const hour = new Date(s.timestamp || s.date).getHours();
      return hour >= 5 && hour < 12;
    }).length;
    
    const afternoonStudy = studySessions.filter(s => {
      const hour = new Date(s.timestamp || s.date).getHours();
      return hour >= 12 && hour < 17;
    }).length;
    
    const eveningStudy = studySessions.filter(s => {
      const hour = new Date(s.timestamp || s.date).getHours();
      return hour >= 17;
    }).length;
    
    const weekendStudy = studySessions.filter(s => {
      const day = new Date(s.timestamp || s.date).getDay();
      return day === 0 || day === 6;
    }).length;
    
    // Determine primary study time patterns
    if (morningStudy > afternoonStudy && morningStudy > eveningStudy && studySessions.length > 0) {
      studyPatterns.push('Morning person');
    } else if (eveningStudy > morningStudy && eveningStudy > afternoonStudy && studySessions.length > 0) {
      studyPatterns.push('Night owl');
    } else if (afternoonStudy > morningStudy && afternoonStudy > eveningStudy && studySessions.length > 0) {
      studyPatterns.push('Afternoon achiever');
    }
    
    if (weekendStudy > (studySessions.length - weekendStudy) && studySessions.length > 0) {
      studyPatterns.push('Weekend warrior');
    }
    
    // Add efficiency-based patterns
    if (averageEfficiency > 85) {
      studyPatterns.push('Highly focused');
    } else if (averageEfficiency > 70) {
      studyPatterns.push('Good focus');
    } else if (averageEfficiency < 50) {
      studyPatterns.push('Needs focus improvement');
    }
    
    // Add session length patterns
    const avgSessionLength = totalActiveTime / studySessions.length;
    if (avgSessionLength > 90) {
      studyPatterns.push('Long session learner');
    } else if (avgSessionLength < 30) {
      studyPatterns.push('Short burst learner');
    }

    setBehaviorMetrics({
      studyConsistency: Math.round(studyConsistency),
      assignmentCompletion: Math.round(assignmentCompletion),
      procrastinationLevel: Math.round(procrastinationLevel),
      studyPatterns,
      plannerUsage: Math.round(plannerUsage),
      deadlineAdherence: Math.round(deadlineAdherence),
      averageEfficiency: Math.round(averageEfficiency),
      totalActiveTime: Math.round(totalActiveTime)
    });
  }, []);

  const initializeBehaviorTracking = useCallback(() => {
    const defaultBehavior = {
      studySessions: [],
      assignmentSubmissions: [],
      pageVisits: [],
      actions: []
    };
    
    setBehaviorData(defaultBehavior);
    localStorage.setItem('cwa_behavior_data', JSON.stringify(defaultBehavior));
  }, []);

  useEffect(() => {
    // Load saved behavior data
    const savedBehavior = localStorage.getItem('cwa_behavior_data');
    
    if (savedBehavior) {
      const parsedBehavior = JSON.parse(savedBehavior);
      setBehaviorData(parsedBehavior);
      calculateBehaviorMetrics(parsedBehavior, courses);
    } else {
      // Initialize with defaults
      initializeBehaviorTracking();
    }
  }, [courses, calculateBehaviorMetrics, initializeBehaviorTracking]);

  const trackUserAction = useCallback((actionType, actionData) => {
    if (!behaviorData) return;
    
    const timestamp = new Date().toISOString();
    const updatedBehavior = {...behaviorData};
    
    switch (actionType) {
      case 'page_visit':
        updatedBehavior.pageVisits = [
          ...(updatedBehavior.pageVisits || []),
          { timestamp, ...actionData }
        ];
        break;
      
      case 'assignment_added':
        updatedBehavior.assignmentSubmissions = [
          ...(updatedBehavior.assignmentSubmissions || []),
          { timestamp, status: 'added', ...actionData }
        ];
        break;
      
      case 'study_session':
        // Enhanced study session tracking with efficiency data
        const enhancedSessionData = {
          timestamp,
          activeTime: actionData.activeTime || actionData.duration || 0,
          totalDuration: actionData.totalDuration || actionData.duration || 0,
          efficiency: actionData.efficiency || 100,
          trackingMode: actionData.trackingMode || 'manual',
          inactiveTime: actionData.inactiveTime || 0,
          ...actionData
        };
        
        updatedBehavior.studySessions = [
          ...(updatedBehavior.studySessions || []),
          enhancedSessionData
        ];
        break;
        
      default:
        updatedBehavior.actions = [
          ...(updatedBehavior.actions || []),
          { type: actionType, timestamp, ...actionData }
        ];
    }
    
    setBehaviorData(updatedBehavior);
    localStorage.setItem('cwa_behavior_data', JSON.stringify(updatedBehavior));
    calculateBehaviorMetrics(updatedBehavior, courses);
  }, [behaviorData, courses, calculateBehaviorMetrics]);

  const recordStudySession = (sessionData) => {
    if (!courses || !Array.isArray(courses)) return;
    
    const course = courses.find(c => c.id === sessionData.courseId);
    if (!course) return;
    
    trackUserAction('study_session', {
      ...sessionData,
      courseName: course.name
    });
    
    setShowBehaviorModal(false);
  };

  // Enhanced method to save session to backend
  const saveSessionToBackend = useCallback(async (sessionData) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData.id) {
        console.error('No user ID found');
        return;
      }

      const response = await fetch('http://localhost:5000/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.id,
          ...sessionData
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Session saved to backend:', result);
        return result;
      } else {
        console.error('Failed to save session to backend');
      }
    } catch (error) {
      console.error('Error saving session to backend:', error);
    }
  }, []);

  return {
    metrics: behaviorMetrics,
    sessions: behaviorData?.studySessions || [],
    trackUserAction,
    recordStudySession,
    saveSessionToBackend,
    showBehaviorModal,
    setShowBehaviorModal
  };
}
