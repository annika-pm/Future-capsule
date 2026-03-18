'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { Mood, MOOD_EMOJIS } from '../../types/capsule';
import { MoodStats } from '../../types/mood-stats';
import { chartFadeIn } from '../../lib/animations';

interface MoodChartProps {
  data: MoodStats[];
  type?: 'pie' | 'bar';
  title?: string;
}

const MOOD_COLORS: Record<Mood, string> = {
  Happy: '#FFD700',
  Motivated: '#FF6B6B',
  Confused: '#4ECDC4',
  Sad: '#6C5CE7',
  Grateful: '#00B894',
  Hopeful: '#FF7675',
};

export function MoodChart({ data, type = 'pie', title }: MoodChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    emoji: MOOD_EMOJIS[item.mood],
  }));

  if (type === 'pie') {
    return (
      <motion.div
        variants={chartFadeIn}
        initial="hidden"
        animate="visible"
        className="w-full h-80 flex flex-col items-center justify-center"
      >
        {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.emoji} ${((entry.count / chartData.reduce((s, c) => s + c.count, 0)) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.mood] || '#888'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #4B5563',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={chartFadeIn}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
          <XAxis dataKey="mood" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #4B5563',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.mood] || '#888'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
