import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PredictionBand = ({ predictions, currentCWA, targetCWA }) => {
  const { expectedRange, trend } = predictions;

  // Generate prediction data points
  const predictionData = [
    { name: 'Current', value: currentCWA },
    { name: 'Expected Min', value: expectedRange.min },
    { name: 'Expected Max', value: expectedRange.max },
    { name: 'Target', value: targetCWA }
  ];

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <ArrowRight className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTrendMessage = () => {
    switch (trend) {
      case 'up':
        return "Your performance is improving";
      case 'down':
        return "Your performance needs attention";
      default:
        return "Your performance is stable";
    }
  };

  return (
    <div className="space-y-6">
      {/* Prediction Summary */}
      <div className="bg-indigo-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-indigo-900">Expected CWA Range</h3>
            <p className="mt-1 text-sm text-indigo-700">
              Based on current performance and behavior patterns
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">
              {expectedRange.min.toFixed(1)} - {expectedRange.max.toFixed(1)}%
            </div>
            <div className="flex items-center mt-1 text-sm">
              {getTrendIcon()}
              <span className="ml-1 text-gray-600">{getTrendMessage()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Chart */}
      <div className="bg-white p-4 rounded-lg">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={predictionData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4F46E5"
                fill="#E0E7FF"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prediction Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900">Current CWA</h4>
          <p className="mt-1 text-2xl font-bold text-gray-900">{currentCWA.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-gray-500">Your starting point</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900">Expected Range</h4>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {expectedRange.min.toFixed(1)} - {expectedRange.max.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-gray-500">Projected final CWA</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900">Target CWA</h4>
          <p className="mt-1 text-2xl font-bold text-gray-900">{targetCWA.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-gray-500">Your goal</p>
        </div>
      </div>

      {/* Achievement Likelihood */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Achievement Analysis</h4>
        <p className="text-sm text-gray-600">
          {targetCWA <= expectedRange.max ? (
            <>
              Based on your current trajectory, you have a good chance of reaching your target CWA. 
              Keep up the consistent work!
            </>
          ) : (
            <>
              Your target CWA is ambitious compared to your current trajectory. 
              Consider increasing your study consistency and engagement to bridge the gap.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default PredictionBand; 