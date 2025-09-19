// CWA (Cumulative Weighted Average) Analysis Model
// Advanced Academic Performance Analytics System

import { analyzeCWA, generateBehaviorInsights } from '../services/gemini';

class CWAAnalysis {
  constructor(courses = [], studentProfile = null, behaviorData = null) {
    this.courses = courses;
    this.studentProfile = studentProfile;
    this.behaviorData = behaviorData;
    this.weights = {
      currentPerformance: 0.6,
      studyBehavior: 0.2,
      courseLoad: 0.1,
      timeManagement: 0.1
    };
    
    // Academic standing thresholds
    this.academicStandingThresholds = {
      firstClass: 80,
      upperSecond: 70,
      lowerSecond: 60,
      third: 50,
      fail: 0
    };
    
    // Performance trend window (in days)
    this.trendWindowDays = 30;
  }

  // Calculate current CWA based on course performance with grade distribution
  calculateCurrentCWA() {
    if (!this.courses || this.courses.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalCreditHours = 0;
    let gradeDistribution = {
      A: 0, // >= 90
      B: 0, // >= 80
      C: 0, // >= 70
      D: 0, // >= 60
      F: 0  // < 60
    };

    this.courses.forEach(course => {
      const courseScore = this.calculateCourseScore(course);
      totalWeightedScore += courseScore * course.creditHours;
      totalCreditHours += course.creditHours;

      // Update grade distribution
      if (courseScore >= 90) gradeDistribution.A++;
      else if (courseScore >= 80) gradeDistribution.B++;
      else if (courseScore >= 70) gradeDistribution.C++;
      else if (courseScore >= 60) gradeDistribution.D++;
      else gradeDistribution.F++;
    });

    const currentCWA = totalCreditHours > 0 ? totalWeightedScore / totalCreditHours : 0;
    
    return {
      cwa: currentCWA,
      gradeDistribution,
      totalCreditHours,
      academicStanding: this.calculateAcademicStanding(currentCWA)
    };
  }

  // Calculate individual course score with detailed metrics
  calculateCourseScore(course) {
    if (!course.assignments || course.assignments.length === 0) {
      // If no assignments, consider progress and study time
      const progress = course.progress || 0;
      const studyTimeMinutes = (course.timeSpent || 0) / (1000 * 60); // Convert from milliseconds
      
      // Base score on progress and engagement
      let baseScore = progress;
      
      // Bonus for consistent study time (up to 10% bonus)
      if (studyTimeMinutes > 60) { // More than 1 hour
        const timeBonus = Math.min(10, studyTimeMinutes / 60); // 1 point per hour, max 10
        baseScore = Math.min(100, baseScore + timeBonus);
      }
      
      return {
        score: baseScore,
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          averageScore: baseScore,
          highestScore: baseScore,
          lowestScore: baseScore,
          studyTimeMinutes,
          lastStudied: course.lastStudied
        }
      };
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let assignmentStats = {
      total: course.assignments.length,
      completed: 0,
      pending: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 100,
      studyTimeMinutes: (course.timeSpent || 0) / (1000 * 60),
      lastStudied: course.lastStudied
    };

    course.assignments.forEach(assignment => {
      if (assignment.score !== undefined && assignment.maxScore > 0) {
        const percentScore = (assignment.score / assignment.maxScore) * 100;
        totalWeightedScore += percentScore * (assignment.weight || 1);
        totalWeight += (assignment.weight || 1);

        // Update assignment statistics
        assignmentStats.completed++;
        assignmentStats.averageScore += percentScore;
        assignmentStats.highestScore = Math.max(assignmentStats.highestScore, percentScore);
        assignmentStats.lowestScore = Math.min(assignmentStats.lowestScore, percentScore);
      }
    });

    if (assignmentStats.completed > 0) {
      assignmentStats.averageScore /= assignmentStats.completed;
    }
    assignmentStats.pending = assignmentStats.total - assignmentStats.completed;

    const courseScore = totalWeight > 0 ? totalWeightedScore / totalWeight : (course.progress || 0);
    
    return {
      score: courseScore,
      stats: assignmentStats
    };
  }

  // Calculate projected CWA with confidence interval
  calculateProjectedCWA() {
    const currentCWA = this.calculateCurrentCWA().cwa;
    const behaviorImpact = this.calculateBehaviorImpact();
    const courseLoadImpact = this.calculateCourseLoadImpact();
    const timeManagementImpact = this.calculateTimeManagementImpact();

    // Calculate base projection
    const projectedCWA = (
      currentCWA * this.weights.currentPerformance +
      behaviorImpact * this.weights.studyBehavior +
      courseLoadImpact * this.weights.courseLoad +
      timeManagementImpact * this.weights.timeManagement
    );

    // Calculate confidence interval (±5% based on data reliability)
    const confidenceInterval = this.calculateConfidenceInterval(projectedCWA);

    return {
      projected: Math.min(100, Math.max(0, projectedCWA)),
      confidenceInterval,
      reliability: this.calculateProjectionReliability()
    };
  }

  // Calculate confidence interval for projections
  calculateConfidenceInterval(projectedCWA) {
    const dataReliability = this.calculateProjectionReliability();
    const intervalWidth = (1 - dataReliability) * 10; // Max ±5 points
    
    return {
      lower: Math.max(0, projectedCWA - intervalWidth),
      upper: Math.min(100, projectedCWA + intervalWidth)
    };
  }

  // Calculate reliability of projections based on data quality
  calculateProjectionReliability() {
    let reliabilityScore = 0.5; // Base reliability

    // Adjust based on data availability and quality
    if (this.courses.length > 0) reliabilityScore += 0.1;
    if (this.studentProfile) reliabilityScore += 0.2;
    if (this.behaviorData) reliabilityScore += 0.2;

    // Adjust based on data recency
    const hasRecentData = this.courses.some(course => 
      course.assignments && course.assignments.some(a => 
        new Date(a.timestamp) > new Date(Date.now() - this.trendWindowDays * 24 * 60 * 60 * 1000)
      )
    );
    if (hasRecentData) reliabilityScore += 0.1;

    return Math.min(1, reliabilityScore);
  }

  // Calculate academic standing based on CWA
  calculateAcademicStanding(cwa) {
    if (cwa >= this.academicStandingThresholds.firstClass) {
      return {
        standing: 'First Class Honours',
        description: 'Outstanding academic achievement',
        color: '#4CAF50'
      };
    } else if (cwa >= this.academicStandingThresholds.upperSecond) {
      return {
        standing: 'Upper Second Class',
        description: 'Very good academic standing',
        color: '#8BC34A'
      };
    } else if (cwa >= this.academicStandingThresholds.lowerSecond) {
      return {
        standing: 'Lower Second Class',
        description: 'Good academic standing',
        color: '#FFC107'
      };
    } else if (cwa >= this.academicStandingThresholds.third) {
      return {
        standing: 'Third Class',
        description: 'Satisfactory academic standing',
        color: '#FF9800'
      };
    } else {
      return {
        standing: 'Academic Probation',
        description: 'Below minimum academic requirements',
        color: '#F44336'
      };
    }
  }

  // Calculate performance trends
  calculatePerformanceTrends() {
    const trends = {
      overall: 'stable',
      bySubject: {},
      recentProgress: 0,
      improvementAreas: []
    };

    // Calculate recent progress
    const recentAssignments = this.courses.flatMap(course =>
      (course.assignments || [])
        .filter(a => new Date(a.timestamp) > new Date(Date.now() - this.trendWindowDays * 24 * 60 * 60 * 1000))
        .map(a => ({
          ...a,
          courseName: course.name,
          score: (a.score / a.maxScore) * 100
        }))
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (recentAssignments.length >= 2) {
      const oldAvg = recentAssignments.slice(0, Math.floor(recentAssignments.length / 2))
        .reduce((sum, a) => sum + a.score, 0) / Math.floor(recentAssignments.length / 2);
      const newAvg = recentAssignments.slice(Math.floor(recentAssignments.length / 2))
        .reduce((sum, a) => sum + a.score, 0) / (recentAssignments.length - Math.floor(recentAssignments.length / 2));
      
      trends.recentProgress = newAvg - oldAvg;
      trends.overall = trends.recentProgress > 2 ? 'improving' : 
                      trends.recentProgress < -2 ? 'declining' : 'stable';
    }

    // Calculate subject-specific trends
    this.courses.forEach(course => {
      const courseScore = this.calculateCourseScore(course);
      trends.bySubject[course.name] = {
        trend: this.calculateSubjectTrend(course),
        score: courseScore.score,
        status: this.getCourseStatus(courseScore.score)
      };
    });

    return trends;
  }

  // Calculate trend for specific subject
  calculateSubjectTrend(course) {
    if (!course.assignments || course.assignments.length < 2) return 'insufficient data';

    const sortedAssignments = [...course.assignments]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const scores = sortedAssignments.map(a => (a.score / a.maxScore) * 100);
    const trend = scores[scores.length - 1] - scores[0];

    return trend > 5 ? 'strong improvement' :
           trend > 2 ? 'slight improvement' :
           trend < -5 ? 'significant decline' :
           trend < -2 ? 'slight decline' : 'stable';
  }

  // Generate comprehensive analysis report with enhanced metrics
  async generateAnalysisReport() {
    try {
      // Calculate basic metrics
      const currentCWA = this.calculateCurrentCWA();
      const projectedCWA = this.calculateProjectedCWA();
      
      // Generate AI-powered analysis using Gemini
      const aiAnalysis = await analyzeCWA({
        currentCWA,
        projectedCWA,
        courses: this.courses,
        studentProfile: this.studentProfile,
        behaviorData: this.behaviorData
      });
      
      return {
        currentCWA,
        projectedCWA,
        performanceTrend: this.determinePerformanceTrend(),
        coursePerformance: this.analyzeCoursePerformance(),
        recommendations: this.generateRecommendations(),
        aiInsights: aiAnalysis
      };
    } catch (error) {
      console.error('Error in analysis generation:', error);
      // Fallback to basic analysis if AI fails
      return this.generateBasicAnalysis();
    }
  }

  generateAnalysisPrompt() {
    return `Analyze the following academic data:
    Student Profile: ${JSON.stringify(this.studentProfile)}
    Courses: ${JSON.stringify(this.courses)}
    
    Please provide:
    1. Performance analysis
    2. Study recommendations
    3. Areas for improvement
    4. Potential challenges
    5. Success strategies`;
  }

  // Calculate improvement potential for a specific course
  calculateImprovementPotential(course) {
    const remainingAssignments = course.stats.pending;
    const averageScore = course.stats.averageScore;

    // Calculate maximum possible improvement
    const maxImprovement = remainingAssignments > 0 
      ? ((100 * remainingAssignments) - (averageScore * remainingAssignments)) / course.stats.total
      : 0;

    return {
      potential: Math.max(0, maxImprovement),
      requiredScore: Math.min(100, averageScore + maxImprovement),
      feasibility: this.calculateImprovementFeasibility(maxImprovement, course)
    };
  }

  // Calculate feasibility of improvement
  calculateImprovementFeasibility(improvement, course) {
    if (improvement <= 0) return 'not applicable';
    if (improvement <= 5) return 'highly feasible';
    if (improvement <= 10) return 'moderately feasible';
    if (improvement <= 20) return 'challenging';
    return 'very challenging';
  }

  // Calculate improvement potentials by subject
  calculateSubjectImprovementPotentials() {
    return this.courses.reduce((potentials, course) => {
      const courseScore = this.calculateCourseScore(course);
      potentials[course.name] = this.calculateImprovementPotential({
        ...course,
        score: courseScore.score,
        stats: courseScore.stats
      });
      return potentials;
    }, {});
  }

  // Enhanced course status determination
  getCourseStatus(score) {
    if (score >= 90) return {
      level: 'Excellent',
      description: 'Outstanding performance',
      color: '#4CAF50'
    };
    if (score >= 80) return {
      level: 'Good',
      description: 'Strong performance',
      color: '#8BC34A'
    };
    if (score >= 70) return {
      level: 'Satisfactory',
      description: 'Meeting expectations',
      color: '#FFC107'
    };
    if (score >= 60) return {
      level: 'At Risk',
      description: 'Needs improvement',
      color: '#FF9800'
    };
    return {
      level: 'Critical',
      description: 'Immediate attention required',
      color: '#F44336'
    };
  }

  // Enhanced risk level calculation
  calculateRiskLevel(currentCWA, projectedCWA) {
    const averageScore = (currentCWA + projectedCWA) / 2;
    const trend = projectedCWA - currentCWA;

    let risk = {
      level: 'Low',
      score: 0,
      factors: [],
      recommendations: []
    };

    // Base risk on average score
    if (averageScore < 60) {
      risk.level = 'High';
      risk.score = 3;
      risk.factors.push('Current academic performance below requirements');
    } else if (averageScore < 70) {
      risk.level = 'Moderate';
      risk.score = 2;
      risk.factors.push('Academic performance needs improvement');
    }

    // Adjust for trend
    if (trend < -5) {
      risk.score++;
      risk.factors.push('Declining performance trend');
    }

    // Consider behavioral factors
    if (this.behaviorData) {
      const { studyConsistency, procrastinationLevel } = this.behaviorData;
      if (studyConsistency < 50) {
        risk.score++;
        risk.factors.push('Low study consistency');
      }
      if (procrastinationLevel > 7) {
        risk.score++;
        risk.factors.push('High procrastination level');
      }
    }

    // Final risk level determination
    risk.level = risk.score >= 3 ? 'High' : 
                 risk.score >= 2 ? 'Moderate' : 'Low';

    return risk;
  }

  // Generate enhanced recommendations
  generateRecommendations() {
    const recommendations = [];
    const priorityActions = [];

    // Course-specific recommendations
    this.courses.forEach(course => {
      if (course.score < 70) {
        const rec = {
          priority: course.score < 60 ? 'High' : 'Medium',
          type: 'Course Improvement',
          course: course.name,
          action: `Focus on improving performance in ${course.name}`,
          details: [
            'Increase study time',
            'Seek additional help from instructors',
            'Review past assignments and identify weak areas'
          ],
          impact: 'Direct impact on CWA'
        };
        
        if (course.score < 60) {
          priorityActions.push(rec);
        } else {
          recommendations.push(rec);
        }
      }
    });

    // Study behavior recommendations
    if (this.behaviorData) {
      const { studyConsistency, procrastinationLevel } = this.behaviorData;
      
      if (studyConsistency < 70) {
        recommendations.push({
          priority: 'Medium',
          type: 'Study Habit',
          action: 'Develop a more consistent study schedule',
          details: [
            'Set fixed study times',
            'Use a study planner',
            'Track study sessions'
          ],
          impact: 'Improves learning retention and performance'
        });
      }
      
      if (procrastinationLevel > 7) {
        recommendations.push({
          priority: 'High',
          type: 'Time Management',
          action: 'Reduce procrastination',
          details: [
            'Break down assignments into smaller tasks',
            'Set earlier personal deadlines',
            'Use time-blocking techniques'
          ],
          impact: 'Reduces stress and improves work quality'
        });
      }
    }

    // Time management recommendations
    if (this.studentProfile) {
      const { studyHoursPerWeek, stressLevel } = this.studentProfile;
      const totalCreditHours = this.courses.reduce((sum, course) => sum + course.creditHours, 0);
      const recommendedHours = totalCreditHours * 2;

      if (studyHoursPerWeek < recommendedHours) {
        recommendations.push({
          priority: 'Medium',
          type: 'Study Hours',
          action: `Increase weekly study hours to ${recommendedHours}`,
          details: [
            'Create a weekly study schedule',
            'Identify and eliminate time-wasting activities',
            'Use breaks effectively'
          ],
          impact: 'Better academic performance and understanding'
        });
      }

      if (stressLevel > 7) {
        recommendations.push({
          priority: 'High',
          type: 'Wellness',
          action: 'Manage academic stress',
          details: [
            'Practice stress management techniques',
            'Seek academic support services',
            'Maintain work-life balance'
          ],
          impact: 'Improved focus and academic performance'
        });
      }
    }

    return {
      priorityActions,
      recommendations
    };
  }

  // Generate enhanced behavioral insights
  generateBehavioralInsights() {
    const insights = [];
    const patterns = [];
    const improvements = [];

    if (this.behaviorData) {
      const { studyConsistency, assignmentCompletion, procrastinationLevel, studyPatterns } = this.behaviorData;

      // Study consistency analysis
      insights.push({
        category: 'Study Consistency',
        score: studyConsistency,
        status: studyConsistency > 80 ? 'Excellent' :
                studyConsistency > 60 ? 'Good' : 'Needs Improvement',
        details: `Your study consistency score is ${studyConsistency}/100`,
        trend: this.calculateConsistencyTrend()
      });

      // Assignment completion analysis
      insights.push({
        category: 'Assignment Completion',
        score: assignmentCompletion,
        status: assignmentCompletion > 90 ? 'Excellent' :
                assignmentCompletion > 70 ? 'Good' : 'Needs Improvement',
        details: `Assignment completion rate: ${assignmentCompletion}%`,
        trend: this.calculateCompletionTrend()
      });

      // Study patterns analysis
      if (studyPatterns && studyPatterns.length > 0) {
        patterns.push({
          type: 'Time Preference',
          pattern: studyPatterns.join(' and '),
          effectiveness: this.calculatePatternEffectiveness(studyPatterns)
        });
      }

      // Areas for improvement
      if (studyConsistency < 70) {
        improvements.push({
          area: 'Study Consistency',
          currentLevel: studyConsistency,
          targetLevel: 80,
          suggestedActions: [
            'Establish fixed study times',
            'Use study tracking tools',
            'Set daily study goals'
          ]
        });
      }

      if (procrastinationLevel > 7) {
        improvements.push({
          area: 'Procrastination Management',
          currentLevel: 10 - procrastinationLevel,
          targetLevel: 8,
          suggestedActions: [
            'Use time-blocking techniques',
            'Break tasks into smaller chunks',
            'Set earlier deadlines'
          ]
        });
      }
    }

    return {
      insights,
      patterns,
      improvements,
      overallTrend: this.calculateOverallBehaviorTrend()
    };
  }

  // Helper methods for behavioral analysis
  calculateConsistencyTrend() {
    // Implementation would analyze historical consistency data
    return 'improving'; // Placeholder
  }

  calculateCompletionTrend() {
    // Implementation would analyze historical completion rates
    return 'stable'; // Placeholder
  }

  calculatePatternEffectiveness(patterns) {
    // Implementation would analyze performance correlation with patterns
    return 'high'; // Placeholder
  }

  calculateOverallBehaviorTrend() {
    // Implementation would combine various behavioral metrics
    return 'positive'; // Placeholder
  }

  determinePerformanceTrend() {
    // Implementation
  }

  analyzeCoursePerformance() {
    // Implementation
  }

  generateBasicAnalysis() {
    // Fallback analysis without AI
    return {
      currentCWA: this.calculateCurrentCWA(),
      projectedCWA: this.calculateProjectedCWA(),
      performanceTrend: this.determinePerformanceTrend(),
      coursePerformance: this.analyzeCoursePerformance(),
      recommendations: this.generateRecommendations()
    };
  }
}

export const analyzePerformance = async (studentData, behaviorData) => {
  try {
    // Get academic performance analysis
    const analysisResult = await analyzeCWA(studentData);
    
    // Get behavior insights
    const behaviorInsights = await generateBehaviorInsights(behaviorData);
    
    // Combine the results
    return {
      academicAnalysis: analysisResult,
      behaviorAnalysis: behaviorInsights,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in performance analysis:', error);
    throw error;
  }
};

export const calculateProjectedCWA = (currentCWA, behaviorMetrics) => {
  const {
    studyConsistency,
    assignmentCompletion,
    procrastinationLevel,
    engagementScore
  } = behaviorMetrics;

  // Convert metrics to improvement factors
  const consistencyFactor = studyConsistency / 100;
  const assignmentFactor = assignmentCompletion / 100;
  const procrastinationFactor = (10 - procrastinationLevel) / 10;
  const engagementFactor = engagementScore / 100;

  // Calculate potential improvement
  const maxImprovement = 15; // Maximum possible CWA improvement
  const improvementLikelihood = (
    consistencyFactor * 0.3 +
    assignmentFactor * 0.3 +
    procrastinationFactor * 0.2 +
    engagementFactor * 0.2
  );

  const projectedImprovement = maxImprovement * improvementLikelihood;
  
  // Calculate range
  const minProjected = Math.max(currentCWA, currentCWA + (projectedImprovement * 0.5));
  const maxProjected = Math.min(100, currentCWA + projectedImprovement);

  return {
    min: minProjected,
    max: maxProjected,
    trend: maxProjected > currentCWA ? 'up' : 'stable'
  };
};

export default CWAAnalysis; 