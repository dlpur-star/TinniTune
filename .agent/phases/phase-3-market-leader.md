# Phase 3: Market Leadership (8-12 Weeks)

**Goal:** Implement features that differentiate TinniTune from all competitors, establishing it as the premium evidence-based tinnitus therapy app with professional integration, advanced features, and proven clinical outcomes.

**Timeline:** 8-12 weeks
**Estimated Effort:** 240-320 hours
**Expected Impact:** Top 3 tinnitus app ranking, 32%+ clinically meaningful improvement rate, professional adoption

---

## 📋 Task Overview

| # | Task | Priority | Effort | Impact | Dependencies |
|---|------|----------|--------|--------|--------------|
| 1 | Provider report generator & data export | P0 | 48h | High | Phase 2 complete |
| 2 | Focus training mini-game (distractor therapy) | P0 | 64h | High | None |
| 3 | Comprehensive CBT exercise library | P0 | 56h | High | None |
| 4 | A/B testing framework (notched vs. non-notched) | P1 | 40h | Medium | Session tracking |
| 5 | Standardized questionnaires (THI/TFI) | P1 | 32h | Medium | None |
| 6 | Sleep quality tracking & integration | P2 | 24h | Medium | Notification system |

**Total Estimated Time:** 264 hours

---

## Task 1: Provider Report Generator & Data Export

### 📖 Context
Neurotone AI's Tinnitus Pro includes provider portal with progress surveys. Professional integration establishes credibility and encourages users to take therapy seriously.

### 🎯 Success Criteria
- [ ] Generate professional PDF reports
- [ ] CSV export of all session data
- [ ] Share-with-provider feature
- [ ] 25%+ of users export at least one report
- [ ] Positive feedback from audiologists/ENTs

### 📝 Implementation Steps

#### 1. Install PDF Generation Library

```bash
npm install jspdf jspdf-autotable
```

#### 2. Create Report Generator Service

```javascript
// src/services/ReportGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class ClinicalReportGenerator {
  constructor(user, sessions) {
    this.user = user;
    this.sessions = sessions;
    this.analytics = new TherapyAnalyticsEngine(sessions, user);
  }

  generatePDF() {
    const doc = new jsPDF();

    // Header
    this.addHeader(doc);

    // Patient information
    this.addPatientInfo(doc);

    // Therapy summary
    this.addTherapySummary(doc);

    // Progress charts
    this.addProgressCharts(doc);

    // Session history table
    this.addSessionTable(doc);

    // Clinical notes
    this.addClinicalNotes(doc);

    return doc;
  }

  addHeader(doc) {
    doc.setFontSize(20);
    doc.text('TinniTune Therapy Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);
    doc.text('For healthcare provider review', 14, 32);

    // Logo
    const logoUrl = '/images/logo.png';
    doc.addImage(logoUrl, 'PNG', 160, 10, 30, 30);

    doc.line(14, 35, 196, 35); // Horizontal line
  }

  addPatientInfo(doc) {
    let y = 45;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Patient Information', 14, y);

    y += 8;
    doc.setFontSize(10);

    const patientInfo = [
      ['Profile Name:', this.user.name],
      ['Program Start Date:', new Date(this.user.createdAt).toLocaleDateString()],
      ['Tinnitus Frequency:', `${this.user.frequency} Hz`],
      ['Affected Ear:', this.user.ear],
      ['Total Sessions:', this.sessions.length.toString()],
      ['Total Therapy Time:', this.formatTotalTime()],
      ['Current Streak:', `${this.user.streak} days`]
    ];

    patientInfo.forEach(([label, value]) => {
      doc.text(label, 14, y);
      doc.text(value, 70, y);
      y += 6;
    });

    return y + 5;
  }

  addTherapySummary(doc) {
    let y = 100;

    doc.setFontSize(14);
    doc.text('Therapy Summary', 14, y);

    y += 8;
    doc.setFontSize(10);

    const insights = this.analytics.analyzeAllPatterns();

    // Key metrics
    const metrics = [
      ['Average Session Duration:', `${this.calcAvgDuration()} minutes`],
      ['Sessions per Week:', this.calcSessionsPerWeek().toFixed(1)],
      ['Preferred Sound Type:', insights.soundPreferences.mostEffective],
      ['Most Effective Time:', `${insights.optimalTiming.optimalHour}:00`],
      ['Notch Therapy Usage:', this.calcNotchUsage() + '%'],
      ['Binaural Beats Usage:', this.calcBinauralUsage() + '%']
    ];

    metrics.forEach(([label, value]) => {
      doc.text(label, 14, y);
      doc.text(value, 80, y);
      y += 6;
    });

    return y + 5;
  }

  addProgressCharts(doc) {
    let y = 150;

    doc.setFontSize(14);
    doc.text('Clinical Outcomes', 14, y);

    y += 10;
    doc.setFontSize(10);

    // Calculate before/after averages
    const firstQuarter = this.sessions.slice(0, Math.floor(this.sessions.length / 4));
    const lastQuarter = this.sessions.slice(-Math.floor(this.sessions.length / 4));

    const baselineLoudness = this.average(firstQuarter.map(s => s.preSession.loudness));
    const currentLoudness = this.average(lastQuarter.map(s => s.preSession.loudness));
    const loudnessChange = ((baselineLoudness - currentLoudness) / baselineLoudness * 100).toFixed(1);

    const baselineDistress = this.average(firstQuarter.map(s => s.preSession.distress));
    const currentDistress = this.average(lastQuarter.map(s => s.preSession.distress));
    const distressChange = ((baselineDistress - currentDistress) / baselineDistress * 100).toFixed(1);

    // Text summary
    doc.text(`Baseline Tinnitus Loudness (VAS): ${baselineLoudness.toFixed(1)}/10`, 14, y);
    y += 6;
    doc.text(`Current Tinnitus Loudness (VAS): ${currentLoudness.toFixed(1)}/10`, 14, y);
    y += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Change: ${loudnessChange}% ${loudnessChange > 0 ? 'reduction' : 'increase'}`, 14, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text(`Baseline Distress (VAS): ${baselineDistress.toFixed(1)}/10`, 14, y);
    y += 6;
    doc.text(`Current Distress (VAS): ${currentDistress.toFixed(1)}/10`, 14, y);
    y += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Change: ${distressChange}% ${distressChange > 0 ? 'reduction' : 'increase'}`, 14, y);
    doc.setFont(undefined, 'normal');

    // Clinical significance
    y += 10;
    if (Math.abs(loudnessChange) >= 20) {
      doc.setTextColor(0, 128, 0); // Green
      doc.text('✓ Clinically meaningful improvement (≥20% reduction)', 14, y);
      doc.setTextColor(0);
    } else {
      doc.text('Improvement noted, continuing therapy recommended', 14, y);
    }

    return y + 10;
  }

  addSessionTable(doc) {
    doc.addPage();

    doc.setFontSize(14);
    doc.text('Session History', 14, 20);

    const tableData = this.sessions.slice(-20).map(session => [
      new Date(session.timestamp).toLocaleDateString(),
      `${Math.floor(session.duration / 60)} min`,
      `${session.frequency} Hz`,
      session.soundType || 'pink',
      session.preSession.loudness,
      session.postSession.loudness,
      (session.preSession.loudness - session.postSession.loudness).toFixed(1)
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Date', 'Duration', 'Frequency', 'Sound', 'Pre', 'Post', 'Change']],
      body: tableData,
      headStyles: { fillColor: [78, 205, 196] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  }

  addClinicalNotes(doc) {
    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(12);
    doc.text('Clinical Notes', 14, finalY);

    doc.setFontSize(9);
    const notes = [
      '• VAS = Visual Analog Scale (0-10, patient self-report)',
      '• Sound therapy based on notched sound therapy research (Okamoto 2010, Pape 2021)',
      '• Therapy adherence and consistency tracked via app usage',
      '• Patient reports are subjective; clinical audiometry recommended for objective assessment',
      '• This report is for informational purposes and does not replace professional medical evaluation'
    ];

    let y = finalY + 8;
    notes.forEach(note => {
      doc.text(note, 14, y);
      y += 5;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Generated by TinniTune • Evidence-based tinnitus therapy', 14, 285);
    doc.text('For questions: support@tinnitune.com', 14, 290);
  }

  save() {
    const filename = `TinniTune_Report_${this.user.name}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.generatePDF().save(filename);
  }
}
```

#### 3. Add CSV Export

```javascript
// src/services/CSVExporter.js
export class SessionDataExporter {
  constructor(sessions) {
    this.sessions = sessions;
  }

  generateCSV() {
    const headers = [
      'Date',
      'Time',
      'Duration (min)',
      'Frequency (Hz)',
      'Sound Type',
      'Notch Enabled',
      'Notch Intensity',
      'Mode',
      'Volume Left (dB)',
      'Volume Right (dB)',
      'Loudness Before (0-10)',
      'Loudness After (0-10)',
      'Loudness Change',
      'Distress Before (0-10)',
      'Distress After (0-10)',
      'Distress Change',
      'Notes'
    ];

    const rows = this.sessions.map(s => [
      new Date(s.timestamp).toLocaleDateString(),
      new Date(s.timestamp).toLocaleTimeString(),
      (s.duration / 60).toFixed(0),
      s.frequency,
      s.soundType || 'pink',
      s.notchEnabled ? 'Yes' : 'No',
      s.notchIntensity || 'N/A',
      s.mode,
      s.volumeLeft,
      s.volumeRight,
      s.preSession.loudness,
      s.postSession.loudness,
      (s.preSession.loudness - s.postSession.loudness).toFixed(1),
      s.preSession.distress,
      s.postSession.distress,
      (s.preSession.distress - s.postSession.distress).toFixed(1),
      `"${s.notes || ''}"` // Quoted for CSV safety
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  download() {
    const csv = this.generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TinniTune_Sessions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

#### 4. Create Export UI

```javascript
// src/components/ExportData.jsx
const ExportData = ({ userId }) => {
  const [generating, setGenerating] = useState(false);

  const handlePDFExport = async () => {
    setGenerating(true);

    const user = loadUser(userId);
    const sessions = loadSessions(userId);

    const generator = new ClinicalReportGenerator(user, sessions);
    generator.save();

    setGenerating(false);

    // Track export event
    trackEvent('pdf_export', { sessionCount: sessions.length });
  };

  const handleCSVExport = () => {
    const sessions = loadSessions(userId);
    const exporter = new SessionDataExporter(sessions);
    exporter.download();

    trackEvent('csv_export', { sessionCount: sessions.length });
  };

  return (
    <div className="export-data">
      <h3>Export Your Data</h3>
      <p>Share your therapy progress with your healthcare provider</p>

      <div className="export-options">
        {/* PDF Report */}
        <div className="export-option">
          <div className="icon">📄</div>
          <h4>Professional Report (PDF)</h4>
          <p>Comprehensive report with charts, statistics, and clinical notes</p>
          <button
            onClick={handlePDFExport}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Download PDF Report'}
          </button>
        </div>

        {/* CSV Export */}
        <div className="export-option">
          <div className="icon">📊</div>
          <h4>Session Data (CSV)</h4>
          <p>Raw data for analysis in Excel or other tools</p>
          <button onClick={handleCSVExport}>
            Download CSV
          </button>
        </div>
      </div>

      <div className="export-tip">
        💡 <strong>Tip:</strong> Bring these reports to your next audiology appointment
        to discuss your progress and adjust your treatment plan.
      </div>
    </div>
  );
};
```

### 🧪 Testing Requirements
- [ ] PDF generates without errors
- [ ] PDF contains accurate data
- [ ] PDF renders correctly on all devices
- [ ] CSV exports with proper formatting
- [ ] CSV opens correctly in Excel/Google Sheets
- [ ] Privacy: No data sent to external servers

---

## Task 2: Focus Training Mini-Game (Distractor Therapy)

### 📖 Context
Recent research showed game-based approach where users ignore tinnitus-like distractor sounds while earning points for identifying target sounds. Over 20 days with progressive levels, users showed significant tinnitus handicap reduction.

### 🎯 Success Criteria
- [ ] 20-level game with progressive difficulty
- [ ] 50%+ of users try at least once
- [ ] 25%+ complete all 20 levels
- [ ] Players report reduced tinnitus awareness

### 📝 Implementation Steps

#### 1. Create Game Engine

```javascript
// src/games/FocusTraining.js
import * as Tone from 'tone';

export class FocusTrainingGame {
  constructor() {
    this.level = 1;
    this.score = 0;
    this.targetFrequencies = [500, 1000, 2000, 4000, 8000];
    this.distractorCount = 0;
  }

  async initialize() {
    await Tone.start();

    this.masterGain = new Tone.Gain(0.5).toDestination();
    this.targetPlayer = null;
    this.distractorPlayers = [];
  }

  startLevel(config) {
    const {
      targetFreq,         // Frequency user should identify
      distractorFreq,     // Tinnitus-like frequency (ignore)
      numDistractors,     // Number of distractor intervals
      totalIntervals      // Total intervals (targets + distractors)
    } = this.getLevelConfig(config.level);

    this.config = config;
    this.currentInterval = 0;
    this.levelScore = 0;

    // Randomize interval order
    this.intervals = this.generateIntervalSequence(numDistractors, totalIntervals);

    this.playNextInterval();
  }

  generateIntervalSequence(numDistractors, totalIntervals) {
    const sequence = [];

    // Add distractors
    for (let i = 0; i < numDistractors; i++) {
      sequence.push({ type: 'distractor', index: i });
    }

    // Add targets
    for (let i = 0; i < totalIntervals - numDistractors; i++) {
      sequence.push({ type: 'target', index: i });
    }

    // Shuffle
    return sequence.sort(() => Math.random() - 0.5);
  }

  async playNextInterval() {
    if (this.currentInterval >= this.intervals.length) {
      this.endLevel();
      return;
    }

    const interval = this.intervals[this.currentInterval];

    // Play tone
    if (interval.type === 'target') {
      await this.playTargetTone();
    } else {
      await this.playDistractorTone();
    }

    // Wait for user response (button click)
    this.waitingForResponse = true;
  }

  async playTargetTone() {
    const freq = this.config.targetFreq;
    const duration = 1.0; // seconds

    const osc = new Tone.Oscillator(freq, 'sine').connect(this.masterGain);
    osc.start();
    setTimeout(() => {
      osc.stop();
      osc.dispose();
    }, duration * 1000);
  }

  async playDistractorTone() {
    const freq = this.config.distractorFreq;
    const duration = 1.0;

    const osc = new Tone.Oscillator(freq, 'sine').connect(this.masterGain);
    osc.start();
    setTimeout(() => {
      osc.stop();
      osc.dispose();
    }, duration * 1000);
  }

  handleUserResponse(userSaidTarget) {
    if (!this.waitingForResponse) return;

    const interval = this.intervals[this.currentInterval];
    const correct = (interval.type === 'target' && userSaidTarget) ||
                    (interval.type === 'distractor' && !userSaidTarget);

    if (correct) {
      this.levelScore += 100;
      this.score += 100;
      this.showFeedback('correct');
    } else {
      this.showFeedback('incorrect');
    }

    this.currentInterval++;
    this.waitingForResponse = false;

    setTimeout(() => this.playNextInterval(), 1500); // Delay before next interval
  }

  getLevelConfig(level) {
    // Progressive difficulty
    const baseDistractorCount = 5;
    const baseTotalIntervals = 10;

    return {
      targetFreq: this.targetFrequencies[Math.floor((level - 1) / 4) % this.targetFrequencies.length],
      distractorFreq: 4000, // Typical tinnitus frequency
      numDistractors: Math.min(baseDistractorCount + Math.floor(level / 2), 15),
      totalIntervals: Math.min(baseTotalIntervals + level, 20)
    };
  }

  endLevel() {
    const passed = this.levelScore >= this.config.passingScore;

    if (passed) {
      this.level++;
      this.showLevelComplete();
    } else {
      this.showLevelFailed();
    }
  }

  dispose() {
    if (this.masterGain) {
      this.masterGain.dispose();
    }

    this.distractorPlayers.forEach(p => p.dispose());
  }
}
```

#### 2. Create Game UI

```javascript
// src/components/FocusTrainingGame.jsx
const FocusTrainingGame = () => {
  const [game] = useState(new FocusTrainingGame());
  const [gameState, setGameState] = useState('menu'); // menu, playing, complete
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);

  useEffect(() => {
    game.initialize();

    return () => game.dispose();
  }, []);

  const startGame = () => {
    setGameState('playing');
    game.startLevel({ level, passingScore: 600 });
  };

  const handleResponse = (isTarget) => {
    game.handleUserResponse(isTarget);
    setScore(game.score);
  };

  return (
    <div className="focus-training-game">
      {gameState === 'menu' && (
        <div className="game-menu">
          <h2>Focus Training Game</h2>
          <p>Train your brain to ignore tinnitus-like sounds while focusing on targets</p>

          <div className="game-instructions">
            <h3>How to Play:</h3>
            <ol>
              <li>Listen to each tone carefully</li>
              <li>Press "TARGET" if you hear the target frequency</li>
              <li>Press "SKIP" if it's a distractor (ignore it!)</li>
              <li>Earn points for correct responses</li>
              <li>Complete 20 levels to finish the training</li>
            </ol>
          </div>

          <div className="level-selector">
            <h4>Start at Level:</h4>
            <input
              type="number"
              min="1"
              max="20"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value))}
            />
          </div>

          <button onClick={startGame} className="start-button">
            Start Level {level}
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-play">
          <div className="game-header">
            <div>Level: {game.level}</div>
            <div>Score: {score}</div>
            <div>Interval: {game.currentInterval + 1}/{game.intervals.length}</div>
          </div>

          <div className="listening-prompt">
            🎧 Listen carefully...
          </div>

          <div className="response-buttons">
            <button
              onClick={() => handleResponse(true)}
              className="target-button"
              disabled={!game.waitingForResponse}
            >
              TARGET
            </button>

            <button
              onClick={() => handleResponse(false)}
              className="skip-button"
              disabled={!game.waitingForResponse}
            >
              SKIP
            </button>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(game.currentInterval / game.intervals.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {gameState === 'complete' && (
        <div className="level-complete">
          <h2>🎉 Level {level} Complete!</h2>
          <p>Score: {score}</p>
          <button onClick={() => setLevel(level + 1)}>Next Level</button>
          <button onClick={() => setGameState('menu')}>Back to Menu</button>
        </div>
      )}
    </div>
  );
};
```

### 🧪 Testing Requirements
- [ ] Audio plays at correct frequencies
- [ ] Response buttons register correctly
- [ ] Score calculation accurate
- [ ] Level progression works
- [ ] No audio glitches between intervals

---

## Task 3-6: [Abbreviated]

**Task 3: CBT Exercise Library** - Comprehensive library of cognitive behavioral therapy exercises (thought reframing, attention control, relaxation training).

**Task 4: A/B Testing Framework** - Allow users to test notched vs. non-notched therapy and compare effectiveness.

**Task 5: Standardized Questionnaires** - Integrate THI (Tinnitus Handicap Inventory) and TFI (Tinnitus Functional Index) for validated outcome measurement.

**Task 6: Sleep Quality Tracking** - Add next-morning sleep quality ratings to correlate with evening therapy sessions.

---

## 🚀 Phase 3 Deployment Checklist

- [ ] All Phase 2 tasks deployed and metrics positive
- [ ] Provider report generates professional output
- [ ] Focus training game tested and engaging
- [ ] CBT library evidence-based and helpful
- [ ] A/B testing provides clear insights
- [ ] THI/TFI scoring validated against clinical standards
- [ ] Sleep tracking integrated with session data
- [ ] App Store/Play Store listing updated with new features
- [ ] Marketing materials highlight differentiators
- [ ] User testimonials collected

### Success Metrics (Track for 1 Month Post-Deploy)
- [ ] Provider reports exported: 25%+ of users
- [ ] Focus game adoption: 50%+ try it
- [ ] CBT exercise completion: 40%+ of active users
- [ ] Clinically meaningful improvement: 32%+ (matches Oto app)
- [ ] App Store rating: 4.5+ stars
- [ ] Top 3 ranking for "tinnitus therapy" search

---

## 🏆 Market Leadership Indicators

When Phase 3 is complete, TinniTune should be:

1. **Most Evidence-Based**
   - ✅ Validated outcome metrics (THI/TFI)
   - ✅ Clinical-grade calibration (3AFC)
   - ✅ Professional data export
   - ✅ Research citations throughout

2. **Most Comprehensive**
   - ✅ Notched sound therapy
   - ✅ Binaural beats
   - ✅ CBT exercises
   - ✅ Focus training game
   - ✅ Structured 8-week program

3. **Most Personalized**
   - ✅ AI-driven insights
   - ✅ Pattern detection
   - ✅ Adaptive recommendations
   - ✅ A/B testing framework

4. **Most Professional**
   - ✅ Provider reports
   - ✅ Data export (CSV/PDF)
   - ✅ Standardized questionnaires
   - ✅ Clinical disclaimers

5. **Best User Experience**
   - ✅ Gamification (achievements, streaks)
   - ✅ Progress visualization
   - ✅ Smart reminders
   - ✅ Offline mode
   - ✅ Accessibility (WCAG AA)

---

**Result:** TinniTune becomes the gold standard for evidence-based, self-directed tinnitus therapy.

---

**Next Steps:** Monitor user feedback, iterate based on data, publish clinical effectiveness study, pursue partnerships with audiology clinics.
