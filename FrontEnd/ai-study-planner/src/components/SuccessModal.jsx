import React from 'react';

const SuccessModal = ({ isOpen, onClose, title, message, filename, onViewFiles, showViewButton = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 transform transition-all">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title || 'Success!'}
          </h3>
          <p className="text-gray-600 mb-4">
            {message || 'Operation completed successfully'}
          </p>
          
          {filename && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">File:</span> {filename}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            {showViewButton && onViewFiles && (
              <button
                onClick={() => {
                  onViewFiles();
                  onClose();
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                📖 View & Study Files
              </button>
            )}
            <button
              onClick={onClose}
              className={`w-full ${showViewButton && onViewFiles ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'} text-white font-semibold py-2 px-4 rounded-lg transition-colors`}
            >
              {showViewButton && onViewFiles ? 'Stay Here' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
