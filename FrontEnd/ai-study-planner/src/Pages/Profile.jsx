import React, { useState, useEffect } from 'react';
import Navbar from '../components/PageHead';
import '../styles/themes.css';

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
    <div className="min-h-screen theme-bg-secondary">
      <Navbar pageTitle="Profile" />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-400 to-blue-400 flex items-center justify-center text-5xl text-white shadow-lg ring-4 ring-indigo-100 mb-4">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'J'}
          </div>
          <h2 className="text-2xl font-bold theme-text-primary">{profile.fullName || 'Jeremiah'}</h2>
          <p className="theme-text-muted text-sm mb-2">@{profile.username || 'kk'}</p>
          <p className="theme-text-secondary text-center max-w-md mb-4">{profile.bio}</p>
          <button onClick={handleEditProfile} className="btn btn-primary">Edit Profile</button>
        </div>
        {/* Stats Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl shadow flex flex-col items-center py-6">
            <span className="text-pink-500 text-2xl mb-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <div className="text-xl font-bold">{stats.studyMinutes}</div>
            <div className="text-xs text-gray-500 mt-1">Study Minutes</div>
          </div>
          <div className="bg-white rounded-xl shadow flex flex-col items-center py-6">
            <span className="text-purple-500 text-2xl mb-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </span>
            <div className="text-xl font-bold">{stats.assignmentsDone}</div>
            <div className="text-xs text-gray-500 mt-1">Assignments Done</div>
          </div>
          <div className="bg-white rounded-xl shadow flex flex-col items-center py-6">
            <span className="text-green-500 text-2xl mb-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </span>
            <div className="text-xl font-bold">{stats.averageScore}%</div>
            <div className="text-xs text-gray-500 mt-1">Average Score</div>
          </div>
          <div className="bg-white rounded-xl shadow flex flex-col items-center py-6">
            <span className="text-amber-500 text-2xl mb-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </span>
            <div className="text-xl font-bold">{stats.dayStreak}</div>
            <div className="text-xs text-gray-500 mt-1">Day Streak</div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-full p-1">
            {['overview', 'achievements', 'activity', 'badges'].map(tab => (
              <button
                key={tab}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-indigo-50'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div>
              {/* Latest Achievement */}
              <div className="mb-10">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
                  Latest Achievement
                  <button onClick={() => setActiveTab('achievements')} className="text-indigo-600 text-xs font-medium hover:underline">View All</button>
                </h3>
                {achievements[0] && (
                  <div className="flex items-center bg-white rounded-lg shadow p-4">
                    <div className={`${achievements[0].color} p-3 rounded-full mr-4`}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {achievements[0].icon === 'check-circle' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                        {achievements[0].icon === 'user' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        )}
                        {achievements[0].icon === 'calendar' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">{achievements[0].name}</div>
                      <div className="text-sm text-gray-500">{achievements[0].description}</div>
                      {achievements[0].date && (
                        <div className="text-xs text-gray-400 mt-1">Achieved on {achievements[0].date}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Subjects */}
              <div className="mb-10">
                <h3 className="font-semibold text-gray-700 mb-3">My Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject, index) => (
                    <span key={index} className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-medium">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center bg-white rounded-lg p-4 shadow">
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
                      <div className="text-xs text-gray-400 mt-1">Achieved on {achievement.date}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'activity' && (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">No activity data available yet.</div>
          )}
          {activeTab === 'badges' && (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">You haven't earned any badges yet. Complete courses and assignments to earn badges!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;