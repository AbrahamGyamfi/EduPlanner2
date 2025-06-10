import React, { useState } from 'react';
import { Target, Edit2, CheckCircle } from 'lucide-react';

const CWASummaryWidget = ({ currentCWA, targetCWA, onTargetChange }) => {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetCWA);

  const handleTargetSubmit = () => {
    const newTarget = Math.min(100, Math.max(0, Number(tempTarget)));
    onTargetChange(newTarget);
    setIsEditingTarget(false);
  };

  const progressPercentage = (currentCWA / targetCWA) * 100;

  return (
    <div className="space-y-6">
      {/* CWA Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-blue-900">Current CWA</h3>
            <span className="text-3xl font-bold text-blue-600">{currentCWA.toFixed(2)}%</span>
          </div>
          <p className="mt-2 text-sm text-blue-600">Based on completed courses</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-green-900">Target CWA</h3>
            {isEditingTarget ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  className="w-20 px-2 py-1 text-2xl font-bold text-green-600 bg-white border border-green-300 rounded"
                  min="0"
                  max="100"
                />
                <button
                  onClick={handleTargetSubmit}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-green-600">{targetCWA.toFixed(2)}%</span>
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-green-600">Click to adjust your target</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progress to Target</span>
          <span>{Math.min(100, progressPercentage.toFixed(1))}%</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ 
              width: `${Math.min(100, progressPercentage)}%`,
              backgroundColor: progressPercentage >= 100 ? '#059669' : '#2563EB'
            }}
          />
        </div>
      </div>

      {/* Achievement Status */}
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <Target className="w-5 h-5 text-gray-400 mr-2" />
        <span className="text-gray-600">
          {progressPercentage >= 100 
            ? "Target achieved! Consider setting a higher goal."
            : `${(targetCWA - currentCWA).toFixed(2)}% points needed to reach target`}
        </span>
      </div>
    </div>
  );
};

export default CWASummaryWidget; 