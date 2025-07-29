import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Target,
  BookOpen,
  AlertTriangle,
  Brain,
  Activity,
  XCircle,
  MousePointer,
  Zap,
  GraduationCap,
} from "lucide-react";
// Behavioral tracking data structure
const behaviorMetrics = {
  systemUsage: {
    loginFrequency: 0.85, // How often they log in (0-1)
    sessionDuration: 45, // Average minutes per session
    featureUsage: 0.72, // How many features they use (0-1)
    consistencyScore: 0.68, // How consistent their usage is (0-1)
  },
  studyBehavior: {
    scheduleAdherence: 0.78, // How well they follow their schedule (0-1)
    planningAhead: 0.65, // How far in advance they plan (0-1)
    taskCompletion: 0.82, // Task completion rate (0-1)
    procrastinationIndex: 0.35, // Lower is better (0-1)
  },
  engagementPatterns: {
    peakProductivityHours: ["9-11 AM", "2-4 PM"],
    preferredStudyDuration: 90, // minutes
    breakFrequency: 0.75, // How often they take breaks (0-1)
    multitaskingTendency: 0.45, // Lower is better for focus (0-1)
  },
  academicBehavior: {
    difficultyPreference: 0.6, // Preference for challenging tasks (0-1)
    helpSeekingBehavior: 0.55, // How often they seek help (0-1)
    reviewFrequency: 0.7, // How often they review material (0-1)
    goalSetting: 0.8, // How well they set and track goals (0-1)
  },
}
// CWA Prediction Algorithm
const calculateCWAPrediction = (behaviorData, scheduleData) => {
  const weights = {
    systemUsage: 0.15,
    studyBehavior: 0.35,
    engagementPatterns: 0.25,
    academicBehavior: 0.25,
  }
  // Calculate component scores
  const systemScore =
    (behaviorData.systemUsage.loginFrequency * 0.2 +
      Math.min(behaviorData.systemUsage.sessionDuration / 60, 1) * 0.3 +
      behaviorData.systemUsage.featureUsage * 0.25 +
      behaviorData.systemUsage.consistencyScore * 0.25) *
    100
  const studyScore =
    (behaviorData.studyBehavior.scheduleAdherence * 0.3 +
      behaviorData.studyBehavior.planningAhead * 0.2 +
      behaviorData.studyBehavior.taskCompletion * 0.3 +
      (1 - behaviorData.studyBehavior.procrastinationIndex) * 0.2) *
    100
  const engagementScore =
    (Math.min(behaviorData.engagementPatterns.preferredStudyDuration / 120, 1) * 0.3 +
      behaviorData.engagementPatterns.breakFrequency * 0.3 +
      (1 - behaviorData.engagementPatterns.multitaskingTendency) * 0.4) *
    100
  const academicScore =
    (behaviorData.academicBehavior.difficultyPreference * 0.25 +
      behaviorData.academicBehavior.helpSeekingBehavior * 0.2 +
      behaviorData.academicBehavior.reviewFrequency * 0.3 +
      behaviorData.academicBehavior.goalSetting * 0.25) *
    100
  // Weighted final score
  const predictedCWA =
    (systemScore * weights.systemUsage +
      studyScore * weights.studyBehavior +
      engagementScore * weights.engagementPatterns +
      academicScore * weights.academicBehavior) /
    100
  // Convert to GPA scale (assuming 4.0 scale)
  const gpaScale = (predictedCWA / 100) * 4.0
  return {
    predictedCWA: Math.round(predictedCWA * 100) / 100,
    predictedGPA: Math.round(gpaScale * 100) / 100,
    confidence: Math.min(85 + (scheduleData?.length || 0) * 2, 95),
    componentScores: {
      systemUsage: Math.round(systemScore),
      studyBehavior: Math.round(studyScore),
      engagementPatterns: Math.round(engagementScore),
      academicBehavior: Math.round(academicScore),
    },
    riskFactors: identifyRiskFactors(behaviorData),
    recommendations: generateRecommendations(behaviorData),
  }
}
const identifyRiskFactors = (behaviorData) => {
  const risks = []
  if (behaviorData.systemUsage.loginFrequency < 0.5) {
    risks.push({
      factor: "Low System Engagement",
      severity: "high",
      impact: "May miss important updates and deadlines",
      suggestion: "Set daily login reminders",
    })
  }
  if (behaviorData.studyBehavior.procrastinationIndex > 0.6) {
    risks.push({
      factor: "High Procrastination",
      severity: "high",
      impact: "Likely to miss deadlines and perform poorly",
      suggestion: "Break tasks into smaller chunks and use time-blocking",
    })
  }
  if (behaviorData.studyBehavior.scheduleAdherence < 0.5) {
    risks.push({
      factor: "Poor Schedule Adherence",
      severity: "medium",
      impact: "Inconsistent study patterns may affect performance",
      suggestion: "Start with shorter, more achievable study blocks",
    })
  }
  if (behaviorData.engagementPatterns.multitaskingTendency > 0.7) {
    risks.push({
      factor: "High Multitasking",
      severity: "medium",
      impact: "Reduced focus and learning efficiency",
      suggestion: "Practice single-tasking and use focus techniques",
    })
  }
  return risks
}
const generateRecommendations = (behaviorData) => {
  const recommendations = []
  // SYSTEM USAGE RECOMMENDATIONS
  if (behaviorData.systemUsage.loginFrequency < 0.7) {
    recommendations.push({
      category: "System Engagement",
      title: "Establish Daily Check-in Routine",
      description: "Log in daily at the same time to stay updated with assignments and deadlines.",
      actionSteps: [
        "Set a daily reminder at 8 AM to check the system",
        "Spend 5-10 minutes reviewing today's tasks",
        "Check for new announcements or updates",
      ],
      priority: "high" ,
      expectedImpact: "+0.3 GPA points",
      timeToImplement: "1 week",
      difficultyLevel: "Easy",
    })
  }
  if (behaviorData.systemUsage.sessionDuration < 30) {
    recommendations.push({
      category: "System Engagement",
      title: "Increase Session Quality Time",
      description: "Spend more focused time in the system to better plan and organize your studies.",
      actionSteps: [
        "Block 20-30 minutes for planning sessions",
        "Use the system for detailed schedule creation",
        "Review and adjust your study plans weekly",
      ],
      priority: "medium" ,
      expectedImpact: "+0.2 GPA points",
      timeToImplement: "2 weeks",
      difficultyLevel: "Easy",
    })
  }
  if (behaviorData.studyBehavior.scheduleAdherence < 0.6) {
    recommendations.push({
      category: "Schedule Management",
      title: "Improve Schedule Adherence",
      description: "Following your planned schedule is crucial for consistent academic performance.",
      actionSteps: [
        "Start with shorter, 25-minute study blocks",
        "Use the Pomodoro Technique for better focus",
        "Track your adherence daily and celebrate small wins",
        "Adjust unrealistic time blocks to more manageable ones",
      ],
      priority: "high" ,
      expectedImpact: "+0.4 GPA points",
      timeToImplement: "3 weeks",
      difficultyLevel: "Medium",
    })
  }
  if (behaviorData.studyBehavior.procrastinationIndex > 0.5) {
    recommendations.push({
      category: "Procrastination Management",
      title: "Combat Procrastination Habits",
      description: "High procrastination is significantly impacting your predicted academic performance.",
      actionSteps: [
        "Use the '2-minute rule': If it takes less than 2 minutes, do it now",
        "Break large tasks into smaller, 15-minute chunks",
        "Use time-blocking to assign specific times for each task",
        "Remove distractions from your study environment",
        "Reward yourself after completing difficult tasks",
      ],
      priority: "high" ,
      expectedImpact: "+0.5 GPA points",
      timeToImplement: "4 weeks",
      difficultyLevel: "Hard",
    })
  }
  if (behaviorData.academicBehavior.reviewFrequency < 0.6) {
    recommendations.push({
      category: "Learning Optimization",
      title: "Implement Spaced Repetition System",
      description: "Regular review is the key to long-term retention and academic success.",
      actionSteps: [
        "Review new material within 24 hours",
        "Review again after 3 days, then 1 week, then 1 month",
        "Create flashcards for key concepts",
        "Use active recall instead of passive re-reading",
        "Schedule weekly review sessions for each subject",
      ],
      priority: "high" ,
      expectedImpact: "+0.45 GPA points",
      timeToImplement: "2 weeks",
      difficultyLevel: "Medium",
    })
  }
  // Sort recommendations by priority and expected impact
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    // If same priority, sort by expected impact
    const impactA = Number.parseFloat(a.expectedImpact.match(/\d+\.?\d*/)?.[0] || "0")
    const impactB = Number.parseFloat(b.expectedImpact.match(/\d+\.?\d*/)?.[0] || "0")
    return impactB - impactA
  })
}
export default function CWAPredictionPage({ scheduleData, userCourses, theme }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("current")
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [behaviorData, setBehaviorData] = useState(behaviorMetrics)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  // Calculate CWA prediction
  const prediction = useMemo(() => {
    return calculateCWAPrediction(behaviorData, scheduleData)
  }, [behaviorData, scheduleData])
  // Simulate behavior tracking updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBehaviorData((prev) => ({
        ...prev,
        systemUsage: {
          ...prev.systemUsage,
          loginFrequency: Math.min(prev.systemUsage.loginFrequency + 0.01, 1),
          sessionDuration: prev.systemUsage.sessionDuration + Math.random() * 2 - 1,
        },
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  const runAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => setIsAnalyzing(false), 3000)
  }
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">CWA Prediction Dashboard</h1>
              <p className="opacity-75 text-lg">
                Predicting your Cumulative Weighted Average based on system behavior and study patterns
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showDetailedAnalysis ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                {showDetailedAnalysis ? "Simple View" : "Detailed Analysis"}
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
                    Update Prediction
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Timeframe Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Prediction Timeframe:</span>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {[
                { id: "current", label: "Current Semester" },
                { id: "next", label: "Next Semester" },
                { id: "year", label: "Academic Year" },
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
        {/* Main Prediction Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CWA Prediction Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <div className="mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${theme.secondary}20` }}
                >
                  <GraduationCap className="w-10 h-10" style={{ color: theme.secondary }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Predicted CWA</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-5xl font-bold mb-2" style={{ color: theme.secondary }}>
                    {prediction.predictedCWA}%
                  </div>
                  <div className="text-sm opacity-75">Cumulative Weighted Average</div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-3xl font-bold mb-1">{prediction.predictedGPA}</div>
                  <div className="text-sm opacity-75">GPA (4.0 scale)</div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Target className="w-4 h-4" />
                    <span>{prediction.confidence}% Confidence</span>
                  </div>
                </div>
              </div>
              {/* Grade Indicator */}
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: `${theme.secondary}10` }}>
                <div className="text-sm font-medium mb-1">Predicted Grade</div>
                <div className="text-2xl font-bold">
                  {prediction.predictedGPA >= 3.7
                    ? "A"
                    : prediction.predictedGPA >= 3.3
                      ? "B+"
                      : prediction.predictedGPA >= 3.0
                        ? "B"
                        : prediction.predictedGPA >= 2.7
                          ? "C+"
                          : prediction.predictedGPA >= 2.0
                            ? "C"
                            : "D"}
                </div>
              </div>
            </div>
          </div>
          {/* Behavior Analysis */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5" style={{ color: theme.secondary }} />
                <h3 className="text-lg font-semibold">Behavioral Analysis Components</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(prediction.componentScores).map(([component, score]) => {
                  const icons = {
                    systemUsage: MousePointer,
                    studyBehavior: BookOpen,
                    engagementPatterns: Activity,
                    academicBehavior: Brain,
                  }
                  const Icon = icons[component]
                  const labels = {
                    systemUsage: "System Usage",
                    studyBehavior: "Study Behavior",
                    engagementPatterns: "Engagement Patterns",
                    academicBehavior: "Academic Behavior",
                  }
                  return (
                    <div key={component} className="p-4 rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${theme.secondary}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: theme.secondary }} />
                        </div>
                        <div>
                          <div className="font-semibold">{labels[component]}</div>
                          <div className="text-sm opacity-75">{score}/100</div>
                        </div>
                      </div>
                      {/* Progress Bar */}
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
                      <div className="mt-2 text-xs opacity-75">
                        {score >= 80
                          ? "Excellent"
                          : score >= 60
                            ? "Good"
                            : score >= 40
                              ? "Needs Improvement"
                              : "Critical"}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Risk Factors */}
        {prediction.riskFactors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold">Risk Factors</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prediction.riskFactors.map((risk, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-l-4"
                  style={{
                    backgroundColor: risk.severity === "high" ? "#fef2f2" : "#fffbeb",
                    borderLeftColor: risk.severity === "high" ? "#ef4444" : "#f59e0b",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {risk.severity === "high" ? (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{risk.factor}</h4>
                      <p className="text-sm opacity-75 mb-2">{risk.impact}</p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: risk.severity === "high" ? "#dc2626" : "#d97706" }}
                      >
                        ðŸ’¡ {risk.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">Personalized Action Plan</h3>
            <span className="text-sm opacity-75">({prediction.recommendations.length} recommendations)</span>
          </div>
          <div className="space-y-6">
            {prediction.recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
                style={{ borderColor: `${theme.secondary}30` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor:
                            rec.priority === "high" ? "#fef2f2" : rec.priority === "medium" ? "#fffbeb" : "#f0fdf4",
                          color:
                            rec.priority === "high" ? "#dc2626" : rec.priority === "medium" ? "#d97706" : "#16a34a",
                        }}
                      >
                        {rec.priority} priority
                      </span>
                      <span className="text-sm opacity-75 font-medium">{rec.category}</span>
                      <span className="text-xs opacity-50">â€¢</span>
                      <span className="text-xs opacity-75">{rec.difficultyLevel}</span>
                    </div>
                    <h4 className="font-bold text-lg mb-2">{rec.title}</h4>
                    <p className="text-sm opacity-75 mb-4">{rec.description}</p>
                    {/* Action Steps */}
                    <div className="mb-4">
                      <h5 className="font-semibold text-sm mb-2">ðŸ“‹ Action Steps:</h5>
                      <ul className="space-y-1">
                        {rec.actionSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="text-sm opacity-75 flex items-start gap-2">
                            <span className="text-xs mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Implementation Timeline */}
                    <div className="flex items-center gap-4 text-xs opacity-75">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Timeline: {rec.timeToImplement}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>Difficulty: {rec.difficultyLevel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-lg font-bold text-green-600 mb-1">{rec.expectedImpact}</div>
                    <div className="text-xs opacity-75 mb-2">potential gain</div>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: `${theme.secondary}20`,
                        color: theme.secondary,
                      }}
                    >
                      Start Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Quick Implementation Guide */}
          <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: `${theme.secondary}10` }}>
            <h4 className="font-semibold mb-3">ðŸš€ Quick Start Guide</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium mb-1">This Week</div>
                <div className="opacity-75">
                  Focus on{" "}
                  {
                    prediction.recommendations.filter(
                      (r) => r.timeToImplement.includes("week") && Number.parseInt(r.timeToImplement) === 1,
                    ).length
                  }{" "}
                  easy wins
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">This Month</div>
                <div className="opacity-75">
                  Implement {prediction.recommendations.filter((r) => r.priority === "high").length} high-priority
                  changes
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">This Semester</div>
                <div className="opacity-75">
                  Potential GPA improvement: +
                  {prediction.recommendations
                    .reduce((sum, r) => sum + Number.parseFloat(r.expectedImpact.match(/\d+\.?\d*/)?.[0] || "0"), 0)
                    .toFixed(1)}{" "}
                  points
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Detailed Analysis (if enabled) */}
        {showDetailedAnalysis && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5" style={{ color: theme.secondary }} />
              <h3 className="text-lg font-semibold">Detailed Behavior Analysis</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Schedule Adherence</h4>
                <div className="text-2xl font-bold">{(behaviorData.studyBehavior.scheduleAdherence * 100).toFixed(0)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${behaviorData.studyBehavior.scheduleAdherence * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Procrastination Level</h4>
                <div className="text-2xl font-bold">{(behaviorData.studyBehavior.procrastinationIndex * 100).toFixed(0)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${behaviorData.studyBehavior.procrastinationIndex * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// Detailed Behavior Analysis Component
function DetailedBehaviorAnalysis({ behaviorData, theme, prediction }) {
  return (
    <div className="space-y-6">
      {/* System Usage Patterns */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <MousePointer className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">System Usage Patterns</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg border">
            <div className="text-2xl font-bold mb-1">{(behaviorData.systemUsage.loginFrequency * 100).toFixed(0)}%</div>
            <div className="text-sm font-medium mb-1">Login Frequency</div>
            <div className="text-xs opacity-75">Daily engagement rate</div>
          </div>
          <div className="text-center p-4 rounded-lg border">
            <div className="text-2xl font-bold mb-1">{behaviorData.systemUsage.sessionDuration.toFixed(0)}m</div>
            <div className="text-sm font-medium mb-1">Session Duration</div>
            <div className="text-xs opacity-75">Average time per session</div>
          </div>
          <div className="text-center p-4 rounded-lg border">
            <div className="text-2xl font-bold mb-1">{(behaviorData.systemUsage.featureUsage * 100).toFixed(0)}%</div>
            <div className="text-sm font-medium mb-1">Feature Usage</div>
            <div className="text-xs opacity-75">Platform utilization</div>
          </div>
          <div className="text-center p-4 rounded-lg border">
            <div className="text-2xl font-bold mb-1">
              {(behaviorData.systemUsage.consistencyScore * 100).toFixed(0)}%
            </div>
            <div className="text-sm font-medium mb-1">Consistency</div>
            <div className="text-xs opacity-75">Usage regularity</div>
          </div>
        </div>
      </div>
      {/* Study Behavior Analysis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Study Behavior Analysis</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Schedule Adherence</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Rate:</span>
                <span className="font-bold">{(behaviorData.studyBehavior.scheduleAdherence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${behaviorData.studyBehavior.scheduleAdherence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Procrastination Index</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Level:</span>
                <span className="font-bold">{(behaviorData.studyBehavior.procrastinationIndex * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${behaviorData.studyBehavior.procrastinationIndex * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Personalized Recommendations</h3>
        </div>
        <div className="space-y-4">
          {prediction.recommendations.map((rec, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{rec.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm opacity-75 mb-3">{rec.description}</p>
              <div className="space-y-2">
                {rec.actionSteps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-start gap-2 text-sm">
                    <span className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-500">Expected Impact: {rec.expectedImpact}</span>
                <span className="text-gray-500">Difficulty: {rec.difficultyLevel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
