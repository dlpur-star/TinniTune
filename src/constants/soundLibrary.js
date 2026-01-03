/**
 * Sound Library Configuration for TinniTune
 *
 * Defines available therapy sounds including pink noise and nature sounds.
 * All nature sounds should be notch-filtered at the user's tinnitus frequency.
 *
 * AUDIO FILE REQUIREMENTS:
 * - Format: MP3 or OGG (MP3 recommended for compatibility)
 * - Sample Rate: 44.1 kHz
 * - Bit Rate: 128 kbps minimum
 * - Duration: 30-60 seconds (must loop seamlessly)
 * - License: Creative Commons or royalty-free
 *
 * RECOMMENDED SOURCES FOR AUDIO FILES:
 * 1. Freesound.org - https://freesound.org/ (CC-licensed)
 * 2. Free Music Archive - https://freemusicarchive.org/
 * 3. YouTube Audio Library - https://www.youtube.com/audiolibrary
 * 4. Incompetech - https://incompetech.com/music/royalty-free/
 *
 * INSTALLATION:
 * Place audio files in /public/sounds/ directory:
 * - /public/sounds/ocean-waves.mp3
 * - /public/sounds/rainfall.mp3
 * - /public/sounds/forest-ambience.mp3
 * - /public/sounds/campfire.mp3
 * - /public/sounds/stream.mp3
 */

export const SOUND_LIBRARY = {
  pink: {
    id: 'pink',
    name: 'Pink Noise',
    emoji: '🎵',
    description: 'Classic therapy sound with balanced frequency spectrum',
    type: 'generated', // Generated procedurally, not a file
    color: '#FFB74D',
    clinical: true, // Clinically validated
    file: null // Generated in real-time
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean Waves',
    emoji: '🌊',
    description: 'Calming beach sounds with gentle waves',
    type: 'file',
    color: '#4ECDC4',
    clinical: true,
    file: '/sounds/ocean-waves.mp3',
    fallback: 'pink', // Fallback if file not available
    tags: ['relaxing', 'nature', 'water']
  },

  rain: {
    id: 'rain',
    name: 'Rainfall',
    emoji: '🌧️',
    description: 'Gentle rain ambience for relaxation',
    type: 'file',
    color: '#81C784',
    clinical: true,
    file: '/sounds/rainfall.mp3',
    fallback: 'pink',
    tags: ['relaxing', 'nature', 'water']
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    description: 'Natural forest soundscape with birds and wind',
    type: 'file',
    color: '#8BC34A',
    clinical: true,
    file: '/sounds/forest-ambience.mp3',
    fallback: 'pink',
    tags: ['nature', 'peaceful', 'birds']
  },

  stream: {
    id: 'stream',
    name: 'Stream',
    emoji: '💧',
    description: 'Babbling brook and flowing water',
    type: 'file',
    color: '#64B5F6',
    clinical: false, // Nice to have, but not primary
    file: '/sounds/stream.mp3',
    fallback: 'ocean',
    tags: ['nature', 'water', 'peaceful']
  },

  campfire: {
    id: 'campfire',
    name: 'Campfire',
    emoji: '🔥',
    description: 'Crackling fire sounds for warmth and comfort',
    type: 'file',
    color: '#FF8A65',
    clinical: false,
    file: '/sounds/campfire.mp3',
    fallback: 'pink',
    tags: ['cozy', 'warm', 'relaxing']
  }
};

/**
 * Get sound configuration by ID
 */
export const getSound = (soundId) => {
  return SOUND_LIBRARY[soundId] || SOUND_LIBRARY.pink;
};

/**
 * Get all available sounds
 */
export const getAllSounds = () => {
  return Object.values(SOUND_LIBRARY);
};

/**
 * Get clinically validated sounds only
 */
export const getClinicalSounds = () => {
  return Object.values(SOUND_LIBRARY).filter(sound => sound.clinical);
};

/**
 * Get sounds by tag
 */
export const getSoundsByTag = (tag) => {
  return Object.values(SOUND_LIBRARY).filter(sound =>
    sound.tags && sound.tags.includes(tag)
  );
};

/**
 * Check if a sound file is available
 * Returns a promise that resolves to true/false
 */
export const isSoundAvailable = async (soundId) => {
  const sound = getSound(soundId);

  if (sound.type === 'generated') {
    return true; // Generated sounds are always available
  }

  if (!sound.file) {
    return false;
  }

  try {
    const response = await fetch(sound.file, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Sound file not available: ${sound.file}`);
    return false;
  }
};

/**
 * Get available sound or fallback
 */
export const getAvailableSound = async (soundId) => {
  const sound = getSound(soundId);

  if (sound.type === 'generated') {
    return sound;
  }

  const isAvailable = await isSoundAvailable(soundId);

  if (isAvailable) {
    return sound;
  }

  // Use fallback
  if (sound.fallback) {
    console.log(`Using fallback sound: ${sound.fallback} (${soundId} not available)`);
    return getSound(sound.fallback);
  }

  // Ultimate fallback: pink noise
  return SOUND_LIBRARY.pink;
};

/**
 * Generate installation instructions for missing sounds
 */
export const getMissingSoundsInstructions = (missingSounds) => {
  if (missingSounds.length === 0) {
    return null;
  }

  return `
🎵 Nature Sound Setup Instructions

The following sound files are missing. Follow these steps to add them:

MISSING SOUNDS:
${missingSounds.map(s => `- ${s.emoji} ${s.name}: ${s.file}`).join('\n')}

QUICK SETUP:
1. Visit Freesound.org (https://freesound.org/)
2. Search for each sound type (e.g., "ocean waves loop")
3. Download CC-licensed files (MP3, 30-60 sec, seamless loop)
4. Place files in /public/sounds/ directory
5. Refresh the app

SEARCH TIPS:
- Use keywords: "loop", "seamless", "ambience"
- Filter by: CC0 license, 30-60 second duration
- Preview before downloading to ensure quality

RECOMMENDED SEARCHES:
- Ocean: "ocean waves gentle loop"
- Rain: "rain ambience loop soft"
- Forest: "forest birds ambience loop"
- Stream: "stream water flowing loop"
- Campfire: "campfire crackling loop"

FILES MUST BE:
✓ Seamlessly looping (no gaps or clicks)
✓ High quality (44.1 kHz, 128+ kbps)
✓ Creative Commons licensed
✓ Appropriate length (30-60 seconds)

Once files are added, they'll appear automatically in the sound selector!
  `.trim();
};

export default SOUND_LIBRARY;
