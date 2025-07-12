"use client"
import { useState, useEffect, useMemo } from "react"
import { GraduationCap, Target, AlertTriangle, Brain, Clock, BookOpen, CheckCircle, XCircle, Zap } from "lucide-react"
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
interface SimpleCWAAnalysisProps {
  scheduleData: ScheduleSession[]
  userCourses: Course[]
  theme: Theme
}
// Simplified behavioral metrics
const behaviorData = {
  studyHours: 25, // hours per week
  scheduleFollowing: 78, // percentage
  taskCompletion: 85, // percentage
  procrastination: 35, // percentage (lower is better)
  focusLevel: 72, // percentage
  helpSeeking: 45, // percentage
}
// Simple CWA calculation
const calculateCWA = (data: typeof behaviorData) => {
  // Weighted calculation
  const studyScore = Math.min(data.studyHours / 30, 1) * 25 // Max 25 points
  const scheduleScore = (data.scheduleFollowing / 100) * 25 // Max 25 points
  const completionScore = (data.taskCompletion / 100) * 20 // Max 20 points
  const procrastinationScore = ((100 - data.procrastination) / 100) * 15 // Max 15 points
  const focusScore = (data.focusLevel / 100) * 15 // Max 15 points
  const totalScore = studyScore + scheduleScore + completionScore + procrastinationScore + focusScore
  return {
    cwaPercentage: Math.round(totalScore),
    gpa: Math.round((totalScore / 100) * 4 * 100) / 100,
    grade: totalScore >= 85 ? "A" : totalScore >= 75 ? "B" : totalScore >= 65 ? "C" : "D",
    confidence: 88,
  }
}
// Simple risk identification
const identifyRisks = (data: typeof behaviorData) => {
  const risks = []
  if (data.procrastination > 50) {
    risks.push({
      issue: "High Procrastination",
      impact: "May miss deadlines and reduce performance",
      solution: "Break tasks into smaller chunks, use timers",
      priority: "High",
    })
  }
  if (data.scheduleFollowing < 60) {
    risks.push({
      issue: "Poor Schedule Adherence",
      impact: "Inconsistent study patterns",
      solution: "Start with shorter, realistic study blocks",
      priority: "Medium",
    })
  }
  if (data.focusLevel < 60) {
    risks.push({
      issue: "Low Focus Level",
      impact: "Reduced learning efficiency",
      solution: "Remove distractions, use focus techniques",
      priority: "Medium",
    })
  }
  return risks
}
// Simple recommendations
const generateRecommendations = (data: typeof behaviorData) => {
  const recommendations = []
  if (data.procrastination > 40) {
    recommendations.push({
      title: "Reduce Procrastination",
      description: "Use the 2-minute rule and time-blocking",
      impact: "+0.4 GPA points",
      difficulty: "Medium",
      timeframe: "2-3 weeks",
    })
  }
  if (data.studyHours < 20) {
    recommendations.push({
      title: "Increase Study Time",
      description: "Gradually add 30 minutes per day",
      impact: "+0.3 GPA points",
      difficulty: "Easy",
      timeframe: "1 week",
    })
  }
  if (data.taskCompletion < 80) {
    recommendations.push({
      title: "Improve Task Completion",
      description: "Use daily task lists and track progress",
      impact: "+0.5 GPA points",
      difficulty: "Easy",
      timeframe: "1-2 weeks",
    })
  }
  if (data.helpSeeking < 50) {
    recommendations.push({
      title: "Seek Help More Often",
      description: "Attend office hours and join study groups",
      impact: "+0.2 GPA points",
      difficulty: "Easy",
      timeframe: "Ongoing",
    })
  }
  return recommendations
}
export default function SimpleCWAAnalysis({ scheduleData, userCourses, theme }: SimpleCWAAnalysisProps) {
  const [currentData, setCurrentData] = useState(behaviorData)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  // Calculate prediction
  const prediction = useMemo(() => calculateCWA(currentData), [currentData])
  const risks = useMemo(() => identifyRisks(currentData), [currentData])
  const recommendations = useMemo(() => generateRecommendations(currentData), [currentData])
  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentData((prev) => ({
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">CWA Prediction</h1>
              <p className="opacity-75">Your predicted academic performance based on study behavior</p>
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
        </div>
        {/* Main Prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CWA Score */}
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${theme.secondary}20` }}
            >
              <GraduationCap className="w-10 h-10" style={{ color: theme.secondary }} />
            </div>
            <div className="text-5xl font-bold mb-2" style={{ color: theme.secondary }}>
              {prediction.cwaPercentage}%
            </div>
            <div className="text-sm opacity-75 mb-4">Predicted CWA</div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{prediction.gpa}</div>
              <div className="text-sm opacity-75">GPA (4.0 scale)</div>
              <div className="text-xl font-bold mt-2">Grade: {prediction.grade}</div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <Target className="w-4 h-4" />
              <span>{prediction.confidence}% Confidence</span>
            </div>
          </div>
          {/* Current Behavior */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: theme.secondary }} />
              Your Study Behavior
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Study Hours/Week</span>
                  <span className="font-bold">{currentData.studyHours}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${Math.min((currentData.studyHours / 40) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Schedule Following</span>
                  <span className="font-bold">{currentData.scheduleFollowing}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${currentData.scheduleFollowing}%`,
                      backgroundColor: currentData.scheduleFollowing > 70 ? "#10b981" : "#f59e0b",
                    }}
                  />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Task Completion</span>
                  <span className="font-bold">{currentData.taskCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${currentData.taskCompletion}%`,
                      backgroundColor: currentData.taskCompletion > 80 ? "#10b981" : "#f59e0b",
                    }}
                  />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Focus Level</span>
                  <span className="font-bold">{currentData.focusLevel}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${currentData.focusLevel}%`,
                      backgroundColor: currentData.focusLevel > 70 ? "#10b981" : "#f59e0b",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Risk Factors */}
        {risks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold">Areas That Need Attention</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {risks.map((risk, index) => (
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
                      <h4 className="font-semibold mb-1">{risk.issue}</h4>
                      <p className="text-sm opacity-75 mb-2">{risk.impact}</p>
                      <p className="text-sm font-medium text-blue-600">ðŸ’¡ {risk.solution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Simple Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">Quick Improvements</h3>
            <span className="text-sm opacity-75">({recommendations.length} suggestions)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{rec.title}</h4>
                    <p className="text-sm opacity-75 mb-2">{rec.description}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.timeframe}
                      </span>
                      <span className="text-green-600 font-medium">{rec.impact}</span>
                    </div>
                  </div>
                  <button
                    className="px-3 py-1 rounded text-sm font-medium transition-colors"
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
        {/* Progress Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Your Strengths</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentData.taskCompletion > 80 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Great Task Completion</span>
                </div>
                <p className="text-sm text-green-700">You finish what you start - keep it up!</p>
              </div>
            )}
            {currentData.scheduleFollowing > 75 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Good Schedule Adherence</span>
                </div>
                <p className="text-sm text-green-700">You stick to your planned study times well.</p>
              </div>
            )}
            {currentData.studyHours > 20 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Adequate Study Time</span>
                </div>
                <p className="text-sm text-green-700">You put in good study hours each week.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
