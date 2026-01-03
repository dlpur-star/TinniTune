import React, { useState, useRef } from 'react';
import * as Tone from 'tone';
import logo from './assets/logo.PNG';
import TherapySetupWizard from './components/therapy/TherapySetupWizard';
import FeedbackModal from './components/FeedbackModal';
import AchievementCelebration from './components/AchievementCelebration';

// New Audio Engine Imports
import { getAudioEngine } from './audio-engine/TinniTuneAudioEngine';
import { ThreeAFCTester } from './audio-engine/ThreeAFCTester';
import { ClinicalTherapyModule } from './audio-engine/ClinicalTherapyModule';

// Hooks
import { useUserProfiles } from './hooks/useUserProfiles';
import { useUserSettings } from './hooks/useUserSettings';
import useTherapyGoals from './hooks/useTherapyGoals';
import { SafetyMonitor } from './audio-engine/CalibrationSafetyModule';

// Constants
import { getModeConfig, BINAURAL_MODE_MAP } from './constants/therapyModes';
import {
  SESSION_THRESHOLDS,
  getSessionProgress,
  getDailyEncouragementMessage
} from './constants/sessionConfig';

export default function TinniTune() {
// Initialize profile management
const {
  profiles,
  activeProfileId,
  activeProfile,
  isLoaded: profilesLoaded,
  createProfile,
  switchProfile,
  deleteProfile,
  renameProfile,
  getProfileCount
} = useUserProfiles();

// Initialize user settings hook (profile-aware)
const {
  settings: userSettings,
  isLoaded: settingsLoaded,
  updateSettings,
  updateCalmMode,
  saveCalibration,
  resetSettings,
  hasCalibration,
  saveFavorite,
  loadFavorite,
  deleteFavorite,
  renameFavorite,
  updateFavorite
} = useUserSettings(activeProfileId);

// Initialize therapy goals and progress tracking
const therapyGoalsHook = useTherapyGoals();
const {
  goals: therapyGoals,
  isLoaded: goalsLoaded,
  newAchievements,
  initializeTherapy,
  updateStreak,
  recordSession,
  checkAchievements,
  getTodayProgress,
  getWeekProgress,
  getProgressTrends,
  getHabituationStage
} = therapyGoalsHook;

const [step, setStep] = useState('welcome'); // 'welcome', 'setup', 'therapy', 'history'
const [activeFavoriteId, setActiveFavoriteId] = useState(null); // Track currently loaded favorite
const [showWizard, setShowWizard] = useState(false); // Show therapy setup wizard
const [frequency, setFrequency] = useState(4000);
const [ear, setEar] = useState('both');
const [isPlaying, setIsPlaying] = useState(false);
const [mode, setMode] = useState('daytime');
const [volumeLeft, setVolumeLeft] = useState(-25);
const [volumeRight, setVolumeRight] = useState(-25);
const [sessionTime, setSessionTime] = useState(0);
const [notchEnabled, setNotchEnabled] = useState(true); // Notch therapy ON by default
const [notchIntensity, setNotchIntensity] = useState('standard'); // 'gentle', 'standard', 'strong'
const [binauralEnabled, setBinauralEnabled] = useState(true); // Binaural beats ON by default
const [sessionStartTime, setSessionStartTime] = useState(null); // Track when session started
const [sessions, setSessions] = useState([]); // Array of past sessions
const [showRatingModal, setShowRatingModal] = useState(false); // Show post-session rating
const [currentRatings, setCurrentRatings] = useState({
loudnessBefore: 5,
loudnessAfter: 5,
distress: 5,
notes: ''
});

// Install prompt state
const [showInstallPrompt, setShowInstallPrompt] = useState(false);
const [isIOS, setIsIOS] = useState(false);
const [isStandalone, setIsStandalone] = useState(false);

// Feedback form state
const [showFeedback, setShowFeedback] = useState(false);

// Profile management state
const [showProfileManager, setShowProfileManager] = useState(false);
const [showNewProfileModal, setShowNewProfileModal] = useState(false);
const [newProfileName, setNewProfileName] = useState('');
const [showSettingsPanel, setShowSettingsPanel] = useState(false);

// Favorites management state
const [showSaveFavoriteModal, setShowSaveFavoriteModal] = useState(false);
const [newFavoriteName, setNewFavoriteName] = useState('');

// Audio Engine Mode Toggle (Development Feature)
const [therapyEngine, setTherapyEngine] = useState('engine'); // 'legacy' or 'engine' - NEW ENGINE IS DEFAULT
const [showDevSettings, setShowDevSettings] = useState(false); // Developer settings panel

// New Audio Engine States
const [engineInstance, setEngineInstance] = useState(null);
const [therapyModule, setTherapyModule] = useState(null);
const [safetyMonitor, setSafetyMonitor] = useState(null);
const [afcTester, setAfcTester] = useState(null);
const [isTestingFrequency, setIsTestingFrequency] = useState(false);
const [currentTestSet, setCurrentTestSet] = useState(null);
const [testIteration, setTestIteration] = useState(0);
const [testReady, setTestReady] = useState(false); // New: track if test is initialized and ready
const [testHistory, setTestHistory] = useState([]); // Track all completed steps for progressive UI
const [isPlayingTones, setIsPlayingTones] = useState(false); // Visual feedback for tone playback

// Calm Mode states
const [isCalmMode, setIsCalmMode] = useState(false);
const [heartbeatVolume, setHeartbeatVolume] = useState(-15);
const [heartbeatBPM, setHeartbeatBPM] = useState(55); // 55 = very calm
const [breathingPhase, setBreathingPhase] = useState('in'); // 'in', 'hold', 'out'
const [breathCount, setBreathCount] = useState(4);

// Advanced Calibration Wizard states
const [useAdvancedCalibration, setUseAdvancedCalibration] = useState(true);
const [use3AFCTesting, setUse3AFCTesting] = useState(false); // New clinical-grade testing
const [calibrationStage, setCalibrationStage] = useState('volume'); // 'volume', 'ear', 'coarse', 'medium', 'fine', 'octave', 'complete'
const [calibrationRound, setCalibrationRound] = useState(1);
const [coarseFreq, setCoarseFreq] = useState(4000);
const [mediumFreq, setMediumFreq] = useState(4000);
const [fineFreq, setFineFreq] = useState(4000);
const [confidence, setConfidence] = useState(3);
const [lastConfidence, setLastConfidence] = useState(3);
const [octaveCheckAttempt, setOctaveCheckAttempt] = useState(0);
const [testVolume, setTestVolume] = useState(-15);
const [isPlayingCalibration, setIsPlayingCalibration] = useState(false);
const [calibrationOscRef, setCalibrationOscRef] = useState(null);
const [showRetryPrompt, setShowRetryPrompt] = useState(false);
const [waveformData, setWaveformData] = useState(new Array(20).fill(0));

const synthsRef = useRef([]);
const pannerLeftRef = useRef(null);
const pannerRightRef = useRef(null);
const notchFiltersRef = useRef([]); // Store notch filters separately

// CRITICAL: Ref for new engine therapy module (persists across renders like synthsRef)
const therapyModuleRef = useRef(null);
const timerRef = useRef(null);
const analyserRef = useRef(null);
const animationFrameRef = useRef(null);
const calibrationTimeoutRef = useRef(null);

// Calm Mode refs
const heartbeatSynthsRef = useRef([]);
const breathingTimerRef = useRef(null);
const breathingIntervalsRef = useRef([]);

// Wake Lock ref to prevent phone sleep during therapy
const wakeLockRef = useRef(null);

// Load session history from localStorage on mount
React.useEffect(() => {
try {
const savedSessions = localStorage.getItem('tinnitune_sessions');
if (savedSessions) {
setSessions(JSON.parse(savedSessions));
}
} catch (error) {
console.error('Error loading sessions:', error);
}
}, []);

// Load calibration progress from localStorage
React.useEffect(() => {
try {
const savedCalibration = localStorage.getItem('tinnitune_calibration_progress');
if (savedCalibration) {
const data = JSON.parse(savedCalibration);
setCalibrationStage(data.stage || 'volume');
setCoarseFreq(data.coarseFreq || 4000);
setMediumFreq(data.mediumFreq || 4000);
setFineFreq(data.fineFreq || 4000);
setEar(data.ear || 'both');
setTestVolume(data.testVolume || -15);
}
} catch (error) {
console.error('Error loading calibration progress:', error);
}
}, []);

// Load user settings and apply them to component state
React.useEffect(() => {
if (settingsLoaded && userSettings) {
// Apply saved frequency and ear settings if available
if (userSettings.frequency) {
setFrequency(userSettings.frequency);
setFineFreq(userSettings.frequency);
}
if (userSettings.ear) {
setEar(userSettings.ear);
}

// Migrate old 1-5 confidence scale to percentage (one-time migration)
if (userSettings.confidence && userSettings.confidence >= 1 && userSettings.confidence <= 5) {
  const confidencePercentage = userSettings.confidence === 5 ? 95 : userSettings.confidence * 20;
  saveCalibration(userSettings.frequency, userSettings.ear, confidencePercentage);
  console.log(`Migrated confidence from ${userSettings.confidence} to ${confidencePercentage}%`);
}

// Apply therapy preferences
setMode(userSettings.mode);
setNotchEnabled(userSettings.notchEnabled);
setNotchIntensity(userSettings.notchIntensity);
setVolumeLeft(userSettings.volumeLeft);
setVolumeRight(userSettings.volumeRight);

// Apply calm mode preferences
if (userSettings.calmMode) {
setIsCalmMode(userSettings.calmMode.enabled || false);
setHeartbeatBPM(userSettings.calmMode.heartbeatBPM || 55);
setHeartbeatVolume(userSettings.calmMode.heartbeatVolume || -15);
}
}
}, [settingsLoaded, userSettings, saveCalibration]);

// Detect iOS and check if already installed
React.useEffect(() => {
try {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

  // Safely check for standalone mode (some browsers don't support matchMedia)
  let isInStandaloneMode = false;
  try {
    isInStandaloneMode = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                         (window.navigator.standalone === true);
  } catch (e) {
    // matchMedia not supported, assume not standalone
    isInStandaloneMode = false;
  }

  setIsIOS(isIOSDevice);
  setIsStandalone(isInStandaloneMode);

  // Show install prompt if on iOS and not already installed
  if (isIOSDevice && !isInStandaloneMode) {
    const hasSeenPrompt = localStorage.getItem('tinnitune_seen_install_prompt');
    if (!hasSeenPrompt) {
      setShowInstallPrompt(true);
    }
  }
} catch (error) {
  // If anything fails, just don't show install prompt - app still works
  console.log('Install prompt detection failed (app works normally):', error);
}
}, []);

// Initialize Audio Engine (for new engine mode)
React.useEffect(() => {
  if (therapyEngine === 'engine' && !engineInstance) {
    console.log('🎵 Initializing TinniTune Audio Engine...');
    const engine = getAudioEngine({
      enableLogging: true,
      safetyLimiterEnabled: true,
      maxVolume: -10
    });
    setEngineInstance(engine);

    // Initialize safety monitor
    const safety = new SafetyMonitor(engine);
    setSafetyMonitor(safety);

    console.log('✅ Audio Engine initialized');
  }

  // When switching to legacy mode, clean up engine instance
  if (therapyEngine === 'legacy' && engineInstance) {
    console.log('🔧 Switching to legacy - cleaning up new engine');
    try {
      if (therapyModule) {
        therapyModule.dispose();
      }
      engineInstance.dispose();
    } catch (e) {
      console.warn('Error disposing engine:', e);
    }
    setEngineInstance(null);
    setSafetyMonitor(null);
  }
}, [therapyEngine]);

// Validate settings when switching between engines
React.useEffect(() => {
  // Legacy engine only supports 3 notch intensities (gentle, standard, strong)
  // New engine supports 4 (gentle, standard, strong, precise)
  if (therapyEngine === 'legacy' && notchIntensity === 'precise') {
    console.log('⚠️ Switching to legacy engine: downgrading "precise" intensity to "strong"');
    setNotchIntensity('strong');
  }
}, [therapyEngine, notchIntensity]);

// Listen for safety warnings from new engine
React.useEffect(() => {
  const handleSafetyWarning = (event) => {
    const { type, message } = event.detail;
    console.warn('🚨 Safety Warning:', type, message);
    // You can add UI notification here
    if (type === 'volume_critical' || type === 'duration_critical') {
      alert(`⚠️ ${message}`);
    }
  };

  window.addEventListener('tinnitune-safety-warning', handleSafetyWarning);
  return () => window.removeEventListener('tinnitune-safety-warning', handleSafetyWarning);
}, []);

// Handle visibility change to resume audio context and wake lock
React.useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && isPlaying) {
      console.log('📱 App visible - resuming audio context');

      // Resume Tone.js audio context if suspended
      if (Tone.context.state === 'suspended') {
        await Tone.context.resume();
        console.log('✅ Audio context resumed');
      }

      // Re-acquire wake lock if it was released
      if (!wakeLockRef.current && isPlaying) {
        await requestWakeLock();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isPlaying]);

// Request wake lock to prevent phone sleep during therapy
const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      console.log('🔒 Wake lock acquired - screen will stay on');

      wakeLockRef.current.addEventListener('release', () => {
        console.log('🔓 Wake lock released');
      });
    } else {
      console.log('⚠️ Wake Lock API not supported on this device');
    }
  } catch (err) {
    console.error('Failed to acquire wake lock:', err);
  }
};

// Release wake lock when therapy stops
const releaseWakeLock = async () => {
  if (wakeLockRef.current) {
    try {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('🔓 Wake lock released');
    } catch (err) {
      console.error('Failed to release wake lock:', err);
    }
  }
};

// Save calibration progress to localStorage
const saveCalibrationProgress = () => {
try {
const data = {
stage: calibrationStage,
coarseFreq,
mediumFreq,
fineFreq,
ear,
testVolume,
timestamp: Date.now()
};
localStorage.setItem('tinnitune_calibration_progress', JSON.stringify(data));
} catch (error) {
console.error('Error saving calibration progress:', error);
}
};

// Timer for session tracking
React.useEffect(() => {
if (isPlaying) {
timerRef.current = setInterval(() => {
setSessionTime(prev => prev + 1);
}, 1000);
} else {
if (timerRef.current) {
clearInterval(timerRef.current);
}
}
return () => {
if (timerRef.current) {
clearInterval(timerRef.current);
}
};
}, [isPlaying]);

// Cleanup Calm Mode on unmount
React.useEffect(() => {
  return () => stopCalmMode();
}, []);

// Save calibration progress whenever it changes (only during setup)
React.useEffect(() => {
  if (step === 'setup') {
    saveCalibrationProgress();
  }
}, [step, calibrationStage, coarseFreq, mediumFreq, fineFreq, ear, testVolume]);

// Stop calibration tone when changing stages or leaving setup
React.useEffect(() => {
  return () => {
    stopCalibrationTone();
  };
}, [calibrationStage, step]);

// Update calibration tone volume in real-time when slider changes
React.useEffect(() => {
  if (calibrationOscRef && calibrationOscRef.osc) {
    try {
      calibrationOscRef.osc.volume.value = testVolume;
    } catch (error) {
      console.error('Error updating calibration volume:', error);
    }
  }
}, [testVolume]);

const formatTime = (seconds) => {
const mins = Math.floor(seconds / 60);
const secs = seconds % 60;
return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get Q-factor for notch filter based on intensity
// Gentle = wide notch (1.5 octaves, Q=0.92)
// Standard = medium notch (1 octave, Q=1.41) - clinically proven
// Strong = narrow notch (0.5 octave, Q=2.87)
const getNotchQ = (intensity) => {
const qValues = {
gentle: 0.92,   // 1.5 octave bandwidth
standard: 1.41, // 1 octave bandwidth (Okamoto et al. 2010)
strong: 2.87    // 0.5 octave bandwidth
};
return qValues[intensity] || 1.41;
};

// Save completed session to localStorage
const saveSession = (duration, ratings = null) => {
if (duration < 30) return; // Don't save sessions shorter than 30 seconds

const session = {
  id: Date.now(),
  timestamp: new Date().toISOString(), // Changed from 'date' to 'timestamp' for consistency
  duration: duration, // in seconds
  frequency: frequency,
  ear: ear,
  mode: mode,
  volumeLeft: volumeLeft,
  volumeRight: volumeRight,
  notchEnabled: notchEnabled,
  notchIntensity: notchIntensity,
  // Rating data (optional)
  loudnessBefore: ratings?.loudnessBefore || null,
  loudnessAfter: ratings?.loudnessAfter || null,
  distress: ratings?.distress || null,
  notes: ratings?.notes || ''
};

try {
  const updatedSessions = [session, ...sessions].slice(0, 100); // Keep last 100 sessions
  setSessions(updatedSessions);
  localStorage.setItem('tinnitune_sessions', JSON.stringify(updatedSessions));
  console.log('Session saved:', session);

  // Update therapy goals and progress tracking
  if (goalsLoaded) {
    // Initialize therapy start date on first session
    initializeTherapy();

    // Record the session
    recordSession(duration);

    // Update streak based on session date
    updateStreak(session.timestamp);

    // Check for newly unlocked achievements with updated sessions
    setTimeout(() => {
      checkAchievements(updatedSessions);
    }, 100);
  }
} catch (error) {
  console.error('Error saving session:', error);
}

};

// Calculate statistics from sessions
const getStats = () => {
if (sessions.length === 0) {
return {
totalSessions: 0,
totalTime: 0,
avgDuration: 0,
mostUsedMode: 'none',
streak: 0
};
}

const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
const avgDuration = Math.round(totalTime / sessions.length);

// Find most used mode
const modeCounts = {};
sessions.forEach(s => {
  modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1;
});
const mostUsedMode = Object.keys(modeCounts).reduce((a, b) => 
  modeCounts[a] > modeCounts[b] ? a : b
);

// Calculate streak (consecutive days with sessions)
const today = new Date();
today.setHours(0, 0, 0, 0);
let streak = 0;
let checkDate = new Date(today);

while (true) {
  const hasSession = sessions.some(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === checkDate.getTime();
  });
  
  if (hasSession) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    break;
  }
}

return {
  totalSessions: sessions.length,
  totalTime: totalTime,
  avgDuration: avgDuration,
  mostUsedMode: mostUsedMode,
  streak: streak
};

};

// Detect milestones
const getMilestones = () => {
const stats = getStats();
const milestones = [];

// Session count milestones
if (stats.totalSessions === 1) milestones.push({ emoji: '🎉', text: 'First session complete!' });
if (stats.totalSessions === 5) milestones.push({ emoji: '⭐', text: '5 sessions milestone!' });
if (stats.totalSessions === 10) milestones.push({ emoji: '💪', text: '10 sessions - You\'re committed!' });
if (stats.totalSessions === 25) milestones.push({ emoji: '🏆', text: '25 sessions - Amazing progress!' });
if (stats.totalSessions === 50) milestones.push({ emoji: '🎯', text: '50 sessions - Half century!' });
if (stats.totalSessions === 100) milestones.push({ emoji: '👑', text: '100 sessions - Legendary!' });

// Streak milestones
if (stats.streak === 3) milestones.push({ emoji: '🔥', text: '3-day streak!' });
if (stats.streak === 7) milestones.push({ emoji: '🔥🔥', text: '1 week streak!' });
if (stats.streak === 14) milestones.push({ emoji: '🔥🔥🔥', text: '2 week streak!' });
if (stats.streak === 30) milestones.push({ emoji: '💎', text: '30-day streak - Incredible!' });

// Total time milestones (in hours)
const totalHours = Math.floor(stats.totalTime / 3600);
if (totalHours === 1) milestones.push({ emoji: '⏰', text: 'First hour of therapy!' });
if (totalHours === 5) milestones.push({ emoji: '⏰', text: '5 hours of therapy!' });
if (totalHours === 10) milestones.push({ emoji: '⏰', text: '10 hours invested!' });
if (totalHours === 25) milestones.push({ emoji: '⏰', text: '25 hours - Serious dedication!' });
if (totalHours === 50) milestones.push({ emoji: '⏰', text: '50 hours - You\'re healing!' });

return milestones;

};

const startAudio = async () => {
try {
await Tone.start();
console.log('Audio context started');

  // IMPORTANT: Stop new engine if it's running
  if (therapyModule) {
    await stopAudioEngine(true);  // Silent cleanup - don't save session or show modal
  }

  // Stop any existing sounds
  synthsRef.current.forEach(synth => {
    try {
      synth.stop();
      synth.dispose();
    } catch (e) {}
  });
  synthsRef.current = [];
  
  if (pannerLeftRef.current) {
    try { pannerLeftRef.current.dispose(); } catch (e) {}
  }
  if (pannerRightRef.current) {
    try { pannerRightRef.current.dispose(); } catch (e) {}
  }
  
  console.log('Starting therapy - Left vol:', volumeLeft, 'Right vol:', volumeRight);
  
  // Create separate channels for left and right with independent volumes
  const pannerLeft = new Tone.Panner(-1).toDestination(); // Full left
  const pannerRight = new Tone.Panner(1).toDestination(); // Full right
  pannerLeftRef.current = pannerLeft;
  pannerRightRef.current = pannerRight;
  
  // Create notch filters if enabled (clinically proven therapy)
  let notchFilterLeft = null;
  let notchFilterRight = null;
  
  if (notchEnabled) {
    const qFactor = getNotchQ(notchIntensity);
    console.log(`Notch therapy enabled: ${notchIntensity} (Q=${qFactor}) at ${frequency}Hz`);
    
    notchFilterLeft = new Tone.Filter({
      type: "notch",
      frequency: frequency,
      Q: qFactor,
      rolloff: -12
    });
    notchFilterLeft.connect(pannerLeft);
    
    notchFilterRight = new Tone.Filter({
      type: "notch", 
      frequency: frequency,
      Q: qFactor,
      rolloff: -12
    });
    notchFilterRight.connect(pannerRight);
    
    // Store notch filters separately to avoid index confusion
    notchFiltersRef.current = [notchFilterLeft, notchFilterRight];
  }
  
  // Determine where to connect: notch filter or directly to panner
  const leftDestination = notchEnabled ? notchFilterLeft : pannerLeft;
  const rightDestination = notchEnabled ? notchFilterRight : pannerRight;
  
  // === LEFT CHANNEL ===
  const noiseLeft = new Tone.Noise('white').start();
  const gainLeft = new Tone.Gain().connect(leftDestination);
  noiseLeft.connect(gainLeft);
  noiseLeft.volume.value = volumeLeft;
  synthsRef.current.push(noiseLeft);
  
  const ambienceLeft = new Tone.Noise('pink').start();
  const ambienceFilterLeft = new Tone.Filter(1000, 'lowpass');
  const ambienceGainLeft = new Tone.Gain().connect(leftDestination);
  ambienceLeft.connect(ambienceFilterLeft);
  ambienceFilterLeft.connect(ambienceGainLeft);
  ambienceLeft.volume.value = volumeLeft + 8;
  synthsRef.current.push(ambienceLeft);
  
  // === RIGHT CHANNEL ===
  const noiseRight = new Tone.Noise('white').start();
  const gainRight = new Tone.Gain().connect(rightDestination);
  noiseRight.connect(gainRight);
  noiseRight.volume.value = volumeRight;
  synthsRef.current.push(noiseRight);
  
  const ambienceRight = new Tone.Noise('pink').start();
  const ambienceFilterRight = new Tone.Filter(1000, 'lowpass');
  const ambienceGainRight = new Tone.Gain().connect(rightDestination);
  ambienceRight.connect(ambienceFilterRight);
  ambienceFilterRight.connect(ambienceGainRight);
  ambienceRight.volume.value = volumeRight + 8;
  synthsRef.current.push(ambienceRight);
  
  console.log('Left channel:', volumeLeft, 'dB | Right channel:', volumeRight, 'dB');

  // Add binaural beats for therapy (if enabled)
  if (binauralEnabled) {
    const modeConfig = getModeConfig(mode);
    const baseFreq = 200;
    const binauralDiff = modeConfig.freq;

    const oscLeft = new Tone.Oscillator(baseFreq, 'sine').start();
    const oscRight = new Tone.Oscillator(baseFreq + binauralDiff, 'sine').start();

    oscLeft.connect(leftDestination);
    oscRight.connect(rightDestination);
    oscLeft.volume.value = volumeLeft + 12;
    oscRight.volume.value = volumeRight + 12;

    synthsRef.current.push(oscLeft, oscRight);
    console.log('Binaural beats added');
  } else {
    console.log('Binaural beats disabled');
  }

  setIsPlaying(true);
  setSessionTime(0);
  setSessionStartTime(Date.now()); // Record when session started

  // Request wake lock to prevent phone sleep
  await requestWakeLock();

  const notchStatus = notchEnabled ? `with ${notchIntensity} notch therapy` : 'without notch therapy';
  console.log(`Therapy started ${notchStatus} at ${frequency}Hz`);
} catch (error) {
  console.error('Error starting audio:', error);
  alert('Error starting therapy: ' + error.message);
}

};

const stopAudio = (silentCleanup = false) => {
synthsRef.current.forEach(synth => {
try {
synth.stop();
synth.dispose();
} catch (e) {}
});
synthsRef.current = [];

// Clean up notch filters
notchFiltersRef.current.forEach(filter => {
  try {
    filter.dispose();
  } catch (e) {}
});
notchFiltersRef.current = [];

if (pannerLeftRef.current) {
  try { pannerLeftRef.current.dispose(); } catch (e) {}
  pannerLeftRef.current = null;
}
if (pannerRightRef.current) {
  try { pannerRightRef.current.dispose(); } catch (e) {}
  pannerRightRef.current = null;
}

// Release wake lock when therapy stops
releaseWakeLock();

// Only handle session ending if this is a real stop, not cleanup
if (!silentCleanup) {
  const finalDuration = sessionTime;
  setIsPlaying(false);

  // Show rating modal for sessions over 60 seconds
  if (finalDuration >= 60) {
    setShowRatingModal(true);
  } else {
    // Save without ratings for short sessions
    saveSession(finalDuration);
  }

  // Also stop calm mode if active
  if (isCalmMode) {
    stopCalmMode();
  }

  console.log('Audio stopped - Session length:', formatTime(sessionTime));
} else {
  console.log('Legacy engine stopped (cleanup for engine switch)');
}

};

// ============================================================================
// NEW AUDIO ENGINE FUNCTIONS (Clinical-Grade)
// ============================================================================

const startAudioEngine = async () => {
  try {
    if (!engineInstance) {
      console.error('Audio engine not initialized');
      return;
    }

    // CRITICAL: Clean up any existing therapy module FIRST to prevent multiple instances
    if (therapyModuleRef.current) {
      console.log('⚠️ Disposing existing therapy module before creating new one');
      try {
        therapyModuleRef.current.dispose();
        engineInstance.unregisterModule('therapy');
        therapyModuleRef.current = null;
      } catch (e) {
        console.warn('Error disposing old therapy module:', e);
      }
    }

    // IMPORTANT: Stop legacy engine if it's running
    stopAudio(true);  // Silent cleanup - don't save session or show modal

    console.log('🎵 Starting therapy with NEW Audio Engine');
    console.log('  Frequency:', frequency, 'Hz');
    console.log('  Ear:', ear);
    console.log('  Notch Enabled:', notchEnabled);
    console.log('  Notch Intensity:', notchIntensity);
    console.log('  Binaural Enabled:', binauralEnabled);
    console.log('  Volume L/R:', volumeLeft, '/', volumeRight, 'dB');

    // Initialize audio context (ensures Tone.js is started)
    await Tone.start();
    await engineInstance.initialize();

    // Verify audio context is running
    console.log('  Audio Context State:', Tone.context.state);

    // Map notch intensity to engine format
    const intensityMap = {
      'gentle': 'gentle',
      'standard': 'moderate',
      'strong': 'strong',
      'precise': 'precise'
    };
    const engineIntensity = intensityMap[notchIntensity] || 'moderate';

    // Map mode to binaural mode
    const binauralMode = BINAURAL_MODE_MAP[mode] || 'focus';

    // Create therapy module
    const therapy = new ClinicalTherapyModule(engineInstance, {
      notchEnabled: notchEnabled,
      notchIntensity: engineIntensity,
      binauralEnabled: binauralEnabled,
      binauralMode: binauralMode
    });

    // CRITICAL: Store in ref (persists across renders) AND state
    therapyModuleRef.current = therapy;
    setTherapyModule(therapy);
    setSessionTime(0);
    setSessionStartTime(Date.now());

    // Register module
    engineInstance.registerModule('therapy', therapy);

    // Start therapy
    await therapy.start({
      frequency: frequency,
      volumeLeft: volumeLeft,
      volumeRight: volumeRight,
      ear: ear,
      notchIntensity: engineIntensity,
      binauralEnabled: binauralEnabled,
      binauralMode: binauralMode
    });

    setIsPlaying(true);

    // Request wake lock to prevent phone sleep
    await requestWakeLock();

    // Start safety monitoring
    if (safetyMonitor) {
      const maxVolume = Math.max(volumeLeft, volumeRight);
      safetyMonitor.startMonitoring(maxVolume);
    }

    // Verify therapy is active
    const therapyConfig = therapy.getConfig();
    console.log('✅ New engine therapy started successfully');
    console.log('  Therapy Active:', therapyConfig.isActive);
    console.log('  Frequency:', therapyConfig.frequency, 'Hz');
    console.log('  Notch:', therapyConfig.notchEnabled ? therapyConfig.notchIntensity : 'OFF');
    console.log('  Binaural:', therapyConfig.binauralDetails?.description || 'OFF');
  } catch (error) {
    console.error('Error starting new engine therapy:', error);
    setTherapyModule(null);
    setIsPlaying(false);
    alert('Error starting therapy: ' + error.message);
  }
};

const stopAudioEngine = async (silentCleanup = false) => {
  try {
    console.log('🛑 Stopping new engine therapy');

    // Stop safety monitoring first
    if (safetyMonitor) {
      try {
        safetyMonitor.stopMonitoring();
      } catch (e) {
        console.warn('Error stopping safety monitor:', e);
      }
    }

    // CRITICAL: Stop module directly (same pattern as legacy synthsRef.current.forEach)
    // Don't rely on engine.stop() or unregisterModule() - just brute force stop
    if (therapyModuleRef.current) {
      try {
        therapyModuleRef.current.stop();
        console.log('✅ Therapy module stopped');
      } catch (e) {
        console.error('Error stopping therapy module:', e);
      }

      // Dispose immediately
      try {
        therapyModuleRef.current.dispose();
      } catch (e) {}

      therapyModuleRef.current = null;
    }

    // Emergency stop the engine (mute master gain immediately, no fade)
    if (engineInstance) {
      try {
        engineInstance.emergencyStop();
        engineInstance.unregisterModule('therapy');
      } catch (e) {
        console.warn('Error stopping engine:', e);
      }
    }

    // Clear state
    setTherapyModule(null);

    // Release wake lock when therapy stops
    releaseWakeLock();

    // Only handle session ending if this is a real stop, not cleanup
    if (!silentCleanup) {
      const finalDuration = sessionTime;
      setIsPlaying(false);

      // Show rating modal for sessions over 60 seconds
      if (finalDuration >= 60) {
        setShowRatingModal(true);
      } else {
        saveSession(finalDuration);
      }

      // Also stop calm mode if active
      if (isCalmMode) {
        stopCalmMode();
      }

      console.log('✅ New engine therapy stopped - Session length:', formatTime(sessionTime));
    } else {
      console.log('New engine stopped (cleanup for engine switch)');
    }
  } catch (error) {
    console.error('Error stopping new engine therapy:', error);
    // Ensure state is clean even on error
    therapyModuleRef.current = null;
    setTherapyModule(null);
    if (!silentCleanup) {
      setIsPlaying(false);
    }
  }
};

// Update therapy parameters in real-time (new engine)
const updateEngineVolume = (earSide, newVolume) => {
  if (therapyModuleRef.current && isPlaying) {
    therapyModuleRef.current.updateVolume(earSide, newVolume);
    if (safetyMonitor) {
      // Calculate actual new max volume based on which ear was updated
      const newMaxVolume = earSide === 'left'
        ? Math.max(newVolume, volumeRight)
        : Math.max(volumeLeft, newVolume);
      safetyMonitor.updateVolume(newMaxVolume);
    }
  }
};

const updateEngineNotchIntensity = (intensity) => {
  if (therapyModuleRef.current && isPlaying) {
    const intensityMap = {
      'gentle': 'gentle',
      'standard': 'moderate',
      'strong': 'strong',
      'precise': 'precise'
    };
    therapyModuleRef.current.updateNotchIntensity(intensityMap[intensity] || 'moderate');
  }
};

// ============================================================================
// UNIFIED START/STOP FUNCTIONS (Route based on therapyEngine)
// ============================================================================

const startTherapy = async () => {
  if (therapyEngine === 'engine') {
    await startAudioEngine();
  } else {
    await startAudio();
  }
};

const stopTherapy = async () => {
  if (therapyEngine === 'engine') {
    await stopAudioEngine();
  } else {
    stopAudio();
  }
};

// ============================================================================

const testTone = async () => {
try {
await Tone.start();

  // Determine pan value
  let panValue = 0;
  if (ear === 'left') panValue = -1;
  if (ear === 'right') panValue = 1;

  const panner = new Tone.Panner(panValue).toDestination();
  const osc = new Tone.Oscillator(frequency, 'sine').connect(panner);
  osc.volume.value = -15;
  osc.start();

  console.log('Test tone playing at', frequency, 'Hz in', ear, 'ear');

  setTimeout(() => {
    osc.stop();
    osc.dispose();
    panner.dispose();
  }, 3000);
} catch (error) {
  alert('Error: ' + error.message);
}

};

// ========================================
// ADVANCED CALIBRATION FUNCTIONS
// ========================================

const playCalibrationTone = async (freq, duration = 3500) => {
  try {
    await Tone.start();

    // Stop any existing calibration tone
    stopCalibrationTone();

    // Determine pan value
    let panValue = 0;
    if (ear === 'left') panValue = -1;
    if (ear === 'right') panValue = 1;

    // Connect: Oscillator -> Analyser -> Panner -> Destination
    const panner = new Tone.Panner(panValue).toDestination();
    const analyserNode = new Tone.Analyser('waveform', 64);
    const osc = new Tone.Oscillator(freq, 'sine');
    osc.connect(analyserNode);
    analyserNode.connect(panner);
    osc.volume.value = testVolume;

    // Start with explicit stop time for safety
    osc.start();
    osc.stop(Tone.now() + (duration / 1000)); // Auto-stop at Tone.js level

    setIsPlayingCalibration(true);
    setCalibrationOscRef({ osc, panner, analyserNode });
    analyserRef.current = analyserNode;

    console.log('Calibration tone playing at', freq, 'Hz in', ear, 'ear for', duration, 'ms');

    // Start waveform animation loop
    const updateWaveform = () => {
      if (analyserRef.current) {
        try {
          const values = analyserRef.current.getValue();
          // Sample 20 evenly spaced points from the waveform
          const sampledData = [];
          const step = Math.max(1, Math.floor(values.length / 20));
          for (let i = 0; i < 20; i++) {
            const index = Math.min(i * step, values.length - 1);
            sampledData.push(values[index]);
          }
          setWaveformData(sampledData);
          animationFrameRef.current = requestAnimationFrame(updateWaveform);
        } catch (error) {
          console.error('Error updating waveform:', error);
        }
      }
    };
    updateWaveform();

    // Store timeout ID so we can cancel it (for cleanup, not stopping)
    calibrationTimeoutRef.current = setTimeout(() => {
      stopCalibrationTone();
    }, duration);
  } catch (error) {
    console.error('Error playing calibration tone:', error);
    setIsPlayingCalibration(false);
  }
};

const stopCalibrationTone = () => {
  // Cancel auto-stop timeout
  if (calibrationTimeoutRef.current) {
    clearTimeout(calibrationTimeoutRef.current);
    calibrationTimeoutRef.current = null;
  }

  // Stop animation loop
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }

  // Reset waveform data
  setWaveformData(new Array(20).fill(0));

  if (calibrationOscRef) {
    try {
      calibrationOscRef.osc.stop();
      calibrationOscRef.osc.dispose();
      if (calibrationOscRef.analyserNode) {
        calibrationOscRef.analyserNode.dispose();
      }
      calibrationOscRef.panner.dispose();
    } catch (error) {
      console.error('Error stopping calibration tone:', error);
    }
    setCalibrationOscRef(null);
  }

  analyserRef.current = null;
  setIsPlayingCalibration(false);
};

const handleCalibrationComplete = () => {
  // Stop any playing calibration tone
  stopCalibrationTone();

  // Set the final frequency based on what was matched
  let finalFreq = frequency;
  if (calibrationStage === 'complete') {
    finalFreq = fineFreq || mediumFreq || coarseFreq;
  }
  setFrequency(finalFreq);

  // Convert 1-5 confidence scale to percentage (to match 3AFC format)
  // 1 → 20%, 2 → 40%, 3 → 60%, 4 → 80%, 5 → 95%
  const confidencePercentage = confidence === 5 ? 95 : confidence * 20;

  // Save calibration to user settings
  saveCalibration(finalFreq, ear, confidencePercentage);

  // Clear calibration progress
  localStorage.removeItem('tinnitune_calibration_progress');

  // Show wizard before therapy
  setShowWizard(true);
  setStep('therapy');
};

// ========================================
// CALM MODE FUNCTIONS
// ========================================

const startHeartbeat = async () => {
  try {
    await Tone.start();
    console.log('Starting heartbeat at', heartbeatBPM, 'BPM');

    stopHeartbeat();

    const interval = 60 / heartbeatBPM;

    // Determine where to connect the heartbeat based on active engine
    let destination;
    if (therapyEngine === 'engine' && engineInstance) {
      // New engine: connect to engine's master gain
      destination = engineInstance.getMasterGain();
      if (!destination) {
        console.warn('Engine master gain not available, falling back to default destination');
        destination = Tone.getDestination();
      } else {
        console.log('Heartbeat connecting to new engine master gain');
      }
    } else {
      // Legacy engine: use default Tone.js destination
      destination = Tone.getDestination();
    }

    const lub = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.1 }
    }).connect(destination);
    lub.volume.value = heartbeatVolume;

    const dub = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 1.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 }
    }).connect(destination);
    dub.volume.value = heartbeatVolume + 3;

    heartbeatSynthsRef.current = [lub, dub];

    Tone.Transport.cancel();
    Tone.Transport.scheduleRepeat((time) => {
      lub.triggerAttackRelease(45, '16n', time);
      dub.triggerAttackRelease(65, '32n', time + 0.12);
    }, interval);

    Tone.Transport.start();
    console.log('Heartbeat started');
  } catch (error) {
    console.error('Error starting heartbeat:', error);
  }
};

const stopHeartbeat = () => {
  if (Tone.Transport.state === 'started') {
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }
  heartbeatSynthsRef.current.forEach(synth => {
    try { synth.dispose(); } catch (e) {}
  });
  heartbeatSynthsRef.current = [];
};

const updateHeartbeatVolume = (newVolume) => {
  setHeartbeatVolume(newVolume);
  if (heartbeatSynthsRef.current.length > 0) {
    heartbeatSynthsRef.current[0].volume.value = newVolume;
    if (heartbeatSynthsRef.current[1]) heartbeatSynthsRef.current[1].volume.value = newVolume + 3;
  }
};

const updateHeartbeatBPM = (newBPM) => {
  setHeartbeatBPM(newBPM);
  if (isCalmMode && heartbeatSynthsRef.current.length > 0) {
    stopHeartbeat();
    setTimeout(() => startHeartbeat(), 100);
  }
};

const startBreathingGuide = () => {
  stopBreathingGuide();
  const breathCycle = () => {
    setBreathingPhase('in');
    let count = 4;
    setBreathCount(4);
    const inhaleInterval = setInterval(() => {
      count--;
      setBreathCount(count);
      if (count === 0) {
        clearInterval(inhaleInterval);
        // Remove from refs array
        breathingIntervalsRef.current = breathingIntervalsRef.current.filter(id => id !== inhaleInterval);

        setBreathingPhase('hold');
        setBreathCount(2);
        const holdTimeout = setTimeout(() => {
          setBreathingPhase('out');
          let outCount = 6;
          setBreathCount(6);
          const exhaleInterval = setInterval(() => {
            outCount--;
            setBreathCount(outCount);
            if (outCount === 0) {
              clearInterval(exhaleInterval);
              // Remove from refs array
              breathingIntervalsRef.current = breathingIntervalsRef.current.filter(id => id !== exhaleInterval);

              breathingTimerRef.current = setTimeout(breathCycle, 500);
            }
          }, 1000);
          breathingIntervalsRef.current.push(exhaleInterval);
        }, 2000);
        breathingIntervalsRef.current.push(holdTimeout);
      }
    }, 1000);
    breathingIntervalsRef.current.push(inhaleInterval);
  };
  breathCycle();
};

const stopBreathingGuide = () => {
  // Clear all breathing intervals and timeouts
  breathingIntervalsRef.current.forEach(id => {
    clearInterval(id);
    clearTimeout(id);
  });
  breathingIntervalsRef.current = [];

  if (breathingTimerRef.current) {
    clearTimeout(breathingTimerRef.current);
    breathingTimerRef.current = null;
  }

  setBreathingPhase('in');
  setBreathCount(4);
};

const startCalmMode = async () => {
  setIsCalmMode(true);
  await startHeartbeat();
  startBreathingGuide();
  console.log('Calm Mode activated');
};

const stopCalmMode = () => {
  setIsCalmMode(false);
  stopHeartbeat();
  stopBreathingGuide();
  console.log('Calm Mode deactivated');
};

const toggleCalmMode = async () => {
  if (isCalmMode) {
    stopCalmMode();
  } else {
    await startCalmMode();
  }
};

if (step === 'welcome') {
return (
<div style={{
minHeight: '100vh',
background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
padding: '20px',
fontFamily: 'system-ui, sans-serif'
}}>
<div style={{
width: '100%',
maxWidth: '1200px',
background: 'rgba(255, 255, 255, 0.1)',
padding: '60px 40px',
borderRadius: '20px',
textAlign: 'center',
backdropFilter: 'blur(10px)'
}}>
{/* Logo and Title - Matching therapy page styling */}
<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '40px'
}}>
  <img
    src={logo}
    alt="TinniTune Logo"
    style={{
      width: '80px',
      height: '80px',
      borderRadius: '20px',
      boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)'
    }}
  />
  <div>
    <h1 style={{
      color: '#4ECDC4',
      margin: 0,
      fontSize: '32px',
      fontWeight: '700',
      letterSpacing: '-0.5px',
      textShadow: '0 2px 8px rgba(78, 205, 196, 0.3)'
    }}>
      TinniTune™
    </h1>
    <p style={{
      color: 'rgba(255, 255, 255, 0.7)',
      margin: '8px 0 0 0',
      fontSize: '14px',
      fontWeight: '600',
      letterSpacing: '0.3px'
    }}>
      Sound therapy for tinnitus relief
    </p>
  </div>
</div>

{/* Therapy Goals & Progress Section */}
{goalsLoaded && sessions.length > 0 && (
  <div style={{
    marginBottom: '30px',
    textAlign: 'left'
  }}>
    <h2 style={{
      color: '#4ECDC4',
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      🎯 Your Therapy Goals
    </h2>

    {/* Today's Progress */}
    {(() => {
      const todayProgress = getTodayProgress(sessions);
      const progressPercent = Math.min(100, todayProgress.percentage);
      const minutes = Math.floor(todayProgress.totalSeconds / 60);
      const goalMinutes = Math.floor(todayProgress.goalSeconds / 60);

      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.15), rgba(78, 205, 196, 0.08))',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '15px',
          border: '1px solid rgba(78, 205, 196, 0.3)'
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            Today's Progress
          </div>

          {/* Progress Bar */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            height: '20px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              background: todayProgress.goalMet
                ? 'linear-gradient(90deg, #4ECDC4, #44B3AA)'
                : 'linear-gradient(90deg, #FFB74D, #FFA726)',
              height: '100%',
              width: `${progressPercent}%`,
              transition: 'width 0.5s ease',
              borderRadius: '10px'
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              {minutes} min / {goalMinutes} min
            </span>
            <span style={{ color: '#4ECDC4', fontSize: '13px', fontWeight: '600' }}>
              {progressPercent.toFixed(0)}%
            </span>
          </div>

          {/* Encouragement Message */}
          <div style={{
            marginTop: '10px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '12px',
            fontStyle: 'italic'
          }}>
            {getDailyEncouragementMessage(minutes, goalMinutes)}
          </div>

          {/* Clinical guidance */}
          {minutes > 0 && minutes < 30 && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'rgba(255, 183, 77, 0.15)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 183, 77, 0.3)',
              color: 'rgba(255, 183, 77, 0.9)',
              fontSize: '11px'
            }}>
              💡 Research shows 2-3 hours daily provides the greatest relief
            </div>
          )}
        </div>
      );
    })()}

    {/* This Week */}
    {(() => {
      const weekProgress = getWeekProgress(sessions);

      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(102, 126, 234, 0.08))',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '15px',
          border: '1px solid rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            This Week
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '13px'
          }}>
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
              • {weekProgress.daysActive}/7 days active
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
              • {Math.floor(weekProgress.totalSeconds / 3600)} hours total
            </div>
          </div>

          {therapyGoals.currentStreak > 0 && (
            <div style={{
              marginTop: '10px',
              color: '#FFB74D',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              🔥 {therapyGoals.currentStreak}-day streak!
            </div>
          )}
        </div>
      );
    })()}

    {/* Habituation Journey */}
    {(() => {
      const stage = getHabituationStage();
      const monthsElapsed = therapyGoals.therapyStartDate
        ? Math.floor((Date.now() - new Date(therapyGoals.therapyStartDate)) / (1000 * 60 * 60 * 24 * 30))
        : 0;

      if (stage.stage === 0) return null; // Don't show if therapy hasn't started

      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.15), rgba(240, 147, 251, 0.08))',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '15px',
          border: '1px solid rgba(240, 147, 251, 0.3)'
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            {stage.emoji} Habituation Journey
          </div>

          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '13px',
            marginBottom: '10px'
          }}>
            {stage.name} • Month {monthsElapsed + 1}
          </div>

          {/* Progress Bar for Current Stage */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #f093fb, #f5576c)',
              height: '100%',
              width: `${(monthsElapsed / 12) * 100}%`,
              borderRadius: '10px'
            }} />
          </div>

          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '12px',
            fontStyle: 'italic'
          }}>
            {stage.message}
          </div>
        </div>
      );
    })()}

    {/* Progress Trends */}
    {(() => {
      const trends = getProgressTrends(sessions);

      if (!trends) return null;

      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(252, 227, 138, 0.15), rgba(252, 227, 138, 0.08))',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(252, 227, 138, 0.3)'
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            Recent Progress
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.8)'
          }}>
            <div>
              Loudness: {trends.loudness.earlier.toFixed(1)} → {trends.loudness.recent.toFixed(1)}
              <span style={{
                color: trends.loudness.improving ? '#4ECDC4' : '#FFB74D',
                marginLeft: '5px'
              }}>
                ({trends.loudness.change > 0 ? '-' : '+'}{Math.abs(trends.loudness.change).toFixed(0)}%)
              </span>
            </div>
            <div>
              Distress: {trends.distress.earlier.toFixed(1)} → {trends.distress.recent.toFixed(1)}
              <span style={{
                color: trends.distress.improving ? '#4ECDC4' : '#FFB74D',
                marginLeft: '5px'
              }}>
                ({trends.distress.change > 0 ? '-' : '+'}{Math.abs(trends.distress.change).toFixed(0)}%)
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '8px',
            color: trends.loudness.improving || trends.distress.improving ? '#4ECDC4' : '#FFB74D',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {trends.loudness.improving || trends.distress.improving ? '↓ Improving trend' : '→ Tracking progress'}
          </div>
        </div>
      );
    })()}

    {/* Achievement Showcase */}
    {therapyGoalsHook.achievements && (
      <div style={{
        background: 'linear-gradient(135deg, rgba(252, 206, 138, 0.15), rgba(252, 206, 138, 0.08))',
        padding: '20px',
        borderRadius: '12px',
        marginTop: '15px',
        border: '1px solid rgba(252, 206, 138, 0.3)'
      }}>
        <div style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🏆 Your Achievements
        </div>

        {/* Achievement Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '12px'
        }}>
          {therapyGoalsHook.achievements.map(achievement => {
            const isUnlocked = therapyGoals.achievements.some(a => a.id === achievement.id);

            return (
              <div
                key={achievement.id}
                title={isUnlocked ? `${achievement.name}: ${achievement.description}` : '🔒 Locked'}
                style={{
                  background: isUnlocked
                    ? 'rgba(78, 205, 196, 0.2)'
                    : 'rgba(0, 0, 0, 0.3)',
                  padding: '12px 8px',
                  borderRadius: '12px',
                  border: isUnlocked
                    ? '2px solid rgba(78, 205, 196, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isUnlocked ? 1 : 0.4
                }}
                onMouseEnter={(e) => {
                  if (isUnlocked) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(78, 205, 196, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: '32px',
                  marginBottom: '4px'
                }}>
                  {isUnlocked ? achievement.emoji : '🔒'}
                </div>
                <div style={{
                  color: isUnlocked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                  fontSize: '10px',
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}>
                  {achievement.name.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievement stats */}
        <div style={{
          marginTop: '12px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '12px'
        }}>
          {therapyGoals.achievements.length} / {therapyGoalsHook.achievements.length} unlocked
        </div>
      </div>
    )}
  </div>
)}

{/* iOS Install Prompt */}
{showInstallPrompt && isIOS && !isStandalone && (
  <div style={{
    background: 'rgba(78, 205, 196, 0.15)',
    border: '2px solid #4ECDC4',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    textAlign: 'left',
    position: 'relative'
  }}>
    <button
      onClick={() => {
        setShowInstallPrompt(false);
        localStorage.setItem('tinnitune_seen_install_prompt', 'true');
      }}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'transparent',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '0',
        width: '24px',
        height: '24px'
      }}
    >
      ✕
    </button>

    <div style={{ fontSize: '24px', marginBottom: '10px' }}>📱</div>
    <h3 style={{
      color: '#4ECDC4',
      margin: '0 0 10px 0',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      Install TinniTune
    </h3>
    <p style={{
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '14px',
      margin: '0 0 15px 0',
      lineHeight: '1.5'
    }}>
      Add TinniTune to your home screen for the best experience:
    </p>
    <ol style={{
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '13px',
      paddingLeft: '20px',
      margin: '0',
      lineHeight: '1.6'
    }}>
      <li>Tap the Share button <span style={{ fontSize: '16px' }}>⬆️</span> at the bottom</li>
      <li>Scroll and tap "Add to Home Screen"</li>
      <li>Tap "Add"</li>
    </ol>
  </div>
)}

{/* Profile Selector */}
{profilesLoaded && profiles.length > 0 && (
  <div style={{
    background: 'rgba(102, 126, 234, 0.15)',
    border: '2px solid #667eea',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'left'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
      <h3 style={{
        color: '#667eea',
        margin: '0',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        User Profile
      </h3>
      <button
        onClick={() => setShowProfileManager(true)}
        style={{
          background: 'rgba(102, 126, 234, 0.2)',
          color: '#667eea',
          border: '1px solid #667eea',
          padding: '6px 12px',
          fontSize: '12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Manage Profiles
      </button>
    </div>
    <div style={{
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    }}>
      {profiles.map(profile => (
        <button
          key={profile.id}
          onClick={() => switchProfile(profile.id)}
          style={{
            background: profile.id === activeProfileId
              ? 'linear-gradient(135deg, #667eea, #764ba2)'
              : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: profile.id === activeProfileId ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
            padding: '10px 20px',
            fontSize: '14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: profile.id === activeProfileId ? 'bold' : 'normal',
            flex: '1',
            minWidth: '100px'
          }}
        >
          {profile.name}
        </button>
      ))}
    </div>
    <button
      onClick={() => setShowNewProfileModal(true)}
      style={{
        background: 'transparent',
        color: '#667eea',
        border: '2px dashed #667eea',
        padding: '10px 20px',
        fontSize: '14px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        width: '100%',
        marginTop: '10px'
      }}
    >
      + Add New Profile
    </button>
  </div>
)}

{/* Quick Access Favorites - Show if user has calibration and favorites */}
{settingsLoaded && hasCalibration() && activeProfile && userSettings.favorites && userSettings.favorites.length > 0 && (
  <div style={{
    background: 'linear-gradient(135deg, rgba(252, 227, 138, 0.15), rgba(252, 227, 138, 0.08))',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '2px solid rgba(252, 227, 138, 0.4)',
    textAlign: 'left'
  }}>
    <h3 style={{
      color: '#FCE38A',
      margin: '0 0 15px 0',
      fontSize: '18px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span>⭐</span>
      <span>Quick Start</span>
    </h3>
    <p style={{
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '13px',
      marginBottom: '15px'
    }}>
      Jump straight into therapy with your saved presets:
    </p>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '10px'
    }}>
      {userSettings.favorites.map(fav => (
        <div key={fav.id} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              loadFavorite(fav.id);
              setActiveFavoriteId(fav.id); // Track which favorite is loaded

              // Handle calm mode based on favorite settings
              setTimeout(async () => {
                if (fav.calmMode?.enabled) {
                  // This favorite has calm mode enabled - apply settings and start it
                  // Explicitly set calm mode values from favorite before starting
                  setHeartbeatBPM(fav.calmMode.heartbeatBPM || 55);
                  setHeartbeatVolume(fav.calmMode.heartbeatVolume || -15);
                  setIsCalmMode(true);

                  // Wait for state updates to propagate, then start calm mode
                  setTimeout(async () => {
                    await startCalmMode();
                  }, 100);
                } else {
                  // This favorite doesn't have calm mode - stop it if running
                  if (isCalmMode) {
                    stopCalmMode();
                  }
                }
              }, 150); // Delay to allow state updates from loadFavorite

              setStep('therapy');
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(252, 227, 138, 0.25), rgba(252, 227, 138, 0.15))',
              border: '2px solid rgba(252, 227, 138, 0.5)',
              borderRadius: '12px',
              padding: '16px 12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              touchAction: 'manipulation',
              textAlign: 'center',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              alignItems: 'center',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(252, 227, 138, 0.35), rgba(252, 227, 138, 0.25))';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(252, 227, 138, 0.25), rgba(252, 227, 138, 0.15))';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '24px' }}>
              {fav.mode === 'daytime' ? '☀️' : fav.mode === 'evening' ? '🌆' : '🌙'}
            </div>
            <div>{fav.name}</div>
            <div style={{
              fontSize: '11px',
              opacity: 0.7,
              fontWeight: '500'
            }}>
              {fav.mode.charAt(0).toUpperCase() + fav.mode.slice(1)} • {fav.notchEnabled ? 'Notch ON' : 'No Notch'}
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete "${fav.name}"?`)) {
                deleteFavorite(fav.id);
              }
            }}
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: 'rgba(255, 107, 107, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 107, 107, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 107, 107, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
)}

{/* Saved Settings Display */}
{settingsLoaded && hasCalibration() && activeProfile && (
  <div style={{
    background: 'rgba(78, 205, 196, 0.15)',
    border: '2px solid #4ECDC4',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'left'
  }}>
    <h3 style={{
      color: '#4ECDC4',
      margin: '0 0 15px 0',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      {activeProfile?.name}'s Settings
    </h3>
    <div style={{
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '14px',
      lineHeight: '1.8'
    }}>
      <p style={{ margin: '5px 0' }}>
        <strong>Frequency:</strong> {userSettings.frequency} Hz
      </p>
      <p style={{ margin: '5px 0' }}>
        <strong>Ear:</strong> {userSettings.ear === 'both' ? 'Both' : userSettings.ear === 'left' ? 'Left' : 'Right'}
      </p>
      {userSettings.confidence && (
        <p style={{ margin: '5px 0' }}>
          <strong>Confidence:</strong> {userSettings.confidence}%
        </p>
      )}
      <p style={{ margin: '5px 0' }}>
        <strong>Therapy Mode:</strong> {userSettings.mode.charAt(0).toUpperCase() + userSettings.mode.slice(1)}
      </p>
      <p style={{ margin: '5px 0' }}>
        <strong>Notch Filter:</strong> {userSettings.notchEnabled ? `Enabled (${userSettings.notchIntensity})` : 'Disabled'}
      </p>
    </div>
    <div style={{
      display: 'flex',
      gap: '10px',
      marginTop: '15px',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={() => {
          setShowWizard(true);
          setStep('therapy');
        }}
        style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          fontSize: '14px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          flex: '1',
          minWidth: '120px'
        }}
      >
        Continue
      </button>
      <button
        onClick={() => {
          if (window.confirm('This will clear your saved settings and start fresh. Continue?')) {
            resetSettings();
            setStep('setup');
          }
        }}
        style={{
          background: 'rgba(255, 107, 107, 0.2)',
          color: '#ff6b6b',
          border: '2px solid #ff6b6b',
          padding: '12px 24px',
          fontSize: '14px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          flex: '1',
          minWidth: '120px'
        }}
      >
        Reset & Recalibrate
      </button>
    </div>
  </div>
)}

<button
onClick={() => {
// If no profiles exist, show the new profile modal first
if (profiles.length === 0) {
  setShowNewProfileModal(true);
} else {
  setStep('setup');
}
}}
style={{
background: 'linear-gradient(135deg, #667eea, #764ba2)',
color: 'white',
border: 'none',
padding: '18px 48px',
fontSize: '18px',
borderRadius: '12px',
cursor: 'pointer',
fontWeight: 'bold',
display: hasCalibration() ? 'none' : 'block',
touchAction: 'manipulation',
WebkitTapHighlightColor: 'rgba(0,0,0,0)'
}}
>
{profiles.length === 0 ? 'Create Profile' : 'Begin Setup'}
</button>

    {/* New Profile Modal */}
    {showNewProfileModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          padding: '30px',
          borderRadius: '16px',
          maxWidth: '400px',
          width: '100%',
          border: '2px solid #667eea'
        }}>
          <h3 style={{
            color: 'white',
            margin: '0 0 20px 0',
            fontSize: '24px'
          }}>
            Create New Profile
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            Enter a name for this user profile. Each profile stores its own calibration and preferences.
          </p>
          <input
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder="e.g., John, Mom, Dad"
            maxLength={20}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              marginBottom: '20px',
              boxSizing: 'border-box'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newProfileName.trim()) {
                const wasFirstProfile = profiles.length === 0;
                const profile = createProfile(newProfileName);
                setNewProfileName('');
                setShowNewProfileModal(false);
                if (wasFirstProfile) {
                  setStep('setup');
                }
              }
            }}
          />
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => {
                setShowNewProfileModal(false);
                setNewProfileName('');
              }}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                touchAction: 'manipulation'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (newProfileName.trim()) {
                  const wasFirstProfile = profiles.length === 0;
                  const profile = createProfile(newProfileName);
                  setNewProfileName('');
                  setShowNewProfileModal(false);
                  if (wasFirstProfile) {
                    setStep('setup');
                  }
                }
              }}
              disabled={!newProfileName.trim()}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: 'none',
                background: newProfileName.trim()
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                cursor: newProfileName.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                opacity: newProfileName.trim() ? 1 : 0.5,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'rgba(0,0,0,0)'
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Profile Manager Modal */}
    {showProfileManager && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          padding: '30px',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          border: '2px solid #667eea',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <h3 style={{
            color: 'white',
            margin: '0 0 20px 0',
            fontSize: '24px'
          }}>
            Manage Profiles
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px'
          }}>
            {profiles.map(profile => (
              <div
                key={profile.id}
                style={{
                  background: profile.id === activeProfileId
                    ? 'rgba(102, 126, 234, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  padding: '15px',
                  borderRadius: '12px',
                  border: profile.id === activeProfileId
                    ? '2px solid #667eea'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {profile.name}
                    {profile.id === activeProfileId && (
                      <span style={{
                        marginLeft: '10px',
                        fontSize: '12px',
                        color: '#4ECDC4',
                        fontWeight: 'normal'
                      }}>
                        (Active)
                      </span>
                    )}
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '12px'
                  }}>
                    Created: {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {profile.id !== activeProfileId && (
                    <button
                      onClick={() => {
                        switchProfile(profile.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid #4ECDC4',
                        background: 'rgba(78, 205, 196, 0.2)',
                        color: '#4ECDC4',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        touchAction: 'manipulation'
                      }}
                    >
                      Switch
                    </button>
                  )}
                  {profiles.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete profile "${profile.name}"? This will permanently remove all their calibration data.`)) {
                          deleteProfile(profile.id);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ff6b6b',
                        background: 'rgba(255, 107, 107, 0.2)',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        touchAction: 'manipulation'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setShowProfileManager(false);
              setShowNewProfileModal(true);
            }}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px dashed #667eea',
              background: 'transparent',
              color: '#667eea',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginBottom: '10px',
              touchAction: 'manipulation'
            }}
          >
            + Add New Profile
          </button>
          <button
            onClick={() => setShowProfileManager(false)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              touchAction: 'manipulation'
            }}
          >
            Close
          </button>
        </div>
      </div>
    )}

</div>
</div>
);
}

if (step === 'setup') {
  // 3AFC Testing Mode (Clinical-Grade 95% Accuracy)
  if (use3AFCTesting) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '800px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '50px 40px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(243, 129, 129, 0.3)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h2 style={{ color: 'white', fontSize: '32px', margin: 0, marginBottom: '8px' }}>
                🎯 3AFC Frequency Test
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
                Clinical-grade testing • 95% accuracy • No octave confusion
              </p>
            </div>
            <button
              onClick={() => {
                setUse3AFCTesting(false);
                setUseAdvancedCalibration(false);
              }}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ← Back
            </button>
          </div>

          {/* Info Box */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(243, 129, 129, 0.15), rgba(252, 227, 138, 0.15))',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '1px solid rgba(243, 129, 129, 0.3)'
          }}>
            <h3 style={{ color: '#FCE38A', fontSize: '18px', marginTop: 0, marginBottom: '12px' }}>
              How This Works:
            </h3>
            <ol style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
              <li>You'll hear <strong>3 tones</strong> played in sequence</li>
              <li>Select the tone that <strong>sounds most like your tinnitus</strong></li>
              <li>The test adapts based on your choices</li>
              <li>Takes about <strong>4-6 minutes</strong> (8-15 rounds)</li>
              <li>Results in <strong>95%+ accuracy</strong> with no octave confusion</li>
            </ol>
          </div>

          {/* Test Status */}
          {!isTestingFrequency && !currentTestSet && (
            <div>
              {/* Ear Selection */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '15px' }}>
                  Which ear has tinnitus?
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['left', 'right', 'both'].map(earOption => (
                    <button
                      key={earOption}
                      onClick={() => setEar(earOption)}
                      style={{
                        flex: 1,
                        padding: '16px',
                        background: ear === earOption
                          ? 'linear-gradient(135deg, #F38181, #FCE38A)'
                          : 'rgba(255,255,255,0.1)',
                        color: ear === earOption ? 'white' : 'rgba(255,255,255,0.6)',
                        border: ear === earOption ? '2px solid #F38181' : '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: ear === earOption ? '700' : '500',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s'
                      }}
                    >
                      {earOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={async () => {
                  try {
                    console.log('🎯 Initializing 3AFC frequency test...');

                    // Initialize engine if not already
                    let activeEngine = engineInstance;
                    if (!activeEngine) {
                      console.log('Creating audio engine for 3AFC test...');
                      activeEngine = getAudioEngine({ enableLogging: true });
                      setEngineInstance(activeEngine);
                    }

                    // Initialize (or re-initialize if context was suspended)
                    console.log('Initializing audio engine...');
                    await activeEngine.initialize();

                    // Create 3AFC tester (use activeEngine, not engineInstance!)
                    const tester = new ThreeAFCTester(activeEngine, {
                      startFrequency: 4000,
                      minFrequency: 250,
                      maxFrequency: 16000,
                      initialStepSize: 1,      // 1 octave instead of 2 - keeps tones in audible range
                      targetPrecision: 0.1
                    });

                    setAfcTester(tester);

                    // Start the test (but don't play tones yet!)
                    const testPromise = tester.startTest(ear);

                    // Store the promise for later
                    tester._testPromise = testPromise;

                    // Set ready state - this shows the "Play First Set" button
                    setTestReady(true);
                    setIsTestingFrequency(true);
                    setTestIteration(1);

                    // Wait for test completion in background
                    testPromise.then(result => {
                      // Test complete!
                      console.log('✅ 3AFC test complete:', result);
                      setFrequency(Math.round(result.frequency));
                      setIsTestingFrequency(false);
                      setCurrentTestSet(null);
                      setTestReady(false);

                      // Save calibration to user settings
                      saveCalibration(Math.round(result.frequency), ear, result.confidence);

                      alert(`✅ Frequency matched!\n\n` +
                            `Frequency: ${Math.round(result.frequency)} Hz\n` +
                            `Confidence: ${result.confidence}%\n` +
                            `Iterations: ${result.iterations}\n\n` +
                            `This is ${result.confidence >= 85 ? 'highly accurate' : 'accurate'} frequency matching!`);

                      // Move to therapy
                      setStep('therapy');
                      setCalibrationStage('complete');
                    }).catch(error => {
                      console.error('3AFC test error:', error);
                      alert('Error during test: ' + error.message);
                      setIsTestingFrequency(false);
                      setCurrentTestSet(null);
                      setTestReady(false);
                    });

                  } catch (error) {
                    console.error('3AFC test setup error:', error);

                    // User-friendly error message
                    let errorMsg = '⚠️ Audio Initialization Error\n\n';

                    if (error.message.includes('Audio initialization failed')) {
                      errorMsg += 'Could not start audio playback.\n\n';
                      errorMsg += '🔄 FIRST TRY THIS:\n';
                      errorMsg += '1. Hard reload to clear cache:\n';
                      errorMsg += '   iOS Safari: Hold ⟳ → "Reload Without Content Blockers"\n';
                      errorMsg += '   Or close tab completely and reopen\n\n';
                      errorMsg += '📱 IF STILL FAILING:\n';
                      errorMsg += '• Check device volume (not muted)\n';
                      errorMsg += '• Turn off Low Power Mode\n';
                      errorMsg += '• Try with headphones\n';
                      errorMsg += '• Update Safari/iOS if available\n\n';
                      errorMsg += 'Tech details: ' + error.message;
                    } else {
                      errorMsg += error.message;
                    }

                    alert(errorMsg);
                    setIsTestingFrequency(false);
                    setTestReady(false);
                  }
                }}
                disabled={!ear}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: !ear
                    ? 'rgba(255,255,255,0.1)'
                    : 'linear-gradient(135deg, #F38181, #FCE38A)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: !ear ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: '700',
                  boxShadow: !ear ? 'none' : '0 8px 24px rgba(243, 129, 129, 0.4)',
                  transition: 'all 0.3s',
                  opacity: !ear ? 0.5 : 1
                }}
              >
                🎵 Start 3AFC Frequency Test
              </button>
            </div>
          )}

          {/* Ready to Start - Show buttons immediately with play button */}
          {isTestingFrequency && testReady && !currentTestSet && (
            <div>
              {/* Brief Instructions */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(68, 160, 141, 0.15))',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '20px',
                border: '2px solid rgba(78, 205, 196, 0.4)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎧</div>
                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: 0, marginBottom: '12px' }}>
                  Step 1 of ~12
                </h2>
                <p style={{ color: '#4ECDC4', fontSize: '16px', fontWeight: '600', margin: 0, marginBottom: '8px' }}>
                  Click "Play Tones" → Listen → Select which matched your tinnitus
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
                  💡 The buttons below will stay visible while tones play
                </p>
              </div>

              {/* Play Tones Button */}
              <button
                onClick={async () => {
                  console.log('🔘 Button clicked!');
                  console.log('afcTester exists?', !!afcTester);
                  console.log('afcTester:', afcTester);

                  if (!afcTester) {
                    alert('⚠️ Audio test not initialized!\n\nThe frequency tester failed to start. Please:\n1. Reload the page\n2. Try the test again\n3. Check browser console for errors');
                    console.error('❌ afcTester is null or undefined');
                    return;
                  }

                  console.log('✓ afcTester exists, proceeding...');
                  console.log('▶️ Playing first test set...');

                  try {
                    // Show selection buttons and initialize
                    console.log('Setting up test state...');
                    const testSet = afcTester.currentSet || afcTester.generateTestSet();
                    console.log('Test set generated:', testSet);

                    setCurrentTestSet(testSet);
                    setTestReady(false);
                    setTestIteration(1);
                    setTestHistory([]);

                    // Visual feedback: tones are playing
                    console.log('Setting isPlayingTones = true');
                    setIsPlayingTones(true);

                    // Play tones AFTER buttons are visible
                    console.log('Calling afcTester.playTestSet()...');
                    await afcTester.playTestSet();

                    console.log('✓ All tones played successfully');
                  } catch (error) {
                    console.error('❌ Error playing tones:', error);
                    console.error('Error stack:', error.stack);
                    alert('⚠️ Audio playback failed!\n\nError: ' + error.message + '\n\nCheck browser console for details.');
                  } finally {
                    console.log('Setting isPlayingTones = false');
                    setIsPlayingTones(false);
                  }
                }}
                disabled={isPlayingTones}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: isPlayingTones
                    ? 'linear-gradient(135deg, #FCE38A, #F38181)'
                    : 'linear-gradient(135deg, #4ECDC4, #44A08D)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: isPlayingTones ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: '700',
                  boxShadow: '0 6px 24px rgba(78, 205, 196, 0.4)',
                  marginBottom: '20px',
                  opacity: isPlayingTones ? 0.8 : 1
                }}
              >
                {isPlayingTones ? '🔊 Playing Tones...' : '▶️ Play 3 Tones'}
              </button>

              {/* Selection Buttons - Visible from start */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.15), rgba(68, 160, 141, 0.1))',
                padding: '20px',
                borderRadius: '14px',
                marginBottom: '16px',
                border: '2px solid rgba(78, 205, 196, 0.3)'
              }}>
                <p style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '14px',
                  fontWeight: '600',
                  margin: 0,
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  After playing, select which tone matched best:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  opacity: 0.6
                }}>
                  {[0, 1, 2].map(index => (
                    <div
                      key={index}
                      style={{
                        padding: '24px 16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255,255,255,0.6)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                        {index === 0 ? '1️⃣' : index === 1 ? '2️⃣' : '3️⃣'}
                      </div>
                      <div style={{ fontSize: '13px' }}>
                        {index === 0 ? 'First' : index === 1 ? 'Second' : 'Third'} Tone
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setIsTestingFrequency(false);
                  setTestReady(false);
                  if (afcTester) {
                    afcTester.isRunning = false;
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                ← Cancel and Go Back
              </button>
            </div>
          )}

          {/* Test In Progress - Progressive Step-by-Step UI */}
          {isTestingFrequency && !testReady && currentTestSet && (
            <div>
              {/* Progress Header */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(68, 160, 141, 0.15))',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '24px',
                border: '2px solid rgba(78, 205, 196, 0.4)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>
                    Step {testIteration} of ~12
                  </span>
                  <span style={{ color: '#4ECDC4', fontSize: '16px', fontWeight: '600' }}>
                    {Math.round((testIteration / 12) * 100)}% Complete
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(testIteration / 12) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4ECDC4, #44A08D)',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              {/* All Steps List - Shows history + current step */}
              <div style={{ marginBottom: '20px', maxHeight: '500px', overflowY: 'auto' }}>
                {/* Previous Steps */}
                {testHistory.map((historyItem, stepNum) => (
                  <div
                    key={stepNum}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      opacity: 0.7
                    }}
                  >
                    <div style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>✓ Step {stepNum + 1} Complete</span>
                      <button
                        onClick={async () => {
                          // Go back to this step
                          if (window.confirm(`Go back to Step ${stepNum + 1}? This will reset all steps after this one.`)) {
                            // Truncate history to everything BEFORE this step
                            setTestHistory(prev => prev.slice(0, stepNum));

                            // Reset to this step
                            setTestIteration(stepNum + 1);
                            setCurrentTestSet(historyItem);

                            // User can now replay and make different selection
                            console.log(`Reverted to Step ${stepNum + 1}`);
                          }
                        }}
                        style={{
                          padding: '4px 12px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px'
                    }}>
                      {historyItem.frequencies.map((freq, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px',
                            background: historyItem.selectedIndex === idx
                              ? 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(68, 160, 141, 0.3))'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: historyItem.selectedIndex === idx
                              ? '2px solid #4ECDC4'
                              : '2px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: historyItem.selectedIndex === idx ? '#4ECDC4' : 'rgba(255,255,255,0.5)',
                            fontSize: '13px',
                            fontWeight: historyItem.selectedIndex === idx ? '700' : '500'
                          }}
                        >
                          {historyItem.selectedIndex === idx && <div style={{ fontSize: '18px', marginBottom: '4px' }}>✓</div>}
                          {Math.round(freq)} Hz
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Current Step - Highlighted */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.25), rgba(68, 160, 141, 0.2))',
                  padding: '20px',
                  borderRadius: '16px',
                  marginBottom: '12px',
                  border: '3px solid #4ECDC4',
                  boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                }}>
                  <div style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>
                    🎧 Step {testIteration} - Listen & Select
                  </div>

                  {/* Play Tones Button - Always visible */}
                  <button
                    onClick={async () => {
                      console.log('🔘 Step button clicked!');
                      console.log('afcTester exists?', !!afcTester);

                      if (!afcTester) {
                        alert('⚠️ Audio test not initialized!\n\nPlease reload the page and try again.');
                        console.error('❌ afcTester is null or undefined');
                        return;
                      }

                      try {
                        console.log('▶️ Playing tones for current step...');
                        setIsPlayingTones(true);

                        await afcTester.playTestSet();

                        console.log('✓ All tones played successfully');
                      } catch (error) {
                        console.error('❌ Error playing tones:', error);
                        console.error('Error stack:', error.stack);
                        alert('⚠️ Audio playback failed!\n\nError: ' + error.message + '\n\nCheck browser console for details.');
                      } finally {
                        setIsPlayingTones(false);
                      }
                    }}
                    disabled={isPlayingTones}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: isPlayingTones
                        ? 'linear-gradient(135deg, #FCE38A, #F38181)'
                        : 'linear-gradient(135deg, #4ECDC4, #44A08D)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isPlayingTones ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: '700',
                      boxShadow: '0 4px 16px rgba(78, 205, 196, 0.4)',
                      marginBottom: '16px',
                      opacity: isPlayingTones ? 0.8 : 1
                    }}
                  >
                    {isPlayingTones ? '🔊 Playing Tones...' : '▶️ Play 3 Tones'}
                  </button>

                  <p style={{
                    color: '#4ECDC4',
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: 0,
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    After listening, select which tone matched best:
                  </p>

                  {/* Current Step Tone Buttons */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                  }}>
                    {[0, 1, 2].map(index => (
                      <button
                        key={index}
                        onClick={async () => {
                          if (!afcTester || !afcTester.isRunning) return;

                          console.log(`User selected tone ${index + 1}`);

                          // Save current step to history (full test set + selection)
                          const historyEntry = {
                            ...currentTestSet,
                            selectedIndex: index,
                            stepNum: testIteration
                          };
                          setTestHistory(prev => [...prev, historyEntry]);

                          // Submit selection
                          afcTester.submitSelection(index);

                          // If test continues, advance to next step (but DON'T auto-play)
                          if (afcTester.isRunning) {
                            const nextSet = afcTester.currentSet;
                            setCurrentTestSet(nextSet);
                            setTestIteration(prev => prev + 1);
                            // Removed auto-play - user must click "Play 3 Tones" button
                          }
                        }}
                        style={{
                          padding: '20px 12px',
                          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(68, 160, 141, 0.3))',
                          color: 'white',
                          border: '3px solid rgba(78, 205, 196, 0.6)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: '700',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-4px) scale(1.05)';
                          e.target.style.boxShadow = '0 12px 32px rgba(78, 205, 196, 0.5)';
                          e.target.style.borderColor = '#4ECDC4';
                          e.target.style.background = 'linear-gradient(135deg, rgba(78, 205, 196, 0.5), rgba(68, 160, 141, 0.5))';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                          e.target.style.borderColor = 'rgba(78, 205, 196, 0.6)';
                          e.target.style.background = 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(68, 160, 141, 0.3))';
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: '6px' }}>
                          {index === 0 ? '1️⃣' : index === 1 ? '2️⃣' : '3️⃣'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#4ECDC4', fontWeight: '600' }}>
                          {Math.round(currentTestSet.frequencies[index])} Hz
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={() => {
                    if (window.confirm('Restart from the beginning?')) {
                      setIsTestingFrequency(false);
                      setCurrentTestSet(null);
                      setTestIteration(0);
                      setTestReady(false);
                      setTestHistory([]);
                      if (afcTester) {
                        afcTester.isRunning = false;
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  ↺ Restart Test
                </button>
              </div>

              {/* Skip Option */}
              <button
                onClick={() => {
                  const manualFreq = prompt('Enter your tinnitus frequency (250-16000 Hz):', '4000');
                  if (manualFreq) {
                    const freq = parseInt(manualFreq);
                    if (freq >= 250 && freq <= 16000) {
                      setFrequency(freq);
                      setIsTestingFrequency(false);
                      setCurrentTestSet(null);
                      setTestReady(false);
                      setTestHistory([]);
                      setStep('therapy');
                      setCalibrationStage('complete');
                      if (afcTester) {
                        afcTester.isRunning = false;
                      }
                    } else {
                      alert('Please enter a frequency between 250 and 16000 Hz');
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 165, 0, 0.15)',
                  color: 'rgba(255, 165, 0, 0.9)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                ⚡ Skip - Enter Frequency Manually
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Simple mode (original setup)
  if (!useAdvancedCalibration) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '600px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '50px 40px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: 'white', fontSize: '32px', margin: 0 }}>
              Setup Your Therapy
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setUse3AFCTesting(true);
                  setUseAdvancedCalibration(false);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #F38181, #FCE38A)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(243, 129, 129, 0.3)'
                }}
              >
                🎯 3AFC Test (95% Accurate)
              </button>
              <button
                onClick={() => setUseAdvancedCalibration(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#4ECDC4',
                  border: '1px solid #4ECDC4',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Advanced Mode
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '15px' }}>
              Which ear has tinnitus?
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['left', 'both', 'right'].map(e => (
                <button
                  key={e}
                  onClick={() => setEar(e)}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: ear === e ? '#4ECDC4' : 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: ear === e ? 'bold' : 'normal',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '32px', display: 'flex', gap: '4px' }}>
                    {e === 'left' ? (
                      <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>👂</span>
                    ) : e === 'right' ? (
                      '👂'
                    ) : (
                      <>
                        <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>👂</span>
                        <span>👂</span>
                      </>
                    )}
                  </div>
                  <div>{e === 'left' ? 'Left' : e === 'right' ? 'Right' : 'Both'}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '15px' }}>
              Match Your Frequency: {frequency} Hz
            </h3>
            <input
              type="range"
              min="500"
              max="16000"
              step="100"
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}
            />
            <button
              onClick={testTone}
              style={{
                width: '100%',
                padding: '15px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🔊 Test Tone (3 seconds)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setStep('welcome')}
              style={{
                flex: 1,
                padding: '15px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => {
                console.log('Continue clicked');
                setStep('therapy');
              }}
              style={{
                flex: 2,
                padding: '15px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Start Therapy →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Advanced Calibration Wizard
  const WaveformAnimation = () => {
    const maxHeight = 50; // Max bar height in pixels
    const minHeight = 8; // Min bar height in pixels

    return (
      <div style={{
        width: '100%',
        height: '80px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '10px',
        marginTop: '15px'
      }}>
        {isPlayingCalibration ? (
          waveformData.map((value, i) => {
            // Convert waveform value (-1 to 1) to bar height
            const normalizedValue = Math.abs(value);
            const barHeight = minHeight + (normalizedValue * maxHeight);

            return (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: `${barHeight}px`,
                  background: `linear-gradient(to top, #4ECDC4, #44A08D)`,
                  borderRadius: '4px',
                  transition: 'height 0.08s ease-out',
                  boxShadow: '0 2px 4px rgba(78, 205, 196, 0.3)'
                }}
              />
            );
          })
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Click play to see waveform
          </div>
        )}
      </div>
    );
  };

  // Progress bar
  const stages = ['volume', 'ear', 'coarse', 'medium', 'fine', 'octave', 'complete'];
  const currentStageIndex = stages.indexOf(calibrationStage);
  const progress = ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '700px',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: 'white', fontSize: '28px', margin: 0 }}>
            Precision Calibration
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setUse3AFCTesting(true);
                setUseAdvancedCalibration(false);
              }}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #F38181, #FCE38A)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(243, 129, 129, 0.3)'
              }}
            >
              🎯 3AFC Test
            </button>
            <button
              onClick={() => setUseAdvancedCalibration(false)}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Simple Mode
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4ECDC4, #44A08D)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '5px' }}>
            Step {currentStageIndex + 1} of {stages.length}
          </div>
        </div>

        {/* Volume Calibration Stage */}
        {calibrationStage === 'volume' && (
          <div>
            <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '15px' }}>
              Volume Calibration
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px', lineHeight: '1.6' }}>
              First, let's set a comfortable listening volume. The tone should be clearly audible but not uncomfortable.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '10px' }}>
                Volume: {testVolume} dB
              </label>
              <input
                type="range"
                min="-40"
                max="-5"
                step="1"
                value={testVolume}
                onChange={(e) => setTestVolume(parseInt(e.target.value))}
                style={{ width: '100%', marginBottom: '15px' }}
              />
            </div>

            <button
              onClick={() => isPlayingCalibration ? stopCalibrationTone() : playCalibrationTone(1000, 5000)}
              style={{
                width: '100%',
                padding: '15px',
                background: isPlayingCalibration ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '10px'
              }}
            >
              {isPlayingCalibration ? '⏹ Stop' : '🔊 Test Volume (5 seconds)'}
            </button>

            <WaveformAnimation />

            <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep('welcome')}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  stopCalibrationTone();
                  setCalibrationStage('ear');
                }}
                style={{
                  flex: 2,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Ear Selection Stage */}
        {calibrationStage === 'ear' && (
          <div>
            <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '15px' }}>
              Ear Selection
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px', lineHeight: '1.6' }}>
              Which ear(s) experience tinnitus?
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
              {['left', 'both', 'right'].map(e => (
                <button
                  key={e}
                  onClick={() => setEar(e)}
                  style={{
                    flex: 1,
                    padding: '20px',
                    background: ear === e ? '#4ECDC4' : 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: ear === e ? 'bold' : 'normal',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '32px', display: 'flex', gap: '4px' }}>
                    {e === 'left' ? (
                      <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>👂</span>
                    ) : e === 'right' ? (
                      '👂'
                    ) : (
                      <>
                        <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>👂</span>
                        <span>👂</span>
                      </>
                    )}
                  </div>
                  <div>{e === 'left' ? 'Left' : e === 'right' ? 'Right' : 'Both'}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCalibrationStage('volume')}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setCalibrationStage('coarse')}
                style={{
                  flex: 2,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Begin Matching →
              </button>
            </div>
          </div>
        )}

        {/* Coarse Frequency Matching */}
        {calibrationStage === 'coarse' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '10px' }}>
                Round 1: Coarse Match
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px', lineHeight: '1.6' }}>
                Find the general pitch range. Adjust the slider to match your tinnitus pitch. Don't worry about being exact yet.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '10px', fontSize: '18px' }}>
                Frequency: {coarseFreq} Hz
              </label>
              <input
                type="range"
                min="500"
                max="16000"
                step="500"
                value={coarseFreq}
                onChange={(e) => setCoarseFreq(parseInt(e.target.value))}
                style={{ width: '100%', marginBottom: '15px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                <span>Lower pitch</span>
                <span>Higher pitch</span>
              </div>
            </div>

            <button
              onClick={() => isPlayingCalibration ? stopCalibrationTone() : playCalibrationTone(coarseFreq)}
              style={{
                width: '100%',
                padding: '15px',
                background: isPlayingCalibration ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '10px'
              }}
            >
              {isPlayingCalibration ? '⏹ Stop' : '🔊 Play Tone (3.5 seconds)'}
            </button>

            <WaveformAnimation />

            <div style={{ marginTop: '20px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '10px' }}>
                How confident are you? (1 = Not sure, 5 = Very sure)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setConfidence(rating)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: confidence === rating ? '#4ECDC4' : 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: confidence === rating ? 'bold' : 'normal'
                    }}
                  >
                    {rating}
                  </button>
                ))}
              </div>

              {confidence < 3 && (
                <div style={{
                  padding: '15px',
                  background: 'rgba(255, 193, 7, 0.2)',
                  borderLeft: '4px solid #FFC107',
                  borderRadius: '4px',
                  color: 'white',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  💡 Tip: Make sure your headphones are on and volume is comfortable. Try playing the tone multiple times.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCalibrationStage('ear')}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              {confidence < 3 && (
                <button
                  onClick={() => {
                    setCoarseFreq(4000);
                    setConfidence(3);
                  }}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: 'rgba(255, 193, 7, 0.3)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => {
                  setMediumFreq(coarseFreq);
                  setCalibrationStage('medium');
                  setLastConfidence(confidence);
                }}
                style={{
                  flex: 2,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Next Round →
              </button>
            </div>
          </div>
        )}

        {/* Medium Frequency Matching */}
        {calibrationStage === 'medium' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '10px' }}>
                Round 2: Medium Match
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px', lineHeight: '1.6' }}>
                Fine-tune within a narrower range around {coarseFreq} Hz. Listen carefully for the closest match.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '10px', fontSize: '18px' }}>
                Frequency: {mediumFreq} Hz
              </label>
              <input
                type="range"
                min={Math.max(500, coarseFreq - 2000)}
                max={Math.min(16000, coarseFreq + 2000)}
                step="100"
                value={mediumFreq}
                onChange={(e) => setMediumFreq(parseInt(e.target.value))}
                style={{ width: '100%', marginBottom: '15px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                <span>Lower pitch</span>
                <span>Higher pitch</span>
              </div>
            </div>

            <button
              onClick={() => isPlayingCalibration ? stopCalibrationTone() : playCalibrationTone(mediumFreq)}
              style={{
                width: '100%',
                padding: '15px',
                background: isPlayingCalibration ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '10px'
              }}
            >
              {isPlayingCalibration ? '⏹ Stop' : '🔊 Play Tone (3.5 seconds)'}
            </button>

            <WaveformAnimation />

            <div style={{ marginTop: '20px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '10px' }}>
                How confident are you? (1 = Not sure, 5 = Very sure)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setConfidence(rating)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: confidence === rating ? '#4ECDC4' : 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: confidence === rating ? 'bold' : 'normal'
                    }}
                  >
                    {rating}
                  </button>
                ))}
              </div>

              {confidence < 3 && (
                <div style={{
                  padding: '15px',
                  background: 'rgba(255, 193, 7, 0.2)',
                  borderLeft: '4px solid #FFC107',
                  borderRadius: '4px',
                  color: 'white',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  💡 Tip: Try comparing with nearby frequencies. The difference might be subtle.
                </div>
              )}

              {confidence >= 4 && (
                <div style={{
                  padding: '15px',
                  background: 'rgba(76, 175, 80, 0.2)',
                  borderLeft: '4px solid #4CAF50',
                  borderRadius: '4px',
                  color: 'white',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  ✓ Great! You can skip fine-tuning and proceed to verification.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCalibrationStage('coarse')}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              {confidence < 3 && (
                <button
                  onClick={() => {
                    setMediumFreq(coarseFreq);
                    setConfidence(3);
                  }}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: 'rgba(255, 193, 7, 0.3)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              )}
              {confidence >= 4 ? (
                <button
                  onClick={() => {
                    setFineFreq(mediumFreq);
                    setCalibrationStage('octave');
                  }}
                  style={{
                    flex: 2,
                    padding: '15px',
                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Skip to Verification →
                </button>
              ) : (
                <button
                  onClick={() => {
                    setFineFreq(mediumFreq);
                    setCalibrationStage('fine');
                    setLastConfidence(confidence);
                  }}
                  style={{
                    flex: 2,
                    padding: '15px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Fine-Tune →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Fine Frequency Matching */}
        {calibrationStage === 'fine' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '10px' }}>
                Round 3: Fine Match
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px', lineHeight: '1.6' }}>
                Final precision adjustment. Make small changes to find the exact match around {mediumFreq} Hz.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '10px', fontSize: '18px' }}>
                Frequency: {fineFreq} Hz
              </label>
              <input
                type="range"
                min={Math.max(500, mediumFreq - 500)}
                max={Math.min(16000, mediumFreq + 500)}
                step="10"
                value={fineFreq}
                onChange={(e) => setFineFreq(parseInt(e.target.value))}
                style={{ width: '100%', marginBottom: '15px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                <span>Slightly lower</span>
                <span>Slightly higher</span>
              </div>
            </div>

            <button
              onClick={() => isPlayingCalibration ? stopCalibrationTone() : playCalibrationTone(fineFreq)}
              style={{
                width: '100%',
                padding: '15px',
                background: isPlayingCalibration ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '10px'
              }}
            >
              {isPlayingCalibration ? '⏹ Stop' : '🔊 Play Tone (3.5 seconds)'}
            </button>

            <WaveformAnimation />

            <div style={{ marginTop: '20px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '10px' }}>
                How confident are you? (1 = Not sure, 5 = Very sure)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setConfidence(rating)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: confidence === rating ? '#4ECDC4' : 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: confidence === rating ? 'bold' : 'normal'
                    }}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCalibrationStage('medium')}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              {confidence < 3 && (
                <button
                  onClick={() => {
                    setFineFreq(mediumFreq);
                    setConfidence(3);
                  }}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: 'rgba(255, 193, 7, 0.3)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => {
                  setCalibrationStage('octave');
                  setLastConfidence(confidence);
                }}
                style={{
                  flex: 2,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Verify Match →
              </button>
            </div>
          </div>
        )}

        {/* Octave Check */}
        {calibrationStage === 'octave' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '10px' }}>
                Octave Verification
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px', lineHeight: '1.6' }}>
                Let's verify your match. Which tone sounds closer to your tinnitus?
              </p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <button
                onClick={() => playCalibrationTone(fineFreq)}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  marginBottom: '15px',
                  fontWeight: 'bold'
                }}
              >
                🔊 Your Match: {fineFreq} Hz
              </button>

              <button
                onClick={() => playCalibrationTone(fineFreq / 2)}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  marginBottom: '10px'
                }}
              >
                🔊 Lower Octave: {Math.round(fineFreq / 2)} Hz
              </button>

              <button
                onClick={() => playCalibrationTone(fineFreq * 2)}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🔊 Higher Octave: {Math.round(fineFreq * 2)} Hz
              </button>

              <WaveformAnimation />
            </div>

            <div style={{
              padding: '15px',
              background: 'rgba(78, 205, 196, 0.2)',
              borderLeft: '4px solid #4ECDC4',
              borderRadius: '4px',
              color: 'white',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              💡 If one of the other tones sounds more accurate, we'll ask you to re-match using that range.
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (octaveCheckAttempt === 0 && lastConfidence < 4) {
                    setOctaveCheckAttempt(1);
                    setCalibrationStage('coarse');
                    setCoarseFreq(Math.round(fineFreq / 2));
                  } else {
                    setFineFreq(Math.round(fineFreq / 2));
                    setCalibrationStage('complete');
                  }
                }}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Lower is closer
              </button>
              <button
                onClick={() => {
                  setCalibrationStage('complete');
                }}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                This is correct ✓
              </button>
              <button
                onClick={() => {
                  if (octaveCheckAttempt === 0 && lastConfidence < 4) {
                    setOctaveCheckAttempt(1);
                    setCalibrationStage('coarse');
                    setCoarseFreq(Math.round(fineFreq * 2));
                  } else {
                    setFineFreq(Math.round(fineFreq * 2));
                    setCalibrationStage('complete');
                  }
                }}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Higher is closer
              </button>
            </div>
          </div>
        )}

        {/* Complete */}
        {calibrationStage === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '15px' }}>
              Calibration Complete!
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '30px', lineHeight: '1.6' }}>
              Your tinnitus frequency has been matched to <strong style={{ color: '#4ECDC4' }}>{fineFreq} Hz</strong>
            </p>

            <div style={{
              padding: '20px',
              background: 'rgba(78, 205, 196, 0.2)',
              borderRadius: '8px',
              marginBottom: '30px'
            }}>
              <div style={{ color: 'white', marginBottom: '10px' }}>
                <strong>Your Settings:</strong>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                Ear: {ear === 'left' ? '👂 Left' : ear === 'right' ? 'Right 👂' : '👂 Both'}<br />
                Frequency: {fineFreq} Hz<br />
                Volume: {testVolume} dB
              </div>
            </div>

            <button
              onClick={() => isPlayingCalibration ? stopCalibrationTone() : playCalibrationTone(fineFreq)}
              style={{
                width: '100%',
                padding: '15px',
                background: isPlayingCalibration ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '30px'
              }}
            >
              {isPlayingCalibration ? '⏹ Stop' : '🔊 Test Your Match'}
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  stopCalibrationTone();
                  setCalibrationStage('octave');
                }}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ← Re-verify
              </button>
              <button
                onClick={handleCalibrationComplete}
                style={{
                  flex: 2,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Start Therapy →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// History screen
if (step === 'history') {
const stats = getStats();
const milestones = getMilestones();
const modeNames = {
daytime: '☀️ Daytime',
evening: '🌅 Evening',
sleep: '🌙 Sleep'
};

// Get sessions with ratings for progress chart
const ratedSessions = sessions.filter(s => s.loudnessAfter !== null).reverse();

return (
  <div style={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #253447 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
  }}>
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
        padding: '16px 24px',
        borderRadius: '20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <h1 style={{ color: '#4ECDC4', margin: 0, fontSize: '22px', fontWeight: '600' }}>
          📊 Session History
        </h1>
        <button
          onClick={() => setStep('therapy')}
          style={{
            padding: '8px 18px',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)'
          }}
        >
          ← Back to Therapy
        </button>
      </div>

      {/* Milestones Banner */}
      {milestones.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.2), rgba(255, 138, 101, 0.2))',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 183, 77, 0.3)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(255, 183, 77, 0.2)'
        }}>
          <h3 style={{ 
            color: '#FFB74D', 
            fontSize: '16px', 
            fontWeight: '700',
            marginBottom: '12px'
          }}>
            🏆 Milestones Achieved
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {milestones.map((milestone, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255, 183, 77, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 183, 77, 0.4)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                {milestone.emoji} {milestone.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#667eea', marginBottom: '8px' }}>
            {stats.totalSessions}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Total Sessions</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(68, 179, 170, 0.2))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#4ECDC4', marginBottom: '8px' }}>
            {Math.floor(stats.totalTime / 3600)}h {Math.floor((stats.totalTime % 3600) / 60)}m
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Total Time</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(240, 147, 251, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f093fb', marginBottom: '8px' }}>
            {formatTime(stats.avgDuration)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Avg Duration</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.2), rgba(255, 138, 101, 0.2))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 183, 77, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#FFB74D', marginBottom: '8px' }}>
            {stats.streak} 🔥
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Day Streak</div>
        </div>
      </div>

      {/* Progress Chart */}
      {ratedSessions.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.25)'
        }}>
          <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '20px', fontWeight: '600' }}>
            📈 Tinnitus Loudness Trend
          </h2>
          
          {/* Simple line chart */}
          <div style={{ position: 'relative', height: '200px', marginBottom: '8px' }}>
            {/* Y-axis labels */}
            <div style={{ 
              position: 'absolute', 
              left: 0, 
              top: 0, 
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              paddingRight: '8px'
            }}>
              <div>10</div>
              <div>8</div>
              <div>6</div>
              <div>4</div>
              <div>2</div>
              <div>0</div>
            </div>

            {/* Chart area */}
            <div style={{ 
              marginLeft: '30px',
              height: '100%',
              position: 'relative',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '10px'
            }}>
              <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                {/* Grid lines */}
                {[0, 2, 4, 6, 8, 10].map(val => (
                  <line
                    key={val}
                    x1="0"
                    y1={`${100 - (val * 10)}%`}
                    x2="100%"
                    y2={`${100 - (val * 10)}%`}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}

                {/* Data line */}
                <polyline
                  points={ratedSessions.map((s, i) => {
                    const x = (i / Math.max(ratedSessions.length - 1, 1)) * 100;
                    const y = 100 - (s.loudnessAfter * 10);
                    return `${x}%,${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke="#4ECDC4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {ratedSessions.map((s, i) => {
                  const x = (i / Math.max(ratedSessions.length - 1, 1)) * 100;
                  const y = 100 - (s.loudnessAfter * 10);
                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill="#4ECDC4"
                      stroke="#0f1419"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Chart footer */}
          <div style={{ 
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            marginTop: '8px'
          }}>
            Last {ratedSessions.length} rated sessions
            {ratedSessions.length >= 2 && (
              <>
                {' • '}
                {ratedSessions[0].loudnessAfter > ratedSessions[ratedSessions.length - 1].loudnessAfter ? (
                  <span style={{ color: '#4ECDC4' }}>↓ Improving</span>
                ) : ratedSessions[0].loudnessAfter < ratedSessions[ratedSessions.length - 1].loudnessAfter ? (
                  <span style={{ color: '#f5576c' }}>↑ Fluctuating</span>
                ) : (
                  <span style={{ color: '#FFB74D' }}>→ Stable</span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Most Used Mode Badge */}
      {stats.mostUsedMode !== 'none' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.15), rgba(78, 205, 196, 0.08))',
          padding: '16px 20px',
          borderRadius: '14px',
          marginBottom: '24px',
          border: '1px solid rgba(78, 205, 196, 0.25)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
            Your go-to mode: 
          </span>
          <span style={{ 
            color: '#4ECDC4', 
            fontSize: '16px', 
            fontWeight: '700',
            marginLeft: '8px'
          }}>
            {modeNames[stats.mostUsedMode]}
          </span>
        </div>
      )}

      {/* Session List */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
        padding: '24px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.25)'
      }}>
        <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '20px', fontWeight: '600' }}>
          Recent Sessions
        </h2>

        {sessions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.5)', 
            padding: '40px',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎧</div>
            No sessions yet. Complete your first therapy session to start tracking progress!
          </div>
        ) : (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {sessions.slice(0, 30).map((session, index) => {
              const sessionDate = new Date(session.date);
              const isToday = new Date().toDateString() === sessionDate.toDateString();
              
              return (
                <div
                  key={session.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ 
                        color: 'white', 
                        fontSize: '15px', 
                        fontWeight: '600',
                        marginBottom: '6px'
                      }}>
                        {isToday ? '🟢 Today' : sessionDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: sessionDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                        {' • '}
                        {sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div style={{ 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: '13px',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <span>{formatTime(session.duration)}</span>
                        <span>•</span>
                        <span>{session.frequency} Hz</span>
                        <span>•</span>
                        <span>{modeNames[session.mode]}</span>
                        {session.notchEnabled && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#4ECDC4' }}>
                              🎯 Notch ({session.notchIntensity})
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Show ratings if available */}
                      {session.loudnessAfter !== null && (
                        <div style={{
                          marginTop: '8px',
                          display: 'flex',
                          gap: '12px',
                          fontSize: '12px'
                        }}>
                          <div style={{
                            background: 'rgba(78, 205, 196, 0.2)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(78, 205, 196, 0.3)'
                          }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Loudness: </span>
                            <span style={{ color: '#4ECDC4', fontWeight: '600' }}>{session.loudnessAfter}/10</span>
                          </div>
                          <div style={{
                            background: 'rgba(240, 147, 251, 0.2)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(240, 147, 251, 0.3)'
                          }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Distress: </span>
                            <span style={{ color: '#f093fb', fontWeight: '600' }}>{session.distress}/10</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Show notes if available */}
                      {session.notes && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.7)',
                          fontStyle: 'italic'
                        }}>
                          "{session.notes}"
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '24px',
                      opacity: 0.7
                    }}>
                      {session.ear === 'left' ? '👂' : session.ear === 'right' ? '👂' : '🎧'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  </div>
);

}

// Show Therapy Setup Wizard
if (showWizard) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #253447 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      paddingTop: '60px'
    }}>
      <TherapySetupWizard
        frequency={frequency}
        ear={ear}
        onComplete={(config) => {
          // Apply wizard configuration
          setMode(config.therapyMode);
          setNotchEnabled(config.notchEnabled);
          setNotchIntensity(config.notchIntensity);
          setIsCalmMode(config.calmMode);
          setHeartbeatBPM(config.heartbeatBPM);

          // Save therapy preferences to user settings
          updateSettings({
            mode: config.therapyMode,
            notchEnabled: config.notchEnabled,
            notchIntensity: config.notchIntensity
          });

          // Save calm mode preferences
          updateCalmMode({
            enabled: config.calmMode,
            heartbeatBPM: config.heartbeatBPM
          });

          // Hide wizard and show therapy
          setShowWizard(false);

          // Start therapy automatically after wizard
          setTimeout(() => {
            if (config.calmMode) {
              // Start calm mode first
              startCalmMode();
            }
            // Start the main therapy
            startTherapy();
          }, 100);
        }}
        onCancel={() => {
          setShowWizard(false);
        }}
      />
    </div>
  );
}

// Therapy screen
return (
<div style={{
minHeight: '100vh',
background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #253447 100%)',
padding: '20px',
fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
position: 'relative',
overflow: 'hidden'
}}>

{/* Current Settings Panel */}
<div style={{
  position: 'fixed',
  top: '10px',
  left: '10px',
  zIndex: 2000,
  background: 'rgba(20, 30, 48, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: '1px solid rgba(78, 205, 196, 0.3)',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  maxWidth: '350px'
}}>
  <button
    onClick={() => setShowSettingsPanel(!showSettingsPanel)}
    style={{
      width: '100%',
      padding: '10px 16px',
      background: 'rgba(78, 205, 196, 0.1)',
      color: '#4ECDC4',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px'
    }}
  >
    <span>📋 Active Settings</span>
    <span style={{ fontSize: '10px' }}>{showSettingsPanel ? '▼' : '▶'}</span>
  </button>

  {showSettingsPanel && (
    <div style={{
      padding: '16px',
      borderTop: '1px solid rgba(78, 205, 196, 0.2)',
      maxHeight: '60vh',
      overflowY: 'auto'
    }}>
      {/* Profile Info */}
      {activeProfile && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{
            color: '#667eea',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            marginBottom: '4px',
            letterSpacing: '0.5px'
          }}>
            User Profile
          </div>
          <div style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {activeProfile.name}
          </div>
        </div>
      )}

      {/* Frequency Settings */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(78, 205, 196, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(78, 205, 196, 0.3)'
      }}>
        <div style={{
          color: '#4ECDC4',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          marginBottom: '8px',
          letterSpacing: '0.5px'
        }}>
          Calibration
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '6px' }}>
            <strong>Frequency:</strong> {frequency} Hz
          </div>
          <div style={{ marginBottom: '6px' }}>
            <strong>Ear:</strong> {ear === 'both' ? 'Both Ears' : ear === 'left' ? 'Left Ear' : 'Right Ear'}
          </div>
          {userSettings.confidence && (
            <div>
              <strong>Confidence:</strong> {userSettings.confidence}%
            </div>
          )}
        </div>
      </div>

      {/* Therapy Settings */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(102, 126, 234, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{
          color: '#667eea',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          marginBottom: '8px',
          letterSpacing: '0.5px'
        }}>
          Therapy Mode
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '6px' }}>
            <strong>Mode:</strong> {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </div>
          <div style={{ marginBottom: '6px' }}>
            <strong>Notch Filter:</strong> {notchEnabled ? `ON (${notchIntensity})` : 'OFF'}
          </div>
          <div style={{ marginBottom: '6px' }}>
            <strong>Left Volume:</strong> {Math.round((volumeLeft + 40) / 30 * 100)}%
          </div>
          <div>
            <strong>Right Volume:</strong> {Math.round((volumeRight + 40) / 30 * 100)}%
          </div>
        </div>
      </div>

      {/* Calm Mode Info */}
      {isCalmMode && (
        <div style={{
          padding: '12px',
          background: 'rgba(252, 227, 138, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(252, 227, 138, 0.3)'
        }}>
          <div style={{
            color: '#FCE38A',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            Calm Mode
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', lineHeight: '1.6' }}>
            <div>
              <strong>Heartbeat:</strong> {heartbeatBPM} BPM
            </div>
          </div>
        </div>
      )}
    </div>
  )}
</div>

{/* Developer Settings Panel (Development Only) */}
<div style={{
  position: 'fixed',
  top: '10px',
  right: '10px',
  zIndex: 2000,
  background: 'rgba(20, 30, 48, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: '1px solid rgba(78, 205, 196, 0.3)',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
}}>
  <button
    onClick={() => setShowDevSettings(!showDevSettings)}
    style={{
      width: '100%',
      padding: '10px 16px',
      background: 'rgba(78, 205, 196, 0.1)',
      color: '#4ECDC4',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px'
    }}
  >
    <span>⚙️ Developer Settings</span>
    <span style={{ fontSize: '10px' }}>{showDevSettings ? '▼' : '▶'}</span>
  </button>

  {showDevSettings && (
    <div style={{
      padding: '16px',
      borderTop: '1px solid rgba(78, 205, 196, 0.2)'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          fontWeight: '600',
          display: 'block',
          marginBottom: '8px'
        }}>
          Audio Engine Mode:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setTherapyEngine('legacy')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: therapyEngine === 'legacy'
                ? 'linear-gradient(135deg, #4ECDC4, #44A08D)'
                : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: therapyEngine === 'legacy'
                ? '2px solid #4ECDC4'
                : '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            disabled={isPlaying}
          >
            Legacy<br/><span style={{ fontSize: '10px', opacity: 0.8 }}>Current</span>
          </button>
          <button
            onClick={() => setTherapyEngine('engine')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: therapyEngine === 'engine'
                ? 'linear-gradient(135deg, #F38181, #FCE38A)'
                : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: therapyEngine === 'engine'
                ? '2px solid #F38181'
                : '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            disabled={isPlaying}
          >
            New Engine<br/><span style={{ fontSize: '10px', opacity: 0.8 }}>95% Accurate</span>
          </button>
        </div>
        {isPlaying && (
          <p style={{
            color: 'rgba(255, 165, 0, 0.9)',
            fontSize: '11px',
            marginTop: '8px',
            marginBottom: 0
          }}>
            ⚠️ Stop therapy to switch engines
          </p>
        )}
      </div>

      <div style={{
        padding: '10px',
        background: 'rgba(78, 205, 196, 0.1)',
        borderRadius: '8px',
        marginBottom: '8px'
      }}>
        <div style={{
          color: '#4ECDC4',
          fontSize: '11px',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          Current Mode: {therapyEngine === 'engine' ? '🚀 New Engine' : '📦 Legacy'}
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '10px',
          lineHeight: '1.4'
        }}>
          {therapyEngine === 'engine'
            ? '✓ Clinical-grade notched therapy\n✓ WHO-compliant safety monitoring\n✓ 95% frequency matching accuracy'
            : '✓ Current production therapy\n✓ Proven and stable\n✓ Slider-based matching'}
        </div>
      </div>

      <div style={{
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center'
      }}>
        Development testing only
      </div>
    </div>
  )}
</div>

{/* Rating Modal Overlay */}
{showRatingModal && (
<div style={{
position: 'fixed',
top: 0,
left: 0,
right: 0,
bottom: 0,
background: 'rgba(0, 0, 0, 0.85)',
backdropFilter: 'blur(10px)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
zIndex: 1000,
padding: '20px'
}}>
<div style={{
background: 'linear-gradient(135deg, #1a2332 0%, #253447 100%)',
padding: '32px',
borderRadius: '24px',
maxWidth: '500px',
width: '100%',
border: '1px solid rgba(78, 205, 196, 0.3)',
boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
}}>
<h2 style={{
color: '#4ECDC4',
fontSize: '24px',
fontWeight: '700',
marginBottom: '8px',
textAlign: 'center'
}}>
How Do You Feel?
</h2>
<p style={{
color: 'rgba(255,255,255,0.6)',
fontSize: '14px',
marginBottom: '24px',
textAlign: 'center'
}}>
Great session! Help us track your progress by rating your tinnitus.
</p>

        {/* Loudness After Rating */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            color: 'white', 
            fontSize: '15px', 
            fontWeight: '600',
            display: 'block',
            marginBottom: '12px'
          }}>
            Tinnitus Loudness Right Now:
          </label>
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            {[1,2,3,4,5,6,7,8,9,10].map(level => (
              <button
                key={level}
                onClick={() => setCurrentRatings({...currentRatings, loudnessAfter: level})}
                style={{
                  flex: 1,
                  padding: '12px 4px',
                  background: currentRatings.loudnessAfter === level 
                    ? 'linear-gradient(135deg, #4ECDC4, #44B3AA)' 
                    : 'rgba(255,255,255,0.1)',
                  color: currentRatings.loudnessAfter === level ? 'white' : 'rgba(255,255,255,0.6)',
                  border: currentRatings.loudnessAfter === level 
                    ? '2px solid #4ECDC4' 
                    : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (currentRatings.loudnessAfter !== level) {
                    e.target.style.background = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentRatings.loudnessAfter !== level) {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
              >
                {level}
              </button>
            ))}
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px'
          }}>
            <span>Silent</span>
            <span>Unbearable</span>
          </div>
        </div>

        {/* Distress Rating */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            color: 'white', 
            fontSize: '15px', 
            fontWeight: '600',
            display: 'block',
            marginBottom: '12px'
          }}>
            How Distressed Do You Feel?
          </label>
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            {[1,2,3,4,5,6,7,8,9,10].map(level => (
              <button
                key={level}
                onClick={() => setCurrentRatings({...currentRatings, distress: level})}
                style={{
                  flex: 1,
                  padding: '12px 4px',
                  background: currentRatings.distress === level 
                    ? 'linear-gradient(135deg, #f093fb, #f5576c)' 
                    : 'rgba(255,255,255,0.1)',
                  color: currentRatings.distress === level ? 'white' : 'rgba(255,255,255,0.6)',
                  border: currentRatings.distress === level 
                    ? '2px solid #f093fb' 
                    : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (currentRatings.distress !== level) {
                    e.target.style.background = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentRatings.distress !== level) {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
              >
                {level}
              </button>
            ))}
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px'
          }}>
            <span>Calm</span>
            <span>Very Distressed</span>
          </div>
        </div>

        {/* Optional Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            color: 'white', 
            fontSize: '15px', 
            fontWeight: '600',
            display: 'block',
            marginBottom: '8px'
          }}>
            Notes (Optional):
          </label>
          <textarea
            value={currentRatings.notes}
            onChange={(e) => setCurrentRatings({...currentRatings, notes: e.target.value})}
            placeholder="How did this session feel? Any observations?"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setShowRatingModal(false);
              saveSession(sessionTime); // Save without ratings
              setCurrentRatings({ loudnessBefore: 5, loudnessAfter: 5, distress: 5, notes: '' });
            }}
            style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            Skip
          </button>
          <button
            onClick={() => {
              saveSession(sessionTime, currentRatings);
              setShowRatingModal(false);
              setCurrentRatings({ loudnessBefore: 5, loudnessAfter: 5, distress: 5, notes: '' });
            }}
            style={{
              flex: 2,
              padding: '14px',
              background: 'linear-gradient(135deg, #4ECDC4, #44B3AA)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '700',
              boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)'
            }}
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Subtle animated background gradient */}
  <div style={{
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(78, 205, 196, 0.08) 0%, transparent 70%)',
    animation: 'float 20s ease-in-out infinite',
    pointerEvents: 'none'
  }}/>
  <style>{`@keyframes float { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(30px, -30px) rotate(120deg); } 66% { transform: translate(-20px, 20px) rotate(240deg); } } @keyframes gentlePulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.05); opacity: 1; } } @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }`}</style>

  <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
    
    {/* Header - Central and Bold */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
      padding: '32px 24px',
      borderRadius: '20px',
      marginBottom: '24px',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      textAlign: 'center'
    }}>
      {/* Logo and Title - Centered */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <img
          src={logo}
          alt="TinniTune Logo"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)'
          }}
        />
        <div>
          <h1 style={{
            color: '#4ECDC4',
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 8px rgba(78, 205, 196, 0.3)'
          }}>
            TinniTune™
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            margin: '8px 0 0 0',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.3px'
          }}>
            {frequency} Hz • {ear === 'left' ? '👂 Left' : ear === 'right' ? 'Right 👂' : '👂 Both'}
          </p>
          <p style={{
            color: therapyEngine === 'engine' ? '#F38181' : '#4ECDC4',
            margin: '6px 0 0 0',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            opacity: 0.9
          }}>
            {therapyEngine === 'engine' ? '🚀 New Engine' : '📦 Legacy'} • {notchEnabled ? `Notch ${notchIntensity.toUpperCase()}` : 'Notch OFF'}
          </p>
        </div>
      </div>

      {/* Start/Stop Therapy Button - Large and Central */}
      <button
        onClick={() => {
          console.log('Play/Stop clicked, isPlaying:', isPlaying);
          if (isPlaying) {
            stopTherapy();
          } else {
            startTherapy();
          }
        }}
        style={{
          padding: '20px 60px',
          background: isPlaying
            ? 'linear-gradient(135deg, #E27D60 0%, #E8A87C 100%)'
            : `linear-gradient(135deg, ${getModeConfig(mode).color}dd 0%, ${getModeConfig(mode).color} 100%)`,
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: '700',
          boxShadow: isPlaying
            ? '0 12px 32px rgba(226, 125, 96, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2)'
            : `0 12px 32px ${getModeConfig(mode).color}40, 0 4px 8px rgba(0, 0, 0, 0.2)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: '0.5px',
          touchAction: 'manipulation',
          marginBottom: '20px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-3px) scale(1.02)';
          e.target.style.boxShadow = isPlaying
            ? '0 16px 40px rgba(226, 125, 96, 0.5), 0 6px 12px rgba(0, 0, 0, 0.25)'
            : `0 16px 40px ${getModeConfig(mode).color}50, 0 6px 12px rgba(0, 0, 0, 0.25)`;
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = isPlaying
            ? '0 12px 32px rgba(226, 125, 96, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2)'
            : `0 12px 32px ${getModeConfig(mode).color}40, 0 4px 8px rgba(0, 0, 0, 0.2)`;
        }}
      >
        {isPlaying ? '⏸ Stop Therapy' : '▶ Start Therapy'}
      </button>

      {/* Session Timer and Progress */}
      {isPlaying && (() => {
        const progress = getSessionProgress(sessionTime);

        return (
          <div style={{
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: progress.progressColor,
              textShadow: `0 0 20px ${progress.progressColor}66`,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              {formatTime(sessionTime)}
            </div>

            {/* Quality indicator */}
            <div style={{
              fontSize: '14px',
              color: progress.progressColor,
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              {progress.quality.emoji} {progress.quality.message}
            </div>

            {/* Progress bar with gradient */}
            <div style={{
              maxWidth: '400px',
              margin: '0 auto',
              height: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '5px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Milestone markers */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '25%',
                width: '2px',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.2)'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: '2px',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.3)'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                left: '75%',
                width: '2px',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.3)'
              }} />

              {/* Progress fill */}
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${progress.progressColor}, ${progress.progressColor}DD)`,
                width: `${progress.percentage}%`,
                transition: 'width 1s linear, background 0.5s ease',
                borderRadius: '5px',
                boxShadow: `0 0 10px ${progress.progressColor}88`
              }} />
            </div>

            {/* Progress text */}
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '10px',
              fontWeight: '500'
            }}>
              {progress.nextMilestone ? (
                <>
                  {progress.percentage}% • Next: {progress.nextMilestone.label}
                </>
              ) : (
                <>
                  {progress.percentage}% • Outstanding session! 🌟
                </>
              )}
            </div>

            {/* Clinical guidance */}
            <div style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '6px',
              fontStyle: 'italic'
            }}>
              {sessionTime < SESSION_THRESHOLDS.EFFECTIVE
                ? "💡 Research shows 30+ minutes provides better results"
                : sessionTime < SESSION_THRESHOLDS.RECOMMENDED
                ? "💡 Great! Try for 60 minutes for optimal benefit"
                : "💡 Excellent duration! Extended sessions enhance habituation"}
            </div>
          </div>
        );
      })()}
    </div>

    {/* Volume Control - Independent Left/Right */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
      padding: '28px 24px',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      marginBottom: '24px'
    }}>
      <div style={{
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          marginBottom: '4px'
        }}>
          Volume Control
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          💡 Adjust each ear independently for optimal balance
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {/* Left Ear Volume */}
        <div style={{
          flex: 1,
          padding: '20px',
          background: 'rgba(78, 205, 196, 0.08)',
          borderRadius: '16px',
          border: '1px solid rgba(78, 205, 196, 0.15)'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{
            fontSize: '24px',
            display: 'inline-block',
            transform: 'scaleX(-1)',
            filter: 'grayscale(0)'
          }}>
            👂
          </span>
          <span style={{
            color: 'white',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            Left Ear
          </span>
        </div>
        <input
          type="range"
          min="-40"
          max="-10"
          step="1"
          value={volumeLeft}
          onChange={(e) => {
            const newVol = parseInt(e.target.value);
            setVolumeLeft(newVol);
            updateSettings({ volumeLeft: newVol });
            if (isPlaying) {
              if (therapyEngine === 'engine') {
                // New engine: use updateEngineVolume
                updateEngineVolume('left', newVol);
              } else {
                // Legacy engine: update synth volumes directly
                // Update left channel sounds (indices 0 and 1)
                if (synthsRef.current[0] && synthsRef.current[0].volume) {
                  synthsRef.current[0].volume.value = newVol; // left noise
                }
                if (synthsRef.current[1] && synthsRef.current[1].volume) {
                  synthsRef.current[1].volume.value = newVol + 8; // left ambience
                }
                // Update left binaural if exists (index 4)
                if (synthsRef.current[4] && synthsRef.current[4].volume) {
                  synthsRef.current[4].volume.value = newVol + 12;
                }
              }
            }
          }}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            appearance: 'none',
            background: `linear-gradient(to right,
              #4ECDC4 0%,
              #4ECDC4 ${((volumeLeft + 40) / 30) * 100}%,
              rgba(255, 255, 255, 0.15) ${((volumeLeft + 40) / 30) * 100}%,
              rgba(255, 255, 255, 0.15) 100%)`
          }}
        />
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          color: '#4ECDC4',
          fontSize: '18px',
          fontWeight: '700',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {Math.round((volumeLeft + 40) / 30 * 100)}%
        </div>
      </div>

        {/* Right Ear Volume */}
        <div style={{
          flex: 1,
          padding: '20px',
          background: 'rgba(102, 126, 234, 0.08)',
          borderRadius: '16px',
          border: '1px solid rgba(102, 126, 234, 0.15)'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{
            fontSize: '24px'
          }}>
            👂
          </span>
          <span style={{
            color: 'white',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            Right Ear
          </span>
        </div>
        <input
          type="range"
          min="-40"
          max="-10"
          step="1"
          value={volumeRight}
          onChange={(e) => {
            const newVol = parseInt(e.target.value);
            setVolumeRight(newVol);
            updateSettings({ volumeRight: newVol });
            if (isPlaying) {
              if (therapyEngine === 'engine') {
                // New engine: use updateEngineVolume
                updateEngineVolume('right', newVol);
              } else {
                // Legacy engine: update synth volumes directly
                // Update right channel sounds (indices 2 and 3)
                if (synthsRef.current[2] && synthsRef.current[2].volume) {
                  synthsRef.current[2].volume.value = newVol; // right noise
                }
                if (synthsRef.current[3] && synthsRef.current[3].volume) {
                  synthsRef.current[3].volume.value = newVol + 8; // right ambience
                }
                // Update right binaural if exists (index 5)
                if (synthsRef.current[5] && synthsRef.current[5].volume) {
                  synthsRef.current[5].volume.value = newVol + 12;
                }
              }
            }
          }}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            appearance: 'none',
            background: `linear-gradient(to right,
              #667eea 0%,
              #667eea ${((volumeRight + 40) / 30) * 100}%,
              rgba(255, 255, 255, 0.15) ${((volumeRight + 40) / 30) * 100}%,
              rgba(255, 255, 255, 0.15) 100%)`
          }}
        />
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          color: '#667eea',
          fontSize: '18px',
          fontWeight: '700',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {Math.round((volumeRight + 40) / 30 * 100)}%
        </div>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4ECDC4, #667eea);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(78, 205, 196, 0.4), 0 0 0 4px rgba(78, 205, 196, 0.15);
          transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(78, 205, 196, 0.5), 0 0 0 6px rgba(78, 205, 196, 0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4ECDC4, #667eea);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(78, 205, 196, 0.4);
          border: none;
        }
      `}</style>
    </div>

    {/* Calm Mode Button - Prominent placement */}
    <div style={{
      background: isCalmMode
        ? 'linear-gradient(135deg, rgba(255, 183, 77, 0.3), rgba(255, 138, 101, 0.3))'
        : 'linear-gradient(135deg, rgba(255, 183, 77, 0.2), rgba(255, 138, 101, 0.2))',
      padding: '20px',
      borderRadius: '16px',
      marginBottom: '24px',
      border: isCalmMode ? '2px solid rgba(255, 183, 77, 0.6)' : '1px solid rgba(255, 183, 77, 0.3)',
      backdropFilter: 'blur(10px)',
      boxShadow: isCalmMode ? '0 8px 24px rgba(255, 183, 77, 0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
      cursor: 'pointer',
      transition: 'all 0.3s'
    }}
    onClick={toggleCalmMode}
    onMouseEnter={(e) => {
      if (!isCalmMode) {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 183, 77, 0.25), rgba(255, 138, 101, 0.25))';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isCalmMode) {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 183, 77, 0.2), rgba(255, 138, 101, 0.2))';
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ❤️ CALM MODE
            {isCalmMode && (
              <span style={{
                fontSize: '11px',
                background: 'rgba(255, 183, 77, 0.3)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontWeight: '600',
                color: '#FFB74D',
                animation: 'gentlePulse 2s ease-in-out infinite'
              }}>
                ACTIVE
              </span>
            )}
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            {isCalmMode
              ? `Heartbeat at ${heartbeatBPM} BPM • Follow the breathing guide`
              : 'Feeling anxious? Tinnitus spike? Tap for instant calm'}
          </div>
        </div>

        <div style={{
          fontSize: '48px',
          opacity: 0.9,
          filter: 'drop-shadow(0 4px 8px rgba(255, 183, 77, 0.3))'
        }}>
          {isCalmMode ? '💓' : '❤️'}
        </div>
      </div>
    </div>

    {/* Calm Mode Breathing Guide - Full Interface */}
    {isCalmMode && (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.15), rgba(255, 138, 101, 0.15))',
        padding: '40px 30px',
        borderRadius: '24px',
        marginBottom: '24px',
        border: '2px solid rgba(255, 183, 77, 0.4)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 16px 48px rgba(255, 183, 77, 0.2)',
        textAlign: 'center'
      }}>
        {/* Breathing Circle */}
        <div style={{
          width: '200px',
          height: '200px',
          margin: '0 auto 30px auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Outer pulsing circle */}
          <div style={{
            position: 'absolute',
            width: breathingPhase === 'in' ? '200px' : breathingPhase === 'hold' ? '200px' : '120px',
            height: breathingPhase === 'in' ? '200px' : breathingPhase === 'hold' ? '200px' : '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 183, 77, 0.3), rgba(255, 138, 101, 0.2))',
            border: '3px solid rgba(255, 183, 77, 0.5)',
            transition: breathingPhase === 'in' ? 'all 4s cubic-bezier(0.4, 0, 0.2, 1)' : breathingPhase === 'out' ? 'all 6s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 2s ease',
            boxShadow: '0 0 40px rgba(255, 183, 77, 0.3)'
          }} />

          {/* Inner circle with count */}
          <div style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'rgba(255, 183, 77, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 183, 77, 0.4)',
            zIndex: 1
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#FFB74D',
              marginBottom: '5px'
            }}>
              {breathCount}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.9)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {breathingPhase === 'in' ? 'Breathe In' : breathingPhase === 'hold' ? 'Hold' : 'Breathe Out'}
            </div>
          </div>
        </div>

        {/* Breathing instructions */}
        <div style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '16px',
          marginBottom: '20px',
          fontWeight: '500'
        }}>
          {breathingPhase === 'in' && '💨 Breathe in slowly through your nose...'}
          {breathingPhase === 'hold' && '⏸️ Hold your breath gently...'}
          {breathingPhase === 'out' && '💨 Breathe out slowly through your mouth...'}
        </div>

        {/* Heartbeat control */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <span>❤️ Heartbeat Volume</span>
            <span style={{ color: '#FFB74D' }}>
              {Math.round((heartbeatVolume + 40) / 35 * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="-40"
            max="-5"
            step="1"
            value={heartbeatVolume}
            onChange={(e) => updateHeartbeatVolume(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              cursor: 'pointer',
              appearance: 'none',
              background: `linear-gradient(to right,
                #FFB74D 0%,
                #FFB74D ${((heartbeatVolume + 40) / 35) * 100}%,
                rgba(255, 255, 255, 0.15) ${((heartbeatVolume + 40) / 35) * 100}%,
                rgba(255, 255, 255, 0.15) 100%)`
            }}
          />

          {/* BPM Control */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '15px',
            marginBottom: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <span>💓 Heart Rate</span>
            <span style={{ color: '#FFB74D' }}>{heartbeatBPM} BPM</span>
          </div>
          <input
            type="range"
            min="50"
            max="70"
            step="1"
            value={heartbeatBPM}
            onChange={(e) => updateHeartbeatBPM(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              cursor: 'pointer',
              appearance: 'none',
              background: `linear-gradient(to right,
                #FFB74D 0%,
                #FFB74D ${((heartbeatBPM - 50) / 20) * 100}%,
                rgba(255, 255, 255, 0.15) ${((heartbeatBPM - 50) / 20) * 100}%,
                rgba(255, 255, 255, 0.15) 100%)`
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            marginTop: '5px'
          }}>
            <span>Very Calm (50)</span>
            <span>Resting (70)</span>
          </div>
        </div>

        {/* Calm mode message */}
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px',
          fontStyle: 'italic',
          marginTop: '15px'
        }}>
          💡 Your heart rate naturally syncs with the heartbeat sound, promoting calm
        </div>
      </div>
    )}

    {/* Favorite Therapy Presets */}
    {userSettings.favorites && userSettings.favorites.length > 0 && (
      <div style={{
        background: 'linear-gradient(135deg, rgba(252, 227, 138, 0.15), rgba(252, 227, 138, 0.08))',
        padding: '16px',
        borderRadius: '16px',
        marginBottom: '20px',
        border: '1px solid rgba(252, 227, 138, 0.3)'
      }}>
        <div style={{
          color: '#FCE38A',
          fontSize: '14px',
          fontWeight: '700',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          ⭐ Quick Access
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {userSettings.favorites.map(fav => (
            <button
              key={fav.id}
              onClick={() => {
                loadFavorite(fav.id);
                setActiveFavoriteId(fav.id); // Track which favorite is loaded

                // Handle calm mode based on favorite settings
                setTimeout(async () => {
                  if (fav.calmMode?.enabled) {
                    // This favorite has calm mode enabled - apply settings and start it
                    // Explicitly set calm mode values from favorite before starting
                    setHeartbeatBPM(fav.calmMode.heartbeatBPM || 55);
                    setHeartbeatVolume(fav.calmMode.heartbeatVolume || -15);
                    setIsCalmMode(true);

                    // Wait for state updates to propagate, then start calm mode
                    setTimeout(async () => {
                      await startCalmMode();
                    }, 100);
                  } else {
                    // This favorite doesn't have calm mode - stop it if running
                    if (isCalmMode) {
                      stopCalmMode();
                    }
                  }
                }, 150); // Delay to allow state updates from loadFavorite

                if (isPlaying) {
                  stopAudio();
                  setTimeout(() => startAudio(), 100);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (window.confirm(`Delete "${fav.name}"?`)) {
                  deleteFavorite(fav.id);
                }
              }}
              style={{
                background: 'rgba(252, 227, 138, 0.2)',
                border: '1px solid rgba(252, 227, 138, 0.4)',
                borderRadius: '8px',
                padding: '8px 14px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {fav.name}
              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                {fav.mode === 'daytime' ? '☀️' : fav.mode === 'evening' ? '🌆' : '🌙'}
              </span>
            </button>
          ))}
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '11px',
          marginTop: '10px',
          fontStyle: 'italic'
        }}>
          💡 Tap to load preset • Long-press to delete
        </div>
      </div>
    )}

    {/* Update/Save Favorite Buttons */}
    <div style={{
      display: 'flex',
      gap: '10px',
      marginBottom: '20px'
    }}>
      {activeFavoriteId && (
        <button
          onClick={() => {
            const favName = userSettings.favorites.find(f => f.id === activeFavoriteId)?.name || 'favorite';
            if (window.confirm(`Update "${favName}" with current settings?`)) {
              updateFavorite(activeFavoriteId, {
                mode,
                notchEnabled,
                notchIntensity,
                volumeLeft,
                volumeRight,
                calmMode: {
                  enabled: isCalmMode,
                  heartbeatBPM,
                  heartbeatVolume,
                  breathingEnabled: true
                }
              });
            }
          }}
          style={{
            flex: 1,
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.25), rgba(78, 205, 196, 0.15))',
            border: '2px solid rgba(78, 205, 196, 0.5)',
            borderRadius: '12px',
            color: '#4ECDC4',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            touchAction: 'manipulation',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>✓</span>
          <span>Update Favorite</span>
        </button>
      )}
      <button
        onClick={() => setShowSaveFavoriteModal(true)}
        style={{
          flex: 1,
          padding: '12px',
          background: 'rgba(252, 227, 138, 0.1)',
          border: '1px dashed rgba(252, 227, 138, 0.4)',
          borderRadius: '12px',
          color: '#FCE38A',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          touchAction: 'manipulation',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        <span>⭐</span>
        <span>Save as New</span>
      </button>
    </div>

    {/* Notch Therapy Controls - Clean Mobile Layout */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.15), rgba(78, 205, 196, 0.08))',
      padding: '20px',
      borderRadius: '16px',
      marginBottom: '24px',
      border: notchEnabled ? '2px solid rgba(78, 205, 196, 0.4)' : '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      boxShadow: notchEnabled
        ? '0 8px 24px rgba(78, 205, 196, 0.2)'
        : '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      {/* Title and Description */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '8px'
        }}>
          🎯 Notch Therapy
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          {notchEnabled
            ? frequency > 8000
              ? 'Clinically proven to reduce tinnitus over time'
              : 'Optimal frequency range for therapy'
            : 'Enable for clinically-proven relief'
          }
        </div>
      </div>

      {/* Status Badge and Toggle Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: notchEnabled ? '16px' : '0'
      }}>
        {notchEnabled && (
          <div style={{
            flex: 1,
            background: 'rgba(78, 205, 196, 0.2)',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(78, 205, 196, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: '600',
              marginBottom: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Active at
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#4ECDC4'
            }}>
              {frequency}Hz
            </div>
          </div>
        )}

        <button
          onClick={() => {
            const newNotchState = !notchEnabled;
            setNotchEnabled(newNotchState);

            // Update in real-time if using new engine and playing
            if (isPlaying && therapyEngine === 'engine' && therapyModuleRef.current) {
              therapyModuleRef.current.setNotchEnabled(newNotchState);
              console.log('🎛️ Notch toggled to:', newNotchState);
            } else if (isPlaying && therapyEngine === 'legacy') {
              // Legacy engine requires restart
              stopAudio();
              setTimeout(() => startAudio(), 100);
            }
          }}
          style={{
            padding: '14px 32px',
            background: notchEnabled
              ? 'linear-gradient(135deg, #4ECDC4, #44B3AA)'
              : 'rgba(255,255,255,0.15)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            boxShadow: notchEnabled
              ? '0 4px 16px rgba(78, 205, 196, 0.3)'
              : 'none',
            transition: 'all 0.3s',
            minWidth: notchEnabled ? '100px' : '100%',
            flex: notchEnabled ? '0 0 auto' : '1'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {notchEnabled ? 'ON ✓' : 'Turn ON'}
        </button>
      </div>

      {/* Intensity Control - Only show when notch is enabled */}
      {notchEnabled && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '12px',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            Therapy Intensity:
            {therapyEngine === 'engine' && <span style={{
              color: '#F38181',
              fontSize: '10px',
              marginLeft: '8px',
              fontWeight: '700'
            }}>
              🚀 ENHANCED
            </span>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(therapyEngine === 'engine'
              ? ['gentle', 'standard', 'strong', 'precise']
              : ['gentle', 'standard', 'strong']
            ).map(intensity => (
              <button
                key={intensity}
                onClick={() => {
                  setNotchIntensity(intensity);

                  // Update in real-time if using new engine and playing
                  if (isPlaying && therapyEngine === 'engine' && therapyModuleRef.current) {
                    const intensityMap = {
                      'gentle': 'gentle',
                      'standard': 'moderate',
                      'strong': 'strong',
                      'precise': 'precise'
                    };
                    const engineIntensity = intensityMap[intensity] || 'moderate';
                    therapyModuleRef.current.updateNotchIntensity(engineIntensity);
                    console.log('🎛️ Notch intensity updated to:', engineIntensity);
                  } else if (isPlaying && therapyEngine === 'legacy') {
                    // Legacy engine requires restart
                    stopTherapy();
                    setTimeout(() => startTherapy(), 100);
                  }
                }}
                style={{
                  flex: therapyEngine === 'engine' ? '1 1 calc(50% - 4px)' : '1',
                  minWidth: therapyEngine === 'engine' ? '120px' : 'auto',
                  padding: '10px 12px',
                  background: notchIntensity === intensity
                    ? (therapyEngine === 'engine' ? 'rgba(243, 129, 129, 0.3)' : 'rgba(78, 205, 196, 0.3)')
                    : 'rgba(255,255,255,0.05)',
                  color: notchIntensity === intensity
                    ? (therapyEngine === 'engine' ? '#F38181' : '#4ECDC4')
                    : 'rgba(255,255,255,0.6)',
                  border: notchIntensity === intensity
                    ? (therapyEngine === 'engine' ? '1.5px solid rgba(243, 129, 129, 0.5)' : '1.5px solid rgba(78, 205, 196, 0.5)')
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: notchIntensity === intensity ? '700' : '500',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
                onMouseEnter={(e) => {
                  if (notchIntensity !== intensity) {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (notchIntensity !== intensity) {
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
              >
                {intensity}
              </button>
            ))}
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            {therapyEngine === 'engine' ? (
              <>
                {notchIntensity === 'gentle' && '💫 1 octave bandwidth - Wide, gentle filtering'}
                {notchIntensity === 'standard' && '✨ 0.5 octave - Clinical standard (Q=2.5)'}
                {notchIntensity === 'strong' && '🎯 0.25 octave - Focused, narrow (Q=5.0)'}
                {notchIntensity === 'precise' && '⚡ 0.125 octave - Maximum precision (Q=10.0)'}
              </>
            ) : (
              <>
                {notchIntensity === 'gentle' && '💫 Wider, softer relief'}
                {notchIntensity === 'standard' && '✨ Clinically proven (recommended)'}
                {notchIntensity === 'strong' && '🎯 Targeted, focused relief'}
              </>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Binaural Beats Toggle */}
    <div style={{
      background: binauralEnabled
        ? 'linear-gradient(135deg, rgba(147, 112, 219, 0.15), rgba(123, 104, 238, 0.15))'
        : 'rgba(255,255,255,0.05)',
      padding: '20px',
      borderRadius: '16px',
      marginBottom: '24px',
      border: binauralEnabled ? '2px solid rgba(147, 112, 219, 0.4)' : '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      boxShadow: binauralEnabled
        ? '0 8px 24px rgba(147, 112, 219, 0.2)'
        : '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '8px'
        }}>
          🎵 Binaural Beats
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          {binauralEnabled
            ? 'Brainwave entrainment active for relaxation'
            : 'Enable for enhanced mood and focus'
          }
        </div>
      </div>

      <button
        onClick={() => {
          const newBinauralState = !binauralEnabled;
          setBinauralEnabled(newBinauralState);

          // Update in real-time if using new engine and playing
          if (isPlaying && therapyEngine === 'engine' && therapyModuleRef.current) {
            therapyModuleRef.current.setBinauralEnabled(newBinauralState);
            console.log('🎛️ Binaural beats toggled to:', newBinauralState);
          } else if (isPlaying && therapyEngine === 'legacy') {
            // Legacy engine requires restart
            stopAudio();
            setTimeout(() => startAudio(), 100);
          }
        }}
        style={{
          width: '100%',
          padding: '14px 32px',
          background: binauralEnabled
            ? 'linear-gradient(135deg, #9370DB, #7B68EE)'
            : 'rgba(255,255,255,0.15)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '700',
          boxShadow: binauralEnabled
            ? '0 4px 16px rgba(147, 112, 219, 0.3)'
            : 'none',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
        }}
      >
        {binauralEnabled ? 'ON ✓' : 'Turn ON'}
      </button>
    </div>

    {/* NEW ENGINE ONLY: Binaural Beat Mode Selector */}
    {therapyEngine === 'engine' && binauralEnabled && (
      <div style={{
        background: 'linear-gradient(135deg, rgba(243, 129, 129, 0.15), rgba(252, 227, 138, 0.15))',
        padding: '20px',
        borderRadius: '16px',
        marginBottom: '24px',
        border: '2px solid rgba(243, 129, 129, 0.3)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 24px rgba(243, 129, 129, 0.2)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            🧠 Brainwave Entrainment
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            Binaural beats synchronized to your therapy mode for enhanced effectiveness
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { mode: 'daytime', label: 'Focus', icon: '☀️', wave: 'Alpha', hz: '10 Hz' },
            { mode: 'evening', label: 'Calm', icon: '🌅', wave: 'Theta', hz: '6 Hz' },
            { mode: 'sleep', label: 'Sleep', icon: '🌙', wave: 'Delta', hz: '3 Hz' }
          ].map(({ mode: modeKey, label, icon, wave, hz }) => {
            const isActive = mode === modeKey;
            return (
              <button
                key={modeKey}
                onClick={() => {
                  setMode(modeKey);

                  // Update in real-time if using new engine and playing
                  if (isPlaying && therapyEngine === 'engine' && therapyModuleRef.current) {
                    const binauralMode = BINAURAL_MODE_MAP[modeKey] || 'focus';
                    therapyModuleRef.current.updateBinauralMode(binauralMode);
                    console.log('🎛️ Binaural mode updated to:', binauralMode);
                  } else if (isPlaying && therapyEngine === 'legacy') {
                    // Legacy engine requires restart
                    stopTherapy();
                    setTimeout(() => startTherapy(), 100);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: isActive
                    ? 'rgba(243, 129, 129, 0.3)'
                    : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#F38181' : 'rgba(255,255,255,0.6)',
                  border: isActive
                    ? '1.5px solid rgba(243, 129, 129, 0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{label}</div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                  {wave} • {hz}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    )}


    {/* History Overview */}
    {sessions.length > 0 && (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
        padding: '28px 24px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: '#4ECDC4',
            margin: 0,
            fontSize: '20px',
            fontWeight: '700'
          }}>
            📊 Your Progress
          </h2>
          <button
            onClick={() => setStep('history')}
            style={{
              padding: '8px 16px',
              background: 'rgba(78, 205, 196, 0.15)',
              color: '#4ECDC4',
              border: '1px solid rgba(78, 205, 196, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(78, 205, 196, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(78, 205, 196, 0.15)';
            }}
          >
            View Details →
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(102, 126, 234, 0.15)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea', marginBottom: '4px' }}>
              {getStats().totalSessions}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600' }}>
              Sessions
            </div>
          </div>

          <div style={{
            background: 'rgba(78, 205, 196, 0.15)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(78, 205, 196, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#4ECDC4', marginBottom: '4px' }}>
              {Math.floor(getStats().totalTime / 3600)}h {Math.floor((getStats().totalTime % 3600) / 60)}m
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600' }}>
              Total Time
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 183, 77, 0.15)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 183, 77, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFB74D', marginBottom: '4px' }}>
              {getStats().streak} 🔥
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600' }}>
              Day Streak
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Footer - More subtle */}
    <div style={{
      textAlign: 'center',
      color: 'rgba(255,255,255,0.4)',
      fontSize: '13px',
      fontWeight: '500',
      letterSpacing: '0.3px'
    }}>
      {isPlaying
        ? notchEnabled
          ? `🎧 Therapy active with notch filtering • ${notchIntensity} intensity`
          : '🎧 Therapy active • Best with headphones'
        : notchEnabled
          ? '💡 Notch therapy uses clinically-proven sound filtering'
          : '💡 Start with 10-15 min sessions, 2-3x daily'}
    </div>

    {/* Feedback Button */}
    <button
      onClick={() => setShowFeedback(true)}
      className="feedback-button"
      aria-label="Give Feedback"
    >
      💬 Feedback
    </button>

    {/* Feedback Modal */}
    <FeedbackModal
      isOpen={showFeedback}
      onClose={() => setShowFeedback(false)}
    />

    {/* Achievement Celebration - Show for newly unlocked achievements */}
    {newAchievements && newAchievements.length > 0 && newAchievements.map((achievement, index) => (
      <AchievementCelebration
        key={achievement.id}
        achievement={achievement}
        onClose={() => {
          // Achievement will auto-clear after 5 seconds from the hook
          // This is just a manual close handler
        }}
        soundEnabled={true}
      />
    ))}

    {/* New Profile Modal */}
    {showNewProfileModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          padding: '30px',
          borderRadius: '16px',
          maxWidth: '400px',
          width: '100%',
          border: '2px solid #667eea'
        }}>
          <h3 style={{
            color: 'white',
            margin: '0 0 20px 0',
            fontSize: '24px'
          }}>
            Create New Profile
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            Enter a name for this user profile. Each profile stores its own calibration and preferences.
          </p>
          <input
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder="e.g., John, Mom, Dad"
            maxLength={20}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              marginBottom: '20px',
              boxSizing: 'border-box'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newProfileName.trim()) {
                const wasFirstProfile = profiles.length === 0;
                const profile = createProfile(newProfileName);
                setNewProfileName('');
                setShowNewProfileModal(false);
                if (wasFirstProfile) {
                  setStep('setup');
                }
              }
            }}
          />
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => {
                setShowNewProfileModal(false);
                setNewProfileName('');
              }}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (newProfileName.trim()) {
                  const wasFirstProfile = profiles.length === 0;
                  const profile = createProfile(newProfileName);
                  setNewProfileName('');
                  setShowNewProfileModal(false);
                  if (wasFirstProfile) {
                    setStep('setup');
                  }
                }
              }}
              disabled={!newProfileName.trim()}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: 'none',
                background: newProfileName.trim()
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                cursor: newProfileName.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                opacity: newProfileName.trim() ? 1 : 0.5,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'rgba(0,0,0,0)'
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Profile Manager Modal */}
    {showProfileManager && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          padding: '30px',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          border: '2px solid #667eea',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <h3 style={{
            color: 'white',
            margin: '0 0 20px 0',
            fontSize: '24px'
          }}>
            Manage Profiles
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px'
          }}>
            {profiles.map(profile => (
              <div
                key={profile.id}
                style={{
                  background: profile.id === activeProfileId
                    ? 'rgba(102, 126, 234, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  padding: '15px',
                  borderRadius: '12px',
                  border: profile.id === activeProfileId
                    ? '2px solid #667eea'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {profile.name}
                    {profile.id === activeProfileId && (
                      <span style={{
                        marginLeft: '10px',
                        fontSize: '12px',
                        color: '#4ECDC4',
                        fontWeight: 'normal'
                      }}>
                        (Active)
                      </span>
                    )}
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '12px'
                  }}>
                    Created: {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {profile.id !== activeProfileId && (
                    <button
                      onClick={() => {
                        switchProfile(profile.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid #4ECDC4',
                        background: 'rgba(78, 205, 196, 0.2)',
                        color: '#4ECDC4',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Switch
                    </button>
                  )}
                  {profiles.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete profile "${profile.name}"? This will permanently remove all their calibration data.`)) {
                          deleteProfile(profile.id);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ff6b6b',
                        background: 'rgba(255, 107, 107, 0.2)',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setShowProfileManager(false);
              setShowNewProfileModal(true);
            }}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px dashed #667eea',
              background: 'transparent',
              color: '#667eea',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}
          >
            + Add New Profile
          </button>
          <button
            onClick={() => setShowProfileManager(false)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Close
          </button>
        </div>
      </div>
    )}

    {/* Save Favorite Modal */}
    {showSaveFavoriteModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          padding: '30px',
          borderRadius: '16px',
          maxWidth: '400px',
          width: '100%',
          border: '2px solid #FCE38A'
        }}>
          <h3 style={{
            color: 'white',
            margin: '0 0 10px 0',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⭐</span>
            <span>Save as Favorite</span>
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            Save your current therapy settings for quick access later.
          </p>
          <div style={{
            background: 'rgba(252, 227, 138, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid rgba(252, 227, 138, 0.3)'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', lineHeight: '1.6' }}>
              <div><strong>Mode:</strong> {mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
              <div><strong>Notch:</strong> {notchEnabled ? `ON (${notchIntensity})` : 'OFF'}</div>
              {isCalmMode && <div><strong>Calm Mode:</strong> {heartbeatBPM} BPM</div>}
            </div>
          </div>
          <input
            type="text"
            value={newFavoriteName}
            onChange={(e) => setNewFavoriteName(e.target.value)}
            placeholder="e.g., My Sleep Mode, Evening Relax"
            maxLength={30}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              marginBottom: '20px',
              boxSizing: 'border-box'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newFavoriteName.trim()) {
                saveFavorite(newFavoriteName, {
                  mode,
                  notchEnabled,
                  notchIntensity,
                  volumeLeft,
                  volumeRight,
                  calmMode: {
                    enabled: isCalmMode,
                    heartbeatBPM,
                    heartbeatVolume,
                    breathingEnabled: true
                  }
                });
                setNewFavoriteName('');
                setShowSaveFavoriteModal(false);
              }
            }}
          />
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => {
                setShowSaveFavoriteModal(false);
                setNewFavoriteName('');
              }}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                touchAction: 'manipulation'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (newFavoriteName.trim()) {
                  saveFavorite(newFavoriteName, {
                    mode,
                    notchEnabled,
                    notchIntensity,
                    volumeLeft,
                    volumeRight,
                    calmMode: {
                      enabled: isCalmMode,
                      heartbeatBPM,
                      heartbeatVolume,
                      breathingEnabled: true
                    }
                  });
                  setNewFavoriteName('');
                  setShowSaveFavoriteModal(false);
                }
              }}
              disabled={!newFavoriteName.trim()}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: 'none',
                background: newFavoriteName.trim()
                  ? 'linear-gradient(135deg, #FCE38A, #F8B500)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: newFavoriteName.trim() ? '#1a1a2e' : 'white',
                cursor: newFavoriteName.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                opacity: newFavoriteName.trim() ? 1 : 0.5,
                touchAction: 'manipulation'
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>

);
}
