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

const SummarySection = ({ summary, onSave, isSaving = false, isAlreadySaved = false, onCopy }) => {
  if (!summary) return null;

  return (
    <div className="px-4 mt-6 flex justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl">📄</span>
          </div>
          <h2 className="text-2xl font-bold text-blue-700">Document Summary</h2>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-l-4 border-blue-500">
          <div className="prose max-w-none">
            {parseMarkdown(summary)}
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Summary generated successfully
          </div>
          
          <div className="flex gap-3">
            {/* Copy Button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(summary);
                if (onCopy) {
                  onCopy();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="Copy summary to clipboard"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
            
            {/* Save Button */}
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving || isAlreadySaved}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isAlreadySaved
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : isSaving
                    ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title={isAlreadySaved ? 'Summary already saved' : 'Save summary to activities'}
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m100 50c0-27.614-22.386-50-50-50s-50 22.386-50 50c0 27.614 22.386 50 50 50v0c0 0 0 0 0 0v-8c0-23.196-18.804-42-42-42s-42 18.804-42 42c0 23.196 18.804 42 42 42v8s0 0 0 0c27.614 0 50-22.386 50-50z"></path>
                    </svg>
                    Saving...
                  </>
                ) : isAlreadySaved ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
