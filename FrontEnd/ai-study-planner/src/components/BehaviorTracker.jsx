import React, { useState } from 'react';
import { Clock, Award } from 'lucide-react';

const BehaviorTracker = ({ 
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
  const [duration, setDuration] = useState(30);
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedCourseObj = courses.find(c => c.id === selectedCourse);
    
    if (!selectedCourseObj) return;
    
    onSaveSession({
      courseId: selectedCourse,
      courseName: selectedCourseObj.name,
      duration,
      date
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Clock className="w-5 h-5 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Study Session Tracker</h3>
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
      
      {/* Record new session form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="" disabled>Select a course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Study Duration (minutes)</label>
          <input 
            type="number" 
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
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
    </div>
  );
};

export default BehaviorTracker;
