import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const GPACards = ({ currentGPA, projectedGPA }) => {
  const improvement = projectedGPA - currentGPA;
  const improvementPercentage = currentGPA > 0 ? ((improvement / currentGPA) * 100) : 0;

  const getGPAColor = (gpa) => {
    if (gpa >= 3.5) return { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-800' };
    if (gpa >= 3.0) return { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-800' };
    if (gpa >= 2.5) return { bg: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' };
    return { bg: 'from-red-50 to-red-100', border: 'border-red-200', text: 'text-red-800' };
  };

  const currentColors = getGPAColor(currentGPA);
  const projectedColors = getGPAColor(projectedGPA);

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className={`p-6 rounded-xl bg-gradient-to-br ${currentColors.bg} ${currentColors.border} border`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-medium uppercase ${currentColors.text}`}>Current GPA</h3>
            <div className={`p-2 rounded-lg ${currentColors.text} bg-white bg-opacity-50`}>
              📊
            </div>
          </div>
          <div className={`text-4xl font-bold ${currentColors.text} mb-2`}>
            {currentGPA.toFixed(2)}
          </div>
          <div className={`text-sm ${currentColors.text} opacity-75`}>
            Based on your current course performance
          </div>
        </div>
        
        <div className={`p-6 rounded-xl bg-gradient-to-br ${projectedColors.bg} ${projectedColors.border} border`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-medium uppercase ${projectedColors.text}`}>Projected GPA</h3>
            <div className={`p-2 rounded-lg ${projectedColors.text} bg-white bg-opacity-50`}>
              🎯
            </div>
          </div>
          <div className={`text-4xl font-bold ${projectedColors.text} mb-2`}>
            {projectedGPA.toFixed(2)}
          </div>
          <div className={`text-sm ${projectedColors.text} opacity-75`}>
            Potential GPA with recommended improvements
          </div>
        </div>
      </div>

      {/* Improvement Indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-800">{currentGPA.toFixed(2)}</span>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold text-gray-800">{projectedGPA.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {improvement > 0 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">
                    +{improvement.toFixed(2)} ({improvementPercentage.toFixed(1)}%)
                  </span>
                </>
              ) : improvement < 0 ? (
                <>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-medium">
                    {improvement.toFixed(2)} ({improvementPercentage.toFixed(1)}%)
                  </span>
                </>
              ) : (
                <span className="text-gray-600 font-medium">No change projected</span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Improvement Potential</div>
            <div className={`text-lg font-semibold ${
              improvement > 0 ? 'text-green-600' : 
              improvement < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {improvement > 0 ? 'Positive' : improvement < 0 ? 'Decline' : 'Stable'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPACards;
