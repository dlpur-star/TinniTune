import React from 'react';

export default function Step4Summary({ config, prevStep, onComplete, frequency, ear }) {
  const modeNames = {
    daytime: { name: 'Daytime Focus', emoji: '☀️', hz: '10 Hz' },
    evening: { name: 'Evening Calm', emoji: '🌅', hz: '6 Hz' },
    sleep: { name: 'Deep Sleep', emoji: '🌙', hz: '2 Hz' }
  };

  const intensityNames = {
    gentle: 'Gentle',
    standard: 'Standard',
    strong: 'Strong'
  };

  const selectedMode = modeNames[config.therapyMode];

  const getRecommendedDuration = () => {
    if (config.therapyMode === 'daytime') return '15-60 minutes';
    if (config.therapyMode === 'evening') return '30-60 minutes';
    return '30-120 minutes';
  };

  return (
    <div>
      <h2 style={{
        color: 'white',
        fontSize: '24px',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        ✓ Your Therapy Setup
      </h2>

      <p style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        Review your settings and start when ready
      </p>

      {/* Tinnitus Profile */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.15), rgba(78, 205, 196, 0.08))',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '15px',
        border: '1px solid rgba(78, 205, 196, 0.3)'
      }}>
        <h3 style={{
          color: '#4ECDC4',
          fontSize: '14px',
          fontWeight: '700',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Tinnitus Profile
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.9)'
        }}>
          <div>• Frequency: <strong>{frequency} Hz</strong></div>
          <div>• Ear: <strong>{ear === 'left' ? '👂 Left' : ear === 'right' ? 'Right 👂' : '👂 Both'}</strong></div>
          <div>• Calibrated and ready</div>
        </div>
      </div>

      {/* Therapy Settings */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(102, 126, 234, 0.08))',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '15px',
        border: '1px solid rgba(102, 126, 234, 0.3)'
      }}>
        <h3 style={{
          color: '#667eea',
          fontSize: '14px',
          fontWeight: '700',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Therapy Settings
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.9)'
        }}>
          <div>
            • Mode: <strong>{selectedMode.emoji} {selectedMode.name}</strong> ({selectedMode.hz})
          </div>
          <div>
            • Notch Therapy: <strong>{config.notchEnabled ? `${intensityNames[config.notchIntensity]} intensity` : 'Disabled'}</strong>
          </div>
          {config.calmMode && (
            <div>
              • Calm Mode: <strong>Enabled ({config.heartbeatBPM} BPM{config.breathingEnabled ? ', with breathing' : ''})</strong>
            </div>
          )}
          {!config.calmMode && (
            <div>• Calm Mode: <strong>Disabled</strong></div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.08))',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '25px',
        border: '1px solid rgba(255, 215, 0, 0.3)'
      }}>
        <h3 style={{
          color: '#FFD700',
          fontSize: '14px',
          fontWeight: '700',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          💡 Recommended Session
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.9)'
        }}>
          {config.calmMode && (
            <div>• Start with 5 min of calm mode</div>
          )}
          <div>• Session duration: <strong>{getRecommendedDuration()}</strong></div>
          <div>• Daily goal: <strong>2 hours total</strong> (can be split)</div>
          <div>• Use headphones for best results</div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onComplete}
        style={{
          width: '100%',
          padding: '20px',
          background: 'linear-gradient(135deg, #4ECDC4, #44B3AA)',
          border: 'none',
          borderRadius: '16px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: '700',
          boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)',
          marginBottom: '15px',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 12px 32px rgba(78, 205, 196, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 8px 24px rgba(78, 205, 196, 0.3)';
        }}
      >
        ▶ START THERAPY
      </button>

      {/* Back to Edit */}
      <button
        onClick={prevStep}
        style={{
          width: '100%',
          padding: '15px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        ← Back to edit settings
      </button>
    </div>
  );
}
