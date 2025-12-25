import React, { useState, useRef } from ‘react’;
import * as Tone from ‘tone’;

export default function TinniTune() {
const [step, setStep] = useState(‘welcome’); // ‘welcome’, ‘setup’, ‘therapy’, ‘history’
const [frequency, setFrequency] = useState(4000);
const [ear, setEar] = useState(‘left’);
const [isPlaying, setIsPlaying] = useState(false);
const [mode, setMode] = useState(‘daytime’);
const [volumeLeft, setVolumeLeft] = useState(-25);
const [volumeRight, setVolumeRight] = useState(-25);
const [sessionTime, setSessionTime] = useState(0);
const [notchEnabled, setNotchEnabled] = useState(true); // Notch therapy ON by default
const [notchIntensity, setNotchIntensity] = useState(‘standard’); // ‘gentle’, ‘standard’, ‘strong’
const [sessionStartTime, setSessionStartTime] = useState(null); // Track when session started
const [sessions, setSessions] = useState([]); // Array of past sessions
const [showRatingModal, setShowRatingModal] = useState(false); // Show post-session rating
const [currentRatings, setCurrentRatings] = useState({
loudnessBefore: 5,
loudnessAfter: 5,
distress: 5,
notes: ‘’
});

const synthsRef = useRef([]);
const pannerLeftRef = useRef(null);
const pannerRightRef = useRef(null);
const notchFiltersRef = useRef([]); // Store notch filters separately
const timerRef = useRef(null);

// Load session history from localStorage on mount
React.useEffect(() => {
try {
const savedSessions = localStorage.getItem(‘tinnitune_sessions’);
if (savedSessions) {
setSessions(JSON.parse(savedSessions));
}
} catch (error) {
console.error(‘Error loading sessions:’, error);
}
}, []);

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

const formatTime = (seconds) => {
const mins = Math.floor(seconds / 60);
const secs = seconds % 60;
return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getModeConfig = (m) => {
const modes = {
daytime: { name: ‘Daytime Focus’, freq: 10, color: ‘#667eea’, emoji: ‘☀️’ },
evening: { name: ‘Evening Calm’, freq: 6, color: ‘#f093fb’, emoji: ‘🌅’ },
sleep: { name: ‘Deep Sleep’, freq: 2, color: ‘#4ECDC4’, emoji: ‘🌙’ }
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
if (duration < 30) return; // Don’t save sessions shorter than 30 seconds

```
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
```

};

// Calculate statistics from sessions
const getStats = () => {
if (sessions.length === 0) {
return {
totalSessions: 0,
totalTime: 0,
avgDuration: 0,
mostUsedMode: ‘none’,
streak: 0
};
}

```
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
```

};

// Detect milestones
const getMilestones = () => {
const stats = getStats();
const milestones = [];

```
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
```

};

const startAudio = async () => {
try {
await Tone.start();
console.log(‘Audio context started’);

```
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
```

};

const stopAudio = () => {
synthsRef.current.forEach(synth => {
try {
synth.stop();
synth.dispose();
} catch (e) {}
});
synthsRef.current = [];

```
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

console.log('Audio stopped - Session length:', formatTime(sessionTime));
```

};

const testTone = async () => {
try {
await Tone.start();

```
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
```

};

if (step === ‘welcome’) {
return (
<div style={{
minHeight: ‘100vh’,
background: ‘linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)’,
display: ‘flex’,
alignItems: ‘center’,
justifyContent: ‘center’,
padding: ‘20px’,
fontFamily: ‘system-ui, sans-serif’
}}>
<div style={{
maxWidth: ‘500px’,
background: ‘rgba(255, 255, 255, 0.1)’,
padding: ‘60px 40px’,
borderRadius: ‘20px’,
textAlign: ‘center’,
backdropFilter: ‘blur(10px)’
}}>
<div style={{ fontSize: ‘64px’, marginBottom: ‘20px’ }}>🎧</div>
<h1 style={{
fontSize: ‘48px’,
color: ‘#4ECDC4’,
margin: ‘0 0 20px 0’,
fontWeight: ‘bold’
}}>TinniTune</h1>
<p style={{
color: ‘rgba(255, 255, 255, 0.8)’,
fontSize: ‘16px’,
marginBottom: ‘40px’
}}>
Sound therapy for tinnitus relief
</p>
<button
onClick={() => {
console.log(‘Begin button clicked’);
setStep(‘setup’);
}}
style={{
background: ‘linear-gradient(135deg, #667eea, #764ba2)’,
color: ‘white’,
border: ‘none’,
padding: ‘18px 48px’,
fontSize: ‘18px’,
borderRadius: ‘12px’,
cursor: ‘pointer’,
fontWeight: ‘bold’
}}
>
Begin Setup
</button>
</div>
</div>
);
}

if (step === ‘setup’) {
return (
<div style={{
minHeight: ‘100vh’,
background: ‘linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)’,
display: ‘flex’,
alignItems: ‘center’,
justifyContent: ‘center’,
padding: ‘20px’,
fontFamily: ‘system-ui, sans-serif’
}}>
<div style={{
maxWidth: ‘600px’,
background: ‘rgba(255, 255, 255, 0.1)’,
padding: ‘50px 40px’,
borderRadius: ‘20px’,
backdropFilter: ‘blur(10px)’
}}>
<h2 style={{ color: ‘white’, fontSize: ‘32px’, marginBottom: ‘30px’ }}>
Setup Your Therapy
</h2>

```
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
```

}

// History screen
if (step === ‘history’) {
const stats = getStats();
const milestones = getMilestones();
const modeNames = {
daytime: ‘☀️ Daytime’,
evening: ‘🌅 Evening’,
sleep: ‘🌙 Sleep’
};

```
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
```

}

// Therapy screen
return (
<div style={{
minHeight: ‘100vh’,
background: ‘linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #253447 100%)’,
padding: ‘20px’,
fontFamily: ‘-apple-system, BlinkMacSystemFont, “SF Pro Display”, “Segoe UI”, sans-serif’,
position: ‘relative’,
overflow: ‘hidden’
}}>
{/* Rating Modal Overlay */}
{showRatingModal && (
<div style={{
position: ‘fixed’,
top: 0,
left: 0,
right: 0,
bottom: 0,
background: ‘rgba(0, 0, 0, 0.85)’,
backdropFilter: ‘blur(10px)’,
display: ‘flex’,
alignItems: ‘center’,
justifyContent: ‘center’,
zIndex: 1000,
padding: ‘20px’
}}>
<div style={{
background: ‘linear-gradient(135deg, #1a2332 0%, #253447 100%)’,
padding: ‘32px’,
borderRadius: ‘24px’,
maxWidth: ‘500px’,
width: ‘100%’,
border: ‘1px solid rgba(78, 205, 196, 0.3)’,
boxShadow: ‘0 20px 60px rgba(0, 0, 0, 0.5)’
}}>
<h2 style={{
color: ‘#4ECDC4’,
fontSize: ‘24px’,
fontWeight: ‘700’,
marginBottom: ‘8px’,
textAlign: ‘center’
}}>
How Do You Feel?
</h2>
<p style={{
color: ‘rgba(255,255,255,0.6)’,
fontSize: ‘14px’,
marginBottom: ‘24px’,
textAlign: ‘center’
}}>
Great session! Help us track your progress by rating your tinnitus.
</p>

```
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
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
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
      {isPlaying && (
        <div style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: '#4ECDC4',
          textShadow: '0 0 20px rgba(78, 205, 196, 0.4)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '1px'
        }}>
          {formatTime(sessionTime)}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            if (isPlaying) stopAudio();
            setStep('history');
          }}
          style={{
            padding: '8px 18px',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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
            padding: '8px 18px',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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

    {/* Notch Therapy Controls - Simple & Easy */}
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{ 
            color: 'white', 
            fontSize: '16px', 
            fontWeight: '700',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎯 Notch Therapy
            {notchEnabled && (
              <span style={{
                fontSize: '11px',
                background: 'rgba(78, 205, 196, 0.3)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: '600',
                color: '#4ECDC4'
              }}>
                ACTIVE at {frequency}Hz
              </span>
            )}
          </div>
          <div style={{ 
            color: 'rgba(255,255,255,0.7)', 
            fontSize: '12px',
            lineHeight: '1.4'
          }}>
            {notchEnabled 
              ? frequency > 8000 
                ? 'Clinically proven to reduce tinnitus over time'
                : 'Optimal frequency range for therapy'
              : 'Enable for clinically-proven relief'
            }
          </div>
        </div>
        
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
            padding: '10px 20px',
            background: notchEnabled 
              ? 'linear-gradient(135deg, #4ECDC4, #44B3AA)' 
              : 'rgba(255,255,255,0.15)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '700',
            boxShadow: notchEnabled 
              ? '0 4px 16px rgba(78, 205, 196, 0.3)' 
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
          {notchEnabled ? 'ON ✓' : 'OFF'}
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

      {/* Volume Control - Independent Left/Right */}
      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          <span style={{ 
            color: 'rgba(255,255,255,0.7)', 
            fontSize: '13px', 
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Volume Control
          </span>
        </div>

        {/* Left Ear Volume */}
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
            alignItems: 'center'
          }}>
            <span style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '14px', 
              fontWeight: '600'
            }}>
              👂 Left Ear
            </span>
            <span style={{ 
              color: '#4ECDC4', 
              fontSize: '15px', 
              fontWeight: '700',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {Math.round((volumeLeft + 40) / 30 * 100)}%
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
              height: '6px',
              borderRadius: '3px',
              cursor: 'pointer',
              appearance: 'none',
              background: `linear-gradient(to right, 
                #4ECDC4 0%, 
                #4ECDC4 ${((volumeLeft + 40) / 30) * 100}%, 
                rgba(255, 255, 255, 0.15) ${((volumeLeft + 40) / 30) * 100}%, 
                rgba(255, 255, 255, 0.15) 100%)`
            }}
          />
        </div>

        {/* Right Ear Volume */}
        <div style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
            alignItems: 'center'
          }}>
            <span style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '14px', 
              fontWeight: '600'
            }}>
              Right Ear 👂
            </span>
            <span style={{ 
              color: '#4ECDC4', 
              fontSize: '15px', 
              fontWeight: '700',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {Math.round((volumeRight + 40) / 30 * 100)}%
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
              height: '6px',
              borderRadius: '3px',
              cursor: 'pointer',
              appearance: 'none',
              background: `linear-gradient(to right, 
                #667eea 0%, 
                #667eea ${((volumeRight + 40) / 30) * 100}%, 
                rgba(255, 255, 255, 0.15) ${((volumeRight + 40) / 30) * 100}%, 
                rgba(255, 255, 255, 0.15) 100%)`
            }}
          />
        </div>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          💡 Adjust each ear independently for optimal balance
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
```

);
}
