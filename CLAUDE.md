# TinniTune - Tinnitus Therapy Application

## Project Overview

TinniTune is a clinical-grade tinnitus therapy Progressive Web App (PWA) that provides sound-based therapy using notched sound therapy and binaural beats. The application features two audio engines: a legacy engine and a new clinical-grade engine with advanced features.

## Build and Test Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy

# Tests (not yet configured)
npm test
```

## Tech Stack

### Core Dependencies
- **React 18.2.0** - UI framework
- **Tone.js 15.0.4** - Web Audio API wrapper for sound generation and processing
- **Vite 5.0.12** - Build tool and dev server

### Audio Libraries

#### Primary: Tone.js
- **Purpose**: High-level Web Audio API wrapper
- **Usage**:
  - Sound synthesis (oscillators, noise generators)
  - Audio routing and effects (panners, filters, gain nodes)
  - Scheduling and transport control
  - Volume management (dB conversions)

#### Underlying: Web Audio API
- **Purpose**: Low-level browser audio processing
- **Direct Usage**:
  - Audio context management
  - Sample rate control
  - Latency management

## Architecture

### Dual Audio Engine System

#### Legacy Engine (`/src/TinniTune.jsx`)
- **Pattern**: React refs for audio nodes (`synthsRef.current`)
- **Routing**: Direct Tone.js panners to destination
- **Features**: Basic notched therapy, binaural beats
- **Stop Pattern**: Direct disposal of ref array

#### New Clinical Engine (`/src/audio-engine/`)
- **Pattern**: React ref (`therapyModuleRef.current`) + engine registry
- **Routing**: Modular chain with master gain control
- **Features**: Advanced notch (Q-factor based), real-time parameter updates, safety monitoring
- **Stop Pattern**: Direct module stop + emergency engine mute

### Audio Engine Components

```
/src/audio-engine/
├── TinniTuneAudioEngine.js       # Core routing and lifecycle
├── ClinicalTherapyModule.js      # Notched therapy + binaural beats
├── ThreeAFCTester.js             # Clinical frequency testing (3AFC methodology)
└── CalibrationSafetyModule.js    # WHO-compliant safety monitoring
```

## Audio Safety Patterns

### 1. Volume Management

```javascript
// ALWAYS use dB scale, never raw gain values
const safeVolume = Math.max(-40, Math.min(volumeDb, -10));

// ALWAYS use ramping for volume changes (prevent clicks/pops)
gainNode.gain.rampTo(newValue, 0.1); // 100ms ramp

// Master gain reset pattern
masterGain.gain.cancelScheduledValues(Tone.now());
masterGain.gain.value = 0.8; // Reset to safe default
```

### 2. WHO-Compliant Safety Limits

See `CalibrationSafetyModule.js`:
```javascript
const SAFE_LISTENING_LIMITS = {
  maxContinuousDb: 85,           // Max continuous exposure
  warningThresholdDb: 75,        // Warning threshold
  maxSessionMinutes: 480,        // 8 hours max
  maxContinuousMinutes: 60       // 1 hour continuous
};
```

### 3. Frequency Limits

```javascript
// Human hearing range limits
const MIN_FREQUENCY = 20;    // Hz
const MAX_FREQUENCY = 20000; // Hz

// Tinnitus typical range
const TYPICAL_MIN = 2000;    // Hz
const TYPICAL_MAX = 12000;   // Hz
```

### 4. Audio Context Management

```javascript
// ALWAYS initialize in response to user interaction
await Tone.start(); // Must be called before any audio

// Verify context state
if (Tone.context.state !== 'running') {
  console.warn('Audio context not running');
}

// Handle visibility changes (PWA background playback)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Keep playing - PWA should continue
  }
});
```

### 5. Graceful Cleanup Pattern

```javascript
// ALWAYS use try-catch for audio node disposal
if (node) {
  try {
    if (node.stop) node.stop();  // Stop first
    node.dispose();               // Then dispose
  } catch (e) {
    console.warn('Cleanup error:', e);
  }
  node = null; // Clear reference
}
```

### 6. Emergency Stop Pattern

```javascript
// Immediate audio mute (no fade)
masterGain.gain.cancelScheduledValues(Tone.now());
masterGain.gain.value = 0;

// Stop all generators
generators.forEach(gen => {
  if (gen.stop) gen.stop();
  gen.dispose();
});
```

## Coding Standards

### React Patterns

#### 1. Use Refs for Audio Nodes (Persist Across Renders)

```javascript
// ✅ CORRECT - Refs persist across renders
const synthsRef = useRef([]);
const therapyModuleRef = useRef(null);

// ❌ WRONG - State causes re-renders and can become stale
const [synths, setSynths] = useState([]);
```

#### 2. Audio Initialization in Effects

```javascript
useEffect(() => {
  // Initialize engine once
  const initEngine = async () => {
    await Tone.start();
    const engine = getAudioEngine();
    await engine.initialize();
    setEngineInstance(engine);
  };

  initEngine();
}, []); // Empty deps - run once
```

#### 3. Always Clean Up Audio Resources

```javascript
useEffect(() => {
  // Setup
  const osc = new Tone.Oscillator().start();

  // Cleanup
  return () => {
    osc.stop();
    osc.dispose();
  };
}, [dependency]);
```

### Audio Processing Standards

#### 1. Volume Control

```javascript
// Use built-in volume property for Tone.js sources
oscillator.volume.value = -20; // dB

// Use Gain nodes for routing/mixing
const gain = new Tone.Gain(1.0); // Linear gain 0-1
```

#### 2. Stereo Routing

```javascript
// Create separate channels
const leftPanner = new Tone.Panner(-1);  // Full left
const rightPanner = new Tone.Panner(1);  // Full right

// Connect to master
leftPanner.connect(masterGain);
rightPanner.connect(masterGain);
```

#### 3. Real-Time Parameter Updates

```javascript
// ✅ Use ramping for smooth transitions
filter.frequency.rampTo(newFreq, 1.0); // 1 second ramp

// ❌ Avoid instant changes (causes clicks)
filter.frequency.value = newFreq; // Bad - instant change
```

### Accessibility Standards

#### 1. Keyboard Navigation

```javascript
// All interactive elements must be keyboard accessible
<button
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>
  Control
</button>
```

#### 2. Visual Feedback

```javascript
// Provide clear visual state
style={{
  background: isActive ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255,255,255,0.05)',
  border: isActive ? '2px solid #4ECDC4' : '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer',
  transition: 'all 0.2s' // Smooth transitions
}}
```

#### 3. Volume Safety Warnings

```javascript
// ALWAYS warn before exceeding safe levels
if (volumeDb > SAFE_LISTENING_LIMITS.warningThresholdDb) {
  alert('⚠️ Volume level is high. Consider reducing to protect hearing.');
}
```

### Performance Standards

#### 1. Audio Node Reuse

```javascript
// ✅ GOOD - Reuse nodes when possible
const masterGain = new Tone.Gain(0.8).toDestination();
// Keep reference, adjust parameters

// ❌ BAD - Don't recreate nodes unnecessarily
function updateVolume() {
  const gain = new Tone.Gain(newVol); // Creates new node every time
}
```

#### 2. Batch Parameter Updates

```javascript
// ✅ GOOD - Batch related updates
Tone.Transport.cancel(); // Clear all
Tone.Transport.scheduleRepeat(callback, interval);
Tone.Transport.start();

// ❌ BAD - Multiple transport manipulations
Tone.Transport.start();
Tone.Transport.stop();
Tone.Transport.start();
```

#### 3. Minimize Re-renders

```javascript
// Use useCallback for event handlers
const handleVolumeChange = useCallback((newVol) => {
  if (therapyModuleRef.current) {
    therapyModuleRef.current.updateVolume('left', newVol);
  }
}, []); // No dependencies - stable reference
```

### Storage Patterns

#### localStorage Keys Convention

```javascript
// Prefix all keys with 'tinnitune_'
const STORAGE_KEYS = {
  SETTINGS: 'tinnitune_settings',
  FAVORITES: 'tinnitune_favorites',
  SESSIONS: 'tinnitune_sessions',
  SEEN_PROMPTS: 'tinnitune_seen_install_prompt'
};
```

#### Settings Structure

```javascript
// Always provide defaults
const defaultSettings = {
  frequency: 4000,
  volumeLeft: -25,
  volumeRight: -25,
  ear: 'both',
  notchEnabled: true,
  notchIntensity: 'standard',
  binauralEnabled: true,
  mode: 'daytime'
};

// Merge with stored settings
const loadSettings = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
};
```

## Clinical Features

### Notched Sound Therapy

Based on clinical research for tinnitus treatment:

```javascript
// Q-factor determines notch bandwidth
const NOTCH_INTENSITIES = {
  gentle: { Q: 0.5, bandwidth: '2 octaves' },
  moderate: { Q: 1.0, bandwidth: '1 octave' },
  strong: { Q: 2.0, bandwidth: '0.5 octaves' },
  precise: { Q: 4.0, bandwidth: '0.25 octaves' }
};

// Create notch filter
const notchFilter = new Tone.Filter({
  type: 'notch',
  frequency: tinnitusFrequency,
  Q: preset.Q,
  rolloff: -12
});
```

### Binaural Beats

For anxiety management and relaxation:

```javascript
const BINAURAL_MODES = {
  focus: { baseFreq: 200, beatFreq: 10, wave: 'Alpha' },
  calm: { baseFreq: 200, beatFreq: 6, wave: 'Theta' },
  sleep: { baseFreq: 200, beatFreq: 3, wave: 'Delta' }
};

// Create binaural beat
const leftOsc = new Tone.Oscillator(baseFreq, 'sine');
const rightOsc = new Tone.Oscillator(baseFreq + beatFreq, 'sine');
```

### 3AFC Frequency Testing

Clinical-grade frequency matching:

```javascript
// Three-Alternative Forced Choice methodology
// User identifies which interval contains the tone
// Adaptive staircase procedure converges on tinnitus frequency
```

## PWA Features

### Wake Lock API

Prevents phone from sleeping during therapy:

```javascript
let wakeLock = null;

const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    wakeLock = await navigator.wakeLock.request('screen');
  }
};

const releaseWakeLock = () => {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
};
```

### Installation Prompts

```javascript
// Detect iOS standalone mode
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = window.navigator.standalone;

// Show appropriate install instructions
if (isIOS && !isStandalone) {
  // Show "Add to Home Screen" instructions
}
```

## Common Pitfalls

### ❌ DON'T

1. **Don't use state for audio nodes** - Use refs instead
2. **Don't create audio context without user interaction** - Browser policy violation
3. **Don't skip volume ramping** - Causes audio clicks/pops
4. **Don't forget cleanup** - Memory leaks and continued playback
5. **Don't use `engine.stop()` with guards** - Can silently fail, use `emergencyStop()`
6. **Don't rely on registry lookups** - Use refs that persist across renders

### ✅ DO

1. **Use refs for all audio-related objects** - Same pattern as legacy mode
2. **Initialize audio in response to user action** - `await Tone.start()`
3. **Always ramp volume changes** - `gain.rampTo(value, time)`
4. **Dispose audio nodes in cleanup** - Prevent memory leaks
5. **Use emergency stop for reliability** - No guards, immediate effect
6. **Provide visual feedback** - Loading states, volume indicators

## Debugging Audio Issues

### Enable Logging

```javascript
// Engine has built-in logging
const engine = new TinniTuneAudioEngine({
  enableLogging: true
});

// Check audio context state
console.log('Context state:', Tone.context.state);
console.log('Sample rate:', Tone.context.sampleRate);
```

### Common Issues

1. **No sound after mode switch**
   - Check if `isActive` guard is blocking stop
   - Verify module ref is current
   - Use `emergencyStop()` instead of `stop()`

2. **Clicking/popping sounds**
   - Add volume ramping: `gain.rampTo(value, 0.1)`
   - Cancel scheduled values before changes

3. **Multiple instances playing**
   - Clean up old ref before creating new: `ref.current = null`
   - Use `dispose()` to ensure cleanup

4. **Stop button not working**
   - Use ref instead of state
   - Remove conditional guards from stop methods
   - Call `emergencyStop()` for immediate effect

## Contributing

When adding new audio features:

1. Follow the ref-based pattern (see legacy mode)
2. Add volume ramping for all parameter changes
3. Implement proper cleanup in useEffect returns
4. Test with both engines (legacy and new)
5. Verify WHO safety limits are respected
6. Add appropriate error handling and logging

## License

MIT
