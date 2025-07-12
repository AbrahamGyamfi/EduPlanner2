/**
 * Advanced CWA (Cumulative Weighted Average) Analysis Module
 * 
 * This module provides comprehensive academic performance analysis including:
 * - Automatic data collection from multiple sources
 * - Current and projected CWA calculations
 * - Performance trend analysis
 * - Personalized recommendations and study scheduling
 * - Integration with behavioral tracking data
 */

import AutoDataCollector from '../utils/AutoDataCollector';
import CWAAnalysis from '../utils/CWAAnalysis';
import RecommendationEngine from './RecommendationEngine';

/**
 * Study time preferences enum
 */
export const STUDY_TIME_PREFERENCES = {
  DAWN: 'dawn', // 5-7 AM
  MORNING: 'morning', // 7-11 AM
  AFTERNOON: 'afternoon', // 12-5 PM
  EVENING: 'evening' // 6-10 PM
};

/**
 * Performance levels enum
 */
export const PERFORMANCE_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  SATISFACTORY: 'satisfactory',
  AT_RISK: 'at_risk',
  CRITICAL: 'critical'
};

class AdvancedCWAAnalyzer {
  constructor() {
    this.dataCollector = new AutoDataCollector();
    this.cwaAnalysis = null;
    this.recommendationEngine = new RecommendationEngine();
    this.lastAnalysisTimestamp = null;
    this.analysisCache = new Map();
  }

  /**
   * Automatically pull all relevant data from the system
   * @returns {Object} Comprehensive student data
   */
  async pullSystemData() {
    try {
      // Start data collection if not already tracking
      this.dataCollector.startTracking();

      // Get current analytics from tracking service
      const trackingData = this.dataCollector.getAnalytics();

      // Pull data from localStorage (existing system integration)
      const courses = JSON.parse(localStorage.getItem('cwa_courses') || '[]');
      const studentProfile = JSON.parse(localStorage.getItem('cwa_student_profile') || 'null');
      const behaviorData = JSON.parse(localStorage.getItem('behavior_tracking_data') || '{}');

      // Get quiz data from local storage
      const quizData = JSON.parse(localStorage.getItem('quiz_results') || '[]');

      // Get study session data
      const studySessions = JSON.parse(localStorage.getItem('study_sessions') || '[]');

      // Get assignment statuses
      const assignments = this.extractAllAssignments(courses);

      return {
        courses,
        studentProfile,
        behaviorData,
        trackingData,
        quizData,
        studySessions,
        assignments,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error pulling system data:', error);
      throw new Error('Failed to collect system data for analysis');
    }
  }

  /**
   * Extract all assignments from courses with their current status
   * @param {Array} courses - List of courses
   * @returns {Array} All assignments with metadata
   */
  extractAllAssignments(courses) {
    const assignments = [];
    
    courses.forEach(course => {
      if (course.assignments && course.assignments.length > 0) {
        course.assignments.forEach(assignment => {
          assignments.push({
            ...assignment,
            courseName: course.name,
            courseId: course.id,
            creditHours: course.creditHours,
            status: this.determineAssignmentStatus(assignment),
            performanceLevel: this.getAssignmentPerformanceLevel(assignment)
          });
        });
      }
    });

    return assignments;
  }

  /**
   * Determine assignment status based on completion and score
   * @param {Object} assignment - Assignment data
   * @returns {string} Status of assignment
   */
  determineAssignmentStatus(assignment) {
    if (!assignment.score || assignment.score === 0) {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      
      if (dueDate < now) {
        return 'overdue';
      } else if (dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return 'due_soon';
      }
      return 'pending';
    }
    return 'completed';
  }

  /**
   * Get performance level for an assignment based on score
   * @param {Object} assignment - Assignment data
   * @returns {string} Performance level
   */
  getAssignmentPerformanceLevel(assignment) {
    if (!assignment.score || !assignment.maxScore) return 'unknown';
    
    const percentage = (assignment.score / assignment.maxScore) * 100;
    
    if (percentage >= 90) return PERFORMANCE_LEVELS.EXCELLENT;
    if (percentage >= 80) return PERFORMANCE_LEVELS.GOOD;
    if (percentage >= 70) return PERFORMANCE_LEVELS.SATISFACTORY;
    if (percentage >= 60) return PERFORMANCE_LEVELS.AT_RISK;
    return PERFORMANCE_LEVELS.CRITICAL;
  }

  /**
   * Calculate current CWA with enhanced weighting
   * @param {Object} systemData - All collected system data
   * @returns {Object} Current CWA analysis
   */
  calculateCurrentCWA(systemData) {
    const { courses, quizData, studySessions } = systemData;
    
    if (!courses || courses.length === 0) {
      return {
        cwa: 0,
        weightedScore: 0,
        totalCreditHours: 0,
        courseBreakdown: [],
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        academicStanding: this.getAcademicStanding(0)
      };
    }

    let totalWeightedScore = 0;
    let totalCreditHours = 0;
    const courseBreakdown = [];
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    courses.forEach(course => {
      const courseAnalysis = this.analyzeCoursePerformance(course, quizData, studySessions);
      courseBreakdown.push(courseAnalysis);

      // Weight by credit hours
      totalWeightedScore += courseAnalysis.weightedScore * course.creditHours;
      totalCreditHours += course.creditHours;

      // Update grade distribution
      const grade = this.scoreToLetterGrade(courseAnalysis.averageScore);
      gradeDistribution[grade]++;
    });

    const currentCWA = totalCreditHours > 0 ? totalWeightedScore / totalCreditHours : 0;

    return {
      cwa: Math.round(currentCWA * 100) / 100,
      weightedScore: Math.round(totalWeightedScore * 100) / 100,
      totalCreditHours,
      courseBreakdown,
      gradeDistribution,
      academicStanding: this.getAcademicStanding(currentCWA)
    };
  }

  /**
   * Analyze individual course performance with multiple factors
   * @param {Object} course - Course data
   * @param {Array} quizData - Quiz results
   * @param {Array} studySessions - Study session data
   * @returns {Object} Course analysis
   */
  analyzeCoursePerformance(course, quizData = [], studySessions = []) {
    const assignments = course.assignments || [];
    const courseQuizzes = quizData.filter(quiz => quiz.courseId === course.id);
    const courseStudySessions = studySessions.filter(session => session.courseId === course.id);

    // Calculate assignment scores
    let assignmentScore = 0;
    let totalAssignmentWeight = 0;

    assignments.forEach(assignment => {
      if (assignment.score && assignment.maxScore) {
        const percentage = (assignment.score / assignment.maxScore) * 100;
        assignmentScore += percentage * (assignment.weight || 1);
        totalAssignmentWeight += (assignment.weight || 1);
      }
    });

    const avgAssignmentScore = totalAssignmentWeight > 0 ? assignmentScore / totalAssignmentWeight : 0;

    // Calculate quiz performance
    const avgQuizScore = courseQuizzes.length > 0 
      ? courseQuizzes.reduce((sum, quiz) => sum + quiz.score, 0) / courseQuizzes.length 
      : 0;

    // Calculate study time factor (bonus for consistent study)
    const totalStudyTime = courseStudySessions.reduce((sum, session) => sum + session.duration, 0);
    const studyConsistency = this.calculateStudyConsistency(courseStudySessions);
    const studyTimeBonus = Math.min(5, (studyConsistency / 100) * 5); // Max 5% bonus

    // Weighted course score
    const baseScore = (avgAssignmentScore * 0.7) + (avgQuizScore * 0.3);
    const finalScore = Math.min(100, baseScore + studyTimeBonus);

    return {
      courseId: course.id,
      courseName: course.name,
      creditHours: course.creditHours,
      averageScore: Math.round(finalScore * 100) / 100,
      weightedScore: finalScore,
      assignmentScore: Math.round(avgAssignmentScore * 100) / 100,
      quizScore: Math.round(avgQuizScore * 100) / 100,
      studyTimeBonus: Math.round(studyTimeBonus * 100) / 100,
      totalStudyTime: totalStudyTime,
      studyConsistency: studyConsistency,
      assignmentsCompleted: assignments.filter(a => a.score && a.score > 0).length,
      totalAssignments: assignments.length,
      performanceLevel: this.getAssignmentPerformanceLevel({ score: finalScore, maxScore: 100 }),
      trend: this.calculateCourseTrend(assignments)
    };
  }

  /**
   * Calculate study consistency for a course
   * @param {Array} studySessions - Study sessions for the course
   * @returns {number} Consistency score (0-100)
   */
  calculateStudyConsistency(studySessions) {
    if (studySessions.length < 2) return studySessions.length * 50;

    const sessions = studySessions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const gaps = [];

    for (let i = 1; i < sessions.length; i++) {
      const gap = new Date(sessions[i].timestamp) - new Date(sessions[i-1].timestamp);
      gaps.push(gap);
    }

    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const idealGap = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const consistency = Math.max(0, 100 - (Math.abs(averageGap - idealGap) / idealGap) * 100);

    return Math.round(consistency);
  }

  /**
   * Calculate trend for a course based on recent assignments
   * @param {Array} assignments - Course assignments
   * @returns {string} Trend direction
   */
  calculateCourseTrend(assignments) {
    if (!assignments || assignments.length < 2) return 'insufficient_data';

    const completedAssignments = assignments
      .filter(a => a.score && a.score > 0)
      .sort((a, b) => new Date(a.timestamp || a.submittedAt) - new Date(b.timestamp || b.submittedAt));

    if (completedAssignments.length < 2) return 'insufficient_data';

    const recent = completedAssignments.slice(-3);
    const older = completedAssignments.slice(0, -3);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / older.length;

    const difference = recentAvg - olderAvg;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  /**
   * Calculate projected CWA based on current patterns
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} systemData - All system data
   * @returns {Object} Projected CWA analysis
   */
  calculateProjectedCWA(currentCWA, systemData) {
    const { behaviorData, trackingData, studentProfile } = systemData;

    // Base projection factors
    const behaviorFactor = this.calculateBehaviorImpactFactor(behaviorData, trackingData);
    const studyTimeFactor = this.calculateStudyTimeImpactFactor(systemData);
    const consistencyFactor = this.calculateConsistencyImpactFactor(systemData);
    const courseDifficultyFactor = this.calculateCourseDifficultyFactor(currentCWA.courseBreakdown);

    // Calculate projected improvement/decline
    const maxChange = 15; // Maximum CWA change percentage
    const projectedChange = (
      behaviorFactor * 0.3 +
      studyTimeFactor * 0.25 +
      consistencyFactor * 0.25 +
      courseDifficultyFactor * 0.2
    ) * maxChange;

    const projectedCWA = Math.max(0, Math.min(100, currentCWA.cwa + projectedChange));

    // Calculate confidence interval
    const dataQuality = this.assessDataQuality(systemData);
    const confidenceInterval = this.calculateConfidenceInterval(projectedCWA, dataQuality);

    // Calculate individual course CWA predictions
    const courseProjections = this.calculateIndividualCourseCWAProjections(currentCWA, systemData);

    return {
      projected: Math.round(projectedCWA * 100) / 100,
      change: Math.round(projectedChange * 100) / 100,
      changeDirection: projectedChange > 1 ? 'improving' : projectedChange < -1 ? 'declining' : 'stable',
      confidenceInterval,
      reliability: dataQuality,
      courseProjections,
      factors: {
        behavior: Math.round(behaviorFactor * 100) / 100,
        studyTime: Math.round(studyTimeFactor * 100) / 100,
        consistency: Math.round(consistencyFactor * 100) / 100,
        courseDifficulty: Math.round(courseDifficultyFactor * 100) / 100
      }
    };
  }

  /**
   * Calculate behavior impact factor from tracking data
   * @param {Object} behaviorData - Behavior tracking data
   * @param {Object} trackingData - System tracking data
   * @returns {number} Impact factor (-1 to 1)
   */
  calculateBehaviorImpactFactor(behaviorData, trackingData) {
    let factor = 0;

    // Procrastination impact
    if (behaviorData.procrastinationLevel) {
      factor -= (behaviorData.procrastinationLevel - 5) / 10; // Scale 1-10 to impact
    }

    // Study consistency impact
    if (behaviorData.studyConsistency) {
      factor += (behaviorData.studyConsistency - 50) / 100; // Scale 0-100 to impact
    }

    // Assignment completion rate impact
    if (behaviorData.assignmentCompletion) {
      factor += (behaviorData.assignmentCompletion - 75) / 50; // Scale to impact
    }

    // Engagement from tracking data
    if (trackingData && trackingData.engagementStats) {
      const engagement = trackingData.engagementStats.averageEngagement || 50;
      factor += (engagement - 50) / 100;
    }

    return Math.max(-1, Math.min(1, factor));
  }

  /**
   * Calculate study time impact factor
   * @param {Object} systemData - All system data
   * @returns {number} Impact factor (-1 to 1)
   */
  calculateStudyTimeImpactFactor(systemData) {
    const { studentProfile, studySessions, courses } = systemData;
    
    if (!studentProfile || !studySessions) return 0;

    const totalCreditHours = courses.reduce((sum, course) => sum + course.creditHours, 0);
    const recommendedHours = totalCreditHours * 2; // 2 hours per credit hour
    const actualHours = studentProfile.studyHoursPerWeek || 0;

    const ratio = actualHours / recommendedHours;
    
    // Optimal ratio is around 1.0, diminishing returns above 1.5
    if (ratio < 0.5) return -0.5; // Severely under-studying
    if (ratio < 0.8) return -0.2; // Under-studying
    if (ratio <= 1.2) return 0.3; // Optimal range
    if (ratio <= 1.5) return 0.1; // Slightly over-studying
    return -0.1; // Potential burnout
  }

  /**
   * Calculate consistency impact factor
   * @param {Object} systemData - All system data  
   * @returns {number} Impact factor (-1 to 1)
   */
  calculateConsistencyImpactFactor(systemData) {
    const { trackingData } = systemData;
    
    if (!trackingData || !trackingData.studySessionStats) return 0;

    const consistency = trackingData.studySessionStats.consistencyScore || 50;
    return (consistency - 50) / 100; // Scale 0-100 to -0.5 to 0.5
  }

  /**
   * Calculate course difficulty impact factor
   * @param {Array} courseBreakdown - Individual course analyses
   * @returns {number} Impact factor (-1 to 1)
   */
  calculateCourseDifficultyFactor(courseBreakdown) {
    if (!courseBreakdown || courseBreakdown.length === 0) return 0;

    const improvingCourses = courseBreakdown.filter(c => c.trend === 'improving').length;
    const decliningCourses = courseBreakdown.filter(c => c.trend === 'declining').length;
    const totalCourses = courseBreakdown.length;

    const improvementRatio = improvingCourses / totalCourses;
    const declineRatio = decliningCourses / totalCourses;

    return improvementRatio - declineRatio;
  }

  /**
   * Assess overall data quality for reliability calculation
   * @param {Object} systemData - All system data
   * @returns {number} Data quality score (0-1)
   */
  assessDataQuality(systemData) {
    let qualityScore = 0.3; // Base score

    const { courses, studentProfile, behaviorData, trackingData, studySessions } = systemData;

    // Course data quality
    if (courses && courses.length > 0) {
      qualityScore += 0.2;
      const totalAssignments = courses.reduce((sum, course) => sum + (course.assignments?.length || 0), 0);
      if (totalAssignments > 5) qualityScore += 0.1;
    }

    // Profile completeness
    if (studentProfile) {
      qualityScore += 0.15;
      const requiredFields = ['studyHoursPerWeek', 'stressLevel', 'motivationLevel'];
      const completedFields = requiredFields.filter(field => studentProfile[field] != null).length;
      qualityScore += (completedFields / requiredFields.length) * 0.1;
    }

    // Behavior data availability
    if (behaviorData && Object.keys(behaviorData).length > 0) {
      qualityScore += 0.15;
    }

    // Tracking data availability
    if (trackingData && trackingData.studySessionStats) {
      qualityScore += 0.1;
    }

    // Study sessions data
    if (studySessions && studySessions.length > 0) {
      qualityScore += 0.1;
    }

    return Math.min(1, qualityScore);
  }

  /**
   * Calculate confidence interval for projections
   * @param {number} projectedCWA - Projected CWA value
   * @param {number} dataQuality - Data quality score (0-1)
   * @returns {Object} Confidence interval
   */
  calculateConfidenceInterval(projectedCWA, dataQuality) {
    const maxInterval = 10; // Maximum interval width
    const intervalWidth = maxInterval * (1 - dataQuality);

    return {
      lower: Math.max(0, projectedCWA - intervalWidth),
      upper: Math.min(100, projectedCWA + intervalWidth),
      width: intervalWidth * 2,
      confidence: Math.round(dataQuality * 100)
    };
  }

  /**
   * Generate performance trend overview
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} projectedCWA - Projected CWA analysis
   * @param {Object} systemData - All system data
   * @returns {Object} Performance trend analysis
   */
  generatePerformanceTrend(currentCWA, projectedCWA, systemData) {
    const courseBreakdown = currentCWA.courseBreakdown;
    
    // Overall trend
    const overallTrend = projectedCWA.changeDirection;
    
    // Subject-specific trends
    const subjectTrends = courseBreakdown.map(course => ({
      courseName: course.courseName,
      currentScore: course.averageScore,
      trend: course.trend,
      performanceLevel: course.performanceLevel,
      studyTime: course.totalStudyTime,
      consistency: course.studyConsistency
    }));

    // Identify patterns
    const patterns = this.identifyPerformancePatterns(courseBreakdown, systemData);

    // Calculate momentum
    const momentum = this.calculatePerformanceMomentum(courseBreakdown, systemData);

    return {
      overall: {
        direction: overallTrend,
        strength: Math.abs(projectedCWA.change),
        momentum: momentum,
        description: this.generateTrendDescription(overallTrend, projectedCWA.change)
      },
      bySubject: subjectTrends,
      patterns: patterns,
      riskFactors: this.identifyRiskFactors(currentCWA, systemData),
      opportunities: this.identifyOpportunities(currentCWA, systemData)
    };
  }

  /**
   * Identify performance patterns across courses
   * @param {Array} courseBreakdown - Course performance data
   * @param {Object} systemData - All system data
   * @returns {Array} Identified patterns
   */
  identifyPerformancePatterns(courseBreakdown, systemData) {
    const patterns = [];

    // Check for consistent improvement across courses
    const improvingCourses = courseBreakdown.filter(c => c.trend === 'improving');
    if (improvingCourses.length / courseBreakdown.length > 0.6) {
      patterns.push({
        type: 'consistent_improvement',
        description: 'Showing improvement across most courses',
        strength: 'high',
        courses: improvingCourses.map(c => c.courseName)
      });
    }

    // Check for study time correlation
    const highStudyTimeCourses = courseBreakdown.filter(c => c.totalStudyTime > 1000); // 1000 minutes
    const avgScoreHighStudy = highStudyTimeCourses.reduce((sum, c) => sum + c.averageScore, 0) / highStudyTimeCourses.length;
    const avgScoreOverall = courseBreakdown.reduce((sum, c) => sum + c.averageScore, 0) / courseBreakdown.length;

    if (avgScoreHighStudy > avgScoreOverall + 5) {
      patterns.push({
        type: 'study_time_correlation',
        description: 'Higher study time correlates with better performance',
        strength: 'medium',
        evidence: `Courses with more study time average ${avgScoreHighStudy.toFixed(1)}% vs ${avgScoreOverall.toFixed(1)}% overall`
      });
    }

    // Check for consistency pattern
    const highConsistencyCourses = courseBreakdown.filter(c => c.studyConsistency > 70);
    if (highConsistencyCourses.length > 0) {
      const avgScoreConsistent = highConsistencyCourses.reduce((sum, c) => sum + c.averageScore, 0) / highConsistencyCourses.length;
      if (avgScoreConsistent > avgScoreOverall + 3) {
        patterns.push({
          type: 'consistency_advantage',
          description: 'Consistent study schedule improves performance',
          strength: 'high',
          courses: highConsistencyCourses.map(c => c.courseName)
        });
      }
    }

    return patterns;
  }

  /**
   * Calculate performance momentum
   * @param {Array} courseBreakdown - Course performance data
   * @param {Object} systemData - All system data
   * @returns {string} Momentum assessment
   */
  calculatePerformanceMomentum(courseBreakdown, systemData) {
    const trendScores = {
      'improving': 1,
      'stable': 0,
      'declining': -1,
      'insufficient_data': 0
    };

    const totalMomentum = courseBreakdown.reduce((sum, course) => {
      return sum + (trendScores[course.trend] || 0) * course.creditHours;
    }, 0);

    const totalCreditHours = courseBreakdown.reduce((sum, course) => sum + course.creditHours, 0);
    const avgMomentum = totalCreditHours > 0 ? totalMomentum / totalCreditHours : 0;

    if (avgMomentum > 0.3) return 'strong_positive';
    if (avgMomentum > 0.1) return 'positive';
    if (avgMomentum > -0.1) return 'neutral';
    if (avgMomentum > -0.3) return 'negative';
    return 'strong_negative';
  }

  /**
   * Generate trend description
   * @param {string} direction - Trend direction
   * @param {number} change - Magnitude of change
   * @returns {string} Human-readable description
   */
  generateTrendDescription(direction, change) {
    const magnitude = Math.abs(change);
    
    if (direction === 'improving') {
      if (magnitude > 5) return 'Strong upward trajectory with significant improvement expected';
      if (magnitude > 2) return 'Positive trend with moderate improvement expected';
      return 'Slight improvement trend with steady progress';
    } else if (direction === 'declining') {
      if (magnitude > 5) return 'Concerning downward trend requiring immediate attention';
      if (magnitude > 2) return 'Declining performance that needs addressing';
      return 'Slight downward trend worth monitoring';
    } else {
      return 'Stable performance with consistent results';
    }
  }

  /**
   * Identify risk factors in current performance
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} systemData - All system data
   * @returns {Array} Risk factors
   */
  identifyRiskFactors(currentCWA, systemData) {
    const risks = [];
    const { studentProfile, behaviorData } = systemData;

    // Low overall CWA
    if (currentCWA.cwa < 60) {
      risks.push({
        factor: 'low_cwa',
        severity: 'high',
        description: 'Current CWA below minimum academic requirements',
        impact: 'Academic probation risk'
      });
    }

    // Declining courses
    const decliningCourses = currentCWA.courseBreakdown.filter(c => c.trend === 'declining');
    if (decliningCourses.length > 0) {
      risks.push({
        factor: 'declining_courses',
        severity: decliningCourses.length > 2 ? 'high' : 'medium',
        description: `${decliningCourses.length} course(s) showing declining performance`,
        courses: decliningCourses.map(c => c.courseName)
      });
    }

    // High stress levels
    if (studentProfile && studentProfile.stressLevel > 7) {
      risks.push({
        factor: 'high_stress',
        severity: 'medium',
        description: 'High stress levels may impact academic performance',
        recommendation: 'Consider stress management techniques'
      });
    }

    // Procrastination
    if (behaviorData && behaviorData.procrastinationLevel > 7) {
      risks.push({
        factor: 'procrastination',
        severity: 'medium',
        description: 'High procrastination level affecting productivity',
        recommendation: 'Implement time management strategies'
      });
    }

    // Low study consistency
    const avgConsistency = currentCWA.courseBreakdown.reduce((sum, c) => sum + c.studyConsistency, 0) / currentCWA.courseBreakdown.length;
    if (avgConsistency < 50) {
      risks.push({
        factor: 'inconsistent_study',
        severity: 'medium',
        description: 'Inconsistent study patterns affecting performance',
        recommendation: 'Establish regular study schedule'
      });
    }

    return risks;
  }

  /**
   * Identify opportunities for improvement
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} systemData - All system data
   * @returns {Array} Opportunities
   */
  identifyOpportunities(currentCWA, systemData) {
    const opportunities = [];

    // Courses with room for improvement
    const improvableCourses = currentCWA.courseBreakdown.filter(c => 
      c.averageScore < 85 && c.trend !== 'declining'
    );

    if (improvableCourses.length > 0) {
      opportunities.push({
        type: 'course_improvement',
        description: 'Several courses have potential for grade improvement',
        courses: improvableCourses.map(c => ({
          name: c.courseName,
          currentScore: c.averageScore,
          potential: Math.min(95, c.averageScore + 10)
        })),
        impact: 'medium'
      });
    }

    // Low study time courses
    const lowStudyTimeCourses = currentCWA.courseBreakdown.filter(c => 
      c.totalStudyTime < 500 && c.averageScore < 80
    );

    if (lowStudyTimeCourses.length > 0) {
      opportunities.push({
        type: 'increase_study_time',
        description: 'Increasing study time for specific courses could yield improvements',
        courses: lowStudyTimeCourses.map(c => c.courseName),
        impact: 'high'
      });
    }

    // Consistency improvement
    const inconsistentCourses = currentCWA.courseBreakdown.filter(c => c.studyConsistency < 70);
    if (inconsistentCourses.length > 0) {
      opportunities.push({
        type: 'improve_consistency',
        description: 'Better study consistency could improve performance',
        courses: inconsistentCourses.map(c => c.courseName),
        impact: 'medium'
      });
    }

    return opportunities;
  }

  /**
   * Convert score to letter grade
   * @param {number} score - Numerical score
   * @returns {string} Letter grade
   */
  scoreToLetterGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get academic standing based on CWA
   * @param {number} cwa - Current CWA
   * @returns {Object} Academic standing info
   */
  getAcademicStanding(cwa) {
    if (cwa >= 80) return {
      level: 'First Class Honours',
      description: 'Outstanding academic achievement',
      color: '#4CAF50'
    };
    if (cwa >= 70) return {
      level: 'Upper Second Class',
      description: 'Very good academic standing',
      color: '#8BC34A'
    };
    if (cwa >= 60) return {
      level: 'Lower Second Class',
      description: 'Good academic standing',
      color: '#FFC107'
    };
    if (cwa >= 50) return {
      level: 'Third Class',
      description: 'Satisfactory academic standing',
      color: '#FF9800'
    };
    return {
      level: 'Academic Probation',
      description: 'Below minimum academic requirements',
      color: '#F44336'
    };
  }

  /**
   * Main analysis function that orchestrates the entire process
   * @returns {Object} Complete CWA analysis results
   */
  async performCompleteAnalysis() {
    try {
      // Step 1: Pull all relevant data
      const systemData = await this.pullSystemData();

      // Step 2: Calculate current CWA
      const currentCWA = this.calculateCurrentCWA(systemData);

      // Step 3: Calculate projected CWA
      const projectedCWA = this.calculateProjectedCWA(currentCWA, systemData);

      // Step 4: Generate performance trend overview
      const performanceTrend = this.generatePerformanceTrend(currentCWA, projectedCWA, systemData);

      // Step 5: Generate actionable recommendations (will be implemented in next step)
      const recommendations = await this.generateActionableRecommendations(
        currentCWA, 
        projectedCWA, 
        performanceTrend, 
        systemData
      );

      // Step 6: Generate personalized study schedule (will be implemented in next step)  
      const studySchedule = await this.generatePersonalizedStudySchedule(
        currentCWA,
        systemData,
        recommendations
      );

      // Step 7: Compile final results
      const results = {
        timestamp: new Date().toISOString(),
        currentCWA,
        projectedCWA,
        performanceTrend,
        recommendations,
        studySchedule,
        systemData: {
          dataQuality: this.assessDataQuality(systemData),
          lastUpdated: systemData.timestamp,
          coursesAnalyzed: systemData.courses.length,
          totalStudySessions: systemData.studySessions.length
        }
      };

      // Cache results
      this.lastAnalysisTimestamp = new Date().toISOString();
      this.analysisCache.set('latest', results);

      return results;

    } catch (error) {
      console.error('Error performing complete CWA analysis:', error);
      throw new Error(`CWA Analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate actionable recommendations using the RecommendationEngine
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} projectedCWA - Projected CWA analysis  
   * @param {Object} performanceTrend - Performance trend analysis
   * @param {Object} systemData - All system data
   * @returns {Object} Actionable recommendations
   */
  async generateActionableRecommendations(currentCWA, projectedCWA, performanceTrend, systemData) {
    try {
      return this.recommendationEngine.generateActionableRecommendations(
        currentCWA, 
        projectedCWA, 
        performanceTrend, 
        systemData
      );
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Return basic fallback recommendations
      return {
        immediate: [{
          id: 'basic_study_plan',
          priority: 'medium',
          title: 'Establish Regular Study Schedule',
          description: 'Create a consistent study routine to improve performance.',
          actions: [
            'Set fixed daily study times',
            'Allocate time based on course difficulty',
            'Take regular breaks during study sessions'
          ],
          timeframe: '1-2 weeks',
          impact: 'medium',
          effort: 'low'
        }],
        shortTerm: [],
        longTerm: [],
        studyStrategies: [],
        timeManagement: [],
        summary: {
          totalRecommendations: 1,
          criticalActions: 0,
          estimatedImpact: 'medium'
        }
      };
    }
  }

  /**
   * Generate personalized study schedule using the RecommendationEngine
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} systemData - All system data
   * @param {Object} recommendations - Generated recommendations
   * @returns {Object} Personalized study schedule
   */
  async generatePersonalizedStudySchedule(currentCWA, systemData, recommendations) {
    try {
      return this.recommendationEngine.generatePersonalizedStudySchedule(
        currentCWA,
        systemData,
        recommendations
      );
    } catch (error) {
      console.error('Error generating study schedule:', error);
      // Return basic fallback schedule
      return {
        weeklySchedule: [],
        dailyRecommendations: [{
          day: 'General',
          focus: 'Consistent Study Habits',
          tips: [
            'Study at the same time each day',
            'Take breaks every 45-60 minutes',
            'Review material regularly'
          ],
          preparationTasks: [
            'Gather study materials',
            'Find a quiet study space',
            'Turn off distractions'
          ]
        }],
        preferredTimes: [{
          slot: 'morning',
          name: 'Morning',
          timeRange: '7:00 AM - 11:00 AM',
          reason: 'optimal_cognitive_performance'
        }],
        focusAreas: [{
          area: 'General Study Improvement',
          courses: currentCWA.courseBreakdown.map(c => c.courseName),
          priority: 'medium',
          timeAllocation: '100% of study time'
        }],
        summary: {
          totalWeeklyHours: currentCWA.totalCreditHours * 2,
          coursePriorities: currentCWA.courseBreakdown.map(c => ({
            course: c.courseName,
            hours: c.creditHours * 2,
            priority: c.performanceLevel
          })),
          timeDistribution: {}
        }
      };
    }
  }
}

export default AdvancedCWAAnalyzer;
