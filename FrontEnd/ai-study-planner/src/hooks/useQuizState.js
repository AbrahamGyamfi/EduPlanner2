import { useState } from 'react';
import { useActivityHistory, ACTIVITY_TYPES } from './useActivityHistory';

export const useQuizState = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  const { addActivity } = useActivityHistory();

  const handleQuizAnswer = (selectedOption, quizLength, quiz) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < quizLength - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed, show results
      setShowResults(true);
      
      // Calculate score and track completion
      const correctAnswers = newAnswers.filter((answer, index) => 
        answer === quiz.questions[index].correct_answer
      ).length;
      const score = Math.round((correctAnswers / quizLength) * 100);
      
      addActivity(
        ACTIVITY_TYPES.QUIZ_COMPLETE,
        `Completed quiz with ${score}% score`,
        {
          score: score,
          correctAnswers: correctAnswers,
          totalQuestions: quizLength,
          performance: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs improvement'
        }
      );
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
  };

  const resetQuizState = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
  };

  return {
    currentQuestionIndex,
    userAnswers,
    showResults,
    handleQuizAnswer,
    resetQuiz,
    resetQuizState,
  };
};
