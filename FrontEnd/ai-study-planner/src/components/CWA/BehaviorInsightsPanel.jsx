import React from 'react';
import { Brain, Calendar, Clock, Target, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';

const BehaviorInsightsPanel = ({ metrics, sessions }) => {
  // Provide default values if metrics is undefined
  const safeMetrics = {
    plannerUsage: 0,
    studyConsistency: 0,
    deadlineAdherence: 0,
    procrastinationLevel: 5,
    ...metrics
  };

  const getBehaviorTag = () => {
    const { plannerUsage, studyConsistency, deadlineAdherence } = safeMetrics;
    const average = (plannerUsage + studyConsistency + deadlineAdherence) / 3;

    if (average >= 80) return { label: 'Highly Motivated', color: 'green', bg: 'bg-green-50', text: 'text-green-700' };
    if (average >= 60) return { label: 'Active Learner', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700' };
    if (average >= 40) return { label: 'Developing Habits', color: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-700' };
    return { label: 'Needs Improvement', color: 'red', bg: 'bg-red-50', text: 'text-red-700' };
  };

  const getMetricColor = (value) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricBgColor = (value) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMetricIcon = (value) => {
    if (value >= 60) return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const behaviorTag = getBehaviorTag();
  const totalSessions = sessions?.length || 0;
  const avgScore = safeMetrics.plannerUsage + safeMetrics.studyConsistency + safeMetrics.deadlineAdherence;

  const insights = [
    {
      icon: Calendar,
      label: 'Planner Usage',
      message: safeMetrics.plannerUsage >= 70 
        ? "You've been consistently using your planner - great work!"
        : "Try to check your planner more regularly for better organization.",
      metric: safeMetrics.plannerUsage
    },
    {
      icon: Clock,
      label: 'Study Consistency',
      message: safeMetrics.studyConsistency >= 70
        ? "Your study patterns show excellent consistency!"
        : "Consider establishing a more regular study schedule.",
      metric: safeMetrics.studyConsistency
    },
    {
      icon: Target,
      label: 'Deadline Adherence',
      message: safeMetrics.deadlineAdherence >= 70
        ? "You're meeting deadlines effectively - keep it up!"
        : "Work on starting assignments earlier to meet deadlines better.",
      metric: safeMetrics.deadlineAdherence
    }
  ];

  if (avgScore === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg mr-3">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Behavior Insights</h3>
        </div>
        
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            Start using EduMaster features to see your behavior insights here.
          </p>
          <div className="mt-4 text-xs text-gray-400">
            Your study patterns, planner usage, and productivity metrics will appear here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg mr-3">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Behavior Insights</h3>
        </div>
        
        <div className={`px-3 py-1 rounded-full ${behaviorTag.bg} ${behaviorTag.text} text-xs font-medium`}>
          {behaviorTag.label}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="space-y-4 mb-6">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getMetricColor(insight.metric)}`}>
                <insight.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{insight.label}</div>
                <div className="text-xs text-gray-600">{insight.metric.toFixed(0)}%</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getMetricBgColor(insight.metric)}`}
                  style={{ width: `${Math.min(100, insight.metric)}%` }}
                ></div>
              </div>
              <div className={getMetricColor(insight.metric)}>
                {getMetricIcon(insight.metric)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{totalSessions}</div>
          <div className="text-xs text-gray-500">Study Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">
            {safeMetrics.procrastinationLevel.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">Procrastination Level</div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center text-blue-700">
          <TrendingUp className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Weekly Trend</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          {behaviorTag.label === 'Highly Motivated' || behaviorTag.label === 'Active Learner' 
            ? 'Your behavior patterns are supporting academic success!' 
            : 'Consider implementing the study recommendations to improve your patterns.'}
        </p>
      </div>
    </div>
  );
};

export default BehaviorInsightsPanel; 