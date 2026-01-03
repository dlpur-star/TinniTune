import React, { useState, useEffect } from 'react';
import { getAllSounds, getSound, isSoundAvailable } from '../constants/soundLibrary';

/**
 * Sound Selector Component
 *
 * Allows users to choose between different therapy sounds:
 * - Pink noise (generated)
 * - Ocean waves
 * - Rainfall
 * - Forest ambience
 * - Stream
 * - Campfire
 *
 * All sounds are notch-filtered at the user's tinnitus frequency.
 * Users can switch sounds during active therapy without interruption.
 */
const SoundSelector = ({ currentSound, onSoundChange, isPlaying = false }) => {
  const [availableSounds, setAvailableSounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAvailableSounds();
  }, []);

  const checkAvailableSounds = async () => {
    const allSounds = getAllSounds();
    const availability = await Promise.all(
      allSounds.map(async (sound) => ({
        ...sound,
        available: await isSoundAvailable(sound.id)
      }))
    );

    setAvailableSounds(availability);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '20px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading sounds...
      </div>
    );
  }

  const current = getSound(currentSound);
  const unavailableSounds = availableSounds.filter(s => !s.available && s.type === 'file');

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          marginBottom: '6px'
        }}>
          🎵 Therapy Sound
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {isPlaying
            ? '💡 You can switch sounds during therapy without stopping!'
            : 'Choose a sound for your therapy session'}
        </div>
      </div>

      {/* Sound Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: unavailableSounds.length > 0 ? '20px' : '0'
      }}>
        {availableSounds
          .filter(sound => sound.available)
          .map(sound => {
            const isActive = sound.id === currentSound;

            return (
              <button
                key={sound.id}
                onClick={() => onSoundChange(sound.id)}
                disabled={isActive && !isPlaying}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${sound.color}40, ${sound.color}20)`
                    : 'rgba(0, 0, 0, 0.3)',
                  border: isActive
                    ? `2px solid ${sound.color}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px 12px',
                  cursor: (isActive && !isPlaying) ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isActive || isPlaying) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 16px ${sound.color}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: sound.color,
                    boxShadow: `0 0 8px ${sound.color}`,
                    animation: 'pulse 2s infinite'
                  }} />
                )}

                {/* Emoji */}
                <div style={{
                  fontSize: '32px',
                  marginBottom: '8px'
                }}>
                  {sound.emoji}
                </div>

                {/* Name */}
                <div style={{
                  color: isActive ? sound.color : 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  {sound.name}
                </div>

                {/* Description */}
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '10px',
                  lineHeight: '1.3'
                }}>
                  {sound.description}
                </div>

                {/* Clinical badge */}
                {sound.clinical && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '9px',
                    color: '#4ECDC4',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Clinical
                  </div>
                )}
              </button>
            );
          })}
      </div>

      {/* Missing sounds notice */}
      {unavailableSounds.length > 0 && (
        <div style={{
          background: 'rgba(255, 183, 77, 0.15)',
          border: '1px solid rgba(255, 183, 77, 0.3)',
          borderRadius: '10px',
          padding: '14px',
          marginTop: '16px'
        }}>
          <div style={{
            color: '#FFB74D',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            📦 Additional Sounds Available
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '11px',
            lineHeight: '1.5',
            marginBottom: '10px'
          }}>
            Add more nature sounds to expand your therapy options:
          </div>
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '8px'
          }}>
            Missing: {unavailableSounds.map(s => `${s.emoji} ${s.name}`).join(', ')}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: '1.4'
          }}>
            💡 <strong>Quick setup:</strong> Download CC-licensed sounds from <a
              href="https://freesound.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#FFB74D', textDecoration: 'underline' }}
            >
              Freesound.org
            </a> and place in <code style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '2px 4px',
              borderRadius: '3px'
            }}>/public/sounds/</code> directory. See console for details.
          </div>
          <button
            onClick={() => {
              console.log(
                '%c🎵 Sound Library Setup Instructions',
                'font-size: 16px; font-weight: bold; color: #FFB74D;'
              );
              console.log(`
Missing sound files:
${unavailableSounds.map(s => `- ${s.emoji} ${s.name}: ${s.file}`).join('\n')}

Quick Setup:
1. Visit https://freesound.org/
2. Search for each sound (e.g., "ocean waves loop")
3. Download CC-licensed MP3 files (30-60 sec, seamless loop)
4. Place in /public/sounds/ directory
5. Refresh the app

Requirements:
✓ Seamlessly looping (no gaps)
✓ High quality (44.1 kHz, 128+ kbps)
✓ Creative Commons licensed
✓ 30-60 seconds duration

Search keywords:
- Ocean: "ocean waves gentle loop"
- Rain: "rain ambience loop soft"
- Forest: "forest birds ambience loop"
- Stream: "stream water flowing loop"
- Campfire: "campfire crackling loop"
              `);
              alert('Sound setup instructions logged to console! Press F12 to view.');
            }}
            style={{
              marginTop: '10px',
              width: '100%',
              background: 'rgba(255, 183, 77, 0.2)',
              border: '1px solid rgba(255, 183, 77, 0.4)',
              borderRadius: '8px',
              padding: '10px',
              color: '#FFB74D',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 183, 77, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 183, 77, 0.2)';
            }}
          >
            📖 View Setup Instructions
          </button>
        </div>
      )}

      {/* Current selection info */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '11px',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: current.color }}>Current:</strong> {current.emoji} {current.name} •{' '}
          {current.type === 'generated' ? 'Procedurally generated' : 'Audio file'}
          {current.clinical && ' • Clinically validated'}
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default SoundSelector;
