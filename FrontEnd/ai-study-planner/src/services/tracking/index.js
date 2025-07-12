// Main Tracking Service - System Only Mode
import StudySessionTracker from './StudySessionTracker';
import AssignmentTracker from './AssignmentTracker';
import EngagementTracker from './EngagementTracker';
import DataSyncService from './DataSyncService';
import SystemDataValidator from '../security/SystemDataValidator';

class TrackingService {
  constructor() {
    this.studySessionTracker = new StudySessionTracker();
    this.assignmentTracker = new AssignmentTracker();
    this.engagementTracker = new EngagementTracker();
    this.dataSyncService = new DataSyncService();
    this.validator = new SystemDataValidator();
    
    this.isTracking = false;
    this.systemOnlyMode = true; // Block all user interactions
    this.setupSystemEventListeners();
  }

  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.dataSyncService.startAutoSync();
    
    // Track page visibility for study sessions
    if (document.visibilityState === 'visible') {
      this.studySessionTracker.startSession();
    }
  }

  stopTracking() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    this.dataSyncService.stopAutoSync();
    
    if (this.studySessionTracker.currentSession) {
      const session = this.studySessionTracker.endSession();
      this.dataSyncService.queueData({
        type: 'study_session',
        data: session
      });
    }
  }

  setupSystemEventListeners() {
    // Only track system events, block user interactions
    
    // Track page visibility changes (system event)
    document.addEventListener('visibilitychange', () => {
      if (!this.isTracking) return;

      const systemData = this.validator.generateSystemData('page_visibility', {
        visibilityState: document.visibilityState,
        automated: true
      });

      if (document.visibilityState === 'visible') {
        this.studySessionTracker.startSession();
      } else {
        const session = this.studySessionTracker.endSession();
        if (session) {
          const sessionData = this.validator.generateSystemData('study_session', {
            sessionData: session,
            automated: true
          });
          this.dataSyncService.queueData(sessionData);
        }
      }
    });

    // Block all user interaction events
    const userEventTypes = ['click', 'keypress', 'scroll', 'focusin', 'input', 'change'];
    
    userEventTypes.forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        if (this.systemOnlyMode) {
          // Log blocked user interaction
          console.warn(`Blocked user ${eventType} event - System operates in automated mode only`);
          
          // Prevent the event if it's an input/form element
          if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
            e.preventDefault();
            e.stopPropagation();
            e.target.blur(); // Remove focus
          }
          
          return false;
        }
      }, true); // Use capture phase to block early
    });

    // System-generated interactions only
    this.setupSystemDataCollection();
  }

  setupSystemDataCollection() {
    // Automated data collection every 30 seconds
    setInterval(() => {
      if (!this.isTracking) return;
      
      const systemMetrics = this.validator.generateSystemData('automated_metrics', {
        browserMetrics: {
          memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : null,
          timing: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null
        },
        sessionMetrics: this.studySessionTracker.getSessionStats(),
        automated: true
      });
      
      this.dataSyncService.queueData(systemMetrics);
    }, 30000);
  }

  getAnalytics() {
    return {
      studySessionStats: this.studySessionTracker.getSessionStats(),
      assignmentStats: this.assignmentTracker.getOverallStats(),
      engagementStats: this.engagementTracker.getEngagementSummary(),
      syncStatus: this.dataSyncService.getSyncStatus()
    };
  }

  async submitAssignment(assignmentId, dueDate) {
    const submission = this.assignmentTracker.submitAssignment(assignmentId, dueDate);
    if (submission) {
      await this.dataSyncService.queueData({
        type: 'assignment_submission',
        data: submission
      });
      return submission;
    }
    return null;
  }

  recordStudyBreak() {
    this.studySessionTracker.recordBreak();
    this.engagementTracker.recordInteraction('break');
  }

  async forceSyncData() {
    return await this.dataSyncService.forceSyncNow();
  }

  reset() {
    this.stopTracking();
    this.engagementTracker.reset();
    this.isTracking = false;
  }
}

export default TrackingService; 