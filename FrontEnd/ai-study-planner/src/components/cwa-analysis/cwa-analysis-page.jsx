import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  AlertTriangle,
  Brain,
  Calendar,
  Award,
  Users,
  Eye,
  Headphones,
  Hand,
  Download,
  RefreshCw,
  Activity,
  PieChart,
  LineChart,
  Search,
  Play,
  Pause,
  Lightbulb,
  TrendingDown,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
// Enhanced Chart Components
const BarChart = ({ data, theme, title, showValues = true }) => (
  <div className="space-y-4">
    {title && <h4 className="font-semibold text-sm opacity-75">{title}</h4>}
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-sm font-medium truncate" title={item.name}>
            {item.name}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
            <div
              className="h-4 rounded-full transition-all duration-1000 ease-out relative"
              style={{
                width: `${(item.value / Math.max(...data.map((d) => d.value))) * 100}%`,
                backgroundColor: item.color || theme.secondary,
              }}
            >
              {showValues && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                  {item.value > 0 && `${item.value}h`}
                </div>
              )}
            </div>
          </div>
          <div className="w-16 text-sm text-right font-semibold">{item.value.toFixed(1)}h</div>
        </div>
      ))}
    </div>
  </div>
);
const PieChartAdvanced = ({ data, theme, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <div className="space-y-4">
      {title && <h4 className="font-semibold text-sm opacity-75">{title}</h4>}
      <div className="flex items-center justify-between">
        <div className="relative w-40 h-40">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle cx="80" cy="80" r="60" fill="none" stroke="#e5e7eb" strokeWidth="12" />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const circumference = 2 * Math.PI * 60
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
              const strokeDashoffset = -(
                (data.slice(0, index).reduce((sum, d) => sum + d.value, 0) / total) *
                circumference
              )
              return (
                <circle
                  key={index}
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 hover:stroke-opacity-80"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total.toFixed(1)}</div>
              <div className="text-sm opacity-75">total hours</div>
            </div>
          </div>
        </div>
        <div className="space-y-3 ml-6 flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="opacity-75">{((item.value / total) * 100).toFixed(1)}%</div>
              </div>
              <div className="font-semibold">{item.value.toFixed(1)}h</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const LineChartSimple = ({ data, theme, title }) => (
  <div className="space-y-4">
    {title && <h4 className="font-semibold text-sm opacity-75">{title}</h4>}
    <div className="h-32 flex items-end justify-between gap-2">
      {data.map((item, index) => {
        const maxValue = Math.max(...data.map((d) => d.value))
        const height = (item.value / maxValue) * 100
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg transition-all duration-1000 ease-out relative group"
              style={{
                height: `${height}%`,
                backgroundColor: theme.secondary,
                minHeight: "4px",
              }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                {item.value.toFixed(1)}h
              </div>
            </div>
            <div className="text-xs font-medium text-center">{item.name}</div>
          </div>
        )
      })}
    </div>
  </div>
);
export default function CWAAnalysisPage({ scheduleData, userCourses, theme }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("week")
  const [selectedView, setSelectedView] = useState("overview") // overview, detailed, trends, predictions
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilters, setSelectedFilters] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  // Simulate real-time analysis progress
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            setIsAnalyzing(false)
            return 100
          }
          return prev + Math.random() * 15
        })
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isAnalyzing])
  // Process schedule data for comprehensive analysis
  const processedData = useMemo(() => {
    if (!scheduleData || scheduleData.length === 0) return null
    // Course workload analysis
    const courseWorkload = scheduleData.reduce((acc, session) => {
      const courseKey = session.courseCode
      if (!acc[courseKey]) {
        acc[courseKey] = {
          name: session.courseName,
          code: session.courseCode,
          color: session.courseColor,
          totalHours: 0,
          sessions: 0,
          priorities: { high: 0, normal: 0 },
          learningStyles: {},
          efficiency: 0,
          difficulty: Math.random() * 5 + 1, // Mock difficulty rating
        }
      }
      acc[courseKey].totalHours += session.duration / 60
      acc[courseKey].sessions += 1
      acc[courseKey].priorities[session.priority] += 1
      if (!acc[courseKey].learningStyles[session.learningStyle]) {
        acc[courseKey].learningStyles[session.learningStyle] = 0
      }
      acc[courseKey].learningStyles[session.learningStyle] += 1
      // Calculate efficiency based on high priority ratio
      acc[courseKey].efficiency = (acc[courseKey].priorities.high / acc[courseKey].sessions) * 100
      return acc
    }, {})
    // Time distribution analysis
    const timeDistribution = scheduleData.reduce((acc, session) => {
      const timeSlot = session.timeSlot.split(" - ")[0]
      const hour = Number.parseInt(timeSlot.split(":")[0])
      let period
      if (hour < 8) period = "Early Morning"
      else if (hour < 12) period = "Morning"
      else if (hour < 17) period = "Afternoon"
      else if (hour < 20) period = "Evening"
      else period = "Night"
      if (!acc[period]) acc[period] = 0
      acc[period] += session.duration / 60
      return acc
    }, {})
    // Learning style effectiveness
    const learningStyleData = scheduleData.reduce((acc, session) => {
      if (!acc[session.learningStyle]) {
        acc[session.learningStyle] = {
          sessions: 0,
          totalHours: 0,
          highPriority: 0,
          effectiveness: 0,
        }
      }
      acc[session.learningStyle].sessions += 1
      acc[session.learningStyle].totalHours += session.duration / 60
      if (session.priority === "high") {
        acc[session.learningStyle].highPriority += 1
      }
      // Calculate effectiveness
      acc[session.learningStyle].effectiveness =
        acc[session.learningStyle].sessions > 0
          ? (acc[session.learningStyle].highPriority / acc[session.learningStyle].sessions) * 100
          : 0
      return acc
    }, {})
    // Weekly pattern analysis
    const weeklyPattern = scheduleData.reduce((acc, session) => {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      const dayName = days[session.day - 1]
      if (!acc[dayName]) acc[dayName] = 0
      acc[dayName] += session.duration / 60
      return acc
    }, {})
    // Performance trends (mock data for demonstration)
    const performanceTrends = [
      { name: "Week 1", value: 75 },
      { name: "Week 2", value: 78 },
      { name: "Week 3", value: 82 },
      { name: "Week 4", value: 85 },
      { name: "Current", value: 87 },
    ]
    return {
      courseWorkload,
      timeDistribution,
      learningStyleData,
      weeklyPattern,
      performanceTrends,
      totalHours: scheduleData.reduce((sum, session) => sum + session.duration / 60, 0),
      totalSessions: scheduleData.length,
      highPrioritySessions: scheduleData.filter((s) => s.priority === "high").length,
      averageSessionLength:
        scheduleData.length > 0
          ? scheduleData.reduce((sum, session) => sum + session.duration, 0) / scheduleData.length
          : 0,
    }
  }, [scheduleData])
  // Generate comprehensive insights
  const generateInsights = () => {
    if (!processedData) return []
    const insights = []
    // Workload balance analysis
    const workloadValues = Object.values(processedData.courseWorkload).map((c) => c.totalHours)
    const maxWorkload = Math.max(...workloadValues)
    const minWorkload = Math.min(...workloadValues)
    const workloadImbalance = maxWorkload - minWorkload
    if (workloadImbalance > 3) {
      insights.push({
        type: "warning",
        title: "Workload Imbalance Detected",
        description: `${workloadImbalance.toFixed(1)} hour difference between courses`,
        recommendation: "Consider redistributing study time for better balance",
        icon: AlertTriangle,
        color: "#f59e0b",
        priority: "high",
      })
    }
    // Study efficiency analysis
    const overallEfficiency = (processedData.highPrioritySessions / processedData.totalSessions) * 100
    if (overallEfficiency > 70) {
      insights.push({
        type: "success",
        title: "Excellent Study Focus",
        description: `${overallEfficiency.toFixed(0)}% of sessions are high priority`,
        recommendation: "Maintain this excellent focus on important tasks",
        icon: Target,
        color: "#10b981",
        priority: "info",
      })
    } else if (overallEfficiency < 40) {
      insights.push({
        type: "warning",
        title: "Low Priority Focus",
        description: `Only ${overallEfficiency.toFixed(0)}% of sessions are high priority`,
        recommendation: "Increase focus on high-priority tasks for better results",
        icon: AlertTriangle,
        color: "#ef4444",
        priority: "high",
      })
    }
    // Learning style diversity
    const learningStyleCount = Object.keys(processedData.learningStyleData).length
    if (learningStyleCount >= 4) {
      insights.push({
        type: "success",
        title: "Diverse Learning Approach",
        description: `Using ${learningStyleCount} different learning styles`,
        recommendation: "Great variety This enhances retention and understanding",
        icon: Brain,
        color: "#8b5cf6",
        priority: "info",
      })
    }
    // Time optimization
    const peakHours = Object.entries(processedData.timeDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([period]) => period)
    if (peakHours.length > 0) {
      insights.push({
        type: "info",
        title: "Peak Study Times Identified",
        description: `Most productive during ${peakHours.join(" and ")}`,
        recommendation: "Schedule challenging subjects during these peak times",
        icon: Clock,
        color: "#3b82f6",
        priority: "medium",
      })
    }
    // Session length analysis
    const avgSessionLength = processedData.averageSessionLength
    if (avgSessionLength > 120) {
      insights.push({
        type: "warning",
        title: "Long Study Sessions",
        description: `Average session length: ${Math.round(avgSessionLength)} minutes`,
        recommendation: "Consider shorter sessions with breaks for better retention",
        icon: Clock,
        color: "#f59e0b",
        priority: "medium",
      })
    }
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, info: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
  const insights = generateInsights()
  // Performance predictions
  const performancePredictions = processedData
    ? Object.values(processedData.courseWorkload)
        .map((course) => {
          const baseScore = 70
          const workloadBonus = Math.min(course.totalHours * 2, 20)
          const priorityBonus = (course.priorities.high / course.sessions) * 10
          const diversityBonus = Object.keys(course.learningStyles).length * 2
          const difficultyPenalty = course.difficulty * 2
          const predictedScore = Math.min(
            Math.max(baseScore + workloadBonus + priorityBonus + diversityBonus - difficultyPenalty, 0),
            100,
          )
          return {
            ...course,
            predictedScore: Math.round(predictedScore),
            confidence: Math.min(85 + course.sessions * 2, 95),
            trend: Math.random() > 0.5 ? "up" : "down",
            riskLevel: predictedScore < 60 ? "high" : predictedScore < 75 ? "medium" : "low",
          }
        })
        .sort((a, b) => b.predictedScore - a.predictedScore)
    : []
  const runAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
  }
  if (!scheduleData || scheduleData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-lg">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
            style={{ backgroundColor: `${theme.secondary}20` }}
          >
            <BarChart3 className="w-16 h-16" style={{ color: theme.secondary }} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome to CWA Analysis</h2>
          <p className="opacity-75 mb-8 text-lg leading-relaxed">
            Your Comprehensive Workload Analysis dashboard is ready. Generate a study schedule first to unlock powerful
            AI-driven insights about your learning patterns and performance predictions.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-semibold">AI Insights</div>
              <div className="opacity-75">Smart recommendations</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="font-semibold">Performance Tracking</div>
              <div className="opacity-75">Grade predictions</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">CWA Analysis Dashboard</h1>
              <p className="opacity-75 text-lg">
                Comprehensive Workload Analysis powered by AI â€¢ Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  autoRefresh ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                Auto Refresh
              </button>
              {/* Analysis Button */}
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
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing... {Math.round(analysisProgress)}%
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Run Deep Analysis
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* View Selector */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {[
                  { id: "overview", label: "Overview", icon: PieChart },
                  { id: "detailed", label: "Detailed", icon: BarChart3 },
                  { id: "trends", label: "Trends", icon: LineChart },
                  { id: "predictions", label: "Predictions", icon: Target },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedView(id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedView === id ? "bg-white shadow-sm" : "hover:bg-gray-200"
                    }`}
                    style={{
                      color: selectedView === id ? theme.secondary : theme.text,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              {/* Timeframe Selector */}
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: `${theme.primary}30`,
                  color: theme.text,
                }}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="semester">This Semester</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Search insights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border text-sm w-48"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: `${theme.primary}30`,
                    color: theme.text,
                  }}
                />
              </div>
              {/* Export Button */}
              <button
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                style={{
                  borderColor: `${theme.secondary}30`,
                  color: theme.secondary,
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
        {/* Analysis Progress Bar */}
        {isAnalyzing && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-semibold">AI Analysis in Progress</div>
                <div className="text-sm opacity-75">Processing your study patterns and generating insights...</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}
        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Study Efficiency",
              value: processedData
                ? `${Math.round((processedData.highPrioritySessions / processedData.totalSessions) * 100)}%`
                : "0%",
              change: "+12%",
              trend: "up",
              icon: Target,
              color: theme.secondary,
              description: "High-priority task completion rate",
            },
            {
              label: "Weekly Hours",
              value: processedData?.totalHours.toFixed(1) || "0",
              change: "+2.3h",
              trend: "up",
              icon: Clock,
              color: "#10b981",
              description: "Total study time this week",
            },
            {
              label: "Course Balance",
              value: Object.keys(processedData?.courseWorkload || {}).length,
              change: "Balanced",
              trend: "stable",
              icon: BookOpen,
              color: "#f59e0b",
              description: "Active courses in rotation",
            },
            {
              label: "AI Confidence",
              value: "94%",
              change: "+3%",
              trend: "up",
              icon: Brain,
              color: "#8b5cf6",
              description: "Prediction accuracy level",
            },
          ].map((metric, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}20` }}
                >
                  <metric.icon className="w-6 h-6" style={{ color: metric.color }} />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : metric.trend === "down" ? (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  ) : (
                    <Activity className="w-3 h-3 text-gray-400" />
                  )}
                  <span
                    className={
                      metric.trend === "up"
                        ? "text-green-500"
                        : metric.trend === "down"
                          ? "text-red-500"
                          : "text-gray-400"
                    }
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">{metric.value}</div>
              <div className="text-sm font-medium mb-1">{metric.label}</div>
              <div className="text-xs opacity-75">{metric.description}</div>
            </div>
          ))}
        </div>
        {/* Main Content Based on Selected View */}
        {selectedView === "overview" && (
          <OverviewAnalysis processedData={processedData} insights={insights} theme={theme} />
        )}
        {selectedView === "detailed" && (
          <DetailedAnalysis processedData={processedData} scheduleData={scheduleData} theme={theme} />
        )}
        {selectedView === "trends" && <TrendsAnalysis processedData={processedData} theme={theme} />}
        {selectedView === "predictions" && (
          <PredictionsAnalysis performancePredictions={performancePredictions} theme={theme} />
        )}
        {/* AI Insights Panel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6" style={{ color: theme.secondary }} />
              <h3 className="text-xl font-semibold">AI Insights & Recommendations</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm opacity-75">Live Analysis</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 6).map((insight, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-l-4 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${insight.color}10`,
                  borderLeftColor: insight.color,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {insight.type === "success" ? (
                      <CheckCircle className="w-5 h-5" style={{ color: insight.color }} />
                    ) : insight.type === "warning" ? (
                      <AlertTriangle className="w-5 h-5" style={{ color: insight.color }} />
                    ) : (
                      <Info className="w-5 h-5" style={{ color: insight.color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm opacity-75 mb-2">{insight.description}</p>
                    <p className="text-sm font-medium" style={{ color: insight.color }}>
                      ðŸ’¡ {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// Overview Analysis Component
function OverviewAnalysis({ processedData, insights, theme }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Course Workload Distribution */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">Course Workload Distribution</h3>
          </div>
          <span className="text-xs opacity-75 bg-gray-100 px-2 py-1 rounded-full">Hours per course</span>
        </div>
        {processedData && (
          <BarChart
            data={Object.values(processedData.courseWorkload).map((course) => ({
              name: course.code,
              value: Number.parseFloat(course.totalHours.toFixed(1)),
              color: course.color,
            }))}
            theme={theme}
          />
        )}
      </div>
      {/* Time Distribution */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">Study Time Distribution</h3>
          </div>
          <span className="text-xs opacity-75 bg-gray-100 px-2 py-1 rounded-full">Peak hours analysis</span>
        </div>
        {processedData && (
          <PieChartAdvanced
            data={Object.entries(processedData.timeDistribution).map(([period, hours]) => ({
              name: period,
              value: Number.parseFloat(hours.toFixed(1)),
              color: {
                "Early Morning": "#f59e0b",
                Morning: "#10b981",
                Afternoon: "#3b82f6",
                Evening: "#8b5cf6",
                Night: "#6b7280",
              }[period],
            }))}
            theme={theme}
          />
        )}
      </div>
      {/* Learning Style Effectiveness */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Learning Style Effectiveness</h3>
        </div>
        {processedData && (
          <div className="space-y-4">
            {Object.entries(processedData.learningStyleData).map(([style, data]) => {
              const effectiveness = data.effectiveness
              const icons = {
                visual: Eye,
                auditory: Headphones,
                kinesthetic: Hand,
                reading: BookOpen,
                social: Users,
                logical: Target,
              }
              const Icon = icons[style] || Brain
              return (
                <div
                  key={style}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: `${theme.secondary}20` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${theme.secondary}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: theme.secondary }} />
                    </div>
                    <div>
                      <div className="font-medium capitalize">{style}</div>
                      <div className="text-sm opacity-75">
                        {data.sessions} sessions â€¢ {data.totalHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-xl font-bold"
                      style={{
                        color: effectiveness >= 70 ? "#10b981" : effectiveness >= 50 ? "#f59e0b" : "#ef4444",
                      }}
                    >
                      {effectiveness.toFixed(0)}%
                    </div>
                    <div className="text-xs opacity-75">effectiveness</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Weekly Pattern */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Weekly Study Pattern</h3>
        </div>
        {processedData && (
          <LineChartSimple
            data={Object.entries(processedData.weeklyPattern).map(([day, hours]) => ({
              name: day.slice(0, 3),
              value: Number.parseFloat(hours.toFixed(1)),
            }))}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
};
// Detailed Analysis Component
function DetailedAnalysis({ processedData, scheduleData, theme }) {
  return (
    <div className="space-y-6">
      {/* Course Performance Deep Dive */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Course Performance Deep Dive</h3>
        </div>
        {processedData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.values(processedData.courseWorkload).map((course) => (
              <div key={course.code} className="p-6 rounded-lg border" style={{ borderColor: `${course.color}30` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: course.color }} />
                  <div>
                    <h4 className="font-semibold">{course.name}</h4>
                    <p className="text-sm opacity-75">{course.code}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${course.color}10` }}>
                    <div className="text-2xl font-bold">{course.totalHours.toFixed(1)}</div>
                    <div className="text-xs opacity-75">Total Hours</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${course.color}10` }}>
                    <div className="text-2xl font-bold">{course.sessions}</div>
                    <div className="text-xs opacity-75">Sessions</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${course.color}10` }}>
                    <div className="text-2xl font-bold">{course.priorities.high}</div>
                    <div className="text-xs opacity-75">High Priority</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${course.color}10` }}>
                    <div className="text-2xl font-bold">{course.efficiency.toFixed(0)}%</div>
                    <div className="text-xs opacity-75">Efficiency</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Learning Style Distribution:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(course.learningStyles).map(([style, count]) => (
                      <span
                        key={style}
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${course.color}20`,
                          color: course.color,
                        }}
                      >
                        {style}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Session Analysis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Session Analysis</h3>
        </div>
        {processedData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg border">
              <div className="text-3xl font-bold mb-2">{processedData.totalSessions}</div>
              <div className="text-sm font-medium mb-1">Total Sessions</div>
              <div className="text-xs opacity-75">Across all courses</div>
            </div>
            <div className="text-center p-6 rounded-lg border">
              <div className="text-3xl font-bold mb-2">{Math.round(processedData.averageSessionLength)}</div>
              <div className="text-sm font-medium mb-1">Avg. Session Length</div>
              <div className="text-xs opacity-75">Minutes per session</div>
            </div>
            <div className="text-center p-6 rounded-lg border">
              <div className="text-3xl font-bold mb-2">{Object.keys(processedData.learningStyleData).length}</div>
              <div className="text-sm font-medium mb-1">Learning Styles</div>
              <div className="text-xs opacity-75">Different methods used</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// Trends Analysis Component
function TrendsAnalysis({ processedData, theme }) {
  return (
    <div className="space-y-6">
      {/* Performance Trends */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Performance Trends</h3>
        </div>
        {processedData && (
          <LineChartSimple
            data={processedData.performanceTrends}
            theme={theme}
            title="Weekly Performance Progression"
          />
        )}
      </div>
      {/* Study Consistency Analysis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Study Consistency</h3>
        </div>
        {processedData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg" style={{ backgroundColor: `${theme.secondary}10` }}>
              <div className="text-3xl font-bold mb-2">
                {Object.entries(processedData.weeklyPattern).reduce((a, b) => (a[1] > b[1] ? a : b))[0]}
              </div>
              <div className="text-sm font-medium mb-1">Peak Day</div>
              <div className="text-xs opacity-75">Most productive day</div>
            </div>
            <div className="text-center p-6 rounded-lg" style={{ backgroundColor: `${theme.accent}10` }}>
              <div className="text-3xl font-bold mb-2">
                {(Object.values(processedData.weeklyPattern).reduce((a, b) => a + b, 0) / 7).toFixed(1)}h
              </div>
              <div className="text-sm font-medium mb-1">Daily Average</div>
              <div className="text-xs opacity-75">Hours per day</div>
            </div>
            <div className="text-center p-6 rounded-lg" style={{ backgroundColor: "#f59e0b10" }}>
              <div className="text-3xl font-bold mb-2">
                {Math.round(
                  (1 -
                    (Math.max(...Object.values(processedData.weeklyPattern)) -
                      Math.min(...Object.values(processedData.weeklyPattern))) /
                      Math.max(...Object.values(processedData.weeklyPattern))) *
                    100,
                )}
                %
              </div>
              <div className="text-sm font-medium mb-1">Consistency</div>
              <div className="text-xs opacity-75">Study regularity</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// Predictions Analysis Component
function PredictionsAnalysis({ performancePredictions, theme }) {
  return (
    <div className="space-y-6">
      {/* Performance Predictions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Performance Predictions</h3>
        </div>
        <div className="space-y-4">
          {performancePredictions.map((course, index) => (
            <div
              key={course.code}
              className="flex items-center justify-between p-6 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
              style={{ borderColor: `${course.color}30` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: course.color }} />
                <div>
                  <div className="font-semibold text-lg">{course.name}</div>
                  <div className="text-sm opacity-75 flex items-center gap-3">
                    <span>{course.code}</span>
                    <span>â€¢</span>
                    <span>{course.confidence}% confidence</span>
                    <span>â€¢</span>
                    <span
                      className={`flex items-center gap-1 ${
                        course.riskLevel === "high"
                          ? "text-red-600"
                          : course.riskLevel === "medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {course.riskLevel === "high" ? (
                        <XCircle className="w-3 h-3" />
                      ) : course.riskLevel === "medium" ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {course.riskLevel} risk
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-3xl font-bold flex items-center gap-2"
                  style={{
                    color:
                      course.predictedScore >= 80 ? "#10b981" : course.predictedScore >= 70 ? "#f59e0b" : "#ef4444",
                  }}
                >
                  {course.predictedScore}%
                  {course.trend === "up" ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="text-sm opacity-75">predicted grade</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Risk Assessment */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Risk Assessment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["high", "medium", "low"].map((riskLevel) => {
            const courses = performancePredictions.filter((c) => c.riskLevel === riskLevel)
            const color = riskLevel === "high" ? "#ef4444" : riskLevel === "medium" ? "#f59e0b" : "#10b981"
            return (
              <div key={riskLevel} className="p-4 rounded-lg border" style={{ borderColor: `${color}30` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold capitalize">{riskLevel} Risk</span>
                </div>
                <div className="text-2xl font-bold mb-2">{courses.length}</div>
                <div className="text-sm opacity-75">{courses.length === 1 ? "course" : "courses"}</div>
                {courses.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {courses.slice(0, 2).map((course) => (
                      <div key={course.code} className="text-xs opacity-75">
                        {course.code}: {course.predictedScore}%
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};
