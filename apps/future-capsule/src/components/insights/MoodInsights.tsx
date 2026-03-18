'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Capsule, MOOD_EMOJIS } from '../../types/capsule';
import { MoodStats, MoodInsights } from '../../types/mood-stats';
import { MoodCard } from './MoodCard';
import { StatCard, StatsGrid } from './StatsGrid';
import { MoodChart } from './MoodChart';
import { staggerContainer, fadeInUp } from '../../lib/animations';

interface MoodInsightsProps {
  capsules: (Capsule | any)[];
}

export function MoodInsightsComponent({ capsules }: MoodInsightsProps) {
  const insights = useMemo(() => {
    const insights: MoodInsights = {
      moodDistribution: [],
      timelineStats: {
        total: capsules.length,
        unlocked: 0,
        locked: 0,
        openingSoon: 0,
        upcomingIn30Days: 0,
      },
      mostWrittenMood: null,
    };

    // Calculate mood distribution
    const moodCounts: Record<string, number> = {};
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    capsules.forEach((capsule) => {
      // Count moods
      moodCounts[capsule.mood] = (moodCounts[capsule.mood] || 0) + 1;

      // Calculate stats
      if (capsule.isUnlocked) {
        insights.timelineStats.unlocked++;
      } else {
        insights.timelineStats.locked++;
        if (capsule.unlockDate <= now + 7 * 24 * 60 * 60 * 1000) {
          insights.timelineStats.openingSoon++;
        }
        if (capsule.unlockDate <= thirtyDaysFromNow) {
          insights.timelineStats.upcomingIn30Days++;
        }
      }
    });

    // Create mood distribution array
    const moodDistribution: MoodStats[] = Object.entries(moodCounts).map(([mood, count]) => ({
      mood: mood as any,
      count,
      percentage: (count / capsules.length) * 100,
    }));

    // Sort by count descending
    moodDistribution.sort((a, b) => b.count - a.count);

    insights.moodDistribution = moodDistribution;
    insights.mostWrittenMood = moodDistribution.length > 0 ? {
      mood: moodDistribution[0].mood,
      count: moodDistribution[0].count,
    } : null;

    return insights;
  }, [capsules]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Overview Stats */}
      <motion.div
        variants={fadeInUp}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Overview</h2>
        <StatsGrid>
          <StatCard
            label="Total Capsules"
            value={insights.timelineStats.total}
            icon="📝"
            color="purple"
            delay={0}
          />
          <StatCard
            label="Unlocked"
            value={insights.timelineStats.unlocked}
            icon="✅"
            color="green"
            delay={0.1}
          />
          <StatCard
            label="Locked"
            value={insights.timelineStats.locked}
            icon="🔒"
            color="blue"
            delay={0.2}
          />
          <StatCard
            label="Opening Soon"
            value={insights.timelineStats.openingSoon}
            icon="⏰"
            color="yellow"
            delay={0.3}
          />
        </StatsGrid>
      </motion.div>

      {/* Most Written Mood */}
      {insights.mostWrittenMood && (
        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-8 border-2 border-purple-300 dark:border-purple-700"
        >
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
            🌟 Your Most Written Mood
          </p>
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-7xl"
            >
              {MOOD_EMOJIS[insights.mostWrittenMood.mood]}
            </motion.div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {insights.mostWrittenMood.mood}
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {insights.mostWrittenMood.count}
                </span>{' '}
                {insights.mostWrittenMood.count === 1 ? 'capsule' : 'capsules'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {(
                  (insights.mostWrittenMood.count / insights.timelineStats.total) *
                  100
                ).toFixed(0)}
                % of your messages
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mood Distribution Charts */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Pie Chart */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <MoodChart
            data={insights.moodDistribution}
            type="pie"
            title="Mood Distribution"
          />
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <MoodChart
            data={insights.moodDistribution}
            type="bar"
            title="Mood Frequency"
          />
        </div>
      </motion.div>

      {/* Mood Cards Grid */}
      {insights.moodDistribution.length > 0 && (
        <motion.div
          variants={fadeInUp}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">💫 Mood Breakdown</h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {insights.moodDistribution.map((stat, index) => (
              <MoodCard
                key={stat.mood}
                mood={stat.mood}
                count={stat.count}
                percentage={stat.percentage}
                emoji={MOOD_EMOJIS[stat.mood]}
                delay={index * 0.05}
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Empty State */}
      {insights.moodDistribution.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No mood data yet. Create your first capsule to see insights!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
