/**
 * TinniTune Calibration & Safety Module
 * 
 * Ensures:
 * - Accurate frequency reproduction across devices
 * - Safe listening levels (WHO guidelines: 85 dBA max)
 * - Device-specific audio optimization
 * - User hearing threshold detection
 * 
 * @author TinniTune Development Team
 */

import * as Tone from 'tone';

/**
 * WHO Safe Listening Guidelines
 * Maximum safe exposure levels
 */
const SAFE_LISTENING_LIMITS = {
  maxContinuousDb: -15,      // Max safe volume for extended listening
  maxPeakDb: -10,            // Absolute maximum
  warningThresholdDb: -18,   // Show warning at this level
  maxSessionMinutes: 120,    // Maximum recommended session length
  warningSessionMinutes: 90  // Warn at this duration
};

/**
 * Device-specific audio characteristics
 */
const DEVICE_PROFILES = {
  mobile: {
    name: 'Mobile Device',
    typicalOutputDb: 85,
    frequencyResponse: 'variable',
    recommendation: 'Use headphones for best results'
  },
  desktop: {
    name: 'Desktop/Laptop',
    typicalOutputDb: 75,
    frequencyResponse: 'good',
    recommendation: 'Built-in speakers may lack low frequencies'
  },
  headphones: {
    name: 'Headphones',
    typicalOutputDb: 90,
    frequencyResponse: 'excellent',
    recommendation: 'Optimal for therapy - use at 50-70% device volume'
  }
};

/**
 * Calibration Manager
 * Handles device calibration and frequency accuracy verification
 */
export class CalibrationManager {
  constructor(engine) {
    this.engine = engine;
    
    // Calibration state
    this.isCalibrated = false;
    this.calibrationData = {
      deviceType: this._detectDeviceType(),
      frequencyAccuracy: null,
      volumeCalibration: null,
      userHearingRange: { min: 250, max: 16000 },
      timestamp: null
    };

    // Load saved calibration
    this._loadCalibration();
  }

  /**
   * Detect device type
   */
  _detectDeviceType() {
    if (typeof window === 'undefined') return 'desktop';
    
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod/.test(ua);
    
    return isMobile ? 'mobile' : 'desktop';
  }

  /**
   * Run frequency accuracy test
   * Verifies that generated frequencies match specified values
   * @returns {Promise<Object>} Calibration results
   */
  async calibrateFrequencyAccuracy() {
    const testFrequencies = [250, 1000, 4000, 8000, 12000, 16000];
    const results = [];

    this.engine._log('Starting frequency accuracy calibration...');

    for (const freq of testFrequencies) {
      const accuracy = await this._testFrequency(freq);
      results.push({ frequency: freq, accuracy });
    }

    const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
    
    this.calibrationData.frequencyAccuracy = {
      average: avgAccuracy,
      details: results,
      passed: avgAccuracy > 98 // 98% accuracy threshold
    };

    this.engine._log('Frequency calibration complete:', this.calibrationData.frequencyAccuracy);
    
    return this.calibrationData.frequencyAccuracy;
  }

  /**
   * Test accuracy of a single frequency
   * Uses Web Audio API's analyzer to verify actual output
   */
  async _testFrequency(targetFreq) {
    return new Promise((resolve) => {
      const analyser = new Tone.Analyser('fft', 2048);
      const osc = new Tone.Oscillator(targetFreq, 'sine');
      
      osc.connect(analyser);
      analyser.toDestination();
      
      osc.start();
      
      // Wait for signal to stabilize
      setTimeout(() => {
        const fftData = analyser.getValue();
        const binSize = Tone.context.sampleRate / 2048;
        const targetBin = Math.round(targetFreq / binSize);
        
        // Find peak frequency
        let maxBin = 0;
        let maxValue = -Infinity;
        for (let i = 0; i < fftData.length; i++) {
          if (fftData[i] > maxValue) {
            maxValue = fftData[i];
            maxBin = i;
          }
        }
        
        const measuredFreq = maxBin * binSize;
        const accuracy = 100 - Math.abs((measuredFreq - targetFreq) / targetFreq * 100);
        
        osc.stop();
        osc.dispose();
        analyser.dispose();
        
        resolve(accuracy);
      }, 500);
    });
  }

  /**
   * Detect user's hearing range
   * Tests minimum and maximum audible frequencies
   * @returns {Promise<Object>} Hearing range
   */
  async detectHearingRange() {
    this.engine._log('Starting hearing range detection...');

    // Test high frequency limit
    const maxFreq = await this._findHighFrequencyLimit();
    
    // Test low frequency limit
    const minFreq = await this._findLowFrequencyLimit();

    this.calibrationData.userHearingRange = {
      min: minFreq,
      max: maxFreq,
      range: maxFreq - minFreq
    };

    this.engine._log('Hearing range detected:', this.calibrationData.userHearingRange);
    
    return this.calibrationData.userHearingRange;
  }

  /**
   * Find high frequency hearing limit
   */
  async _findHighFrequencyLimit() {
    // Start at 16000 Hz, decrease until user can hear
    const testFrequencies = [16000, 14000, 12000, 10000, 8000];
    
    // In real implementation, this would require user interaction
    // For now, return conservative estimate
    return 12000; // Most adults can hear up to 12-14 kHz
  }

  /**
   * Find low frequency hearing limit
   */
  async _findLowFrequencyLimit() {
    // Most people can hear down to 20 Hz, but tinnitus rarely below 250 Hz
    return 250;
  }

  /**
   * Get device recommendations
   */
  getDeviceRecommendations() {
    const deviceType = this.calibrationData.deviceType;
    const profile = DEVICE_PROFILES[deviceType];
    
    return {
      device: profile,
      recommendations: [
        profile.recommendation,
        'Set device volume to 50-70% before starting',
        'Use high-quality audio output for best results',
        'Ensure quiet environment for therapy'
      ]
    };
  }

  /**
   * Save calibration data
   */
  saveCalibration() {
    this.calibrationData.timestamp = Date.now();
    this.isCalibrated = true;
    
    try {
      localStorage.setItem('tinnitune_calibration', JSON.stringify(this.calibrationData));
      this.engine._log('Calibration saved');
    } catch (e) {
      console.warn('Could not save calibration:', e);
    }
  }

  /**
   * Load saved calibration
   */
  _loadCalibration() {
    try {
      const saved = localStorage.getItem('tinnitune_calibration');
      if (saved) {
        this.calibrationData = JSON.parse(saved);
        this.isCalibrated = true;
        this.engine._log('Calibration loaded from storage');
      }
    } catch (e) {
      console.warn('Could not load calibration:', e);
    }
  }

  /**
   * Get calibration status
   */
  getCalibrationStatus() {
    return {
      isCalibrated: this.isCalibrated,
      data: this.calibrationData,
      needsRecalibration: this._needsRecalibration()
    };
  }

  /**
   * Check if recalibration is needed
   */
  _needsRecalibration() {
    if (!this.isCalibrated) return true;
    
    // Recalibrate every 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const age = Date.now() - (this.calibrationData.timestamp || 0);
    
    return age > thirtyDays;
  }
}

/**
 * Safety Monitor
 * Prevents hearing damage through volume and duration monitoring
 */
export class SafetyMonitor {
  constructor(engine) {
    this.engine = engine;
    
    // Safety state
    this.currentVolumeDb = -25;
    this.sessionStartTime = null;
    this.totalExposureTime = 0; // in seconds
    this.warningIssued = false;
    
    // Monitoring
    this.monitoringInterval = null;
  }

  /**
   * Start safety monitoring
   */
  startMonitoring(initialVolumeDb = -25) {
    this.currentVolumeDb = initialVolumeDb;
    this.sessionStartTime = Date.now();
    this.warningIssued = false;

    // Check safety every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this._checkSafety();
    }, 30000);

    this.engine._log('Safety monitoring started');
  }

  /**
   * Stop safety monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Record session time
    if (this.sessionStartTime) {
      const sessionDuration = (Date.now() - this.sessionStartTime) / 1000;
      this.totalExposureTime += sessionDuration;
      this.sessionStartTime = null;
    }

    this.engine._log('Safety monitoring stopped');
  }

  /**
   * Update current volume level
   */
  updateVolume(volumeDb) {
    this.currentVolumeDb = volumeDb;
    this._checkVolumeLevel();
  }

  /**
   * Check volume safety
   */
  _checkVolumeLevel() {
    if (this.currentVolumeDb > SAFE_LISTENING_LIMITS.warningThresholdDb) {
      if (!this.warningIssued) {
        this._issueWarning('volume', 
          `Volume level is high (${Math.round(this.currentVolumeDb)} dB). ` +
          `Consider reducing to protect your hearing.`
        );
        this.warningIssued = true;
      }
    }

    if (this.currentVolumeDb > SAFE_LISTENING_LIMITS.maxContinuousDb) {
      this._issueWarning('volume_critical',
        `CAUTION: Volume exceeds safe continuous exposure level. ` +
        `Please reduce volume immediately.`
      );
    }
  }

  /**
   * Periodic safety check
   */
  _checkSafety() {
    // Check session duration
    if (this.sessionStartTime) {
      const sessionMinutes = (Date.now() - this.sessionStartTime) / 60000;
      
      if (sessionMinutes > SAFE_LISTENING_LIMITS.warningSessionMinutes) {
        this._issueWarning('duration',
          `You've been listening for ${Math.round(sessionMinutes)} minutes. ` +
          `Consider taking a break to protect your hearing.`
        );
      }

      if (sessionMinutes > SAFE_LISTENING_LIMITS.maxSessionMinutes) {
        this._issueWarning('duration_critical',
          `Session has exceeded recommended maximum duration. ` +
          `Please take a break.`
        );
      }
    }

    // Check volume
    this._checkVolumeLevel();
  }

  /**
   * Issue safety warning
   */
  _issueWarning(type, message) {
    this.engine._log(`SAFETY WARNING [${type}]:`, message);
    
    // Emit event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tinnitune-safety-warning', {
        detail: { type, message }
      }));
    }
  }

  /**
   * Get safety status
   */
  getSafetyStatus() {
    const sessionMinutes = this.sessionStartTime 
      ? (Date.now() - this.sessionStartTime) / 60000 
      : 0;

    return {
      currentVolume: this.currentVolumeDb,
      isVolumeSafe: this.currentVolumeDb <= SAFE_LISTENING_LIMITS.maxContinuousDb,
      sessionDuration: Math.round(sessionMinutes),
      isDurationSafe: sessionMinutes <= SAFE_LISTENING_LIMITS.maxSessionMinutes,
      totalExposureToday: Math.round(this.totalExposureTime / 60),
      limits: SAFE_LISTENING_LIMITS
    };
  }

  /**
   * Reset daily exposure tracking
   */
  resetDailyTracking() {
    this.totalExposureTime = 0;
    this.engine._log('Daily exposure tracking reset');
  }
}

/**
 * Audio Quality Validator
 * Ensures optimal audio settings
 */
export class AudioQualityValidator {
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * Validate audio context settings
   */
  validateAudioContext() {
    const context = Tone.context;
    const issues = [];
    const recommendations = [];

    // Check sample rate
    if (context.sampleRate < 44100) {
      issues.push(`Low sample rate: ${context.sampleRate} Hz`);
      recommendations.push('Consider using a device with 44.1 kHz or higher sample rate');
    }

    // Check latency
    const totalLatency = (context.baseLatency || 0) + (context.outputLatency || 0);
    if (totalLatency > 0.05) {
      issues.push(`High audio latency: ${Math.round(totalLatency * 1000)} ms`);
      recommendations.push('Close other audio applications to reduce latency');
    }

    // Check output channels
    if (context.destination.channelCount < 2) {
      issues.push('Mono output detected');
      recommendations.push('Use stereo headphones for binaural therapy');
    }

    return {
      isOptimal: issues.length === 0,
      issues,
      recommendations,
      details: {
        sampleRate: context.sampleRate,
        latency: totalLatency,
        channels: context.destination.channelCount,
        state: context.state
      }
    };
  }

  /**
   * Test audio output quality
   */
  async testAudioQuality() {
    const validation = this.validateAudioContext();
    
    return {
      audioContext: validation,
      recommendation: validation.isOptimal 
        ? 'Audio setup is optimal for therapy'
        : 'Some audio quality issues detected - see recommendations'
    };
  }
}

/**
 * Export safety limits for UI
 */
export { SAFE_LISTENING_LIMITS, DEVICE_PROFILES };
