import React, { useState, useEffect } from 'react';
import Sidebar from "../components/sidebar";
// import PageHeader from "../components/PageHeader";
import Navbar from '../components/PageHead';

const Profile = () => {
  const [profile, setProfile] = useState({
    fullName: '',
    username: '',
    email: '',
    bio: "I'm a student using AdaptIQ to improve my learning!",
    joinDate: '',
    learningPreference: 'kinesthetic, visual Learner',
    studyPreference: 'Prefers Balanced Study Schedule'
  });
  
  const [subjects] = useState(['Computer Science']);
  const [stats] = useState({
    studyMinutes: 0,
    assignmentsDone: 0,
    averageScore: 83,
    dayStreak: 1
  });
  
  const [achievements] = useState([
    { 
      id: 1, 
      name: 'First Steps', 
      description: 'Logged in for the first time',
      date: 'May 23, 2025',
      icon: 'check-circle',
      color: 'bg-green-500'
    },
    {
      id: 2,
      name: 'Identity Established',
      description: 'Completed your profile information',
      date: 'May 23, 2025',
      icon: 'user',
      color: 'bg-blue-500'
    },
    {
      id: 3,
      name: 'Weekly Warrior',
      description: 'Maintained a 7-day study streak',
      date: '',
      icon: 'calendar',
      color: 'bg-gray-300'
    }
  ]);

  useEffect(() => {
    // Load profile from localStorage or backend
    const firstName = localStorage.getItem('firstname') || '';
    const lastName = localStorage.getItem('lastname') || '';
    const email = localStorage.getItem('email') || '';
    const username = localStorage.getItem('username') || firstName.toLowerCase() || 'user';
    
    // Calculate days since join date (for demo)
    const joinDate = localStorage.getItem('joinDate') || new Date().toISOString();
    // const daysSinceJoin = Math.floor((new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24));
    
    setProfile({
      ...profile,
      fullName: `${firstName} ${lastName}`.trim(),
      email: email,
      username: username,
      joinDate: joinDate
    });
    
    // Save join date if it's not already saved
    if (!localStorage.getItem('joinDate')) {
      localStorage.setItem('joinDate', new Date().toISOString());
    }
// Add empty dependency array to prevent infinite renders
  }, []); // Empty dependency array to run only once on mount

  const [activeTab, setActiveTab] = useState('overview');

  const handleEditProfile = () => {
    // Navigate to edit profile page
    window.location.href = '/settings';
  };

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      <Sidebar activePage="profile" />
      <div className="flex-1 p-8">
        {/* Navbar */}
        <div className="mb-8">
          <Navbar pageTitle="Profile" />
        </div>

        {/* Profile Card */}
        <div className="mx-4 md:mx-8 bg-white rounded-xl shadow-md overflow-hidden mt-6">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Image */}
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-5xl text-gray-400 overflow-hidden">
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'J'}
              </div>
              
              {/* Profile Info */}
              <div className="flex-grow">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">{profile.fullName || 'Jeremiah'}</h2>
                  <button 
                    onClick={handleEditProfile}
                    className="mt-2 md:mt-0 flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">@{profile.username || 'kk'}</p>
                <p className="text-gray-700 mb-4">{profile.bio}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Joined May 23, 2025 (2 days ago)
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {profile.learningPreference}
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {profile.studyPreference}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Subjects */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">My Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject, index) => (
                  <span 
                    key={index} 
                    className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-4 md:mx-8 mt-8 border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'overview' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'achievements' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'activity' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'badges' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('badges')}
            >
              Badges
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mx-4 md:mx-8 mt-6">
          {activeTab === 'overview' && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Study Minutes */}
                <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
                  <div className="bg-pink-100 p-2 rounded-full mb-2">
                    <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{stats.studyMinutes}</div>
                  <div className="text-sm text-gray-500">Study Minutes</div>
                </div>
                
                {/* Assignments Done */}
                <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
                  <div className="bg-purple-100 p-2 rounded-full mb-2">
                    <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{stats.assignmentsDone}</div>
                  <div className="text-sm text-gray-500">Assignments Done</div>
                </div>
                
                {/* Average Score */}
                <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
                  <div className="bg-green-100 p-2 rounded-full mb-2">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{stats.averageScore}%</div>
                  <div className="text-sm text-gray-500">Average Score</div>
                </div>
                
                {/* Day Streak */}
                <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
                  <div className="bg-amber-100 p-2 rounded-full mb-2">
                    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{stats.dayStreak}</div>
                  <div className="text-sm text-gray-500">Day Streak</div>
                </div>
              </div>
              
              {/* Recent Achievements */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Recent Achievements</h3>
                  <button 
                    onClick={() => setActiveTab('achievements')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {achievements.map((achievement, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-white rounded-lg p-4 shadow-sm"
                    >
                      <div className={`${achievement.color} p-3 rounded-full mr-4`}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {achievement.icon === 'check-circle' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                          {achievement.icon === 'user' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          )}
                          {achievement.icon === 'calendar' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          )}
                        </svg>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="font-medium">{achievement.name}</div>
                        <div className="text-sm text-gray-500">{achievement.description}</div>
                      </div>
                      
                      {achievement.date && (
                        <div className="text-sm text-gray-500">
                          Achieved on {achievement.date}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-4">All Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index}
                    className="flex items-center bg-white rounded-lg p-4 border border-gray-100"
                  >
                    <div className={`${achievement.color} p-3 rounded-full mr-4`}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {achievement.icon === 'check-circle' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                        {achievement.icon === 'user' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        )}
                        {achievement.icon === 'calendar' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        )}
                      </svg>
                    </div>
                    
                    <div>
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-sm text-gray-500">{achievement.description}</div>
                      {achievement.date && (
                        <div className="text-xs text-gray-400 mt-1">
                          Achieved on {achievement.date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-4">Activity History</h3>
              <p className="text-gray-500">No activity data available yet.</p>
            </div>
          )}
          
          {activeTab === 'badges' && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-4">Your Badges</h3>
              <p className="text-gray-500">You haven't earned any badges yet. Complete courses and assignments to earn badges!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;