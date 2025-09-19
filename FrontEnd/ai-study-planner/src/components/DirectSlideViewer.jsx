import React, { useState, useEffect, useRef } from 'react';
import { Eye, FileText, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, ExternalLink, AlertTriangle } from 'lucide-react';

const DirectSlideViewer = ({ 
  uploadedFile,
  filename, 
  onReadingProgress, 
  onInteraction 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [viewMode, setViewMode] = useState('direct'); // 'direct', 'download', or 'info'
  const [showControls, setShowControls] = useState(true);
  const [fileType, setFileType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const viewerRef = useRef(null);
  const containerRef = useRef(null);

  // Track reading start time
  const startTimeRef = useRef(null);

  // Get file extension and determine how to display the file
  useEffect(() => {
    if (filename) {
      const extension = filename.split('.').pop().toLowerCase();
      setFileType(extension);
      setIsLoading(false);
      
      // Track reading start and automatically start session
      startTimeRef.current = Date.now();
      if (onInteraction) {
        onInteraction('start_reading', { 
          filename, 
          startTime: startTimeRef.current,
          fileType: extension,
          autoStart: true // Flag to indicate automatic session start
        });
      }
    }

    // Cleanup function to track reading end
    return () => {
      if (onInteraction && filename && startTimeRef.current) {
        const endTime = Date.now();
        const readingTime = endTime - startTimeRef.current;
        onInteraction('end_reading', { 
          filename, 
          readingTime,
          finalProgress: readingProgress,
          fileType: fileType,
          autoStop: true // Flag to indicate automatic session stop
        });
      }
    };
    // Only re-run when filename changes to prevent infinite loops
  }, [filename]);

  // Progress tracking for scroll-based content
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Throttle scroll events to prevent excessive updates
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 100;
        setReadingProgress(progress);
        
        if (onReadingProgress) {
          onReadingProgress(progress, 1, 1);
        }
      }, 100); // Throttle to 100ms
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [onReadingProgress]);

  const getFileUrl = () => {
    if (!uploadedFile) {
      console.error('No uploadedFile provided to getFileUrl');
      return null;
    }
    const url = `http://localhost:5000/serve-file/${encodeURIComponent(uploadedFile)}`;
    // For debugging: also try port 5001
    const testUrl = `http://localhost:5001/serve-file/${encodeURIComponent(uploadedFile)}`;
    console.log('Primary URL:', url);
    console.log('Test URL (port 5001):', testUrl);
    console.log('Generated file URL:', url);
    return url;
  };

  const downloadFile = () => {
    const url = getFileUrl();
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openInNewTab = () => {
    window.open(getFileUrl(), '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    setReadingProgress(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const renderFileContent = () => {
    const fileUrl = getFileUrl();
    
    if (!fileUrl) {
      setError('Unable to generate file URL');
      setIsLoading(false);
      return null;
    }

    console.log('Rendering file content for type:', fileType, 'URL:', fileUrl);

    // For PDF files, use an embedded PDF viewer
    if (fileType === 'pdf') {
      return (
        <div className="w-full h-full">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={filename}
            onLoad={() => {
              console.log('PDF loaded successfully');
              setIsLoading(false);
              setError('');
            }}
            onError={(e) => {
              console.error('Failed to load PDF:', e);
              setError(`Could not load PDF file. Please check if the file exists and the server is running.`);
              setIsLoading(false);
            }}
          />
        </div>
      );
    }

    // For PowerPoint files, show download option and preview if possible
    if (fileType === 'ppt' || fileType === 'pptx') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-8">
          <div className="max-w-2xl text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">PowerPoint Presentation</h3>
            <p className="text-gray-600 mb-6">
              {filename}
            </p>
            <p className="text-gray-500 mb-8 text-sm">
              PowerPoint files cannot be displayed directly in the browser. You can download the file to view it in PowerPoint or a compatible application.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={downloadFile}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download & Open</span>
              </button>
              <button 
                onClick={openInNewTab}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Open in Browser</span>
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>Tip:</strong> For the best viewing experience, download the file and open it in Microsoft PowerPoint, Google Slides, or LibreOffice Impress.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // For Word documents
    if (fileType === 'docx') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-8">
          <div className="max-w-2xl text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Word Document</h3>
            <p className="text-gray-600 mb-6">
              {filename}
            </p>
            <p className="text-gray-500 mb-8 text-sm">
              Word documents cannot be displayed directly in the browser. You can download the file to view it in Microsoft Word or a compatible application.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={downloadFile}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download & Open</span>
              </button>
              <button 
                onClick={openInNewTab}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Open in Browser</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // For images
    if (['png', 'jpg', 'jpeg'].includes(fileType)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
          <img
            src={fileUrl}
            alt={filename}
            className="max-w-full max-h-full object-contain shadow-lg"
            onLoad={() => {
              console.log('Image loaded successfully');
              setIsLoading(false);
              setError('');
            }}
            onError={(e) => {
              console.error('Failed to load image:', e, 'URL:', fileUrl);
              setError(`Could not load image file. Please check if the file exists and the server is running.`);
              setIsLoading(false);
            }}
          />
        </div>
      );
    }

    // For text files
    if (fileType === 'txt') {
      return (
        <div className="w-full h-full">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 bg-white"
            title={filename}
            onLoad={() => {
              console.log('Text file loaded successfully');
              setIsLoading(false);
              setError('');
            }}
            onError={(e) => {
              console.error('Failed to load text file:', e, 'URL:', fileUrl);
              setError(`Could not load text file. Please check if the file exists and the server is running.`);
              setIsLoading(false);
            }}
          />
        </div>
      );
    }

    // Fallback for other file types
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="max-w-2xl text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">File Viewer</h3>
          <p className="text-gray-600 mb-6">
            {filename}
          </p>
          <p className="text-gray-500 mb-8 text-sm">
            This file type cannot be displayed directly in the browser. Please download the file to view it with an appropriate application.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={downloadFile}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download File</span>
            </button>
            <button 
              onClick={openInNewTab}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open in Browser</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!uploadedFile) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No File Selected</h3>
        <p className="text-gray-600">Upload a file to start viewing and reading.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading File</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 p-2 rounded">
          File: {filename || 'Unknown'}<br/>
          Type: {fileType || 'Unknown'}<br/>
          URL: {getFileUrl() || 'Unable to generate URL'}
        </div>
        <button 
          onClick={() => {
            setError('');
            setIsLoading(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={viewerRef}
      className={`slide-viewer-container bg-gray-100 rounded-2xl shadow-xl overflow-hidden relative ${
        isFullscreen ? 'fixed inset-0 z-50' : 'mt-6'
      }`}
      style={{ height: isFullscreen ? '100vh' : '600px' }}
    >
      {/* View Mode Tabs */}
      <div className="absolute top-4 left-4 z-40 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setViewMode('direct')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'direct' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
            title="Direct file view"
          >
            <Eye className="w-4 h-4 inline mr-1" /> View File
          </button>
          <button
            onClick={() => setViewMode('info')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'info' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
            title="File information"
          >
            <FileText className="w-4 h-4 inline mr-1" /> Info
          </button>
        </div>
      </div>

      {/* Floating Toolbar */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-2 flex items-center space-x-2 border">
          <button 
            onClick={resetView} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={downloadFile} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={openInNewTab} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300" />
          <button 
            onClick={toggleFullscreen} 
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Content Area */}
      <div
        ref={containerRef}
        className="content-area overflow-auto h-full bg-white"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Direct File View */}
        {viewMode === 'direct' && (
          <div className="w-full h-full">
            {isLoading && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading file...</p>
                </div>
              </div>
            )}
            {!isLoading && renderFileContent()}
          </div>
        )}

        {/* File Info View */}
        {viewMode === 'info' && (
          <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6 border-b pb-2">{filename} - File Information</h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* File Details */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  File Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Original Name:</span>
                    <span className="font-semibold">{filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">File Type:</span>
                    <span className="font-semibold uppercase">{fileType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Status:</span>
                    <span className="font-semibold text-green-600">Available for Viewing</span>
                  </div>
                </div>
              </div>

              {/* Viewing Options */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-green-600" />
                  Viewing Options
                </h2>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-600">Recommended viewing method:</span>
                    <div className="mt-1">
                      {fileType === 'pdf' && (
                        <span className="text-green-600 font-medium">Direct browser viewing</span>
                      )}
                      {['ppt', 'pptx', 'docx'].includes(fileType) && (
                        <span className="text-orange-600 font-medium">Download and open with appropriate app</span>
                      )}
                      {['png', 'jpg', 'jpeg'].includes(fileType) && (
                        <span className="text-green-600 font-medium">Direct browser viewing</span>
                      )}
                      {fileType === 'txt' && (
                        <span className="text-green-600 font-medium">Direct browser viewing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">File Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setViewMode('direct')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View File</span>
                </button>
                <button 
                  onClick={downloadFile}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button 
                  onClick={openInNewTab}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reading Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-transparent">
        <div 
          className="h-full bg-blue-600 transition-all duration-200"
          style={{ width: `${readingProgress}%` }}
        />
      </div>
    </div>
  );
};

export default DirectSlideViewer;
