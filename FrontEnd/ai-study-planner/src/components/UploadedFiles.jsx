import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';

const UploadedFiles = ({ courseId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkpoints, setCheckpoints] = useState({});
  const [generatingCheckpoints, setGeneratingCheckpoints] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseFiles();
  }, [courseId]);

  const fetchCourseFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/course-files/${courseId}`);
      setFiles(response.data.files);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course files:', error);
      setLoading(false);
    }
  };

  const generateCheckpoints = async (fileId, filename) => {
    setGeneratingCheckpoints(prev => ({ ...prev, [fileId]: true }));
    
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-checkpoints`, {
        file_id: fileId
      });
      
      setCheckpoints(prev => ({
        ...prev,
        [fileId]: response.data.checkpoints
      }));
    } catch (error) {
      console.error('Error generating checkpoints:', error);
      alert('Error generating learning checkpoints. Please try again.');
    } finally {
      setGeneratingCheckpoints(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const viewFileContent = async (fileId, filename) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/file-content/${fileId}`);
      navigate('/summary', {
        state: {
          summary: response.data.extracted_text,
          filename: filename,
          courseId: courseId
        }
      });
    } catch (error) {
      console.error('Error fetching file content:', error);
      alert('Error loading file content.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (extension) => {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📁';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'reflection':
        return '🤔';
      case 'application':
        return '⚙️';
      case 'analysis':
        return '🔍';
      case 'synthesis':
        return '🧩';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading uploaded files...</p>
          </div>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Files Uploaded Yet</h3>
          <p className="text-gray-600">Upload your first slide or document to start learning!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl">📚</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Uploaded Materials</h2>
            <p className="text-sm text-gray-600">Access your learning materials and track progress</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-blue-600">{files.length}</div>
          <div className="text-sm text-gray-500">Files uploaded</div>
        </div>
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.file_id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{getFileIcon(file.file_extension)}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{file.original_filename}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {formatFileSize(file.file_size)} • {formatDate(file.upload_date)}
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-2">{file.extracted_text}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => viewFileContent(file.file_id, file.original_filename)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                
                {!checkpoints[file.file_id] ? (
                  <button
                    onClick={() => generateCheckpoints(file.file_id, file.original_filename)}
                    disabled={generatingCheckpoints[file.file_id]}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {generatingCheckpoints[file.file_id] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Generate Checkpoints
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center space-x-1 px-3 py-2 bg-green-200 text-green-800 rounded-lg text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Checkpoints Ready
                  </div>
                )}
              </div>
            </div>

            {/* Learning Checkpoints */}
            {checkpoints[file.file_id] && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-lg mr-2">🎯</span>
                  Learning Checkpoints
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {checkpoints[file.file_id].map((checkpoint) => (
                    <div key={checkpoint.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h6 className="font-medium text-gray-800 text-sm flex items-center">
                          <span className="mr-2">{getTypeIcon(checkpoint.type)}</span>
                          {checkpoint.title}
                        </h6>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(checkpoint.difficulty)}`}>
                          {checkpoint.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{checkpoint.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedFiles;
