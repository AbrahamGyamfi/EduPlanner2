import React, { useState } from 'react';
import { useCourseActivities } from '../hooks/useCourseActivities';

const CourseActivities = ({ courseId, courseName }) => {
  const { allActivities, quizResults, summaries, loading, error, refetch } = useCourseActivities(courseId);
  const [filter, setFilter] = useState('all'); // 'all', 'quiz', 'summary'
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Course Activities</h3>
          <button
            onClick={refetch}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm"
          >
            Retry
          </button>
        </div>
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
          Error loading activities: {error}
        </div>
      </div>
    );
  }

  const filteredActivities = filter === 'all' 
    ? allActivities 
    : allActivities.filter(activity => activity.type === filter);

  const displayedActivities = isExpanded ? filteredActivities : filteredActivities.slice(0, 3);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'quiz':
        return '🎯';
      case 'summary':
        return '📄';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'quiz':
        return 'bg-purple-100 text-purple-700';
      case 'summary':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMs = now - activityTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return activityTime.toLocaleDateString();
  };

  const handleViewQuizResult = (quiz) => {
    // Create a modal or new window to show the quiz results
    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Quiz Results - ${quiz.title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              .header { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
              .score { font-size: 24px; font-weight: bold; color: #059669; }
              .content { background: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
              .print-btn { background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0; }
              .print-btn:hover { background: #4338ca; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Quiz Results</h1>
              <p><strong>Course:</strong> ${quiz.courseName || 'General'}</p>
              <p><strong>Score:</strong> <span class="score">${quiz.score}%</span></p>
            </div>
            <button class="print-btn" onclick="window.print()">🖨️ Print Results</button>
            <div class="content">${quiz.content}</div>
            <script>
              // Allow copying content
              document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'a') {
                  document.getSelection().selectAllChildren(document.querySelector('.content'));
                }
              });
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(quiz.content).then(() => {
        alert('Quiz results copied to clipboard!');
      }).catch(() => {
        alert('Please enable popup windows to view quiz results.');
      });
    }
  };

  const renderQuizActivity = (quiz) => (
    <div key={quiz.quiz_result_id || quiz.id} className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor('quiz')}`}>
            <span className="text-lg">{getActivityIcon('quiz')}</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">
              {quiz.quizTitle || quiz.title || 'Quiz Completed'}
              {quiz.isSavedResult && (
                <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 font-medium">
                  Saved
                </span>
              )}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Score: {quiz.score || quiz.percentage}% • 
              {quiz.correctAnswers}/{quiz.totalQuestions} correct • 
              {quiz.quizType?.toUpperCase()} quiz
            </p>
            {quiz.filename && (
              <p className="text-xs text-gray-500 mt-1">
                From: {quiz.filename}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                quiz.score >= 80 ? 'bg-green-100 text-green-700' :
                quiz.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {quiz.score >= 80 ? 'Excellent' :
                 quiz.score >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
              {quiz.difficulty && (
                <div className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                  {quiz.difficulty}
                </div>
              )}
            </div>
            {quiz.isSavedResult && (
              <div className="mt-2">
                <button 
                  onClick={() => handleViewQuizResult(quiz)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  View Full Results →
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500 ml-4">
          {formatTimeAgo(quiz.date)}
        </div>
      </div>
    </div>
  );

  const renderSummaryActivity = (summary) => (
    <div key={summary.summary_id || summary.id} className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor('summary')}`}>
            <span className="text-lg">{getActivityIcon('summary')}</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">
              {summary.title || summary.course_name || 'Summary Generated'}
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {summary.content ? 
                summary.content.substring(0, 120) + (summary.content.length > 120 ? '...' : '') :
                summary.summary_preview || 'Summary content available'
              }
            </p>
            {summary.filename && (
              <p className="text-xs text-gray-500 mt-1">
                From: {summary.filename}
              </p>
            )}
            <div className="mt-2">
              <button 
                onClick={() => {
                  // Navigate to summary view or show in modal
                  window.open(`/summary?id=${summary.id}`, '_blank');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Full Summary →
              </button>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 ml-4">
          {formatTimeAgo(summary.date)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Course Activities</h3>
          <p className="text-sm text-gray-600">
            {quizResults.length} quizzes • {summaries.length} summaries
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activities</option>
            <option value="quiz">Quiz Results</option>
            <option value="summary">Summaries</option>
          </select>
          <button
            onClick={refetch}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Refresh activities"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No Activities Yet</h4>
            <p className="text-gray-600">
              Complete quizzes and generate summaries to see your course activities here.
            </p>
          </div>
        ) : (
          <>
            {displayedActivities.map((activity) => (
              activity.type === 'quiz' ? 
                renderQuizActivity(activity) : 
                renderSummaryActivity(activity)
            ))}
            
            {/* Show More/Less Button */}
            {filteredActivities.length > 3 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {isExpanded ? 
                    `Show Less` : 
                    `Show ${filteredActivities.length - 3} More Activities`
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Stats */}
      {allActivities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">{quizResults.length}</div>
              <div className="text-sm text-gray-600">Quizzes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {quizResults.length > 0 ? 
                  Math.round(quizResults.reduce((acc, quiz) => acc + (quiz.score || 0), 0) / quizResults.length) :
                  0
                }%
              </div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">{summaries.length}</div>
              <div className="text-sm text-gray-600">Summaries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{allActivities.length}</div>
              <div className="text-sm text-gray-600">Total Activities</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseActivities;
