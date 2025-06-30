import React from "react";

const ResultModal = ({ 
  isOpen, 
  onClose, 
  processingType, 
  processingSlide, 
  processing, 
  summary, 
  quiz 
}) => {
  if (!isOpen) return null;

  const content = processingType === "summary" ? summary : quiz;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {processingType === "summary" ? "Summary" : "Quiz"} for {processingSlide}
        </h3>
        {processing ? (
          <div className="text-indigo-700 font-semibold mb-2">Processing...</div>
        ) : (
          <div className="w-full bg-gray-100 rounded-lg p-4 mb-4 text-gray-800 text-left whitespace-pre-wrap min-h-[100px]">
            {content}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal; 