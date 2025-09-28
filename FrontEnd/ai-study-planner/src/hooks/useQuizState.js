import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useActivityHistory, ACTIVITY_TYPES } from './useActivityHistory';
import { updateCourseProgress, PROGRESS_ACTIVITIES } from '../utils/progressTracking';

// Function to save quiz results to Flask backend
const saveQuizResultToBackend = async (quizResult) => {
  try {
    const userId = localStorage.getItem('userId') || 'default-user';
    
    const response = await fetch(`${API_BASE_URL}/quiz-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        quizId: quizResult.quizId,
        courseId: quizResult.courseId,
        courseName: quizResult.courseName || 'General',
        filename: quizResult.filename,
        quizTitle: quizResult.quizTitle || 'Quiz',
        score: quizResult.score,
        percentage: quizResult.percentage,
        totalQuestions: quizResult.totalQuestions,
        correctAnswers: quizResult.correctAnswers,
        quizType: quizResult.quizType,
        timeSpent: quizResult.timeSpent || 0,
        questions: quizResult.questions || [],
        userAnswers: quizResult.userAnswers || [],
        correctAnswersList: quizResult.correctAnswersList || []
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to save quiz result: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Quiz result saved to backend:', data);
    return data;
  } catch (error) {
    console.error('Error saving quiz result to backend:', error);
    throw error;
  }
};

export const useQuizState = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [completedQuiz, setCompletedQuiz] = useState(null);
  
  const { addActivity } = useActivityHistory();

  const handleQuizAnswer = (selectedOption, quizLength, quiz) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < quizLength - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      setCompletedQuiz({ quiz, answers: newAnswers });
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
    setCompletedQuiz(null);
  };

  useEffect(() => {
    const processQuizCompletion = async () => {
      if (completedQuiz) {
        const { quiz, answers } = completedQuiz;
        const isMCQ = quiz.questions.some(q => q.type === 'mcq');
        let score = 0;
        let correctAnswers = 0;

        if (isMCQ) {
          correctAnswers = answers.filter((answer, index) => 
            answer === quiz.questions[index].correct_answer
          ).length;
          score = Math.round((correctAnswers / quiz.questions.length) * 100);
        } else {
          correctAnswers = quiz.questions.length;
          score = 100;
        }
        
        const quizResult = {
          courseId: quiz.courseId,
          courseName: quiz.courseName,
          filename: quiz.filename,
          quizTitle: quiz.title || 'Quiz',
          quizId: quiz.id || new Date().toISOString(),
          date: new Date().toISOString(),
          score: score,
          percentage: score,
          correctAnswers: correctAnswers,
          totalQuestions: quiz.questions.length,
          quizType: isMCQ ? 'mcq' : 'theory',
          questions: quiz.questions,
          userAnswers: answers,
          correctAnswersList: quiz.questions.map(q => q.correct_answer)
        };

        try {
          // Save to backend
          await saveQuizResultToBackend(quizResult);
          
          // Also save to localStorage as backup
          const existingResults = JSON.parse(localStorage.getItem('quiz_results')) || [];
          localStorage.setItem('quiz_results', JSON.stringify([...existingResults, quizResult]));
        } catch (e) {
          console.error("Failed to save quiz results:", e);
          // If backend fails, still save to localStorage
          try {
            const existingResults = JSON.parse(localStorage.getItem('quiz_results')) || [];
            localStorage.setItem('quiz_results', JSON.stringify([...existingResults, quizResult]));
          } catch (localError) {
            console.error("Failed to save to localStorage:", localError);
          }
        }

        addActivity(
          ACTIVITY_TYPES.QUIZ_COMPLETE,
          `Quiz completed with score: ${score}%`,
          { ...quizResult }
        );
        
        if (quiz.courseId) {
          updateCourseProgress(quiz.courseId, PROGRESS_ACTIVITIES.QUIZ_TAKEN, {
            lastQuizScore: score
          });
        }
        
        setCompletedQuiz(null); // Reset for next quiz
      }
    };

    processQuizCompletion();
  }, [completedQuiz, addActivity]);

  return {
    currentQuestionIndex,
    userAnswers,
    showResults,
    handleQuizAnswer,
    resetQuiz,
    resetQuizState,
  };
};
