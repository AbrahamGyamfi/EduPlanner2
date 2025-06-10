import React from 'react';

const AreasOfFocus = ({ strongAreas, weakAreas }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
        <h3 className="text-lg font-semibold mb-3 text-green-700 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Strong Areas
        </h3>
        {strongAreas && strongAreas.length > 0 ? (
          <ul className="space-y-2">
            {strongAreas.map((area, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{area}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">No strong areas identified yet.</p>
        )}
      </div>

      <div className="p-6 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
        <h3 className="text-lg font-semibold mb-3 text-amber-700 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Areas for Improvement
        </h3>
        {weakAreas && weakAreas.length > 0 ? (
          <ul className="space-y-2">
            {weakAreas.map((area, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{area}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">No significant weak areas identified.</p>
        )}
      </div>
    </div>
  );
};

export default AreasOfFocus;
