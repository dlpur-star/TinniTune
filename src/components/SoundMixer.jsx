/**
 * SoundMixer.jsx
 * Visual mixer interface for layering therapy and ambient sounds
 * Features: individual volume controls, presets, save/load custom mixes
 */

import React, { useState, useEffect, useCallback } from 'react';
import './SoundMixer.css';

// Preset definitions
const PRESETS = {
  therapy: {
    name: 'Pure Therapy',
    description: 'Therapy sound only',
    icon: '🎵',
    ambientSounds: []
  },
  focus: {
    name: 'Focus Mode',
    description: 'Therapy + gentle rain',
    icon: '🎯',
    ambientSounds: [
      { type: 'rain', volume: -15 }
    ]
  },
  sleep: {
    name: 'Sleep Mode',
    description: 'Therapy + ocean waves + wind',
    icon: '😴',
    ambientSounds: [
      { type: 'ocean', volume: -12 },
      { type: 'wind', volume: -20 }
    ]
  },
  relax: {
    name: 'Relax Mode',
    description: 'Therapy + stream + wind',
    icon: '🧘',
    ambientSounds: [
      { type: 'stream', volume: -15 },
      { type: 'wind', volume: -18 }
    ]
  },
  nature: {
    name: 'Nature Immersion',
    description: 'Therapy + rain + stream',
    icon: '🌿',
    ambientSounds: [
      { type: 'rain', volume: -18 },
      { type: 'stream', volume: -18 }
    ]
  }
};

const SoundMixer = ({
  ambientGenerator,
  therapyActive,
  therapyVolume,
  onTherapyVolumeChange,
  onClose
}) => {
  const [availableSounds, setAvailableSounds] = useState([]);
  const [activeSounds, setActiveSounds] = useState({});
  const [masterVolume, setMasterVolume] = useState(-10);
  const [selectedPreset, setSelectedPreset] = useState('therapy');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customMixName, setCustomMixName] = useState('');
  const [savedMixes, setSavedMixes] = useState([]);

  // Load available sounds and saved mixes
  useEffect(() => {
    if (ambientGenerator) {
      const sounds = ambientGenerator.getAvailableSounds();
      setAvailableSounds(sounds);

      // Load active sound volumes
      const active = {};
      sounds.forEach(sound => {
        if (sound.isActive) {
          active[sound.type] = -15; // Default volume
        }
      });
      setActiveSounds(active);
    }

    // Load saved mixes from localStorage
    try {
      const saved = localStorage.getItem('tinnitune_saved_mixes');
      if (saved) {
        setSavedMixes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved mixes:', error);
    }
  }, [ambientGenerator]);

  // Toggle ambient sound on/off
  const toggleSound = useCallback((soundType) => {
    if (!ambientGenerator) return;

    if (activeSounds[soundType] !== undefined) {
      // Stop sound
      ambientGenerator.stopSound(soundType);
      const newActive = { ...activeSounds };
      delete newActive[soundType];
      setActiveSounds(newActive);
    } else {
      // Start sound
      ambientGenerator.startSound(soundType);
      setActiveSounds({
        ...activeSounds,
        [soundType]: -15 // Default volume
      });
    }

    // Update available sounds list
    const sounds = ambientGenerator.getAvailableSounds();
    setAvailableSounds(sounds);
  }, [ambientGenerator, activeSounds]);

  // Update volume for ambient sound
  const updateSoundVolume = useCallback((soundType, volumeDb) => {
    if (!ambientGenerator) return;

    ambientGenerator.updateSoundVolume(soundType, volumeDb);
    setActiveSounds({
      ...activeSounds,
      [soundType]: volumeDb
    });
  }, [ambientGenerator, activeSounds]);

  // Update master volume
  const updateMasterVolume = useCallback((volumeDb) => {
    if (!ambientGenerator) return;

    ambientGenerator.updateMasterVolume(volumeDb);
    setMasterVolume(volumeDb);
  }, [ambientGenerator]);

  // Load preset
  const loadPreset = useCallback((presetKey) => {
    if (!ambientGenerator) return;

    const preset = PRESETS[presetKey];
    if (!preset) return;

    // Stop all current ambient sounds
    Object.keys(activeSounds).forEach(soundType => {
      ambientGenerator.stopSound(soundType);
    });

    // Start preset sounds
    const newActive = {};
    preset.ambientSounds.forEach(({ type, volume }) => {
      ambientGenerator.startSound(type);
      ambientGenerator.updateSoundVolume(type, volume);
      newActive[type] = volume;
    });

    setActiveSounds(newActive);
    setSelectedPreset(presetKey);

    // Update available sounds list
    const sounds = ambientGenerator.getAvailableSounds();
    setAvailableSounds(sounds);
  }, [ambientGenerator, activeSounds]);

  // Save current mix
  const saveCurrentMix = useCallback(() => {
    if (!customMixName.trim()) {
      alert('Please enter a name for your mix');
      return;
    }

    const mix = {
      name: customMixName.trim(),
      timestamp: Date.now(),
      therapyActive,
      therapyVolume,
      ambientSounds: Object.keys(activeSounds).map(type => ({
        type,
        volume: activeSounds[type]
      })),
      masterVolume
    };

    const newSavedMixes = [...savedMixes, mix];
    setSavedMixes(newSavedMixes);

    // Save to localStorage
    try {
      localStorage.setItem('tinnitune_saved_mixes', JSON.stringify(newSavedMixes));
    } catch (error) {
      console.error('Error saving mix:', error);
      alert('Failed to save mix');
      return;
    }

    setShowSaveDialog(false);
    setCustomMixName('');
    alert(`Mix "${mix.name}" saved!`);
  }, [customMixName, therapyActive, therapyVolume, activeSounds, masterVolume, savedMixes]);

  // Load saved mix
  const loadSavedMix = useCallback((mix) => {
    if (!ambientGenerator) return;

    // Stop all current sounds
    Object.keys(activeSounds).forEach(soundType => {
      ambientGenerator.stopSound(soundType);
    });

    // Load mix ambient sounds
    const newActive = {};
    mix.ambientSounds.forEach(({ type, volume }) => {
      ambientGenerator.startSound(type);
      ambientGenerator.updateSoundVolume(type, volume);
      newActive[type] = volume;
    });

    setActiveSounds(newActive);
    setMasterVolume(mix.masterVolume);
    ambientGenerator.updateMasterVolume(mix.masterVolume);

    // Update therapy volume if callback provided
    if (onTherapyVolumeChange && mix.therapyVolume !== undefined) {
      onTherapyVolumeChange(mix.therapyVolume);
    }

    // Update available sounds list
    const sounds = ambientGenerator.getAvailableSounds();
    setAvailableSounds(sounds);

    setSelectedPreset('custom');
  }, [ambientGenerator, activeSounds, onTherapyVolumeChange]);

  // Delete saved mix
  const deleteSavedMix = useCallback((index) => {
    if (!confirm('Delete this saved mix?')) return;

    const newSavedMixes = savedMixes.filter((_, i) => i !== index);
    setSavedMixes(newSavedMixes);

    try {
      localStorage.setItem('tinnitune_saved_mixes', JSON.stringify(newSavedMixes));
    } catch (error) {
      console.error('Error deleting mix:', error);
    }
  }, [savedMixes]);

  // Calculate total signal level (rough approximation)
  const calculateTotalLevel = useCallback(() => {
    let total = 0;

    // Add therapy contribution if active
    if (therapyActive && therapyVolume !== undefined) {
      total += Math.pow(10, therapyVolume / 20); // Convert dB to linear
    }

    // Add ambient sounds contribution
    Object.values(activeSounds).forEach(volumeDb => {
      total += Math.pow(10, volumeDb / 20);
    });

    // Convert back to dB
    return total > 0 ? 20 * Math.log10(total) : -Infinity;
  }, [therapyActive, therapyVolume, activeSounds]);

  const totalLevel = calculateTotalLevel();
  const isClippingRisk = totalLevel > -3; // Warn if total level > -3dB

  return (
    <div className="sound-mixer-overlay" onClick={onClose}>
      <div className="sound-mixer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sound-mixer-header">
          <h2>🎛️ Sound Mixer</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Preset Selector */}
        <div className="preset-section">
          <label>Quick Presets:</label>
          <div className="preset-buttons">
            {Object.keys(PRESETS).map(key => (
              <button
                key={key}
                className={`preset-button ${selectedPreset === key ? 'active' : ''}`}
                onClick={() => loadPreset(key)}
                title={PRESETS[key].description}
              >
                <span className="preset-icon">{PRESETS[key].icon}</span>
                <span className="preset-name">{PRESETS[key].name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Master Controls */}
        <div className="master-controls">
          <div className="master-volume">
            <label>
              Master Volume: {masterVolume}dB
              {isClippingRisk && <span className="warning-badge">⚠️ High Level</span>}
            </label>
            <input
              type="range"
              min="-40"
              max="0"
              step="1"
              value={masterVolume}
              onChange={(e) => updateMasterVolume(Number(e.target.value))}
              className="volume-slider master"
            />
          </div>
        </div>

        {/* Active Layers */}
        <div className="mixer-layers">
          <h3>Active Layers</h3>

          {/* Therapy Layer */}
          {therapyActive && (
            <div className="mixer-layer therapy-layer">
              <div className="layer-header">
                <span className="layer-icon">🎵</span>
                <span className="layer-name">Therapy Sound</span>
                <span className="layer-volume">{therapyVolume}dB</span>
              </div>
              <input
                type="range"
                min="-40"
                max="-10"
                step="1"
                value={therapyVolume || -20}
                onChange={(e) => onTherapyVolumeChange && onTherapyVolumeChange(Number(e.target.value))}
                className="volume-slider"
              />
            </div>
          )}

          {/* Ambient Layers */}
          {Object.keys(activeSounds).map(soundType => {
            const sound = availableSounds.find(s => s.type === soundType);
            if (!sound) return null;

            return (
              <div key={soundType} className="mixer-layer ambient-layer">
                <div className="layer-header">
                  <span className="layer-icon">{sound.icon}</span>
                  <span className="layer-name">{sound.name}</span>
                  <span className="layer-volume">{activeSounds[soundType]}dB</span>
                  <button
                    className="layer-mute"
                    onClick={() => toggleSound(soundType)}
                    title="Remove layer"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="-5"
                  step="1"
                  value={activeSounds[soundType]}
                  onChange={(e) => updateSoundVolume(soundType, Number(e.target.value))}
                  className="volume-slider"
                />
              </div>
            );
          })}

          {!therapyActive && Object.keys(activeSounds).length === 0 && (
            <div className="no-layers">
              <p>No active layers. Add sounds below or select a preset.</p>
            </div>
          )}
        </div>

        {/* Available Sounds */}
        <div className="available-sounds">
          <h3>Add Ambient Sounds</h3>
          <div className="sound-buttons">
            {availableSounds.map(sound => (
              <button
                key={sound.type}
                className={`sound-button ${sound.isActive ? 'active' : ''}`}
                onClick={() => toggleSound(sound.type)}
                disabled={sound.isActive}
              >
                <span className="sound-icon">{sound.icon}</span>
                <span className="sound-name">{sound.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save/Load Mixes */}
        <div className="mix-management">
          <button
            className="save-mix-button"
            onClick={() => setShowSaveDialog(true)}
          >
            💾 Save Current Mix
          </button>

          {savedMixes.length > 0 && (
            <div className="saved-mixes">
              <h3>Saved Mixes</h3>
              <div className="saved-mix-list">
                {savedMixes.map((mix, index) => (
                  <div key={index} className="saved-mix-item">
                    <button
                      className="load-mix-button"
                      onClick={() => loadSavedMix(mix)}
                    >
                      <span className="mix-name">{mix.name}</span>
                      <span className="mix-info">
                        {mix.ambientSounds.length} ambient sound{mix.ambientSounds.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                    <button
                      className="delete-mix-button"
                      onClick={() => deleteSavedMix(index)}
                      title="Delete mix"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
            <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Save Custom Mix</h3>
              <input
                type="text"
                placeholder="Enter mix name..."
                value={customMixName}
                onChange={(e) => setCustomMixName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveCurrentMix()}
                autoFocus
              />
              <div className="save-dialog-buttons">
                <button onClick={saveCurrentMix}>Save</button>
                <button onClick={() => {
                  setShowSaveDialog(false);
                  setCustomMixName('');
                }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundMixer;
