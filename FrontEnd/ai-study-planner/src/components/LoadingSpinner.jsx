import React from 'react';

const LoadingSpinner = ({ size = 'default', fullScreen = false }) => {
  const spinnerClasses = {
    small: 'w-5 h-5',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50'
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer spinner */}
        <div
          className={`${spinnerClasses[size]} border-4 border-blue-200 rounded-full animate-spin`}
          style={{ borderTopColor: '#3B82F6' }}
        ></div>
        {/* Inner dot */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
            size === 'small' ? 'w-1.5 h-1.5' : size === 'large' ? 'w-3 h-3' : 'w-2 h-2'
          } bg-blue-600 rounded-full`}
        ></div>
      </div>
      {fullScreen && (
        <p className="ml-3 text-lg font-medium text-gray-600">Loading...</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 