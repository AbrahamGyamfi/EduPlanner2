import React from 'react';
import { BookOpen } from 'lucide-react';
import StudentProfileForm from '../StudentProfileForm';

const ProfileTab = ({ onSubmit }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4 text-blue-600">
        <BookOpen className="w-5 h-5 mr-2" />
        <h2 className="text-xl font-semibold">Student Profile</h2>
      </div>
      <StudentProfileForm onSubmit={onSubmit} />
    </div>
  );
};

export default ProfileTab;
