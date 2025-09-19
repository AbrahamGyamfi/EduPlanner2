import React, { useState, useEffect } from 'react';
import EnhancedBehaviorTracker from '../components/EnhancedBehaviorTracker';
import ActivityTimeBreakdown from '../components/ActivityTimeBreakdown';
import { useBehaviorTracking } from '../hooks/useBehaviorTracking';
import useRealTimeTracking from '../hooks/useRealTimeTracking';
import { Clock, TrendingUp, Target, BarChart3, BookOpen, Zap, Eye, Timer } from 'lucide-react';

const StudyTrackingDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('currentUserId') || 'demo-user-001';
  });
  
  const { 
    metrics, 
    recordStudySession, 
    saveSessionToBackend,
    sessions 
  } = useBehaviorTracking(courses);
  
  // Real-time tracking hook
  const {
    realTimeData,
    activeSession,
    todaysStats,
    isConnected,
    hasActiveSession,
    formatDuration,
    fetchDashboardData
  } = useRealTimeTracking(userId, {
    pollingInterval: 15000, // 15 seconds for more frequent updates
    timeRange: 7,
    enablePolling: true,
    onStatusChange: (statusData) => {
      console.log('📡 Study Tracking - Real-time update:', statusData);
    }
  });
  
  // Enhanced analytics state
  const [readingAnalytics, setReadingAnalytics] = useState(null);

  // Load courses from localStorage
  useEffect(() => {
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
  }, []);

  // Enhanced session handler that saves both locally and to backend
  const handleSaveSession = async (sessionData) => {
    try {
      // Save locally first
      recordStudySession(sessionData);
      
      // Save to backend if available
      if (saveSessionToBackend) {
        await saveSessionToBackend(sessionData);
      }
      
      console.log('Session saved successfully:', sessionData);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  // Calculate recent session summary
  const recentSessions = sessions.slice(0, 5);
  const totalActiveTimeToday = sessions
    .filter(session => {
      const sessionDate = new Date(session.timestamp || session.date);
      const today = new Date();
      return sessionDate.toDateString() === today.toDateString();
    })
    .reduce((total, session) => total + (session.activeTime || session.duration || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Smart Study Tracking Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Track your study time with intelligent activity monitoring
          </p>
          
          {/* Real-time Status Indicator */}
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              {isConnected ? 'Real-time tracking active' : 'Tracking offline'}
            </div>
            
            {hasActiveSession && activeSession && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                <Timer className="w-3 h-3 mr-1" />
                Currently studying: {activeSession.course_name}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Active Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.floor(totalActiveTimeToday / 60)}h {totalActiveTimeToday % 60}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Efficiency</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.averageEfficiency}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Consistency</p>
                <p className="text-2xl font-bold text-purple-600">
                  {metrics.studyConsistency}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-orange-600">
                  {sessions.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Study Tracker */}
          <div className="lg:col-span-2">
            <EnhancedBehaviorTracker
              courses={courses}
              metrics={metrics}
              onSaveSession={handleSaveSession}
            />
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Study Sessions
            </h3>
            
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-800">
                        {session.courseName}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.trackingMode === 'automatic' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.trackingMode || 'manual'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Active:</span> {session.activeTime || session.duration || 0}m
                      </div>
                      <div>
                        <span className="font-medium">Efficiency:</span> {session.efficiency || 100}%
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(session.timestamp || session.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No study sessions yet</p>
                <p className="text-sm">Start tracking to see your progress!</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Time Breakdown with Reading Analytics */}
        <div className="mt-8">
          <ActivityTimeBreakdown 
            userId={userId}
            timeRange={14} // 2 weeks for detailed tracking
            showDetails={true}
          />
        </div>

        {/* Reading Analytics Section */}
        {todaysStats && (todaysStats.reading_minutes > 0 || todaysStats.study_minutes > 0) && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
              Today's Reading & Study Analytics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reading Time */}
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Reading Time</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(todaysStats.reading_minutes || 0)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Slide & document reading
                </p>
              </div>
              
              {/* Study Time */}
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold text-gray-800">Study Time</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatDuration(todaysStats.study_minutes || 0)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  General study sessions
                </p>
              </div>
              
              {/* Total Active Time */}
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold text-gray-800">Total Active</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {formatDuration(todaysStats.total_minutes || 0)}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Combined study time
                </p>
              </div>
            </div>
            
            {/* Activity Balance */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-800 mb-3">Activity Balance</h4>
              <div className="flex items-center space-x-2 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{ 
                    width: `${todaysStats.total_minutes > 0 ? (todaysStats.reading_minutes / todaysStats.total_minutes) * 100 : 0}%` 
                  }}
                  title="Reading Time"
                ></div>
                <div 
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ 
                    width: `${todaysStats.total_minutes > 0 ? (todaysStats.study_minutes / todaysStats.total_minutes) * 100 : 0}%` 
                  }}
                  title="Study Time"
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>📖 Reading: {Math.round((todaysStats.reading_minutes / todaysStats.total_minutes) * 100) || 0}%</span>
                <span>📝 Study: {Math.round((todaysStats.study_minutes / todaysStats.total_minutes) * 100) || 0}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Features Info */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🚀 Smart Tracking Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">⏱️</div>
              <h4 className="font-medium text-gray-800">Auto-Pause</h4>
              <p className="text-sm text-gray-600">
                Pauses tracking after 3 minutes of inactivity
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium text-gray-800">Efficiency Tracking</h4>
              <p className="text-sm text-gray-600">
                Measures actual study time vs total time
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-medium text-gray-800">Focus Analytics</h4>
              <p className="text-sm text-gray-600">
                Identifies your most productive study patterns
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <h4 className="font-medium text-gray-800">Progress Insights</h4>
              <p className="text-sm text-gray-600">
                Shows consistency and improvement trends
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📖</div>
              <h4 className="font-medium text-gray-800">Reading Analytics</h4>
              <p className="text-sm text-gray-600">
                Tracks reading speed and comprehension
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-medium text-gray-800">Real-time Updates</h4>
              <p className="text-sm text-gray-600">
                Live session monitoring and updates
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <h4 className="font-medium text-gray-800">Session Sync</h4>
              <p className="text-sm text-gray-600">
                Unified tracking across all activities
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📱</div>
              <h4 className="font-medium text-gray-800">Cross-Platform</h4>
              <p className="text-sm text-gray-600">
                Works across all your devices
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyTrackingDashboard;
