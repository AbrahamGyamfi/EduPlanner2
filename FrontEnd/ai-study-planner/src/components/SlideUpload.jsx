import React, { useRef, useState, useEffect } from "react";

const SlideUpload = ({ onUpload, isUploading, uploadSuccess, uploadError, onClearError, hasSlides }) => {
  const fileInputRef = useRef(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Show success message briefly after upload completes
  useEffect(() => {
    if (uploadSuccess) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const handleUploadClick = () => {
    onClearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2 text-indigo-700">Course Materials</h2>
        <p className="text-gray-600 mb-4 text-center">
          Upload your course slides (PDF or Word documents) to enable summary and quiz generation features.
        </p>
        
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-600 text-sm">File uploaded successfully! You can now use the summary and quiz features.</p>
          </div>
        )}
        
        {/* Error Messages */}
        {uploadError && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{uploadError}</p>
          </div>
        )}

        <button
          className={`flex items-center gap-2 ${hasSlides ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-semibold px-6 py-3 rounded-lg text-base shadow transition mb-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : hasSlides ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Upload More Files
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Upload File
            </>
          )}
        </button>
        
        {hasSlides && (
          <p className="text-sm text-indigo-600 mt-1">
            Files uploaded. You can now use the summary and quiz features.
          </p>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default SlideUpload;