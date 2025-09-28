import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import quizResultService from "../../services/QuizResultService";
import behavioralAnalyticsService from "../../services/behavioralAnalyticsService";

// Generate sample quiz data based on registered courses
const generateSampleQuizResults = (userCourses) => {
  if (!userCourses || userCourses.length === 0) return [];
  
  const quizResults = [];
  userCourses.forEach((course, courseIndex) => {
    // Generate 2-3 quiz results per course
    const quizCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < quizCount; i++) {
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const topics = ['Assignment', 'Quiz', 'Review', 'Practice'];
      
      quizResults.push({
        id: `q${courseIndex}-${i}`,
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code || course.name.substring(0, 6).toUpperCase(),
        quizTitle: `${topics[Math.floor(Math.random() * topics.length)]} ${i + 1}`,
        score: Math.floor(Math.random() * 30) + 70, // 70-100 range
        maxScore: 100,
        percentage: Math.floor(Math.random() * 30) + 70,
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        topic: topics[Math.floor(Math.random() * topics.length)],
        dateTaken: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timeSpent: Math.floor(Math.random() * 20) + 15, // 15-35 minutes
        attemptsUsed: Math.floor(Math.random() * 2) + 1, // 1-2 attempts
        maxAttempts: Math.floor(Math.random() * 2) + 2, // 2-3 max attempts
      });
    }
  });
  
  return quizResults;
};
// Enhanced behavioral metrics including quiz performance
const behaviorData = {
  studyHours: 25, // hours per week
  scheduleFollowing: 78, // percentage
  taskCompletion: 85, // percentage
  procrastination: 35, // percentage (lower is better)
  focusLevel: 72, // percentage
  helpSeeking: 45, // percentage
}
// Calculate quiz performance metrics
const calculateQuizMetrics = (quizResults) => {
  if (quizResults.length === 0) {
    return {
      averageScore: 0,
      totalQuizzes: 0,
      recentPerformance: 0,
      difficultyHandling: 0,
      preparationLevel: 0,
      consistencyScore: 0,
      timeEfficiency: 0,
    }
  }
  const totalScore = quizResults.reduce((sum, quiz) => sum + quiz.percentage, 0)
  const averageScore = totalScore / quizResults.length
  // Recent performance (last 5 quizzes)
  const recentQuizzes = quizResults.slice(-5)
  const recentPerformance = recentQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / recentQuizzes.length
  // Difficulty handling (performance on hard quizzes)
  const hardQuizzes = quizResults.filter((quiz) => quiz.difficulty === "Hard")
  const difficultyHandling =
    hardQuizzes.length > 0
      ? hardQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / hardQuizzes.length
      : averageScore
  // Preparation level (first attempt success rate)
  const firstAttemptSuccess = quizResults.filter((quiz) => quiz.attemptsUsed === 1).length
  const preparationLevel = (firstAttemptSuccess / quizResults.length) * 100
  // Consistency (standard deviation of scores)
  const variance =
    quizResults.reduce((sum, quiz) => sum + Math.pow(quiz.percentage - averageScore, 2), 0) / quizResults.length
  const standardDeviation = Math.sqrt(variance)
  const consistencyScore = Math.max(0, 100 - standardDeviation * 2) // Lower deviation = higher consistency
  // Time efficiency (score per minute)
  const avgTimeEfficiency =
    quizResults.reduce((sum, quiz) => sum + quiz.percentage / quiz.timeSpent, 0) / quizResults.length
  return {
    averageScore: Math.round(averageScore),
    totalQuizzes: quizResults.length,
    recentPerformance: Math.round(recentPerformance),
    difficultyHandling: Math.round(difficultyHandling),
    preparationLevel: Math.round(preparationLevel),
    consistencyScore: Math.round(consistencyScore),
    timeEfficiency: Math.round(avgTimeEfficiency * 10), // Scale for display
  }
}
// Enhanced Performance calculation including quiz performance
const calculateEnhancedPerformance = (
  behaviorData,
  quizMetrics,
) => {
  // Behavioral scores (60% weight)
  const studyScore = Math.min(behaviorData.studyHours / 30, 1) * 15 // Max 15 points
  const scheduleScore = (behaviorData.scheduleFollowing / 100) * 15 // Max 15 points
  const completionScore = (behaviorData.taskCompletion / 100) * 12 // Max 12 points
  const procrastinationScore = ((100 - behaviorData.procrastination) / 100) * 10 // Max 10 points
  const focusScore = (behaviorData.focusLevel / 100) * 8 // Max 8 points
  const behavioralTotal = studyScore + scheduleScore + completionScore + procrastinationScore + focusScore // Max 60
  // Quiz performance scores (40% weight)
  const averageQuizScore = (quizMetrics.averageScore / 100) * 15 // Max 15 points
  const preparationScore = (quizMetrics.preparationLevel / 100) * 10 // Max 10 points
  const consistencyScore = (quizMetrics.consistencyScore / 100) * 8 // Max 8 points
  const difficultyScore = (quizMetrics.difficultyHandling / 100) * 7 // Max 7 points
  const quizTotal = averageQuizScore + preparationScore + consistencyScore + difficultyScore // Max 40
  const totalScore = behavioralTotal + quizTotal // Max 100
  return {
    performancePercentage: Math.round(totalScore),
    gpa: Math.round((totalScore / 100) * 4 * 100) / 100,
    grade: totalScore >= 85 ? "A" : totalScore >= 75 ? "B" : totalScore >= 65 ? "C" : "D",
    confidence: Math.min(85 + quizMetrics.totalQuizzes * 2, 95), // More quizzes = higher confidence
    behavioralScore: Math.round(behavioralTotal),
    quizScore: Math.round(quizTotal),
    breakdown: {
      behavioral: Math.round((behavioralTotal / 60) * 100),
      quizPerformance: Math.round((quizTotal / 40) * 100),
    },
  }
}
// Enhanced risk identification including quiz patterns
const identifyEnhancedRisks = (
  behaviorData,
  quizMetrics,
) => {
  const risks = []
  // Behavioral risks
  if (behaviorData.procrastination > 50) {
    risks.push({
      issue: "High Procrastination",
      impact: "May miss deadlines and reduce performance",
      solution: "Break tasks into smaller chunks, use timers",
      priority: "High",
      category: "Study Habits",
    })
  }
  if (behaviorData.scheduleFollowing < 60) {
    risks.push({
      issue: "Poor Schedule Adherence",
      impact: "Inconsistent study patterns",
      solution: "Start with shorter, realistic study blocks",
      priority: "Medium",
      category: "Time Management",
    })
  }
  // Quiz-based risks
  if (quizMetrics.averageScore < 70) {
    risks.push({
      issue: "Low Quiz Performance",
      impact: "Indicates gaps in understanding",
      solution: "Review weak topics, seek additional help",
      priority: "High",
      category: "Academic Performance",
    })
  }
  if (quizMetrics.preparationLevel < 60) {
    risks.push({
      issue: "Poor Preparation",
      impact: "Multiple attempts needed, inefficient learning",
      solution: "Increase study time before quizzes, use practice tests",
      priority: "Medium",
      category: "Preparation",
    })
  }
  if (quizMetrics.consistencyScore < 60) {
    risks.push({
      issue: "Inconsistent Performance",
      impact: "Unpredictable results, possible knowledge gaps",
      solution: "Focus on consistent study routine, identify weak areas",
      priority: "Medium",
      category: "Consistency",
    })
  }
  if (quizMetrics.difficultyHandling < 65) {
    risks.push({
      issue: "Struggles with Difficult Material",
      impact: "May fail on challenging exams",
      solution: "Practice harder problems, get tutoring for complex topics",
      priority: "High",
      category: "Challenge Handling",
    })
  }
  return risks
}
// Enhanced recommendations including quiz-based suggestions
const generateEnhancedRecommendations = (
  behaviorData,
  quizMetrics,
) => {
  const recommendations = []
  // Quiz-based recommendations
  if (quizMetrics.averageScore < 80) {
    recommendations.push({
      title: "Improve Quiz Performance",
      description: "Focus on understanding concepts before taking quizzes",
      actionSteps: [
        "Review course material thoroughly before each quiz",
        "Take practice quizzes to identify weak areas",
        "Create summary notes for each topic",
      ],
      impact: "+0.5 GPA points",
      difficulty: "Medium",
      timeframe: "2-3 weeks",
      category: "Academic Performance",
    })
  }
  if (quizMetrics.preparationLevel < 70) {
    recommendations.push({
      title: "Better Quiz Preparation",
      description: "Aim to pass quizzes on the first attempt",
      actionSteps: [
        "Study material 2-3 days before quiz deadline",
        "Use active recall techniques while studying",
        "Take notes and review them before attempting quiz",
      ],
      impact: "+0.3 GPA points",
      difficulty: "Easy",
      timeframe: "1-2 weeks",
      category: "Preparation Strategy",
    })
  }
  if (quizMetrics.consistencyScore < 70) {
    recommendations.push({
      title: "Develop Consistent Study Routine",
      description: "Maintain steady performance across all quizzes",
      actionSteps: [
        "Set fixed study times for each course",
        "Review previous quiz mistakes regularly",
        "Keep a study log to track preparation time",
      ],
      impact: "+0.4 GPA points",
      difficulty: "Medium",
      timeframe: "3-4 weeks",
      category: "Study Consistency",
    })
  }
  if (quizMetrics.difficultyHandling < 70) {
    recommendations.push({
      title: "Master Challenging Topics",
      description: "Improve performance on difficult material",
      actionSteps: [
        "Spend extra time on hard topics identified in quizzes",
        "Seek help from instructors or tutors for difficult concepts",
        "Form study groups to discuss challenging problems",
      ],
      impact: "+0.6 GPA points",
      difficulty: "Hard",
      timeframe: "4-6 weeks",
      category: "Challenge Mastery",
    })
  }
  // Behavioral recommendations
  if (behaviorData.procrastination > 40) {
    recommendations.push({
      title: "Reduce Procrastination",
      description: "Use the 2-minute rule and time-blocking",
      actionSteps: [
        "Start quiz preparation immediately when assigned",
        "Break study sessions into 25-minute focused blocks",
        "Set specific deadlines for quiz preparation",
      ],
      impact: "+0.4 GPA points",
      difficulty: "Medium",
      timeframe: "2-3 weeks",
      category: "Time Management",
    })
  }
  return recommendations.slice(0, 4) // Limit to 4 recommendations
}
export default function EnhancedPerformanceAnalysis({
  scheduleData,
  userCourses,
  quizResults,
  theme,
}) {
  const [currentBehaviorData, setCurrentBehaviorData] = useState(behaviorData)
  const [realBehaviorData, setRealBehaviorData] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedView, setSelectedView] = useState("overview")
  const [realQuizResults, setRealQuizResults] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataError, setDataError] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [risks, setRisks] = useState([])
  const [recommendations, setRecommendations] = useState([])
  
  // Load real behavioral and quiz data from backend
  useEffect(() => {
    const loadRealData = async () => {
      setIsLoadingData(true)
      setDataError(null)
      
      try {
        // Try to get real behavioral analytics first
        try {
          const predictionData = await behavioralAnalyticsService.getAcademicPrediction()
          
          if (predictionData && predictionData.prediction) {
            setPrediction(predictionData.prediction)
            setRecommendations(predictionData.recommendations || [])
            setRisks(predictionData.risks || [])
            
            // Extract behavioral data from the analytics
            const analyticsData = predictionData.behavioral_data || {}
            if (analyticsData.summary) {
              setRealBehaviorData({
                studyHours: analyticsData.summary.study_hours_per_week || 0,
                scheduleFollowing: analyticsData.summary.schedule_following_rate || 50,
                taskCompletion: analyticsData.summary.task_completion_rate || 50,
                procrastination: analyticsData.summary.procrastination_level || 50,
                focusLevel: analyticsData.summary.focus_level || 50,
                helpSeeking: analyticsData.summary.help_seeking_behavior || 50
              })
            }
            
            console.log('Loaded real behavioral analytics with prediction')
          }
        } catch (behaviorError) {
          console.log('Behavioral analytics not available, falling back to consolidated metrics')
          
          try {
            // Fallback to consolidated metrics
            const consolidatedData = await behavioralAnalyticsService.getConsolidatedMetrics()
            
            if (consolidatedData.cwa_metrics) {
              setRealBehaviorData(consolidatedData.cwa_metrics)
              console.log('Loaded consolidated behavioral metrics')
            }
          } catch (consolidatedError) {
            console.log('Consolidated metrics not available, trying real-time data')
            
            try {
              // Final fallback to real-time behavioral data
              const realtimeData = await behavioralAnalyticsService.getRealTimeBehavioralData()
              setRealBehaviorData(realtimeData)
              console.log('Loaded real-time behavioral data')
            } catch (realtimeError) {
              console.log('No real behavioral data available, using mock data')
            }
          }
        }
        
        // Load quiz data separately
        try {
          const userId = quizResultService.getCurrentUserId()
          const quizData = await quizResultService.getQuizResults(userId, { limit: 20 })
          
          if (quizData && quizData.quizResults) {
            setRealQuizResults(quizData.quizResults)
            console.log('Loaded quiz results:', quizData.quizResults.length)
          } else {
            console.log('No quiz results found, will use generated data')
            setRealQuizResults([])
          }
        } catch (quizError) {
          console.error('Error loading quiz data:', quizError)
          setRealQuizResults([])
        }
        
      } catch (error) {
        console.error('Error loading real data:', error)
        setDataError('Failed to load behavioral data')
      } finally {
        setIsLoadingData(false)
      }
    }
    
    loadRealData()
  }, [])
  
  // Use real behavioral data if available
  const effectiveBehaviorData = realBehaviorData || currentBehaviorData
  
  // Use real quiz data if available, otherwise generate from registered courses
  const effectiveQuizResults = realQuizResults.length > 0 ? realQuizResults : 
    (quizResults && quizResults.length > 0 ? quizResults : generateSampleQuizResults(userCourses))
    
  // Calculate quiz metrics
  const quizMetrics = useMemo(() => calculateQuizMetrics(effectiveQuizResults), [effectiveQuizResults])
  
  // Always calculate local prediction, risks, and recommendations using useMemo
  const localPrediction = useMemo(
    () => calculateEnhancedPerformance(effectiveBehaviorData, quizMetrics),
    [effectiveBehaviorData, quizMetrics],
  )
  
  const localRisks = useMemo(
    () => identifyEnhancedRisks(effectiveBehaviorData, quizMetrics),
    [effectiveBehaviorData, quizMetrics],
  )
  
  const localRecommendations = useMemo(
    () => generateEnhancedRecommendations(effectiveBehaviorData, quizMetrics),
    [effectiveBehaviorData, quizMetrics],
  )
  
  // Use backend data if available, otherwise use locally calculated data
  const effectivePrediction = prediction || localPrediction
  const effectiveRisks = risks.length > 0 ? risks : localRisks
  const effectiveRecommendations = recommendations.length > 0 ? recommendations : localRecommendations
  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBehaviorData((prev) => ({
        ...prev,
        focusLevel: Math.max(30, Math.min(90, prev.focusLevel + (Math.random() - 0.5) * 4)),
        scheduleFollowing: Math.max(40, Math.min(95, prev.scheduleFollowing + (Math.random() - 0.5) * 2)),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  const runAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => setIsAnalyzing(false), 2000)
  }
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Enhanced Performance Analysis</h1>
              <p className="opacity-75">Academic performance prediction based on study behavior + quiz results</p>
              {isLoadingData && (
                <div className="flex items-center gap-2 mt-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading behavioral data...</span>
                </div>
              )}
              {dataError && (
                <div className="flex items-center gap-2 mt-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{dataError}</span>
                </div>
              )}
              {realQuizResults.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Using {realQuizResults.length} real quiz results</span>
                </div>
              )}
            </div>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
              style={{
                backgroundColor: theme.secondary,
                color: "white",
              }}
            >
              {isAnalyzing ? (
                <>
                  <Brain className="w-4 h-4 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Update Analysis
                </>
              )}
            </button>
          </div>
          {/* View Selector */}
          <div className="flex items-center gap-2">
            {[
              { id: "overview", label: "Overview", icon: Target },
              { id: "quizzes", label: "Quiz Performance", icon: FileText },
              { id: "behavior", label: "Study Behavior", icon: BookOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedView(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedView === id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* Main Prediction Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced CWA Score */}
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${theme.secondary}20` }}
            >
              <GraduationCap className="w-10 h-10" style={{ color: theme.secondary }} />
            </div>
            <div className="text-5xl font-bold mb-2" style={{ color: theme.secondary }}>
              {effectivePrediction.performancePercentage}%
            </div>
            <div className="text-sm opacity-75 mb-4">Enhanced Performance Prediction</div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{effectivePrediction.gpa}</div>
              <div className="text-sm opacity-75">GPA (4.0 scale)</div>
              <div className="text-xl font-bold mt-2">Grade: {effectivePrediction.grade}</div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <Target className="w-4 h-4" />
              <span>{effectivePrediction.confidence}% Confidence</span>
            </div>
            {/* Score Breakdown */}
            <div className="mt-6 p-4 rounded-lg bg-gray-50">
              <div className="text-sm font-medium mb-3">Score Breakdown</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Study Behavior:</span>
                  <span className="font-semibold">{effectivePrediction.breakdown?.behavioral || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Quiz Performance:</span>
                  <span className="font-semibold">{effectivePrediction.breakdown?.quizPerformance || 0}%</span>
                </div>
              </div>
            </div>
          </div>
          {/* Dynamic Content Based on Selected View */}
          <div className="lg:col-span-2">
            {selectedView === "overview" && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5" style={{ color: theme.secondary }} />
                  Performance Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Quiz Average</span>
                      <span className="font-bold">{quizMetrics.averageScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${quizMetrics.averageScore}%`,
                          backgroundColor:
                            quizMetrics.averageScore > 80
                              ? "#10b981"
                              : quizMetrics.averageScore > 70
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Preparation Level</span>
                      <span className="font-bold">{quizMetrics.preparationLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${quizMetrics.preparationLevel}%`,
                          backgroundColor: quizMetrics.preparationLevel > 70 ? "#10b981" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Study Hours/Week</span>
                      <span className="font-bold">{effectiveBehaviorData.studyHours}h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${Math.min((effectiveBehaviorData.studyHours / 40) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Consistency Score</span>
                      <span className="font-bold">{quizMetrics.consistencyScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${quizMetrics.consistencyScore}%`,
                          backgroundColor: quizMetrics.consistencyScore > 70 ? "#10b981" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedView === "quizzes" && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: theme.secondary }} />
                  Quiz Performance Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold mb-1">{quizMetrics.totalQuizzes}</div>
                    <div className="text-sm opacity-75">Total Quizzes</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold mb-1">{quizMetrics.averageScore}%</div>
                    <div className="text-sm opacity-75">Average Score</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold mb-1">{quizMetrics.difficultyHandling}%</div>
                    <div className="text-sm opacity-75">Hard Quiz Performance</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold mb-1">{quizMetrics.preparationLevel}%</div>
                    <div className="text-sm opacity-75">First Attempt Success</div>
                  </div>
                </div>
                {/* Recent Quiz Results */}
                <div>
                  <h4 className="font-semibold mb-3">Recent Quiz Results</h4>
                  <div className="space-y-2">
                    {effectiveQuizResults.slice(-3).map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{quiz.quizTitle}</div>
                          <div className="text-sm opacity-75">
                            {quiz.courseCode} â€¢ {quiz.difficulty}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{quiz.percentage}%</div>
                          <div className="text-sm opacity-75">
                            {quiz.score}/{quiz.maxScore}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {selectedView === "behavior" && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" style={{ color: theme.secondary }} />
                  Study Behavior Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Schedule Following</span>
                      <span className="font-bold">{effectiveBehaviorData.scheduleFollowing}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${effectiveBehaviorData.scheduleFollowing}%`,
                          backgroundColor: effectiveBehaviorData.scheduleFollowing > 70 ? "#10b981" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Task Completion</span>
                      <span className="font-bold">{effectiveBehaviorData.taskCompletion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${effectiveBehaviorData.taskCompletion}%`,
                          backgroundColor: effectiveBehaviorData.taskCompletion > 80 ? "#10b981" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Focus Level</span>
                      <span className="font-bold">{effectiveBehaviorData.focusLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${effectiveBehaviorData.focusLevel}%`,
                          backgroundColor: effectiveBehaviorData.focusLevel > 70 ? "#10b981" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Procrastination</span>
                      <span className="font-bold">{effectiveBehaviorData.procrastination}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${effectiveBehaviorData.procrastination}%`,
                          backgroundColor: effectiveBehaviorData.procrastination < 40 ? "#10b981" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Risk Factors */}
        {(effectiveRisks || []).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold">Areas That Need Attention</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(effectiveRisks || []).map((risk, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-l-4"
                  style={{
                    backgroundColor: risk.priority === "High" ? "#fef2f2" : "#fffbeb",
                    borderLeftColor: risk.priority === "High" ? "#ef4444" : "#f59e0b",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <XCircle
                      className={`w-5 h-5 mt-0.5 ${risk.priority === "High" ? "text-red-500" : "text-yellow-500"}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{risk.issue}</h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                          {risk.category}
                        </span>
                      </div>
                      <p className="text-sm opacity-75 mb-2">{risk.impact}</p>
                      <p className="text-sm font-medium text-blue-600">ðŸ’¡ {risk.solution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Enhanced Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">Personalized Improvement Plan</h3>
            <span className="text-sm opacity-75">({(effectiveRecommendations || []).length} recommendations)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(effectiveRecommendations || []).map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{rec.category}</span>
                    </div>
                    <p className="text-sm opacity-75 mb-3">{rec.description}</p>
                    {/* Action Steps */}
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1">Action Steps:</div>
                      <ul className="text-xs opacity-75 space-y-1">
                        {(rec.actionSteps || []).map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start gap-1">
                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.timeframe}
                      </span>
                      <span className="text-green-600 font-medium">{rec.impact}</span>
                    </div>
                  </div>
                  <button
                    className="px-3 py-1 rounded text-sm font-medium transition-colors ml-2"
                    style={{
                      backgroundColor: `${theme.secondary}20`,
                      color: theme.secondary,
                    }}
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Strengths Panel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Your Strengths
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quizMetrics.averageScore > 80 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Strong Quiz Performance</span>
                </div>
                <p className="text-sm text-green-700">
                  Your quiz average of {quizMetrics.averageScore}% shows solid understanding
                </p>
              </div>
            )}
            {quizMetrics.preparationLevel > 70 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Well Prepared</span>
                </div>
                <p className="text-sm text-green-700">
                  You often pass quizzes on the first attempt - great preparation
                </p>
              </div>
            )}
            {effectiveBehaviorData.taskCompletion > 80 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Great Task Completion</span>
                </div>
                <p className="text-sm text-green-700">You finish what you start - keep it up!</p>
              </div>
            )}
            {effectiveBehaviorData.scheduleFollowing > 75 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Good Schedule Adherence</span>
                </div>
                <p className="text-sm text-green-700">You stick to your planned study times well.</p>
              </div>
            )}
            {quizMetrics.consistencyScore > 75 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Consistent Performance</span>
                </div>
                <p className="text-sm text-green-700">Your quiz scores are reliable and consistent.</p>
              </div>
            )}
            {effectiveBehaviorData.studyHours > 25 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Dedicated Study Time</span>
                </div>
                <p className="text-sm text-green-700">You put in excellent study hours each week.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
