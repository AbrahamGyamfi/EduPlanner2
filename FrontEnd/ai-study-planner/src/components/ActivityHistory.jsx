import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivityHistory, ACTIVITY_TYPES } from '../hooks/useActivityHistory';

const ActivityHistory = ({ isOpen, onClose }) => {
  const { activities, clearHistory, getActivityStats } = useActivityHistory();
  const [filter, setFilter] = useState('all');
  const [showStats, setShowStats] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const stats = getActivityStats();

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filter);

  const handleReuse = (activity) => {
    if (activity.type === ACTIVITY_TYPES.SUMMARY_GENERATE) {
      navigate('/summary', {
        state: {
          summary: activity.metadata.summaryContent,
          filename: activity.metadata.filename
        }
      });
      onClose();
    } else if (activity.type === ACTIVITY_TYPES.QUIZ_GENERATE) {
      navigate('/quiz', {
        state: {
          quiz: activity.metadata.quizContent,
          filename: activity.metadata.filename
        }
      });
      onClose();
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case ACTIVITY_TYPES.FILE_UPLOAD:
        return '📁';
      case ACTIVITY_TYPES.SUMMARY_GENERATE:
        return '📄';
      case ACTIVITY_TYPES.QUIZ_GENERATE:
        return '❓';
      case ACTIVITY_TYPES.QUIZ_COMPLETE:
        return '🎯';
      case ACTIVITY_TYPES.COURSE_CREATE:
        return '📚';
      case ACTIVITY_TYPES.COURSE_VIEW:
        return '👁️';
      case ACTIVITY_TYPES.LOGIN:
        return '🔑';
      case ACTIVITY_TYPES.LOGOUT:
        return '🚪';
      case ACTIVITY_TYPES.PAGE_VISIT:
        return '🌐';
      case ACTIVITY_TYPES.ASSIGNMENT_CREATE:
        return '📝';
      case ACTIVITY_TYPES.ASSIGNMENT_COMPLETE:
        return '✅';
      case ACTIVITY_TYPES.PROFILE_UPDATE:
        return '👤';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case ACTIVITY_TYPES.FILE_UPLOAD:
        return 'bg-blue-100 text-blue-700';
      case ACTIVITY_TYPES.SUMMARY_GENERATE:
        return 'bg-indigo-100 text-indigo-700';
      case ACTIVITY_TYPES.QUIZ_GENERATE:
      case ACTIVITY_TYPES.QUIZ_COMPLETE:
        return 'bg-purple-100 text-purple-700';
      case ACTIVITY_TYPES.COURSE_CREATE:
      case ACTIVITY_TYPES.COURSE_VIEW:
        return 'bg-green-100 text-green-700';
      case ACTIVITY_TYPES.LOGIN:
        return 'bg-emerald-100 text-emerald-700';
      case ACTIVITY_TYPES.LOGOUT:
        return 'bg-red-100 text-red-700';
      case ACTIVITY_TYPES.ASSIGNMENT_CREATE:
      case ACTIVITY_TYPES.ASSIGNMENT_COMPLETE:
        return 'bg-orange-100 text-orange-700';
      case ACTIVITY_TYPES.PROFILE_UPDATE:
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMs = now - activityTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return activityTime.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Activity History</h2>
              <p className="text-indigo-100 text-sm">Track your learning journey</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white hover:text-indigo-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Activities</option>
                <option value={ACTIVITY_TYPES.FILE_UPLOAD}>File Uploads</option>
                <option value={ACTIVITY_TYPES.SUMMARY_GENERATE}>Summaries</option>
                <option value={ACTIVITY_TYPES.QUIZ_GENERATE}>Quiz Generation</option>
                <option value={ACTIVITY_TYPES.QUIZ_COMPLETE}>Quiz Completion</option>
                <option value={ACTIVITY_TYPES.COURSE_CREATE}>Course Creation</option>
                <option value={ACTIVITY_TYPES.COURSE_VIEW}>Course Views</option>
              </select>
              
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </button>
            </div>
            
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear History
            </button>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{stats.totalActivities}</div>
                <div className="text-sm text-gray-600">Total Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.todayActivities}</div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.activityTypes[ACTIVITY_TYPES.QUIZ_COMPLETE] || 0}
                </div>
                <div className="text-sm text-gray-600">Quizzes Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.activityTypes[ACTIVITY_TYPES.FILE_UPLOAD] || 0}
                </div>
                <div className="text-sm text-gray-600">Files Uploaded</div>
              </div>
            </div>
          </div>
        )}

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto max-h-[50vh] p-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Activities Found</h3>
              <p className="text-gray-600">Start using the application to see your activity history here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{activity.description}</h4>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-1">
                            <div className="text-sm text-gray-600 mb-2">
                              {Object.entries(activity.metadata)
                                .filter(([key]) => !['summaryContent', 'quizContent', 'canReuse'].includes(key))
                                .map(([key, value]) => (
                                  <span key={key} className="mr-4">
                                    <span className="font-medium">{key}:</span> {typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)}
                                  </span>
                                ))
                              }
                            </div>
                            {activity.metadata.canReuse && (
                              <button
                                onClick={() => handleReuse(activity)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                View Again
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredActivities.length} of {activities.length} activities
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHistory;
