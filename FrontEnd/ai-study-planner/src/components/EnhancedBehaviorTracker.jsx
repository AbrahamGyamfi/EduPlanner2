import React, { useState } from 'react';
import { Clock, Award, Play, Pause, Square, Activity, Timer } from 'lucide-react';
import useActivityTracker from '../hooks/useActivityTracker';

const EnhancedBehaviorTracker = ({ 
  onSaveSession, 
  courses = [], 
  metrics = {
    studyConsistency: 0,
    assignmentCompletion: 0,
    studyPatterns: [],
    procrastinationLevel: 0
  } 
}) => {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  const [manualDuration, setManualDuration] = useState(30);
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [trackingMode, setTrackingMode] = useState('manual'); // 'manual' or 'automatic'

  const {
    isTracking,
    isPaused,
    startTracking,
    stopTracking,
    togglePause,
    getSessionStats
  } = useActivityTracker();

  const sessionStats = getSessionStats();

  // Handle automatic session completion
  const handleStopTracking = () => {
    const sessionData = stopTracking();
    if (sessionData && onSaveSession) {
      // Convert to minutes and save the session
      const activeMinutes = Math.round(sessionData.activeTime / 1000 / 60);
      onSaveSession({
        courseId: sessionData.courseId,
        courseName: sessionData.courseName,
        duration: activeMinutes, // Only count active time
        date: new Date(sessionData.timestamp).toISOString().substr(0, 10),
        trackingMode: 'automatic',
        totalDuration: Math.round(sessionData.totalDuration / 1000 / 60),
        activeTime: activeMinutes,
        efficiency: Math.round((sessionData.activeTime / sessionData.totalDuration) * 100)
      });
    }
  };

  // Handle manual session submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const selectedCourseObj = courses.find(c => c.id === selectedCourse);
    
    if (!selectedCourseObj) return;
    
    onSaveSession({
      courseId: selectedCourse,
      courseName: selectedCourseObj.name,
      duration: manualDuration,
      date,
      trackingMode: 'manual'
    });
  };

  // Handle starting automatic tracking
  const handleStartTracking = () => {
    const selectedCourseObj = courses.find(c => c.id === selectedCourse);
    if (!selectedCourseObj) return;
    
    startTracking(selectedCourse, selectedCourseObj.name);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Smart Study Tracker</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTrackingMode('manual')}
            className={`px-3 py-1 text-xs rounded-full ${
              trackingMode === 'manual' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setTrackingMode('automatic')}
            className={`px-3 py-1 text-xs rounded-full ${
              trackingMode === 'automatic' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Auto-Track
          </button>
        </div>
      </div>
      
      {/* Metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="text-xs text-blue-600 font-medium uppercase">Study Consistency</div>
          <div className="mt-1 flex items-center">
            <div className="flex-1 h-2 mr-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 ${metrics.studyConsistency > 70 ? 'bg-green-500' : 
                  metrics.studyConsistency > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{width: `${metrics.studyConsistency}%`}}
              ></div>
            </div>
            <span className="text-xs font-medium">{Math.round(metrics.studyConsistency)}%</span>
          </div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
          <div className="text-xs text-purple-600 font-medium uppercase">Assignment Completion</div>
          <div className="mt-1 flex items-center">
            <div className="flex-1 h-2 mr-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 ${metrics.assignmentCompletion > 80 ? 'bg-green-500' : 
                  metrics.assignmentCompletion > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{width: `${metrics.assignmentCompletion}%`}}
              ></div>
            </div>
            <span className="text-xs font-medium">{Math.round(metrics.assignmentCompletion)}%</span>
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
          <div className="text-xs text-green-600 font-medium uppercase">Procrastination Level</div>
          <div className="mt-1 flex items-center">
            <div className="flex-1 h-2 mr-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 ${metrics.procrastinationLevel < 3 ? 'bg-green-500' : 
                  metrics.procrastinationLevel < 7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{width: `${metrics.procrastinationLevel * 10}%`}}
              ></div>
            </div>
            <span className="text-xs font-medium">{metrics.procrastinationLevel}/10</span>
          </div>
        </div>
      </div>
      
      {/* Study patterns */}
      {metrics.studyPatterns.length > 0 && (
        <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500 font-medium uppercase mb-1">Your Study Pattern</div>
          <div className="flex flex-wrap gap-2">
            {metrics.studyPatterns.map((pattern, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                <Award className="w-3 h-3 mr-1" />
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Course Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
        <select 
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          required
          disabled={isTracking}
        >
          <option value="" disabled>Select a course</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </div>

      {/* Automatic Tracking Mode */}
      {trackingMode === 'automatic' && (
        <div className="space-y-4">
          {/* Current Session Display */}
          {isTracking && sessionStats && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Timer className="w-5 h-5 text-indigo-600 mr-2" />
                  <span className="font-medium text-indigo-800">
                    {sessionStats.courseName}
                  </span>
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isPaused 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isPaused ? '⏸️ Paused' : '🟢 Active'}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-indigo-600">
                    {sessionStats.activeTime}
                  </div>
                  <div className="text-xs text-gray-600">Active Time</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {sessionStats.totalTime}
                  </div>
                  <div className="text-xs text-gray-600">Total Time</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {sessionStats.efficiency}%
                  </div>
                  <div className="text-xs text-gray-600">Efficiency</div>
                </div>
              </div>
              
              {isPaused && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  📝 Session paused due to inactivity. Resume by moving your mouse or typing.
                </div>
              )}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isTracking ? (
              <button
                onClick={handleStartTracking}
                disabled={!selectedCourse}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Smart Tracking
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleStopTracking}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop & Save
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center mb-1">
              <Activity className="w-4 h-4 mr-1" />
              <strong>Smart Tracking Features:</strong>
            </div>
            <ul className="ml-5 space-y-1">
              <li>• Automatically pauses after 3 minutes of inactivity</li>
              <li>• Only counts active study time for accurate metrics</li>
              <li>• Tracks mouse, keyboard, and scroll activity</li>
              <li>• Shows real-time efficiency percentage</li>
            </ul>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {trackingMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Study Duration (minutes)</label>
            <input 
              type="number" 
              value={manualDuration}
              onChange={(e) => setManualDuration(parseInt(e.target.value))}
              min="5"
              max="480"
              step="5"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Study Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Clock className="w-4 h-4 mr-2" />
            Record Study Session
          </button>
        </form>
      )}
    </div>
  );
};

export default EnhancedBehaviorTracker;
