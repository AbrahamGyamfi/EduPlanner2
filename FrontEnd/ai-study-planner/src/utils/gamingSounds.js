/**
 * Gaming Sound System for Enhanced User Experience
 * Provides audio feedback for various gaming interactions
 */

class GamingSoundSystem {
  constructor() {
    this.sounds = {};
    this.volume = 0.3; // Default volume (30%)
    this.enabled = true;
    this.initializeSounds();
  }

  // Initialize all gaming sounds using Web Audio API and synthetic sounds
  initializeSounds() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create sound patterns for different events
    this.soundPatterns = {
      xpGain: { frequency: 800, duration: 0.2, type: 'sine' },
      levelUp: { frequency: [523, 659, 784, 1047], duration: 0.8, type: 'square' },
      achievement: { frequency: [440, 554, 659, 880], duration: 1.0, type: 'triangle' },
      streak: { frequency: 1000, duration: 0.15, type: 'sawtooth' },
      correctAnswer: { frequency: [659, 880], duration: 0.6, type: 'sine' },
      wrongAnswer: { frequency: 200, duration: 0.4, type: 'square' },
      buttonClick: { frequency: 400, duration: 0.1, type: 'square' },
      messageReceived: { frequency: 600, duration: 0.2, type: 'triangle' },
      comboMultiplier: { frequency: [800, 1000, 1200], duration: 0.5, type: 'sine' },
      perfectStreak: { frequency: [1047, 1319, 1568], duration: 0.7, type: 'triangle' },
      hintUsed: { frequency: 300, duration: 0.3, type: 'sawtooth' },
      sessionComplete: { frequency: [523, 659, 784, 880, 1047], duration: 1.2, type: 'sine' }
    };
  }

  // Generate synthetic sound using Web Audio API
  generateSound(pattern) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      if (Array.isArray(pattern.frequency)) {
        // Play sequence of notes
        pattern.frequency.forEach((freq, index) => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          
          osc.frequency.value = freq;
          osc.type = pattern.type;
          
          gain.gain.setValueAtTime(0, this.audioContext.currentTime);
          gain.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + pattern.duration / pattern.frequency.length);
          
          const startTime = this.audioContext.currentTime + (index * pattern.duration / pattern.frequency.length);
          osc.start(startTime);
          osc.stop(startTime + pattern.duration / pattern.frequency.length);
        });
      } else {
        // Play single note
        oscillator.frequency.value = pattern.frequency;
        oscillator.type = pattern.type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + pattern.duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + pattern.duration);
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  // Public methods for different sound effects
  playXPGain() {
    this.generateSound(this.soundPatterns.xpGain);
  }

  playLevelUp() {
    this.generateSound(this.soundPatterns.levelUp);
  }

  playAchievement() {
    this.generateSound(this.soundPatterns.achievement);
  }

  playStreak() {
    this.generateSound(this.soundPatterns.streak);
  }

  playCorrectAnswer() {
    this.generateSound(this.soundPatterns.correctAnswer);
  }

  playWrongAnswer() {
    this.generateSound(this.soundPatterns.wrongAnswer);
  }

  playButtonClick() {
    this.generateSound(this.soundPatterns.buttonClick);
  }

  playMessageReceived() {
    this.generateSound(this.soundPatterns.messageReceived);
  }

  playComboMultiplier() {
    this.generateSound(this.soundPatterns.comboMultiplier);
  }

  playPerfectStreak() {
    this.generateSound(this.soundPatterns.perfectStreak);
  }

  playHintUsed() {
    this.generateSound(this.soundPatterns.hintUsed);
  }

  playSessionComplete() {
    this.generateSound(this.soundPatterns.sessionComplete);
  }

  // Special combo sound for multiple effects
  playLevelUpCombo() {
    this.playLevelUp();
    setTimeout(() => this.playAchievement(), 300);
  }

  playStreakCombo(streakLevel) {
    if (streakLevel >= 10) {
      this.playPerfectStreak();
    } else if (streakLevel >= 5) {
      this.playComboMultiplier();
    } else {
      this.playStreak();
    }
  }

  // Volume and settings control
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggleSounds() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setSoundsEnabled(enabled) {
    this.enabled = enabled;
  }

  // Resume audio context (required for user interaction)
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Initialize audio context on user interaction
  initializeOnUserInteraction() {
    const enableAudio = () => {
      this.resumeAudioContext();
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
  }
}

// Create and export singleton instance
const gamingSounds = new GamingSoundSystem();

// Initialize audio on user interaction
gamingSounds.initializeOnUserInteraction();

export default gamingSounds;

// Export individual sound functions for convenience
export const {
  playXPGain,
  playLevelUp,
  playAchievement,
  playStreak,
  playCorrectAnswer,
  playWrongAnswer,
  playButtonClick,
  playMessageReceived,
  playComboMultiplier,
  playPerfectStreak,
  playHintUsed,
  playSessionComplete,
  playLevelUpCombo,
  playStreakCombo,
  setVolume,
  toggleSounds,
  setSoundsEnabled
} = gamingSounds;
