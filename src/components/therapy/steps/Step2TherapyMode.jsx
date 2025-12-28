import React from 'react';

export default function Step2TherapyMode({ config, updateConfig, nextStep, prevStep }) {
  const modes = [
    {
      id: 'daytime',
      name: 'Daytime Focus',
      emoji: '☀️',
      description: 'Best for: Work, concentration, alertness',
      frequency: '10 Hz (Alpha)',
      duration: '15-60 minutes',
      color: '#667eea',
      benefits: ['Enhanced focus', 'Mental clarity', 'Reduced anxiety']
    },
    {
      id: 'evening',
      name: 'Evening Calm',
      emoji: '🌅',
      description: 'Best for: Relaxation, winding down',
      frequency: '6 Hz (Theta)',
      duration: '30-60 minutes',
      color: '#f093fb',
      benefits: ['Deep relaxation', 'Stress relief', 'Peaceful state']
    },
    {
      id: 'sleep',
      name: 'Deep Sleep',
      emoji: '🌙',
      description: 'Best for: Before bed, deep relaxation',
      frequency: '2 Hz (Delta)',
      duration: '30-120 minutes',
      color: '#4ECDC4',
      benefits: ['Better sleep', 'Complete calm', 'Deep rest']
    }
  ];

  const handleSelectMode = (modeId) => {
    updateConfig({ therapyMode: modeId });
    // Auto-advance after selection
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div>
      <h2 style={{
        color: 'white',
        fontSize: '24px',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        What would you like to achieve?
      </h2>

      <p style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        Select the mode that best fits your current needs
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '25px'
      }}>
        {modes.map((mode) => {
          const isSelected = config.therapyMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              style={{
                padding: '20px',
                background: isSelected
                  ? `linear-gradient(135deg, ${mode.color}40, ${mode.color}20)`
                  : 'rgba(255,255,255,0.08)',
                border: isSelected
                  ? `2px solid ${mode.color}`
                  : '2px solid rgba(255,255,255,0.15)',
                borderRadius: '16px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.target.style.background = 'rgba(255,255,255,0.12)';
                  e.target.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.target.style.background = 'rgba(255,255,255,0.08)';
                  e.target.style.transform = 'translateX(0)';
                }
              }}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: mode.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}>
                  ✓
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{ fontSize: '40px' }}>{mode.emoji}</div>

                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    marginBottom: '5px',
                    color: isSelected ? mode.color : 'white'
                  }}>
                    {mode.name}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '10px'
                  }}>
                    {mode.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      🎵 Binaural: {mode.frequency}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      ⏱️ Duration: {mode.duration}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {mode.benefits.map((benefit, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          color: isSelected ? mode.color : 'rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.05)',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        • {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={prevStep}
          style={{
            flex: 1,
            padding: '15px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
