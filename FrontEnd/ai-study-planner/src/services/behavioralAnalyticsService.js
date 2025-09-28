/**
 * Behavioral Analytics Service
 * Integrates with backend behavioral analytics API to provide
 * real activity-based academic performance predictions
 */

import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

class BehavioralAnalyticsService {
  
  /**
   * Get current user ID from localStorage
   */
  getCurrentUserId() {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      return userData.id || userData._id || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  /**
   * Get comprehensive behavioral analytics for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Promise<Object>} Behavioral analytics data
   */
  async getBehavioralAnalytics(userId = null, days = 30) {
    try {
      const effectiveUserId = userId || this.getCurrentUserId();
      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }

      const response = await fetch(`${API_BASE_URL}/behavioral-analytics/${effectiveUserId}?days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching behavioral analytics:', error);
      throw error;
    }
  }

  /**
   * Get academic performance prediction based on behavioral data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Academic prediction with recommendations and risks
   */
  async getAcademicPrediction(userId = null) {
    try {
      const effectiveUserId = userId || this.getCurrentUserId();
      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }

      const response = await fetch(`${API_BASE_URL}/behavioral-analytics/${effectiveUserId}/prediction`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching academic prediction:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics for behavioral analysis
   * @param {string} userId - User ID  
   * @param {Object} options - Query options (from_date, to_date, etc.)
   * @returns {Promise<Object>} Activity statistics
   */
  async getActivityStatistics(userId = null, options = {}) {
    try {
      const effectiveUserId = userId || this.getCurrentUserId();
      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }

      const queryParams = new URLSearchParams();
      if (options.from_date) queryParams.append('from_date', options.from_date);
      if (options.to_date) queryParams.append('to_date', options.to_date);

      const response = await fetch(`${API_BASE_URL}/activities/${effectiveUserId}/statistics?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching activity statistics:', error);
      throw error;
    }
  }

  /**
   * Get quiz analytics for behavioral analysis
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} Quiz analytics data
   */
  async getQuizAnalytics(userId = null, days = 30) {
    try {
      const effectiveUserId = userId || this.getCurrentUserId();
      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }

      const response = await fetch(`${API_BASE_URL}/quiz-results/analytics/${effectiveUserId}?days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching quiz analytics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive quiz statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Quiz statistics
   */
  async getQuizStatistics(userId = null) {
    try {
      const effectiveUserId = userId || this.getCurrentUserId();
      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }

      const response = await fetch(`${API_BASE_URL}/quiz-results/stats/${effectiveUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching quiz statistics:', error);
      throw error;
    }
  }

  /**
   * Record a study session for behavioral tracking
   * @param {Object} sessionData - Study session data
   * @returns {Promise<Object>} Response from backend
   */
  async recordStudySession(sessionData) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      const response = await fetch(`${API_BASE_URL}/study-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...sessionData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error recording study session:', error);
      throw error;
    }
  }

  /**
   * Record an activity completion for behavioral tracking
   * @param {Object} activityData - Activity completion data
   * @returns {Promise<Object>} Response from backend
   */
  async recordActivityCompletion(activityData) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      // Update activity status to completed
      const response = await fetch(`${API_BASE_URL}/activities/${activityData.activityId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          completion_notes: activityData.notes || ''
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error recording activity completion:', error);
      throw error;
    }
  }

  /**
   * Transform frontend behavior tracking data for backend compatibility
   * @param {Object} frontendData - Data from frontend behavior tracking hooks
   * @returns {Object} Transformed data for backend API
   */
  transformFrontendBehaviorData(frontendData) {
    try {
      const transformed = {
        study_sessions: [],
        activity_completions: [],
        quiz_attempts: [],
        schedule_adherence: []
      };

      // Transform study sessions
      if (frontendData.studySessions) {
        transformed.study_sessions = frontendData.studySessions.map(session => ({
          course_id: session.courseId,
          course_name: session.courseName,
          duration_minutes: session.duration,
          active_time_minutes: session.activeTime || session.duration,
          efficiency_percentage: session.efficiency || 100,
          tracking_mode: session.trackingMode || 'manual',
          session_date: session.date || session.timestamp,
          created_at: session.timestamp || new Date().toISOString()
        }));
      }

      // Transform activity completions
      if (frontendData.activityCompletions) {
        transformed.activity_completions = frontendData.activityCompletions.map(activity => ({
          activity_type: activity.type || 'study',
          completion_status: activity.completed ? 'completed' : 'pending',
          scheduled_date: activity.scheduledDate,
          completion_date: activity.completionDate,
          duration_minutes: activity.duration
        }));
      }

      return transformed;

    } catch (error) {
      console.error('Error transforming frontend behavior data:', error);
      return {};
    }
  }

  /**
   * Get consolidated behavioral metrics from multiple sources
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Consolidated metrics for CWA analysis
   */
  async getConsolidatedMetrics(userId = null) {
    try {
      const effectiveUserId = userId || this.getCurrentUserId();
      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }

      // Fetch data from multiple sources in parallel
      const [
        behavioralAnalytics,
        activityStats,
        quizStats
      ] = await Promise.allSettled([
        this.getBehavioralAnalytics(effectiveUserId),
        this.getActivityStatistics(effectiveUserId),
        this.getQuizStatistics(effectiveUserId)
      ]);

      // Process results and handle any failures gracefully
      const consolidatedData = {
        behavioral_insights: {},
        activity_patterns: {},
        quiz_performance: {},
        data_quality: 'low',
        last_updated: new Date().toISOString()
      };

      if (behavioralAnalytics.status === 'fulfilled' && behavioralAnalytics.value.analytics) {
        consolidatedData.behavioral_insights = behavioralAnalytics.value.analytics.behavioral_insights || {};
        consolidatedData.activity_patterns = behavioralAnalytics.value.analytics.activity_patterns || {};
        consolidatedData.quiz_performance = behavioralAnalytics.value.analytics.quiz_performance || {};
        consolidatedData.data_quality = 'high';
      }

      if (activityStats.status === 'fulfilled' && activityStats.value.statistics) {
        consolidatedData.activity_statistics = activityStats.value.statistics;
      }

      if (quizStats.status === 'fulfilled' && quizStats.value.stats) {
        consolidatedData.quiz_statistics = quizStats.value.stats;
      }

      // Calculate derived metrics for CWA compatibility
      consolidatedData.cwa_metrics = this.calculateCWACompatibleMetrics(consolidatedData);

      return consolidatedData;

    } catch (error) {
      console.error('Error getting consolidated metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate metrics in format compatible with existing CWA components
   * @param {Object} consolidatedData - Raw consolidated data
   * @returns {Object} CWA-compatible metrics
   */
  calculateCWACompatibleMetrics(consolidatedData) {
    try {
      const insights = consolidatedData.behavioral_insights || {};
      const activityStats = consolidatedData.activity_statistics || {};
      const quizStats = consolidatedData.quiz_statistics || {};

      return {
        // Core behavioral metrics
        studyHours: insights.weekly_study_hours || 0,
        scheduleFollowing: insights.schedule_adherence_rate || 50,
        taskCompletion: insights.task_completion_rate || 50,
        procrastination: insights.procrastination_score || 50,
        focusLevel: insights.focus_efficiency || 50,
        helpSeeking: insights.help_seeking_score || 50,

        // Quiz metrics
        averageScore: quizStats.average_score || 0,
        totalQuizzes: quizStats.total_quizzes || 0,
        recentPerformance: quizStats.average_score || 0, // Could be enhanced with recent performance
        difficultyHandling: this.calculateDifficultyHandling(consolidatedData.quiz_performance),
        preparationLevel: consolidatedData.quiz_performance?.preparation_level || 50,
        consistencyScore: consolidatedData.quiz_performance?.consistency_score || 50,
        timeEfficiency: consolidatedData.quiz_performance?.time_management?.efficiency_score || 50,

        // Activity metrics
        activityCompletionRate: activityStats.completion_rate || 0,
        averageSessionDuration: consolidatedData.activity_patterns?.average_duration || 60,
        studyPatterns: insights.study_pattern_analysis || [],
        
        // Performance trends
        performanceTrend: insights.performance_trend || 'stable',
        strengths: insights.behavioral_strengths || [],
        improvementAreas: insights.improvement_areas || []
      };

    } catch (error) {
      console.error('Error calculating CWA compatible metrics:', error);
      return {};
    }
  }

  /**
   * Calculate difficulty handling score from quiz performance data
   * @param {Object} quizPerformance - Quiz performance data
   * @returns {number} Difficulty handling score (0-100)
   */
  calculateDifficultyHandling(quizPerformance) {
    try {
      const difficultyHandling = quizPerformance?.difficulty_handling || {};
      
      if (Object.keys(difficultyHandling).length === 0) {
        return 65; // Default score
      }

      // Weight different difficulties
      const easyScore = (difficultyHandling.Easy?.average_score || 80) * 0.2;
      const mediumScore = (difficultyHandling.Medium?.average_score || 70) * 0.5;
      const hardScore = (difficultyHandling.Hard?.average_score || 60) * 0.3;

      const totalScore = easyScore + mediumScore + hardScore;
      return Math.round(Math.min(100, totalScore));

    } catch (error) {
      console.error('Error calculating difficulty handling:', error);
      return 65;
    }
  }

  /**
   * Get real-time behavioral data updates by combining local tracking with backend data
   * @returns {Promise<Object>} Real-time behavioral metrics
   */
  async getRealTimeBehavioralData() {
    try {
      // Get stored behavior tracking data from localStorage
      const localBehaviorData = JSON.parse(localStorage.getItem('cwa_behavior_data') || '{}');
      
      // Get backend behavioral analytics
      const backendData = await this.getBehavioralAnalytics();
      
      // Merge local tracking data with backend analytics
      const realTimeData = this.mergeBehavioralData(localBehaviorData, backendData);
      
      return realTimeData;

    } catch (error) {
      console.error('Error getting real-time behavioral data:', error);
      // Return fallback data based on localStorage only
      return this.getFallbackBehaviorData();
    }
  }

  /**
   * Merge local behavior tracking data with backend analytics
   * @param {Object} localData - Local behavior tracking data
   * @param {Object} backendData - Backend analytics data
   * @returns {Object} Merged behavioral data
   */
  mergeBehavioralData(localData, backendData) {
    try {
      const merged = {
        // Use backend data as primary source
        ...backendData.analytics?.summary,
        
        // Enhance with local tracking data
        recentSessions: localData.studySessions || [],
        recentActions: localData.actions || [],
        
        // Calculate real-time adjustments
        realTimeAdjustments: this.calculateRealTimeAdjustments(localData, backendData),
        
        // Data freshness indicators
        dataFreshness: {
          backend_last_updated: backendData.generated_at,
          local_last_updated: new Date().toISOString(),
          has_recent_local_data: this.hasRecentLocalData(localData)
        }
      };

      return merged;

    } catch (error) {
      console.error('Error merging behavioral data:', error);
      return this.getFallbackBehaviorData();
    }
  }

  /**
   * Calculate real-time adjustments based on recent local activity
   * @param {Object} localData - Local behavior data
   * @param {Object} backendData - Backend analytics data
   * @returns {Object} Real-time adjustment factors
   */
  calculateRealTimeAdjustments(localData, backendData) {
    try {
      const adjustments = {
        study_hours_boost: 0,
        focus_level_boost: 0,
        completion_rate_boost: 0
      };

      // Recent study sessions from local tracking
      const recentSessions = (localData.studySessions || []).filter(session => {
        const sessionDate = new Date(session.timestamp || session.date);
        const daysSince = (Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7; // Last 7 days
      });

      if (recentSessions.length > 0) {
        // Boost study hours based on recent activity
        const recentHours = recentSessions.reduce((sum, session) => {
          return sum + ((session.activeTime || session.duration || 0) / 60);
        }, 0);
        
        adjustments.study_hours_boost = Math.min(5, recentHours * 0.5); // Max 5 hour boost

        // Boost focus level based on efficiency
        const avgEfficiency = recentSessions.reduce((sum, session) => {
          return sum + (session.efficiency || 100);
        }, 0) / recentSessions.length;
        
        if (avgEfficiency > 80) {
          adjustments.focus_level_boost = 5;
        } else if (avgEfficiency > 60) {
          adjustments.focus_level_boost = 2;
        }
      }

      return adjustments;

    } catch (error) {
      console.error('Error calculating real-time adjustments:', error);
      return {};
    }
  }

  /**
   * Check if there's recent local data to enhance backend analytics
   * @param {Object} localData - Local behavior data
   * @returns {boolean} Whether there's recent local data
   */
  hasRecentLocalData(localData) {
    try {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      const recentSessions = (localData.studySessions || []).filter(session => {
        const sessionTime = new Date(session.timestamp || session.date).getTime();
        return sessionTime > cutoff;
      });

      const recentActions = (localData.actions || []).filter(action => {
        const actionTime = new Date(action.timestamp).getTime();
        return actionTime > cutoff;
      });

      return recentSessions.length > 0 || recentActions.length > 0;

    } catch (error) {
      console.error('Error checking recent local data:', error);
      return false;
    }
  }

  /**
   * Get fallback behavior data when backend is unavailable
   * @returns {Object} Fallback behavioral metrics
   */
  getFallbackBehaviorData() {
    try {
      const localData = JSON.parse(localStorage.getItem('cwa_behavior_data') || '{}');
      
      // Calculate basic metrics from local data
      const studySessions = localData.studySessions || [];
      const totalHours = studySessions.reduce((sum, session) => {
        return sum + ((session.activeTime || session.duration || 0) / 60);
      }, 0);

      const weeklyHours = totalHours / 4; // Approximate weekly hours

      // Calculate basic completion rate
      const totalActions = (localData.actions || []).length;
      const completionRate = Math.min(100, totalActions * 5); // 5% per action

      return {
        studyHours: weeklyHours,
        scheduleFollowing: 50, // Default
        taskCompletion: completionRate,
        procrastination: Math.max(20, 80 - completionRate), // Inverse of completion
        focusLevel: 60, // Default
        helpSeeking: 40, // Default
        
        // Fallback quiz metrics
        averageScore: 0,
        totalQuizzes: 0,
        recentPerformance: 0,
        difficultyHandling: 65,
        preparationLevel: 50,
        consistencyScore: 50,
        timeEfficiency: 50,

        // Data quality indicator
        dataQuality: 'local_only',
        dataSource: 'localStorage_fallback'
      };

    } catch (error) {
      console.error('Error generating fallback data:', error);
      return {};
    }
  }

  /**
   * Save behavioral metrics to localStorage for offline access
   * @param {Object} metrics - Behavioral metrics to cache
   */
  cacheBehavioralMetrics(metrics) {
    try {
      const cacheData = {
        metrics,
        cached_at: new Date().toISOString(),
        cache_expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry
      };

      localStorage.setItem('cached_behavioral_metrics', JSON.stringify(cacheData));

    } catch (error) {
      console.error('Error caching behavioral metrics:', error);
    }
  }

  /**
   * Get cached behavioral metrics if still valid
   * @returns {Object|null} Cached metrics or null if expired/unavailable
   */
  getCachedBehavioralMetrics() {
    try {
      const cached = localStorage.getItem('cached_behavioral_metrics');
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = new Date();
      const expiry = new Date(cacheData.cache_expiry);

      if (now > expiry) {
        // Cache expired
        localStorage.removeItem('cached_behavioral_metrics');
        return null;
      }

      return cacheData.metrics;

    } catch (error) {
      console.error('Error getting cached metrics:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const behavioralAnalyticsService = new BehavioralAnalyticsService();
export default behavioralAnalyticsService;
