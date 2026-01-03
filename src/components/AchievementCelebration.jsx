import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

/**
 * Achievement Celebration Modal
 *
 * Displays a celebratory modal when achievements are unlocked, with:
 * - Confetti animation
 * - Achievement badge and details
 * - Optional sound effect
 * - Respects user's animation preferences
 */
const AchievementCelebration = ({ achievement, onClose, soundEnabled = true }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 10);

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      // Fire confetti with TinniTune colors
      const duration = 3000; // 3 seconds
      const animationEnd = Date.now() + duration;

      const colors = ['#4ECDC4', '#667eea', '#FFB74D', '#FCE38A', '#FFFFFF'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      }());
    }

    // Optional sound effect (subtle chime)
    if (soundEnabled) {
      playAchievementSound();
    }

    // Auto-close after 5 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(autoCloseTimer);
  }, [soundEnabled]);

  const playAchievementSound = () => {
    // Create a subtle achievement sound using Web Audio API
    // (Fallback for when we don't have audio files)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create a pleasant three-note chime (C-E-G major chord)
      const playNote = (frequency, startTime, duration = 0.3) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope (attack-decay)
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Decay

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      playNote(523.25, now); // C5
      playNote(659.25, now + 0.1); // E5
      playNote(783.99, now + 0.2); // G5
    } catch (error) {
      console.warn('Could not play achievement sound:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)'
        }}
      />

      {/* Achievement Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: isVisible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.8)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
          padding: '40px 32px',
          borderRadius: '24px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(78, 205, 196, 0.3)',
          zIndex: 9999,
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close achievement notification"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '18px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          color: '#FCE38A',
          fontSize: '16px',
          fontWeight: '600',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          🎉 Achievement Unlocked!
        </div>

        {/* Badge */}
        <div style={{
          fontSize: '80px',
          marginBottom: '16px',
          animation: isVisible ? 'bounce 0.6s ease' : 'none'
        }}>
          {achievement.emoji}
        </div>

        {/* Achievement name */}
        <h2
          id="achievement-title"
          style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '8px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          {achievement.name}
        </h2>

        {/* Achievement description */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '14px',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          {achievement.description}
        </p>

        {/* Unlocked date */}
        <div style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          marginBottom: '20px'
        }}>
          Unlocked: {new Date().toLocaleDateString()}
        </div>

        {/* Action button */}
        <button
          onClick={handleClose}
          style={{
            background: 'linear-gradient(135deg, #4ECDC4, #44B3AA)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 32px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(78, 205, 196, 0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(78, 205, 196, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(78, 205, 196, 0.4)';
          }}
        >
          Awesome! 🎉
        </button>

        {/* CSS animation for bounce effect */}
        <style>{`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            25% {
              transform: translateY(-20px) scale(1.1);
            }
            50% {
              transform: translateY(-10px) scale(1.05);
            }
            75% {
              transform: translateY(-5px) scale(1.02);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            @keyframes bounce {
              0%, 100% {
                transform: translateY(0) scale(1);
              }
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default AchievementCelebration;
