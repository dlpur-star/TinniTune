/**
 * TinniTune Audio Engine v1.0
 * Clinical-Grade Tinnitus Frequency Testing & Therapy System
 * 
 * A bespoke audio engine designed specifically for:
 * - High-precision frequency matching (3AFC methodology)
 * - Clinically-proven notched sound therapy
 * - Binaural beat generation for anxiety management
 * - Real-time audio parameter control
 * - Safety-first audio processing
 * 
 * @author TinniTune Development Team
 * @license MIT
 */

import * as Tone from 'tone';

/**
 * Core Audio Engine Class
 * Manages the entire audio system lifecycle, routing, and state
 */
export class TinniTuneAudioEngine {
  constructor(config = {}) {
    this.config = {
      sampleRate: config.sampleRate || 48000,
      maxVolume: config.maxVolume || -10, // dB - safety limiter
      fadeTime: config.fadeTime || 0.1, // seconds
      safetyLimiterEnabled: config.safetyLimiterEnabled !== false,
      enableLogging: config.enableLogging || false,
      ...config
    };

    // Audio context state
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentMode = null;

    // Node references
    this.masterLimiter = null;
    this.masterGain = null;
    this.leftChannel = null;
    this.rightChannel = null;

    // Active modules
    this.activeModules = new Map();
    
    // Session data
    this.sessionStartTime = null;
    this.sessionData = {
      frequency: null,
      volume: { left: -25, right: -25 },
      therapyMode: null,
      notchIntensity: null
    };

    this._setupEventListeners();
  }

  /**
   * Initialize the audio engine
   * Must be called in response to user interaction
   */
  async initialize() {
    if (this.isInitialized) {
      this._log('Engine already initialized');
      return true;
    }

    try {
      this._log('Starting audio context...');
      await Tone.start();

      this._log('Audio context started', {
        sampleRate: Tone.context.sampleRate,
        latency: Tone.context.baseLatency,
        state: Tone.context.state
      });

      // Create master signal chain
      this._createMasterChain();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw new Error(`Audio initialization failed: ${error.message}`);
    }
  }

  /**
   * Create master audio routing and safety chain
   * Structure: [Left/Right Channels] -> Master Gain -> Limiter -> Destination
   */
  _createMasterChain() {
    // Master gain control
    this.masterGain = new Tone.Gain(0.8).toDestination();

    // Safety limiter - prevents audio from exceeding safe levels
    if (this.config.safetyLimiterEnabled) {
      this.masterLimiter = new Tone.Limiter(this.config.maxVolume);
      this.masterGain.disconnect();
      this.masterGain.connect(this.masterLimiter);
      this.masterLimiter.toDestination();
      this._log('Safety limiter enabled at', this.config.maxVolume, 'dB');
    }

    // Create stereo channels
    this.leftChannel = new Tone.Panner(-1).connect(this.masterGain);
    this.rightChannel = new Tone.Panner(1).connect(this.masterGain);

    this._log('Master audio chain created');
  }

  /**
   * Get the appropriate destination for a given ear
   * @param {string} ear - 'left', 'right', or 'both'
   * @returns {Tone.Panner|Tone.Gain} Audio destination node
   */
  getChannelDestination(ear) {
    if (ear === 'left') return this.leftChannel;
    if (ear === 'right') return this.rightChannel;
    // For 'both', return master gain (before panning)
    return this.masterGain;
  }

  /**
   * Register an audio module (therapy, testing, etc.)
   * @param {string} moduleId - Unique identifier for this module
   * @param {Object} module - Module instance with start/stop/dispose methods
   */
  registerModule(moduleId, module) {
    if (this.activeModules.has(moduleId)) {
      this._log(`Module ${moduleId} already registered, disposing old instance`);
      this.unregisterModule(moduleId);
    }

    this.activeModules.set(moduleId, module);
    this._log(`Module registered: ${moduleId}`);
  }

  /**
   * Unregister and dispose of a module
   * @param {string} moduleId - Module identifier
   */
  unregisterModule(moduleId) {
    const module = this.activeModules.get(moduleId);
    if (module) {
      if (typeof module.dispose === 'function') {
        module.dispose();
      }
      this.activeModules.delete(moduleId);
      this._log(`Module unregistered: ${moduleId}`);
    }
  }

  /**
   * Set master volume with safety checks
   * @param {number} db - Volume in decibels (-40 to 0)
   */
  setMasterVolume(db) {
    const safeDb = Math.max(-40, Math.min(db, this.config.maxVolume));
    if (this.masterGain) {
      this.masterGain.gain.rampTo(Tone.dbToGain(safeDb), this.config.fadeTime);
      this._log(`Master volume: ${safeDb} dB`);
    }
  }

  /**
   * Set volume for a specific channel
   * @param {string} ear - 'left' or 'right'
   * @param {number} db - Volume in decibels
   */
  setChannelVolume(ear, db) {
    const safeDb = Math.max(-40, Math.min(db, this.config.maxVolume));
    this.sessionData.volume[ear] = safeDb;
    
    // Notify all modules of volume change
    this.activeModules.forEach(module => {
      if (typeof module.updateVolume === 'function') {
        module.updateVolume(ear, safeDb);
      }
    });
  }

  /**
   * Emergency stop all audio immediately
   */
  emergencyStop() {
    this._log('EMERGENCY STOP activated');
    
    // Stop all modules
    this.activeModules.forEach(module => {
      if (typeof module.stop === 'function') {
        module.stop();
      }
    });

    // Mute master
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(Tone.now());
      this.masterGain.gain.value = 0;
    }

    this.isPlaying = false;
  }

  /**
   * Graceful stop with fade out
   */
  async stop() {
    if (!this.isPlaying) return;

    this._log('Stopping engine gracefully');

    // Fade out master
    if (this.masterGain) {
      this.masterGain.gain.rampTo(0, this.config.fadeTime);
    }

    // Wait for fade
    await new Promise(resolve => setTimeout(resolve, this.config.fadeTime * 1000));

    // Stop all modules
    this.activeModules.forEach(module => {
      if (typeof module.stop === 'function') {
        module.stop();
      }
    });

    this.isPlaying = false;
  }

  /**
   * Dispose of the entire engine
   * Call this when unmounting the app
   */
  dispose() {
    this._log('Disposing audio engine');

    // Stop everything
    this.emergencyStop();

    // Dispose all modules
    this.activeModules.forEach((module, id) => {
      this.unregisterModule(id);
    });

    // Dispose master chain
    if (this.masterLimiter) this.masterLimiter.dispose();
    if (this.masterGain) this.masterGain.dispose();
    if (this.leftChannel) this.leftChannel.dispose();
    if (this.rightChannel) this.rightChannel.dispose();

    // Suspend audio context
    if (Tone.context.state !== 'suspended') {
      Tone.context.suspend();
    }

    this.isInitialized = false;
  }

  /**
   * Get current session data
   */
  getSessionData() {
    return {
      ...this.sessionData,
      duration: this.sessionStartTime 
        ? Date.now() - this.sessionStartTime 
        : 0,
      isPlaying: this.isPlaying
    };
  }

  /**
   * Update session data
   */
  updateSessionData(data) {
    this.sessionData = { ...this.sessionData, ...data };
  }

  /**
   * Start session timer
   */
  startSession() {
    this.sessionStartTime = Date.now();
    this.isPlaying = true;

    // CRITICAL: Reset master gain to audible level when starting
    // This fixes the "no sound" bug after stopping therapy
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(Tone.now());
      this.masterGain.gain.value = 0.8; // Reset to default audible level
      this._log('Master gain reset to 0.8 for new session');
    }

    this._log('Session started');
  }

  /**
   * Get audio context information
   */
  getAudioContextInfo() {
    return {
      state: Tone.context.state,
      sampleRate: Tone.context.sampleRate,
      currentTime: Tone.context.currentTime,
      baseLatency: Tone.context.baseLatency,
      outputLatency: Tone.context.outputLatency || 0
    };
  }

  /**
   * Get master gain node for external audio connections
   * This allows external audio sources (like calm mode heartbeat) to route through the engine
   * @returns {Tone.Gain} The master gain node, or null if not initialized
   */
  getMasterGain() {
    if (!this.isInitialized || !this.masterGain) {
      this._log('Warning: getMasterGain called before engine initialization');
      return null;
    }
    return this.masterGain;
  }

  /**
   * Event listener setup for lifecycle management
   */
  _setupEventListeners() {
    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isPlaying) {
          this._log('Page hidden, maintaining audio');
          // Keep playing - PWA should continue in background
        }
      });
    }

    // Handle audio context interruptions
    Tone.context.on('statechange', (state) => {
      this._log('Audio context state changed:', state);
      
      if (state === 'interrupted' || state === 'suspended') {
        this._log('Audio context interrupted - attempting resume');
        Tone.context.resume().catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      }
    });
  }

  /**
   * Internal logging
   */
  _log(...args) {
    if (this.config.enableLogging) {
      console.log('[TinniTune Engine]', ...args);
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
let engineInstance = null;

export function getAudioEngine(config) {
  if (!engineInstance) {
    engineInstance = new TinniTuneAudioEngine(config);
  }
  return engineInstance;
}

export function disposeAudioEngine() {
  if (engineInstance) {
    engineInstance.dispose();
    engineInstance = null;
  }
}
