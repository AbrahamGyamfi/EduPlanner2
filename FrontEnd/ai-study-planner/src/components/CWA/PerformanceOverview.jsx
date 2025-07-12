import React from "react";

const PerformanceOverview = ({ quizAverage, preparationLevel, studyHours, consistencyScore }) => (
  <section className="bg-white rounded-xl shadow p-8 flex flex-col w-full h-full" aria-label="Performance Overview">
    <div className="flex items-center gap-2 mb-4">
      <span className="material-icons text-blue-500 text-lg" aria-hidden="true">radio_button_checked</span>
      <span className="text-lg font-semibold text-gray-800">Performance Overview</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div>
        <div className="flex justify-between mb-1 text-gray-700 text-sm">
          <span>Quiz Average</span>
          <span className="font-semibold">{quizAverage}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 bg-gray-300 rounded-full" style={{ width: `${quizAverage}%` }}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1 text-gray-700 text-sm">
          <span>Preparation Level</span>
          <span className="font-semibold">{preparationLevel}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 bg-gray-300 rounded-full" style={{ width: `${preparationLevel}%` }}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1 text-gray-700 text-sm">
          <span>Study Hours/Week</span>
          <span className="font-semibold">{studyHours}h</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${Math.min(studyHours * 2.4, 100)}%` }}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1 text-gray-700 text-sm">
          <span>Consistency Score</span>
          <span className="font-semibold">{consistencyScore}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 bg-gray-300 rounded-full" style={{ width: `${consistencyScore}%` }}></div>
        </div>
      </div>
    </div>
  </section>
);

export default PerformanceOverview; 