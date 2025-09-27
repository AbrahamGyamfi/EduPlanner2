import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  Sparkles, 
  Clock,
  MessageSquare,
  Trash2,
  BookOpen,
  Settings,
  Zap,
  Trophy,
  Star,
  Flame,
  Crown,
  Rocket,
  Target,
  Brain,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import CourseSelector from './CourseSelector';
import SoundSettings from '../SoundSettings';
import gamingSounds from '../../utils/gamingSounds';

const ClarifyMode = ({ currentCourse }) => {
  const [selectedCourse, setSelectedCourse] = useState(currentCourse);
  const [showCourseSelector, setShowCourseSelector] = useState(!currentCourse?.id);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Gaming State
  const [chatStats, setChatStats] = useState({
    totalMessages: 0,
    questionsAsked: 0,
    conceptsLearned: 0,
    chatStreak: 0,
    xp: 0,
    level: 1,
    achievements: [],
    engagementScore: 0,
    sessionStartTime: Date.now(),
    lastMessageTime: Date.now()
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);
  const [animateXP, setAnimateXP] = useState(false);

  // Initialize messages when course is selected
  useEffect(() => {
    const activeCourse = selectedCourse || currentCourse;
    const welcomeMessage = {
      id: 1,
      type: 'system',
      content: activeCourse?.name && activeCourse.name !== 'No Course Selected' 
        ? `Hello! I'm your AI tutor for ${activeCourse.name}. Ask me anything you'd like to clarify about the course material. I'm here to help explain concepts, provide examples, and answer your questions.`
        : "Hello! I'm your AI tutor. Ask me anything you'd like to clarify about your studies. I'm here to help explain concepts, provide examples, and answer your questions.",
      timestamp: Date.now()
    };
    setMessages([welcomeMessage]);
  }, [selectedCourse, currentCourse]);

  // AI-powered response generation using the Gemini API
  const generateResponse = async (userMessage) => {
    setIsTyping(true);
    
    try {
      const courseToUse = selectedCourse || currentCourse;
      const courseName = courseToUse?.name || 'General Studies';
      
      // Prepare conversation context (last 5 messages)
      const conversationContext = messages.slice(-5).map(msg => ({
        type: msg.type,
        content: msg.content
      }));
      
      const response = await fetch('http://localhost:5000/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          course_name: courseName,
          context: conversationContext
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.response) {
        setIsTyping(false);
        return data.response;
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      setIsTyping(false);
      
      // Fallback response when AI is unavailable
      return `I apologize, but I'm having trouble connecting to the AI service right now. However, I'm still here to help!

**Your question:** "${userMessage}"

While I work on getting back online, here are some ways I can still assist you:

• **Ask me to break down complex topics** into simpler parts
• **Request examples** to illustrate concepts
• **Explain relationships** between different ideas
• **Provide step-by-step guidance** for problem-solving

Please try asking your question again in a few moments, or rephrase it in a different way. I'm committed to helping you understand the material!`;
    }
  };

  // Generate suggested questions based on course
  useEffect(() => {
    const suggestions = [
      "What is polymorphism and how does it work?",
      "Can you explain time complexity with examples?",
      "How does binary search algorithm work?",
      "What are database normal forms?",
      "What's the difference between class and object?",
      "Explain the concept of inheritance"
    ];
    setSuggestedQuestions(suggestions);
  }, [currentCourse]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // Play message sound
    gamingSounds.playButtonClick();

    // Gaming mechanics - update stats
    const newStats = { ...chatStats };
    newStats.totalMessages += 1;
    newStats.lastMessageTime = Date.now();
    
    // XP for sending a message
    const baseXP = 5;
    let earnedXP = baseXP;
    
    // Detect if it's a question (contains ?, what, how, why, when, where, etc.)
    const isQuestion = /\?|what|how|why|when|where|explain|tell me|can you/i.test(currentMessage);
    if (isQuestion) {
      newStats.questionsAsked += 1;
      earnedXP += 10; // Bonus XP for asking questions
    }
    
    // Calculate streak bonus
    const timeSinceLastMessage = Date.now() - chatStats.lastMessageTime;
    const fifteenMinutes = 15 * 60 * 1000;
    
    if (timeSinceLastMessage < fifteenMinutes) {
      newStats.chatStreak += 1;
      if (newStats.chatStreak >= 3) {
        earnedXP += newStats.chatStreak * 2; // Streak bonus
      }
    } else {
      newStats.chatStreak = 1; // Reset streak
    }
    
    // Add XP and check for level up
    const oldLevel = newStats.level;
    newStats.xp += earnedXP;
    newStats.level = Math.floor(newStats.xp / 100) + 1;
    
    // Trigger animations and sounds
    setAnimateXP(true);
    setTimeout(() => setAnimateXP(false), 1000);
    setTimeout(() => gamingSounds.playXPGain(), 100);
    
    // Check for level up
    if (newStats.level > oldLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
      setTimeout(() => gamingSounds.playLevelUpCombo(), 300);
      newStats.achievements.push(`Level ${newStats.level} Achieved!`);
    }
    
    // Check for achievements
    const achievements = [...newStats.achievements];
    
    // Message milestones
    if (newStats.totalMessages === 5 && !achievements.includes("Chatty")) {
      achievements.push("Chatty");
      setShowAchievement("Chatty");
      setTimeout(() => setShowAchievement(null), 3000);
      setTimeout(() => gamingSounds.playAchievement(), 400);
    } else if (newStats.totalMessages === 20 && !achievements.includes("Conversationalist")) {
      achievements.push("Conversationalist");
      setShowAchievement("Conversationalist");
      setTimeout(() => setShowAchievement(null), 3000);
      setTimeout(() => gamingSounds.playAchievement(), 400);
    } else if (newStats.totalMessages === 50 && !achievements.includes("Chat Master")) {
      achievements.push("Chat Master");
      setShowAchievement("Chat Master");
      setTimeout(() => setShowAchievement(null), 3000);
      setTimeout(() => gamingSounds.playAchievement(), 400);
    }
    
    // Question achievements
    if (newStats.questionsAsked === 10 && !achievements.includes("Curious Mind")) {
      achievements.push("Curious Mind");
      setShowAchievement("Curious Mind");
      setTimeout(() => setShowAchievement(null), 3000);
      setTimeout(() => gamingSounds.playAchievement(), 500);
    } else if (newStats.questionsAsked === 25 && !achievements.includes("Question Master")) {
      achievements.push("Question Master");
      setShowAchievement("Question Master");
      setTimeout(() => setShowAchievement(null), 3000);
      setTimeout(() => gamingSounds.playAchievement(), 500);
    }
    
    // Streak achievements
    if (newStats.chatStreak === 5 && !achievements.includes("Consistent Learner")) {
      achievements.push("Consistent Learner");
      setShowAchievement("Consistent Learner");
      setTimeout(() => setShowAchievement(null), 3000);
      setTimeout(() => gamingSounds.playStreakCombo(newStats.chatStreak), 200);
    } else if (newStats.chatStreak === 15 && !achievements.includes("Learning Streak")) {
      achievements.push("Learning Streak");
      setShowAchievement("Learning Streak");
      setTimeout(() => setShowAchievement(null), 3000);
      setTimeout(() => gamingSounds.playStreakCombo(newStats.chatStreak), 200);
    }
    
    newStats.achievements = achievements;
    setChatStats(newStats);

    // Generate AI response
    const response = await generateResponse(currentMessage);
    const aiMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: response,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMessage]);
    
    // Play message received sound
    setTimeout(() => gamingSounds.playMessageReceived(), 100);
    
    // Update concepts learned based on AI response
    const conceptWords = ['algorithm', 'constructor', 'polymorphism', 'inheritance', 'encapsulation', 'abstraction', 'database', 'normalization'];
    const responseText = response.toLowerCase();
    const conceptsInResponse = conceptWords.filter(concept => responseText.includes(concept));
    
    if (conceptsInResponse.length > 0) {
      setChatStats(prev => ({
        ...prev,
        conceptsLearned: prev.conceptsLearned + conceptsInResponse.length
      }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    setCurrentMessage(question);
    
    // Play button click sound
    gamingSounds.playButtonClick();
    
    // Bonus XP for using suggested questions
    setChatStats(prev => ({
      ...prev,
      xp: prev.xp + 3 // Small bonus for engagement
    }));
    
    // Trigger XP animation
    setAnimateXP(true);
    setTimeout(() => setAnimateXP(false), 1000);
    setTimeout(() => gamingSounds.playXPGain(), 100);
    
    // Optionally auto-send the suggested question
    // handleSendMessage();
  };

  const clearChat = () => {
    const activeCourse = selectedCourse || currentCourse;
    setMessages([{
      id: 1,
      type: 'system',
      content: activeCourse?.name && activeCourse.name !== 'No Course Selected' 
        ? `🎮 Chat cleared! Your progress is saved. I'm still here to help with ${activeCourse.name}. What would you like to learn about?`
        : "🎮 Chat cleared! Your progress is saved. I'm still here to help with your studies. What would you like to learn about?",
      timestamp: Date.now()
    }]);
    
    // Don't reset gaming stats when clearing chat - they persist
    // Only reset session-specific stats if needed
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setShowCourseSelector(false);
  };

  const changeCourse = () => {
    setShowCourseSelector(true);
  };

  useEffect(() => {
    // Update course selector visibility when currentCourse changes
    if (!currentCourse?.id && !selectedCourse?.id) {
      setShowCourseSelector(true);
    }
  }, [currentCourse, selectedCourse]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Show course selector if no course is selected
  if (showCourseSelector) {
    return <CourseSelector onCourseSelect={handleCourseSelect} currentCourse={selectedCourse || currentCourse} />;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 rounded-2xl shadow-xl h-[700px] flex flex-col relative overflow-hidden">
      {/* Gaming Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 animate-float">🧠</div>
        <div className="absolute top-20 right-20 animate-float" style={{animationDelay: '1s'}}>💡</div>
        <div className="absolute bottom-20 left-20 animate-float" style={{animationDelay: '2s'}}>⭐</div>
        <div className="absolute bottom-10 right-10 animate-float" style={{animationDelay: '3s'}}>🎯</div>
      </div>

      {/* Gaming Stats Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 p-6 text-white relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-4 animate-pulse">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                🤖 AI Tutor
                <span className="ml-2 px-2 py-1 bg-yellow-400 text-black text-xs rounded-full font-bold">
                  Level {chatStats.level}
                </span>
              </h2>
              <p className="text-blue-100 text-sm">Your intelligent learning companion</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <SoundSettings />
            <button
              onClick={changeCourse}
              className="flex items-center px-3 py-2 text-cyan-200 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-300 text-sm gaming-button"
            >
              <Settings className="w-4 h-4 mr-1" />
              Change Course
            </button>
            <button
              onClick={clearChat}
              className="flex items-center px-3 py-2 text-red-200 hover:text-white hover:bg-red-500/30 rounded-lg transition-all duration-300 text-sm gaming-button"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
        
        {/* Course Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm">
            <BookOpen className="w-4 h-4 text-cyan-300 mr-2" />
            <span className="text-cyan-100">
              Course: <span className="font-medium text-white">{selectedCourse?.name || currentCourse?.name || 'No Course Selected'}</span>
            </span>
          </div>
        </div>

        {/* Gaming Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              <span className="text-xs text-yellow-200">XP</span>
            </div>
            <div className={`text-lg font-bold text-yellow-300 ${animateXP ? 'animate-bounce' : ''}`}>
              {chatStats.xp}
            </div>
            {/* XP Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                style={{width: `${(chatStats.xp % 100)}%`}}
              ></div>
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <MessageSquare className="w-4 h-4 text-blue-400 mr-1" />
              <span className="text-xs text-blue-200">Messages</span>
            </div>
            <div className="text-lg font-bold text-blue-300">{chatStats.totalMessages}</div>
          </div>

          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-xs text-green-200">Questions</span>
            </div>
            <div className="text-lg font-bold text-green-300">{chatStats.questionsAsked}</div>
          </div>

          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Lightbulb className="w-4 h-4 text-purple-400 mr-1" />
              <span className="text-xs text-purple-200">Concepts</span>
            </div>
            <div className="text-lg font-bold text-purple-300">{chatStats.conceptsLearned}</div>
          </div>

          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              {chatStats.chatStreak >= 5 ? (
                <Flame className="w-4 h-4 text-red-400 mr-1 animate-pulse" />
              ) : (
                <Zap className="w-4 h-4 text-orange-400 mr-1" />
              )}
              <span className="text-xs text-orange-200">Streak</span>
            </div>
            <div className={`text-lg font-bold ${chatStats.chatStreak >= 5 ? 'text-red-300 animate-pulse' : 'text-orange-300'}`}>
              {chatStats.chatStreak}
            </div>
          </div>
        </div>

        {/* Achievements Display */}
        {chatStats.achievements.length > 0 && (
          <div className="mt-4 bg-black/20 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Trophy className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-yellow-300">Recent Achievements</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {chatStats.achievements.slice(-3).map((achievement, index) => (
                <span key={index} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium animate-fadeIn">
                  🏆 {achievement}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages with Gaming Design */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Enhanced Avatars */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse'
                    : message.type === 'ai'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse'
                      : 'bg-gradient-to-r from-purple-500 to-violet-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : message.type === 'ai' ? (
                    <Brain className="w-5 h-5 text-white" />
                  ) : (
                    <Crown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {/* Enhanced Message Bubbles */}
                <div className={`rounded-2xl px-5 py-4 shadow-lg gaming-button relative ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : message.type === 'ai'
                      ? 'bg-white text-gray-800 border border-gray-200'
                      : 'bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 border border-purple-200'
                }`}>
                  {/* Message Type Indicator */}
                  {message.type === 'ai' && (
                    <div className="flex items-center mb-2 text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">AI Response</span>
                    </div>
                  )}
                  {message.type === 'system' && (
                    <div className="flex items-center mb-2 text-purple-600">
                      <Sparkles className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">System Message</span>
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  
                  {/* Enhanced Timestamp */}
                  <div className={`text-xs mt-3 flex items-center ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(message.timestamp)}
                    {message.type === 'user' && (
                      <div className="ml-auto flex items-center text-blue-200">
                        <Star className="w-3 h-3 mr-1" />
                        <span className="text-xs">+5 XP</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Decorative Elements */}
                  {message.type === 'ai' && (
                    <>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                        <Rocket className="w-2 h-2 text-white" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 shadow-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">AI is thinking...</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Suggested Questions */}
      {messages.length <= 1 && (
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-t border-purple-200">
          <h3 className="text-sm font-bold text-purple-700 mb-3 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
            💡 Quick Start Questions:
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-purple-700 rounded-xl text-sm transition-all duration-300 gaming-button border border-purple-200 hover:border-purple-300 font-medium transform hover:scale-105"
              >
                🎯 {question}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-purple-600 bg-purple-100 px-3 py-2 rounded-lg">
            ⭐ Each question earns you +5 XP and helps build your learning streak!
          </div>
        </div>
      )}

      {/* Enhanced Message Input */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-purple-200">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="🤔 Ask me anything about the course material... Level up your knowledge!"
              className="w-full px-5 py-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none transition-all duration-300 shadow-lg gaming-button bg-white"
              rows="1"
              style={{ minHeight: '52px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            {/* Input Decorator */}
            <div className="absolute top-2 right-2 text-purple-400">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isTyping}
            className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl gaming-button transform hover:scale-105 font-bold"
          >
            <Send className="w-5 h-5 mr-2" />
            🚀
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-purple-600 flex items-center">
            <Star className="w-3 h-3 mr-1" />
            Press Enter to send, Shift+Enter for new line
          </p>
          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
            💎 +5 XP per message
          </div>
        </div>
      </div>

      {/* Gaming Popups */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-6 rounded-xl font-bold text-xl animate-bounce shadow-2xl">
            🎉 LEVEL UP! 🎉
            <div className="text-sm font-normal mt-2">You reached Level {chatStats.level}!</div>
          </div>
        </div>
      )}

      {showAchievement && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-8 py-6 rounded-xl font-bold text-lg animate-pulse shadow-2xl">
            🏆 Achievement Unlocked! 🏆
            <div className="text-sm font-normal mt-2">{showAchievement}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClarifyMode;
