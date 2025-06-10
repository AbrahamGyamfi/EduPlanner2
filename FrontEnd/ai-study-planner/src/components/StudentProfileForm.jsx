import React, { useState } from 'react';
import { Save } from 'lucide-react';

export default function StudentProfileForm({ onSubmit }) {
  const [profile, setProfile] = useState({
    studyHoursPerWeek: 10,
    learningStyle: 'visual',
    confidenceLevels: {},
    motivationLevel: 7,
    stressLevel: 5,
    timeManagementScore: 70,
    goals: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900">Student Profile</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="studyHours" className="block text-sm font-medium text-gray-700">
            Study Hours per Week
          </label>
          <input
            type="number"
            id="studyHours"
            value={profile.studyHoursPerWeek}
            onChange={(e) => setProfile({ ...profile, studyHoursPerWeek: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            max="168"
          />
        </div>

        <div>
          <label htmlFor="learningStyle" className="block text-sm font-medium text-gray-700">
            Preferred Learning Style
          </label>
          <select
            id="learningStyle"
            value={profile.learningStyle}
            onChange={(e) => setProfile({ ...profile, learningStyle: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="visual">Visual</option>
            <option value="auditory">Auditory</option>
            <option value="kinesthetic">Kinesthetic</option>
            <option value="reading/writing">Reading/Writing</option>
          </select>
        </div>

        <div>
          <label htmlFor="motivation" className="block text-sm font-medium text-gray-700">
            Motivation Level (1-10)
          </label>
          <input
            type="range"
            id="motivation"
            value={profile.motivationLevel}
            onChange={(e) => setProfile({ ...profile, motivationLevel: Number(e.target.value) })}
            className="mt-1 block w-full"
            min="1"
            max="10"
          />
          <div className="mt-1 text-sm text-gray-500 text-center">
            {profile.motivationLevel}
          </div>
        </div>

        <div>
          <label htmlFor="stress" className="block text-sm font-medium text-gray-700">
            Stress Level (1-10)
          </label>
          <input
            type="range"
            id="stress"
            value={profile.stressLevel}
            onChange={(e) => setProfile({ ...profile, stressLevel: Number(e.target.value) })}
            className="mt-1 block w-full"
            min="1"
            max="10"
          />
          <div className="mt-1 text-sm text-gray-500 text-center">
            {profile.stressLevel}
          </div>
        </div>

        <div>
          <label htmlFor="timeManagement" className="block text-sm font-medium text-gray-700">
            Time Management Score (0-100)
          </label>
          <input
            type="range"
            id="timeManagement"
            value={profile.timeManagementScore}
            onChange={(e) => setProfile({ ...profile, timeManagementScore: Number(e.target.value) })}
            className="mt-1 block w-full"
            min="0"
            max="100"
          />
          <div className="mt-1 text-sm text-gray-500 text-center">
            {profile.timeManagementScore}
          </div>
        </div>

        <div>
          <label htmlFor="goals" className="block text-sm font-medium text-gray-700">
            Academic Goals
          </label>
          <select
            id="goals"
            multiple
            value={profile.goals}
            onChange={(e) => setProfile({ 
              ...profile, 
              goals: Array.from(e.target.selectedOptions, option => option.value)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="scholarship">Earn Scholarship</option>
            <option value="firstClass">Achieve First Class</option>
            <option value="improveGPA">Improve GPA</option>
            <option value="research">Pursue Research Opportunities</option>
            <option value="internship">Secure Internship</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Profile
      </button>
    </form>
  );
}