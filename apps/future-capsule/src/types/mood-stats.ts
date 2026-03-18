import { Mood } from './capsule';

/**
 * Mood Statistics and Insights Types
 */

export interface MoodStats {
  mood: Mood;
  count: number;
  percentage: number;
}

export interface TimelineStats {
  total: number;
  unlocked: number;
  locked: number;
  openingSoon: number;
  upcomingIn30Days: number;
}

export interface MoodInsights {
  moodDistribution: MoodStats[];
  timelineStats: TimelineStats;
  mostWrittenMood: { mood: Mood; count: number } | null;
  moodTrend?: {
    month: string;
    mood: Mood;
    count: number;
  }[];
}

export interface MoodCardProps {
  mood: Mood;
  count: number;
  percentage: number;
  emoji: string;
}
