// Main Tracking Service
import StudySessionTracker from './StudySessionTracker';
import AssignmentTracker from './AssignmentTracker';
import EngagementTracker from './EngagementTracker';
import DataSyncService from './DataSyncService';

class TrackingService {
  constructor() {
    this.studySessionTracker = new StudySessionTracker();
    this.assignmentTracker = new AssignmentTracker();
    this.engagementTracker = new EngagementTracker();
    this.dataSyncService = new DataSyncService();
    
    this.isTracking = false;
    this.setupEventListeners();
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

  setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!this.isTracking) return;

      if (document.visibilityState === 'visible') {
        this.studySessionTracker.startSession();
      } else {
        const session = this.studySessionTracker.endSession();
        if (session) {
          this.dataSyncService.queueData({
            type: 'study_session',
            data: session
          });
        }
      }
    });

    // Track user interactions
    document.addEventListener('click', () => {
      if (!this.isTracking) return;
      this.engagementTracker.recordInteraction('click');
    });

    document.addEventListener('keypress', () => {
      if (!this.isTracking) return;
      this.engagementTracker.recordInteraction('keypress');
    });

    document.addEventListener('scroll', () => {
      if (!this.isTracking) return;
      this.engagementTracker.recordInteraction('scroll');
    });

    // Track assignment interactions
    document.addEventListener('focusin', (e) => {
      if (!this.isTracking) return;
      if (e.target.classList.contains('assignment-input')) {
        const assignmentId = e.target.dataset.assignmentId;
        this.assignmentTracker.startAssignment(assignmentId);
      }
    });

    // Track assignment revisions
    document.addEventListener('input', (e) => {
      if (!this.isTracking) return;
      if (e.target.classList.contains('assignment-input')) {
        const assignmentId = e.target.dataset.assignmentId;
        this.assignmentTracker.recordRevision(assignmentId, e.target.value);
      }
    });
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