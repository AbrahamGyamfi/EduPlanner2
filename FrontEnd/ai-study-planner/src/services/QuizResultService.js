export default class QuizResultService {
  static getCurrentUserId() {
    // Mock user ID
    return 'user-123';
  }

  static async getQuizResults(userId, options) {
    // Mock quiz result data retrieval
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          quizResults: [
            { id: '1', courseId: 'course-1', percentage: 85 },
            { id: '2', courseId: 'course-2', percentage: 90 },
            // Add more mock data as needed
          ],
        });
      }, 500);
    });
  }
}
