// QuizResultService.js - Service for handling quiz results
class QuizResultService {
  constructor() {
    this.baseUrl = 'http://localhost:5000/api';
  }

  /**
   * Save quiz result to backend
   * @param {Object} quizData - Quiz result data
   * @returns {Promise} API response
   */
  async saveQuizResult(quizData) {
    try {
      const response = await fetch(`${this.baseUrl}/quiz-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save quiz result: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  }

  /**
   * Get quiz results for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise} Quiz results
   */
  async getQuizResults(userId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.courseId) queryParams.append('courseId', options.courseId);
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);

      const response = await fetch(`${this.baseUrl}/quiz-results/${userId}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get quiz results: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quiz results:', error);
      throw error;
    }
  }

  /**
   * Format quiz data for saving
   * @param {Object} quiz - Quiz object
   * @param {Array} userAnswers - User's answers
   * @param {Object} additionalData - Additional metadata
   * @returns {Object} Formatted quiz data
   */
  formatQuizData(quiz, userAnswers, additionalData = {}) {
    const correctAnswers = userAnswers.filter((answer, index) => 
      answer === quiz.questions[index].correct_answer
    ).length;

    const score = correctAnswers;
    const maxScore = quiz.questions.length;
    const percentage = Math.round((score / maxScore) * 100);

    return {
      userId: this.getCurrentUserId(),
      quizTitle: additionalData.quizTitle || 'Interactive Quiz',
      score: score,
      maxScore: maxScore,
      percentage: percentage,
      questions: quiz.questions,
      userAnswers: userAnswers,
      courseId: additionalData.courseId || null,
      courseName: additionalData.courseName || null,
      courseCode: additionalData.courseCode || null,
      difficulty: additionalData.difficulty || 'Medium',
      topic: additionalData.topic || 'General',
      timeSpent: additionalData.timeSpent || 0,
      attemptsUsed: additionalData.attemptsUsed || 1,
      maxAttempts: additionalData.maxAttempts || 3,
      metadata: {
        ...additionalData.metadata,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        quizSource: additionalData.quizSource || 'manual'
      }
    };
  }

  /**
   * Get current user ID from localStorage or session
   * @returns {string} User ID
   */
  getCurrentUserId() {
    // Try to get user ID from localStorage first
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || user.email || 'anonymous';
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }

    // Fallback to session storage
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      try {
        const user = JSON.parse(sessionUser);
        return user.id || user.email || 'anonymous';
      } catch (e) {
        console.warn('Failed to parse user data from sessionStorage');
      }
    }

    // Generate a temporary user ID if no user is found
    let tempUserId = localStorage.getItem('tempUserId');
    if (!tempUserId) {
      tempUserId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tempUserId', tempUserId);
    }
    
    return tempUserId;
  }

  /**
   * Calculate quiz performance metrics
   * @param {Array} quizResults - Array of quiz results
   * @returns {Object} Performance metrics
   */
  calculatePerformanceMetrics(quizResults) {
    if (!quizResults || quizResults.length === 0) {
      return {
        averageScore: 0,
        totalQuizzes: 0,
        recentPerformance: 0,
        difficultyHandling: 0,
        preparationLevel: 0,
        consistencyScore: 0,
        timeEfficiency: 0,
      };
    }

    const totalScore = quizResults.reduce((sum, quiz) => sum + quiz.percentage, 0);
    const averageScore = totalScore / quizResults.length;

    // Recent performance (last 5 quizzes)
    const recentQuizzes = quizResults.slice(0, 5);
    const recentPerformance = recentQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / recentQuizzes.length;

    // Difficulty handling (performance on hard quizzes)
    const hardQuizzes = quizResults.filter(quiz => quiz.difficulty === 'Hard');
    const difficultyHandling = hardQuizzes.length > 0
      ? hardQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / hardQuizzes.length
      : averageScore;

    // Preparation level (first attempt success rate)
    const firstAttemptSuccess = quizResults.filter(quiz => quiz.attemptsUsed === 1).length;
    const preparationLevel = (firstAttemptSuccess / quizResults.length) * 100;

    // Consistency (standard deviation of scores)
    const variance = quizResults.reduce((sum, quiz) => sum + Math.pow(quiz.percentage - averageScore, 2), 0) / quizResults.length;
    const standardDeviation = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 100 - standardDeviation * 2);

    // Time efficiency (score per minute)
    const avgTimeEfficiency = quizResults.reduce((sum, quiz) => sum + quiz.percentage / Math.max(quiz.timeSpent, 1), 0) / quizResults.length;

    return {
      averageScore: Math.round(averageScore),
      totalQuizzes: quizResults.length,
      recentPerformance: Math.round(recentPerformance),
      difficultyHandling: Math.round(difficultyHandling),
      preparationLevel: Math.round(preparationLevel),
      consistencyScore: Math.round(consistencyScore),
      timeEfficiency: Math.round(avgTimeEfficiency * 10),
    };
  }

  /**
   * Send quiz results to CWA analysis
   * @param {string} userId - User ID
   * @param {Object} additionalData - Additional data for CWA analysis
   * @returns {Promise} CWA analysis result
   */
  async sendToCWAAnalysis(userId, additionalData = {}) {
    try {
      // Get recent quiz results
      const quizData = await this.getQuizResults(userId, { limit: 20 });
      
      if (!quizData || !quizData.quizResults) {
        throw new Error('No quiz results found for CWA analysis');
      }

      // Prepare data for CWA analysis
      const analysisData = {
        userId: userId,
        studentProfile: additionalData.studentProfile || {},
        courses: additionalData.courses || [],
        behaviorMetrics: additionalData.behaviorMetrics || {},
        quizResults: quizData.quizResults,
        quizMetrics: quizData.summary
      };

      // Send to CWA analysis endpoint
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error(`CWA analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending to CWA analysis:', error);
      throw error;
    }
  }
}

// Export singleton instance
const quizResultService = new QuizResultService();
export default quizResultService;
