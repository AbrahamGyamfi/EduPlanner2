import React from 'react';
import { BarChart3, Calendar } from 'lucide-react';
import GPACards from './GPACards';
import RecommendationsList from './RecommendationsList';
import AreasOfFocus from './AreasOfFocus';

const AnalysisTab = ({ analysis, onBackToCourses, onReanalyze }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6 text-blue-600">
        <BarChart3 className="w-5 h-5 mr-2" />
        <h2 className="text-xl font-semibold">Analysis Results</h2>
      </div>
      
      <GPACards 
        currentGPA={analysis.currentGPA}
        projectedGPA={analysis.projectedGPA}
      />
      
      {/* Behavioral insights */}
      {analysis.behavioralInsights && analysis.behavioralInsights.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-8 border border-blue-100">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Behavioral Insights
          </h3>
          <ul className="space-y-3">
            {analysis.behavioralInsights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-200 text-blue-600 mr-3 mt-0.5 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-gray-700">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <RecommendationsList recommendations={analysis.recommendations} />

      <AreasOfFocus 
        strongAreas={analysis.strongAreas}
        weakAreas={analysis.weakAreas}
      />
      
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBackToCourses}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Courses
        </button>
        <button
          onClick={onReanalyze}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Re-analyze Data
        </button>
      </div>
    </div>
  );
};

export default AnalysisTab;
