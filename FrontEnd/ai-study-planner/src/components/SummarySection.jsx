import React from 'react';

const SummarySection = ({ summary }) => {
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
          <div className="prose max-w-none text-gray-700">
            {summary.split('\n').map((line, index) => (
              <p key={index} className="mb-3 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Summary generated successfully
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
