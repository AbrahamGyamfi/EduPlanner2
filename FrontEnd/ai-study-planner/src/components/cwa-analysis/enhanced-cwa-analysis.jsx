"use client"
import { useState, useEffect, useMemo } from "react"
import {
  Clock,
  Target,
  AlertTriangle,
  Brain,
  Activity,
  XCircle,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Award,
  CheckCircle,
  BarChart3,
  LineChart,
  Download,
  Share2,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
interface Course {
  id: number
  name: string
  code: string
  credits: number
  color: string
}
interface ScheduleSession {
  id: string
  courseId: number
  courseName: string
  courseCode: string
  type: string
  startTime: string
  endTime: string
  day: string
  duration: number
  difficulty: number
  color: string
}
interface Theme {
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
}
interface EnhancedCWAAnalysisProps {
  scheduleData: ScheduleSession[]
  userCourses: Course[]
  theme: Theme
}
// Enhanced behavioral tracking with more metrics
const enhancedBehaviorMetrics = {
  systemUsage: {
    loginFrequency: 0.85,
    sessionDuration: 45,
    featureUsage: 0.72,
    consistencyScore: 0.68,
    peakUsageHours: ["9-11 AM", "2-4 PM", "7-9 PM"],
    weekendUsage: 0.45,
    mobileVsDesktop: 0.6, // 0 = all mobile, 1 = all desktop
  },
  studyBehavior: {
    scheduleAdherence: 0.78,
    planningAhead: 0.65,
    taskCompletion: 0.82,
    procrastinationIndex: 0.35,
    studySessionLength: 90, // minutes
    breakFrequency: 0.75,
    lateNightStudy: 0.25,
    earlyMorningStudy: 0.4,
  },
  engagementPatterns: {
    peakProductivityHours: ["9-11 AM", "2-4 PM"],
    preferredStudyDuration: 90,
    breakFrequency: 0.75,
    multitaskingTendency: 0.45,
    focusScore: 0.72,
    distractionResistance: 0.68,
    energyLevels: {
      morning: 0.8,
      afternoon: 0.9,
      evening: 0.6,
      night: 0.3,
    },
  },
  academicBehavior: {
    difficultyPreference: 0.6,
    helpSeekingBehavior: 0.55,
    reviewFrequency: 0.7,
    goalSetting: 0.8,
    noteQuality: 0.65,
    participationLevel: 0.7,
    deadlineManagement: 0.75,
    resourceUtilization: 0.6,
  },
  performanceIndicators: {
    currentGPA: 3.2,
    trendDirection: "up", // up, down, stable
    strongSubjects: ["Mathematics", "Computer Science"],
    weakSubjects: ["Physics", "English Literature"],
    improvementRate: 0.15, // per semester
    consistencyScore: 0.7,
  },
}
// Historical data simulation
const generateHistoricalData = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return months.map((month, index) => ({
    month,
    predictedCWA: 65 + Math.random() * 20 + index * 2,
    actualCWA: 60 + Math.random() * 25 + index * 1.5,
    studyHours: 15 + Math.random() * 10,
    adherenceRate: 0.6 + Math.random() * 0.3,
  }))
}
// Peer comparison data
const peerComparisonData = {
  averageCWA: 68.5,
  topPerformerCWA: 85.2,
  yourRanking: 45, // out of 100
  similarStudents: [
    { name: "Student A", cwa: 72.1, studyHours: 28 },
    { name: "Student B", cwa: 69.8, studyHours: 25 },
    { name: "Student C", cwa: 71.5, studyHours: 30 },
  ],
}
// Enhanced CWA prediction algorithm
const calculateEnhancedCWAPrediction = (
  behaviorData: typeof enhancedBehaviorMetrics,
  scheduleData: ScheduleSession[],
) => {
  const weights = {
    systemUsage: 0.12,
    studyBehavior: 0.38,
    engagementPatterns: 0.25,
    academicBehavior: 0.25,
  }
  // System Usage Score (more comprehensive)
  const systemScore =
    (behaviorData.systemUsage.loginFrequency * 0.15 +
      Math.min(behaviorData.systemUsage.sessionDuration / 60, 1) * 0.25 +
      behaviorData.systemUsage.featureUsage * 0.2 +
      behaviorData.systemUsage.consistencyScore * 0.25 +
      behaviorData.systemUsage.weekendUsage * 0.15) *
    100
  // Study Behavior Score (enhanced)
  const studyScore =
    (behaviorData.studyBehavior.scheduleAdherence * 0.25 +
      behaviorData.studyBehavior.planningAhead * 0.15 +
      behaviorData.studyBehavior.taskCompletion * 0.25 +
      (1 - behaviorData.studyBehavior.procrastinationIndex) * 0.2 +
      Math.min(behaviorData.studyBehavior.studySessionLength / 120, 1) * 0.15) *
    100
  // Engagement Score (more detailed)
  const engagementScore =
    (behaviorData.engagementPatterns.focusScore * 0.3 +
      behaviorData.engagementPatterns.distractionResistance * 0.25 +
      behaviorData.engagementPatterns.breakFrequency * 0.2 +
      (1 - behaviorData.engagementPatterns.multitaskingTendency) * 0.25) *
    100
  // Academic Behavior Score (comprehensive)
  const academicScore =
    (behaviorData.academicBehavior.difficultyPreference * 0.15 +
      behaviorData.academicBehavior.helpSeekingBehavior * 0.15 +
      behaviorData.academicBehavior.reviewFrequency * 0.2 +
      behaviorData.academicBehavior.goalSetting * 0.15 +
      behaviorData.academicBehavior.noteQuality * 0.1 +
      behaviorData.academicBehavior.participationLevel * 0.1 +
      behaviorData.academicBehavior.deadlineManagement * 0.15) *
    100
  // Weighted final score
  const predictedCWA =
    (systemScore * weights.systemUsage +
      studyScore * weights.studyBehavior +
      engagementScore * weights.engagementPatterns +
      academicScore * weights.academicBehavior) /
    100
  // Convert to GPA scale
  const gpaScale = (predictedCWA / 100) * 4.0
  // Calculate confidence based on data quality and consistency
  const dataQuality = (behaviorData.systemUsage.consistencyScore + behaviorData.studyBehavior.scheduleAdherence) / 2
  const confidence = Math.min(80 + dataQuality * 15 + (scheduleData?.length || 0) * 1, 98)
  return {
    predictedCWA: Math.round(predictedCWA * 100) / 100,
    predictedGPA: Math.round(gpaScale * 100) / 100,
    confidence: Math.round(confidence),
    componentScores: {
      systemUsage: Math.round(systemScore),
      studyBehavior: Math.round(studyScore),
      engagementPatterns: Math.round(engagementScore),
      academicBehavior: Math.round(academicScore),
    },
    trends: calculateTrends(behaviorData),
    riskFactors: identifyEnhancedRiskFactors(behaviorData),
    recommendations: generateEnhancedRecommendations(behaviorData),
    strengths: identifyStrengths(behaviorData),
    weeklyForecast: generateWeeklyForecast(behaviorData),
  }
}
const calculateTrends = (behaviorData: typeof enhancedBehaviorMetrics) => {
  return {
    overall: behaviorData.performanceIndicators.trendDirection,
    systemUsage: behaviorData.systemUsage.consistencyScore > 0.7 ? "up" : "down",
    studyBehavior: behaviorData.studyBehavior.scheduleAdherence > 0.7 ? "up" : "stable",
    engagement: behaviorData.engagementPatterns.focusScore > 0.7 ? "up" : "down",
    academic: behaviorData.academicBehavior.goalSetting > 0.7 ? "up" : "stable",
  }
}
const identifyEnhancedRiskFactors = (behaviorData: typeof enhancedBehaviorMetrics) => {
  const risks = []
  if (behaviorData.studyBehavior.procrastinationIndex > 0.6) {
    risks.push({
      factor: "High Procrastination Risk",
      severity: "high" ,
      impact: "May significantly impact academic performance and deadline management",
      suggestion: "Implement time-blocking and break large tasks into smaller, manageable chunks",
      affectedAreas: ["Task Completion", "Deadline Management", "Stress Levels"],
      urgency: "immediate",
    })
  }
  if (behaviorData.engagementPatterns.multitaskingTendency > 0.7) {
    risks.push({
      factor: "Excessive Multitasking",
      severity: "medium" ,
      impact: "Reduced learning efficiency and increased cognitive load",
      suggestion: "Practice single-tasking and use focus techniques like the Pomodoro method",
      affectedAreas: ["Focus", "Learning Quality", "Retention"],
      urgency: "moderate",
    })
  }
  if (behaviorData.studyBehavior.lateNightStudy > 0.6) {
    risks.push({
      factor: "Poor Sleep-Study Balance",
      severity: "medium" ,
      impact: "Late-night studying may affect sleep quality and next-day performance",
      suggestion: "Shift study sessions to earlier hours and maintain consistent sleep schedule",
      affectedAreas: ["Sleep Quality", "Energy Levels", "Concentration"],
      urgency: "moderate",
    })
  }
  if (behaviorData.academicBehavior.helpSeekingBehavior < 0.4) {
    risks.push({
      factor: "Low Help-Seeking Behavior",
      severity: "low" ,
      impact: "May struggle with difficult concepts without seeking assistance",
      suggestion: "Actively participate in office hours and study groups",
      affectedAreas: ["Understanding", "Problem Solving", "Academic Support"],
      urgency: "low",
    })
  }
  return risks
}
const identifyStrengths = (behaviorData: typeof enhancedBehaviorMetrics) => {
  const strengths = []
  if (behaviorData.studyBehavior.taskCompletion > 0.8) {
    strengths.push({
      strength: "Excellent Task Completion",
      description: "You consistently complete your planned tasks",
      impact: "Leads to better academic outcomes and reduced stress",
      leverage: "Use this strength to tackle more challenging projects",
    })
  }
  if (behaviorData.academicBehavior.goalSetting > 0.75) {
    strengths.push({
      strength: "Strong Goal Setting",
      description: "You effectively set and track academic goals",
      impact: "Provides clear direction and motivation for studies",
      leverage: "Consider setting more ambitious long-term goals",
    })
  }
  if (behaviorData.engagementPatterns.focusScore > 0.7) {
    strengths.push({
      strength: "High Focus Ability",
      description: "You maintain good concentration during study sessions",
      impact: "Enables deeper learning and better retention",
      leverage: "Use focused time for your most challenging subjects",
    })
  }
  return strengths
}
const generateWeeklyForecast = (behaviorData: typeof enhancedBehaviorMetrics) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  return days.map((day, index) => ({
    day,
    predictedProductivity: 0.6 + Math.random() * 0.3,
    recommendedStudyHours: 3 + Math.random() * 2,
    optimalStudyTime: index < 5 ? "2-4 PM" : "10 AM-12 PM",
    energyLevel: index < 5 ? "High" : "Medium",
    riskLevel: Math.random() > 0.7 ? "High" : Math.random() > 0.4 ? "Medium" : "Low",
  }))
}
const generateEnhancedRecommendations = (behaviorData: typeof enhancedBehaviorMetrics) => {
  const recommendations = []
  // High-impact recommendations based on multiple factors
  if (behaviorData.studyBehavior.procrastinationIndex > 0.5) {
    recommendations.push({
      id: "proc-management",
      category: "Critical Improvement",
      title: "Advanced Procrastination Management System",
      description: "Implement a comprehensive system to overcome procrastination patterns",
      actionSteps: [
        "Use the 'Two-Minute Rule': Complete any task that takes less than 2 minutes immediately",
        "Implement time-blocking: Assign specific time slots for each task",
        "Create accountability partnerships with classmates",
        "Use the 'Pomodoro Technique' with 25-minute focused sessions",
        "Set up environmental cues that trigger study behavior",
        "Track procrastination triggers and develop counter-strategies",
      ],
      priority: "high" ,
      expectedImpact: "+0.6 GPA points",
      timeToImplement: "4-6 weeks",
      difficultyLevel: "Hard",
      successRate: 78,
      relatedMetrics: ["Task Completion", "Schedule Adherence", "Stress Levels"],
    })
  }
  if (behaviorData.engagementPatterns.focusScore < 0.6) {
    recommendations.push({
      id: "focus-enhancement",
      category: "Cognitive Enhancement",
      title: "Deep Focus Training Program",
      description: "Develop sustained attention and concentration abilities",
      actionSteps: [
        "Practice mindfulness meditation for 10 minutes daily",
        "Use website blockers during study sessions",
        "Create a dedicated, distraction-free study environment",
        "Implement the 'Single-Tasking Rule' - one task at a time",
        "Use background noise or music that enhances concentration",
        "Take regular breaks to prevent mental fatigue",
      ],
      priority: "high" ,
      expectedImpact: "+0.4 GPA points",
      timeToImplement: "3-4 weeks",
      difficultyLevel: "Medium",
      successRate: 85,
      relatedMetrics: ["Focus Score", "Learning Quality", "Study Efficiency"],
    })
  }
  if (behaviorData.academicBehavior.reviewFrequency < 0.6) {
    recommendations.push({
      id: "spaced-repetition",
      category: "Learning Optimization",
      title: "Scientific Review System Implementation",
      description: "Use evidence-based spaced repetition for maximum retention",
      actionSteps: [
        "Review new material within 24 hours of learning",
        "Schedule reviews at increasing intervals: 3 days, 1 week, 2 weeks, 1 month",
        "Use active recall techniques instead of passive re-reading",
        "Create digital flashcards for key concepts",
        "Test yourself regularly without looking at notes",
        "Connect new information to existing knowledge",
      ],
      priority: "high" ,
      expectedImpact: "+0.5 GPA points",
      timeToImplement: "2-3 weeks",
      difficultyLevel: "Medium",
      successRate: 92,
      relatedMetrics: ["Retention Rate", "Exam Performance", "Long-term Learning"],
    })
  }
  // Personalized recommendations based on strengths
  if (behaviorData.studyBehavior.taskCompletion > 0.8) {
    recommendations.push({
      id: "leverage-completion",
      category: "Strength Leveraging",
      title: "Advanced Project Management",
      description: "Use your excellent completion rate to tackle more ambitious goals",
      actionSteps: [
        "Take on leadership roles in group projects",
        "Set stretch goals that challenge your abilities",
        "Mentor other students who struggle with completion",
        "Apply for research opportunities or internships",
        "Create detailed project timelines for complex assignments",
      ],
      priority: "medium" ,
      expectedImpact: "+0.3 GPA points",
      timeToImplement: "Ongoing",
      difficultyLevel: "Easy",
      successRate: 95,
      relatedMetrics: ["Leadership Skills", "Academic Opportunities", "Career Preparation"],
    })
  }
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}
export default function EnhancedCWAAnalysis({ scheduleData, userCourses, theme }: EnhancedCWAAnalysisProps) {
  const [selectedView, setSelectedView] = useState("overview")
  const [selectedTimeframe, setSelectedTimeframe] = useState("current")
  const [behaviorData, setBehaviorData] = useState(enhancedBehaviorMetrics)
  const [historicalData] = useState(generateHistoricalData())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  // Calculate enhanced prediction
  const prediction = useMemo(() => {
    return calculateEnhancedCWAPrediction(behaviorData, scheduleData)
  }, [behaviorData, scheduleData])
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBehaviorData((prev) => ({
        ...prev,
        systemUsage: {
          ...prev.systemUsage,
          loginFrequency: Math.min(prev.systemUsage.loginFrequency + 0.005, 1),
        },
        engagementPatterns: {
          ...prev.engagementPatterns,
          focusScore: Math.max(0.3, prev.engagementPatterns.focusScore + (Math.random() - 0.5) * 0.02),
        },
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  const runAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => setIsAnalyzing(false), 4000)
  }
  const views = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "comparison", label: "Peer Comparison", icon: Users },
    { id: "forecast", label: "Weekly Forecast", icon: Calendar },
    { id: "recommendations", label: "Action Plan", icon: Target },
  ]
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Advanced CWA Analytics</h1>
              <p className="opacity-75 text-lg">AI-powered academic performance prediction and optimization system</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showComparison ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                {showComparison ? "Hide Comparison" : "Show Peer Data"}
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4 inline mr-2" />
                Export Report
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                <Share2 className="w-4 h-4 inline mr-2" />
                Share
              </button>
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-sm"
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
                    Deep Analysis
                  </>
                )}
              </button>
            </div>
          </div>
          {/* View Navigation */}
          <div className="flex items-center gap-2 mb-4">
            {views.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedView(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedView === id
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          {/* Timeframe Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Analysis Period:</span>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {[
                { id: "current", label: "Current Semester" },
                { id: "next", label: "Next Semester" },
                { id: "year", label: "Academic Year" },
                { id: "historical", label: "Historical" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSelectedTimeframe(id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === id ? "bg-white shadow-sm" : "hover:bg-gray-200"
                  }`}
                  style={{
                    color: selectedTimeframe === id ? theme.secondary : theme.text,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Main Dashboard */}
        {selectedView === "overview" && (
          <OverviewDashboard prediction={prediction} behaviorData={behaviorData} theme={theme} />
        )}
        {selectedView === "trends" && (
          <TrendsDashboard
            prediction={prediction}
            historicalData={historicalData}
            behaviorData={behaviorData}
            theme={theme}
          />
        )}
        {selectedView === "comparison" && (
          <ComparisonDashboard
            prediction={prediction}
            peerData={peerComparisonData}
            behaviorData={behaviorData}
            theme={theme}
          />
        )}
        {selectedView === "forecast" && (
          <ForecastDashboard prediction={prediction} behaviorData={behaviorData} theme={theme} />
        )}
        {selectedView === "recommendations" && (
          <RecommendationsDashboard prediction={prediction} behaviorData={behaviorData} theme={theme} />
        )}
      </div>
    </div>
  )
}
// Overview Dashboard Component
function OverviewDashboard({ prediction, behaviorData, theme }: any) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.secondary}20` }}
          >
            <GraduationCap className="w-8 h-8" style={{ color: theme.secondary }} />
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: theme.secondary }}>
            {prediction.predictedCWA}%
          </div>
          <div className="text-sm opacity-75 mb-2">Predicted CWA</div>
          <div className="flex items-center justify-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-green-600">+2.3% from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.accent}20` }}
          >
            <Target className="w-8 h-8" style={{ color: theme.accent }} />
          </div>
          <div className="text-3xl font-bold mb-2">{prediction.confidence}%</div>
          <div className="text-sm opacity-75 mb-2">Confidence Level</div>
          <div className="flex items-center justify-center gap-1 text-xs">
            <ArrowUp className="w-3 h-3 text-green-500" />
            <span className="text-green-600">High accuracy</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-yellow-100">
            <Activity className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold mb-2">
            {Math.round(
              (behaviorData.studyBehavior.scheduleAdherence +
                behaviorData.engagementPatterns.focusScore +
                behaviorData.academicBehavior.goalSetting) *
                33.33,
            )}
          </div>
          <div className="text-sm opacity-75 mb-2">Overall Score</div>
          <div className="flex items-center justify-center gap-1 text-xs">
            <Minus className="w-3 h-3 text-gray-500" />
            <span className="text-gray-600">Stable</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-3xl font-bold mb-2">{prediction.riskFactors.length}</div>
          <div className="text-sm opacity-75 mb-2">Risk Factors</div>
          <div className="flex items-center justify-center gap-1 text-xs">
            <ArrowDown className="w-3 h-3 text-red-500" />
            <span className="text-red-600">Needs attention</span>
          </div>
        </div>
      </div>
      {/* Behavioral Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Scores */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">Performance Components</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(prediction.componentScores).map(([component, score]) => {
              const labels = {
                systemUsage: "System Usage",
                studyBehavior: "Study Behavior",
                engagementPatterns: "Engagement",
                academicBehavior: "Academic Behavior",
              }
              return (
                <div key={component}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{labels[component as keyof typeof labels]}</span>
                    <span className="text-sm font-bold">{score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-1000"
                      style={{
                        width: `${score}%`,
                        backgroundColor:
                          score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#ef4444" : "#6b7280",
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Strengths & Weaknesses */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">Strengths & Areas for Improvement</h3>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Key Strengths
              </h4>
              <div className="space-y-2">
                {prediction.strengths.map((strength: any, index: number) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-sm">{strength.strength}</div>
                    <div className="text-xs opacity-75 mt-1">{strength.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Priority Areas
              </h4>
              <div className="space-y-2">
                {prediction.riskFactors.slice(0, 2).map((risk: any, index: number) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg">
                    <div className="font-medium text-sm">{risk.factor}</div>
                    <div className="text-xs opacity-75 mt-1">{risk.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
// Trends Dashboard Component
function TrendsDashboard({ prediction, historicalData, behaviorData, theme }: any) {
  return (
    <div className="space-y-6">
      {/* Trend Overview */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <LineChart className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Performance Trends</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(prediction.trends).map(([area, trend]) => {
            const trendIcons = {
              up: <TrendingUp className="w-4 h-4 text-green-500" />,
              down: <TrendingDown className="w-4 h-4 text-red-500" />,
              stable: <Minus className="w-4 h-4 text-gray-500" />,
            }
            return (
              <div key={area} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{area.replace(/([A-Z])/g, " $1")}</span>
                  {trendIcons[trend as keyof typeof trendIcons]}
                </div>
                <div className="text-xs opacity-75">
                  {trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable"}
                </div>
              </div>
            )
          })}
        </div>
        {/* Historical Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <LineChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">Historical Performance Chart</p>
            <p className="text-sm text-gray-400">Interactive chart showing CWA trends over time</p>
          </div>
        </div>
      </div>
      {/* Monthly Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Performance Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {historicalData.slice(-3).map((month: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="font-semibold mb-2">{month.month}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Predicted CWA:</span>
                  <span className="font-medium">{month.predictedCWA.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Study Hours:</span>
                  <span className="font-medium">{month.studyHours.toFixed(0)}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Adherence:</span>
                  <span className="font-medium">{(month.adherenceRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
// Comparison Dashboard Component
function ComparisonDashboard({ prediction, peerData, behaviorData, theme }: any) {
  return (
    <div className="space-y-6">
      {/* Peer Comparison Overview */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Peer Comparison Analysis</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold mb-2">{prediction.predictedCWA}%</div>
            <div className="text-sm opacity-75 mb-2">Your Predicted CWA</div>
            <div className="text-xs text-blue-600">Current Performance</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold mb-2">{peerData.averageCWA}%</div>
            <div className="text-sm opacity-75 mb-2">Peer Average</div>
            <div className="text-xs text-gray-600">Class Average</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold mb-2">#{peerData.yourRanking}</div>
            <div className="text-sm opacity-75 mb-2">Your Ranking</div>
            <div className="text-xs text-green-600">Out of 100 students</div>
          </div>
        </div>
      </div>
      {/* Similar Students */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Students with Similar Patterns</h3>
        <div className="space-y-4">
          {peerData.similarStudents.map((student: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm opacity-75">Similar study patterns</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{student.cwa}% CWA</div>
                <div className="text-sm opacity-75">{student.studyHours}h/week</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
// Forecast Dashboard Component
function ForecastDashboard({ prediction, behaviorData, theme }: any) {
  return (
    <div className="space-y-6">
      {/* Weekly Forecast */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">7-Day Performance Forecast</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {prediction.weeklyForecast.map((day: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg text-center">
              <div className="font-semibold mb-2">{day.day.slice(0, 3)}</div>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-xs opacity-75">Productivity</div>
                  <div className="font-medium">{(day.predictedProductivity * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-xs opacity-75">Study Hours</div>
                  <div className="font-medium">{day.recommendedStudyHours.toFixed(1)}h</div>
                </div>
                <div>
                  <div className="text-xs opacity-75">Best Time</div>
                  <div className="font-medium text-xs">{day.optimalStudyTime}</div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    day.riskLevel === "High"
                      ? "bg-red-100 text-red-700"
                      : day.riskLevel === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {day.riskLevel} Risk
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Energy Levels */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Energy Pattern Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(behaviorData.engagementPatterns.energyLevels).map(([time, level]) => (
            <div key={time} className="p-4 border rounded-lg text-center">
              <div className="font-semibold mb-2 capitalize">{time}</div>
              <div className="text-2xl font-bold mb-2">{(level * 100).toFixed(0)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${level * 100}%`,
                    backgroundColor: level > 0.7 ? "#10b981" : level > 0.4 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
// Recommendations Dashboard Component
function RecommendationsDashboard({ prediction, behaviorData, theme }: any) {
  return (
    <div className="space-y-6">
      {/* Action Plan Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Personalized Action Plan</h3>
            <p className="text-sm opacity-75">
              {prediction.recommendations.length} recommendations based on your behavioral analysis
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              +
              {prediction.recommendations
                .reduce(
                  (sum: number, r: any) => sum + Number.parseFloat(r.expectedImpact.match(/\d+\.?\d*/)?.[0] || "0"),
                  0,
                )
                .toFixed(1)}
            </div>
            <div className="text-sm opacity-75">Potential GPA Gain</div>
          </div>
        </div>
      </div>
      {/* Enhanced Recommendations */}
      <div className="space-y-6">
        {prediction.recommendations.map((rec: any, index: number) => (
          <div
            key={rec.id}
            className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        rec.priority === "high" ? "#fef2f2" : rec.priority === "medium" ? "#fffbeb" : "#f0fdf4",
                      color: rec.priority === "high" ? "#dc2626" : rec.priority === "medium" ? "#d97706" : "#16a34a",
                    }}
                  >
                    {rec.priority} priority
                  </span>
                  <span className="text-sm opacity-75 font-medium">{rec.category}</span>
                  <span className="text-xs opacity-50">â€¢</span>
                  <span className="text-xs opacity-75">{rec.successRate}% success rate</span>
                </div>
                <h4 className="font-bold text-xl mb-2">{rec.title}</h4>
                <p className="text-sm opacity-75 mb-4">{rec.description}</p>
                {/* Related Metrics */}
                <div className="mb-4">
                  <h5 className="font-semibold text-sm mb-2">ðŸ“Š Impact Areas:</h5>
                  <div className="flex flex-wrap gap-2">
                    {rec.relatedMetrics.map((metric: string, metricIndex: number) => (
                      <span key={metricIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Action Steps */}
                <div className="mb-4">
                  <h5 className="font-semibold text-sm mb-2">ðŸ“‹ Implementation Steps:</h5>
                  <ul className="space-y-2">
                    {rec.actionSteps.map((step: string, stepIndex: number) => (
                      <li key={stepIndex} className="text-sm opacity-75 flex items-start gap-2">
                        <span className="text-xs mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Implementation Details */}
                <div className="flex items-center gap-6 text-xs opacity-75">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Timeline: {rec.timeToImplement}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>Difficulty: {rec.difficultyLevel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>Success Rate: {rec.successRate}%</span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-6">
                <div className="text-xl font-bold text-green-600 mb-1">{rec.expectedImpact}</div>
                <div className="text-xs opacity-75 mb-4">potential gain</div>
                <button
                  className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 mb-2"
                  style={{
                    backgroundColor: theme.secondary,
                    color: "white",
                  }}
                >
                  Start Implementation
                </button>
                <div className="space-y-1">
                  <button className="block w-full px-4 py-2 text-xs border rounded hover:bg-gray-50">
                    Set Reminder
                  </button>
                  <button className="block w-full px-4 py-2 text-xs border rounded hover:bg-gray-50">
                    Track Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
