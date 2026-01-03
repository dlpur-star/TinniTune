/**
 * TherapyInsightsEngine - AI-driven pattern detection for personalized recommendations
 * Analyzes user session data to identify what works best for each individual
 */

/**
 * Helper: Format hour in 12-hour format
 */
const formatHour = (hour) => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

/**
 * Helper: Capitalize first letter
 */
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Helper: Calculate linear regression slope for trend analysis
 */
const calculateLinearRegressionSlope = (points) => {
  const n = points.length;
  if (n < 2) return 0;

  const sumX = points.reduce((sum, p) => sum + p.day, 0);
  const sumY = points.reduce((sum, p) => sum + p.loudness, 0);
  const sumXY = points.reduce((sum, p) => sum + (p.day * p.loudness), 0);
  const sumX2 = points.reduce((sum, p) => sum + (p.day * p.day), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return isNaN(slope) ? 0 : slope;
};

export class TherapyInsightsEngine {
  constructor(sessions, userStartDate = null) {
    this.sessions = sessions || [];
    this.userStartDate = userStartDate || Date.now();
  }

  /**
   * Analyze all patterns and return comprehensive insights
   */
  analyzeAllPatterns() {
    if (this.sessions.length < 3) {
      return {
        hasEnoughData: false,
        message: 'Complete at least 3 therapy sessions to unlock personalized insights!',
        insights: []
      };
    }

    const insights = [];

    // Run all analyzers
    const optimalTiming = this.findOptimalTherapyTimes();
    const durationAnalysis = this.analyzeDurationEffectiveness();
    const soundPreferences = this.identifyMostEffectiveSounds();
    const modeAnalysis = this.compareModeOutcomes();
    const consistencyAnalysis = this.analyzeConsistency();
    const progressTrends = this.calculateProgressTrends();
    const predictions = this.generatePredictions();

    // Add insights that have meaningful data
    if (optimalTiming.insight) insights.push(optimalTiming);
    if (durationAnalysis.insight) insights.push(durationAnalysis);
    if (soundPreferences.insight) insights.push(soundPreferences);
    if (modeAnalysis.insight) insights.push(modeAnalysis);
    if (consistencyAnalysis.insight) insights.push(consistencyAnalysis);
    if (progressTrends.insight) insights.push(progressTrends);
    if (predictions.insight) insights.push(predictions);

    return {
      hasEnoughData: true,
      totalSessions: this.sessions.length,
      insights,
      recommendations: this.generateRecommendations(insights)
    };
  }

  /**
   * Find optimal therapy times based on effectiveness
   */
  findOptimalTherapyTimes() {
    if (this.sessions.length < 5) {
      return { type: 'timing', insight: null };
    }

    const hourlyData = {};

    this.sessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          sessions: [],
          avgImprovement: 0,
          totalDuration: 0
        };
      }

      // Calculate improvement (if loudness data exists)
      let improvement = 0;
      if (session.loudnessBefore && session.loudnessAfter) {
        improvement = session.loudnessBefore - session.loudnessAfter;
      } else if (session.rating) {
        improvement = session.rating === 'better' ? 1 : session.rating === 'worse' ? -1 : 0;
      }

      hourlyData[hour].sessions.push(session);
      hourlyData[hour].totalDuration += session.duration || 0;

      // Update rolling average
      const sessions = hourlyData[hour].sessions;
      hourlyData[hour].avgImprovement =
        sessions.reduce((sum, s) => {
          let imp = 0;
          if (s.loudnessBefore && s.loudnessAfter) {
            imp = s.loudnessBefore - s.loudnessAfter;
          } else if (s.rating) {
            imp = s.rating === 'better' ? 1 : s.rating === 'worse' ? -1 : 0;
          }
          return sum + imp;
        }, 0) / sessions.length;
    });

    // Find best time (minimum 2 sessions for reliability)
    const validHours = Object.keys(hourlyData).filter(h => hourlyData[h].sessions.length >= 2);

    if (validHours.length === 0) {
      return { type: 'timing', insight: null };
    }

    const bestHour = validHours.reduce((best, hour) =>
      hourlyData[hour].avgImprovement > (hourlyData[best]?.avgImprovement || -Infinity)
        ? hour
        : best
    );

    const bestData = hourlyData[bestHour];
    const timeRange = `${formatHour(parseInt(bestHour))} - ${formatHour((parseInt(bestHour) + 1) % 24)}`;

    return {
      type: 'timing',
      category: 'Optimal Time',
      icon: '⏰',
      optimalHour: parseInt(bestHour),
      sessionCount: bestData.sessions.length,
      avgImprovement: bestData.avgImprovement.toFixed(2),
      insight: `Your therapy sessions around ${timeRange} are most effective (${bestData.sessions.length} sessions tracked).`,
      recommendation: `Try scheduling your daily therapy during this time window for best results.`,
      confidence: bestData.sessions.length >= 5 ? 'high' : 'medium'
    };
  }

  /**
   * Analyze which session durations are most effective
   */
  analyzeDurationEffectiveness() {
    if (this.sessions.length < 5) {
      return { type: 'duration', insight: null };
    }

    const durationBuckets = {
      short: { min: 0, max: 30 * 60, label: '< 30 min', sessions: [], avgImprovement: 0 },
      medium: { min: 30 * 60, max: 60 * 60, label: '30-60 min', sessions: [], avgImprovement: 0 },
      long: { min: 60 * 60, max: Infinity, label: '> 60 min', sessions: [], avgImprovement: 0 }
    };

    this.sessions.forEach(session => {
      const improvement = this.calculateSessionImprovement(session);

      Object.keys(durationBuckets).forEach(bucket => {
        const bucketData = durationBuckets[bucket];
        if (session.duration >= bucketData.min && session.duration < bucketData.max) {
          bucketData.sessions.push(session);
          bucketData.avgImprovement = bucketData.sessions.reduce((sum, s) =>
            sum + this.calculateSessionImprovement(s), 0
          ) / bucketData.sessions.length;
        }
      });
    });

    // Find optimal duration (with at least 2 sessions)
    const validBuckets = Object.keys(durationBuckets)
      .filter(b => durationBuckets[b].sessions.length >= 2);

    if (validBuckets.length === 0) {
      return { type: 'duration', insight: null };
    }

    const optimal = validBuckets.reduce((best, bucket) =>
      durationBuckets[bucket].avgImprovement > (durationBuckets[best]?.avgImprovement || -Infinity)
        ? bucket
        : best
    );

    const optimalData = durationBuckets[optimal];

    return {
      type: 'duration',
      category: 'Session Length',
      icon: '⏱️',
      optimalDuration: optimal,
      label: optimalData.label,
      sessionCount: optimalData.sessions.length,
      data: durationBuckets,
      insight: `Your ${optimalData.label} sessions show the best results (${optimalData.sessions.length} sessions).`,
      recommendation: optimal === 'short'
        ? `Your shorter sessions work well! Consider gradually increasing to 30-60 minutes for even better long-term results.`
        : optimal === 'medium'
        ? `30-60 minute sessions are your sweet spot. This aligns with clinical research recommendations!`
        : `Longer sessions work great for you! Maintain this duration for optimal habituation.`,
      confidence: optimalData.sessions.length >= 5 ? 'high' : 'medium'
    };
  }

  /**
   * Identify most effective sound types
   */
  identifyMostEffectiveSounds() {
    if (this.sessions.length < 5) {
      return { type: 'sound', insight: null };
    }

    const soundData = {};
    const soundNames = {
      pink: 'Pink Noise',
      ocean: 'Ocean Waves',
      rain: 'Rainfall',
      forest: 'Forest Sounds'
    };

    this.sessions.forEach(session => {
      const sound = session.soundType || 'pink';
      if (!soundData[sound]) {
        soundData[sound] = {
          sessions: [],
          avgImprovement: 0,
          displayName: soundNames[sound] || capitalize(sound)
        };
      }

      const improvement = this.calculateSessionImprovement(session);
      soundData[sound].sessions.push(session);
      soundData[sound].avgImprovement =
        soundData[sound].sessions.reduce((sum, s) =>
          sum + this.calculateSessionImprovement(s), 0
        ) / soundData[sound].sessions.length;
    });

    // Rank sounds (minimum 2 sessions each)
    const validSounds = Object.keys(soundData)
      .filter(s => soundData[s].sessions.length >= 2)
      .sort((a, b) => soundData[b].avgImprovement - soundData[a].avgImprovement);

    if (validSounds.length === 0) {
      return { type: 'sound', insight: null };
    }

    const best = validSounds[0];
    const bestData = soundData[best];

    return {
      type: 'sound',
      category: 'Best Sound',
      icon: '🎵',
      mostEffective: best,
      displayName: bestData.displayName,
      sessionCount: bestData.sessions.length,
      rankings: soundData,
      insight: `${bestData.displayName} works best for you (${bestData.sessions.length} sessions tracked).`,
      recommendation: validSounds.length > 1
        ? `Stick with ${bestData.displayName}, but don't be afraid to experiment with other sounds occasionally.`
        : `Try exploring other sound options (ocean, rain, forest) to find what works best for different times of day.`,
      confidence: bestData.sessions.length >= 5 ? 'high' : 'medium'
    };
  }

  /**
   * Compare effectiveness of different therapy modes
   */
  compareModeOutcomes() {
    if (this.sessions.length < 5) {
      return { type: 'mode', insight: null };
    }

    const modeData = {};
    const modeNames = {
      daytime: 'Daytime Mode',
      evening: 'Evening Mode',
      night: 'Night Mode',
      brainwave: 'Brainwave Entrainment'
    };

    this.sessions.forEach(session => {
      const mode = session.mode || 'daytime';
      if (!modeData[mode]) {
        modeData[mode] = {
          sessions: [],
          avgImprovement: 0,
          displayName: modeNames[mode] || capitalize(mode)
        };
      }

      const improvement = this.calculateSessionImprovement(session);
      modeData[mode].sessions.push(session);
      modeData[mode].avgImprovement =
        modeData[mode].sessions.reduce((sum, s) =>
          sum + this.calculateSessionImprovement(s), 0
        ) / modeData[mode].sessions.length;
    });

    // Rank modes
    const validModes = Object.keys(modeData)
      .filter(m => modeData[m].sessions.length >= 2)
      .sort((a, b) => modeData[b].avgImprovement - modeData[a].avgImprovement);

    if (validModes.length === 0) {
      return { type: 'mode', insight: null };
    }

    const best = validModes[0];
    const bestData = modeData[best];

    return {
      type: 'mode',
      category: 'Therapy Mode',
      icon: '🌟',
      bestMode: best,
      displayName: bestData.displayName,
      sessionCount: bestData.sessions.length,
      insight: `${bestData.displayName} is most effective for you (${bestData.sessions.length} sessions).`,
      recommendation: `Continue using ${bestData.displayName} for your primary sessions.`,
      confidence: bestData.sessions.length >= 5 ? 'high' : 'medium'
    };
  }

  /**
   * Analyze consistency and adherence patterns
   */
  analyzeConsistency() {
    if (this.sessions.length < 7) {
      return { type: 'consistency', insight: null };
    }

    // Calculate days with sessions
    const sessionDates = new Set(
      this.sessions.map(s => new Date(s.timestamp).toDateString())
    );

    const uniqueDays = sessionDates.size;
    const totalDays = Math.floor((Date.now() - this.userStartDate) / (24 * 60 * 60 * 1000));
    const adherenceRate = (uniqueDays / Math.max(totalDays, 1) * 100).toFixed(0);

    // Calculate current streak
    const sortedSessions = [...this.sessions].sort((a, b) => b.timestamp - a.timestamp);
    let streak = 0;
    let lastDate = new Date().toDateString();

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.timestamp).toDateString();
      const dayDiff = Math.floor(
        (new Date(lastDate) - new Date(sessionDate)) / (24 * 60 * 60 * 1000)
      );

      if (dayDiff <= 1) {
        if (sessionDate !== lastDate) {
          streak++;
          lastDate = sessionDate;
        }
      } else {
        break;
      }
    }

    return {
      type: 'consistency',
      category: 'Consistency',
      icon: '🔥',
      adherenceRate: parseInt(adherenceRate),
      currentStreak: streak,
      uniqueDays,
      totalDays,
      insight: adherenceRate >= 70
        ? `Excellent consistency! You've done therapy on ${uniqueDays} of ${totalDays} days (${adherenceRate}%).`
        : adherenceRate >= 50
        ? `Good consistency! You've done therapy on ${uniqueDays} of ${totalDays} days (${adherenceRate}%).`
        : `You've done therapy on ${uniqueDays} of ${totalDays} days (${adherenceRate}%). Try for more consistency!`,
      recommendation: adherenceRate >= 70
        ? `Keep up the great work! Consistency is key to habituation.`
        : adherenceRate >= 50
        ? `Aim for 6-7 days per week for optimal results. Set daily reminders if helpful!`
        : `Research shows daily therapy accelerates habituation. Try setting reminders and building it into your routine.`,
      confidence: 'high'
    };
  }

  /**
   * Calculate progress trends over time
   */
  calculateProgressTrends() {
    if (this.sessions.length < 10) {
      return {
        type: 'progress',
        insight: null
      };
    }

    // Split into early vs recent sessions
    const midpoint = Math.floor(this.sessions.length / 2);
    const sortedSessions = [...this.sessions].sort((a, b) => a.timestamp - b.timestamp);

    const earlySessions = sortedSessions.slice(0, midpoint);
    const recentSessions = sortedSessions.slice(midpoint);

    const earlyAvg = earlySessions.reduce((sum, s) =>
      sum + (s.loudnessBefore || 5), 0
    ) / earlySessions.length;

    const recentAvg = recentSessions.reduce((sum, s) =>
      sum + (s.loudnessBefore || 5), 0
    ) / recentSessions.length;

    const improvement = ((earlyAvg - recentAvg) / earlyAvg * 100);

    return {
      type: 'progress',
      category: 'Progress Trend',
      icon: '📈',
      earlyAverage: earlyAvg.toFixed(1),
      recentAverage: recentAvg.toFixed(1),
      percentImprovement: improvement.toFixed(1),
      trend: improvement > 5 ? 'improving' : improvement < -5 ? 'worsening' : 'stable',
      insight: improvement > 10
        ? `🎉 Great progress! Your tinnitus is ${Math.abs(improvement).toFixed(0)}% quieter than when you started.`
        : improvement > 5
        ? `You're making progress! ${improvement.toFixed(0)}% improvement over time.`
        : improvement < -5
        ? `Your tinnitus seems louder recently. This can be normal - spikes happen. Stay consistent!`
        : `Your tinnitus levels are stable. Focus on habituation (learning to ignore it).`,
      recommendation: improvement > 5
        ? `Your current approach is working! Keep doing what you're doing.`
        : `Habituation isn't always about volume reduction. Notice if you're bothered by it less, even if loudness stays the same.`,
      confidence: 'medium'
    };
  }

  /**
   * Generate predictions about future progress
   */
  generatePredictions() {
    if (this.sessions.length < 10) {
      return {
        type: 'prediction',
        insight: null
      };
    }

    const sortedSessions = [...this.sessions].sort((a, b) => a.timestamp - b.timestamp);

    // Create data points for regression
    const dataPoints = sortedSessions.map((s, i) => ({
      day: Math.floor((s.timestamp - sortedSessions[0].timestamp) / (24 * 60 * 60 * 1000)),
      loudness: s.loudnessBefore || 5
    }));

    const slope = calculateLinearRegressionSlope(dataPoints);
    const currentLoudness = sortedSessions[sortedSessions.length - 1].loudnessBefore || 5;

    // Predict days to reach loudness < 3 (habituated)
    const targetLoudness = 3;
    const daysToTarget = slope < 0
      ? Math.abs((currentLoudness - targetLoudness) / slope)
      : null;

    return {
      type: 'prediction',
      category: 'Prediction',
      icon: '🔮',
      slope: slope.toFixed(4),
      currentLoudness: currentLoudness.toFixed(1),
      estimatedDays: daysToTarget ? Math.round(daysToTarget) : null,
      insight: slope < -0.01
        ? `At your current pace, you're trending toward habituation in ~${Math.round(daysToTarget)} days!`
        : slope > 0.01
        ? `Your loudness trend is stable. Focus on emotional habituation rather than volume reduction.`
        : `Your tinnitus is stable. This is common - habituation is about learning to ignore it.`,
      recommendation: slope < 0
        ? `You're on a great trajectory! Keep up your consistent therapy routine.`
        : `Progress isn't always linear. Measure success by how much tinnitus bothers you, not just volume.`,
      confidence: 'low'
    };
  }

  /**
   * Generate actionable recommendations based on all insights
   */
  generateRecommendations(insights) {
    const recommendations = [];

    insights.forEach(insight => {
      if (insight.recommendation && insight.confidence !== 'low') {
        recommendations.push({
          category: insight.category,
          icon: insight.icon,
          text: insight.recommendation,
          priority: insight.confidence === 'high' ? 1 : 2
        });
      }
    });

    // Sort by priority
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Helper: Calculate improvement for a single session
   */
  calculateSessionImprovement(session) {
    if (session.loudnessBefore && session.loudnessAfter) {
      return session.loudnessBefore - session.loudnessAfter;
    } else if (session.rating) {
      return session.rating === 'better' ? 1 : session.rating === 'worse' ? -1 : 0;
    }
    return 0;
  }
}
