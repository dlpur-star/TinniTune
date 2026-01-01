import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tinnitune_therapy_goals';

const DEFAULT_GOALS = {
  therapyStartDate: null,          // Set on first session
  dailyGoalSeconds: 7200,           // 2 hours (evidence-based minimum)
  weeklyGoalDays: 5,                // 5 days per week minimum
  currentStreak: 0,
  bestStreak: 0,
  lastSessionDate: null,            // Track for streak calculation
  achievements: [],                 // Array of { id, unlockedAt }
  totalSessions: 0,
  totalSeconds: 0
};

/**
 * Achievement definitions
 */
const ACHIEVEMENTS = {
  first_session: {
    id: 'first_session',
    name: 'First Session',
    description: 'Complete your first therapy session',
    emoji: '🏅',
    check: (goals, sessions) => sessions.length >= 1
  },
  streak_7: {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Complete therapy 7 days in a row',
    emoji: '🔥',
    check: (goals) => goals.currentStreak >= 7
  },
  streak_30: {
    id: 'streak_30',
    name: '30-Day Streak',
    description: 'Complete therapy 30 days in a row',
    emoji: '⭐',
    check: (goals) => goals.currentStreak >= 30
  },
  streak_90: {
    id: 'streak_90',
    name: '90-Day Streak',
    description: 'Complete therapy 90 days in a row',
    emoji: '💎',
    check: (goals) => goals.currentStreak >= 90
  },
  sessions_10: {
    id: 'sessions_10',
    name: '10 Sessions',
    description: 'Complete 10 therapy sessions',
    emoji: '📊',
    check: (goals) => goals.totalSessions >= 10
  },
  sessions_50: {
    id: 'sessions_50',
    name: '50 Sessions',
    description: 'Complete 50 therapy sessions',
    emoji: '🎯',
    check: (goals) => goals.totalSessions >= 50
  },
  sessions_100: {
    id: 'sessions_100',
    name: '100 Sessions',
    description: 'Complete 100 therapy sessions',
    emoji: '💯',
    check: (goals) => goals.totalSessions >= 100
  },
  goal_master: {
    id: 'goal_master',
    name: 'Goal Master',
    description: 'Meet your daily goal 30 times',
    emoji: '👑',
    check: (goals, sessions) => {
      const goalMet = sessions.filter(s => s.duration >= goals.dailyGoalSeconds).length;
      return goalMet >= 30;
    }
  },
  month_1: {
    id: 'month_1',
    name: '1 Month Journey',
    description: 'Continue therapy for 1 month',
    emoji: '🌱',
    check: (goals) => {
      if (!goals.therapyStartDate) return false;
      const monthsElapsed = getMonthsElapsed(goals.therapyStartDate);
      return monthsElapsed >= 1;
    }
  },
  month_3: {
    id: 'month_3',
    name: '3 Month Journey',
    description: 'Continue therapy for 3 months',
    emoji: '🌿',
    check: (goals) => {
      if (!goals.therapyStartDate) return false;
      const monthsElapsed = getMonthsElapsed(goals.therapyStartDate);
      return monthsElapsed >= 3;
    }
  },
  month_6: {
    id: 'month_6',
    name: '6 Month Journey',
    description: 'Continue therapy for 6 months - Halfway to habituation!',
    emoji: '🌳',
    check: (goals) => {
      if (!goals.therapyStartDate) return false;
      const monthsElapsed = getMonthsElapsed(goals.therapyStartDate);
      return monthsElapsed >= 6;
    }
  },
  habituated: {
    id: 'habituated',
    name: 'Habituated',
    description: 'Achieved habituation after 8+ months of consistent therapy',
    emoji: '🌟',
    check: (goals, sessions) => {
      if (!goals.therapyStartDate) return false;
      const monthsElapsed = getMonthsElapsed(goals.therapyStartDate);

      // Must be 8+ months into therapy
      if (monthsElapsed < 8) return false;

      // Check if loudness ratings have improved (recent vs early sessions)
      const recentSessions = sessions.slice(0, 10).filter(s => s.loudnessAfter !== null);
      const earlySessions = sessions.slice(-10).filter(s => s.loudnessAfter !== null);

      if (recentSessions.length < 3 || earlySessions.length < 3) return false;

      const recentAvg = recentSessions.reduce((sum, s) => sum + s.loudnessAfter, 0) / recentSessions.length;
      const earlyAvg = earlySessions.reduce((sum, s) => sum + s.loudnessAfter, 0) / earlySessions.length;

      // Improvement of at least 2 points on 10-point scale
      return earlyAvg - recentAvg >= 2;
    }
  }
};

/**
 * Calculate months elapsed since start date
 */
function getMonthsElapsed(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return months;
}

/**
 * Get current habituation stage based on therapy start date
 */
function getHabituationStage(startDate) {
  if (!startDate) {
    return {
      stage: 0,
      name: 'Not Started',
      description: 'Begin your therapy journey',
      emoji: '🎯',
      message: 'Complete your first session to start tracking your habituation journey!'
    };
  }

  const months = getMonthsElapsed(startDate);

  if (months < 4) {
    return {
      stage: 1,
      name: 'Building Foundation',
      description: 'Stage 1: 0-4 months',
      emoji: '🚀',
      message: "You're in the most intense phase. Stay consistent—it gets easier!",
      progress: (months / 4) * 100
    };
  } else if (months < 6) {
    return {
      stage: 2,
      name: 'Noticing Relief',
      description: 'Stage 2: 4-6 months',
      emoji: '💫',
      message: "You're beginning to experience relief. Keep going!",
      progress: ((months - 4) / 2) * 100
    };
  } else if (months < 8) {
    return {
      stage: 3,
      name: 'Finding Peace',
      description: 'Stage 3: 6-8 months',
      emoji: '✨',
      message: 'Major progress! Extended relief periods are normal now.',
      progress: ((months - 6) / 2) * 100
    };
  } else {
    return {
      stage: 4,
      name: 'Habituated',
      description: 'Stage 4: 8+ months',
      emoji: '🌟',
      message: "You've achieved habituation! Maintain your routine for lasting results.",
      progress: 100
    };
  }
}

/**
 * Check if a date is today
 */
function isToday(date) {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
}

/**
 * Check if dates are consecutive days
 */
function isConsecutiveDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Custom hook for managing therapy goals and progress
 * @param {Array} sessions - Array of therapy sessions
 * @returns {Object} Goals data and methods
 */
export const useTherapyGoals = (sessions = []) => {
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);

  // Load goals from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setGoals({ ...DEFAULT_GOALS, ...parsed });
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading therapy goals:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save goals to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
      } catch (error) {
        console.error('Error saving therapy goals:', error);
      }
    }
  }, [goals, isLoaded]);

  /**
   * Initialize therapy start date (called on first session)
   */
  const initializeTherapy = useCallback(() => {
    if (!goals.therapyStartDate) {
      setGoals(prev => ({
        ...prev,
        therapyStartDate: new Date().toISOString()
      }));
    }
  }, [goals.therapyStartDate]);

  /**
   * Update streak based on new session
   */
  const updateStreak = useCallback((sessionDate) => {
    const sessionDateStr = new Date(sessionDate).toISOString();

    setGoals(prev => {
      let newStreak = prev.currentStreak;

      if (!prev.lastSessionDate) {
        // First session
        newStreak = 1;
      } else if (isToday(sessionDateStr) && isToday(prev.lastSessionDate)) {
        // Same day - don't change streak
        return prev;
      } else if (isConsecutiveDay(prev.lastSessionDate, sessionDateStr)) {
        // Consecutive day - increment streak
        newStreak = prev.currentStreak + 1;
      } else if (!isToday(prev.lastSessionDate)) {
        // Gap detected - reset streak
        newStreak = 1;
      }

      return {
        ...prev,
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, prev.bestStreak),
        lastSessionDate: sessionDateStr
      };
    });
  }, []);

  /**
   * Record a completed session
   */
  const recordSession = useCallback((sessionDuration) => {
    setGoals(prev => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      totalSeconds: prev.totalSeconds + sessionDuration
    }));
  }, []);

  /**
   * Check and unlock achievements
   */
  const checkAchievements = useCallback(() => {
    const unlockedIds = goals.achievements.map(a => a.id);
    const newlyUnlocked = [];

    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!unlockedIds.includes(achievement.id) && achievement.check(goals, sessions)) {
        const unlocked = {
          id: achievement.id,
          unlockedAt: new Date().toISOString()
        };
        newlyUnlocked.push({ ...achievement, ...unlocked });
      }
    });

    if (newlyUnlocked.length > 0) {
      setGoals(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newlyUnlocked.map(a => ({ id: a.id, unlockedAt: a.unlockedAt }))]
      }));
      setNewAchievements(newlyUnlocked);

      // Clear notification after 5 seconds
      setTimeout(() => setNewAchievements([]), 5000);
    }
  }, [goals, sessions]);

  /**
   * Get today's progress
   */
  const getTodayProgress = useCallback(() => {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(s => new Date(s.timestamp).toDateString() === today);
    const totalSeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const percentage = Math.min(100, (totalSeconds / goals.dailyGoalSeconds) * 100);
    const goalMet = totalSeconds >= goals.dailyGoalSeconds;

    return {
      totalSeconds,
      goalSeconds: goals.dailyGoalSeconds,
      percentage,
      goalMet,
      sessionsCount: todaySessions.length
    };
  }, [sessions, goals.dailyGoalSeconds]);

  /**
   * Get this week's progress
   */
  const getWeekProgress = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekSessions = sessions.filter(s => new Date(s.timestamp) >= weekStart);
    const totalSeconds = weekSessions.reduce((sum, s) => sum + s.duration, 0);

    // Count unique days with sessions
    const uniqueDays = new Set(weekSessions.map(s => new Date(s.timestamp).toDateString()));
    const daysActive = uniqueDays.size;

    // Count days that met daily goal
    const daysMet = Array.from(uniqueDays).filter(day => {
      const daySessions = weekSessions.filter(s => new Date(s.timestamp).toDateString() === day);
      const dayTotal = daySessions.reduce((sum, s) => sum + s.duration, 0);
      return dayTotal >= goals.dailyGoalSeconds;
    }).length;

    return {
      totalSeconds,
      daysActive,
      daysMet,
      goalDays: goals.weeklyGoalDays,
      weeklyGoalMet: daysActive >= goals.weeklyGoalDays,
      sessionsCount: weekSessions.length
    };
  }, [sessions, goals.dailyGoalSeconds, goals.weeklyGoalDays]);

  /**
   * Get progress trends (recent vs earlier)
   */
  const getProgressTrends = useCallback(() => {
    const ratedSessions = sessions.filter(s => s.loudnessAfter !== null && s.distress !== null);

    if (ratedSessions.length < 4) {
      return null; // Not enough data
    }

    // Get recent 10 sessions
    const recent = ratedSessions.slice(0, Math.min(10, ratedSessions.length));
    const recentLoudness = recent.reduce((sum, s) => sum + s.loudnessAfter, 0) / recent.length;
    const recentDistress = recent.reduce((sum, s) => sum + s.distress, 0) / recent.length;

    // Get older sessions (10-20 sessions ago, or earliest available)
    const earlierStart = Math.min(10, ratedSessions.length);
    const earlierEnd = Math.min(20, ratedSessions.length);
    const earlier = ratedSessions.slice(earlierStart, earlierEnd);

    if (earlier.length === 0) {
      return null; // Not enough historical data
    }

    const earlierLoudness = earlier.reduce((sum, s) => sum + s.loudnessAfter, 0) / earlier.length;
    const earlierDistress = earlier.reduce((sum, s) => sum + s.distress, 0) / earlier.length;

    const loudnessChange = ((earlierLoudness - recentLoudness) / earlierLoudness) * 100;
    const distressChange = ((earlierDistress - recentDistress) / earlierDistress) * 100;

    return {
      loudness: {
        recent: recentLoudness,
        earlier: earlierLoudness,
        change: loudnessChange,
        improving: loudnessChange > 5
      },
      distress: {
        recent: recentDistress,
        earlier: earlierDistress,
        change: distressChange,
        improving: distressChange > 5
      }
    };
  }, [sessions]);

  /**
   * Update daily goal
   */
  const setDailyGoal = useCallback((seconds) => {
    setGoals(prev => ({
      ...prev,
      dailyGoalSeconds: Math.max(1800, Math.min(14400, seconds)) // 30 min to 4 hours
    }));
  }, []);

  /**
   * Update weekly goal
   */
  const setWeeklyGoal = useCallback((days) => {
    setGoals(prev => ({
      ...prev,
      weeklyGoalDays: Math.max(1, Math.min(7, days))
    }));
  }, []);

  /**
   * Reset all goals (for testing or user request)
   */
  const resetGoals = useCallback(() => {
    setGoals(DEFAULT_GOALS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    goals,
    isLoaded,
    newAchievements,
    initializeTherapy,
    updateStreak,
    recordSession,
    checkAchievements,
    getTodayProgress,
    getWeekProgress,
    getProgressTrends,
    getHabituationStage: useCallback(() => getHabituationStage(goals.therapyStartDate), [goals.therapyStartDate]),
    setDailyGoal,
    setWeeklyGoal,
    resetGoals,
    achievements: Object.values(ACHIEVEMENTS)
  };
};

export default useTherapyGoals;
