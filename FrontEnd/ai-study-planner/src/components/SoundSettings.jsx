import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import gamingSounds from '../utils/gamingSounds';

const SoundSettings = ({ className = "" }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(30);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load sound preferences from localStorage
    const savedSoundEnabled = localStorage.getItem('gamingSoundsEnabled');
    const savedVolume = localStorage.getItem('gamingSoundsVolume');
    
    if (savedSoundEnabled !== null) {
      const enabled = JSON.parse(savedSoundEnabled);
      setSoundEnabled(enabled);
      gamingSounds.setSoundsEnabled(enabled);
    }
    
    if (savedVolume !== null) {
      const vol = parseInt(savedVolume);
      setVolume(vol);
      gamingSounds.setVolume(vol / 100);
    }
  }, []);

  const toggleSound = () => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    gamingSounds.setSoundsEnabled(newEnabled);
    localStorage.setItem('gamingSoundsEnabled', JSON.stringify(newEnabled));
    
    // Play test sound when enabling
    if (newEnabled) {
      setTimeout(() => gamingSounds.playButtonClick(), 100);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    gamingSounds.setVolume(newVolume / 100);
    localStorage.setItem('gamingSoundsVolume', newVolume.toString());
    
    // Play test sound
    if (soundEnabled) {
      gamingSounds.playXPGain();
    }
  };

  const testSounds = () => {
    if (!soundEnabled) return;
    
    // Play a sequence of test sounds
    gamingSounds.playXPGain();
    setTimeout(() => gamingSounds.playStreak(), 200);
    setTimeout(() => gamingSounds.playCorrectAnswer(), 400);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Sound Toggle Button */}
      <button
        onClick={toggleSound}
        className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 gaming-button"
        title={soundEnabled ? "Disable Gaming Sounds" : "Enable Gaming Sounds"}
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </button>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="ml-2 flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 gaming-button"
        title="Sound Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl p-4 z-50 min-w-[250px] border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center">
            🎵 Gaming Sound Settings
          </h3>
          
          {/* Sound Enable/Disable */}
          <div className="mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={toggleSound}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">
                Enable Gaming Sounds
              </span>
            </label>
          </div>

          {/* Volume Control */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Volume: {volume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!soundEnabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              style={{
                background: soundEnabled 
                  ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #e5e7eb ${volume}%, #e5e7eb 100%)`
                  : '#e5e7eb'
              }}
            />
          </div>

          {/* Test Button */}
          <button
            onClick={testSounds}
            disabled={!soundEnabled}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 gaming-button font-medium"
          >
            🔊 Test Sounds
          </button>

          {/* Sound Info */}
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p className="mb-1">🎮 <strong>Gaming sounds include:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>XP gain & level up celebrations</li>
              <li>Achievement unlocks & streaks</li>
              <li>Correct/incorrect answer feedback</li>
              <li>Button clicks & interactions</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundSettings;
