import React from 'react';
import { Brain, Calendar, Clock, Target, AlertTriangle, CheckCircle } from 'lucide-react';

const BehaviorInsightsPanel = ({ profile, metrics }) => {
  const getBehaviorTag = () => {
    const { plannerUsage, studyConsistency, deadlineAdherence } = metrics;
    const average = (plannerUsage + studyConsistency + deadlineAdherence) / 3;

    if (average >= 80) return { label: 'Highly Motivated', color: 'green' };
    if (average >= 60) return { label: 'Active Learner', color: 'blue' };
    if (average >= 40) return { label: 'Developing Habits', color: 'yellow' };
    return { label: 'Needs Improvement', color: 'red' };
  };

  const getMetricColor = (value) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricIcon = (value) => {
    if (value >= 60) return <CheckCircle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const behaviorTag = getBehaviorTag();

  const insights = [
    {
      icon: Calendar,
      message: metrics.plannerUsage >= 70 
        ? "You've been consistently using your planner - great work!"
        : "Try to check your planner more regularly for better organization.",
      metric: metrics.plannerUsage
    },
    {
      icon: Clock,
      message: metrics.studyConsistency >= 70
        ? "Your study patterns show excellent consistency!"
        : "Consider establishing a more regular study schedule.",
      metric: metrics.studyConsistency
    },
    {
      icon: Target,
      message: metrics.deadlineAdherence >= 70
        ? "You're meeting deadlines effectively - keep it up!"
        : "Work on starting assignments earlier to meet deadlines better.",
      metric: metrics.deadlineAdherence
    }
  ];

  return (
    <div className="space-y-6">
      {/* Behavior Profile Tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Behavior Profile</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${behaviorTag.color}-100 text-${behaviorTag.color}-800`}>
          {behaviorTag.label}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${getMetricColor(insight.metric)}`}>
                  {getMetricIcon(insight.metric)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${getMetricColor(insight.metric)}`}>
                      {insight.metric}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{insight.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Engagement Score */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-blue-900">Overall Engagement Score</h4>
            <p className="mt-1 text-xs text-blue-700">Based on your interaction patterns</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-blue-600">{metrics.engagementScore}%</span>
          </div>
        </div>
        <div className="mt-4 h-2 bg-blue-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${metrics.engagementScore}%` }}
          />
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Tips</h4>
        <ul className="space-y-2">
          <li className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Check your planner at the start of each day
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Set specific study goals for each session
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Take regular breaks to maintain productivity
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BehaviorInsightsPanel; 