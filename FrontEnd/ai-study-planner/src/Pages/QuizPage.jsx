import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QuizSection from '../components/QuizSection';
import QuizResults from '../components/QuizResults';
import { useQuizState } from '../hooks/useQuizState';

function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz, filename, courseId } = location.state || {};

  const {
    currentQuestionIndex,
    userAnswers,
    showResults,
    handleQuizAnswer,
    resetQuiz
  } = useQuizState();

  const handleQuizAnswerWrapper = (selectedOption) => {
    const quizWithCourseId = { ...quiz, courseId };
    handleQuizAnswer(selectedOption, quiz.questions.length, quizWithCourseId);
  };

  const handleTheoryAnswerSubmit = (answer) => {
    const quizWithCourseId = { ...quiz, courseId };
    handleQuizAnswer(answer, quiz.questions.length, quizWithCourseId);
  };

  const handleGoBack = () => {
    if (courseId) {
      navigate(`/coursedetails/${courseId}`);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  const handleClose = () => {
    navigate('/courses'); // Go to courses page
  };

  if (!quiz) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Quiz Available</h2>
          <p className="text-gray-600">Please generate a quiz first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 max-w-5xl mx-auto flex flex-col pb-8">
        <div className="px-4 mt-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🧠</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-green-700">Interactive Quiz</h1>
                  {filename && (
                    <p className="text-gray-600 mt-1">Based on: {filename}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleClose}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
            
            {!showResults && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
                <p className="text-green-800 text-sm">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
                <div className="w-full bg-green-100 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex) / quiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {!showResults && (
          <QuizSection
            quiz={quiz}
            currentQuestionIndex={currentQuestionIndex}
            onAnswerSelect={handleQuizAnswerWrapper}
            onTheoryAnswerSubmit={handleTheoryAnswerSubmit}
          />
        )}

        {showResults && (
          <QuizResults
            quiz={quiz}
            userAnswers={userAnswers}
            onReset={resetQuiz}
            courseId={courseId}
            courseName={quiz.courseName}
            filename={filename}
          />
        )}
      </div>
    </div>
  );
}

export default QuizPage;
