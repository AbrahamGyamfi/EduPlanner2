import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define gradient backgrounds to match the image exactly
const courseGradients = {
  default: 'bg-gradient-to-r from-[#2193b0] to-[#6dd5ed]',
  purple: 'bg-gradient-to-r from-[#8e2de2] to-[#a139f0]',
  green: 'bg-gradient-to-r from-[#11998e] to-[#38ef7d]',
  orange: 'bg-gradient-to-r from-[#fc4a1a] to-[#f7b733]'
};

// Loading animation component
const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 border-[#0A0F1E] border-4 rounded-full opacity-25"></div>
      <div className="w-16 h-16 border-[#0A0F1E] border-t-4 animate-spin rounded-full absolute left-0 top-0"></div>
    </div>
    <p className="mt-4 text-[#0A0F1E] font-medium">Loading...</p>
  </div>
);

// Format relative time
const getRelativeTime = (dateString) => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getCategoryColor = (category) => {
  const colors = {
    Computer: 'bg-blue-50',
    Science: 'bg-green-50',
    Mathematics: 'bg-purple-50',
    Language: 'bg-yellow-50',
    default: 'bg-gray-50'
  };
  return colors[category] || colors.default;
};

const getCategoryTextColor = (category) => {
  const colors = {
    Computer: 'text-blue-600',
    Science: 'text-green-600',
    Mathematics: 'text-purple-600',
    Language: 'text-yellow-600',
    default: 'text-gray-600'
  };
  return colors[category] || colors.default;
};

const CourseCard = ({ course, onDelete, onUpdateProgress, loading = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      onDelete(course.id);
    }
  };

  const handleMarkComplete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateProgress(course.id);
  };

  const handleCardClick = () => {
    navigate(`/course/${course.id}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="p-4 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient Header */}
      <div className={`${courseGradients[course.gradient || 'default']} p-6 relative`}>
        {isHovered && (
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 z-20 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Graduation Cap Icon */}
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20v-6" />
          </svg>
        </div>

        <div className="text-white">
          <h3 className="text-xl font-medium mb-2">{course.title}</h3>
          <p className="text-white text-opacity-90">{course.creditHours} Credit Hours</p>
        </div>
      </div>

      {/* Course Details */}
      <div className="p-4">
        {/* Slides Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-600">{course.slides || 0} Slides</span>
          </div>
          <button 
            onClick={() => navigate(`/course/${course.id}`)}
            className="text-indigo-600 text-sm hover:text-indigo-700"
          >
            View Details
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-indigo-100 rounded-full mb-4">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${course.progress || 0}%` }}
          />
        </div>

        {/* Progress and Action */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">+{course.progress || 0}%</span>
          <button 
            onClick={handleMarkComplete}
            className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-full hover:bg-indigo-100 transition-colors"
          >
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;