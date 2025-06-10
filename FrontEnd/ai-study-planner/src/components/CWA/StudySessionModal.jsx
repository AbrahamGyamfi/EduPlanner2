import React from 'react';

const StudySessionModal = ({ courses, onClose, onSave }) => {
  const handleSave = () => {
    const courseId = document.getElementById('studyCourse').value;
    const duration = parseInt(document.getElementById('studyDuration').value);
    if (courseId && duration > 0) {
      onSave(courseId, duration);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Study Session</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Course</label>
            <select 
              id="studyCourse" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input 
              type="number" 
              id="studyDuration" 
              defaultValue={30}
              min="5"
              max="480"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Save Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySessionModal;
