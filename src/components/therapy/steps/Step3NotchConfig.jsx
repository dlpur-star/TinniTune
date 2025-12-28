import React from 'react';

export default function Step3NotchConfig({ config, updateConfig, nextStep, prevStep, frequency, ear }) {
  const [showIntensity, setShowIntensity] = React.useState(config.notchEnabled);

  const handleEnableNotch = () => {
    updateConfig({ notchEnabled: true });
    setShowIntensity(true);
  };

  const handleSkipNotch = () => {
    updateConfig({ notchEnabled: false });
    nextStep();
  };

  const handleSelectIntensity = (intensity) => {
    updateConfig({ notchIntensity: intensity });
    // Auto-advance after selection
    setTimeout(() => nextStep(), 300);
  };

  const intensities = [
    {
      id: 'gentle',
      name: 'Gentle',
      emoji: '💫',
      description: 'Wider, softer relief',
      bestFor: 'First-time users, sensitivity',
      octaves: '1.5 octave'
    },
    {
      id: 'standard',
      name: 'Standard',
      emoji: '✨',
      description: 'Clinically proven, balanced approach',
      bestFor: 'Most users (recommended)',
      octaves: '1.0 octave',
      recommended: true
    },
    {
      id: 'strong',
      name: 'Strong',
      emoji: '🎯',
      description: 'Targeted, focused relief',
      bestFor: 'Experienced users',
      octaves: '0.5 octave'
    }
  ];

  return (
    <div>
      <h2 style={{
        color: 'white',
        fontSize: '24px',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        🎯 Notch Therapy
      </h2>

      {!showIntensity ? (
        <>
          {/* Explanation */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.15), rgba(78, 205, 196, 0.08))',
            padding: '25px',
            borderRadius: '16px',
            marginBottom: '25px',
            border: '1px solid rgba(78, 205, 196, 0.3)'
          }}>
            <h3 style={{
              color: '#4ECDC4',
              fontSize: '18px',
              marginBottom: '15px',
              fontWeight: '700'
            }}>
              What is Notch Therapy?
            </h3>

            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '15px',
              lineHeight: '1.7',
              marginBottom: '15px'
            }}>
              Notch therapy uses clinically-proven sound filtering at your exact tinnitus frequency ({frequency} Hz, {ear} ear).
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px'
              }}>
                <span style={{ color: '#4ECDC4', fontSize: '18px' }}>✓</span>
                <span>Reduces tinnitus loudness over time</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px'
              }}>
                <span style={{ color: '#4ECDC4', fontSize: '18px' }}>✓</span>
                <span>Backed by clinical research</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px'
              }}>
                <span style={{ color: '#4ECDC4', fontSize: '18px' }}>✓</span>
                <span>Works best with 2 hours daily use</span>
              </div>
            </div>

            <div style={{
              background: 'rgba(78, 205, 196, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.9)'
            }}>
              📊 <strong>Your tinnitus profile:</strong> {frequency} Hz, {ear === 'left' ? '👂 Left' : ear === 'right' ? 'Right 👂' : '👂 Both'} ear{ear === 'both' ? 's' : ''}
            </div>
          </div>

          {/* Recommendation */}
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '25px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.9)',
              margin: 0,
              fontWeight: '600'
            }}>
              ⭐ Recommendation: Keep this ON for best results
            </p>
          </div>

          {/* Choice buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <button
              onClick={handleEnableNotch}
              style={{
                padding: '25px 20px',
                background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(78, 205, 196, 0.15))',
                border: '2px solid #4ECDC4',
                borderRadius: '16px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 16px rgba(78, 205, 196, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 8px 24px rgba(78, 205, 196, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(78, 205, 196, 0.2)';
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '5px' }}>
                Use Notch Therapy
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                Recommended
              </div>
            </button>

            <button
              onClick={handleSkipNotch}
              style={{
                padding: '25px 20px',
                background: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.08)';
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>
                Skip
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                Not recommended
              </div>
            </button>
          </div>

          {/* Back button */}
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
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            ← Back
          </button>
        </>
      ) : (
        <>
          {/* Intensity Selection */}
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '25px'
          }}>
            Choose your notch intensity
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '25px'
          }}>
            {intensities.map((intensity) => {
              const isSelected = config.notchIntensity === intensity.id;

              return (
                <button
                  key={intensity.id}
                  onClick={() => handleSelectIntensity(intensity.id)}
                  style={{
                    padding: '20px',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(78, 205, 196, 0.15))'
                      : 'rgba(255,255,255,0.08)',
                    border: isSelected
                      ? '2px solid #4ECDC4'
                      : '2px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'left',
                    position: 'relative'
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
                  {intensity.recommended && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '15px',
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      color: '#000',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      ⭐ RECOMMENDED
                    </div>
                  )}

                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#4ECDC4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>
                      ✓
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ fontSize: '32px' }}>{intensity.emoji}</div>

                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        marginBottom: '5px',
                        color: isSelected ? '#4ECDC4' : 'white'
                      }}>
                        {intensity.name}
                      </h4>

                      <p style={{
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.7)',
                        marginBottom: '8px'
                      }}>
                        {intensity.description}
                      </p>

                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: '5px'
                      }}>
                        Best for: {intensity.bestFor}
                      </div>

                      <div style={{
                        fontSize: '11px',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        color: 'rgba(255,255,255,0.7)'
                      }}>
                        {intensity.octaves} bandwidth
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
              onClick={() => setShowIntensity(false)}
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
        </>
      )}
    </div>
  );
}
