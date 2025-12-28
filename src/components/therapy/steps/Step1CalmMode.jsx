import React from 'react';

export default function Step1CalmMode({ config, updateConfig, nextStep }) {
  const handleEnableCalmMode = () => {
    updateConfig({ calmMode: true });
  };

  const handleSkip = () => {
    updateConfig({ calmMode: false });
    nextStep();
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div>
      <h2 style={{
        color: 'white',
        fontSize: '24px',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        💓 How are you feeling right now?
      </h2>

      {!config.calmMode ? (
        <>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Calm mode adds breathing guidance and heartbeat rhythms to help reduce anxiety before therapy
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {/* Enable Calm Mode */}
            <button
              onClick={handleEnableCalmMode}
              style={{
                padding: '30px 20px',
                background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.2), rgba(255, 138, 101, 0.2))',
                border: '2px solid rgba(255, 183, 77, 0.4)',
                borderRadius: '16px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 8px 24px rgba(255, 183, 77, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px' }}>😰</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                I'm feeling anxious
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Enable Calm Mode
              </div>
            </button>

            {/* Skip to Therapy */}
            <button
              onClick={handleSkip}
              style={{
                padding: '30px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              <div style={{ fontSize: '32px' }}>😌</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                I'm relatively calm
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Skip to therapy
              </div>
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Configure your calm mode settings
          </p>

          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.15), rgba(255, 138, 101, 0.1))',
            padding: '25px',
            borderRadius: '16px',
            marginBottom: '25px',
            border: '1px solid rgba(255, 183, 77, 0.3)'
          }}>
            {/* Heartbeat BPM */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '10px',
                display: 'block'
              }}>
                Heartbeat BPM: {config.heartbeatBPM} BPM
                <span style={{
                  marginLeft: '10px',
                  color: '#FFB74D',
                  fontSize: '12px'
                }}>
                  {config.heartbeatBPM <= 55 ? '(Very Calm)' :
                   config.heartbeatBPM <= 65 ? '(Calm)' : '(Relaxed)'}
                </span>
              </label>
              <input
                type="range"
                min="45"
                max="75"
                value={config.heartbeatBPM}
                onChange={(e) => updateConfig({ heartbeatBPM: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)',
                marginTop: '5px'
              }}>
                <span>45 (Slower)</span>
                <span>75 (Faster)</span>
              </div>
            </div>

            {/* Breathing Guide */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <input
                  type="checkbox"
                  checked={config.breathingEnabled}
                  onChange={(e) => updateConfig({ breathingEnabled: e.target.checked })}
                  style={{
                    marginRight: '10px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                Include breathing guide (6 breaths/min)
              </label>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)',
                marginTop: '8px',
                marginLeft: '28px'
              }}>
                Clinically proven cardiac coherence pattern
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(78, 205, 196, 0.15)',
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '25px',
            border: '1px solid rgba(78, 205, 196, 0.3)'
          }}>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.8)',
              margin: 0,
              lineHeight: '1.6'
            }}>
              💡 <strong>Tip:</strong> Start with 5 minutes of calm mode before main therapy for best results
            </p>
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => updateConfig({ calmMode: false })}
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
            <button
              onClick={handleContinue}
              style={{
                flex: 2,
                padding: '15px',
                background: 'linear-gradient(135deg, #4ECDC4, #44B3AA)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '700',
                boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)'
              }}
            >
              Continue →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
