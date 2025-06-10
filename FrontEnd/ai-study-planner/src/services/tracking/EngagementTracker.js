// Engagement Tracking Service
class EngagementTracker {
  constructor() {
    this.interactions = [];
    this.startTime = Date.now();
    this.lastInteraction = Date.now();
    this.interactionCount = 0;
  }

  recordInteraction(type) {
    const now = Date.now();
    this.interactions.push({
      type,
      timestamp: now,
      timeSinceLastInteraction: now - this.lastInteraction
    });
    
    this.lastInteraction = now;
    this.interactionCount++;

    // Keep only last hour of interactions
    const oneHourAgo = now - (60 * 60 * 1000);
    this.interactions = this.interactions.filter(i => i.timestamp > oneHourAgo);
  }

  getEngagementScore() {
    const now = Date.now();
    const sessionDuration = (now - this.startTime) / 1000; // in seconds
    const recentInteractions = this.getRecentInteractions();
    
    return {
      overallScore: this.calculateOverallScore(sessionDuration),
      recentScore: this.calculateRecentScore(recentInteractions),
      interactionFrequency: this.calculateInteractionFrequency(),
      focusScore: this.calculateFocusScore()
    };
  }

  getRecentInteractions(minutes = 15) {
    const now = Date.now();
    const cutoff = now - (minutes * 60 * 1000);
    return this.interactions.filter(i => i.timestamp > cutoff);
  }

  calculateOverallScore(sessionDuration) {
    if (sessionDuration === 0) return 0;
    const baseScore = (this.interactionCount / sessionDuration) * 100;
    return Math.min(100, baseScore);
  }

  calculateRecentScore(recentInteractions) {
    if (recentInteractions.length === 0) return 0;
    
    const averageGap = recentInteractions.reduce(
      (sum, interaction) => sum + interaction.timeSinceLastInteraction, 
      0
    ) / recentInteractions.length;

    // Lower gaps mean higher engagement
    return Math.min(100, (1 - (averageGap / (5 * 60 * 1000))) * 100);
  }

  calculateInteractionFrequency() {
    // const now = Date.now();
    const intervals = [];
    
    for (let i = 1; i < this.interactions.length; i++) {
      intervals.push(this.interactions[i].timestamp - this.interactions[i-1].timestamp);
    }

    if (intervals.length === 0) return 0;
    
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    // Convert to minutes for easier interpretation
    return averageInterval / (60 * 1000);
  }

  calculateFocusScore() {
    const recentInteractions = this.getRecentInteractions(5); // Last 5 minutes
    if (recentInteractions.length === 0) return 0;

    // Calculate standard deviation of interaction gaps
    const gaps = recentInteractions.map(i => i.timeSinceLastInteraction);
    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation means more consistent interaction pattern (better focus)
    const maxStdDev = 5000; // 5 seconds
    return Math.max(0, Math.min(100, (1 - (stdDev / maxStdDev)) * 100));
  }

  getEngagementSummary() {
    const score = this.getEngagementScore();
    const recentInteractions = this.getRecentInteractions();
    
    return {
      currentEngagement: score,
      sessionDuration: Date.now() - this.startTime,
      totalInteractions: this.interactionCount,
      recentInteractionCount: recentInteractions.length,
      lastInteractionTime: this.lastInteraction,
      averageInteractionFrequency: this.calculateInteractionFrequency()
    };
  }

  reset() {
    this.interactions = [];
    this.startTime = Date.now();
    this.lastInteraction = Date.now();
    this.interactionCount = 0;
  }
}

export default EngagementTracker; 