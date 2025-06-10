// Study Session Tracking Service
class StudySessionTracker {
  constructor() {
    this.sessions = [];
    this.currentSession = null;
  }

  startSession() {
    this.currentSession = {
      startTime: Date.now(),
      interactions: 0,
      breaks: []
    };
  }

  endSession() {
    if (this.currentSession) {
      const session = {
        ...this.currentSession,
        endTime: Date.now(),
        duration: Date.now() - this.currentSession.startTime
      };
      this.sessions.push(session);
      this.currentSession = null;
      return session;
    }
  }

  recordInteraction() {
    if (this.currentSession) {
      this.currentSession.interactions++;
    }
  }

  recordBreak() {
    if (this.currentSession) {
      this.currentSession.breaks.push(Date.now());
    }
  }

  getSessionStats() {
    return {
      totalSessions: this.sessions.length,
      averageDuration: this.calculateAverageDuration(),
      totalStudyTime: this.calculateTotalStudyTime(),
      consistencyScore: this.calculateConsistencyScore()
    };
  }

  calculateAverageDuration() {
    if (this.sessions.length === 0) return 0;
    const total = this.sessions.reduce((sum, session) => sum + session.duration, 0);
    return total / this.sessions.length;
  }

  calculateTotalStudyTime() {
    return this.sessions.reduce((sum, session) => sum + session.duration, 0);
  }

  calculateConsistencyScore() {
    if (this.sessions.length < 2) return 100;
    
    const gaps = [];
    for (let i = 1; i < this.sessions.length; i++) {
      gaps.push(this.sessions[i].startTime - this.sessions[i-1].endTime);
    }
    
    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const targetGap = 24 * 60 * 60 * 1000; // 24 hours
    return Math.min(100, (1 - Math.abs(averageGap - targetGap) / targetGap) * 100);
  }
}

export default StudySessionTracker; 