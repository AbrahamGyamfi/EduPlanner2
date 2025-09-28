import React from 'react';
import { Clock, BookOpen, TrendingUp, Target, Award, Eye, Timer } from 'lucide-react';

const SlideReadingAnalyticsTest = ({ userId = 'test_user', courseId = null }) => {
  // Sample test data to verify component styling and layout
  const analytics = {
    total_reading_hours: 12.5,
    average_reading_speed: 185,
    average_comprehension_score: 82,
    total_slides_read: 24,
    average_efficiency: 78,
    reading_streak_days: 5,
    total_sessions: 18,
    average_session_length_minutes: 45
  };

  const timeRange = 30;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Eye className="w-6 h-6 mr-2 text-blue-600" />
          Slide Reading Analytics (Test Mode)
        </h2>
        <div className="bg-yellow-100 px-3 py-1 rounded-lg text-sm text-yellow-800 border">
          Test Data
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Reading Time */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reading Time</p>
              <p className="text-2xl font-bold text-blue-700">{analytics.total_reading_hours}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Reading Speed */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reading Speed</p>
              <p className="text-2xl font-bold text-green-700">{analytics.average_reading_speed} WPM</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Slides Read */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Slides Read</p>
              <p className="text-2xl font-bold text-purple-700">{analytics.total_slides_read}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        {/* Study Efficiency */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Study Efficiency</p>
              <p className="text-2xl font-bold text-orange-700">{analytics.average_efficiency}%</p>
            </div>
            <Target className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* Reading Streak */}
        <div className="bg-gradient-to-br from-red-50 to-rose-100 p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reading Streak</p>
              <p className="text-2xl font-bold text-red-700">{analytics.reading_streak_days} days</p>
            </div>
            <Award className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Comprehension Score */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-100 p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comprehension</p>
              <p className="text-2xl font-bold text-teal-700">{analytics.average_comprehension_score}%</p>
            </div>
            <Timer className="w-8 h-8 text-teal-600" />
          </div>
        </div>
      </div>

      {/* Session Summary */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Reading Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Sessions</p>
            <p className="font-semibold text-gray-800">{analytics.total_sessions}</p>
          </div>
          <div>
            <p className="text-gray-600">Avg Session Length</p>
            <p className="font-semibold text-gray-800">{analytics.average_session_length_minutes} min</p>
          </div>
          <div>
            <p className="text-gray-600">Time Range</p>
            <p className="font-semibold text-gray-800">{timeRange} days</p>
          </div>
          <div>
            <p className="text-gray-600">Daily Average</p>
            <p className="font-semibold text-gray-800">
              {timeRange > 0 ? Math.round((analytics.total_reading_hours / timeRange) * 10) / 10 : 0}h/day
            </p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-sm">
          📊 This component shows sample data for testing purposes. Once you start reading slides, real analytics will be displayed here.
        </p>
      </div>
    </div>
  );
};

export default SlideReadingAnalyticsTest;
