import React from "react";

const ImprovementPlan = ({ plans }) => (
  <section className="bg-white rounded-xl shadow p-6 mb-6" aria-label="Personalized Improvement Plan">
    <div className="flex items-center gap-2 mb-4">
      <span className="material-icons text-blue-400 text-lg" aria-hidden="true">tips_and_updates</span>
      <span className="text-lg font-semibold text-gray-800">Personalized Improvement Plan <span className="text-xs text-gray-400">({plans.length} recommendations)</span></span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plans.map((plan, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-700">{plan.title}</span>
            <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-500 font-medium">{plan.tag}</span>
            <button className="absolute top-4 right-4 text-xs text-blue-500 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200">Start</button>
          </div>
          <ul className="list-disc list-inside text-gray-600 text-sm mb-1">
            {plan.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <div className="flex gap-4 text-xs text-gray-500 mt-auto">
            <span>{plan.duration}</span>
            <span className="text-green-600 font-semibold">{plan.points}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default ImprovementPlan; 