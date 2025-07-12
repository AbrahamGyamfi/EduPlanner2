import React from "react";

const PredictionCard = ({ percentage, gpa, grade, confidence, studyBehavior, quizPerformance }) => (
  <section className="bg-white rounded-xl shadow p-8 flex flex-col items-center justify-center w-full h-full" aria-label="CWA Prediction">
    <div className="bg-blue-100 rounded-full p-4 mb-4">
      <span className="material-icons text-blue-500 text-4xl" aria-hidden="true">school</span>
    </div>
    <div className="text-5xl font-extrabold text-blue-600 mb-2" aria-label="Prediction Percentage">{percentage}%</div>
    <div className="text-gray-500 mb-2">Enhanced CWA Prediction</div>
    <div className="text-xl font-semibold mb-1">{gpa}</div>
    <div className="text-gray-500 mb-2">GPA (4.0 scale)</div>
    <div className="text-lg font-bold mb-2">Grade: <span className="text-gray-700">{grade}</span></div>
    <div className="flex items-center gap-2 mb-6">
      <span className="material-icons text-base text-gray-400" aria-hidden="true">radio_button_checked</span>
      <span className="text-gray-500">{confidence} Confidence</span>
    </div>
    <div className="w-full flex justify-between text-gray-600 text-sm border-t pt-4 mt-auto">
      <div>
        <div className="font-semibold text-gray-700 mb-1">Study Behavior:</div>
        <div>{studyBehavior}%</div>
      </div>
      <div>
        <div className="font-semibold text-gray-700 mb-1">Quiz Performance:</div>
        <div>{quizPerformance}%</div>
      </div>
    </div>
  </section>
);

export default PredictionCard; 