import React from 'react';
import { BookOpen } from 'lucide-react';

const EmptyCoursesMessage = () => {
  return (
    <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <BookOpen className="w-12 h-12 text-blue-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-800 mb-2">No courses added yet</h3>
      <p className="text-gray-500 mb-4">Add your first course to begin tracking your academic performance.</p>
    </div>
  );
};

export default EmptyCoursesMessage;
