import React, { useState, useEffect } from 'react';
import { TherapyInsightsEngine } from '../services/InsightsEngine';
import './InsightsPanel.css';

/**
 * InsightsPanel - Displays AI-driven personalized insights and recommendations
 * Analyzes user session data to show patterns and optimize therapy
 */
const InsightsPanel = ({ sessions, userStartDate, compact = false }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState(null);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      analyzeData();
    } else {
      setLoading(false);
    }
  }, [sessions]);

  const analyzeData = () => {
    setLoading(true);
    try {
      const engine = new TherapyInsightsEngine(sessions, userStartDate);
      const results = engine.analyzeAllPatterns();
      setInsights(results);
    } catch (error) {
      console.error('Error analyzing insights:', error);
      setInsights({ hasEnoughData: false, message: 'Error analyzing data' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="insights-panel loading">
        <div className="loading-spinner">🔍 Analyzing your therapy patterns...</div>
      </div>
    );
  }

  if (!insights || !insights.hasEnoughData) {
    return (
      <div className="insights-panel no-data">
        <div className="no-data-icon">📊</div>
        <h3>Insights Coming Soon!</h3>
        <p>{insights?.message || 'Complete at least 3 therapy sessions to unlock personalized AI insights.'}</p>
        <div className="progress-hint">
          {sessions && sessions.length > 0 && (
            <p className="sessions-count">
              {sessions.length} / 3 sessions completed
            </p>
          )}
        </div>
      </div>
    );
  }

  // Compact view for welcome screen
  if (compact) {
    return (
      <div className="insights-panel compact">
        <h3 className="insights-title">
          <span className="icon">💡</span>
          AI Insights
        </h3>

        {insights.insights.length > 0 ? (
          <div className="insights-compact-list">
            {insights.insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="insight-compact-card">
                <span className="insight-icon">{insight.icon}</span>
                <div className="insight-compact-content">
                  <div className="insight-category">{insight.category}</div>
                  <div className="insight-text">{insight.insight}</div>
                </div>
              </div>
            ))}
            {insights.insights.length > 3 && (
              <div className="more-insights">
                +{insights.insights.length - 3} more insights available
              </div>
            )}
          </div>
        ) : (
          <p className="no-insights">Keep tracking sessions to unlock insights!</p>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="insights-panel full">
      <div className="insights-header">
        <h2>
          <span className="icon">🤖</span>
          AI-Powered Insights
        </h2>
        <p className="subtitle">
          Personalized recommendations based on {insights.totalSessions} therapy sessions
        </p>
      </div>

      {/* Top Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3 className="section-title">
            <span className="icon">⭐</span>
            Top Recommendations
          </h3>
          <div className="recommendations-grid">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <span className="rec-icon">{rec.icon}</span>
                <div className="rec-content">
                  <div className="rec-category">{rec.category}</div>
                  <div className="rec-text">{rec.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Insights */}
      <div className="insights-section">
        <h3 className="section-title">
          <span className="icon">📈</span>
          Pattern Analysis
        </h3>
        <div className="insights-grid">
          {insights.insights.map((insight, index) => (
            <div
              key={index}
              className={`insight-card ${insight.confidence || 'medium'}`}
              onClick={() => setSelectedInsight(insight)}
            >
              <div className="insight-card-header">
                <span className="insight-icon-large">{insight.icon}</span>
                <div className="insight-category-badge">
                  {insight.category}
                  {insight.confidence === 'high' && (
                    <span className="confidence-badge">High Confidence</span>
                  )}
                </div>
              </div>

              <div className="insight-main-text">
                {insight.insight}
              </div>

              {insight.recommendation && (
                <div className="insight-recommendation">
                  <strong>💡 Tip:</strong> {insight.recommendation}
                </div>
              )}

              {insight.sessionCount && (
                <div className="insight-meta">
                  Based on {insight.sessionCount} sessions
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="insight-modal-overlay" onClick={() => setSelectedInsight(null)}>
          <div className="insight-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedInsight(null)}
              aria-label="Close"
            >
              ✕
            </button>

            <div className="modal-header">
              <span className="modal-icon">{selectedInsight.icon}</span>
              <h3>{selectedInsight.category}</h3>
            </div>

            <div className="modal-content">
              <div className="modal-insight">
                {selectedInsight.insight}
              </div>

              {selectedInsight.recommendation && (
                <div className="modal-recommendation">
                  <strong>Recommendation:</strong>
                  <p>{selectedInsight.recommendation}</p>
                </div>
              )}

              {selectedInsight.sessionCount && (
                <div className="modal-meta">
                  <p>
                    <strong>Data Points:</strong> {selectedInsight.sessionCount} sessions
                  </p>
                  <p>
                    <strong>Confidence:</strong> {selectedInsight.confidence || 'medium'}
                  </p>
                </div>
              )}

              {/* Additional details based on insight type */}
              {selectedInsight.type === 'timing' && selectedInsight.optimalHour !== undefined && (
                <div className="modal-details">
                  <h4>Optimal Time Window</h4>
                  <p className="time-window">
                    {formatHour(selectedInsight.optimalHour)} - {formatHour((selectedInsight.optimalHour + 1) % 24)}
                  </p>
                </div>
              )}

              {selectedInsight.type === 'sound' && selectedInsight.rankings && (
                <div className="modal-details">
                  <h4>Sound Rankings</h4>
                  <div className="sound-rankings">
                    {Object.entries(selectedInsight.rankings)
                      .sort((a, b) => b[1].avgImprovement - a[1].avgImprovement)
                      .map(([sound, data]) => (
                        <div key={sound} className="sound-rank-item">
                          <span className="sound-name">{data.displayName}</span>
                          <span className="sound-sessions">{data.sessions.length} sessions</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for time formatting
const formatHour = (hour) => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export default InsightsPanel;
