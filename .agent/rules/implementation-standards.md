# Implementation Standards for TinniTune

This document defines mandatory coding standards, patterns, and best practices for all TinniTune development.

**IMPORTANT:** All code must follow these standards. PRs that violate these standards will be rejected.

---

## 🎯 Core Principles

1. **Clinical Safety First** - Audio safety and WHO compliance are non-negotiable
2. **User Privacy** - All data stays local, no external tracking
3. **Accessibility** - WCAG 2.1 AA minimum compliance
4. **Performance** - PWA must feel native, <100ms interaction latency
5. **Evidence-Based** - Features must have clinical or research backing

---

## 🔊 Audio Safety Patterns (MANDATORY)

### 1. Volume Management

```javascript
// ✅ CORRECT - Always use dB scale
const safeVolume = Math.max(-40, Math.min(volumeDb, -10));
oscillator.volume.value = safeVolume; // -40 to -10 dB

// ❌ WRONG - Never use raw gain values for user controls
oscillator.volume.value = 0.5; // Unclear, not safe
```

### 2. Volume Ramping (Prevent Clicks/Pops)

```javascript
// ✅ CORRECT - Always ramp volume changes
gainNode.gain.rampTo(newValue, 0.1); // 100ms ramp
filter.frequency.rampTo(newFreq, 0.5); // 500ms ramp

// ❌ WRONG - Instant changes cause audio artifacts
gainNode.gain.value = newValue; // Creates clicks
```

### 3. Audio Node Cleanup

```javascript
// ✅ CORRECT - Always dispose in try-catch
if (oscillator) {
  try {
    oscillator.stop(); // Stop first
    oscillator.dispose(); // Then dispose
  } catch (e) {
    console.warn('Cleanup error:', e);
  }
  oscillator = null; // Clear reference
}

// ❌ WRONG - No error handling
oscillator.stop();
oscillator.dispose();
```

### 4. Emergency Stop Pattern

```javascript
// ✅ CORRECT - Immediate mute, no guards
const emergencyStop = () => {
  masterGain.gain.cancelScheduledValues(Tone.now());
  masterGain.gain.value = 0; // Immediate mute

  generators.forEach(gen => {
    if (gen && gen.stop) gen.stop();
    if (gen && gen.dispose) gen.dispose();
  });
};

// ❌ WRONG - Conditional guards can silently fail
if (isActive && therapyModule) {
  therapyModule.stop();
}
```

### 5. WHO-Compliant Limits

```javascript
// MANDATORY - These limits must be enforced
const WHO_LIMITS = {
  MAX_CONTINUOUS_DB: 85,
  WARNING_THRESHOLD_DB: 75,
  MAX_SESSION_MINUTES: 480, // 8 hours
  MAX_CONTINUOUS_MINUTES: 60, // 1 hour without break
  MIN_VOLUME_DB: -40, // Floor
  MAX_VOLUME_DB: -10 // Ceiling for user control
};

// Enforce in all volume controls
const clampVolume = (db) => Math.max(WHO_LIMITS.MIN_VOLUME_DB, Math.min(db, WHO_LIMITS.MAX_VOLUME_DB));
```

### 6. Frequency Validation

```javascript
// MANDATORY - Validate all frequency inputs
const validateFrequency = (freq) => {
  const MIN_FREQ = 20; // Hz
  const MAX_FREQ = 20000; // Hz
  const TINNITUS_MIN = 2000; // Typical range
  const TINNITUS_MAX = 12000;

  if (freq < MIN_FREQ || freq > MAX_FREQ) {
    throw new Error(`Frequency ${freq} Hz outside human hearing range (20-20000 Hz)`);
  }

  if (freq < TINNITUS_MIN || freq > TINNITUS_MAX) {
    console.warn(`Frequency ${freq} Hz outside typical tinnitus range (2000-12000 Hz)`);
  }

  return freq;
};
```

---

## ⚛️ React Patterns

### 1. Use Refs for Audio Nodes (NOT State)

```javascript
// ✅ CORRECT - Refs persist across renders
const synthsRef = useRef([]);
const therapyModuleRef = useRef(null);

useEffect(() => {
  synthsRef.current = createSynths();
  return () => {
    synthsRef.current.forEach(s => s.dispose());
  };
}, []);

// ❌ WRONG - State causes unnecessary re-renders
const [synths, setSynths] = useState([]);
```

### 2. Audio Initialization in Effects

```javascript
// ✅ CORRECT - Initialize once, clean up properly
useEffect(() => {
  const initAudio = async () => {
    await Tone.start(); // Required for audio context
    const engine = new TinniTuneAudioEngine();
    await engine.initialize();
    engineRef.current = engine;
  };

  initAudio();

  return () => {
    if (engineRef.current) {
      engineRef.current.dispose();
    }
  };
}, []); // Empty deps - run once

// ❌ WRONG - No cleanup, audio context leaks
useEffect(() => {
  Tone.start();
  new TinniTuneAudioEngine();
}, []);
```

### 3. Callback Stability with useCallback

```javascript
// ✅ CORRECT - Stable callback reference
const handleVolumeChange = useCallback((ear, volumeDb) => {
  if (therapyModuleRef.current) {
    therapyModuleRef.current.updateVolume(ear, volumeDb);
  }
}, []); // No dependencies - always stable

// ❌ WRONG - New function every render
const handleVolumeChange = (ear, volumeDb) => {
  if (therapyModuleRef.current) {
    therapyModuleRef.current.updateVolume(ear, volumeDb);
  }
};
```

### 4. Conditional Rendering

```javascript
// ✅ CORRECT - Clear, explicit conditions
{isLoading ? (
  <LoadingSpinner />
) : error ? (
  <ErrorMessage error={error} />
) : (
  <TherapyControls />
)}

// ❌ WRONG - Nested ternaries (hard to read)
{isLoading ? <LoadingSpinner /> : error ? <ErrorMessage /> : <TherapyControls />}
```

---

## 📦 Data Persistence Patterns

### 1. localStorage Key Convention

```javascript
// ✅ CORRECT - Prefix all keys
const STORAGE_KEYS = {
  SETTINGS: 'tinnitune_settings',
  SESSIONS: 'tinnitune_sessions',
  PROFILES: 'tinnitune_profiles',
  FAVORITES: 'tinnitune_favorites',
  ACHIEVEMENTS: 'tinnitune_achievements',
  NOTIFICATIONS: 'tinnitune_notifications'
};

// ❌ WRONG - No prefix (namespace pollution)
localStorage.setItem('settings', data);
```

### 2. Default Values

```javascript
// ✅ CORRECT - Always provide defaults
const loadSettings = () => {
  const defaults = {
    frequency: 4000,
    volumeLeft: -25,
    volumeRight: -25,
    soundType: 'pink',
    notchEnabled: true
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return defaults;
  }
};

// ❌ WRONG - No error handling, no defaults
const loadSettings = () => {
  return JSON.parse(localStorage.getItem('settings'));
};
```

### 3. Data Migration

```javascript
// ✅ CORRECT - Version your data structures
const CURRENT_VERSION = 2;

const migrateSettings = (settings) => {
  const version = settings._version || 1;

  if (version === 1) {
    // Migrate v1 → v2
    settings.soundType = settings.soundType || 'pink';
    settings._version = 2;
  }

  return settings;
};

const loadSettings = () => {
  let settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
  settings = migrateSettings(settings);
  return settings;
};
```

---

## 🎨 UI/UX Standards

### 1. Glassmorphism Style

```css
/* ✅ CORRECT - Consistent glassmorphism */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Active state */
.glass-card.active {
  background: rgba(78, 205, 196, 0.2);
  border: 2px solid #4ECDC4;
}
```

### 2. Color Palette (Mandatory)

```javascript
const COLORS = {
  // Primary
  TEAL: '#4ECDC4',           // Therapy, calibration, primary actions
  PURPLE: '#667eea',         // Modes, secondary features
  ORANGE: '#FFB74D',         // Calm mode, warnings
  GOLD: '#FCE38A',          // Favorites, achievements

  // Status
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',

  // Neutral
  TEXT_PRIMARY: 'rgba(255, 255, 255, 0.9)',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.6)',
  BACKGROUND: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
};

// ✅ Use semantic names in components
<button style={{ background: COLORS.TEAL }}>Start Therapy</button>

// ❌ Don't use arbitrary colors
<button style={{ background: '#3498db' }}>Start Therapy</button>
```

### 3. Animations & Transitions

```css
/* ✅ CORRECT - Smooth, accessible transitions */
.button {
  transition: all 0.2s ease-in-out;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4. Loading States

```javascript
// ✅ CORRECT - Always show loading state
{isLoading ? (
  <div className="loading-spinner">
    <div className="spinner" />
    <p>Loading therapy engine...</p>
  </div>
) : (
  <TherapyControls />
)}

// ❌ WRONG - No loading feedback
{data && <TherapyControls />}
```

---

## ♿ Accessibility Standards (WCAG 2.1 AA)

### 1. Keyboard Navigation

```javascript
// ✅ CORRECT - Full keyboard support
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
  aria-label="Start therapy session"
>
  Start
</button>

// ❌ WRONG - No keyboard support
<div onClick={handleClick}>Start</div>
```

### 2. ARIA Labels

```javascript
// ✅ CORRECT - Descriptive labels
<input
  type="range"
  min="-40"
  max="-10"
  value={volumeLeft}
  onChange={handleVolumeChange}
  aria-label="Left ear volume in decibels"
  aria-valuemin="-40"
  aria-valuemax="-10"
  aria-valuenow={volumeLeft}
  aria-valuetext={`${volumeLeft} decibels`}
/>

// ❌ WRONG - No labels
<input type="range" value={volumeLeft} onChange={handleVolumeChange} />
```

### 3. Focus Management

```css
/* ✅ CORRECT - Visible focus indicator */
button:focus-visible {
  outline: 3px solid #4ECDC4;
  outline-offset: 2px;
}

/* ❌ WRONG - Removed focus indicator */
button:focus {
  outline: none; /* NEVER do this */
}
```

### 4. Color Contrast

```javascript
// ✅ CORRECT - WCAG AA compliance (4.5:1 minimum)
<p style={{ color: '#FFFFFF', background: '#667eea' }}>
  High contrast text
</p>

// ❌ WRONG - Insufficient contrast
<p style={{ color: '#CCCCCC', background: '#FFFFFF' }}>
  Low contrast text
</p>
```

### 5. Screen Reader Announcements

```javascript
// ✅ CORRECT - Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {sessionDuration > 0 && `Session duration: ${formatTime(sessionDuration)}`}
</div>

// For urgent announcements
<div aria-live="assertive" role="alert">
  {error && `Error: ${error.message}`}
</div>
```

---

## 🧪 Testing Requirements

### 1. Unit Tests (Vitest)

```javascript
// ✅ CORRECT - Test critical audio safety
import { describe, it, expect } from 'vitest';
import { clampVolume, validateFrequency } from './audioUtils';

describe('Audio Safety', () => {
  it('should clamp volume to WHO limits', () => {
    expect(clampVolume(-50)).toBe(-40); // Floor
    expect(clampVolume(0)).toBe(-10);   // Ceiling
    expect(clampVolume(-25)).toBe(-25); // In range
  });

  it('should validate frequency range', () => {
    expect(() => validateFrequency(15)).toThrow(); // Below range
    expect(() => validateFrequency(25000)).toThrow(); // Above range
    expect(validateFrequency(4000)).toBe(4000); // Valid
  });
});
```

### 2. Integration Tests

```javascript
// ✅ CORRECT - Test complete user flows
import { render, screen, fireEvent } from '@testing-library/react';
import { TinniTune } from './TinniTune';

describe('Therapy Session Flow', () => {
  it('should complete full therapy session', async () => {
    render(<TinniTune />);

    // Start therapy
    const startButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startButton);

    // Verify audio started
    expect(screen.getByText(/session active/i)).toBeInTheDocument();

    // Stop therapy
    const stopButton = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopButton);

    // Verify rating form appears
    expect(screen.getByText(/rate your session/i)).toBeInTheDocument();
  });
});
```

### 3. Manual Testing Checklist

Every PR must include confirmation of:

- [ ] Tested on Chrome (desktop)
- [ ] Tested on Safari (desktop)
- [ ] Tested on Chrome (Android)
- [ ] Tested on Safari (iOS)
- [ ] Tested in PWA standalone mode
- [ ] No console errors or warnings
- [ ] Screen reader navigation works (NVDA/VoiceOver)
- [ ] Keyboard navigation works (no mouse)
- [ ] Responsive on mobile (375px width minimum)
- [ ] Audio plays without glitches
- [ ] No memory leaks (check DevTools)

---

## 📊 Performance Standards

### 1. Bundle Size

```javascript
// ✅ CORRECT - Lazy load heavy features
const CalibrationWizard = lazy(() => import('./CalibrationWizard'));
const AdvancedSettings = lazy(() => import('./AdvancedSettings'));

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <CalibrationWizard />
</Suspense>

// ❌ WRONG - Load everything upfront
import CalibrationWizard from './CalibrationWizard';
import AdvancedSettings from './AdvancedSettings';
```

### 2. Audio Performance

```javascript
// ✅ CORRECT - Reuse audio nodes
const masterGain = useRef(new Tone.Gain(0.8).toDestination());

const updateVolume = useCallback((newVol) => {
  masterGain.current.gain.rampTo(newVol, 0.1);
}, []);

// ❌ WRONG - Create new nodes repeatedly
const updateVolume = (newVol) => {
  const gain = new Tone.Gain(newVol).toDestination(); // Memory leak!
};
```

### 3. Render Optimization

```javascript
// ✅ CORRECT - Memoize expensive calculations
const sessionStats = useMemo(() => {
  return calculateDetailedStats(sessions);
}, [sessions]);

// ❌ WRONG - Recalculate every render
const sessionStats = calculateDetailedStats(sessions);
```

---

## 🔒 Security & Privacy

### 1. No External Data Transmission

```javascript
// ✅ CORRECT - All data stays local
const saveSession = (session) => {
  const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS)) || [];
  sessions.push(session);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

// ❌ WRONG - Never send user data externally
fetch('https://analytics.example.com/track', {
  method: 'POST',
  body: JSON.stringify(session) // Privacy violation!
});
```

### 2. Sanitize User Input

```javascript
// ✅ CORRECT - Validate and sanitize
const saveNote = (note) => {
  const sanitized = note.trim().substring(0, 500); // Limit length
  const safe = sanitized.replace(/[<>]/g, ''); // Remove HTML chars
  return safe;
};

// ❌ WRONG - Direct storage of user input
const saveNote = (note) => {
  localStorage.setItem('note', note); // Could contain malicious content
};
```

---

## 📝 Code Documentation

### 1. Function Documentation

```javascript
/**
 * Creates a notched filter at the specified tinnitus frequency.
 *
 * @param {number} frequency - Tinnitus frequency in Hz (20-20000)
 * @param {number} Q - Quality factor (0.5-4.0), higher = narrower notch
 * @param {number} volumeDb - Volume in decibels (-40 to -10)
 * @returns {Object} Filter chain with { filter, gain }
 * @throws {Error} If frequency is outside valid range
 *
 * @example
 * const notch = createNotchFilter(4000, 2.0, -25);
 * oscillator.connect(notch.filter);
 */
const createNotchFilter = (frequency, Q, volumeDb) => {
  // Implementation...
};
```

### 2. Complex Logic Comments

```javascript
// ✅ CORRECT - Explain WHY, not WHAT
// Use Q-factor for bandwidth control instead of fixed Hz width
// because tinnitus perception varies logarithmically with frequency
const notchWidth = calculateNotchWidth(frequency, Q);

// ❌ WRONG - Obvious comments
// Calculate notch width
const notchWidth = calculateNotchWidth(frequency, Q);
```

---

## 🚫 Anti-Patterns to Avoid

### 1. Don't Use Direct DOM Manipulation

```javascript
// ❌ WRONG - Direct DOM manipulation
document.getElementById('timer').innerHTML = formatTime(seconds);

// ✅ CORRECT - React state
const [seconds, setSeconds] = useState(0);
return <div>{formatTime(seconds)}</div>;
```

### 2. Don't Use `var`

```javascript
// ❌ WRONG - var has function scope
var volume = -25;

// ✅ CORRECT - Use const/let with block scope
const INITIAL_VOLUME = -25;
let currentVolume = INITIAL_VOLUME;
```

### 3. Don't Mutate Props or State

```javascript
// ❌ WRONG - Mutating state
settings.frequency = 5000;
setSettings(settings);

// ✅ CORRECT - Immutable update
setSettings({ ...settings, frequency: 5000 });
```

### 4. Don't Skip Error Handling

```javascript
// ❌ WRONG - No error handling
const startAudio = async () => {
  await Tone.start();
  engine.initialize();
};

// ✅ CORRECT - Comprehensive error handling
const startAudio = async () => {
  try {
    await Tone.start();
    await engine.initialize();
  } catch (error) {
    console.error('Failed to start audio:', error);
    setError('Unable to initialize audio. Please check your browser permissions.');
    // Fallback or user guidance
  }
};
```

---

## ✅ PR Checklist

Before submitting a PR, verify:

### Code Quality
- [ ] Follows all audio safety patterns
- [ ] Uses refs (not state) for audio nodes
- [ ] Implements proper cleanup in useEffect
- [ ] No console.log statements (use console.error/warn only)
- [ ] No hardcoded values (use constants)
- [ ] Follows naming conventions (camelCase for variables, PascalCase for components)

### Testing
- [ ] All existing tests pass
- [ ] New tests added for new features
- [ ] Manual testing completed (see checklist above)
- [ ] No browser console errors

### Accessibility
- [ ] ARIA labels added where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Tested with screen reader

### Performance
- [ ] No unnecessary re-renders (check React DevTools)
- [ ] Audio nodes reused, not recreated
- [ ] Large components lazy-loaded
- [ ] Images optimized

### Documentation
- [ ] Complex functions documented
- [ ] README updated if needed
- [ ] CHANGELOG.md updated
- [ ] Comments explain WHY, not WHAT

### Security & Privacy
- [ ] No external data transmission
- [ ] User input sanitized
- [ ] localStorage keys use proper prefix

---

## 📚 Additional Resources

- [CLAUDE.md](../../CLAUDE.md) - TinniTune-specific patterns
- [Tone.js Docs](https://tonejs.github.io/)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WHO Hearing Safety](https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss)

---

**Remember:** These standards exist to ensure TinniTune is safe, accessible, and effective for all users. When in doubt, err on the side of caution and safety.
