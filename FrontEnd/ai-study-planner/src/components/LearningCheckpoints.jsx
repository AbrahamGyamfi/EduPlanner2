import React, { useState, useEffect } from 'react';
import { useActivityHistory, ACTIVITY_TYPES } from '../hooks/useActivityHistory';
import { CheckCircle, Clock, Brain, BookOpen, Target, Award } from 'lucide-react';

const LearningCheckpoints = ({ courseId, extractedText, filename }) => {
  const { activities, markActivityAsCompleted } = useActivityHistory();
  const [courseActivities, setCourseActivities] = useState([]);
  const [comprehensionCheckpoints, setComprehensionCheckpoints] = useState([]);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(null);
  const [userResponses, setUserResponses] = useState({});
  const [learningProgress, setLearningProgress] = useState({
    totalActivities: 0,
    completedActivities: 0,
    progressPercentage: 0
  });

  // Generate comprehension checkpoints from extracted text
  useEffect(() => {
    if (extractedText && filename) {
      generateComprehensionCheckpoints();
    }
  }, [extractedText, filename]);

  useEffect(() => {
    // Filter activities for the current course
    const filtered = activities.filter(activity => 
      activity.metadata?.courseId === courseId &&
      (activity.type === ACTIVITY_TYPES.SUMMARY_GENERATE || activity.type === ACTIVITY_TYPES.QUIZ_GENERATE)
    );
    
    setCourseActivities(filtered);
    
    // Calculate progress including comprehension checkpoints
    const completedCheckpoints = comprehensionCheckpoints.filter(cp => userResponses[cp.id]?.completed).length;
    const totalCheckpoints = comprehensionCheckpoints.length;
    const completed = filtered.filter(activity => activity.completed).length + completedCheckpoints;
    const total = filtered.length + totalCheckpoints;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    setLearningProgress({
      totalActivities: total,
      completedActivities: completed,
      progressPercentage: percentage
    });
  }, [activities, courseId, comprehensionCheckpoints, userResponses]);

  // Generate AI-powered comprehension checkpoints
  const generateComprehensionCheckpoints = async () => {
    if (!extractedText) return;

    try {
      const response = await fetch('http://localhost:5000/generate-checkpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: extractedText,
          filename: filename
        })
      });

      if (response.ok) {
        const data = await response.json();
        const checkpoints = data.checkpoints || [];
        
        // Add interactive elements to checkpoints
        const enhancedCheckpoints = checkpoints.map((cp, index) => ({
          ...cp,
          id: `checkpoint_${Date.now()}_${index}`,
          filename: filename,
          courseId: courseId
        }));
        
        setComprehensionCheckpoints(enhancedCheckpoints);
      }
    } catch (error) {
      console.error('Error generating comprehension checkpoints:', error);
      // Fallback to manual checkpoints
      setComprehensionCheckpoints(getDefaultCheckpoints());
    }
  };

  // Default checkpoints if AI generation fails
  const getDefaultCheckpoints = () => [
    {
      id: 'default_1',
      title: 'Content Understanding',
      description: 'Can you explain the main concepts covered in this material?',
      type: 'reflection',
      difficulty: 'easy',
      filename: filename,
      courseId: courseId
    },
    {
      id: 'default_2',
      title: 'Practical Application',
      description: 'How would you apply these concepts in a real-world scenario?',
      type: 'application',
      difficulty: 'medium',
      filename: filename,
      courseId: courseId
    },
    {
      id: 'default_3',
      title: 'Critical Analysis',
      description: 'What are the strengths and limitations of the approaches discussed?',
      type: 'analysis',
      difficulty: 'hard',
      filename: filename,
      courseId: courseId
    }
  ];

  const handleMarkComplete = (activityId) => {
    markActivityAsCompleted(activityId);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case ACTIVITY_TYPES.SUMMARY_GENERATE:
        return '📄';
      case ACTIVITY_TYPES.QUIZ_GENERATE:
        return '🧠';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type, completed) => {
    const baseColors = {
      [ACTIVITY_TYPES.SUMMARY_GENERATE]: completed ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700',
      [ACTIVITY_TYPES.QUIZ_GENERATE]: completed ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'
    };
    return baseColors[type] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle checkpoint responses
  const handleCheckpointResponse = (checkpointId, response) => {
    setUserResponses(prev => ({
      ...prev,
      [checkpointId]: {
        ...prev[checkpointId],
        response: response,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const markCheckpointComplete = (checkpointId) => {
    setUserResponses(prev => ({
      ...prev,
      [checkpointId]: {
        ...prev[checkpointId],
        completed: true,
        completedAt: new Date().toISOString()
      }
    }));
  };

  const getCheckpointIcon = (type) => {
    switch (type) {
      case 'reflection': return '🤔';
      case 'application': return '🛠️';
      case 'analysis': return '🔍';
      case 'synthesis': return '🧩';
      default: return '📝';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (courseActivities.length === 0) {
  return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Learning Checkpoints</h2>
            <p className="text-sm text-gray-600">Track your progress and verify your understanding</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{learningProgress.progressPercentage}%</div>
          <div className="text-sm text-gray-500">
            {learningProgress.completedActivities}/{learningProgress.totalActivities} completed
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${learningProgress.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {courseActivities.map((activity) => (
          <div 
            key={activity.id} 
            className={`border-2 rounded-lg p-4 transition-all duration-300 ${
              activity.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type, activity.completed)}`}>
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{activity.description}</h4>
                  <p className="text-sm text-gray-600">
                    {formatDate(activity.timestamp)} • {activity.metadata?.filename}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {activity.completed ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleMarkComplete(activity.id)}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mark Complete
                  </button>
                )}
              </div>
            </div>

            {/* Activity Details */}
            {activity.metadata && (
              <div className="mt-3 pl-13">
                <div className="text-sm text-gray-600 space-y-1">
                  {activity.metadata.summaryLength && (
                    <p>Summary Length: {activity.metadata.summaryLength} characters</p>
                  )}
                  {activity.metadata.questionCount && (
                    <p>Questions: {activity.metadata.questionCount}</p>
                  )}
                  {activity.metadata.fileType && (
                    <p>File Type: {activity.metadata.fileType.toUpperCase()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Learning Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Learning Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Mark activities as complete after thoroughly reviewing the content</li>
          <li>• Try to complete quizzes without looking at the summary first</li>
          <li>• Review completed materials regularly to reinforce learning</li>
          <li>• Aim for 100% completion before moving to new topics</li>
        </ul>
      </div>
    </div>
  );
};

export default LearningCheckpoints;
