import React from 'react';
import { BookOpen, BarChart3, ArrowLeft, TrendingUp } from 'lucide-react';
import CourseForm from '../CourseForm';
import CourseList from './CourseList';
import EmptyCoursesMessage from './EmptyCoursesMessage';

const CoursesTab = ({ 
  courses, 
  onAddCourse, 
  onAddAssignment, 
  onDeleteCourse,
  onDeleteAssignment,
  onAnalyze,
  onBackToProfile,
  isAnalyzing,
  calculateCourseScore,
  formErrors,
  behaviorMetrics
}) => {
  const totalCreditHours = courses.reduce((sum, course) => sum + (course.creditHours || 0), 0);
  const avgScore = courses.length > 0 
    ? courses.reduce((sum, course) => sum + calculateCourseScore(course), 0) / courses.length 
    : 0;

  return (
    <>
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-700 text-sm">
              <strong>Step 2 of 3:</strong> Add your courses and assignments to build your academic profile.
            </p>
          </div>
          <button
            onClick={onBackToProfile}
            className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Profile
          </button>
        </div>
      </div>

      {/* Course Statistics */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Credit Hours</p>
                <p className="text-2xl font-bold">{totalCreditHours}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Average Score</p>
                <p className="text-2xl font-bold">{avgScore.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Add Course Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4 text-blue-600">
          <BookOpen className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-semibold">Add New Course</h3>
        </div>
        <CourseForm onSubmit={onAddCourse} />
      </div>

      {formErrors.general && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mb-6">
          {formErrors.general}
        </div>
      )}

      {courses.length > 0 ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center text-gray-800">
              <BookOpen className="w-5 h-5 mr-2" />
              Your Courses ({courses.length})
            </h2>
            
            {/* Behavior insights indicator */}
            {behaviorMetrics?.studyConsistency > 0 && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">Study Consistency:</div>
                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      behaviorMetrics.studyConsistency > 70 ? 'bg-green-500' :
                      behaviorMetrics.studyConsistency > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${Math.min(100, behaviorMetrics.studyConsistency)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {behaviorMetrics.studyConsistency.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
          
          <CourseList 
            courses={courses}
            onDeleteCourse={onDeleteCourse}
            onDeleteAssignment={onDeleteAssignment}
            onAddAssignment={onAddAssignment}
            calculateCourseScore={calculateCourseScore}
            formErrors={formErrors}
          />
          
          <div className="flex justify-center mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Ready to analyze your academic performance? Click below to get personalized insights and recommendations.
              </p>
              <button 
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className={`px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center transition-all duration-200 transform hover:scale-105 ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Performance...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Analyze My Performance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyCoursesMessage />
      )}
    </>
  );
};

export default CoursesTab;
