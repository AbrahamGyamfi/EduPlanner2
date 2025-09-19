/**
 * Secure API utility with user context validation and automatic data isolation
 * This module ensures all API calls are made with proper user authentication
 * and prevents data leakage between different user sessions.
 */

const BASE_URL = 'http://127.0.0.1:5000';

class SecureAPIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'SecureAPIError';
    this.status = status;
    this.response = response;
  }
}

class SecureAPI {
  constructor() {
    this.currentUser = null;
    this.initializeUser();
  }

  initializeUser() {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('❌ Error initializing SecureAPI user:', error);
      this.currentUser = null;
    }
  }

  getCurrentUser() {
    // Always get fresh user data
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      
      if (storedAuth === 'true' && storedUser) {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      } else {
        this.currentUser = null;
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      this.currentUser = null;
      return null;
    }
  }

  validateUserSession() {
    const user = this.getCurrentUser();
    if (!user || !user.id) {
      throw new SecureAPIError('User not authenticated', 401);
    }
    return user;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      // Validate user session for all API calls
      const user = this.validateUserSession();
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      // Add user ID to headers for backend validation
      headers['X-User-ID'] = user.id;
      
      const config = {
        method: 'GET',
        ...options,
        headers
      };

      const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
      
      console.log(`🔐 Making authenticated API request: ${config.method} ${url} (User: ${user.email})`);
      
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Authentication failed, clearing session');
        this.handleAuthError();
        throw new SecureAPIError('Authentication failed', response.status, response);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new SecureAPIError(errorData.error || 'API request failed', response.status, response);
      }
      
      const data = await response.json();
      
      // Validate that response data belongs to the current user
      if (data.userId && data.userId !== user.id) {
        console.error('❌ Data ownership violation detected!', {
          expectedUserId: user.id,
          receivedUserId: data.userId
        });
        throw new SecureAPIError('Data ownership violation', 403);
      }
      
      return data;
      
    } catch (error) {
      if (error instanceof SecureAPIError) {
        throw error;
      }
      console.error('❌ API request error:', error);
      throw new SecureAPIError('Network error', 0, error);
    }
  }

  handleAuthError() {
    // Clear all user data and force logout
    const keysToRemove = [
      'isAuthenticated', 'token', 'userId', 'isLoggedIn', 'user',
      'firstname', 'lastname', 'email', 'currentUserId',
      'courses', 'assignments', 'activeStudents', 'cwa_behavior_data',
      'notifications', 'quizzes', 'summaries', 'study_sessions',
      'activities', 'schedules', 'performance_data', 'analytics_data'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLogout'));
    
    // Redirect to login
    window.location.href = '/login';
  }

  // User-specific data methods
  async getUserAssignments(status = null) {
    const user = this.validateUserSession();
    let endpoint = `/assignments/${user.id}`;
    
    if (status) {
      endpoint += `?status=${status}`;
    }
    
    return this.makeRequest(endpoint);
  }

  async getUserCourses() {
    const user = this.validateUserSession();
    return this.makeRequest(`/user-files/${user.id}`); // Assuming courses are part of user files
  }

  async getUserSummaries() {
    const user = this.validateUserSession();
    return this.makeRequest(`/user-summaries/${user.id}`);
  }

  async getUserQuizzes() {
    const user = this.validateUserSession();
    return this.makeRequest(`/user-quizzes/${user.id}`);
  }

  async getUserProfile() {
    const user = this.validateUserSession();
    return this.makeRequest(`/user-profile/${user.id}`);
  }

  async getUserAnalytics(days = 7) {
    const user = this.validateUserSession();
    return this.makeRequest(`/behavioral-analytics/${user.id}?days=${days}`);
  }

  async getUserInsights() {
    const user = this.validateUserSession();
    return this.makeRequest(`/ai-analytics/${user.id}/insights`);
  }

  async getUserNotifications(limit = 10) {
    const user = this.validateUserSession();
    return this.makeRequest(`/notifications/in-app/${user.id}?limit=${limit}`);
  }

  // Create operations (always include user context)
  async createAssignment(assignmentData) {
    const user = this.validateUserSession();
    return this.makeRequest('/assignments', {
      method: 'POST',
      body: JSON.stringify({
        ...assignmentData,
        userId: user.id
      })
    });
  }

  // Update operations
  async updateAssignment(assignmentId, updateData) {
    this.validateUserSession();
    return this.makeRequest(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // Delete operations  
  async deleteAssignment(assignmentId) {
    this.validateUserSession();
    return this.makeRequest(`/assignments/${assignmentId}`, {
      method: 'DELETE'
    });
  }

  // Utility method to clear all cached data for current user
  clearUserCache() {
    const userDataKeys = [
      'courses', 'assignments', 'activeStudents', 'cwa_behavior_data',
      'notifications', 'quizzes', 'summaries', 'study_sessions',
      'activities', 'schedules', 'performance_data', 'analytics_data'
    ];
    
    userDataKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('🧹 Cleared all cached user data');
  }

  // Method to refresh all user data
  async refreshAllUserData() {
    this.clearUserCache();
    
    try {
      const user = this.validateUserSession();
      console.log(`🔄 Refreshing all data for user: ${user.email}`);
      
      // Fetch fresh data in parallel
      const [assignments, summaries, quizzes, profile, analytics] = await Promise.allSettled([
        this.getUserAssignments(),
        this.getUserSummaries(),
        this.getUserQuizzes(), 
        this.getUserProfile(),
        this.getUserAnalytics()
      ]);
      
      console.log('✅ All user data refreshed');
      
      return {
        assignments: assignments.status === 'fulfilled' ? assignments.value : null,
        summaries: summaries.status === 'fulfilled' ? summaries.value : null,
        quizzes: quizzes.status === 'fulfilled' ? quizzes.value : null,
        profile: profile.status === 'fulfilled' ? profile.value : null,
        analytics: analytics.status === 'fulfilled' ? analytics.value : null
      };
      
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const secureApi = new SecureAPI();

// Listen for user login/logout events to update the current user
window.addEventListener('userLogin', (event) => {
  secureApi.currentUser = event.detail;
  console.log('🔐 SecureAPI updated for new user:', event.detail.email);
});

window.addEventListener('userLogout', () => {
  secureApi.currentUser = null;
  secureApi.clearUserCache();
  console.log('🔒 SecureAPI cleared for logout');
});

export default secureApi;
