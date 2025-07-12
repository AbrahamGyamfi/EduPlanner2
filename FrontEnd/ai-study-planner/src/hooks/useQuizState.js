import { useState } from 'react';
import { useActivityHistory, ACTIVITY_TYPES } from './useActivityHistory';
import quizResultService from '../services/QuizResultService';

export const useQuizState = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [isSavingResult, setIsSavingResult] = useState(false);
  
  const { addActivity } = useActivityHistory();

  const handleQuizAnswer = async (selectedOption, quizLength, quiz, additionalData = {}) => {
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
      
      // Calculate time spent
      const timeSpent = quizStartTime ? Math.round((Date.now() - quizStartTime) / 1000 / 60) : 0;
      
      // Add to activity history
      addActivity(
        ACTIVITY_TYPES.QUIZ_COMPLETE,
        `Completed quiz with ${score}% score`,
        {
          score: score,
          correctAnswers: correctAnswers,
          totalQuestions: quizLength,
          performance: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs improvement',
          timeSpent: timeSpent
        }
      );

      // Save quiz result to backend
      try {
        setIsSavingResult(true);
        
        const formattedQuizData = quizResultService.formatQuizData(quiz, newAnswers, {
          quizTitle: additionalData.quizTitle || 'Interactive Quiz',
          courseId: additionalData.courseId,
          courseName: additionalData.courseName,
          courseCode: additionalData.courseCode,
          difficulty: additionalData.difficulty || 'Medium',
          topic: additionalData.topic || 'General',
          timeSpent: timeSpent,
          attemptsUsed: additionalData.attemptsUsed || 1,
          maxAttempts: additionalData.maxAttempts || 3,
          quizSource: additionalData.quizSource || 'slide_upload',
          metadata: {
            fileName: additionalData.fileName,
            uploadDate: additionalData.uploadDate,
            ...additionalData.metadata
          }
        });

        await quizResultService.saveQuizResult(formattedQuizData);
        console.log('Quiz result saved successfully');
        
        // Optionally trigger CWA analysis update
        if (additionalData.triggerCWAAnalysis) {
          await triggerCWAAnalysisUpdate(additionalData);
        }
        
      } catch (error) {
        console.error('Failed to save quiz result:', error);
        // Don't block the UI, just log the error
      } finally {
        setIsSavingResult(false);
      }
    }
  };

  const triggerCWAAnalysisUpdate = async (additionalData = {}) => {
    try {
      const userId = quizResultService.getCurrentUserId();
      await quizResultService.sendToCWAAnalysis(userId, additionalData);
      console.log('CWA analysis updated with latest quiz results');
    } catch (error) {
      console.error('Failed to update CWA analysis:', error);
    }
  };

  const startQuiz = () => {
    setQuizStartTime(Date.now());
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
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
    quizStartTime,
    isSavingResult,
    handleQuizAnswer,
    resetQuiz,
    resetQuizState,
    startQuiz,
    triggerCWAAnalysisUpdate,
  };
};
