"use client"
import { useState, useMemo } from "react"
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
  Zap,
  Users,
  Eye,
  Headphones,
  Hand,
  Download,
  RefreshCw,
} from "lucide-react"
// Chart components (simplified for demo)
const BarChart = ({ data, theme }) => (
  <div className="space-y-2">
    {data.map((item, index) => (
      <div key={index} className="flex items-center gap-3">
        <div className="w-20 text-sm font-medium truncate">{item.name}</div>
        <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${(item.value / Math.max(...data.map((d) => d.value))) * 100}%`,
              backgroundColor: item.color || theme.secondary,
            }}
          />
        </div>
        <div className="w-12 text-sm text-right">{item.value}h</div>
      </div>
    ))}
  </div>
)
const PieChartSimple = ({ data, theme }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const angle = (percentage / 100) * 360
            const startAngle = currentAngle
            currentAngle += angle
            const x1 = 64 + 50 * Math.cos((startAngle * Math.PI) / 180)
            const y1 = 64 + 50 * Math.sin((startAngle * Math.PI) / 180)
            const x2 = 64 + 50 * Math.cos(((startAngle + angle) * Math.PI) / 180)
            const y2 = 64 + 50 * Math.sin(((startAngle + angle) * Math.PI) / 180)
            const largeArcFlag = angle > 180 ? 1 : 0
            return (
              <path
                key={index}
                d={`M 64 64 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={item.color || theme.secondary}
                opacity={0.8}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
export default function CWAnalysisPage({ scheduleData, userCourses, theme }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("week") // week, month, semester
  const [selectedMetric, setSelectedMetric] = useState("workload") // workload, performance, efficiency
  const [analysisData, setAnalysisData] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  // Process schedule data for analysis
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
        }
      }
      acc[courseKey].totalHours += session.duration / 60
      acc[courseKey].sessions += 1
      acc[courseKey].priorities[session.priority] += 1
      if (!acc[courseKey].learningStyles[session.learningStyle]) {
        acc[courseKey].learningStyles[session.learningStyle] = 0
      }
      acc[courseKey].learningStyles[session.learningStyle] += 1
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
        }
      }
      acc[session.learningStyle].sessions += 1
      acc[session.learningStyle].totalHours += session.duration / 60
      if (session.priority === "high") {
        acc[session.learningStyle].highPriority += 1
      }
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
    return {
      courseWorkload,
      timeDistribution,
      learningStyleData,
      weeklyPattern,
      totalHours: scheduleData.reduce((sum, session) => sum + session.duration / 60, 0),
      totalSessions: scheduleData.length,
      highPrioritySessions: scheduleData.filter((s) => s.priority === "high").length,
    }
  }, [scheduleData])
  // Generate insights and recommendations
  const generateInsights = () => {
    if (!processedData) return []
    const insights = []
    // Workload balance insight
    const workloadValues = Object.values(processedData.courseWorkload).map((c) => c.totalHours)
    const maxWorkload = Math.max(...workloadValues)
    const minWorkload = Math.min(...workloadValues)
    const workloadImbalance = maxWorkload - minWorkload
    if (workloadImbalance > 5) {
      insights.push({
        type: "warning",
        title: "Workload Imbalance Detected",
        description: `There's a ${workloadImbalance.toFixed(1)} hour difference between your most and least studied courses.`,
        recommendation: "Consider redistributing study time for better balance.",
        icon: AlertTriangle,
        color: "#f59e0b",
      })
    }
    // High priority concentration
    const highPriorityRatio = processedData.highPrioritySessions / processedData.totalSessions
    if (highPriorityRatio > 0.6) {
      insights.push({
        type: "info",
        title: "High Priority Focus",
        description: `${(highPriorityRatio * 100).toFixed(0)}% of your sessions are high priority.`,
        recommendation: "Great focus on important tasks Consider scheduling some review sessions.",
        icon: Target,
        color: "#10b981",
      })
    }
    // Learning style diversity
    const learningStyleCount = Object.keys(processedData.learningStyleData).length
    if (learningStyleCount >= 4) {
      insights.push({
        type: "success",
        title: "Diverse Learning Approach",
        description: `You're using ${learningStyleCount} different learning styles.`,
        recommendation: "Excellent variety This enhances retention and understanding.",
        icon: Brain,
        color: "#8b5cf6",
      })
    }
    // Study time optimization
    const peakHours = Object.entries(processedData.timeDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([period]) => period)
    insights.push({
      type: "info",
      title: "Peak Study Times",
      description: `Your most productive periods are ${peakHours.join(" and ")}.`,
      recommendation: "Schedule your most challenging subjects during these times.",
      icon: Clock,
      color: "#3b82f6",
    })
    return insights
  }
  const insights = generateInsights()
  // Performance predictions (mock data for demo)
  const performancePredictions = useMemo(() => {
    if (!processedData) return []
    return Object.values(processedData.courseWorkload)
      .map((course) => {
        const baseScore = 70
        const workloadBonus = Math.min(course.totalHours * 2, 20)
        const priorityBonus = (course.priorities.high / course.sessions) * 10
        const diversityBonus = Object.keys(course.learningStyles).length * 2
        const predictedScore = Math.min(baseScore + workloadBonus + priorityBonus + diversityBonus, 100)
        return {
          ...course,
          predictedScore: Math.round(predictedScore),
          confidence: Math.min(85 + course.sessions * 2, 95),
        }
      })
      .sort((a, b) => b.predictedScore - a.predictedScore)
  }, [processedData])
  const runAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setAnalysisData(processedData)
      setIsAnalyzing(false)
    }, 2000)
  }
  if (!scheduleData || scheduleData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${theme.secondary}20` }}
          >
            <BarChart3 className="w-12 h-12" style={{ color: theme.secondary }} />
          </div>
          <h2 className="text-2xl font-bold mb-4">No Schedule Data Available</h2>
          <p className="opacity-75 mb-8">
            Generate a study schedule first to see your CW analysis and performance insights.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CW Analysis</h1>
            <p className="opacity-75 mt-1">Comprehensive analysis of your study patterns and performance predictions</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: theme.surface,
                borderColor: `${theme.primary}30`,
                color: theme.text,
              }}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
            </select>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
              style={{
                backgroundColor: theme.secondary,
                color: "white",
              }}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </button>
          </div>
        </div>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Study Hours",
              value: processedData?.totalHours.toFixed(1) || "0",
              icon: Clock,
              color: theme.secondary,
              suffix: "hrs",
            },
            {
              label: "Active Courses",
              value: Object.keys(processedData?.courseWorkload || {}).length,
              icon: BookOpen,
              color: "#10b981",
              suffix: "courses",
            },
            {
              label: "High Priority Tasks",
              value: processedData?.highPrioritySessions || 0,
              icon: Target,
              color: "#f59e0b",
              suffix: "tasks",
            },
            {
              label: "Learning Styles",
              value: Object.keys(processedData?.learningStyleData || {}).length,
              icon: Brain,
              color: "#8b5cf6",
              suffix: "styles",
            },
          ].map((metric, index) => (
            <div
              key={index}
              className="p-6 rounded-xl shadow-sm border"
              style={{
                backgroundColor: theme.surface,
                borderColor: `${theme.primary}10`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}20` }}
                >
                  <metric.icon className="w-6 h-6" style={{ color: metric.color }} />
                </div>
                <TrendingUp className="w-4 h-4 opacity-50" />
              </div>
              <div className="text-2xl font-bold mb-1">{metric.value}</div>
              <div className="text-sm opacity-75">{metric.label}</div>
            </div>
          ))}
        </div>
        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Workload Distribution */}
          <div
            className="p-6 rounded-xl shadow-sm border"
            style={{
              backgroundColor: theme.surface,
              borderColor: `${theme.primary}10`,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5" style={{ color: theme.secondary }} />
              <h3 className="text-lg font-semibold">Course Workload Distribution</h3>
            </div>
            {processedData && (
              <BarChart
                data={Object.values(processedData.courseWorkload).map((course) => ({
                  name: course.code,
                  value: course.totalHours,
                  color: course.color,
                }))}
                theme={theme}
              />
            )}
          </div>
          {/* Time Distribution */}
          <div
            className="p-6 rounded-xl shadow-sm border"
            style={{
              backgroundColor: theme.surface,
              borderColor: `${theme.primary}10`,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5" style={{ color: theme.secondary }} />
              <h3 className="text-lg font-semibold">Study Time Distribution</h3>
            </div>
            {processedData && (
              <div className="flex items-center justify-between">
                <PieChartSimple
                  data={Object.entries(processedData.timeDistribution).map(([period, hours]) => ({
                    name: period,
                    value: hours,
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
                <div className="space-y-2">
                  {Object.entries(processedData.timeDistribution).map(([period, hours]) => (
                    <div key={period} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: {
                            "Early Morning": "#f59e0b",
                            Morning: "#10b981",
                            Afternoon: "#3b82f6",
                            Evening: "#8b5cf6",
                            Night: "#6b7280",
                          }[period],
                        }}
                      />
                      <span>
                        {period}: {hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Learning Style Analysis */}
          <div
            className="p-6 rounded-xl shadow-sm border"
            style={{
              backgroundColor: theme.surface,
              borderColor: `${theme.primary}10`,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-5 h-5" style={{ color: theme.secondary }} />
              <h3 className="text-lg font-semibold">Learning Style Effectiveness</h3>
            </div>
            {processedData && (
              <div className="space-y-4">
                {Object.entries(processedData.learningStyleData).map(([style, data]) => {
                  const effectiveness = (data.highPriority / data.sessions) * 100
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
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: `${theme.primary}05` }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" style={{ color: theme.secondary }} />
                        <div>
                          <div className="font-medium capitalize">{style}</div>
                          <div className="text-sm opacity-75">
                            {data.sessions} sessions â€¢ {data.totalHours.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{effectiveness.toFixed(0)}%</div>
                        <div className="text-xs opacity-75">effectiveness</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {/* Performance Predictions */}
          <div
            className="p-6 rounded-xl shadow-sm border"
            style={{
              backgroundColor: theme.surface,
              borderColor: `${theme.primary}10`,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-5 h-5" style={{ color: theme.secondary }} />
              <h3 className="text-lg font-semibold">Performance Predictions</h3>
            </div>
            <div className="space-y-4">
              {performancePredictions.map((course, index) => (
                <div
                  key={course.code}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  style={{ borderColor: `${course.color}30` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                    <div>
                      <div className="font-medium">{course.name}</div>
                      <div className="text-sm opacity-75">
                        {course.code} â€¢ {course.confidence}% confidence
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold"
                      style={{
                        color:
                          course.predictedScore >= 80 ? "#10b981" : course.predictedScore >= 70 ? "#f59e0b" : "#ef4444",
                      }}
                    >
                      {course.predictedScore}%
                    </div>
                    <div className="text-xs opacity-75">predicted</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Insights and Recommendations */}
        <div
          className="p-6 rounded-xl shadow-sm border"
          style={{
            backgroundColor: theme.surface,
            borderColor: `${theme.primary}10`,
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">AI Insights & Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-l-4 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${insight.color}10`,
                  borderLeftColor: insight.color,
                }}
              >
                <div className="flex items-start gap-3">
                  <insight.icon className="w-5 h-5 mt-0.5" style={{ color: insight.color }} />
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
        {/* Weekly Pattern */}
        <div
          className="p-6 rounded-xl shadow-sm border"
          style={{
            backgroundColor: theme.surface,
            borderColor: `${theme.primary}10`,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" style={{ color: theme.secondary }} />
              <h3 className="text-lg font-semibold">Weekly Study Pattern</h3>
            </div>
            <button
              className="px-3 py-1 rounded-lg text-sm transition-all duration-200 hover:scale-105 flex items-center gap-2"
              style={{
                backgroundColor: `${theme.secondary}20`,
                color: theme.secondary,
              }}
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
          {processedData && (
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(processedData.weeklyPattern).map(([day, hours]) => {
                const maxHours = Math.max(...Object.values(processedData.weeklyPattern))
                const intensity = hours / maxHours
                return (
                  <div key={day} className="text-center">
                    <div className="text-xs font-medium mb-2">{day.slice(0, 3)}</div>
                    <div
                      className="w-full rounded-lg transition-all duration-300 hover:scale-105"
                      style={{
                        height: `${Math.max(intensity * 100, 10)}px`,
                        backgroundColor: theme.secondary,
                        opacity: 0.3 + intensity * 0.7,
                      }}
                    />
                    <div className="text-xs mt-2 opacity-75">{hours.toFixed(1)}h</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
