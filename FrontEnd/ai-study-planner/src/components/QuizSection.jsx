import React, { useState } from 'react';

const QuizSection = ({ quiz, currentQuestionIndex, onAnswerSelect, onTheoryAnswerSubmit }) => {
  const [theoryAnswer, setTheoryAnswer] = useState('');

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleTheorySubmit = (e) => {
    e.preventDefault();
    onTheoryAnswerSubmit(theoryAnswer);
    setTheoryAnswer('');
  };

  return (
    <div className="px-4 mt-6 flex justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">❓</span>
            </div>
            <h2 className="text-2xl font-bold text-purple-700">Interactive Quiz</h2>
          </div>
          
          <div className="bg-purple-100 px-4 py-2 rounded-full">
            <span className="text-purple-700 font-semibold text-sm">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-l-4 border-purple-500 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 leading-relaxed">
            {currentQuestion.question}
          </h3>
          
          {currentQuestion.type === 'mcq' ? (
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onAnswerSelect(option.charAt(0))}
                  className="text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 text-purple-700 font-semibold">
                      {option.charAt(0)}
                    </div>
                    <span className="text-gray-700 font-medium">{option.substring(3)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleTheorySubmit}>
              <textarea
                value={theoryAnswer}
                onChange={(e) => setTheoryAnswer(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:ring-purple-400"
                rows="6"
                placeholder="Type your answer here..."
              ></textarea>
              <div className="flex justify-end mt-4">
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Submit Answer
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {currentQuestion.type === 'mcq' ? 'Select an answer to continue' : 'Provide your answer and click submit'}
        </div>
      </div>
    </div>
  );
};

export default QuizSection;
