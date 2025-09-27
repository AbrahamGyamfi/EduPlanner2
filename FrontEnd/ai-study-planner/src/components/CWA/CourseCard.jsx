import React from 'react';
import { useState } from 'react';
import { useNavigationLoading } from '../../contexts/NavigationLoadingContext';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

// Define darker gradient combinations
const courseGradients = {
  blue: 'bg-gradient-to-br from-[#003166] via-[#0353a4] to-[#0466c8]', // Deep Ocean Blue
  purple: 'bg-gradient-to-br from-[#3c096c] via-[#5a189a] to-[#7b2cbf]', // Royal Purple
  green: 'bg-gradient-to-br from-[#004b23] via-[#006400] to-[#007200]', // Forest Green
  orange: 'bg-gradient-to-br from-[#7f2704] via-[#bc3908] to-[#c44536]', // Deep Orange
  pink: 'bg-gradient-to-br from-[#800f2f] via-[#a4133c] to-[#c9184a]', // Deep Rose
  teal: 'bg-gradient-to-br from-[#014d4e] via-[#0a6c6e] to-[#0f969c]', // Dark Teal
  indigo: 'bg-gradient-to-br from-[#242582] via-[#2b2f77] to-[#3c1642]', // Midnight Indigo
  crimson: 'bg-gradient-to-br from-[#641220] via-[#85182a] to-[#a71e34]', // Deep Crimson
  emerald: 'bg-gradient-to-br from-[#004b23] via-[#006400] to-[#007f5f]', // Dark Emerald
  violet: 'bg-gradient-to-br from-[#240046] via-[#3c096c] to-[#5a189a]', // Deep Violet
  coral: 'bg-gradient-to-br from-[#7f2704] via-[#bc3908] to-[#c44536]', // Burnt Coral
  azure: 'bg-gradient-to-br from-[#012a4a] via-[#013a63] to-[#01497c]', // Deep Azure
};

// Get a gradient based on index to ensure even distribution
const getGradientByIndex = (index) => {
  const gradientKeys = Object.keys(courseGradients);
  const selectedGradient = courseGradients[gradientKeys[index % gradientKeys.length]];
  return `${selectedGradient} shadow-lg`;
};

// Format time duration
const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Course icons based on course names
const getCourseIcon = (courseName) => {
  const name = courseName?.toLowerCase() || '';
  
  if (name.includes('system') || name.includes('computer') || name.includes('programming')) {
    return (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  
  if (name.includes('math') || name.includes('calculus') || name.includes('statistics')) {
    return (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  
  if (name.includes('science') || name.includes('physics') || name.includes('chemistry')) {
    return (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    );
  }
  
  if (name.includes('language') || name.includes('english') || name.includes('writing')) {
    return (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }

  // Default graduation cap icon
  return (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20v-6" />
    </svg>
  );
};

// Track progress status constants
const PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// Progress thresholds for different achievement levels
const ACHIEVEMENT_LEVELS = {
  BEGINNER: 25,
  INTERMEDIATE: 50,
  ADVANCED: 75,
  MASTERY: 100
};

const CourseCard = ({ 
  course, 
  onClick,
  onDeleteCourse,
  onUpdateProgress,
  index = 0,
  onStatusChange
}) => {
  const { navigateWithLoading } = useNavigationLoading();
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Background tracking calculations (not visible but used for progress)
  const progress = course.progress || 0;
  const totalSlides = course.slides || 0;
  const completedSlides = Math.floor((progress / 100) * totalSlides);
  const remainingSlides = totalSlides - completedSlides;
  const timeSpent = course.timeSpent || 0;
  const totalDuration = course.duration || 0;
  const estimatedTimeLeft = Math.ceil(totalDuration * (remainingSlides / totalSlides));
  const completedObjectives = course.completedObjectives || 0;
  const totalObjectives = course.totalObjectives || 0;

  // Silent tracking functions
  const trackStudyStreak = () => {
    const streak = course.studyStreak || 0;
    const lastStudied = course.lastAccessed ? new Date(course.lastAccessed) : null;
    const today = new Date();
    if (!lastStudied) return 0;
    const daysSinceLastStudy = Math.floor((today - lastStudied) / (1000 * 60 * 60 * 24));
    return daysSinceLastStudy <= 1 ? streak : 0;
  };

  const getProgressStatus = () => {
    if (progress === 100) return PROGRESS_STATUS.COMPLETED;
    if (progress > 0) return PROGRESS_STATUS.IN_PROGRESS;
    return PROGRESS_STATUS.NOT_STARTED;
  };

  const getProgressColor = () => {
    if (progress >= ACHIEVEMENT_LEVELS.MASTERY) return 'bg-green-600';
    if (progress >= ACHIEVEMENT_LEVELS.ADVANCED) return 'bg-blue-600';
    if (progress >= ACHIEVEMENT_LEVELS.INTERMEDIATE) return 'bg-yellow-500';
    return 'bg-[#4338ca]';
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleNavigate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to the course detail page using the course ID with loading transition
    await navigateWithLoading(
      `/coursedetails/${course.id}`,
      {},
      `Loading ${course.name || course.title}...`,
      'Preparing your course materials'
    );
  };

  const handleStatusToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(course.id, course.status === 'completed' ? 'ongoing' : 'completed');
    }
  };

  return (
    <div 
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden w-full transform transition-all duration-300 hover:scale-[1.02] cursor-pointer max-w-sm"
      onClick={handleNavigate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete Button - Appears on Hover */}
      {isHovered && (
        <div className="absolute top-3 right-3 z-10 flex space-x-2">
          <button
            onClick={handleStatusToggle}
            className="p-1.5 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition-all duration-200 transform hover:scale-110"
            aria-label="Toggle course status"
          >
            {course.status === 'completed' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-all duration-200 transform hover:scale-110"
            aria-label="Delete course"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Course Header */}
      <div className={`${getGradientByIndex(index)} p-6 relative min-h-[140px]`}>
        <div className="w-12 h-12 bg-white/15 backdrop-filter backdrop-blur-lg rounded-full flex items-center justify-center mb-4 shadow-xl">
          {getCourseIcon(course.name || course.title)}
        </div>

        <div className="text-white">
          <h3 className="text-xl font-medium mb-2 drop-shadow-md tracking-wide text-white">{course.name || course.title}</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm font-normal text-white drop-shadow-sm">{course.creditHours} Credit Hours</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              course.status === 'ongoing' 
                ? 'bg-green-500/20 text-green-100' 
                : 'bg-gray-500/20 text-gray-100'
            }`}>
              {course.status === 'ongoing' ? '● Ongoing' : '○ Completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Simplified Visual Interface */}
      <div className="p-5 bg-white dark:bg-gray-800" onClick={e => e.stopPropagation()}>
        {/* Simple Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Progress</span>
            <span className="text-sm font-normal text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center">
            <svg 
              className="w-4 h-4 text-gray-700 dark:text-gray-300 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-normal text-gray-700 dark:text-gray-300">{formatDuration(totalDuration)}</span>
          </div>
          <div className="flex items-center justify-end">
            <svg 
              className="w-4 h-4 text-gray-700 dark:text-gray-300 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-normal text-gray-700 dark:text-gray-300">{totalSlides} Slides</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate(e);
            }}
            className="px-3 py-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Details
          </button>
          {getProgressStatus() === PROGRESS_STATUS.COMPLETED ? (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigate(e);
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Review
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigate(e);
              }}
              className="px-4 py-1.5 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center"
            >
              {getProgressStatus() === PROGRESS_STATUS.IN_PROGRESS ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Continue
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Course"
        message={`Are you sure you want to delete "${course.name || course.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          onDeleteCourse && onDeleteCourse(course.id);
        }}
      />
    </div>
  );
};

export default CourseCard;
