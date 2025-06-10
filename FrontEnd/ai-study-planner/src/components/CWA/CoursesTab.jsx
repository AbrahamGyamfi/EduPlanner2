import React from 'react';
import { BookOpen, BarChart3 } from 'lucide-react';
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
  isAnalyzing,
  calculateCourseScore,
  formErrors,
  behaviorMetrics
}) => {
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
            {behaviorMetrics.studyConsistency > 0 && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">Study Consistency:</div>
                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      behaviorMetrics.studyConsistency > 70 ? 'bg-green-500' :
                      behaviorMetrics.studyConsistency > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${Math.min(100, behaviorMetrics.studyConsistency)}%` }}
                  ></div>
                </div>
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
          
          <div className="flex justify-center mt-8">
            <button 
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className={`px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Analyze Performance
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <EmptyCoursesMessage />
      )}
    </>
  );
};

export default CoursesTab;
