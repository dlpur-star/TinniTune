/**
 * Notification Service for TinniTune
 *
 * Provides smart daily reminders including:
 * - Morning check-in notifications
 * - Therapy time reminders (based on user habits)
 * - Streak protection alerts
 * - Weekly summary notifications
 *
 * Note: Uses localStorage for scheduling since service workers are currently disabled.
 * When service workers are re-enabled, migrate to using the Background Sync API.
 */

const STORAGE_KEY = 'tinnitune_notifications';

export const NOTIFICATION_TYPES = {
  MORNING_CHECKIN: {
    id: 'morning_checkin',
    title: "Good morning! 🌅",
    body: "How's your tinnitus today? Quick 10-second check-in.",
    icon: '/icons/icon-192x192.png',
    tag: 'morning-checkin'
  },

  THERAPY_REMINDER: {
    id: 'therapy_reminder',
    title: "Time for your therapy session 🎧",
    body: "You usually do therapy at this time. Ready for today's session?",
    icon: '/icons/icon-192x192.png',
    tag: 'therapy-reminder'
  },

  STREAK_PROTECTION: {
    id: 'streak_protection',
    title: "Don't break your {streakDays}-day streak! 🔥",
    body: "Quick 30-minute session will keep your progress going.",
    icon: '/icons/icon-192x192.png',
    tag: 'streak-protection',
    requireInteraction: true
  },

  WEEKLY_SUMMARY: {
    id: 'weekly_summary',
    title: "Your week in review 📊",
    body: "Great week! You completed {sessions} sessions and logged {minutes} minutes.",
    icon: '/icons/icon-192x192.png',
    tag: 'weekly-summary'
  },

  MILESTONE_NEAR: {
    id: 'milestone_near',
    title: "Almost there! 🎯",
    body: "{remaining} more sessions until {achievementName}!",
    icon: '/icons/icon-192x192.png',
    tag: 'milestone'
  }
};

/**
 * Notification Service Class
 */
export class NotificationService {
  constructor() {
    this.settings = this.loadSettings();
    this.checkInterval = null;
  }

  /**
   * Load notification settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }

    // Default settings
    return {
      enabled: false,
      morningCheckinTime: '08:00',
      therapyReminderTime: '20:00',
      streakProtection: true,
      weeklySummaryDay: 0, // Sunday
      weeklySummaryTime: '20:00',
      lastMorningCheckin: null,
      lastTherapyReminder: null,
      lastWeeklySummary: null
    };
  }

  /**
   * Save notification settings to localStorage
   */
  saveSettings(settings) {
    try {
      this.settings = { ...this.settings, ...settings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      return false;
    }
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        this.saveSettings({ enabled: true });
        this.startMonitoring();
        return true;
      }
    }

    return false;
  }

  /**
   * Check if notifications are supported and permitted
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled() {
    return this.isSupported() &&
           Notification.permission === 'granted' &&
           this.settings.enabled;
  }

  /**
   * Show a notification
   */
  show(type, data = {}) {
    if (!this.isEnabled()) {
      console.log('Notifications not enabled');
      return null;
    }

    const template = NOTIFICATION_TYPES[type];
    if (!template) {
      console.error('Unknown notification type:', type);
      return null;
    }

    // Replace placeholders in title and body
    let title = template.title;
    let body = template.body;

    Object.keys(data).forEach(key => {
      title = title.replace(`{${key}}`, data[key]);
      body = body.replace(`{${key}}`, data[key]);
    });

    const options = {
      body,
      icon: template.icon,
      badge: '/icons/badge-72x72.png',
      tag: template.tag,
      requireInteraction: template.requireInteraction || false,
      data: {
        type,
        timestamp: Date.now(),
        url: '/'
      }
    };

    try {
      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();

        // Handle different notification types
        if (type === 'MORNING_CHECKIN') {
          // Could navigate to a quick check-in modal
          window.dispatchEvent(new CustomEvent('tinnitune:show-checkin'));
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Start monitoring for scheduled notifications
   * Checks every minute if any notifications should be sent
   */
  startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkScheduledNotifications();
    }, 60 * 1000);

    // Check immediately
    this.checkScheduledNotifications();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if any scheduled notifications should be sent now
   */
  checkScheduledNotifications() {
    if (!this.isEnabled()) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    // Check morning check-in
    if (this.settings.morningCheckinTime === currentTime) {
      const lastCheckin = this.settings.lastMorningCheckin;
      const isToday = lastCheckin && new Date(lastCheckin).toDateString() === now.toDateString();

      if (!isToday) {
        this.show('MORNING_CHECKIN');
        this.saveSettings({ lastMorningCheckin: now.toISOString() });
      }
    }

    // Check therapy reminder
    if (this.settings.therapyReminderTime === currentTime) {
      const lastReminder = this.settings.lastTherapyReminder;
      const isToday = lastReminder && new Date(lastReminder).toDateString() === now.toDateString();

      if (!isToday) {
        this.show('THERAPY_REMINDER');
        this.saveSettings({ lastTherapyReminder: now.toISOString() });
      }
    }

    // Check weekly summary
    if (currentDay === this.settings.weeklySummaryDay &&
        this.settings.weeklySummaryTime === currentTime) {
      const lastSummary = this.settings.lastWeeklySummary;
      const daysSinceLastSummary = lastSummary
        ? Math.floor((now - new Date(lastSummary)) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastSummary >= 7) {
        this.sendWeeklySummary();
        this.saveSettings({ lastWeeklySummary: now.toISOString() });
      }
    }

    // Check streak protection (in the evening)
    if (this.settings.streakProtection && currentTime === '21:00') {
      this.checkStreakProtection();
    }
  }

  /**
   * Send weekly summary notification
   */
  sendWeeklySummary() {
    try {
      const sessions = JSON.parse(localStorage.getItem('tinnitune_sessions') || '[]');

      // Get sessions from the last 7 days
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const weekSessions = sessions.filter(s => new Date(s.timestamp).getTime() >= weekAgo);

      const totalMinutes = Math.floor(
        weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60
      );

      this.show('WEEKLY_SUMMARY', {
        sessions: weekSessions.length,
        minutes: totalMinutes
      });
    } catch (error) {
      console.error('Error sending weekly summary:', error);
    }
  }

  /**
   * Check if user needs streak protection reminder
   */
  checkStreakProtection() {
    try {
      const sessions = JSON.parse(localStorage.getItem('tinnitune_sessions') || '[]');
      const goals = JSON.parse(localStorage.getItem('tinnitune_therapy_goals') || '{}');

      if (!goals.currentStreak || goals.currentStreak === 0) return;

      // Check if user has done therapy today
      const today = new Date().toDateString();
      const hasSessionToday = sessions.some(s =>
        new Date(s.timestamp).toDateString() === today
      );

      if (!hasSessionToday && goals.currentStreak > 0) {
        this.show('STREAK_PROTECTION', {
          streakDays: goals.currentStreak
        });
      }
    } catch (error) {
      console.error('Error checking streak protection:', error);
    }
  }

  /**
   * Check if user is close to unlocking an achievement
   */
  checkMilestoneProximity(sessions, achievements) {
    // Example: Check if user is close to unlocking an achievement
    const totalSessions = sessions.length;

    // Check sessions-based achievements
    const milestones = [
      { count: 10, name: '10 Sessions', id: 'sessions_10' },
      { count: 50, name: '50 Sessions', id: 'sessions_50' },
      { count: 100, name: '100 Sessions', id: 'sessions_100' }
    ];

    for (const milestone of milestones) {
      const isUnlocked = achievements.some(a => a.id === milestone.id);
      if (!isUnlocked && totalSessions >= milestone.count - 3 && totalSessions < milestone.count) {
        const remaining = milestone.count - totalSessions;
        this.show('MILESTONE_NEAR', {
          remaining,
          achievementName: milestone.name
        });
        break; // Only show one milestone notification
      }
    }
  }

  /**
   * Calculate optimal therapy time based on user's session history
   */
  calculateOptimalTherapyTime(sessions) {
    if (sessions.length < 5) {
      return '20:00'; // Default evening time
    }

    // Count sessions by hour
    const hourCounts = {};
    sessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find most common hour
    let maxCount = 0;
    let optimalHour = 20;

    Object.keys(hourCounts).forEach(hour => {
      if (hourCounts[hour] > maxCount) {
        maxCount = hourCounts[hour];
        optimalHour = parseInt(hour);
      }
    });

    // Return time in HH:00 format
    return `${optimalHour.toString().padStart(2, '0')}:00`;
  }

  /**
   * Update therapy reminder time based on user habits
   */
  updateTherapyReminderTime(sessions) {
    const optimalTime = this.calculateOptimalTherapyTime(sessions);

    if (optimalTime !== this.settings.therapyReminderTime) {
      this.saveSettings({ therapyReminderTime: optimalTime });
      console.log('Updated therapy reminder time to:', optimalTime);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Auto-start monitoring if notifications are enabled
if (notificationService.isEnabled()) {
  notificationService.startMonitoring();
}

export default NotificationService;
