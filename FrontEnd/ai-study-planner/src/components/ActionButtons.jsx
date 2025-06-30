import React from 'react';

const ActionButtons = ({ uploadedFile, loading, onGenerateSummary, onGenerateQuiz }) => {
  if (!uploadedFile) return null;

  return (
    <div className="px-4 mt-6 flex justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Summary Generation Card */}
        <div 
          onClick={loading ? undefined : onGenerateSummary}
          className={`bg-white rounded-2xl shadow-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-blue-300 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-700">Generate Summary</h3>
              <p className="text-sm text-gray-600">Create an intelligent summary</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500">
            <p className="text-gray-700 text-sm mb-3">
              Get a comprehensive summary of your uploaded document with key points and insights.
            </p>
            
            <div className="flex items-center text-blue-600">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium">
                {loading ? 'Generating...' : 'Click to generate'}
              </span>
            </div>
          </div>
          
          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Quiz Generation Card */}
        <div 
          onClick={loading ? undefined : onGenerateQuiz}
          className={`bg-white rounded-2xl shadow-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-purple-300 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">❓</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-700">Generate Quiz</h3>
              <p className="text-sm text-gray-600">Test your knowledge</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-l-4 border-purple-500">
            <p className="text-gray-700 text-sm mb-3">
              Create an interactive quiz based on your document content to test understanding.
            </p>
            
            <div className="flex items-center text-purple-600">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium">
                {loading ? 'Generating...' : 'Click to generate'}
              </span>
            </div>
          </div>
          
          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;
