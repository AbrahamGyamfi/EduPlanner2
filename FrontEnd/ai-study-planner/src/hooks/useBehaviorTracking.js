import { useState, useEffect } from 'react';

export function useBehaviorTracking(courses) {
  const [behaviorData, setBehaviorData] = useState(null);
  const [behaviorMetrics, setBehaviorMetrics] = useState({
    studyConsistency: 0,
    assignmentCompletion: 0,
    studyPatterns: [],
    procrastinationLevel: 0
  });
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);

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
    
    // Track page visit
    trackUserAction('page_visit', { timestamp: new Date().toISOString() });
  }, [courses]);

  const initializeBehaviorTracking = () => {
    const defaultBehavior = {
      studySessions: [],
      assignmentSubmissions: [],
      pageVisits: [],
      actions: []
    };
    
    setBehaviorData(defaultBehavior);
    localStorage.setItem('cwa_behavior_data', JSON.stringify(defaultBehavior));
  };

  const trackUserAction = (actionType, actionData) => {
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
        updatedBehavior.studySessions = [
          ...(updatedBehavior.studySessions || []),
          { timestamp, ...actionData }
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
  };

  const calculateBehaviorMetrics = (data, currentCourses) => {
    if (!data) return;
    
    // Study consistency calculation
    const studySessions = data.studySessions || [];
    let studyConsistency = 0;
    
    if (studySessions.length > 1) {
      // Calculate from frequency and regularity
      const sessionDates = studySessions.map(s => new Date(s.timestamp));
      sessionDates.sort((a, b) => a - b);
      
      let totalGap = 0;
      for (let i = 1; i < sessionDates.length; i++) {
        const gap = (sessionDates[i] - sessionDates[i-1]) / (1000 * 60 * 60 * 24); // gap in days
        totalGap += gap;
      }
      
      const avgGap = totalGap / (sessionDates.length - 1);
      studyConsistency = avgGap <= 2 ? 100 :
                        avgGap <= 3 ? 80 :
                        avgGap <= 5 ? 60 :
                        avgGap <= 7 ? 40 : 20;
    } else if (studySessions.length === 1) {
      studyConsistency = 30; // Only one session recorded
    }
    
    // Assignment completion ratio
    const assignments = currentCourses.flatMap(c => c.assignments || []);
    const totalAssignments = assignments.length;
    const assignmentSubmissions = data.assignmentSubmissions || [];
    
    const assignmentCompletion = totalAssignments > 0 
      ? Math.min(100, (assignmentSubmissions.length / totalAssignments) * 100)
      : 0;
    
    // Procrastination level
    const procrastinationLevel = 5; // Default middle value
    
    // Study patterns analysis
    const studyPatterns = [];
    const morningStudy = studySessions.filter(s => {
      const hour = new Date(s.timestamp).getHours();
      return hour >= 5 && hour < 12;
    }).length;
    
    const eveningStudy = studySessions.filter(s => {
      const hour = new Date(s.timestamp).getHours();
      return hour >= 18;
    }).length;
    
    const weekendStudy = studySessions.filter(s => {
      const day = new Date(s.timestamp).getDay();
      return day === 0 || day === 6;
    }).length;
    
    if (morningStudy > eveningStudy && studySessions.length > 0) {
      studyPatterns.push('Morning person');
    } else if (eveningStudy > morningStudy && studySessions.length > 0) {
      studyPatterns.push('Night owl');
    }
    
    if (weekendStudy > (studySessions.length - weekendStudy) && studySessions.length > 0) {
      studyPatterns.push('Weekend warrior');
    }
    
    setBehaviorMetrics({
      studyConsistency,
      assignmentCompletion,
      procrastinationLevel,
      studyPatterns
    });
  };

  const recordStudySession = (courseId, duration) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    trackUserAction('study_session', {
      courseId,
      courseName: course.name,
      durationMinutes: duration
    });
    
    setShowBehaviorModal(false);
  };

  return {
    behaviorMetrics,
    trackUserAction,
    recordStudySession,
    showBehaviorModal,
    setShowBehaviorModal
  };
}
