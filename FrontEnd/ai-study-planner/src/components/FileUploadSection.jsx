import React from 'react';
import { Upload, FileText, Trash2, CheckCircle, Clock } from 'lucide-react';

const FileUploadSection = ({
  selectedFiles,
  uploadedFiles, // Changed from uploadedFile
  loading,
  onFileSelect,
  onFileUpload,
  onFileDelete,
  onViewFile,
  onReadFile
}) => {
  const hasFiles = selectedFiles.length > 0;
  
  return (
    <div className="px-4 mt-6">
      <div className="upload-section bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-indigo-700 flex items-center gap-3">
          <Upload className="w-7 h-7" /> Manage Course Slides
        </h2>

        {/* File Input */}
        <div className="mb-6 p-6 border-2 border-dashed border-indigo-300 rounded-lg text-center bg-indigo-50">
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.docx"
            onChange={onFileSelect}
            className="hidden"
            id="file-upload"
            multiple
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-200 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="font-semibold text-indigo-700">Click to browse or drag and drop files</p>
              <p className="text-sm text-gray-500 mt-1">Supports PDF, PPT, DOCX, TXT, PNG, JPG</p>
            </div>
          </label>
        </div>

        {/* Selected Files Preview */}
        {hasFiles && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Selected Files ({selectedFiles.length}):</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium flex-1">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              ))}
            </div>
            <button
              onClick={onFileUpload}
              disabled={loading}
              className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-500 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition text-lg"
            >
              {loading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
            </button>
          </div>
        )}

        {/* Uploaded Files List */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Uploaded Slides</h3>
          {uploadedFiles.length > 0 ? (
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.filename} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <button 
                        onClick={() => {
                          onViewFile(file);
                          // Optionally switch to read tab after viewing file
                          // This can be controlled by a prop if needed
                        }} 
                        className="font-semibold text-indigo-700 hover:underline text-left"
                        title="Click to view this file"
                      >
                        {file.originalFilename || file.filename}
                      </button>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        {file.uploadDate && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {file.fileSize && (
                          <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onReadFile && onReadFile(file)}
                      className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors"
                      title="Start reading this slide"
                    >
                      Read
                    </button>
                    <button 
                      onClick={() => onFileDelete(file.filename)} 
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No slides uploaded for this course yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadSection;
