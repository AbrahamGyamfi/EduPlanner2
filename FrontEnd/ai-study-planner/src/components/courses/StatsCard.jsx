import React from 'react';

const StatsCard = ({ title, value, icon, bgColor, loading }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          )}
        </div>
        <div className={`${bgColor} p-3 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;