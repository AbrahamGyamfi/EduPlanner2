import React, { useState } from 'react';
import { X, Lightbulb, Eye, Upload, BookOpen } from 'lucide-react';

const SlideViewTip = ({ show = true, onClose }) => {
  const [isVisible, setIsVisible] = useState(show);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              How to View Your Slides
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <Upload className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">1. Upload Files:</span> Click "📁 Upload & Manage" to add your PDF, DOCX, or text files
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">2. Select to View:</span> Click on any uploaded file name to load it for viewing
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">3. Start Reading:</span> Switch to "📖 Read & Study" tab to view your slides in the reader
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 <strong>Tip:</strong> After uploading, you can click "📖 View & Study Files" in the success modal to jump directly to the reader!
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleClose}
          className="text-blue-400 hover:text-blue-600 transition-colors"
          title="Close tip"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SlideViewTip;
