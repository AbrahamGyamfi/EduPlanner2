import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const ProgressModal = ({ course, onClose, onSave }) => {
  const [progressData, setProgressData] = useState({
    modules: [],
    resources: {
      completed: 0,
      total: 5
    },
    quizzes: {
      completed: 0,
      total: 3,
      averageScore: 0
    },
    attendance: {
      present: 0,
      total: 0
    }
  });

  // Initialize with course data
  useEffect(() => {
    if (course) {
      setProgressData({
        modules: course.modules || Array.from({ length: course.totalModules || 1 }, (_, i) => ({
          name: `Module ${i + 1}`,
          completed: i < (course.completedModules || 0)
        })),
        resources: course.resources || { completed: 0, total: 5 },
        quizzes: course.quizzes || { completed: 0, total: 3, averageScore: 0 },
        attendance: course.attendance || { present: 0, total: 0 }
      });
    }
  }, [course]);

  // Toggle module completion
  const toggleModuleCompletion = (index) => {
    setProgressData(prev => ({
      ...prev,
      modules: prev.modules.map((mod, i) => 
        i === index ? { ...mod, completed: !mod.completed } : mod
      )
    }));
  };

  // Calculate current progress percentage
  const calculateProgress = () => {
    if (!progressData) return 0;

    // Module progress (40% weight)
    const moduleWeight = 0.4;
    const moduleProgress = progressData.modules.length > 0
      ? (progressData.modules.filter(mod => mod.completed).length / progressData.modules.length)
      : 0;

    // Resource progress (20% weight)
    const resourceWeight = 0.2;
    const resourceProgress = progressData.resources.total > 0
      ? (progressData.resources.completed / progressData.resources.total)
      : 0;

    // Quiz progress (25% weight)
    const quizWeight = 0.25;
    const quizProgress = progressData.quizzes.total > 0
      ? ((progressData.quizzes.completed / progressData.quizzes.total) + (progressData.quizzes.averageScore / 100)) / 2
      : 0;

    // Attendance progress (15% weight)
    const attendanceWeight = 0.15;
    const attendanceProgress = progressData.attendance.total > 0
      ? (progressData.attendance.present / progressData.attendance.total)
      : 0;

    // Calculate total weighted progress
    const totalProgress = (
      moduleProgress * moduleWeight +
      resourceProgress * resourceWeight +
      quizProgress * quizWeight +
      attendanceProgress * attendanceWeight
    ) * 100;

    return Math.round(totalProgress);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(progressData);
  };

  // Add a new module
  const addModule = () => {
    setProgressData(prev => ({
      ...prev,
      modules: [
        ...prev.modules, 
        { name: `Module ${prev.modules.length + 1}`, completed: false }
      ]
    }));
  };

  // Remove the last module
  const removeModule = () => {
    if (progressData.modules.length > 1) {
      setProgressData(prev => ({
        ...prev,
        modules: prev.modules.slice(0, -1)
      }));
    }
  };

  // Update resource progress
  const updateResources = (type, value) => {
    setProgressData(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [type]: Math.max(0, Math.min(value, prev.resources.total))
      }
    }));
  };

  // Update quiz progress
  const updateQuizzes = (type, value) => {
    setProgressData(prev => ({
      ...prev,
      quizzes: {
        ...prev.quizzes,
        [type]: type === 'averageScore' 
          ? Math.max(0, Math.min(value, 100))
          : Math.max(0, Math.min(value, prev.quizzes.total))
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Course Progress</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {course && (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-600 mb-4">{course.title}</p>
            
            {/* Progress Overview */}
            <div className="mb-6 flex items-center justify-center">
              <div className="w-32 h-32">
                <CircularProgressbar
                  value={calculateProgress()}
                  text={`${calculateProgress()}%`}
                  styles={buildStyles({
                    textSize: '16px',
                    pathColor: '#4F46E5',
                    textColor: '#4F46E5',
                    trailColor: '#E5E7EB',
                  })}
                />
              </div>
            </div>

            {/* Progress Breakdown */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-4">Progress Breakdown</h4>
              <div className="space-y-4">
                {/* Modules Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Modules (40%)</span>
                    <span>{Math.round((progressData.modules.filter(m => m.completed).length / progressData.modules.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(progressData.modules.filter(m => m.completed).length / progressData.modules.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Resources Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Resources (20%)</span>
                    <span>{Math.round((progressData.resources.completed / progressData.resources.total) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${(progressData.resources.completed / progressData.resources.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Quizzes Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Quizzes (25%)</span>
                    <span>{Math.round((progressData.quizzes.completed / progressData.quizzes.total) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${(progressData.quizzes.completed / progressData.quizzes.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Attendance */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Attendance (15%)</span>
                    <span>{Math.round((progressData.attendance.present / Math.max(1, progressData.attendance.total)) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-yellow-600 rounded-full"
                      style={{ width: `${(progressData.attendance.present / Math.max(1, progressData.attendance.total)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Module Management */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Course Modules</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={addModule}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={removeModule}
                    disabled={progressData.modules.length <= 1}
                    className={`p-1 rounded ${progressData.modules.length <= 1 
                      ? 'text-gray-300' 
                      : 'text-red-600 hover:bg-red-50'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                {progressData.modules.map((mod, index) => (
                  <label key={index} className="flex items-center space-x-2 mb-2 hover:bg-gray-100 p-2 rounded">
                    <input 
                      type="checkbox" 
                      checked={mod.completed} 
                      onChange={() => toggleModuleCompletion(index)}
                      className="form-checkbox h-5 w-5 text-indigo-600" 
                    />
                    <span>{mod.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Progress Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resources Completed
                </label>
                <input
                  type="number"
                  value={progressData.resources.completed}
                  onChange={(e) => updateResources('completed', parseInt(e.target.value))}
                  min="0"
                  max={progressData.resources.total}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quizzes Completed
                </label>
                <input
                  type="number"
                  value={progressData.quizzes.completed}
                  onChange={(e) => updateQuizzes('completed', parseInt(e.target.value))}
                  min="0"
                  max={progressData.quizzes.total}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quiz Average Score
                </label>
                <input
                  type="number"
                  value={progressData.quizzes.averageScore}
                  onChange={(e) => updateQuizzes('averageScore', parseInt(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classes Attended
                </label>
                <input
                  type="number"
                  value={progressData.attendance.present}
                  onChange={(e) => setProgressData(prev => ({
                    ...prev,
                    attendance: {
                      ...prev.attendance,
                      present: Math.max(0, parseInt(e.target.value))
                    }
                  }))}
                  min="0"
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Update Progress
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProgressModal;