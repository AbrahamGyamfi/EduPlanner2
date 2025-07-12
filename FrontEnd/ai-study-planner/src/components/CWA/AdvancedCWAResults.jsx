/**
 * Advanced CWA Analysis Results Display Component
 * 
 * This component displays the comprehensive results from the Advanced CWA Analyzer
 * including current/projected CWA, recommendations, and personalized study schedule.
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  BookOpen, 
  Calendar,
  Award,
  BarChart3,
  Lightbulb,
  User,
  Timer,
  Star,
  AlertCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

const AdvancedCWAResults = ({ analysisResults, onRefresh, isRefreshing }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    immediate: true,
    shortTerm: false,
    longTerm: false,
    strategies: false,
    schedule: false
  });

  if (!analysisResults) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Analysis Results
          </h3>
          <p className="text-gray-500 mb-4">
            Run an analysis to see your comprehensive CWA insights
          </p>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Analyzing...' : 'Start Analysis'}
          </button>
        </div>
      </div>
    );
  }

  const { currentCWA, projectedCWA, performanceTrend, recommendations, studySchedule } = analysisResults;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceLevelColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'satisfactory': return 'text-yellow-600 bg-yellow-50';
      case 'at_risk': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* CWA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current CWA */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800">Current CWA</h3>
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-2">
            {currentCWA.cwa.toFixed(2)}%
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceLevelColor(currentCWA.academicStanding.level)}`}>
              {currentCWA.academicStanding.level}
            </span>
          </div>
          <p className="text-blue-700 text-sm mt-2">
            {currentCWA.academicStanding.description}
          </p>
        </div>

        {/* Projected CWA */}
        <div className={`rounded-lg p-6 ${
          projectedCWA.changeDirection === 'improving' 
            ? 'bg-gradient-to-br from-green-50 to-green-100' 
            : projectedCWA.changeDirection === 'declining'
            ? 'bg-gradient-to-br from-red-50 to-red-100'
            : 'bg-gradient-to-br from-gray-50 to-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${
              projectedCWA.changeDirection === 'improving' ? 'text-green-800' :
              projectedCWA.changeDirection === 'declining' ? 'text-red-800' : 'text-gray-800'
            }`}>
              Projected CWA
            </h3>
            {projectedCWA.changeDirection === 'improving' ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : projectedCWA.changeDirection === 'declining' ? (
              <TrendingDown className="w-6 h-6 text-red-600" />
            ) : (
              <BarChart3 className="w-6 h-6 text-gray-600" />
            )}
          </div>
          <div className={`text-3xl font-bold mb-2 ${
            projectedCWA.changeDirection === 'improving' ? 'text-green-900' :
            projectedCWA.changeDirection === 'declining' ? 'text-red-900' : 'text-gray-900'
          }`}>
            {projectedCWA.projected.toFixed(2)}%
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-sm font-medium ${
              projectedCWA.change > 0 ? 'text-green-600' :
              projectedCWA.change < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {projectedCWA.change > 0 ? '+' : ''}{projectedCWA.change.toFixed(1)} points
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Confidence: {projectedCWA.confidenceInterval.confidence}%
          </div>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Performance Trend Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {performanceTrend.overall.direction}
            </div>
            <div className="text-sm text-gray-600">Overall Direction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {performanceTrend.overall.momentum}
            </div>
            <div className="text-sm text-gray-600">Momentum</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {performanceTrend.riskFactors.length}
            </div>
            <div className="text-sm text-gray-600">Risk Factors</div>
          </div>
        </div>
        <p className="text-gray-700">{performanceTrend.overall.description}</p>
      </div>

      {/* Course Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Course Performance Breakdown
        </h3>
        <div className="space-y-3">
          {currentCWA.courseBreakdown.map((course, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{course.courseName}</div>
                <div className="text-sm text-gray-600">
                  {course.creditHours} credit hours • {course.assignmentsCompleted}/{course.totalAssignments} assignments
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceLevelColor(course.performanceLevel)}`}>
                  {course.performanceLevel}
                </span>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{course.averageScore.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600">{course.trend}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Immediate Actions Required
        </h3>
        <div className="space-y-3">
          {recommendations.immediate.slice(0, 3).map((rec, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
              <div className="font-medium mb-1">{rec.title}</div>
              <div className="text-sm">{rec.description}</div>
              <div className="text-xs mt-2 opacity-75">
                Timeframe: {rec.timeframe} • Impact: {rec.impact}
              </div>
            </div>
          ))}
        </div>
        {recommendations.immediate.length > 3 && (
          <button
            onClick={() => setActiveTab('recommendations')}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            View all {recommendations.immediate.length} immediate actions
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="space-y-6">
      {/* Immediate Actions */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('immediate')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-red-600 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Immediate Actions ({recommendations.immediate.length})
          </h3>
          {expandedSections.immediate ? 
            <ChevronDown className="w-5 h-5" /> : 
            <ChevronRight className="w-5 h-5" />
          }
        </button>
        {expandedSections.immediate && (
          <div className="px-4 pb-4 space-y-3">
            {recommendations.immediate.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <span className="text-xs px-2 py-1 bg-white rounded-full">{rec.priority}</span>
                </div>
                <p className="text-sm mb-3">{rec.description}</p>
                <div className="space-y-1 mb-3">
                  {rec.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex items-start text-sm">
                      <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 opacity-60" />
                      {action}
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span>⏱️ {rec.timeframe}</span>
                  <span>📈 {rec.impact} impact</span>
                  <span>💪 {rec.effort} effort</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Short-term Goals */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('shortTerm')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-orange-600 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Short-term Goals ({recommendations.shortTerm.length})
          </h3>
          {expandedSections.shortTerm ? 
            <ChevronDown className="w-5 h-5" /> : 
            <ChevronRight className="w-5 h-5" />
          }
        </button>
        {expandedSections.shortTerm && (
          <div className="px-4 pb-4 space-y-3">
            {recommendations.shortTerm.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <span className="text-xs px-2 py-1 bg-white rounded-full">{rec.priority}</span>
                </div>
                <p className="text-sm mb-3">{rec.description}</p>
                {rec.targetValue && rec.currentValue && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{rec.currentValue} → {rec.targetValue}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(rec.currentValue / rec.targetValue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <div className="space-y-1 mb-3">
                  {rec.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex items-start text-sm">
                      <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 opacity-60" />
                      {action}
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span>⏱️ {rec.timeframe}</span>
                  <span>📈 {rec.impact} impact</span>
                  <span>💪 {rec.effort} effort</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study Strategies */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('strategies')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-blue-600 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Study Strategies ({recommendations.studyStrategies.length})
          </h3>
          {expandedSections.strategies ? 
            <ChevronDown className="w-5 h-5" /> : 
            <ChevronRight className="w-5 h-5" />
          }
        </button>
        {expandedSections.strategies && (
          <div className="px-4 pb-4 space-y-3">
            {recommendations.studyStrategies.map((strategy, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(strategy.priority)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{strategy.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-yellow-600">
                      {(strategy.effectiveness * 100).toFixed(0)}% effective
                    </span>
                    <span className="text-xs px-2 py-1 bg-white rounded-full">{strategy.priority}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                
                <div className="mb-3">
                  <h5 className="font-medium text-sm mb-2">Instructions:</h5>
                  <div className="space-y-1">
                    {strategy.instructions.map((instruction, instructionIndex) => (
                      <div key={instructionIndex} className="flex items-start text-sm">
                        <span className="text-blue-500 mr-2">{instructionIndex + 1}.</span>
                        {instruction}
                      </div>
                    ))}
                  </div>
                </div>

                {strategy.implementationTips && strategy.implementationTips.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-sm mb-2">Implementation Tips:</h5>
                    <div className="space-y-1">
                      {strategy.implementationTips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="flex items-start text-sm text-gray-600">
                          <Star className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0 text-yellow-500" />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {strategy.bestCourses && strategy.bestCourses.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Best for: {strategy.bestCourses.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div className="space-y-6">
      {/* Schedule Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Personalized Study Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-800">
              {studySchedule.summary.totalWeeklyHours}h
            </div>
            <div className="text-sm text-purple-600">Weekly Study Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-800">
              {studySchedule.preferredTimes.length}
            </div>
            <div className="text-sm text-purple-600">Preferred Time Slots</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-800">
              {studySchedule.focusAreas.length}
            </div>
            <div className="text-sm text-purple-600">Focus Areas</div>
          </div>
        </div>
      </div>

      {/* Preferred Study Times */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Your Optimal Study Times
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studySchedule.preferredTimes.map((timeSlot, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-semibold text-blue-800 mb-1">{timeSlot.name}</div>
              <div className="text-sm text-blue-600 mb-2">{timeSlot.timeRange}</div>
              <div className="text-xs text-gray-600">
                Energy: {timeSlot.energyLevel} • Best for: {timeSlot.bestFor?.join(', ')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Reason: {timeSlot.reason}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Schedule */}
      {studySchedule.weeklySchedule && studySchedule.weeklySchedule.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Weekly Study Schedule
          </h3>
          <div className="space-y-4">
            {studySchedule.weeklySchedule.map((day, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{day.day}</h4>
                  <span className="text-sm text-gray-600">{day.totalHours}h total</span>
                </div>
                {day.sessions && day.sessions.length > 0 ? (
                  <div className="space-y-2">
                    {day.sessions.map((session, sessionIndex) => (
                      <div key={sessionIndex} className="p-3 bg-gray-50 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">{session.course}</span>
                          <span className="text-sm text-gray-600">{session.timeRange}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          Focus: {session.focusArea} • Duration: {session.duration}h
                        </div>
                        {session.activities && (
                          <div className="text-xs text-gray-500">
                            Activities: {session.activities.map(a => a.activity).join(' → ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No sessions scheduled</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Focus Areas */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Study Focus Areas
        </h3>
        <div className="space-y-3">
          {studySchedule.focusAreas.map((area, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(area.priority)}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{area.area}</h4>
                <span className="text-sm">{area.timeAllocation}</span>
              </div>
              {area.courses && (
                <div className="text-sm text-gray-600">
                  Courses: {area.courses.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'schedule', label: 'Study Schedule', icon: Calendar }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Advanced CWA Analysis Results
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-white text-sm">
              Last updated: {new Date(analysisResults.timestamp).toLocaleString()}
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 disabled:opacity-50 transition-colors"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
      </div>
    </div>
  );
};

export default AdvancedCWAResults;
