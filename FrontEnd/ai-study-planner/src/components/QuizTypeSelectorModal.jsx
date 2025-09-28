import React from 'react';
import { X, List, CheckSquare } from 'lucide-react';

const QuizTypeSelectorModal = ({
  isOpen,
  onClose,
  onSelect,
  actionName = 'Generate Quiz'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Select Quiz Type</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          <div
            onClick={() => onSelect('mcq')}
            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
          >
            <List className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Multiple Choice</h3>
              <p className="text-sm text-gray-500">Generate a quiz with multiple choice questions.</p>
            </div>
          </div>
          <div
            onClick={() => onSelect('theory')}
            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-300 cursor-pointer transition-all"
          >
            <CheckSquare className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Theory-Based</h3>
              <p className="text-sm text-gray-500">Generate a quiz with open-ended theory questions.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizTypeSelectorModal;

