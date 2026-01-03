# Accessibility Guidelines for TinniTune

**Target Standard:** WCAG 2.1 Level AA
**Mission:** Ensure TinniTune is usable by everyone, including users with disabilities.

---

## 🎯 Core Principles (POUR)

1. **Perceivable** - Information must be presentable to users in ways they can perceive
2. **Operable** - UI components must be operable by all users
3. **Understandable** - Information and UI operation must be understandable
4. **Robust** - Content must be robust enough for assistive technologies

---

## ⌨️ Keyboard Navigation

### Requirements

All interactive elements must be:
- Accessible via Tab key
- Activatable via Enter or Space
- Escapable via Esc (for modals/dialogs)

### Implementation

```javascript
// ✅ Button - full keyboard support
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Start Therapy
</button>

// ✅ Close modal with Esc
useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === 'Escape') onClose();
  };

  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [onClose]);

// ✅ Trap focus in modal
import { useRef, useEffect } from 'react';

const Modal = ({ children, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  return <div ref={modalRef} role="dialog" aria-modal="true">{children}</div>;
};
```

### Testing

- [ ] Can reach all interactive elements with Tab
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] No keyboard traps (can escape all UI)
- [ ] Skip links provided for long pages
- [ ] Focus visible on all elements

---

## 🔊 Screen Reader Support

### ARIA Labels

```javascript
// ✅ Descriptive labels for all controls
<button aria-label="Start therapy session">
  <PlayIcon />
</button>

<input
  type="range"
  min="-40"
  max="-10"
  value={volume}
  aria-label="Left ear volume in decibels"
  aria-valuemin="-40"
  aria-valuemax="-10"
  aria-valuenow={volume}
  aria-valuetext={`${volume} decibels`}
/>

<div
  role="progressbar"
  aria-label="Session progress"
  aria-valuenow={percentage}
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext={`${percentage}% complete, ${formatTime(elapsed)} elapsed`}
>
  {/* Visual progress bar */}
</div>
```

### Live Regions

```javascript
// ✅ Announce dynamic updates
<div aria-live="polite" aria-atomic="true">
  {sessionActive && `Session active: ${formatTime(elapsed)}`}
</div>

<div aria-live="assertive" role="alert">
  {error && `Error: ${error.message}`}
</div>

// ✅ Status updates
<div role="status" aria-live="polite">
  {message}
</div>
```

### Semantic HTML

```javascript
// ✅ Use semantic elements
<main>
  <h1>TinniTune Therapy</h1>

  <section aria-labelledby="session-heading">
    <h2 id="session-heading">Current Session</h2>
    {/* Session controls */}
  </section>

  <nav aria-label="Main navigation">
    {/* Navigation items */}
  </nav>
</main>

// ❌ Avoid generic divs for interactive elements
<div onClick={handleClick}>Click me</div> // Bad
<button onClick={handleClick}>Click me</button> // Good
```

### Testing

- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Headings are hierarchical (h1 → h2 → h3)
- [ ] Landmarks used (main, nav, section)
- [ ] Live regions announce updates
- [ ] No "click here" or ambiguous link text

---

## 🎨 Visual Accessibility

### Color Contrast (WCAG AA)

**Requirements:**
- Normal text (< 18pt): 4.5:1 contrast ratio
- Large text (≥ 18pt): 3.0:1 contrast ratio
- UI components: 3.0:1 contrast ratio

**TinniTune Approved Combinations:**

```javascript
// ✅ High contrast (WCAG AAA: 7.5:1)
<div style={{ color: '#FFFFFF', background: '#667eea' }}>
  High contrast text
</div>

// ✅ Meets AA (4.9:1)
<div style={{ color: '#FFFFFF', background: '#4ECDC4' }}>
  Teal button text
</div>

// ⚠️ Borderline (use for large text only)
<div style={{ color: '#FFB74D', background: '#FFFFFF' }}>
  Warning text (3.1:1 - large text only)
</div>

// ❌ Fails (2.1:1)
<div style={{ color: '#C0C0C0', background: '#FFFFFF' }}>
  Low contrast - DO NOT USE
</div>
```

### Focus Indicators

```css
/* ✅ Visible focus indicator (all interactive elements) */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 3px solid #4ECDC4;
  outline-offset: 2px;
}

/* ❌ NEVER remove focus indicators */
*:focus {
  outline: none; /* PROHIBITED */
}

/* ✅ Custom focus styles (must be high contrast) */
.custom-button:focus-visible {
  box-shadow: 0 0 0 4px rgba(78, 205, 196, 0.5);
  border-color: #4ECDC4;
}
```

### Text Sizing

```css
/* ✅ Use relative units (rem, em) not pixels */
body {
  font-size: 16px; /* Base only */
}

h1 {
  font-size: 2rem; /* Scales with user preferences */
}

p {
  font-size: 1rem;
  line-height: 1.5; /* Minimum 1.5 for body text */
}

/* ✅ Support text zoom up to 200% */
.container {
  max-width: 100%; /* Don't constrain at fixed px */
  padding: 1rem;
}
```

### Color Independence

```javascript
// ❌ Don't rely on color alone
<span style={{ color: 'red' }}>Error</span>

// ✅ Use color + icon + text
<span style={{ color: '#F44336' }}>
  <ErrorIcon aria-hidden="true" /> Error: Invalid frequency
</span>

// ✅ Use patterns/textures in addition to color
<div className="status-indicator status-active">
  <span className="pulse-animation" aria-hidden="true"></span>
  <span>Active</span>
</div>
```

---

## 🖱️ Touch & Pointer Accessibility

### Touch Target Sizes

**Minimum:** 44x44 CSS pixels (WCAG Level AAA)
**Recommended:** 48x48 CSS pixels

```css
/* ✅ Adequate touch targets */
button {
  min-width: 48px;
  min-height: 48px;
  padding: 12px 24px;
}

/* ✅ Increase tap area beyond visible element */
.icon-button {
  position: relative;
  padding: 8px;
}

.icon-button::before {
  content: '';
  position: absolute;
  top: -8px;
  right: -8px;
  bottom: -8px;
  left: -8px;
  /* Invisible but tappable */
}
```

### Hover & Focus States

```css
/* ✅ Combine hover and focus (some users navigate with mouse + keyboard) */
button:hover,
button:focus-visible {
  background-color: rgba(78, 205, 196, 0.2);
  transform: translateY(-2px);
}

/* ✅ Active/pressed state */
button:active {
  transform: translateY(0);
}
```

---

## 🎬 Motion & Animation

### Respect User Preferences

```css
/* ✅ Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ✅ Provide alternative for essential animations */
@media (prefers-reduced-motion: reduce) {
  .achievement-unlock {
    /* Skip confetti animation */
    background: linear-gradient(135deg, #4ECDC4 0%, #667eea 100%);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .achievement-unlock {
    /* Full confetti animation */
    animation: confetti 3s ease-out;
  }
}
```

### Safe Animation Practices

```css
/* ✅ No flashing (seizure risk) */
/* NEVER flash more than 3 times per second */

/* ❌ Dangerous (7 flashes per second) */
.warning {
  animation: flash 0.14s infinite;
}

/* ✅ Safe alternative */
.warning {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## 📱 Mobile Accessibility

### Viewport & Zoom

```html
<!-- ✅ Allow pinch zoom -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- ❌ Never disable zoom -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### Orientation

```css
/* ✅ Support both orientations */
@media (orientation: landscape) {
  .therapy-controls {
    flex-direction: row;
  }
}

@media (orientation: portrait) {
  .therapy-controls {
    flex-direction: column;
  }
}
```

---

## 📋 Forms & Inputs

### Labels & Instructions

```javascript
// ✅ Always associate labels with inputs
<label htmlFor="tinnitus-frequency">
  Your tinnitus frequency (Hz)
</label>
<input
  id="tinnitus-frequency"
  type="number"
  min="2000"
  max="12000"
  value={frequency}
  onChange={handleChange}
  aria-describedby="frequency-hint"
  required
/>
<span id="frequency-hint" className="hint">
  Typical range: 2000-12000 Hz
</span>

// ✅ Error messages
{error && (
  <div role="alert" className="error">
    {error.message}
  </div>
)}
```

### Required Fields

```javascript
// ✅ Indicate required fields
<label htmlFor="profile-name">
  Profile name <span aria-label="required">*</span>
</label>
<input
  id="profile-name"
  type="text"
  required
  aria-required="true"
/>
```

---

## 🧪 Testing Tools

### Automated Testing

1. **axe DevTools** (Chrome/Firefox extension)
   - Catches 30-50% of issues
   - Run on every page/screen

2. **Lighthouse** (Chrome DevTools)
   - Accessibility score must be ≥90
   - Run in CI/CD

3. **WAVE** (Web Accessibility Evaluation Tool)
   - Visual feedback on errors
   - Good for learning

### Manual Testing

1. **Screen Readers**
   - **NVDA** (Windows, free): Test all flows
   - **VoiceOver** (macOS/iOS): Test all flows
   - **TalkBack** (Android): Test all flows

2. **Keyboard Only**
   - Unplug mouse, navigate entire app
   - All features must be accessible

3. **Browser Zoom**
   - Test at 200% zoom
   - Test at 400% zoom (Level AAA)

4. **Color Blindness Simulation**
   - Use Chrome DevTools color vision deficiency emulation
   - Test all color-coded elements

---

## ✅ Accessibility Checklist

Before marking any feature complete:

### Keyboard
- [ ] All interactive elements reachable via Tab
- [ ] Tab order is logical
- [ ] Enter/Space activates buttons and links
- [ ] Esc closes dialogs
- [ ] No keyboard traps
- [ ] Focus visible on all elements

### Screen Reader
- [ ] All images have alt text (decorative: alt="")
- [ ] All form inputs have labels
- [ ] ARIA labels on icon buttons
- [ ] Headings are hierarchical
- [ ] Landmarks used (main, nav, section)
- [ ] Live regions announce updates
- [ ] Error messages announced

### Visual
- [ ] Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] Text readable at 200% zoom
- [ ] Focus indicators visible (3px outline minimum)
- [ ] Don't rely on color alone
- [ ] Line height ≥1.5 for body text

### Motion
- [ ] Respects prefers-reduced-motion
- [ ] No flashing > 3 times per second
- [ ] Animations can be paused/stopped

### Mobile
- [ ] Touch targets ≥44x44 pixels
- [ ] Zoom not disabled
- [ ] Works in portrait and landscape

### Forms
- [ ] All inputs have labels
- [ ] Required fields indicated
- [ ] Error messages clear and associated
- [ ] Success confirmation provided

### Testing
- [ ] Passed axe DevTools scan (0 critical issues)
- [ ] Lighthouse accessibility score ≥90
- [ ] Tested with screen reader (NVDA/VoiceOver)
- [ ] Tested keyboard-only navigation
- [ ] Tested at 200% browser zoom

---

## 📚 Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

**Remember:** Accessibility is not optional. It's a legal requirement in many jurisdictions and, more importantly, ensures everyone can benefit from tinnitus therapy.
