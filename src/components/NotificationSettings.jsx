import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/NotificationService';

/**
 * Notification Settings Component
 *
 * Allows users to configure notification preferences including:
 * - Enable/disable notifications
 * - Morning check-in time
 * - Therapy reminder time
 * - Streak protection
 * - Weekly summary schedule
 */
const NotificationSettings = ({ sessions = [] }) => {
  const [settings, setSettings] = useState(notificationService.loadSettings());
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();

    if (granted) {
      setPermissionStatus('granted');
      setSettings({ ...settings, enabled: true });
      showSuccessMessage();

      // Send a test notification
      setTimeout(() => {
        notificationService.show('THERAPY_REMINDER');
      }, 1000);
    } else {
      alert('Notification permission was denied. Please enable notifications in your browser settings.');
    }
  };

  const handleDisableNotifications = () => {
    notificationService.stopMonitoring();
    notificationService.saveSettings({ enabled: false });
    setSettings({ ...settings, enabled: false });
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.saveSettings(newSettings);

    // Restart monitoring with new settings
    if (newSettings.enabled) {
      notificationService.startMonitoring();
    }

    showSuccessMessage();
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const suggestOptimalTime = () => {
    const optimalTime = notificationService.calculateOptimalTherapyTime(sessions);
    handleSettingChange('therapyReminderTime', optimalTime);
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.15), rgba(255, 183, 77, 0.08))',
      borderRadius: '12px',
      border: '1px solid rgba(255, 183, 77, 0.3)',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: 'white'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>🔔</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#FFB74D'
            }}>
              Reminders & Notifications
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '4px'
            }}>
              {settings.enabled ? '✓ Enabled' : 'Tap to enable smart reminders'}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '20px',
          color: 'rgba(255, 255, 255, 0.6)',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.3s ease'
        }}>
          ▼
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: '0 20px 20px 20px',
          borderTop: '1px solid rgba(255, 183, 77, 0.2)'
        }}>
          {/* Success Message */}
          {showSuccess && (
            <div style={{
              background: 'rgba(76, 175, 80, 0.2)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#4CAF50',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              ✓ Settings saved!
            </div>
          )}

          {/* Permission Status */}
          {!notificationService.isSupported() && (
            <div style={{
              background: 'rgba(244, 67, 54, 0.2)',
              border: '1px solid rgba(244, 67, 54, 0.4)',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px',
              color: '#F44336',
              fontSize: '13px'
            }}>
              ⚠️ Your browser does not support notifications
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div style={{
              background: 'rgba(244, 67, 54, 0.2)',
              border: '1px solid rgba(244, 67, 54, 0.4)',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px',
              color: '#F44336',
              fontSize: '13px'
            }}>
              ⚠️ Notifications are blocked. Please enable them in your browser settings.
            </div>
          )}

          {/* Enable/Disable Toggle */}
          {permissionStatus !== 'denied' && (
            <div style={{ marginTop: '16px' }}>
              {!settings.enabled ? (
                <button
                  onClick={handleEnableNotifications}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #FFB74D, #FFA726)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(255, 183, 77, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 183, 77, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 183, 77, 0.3)';
                  }}
                >
                  Enable Notifications
                </button>
              ) : (
                <button
                  onClick={handleDisableNotifications}
                  style={{
                    width: '100%',
                    background: 'rgba(244, 67, 54, 0.2)',
                    color: '#F44336',
                    border: '1px solid rgba(244, 67, 54, 0.4)',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Disable Notifications
                </button>
              )}
            </div>
          )}

          {/* Settings - Only show when enabled */}
          {settings.enabled && (
            <div style={{ marginTop: '24px' }}>
              {/* Morning Check-in */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  🌅 Morning Check-in
                </label>
                <input
                  type="time"
                  value={settings.morningCheckinTime}
                  onChange={(e) => handleSettingChange('morningCheckinTime', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '6px'
                }}>
                  Quick daily check-in to track your tinnitus
                </div>
              </div>

              {/* Therapy Reminder */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  🎧 Therapy Reminder
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="time"
                    value={settings.therapyReminderTime}
                    onChange={(e) => handleSettingChange('therapyReminderTime', e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                  {sessions.length >= 5 && (
                    <button
                      onClick={suggestOptimalTime}
                      style={{
                        background: 'rgba(78, 205, 196, 0.2)',
                        border: '1px solid rgba(78, 205, 196, 0.4)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: '#4ECDC4',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Auto
                    </button>
                  )}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '6px'
                }}>
                  Daily reminder for your therapy session
                  {sessions.length >= 5 && ' • Click "Auto" for optimal time based on your habits'}
                </div>
              </div>

              {/* Streak Protection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px',
                  background: settings.streakProtection
                    ? 'rgba(78, 205, 196, 0.15)'
                    : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  border: settings.streakProtection
                    ? '1px solid rgba(78, 205, 196, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={settings.streakProtection}
                    onChange={(e) => handleSettingChange('streakProtection', e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      🔥 Protect my streak
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: '4px'
                    }}>
                      Remind me at 9 PM if I haven't done therapy today
                    </div>
                  </div>
                </label>
              </div>

              {/* Weekly Summary */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  📊 Weekly Summary
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <select
                    value={settings.weeklySummaryDay}
                    onChange={(e) => handleSettingChange('weeklySummaryDay', parseInt(e.target.value))}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    {weekDays.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={settings.weeklySummaryTime}
                    onChange={(e) => handleSettingChange('weeklySummaryTime', e.target.value)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '6px'
                }}>
                  Weekly progress summary with stats and insights
                </div>
              </div>

              {/* Info Box */}
              <div style={{
                background: 'rgba(102, 126, 234, 0.15)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '16px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.5'
                }}>
                  💡 <strong>Tip:</strong> Research shows that regular reminders improve therapy adherence by 40%+.
                  Notifications help build consistency, which is key for habituation.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
