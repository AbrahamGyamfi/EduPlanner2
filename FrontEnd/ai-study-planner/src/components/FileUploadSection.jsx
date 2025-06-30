import React from 'react';

const FileUploadSection = ({
  selectedFile,
  uploadedFile,
  extractedText,
  loading,
  onFileSelect,
  onFileUpload
}) => {
  return (
    <div className="px-4 mt-6 flex justify-center">
      <div className="upload-section bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2">
          <span role="img" aria-label="folder">📁</span> Upload Your Slides
        </h2>
        <div className="file-input-container w-full flex flex-col items-center mb-6">
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg"
            onChange={onFileSelect}
            className="file-input border-2 border-dashed border-indigo-300 rounded-lg px-6 py-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="file-input-label block mt-2 cursor-pointer text-indigo-700 font-medium">
            {selectedFile ? selectedFile.name : 'Choose File'}
          </label>
        </div>
        <button
          onClick={onFileUpload}
          disabled={!selectedFile || loading}
          className="upload-btn bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition text-lg w-full"
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
        {uploadedFile && (
          <div className="upload-success mt-4 text-green-600 font-semibold">
            ✅ File uploaded: {uploadedFile}
          </div>
        )}
        {extractedText && (
          <div className="extracted-text mt-6 w-full bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-indigo-700">📝 Extracted Text Preview:</h3>
            <div className="text-gray-700 text-base max-h-40 overflow-y-auto whitespace-pre-line">
              {extractedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;
