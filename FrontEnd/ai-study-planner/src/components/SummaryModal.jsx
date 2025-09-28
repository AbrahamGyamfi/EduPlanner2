import React from 'react';

// Function to parse markdown-like formatting
const parseMarkdown = (text) => {
  if (!text) return null;
  
  // Split by lines and process each
  return text.split('\n').map((line, lineIndex) => {
    if (!line.trim()) return <br key={lineIndex} />;
    
    // Check for headers (## or #)
    if (line.startsWith('## ')) {
      return (
        <h3 key={lineIndex} className="text-lg font-semibold text-gray-800 mt-4 mb-2">
          {line.substring(3)}
        </h3>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h2 key={lineIndex} className="text-xl font-bold text-gray-900 mt-4 mb-3">
          {line.substring(2)}
        </h2>
      );
    }
    
    // Check for bullet points
    if (line.match(/^[\s]*[\*\-•]\s/)) {
      const content = line.replace(/^[\s]*[\*\-•]\s/, '');
      return (
        <div key={lineIndex} className="flex items-start mb-2 ml-4">
          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
          <span className="text-gray-700">{formatTextWithBold(content)}</span>
        </div>
      );
    }
    
    // Check for numbered lists
    if (line.match(/^[\s]*\d+\.\s/)) {
      const match = line.match(/^[\s]*(\d+)\.\s(.*)/);
      if (match) {
        return (
          <div key={lineIndex} className="flex items-start mb-2 ml-4">
            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
              {match[1]}
            </span>
            <span className="text-gray-700">{formatTextWithBold(match[2])}</span>
          </div>
        );
      }
    }
    
    // Regular paragraph
    return (
      <p key={lineIndex} className="mb-3 leading-relaxed text-gray-700">
        {formatTextWithBold(line)}
      </p>
    );
  });
};

// Function to handle bold text formatting
const formatTextWithBold = (text) => {
  if (!text) return null;
  
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-semibold text-gray-900">{part}</strong>;
    }
    return part;
  });
};

const SummaryModal = ({ isOpen, onClose, summary, filename }) => {
  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Document Summary</h2>
              {filename && (
                <p className="text-blue-100 text-sm">{filename}</p>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors p-1 rounded-full hover:bg-blue-500"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
            <div className="prose max-w-none">
              {parseMarkdown(summary)}
            </div>
          </div>

          {/* Key Points Section (if summary contains bullet points) */}
          {(summary.includes('•') || summary.includes('-')) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Key Insights
              </h3>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Summary generated successfully
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(summary);
                // You could add a toast notification here
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
            
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
