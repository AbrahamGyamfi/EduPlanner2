import React from 'react';

const RecommendationsList = ({ recommendations }) => {
  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg mb-8 border border-indigo-100">
      <h3 className="text-lg font-semibold mb-4 text-indigo-700 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Personalized Recommendations
      </h3>
      <ul className="space-y-3">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-600 mr-3 mt-0.5 text-xs font-bold">
              {index + 1}
            </span>
            <span className="text-gray-700">{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendationsList;
