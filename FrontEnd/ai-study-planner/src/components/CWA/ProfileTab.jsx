import React from 'react';
import { BookOpen, ArrowRight, User } from 'lucide-react';
import StudentProfileForm from '../StudentProfileForm';

const ProfileTab = ({ studentProfile, onProfileSubmit, onNext, formErrors }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6 text-blue-600">
        <User className="w-6 h-6 mr-3" />
        <h2 className="text-2xl font-semibold">Student Profile Setup</h2>
      </div>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          <strong>Step 1 of 3:</strong> Tell us about yourself to get personalized analysis and recommendations.
          This information helps us better understand your academic context and learning patterns.
        </p>
      </div>

      {studentProfile && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <BookOpen className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-medium text-green-800">Profile Completed</span>
          </div>
          <p className="text-green-700 text-sm">
            Great! Your profile is set up. You can update it anytime or proceed to add your courses.
          </p>
          <button
            onClick={onNext}
            className="mt-3 flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Continue to Courses
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
      
      <StudentProfileForm 
        onSubmit={onProfileSubmit} 
        initialData={studentProfile}
        formErrors={formErrors}
      />
      
      {!studentProfile && (
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            After completing your profile, you'll be able to add courses and assignments for analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
