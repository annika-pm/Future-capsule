'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { ProtectedLayout } from '../../components/layout/ProtectedLayout';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { CardSkeleton } from '../../components/shared/Loading';
import { useCapsules } from '../../hooks/useCapsules';
import { categorizeCapsules } from '../../lib/utils';
import { TimelineItem } from '../../components/timeline/TimelineItem';
import { staggerContainer, fadeInDown } from '../../lib/animations';

type SortOption = 'date-asc' | 'date-desc' | 'mood';
type Section = 'all' | 'locked' | 'opening-soon' | 'unlocked';

export default function TimelinePage() {
  const { capsules, isLoading } = useCapsules();
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');
  const [expandedSection, setExpandedSection] = useState<Section>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categorized = categorizeCapsules(capsules);

  // Filter by search query
  const filteredCapsules = useMemo(() => {
    const all = [...categorized.locked, ...categorized.openingSoon, ...categorized.opened];
    if (!searchQuery.trim()) return all;
    return all.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categorized, searchQuery]);

  // Sort capsules
  const sortedCapsules = useMemo(() => {
    const sorted = [...filteredCapsules];
    switch (sortBy) {
      case 'date-asc':
        return sorted.sort((a, b) => a.unlockDate - b.unlockDate);
      case 'date-desc':
        return sorted.sort((a, b) => b.unlockDate - a.unlockDate);
      case 'mood':
        return sorted.sort((a, b) => a.mood.localeCompare(b.mood));
      default:
        return sorted;
    }
  }, [filteredCapsules, sortBy]);

  const sectionUnlocked = sortedCapsules.filter(c => c.isUnlocked);
  const sectionOpeningSoon = sortedCapsules.filter(c => !c.isUnlocked && (c.unlockDate - Date.now()) <= 7 * 24 * 60 * 60 * 1000);
  const sectionLocked = sortedCapsules.filter(c => !c.isUnlocked && (c.unlockDate - Date.now()) > 7 * 24 * 60 * 60 * 1000);

  const handleToggleSection = (section: Section) => {
    setExpandedSection(expandedSection === section ? 'all' : section);
  };

  return (
    <ProtectedLayout>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📅 Timeline
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            All your capsules in one chronological view
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
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No capsules yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start by writing your first message to your future self.
              </p>
              <Button asChild>
                <Link href="/create">✨ Write a Capsule</Link>
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {/* Search */}
              <input
                type="text"
                placeholder="Search capsules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="date-asc">Sort: Earliest First</option>
                <option value="date-desc">Sort: Latest First</option>
                <option value="mood">Sort: By Mood</option>
              </select>
            </motion.div>

            {/* Unlocked Section */}
            {sectionUnlocked.length > 0 && (
              <TimelineSection
                title="Unlocked Capsules"
                emoji="✅"
                count={sectionUnlocked.length}
                expanded={expandedSection === 'unlocked'}
                onToggle={() => handleToggleSection('unlocked')}
              >
                <div className="space-y-4">
                  {sectionUnlocked.map((capsule, index) => (
                    <TimelineItem key={capsule.id} capsule={capsule} index={index} />
                  ))}
                </div>
              </TimelineSection>
            )}

            {/* Opening Soon Section */}
            {sectionOpeningSoon.length > 0 && (
              <TimelineSection
                title="Opening Soon"
                emoji="⏰"
                count={sectionOpeningSoon.length}
                expanded={expandedSection === 'opening-soon'}
                onToggle={() => handleToggleSection('opening-soon')}
                highlight
              >
                <div className="space-y-4">
                  {sectionOpeningSoon.map((capsule, index) => (
                    <TimelineItem key={capsule.id} capsule={capsule} index={index} />
                  ))}
                </div>
              </TimelineSection>
            )}

            {/* Locked Section */}
            {sectionLocked.length > 0 && (
              <TimelineSection
                title="Locked Capsules"
                emoji="🔒"
                count={sectionLocked.length}
                expanded={expandedSection === 'locked'}
                onToggle={() => handleToggleSection('locked')}
              >
                <div className="space-y-4">
                  {sectionLocked.map((capsule, index) => (
                    <TimelineItem key={capsule.id} capsule={capsule} index={index} />
                  ))}
                </div>
              </TimelineSection>
            )}

            {/* No results message */}
            {sortedCapsules.length === 0 && searchQuery && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-gray-600 dark:text-gray-400">
                  No capsules match "{searchQuery}"
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </ProtectedLayout>
  );
}

interface TimelineSectionProps {
  title: string;
  emoji: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}

function TimelineSection({
  title,
  emoji,
  count,
  expanded,
  onToggle,
  highlight = false,
  children,
}: TimelineSectionProps) {
  const bgColor = highlight
    ? 'bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
    : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 transition-all ${bgColor} text-left font-semibold flex items-center gap-3 group`}
      >
        <span className="text-2xl">{emoji}</span>
        <span className="flex-1 text-gray-900 dark:text-white">
          {title}
          <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
            ({count})
          </span>
        </span>
        <motion.svg
          className="w-5 h-5 text-gray-600 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </motion.svg>
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="pt-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
