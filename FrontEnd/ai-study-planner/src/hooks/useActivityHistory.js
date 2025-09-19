import { useState, useEffect } from 'react';

export const useActivityHistory = () => {
  const [activities, setActivities] = useState([]);

  // Load activities from localStorage on initialization
  useEffect(() => {
    const savedActivities = localStorage.getItem('userActivityHistory');
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    }
  }, []);

  // Save activities to localStorage whenever activities change
  useEffect(() => {
    localStorage.setItem('userActivityHistory', JSON.stringify(activities));
  }, [activities]);

  const addActivity = (type, description, metadata = {}) => {
    try {
      // Ensure metadata is serializable (no large non-serializable objects)
      const serializableMetadata = { ...metadata };
      if (serializableMetadata.summaryContent && serializableMetadata.summaryContent.length > 5000) {
        serializableMetadata.summaryContent = serializableMetadata.summaryContent.substring(0, 5000) + '...';
      }
      
      if (serializableMetadata.quizContent) {
        // Store a summary of the quiz instead of the full object
        serializableMetadata.quizSummary = {
          questionCount: serializableMetadata.quizContent.questions?.length || 0,
          firstQuestion: serializableMetadata.quizContent.questions?.[0]?.question || 'N/A'
        };
        delete serializableMetadata.quizContent; // Avoid storing large quiz object
      }

      const newActivity = {
        id: Date.now().toString(),
        type,
        description,
        timestamp: new Date().toISOString(),
        metadata: serializableMetadata,
        completed: false
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 100));
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const markActivityAsCompleted = (activityId) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId ? { ...activity, completed: true } : activity
      )
    );
  };

  const clearHistory = () => {
    setActivities([]);
    localStorage.removeItem('userActivityHistory');
  };

  const getActivitiesByType = (type) => {
    return activities.filter(activity => activity.type === type);
  };

  const getActivitiesByDateRange = (startDate, endDate) => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= startDate && activityDate <= endDate;
    });
  };

  const getActivityStats = () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= todayStart
    );

    const activityTypes = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalActivities: activities.length,
      todayActivities: todayActivities.length,
      activityTypes,
      mostRecentActivity: activities[0] || null,
    };
  };

  return {
    activities,
    addActivity,
    markActivityAsCompleted,
    clearHistory,
    getActivitiesByType,
    getActivitiesByDateRange,
    getActivityStats,
  };
};

// Activity types constants
export const ACTIVITY_TYPES = {
  FILE_UPLOAD: 'file_upload',
  SUMMARY_GENERATE: 'summary_generate',
  QUIZ_GENERATE: 'quiz_generate',
  QUIZ_COMPLETE: 'quiz_complete',
  COURSE_CREATE: 'course_create',
  COURSE_VIEW: 'course_view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PAGE_VISIT: 'page_visit',
  ASSIGNMENT_CREATE: 'assignment_create',
  ASSIGNMENT_COMPLETE: 'assignment_complete',
  PROFILE_UPDATE: 'profile_update',
};
