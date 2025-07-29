import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GraduationCap,
  Target,
  AlertTriangle,
  Brain,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  Zap,
  FileText,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  BarChart,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';

import { useData } from '../../contexts/DataContext';
import PerformanceAnalyzer from '../../utils/PerformanceAnalyzer';

// Optimized Performance Analysis Component
const OptimizedPerformanceAnalysis = ({ 
  scheduleData = [], 
  theme = {},
  userCourses: propUserCourses = [],
  quizResults: propQuizResults = [],
  performanceAnalyzer: propPerformanceAnalyzer = null
}) => {
  const { data, loading: dataLoading, error: dataError } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceAnalyzer, setPerformanceAnalyzer] = useState(null);

  // Use props if available, otherwise fall back to data context
  const userCourses = propUserCourses.length > 0 ? propUserCourses : (data.courses || []);
  const quizResults = propQuizResults.length > 0 ? propQuizResults : (data.quizzes || []);
  const finalPerformanceAnalyzer = propPerformanceAnalyzer || performanceAnalyzer;

  // Initialize performance analyzer when data is available (if not provided via props)
  useEffect(() => {
    if (!propPerformanceAnalyzer && data.courses && data.courses.length > 0) {
      const analyzer = new PerformanceAnalyzer(
        data.courses,
        data.settings.studentProfile,
        data.performance.behaviorData
      );
      setPerformanceAnalyzer(analyzer);
    }
  }, [data.courses, data.settings.studentProfile, data.performance.behaviorData, propPerformanceAnalyzer]);

  // Generate performance data when all dependencies are available
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate async operation
      setTimeout(() => {
        if (finalPerformanceAnalyzer && userCourses.length > 0) {
          const analysisData = finalPerformanceAnalyzer.generateQuickAnalysis();
          setPerformanceData(analysisData);
        }
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(`Failed to generate performance analysis: ${err.message}`);
      setLoading(false);
    }
  }, [finalPerformanceAnalyzer, userCourses]);

  // Memoized quiz metrics calculation
  const quizMetrics = useMemo(() => {
    if (!quizResults || quizResults.length === 0) {
      return {
        averageScore: 0,
        totalQuizzes: 0,
        recentPerformance: 0,
        difficultyHandling: 0,
        preparationLevel: 0,
        consistencyScore: 0,
        timeEfficiency: 0,
      };
    }

    const totalScore = quizResults.reduce((sum, quiz) => sum + quiz.percentage, 0);
    const averageScore = totalScore / quizResults.length;
    
    // Recent performance (last 5 quizzes)
    const recentQuizzes = quizResults.slice(-5);
    const recentPerformance = recentQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / recentQuizzes.length;
    
    // Difficulty handling
    const hardQuizzes = quizResults.filter(quiz => quiz.difficulty === 'Hard');
    const difficultyHandling = hardQuizzes.length > 0 
      ? hardQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / hardQuizzes.length
      : averageScore;
    
    // Preparation level
    const firstAttemptSuccess = quizResults.filter(quiz => quiz.attemptsUsed === 1).length;
    const preparationLevel = (firstAttemptSuccess / quizResults.length) * 100;
    
    // Consistency
    const variance = quizResults.reduce((sum, quiz) => sum + Math.pow(quiz.percentage - averageScore, 2), 0) / quizResults.length;
    const standardDeviation = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 100 - standardDeviation * 2);
    
    // Time efficiency
    const avgTimeEfficiency = quizResults.reduce((sum, quiz) => sum + quiz.percentage / quiz.timeSpent, 0) / quizResults.length;

    return {
      averageScore: Math.round(averageScore),
      totalQuizzes: quizResults.length,
      recentPerformance: Math.round(recentPerformance),
      difficultyHandling: Math.round(difficultyHandling),
      preparationLevel: Math.round(preparationLevel),
      consistencyScore: Math.round(consistencyScore),
      timeEfficiency: Math.round(avgTimeEfficiency * 10),
    };
  }, [quizResults]);

  // Memoized behavior data calculation
  const behaviorData = useMemo(() => {
    const totalSessions = scheduleData.length;
    const totalStudyTime = scheduleData.reduce((sum, session) => sum + session.duration, 0);
    const avgSessionLength = totalSessions > 0 ? totalStudyTime / totalSessions : 0;
    
    return {
      studyHours: Math.round(totalStudyTime / 60), // Convert to hours
      scheduleFollowing: Math.min(100, totalSessions * 5), // Rough estimate
      taskCompletion: Math.round((quizMetrics.averageScore || 0) * 0.8), // Based on quiz performance
      procrastination: Math.max(0, 100 - quizMetrics.preparationLevel), // Inverse of preparation
      focusLevel: Math.min(100, avgSessionLength * 2), // Based on session length
      helpSeeking: Math.random() * 50 + 25, // Placeholder
    };
  }, [scheduleData, quizMetrics]);

  // Memoized performance calculation
  const performancePrediction = useMemo(() => {
    const behavioralTotal = (
      Math.min(behaviorData.studyHours / 30, 1) * 15 +
      (behaviorData.scheduleFollowing / 100) * 15 +
      (behaviorData.taskCompletion / 100) * 12 +
      ((100 - behaviorData.procrastination) / 100) * 10 +
      (behaviorData.focusLevel / 100) * 8
    );

    const quizTotal = (
      (quizMetrics.averageScore / 100) * 15 +
      (quizMetrics.preparationLevel / 100) * 10 +
      (quizMetrics.consistencyScore / 100) * 8 +
      (quizMetrics.difficultyHandling / 100) * 7
    );

    const totalScore = behavioralTotal + quizTotal;

    return {
      performancePercentage: Math.round(totalScore),
      gpa: Math.round((totalScore / 100) * 4 * 100) / 100,
      grade: totalScore >= 85 ? 'A' : totalScore >= 75 ? 'B' : totalScore >= 65 ? 'C' : 'D',
      confidence: Math.min(85 + quizMetrics.totalQuizzes * 2, 95),
      behavioralScore: Math.round(behavioralTotal),
      quizScore: Math.round(quizTotal),
      breakdown: {
        behavioral: Math.round((behavioralTotal / 60) * 100),
        quizPerformance: Math.round((quizTotal / 40) * 100),
      },
    };
  }, [behaviorData, quizMetrics]);

  // Course-specific analysis
  const courseAnalysis = useMemo(() => {
    return userCourses.map(course => {
      const courseQuizzes = quizResults.filter(quiz => quiz.courseId === course.id);
      const courseAverage = courseQuizzes.length > 0 
        ? courseQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / courseQuizzes.length
        : 0;
      
      const courseSessions = scheduleData.filter(session => session.courseId === course.id);
      const studyTime = courseSessions.reduce((sum, session) => sum + session.duration, 0);
      
      return {
        ...course,
        performance: Math.round(courseAverage),
        studyTime: Math.round(studyTime / 60), // Convert to hours
        quizCount: courseQuizzes.length,
        sessionCount: courseSessions.length,
        trend: courseQuizzes.length > 1 ? (courseQuizzes[courseQuizzes.length - 1].percentage > courseQuizzes[0].percentage ? 'up' : 'down') : 'stable'
      };
    });
  }, [userCourses, quizResults, scheduleData]);

  // Performance insights
  const insights = useMemo(() => {
    const insights = [];
    
    if (performancePrediction.performancePercentage < 70) {
      insights.push({
        type: 'warning',
        title: 'Performance Below Target',
        message: 'Your predicted performance is below the recommended threshold. Consider increasing study time and improving consistency.',
        priority: 'high'
      });
    }
    
    if (quizMetrics.consistencyScore < 60) {
      insights.push({
        type: 'info',
        title: 'Inconsistent Performance',
        message: 'Your quiz scores show high variability. Focus on consistent study habits and review techniques.',
        priority: 'medium'
      });
    }
    
    if (behaviorData.procrastination > 60) {
      insights.push({
        type: 'warning',
        title: 'High Procrastination',
        message: 'Procrastination levels are affecting your performance. Try breaking tasks into smaller chunks.',
        priority: 'high'
      });
    }
    
    if (performancePrediction.performancePercentage >= 85) {
      insights.push({
        type: 'success',
        title: 'Excellent Performance',
        message: 'You\'re performing exceptionally well! Maintain your current study habits.',
        priority: 'low'
      });
    }
    
    return insights;
  }, [performancePrediction, quizMetrics, behaviorData]);

  // Performance card component
  const PerformanceCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-8 h-8" style={{ color }} />}
      </div>
    </div>
  );

  // Course performance card
  const CourseCard = ({ course }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{course.name}</h4>
        <div className="flex items-center">
          {course.trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : course.trend === 'down' ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : (
            <Activity className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Performance:</span>
          <span className="font-medium">{course.performance}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Study Time:</span>
          <span className="font-medium">{course.studyTime}h</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quizzes:</span>
          <span className="font-medium">{course.quizCount}</span>
        </div>
      </div>
    </div>
  );

  // Insight card
  const InsightCard = ({ insight }) => {
    const bgColor = insight.type === 'success' ? 'bg-green-50' : 
                   insight.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50';
    const textColor = insight.type === 'success' ? 'text-green-800' : 
                     insight.type === 'warning' ? 'text-yellow-800' : 'text-blue-800';
    const iconColor = insight.type === 'success' ? 'text-green-600' : 
                     insight.type === 'warning' ? 'text-yellow-600' : 'text-blue-600';
    
    const Icon = insight.type === 'success' ? CheckCircle : 
                insight.type === 'warning' ? AlertTriangle : Brain;

    return (
      <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
        <div className="flex items-start">
          <Icon className={`w-5 h-5 ${iconColor} mt-0.5 mr-3`} />
          <div>
            <h4 className={`font-medium ${textColor}`}>{insight.title}</h4>
            <p className={`text-sm mt-1 ${textColor}`}>{insight.message}</p>
          </div>
        </div>
      </div>
    );
  };

  // Handle data context loading and errors
  if (dataLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (dataError || error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Error: {dataError || error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analysis</h1>
          <p className="text-gray-600">Comprehensive academic performance insights and predictions</p>
        </div>

        {/* Main Performance Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {performancePrediction.performancePercentage}%
            </div>
            <div className="text-sm text-gray-600 mb-4">Overall Performance Prediction</div>
            <div className="flex justify-center items-center space-x-6 text-sm">
              <div>
                <span className="text-gray-600">GPA:</span>
                <span className="font-medium ml-1">{performancePrediction.gpa}</span>
              </div>
              <div>
                <span className="text-gray-600">Grade:</span>
                <span className="font-medium ml-1">{performancePrediction.grade}</span>
              </div>
              <div>
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium ml-1">{performancePrediction.confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <PerformanceCard
            title="Quiz Average"
            value={`${quizMetrics.averageScore}%`}
            subtitle={`${quizMetrics.totalQuizzes} quizzes taken`}
            icon={FileText}
            color={theme.primary}
          />
          <PerformanceCard
            title="Study Consistency"
            value={`${quizMetrics.consistencyScore}%`}
            subtitle="Performance stability"
            icon={Target}
            color={theme.secondary}
          />
          <PerformanceCard
            title="Study Hours"
            value={`${behaviorData.studyHours}h`}
            subtitle="This week"
            icon={Clock}
            color={theme.accent}
          />
          <PerformanceCard
            title="Task Completion"
            value={`${behaviorData.taskCompletion}%`}
            subtitle="Overall completion rate"
            icon={CheckCircle}
            color="#10B981"
          />
        </div>

        {/* Course Performance */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseAnalysis.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Insights</h2>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Behavioral Factors ({performancePrediction.breakdown.behavioral}%)</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Study Hours</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(behaviorData.studyHours / 30 * 100, 100)}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{behaviorData.studyHours}h</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Schedule Following</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${behaviorData.scheduleFollowing}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{behaviorData.scheduleFollowing}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Focus Level</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${behaviorData.focusLevel}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{behaviorData.focusLevel}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Quiz Performance ({performancePrediction.breakdown.quizPerformance}%)</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${quizMetrics.averageScore}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{quizMetrics.averageScore}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Preparation Level</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${quizMetrics.preparationLevel}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{quizMetrics.preparationLevel}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Consistency</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${quizMetrics.consistencyScore}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{quizMetrics.consistencyScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPerformanceAnalysis;
