# TinniTune Therapy Goals & Progress Implementation Plan

## Research Summary

Based on clinical evidence and best practices for tinnitus therapy:

### Evidence-Based Goals

**Session Duration & Frequency** ([NeuroMed](https://neuromedcare.com/sound-therapy-for-tinnitus/), [ASHA Research](https://pubs.asha.org/doi/10.1044/2022_JSLHR-21-00651))
- **Minimum**: 2 hours daily for formal sound therapy programs
- **Optimal**: Continuous sound-enriched environment throughout the day
- **Consistency**: Fixed daily duration with stable, predictable sounds

**Habituation Timeline** ([Treble Health](https://treblehealth.com/how-long-does-tinnitus-habituation-take-blog/), [CBT for Tinnitus](https://www.cbtfortinnitus.com/how-tinnitus-habituation-works))
- **Average timeframe**: 9-12 months for full habituation
- **Range**: 6-18 months depending on individual factors
- **Success rate**: 80% of patients habituate within 12 months with proper therapy

**Progress Milestones** ([CBT Success Stories](https://www.cbtfortinnitus.com/cbt-habituation-success-stories))
- **Stage 1 (0-4 months)**: Most intense phase, tinnitus very noticeable
- **Stage 2 (4 months)**: Begin experiencing moments of not noticing tinnitus
- **Stage 3 (6 months)**: Extended periods of relief, not hearing the sound
- **Stage 4 (8+ months)**: Tinnitus only bothers on rare occasions

**Measurable Outcomes** ([PMC Evidence Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC7850883/))
- 59% reported less annoyance after treatment
- 72% reported increased ability to cope
- Significant reduction in loudness perception, discomfort, and quality of life impact
- Long-term effectiveness: 5+ years of sustained improvement

---

## Current System Analysis

### Already Tracked Data
✅ **Session duration** - Tracked in seconds, stored per session
✅ **Session history** - Last 100 sessions in localStorage (`tinnitune_sessions`)
✅ **Loudness ratings** - 1-10 scale before and after each session
✅ **Distress levels** - 1-10 scale per session
✅ **Session notes** - Text notes per session
✅ **Progress graphs** - Visual chart of loudness trends over time
✅ **Frequency matching** - User's tinnitus frequency stored
✅ **Therapy settings** - Mode, notch settings, calm mode preferences

### Missing Features
❌ **Goal setting system** - No structured goals framework
❌ **Daily/weekly targets** - No daily session time goals
❌ **Milestone tracking** - No recognition of habituation stages
❌ **Streaks & consistency** - No consecutive days tracking
❌ **Welcome page integration** - Progress not visible on first screen
❌ **Achievement badges** - No gamification or motivation
❌ **Weekly/monthly summaries** - No aggregate statistics
❌ **Therapy start date** - No tracking of when therapy began

---

## Proposed Goals System

### 1. Core Therapy Goals

#### Daily Session Goal
- **Target**: 2 hours (7,200 seconds) per day minimum
- **Visual**: Progress ring/bar showing today's progress
- **Encouragement**:
  - 0-30 min: "Great start! Keep going 💪"
  - 30-60 min: "Halfway there! 🎯"
  - 60-90 min: "Almost at your goal! 🌟"
  - 90-120 min: "Goal reached! Consider extending for better results ✨"
  - 120+ min: "Excellent consistency! 🏆"

#### Weekly Consistency Goal
- **Target**: 5-7 days per week with therapy sessions
- **Visual**: Calendar grid showing days completed
- **Streaks**: Track consecutive days of therapy
- **Milestones**: 7, 14, 30, 60, 90 day streaks

#### Monthly Progress Goal
- **Target**: Track improvement in loudness/distress ratings
- **Visual**: Trend arrows and percentage improvements
- **Benchmark**: Compare to previous month

### 2. Habituation Milestones

Track user's position in the habituation journey:

#### Early Stage (0-4 months)
- **Status**: "Building Foundation"
- **Focus**: Consistency and daily practice
- **Goal**: Complete at least 5 sessions per week
- **Message**: "You're in the most intense phase. Stay consistent—it gets easier!"

#### Awareness Stage (4-6 months)
- **Status**: "Noticing Relief"
- **Focus**: Recognizing moments of peace
- **Goal**: Track "good moments" in session notes
- **Message**: "You're beginning to experience relief. Keep going!"

#### Relief Stage (6-8 months)
- **Status**: "Finding Peace"
- **Focus**: Extended periods without noticing tinnitus
- **Goal**: Maintain 2+ hours daily
- **Message**: "Major progress! Extended relief periods are normal now."

#### Habituation Stage (8+ months)
- **Status**: "Habituated"
- **Focus**: Maintenance and coping mastery
- **Goal**: Continue regular sessions for long-term success
- **Message**: "You've achieved habituation! Maintain your routine for lasting results."

### 3. Weekly Goals

#### Session Count
- **Target**: 5-7 sessions this week
- **Current**: X/7 sessions
- **Days remaining**: X days left

#### Total Time
- **Target**: 14 hours (50,400 seconds) per week
- **Current**: X hours logged
- **Average per session**: X minutes

#### Consistency
- **Target**: No gaps longer than 1 day
- **Current streak**: X consecutive days
- **Best streak**: X days (personal record)

---

## Welcome Page Design

### Layout Structure

```
┌─────────────────────────────────────────────┐
│  TinniTune™ Logo & Title                    │
├─────────────────────────────────────────────┤
│  🎯 YOUR THERAPY GOALS                      │
│  ┌───────────────────────────────────────┐  │
│  │ Today's Progress                      │  │
│  │ ████████████░░░░░░░░ 76 min / 120 min│  │
│  │ "Almost at your goal! 🌟"             │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ This Week                             │  │
│  │ • 4/7 days completed                  │  │
│  │ • 6.2 hours total                     │  │
│  │ • 🔥 4-day streak                     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Habituation Journey                   │  │
│  │ 🚀 Stage 2: Noticing Relief (5 mo)   │  │
│  │ ████████████░░░░░░░░ 5/12 months     │  │
│  │ "You're beginning to experience       │  │
│  │  relief. Keep going!"                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Recent Progress                       │  │
│  │ Loudness: 7.2 → 5.8 (-19%)           │  │
│  │ Distress: 6.5 → 4.2 (-35%)           │  │
│  │ ↓ Improving trend                    │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  ⭐ QUICK START                             │
│  [Favorites buttons...]                     │
├─────────────────────────────────────────────┤
│  [Start Calibration] [Start Therapy]        │
└─────────────────────────────────────────────┘
```

### Visual Components

#### 1. Progress Ring/Bar
- Circular progress indicator for daily goal
- Color gradient: Red → Orange → Yellow → Green based on progress
- Percentage and time remaining displayed

#### 2. Weekly Calendar
```
Week of Jan 1-7, 2025
M  T  W  T  F  S  S
✓  ✓  -  ✓  ?  ?  ?
```
- Checkmark for completed days (2+ hours)
- Dash for missed days
- Question mark for future days

#### 3. Habituation Progress Bar
- 12-segment bar (one per month)
- Current stage highlighted
- Motivational message based on stage

#### 4. Trend Indicators
- Arrow icons: ↓ Improving, ↑ Fluctuating, → Stable
- Percentage changes in loudness and distress
- Color-coded: Green (good), Yellow (stable), Red (needs attention)

#### 5. Achievement Badges
- 🏅 First Session
- 🔥 7-Day Streak
- ⭐ 30-Day Streak
- 💎 100 Sessions
- 🎯 Goal Master (30 days hitting daily goal)
- 🌟 Habituated (8+ months, improved ratings)

---

## Data Structure

### New Schema Additions

#### User Therapy Goals (localStorage: `tinnitune_therapy_goals`)
```javascript
{
  therapyStartDate: "2025-01-01T00:00:00.000Z",
  dailyGoalSeconds: 7200,        // 2 hours default
  weeklyGoalDays: 5,              // 5 days minimum
  currentStreak: 4,
  bestStreak: 12,
  achievements: [
    { id: "first_session", unlockedAt: "2025-01-01T10:30:00.000Z" },
    { id: "streak_7", unlockedAt: "2025-01-07T18:00:00.000Z" }
  ],
  milestoneStage: 2,              // 1-4 based on time since start
  lastUpdated: "2025-01-05T00:00:00.000Z"
}
```

#### Enhanced Session Data
```javascript
// Existing session structure - no changes needed
{
  timestamp: "2025-01-05T18:30:00.000Z",
  duration: 3600,
  frequency: 8000,
  ear: "both",
  mode: "evening",
  notchEnabled: true,
  loudnessBefore: 7,
  loudnessAfter: 5,
  distress: 4,
  notes: "Felt calm and relaxed"
}
```

#### Weekly Summary (computed)
```javascript
{
  weekStart: "2025-01-01T00:00:00.000Z",
  sessionsCompleted: 4,
  totalSeconds: 22320,
  daysActive: 4,
  averageLoudness: 5.8,
  averageDistress: 4.2,
  goalsMet: {
    daily: 3,    // Days that met daily goal
    weekly: true // Met weekly goal
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Set up data structures and basic goal tracking

1. Create `useTherapyGoals.js` hook
   - Initialize therapy start date on first session
   - Track daily/weekly progress
   - Calculate streaks
   - Manage achievements

2. Add goal settings to user preferences
   - Daily time goal (default 2 hours)
   - Weekly days goal (default 5 days)
   - Goal preferences UI

3. Update session saving to check goals
   - Check if daily goal met
   - Update streaks
   - Unlock achievements

### Phase 2: Welcome Page Integration (Week 2)
**Goal**: Display progress on welcome page

1. Create progress components
   - `DailyProgressRing` component
   - `WeeklyCalendar` component
   - `HabituationProgress` component
   - `TrendSummary` component

2. Layout welcome page sections
   - Goals section above favorites
   - Responsive design for mobile/desktop
   - Smooth animations and transitions

3. Add achievement notifications
   - Toast/modal for unlocked achievements
   - Celebration animations

### Phase 3: Analytics & Insights (Week 3)
**Goal**: Provide meaningful progress insights

1. Statistics calculations
   - Weekly/monthly summaries
   - Trend analysis (improving/stable/fluctuating)
   - Best/worst days tracking

2. Motivational messaging system
   - Context-aware encouragement
   - Tips based on progress
   - Milestone celebrations

3. Export/sharing features
   - Progress report generation
   - Share achievements (optional)

### Phase 4: Gamification (Week 4)
**Goal**: Enhance motivation and engagement

1. Achievement system expansion
   - 15+ achievement types
   - Progressive difficulty levels
   - Rare/hidden achievements

2. Visual polish
   - Progress animations
   - Confetti for milestones
   - Theme customization unlocks

3. Goal customization
   - Personalized daily targets
   - Flexible weekly schedules
   - Custom milestone tracking

---

## Technical Requirements

### New Files
- `/src/hooks/useTherapyGoals.js` - Goals management hook
- `/src/components/welcome/DailyProgressRing.jsx` - Progress indicator
- `/src/components/welcome/WeeklyCalendar.jsx` - Week view
- `/src/components/welcome/HabituationProgress.jsx` - Journey tracker
- `/src/components/welcome/TrendSummary.jsx` - Statistics display
- `/src/components/welcome/AchievementBadge.jsx` - Achievement UI
- `/src/utils/therapyAnalytics.js` - Analytics calculations
- `/src/utils/motivationalMessages.js` - Message generator

### Modified Files
- `/src/TinniTune.jsx` - Welcome page integration, session tracking
- `/src/hooks/useUserSettings.js` - Add therapy goals settings

### Dependencies
- No new dependencies required
- Use existing React, Tone.js, and vanilla JS

---

## Success Metrics

### User Engagement
- Increase in daily session completion rate
- Longer average session duration
- Higher user retention after 30 days
- More consistent weekly usage patterns

### Therapy Effectiveness
- Improved loudness/distress ratings over time
- Higher percentage of users reaching habituation milestones
- Increased user-reported satisfaction

### Technical
- Fast load times (<200ms for progress calculations)
- Smooth animations (60fps)
- Minimal localStorage usage (<500KB for goals data)

---

## Future Enhancements

### Advanced Analytics
- Correlation analysis (session length vs. improvement)
- Best time of day recommendations
- Weather/environment impact tracking
- Sleep quality correlation

### Social Features
- Anonymous community progress comparison
- Support groups and forums
- Therapist/audiologist integration
- Progress sharing with healthcare providers

### AI-Powered Insights
- Personalized goal recommendations
- Predictive habituation timeline
- Custom therapy schedule optimization
- Anomaly detection (unusual patterns)

### Integration
- Apple Health / Google Fit sync
- Calendar integration for scheduling
- Reminder notifications
- Smart watch companion app

---

## Implementation Priority

### Must Have (MVP)
1. ✅ Daily progress tracking
2. ✅ Weekly consistency goals
3. ✅ Basic habituation timeline
4. ✅ Welcome page progress display
5. ✅ Streak tracking

### Should Have
1. Achievement system
2. Trend analysis
3. Motivational messages
4. Weekly summaries

### Nice to Have
1. Advanced analytics
2. Gamification extras
3. Export features
4. Customization options

---

## Accessibility Considerations

- High contrast mode for visual indicators
- Screen reader announcements for progress
- Keyboard navigation for all goals features
- Reduced motion option for animations
- Color-blind friendly progress indicators
- Large touch targets for mobile (min 44x44px)

---

## Privacy & Data

- All goal data stored locally (localStorage)
- No server sync required for MVP
- Optional cloud backup in future
- User controls for data export/delete
- Transparent about data usage

---

## References

1. [Sound Therapy for Tinnitus - NeuroMed](https://neuromedcare.com/sound-therapy-for-tinnitus/)
2. [Impact of Daily Hours of Sound Therapy - ASHA](https://pubs.asha.org/doi/10.1044/2022_JSLHR-21-00651)
3. [Tinnitus Habituation Timeframe - Treble Health](https://treblehealth.com/how-long-does-tinnitus-habituation-take-blog/)
4. [Tinnitus Habituation Success Stories - CBT for Tinnitus](https://www.cbtfortinnitus.com/cbt-habituation-success-stories)
5. [Effect of Habituation Therapy - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7850883/)
6. [Evidence Gaps in Tinnitus Therapy - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5169077/)

---

## Next Steps

1. Review and approve this plan
2. Begin Phase 1: Create `useTherapyGoals` hook
3. Implement data structures
4. Build welcome page components
5. Test with real user data
6. Iterate based on feedback
