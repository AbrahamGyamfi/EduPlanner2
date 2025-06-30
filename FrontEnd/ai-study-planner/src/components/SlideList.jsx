import React from "react";

const SlideList = ({ 
  slides, 
  onSummarize, 
  onGenerateQuiz, 
  onDelete, 
  processing, 
  isDeleting 
}) => {
  // Ensure slides is always an array
  const slidesList = Array.isArray(slides) ? slides : [];
  
  if (!slidesList || slidesList.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-4 bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
      <ul className="space-y-2">
        {slidesList.map((slide, index) => (
          <li key={index} className="flex items-center justify-between text-sm text-gray-600 bg-white p-2 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {slide}
            </div>
            <div className="flex items-center gap-2">
              {(slide.toLowerCase().endsWith('.pdf') || slide.toLowerCase().endsWith('.txt') || slide.toLowerCase().endsWith('.docx')) && (
                <>
                  <button
                    onClick={() => {
                      console.log('Summarize clicked for:', slide);
                      onSummarize(slide);
                    }}
                    className="text-blue-500 hover:text-blue-700 ml-2 border border-blue-300 px-2 py-1 rounded text-xs transition-colors duration-200"
                    disabled={processing}
                    title="Generate summary for this file"
                  >
                    {processing ? 'Processing...' : 'Summarize'}
                  </button>
                  <button
                    onClick={() => {
                      console.log('Generate Quiz clicked for:', slide);
                      onGenerateQuiz(slide);
                    }}
                    className="text-green-500 hover:text-green-700 ml-2 border border-green-300 px-2 py-1 rounded text-xs transition-colors duration-200"
                    disabled={processing}
                    title="Generate quiz questions for this file"
                  >
                    {processing ? 'Processing...' : 'Generate Quiz'}
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(slide)}
                className="text-red-500 hover:text-red-700 focus:outline-none transition-colors duration-200"
                title="Delete slide"
                disabled={isDeleting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SlideList; 