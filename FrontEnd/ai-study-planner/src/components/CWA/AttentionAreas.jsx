import React from "react";

const AttentionAreas = ({ areas }) => (
  <section className="bg-white rounded-xl shadow p-6 mb-6" aria-label="Areas That Need Attention">
    <div className="flex items-center gap-2 mb-4">
      <span className="material-icons text-red-400 text-lg" aria-hidden="true">warning_amber</span>
      <span className="text-lg font-semibold text-gray-800">Areas That Need Attention</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {areas.map((area, idx) => (
        <div key={idx} className={`border ${area.color} rounded-lg p-4 flex flex-col gap-2`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-icons text-base text-red-400" aria-hidden="true">{area.icon}</span>
            <span className="font-semibold text-gray-700">{area.title}</span>
            <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-500 font-medium">{area.tag}</span>
          </div>
          <div className="text-gray-600 text-sm mb-1">{area.description}</div>
          {area.actions.map((action, i) => (
            <div key={i} className={`text-xs ${action.color}`}>{action.text}</div>
          ))}
        </div>
      ))}
    </div>
  </section>
);

export default AttentionAreas; 