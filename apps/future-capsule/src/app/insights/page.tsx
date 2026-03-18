'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '../../components/layout/Header';
import { ProtectedLayout } from '../../components/layout/ProtectedLayout';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { CardSkeleton } from '../../components/shared/Loading';
import { useCapsules } from '../../hooks/useCapsules';
import { MoodInsightsComponent } from '../../components/insights/MoodInsights';
import { fadeInDown } from '../../lib/animations';

export default function InsightsPage() {
  const { capsules, isLoading } = useCapsules();

  return (
    <ProtectedLayout>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📈 Mood Insights
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore patterns and statistics about your capsules and moods
          </p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : capsules.length === 0 ? (
          <motion.div
            variants={fadeInDown}
            initial="hidden"
            animate="visible"
          >
            <Card className="p-12 text-center">
              <div className="text-5xl mb-4">🧘‍♀️</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No data yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Once you create capsules, you'll see detailed insights about your moods and writing patterns.
              </p>
              <Button asChild>
                <Link href="/create">✨ Write Your First Capsule</Link>
              </Button>
            </Card>
          </motion.div>
        ) : (
          <MoodInsightsComponent capsules={capsules as any} />
        )}
      </main>
    </ProtectedLayout>
  );
}
