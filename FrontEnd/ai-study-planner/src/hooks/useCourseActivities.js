import { useState, useEffect, useCallback } from 'react';

export const useCourseActivities = (courseId) => {
  const [activities, setActivities] = useState({
    quizResults: [],
    summaries: [],
    loading: true,
    error: null
  });

  const fetchCourseActivities = useCallback(async () => {
    if (!courseId) return;

    setActivities(prev => ({ ...prev, loading: true, error: null }));

    try {
      const userId = localStorage.getItem('userId') || 'default-user';

      // Fetch quiz results for this course
      const quizResponse = await fetch(`http://localhost:5000/quiz-results/${userId}?course_id=${courseId}`);
      let quizResults = [];
      
      if (quizResponse.ok) {
        const quizData = await quizResponse.json();
        quizResults = quizData.quiz_results || [];
      }

      // Fetch summaries from Flask backend
      const summaryResponse = await fetch(`http://localhost:5000/user-summaries/${userId}?course_id=${courseId}`);
      let courseSummaries = [];
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        courseSummaries = summaryData.summaries || [];
      }
      
      // Get saved quiz results from localStorage
      const savedQuizResults = JSON.parse(localStorage.getItem('course_quiz_results')) || {};
      const courseQuizResults = savedQuizResults[courseId] || [];

      // Combine and sort activities by date
      const combinedActivities = [
        ...quizResults.map(quiz => ({
          ...quiz,
          type: 'quiz',
          date: quiz.completed_at || quiz.date,
          timestamp: new Date(quiz.completed_at || quiz.date)
        })),
        ...courseQuizResults.map(savedQuiz => ({
          ...savedQuiz,
          type: 'quiz',
          date: savedQuiz.created_at,
          timestamp: new Date(savedQuiz.created_at),
          isSavedResult: true
        })),
        ...courseSummaries.map(summary => ({
          ...summary,
          type: 'summary',
          date: summary.created_at || summary.date,
          timestamp: new Date(summary.created_at || summary.date)
        }))
      ].sort((a, b) => b.timestamp - a.timestamp);

      setActivities({
        quizResults,
        summaries: courseSummaries,
        allActivities: combinedActivities,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching course activities:', error);
      setActivities(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseActivities();
  }, [fetchCourseActivities]);

  const refetch = useCallback(() => {
    fetchCourseActivities();
  }, [fetchCourseActivities]);

  // Save summary to localStorage with course association
  const saveSummary = useCallback((summaryData) => {
    if (!courseId) return;

    try {
      const summaryWithMetadata = {
        ...summaryData,
        courseId,
        created_at: new Date().toISOString(),
        id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Get existing summaries
      const existingSummaries = JSON.parse(localStorage.getItem('course_summaries')) || {};
      
      // Add to course-specific summaries
      if (!existingSummaries[courseId]) {
        existingSummaries[courseId] = [];
      }
      existingSummaries[courseId].push(summaryWithMetadata);

      // Save back to localStorage
      localStorage.setItem('course_summaries', JSON.stringify(existingSummaries));

      // Refetch activities
      refetch();

      return summaryWithMetadata;
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  }, [courseId, refetch]);

  return {
    ...activities,
    refetch,
    saveSummary
  };
};
