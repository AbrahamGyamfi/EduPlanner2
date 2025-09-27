import React, { useState, useEffect } from 'react';
import { Brain, MessageCircle, ArrowLeft, Info, Gamepad2, Trophy, Zap, Star, Sparkles, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuizMode from '../components/knowledge-check/QuizMode';
import ClarifyMode from '../components/knowledge-check/ClarifyMode';
import PageHead from '../components/PageHead';
import SoundSettings from '../components/SoundSettings';
import gamingSounds from '../utils/gamingSounds';

const InteractiveKnowledgeCheck = () => {
  const [activeMode, setActiveMode] = useState('quiz'); // 'quiz' or 'clarify'
  const [currentCourse, setCurrentCourse] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // To force refresh when course changes
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current course from session storage
    const courseId = sessionStorage.getItem('currentCourseId');
    const courseName = sessionStorage.getItem('currentCourseName') || 'Current Course';
    
    if (!courseId) {
      // If no course is selected, we can still allow the feature but show a message
      setCurrentCourse({ id: null, name: 'No Course Selected' });
    } else {
      setCurrentCourse({ id: courseId, name: courseName });
    }
  }, [refreshKey]); // Add refreshKey to dependency array

  // Listen for course changes in session storage
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    window.addEventListener('courseChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('courseChanged', handleStorageChange);
    };
  }, []);

  // Hide welcome animation after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    gamingSounds.playButtonClick(); // Play sound when switching modes
  };

  const handleBackToCourse = () => {
    gamingSounds.playButtonClick(); // Play sound for back button
    const courseId = sessionStorage.getItem('currentCourseId');
    if (courseId) {
      navigate(`/coursedetails/${courseId}`);
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-bounce">🎮</div>
        <div className="absolute top-20 right-20 text-4xl animate-pulse">⚡</div>
        <div className="absolute bottom-20 left-20 text-5xl rotate-12 animate-bounce">🌟</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-pulse">🏆</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5 animate-pulse">🧠</div>
      </div>

      {/* Welcome Animation Overlay */}
      {showWelcomeAnimation && (
        <div className="fixed inset-0 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center text-white">
            <div className="text-8xl mb-4 animate-bounce">🎮</div>
            <h1 className="text-5xl font-black mb-4 animate-pulse">Knowledge Arena</h1>
            <p className="text-2xl mb-6">Prepare for Epic Learning!</p>
            <div className="flex justify-center space-x-4">
              <Sparkles className="w-8 h-8 animate-spin" />
              <Crown className="w-8 h-8 animate-bounce" />
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
          </div>
        </div>
      )}
      
      <PageHead 
        title="🎮 Knowledge Arena"
        description="Level up your knowledge with gamified learning challenges!"
      />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Gaming Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToCourse}
            className="flex items-center text-white hover:text-yellow-300 transition-colors duration-200 mb-6 bg-white bg-opacity-10 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </button>
          
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl shadow-2xl p-8 border border-purple-400 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mr-6 shadow-lg animate-pulse">
                  <Gamepad2 className="w-12 h-12 text-white" />
                </div>
                <div className="text-white">
                  <h1 className="text-4xl font-black mb-2 flex items-center">
                    🎮 Knowledge Arena
                    <span className="ml-3 text-2xl animate-bounce">⚡</span>
                  </h1>
                  <p className="text-purple-100 text-lg">
                    {currentCourse?.name && currentCourse.name !== 'No Course Selected' 
                      ? `🏆 Mastering: ${currentCourse.name}`
                      : '🎯 Choose your battlefield and level up your skills!'
                    }
                  </p>
                  <div className="flex items-center mt-3 space-x-4">
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-300" />
                      Interactive Learning
                    </div>
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                      <Zap className="w-4 h-4 mr-1 text-green-300" />
                      Instant Feedback
                    </div>
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                      <Trophy className="w-4 h-4 mr-1 text-orange-300" />
                      Achievements
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <SoundSettings />
                {(!currentCourse?.id || currentCourse.name === 'No Course Selected') && (
                  <div className="flex items-center bg-yellow-500 bg-opacity-90 text-yellow-900 px-6 py-3 rounded-full border border-yellow-400 font-bold shadow-lg animate-pulse">
                    <Info className="w-5 h-5 mr-2" />
                    <span>Select a course to begin!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gaming Mode Selector */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-2xl p-2 inline-flex border border-white border-opacity-20">
            <button
              onClick={() => handleModeChange('quiz')}
              className={`flex items-center px-8 py-4 rounded-xl transition-all duration-300 font-bold text-lg ${
                activeMode === 'quiz'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl transform scale-105'
                  : 'text-white hover:bg-white hover:bg-opacity-20 hover:transform hover:scale-105'
              }`}
            >
              <Brain className="w-6 h-6 mr-3" />
              🎯 Quiz Battle
              {activeMode === 'quiz' && <span className="ml-2 text-xl animate-bounce">⚡</span>}
            </button>
            <button
              onClick={() => handleModeChange('clarify')}
              className={`flex items-center px-8 py-4 rounded-xl transition-all duration-300 font-bold text-lg ${
                activeMode === 'clarify'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-2xl transform scale-105'
                  : 'text-white hover:bg-white hover:bg-opacity-20 hover:transform hover:scale-105'
              }`}
            >
              <MessageCircle className="w-6 h-6 mr-3" />
              🤖 AI Tutor
              {activeMode === 'clarify' && <span className="ml-2 text-xl animate-bounce">🌟</span>}
            </button>
          </div>
        </div>

        {/* Mode Content */}
        <div className="min-h-[600px]">
          {activeMode === 'quiz' ? (
            <QuizMode currentCourse={currentCourse} />
          ) : (
            <ClarifyMode currentCourse={currentCourse} />
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveKnowledgeCheck;
