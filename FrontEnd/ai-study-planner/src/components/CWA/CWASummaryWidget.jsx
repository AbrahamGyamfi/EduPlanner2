import React from 'react';
import { User, BookOpen, TrendingUp, AlertCircle, Target } from 'lucide-react';

const CWASummaryWidget = ({ profile, courses, analysis, calculateCourseScore }) => {
  if (!profile && !courses.length && !analysis) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl text-white">
        <div className="flex items-center mb-4">
          <Target className="w-6 h-6 mr-3" />
          <h3 className="text-xl font-semibold">CWA Analysis Summary</h3>
        </div>
        <p className="text-blue-100">
          Complete your profile and add courses to see your comprehensive academic analysis here.
        </p>
      </div>
    );
  }

  const totalCourses = courses.length;
  const totalCreditHours = courses.reduce((sum, course) => sum + (course.creditHours || 0), 0);
  const avgScore = courses.length > 0 
    ? courses.reduce((sum, course) => sum + calculateCourseScore(course), 0) / courses.length 
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg mr-3">
          <Target className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Academic Overview</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Summary */}
        {profile && (
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              <span className="font-medium">Student Profile</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Study Hours/Week:</span>
                <span className="font-medium">{profile.studyHoursPerWeek || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Motivation Level:</span>
                <span className="font-medium">{profile.motivationLevel || 'N/A'}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stress Level:</span>
                <span className="font-medium">{profile.stressLevel || 'N/A'}/10</span>
              </div>
            </div>
          </div>
        )}

        {/* Academic Statistics */}
        <div className="space-y-4">
          <div className="flex items-center text-gray-700">
            <BookOpen className="w-5 h-5 mr-2 text-green-500" />
            <span className="font-medium">Academic Stats</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Courses:</span>
              <span className="font-medium">{totalCourses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Hours:</span>
              <span className="font-medium">{totalCreditHours}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Score:</span>
              <span className={`font-medium ${getScoreColor(avgScore)}`}>
                {avgScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center mb-4 text-gray-700">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
            <span className="font-medium">Analysis Results</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${getScoreBgColor(analysis.currentGPA * 25)}`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {analysis.currentGPA.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Current GPA</div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${getScoreBgColor(analysis.projectedGPA * 25)}`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {analysis.projectedGPA.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Projected GPA</div>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Key Insights</span>
            </div>
            <div className="text-xs text-blue-700">
              {analysis.projectedGPA > analysis.currentGPA ? (
                <span>📈 Your performance is trending upward! Keep up the good work.</span>
              ) : analysis.projectedGPA === analysis.currentGPA ? (
                <span>📊 Your performance is stable. Consider strategies for improvement.</span>
              ) : (
                <span>📉 Focus on implementing the recommendations to improve your trajectory.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      {!analysis && courses.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Ready for detailed analysis?
            </p>
            <div className="text-xs text-blue-600">
              Add assignments to your courses and click "Analyze Performance" to get insights.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CWASummaryWidget; 