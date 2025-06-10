import React from 'react';

const GPACards = ({ currentGPA, projectedGPA }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 uppercase mb-1">Current GPA</h3>
        <div className="text-3xl font-bold text-blue-800">{currentGPA.toFixed(2)}</div>
        <div className="mt-1 text-sm text-blue-600">Based on your current course performance</div>
      </div>
      
      <div className="p-6 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
        <h3 className="text-sm font-medium text-purple-800 uppercase mb-1">Projected GPA</h3>
        <div className="text-3xl font-bold text-purple-800">{projectedGPA.toFixed(2)}</div>
        <div className="mt-1 text-sm text-purple-600">Potential GPA with recommended improvements</div>
      </div>
    </div>
  );
};

export default GPACards;
