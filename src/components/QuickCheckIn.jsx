import React, { useState } from 'react';
import './QuickCheckIn.css';

/**
 * QuickCheckIn - Ecological Momentary Assessment (EMA)
 * Allows users to quickly log their tinnitus state throughout the day
 * Provides valuable data for pattern detection and trend analysis
 */
const QuickCheckIn = ({ onComplete, onCancel }) => {
  const [loudness, setLoudness] = useState(5);
  const [awareness, setAwareness] = useState(5);
  const [distress, setDistress] = useState(5);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activities = [
    { id: 'working', label: '💼 Working', emoji: '💼' },
    { id: 'relaxing', label: '🛋️ Relaxing', emoji: '🛋️' },
    { id: 'exercising', label: '🏃 Exercising', emoji: '🏃' },
    { id: 'eating', label: '🍽️ Eating', emoji: '🍽️' },
    { id: 'sleeping', label: '😴 Trying to Sleep', emoji: '😴' },
    { id: 'social', label: '👥 Socializing', emoji: '👥' },
    { id: 'quiet', label: '🤫 Quiet Environment', emoji: '🤫' },
    { id: 'noisy', label: '📢 Noisy Environment', emoji: '📢' }
  ];

  const handleSubmit = async () => {
    setSubmitting(true);

    const checkIn = {
      timestamp: Date.now(),
      loudness,
      awareness,
      distress,
      activity,
      notes: notes.trim(),
      type: 'ema' // Ecological Momentary Assessment
    };

    // Save to localStorage
    const storedCheckIns = JSON.parse(localStorage.getItem('tinnitune_ema_checkins') || '[]');
    storedCheckIns.push(checkIn);
    localStorage.setItem('tinnitune_ema_checkins', JSON.stringify(storedCheckIns));

    // Brief success feedback
    setTimeout(() => {
      if (onComplete) onComplete(checkIn);
    }, 300);
  };

  return (
    <div className="quick-checkin-modal-overlay" onClick={onCancel}>
      <div className="quick-checkin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkin-header">
          <h3>Quick Check-In</h3>
          <p className="checkin-subtitle">How's your tinnitus right now?</p>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        {!submitting ? (
          <div className="checkin-content">
            {/* Loudness Rating */}
            <div className="rating-section">
              <label className="rating-label">
                <span className="label-icon">🔊</span>
                How loud is it?
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={loudness}
                  onChange={(e) => setLoudness(parseInt(e.target.value))}
                  className="rating-slider"
                />
                <div className="slider-labels">
                  <span>Silent</span>
                  <span className="current-value">{loudness}</span>
                  <span>Very Loud</span>
                </div>
              </div>
            </div>

            {/* Awareness Rating */}
            <div className="rating-section">
              <label className="rating-label">
                <span className="label-icon">👂</span>
                How aware of it are you?
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={awareness}
                  onChange={(e) => setAwareness(parseInt(e.target.value))}
                  className="rating-slider"
                />
                <div className="slider-labels">
                  <span>Not at all</span>
                  <span className="current-value">{awareness}</span>
                  <span>Very aware</span>
                </div>
              </div>
            </div>

            {/* Distress Rating */}
            <div className="rating-section">
              <label className="rating-label">
                <span className="label-icon">😟</span>
                How much does it bother you?
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={distress}
                  onChange={(e) => setDistress(parseInt(e.target.value))}
                  className="rating-slider"
                />
                <div className="slider-labels">
                  <span>Not at all</span>
                  <span className="current-value">{distress}</span>
                  <span>Extremely</span>
                </div>
              </div>
            </div>

            {/* Activity Context */}
            <div className="activity-section">
              <label className="rating-label">
                <span className="label-icon">📍</span>
                What are you doing?
              </label>
              <div className="activity-grid">
                {activities.map((act) => (
                  <button
                    key={act.id}
                    className={`activity-btn ${activity === act.id ? 'selected' : ''}`}
                    onClick={() => setActivity(activity === act.id ? '' : act.id)}
                  >
                    <span className="activity-emoji">{act.emoji}</span>
                    <span className="activity-label">{act.label.replace(/^.\s/, '')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div className="notes-section">
              <label className="rating-label">
                <span className="label-icon">📝</span>
                Notes (optional)
              </label>
              <textarea
                className="notes-input"
                placeholder="Any triggers, observations, or thoughts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                rows={2}
              />
              <div className="char-count">{notes.length}/200</div>
            </div>

            {/* Submit Button */}
            <button className="submit-btn" onClick={handleSubmit}>
              Save Check-In
            </button>

            <p className="checkin-hint">
              💡 Logging throughout the day helps identify patterns and triggers
            </p>
          </div>
        ) : (
          <div className="checkin-success">
            <div className="success-icon">✓</div>
            <h4>Check-In Saved!</h4>
            <p>Your data helps us understand your patterns better.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * QuickCheckInButton - Floating action button to trigger check-ins
 */
export const QuickCheckInButton = ({ onClick, checkInCount }) => {
  return (
    <button
      className="quick-checkin-fab"
      onClick={onClick}
      title="Quick Check-In: How's your tinnitus right now?"
    >
      <span className="fab-icon">📊</span>
      {checkInCount > 0 && (
        <span className="fab-badge">{checkInCount}</span>
      )}
      <span className="fab-tooltip">Quick Check-In</span>
    </button>
  );
};

export default QuickCheckIn;
