/**
 * AmbientSoundGenerator.js
 * Procedurally generates ambient/nature sounds for layering with therapy
 * Uses Tone.js for sound synthesis to minimize app size
 */

import * as Tone from 'tone';

/**
 * Generates procedural ambient sounds (rain, ocean, wind, stream)
 * All sounds route through individual gain nodes for independent control
 */
export class AmbientSoundGenerator {
  constructor() {
    this.sounds = {};
    this.masterGain = new Tone.Gain(0.5); // Start at 50% to allow headroom
    this.masterGain.toDestination();

    this.isInitialized = false;
    this.activeSounds = new Set();

    // Sound definitions
    this.soundDefinitions = {
      rain: {
        name: 'Rain',
        icon: '🌧️',
        generate: () => this.createRain()
      },
      ocean: {
        name: 'Ocean Waves',
        icon: '🌊',
        generate: () => this.createOcean()
      },
      wind: {
        name: 'Wind',
        icon: '💨',
        generate: () => this.createWind()
      },
      stream: {
        name: 'Stream',
        icon: '💧',
        generate: () => this.createStream()
      },
      whitenoise: {
        name: 'White Noise',
        icon: '⚪',
        generate: () => this.createWhiteNoise()
      },
      pinknoise: {
        name: 'Pink Noise',
        icon: '🌸',
        generate: () => this.createPinkNoise()
      },
      brownnoise: {
        name: 'Brown Noise',
        icon: '🤎',
        generate: () => this.createBrownNoise()
      }
    };
  }

  /**
   * Initialize the generator (call after user interaction)
   */
  async initialize() {
    if (this.isInitialized) return;

    await Tone.start();
    this.isInitialized = true;
    console.log('[AmbientSoundGenerator] Initialized');
  }

  /**
   * Create rain sound (filtered pink noise with random modulation)
   */
  createRain() {
    const noise = new Tone.Noise('pink');
    const filter = new Tone.Filter({
      type: 'bandpass',
      frequency: 1200,
      Q: 1,
      rolloff: -12
    });

    // Random volume modulation for raindrops
    const tremolo = new Tone.Tremolo({
      frequency: Math.random() * 2 + 8, // 8-10 Hz
      depth: 0.3
    }).start();

    const gain = new Tone.Gain(0.6);

    noise.connect(filter);
    filter.connect(tremolo);
    tremolo.connect(gain);
    gain.connect(this.masterGain);

    return {
      sources: [noise],
      effects: [filter, tremolo],
      gain,
      start: () => noise.start(),
      stop: () => {
        noise.stop();
        setTimeout(() => {
          noise.dispose();
          filter.dispose();
          tremolo.dispose();
          gain.dispose();
        }, 100);
      }
    };
  }

  /**
   * Create ocean waves sound (brown noise with slow LFO)
   */
  createOcean() {
    const noise = new Tone.Noise('brown');
    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 400,
      Q: 0.5,
      rolloff: -24
    });

    // Slow wave motion
    const lfo = new Tone.LFO({
      frequency: 0.1, // Very slow, 0.1 Hz = 10 second wave cycle
      min: 0.3,
      max: 0.8,
      type: 'sine'
    }).start();

    const gain = new Tone.Gain(0.6);
    lfo.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    return {
      sources: [noise],
      effects: [filter, lfo],
      gain,
      start: () => noise.start(),
      stop: () => {
        noise.stop();
        lfo.stop();
        setTimeout(() => {
          noise.dispose();
          filter.dispose();
          lfo.dispose();
          gain.dispose();
        }, 100);
      }
    };
  }

  /**
   * Create wind sound (filtered white noise with LFO)
   */
  createWind() {
    const noise = new Tone.Noise('white');
    const filter = new Tone.Filter({
      type: 'highpass',
      frequency: 800,
      Q: 0.3,
      rolloff: -12
    });

    // Wind gusts
    const lfo = new Tone.LFO({
      frequency: 0.3, // Moderate gusts
      min: 0.2,
      max: 0.7,
      type: 'sine'
    }).start();

    const gain = new Tone.Gain(0.5);
    lfo.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    return {
      sources: [noise],
      effects: [filter, lfo],
      gain,
      start: () => noise.start(),
      stop: () => {
        noise.stop();
        lfo.stop();
        setTimeout(() => {
          noise.dispose();
          filter.dispose();
          lfo.dispose();
          gain.dispose();
        }, 100);
      }
    };
  }

  /**
   * Create stream sound (filtered white noise with faster modulation)
   */
  createStream() {
    const noise = new Tone.Noise('white');
    const filter = new Tone.Filter({
      type: 'bandpass',
      frequency: 2000,
      Q: 1.5,
      rolloff: -12
    });

    // Babbling water
    const tremolo = new Tone.Tremolo({
      frequency: 15, // Faster than rain
      depth: 0.4
    }).start();

    const gain = new Tone.Gain(0.5);

    noise.connect(filter);
    filter.connect(tremolo);
    tremolo.connect(gain);
    gain.connect(this.masterGain);

    return {
      sources: [noise],
      effects: [filter, tremolo],
      gain,
      start: () => noise.start(),
      stop: () => {
        noise.stop();
        setTimeout(() => {
          noise.dispose();
          filter.dispose();
          tremolo.dispose();
          gain.dispose();
        }, 100);
      }
    };
  }

  /**
   * Create white noise
   */
  createWhiteNoise() {
    const noise = new Tone.Noise('white');
    const gain = new Tone.Gain(0.5);

    noise.connect(gain);
    gain.connect(this.masterGain);

    return {
      sources: [noise],
      effects: [],
      gain,
      start: () => noise.start(),
      stop: () => {
        noise.stop();
        setTimeout(() => {
          noise.dispose();
          gain.dispose();
        }, 100);
      }
    };
  }

  /**
   * Create pink noise
   */
  createPinkNoise() {
    const noise = new Tone.Noise('pink');
    const gain = new Tone.Gain(0.5);

    noise.connect(gain);
    gain.connect(this.masterGain);

    return {
      sources: [noise],
      effects: [],
      gain,
      start: () => noise.start(),
      stop: () => {
        noise.stop();
        setTimeout(() => {
          noise.dispose();
          gain.dispose();
        }, 100);
      }
    };
  }

  /**
   * Create brown noise
   */
  createBrownNoise() {
    const noise = new Tone.Noise('brown');
    const gain = new Tone.Gain(0.5);

    noise.connect(gain);
    gain.connect(this.masterGain);

    return {
      sources: [noise],
      effects: [],
      gain,
      start: () => noise.start(),
      stop: () => {
        noise.stop();
        setTimeout(() => {
          noise.dispose();
          gain.dispose();
        }, 100);
      }
    };
  }

  /**
   * Start a specific ambient sound
   */
  startSound(soundType) {
    if (!this.isInitialized) {
      console.warn('[AmbientSoundGenerator] Not initialized. Call initialize() first.');
      return false;
    }

    if (this.activeSounds.has(soundType)) {
      console.warn(`[AmbientSoundGenerator] ${soundType} already playing`);
      return false;
    }

    const definition = this.soundDefinitions[soundType];
    if (!definition) {
      console.error(`[AmbientSoundGenerator] Unknown sound type: ${soundType}`);
      return false;
    }

    const sound = definition.generate();
    this.sounds[soundType] = sound;
    sound.start();
    this.activeSounds.add(soundType);

    console.log(`[AmbientSoundGenerator] Started ${soundType}`);
    return true;
  }

  /**
   * Stop a specific ambient sound
   */
  stopSound(soundType) {
    if (!this.activeSounds.has(soundType)) {
      return false;
    }

    const sound = this.sounds[soundType];
    if (sound) {
      sound.stop();
      delete this.sounds[soundType];
      this.activeSounds.delete(soundType);
      console.log(`[AmbientSoundGenerator] Stopped ${soundType}`);
      return true;
    }

    return false;
  }

  /**
   * Update volume for a specific sound
   */
  updateSoundVolume(soundType, volumeDb) {
    const sound = this.sounds[soundType];
    if (!sound) return false;

    // Convert dB to gain (0-1)
    const gain = Tone.dbToGain(volumeDb);
    sound.gain.gain.rampTo(gain, 0.1); // 100ms ramp

    return true;
  }

  /**
   * Update master volume for all ambient sounds
   */
  updateMasterVolume(volumeDb) {
    const gain = Tone.dbToGain(volumeDb);
    this.masterGain.gain.rampTo(gain, 0.1);
  }

  /**
   * Stop all ambient sounds
   */
  stopAll() {
    const soundTypes = Array.from(this.activeSounds);
    soundTypes.forEach(type => this.stopSound(type));
  }

  /**
   * Get list of available sound types
   */
  getAvailableSounds() {
    return Object.keys(this.soundDefinitions).map(key => ({
      type: key,
      name: this.soundDefinitions[key].name,
      icon: this.soundDefinitions[key].icon,
      isActive: this.activeSounds.has(key)
    }));
  }

  /**
   * Get list of currently active sounds
   */
  getActiveSounds() {
    return Array.from(this.activeSounds);
  }

  /**
   * Emergency stop - immediately mute and stop all
   */
  emergencyStop() {
    this.masterGain.gain.cancelScheduledValues(Tone.now());
    this.masterGain.gain.value = 0;
    this.stopAll();
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.stopAll();
    this.masterGain.dispose();
    this.isInitialized = false;
    console.log('[AmbientSoundGenerator] Disposed');
  }
}

export default AmbientSoundGenerator;
