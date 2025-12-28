# TinniTune UX Improvement Plan
**Guided Therapy Setup & Interface Redesign**

*Generated: 2025-12-28*

---

## Problem Statement

**Current State:**
The therapy interface presents all controls simultaneously:
- Calm mode toggle + heartbeat/breathing controls
- Three therapy modes (daytime/evening/sleep)
- Notch therapy controls (on/off, intensity)
- Volume sliders (left/right)
- Start/stop button

**User Experience Issues:**
1. **Overwhelming:** Too many options at once
2. **No guidance:** Users don't know the recommended setup flow
3. **Missing context:** Features lack explanations (what is notch therapy? why use it?)
4. **No onboarding:** First-time users are confused
5. **Hidden features:** Users may miss calm mode or notch therapy
6. **No recommended path:** Equal weight given to all options

**User Feedback:**
> "I've worked my way through it but it's a little confusing as it stands"

---

## Proposed Solution: Guided Therapy Setup

### Core Concept: Step-by-Step Wizard

Transform the therapy page into a guided 4-step setup process:

```
┌─────────────────────────────────────────────┐
│  STEP 1: Calm Mode (Optional)               │
│  ┌─────────────────────────────────────┐   │
│  │ 💓 Feeling anxious or tinnitus spike?│   │
│  │                                       │   │
│  │ [Skip] or [Enable Calm Mode]         │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  STEP 2: Choose Your Therapy Mode           │
│  ┌─────────────────────────────────────┐   │
│  │ What time of day is it?             │   │
│  │                                       │   │
│  │ ☀️  Daytime Focus (10 Hz)            │   │
│  │ 🌅 Evening Calm (6 Hz)               │   │
│  │ 🌙 Deep Sleep (2 Hz)                 │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  STEP 3: Notch Therapy (Recommended)        │
│  ┌─────────────────────────────────────┐   │
│  │ 🎯 Clinically proven to reduce       │   │
│  │    tinnitus over time                │   │
│  │                                       │   │
│  │ ✓ Use Notch Therapy (Standard)       │   │
│  │ Gentle | Standard | Strong           │   │
│  │                                       │   │
│  │ [What is this?] [Skip]               │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  STEP 4: Ready to Begin!                    │
│  ┌─────────────────────────────────────┐   │
│  │ Your therapy setup:                  │   │
│  │ • 9500 Hz, Left Ear                  │   │
│  │ • Evening Calm (6 Hz binaural)       │   │
│  │ • Notch Therapy: Standard            │   │
│  │ • Calm Mode: Enabled                 │   │
│  │                                       │   │
│  │ Recommended: 15-30 min to start      │   │
│  │                                       │   │
│  │    [▶ START THERAPY]                 │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Detailed Step Breakdown

### Step 1: Calm Mode Setup (Optional)

**Purpose:** Address immediate anxiety/distress before starting main therapy

**UI Layout:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  💓 How are you feeling right now?              │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │  I'm feeling    │  │  I'm relatively  │      │
│  │  anxious or     │  │  calm today      │      │
│  │  stressed       │  │                  │      │
│  │                 │  │                  │      │
│  │  [Enable Calm   │  │  [Skip to        │      │
│  │   Mode]         │  │   Therapy]       │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                  │
│  ℹ️ Calm mode adds breathing guidance and       │
│     heartbeat rhythms to reduce anxiety          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**If "Enable Calm Mode" selected:**
```
┌──────────────────────────────────────────────────┐
│  💓 Calm Mode Settings                           │
│                                                  │
│  Heartbeat BPM: [──●────] 55 BPM (Very Calm)    │
│                                                  │
│  ✓ Include breathing guide (6 breaths/min)      │
│                                                  │
│  💡 Tip: Start with 5 minutes of calm mode      │
│     before main therapy for best results         │
│                                                  │
│  [← Back]              [Continue →]             │
└──────────────────────────────────────────────────┘
```

**Key Features:**
- Clear binary choice (calm vs. skip)
- Explains WHY calm mode is useful
- Shows settings only if enabled
- Provides usage tip

---

### Step 2: Choose Therapy Mode

**Purpose:** Select appropriate binaural beat frequency for time of day/goals

**UI Layout:**
```
┌──────────────────────────────────────────────────┐
│  What would you like to achieve?                │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  ☀️ Daytime Focus                          │ │
│  │  Best for: Work, concentration, alertness  │ │
│  │  Binaural: 10 Hz (Alpha)                   │ │
│  │  Duration: 15-60 minutes                   │ │
│  │                                             │ │
│  │  [SELECT]                                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  🌅 Evening Calm                           │ │
│  │  Best for: Relaxation, winding down        │ │
│  │  Binaural: 6 Hz (Theta)                    │ │
│  │  Duration: 30-60 minutes                   │ │
│  │                                             │ │
│  │  [SELECT]                                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  🌙 Deep Sleep                             │ │
│  │  Best for: Before bed, deep relaxation     │ │
│  │  Binaural: 2 Hz (Delta)                    │ │
│  │  Duration: 30-120 minutes                  │ │
│  │                                             │ │
│  │  [SELECT]                                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [← Back]                                       │
└──────────────────────────────────────────────────┘
```

**Key Features:**
- Clear use cases for each mode
- Recommended durations
- Visual hierarchy (cards)
- Educational context (Alpha/Theta/Delta)

---

### Step 3: Notch Therapy Configuration

**Purpose:** Explain and configure the core therapeutic feature

**UI Layout - Initial:**
```
┌──────────────────────────────────────────────────┐
│  🎯 Notch Therapy                                │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  What is Notch Therapy?                    │ │
│  │                                             │ │
│  │  Notch therapy uses clinically-proven      │ │
│  │  sound filtering at your exact tinnitus    │ │
│  │  frequency (9500 Hz).                      │ │
│  │                                             │ │
│  │  ✓ Reduces tinnitus loudness over time     │ │
│  │  ✓ Backed by clinical research             │ │
│  │  ✓ Works best with 2 hours daily use       │ │
│  │                                             │ │
│  │  Your tinnitus: 9500 Hz, Left Ear          │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Recommendation: Keep this ON for best results  │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │  ✓ Use Notch    │  │  Skip Notch     │      │
│  │  Therapy        │  │  Therapy        │      │
│  │  (Recommended)  │  │  (Not           │      │
│  │                 │  │  Recommended)   │      │
│  │  [SELECT]       │  │  [SKIP]         │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                  │
│  [← Back]                                       │
└──────────────────────────────────────────────────┘
```

**If "Use Notch Therapy" selected:**
```
┌──────────────────────────────────────────────────┐
│  🎯 Choose Notch Intensity                       │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  💫 Gentle                                  │ │
│  │  Wider, softer relief                       │ │
│  │  Best for: First-time users, sensitivity    │ │
│  │  [SELECT]                                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  ✨ Standard (Recommended) ⭐               │ │
│  │  Clinically proven, balanced approach       │ │
│  │  Best for: Most users                       │ │
│  │  [SELECT] ✓ SELECTED                        │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  🎯 Strong                                  │ │
│  │  Targeted, focused relief                   │ │
│  │  Best for: Experienced users                │ │
│  │  [SELECT]                                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [← Back]              [Continue →]             │
└──────────────────────────────────────────────────┘
```

**Key Features:**
- Clear explanation of what notch therapy is
- Links to user's calibrated frequency
- Strong recommendation to use it
- Defaults to "Standard" (clinically proven)
- Progressive disclosure (intensity only shown if enabled)

---

### Step 4: Ready to Begin

**Purpose:** Summary and final confirmation before starting

**UI Layout:**
```
┌──────────────────────────────────────────────────┐
│  ✓ Your Therapy Setup                            │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Tinnitus Profile                          │ │
│  │  • Frequency: 9500 Hz                      │ │
│  │  • Ear: Left                               │ │
│  │  • Volume: Comfortable level               │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Therapy Settings                          │ │
│  │  • Mode: 🌅 Evening Calm (6 Hz)            │ │
│  │  • Notch Therapy: Standard intensity       │ │
│  │  • Calm Mode: Enabled (55 BPM)             │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  💡 Recommended Session                    │ │
│  │  • First session: 15-30 minutes            │ │
│  │  • Daily goal: 2 hours (can be split)      │ │
│  │  • Use headphones for best results         │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │                                             │ │
│  │        [▶ START THERAPY]                   │ │
│  │                                             │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [← Back to edit]      [Save as preset]        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Key Features:**
- Complete summary of all choices
- Duration recommendations
- Headphone reminder
- Option to edit (go back)
- Option to save preset for future use

---

## Active Therapy Screen

**During therapy, simplify to essential controls:**

```
┌──────────────────────────────────────────────────┐
│  🎧 Therapy Active                               │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │                                             │ │
│  │         [===========●========]              │ │
│  │              15:43 / 30:00                  │ │
│  │                                             │ │
│  │         Evening Calm • Notch ON             │ │
│  │                                             │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ Volume Controls ──────────────────────────┐ │
│  │  Left:  [────●─────] -25 dB                │ │
│  │  Right: [────●─────] -25 dB (Muted)        │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ Calm Mode (Active) ───────────────────────┐ │
│  │                                             │ │
│  │      ◯ → ◉  Breathe In  (4...)             │ │
│  │                                             │ │
│  │      55 BPM • 💓 lub-dub                    │ │
│  │                                             │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [⏸ PAUSE]    [⚙️ Settings]    [✕ STOP]         │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Collapsed by default, expandable:**
- Advanced controls hidden behind ⚙️ Settings
- Focus on progress and breathing
- Clean, distraction-free interface

---

## Implementation Phases

### Phase 1: Setup Wizard (High Priority)
**Effort:** 12-16 hours

**Components to Build:**
1. `TherapySetupWizard.jsx` - Main wizard container
2. `Step1CalmMode.jsx` - Calm mode selection
3. `Step2TherapyMode.jsx` - Mode selection cards
4. `Step3NotchConfig.jsx` - Notch therapy explanation + config
5. `Step4Summary.jsx` - Setup summary + start

**State Management:**
```javascript
const [setupStep, setSetupStep] = useState(1); // 1-4
const [setupConfig, setSetupConfig] = useState({
  calmMode: false,
  heartbeatBPM: 55,
  breathingEnabled: true,
  therapyMode: 'evening',
  notchEnabled: true,
  notchIntensity: 'standard'
});
```

**Navigation:**
- Progress indicator at top (1 of 4, 2 of 4, etc.)
- Back button on all steps except first
- Continue/Select moves forward
- Skip options where appropriate

### Phase 2: Active Therapy Simplification (Medium Priority)
**Effort:** 6-8 hours

**Changes:**
1. Collapse advanced controls by default
2. Prominent timer/progress
3. Simple pause/stop controls
4. Settings panel (expandable)
5. Quick toggles only for essentials

**Before/After:**
- Before: All controls visible, overwhelming
- After: Clean interface, advanced in settings panel

### Phase 3: First-Time User Onboarding (Medium Priority)
**Effort:** 8-10 hours

**Onboarding Flow:**
```
Welcome → Calibration Guide → Setup Tutorial → First Session
```

**Features:**
1. Welcome screen explaining TinniTune
2. Calibration importance explanation
3. Interactive setup tutorial
4. Tooltips on first therapy session
5. Progress tracking ("You've completed calibration!")

### Phase 4: Preset Management (Lower Priority)
**Effort:** 4-6 hours

**Features:**
1. Save current setup as preset
2. Quick start from presets
3. "Morning routine" / "Evening routine" / "Sleep routine"
4. Edit/delete presets

---

## User Experience Improvements

### 1. Educational Content Integration

**Problem:** Users don't understand features

**Solution:** Contextual education

**Examples:**

**Binaural Beats Explanation:**
```
┌──────────────────────────────────────────────┐
│  ℹ️ What are Binaural Beats?                │
│                                              │
│  Binaural beats work by playing slightly    │
│  different frequencies in each ear. Your    │
│  brain creates a "beat" that can help with: │
│                                              │
│  • Focus and concentration (10 Hz)          │
│  • Relaxation and calm (6 Hz)               │
│  • Deep sleep (2 Hz)                         │
│                                              │
│  This is backed by clinical research and    │
│  helps reduce tinnitus-related anxiety.     │
│                                              │
│  [Got it!]                                   │
└──────────────────────────────────────────────┘
```

**Notch Therapy Explanation:**
```
┌──────────────────────────────────────────────┐
│  🎯 How Notch Therapy Works                 │
│                                              │
│  We found your tinnitus is at 9500 Hz.      │
│                                              │
│  Notch therapy creates a "notch" (gap) in   │
│  therapeutic sounds at exactly this         │
│  frequency. Over time, this helps your      │
│  brain reduce the tinnitus signal.          │
│                                              │
│  ✓ Clinically proven in research studies    │
│  ✓ Works best with 2 hours daily use        │
│  ✓ Gradual improvement over weeks/months    │
│                                              │
│  [Learn more] [Got it!]                      │
└──────────────────────────────────────────────┘
```

### 2. Smart Defaults & Recommendations

**Time-Based Suggestions:**
```javascript
const getRecommendedMode = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'daytime';
  if (hour >= 12 && hour < 20) return 'evening';
  return 'sleep';
};
```

**First-Timer Guidance:**
- Auto-enable calm mode for first 3 sessions
- Default to Standard notch intensity
- Suggest 15-minute first session
- Show longer durations after week 1

**Returning User:**
- Remember last used settings
- Quick restart previous session
- Track progress toward daily goals

### 3. Progress & Motivation

**Session Completion:**
```
┌──────────────────────────────────────────────┐
│  🎉 Session Complete!                        │
│                                              │
│  Great work! You completed 30 minutes of    │
│  therapy today.                              │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Today: 30 min / 120 min goal        │  │
│  │  [========░░░░░░░░░░] 25%            │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  How was your session?                      │
│  Tinnitus loudness: [1] [2] [3] [4] [5]    │
│                                              │
│  [Start Another Session] [Done]             │
└──────────────────────────────────────────────┘
```

### 4. Visual Hierarchy & Clarity

**Current Issues:**
- Equal visual weight to all options
- No clear primary action
- Cluttered layout

**Improvements:**

**Primary Actions (Large, Prominent):**
- Start Therapy button
- Mode selection cards
- Enable/Disable toggles

**Secondary Actions (Smaller, Less Prominent):**
- Intensity adjustments
- Volume fine-tuning
- Settings access

**Tertiary Info (Subtle):**
- Technical details (Hz, Q-factor)
- Tooltips and help text
- Advanced options

---

## Mobile-First Considerations

### Current Issues:
- Small touch targets
- Cramped controls
- Difficult to read text

### Improvements:

**Touch Targets:**
- Minimum 44x44px tap areas
- Larger buttons and sliders
- Adequate spacing between controls

**Typography:**
- Larger base font size (16px minimum)
- High contrast text
- Clear hierarchy (24px headers, 16px body)

**Layout:**
- Single column on mobile
- Cards stack vertically
- Full-width buttons

**Gestures:**
- Swipe to navigate wizard steps
- Pull to refresh session history
- Tap to expand/collapse sections

---

## Accessibility Improvements

### Screen Reader Support:
- Proper ARIA labels
- Semantic HTML
- Keyboard navigation
- Focus indicators

### Visual Accessibility:
- High contrast mode option
- Larger text option
- Reduced motion option (disable animations)

### Audio Accessibility:
- Volume warnings
- Gradual fade in/out
- Emergency stop (panic button)

---

## Technical Implementation Notes

### Component Structure:
```
src/
  components/
    therapy/
      TherapySetupWizard.jsx       (Main wizard)
      steps/
        Step1CalmMode.jsx
        Step2TherapyMode.jsx
        Step3NotchConfig.jsx
        Step4Summary.jsx
      ActiveTherapyView.jsx         (Simplified during session)
      SettingsPanel.jsx             (Expandable advanced controls)
    common/
      ProgressIndicator.jsx
      InfoCard.jsx
      EducationalModal.jsx
```

### State Management:
```javascript
// Setup wizard state
const [wizardActive, setWizardActive] = useState(true);
const [currentStep, setCurrentStep] = useState(1);
const [setupConfig, setSetupConfig] = useState({...});

// Show wizard when:
// - First time user (no previous sessions)
// - User clicks "Setup New Session"
// - User hasn't started therapy yet

// Skip wizard when:
// - User clicks "Quick Start" (use last settings)
// - User loads a preset
```

### Local Storage:
```javascript
// Save preferences
localStorage.setItem('tinnitune_last_setup', JSON.stringify(setupConfig));
localStorage.setItem('tinnitune_presets', JSON.stringify(presets));
localStorage.setItem('tinnitune_completed_onboarding', 'true');
```

---

## Success Metrics

### Quantitative:
- **Setup completion rate:** % users who complete all 4 steps
- **Time to first therapy:** Minutes from landing to starting
- **Feature adoption:** % using calm mode, notch therapy
- **Session completion:** % finishing recommended duration
- **Return rate:** % returning for second session

### Qualitative:
- User feedback on clarity
- Confusion points identified
- Feature understanding
- Satisfaction ratings

---

## Wireframe Flow Summary

```
[Landing] → [Calibration] → [Therapy Setup Wizard]
                                    ↓
                    ┌───────────────┴───────────────┐
                    │                               │
              [Step 1: Calm]                 [Quick Start]
                    │                         (Skip wizard,
              [Step 2: Mode]                  use last setup)
                    │
              [Step 3: Notch]
                    │
              [Step 4: Summary]
                    │
              [Active Therapy]
                    │
              [Session Complete]
                    │
            [Rate & Continue]
```

---

## Next Steps

1. **Review & Refine:**
   - Get feedback on proposed wizard flow
   - Validate educational content accuracy
   - Confirm recommended defaults

2. **Design Mockups:**
   - Create high-fidelity designs
   - User test with 3-5 people
   - Iterate based on feedback

3. **Implement Phase 1:**
   - Build setup wizard
   - Test on mobile and desktop
   - A/B test against current interface

4. **Measure & Iterate:**
   - Track success metrics
   - Gather user feedback
   - Continuous improvement

---

## Questions for Consideration

1. **Wizard vs. Tabs:**
   - Should setup be strictly linear (wizard)?
   - Or allow jumping between tabs?
   - Recommendation: Wizard for first-timers, tabs for experienced

2. **Quick Start Option:**
   - Always show wizard, or offer "Quick Start"?
   - Recommendation: Show wizard first 3 times, then offer quick start

3. **Educational Content:**
   - Show explanations inline, or as optional modals?
   - Recommendation: Inline for critical features (notch), modal for deep dives

4. **Preset Management:**
   - How many presets should users be able to save?
   - Recommendation: 3 presets max (Morning/Evening/Sleep)

5. **Mobile Layout:**
   - Same wizard flow on mobile?
   - Recommendation: Yes, but with mobile-optimized styling

---

## Appendix: Current vs. Proposed Comparison

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Setup Flow** | All options at once | 4-step wizard |
| **Guidance** | None | Step-by-step with recommendations |
| **Education** | Technical details only | Plain language explanations |
| **Defaults** | User must choose everything | Smart defaults based on research |
| **Mobile UX** | Cramped, difficult | Touch-optimized, spacious |
| **First-time UX** | Confusing | Guided onboarding |
| **Active Therapy** | All controls visible | Simplified, essentials only |
| **Progress** | No tracking | Session goals, completion feedback |

---

*This UX improvement plan prioritizes user guidance and simplicity while maintaining access to advanced features for experienced users.*
