import React, { useState } from 'react';
import { 
  BookOpen, 
  BarChart2, 
  Brain, 
  Clock, 
  Target, 
  Award, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  BookMarked,
  Activity,
  Users
} from 'lucide-react';

import CoursesTab from '../components/dashboard/CoursesTab';
import BehaviorTab from '../components/dashboard/BehaviorTab';
import PredictionsTab from '../components/dashboard/PredictionsTab';

const CWADashboard = ({ 
  analysis, 
  academicMetrics, 
  behaviorMetrics, 
  courses, 
  autoCollector, 
  onUpdateAnalysis 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Use the passed academicMetrics instead of local state
  const metrics = academicMetrics || {
    currentCWA: 0,
    predictedCWA: 0,
    riskLevel: 'N/A',
    behaviorProfile: 'Not enough data',
    strongSubjects: [],
    weakSubjects: [],
    studyConsistency: 0,
    assignmentCompletion: 0
  };

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CWA Insight Dashboard</h1>
            <p className="mt-2 text-blue-100">Your academic performance at a glance</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50">
              Export Report
            </button>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMetricCard = (title, value, icon, trend = null, description = '') => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-blue-100'}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className={`w-4 h-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`ml-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '+' : '-'}4.3% from last semester
          </span>
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Current CWA',
          metrics.currentCWA,
          <Award className="w-6 h-6 text-blue-600" />,
          'up',
          'Excellent standing'
        )}
        {renderMetricCard(
          'Predicted CWA',
          metrics.predictedCWA,
          <Target className="w-6 h-6 text-indigo-600" />,
          null,
          'Based on current trajectory'
        )}
        {renderMetricCard(
          'Study Consistency',
          `${metrics.studyConsistency}%`,
          <Clock className="w-6 h-6 text-green-600" />,
          'up'
        )}
        {renderMetricCard(
          'Assignment Completion',
          `${metrics.assignmentCompletion}%`,
          <CheckCircle className="w-6 h-6 text-purple-600" />,
          'up'
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="w-5 h-5 text-blue-600 mr-2" />
            Behavioral Profile
          </h3>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-lg font-medium text-blue-900">{metrics.behaviorProfile}</p>
            <p className="text-sm text-blue-700 mt-1">
              Your learning patterns indicate strong time management and consistent study habits.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookMarked className="w-5 h-5 text-blue-600 mr-2" />
            Subject Performance
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Strong Subjects</p>
              <div className="flex flex-wrap gap-2">
                {metrics.strongSubjects.map(subject => (
                  <span key={subject} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Areas for Improvement</p>
              <div className="flex flex-wrap gap-2">
                {metrics.weakSubjects.map(subject => (
                  <span key={subject} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 text-blue-600 mr-2" />
          Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Join Physics Study Group',
              description: 'Improve your understanding through peer learning',
              icon: <Users className="w-5 h-5 text-purple-600" />,
              action: 'Join Now'
            },
            {
              title: 'Complete Practice Problems',
              description: 'Regular practice will help strengthen concepts',
              icon: <BookOpen className="w-5 h-5 text-green-600" />,
              action: 'Start Practice'
            },
            {
              title: 'Schedule Review Session',
              description: 'Book a one-on-one session with your advisor',
              icon: <Calendar className="w-5 h-5 text-blue-600" />,
              action: 'Schedule'
            }
          ].map(recommendation => (
            <div key={recommendation.title} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {recommendation.icon}
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                  <button className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700">
                    {recommendation.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'courses' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'behavior' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Behavior
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'predictions' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Predictions
          </button>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'courses' && <CoursesTab courses={courses} />}
        {activeTab === 'behavior' && <BehaviorTab behaviorMetrics={behaviorMetrics} />}
        {activeTab === 'predictions' && (
          <PredictionsTab 
            analysis={analysis} 
            courses={courses} 
            academicMetrics={metrics} 
          />
        )}
      </div>
    </div>
  );
};

export default CWADashboard; 