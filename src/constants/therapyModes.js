/**
 * Therapy Mode Constants
 *
 * Shared definitions for therapy modes used throughout the application.
 * These modes control binaural beat frequencies for different therapeutic goals.
 */

export const THERAPY_MODES = {
  daytime: {
    id: 'daytime',
    name: 'Daytime Focus',
    shortName: 'Focus',
    emoji: '☀️',
    description: 'Best for: Work, concentration, alertness',
    frequency: '10 Hz (Alpha)',
    frequencyHz: 10,
    duration: '15-60 minutes',
    color: '#667eea',
    wave: 'Alpha',
    benefits: ['Enhanced focus', 'Mental clarity', 'Reduced anxiety']
  },
  evening: {
    id: 'evening',
    name: 'Evening Calm',
    shortName: 'Calm',
    emoji: '🌅',
    description: 'Best for: Relaxation, winding down',
    frequency: '6 Hz (Theta)',
    frequencyHz: 6,
    duration: '30-60 minutes',
    color: '#f093fb',
    wave: 'Theta',
    benefits: ['Deep relaxation', 'Stress relief', 'Peaceful state']
  },
  sleep: {
    id: 'sleep',
    name: 'Deep Sleep',
    shortName: 'Sleep',
    emoji: '🌙',
    description: 'Best for: Before bed, deep relaxation',
    frequency: '2 Hz (Delta)',
    frequencyHz: 2,
    duration: '30-120 minutes',
    color: '#4ECDC4',
    wave: 'Delta',
    benefits: ['Better sleep', 'Complete calm', 'Deep rest']
  }
};

/**
 * Mapping from therapy mode IDs to binaural beat mode names
 * Used by the audio engine
 */
export const BINAURAL_MODE_MAP = {
  daytime: 'focus',
  evening: 'calm',
  sleep: 'sleep'
};

/**
 * Get mode configuration by ID
 * @param {string} modeId - The mode ID (daytime, evening, sleep)
 * @returns {object} Mode configuration object
 */
export function getModeConfig(modeId) {
  return THERAPY_MODES[modeId];
}

/**
 * Get all therapy modes as an array
 * @returns {array} Array of mode configuration objects
 */
export function getAllModes() {
  return Object.values(THERAPY_MODES);
}
