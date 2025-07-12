import React from "react";

const Strengths = ({ strengths }) => (
  <section className="bg-white rounded-xl shadow p-6 mb-6" aria-label="Your Strengths">
    <div className="flex items-center gap-2 mb-4">
      <span className="material-icons text-green-400 text-lg" aria-hidden="true">check_circle</span>
      <span className="text-lg font-semibold text-gray-800">Your Strengths</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {strengths.map((s, idx) => (
        <div key={idx} className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-icons text-green-400 text-base" aria-hidden="true">check_circle</span>
            <span className="font-semibold text-green-800">{s.title}</span>
          </div>
          <div className="text-green-700 text-sm">{s.description}</div>
        </div>
      ))}
    </div>
  </section>
);

export default Strengths; 