import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, TrendingUp, Target, Award, Eye, Timer } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const SlideReadingAnalytics = ({ userId, courseId = null }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    fetchAnalytics();
  }, [userId, courseId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endpoint = courseId 
        ? `/slide-reading-analytics/${userId}?courseId=${courseId}&days=${timeRange}`
        : `/slide-reading-analytics/${userId}?days=${timeRange}`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        // Set default zero analytics if API call fails or no data
        setAnalytics({
          total_reading_hours: 0,
          average_reading_speed: 0,
          average_comprehension_score: 0,
          total_slides_read: 0,
          average_efficiency: 0,
          reading_streak_days: 0,
          total_sessions: 0,
          average_session_length_minutes: 0
        });
      }
    } catch (error) {
      console.error('Error fetching reading analytics:', error);
      // Set default zero analytics on error
      setAnalytics({
        total_reading_hours: 0,
        average_reading_speed: 0,
        average_comprehension_score: 0,
        total_slides_read: 0,
        average_efficiency: 0,
        reading_streak_days: 0,
        total_sessions: 0,
        average_session_length_minutes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Eye className="w-6 h-6 mr-2 text-blue-600" />
          Slide Reading Analytics
        </h2>
        <p className="text-gray-600">No reading analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Eye className="w-6 h-6 mr-2 text-blue-600" />
          Slide Reading Analytics
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 3 months</option>
        </select>
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
    </div>
  );
};

export default SlideReadingAnalytics;
