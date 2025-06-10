import React from 'react';
import { Lightbulb, Clock, Users, Brain, CheckCircle } from 'lucide-react';

const RecommendationsPanel = ({ behaviorMetrics, currentCWA, targetCWA }) => {
  const generateRecommendations = () => {
    const recommendations = [];

    // Study Consistency Recommendations
    if (behaviorMetrics.studyConsistency < 70) {
      recommendations.push({
        icon: Clock,
        title: "Improve Study Consistency",
        description: "Set up a regular study schedule with dedicated time blocks",
        actions: [
          "Use Pomodoro technique (25min work, 5min break)",
          "Study at the same time each day",
          "Track your study hours in the planner"
        ]
      });
    }

    // Planner Usage Recommendations
    if (behaviorMetrics.plannerUsage < 70) {
      recommendations.push({
        icon: Brain,
        title: "Enhance Planner Usage",
        description: "Make better use of your planning tools",
        actions: [
          "Review your schedule every morning",
          "Update task progress daily",
          "Set reminders for important deadlines"
        ]
      });
    }

    // Peer Learning Recommendations
    if (currentCWA < targetCWA - 10) {
      recommendations.push({
        icon: Users,
        title: "Consider Peer Learning",
        description: "Collaborate with classmates to improve understanding",
        actions: [
          "Join or form study groups",
          "Share notes and resources",
          "Practice explaining concepts to others"
        ]
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Lightbulb className="w-6 h-6 text-yellow-500" />
        <h3 className="text-lg font-medium text-gray-900">
          Personalized Recommendations
        </h3>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                  <p className="text-sm text-gray-500">{rec.description}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {rec.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Clock className="w-4 h-4 mr-2" />
            Set Study Timer
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Users className="w-4 h-4 mr-2" />
            Find Study Group
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Brain className="w-4 h-4 mr-2" />
            View Study Tips
          </button>
        </div>
      </div>

      {/* Motivation Message */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <p className="text-lg text-gray-800 font-medium">
          {currentCWA >= targetCWA 
            ? "You're doing great! Keep up the excellent work!"
            : `You're ${(targetCWA - currentCWA).toFixed(1)}% points away from your target. Stay focused!`}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Remember: Consistent effort leads to lasting improvement
        </p>
      </div>
    </div>
  );
};

export default RecommendationsPanel; 