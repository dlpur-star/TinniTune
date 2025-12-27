import React, { useState, useRef } from 'react';
import * as Tone from 'tone';
import logo from './assets/logo.PNG';

export default function TinniTune() {
const [step, setStep] = useState('welcome'); // 'welcome', 'setup', 'therapy', 'history'
const [frequency, setFrequency] = useState(4000);
const [ear, setEar] = useState('both');
const [isPlaying, setIsPlaying] = useState(false);
const [mode, setMode] = useState('daytime');
const [volumeLeft, setVolumeLeft] = useState(-25);
const [volumeRight, setVolumeRight] = useState(-25);
const [sessionTime, setSessionTime] = useState(0);
const [notchEnabled, setNotchEnabled] = useState(true); // Notch therapy ON by default
const [notchIntensity, setNotchIntensity] = useState('standard'); // 'gentle', 'standard', 'strong'
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

// Calm Mode states
const [isCalmMode, setIsCalmMode] = useState(false);
const [heartbeatVolume, setHeartbeatVolume] = useState(-15);
const [heartbeatBPM, setHeartbeatBPM] = useState(55); // 55 = very calm
const [breathingPhase, setBreathingPhase] = useState('in'); // 'in', 'hold', 'out'
const [breathCount, setBreathCount] = useState(4);

// Advanced Calibration Wizard states
const [useAdvancedCalibration, setUseAdvancedCalibration] = useState(true);
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
const timerRef = useRef(null);
const analyserRef = useRef(null);
const animationFrameRef = useRef(null);
const calibrationTimeoutRef = useRef(null);

// Calm Mode refs
const heartbeatSynthsRef = useRef([]);
const breathingTimerRef = useRef(null);

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

// Detect iOS and check if already installed
React.useEffect(() => {
const userAgent = window.navigator.userAgent.toLowerCase();
const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

setIsIOS(isIOSDevice);
setIsStandalone(isInStandaloneMode);

// Show install prompt if on iOS and not already installed
if (isIOSDevice && !isInStandaloneMode) {
  const hasSeenPrompt = localStorage.getItem('tinnitune_seen_install_prompt');
  if (!hasSeenPrompt) {
    setShowInstallPrompt(true);
  }
}
}, []);

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

const getModeConfig = (m) => {
const modes = {
daytime: { name: 'Daytime Focus', freq: 10, color: '#667eea', emoji: '☀️' },
evening: { name: 'Evening Calm', freq: 6, color: '#f093fb', emoji: '🌅' },
sleep: { name: 'Deep Sleep', freq: 2, color: '#4ECDC4', emoji: '🌙' }
};
return modes[m];
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
  date: new Date().toISOString(),
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
  
  // Add binaural beats if both ears selected
  if (ear === 'both') {
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
  }
  
  setIsPlaying(true);
  setSessionTime(0);
  setSessionStartTime(Date.now()); // Record when session started
  const notchStatus = notchEnabled ? `with ${notchIntensity} notch therapy` : 'without notch therapy';
  console.log(`Therapy started ${notchStatus} at ${frequency}Hz`);
} catch (error) {
  console.error('Error starting audio:', error);
  alert('Error starting therapy: ' + error.message);
}

};

const stopAudio = () => {
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

};

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

  // Clear calibration progress
  localStorage.removeItem('tinnitune_calibration_progress');

  // Move to therapy
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

    const lub = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.1 }
    }).toDestination();
    lub.volume.value = heartbeatVolume;

    const dub = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 1.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 }
    }).toDestination();
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
        setBreathingPhase('hold');
        setBreathCount(2);
        setTimeout(() => {
          setBreathingPhase('out');
          let outCount = 6;
          setBreathCount(6);
          const exhaleInterval = setInterval(() => {
            outCount--;
            setBreathCount(outCount);
            if (outCount === 0) {
              clearInterval(exhaleInterval);
              breathingTimerRef.current = setTimeout(breathCycle, 500);
            }
          }, 1000);
        }, 2000);
      }
    }, 1000);
  };
  breathCycle();
};

const stopBreathingGuide = () => {
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
maxWidth: '500px',
background: 'rgba(255, 255, 255, 0.1)',
padding: '60px 40px',
borderRadius: '20px',
textAlign: 'center',
backdropFilter: 'blur(10px)'
}}>
<div style={{ marginBottom: '20px' }}>
  <img
    src={logo}
    alt="TinniTune Logo"
    style={{
      width: '120px',
      height: '120px',
      borderRadius: '20px'
    }}
  />
</div>
<h1 style={{
fontSize: '48px',
color: '#4ECDC4',
margin: '0 0 20px 0',
fontWeight: 'bold'
}}>TinniTune</h1>
<p style={{
color: 'rgba(255, 255, 255, 0.8)',
fontSize: '16px',
marginBottom: '40px'
}}>
Sound therapy for tinnitus relief
</p>

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

<button
onClick={() => {
console.log('Begin button clicked');
setStep('setup');
}}
style={{
background: 'linear-gradient(135deg, #667eea, #764ba2)',
color: 'white',
border: 'none',
padding: '18px 48px',
fontSize: '18px',
borderRadius: '12px',
cursor: 'pointer',
fontWeight: 'bold'
}}
>
Begin Setup
</button>
</div>
</div>
);
}

if (step === 'setup') {
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
                    fontWeight: ear === e ? 'bold' : 'normal'
                  }}
                >
                  {e === 'left' ? '👂 Left' : e === 'right' ? 'Right 👂' : '👂 Both'}
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
                    fontWeight: ear === e ? 'bold' : 'normal'
                  }}
                >
                  {e === 'left' ? '👂 Left' : e === 'right' ? 'Right 👂' : '👂 Both'}
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
    
    {/* Header - More compact and refined */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
      padding: '16px 24px',
      borderRadius: '20px',
      marginBottom: '24px',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div>
          <h1 style={{
            color: '#4ECDC4',
            margin: 0,
            fontSize: '22px',
            fontWeight: '600',
            letterSpacing: '-0.5px'
          }}>
            TinniTune
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            margin: '2px 0 0 0',
            fontSize: '12px',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}>
            {frequency} Hz • {ear === 'left' ? '👂 Left' : ear === 'right' ? 'Right 👂' : '👂 Both'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start', paddingLeft: '8px' }}>
        <button
          onClick={() => {
            if (isPlaying) stopAudio();
            setStep('history');
          }}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          📊 History
        </button>
        <button
          onClick={() => {
            if (isPlaying) stopAudio();
            setStep('setup');
          }}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ⚙️ Settings
        </button>
      </div>
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

    {/* Mode Selection - Premium cards with better depth */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      marginBottom: '24px'
    }}>
      {['daytime', 'evening', 'sleep'].map(m => {
        const config = getModeConfig(m);
        const isActive = mode === m;
        return (
          <div
            key={m}
            onClick={() => {
              if (isPlaying) {
                stopAudio();
                setMode(m);
                setTimeout(() => startAudio(), 100);
              } else {
                setMode(m);
              }
            }}
            style={{
              background: isActive 
                ? `linear-gradient(135deg, ${config.color}dd, ${config.color}99)`
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
              padding: '20px 16px',
              borderRadius: '16px',
              cursor: 'pointer',
              border: isActive ? `1.5px solid ${config.color}80` : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: isActive 
                ? `0 8px 32px ${config.color}30, inset 0 1px 0 rgba(255,255,255,0.2)`
                : '0 4px 12px rgba(0,0,0,0.15)',
              transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.04) 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '200%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${config.color}20, transparent)`,
                animation: 'shimmer 3s infinite'
              }}/>
            )}
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{config.emoji}</div>
            <div style={{ 
              color: 'white', 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '2px',
              letterSpacing: '-0.3px'
            }}>
              {config.name}
            </div>
            {ear === 'both' && (
              <div style={{ 
                color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', 
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.3px'
              }}>
                {config.freq}Hz binaural
              </div>
            )}
          </div>
        );
      })}
    </div>

    {ear !== 'both' && (
      <div style={{
        background: 'linear-gradient(135deg, rgba(231, 111, 81, 0.15), rgba(231, 111, 81, 0.08))',
        padding: '12px 16px',
        borderRadius: '14px',
        marginBottom: '24px',
        border: '1px solid rgba(231, 111, 81, 0.25)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(231, 111, 81, 0.1)'
      }}>
        <p style={{ 
          color: 'rgba(255,255,255,0.9)', 
          margin: 0, 
          fontSize: '13px',
          lineHeight: '1.5',
          fontWeight: '500'
        }}>
          <span style={{ fontWeight: '700' }}>ℹ️ Mono Mode:</span> Binaural beats disabled. 
          Optimized therapy for your {ear} ear.
        </p>
      </div>
    )}

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
            if (isPlaying) {
              stopAudio();
              setNotchEnabled(!notchEnabled);
              setTimeout(() => startAudio(), 100);
            } else {
              setNotchEnabled(!notchEnabled);
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
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['gentle', 'standard', 'strong'].map(intensity => (
              <button
                key={intensity}
                onClick={() => {
                  if (isPlaying) {
                    stopAudio();
                    setNotchIntensity(intensity);
                    setTimeout(() => startAudio(), 100);
                  } else {
                    setNotchIntensity(intensity);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: notchIntensity === intensity 
                    ? 'rgba(78, 205, 196, 0.3)' 
                    : 'rgba(255,255,255,0.05)',
                  color: notchIntensity === intensity ? '#4ECDC4' : 'rgba(255,255,255,0.6)',
                  border: notchIntensity === intensity 
                    ? '1.5px solid rgba(78, 205, 196, 0.5)' 
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
            {notchIntensity === 'gentle' && '💫 Wider, softer relief'}
            {notchIntensity === 'standard' && '✨ Clinically proven (recommended)'}
            {notchIntensity === 'strong' && '🎯 Targeted, focused relief'}
          </div>
        </div>
      )}
    </div>

    {/* Main Control - More refined and elegant */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
      padding: '48px 40px',
      borderRadius: '24px',
      textAlign: 'center',
      backdropFilter: 'blur(20px) saturate(180%)',
      marginBottom: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      position: 'relative'
    }}>
      {/* Icon with better animation */}
      <div style={{
        fontSize: '72px',
        marginBottom: '32px',
        filter: 'drop-shadow(0 8px 24px rgba(78, 205, 196, 0.3))',
        animation: isPlaying ? 'gentlePulse 3s ease-in-out infinite' : 'none'
      }}>
        {isPlaying ? '🎵' : '🎧'}
      </div>

      <button
        onClick={() => {
          console.log('Play/Stop clicked, isPlaying:', isPlaying);
          if (isPlaying) {
            stopAudio();
          } else {
            startAudio();
          }
        }}
        style={{
          padding: '18px 56px',
          background: isPlaying 
            ? 'linear-gradient(135deg, #E27D60 0%, #E8A87C 100%)'
            : `linear-gradient(135deg, ${getModeConfig(mode).color}dd 0%, ${getModeConfig(mode).color} 100%)`,
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: '700',
          boxShadow: isPlaying
            ? '0 12px 32px rgba(226, 125, 96, 0.35), 0 4px 8px rgba(0, 0, 0, 0.2)'
            : `0 12px 32px ${getModeConfig(mode).color}35, 0 4px 8px rgba(0, 0, 0, 0.2)`,
          marginBottom: '32px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: '0.5px',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = isPlaying
            ? '0 16px 40px rgba(226, 125, 96, 0.4), 0 6px 12px rgba(0, 0, 0, 0.25)'
            : `0 16px 40px ${getModeConfig(mode).color}40, 0 6px 12px rgba(0, 0, 0, 0.25)`;
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = isPlaying
            ? '0 12px 32px rgba(226, 125, 96, 0.35), 0 4px 8px rgba(0, 0, 0, 0.2)'
            : `0 12px 32px ${getModeConfig(mode).color}35, 0 4px 8px rgba(0, 0, 0, 0.2)`;
        }}
      >
        {isPlaying ? '⏸ Stop Therapy' : '▶ Start Therapy'}
      </button>

      {/* Session Timer and Progress */}
      {isPlaying && (
        <div style={{
          marginBottom: '32px',
          maxWidth: '400px',
          margin: '0 auto 32px auto'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#4ECDC4',
            textShadow: '0 0 20px rgba(78, 205, 196, 0.4)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '1px',
            marginBottom: '12px'
          }}>
            {formatTime(sessionTime)}
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #4ECDC4, #44B3AA)',
              borderRadius: '4px',
              width: `${Math.min((sessionTime / 900) * 100, 100)}%`,
              transition: 'width 1s linear',
              boxShadow: '0 0 10px rgba(78, 205, 196, 0.5)'
            }}/>
          </div>

          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px',
            marginTop: '8px',
            fontWeight: '500'
          }}>
            {sessionTime < 900
              ? `${Math.floor((900 - sessionTime) / 60)} min remaining in recommended session`
              : '✓ Recommended session length completed!'}
          </div>
        </div>
      )}

      {/* Volume Control - Independent Left/Right */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
        padding: '28px 24px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
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

        {/* Left Ear Volume */}
        <div style={{
          marginBottom: '24px',
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
              if (isPlaying) {
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
              if (isPlaying) {
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
    </div>

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
  </div>
</div>

);
}
