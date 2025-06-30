import React from 'react';

const QuizResults = ({ quiz, userAnswers, onReset }) => {
  if (!quiz || !userAnswers.length) return null;

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const score = calculateScore();
  const correctCount = userAnswers.filter((answer, index) => 
    answer === quiz.questions[index].correct_answer
  ).length;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = () => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="px-4 mt-6 flex justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold text-green-700">Quiz Results</h2>
        </div>
        
        <div className={`${getScoreBgColor()} rounded-lg p-6 mb-6 text-center`}>
          <div className={`text-4xl font-bold ${getScoreColor()} mb-2`}>
            {score}%
          </div>
          <div className="text-lg text-gray-700">
            You answered {correctCount} out of {quiz.questions.length} questions correctly
          </div>
          {score >= 80 && (
            <div className="mt-2 text-green-600 font-semibold">
              🌟 Excellent work!
            </div>
          )}
          {score >= 60 && score < 80 && (
            <div className="mt-2 text-yellow-600 font-semibold">
              👍 Good job!
            </div>
          )}
          {score < 60 && (
            <div className="mt-2 text-red-600 font-semibold">
              📚 Keep studying!
            </div>
          )}
        </div>
        
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Results</h3>
          {quiz.questions.map((question, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
              <h4 className="font-semibold text-gray-800 mb-3">
                Question {index + 1}: {question.question}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600 font-medium mb-1">Your Answer:</div>
                  <div className="text-blue-800">{userAnswers[index] || 'Not answered'}</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600 font-medium mb-1">Correct Answer:</div>
                  <div className="text-green-800">{question.correct_answer}</div>
                </div>
              </div>
              
              <div className={`mt-3 flex items-center ${
                userAnswers[index] === question.correct_answer ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="mr-2">
                  {userAnswers[index] === question.correct_answer ? '✅' : '❌'}
                </span>
                <span className="font-medium">
                  {userAnswers[index] === question.correct_answer ? 'Correct' : 'Incorrect'}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <button 
            onClick={onReset} 
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            🔄 Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
