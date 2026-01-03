# Phase 2: Engagement Boost (4-6 Weeks)

**Goal:** Implement structured therapy programs, AI-driven personalization, and enhanced user engagement features to improve retention and clinical outcomes.

**Timeline:** 4-6 weeks
**Estimated Effort:** 120-160 hours
**Expected Impact:** 65% 1-month retention, 40% improvement in session adherence

---

## 📋 Task Overview

| # | Task | Priority | Effort | Impact | Dependencies |
|---|------|----------|--------|--------|--------------|
| 1 | Create 8-week structured therapy program | P0 | 40h | High | Phase 1 complete |
| 2 | Build AI insights & pattern detection engine | P0 | 48h | High | Session history data |
| 3 | Implement Ecological Momentary Assessment (EMA) | P1 | 24h | Medium | None |
| 4 | Re-enable offline mode with service workers | P1 | 32h | Medium | None |
| 5 | Add sound layering & mixer | P2 | 16h | Medium | Phase 1 nature sounds |

**Total Estimated Time:** 160 hours

---

## Task 1: Create 8-Week Structured Therapy Program

### 📖 Context
Top apps (Oto, MindEar) offer progressive structured programs with daily content. Research shows 32% of Oto users achieved clinically meaningful reduction at 6 months with structured guidance.

### 🎯 Success Criteria
- [ ] 8-week program with daily educational modules
- [ ] 70%+ of users complete Week 1
- [ ] Progressive therapy duration targets
- [ ] Weekly check-ins with adaptive recommendations
- [ ] Users report "structure helps motivation" in feedback

### 📝 Implementation Steps

#### 1. Design Program Curriculum

```javascript
// src/programs/HabituationProgram.js
export const HABITUATION_PROGRAM = {
  meta: {
    name: 'Tinnitus Habituation Journey',
    duration: '8 weeks',
    goal: 'Guide you through evidence-based habituation process',
    evidence: 'Based on research showing 3-6 months for meaningful improvement'
  },

  weeks: [
    {
      week: 1,
      theme: 'Understanding Tinnitus',
      goal: 'Build foundation and start daily practice',
      dailyTarget: 15, // minutes
      modules: [
        {
          day: 1,
          title: 'Welcome to Your Journey',
          content: 'What is tinnitus and how does habituation work?',
          video: '/videos/week1-day1.mp4', // Optional
          readingTime: 5, // minutes
          exercise: 'Complete first 15-minute therapy session',
          completed: false
        },
        {
          day: 2,
          title: 'The Science of Sound Therapy',
          content: 'How notched sound therapy retrains your brain...',
          readingTime: 5,
          exercise: 'Try different sound types (pink noise, ocean, rain)',
          completed: false
        },
        // ... days 3-7
      ]
    },
    {
      week: 2,
      theme: 'Building Your Routine',
      goal: 'Establish consistent daily practice',
      dailyTarget: 20, // Increase gradually
      modules: [
        // Daily modules for week 2
      ]
    },
    {
      week: 3,
      theme: 'Managing Reactions',
      goal: 'Learn to respond differently to tinnitus',
      dailyTarget: 30,
      modules: [
        {
          day: 1,
          title: 'Attention & Tinnitus',
          content: 'Why noticing tinnitus makes it louder...',
          readingTime: 5,
          exercise: 'Attention redirection practice',
          cbTechnique: 'attentionControl'
        },
        // More days
      ]
    },
    // ... weeks 4-8
  ]
};
```

#### 2. Create Program Progress Tracker

```javascript
// src/components/ProgramTracker.jsx
const ProgramTracker = ({ userId }) => {
  const [program, setProgram] = useState(loadProgram(userId));

  const currentWeek = program.weeks.find(w =>
    !w.modules.every(m => m.completed)
  );

  const progress = calculateProgress(program);

  return (
    <div className="program-tracker">
      <h2>{program.meta.name}</h2>

      {/* Overall progress */}
      <div className="progress-overview">
        <CircularProgress value={progress.percentage} />
        <p>Week {currentWeek.week} of 8</p>
        <p>{progress.completedModules}/{progress.totalModules} modules completed</p>
      </div>

      {/* Today's module */}
      <div className="daily-module">
        <h3>Today: {getTodaysModule().title}</h3>
        <button onClick={() => startModule(getTodaysModule())}>
          Start Today's Lesson
        </button>
      </div>

      {/* Week view */}
      <div className="week-modules">
        {currentWeek.modules.map(module => (
          <ModuleCard
            key={module.day}
            module={module}
            onComplete={() => completeModule(module)}
          />
        ))}
      </div>
    </div>
  );
};
```

#### 3. Create Module Content Components

```javascript
// src/components/ModuleContent.jsx
const ModuleContent = ({ module, onComplete }) => {
  const [readingComplete, setReadingComplete] = useState(false);
  const [exerciseComplete, setExerciseComplete] = useState(false);

  return (
    <div className="module-content">
      {/* Educational content */}
      <div className="reading-section">
        <h2>{module.title}</h2>
        <div className="content">
          {module.content}
        </div>
        <p className="reading-time">
          📖 {module.readingTime} min read
        </p>
        <button onClick={() => setReadingComplete(true)}>
          I've read this ✓
        </button>
      </div>

      {/* Practice exercise */}
      {readingComplete && (
        <div className="exercise-section">
          <h3>Today's Practice</h3>
          <p>{module.exercise}</p>

          {module.cbTechnique && (
            <CBTExercise technique={module.cbTechnique} />
          )}

          <button onClick={() => {
            setExerciseComplete(true);
            onComplete();
          }}>
            Complete Exercise
          </button>
        </div>
      )}

      {/* Completion */}
      {exerciseComplete && (
        <div className="completion-message">
          <h3>🎉 Module Complete!</h3>
          <p>Great work! See you tomorrow for the next lesson.</p>
        </div>
      )}
    </div>
  );
};
```

#### 4. Implement Weekly Check-ins

```javascript
// src/components/WeeklyCheckin.jsx
const WeeklyCheckin = ({ weekNumber, onComplete }) => {
  const [responses, setResponses] = useState({});

  const questions = [
    {
      id: 'consistency',
      question: 'How many days did you do therapy this week?',
      type: 'number',
      min: 0,
      max: 7
    },
    {
      id: 'loudness',
      question: 'Average tinnitus loudness this week (0-10)',
      type: 'slider',
      min: 0,
      max: 10
    },
    {
      id: 'distress',
      question: 'Average distress level this week (0-10)',
      type: 'slider',
      min: 0,
      max: 10
    },
    {
      id: 'sleep',
      question: 'Sleep quality this week (0-10)',
      type: 'slider',
      min: 0,
      max: 10
    },
    {
      id: 'notes',
      question: 'What went well this week? Any challenges?',
      type: 'textarea'
    }
  ];

  const handleSubmit = () => {
    saveWeeklyCheckin(weekNumber, responses);

    // Generate adaptive recommendations
    const recommendations = generateRecommendations(responses);
    showRecommendations(recommendations);

    onComplete();
  };

  return (
    <div className="weekly-checkin">
      <h2>Week {weekNumber} Check-in</h2>
      <p>Take a moment to reflect on your progress this week.</p>

      {questions.map(q => (
        <QuestionInput
          key={q.id}
          question={q}
          value={responses[q.id]}
          onChange={(value) => setResponses({...responses, [q.id]: value})}
        />
      ))}

      <button onClick={handleSubmit}>Submit Check-in</button>
    </div>
  );
};
```

#### 5. Adaptive Recommendations Engine

```javascript
// src/services/RecommendationEngine.js
export const generateRecommendations = (checkinData) => {
  const recommendations = [];

  // Low consistency
  if (checkinData.consistency < 4) {
    recommendations.push({
      type: 'consistency',
      priority: 'high',
      message: 'Consistency is key for habituation. Try setting a daily reminder.',
      action: { type: 'enableReminders' }
    });
  }

  // High distress despite therapy
  if (checkinData.distress > 7 && checkinData.consistency >= 5) {
    recommendations.push({
      type: 'cbTherapy',
      priority: 'high',
      message: 'Regular therapy but high distress? CBT exercises can help reframe your response.',
      action: { type: 'startCBTModule' }
    });
  }

  // Sleep issues
  if (checkinData.sleep < 5) {
    recommendations.push({
      type: 'sleep',
      priority: 'medium',
      message: 'Poor sleep worsens tinnitus perception. Try evening calm mode before bed.',
      action: { type: 'suggestEveningRoutine' }
    });
  }

  // Positive progress
  if (checkinData.loudness < 5 && checkinData.distress < 5) {
    recommendations.push({
      type: 'encouragement',
      priority: 'low',
      message: '🎉 Great progress! Your consistency is paying off. Keep it up!',
      action: null
    });
  }

  return recommendations;
};
```

### 🧪 Testing Requirements
- [ ] Program loads correctly for new users
- [ ] Daily modules unlock in sequence
- [ ] Progress persists across sessions
- [ ] Weekly check-ins trigger at correct times
- [ ] Recommendations are contextually relevant
- [ ] Works offline (with cached content)

### 🎨 Design Specifications
- **Program card:** Progress ring, current week highlighted
- **Module cards:** Lock icon for locked, checkmark for completed
- **Today's module:** Prominent card on dashboard
- **Completion animation:** Confetti + achievement unlock

---

## Task 2: Build AI Insights & Pattern Detection Engine

### 📖 Context
MindEar uses AI-driven coaching to personalize therapy. Pattern detection can identify what works best for each individual user, creating personalized recommendations.

### 🎯 Success Criteria
- [ ] Insights engine detects 5+ meaningful patterns
- [ ] Personalized recommendations shown weekly
- [ ] Users report insights as "helpful" (feedback surveys)
- [ ] 30% of users modify therapy based on insights

### 📝 Implementation Steps

#### 1. Create Analytics Data Structure

```javascript
// src/services/AnalyticsEngine.js
export class TherapyAnalyticsEngine {
  constructor(sessions, user) {
    this.sessions = sessions;
    this.user = user;
  }

  analyzeAllPatterns() {
    return {
      optimal Timing: this.findOptimalTherapyTimes(),
      effectiveDurations: this.analyzeDurationEffectiveness(),
      soundPreferences: this.identifyMostEffectiveSounds(),
      volumePatterns: this.analyzeVolumeEffectiveness(),
      modeEffectiveness: this.compareModeOutcomes(),
      progressTrends: this.calculateProgressTrends(),
      predictiveInsights: this.generatePredictions()
    };
  }

  findOptimalTherapyTimes() {
    // Group sessions by hour of day
    const hourlyData = {};

    this.sessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { sessions: [], avgImprovement: 0 };
      }

      const improvement = session.preSession.loudness - session.postSession.loudness;
      hourlyData[hour].sessions.push(session);
      hourlyData[hour].avgImprovement =
        (hourlyData[hour].avgImprovement + improvement) / hourlyData[hour].sessions.length;
    });

    // Find best time
    const bestHour = Object.keys(hourlyData).reduce((best, hour) =>
      hourlyData[hour].avgImprovement > (hourlyData[best]?.avgImprovement || 0)
        ? hour
        : best
    );

    return {
      optimalHour: parseInt(bestHour),
      avgImprovement: hourlyData[bestHour]?.avgImprovement.toFixed(1),
      insight: `You get ${hourlyData[bestHour]?.avgImprovement.toFixed(1)}% better results when doing therapy around ${formatHour(bestHour)}.`
    };
  }

  analyzeDurationEffectiveness() {
    // Categorize sessions by duration
    const durationBuckets = {
      short: { min: 0, max: 30 * 60, sessions: [], avgImprovement: 0 },
      medium: { min: 30 * 60, max: 60 * 60, sessions: [], avgImprovement: 0 },
      long: { min: 60 * 60, max: Infinity, sessions: [], avgImprovement: 0 }
    };

    this.sessions.forEach(session => {
      const improvement = session.preSession.loudness - session.postSession.loudness;

      Object.keys(durationBuckets).forEach(bucket => {
        if (session.duration >= durationBuckets[bucket].min &&
            session.duration < durationBuckets[bucket].max) {
          durationBuckets[bucket].sessions.push(session);
          const sessions = durationBuckets[bucket].sessions;
          durationBuckets[bucket].avgImprovement =
            sessions.reduce((sum, s) =>
              sum + (s.preSession.loudness - s.postSession.loudness), 0
            ) / sessions.length;
        }
      });
    });

    // Find optimal duration
    const optimal = Object.keys(durationBuckets).reduce((best, bucket) =>
      durationBuckets[bucket].avgImprovement > (durationBuckets[best]?.avgImprovement || 0)
        ? bucket
        : best
    );

    return {
      optimalDuration: optimal,
      data: durationBuckets,
      insight: `Your ${optimal} sessions (${optimal === 'short' ? '< 30 min' : optimal === 'medium' ? '30-60 min' : '> 60 min'}) show ${durationBuckets[optimal].avgImprovement.toFixed(1)}% better results.`
    };
  }

  identifyMostEffectiveSounds() {
    const soundData = {};

    this.sessions.forEach(session => {
      const sound = session.soundType || 'pink';
      if (!soundData[sound]) {
        soundData[sound] = { sessions: [], avgImprovement: 0 };
      }

      const improvement = session.preSession.loudness - session.postSession.loudness;
      soundData[sound].sessions.push(session);
      soundData[sound].avgImprovement =
        (soundData[sound].avgImprovement * (soundData[sound].sessions.length - 1) + improvement) /
        soundData[sound].sessions.length;
    });

    // Rank sounds
    const ranked = Object.keys(soundData).sort((a, b) =>
      soundData[b].avgImprovement - soundData[a].avgImprovement
    );

    return {
      mostEffective: ranked[0],
      rankings: soundData,
      insight: `${capitalize(ranked[0])} sound gives you the best results (${soundData[ranked[0]].avgImprovement.toFixed(1)}% improvement vs ${soundData[ranked[ranked.length - 1]]?.avgImprovement.toFixed(1)}% for ${ranked[ranked.length - 1]}).`
    };
  }

  calculateProgressTrends() {
    // Split sessions into early (first month) vs recent (last month)
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const firstMonth = this.user.createdAt + (30 * 24 * 60 * 60 * 1000);

    const earlySessions = this.sessions.filter(s =>
      s.timestamp >= this.user.createdAt && s.timestamp < firstMonth
    );

    const recentSessions = this.sessions.filter(s =>
      s.timestamp >= oneMonthAgo
    );

    const earlyAvg = earlySessions.reduce((sum, s) => sum + s.preSession.loudness, 0) / earlySessions.length;
    const recentAvg = recentSessions.reduce((sum, s) => sum + s.preSession.loudness, 0) / recentSessions.length;

    const improvement = ((earlyAvg - recentAvg) / earlyAvg * 100).toFixed(1);

    return {
      earlyAverage: earlyAvg.toFixed(1),
      recentAverage: recentAvg.toFixed(1),
      percentImprovement: improvement,
      trend: improvement > 0 ? 'improving' : improvement < 0 ? 'worsening' : 'stable',
      insight: improvement > 10
        ? `🎉 Amazing progress! Your tinnitus is ${improvement}% quieter than when you started.`
        : improvement > 0
        ? `You're making progress! ${improvement}% quieter than your first month.`
        : `Your tinnitus levels are stable. Consistency will help with habituation.`
    };
  }

  generatePredictions() {
    // Predict when user will reach "habituated" status
    const sessions = this.sessions.sort((a, b) => a.timestamp - b.timestamp);

    if (sessions.length < 10) {
      return {
        insight: 'Not enough data yet for predictions. Complete 10+ sessions for personalized insights.'
      };
    }

    // Linear regression on loudness over time
    const improvements = sessions.map((s, i) => ({
      day: Math.floor((s.timestamp - sessions[0].timestamp) / (24 * 60 * 60 * 1000)),
      loudness: s.preSession.loudness
    }));

    const slope = calculateLinearRegressionSlope(improvements);

    // Predict days to reach loudness < 3 (habituated)
    const currentLoudness = sessions[sessions.length - 1].preSession.loudness;
    const daysToHabituation = (currentLoudness - 3) / Math.abs(slope);

    return {
      estimatedDays: Math.round(daysToHabituation),
      insight: slope < 0
        ? `At your current pace, you're on track to reach habituation in ~${Math.round(daysToHabituation)} days. Keep up the great work!`
        : `Your tinnitus is stable. Focus on habituation (learning to ignore it) rather than loudness reduction.`
    };
  }
}
```

#### 2. Create Insights Dashboard

```javascript
// src/components/InsightsDashboard.jsx
const InsightsDashboard = ({ userId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessions = loadSessions(userId);
    const user = loadUser(userId);

    const engine = new TherapyAnalyticsEngine(sessions, user);
    const computed = engine.analyzeAllPatterns();

    setInsights(computed);
    setLoading(false);
  }, [userId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="insights-dashboard">
      <h2>Your Personalized Insights 🔍</h2>
      <p>Based on {insights.totalSessions} therapy sessions</p>

      {/* Optimal timing */}
      <InsightCard
        icon="⏰"
        title="Best Time for Therapy"
        insight={insights.optimalTiming.insight}
        action={{
          label: 'Set reminder',
          onClick: () => setReminder(insights.optimalTiming.optimalHour)
        }}
      />

      {/* Duration effectiveness */}
      <InsightCard
        icon="⏱️"
        title="Optimal Session Length"
        insight={insights.effectiveDurations.insight}
        chart={<DurationChart data={insights.effectiveDurations.data} />}
      />

      {/* Sound preferences */}
      <InsightCard
        icon="🎵"
        title="Most Effective Sound"
        insight={insights.soundPreferences.insight}
        action={{
          label: `Switch to ${insights.soundPreferences.mostEffective}`,
          onClick: () => updateSettings({ soundType: insights.soundPreferences.mostEffective })
        }}
      />

      {/* Progress trends */}
      <InsightCard
        icon="📈"
        title="Your Progress"
        insight={insights.progressTrends.insight}
        chart={<TrendChart sessions={sessions} />}
      />

      {/* Predictions */}
      {insights.predictiveInsights.estimatedDays && (
        <InsightCard
          icon="🔮"
          title="Looking Ahead"
          insight={insights.predictiveInsights.insight}
        />
      )}
    </div>
  );
};
```

### 🧪 Testing Requirements
- [ ] Analytics engine handles edge cases (< 5 sessions)
- [ ] Insights are accurate (manual verification)
- [ ] Recommendations are contextually appropriate
- [ ] Charts render correctly with various data ranges
- [ ] Performance: Analysis completes in < 500ms for 100 sessions

---

## Task 3-5: [Abbreviated for Length]

**Task 3: EMA (Quick Logging)** - Add "How is it now?" button for real-time tinnitus tracking throughout the day.

**Task 4: Offline Mode** - Re-enable service workers, cache core assets and user data for offline therapy sessions.

**Task 5: Sound Layering** - Allow users to mix multiple sounds (e.g., ocean + binaural beats + heartbeat).

---

## 🚀 Phase 2 Deployment Checklist

- [ ] All Phase 1 tasks deployed and stable
- [ ] 8-week program content complete
- [ ] AI insights accurate and helpful
- [ ] EMA logging functional
- [ ] Offline mode tested on multiple devices
- [ ] Sound mixer works without audio glitches
- [ ] User feedback collected and positive
- [ ] Performance metrics meet targets
- [ ] Documentation updated

### Success Metrics (Track for 2 Weeks Post-Deploy)
- [ ] 1-month retention: 65%+ (target)
- [ ] Program enrollment: 60%+ of active users
- [ ] Week 1 completion: 70%+ of enrolled users
- [ ] Insights viewed: 80%+ of users with 10+ sessions
- [ ] Offline sessions: 15%+ of total sessions

---

**Next:** Phase 3 - Market Leadership
