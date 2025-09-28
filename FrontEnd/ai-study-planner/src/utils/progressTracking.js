// Progress Tracking Utility
// This utility calculates and updates progress for courses based on various activities

export const PROGRESS_ACTIVITIES = {
  ASSIGNMENT_COMPLETE: 20,
  QUIZ_TAKEN: 15,
  SLIDE_UPLOADED: 10,
  SUMMARY_GENERATED: 5,
  COURSE_VIEWED: 2,
  STUDY_SESSION: 8
};

export const PROGRESS_WEIGHTS = {
  assignments: 0.4,    // 40% weight for assignments
  quizzes: 0.3,        // 30% weight for quizzes
  slides: 0.2,         // 20% weight for uploaded materials
  activities: 0.1      // 10% weight for other activities
};

// Calculate progress for a single course
export const calculateCourseProgress = (course) => {
  if (!course) return 0;

  let progressPoints = 0;
  let maxPossiblePoints = 100;

  // Assignment progress (40% weight)
  const assignmentProgress = calculateAssignmentProgress(course.assignments || []);
  progressPoints += assignmentProgress * PROGRESS_WEIGHTS.assignments;

  // Quiz progress (30% weight) - get from localStorage
  const quizProgress = calculateQuizProgress(course.id);
  progressPoints += quizProgress * PROGRESS_WEIGHTS.quizzes;

  // Slide/Material progress (20% weight)
  const slideProgress = calculateSlideProgress(course.slides || [], course.id);
  progressPoints += slideProgress * PROGRESS_WEIGHTS.slides;

  // Activity progress (10% weight) - get from activity history
  const activityProgress = calculateActivityProgress(course.id);
  progressPoints += activityProgress * PROGRESS_WEIGHTS.activities;

  return Math.min(Math.round(progressPoints), 100);
};

// Calculate assignment-based progress
export const calculateAssignmentProgress = (assignments) => {
  if (!assignments || assignments.length === 0) return 0;

  const completedAssignments = assignments.filter(assignment => 
    assignment.score && assignment.maxScore && assignment.score > 0
  );

  if (completedAssignments.length === 0) return 0;

  // Calculate weighted average based on assignment scores
  const totalWeight = assignments.reduce((sum, assignment) => sum + (assignment.weight || 10), 0);
  const completedWeight = completedAssignments.reduce((sum, assignment) => {
    const score = (assignment.score / assignment.maxScore) * 100;
    return sum + (score * (assignment.weight || 10)) / 100;
  }, 0);

  return Math.min((completedWeight / totalWeight) * 100, 100);
};

// Calculate quiz-based progress
export const calculateQuizProgress = (courseId) => {
  try {
    const quizResults = JSON.parse(localStorage.getItem('quiz_results') || '[]');
    const courseQuizzes = quizResults.filter(quiz => 
      quiz.courseId === courseId || quiz.courseName === courseId
    );

    if (courseQuizzes.length === 0) return 0;

    // Calculate average quiz score
    const averageScore = courseQuizzes.reduce((sum, quiz) => sum + (quiz.percentage || 0), 0) / courseQuizzes.length;
    
    // Bonus for taking multiple quizzes
    const quizBonus = Math.min(courseQuizzes.length * 5, 20); // Max 20 bonus points
    
    return Math.min(averageScore + quizBonus, 100);
  } catch (error) {
    console.error('Error calculating quiz progress:', error);
    return 0;
  }
};

// Calculate slide/material upload progress
export const calculateSlideProgress = (slides, courseId) => {
  // Try to get uploaded files from localStorage
  let uploadedFiles = [];
  try {
    const storedFiles = localStorage.getItem(`uploaded_files_${courseId}`);
    if (storedFiles) {
      uploadedFiles = JSON.parse(storedFiles);
    }
  } catch (error) {
    console.error('Error loading uploaded files:', error);
  }
  
  // Use uploaded files if available, otherwise fall back to slides array
  const filesToAnalyze = uploadedFiles.length > 0 ? uploadedFiles : (slides || []);
  
  if (filesToAnalyze.length === 0) return 0;
  
  // Base progress for having slides (15 points per file, max 60)
  const baseProgress = Math.min(filesToAnalyze.length * 15, 60);
  
  // Bonus for variety of file types
  const fileTypes = new Set(filesToAnalyze.map(file => {
    if (typeof file === 'string') {
      return file.split('.').pop().toLowerCase();
    } else if (file.filename) {
      return file.filename.split('.').pop().toLowerCase(); 
    } else if (file.fileType) {
      return file.fileType.split('/').pop().toLowerCase();
    }
    return 'unknown';
  }));
  
  const varietyBonus = Math.min(fileTypes.size * 10, 40); // Max 40 bonus for variety
  
  // Additional bonus for file size and content quality
  let qualityBonus = 0;
  if (uploadedFiles.length > 0) {
    const totalSize = uploadedFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0);
    const avgTextLength = uploadedFiles.filter(f => f.extractedText)
      .reduce((sum, file) => sum + file.extractedText.length, 0) / uploadedFiles.length;
    
    // Bonus for substantial content (max 20 points)
    if (avgTextLength > 1000) qualityBonus += 10;
    if (avgTextLength > 5000) qualityBonus += 10;
    if (totalSize > 1024 * 1024) qualityBonus += 5; // 1MB+
  }
  
  return Math.min(baseProgress + varietyBonus + qualityBonus, 100);
};

// Calculate activity-based progress
export const calculateActivityProgress = (courseId) => {
  try {
    const activities = JSON.parse(localStorage.getItem('activity_history') || '[]');
    const courseActivities = activities.filter(activity => 
      activity.metadata?.courseId === courseId || 
      activity.description.includes(courseId)
    );

    if (courseActivities.length === 0) return 0;

    // Different activity types contribute different points
    let activityPoints = 0;
    courseActivities.forEach(activity => {
      switch(activity.type) {
        case 'file_upload':
          activityPoints += 10;
          break;
        case 'quiz_complete':
          activityPoints += 15;
          break;
        case 'summary_generate':
          activityPoints += 8;
          break;
        case 'course_view':
          activityPoints += 2;
          break;
        default:
          activityPoints += 5;
      }
    });

    return Math.min(activityPoints, 100);
  } catch (error) {
    console.error('Error calculating activity progress:', error);
    return 0;
  }
};

// Update progress for a specific course
export const updateCourseProgress = (courseId, activityType, additionalData = {}) => {
  try {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        const newProgress = calculateCourseProgress(course);
        return {
          ...course,
          progress: newProgress,
          lastUpdated: new Date().toISOString(),
          lastActivity: activityType,
          ...additionalData
        };
      }
      return course;
    });

    localStorage.setItem('courses', JSON.stringify(updatedCourses));
    
    // Also update CWA courses for sync
    localStorage.setItem('cwa_courses', JSON.stringify(updatedCourses));
    
    return updatedCourses;
  } catch (error) {
    console.error('Error updating course progress:', error);
    return [];
  }
};

// Update progress for all courses
export const updateAllCoursesProgress = () => {
  try {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const updatedCourses = courses.map(course => ({
      ...course,
      progress: calculateCourseProgress(course),
      lastUpdated: new Date().toISOString()
    }));

    localStorage.setItem('courses', JSON.stringify(updatedCourses));
    localStorage.setItem('cwa_courses', JSON.stringify(updatedCourses));
    
    return updatedCourses;
  } catch (error) {
    console.error('Error updating all courses progress:', error);
    return [];
  }
};

// Get overall progress across all courses
export const calculateOverallProgress = () => {
  try {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    
    if (courses.length === 0) return 0;
    
    // Calculate weighted average based on credit hours
    const totalCreditHours = courses.reduce((sum, course) => sum + (course.creditHours || 3), 0);
    const weightedProgress = courses.reduce((sum, course) => {
      const courseProgress = course.progress || calculateCourseProgress(course);
      const weight = (course.creditHours || 3) / totalCreditHours;
      return sum + (courseProgress * weight);
    }, 0);
    
    return Math.round(weightedProgress);
  } catch (error) {
    console.error('Error calculating overall progress:', error);
    return 0;
  }
};

// Progress tracking hook for components
export const useProgressTracking = () => {
  const trackActivity = (courseId, activityType, additionalData = {}) => {
    const updatedCourses = updateCourseProgress(courseId, activityType, additionalData);
    
    // Trigger a custom event to notify components of progress updates
    window.dispatchEvent(new CustomEvent('progressUpdated', {
      detail: { courseId, activityType, courses: updatedCourses }
    }));
    
    return updatedCourses;
  };

  const refreshAllProgress = () => {
    const updatedCourses = updateAllCoursesProgress();
    
    window.dispatchEvent(new CustomEvent('progressUpdated', {
      detail: { type: 'all', courses: updatedCourses }
    }));
    
    return updatedCourses;
  };

  return {
    trackActivity,
    refreshAllProgress,
    calculateCourseProgress,
    calculateOverallProgress
  };
};
