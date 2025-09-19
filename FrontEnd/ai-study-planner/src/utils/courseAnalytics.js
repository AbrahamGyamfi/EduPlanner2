// Course-specific analytics and CWA calculation utilities

/**
 * Get study time data for a specific course
 * @param {string} courseId - The course ID
 * @returns {Object} Study time data for the course
 */
export const getCourseStudyTime = (courseId) => {
  try {
    const savedData = localStorage.getItem(`study_time_${courseId}`);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return { totalTime: 0, lastUpdated: null, courseId };
  } catch (error) {
    console.error('Error loading course study time:', error);
    return { totalTime: 0, lastUpdated: null, courseId };
  }
};

/**
 * Get behavior data for a specific course
 * @param {string} courseId - The course ID
 * @returns {Object} Behavior data for the course
 */
export const getCourseBehaviorData = (courseId) => {
  try {
    const behaviorData = JSON.parse(localStorage.getItem('cwa_behavior_data') || '{}');
    if (behaviorData.courseData && behaviorData.courseData[courseId]) {
      return behaviorData.courseData[courseId];
    }
    return {
      studySessions: [],
      totalStudyTime: 0,
      lastActivity: null
    };
  } catch (error) {
    console.error('Error loading course behavior data:', error);
    return {
      studySessions: [],
      totalStudyTime: 0,
      lastActivity: null
    };
  }
};

/**
 * Calculate course-specific CWA score
 * @param {string} courseId - The course ID
 * @returns {Object} Course CWA analysis
 */
export const calculateCourseCWA = (courseId) => {
  try {
    // Get course data from courses list
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
      return { score: 0, analysis: 'Course not found' };
    }

    // Get course-specific study time and behavior data
    const studyTimeData = getCourseStudyTime(courseId);
    const behaviorData = getCourseBehaviorData(courseId);

    // Calculate base score from assignments if available
    let baseScore = 0;
    let assignmentWeight = 0.7; // 70% weight for assignments
    let studyWeight = 0.2; // 20% weight for study time
    let engagementWeight = 0.1; // 10% weight for engagement

    if (course.assignments && course.assignments.length > 0) {
      let totalWeightedScore = 0;
      let totalWeight = 0;

      course.assignments.forEach(assignment => {
        if (assignment.score !== undefined && assignment.maxScore > 0) {
          const percentScore = (assignment.score / assignment.maxScore) * 100;
          const weight = assignment.weight || 1;
          totalWeightedScore += percentScore * weight;
          totalWeight += weight;
        }
      });

      baseScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    } else {
      // If no assignments, use progress
      baseScore = course.progress || 0;
      assignmentWeight = 0.5; // Reduce assignment weight
      studyWeight = 0.4; // Increase study time weight
      engagementWeight = 0.1;
    }

    // Calculate study time contribution
    const studyTimeMinutes = studyTimeData.totalTime / (1000 * 60); // Convert to minutes
    const studyTimeScore = Math.min(100, studyTimeMinutes / 10); // 1 point per 10 minutes, max 100

    // Calculate engagement score based on activity frequency
    const engagementScore = calculateEngagementScore(behaviorData);

    // Calculate weighted CWA
    const courseCWA = (
      baseScore * assignmentWeight +
      studyTimeScore * studyWeight +
      engagementScore * engagementWeight
    );

    return {
      score: Math.round(courseCWA * 100) / 100, // Round to 2 decimal places
      breakdown: {
        assignments: Math.round(baseScore * 100) / 100,
        studyTime: Math.round(studyTimeScore * 100) / 100,
        engagement: Math.round(engagementScore * 100) / 100
      },
      weights: {
        assignments: assignmentWeight,
        studyTime: studyWeight,
        engagement: engagementWeight
      },
      studyTimeMinutes: Math.round(studyTimeMinutes),
      totalSessions: behaviorData.studySessions.length,
      lastActivity: behaviorData.lastActivity || studyTimeData.lastUpdated
    };
  } catch (error) {
    console.error('Error calculating course CWA:', error);
    return { score: 0, analysis: 'Error calculating CWA' };
  }
};

/**
 * Calculate engagement score based on study patterns
 * @param {Object} behaviorData - Course behavior data
 * @returns {number} Engagement score (0-100)
 */
const calculateEngagementScore = (behaviorData) => {
  if (!behaviorData.studySessions || behaviorData.studySessions.length === 0) {
    return 0;
  }

  const sessions = behaviorData.studySessions;
  let engagementScore = 50; // Base score

  // Frequency bonus - more sessions = higher engagement
  const sessionFrequency = sessions.length;
  engagementScore += Math.min(30, sessionFrequency * 2); // Max 30 points for frequency

  // Consistency bonus - regular study times
  if (sessions.length > 1) {
    const sessionDates = sessions.map(s => new Date(s.timestamp)).sort((a, b) => a - b);
    let totalGap = 0;
    for (let i = 1; i < sessionDates.length; i++) {
      const gap = (sessionDates[i] - sessionDates[i-1]) / (1000 * 60 * 60 * 24); // gap in days
      totalGap += gap;
    }
    const avgGap = totalGap / (sessionDates.length - 1);
    
    // Reward consistent study (1-3 day gaps)
    if (avgGap <= 3) {
      engagementScore += 20; // Consistency bonus
    } else if (avgGap <= 7) {
      engagementScore += 10; // Moderate consistency
    }
  }

  return Math.min(100, Math.max(0, engagementScore));
};

/**
 * Get all courses with their CWA scores
 * @returns {Array} Array of courses with CWA scores
 */
export const getAllCoursesWithCWA = () => {
  try {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    return courses.map(course => ({
      ...course,
      cwaData: calculateCourseCWA(course.id)
    }));
  } catch (error) {
    console.error('Error getting all courses with CWA:', error);
    return [];
  }
};

/**
 * Calculate overall student CWA from all courses
 * @returns {Object} Overall CWA analysis
 */
export const calculateOverallCWA = () => {
  try {
    const coursesWithCWA = getAllCoursesWithCWA();
    
    if (coursesWithCWA.length === 0) {
      return { 
        overallCWA: 0, 
        totalCourses: 0, 
        courseBreakdown: [],
        analysis: 'No courses found'
      };
    }

    // Calculate weighted average based on credit hours
    let totalWeightedScore = 0;
    let totalCreditHours = 0;
    let totalStudyTime = 0;
    let totalSessions = 0;

    const courseBreakdown = coursesWithCWA.map(course => {
      const creditHours = course.creditHours || 3; // Default 3 credit hours
      totalWeightedScore += course.cwaData.score * creditHours;
      totalCreditHours += creditHours;
      totalStudyTime += course.cwaData.studyTimeMinutes || 0;
      totalSessions += course.cwaData.totalSessions || 0;

      return {
        courseId: course.id,
        courseName: course.name || course.title,
        cwaScore: course.cwaData.score,
        creditHours: creditHours,
        studyTime: course.cwaData.studyTimeMinutes,
        sessions: course.cwaData.totalSessions,
        lastActivity: course.cwaData.lastActivity
      };
    });

    const overallCWA = totalCreditHours > 0 ? totalWeightedScore / totalCreditHours : 0;

    // Determine academic standing
    let academicStanding = 'Academic Probation';
    let standingColor = '#F44336';
    
    if (overallCWA >= 80) {
      academicStanding = 'First Class Honours';
      standingColor = '#4CAF50';
    } else if (overallCWA >= 70) {
      academicStanding = 'Upper Second Class';
      standingColor = '#8BC34A';
    } else if (overallCWA >= 60) {
      academicStanding = 'Lower Second Class';
      standingColor = '#FFC107';
    } else if (overallCWA >= 50) {
      academicStanding = 'Third Class';
      standingColor = '#FF9800';
    }

    return {
      overallCWA: Math.round(overallCWA * 100) / 100,
      totalCourses: coursesWithCWA.length,
      totalCreditHours,
      totalStudyTime,
      totalSessions,
      courseBreakdown,
      academicStanding: {
        standing: academicStanding,
        color: standingColor
      },
      analysis: `Based on ${coursesWithCWA.length} courses with ${totalCreditHours} total credit hours`
    };
  } catch (error) {
    console.error('Error calculating overall CWA:', error);
    return { 
      overallCWA: 0, 
      totalCourses: 0, 
      courseBreakdown: [],
      analysis: 'Error calculating overall CWA'
    };
  }
};

/**
 * Get course performance trends
 * @param {string} courseId - The course ID
 * @returns {Object} Performance trend analysis
 */
export const getCoursePerformanceTrend = (courseId) => {
  try {
    const behaviorData = getCourseBehaviorData(courseId);
    const sessions = behaviorData.studySessions.slice(-10); // Last 10 sessions
    
    if (sessions.length < 2) {
      return { trend: 'insufficient_data', description: 'Not enough data for trend analysis' };
    }

    // Analyze session frequency trend
    const recentSessions = sessions.slice(-5);
    const olderSessions = sessions.slice(0, 5);
    
    const recentAvgGap = calculateAverageGap(recentSessions);
    const olderAvgGap = calculateAverageGap(olderSessions);

    let trend = 'stable';
    let description = 'Study frequency is stable';

    if (recentAvgGap < olderAvgGap * 0.8) {
      trend = 'improving';
      description = 'Study frequency is improving';
    } else if (recentAvgGap > olderAvgGap * 1.2) {
      trend = 'declining';
      description = 'Study frequency is declining';
    }

    return {
      trend,
      description,
      recentSessions: recentSessions.length,
      totalSessions: sessions.length,
      averageGap: recentAvgGap
    };
  } catch (error) {
    console.error('Error calculating course performance trend:', error);
    return { trend: 'error', description: 'Error calculating trend' };
  }
};

/**
 * Calculate average gap between study sessions
 * @param {Array} sessions - Array of study sessions
 * @returns {number} Average gap in days
 */
const calculateAverageGap = (sessions) => {
  if (sessions.length < 2) return 0;
  
  const dates = sessions.map(s => new Date(s.timestamp)).sort((a, b) => a - b);
  let totalGap = 0;
  
  for (let i = 1; i < dates.length; i++) {
    const gap = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24); // gap in days
    totalGap += gap;
  }
  
  return totalGap / (dates.length - 1);
};

export default {
  getCourseStudyTime,
  getCourseBehaviorData,
  calculateCourseCWA,
  getAllCoursesWithCWA,
  calculateOverallCWA,
  getCoursePerformanceTrend
};
