// Assignment Tracking Service
class AssignmentTracker {
  constructor() {
    this.assignments = new Map();
    this.submissions = [];
  }

  startAssignment(assignmentId) {
    this.assignments.set(assignmentId, {
      startTime: Date.now(),
      revisions: [],
      timeSpent: 0,
      lastActive: Date.now()
    });
  }

  recordRevision(assignmentId, content) {
    const assignment = this.assignments.get(assignmentId);
    if (assignment) {
      assignment.revisions.push({
        timestamp: Date.now(),
        content
      });
      this.updateTimeSpent(assignmentId);
    }
  }

  updateTimeSpent(assignmentId) {
    const assignment = this.assignments.get(assignmentId);
    if (assignment) {
      const now = Date.now();
      const timeSinceLastActive = now - assignment.lastActive;
      if (timeSinceLastActive < 5 * 60 * 1000) { // Only count if less than 5 minutes inactive
        assignment.timeSpent += timeSinceLastActive;
      }
      assignment.lastActive = now;
    }
  }

  submitAssignment(assignmentId, dueDate) {
    const assignment = this.assignments.get(assignmentId);
    if (assignment) {
      const submissionTime = Date.now();
      const submission = {
        assignmentId,
        submissionTime,
        timeSpent: assignment.timeSpent,
        revisionCount: assignment.revisions.length,
        timeBeforeDeadline: dueDate ? dueDate - submissionTime : null
      };
      this.submissions.push(submission);
      return submission;
    }
  }

  getAssignmentStats(assignmentId) {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return null;

    return {
      timeSpent: assignment.timeSpent,
      revisionCount: assignment.revisions.length,
      averageRevisionInterval: this.calculateRevisionInterval(assignment.revisions),
      workPattern: this.analyzeWorkPattern(assignment)
    };
  }

  calculateRevisionInterval(revisions) {
    if (revisions.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < revisions.length; i++) {
      intervals.push(revisions[i].timestamp - revisions[i-1].timestamp);
    }
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  analyzeWorkPattern(assignment) {
    const revisionTimes = assignment.revisions.map(rev => new Date(rev.timestamp).getHours());
    const pattern = {
      morning: 0,   // 5-12
      afternoon: 0, // 12-17
      evening: 0,   // 17-22
      night: 0      // 22-5
    };

    revisionTimes.forEach(hour => {
      if (hour >= 5 && hour < 12) pattern.morning++;
      else if (hour >= 12 && hour < 17) pattern.afternoon++;
      else if (hour >= 17 && hour < 22) pattern.evening++;
      else pattern.night++;
    });

    return pattern;
  }

  getProcrastinationScore() {
    if (this.submissions.length === 0) return 0;

    let score = 0;
    this.submissions.forEach(submission => {
      if (submission.timeBeforeDeadline) {
        const hoursBeforeDeadline = submission.timeBeforeDeadline / (1000 * 60 * 60);
        if (hoursBeforeDeadline < 24) score += 2;
        else if (hoursBeforeDeadline < 48) score += 1;
      }
    });

    return Math.min(10, score / this.submissions.length);
  }

  getOverallStats() {
    return {
      totalAssignments: this.assignments.size,
      totalSubmissions: this.submissions.length,
      averageTimeSpent: this.calculateAverageTimeSpent(),
      procrastinationScore: this.getProcrastinationScore(),
      workPatternSummary: this.getWorkPatternSummary()
    };
  }

  calculateAverageTimeSpent() {
    let total = 0;
    this.assignments.forEach(assignment => {
      total += assignment.timeSpent;
    });
    return this.assignments.size > 0 ? total / this.assignments.size : 0;
  }

  getWorkPatternSummary() {
    const patterns = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    };

    this.assignments.forEach(assignment => {
      const pattern = this.analyzeWorkPattern(assignment);
      patterns.morning += pattern.morning;
      patterns.afternoon += pattern.afternoon;
      patterns.evening += pattern.evening;
      patterns.night += pattern.night;
    });

    return patterns;
  }
}

export default AssignmentTracker; 