import React, { useState, useEffect } from 'react';
import { HABITUATION_PROGRAM, getCurrentModule, calculateProgress } from '../programs/HabituationProgram';
import './ProgramTracker.css';

/**
 * ProgramTracker - Displays user's progress through 8-week habituation program
 * Shows current module, weekly overview, and overall progress
 */
const ProgramTracker = ({ onStartModule, onClose }) => {
  const [programData, setProgramData] = useState(null);
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'week', 'module'
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    loadProgramData();
  }, []);

  const loadProgramData = () => {
    const stored = localStorage.getItem('tinnitune_program_data');
    if (stored) {
      const data = JSON.parse(stored);
      setProgramData(data);
    } else {
      // Initialize new program
      const newData = {
        startDate: new Date().toISOString(),
        completedModules: [],
        weeklyCheckIns: [],
        tfiScores: []
      };
      localStorage.setItem('tinnitune_program_data', JSON.stringify(newData));
      setProgramData(newData);
    }
  };

  const saveProgramData = (data) => {
    localStorage.setItem('tinnitune_program_data', JSON.stringify(data));
    setProgramData(data);
  };

  const completeModule = (weekNum, dayNum) => {
    const moduleId = `week${weekNum}-day${dayNum}`;
    if (!programData.completedModules.includes(moduleId)) {
      const updated = {
        ...programData,
        completedModules: [...programData.completedModules, moduleId],
        lastCompletedDate: new Date().toISOString()
      };
      saveProgramData(updated);
    }
  };

  const isModuleCompleted = (weekNum, dayNum) => {
    if (!programData) return false;
    const moduleId = `week${weekNum}-day${dayNum}`;
    return programData.completedModules.includes(moduleId);
  };

  if (!programData) {
    return <div className="program-tracker loading">Loading program...</div>;
  }

  const progress = calculateProgress(programData.completedModules);
  const current = getCurrentModule(programData.startDate);

  return (
    <div className="program-tracker">
      <div className="program-header">
        <button className="close-btn" onClick={onClose} aria-label="Close program">
          ✕
        </button>
        <h2>{HABITUATION_PROGRAM.meta.name}</h2>
        <p className="program-subtitle">{HABITUATION_PROGRAM.meta.goal}</p>
      </div>

      {/* Progress Overview */}
      <div className="progress-overview">
        <div className="circular-progress">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#4ECDC4"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress.percentage / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <text
              x="60"
              y="60"
              textAnchor="middle"
              dy="7"
              fontSize="24"
              fill="#4ECDC4"
              fontWeight="bold"
            >
              {progress.percentage}%
            </text>
          </svg>
        </div>

        <div className="progress-stats">
          <p className="current-week">Week {current?.weekNumber || 1} of 8</p>
          <p className="modules-completed">
            {progress.completedModules}/{progress.totalModules} modules completed
          </p>
          {programData.completedModules.length > 0 && (
            <p className="last-activity">
              Last activity: {new Date(programData.lastCompletedDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Today's Module */}
      {current && current.module && (
        <div className="today-module">
          <div className="module-badge">📖 Today's Lesson</div>
          <h3>{current.module.title}</h3>
          <p className="module-meta">
            Week {current.weekNumber} • Day {current.dayNumber} • {current.module.readingTime} min read
          </p>
          <p className="module-preview">
            {current.module.content.substring(0, 150)}...
          </p>

          {isModuleCompleted(current.weekNumber, current.dayNumber) ? (
            <div className="completed-badge">
              ✓ Completed
            </div>
          ) : (
            <button
              className="start-module-btn"
              onClick={() => setSelectedModule(current)}
            >
              Start Today's Lesson →
            </button>
          )}
        </div>
      )}

      {/* Week Overview */}
      <div className="weeks-grid">
        <h3>Your 8-Week Journey</h3>
        {HABITUATION_PROGRAM.weeks.map((week) => {
          const weekCompleted = week.modules.every(m =>
            isModuleCompleted(week.week, m.day)
          );
          const weekInProgress = week.modules.some(m =>
            isModuleCompleted(week.week, m.day)
          ) && !weekCompleted;
          const isCurrent = current?.weekNumber === week.week;

          return (
            <div
              key={week.week}
              className={`week-card ${weekCompleted ? 'completed' : ''} ${weekInProgress ? 'in-progress' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => setCurrentView('week')}
            >
              <div className="week-header">
                <span className="week-number">Week {week.week}</span>
                {weekCompleted && <span className="check-icon">✓</span>}
                {weekInProgress && !weekCompleted && <span className="progress-icon">◐</span>}
              </div>
              <h4>{week.theme}</h4>
              <p className="week-goal">{week.goal}</p>
              <div className="week-meta">
                <span>📅 {week.modules.length} days</span>
                <span>⏱️ {week.dailyTarget} min/day</span>
              </div>
              <div className="week-progress-bar">
                <div
                  className="week-progress-fill"
                  style={{
                    width: `${(week.modules.filter(m => isModuleCompleted(week.week, m.day)).length / week.modules.length) * 100}%`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Modal */}
      {selectedModule && (
        <ModuleContent
          module={selectedModule}
          onComplete={() => {
            completeModule(selectedModule.weekNumber, selectedModule.dayNumber);
            setSelectedModule(null);
            if (onStartModule) {
              onStartModule(selectedModule);
            }
          }}
          onClose={() => setSelectedModule(null)}
        />
      )}

      {/* Help Text */}
      <div className="program-help">
        <p>
          <strong>💡 Tip:</strong> Complete lessons in order for best results.
          Research shows structured programs improve outcomes by 40%.
        </p>
      </div>
    </div>
  );
};

/**
 * ModuleContent - Displays full content of a single module
 */
const ModuleContent = ({ module, onComplete, onClose }) => {
  const [readingComplete, setReadingComplete] = useState(false);
  const [exerciseComplete, setExerciseComplete] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);

  const handleComplete = () => {
    setExerciseComplete(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  return (
    <div className="module-modal-overlay" onClick={onClose}>
      <div className="module-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close module">
          ✕
        </button>

        {/* Reading Section */}
        <div className="module-content-section">
          <div className="module-header">
            <h2>{module.module.title}</h2>
            <p className="reading-time">📖 {module.module.readingTime} minute read</p>
          </div>

          <div className="module-content-text">
            {module.module.content.split('\n\n').map((paragraph, idx) => {
              // Simple markdown-like rendering
              if (paragraph.startsWith('# ')) {
                return <h3 key={idx}>{paragraph.substring(2)}</h3>;
              } else if (paragraph.startsWith('## ')) {
                return <h4 key={idx}>{paragraph.substring(3)}</h4>;
              } else if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n');
                return (
                  <ul key={idx}>
                    {items.map((item, i) => (
                      <li key={i}>{item.substring(2)}</li>
                    ))}
                  </ul>
                );
              } else {
                return <p key={idx}>{paragraph}</p>;
              }
            })}
          </div>

          {!readingComplete && (
            <button
              className="primary-btn"
              onClick={() => setReadingComplete(true)}
            >
              I've Read This ✓
            </button>
          )}
        </div>

        {/* Quiz Section (if exists) */}
        {readingComplete && module.module.quiz && !exerciseComplete && (
          <div className="quiz-section">
            <h3>Quick Knowledge Check</h3>
            <p className="quiz-question">{module.module.quiz.question}</p>
            <div className="quiz-options">
              {module.module.quiz.options.map((option, idx) => (
                <button
                  key={idx}
                  className={`quiz-option ${quizAnswer === idx ? 'selected' : ''} ${quizAnswer === idx && idx === module.module.quiz.correctIndex ? 'correct' : ''} ${quizAnswer === idx && idx !== module.module.quiz.correctIndex ? 'incorrect' : ''}`}
                  onClick={() => setQuizAnswer(idx)}
                  disabled={quizAnswer !== null}
                >
                  {option}
                </button>
              ))}
            </div>
            {quizAnswer !== null && (
              <div className={`quiz-feedback ${quizAnswer === module.module.quiz.correctIndex ? 'correct' : 'incorrect'}`}>
                {quizAnswer === module.module.quiz.correctIndex ? '✓ Correct!' : '✗ Not quite.'}
                <p>{module.module.quiz.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Exercise Section */}
        {readingComplete && (!module.module.quiz || quizAnswer !== null) && !exerciseComplete && (
          <div className="exercise-section">
            <h3>Today's Practice</h3>
            <div className="exercise-box">
              <p>{module.module.exercise}</p>
            </div>
            <button
              className="primary-btn complete-btn"
              onClick={handleComplete}
            >
              Complete Exercise ✓
            </button>
          </div>
        )}

        {/* Completion */}
        {exerciseComplete && (
          <div className="completion-message">
            <div className="celebration-icon">🎉</div>
            <h3>Module Complete!</h3>
            <p>Great work! Keep up the momentum.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramTracker;
