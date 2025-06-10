import React from 'react';
import { ArrowRight } from 'lucide-react';

const TabNavigation = ({ activeTab, setActiveTab, studentProfile, analysis }) => {
  return (
    <>
      {/* Desktop progress indicator */}
      <div className="hidden md:flex items-center space-x-2 text-sm mb-6">
        <span className={`flex items-center px-3 py-1 rounded-full ${activeTab === 'profile' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}>
          <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
          Profile
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`flex items-center px-3 py-1 rounded-full ${activeTab === 'courses' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}>
          <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${activeTab === 'courses' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
          Courses
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`flex items-center px-3 py-1 rounded-full ${activeTab === 'analysis' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}>
          <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${activeTab === 'analysis' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
          Results
        </span>
      </div>

      {/* Mobile tab navigation */}
      <div className="flex border-b border-gray-200 mb-6 md:hidden">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 px-4 py-2 text-center font-medium text-sm ${
            activeTab === 'profile' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => studentProfile && setActiveTab('courses')}
          disabled={!studentProfile}
          className={`flex-1 px-4 py-2 text-center font-medium text-sm ${
            activeTab === 'courses' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : studentProfile ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          Courses
        </button>
        <button
          onClick={() => analysis && setActiveTab('analysis')}
          disabled={!analysis}
          className={`flex-1 px-4 py-2 text-center font-medium text-sm ${
            activeTab === 'analysis' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : analysis ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          Results
        </button>
      </div>
    </>
  );
};

export default TabNavigation;
