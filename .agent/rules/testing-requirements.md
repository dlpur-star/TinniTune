# Testing Requirements for TinniTune

All features must pass comprehensive testing before deployment. This document defines testing standards and methodologies.

---

## 🎯 Testing Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /----\     - Critical user flows
     /      \    - Cross-browser testing
    /--------\
   /          \  Integration Tests (25%)
  /------------\ - Component interactions
 /              \- Audio engine workflows
/----------------\
|  Unit Tests    | Unit Tests (70%)
|  (70%)         | - Pure functions
|                | - Audio utilities
|                | - Data transformations
------------------
```

**Philosophy:** More unit tests, fewer integration tests, minimal E2E tests.

---

## 🧪 Unit Testing Standards

### Required Coverage

- **Minimum:** 70% code coverage
- **Target:** 85% code coverage
- **Critical paths:** 100% coverage (audio safety, volume control, frequency validation)

### Test File Naming

```
src/
├── utils/
│   ├── audioUtils.js
│   └── audioUtils.test.js        ✅ Co-located tests
├── components/
│   ├── SessionTimer.jsx
│   └── SessionTimer.test.jsx     ✅ Co-located tests
```

### Unit Test Template

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { functionUnderTest } from './module';

describe('Module Name - Function Name', () => {
  // Setup
  beforeEach(() => {
    // Initialize test data
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Happy Path', () => {
    it('should handle valid input correctly', () => {
      const result = functionUnderTest(validInput);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum boundary value', () => {
      const result = functionUnderTest(minValue);
      expect(result).toBeDefined();
    });

    it('should handle maximum boundary value', () => {
      const result = functionUnderTest(maxValue);
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid input', () => {
      expect(() => functionUnderTest(invalidInput)).toThrow();
    });
  });
});
```

### Critical Unit Tests

#### 1. Volume Safety

```javascript
describe('Volume Clamping', () => {
  it('should clamp volume below minimum to -40dB', () => {
    expect(clampVolume(-50)).toBe(-40);
    expect(clampVolume(-100)).toBe(-40);
  });

  it('should clamp volume above maximum to -10dB', () => {
    expect(clampVolume(0)).toBe(-10);
    expect(clampVolume(10)).toBe(-10);
  });

  it('should not modify volume within safe range', () => {
    expect(clampVolume(-25)).toBe(-25);
    expect(clampVolume(-15)).toBe(-15);
  });
});
```

#### 2. Frequency Validation

```javascript
describe('Frequency Validation', () => {
  it('should accept frequencies in tinnitus range', () => {
    expect(validateFrequency(4000)).toBe(4000);
    expect(validateFrequency(8000)).toBe(8000);
  });

  it('should throw for frequencies below 20 Hz', () => {
    expect(() => validateFrequency(10)).toThrow('outside human hearing range');
  });

  it('should throw for frequencies above 20000 Hz', () => {
    expect(() => validateFrequency(25000)).toThrow('outside human hearing range');
  });

  it('should warn for frequencies outside typical tinnitus range', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');
    validateFrequency(500); // Below typical range
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});
```

#### 3. Session Duration Calculation

```javascript
describe('Session Duration Formatting', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('should format minutes and seconds correctly', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3600)).toBe('60:00');
  });
});
```

---

## 🔗 Integration Testing

### React Testing Library Standards

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TinniTune } from './TinniTune';

describe('Therapy Session Integration', () => {
  it('should start and stop therapy session', async () => {
    render(<TinniTune />);

    // Start therapy
    const startButton = screen.getByRole('button', { name: /start therapy/i });
    await userEvent.click(startButton);

    // Verify session started
    expect(screen.getByText(/session active/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();

    // Wait for timer to update
    await waitFor(() => {
      expect(screen.getByText(/0:01/)).toBeInTheDocument();
    }, { timeout: 1500 });

    // Stop session
    const stopButton = screen.getByRole('button', { name: /stop/i });
    await userEvent.click(stopButton);

    // Verify rating form appears
    expect(screen.getByText(/rate your session/i)).toBeInTheDocument();
  });
});
```

### Audio Engine Integration Tests

```javascript
describe('ClinicalTherapyModule Integration', () => {
  let engine;
  let module;

  beforeEach(async () => {
    engine = new TinniTuneAudioEngine();
    await engine.initialize();
    module = new ClinicalTherapyModule(engine);
  });

  afterEach(() => {
    module.stop();
    engine.dispose();
  });

  it('should start therapy with notch filter', async () => {
    const config = {
      frequency: 4000,
      notchQ: 2.0,
      volumeLeft: -25,
      volumeRight: -25,
      mode: 'daytime'
    };

    await module.start(config);

    expect(module.isActive).toBe(true);
    expect(module.currentFrequency).toBe(4000);
  });

  it('should update notch frequency in real-time', async () => {
    await module.start({ frequency: 4000, notchQ: 2.0 });

    module.updateNotchFrequency(5000);

    // Verify frequency updated
    expect(module.currentFrequency).toBe(5000);
  });
});
```

---

## 🌐 Cross-Browser Testing

### Required Browsers

| Browser | Desktop | Mobile | Priority |
|---------|---------|--------|----------|
| Chrome | ✅ | ✅ | P0 |
| Safari | ✅ | ✅ (iOS) | P0 |
| Firefox | ✅ | ❌ | P1 |
| Edge | ✅ | ❌ | P2 |

### Testing Checklist

For each browser:

#### Audio Functionality
- [ ] Audio context starts on user interaction
- [ ] Notch filter applies correctly
- [ ] Binaural beats generate stereo sound
- [ ] Volume controls work smoothly
- [ ] No audio glitches or crackling
- [ ] Emergency stop mutes immediately

#### UI/UX
- [ ] Glassmorphism effects render correctly
- [ ] Animations run smoothly (60 fps)
- [ ] Touch events work on mobile
- [ ] Gestures work (swipe, pinch)
- [ ] Layout responsive at all screen sizes

#### PWA Features
- [ ] Service worker registers
- [ ] Install prompt appears (where supported)
- [ ] Offline mode works (if enabled)
- [ ] Wake lock prevents sleep during therapy
- [ ] Icons display correctly in standalone mode

#### Performance
- [ ] Initial load < 3 seconds (3G network)
- [ ] Interaction latency < 100ms
- [ ] Memory usage stable (no leaks)
- [ ] Battery drain acceptable (< 5% per hour)

---

## ♿ Accessibility Testing

### Tools

1. **Automated:** axe DevTools, Lighthouse
2. **Screen Readers:**
   - **Windows:** NVDA (free)
   - **macOS:** VoiceOver (built-in)
   - **iOS:** VoiceOver (built-in)
   - **Android:** TalkBack (built-in)

### Screen Reader Test Cases

```javascript
describe('Accessibility - Screen Reader', () => {
  it('should announce session start', async () => {
    render(<TinniTune />);

    const startButton = screen.getByRole('button', { name: /start therapy/i });
    await userEvent.click(startButton);

    // Verify live region announces status
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent(/therapy session started/i);
  });

  it('should provide accessible volume controls', () => {
    render(<VolumeControl ear="left" value={-25} />);

    const slider = screen.getByRole('slider', { name: /left ear volume/i });
    expect(slider).toHaveAttribute('aria-valuemin', '-40');
    expect(slider).toHaveAttribute('aria-valuemax', '-10');
    expect(slider).toHaveAttribute('aria-valuenow', '-25');
    expect(slider).toHaveAttribute('aria-valuetext', '-25 decibels');
  });
});
```

### Keyboard Navigation Test

```javascript
describe('Keyboard Navigation', () => {
  it('should navigate all controls with Tab', () => {
    render(<TinniTune />);

    // Get all interactive elements
    const interactiveElements = screen.getAllByRole(/button|slider|link/);

    interactiveElements.forEach(element => {
      expect(element).toHaveAttribute('tabIndex');
      element.focus();
      expect(document.activeElement).toBe(element);
    });
  });

  it('should activate button with Enter and Space', async () => {
    const handleClick = vi.fn();
    render(<button onClick={handleClick}>Start</button>);

    const button = screen.getByRole('button');
    button.focus();

    // Test Enter key
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Test Space key
    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
```

### Color Contrast Test

Use axe DevTools or manual calculation:

```javascript
// Minimum contrast ratios (WCAG 2.1 AA)
const CONTRAST_REQUIREMENTS = {
  NORMAL_TEXT: 4.5,      // < 18pt or < 14pt bold
  LARGE_TEXT: 3.0,       // >= 18pt or >= 14pt bold
  UI_COMPONENTS: 3.0     // Buttons, form inputs, etc.
};

// Example test
describe('Color Contrast', () => {
  it('should meet WCAG AA standards', () => {
    const { container } = render(<TinniTune />);

    // Use axe
    const results = axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
```

---

## 📱 Mobile Testing

### Device Coverage

**iOS:**
- iPhone SE (small screen)
- iPhone 14 Pro (notch)
- iPad (tablet)

**Android:**
- Pixel 6 (standard)
- Samsung Galaxy S22 (Samsung browser)
- Generic Android tablet

### Mobile-Specific Tests

#### Touch Events
```javascript
describe('Mobile Touch Interactions', () => {
  it('should handle touch gestures on volume slider', async () => {
    render(<VolumeControl />);

    const slider = screen.getByRole('slider');

    // Simulate touch
    fireEvent.touchStart(slider, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(slider, { touches: [{ clientX: 150 }] });
    fireEvent.touchEnd(slider);

    // Verify volume changed
    expect(slider).toHaveAttribute('aria-valuenow', expect.any(String));
  });
});
```

#### Viewport Sizes
```javascript
describe('Responsive Layout', () => {
  const viewports = [
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1920, height: 1080, name: 'Desktop' }
  ];

  viewports.forEach(({ width, height, name }) => {
    it(`should render correctly on ${name} (${width}x${height})`, () => {
      global.innerWidth = width;
      global.innerHeight = height;
      global.dispatchEvent(new Event('resize'));

      render(<TinniTune />);

      // Verify key elements are visible
      expect(screen.getByRole('button', { name: /start/i })).toBeVisible();
    });
  });
});
```

---

## 🎵 Audio Testing

### Manual Audio Test Checklist

Since audio testing is difficult to automate, perform these manual tests:

#### Frequency Accuracy
- [ ] Play 1000 Hz tone → verify with frequency analyzer app
- [ ] Play 4000 Hz tone → verify matches calibration
- [ ] Notch filter removes correct frequency (use spectrum analyzer)

#### Volume Control
- [ ] Volume slider moves smoothly without clicks
- [ ] Left/right channels are independent
- [ ] Volume changes ramp smoothly (no pops)
- [ ] Emergency stop mutes immediately

#### Binaural Beats
- [ ] Left ear plays base frequency (verify mono)
- [ ] Right ear plays base + beat frequency
- [ ] Beat frequency audible as warbling (6 Hz = ~6 warbles/sec)

#### Sound Quality
- [ ] No distortion at any volume level
- [ ] No clipping or crackling
- [ ] Pink noise sounds natural (not harsh)
- [ ] Nature sounds loop seamlessly (no gaps)

#### Session Stability
- [ ] Audio continues for 60+ minute session
- [ ] Switching modes doesn't cause glitches
- [ ] Phone lock/unlock doesn't stop audio (with wake lock)
- [ ] Background/foreground transition smooth

### Automated Audio Mocking

For CI/CD, mock Tone.js:

```javascript
// tests/mocks/toneMock.js
export const mockTone = {
  context: {
    state: 'running',
    sampleRate: 44100
  },
  start: vi.fn().mockResolvedValue(undefined),
  Oscillator: vi.fn(() => ({
    frequency: { value: 440 },
    volume: { value: -25 },
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    connect: vi.fn(),
    toDestination: vi.fn()
  })),
  Gain: vi.fn(() => ({
    gain: {
      value: 1,
      rampTo: vi.fn(),
      cancelScheduledValues: vi.fn()
    },
    connect: vi.fn(),
    toDestination: vi.fn(),
    dispose: vi.fn()
  })),
  Filter: vi.fn(() => ({
    frequency: { value: 4000, rampTo: vi.fn() },
    Q: { value: 2.0, rampTo: vi.fn() },
    type: 'notch',
    connect: vi.fn(),
    dispose: vi.fn()
  }))
};

// In tests
vi.mock('tone', () => ({ default: mockTone }));
```

---

## 🚀 Performance Testing

### Metrics & Thresholds

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | 2.5s |
| Time to Interactive | < 2.5s | 4.0s |
| Total Bundle Size | < 300 KB | 500 KB |
| Memory Usage (idle) | < 50 MB | 100 MB |
| Memory Usage (active) | < 100 MB | 200 MB |
| CPU Usage (active) | < 25% | 50% |
| Battery Drain (1hr session) | < 5% | 10% |

### Performance Testing Tools

1. **Lighthouse:** Run on every PR
2. **Chrome DevTools Performance:** Profile critical paths
3. **Memory Profiler:** Check for leaks during 60-min session
4. **Network Throttling:** Test on 3G connection

### Performance Test Script

```javascript
// tests/performance/bundleSize.test.js
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

describe('Bundle Size', () => {
  it('should not exceed 500 KB gzipped', () => {
    const bundle = readFileSync('dist/assets/index.js');
    const gzipped = gzipSync(bundle);
    const sizeKB = gzipped.length / 1024;

    expect(sizeKB).toBeLessThan(500);
    console.log(`Bundle size: ${sizeKB.toFixed(2)} KB`);
  });
});
```

---

## 🔐 Security Testing

### Security Checklist

- [ ] No user data sent to external servers
- [ ] localStorage data not accessible to other domains
- [ ] User input sanitized before storage
- [ ] No XSS vulnerabilities (test with `<script>alert('xss')</script>`)
- [ ] No SQL injection (N/A - no backend)
- [ ] CSP headers configured correctly
- [ ] HTTPS enforced (in production)

### XSS Test

```javascript
describe('Security - XSS Prevention', () => {
  it('should sanitize user notes', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeNote(maliciousInput);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('should not execute HTML in session notes', () => {
    render(<SessionNote note='<img src=x onerror="alert(1)">' />);

    const note = screen.getByText(/img src/i);
    expect(note).toBeInTheDocument(); // Text rendered, not executed
  });
});
```

---

## 📊 Test Reporting

### Required Reports

1. **Coverage Report:** `npm run test:coverage`
   - Must show ≥70% coverage
   - Critical paths ≥90%

2. **Accessibility Report:** Lighthouse + axe
   - No critical violations
   - Score ≥90

3. **Performance Report:** Lighthouse
   - Performance score ≥80
   - Accessibility score ≥90
   - Best Practices score ≥90

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Build
        run: npm run build

      - name: Run Lighthouse
        run: npm run test:lighthouse

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## ✅ Definition of Done

A feature is complete when:

- [ ] All unit tests pass (≥70% coverage)
- [ ] Integration tests pass
- [ ] Manual testing completed on all required browsers
- [ ] Accessibility tests pass (automated + screen reader)
- [ ] Performance metrics meet targets
- [ ] No console errors or warnings
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [WCAG Testing Guidelines](https://www.w3.org/WAI/test-evaluate/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

**Remember:** Testing is not optional. Good tests prevent regressions, document behavior, and give confidence to refactor.
