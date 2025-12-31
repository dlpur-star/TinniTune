/**
 * TinniTune Clinical Therapy Module
 * Evidence-Based Therapeutic Sound Generation
 * 
 * Implements:
 * - Notched Sound Therapy (Okamoto et al. 2010)
 * - Binaural Beat Therapy (anxiety/sleep enhancement)
 * - Therapeutic Noise Generation (masking & habituation)
 * - Cardiac Coherence Integration
 * 
 * @author TinniTune Development Team
 */

import * as Tone from 'tone';

/**
 * Notch Filter Intensity Presets
 * Based on clinical research - Q factor determines notch width
 */
const NOTCH_INTENSITIES = {
  gentle: { Q: 1.0, bandwidth: '1 octave', description: 'Wide notch, subtle effect' },
  moderate: { Q: 2.5, bandwidth: '0.5 octave', description: 'Clinical standard' },
  strong: { Q: 5.0, bandwidth: '0.25 octave', description: 'Narrow notch, focused' },
  precise: { Q: 10.0, bandwidth: '0.125 octave', description: 'Very narrow, intense' }
};

/**
 * Binaural Beat Presets
 * Frequencies based on brainwave entrainment research
 */
const BINAURAL_MODES = {
  focus: { 
    baseFreq: 200, 
    beatFreq: 10, // Alpha waves (8-12 Hz)
    description: 'Daytime Focus',
    targetState: 'Alert relaxation'
  },
  calm: { 
    baseFreq: 200, 
    beatFreq: 6,  // Theta waves (4-8 Hz)
    description: 'Evening Calm',
    targetState: 'Deep relaxation'
  },
  sleep: { 
    baseFreq: 200, 
    beatFreq: 3,  // Delta waves (0.5-4 Hz)
    description: 'Deep Sleep',
    targetState: 'Sleep induction'
  }
};

/**
 * Clinical Therapy Sound Generator
 * Manages all therapeutic audio generation
 */
export class ClinicalTherapyModule {
  constructor(engine, config = {}) {
    this.engine = engine;
    this.config = {
      notchEnabled: config.notchEnabled !== false,
      notchIntensity: config.notchIntensity || 'moderate',
      binauralEnabled: config.binauralEnabled !== false,
      binauralMode: config.binauralMode || 'focus',
      enableAmbience: config.enableAmbience !== false,
      ...config
    };

    // Active audio nodes
    this.noiseGenerators = {
      left: { white: null, pink: null, filter: null, gain: null },
      right: { white: null, pink: null, filter: null, gain: null }
    };
    
    this.binauralGenerators = {
      left: null,
      right: null,
      leftGain: null,
      rightGain: null
    };

    this.notchFilters = {
      left: null,
      right: null
    };

    // State
    this.isActive = false;
    this.currentFrequency = null;
    this.volumes = { left: -25, right: -25 };
  }

  /**
   * Start therapy session
   * @param {Object} params - Therapy parameters
   */
  async start(params) {
    const {
      frequency,
      volumeLeft = -25,
      volumeRight = -25,
      ear = 'both',
      notchIntensity = 'moderate',
      binauralMode = 'focus'
    } = params;

    if (this.isActive) {
      this.stop();
    }

    this.currentFrequency = frequency;
    this.volumes = { left: volumeLeft, right: volumeRight };
    this.config.notchIntensity = notchIntensity;
    this.config.binauralMode = binauralMode;

    this.engine._log('Starting therapy:', {
      frequency,
      volumeLeft,
      volumeRight,
      ear,
      notchIntensity,
      binauralMode
    });

    // Create notch filters if enabled
    if (this.config.notchEnabled && frequency) {
      this._createNotchFilters(frequency, notchIntensity);
    }

    // Create noise generators for each ear
    if (ear === 'both' || ear === 'left') {
      this._createNoiseGenerator('left', volumeLeft);
    }
    if (ear === 'both' || ear === 'right') {
      this._createNoiseGenerator('right', volumeRight);
    }

    // Create binaural beats for brainwave entrainment (if enabled)
    if (this.config.binauralEnabled) {
      this._createBinauralBeats(binauralMode, volumeLeft, volumeRight);
      this.engine._log('Binaural beats enabled');
    } else {
      this.engine._log('Binaural beats disabled');
    }

    this.isActive = true;
    this.engine.startSession();
  }

  /**
   * Create notch filters for therapeutic frequency removal
   * @param {number} frequency - Tinnitus frequency to notch
   * @param {string} intensity - Notch intensity preset
   */
  _createNotchFilters(frequency, intensity = 'moderate') {
    const preset = NOTCH_INTENSITIES[intensity];
    const Q = preset.Q;

    this.engine._log(`Creating notch filters at ${frequency} Hz, Q=${Q} (${preset.bandwidth})`);

    // Left channel notch
    const leftDestination = this.engine.getChannelDestination('left');
    this.notchFilters.left = new Tone.Filter({
      type: 'notch',
      frequency: frequency,
      Q: Q,
      rolloff: -12
    });
    this.notchFilters.left.connect(leftDestination);

    // Right channel notch
    const rightDestination = this.engine.getChannelDestination('right');
    this.notchFilters.right = new Tone.Filter({
      type: 'notch',
      frequency: frequency,
      Q: Q,
      rolloff: -12
    });
    this.notchFilters.right.connect(rightDestination);
  }

  /**
   * Create therapeutic noise generator for one ear
   * @param {string} ear - 'left' or 'right'
   * @param {number} volumeDb - Volume in decibels
   */
  _createNoiseGenerator(ear, volumeDb) {
    const nodes = this.noiseGenerators[ear];
    
    // Determine routing destination (through notch filter or direct to channel)
    const destination = this.config.notchEnabled && this.notchFilters[ear]
      ? this.notchFilters[ear]
      : this.engine.getChannelDestination(ear);

    // White noise generator (primary therapeutic sound)
    nodes.white = new Tone.Noise('white').start();
    nodes.white.volume.value = volumeDb;  // Set noise generator's built-in volume
    nodes.gain = new Tone.Gain();  // Create gain node at default (1.0) for routing
    nodes.white.connect(nodes.gain);
    nodes.gain.connect(destination);

    // Pink noise with lowpass (ambient/ASMR layer)
    if (this.config.enableAmbience) {
      nodes.pink = new Tone.Noise('pink').start();
      nodes.pink.volume.value = volumeDb + 8;  // Set pink noise volume
      nodes.filter = new Tone.Filter(1000, 'lowpass');
      nodes.pinkGain = new Tone.Gain();  // Create gain node at default (1.0)

      nodes.pink.connect(nodes.filter);
      nodes.filter.connect(nodes.pinkGain);
      nodes.pinkGain.connect(destination);
    }

    this.engine._log(`Noise generator created for ${ear} ear at ${volumeDb} dB`);
  }

  /**
   * Create binaural beats for brainwave entrainment
   * @param {string} mode - 'focus', 'calm', or 'sleep'
   * @param {number} volumeLeft - Left ear volume
   * @param {number} volumeRight - Right ear volume
   */
  _createBinauralBeats(mode, volumeLeft, volumeRight) {
    const preset = BINAURAL_MODES[mode];
    const { baseFreq, beatFreq } = preset;

    this.engine._log(`Creating binaural beats: ${preset.description} (${beatFreq} Hz)`);

    // Left ear: base frequency
    const leftDest = this.config.notchEnabled && this.notchFilters.left
      ? this.notchFilters.left
      : this.engine.getChannelDestination('left');

    this.binauralGenerators.left = new Tone.Oscillator(baseFreq, 'sine');
    this.binauralGenerators.left.volume.value = volumeLeft + 12;  // Set oscillator's built-in volume
    this.binauralGenerators.leftGain = new Tone.Gain();  // Create gain node for routing
    this.binauralGenerators.left.connect(this.binauralGenerators.leftGain);
    this.binauralGenerators.leftGain.connect(leftDest);
    this.binauralGenerators.left.start();

    // Right ear: base frequency + beat frequency
    const rightDest = this.config.notchEnabled && this.notchFilters.right
      ? this.notchFilters.right
      : this.engine.getChannelDestination('right');

    this.binauralGenerators.right = new Tone.Oscillator(
      baseFreq + beatFreq,
      'sine'
    );
    this.binauralGenerators.right.volume.value = volumeRight + 12;  // Set oscillator's built-in volume
    this.binauralGenerators.rightGain = new Tone.Gain();  // Create gain node for routing
    this.binauralGenerators.right.connect(this.binauralGenerators.rightGain);
    this.binauralGenerators.rightGain.connect(rightDest);
    this.binauralGenerators.right.start();

    this.engine._log(`Binaural: L=${baseFreq}Hz, R=${baseFreq + beatFreq}Hz, Δ=${beatFreq}Hz`);
  }

  /**
   * Update volume for a specific ear
   * @param {string} ear - 'left' or 'right'
   * @param {number} volumeDb - New volume in dB
   */
  updateVolume(ear, volumeDb) {
    this.volumes[ear] = volumeDb;
    const nodes = this.noiseGenerators[ear];

    // Update white noise volume using its built-in volume property
    if (nodes.white) {
      nodes.white.volume.rampTo(volumeDb, 0.1);
    }

    // Update pink noise volume using its built-in volume property
    if (nodes.pink) {
      nodes.pink.volume.rampTo(volumeDb + 8, 0.1);
    }

    // Update binaural beats if present
    const binauralOsc = ear === 'left'
      ? this.binauralGenerators.left
      : this.binauralGenerators.right;

    if (binauralOsc) {
      binauralOsc.volume.rampTo(volumeDb + 12, 0.1);
    }
  }

  /**
   * Update notch frequency (if tinnitus frequency changes)
   * @param {number} newFrequency - New frequency in Hz
   */
  updateNotchFrequency(newFrequency) {
    if (!this.config.notchEnabled) return;

    this.currentFrequency = newFrequency;
    
    if (this.notchFilters.left) {
      this.notchFilters.left.frequency.rampTo(newFrequency, 0.5);
    }
    if (this.notchFilters.right) {
      this.notchFilters.right.frequency.rampTo(newFrequency, 0.5);
    }

    this.engine._log(`Notch frequency updated to ${newFrequency} Hz`);
  }

  /**
   * Update notch intensity
   * @param {string} intensity - 'gentle', 'moderate', 'strong', or 'precise'
   */
  updateNotchIntensity(intensity) {
    if (!this.config.notchEnabled || !NOTCH_INTENSITIES[intensity]) return;

    const preset = NOTCH_INTENSITIES[intensity];
    this.config.notchIntensity = intensity;

    if (this.notchFilters.left) {
      this.notchFilters.left.Q.rampTo(preset.Q, 0.5);
    }
    if (this.notchFilters.right) {
      this.notchFilters.right.Q.rampTo(preset.Q, 0.5);
    }

    this.engine._log(`Notch intensity updated to ${intensity} (Q=${preset.Q})`);
  }

  /**
   * Change binaural beat mode
   * @param {string} mode - 'focus', 'calm', or 'sleep'
   */
  updateBinauralMode(mode) {
    if (!BINAURAL_MODES[mode]) return;
    
    const preset = BINAURAL_MODES[mode];
    this.config.binauralMode = mode;

    if (this.binauralGenerators.left && this.binauralGenerators.right) {
      const baseFreq = preset.baseFreq;
      const beatFreq = preset.beatFreq;

      this.binauralGenerators.left.frequency.rampTo(baseFreq, 1.0);
      this.binauralGenerators.right.frequency.rampTo(baseFreq + beatFreq, 1.0);

      this.engine._log(`Binaural mode changed to ${preset.description}`);
    }
  }

  /**
   * Toggle notch filter on/off
   * @param {boolean} enabled
   */
  setNotchEnabled(enabled) {
    this.config.notchEnabled = enabled;
    
    if (!enabled && this.isActive) {
      // Reconnect noise generators directly to channels, bypassing notch
      this._reconnectWithoutNotch();
    } else if (enabled && this.currentFrequency) {
      // Recreate notch filters
      this._createNotchFilters(this.currentFrequency, this.config.notchIntensity);
      this._reconnectThroughNotch();
    }
  }

  /**
   * Toggle binaural beats on/off
   * @param {boolean} enabled
   */
  setBinauralEnabled(enabled) {
    this.config.binauralEnabled = enabled;

    if (!enabled && this.isActive) {
      // Stop and dispose binaural beats
      this._stopBinauralBeats();
      this.engine._log('Binaural beats disabled');
    } else if (enabled && this.isActive) {
      // Create new binaural beats
      this._createBinauralBeats(this.config.binauralMode, this.volumes.left, this.volumes.right);
      this.engine._log('Binaural beats enabled');
    }
  }

  /**
   * Stop and dispose binaural beat generators
   */
  _stopBinauralBeats() {
    if (this.binauralGenerators.left) {
      try {
        this.binauralGenerators.left.stop();
        this.binauralGenerators.left.dispose();
      } catch (e) {}
      this.binauralGenerators.left = null;
    }
    if (this.binauralGenerators.right) {
      try {
        this.binauralGenerators.right.stop();
        this.binauralGenerators.right.dispose();
      } catch (e) {}
      this.binauralGenerators.right = null;
    }
    if (this.binauralGenerators.leftGain) {
      try {
        this.binauralGenerators.leftGain.dispose();
      } catch (e) {}
      this.binauralGenerators.leftGain = null;
    }
    if (this.binauralGenerators.rightGain) {
      try {
        this.binauralGenerators.rightGain.dispose();
      } catch (e) {}
      this.binauralGenerators.rightGain = null;
    }
  }

  /**
   * Reconnect audio nodes without notch filtering
   */
  _reconnectWithoutNotch() {
    ['left', 'right'].forEach(ear => {
      const nodes = this.noiseGenerators[ear];
      const destination = this.engine.getChannelDestination(ear);

      if (nodes.gain) {
        nodes.gain.disconnect();
        nodes.gain.connect(destination);
      }
      if (nodes.pinkGain) {
        nodes.pinkGain.disconnect();
        nodes.pinkGain.connect(destination);
      }
    });
  }

  /**
   * Reconnect audio nodes through notch filters
   */
  _reconnectThroughNotch() {
    ['left', 'right'].forEach(ear => {
      const nodes = this.noiseGenerators[ear];
      const notchFilter = this.notchFilters[ear];

      if (nodes.gain && notchFilter) {
        nodes.gain.disconnect();
        nodes.gain.connect(notchFilter);
      }
      if (nodes.pinkGain && notchFilter) {
        nodes.pinkGain.disconnect();
        nodes.pinkGain.connect(notchFilter);
      }
    });
  }

  /**
   * Stop therapy
   */
  stop() {
    this.engine._log('Stopping therapy module');

    // Stop and dispose noise generators
    Object.values(this.noiseGenerators).forEach(nodes => {
      Object.values(nodes).forEach(node => {
        if (node && typeof node.dispose === 'function') {
          try {
            if (node.stop) node.stop();
            node.dispose();
          } catch (e) {}
        }
      });
    });

    // Stop and dispose binaural generators
    Object.values(this.binauralGenerators).forEach(node => {
      if (node && typeof node.dispose === 'function') {
        try {
          if (node.stop) node.stop();
          node.dispose();
        } catch (e) {}
      }
    });

    // Dispose notch filters
    Object.values(this.notchFilters).forEach(filter => {
      if (filter) {
        try {
          filter.dispose();
        } catch (e) {}
      }
    });

    // Reset state
    this.noiseGenerators = {
      left: { white: null, pink: null, filter: null, gain: null },
      right: { white: null, pink: null, filter: null, gain: null }
    };
    this.binauralGenerators = {
      left: null, right: null, leftGain: null, rightGain: null
    };
    this.notchFilters = { left: null, right: null };
    
    this.isActive = false;
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    this.stop();
  }

  /**
   * Get current therapy configuration
   */
  getConfig() {
    return {
      frequency: this.currentFrequency,
      notchEnabled: this.config.notchEnabled,
      notchIntensity: this.config.notchIntensity,
      notchDetails: NOTCH_INTENSITIES[this.config.notchIntensity],
      binauralMode: this.config.binauralMode,
      binauralDetails: BINAURAL_MODES[this.config.binauralMode],
      volumes: this.volumes,
      isActive: this.isActive
    };
  }
}

/**
 * Export presets for UI integration
 */
export { NOTCH_INTENSITIES, BINAURAL_MODES };
