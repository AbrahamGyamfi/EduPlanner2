import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  BookOpen, 
  PenTool, 
  FileText, 
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Calendar
} from 'lucide-react';

const ActivityTimeBreakdown = ({ userId, timeRange = 7, showDetails = true }) => {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detailed', 'trends'

  // Activity type configurations
  const activityTypes = {
    slide_reading: {
      name: 'Reading',
      icon: BookOpen,
      color: 'blue',
      description: 'Slide and document reading'
    },
    general_study: {
      name: 'Study',
      icon: PenTool,
      color: 'green',
      description: 'General study sessions'
    },
    quiz_taking: {
      name: 'Quizzes',
      icon: FileText,
      color: 'purple',
      description: 'Quiz and assessment sessions'
    },
    note_taking: {
      name: 'Notes',
      icon: Activity,
      color: 'orange',
      description: 'Note-taking sessions'
    }
  };

  useEffect(() => {
    if (userId) {
      fetchActivityData();
    }
  }, [userId, timeRange, selectedActivity]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch unified dashboard data
      const response = await fetch(
        `http://localhost:5000/unified-dashboard-data/${userId}?days=${timeRange}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity data');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setActivityData(result.dashboard_data);
      } else {
        throw new Error(result.error || 'Failed to load activity data');
      }
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  const getActivityColor = (activityType, shade = '500') => {
    const colors = {
      slide_reading: 'blue',
      general_study: 'green',
      quiz_taking: 'purple',
      note_taking: 'orange'
    };
    return `${colors[activityType] || 'gray'}-${shade}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center text-red-600">
          <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Error Loading Activity Data</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={fetchActivityData}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!activityData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No activity data available</p>
        </div>
      </div>
    );
  }

  const { activity_breakdown, overview, time_distribution, real_time_status } = activityData;

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-500" />
              Activity Time Breakdown
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Last {timeRange} days • {overview?.total_study_hours || 0}h total
            </p>
          </div>
          
          <div className="flex space-x-2 mt-4 sm:mt-0">
            {['overview', 'detailed', 'trends'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Status */}
        {real_time_status?.has_active_session && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
              <div>
                <p className="font-medium text-green-800">Currently Studying</p>
                <p className="text-sm text-green-600">
                  {real_time_status.active_session_count} active session(s) • 
                  Today: {formatTime(real_time_status.todays_totals?.total_minutes || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(activity_breakdown).map(([activityType, data]) => {
              const config = activityTypes[activityType];
              if (!config || data.session_count === 0) return null;

              const Icon = config.icon;
              return (
                <div key={activityType} className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 mr-2 text-${config.color}-500`} />
                      <span className="font-medium text-gray-900">{config.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatPercentage(data.percentage_of_total)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatTime(data.total_time_minutes)}
                      </p>
                      <p className="text-xs text-gray-500">{data.session_count} sessions</p>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${config.color}-500 h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${data.percentage_of_total}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Efficiency</span>
                      <span>{formatPercentage(data.average_efficiency)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Mode */}
        {viewMode === 'detailed' && (
          <div className="space-y-6">
            {/* Activity Selector */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setSelectedActivity('all')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedActivity === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                All Activities
              </button>
              {Object.entries(activityTypes).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setSelectedActivity(type)}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                    selectedActivity === type 
                      ? `bg-${config.color}-500 text-white` 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <config.icon className="w-4 h-4 mr-1" />
                  {config.name}
                </button>
              ))}
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Distribution */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-blue-500" />
                  Time Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(activity_breakdown)
                    .filter(([type, data]) => selectedActivity === 'all' || selectedActivity === type)
                    .sort(([,a], [,b]) => b.total_time_minutes - a.total_time_minutes)
                    .map(([activityType, data]) => {
                      const config = activityTypes[activityType];
                      if (!config) return null;

                      return (
                        <div key={activityType} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full bg-${config.color}-500 mr-3`}></div>
                            <span className="text-sm text-gray-700">{config.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatTime(data.total_time_minutes)}</p>
                            <p className="text-xs text-gray-500">{formatPercentage(data.percentage_of_total)}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-500" />
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Efficiency</span>
                    <span className="font-medium text-gray-900">
                      {formatPercentage(overview?.average_efficiency || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Study Streak</span>
                    <span className="font-medium text-gray-900">
                      {overview?.study_streak_days || 0} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sessions This Week</span>
                    <span className="font-medium text-gray-900">
                      {overview?.sessions_this_week || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Weekly Goal</span>
                    <span className="font-medium text-gray-900">
                      {formatPercentage(overview?.weekly_goal_progress || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trends Mode */}
        {viewMode === 'trends' && (
          <div className="space-y-6">
            {/* Daily Breakdown Chart */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                Daily Activity Trends
              </h3>
              <div className="space-y-2">
                {time_distribution?.by_day?.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 w-20">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Activity breakdown bars */}
                      <div className="flex items-center space-x-1">
                        {Object.entries(day.activities).map(([activityType, time]) => {
                          const config = activityTypes[activityType];
                          if (!config || time === 0) return null;
                          
                          const width = Math.max((time / day.total_time_minutes) * 60, 4); // Min 4px width
                          return (
                            <div
                              key={activityType}
                              className={`h-4 bg-${config.color}-500 rounded-sm`}
                              style={{ width: `${width}px` }}
                              title={`${config.name}: ${formatTime(time)}`}
                            ></div>
                          );
                        })}
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-16 text-right">
                        {formatTime(day.total_time_minutes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Time Distribution */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Time by Course</h3>
              <div className="space-y-3">
                {time_distribution?.by_course?.slice(0, 5).map((course) => (
                  <div key={course.course_name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {course.course_name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatTime(course.total_time_minutes)} • {course.session_count} sessions
                      </span>
                    </div>
                    
                    {/* Course activity breakdown */}
                    <div className="flex space-x-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      {Object.entries(course.activities).map(([activityType, activityData]) => {
                        const config = activityTypes[activityType];
                        if (!config || activityData.time === 0) return null;
                        
                        const percentage = (activityData.time / course.total_time_minutes) * 100;
                        return (
                          <div
                            key={activityType}
                            className={`bg-${config.color}-500 h-full`}
                            style={{ width: `${percentage}%` }}
                            title={`${config.name}: ${formatTime(activityData.time)}`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Legend */}
      {showDetails && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Activity Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(activityTypes).map(([type, config]) => {
              const data = activity_breakdown[type];
              const Icon = config.icon;
              
              return (
                <div key={type} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                    <Icon className={`w-4 h-4 text-${config.color}-600`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{config.name}</p>
                    <p className="text-xs text-gray-600">{config.description}</p>
                    {data && data.session_count > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {data.session_count} sessions • {formatTime(data.total_time_minutes)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Goal Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Weekly Goal Progress
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Study Time Goal (10h/week)</span>
              <span className="font-medium text-gray-900">
                {formatTime((overview?.total_study_hours || 0) * 60)} / 10h
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overview?.weekly_goal_progress || 0, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatPercentage(overview?.weekly_goal_progress || 0)} complete
            </p>
          </div>
          
          {/* Activity-specific progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(activity_breakdown)
              .filter(([,data]) => data.session_count > 0)
              .map(([activityType, data]) => {
                const config = activityTypes[activityType];
                if (!config) return null;

                return (
                  <div key={activityType} className="text-center p-3 bg-gray-50 rounded-lg">
                    <config.icon className={`w-6 h-6 mx-auto mb-2 text-${config.color}-500`} />
                    <p className="font-medium text-gray-900">{formatTime(data.total_time_minutes)}</p>
                    <p className="text-xs text-gray-600">{config.name}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeBreakdown;
