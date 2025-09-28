import React from 'react';
import { FileText, X } from 'lucide-react';

const FileSelectorModal = ({ 
  isOpen, 
  onClose, 
  files, 
  onFileSelect, 
  title = 'Select a File',
  actionName = 'Continue'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No Files Available</h3>
              <p className="text-gray-500">Upload some files to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map(file => (
                <div 
                  key={file.filename}
                  onClick={() => onFileSelect(file)}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                >
                  <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{file.originalFilename || file.filename}</p>
                    <p className="text-sm text-gray-500">
                      {file.fileSize ? `${(file.fileSize / 1024).toFixed(2)} KB` : ''}
                      {file.uploadDate ? ` • Uploaded on ${new Date(file.uploadDate).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full group-hover:border-blue-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onFileSelect(null)} // Or a default action
            disabled={files.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {actionName}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileSelectorModal;
