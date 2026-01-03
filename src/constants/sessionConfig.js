/**
 * Session Duration Configuration
 *
 * Based on clinical research:
 * - Study: "Impact of Daily Hours of Sound Therapy on Tinnitus Relief"
 *   (JSLHR, 2022) found 3-5 hours/day more effective than 1 hour/day
 * - Clinicians recommend at least 2 hours/day for effective masking
 *
 * Reference: https://pubs.asha.org/doi/10.1044/2022_JSLHR-21-00651
 */

export const SESSION_THRESHOLDS = {
  // Session milestones (in seconds)
  MINIMUM: 15 * 60,        // 15 min - still track, but encourage longer
  EFFECTIVE: 30 * 60,      // 30 min - "Good session!" (minimum effective)
  RECOMMENDED: 60 * 60,    // 60 min - "Great session!" (standard recommendation)
  OPTIMAL: 90 * 60,        // 90 min - "Excellent session!" (extended benefit)

  // Daily goals (in seconds)
  DAILY_MINIMUM: 120 * 60,      // 2 hours - maintains current default
  DAILY_RECOMMENDED: 180 * 60,  // 3 hours - optimal based on research
  DAILY_MAXIMUM: 300 * 60,      // 5 hours - upper bound from research

  // WHO safety limits
  MAX_CONTINUOUS: 120 * 60,     // 2 hours - recommend break after
  MAX_DAILY: 480 * 60          // 8 hours - safety ceiling
};

/**
 * Get session quality level based on duration
 * @param {number} durationSeconds - Session duration in seconds
 * @returns {Object} Quality level with color, emoji, and message
 */
export const getSessionQuality = (durationSeconds) => {
  if (durationSeconds >= SESSION_THRESHOLDS.OPTIMAL) {
    return {
      level: 'optimal',
      color: '#FFD700', // Gold
      emoji: '⭐',
      message: 'Excellent session!',
      description: 'Extended therapy for maximum benefit'
    };
  } else if (durationSeconds >= SESSION_THRESHOLDS.RECOMMENDED) {
    return {
      level: 'recommended',
      color: '#4ECDC4', // Teal
      emoji: '✨',
      message: 'Great session!',
      description: 'Meeting clinical recommendations'
    };
  } else if (durationSeconds >= SESSION_THRESHOLDS.EFFECTIVE) {
    return {
      level: 'effective',
      color: '#44B3AA', // Teal-green
      emoji: '👍',
      message: 'Good session!',
      description: 'Effective therapy duration'
    };
  } else if (durationSeconds >= SESSION_THRESHOLDS.MINIMUM) {
    return {
      level: 'minimum',
      color: '#FFB74D', // Orange
      emoji: '🌱',
      message: 'Nice start!',
      description: 'Keep going for better results'
    };
  } else {
    return {
      level: 'short',
      color: '#FF9800', // Deep orange
      emoji: '⏱️',
      message: 'Quick session',
      description: 'Try for at least 30 minutes'
    };
  }
};

/**
 * Get progress percentage based on multiple thresholds
 * @param {number} durationSeconds - Session duration in seconds
 * @returns {Object} Progress data with percentage and next milestone
 */
export const getSessionProgress = (durationSeconds) => {
  let percentage;
  let nextMilestone;
  let progressColor;

  if (durationSeconds >= SESSION_THRESHOLDS.OPTIMAL) {
    // Beyond optimal - cap at 100%
    percentage = 100;
    nextMilestone = null;
    progressColor = '#FFD700'; // Gold
  } else if (durationSeconds >= SESSION_THRESHOLDS.RECOMMENDED) {
    // Between recommended (60 min) and optimal (90 min)
    const range = SESSION_THRESHOLDS.OPTIMAL - SESSION_THRESHOLDS.RECOMMENDED;
    const progress = durationSeconds - SESSION_THRESHOLDS.RECOMMENDED;
    percentage = 75 + (progress / range) * 25; // Scale from 75% to 100%
    nextMilestone = {
      seconds: SESSION_THRESHOLDS.OPTIMAL,
      label: '90 min (Optimal)'
    };
    progressColor = '#4ECDC4'; // Teal
  } else if (durationSeconds >= SESSION_THRESHOLDS.EFFECTIVE) {
    // Between effective (30 min) and recommended (60 min)
    const range = SESSION_THRESHOLDS.RECOMMENDED - SESSION_THRESHOLDS.EFFECTIVE;
    const progress = durationSeconds - SESSION_THRESHOLDS.EFFECTIVE;
    percentage = 50 + (progress / range) * 25; // Scale from 50% to 75%
    nextMilestone = {
      seconds: SESSION_THRESHOLDS.RECOMMENDED,
      label: '60 min (Recommended)'
    };
    progressColor = '#44B3AA'; // Teal-green
  } else if (durationSeconds >= SESSION_THRESHOLDS.MINIMUM) {
    // Between minimum (15 min) and effective (30 min)
    const range = SESSION_THRESHOLDS.EFFECTIVE - SESSION_THRESHOLDS.MINIMUM;
    const progress = durationSeconds - SESSION_THRESHOLDS.MINIMUM;
    percentage = 25 + (progress / range) * 25; // Scale from 25% to 50%
    nextMilestone = {
      seconds: SESSION_THRESHOLDS.EFFECTIVE,
      label: '30 min (Effective)'
    };
    progressColor = '#FFB74D'; // Orange
  } else {
    // Below minimum (< 15 min)
    percentage = (durationSeconds / SESSION_THRESHOLDS.MINIMUM) * 25; // Scale from 0% to 25%
    nextMilestone = {
      seconds: SESSION_THRESHOLDS.EFFECTIVE,
      label: '30 min (Effective)'
    };
    progressColor = '#FF9800'; // Deep orange
  }

  return {
    percentage: Math.round(percentage),
    nextMilestone,
    progressColor,
    quality: getSessionQuality(durationSeconds)
  };
};

/**
 * Get encouragement message based on daily progress
 * @param {number} totalMinutes - Total therapy minutes today
 * @param {number} goalMinutes - Daily goal in minutes
 * @returns {string} Encouragement message
 */
export const getDailyEncouragementMessage = (totalMinutes, goalMinutes) => {
  if (totalMinutes >= goalMinutes) {
    return "Daily goal reached! Excellent work ✨";
  } else if (totalMinutes >= 90) {
    return "Almost at your goal! Keep it up 🌟";
  } else if (totalMinutes >= 60) {
    return "Great progress! You're over halfway 🎯";
  } else if (totalMinutes >= 30) {
    return "Good start! Keep going for best results 💪";
  } else if (totalMinutes > 0) {
    return "Every minute counts! Aim for 30+ today 🌱";
  } else {
    return "Start your therapy session today 🚀";
  }
};

/**
 * Format seconds into human-readable time
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time (e.g., "2h 30m" or "45m")
 */
export const formatDurationText = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};
