'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '../../components/layout/Header';
import { ProtectedLayout } from '../../components/layout/ProtectedLayout';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { CardSkeleton } from '../../components/shared/Loading';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { CapsuleCard } from '../../components/capsule/CapsuleCard';
import { MapView } from '../../components/map/MapView';
import { useCapsules } from '../../hooks/useCapsules';
import type { Capsule, CapsuleListItem } from '../../types/capsule';
import { capsuleClient } from '../../lib/api/capsule-client';
import { categorizeCapsules } from '../../lib/utils';
import { ConfirmModal } from '../../components/shared/Modal';

type Filter = 'all' | 'locked' | 'opening-soon' | 'opened';

export default function DashboardPage() {
  const { capsules, isLoading, error, refetch } = useCapsules();
  const [filter, setFilter] = useState<Filter>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categorized = categorizeCapsules(capsules);

  let filteredCapsules = capsules;
  switch (filter) {
    case 'locked':
      filteredCapsules = categorized.locked;
      break;
    case 'opening-soon':
      filteredCapsules = categorized.openingSoon;
      break;
    case 'opened':
      filteredCapsules = categorized.opened;
      break;
    case 'all':
    default:
      filteredCapsules = capsules;
  }

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await capsuleClient.deleteCapsule(deleteId);
      setDeleteId(null);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete capsule';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedLayout>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section with Gradient Background */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl p-8 sm:p-10 border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                Your Time Capsules
              </h1>
              <p className="text-lg text-slate-300 mb-2">
                {capsules.length} {capsules.length === 1 ? 'capsule' : 'capsules'} created
              </p>
              <p className="text-sm text-slate-400 max-w-lg">
                Messages from your past waiting to inspire your future. Create new moments to cherish later.
              </p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-2xl hover:shadow-blue-500/50 border-0">
              <Link href="/create">✨ New Capsule</Link>
            </Button>
          </div>
        </motion.div>

        {/* Map Section */}
        {capsules.some(capsule => (capsule as any).latitude && (capsule as any).longitude) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📍 Memory Map
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                See where your time capsule memories were created
              </p>
              <MapView
                locations={capsules
                  .filter(capsule => (capsule as any).latitude && (capsule as any).longitude)
                  .map(capsule => ({
                    id: capsule.id,
                    latitude: (capsule as any).latitude,
                    longitude: (capsule as any).longitude,
                    title: capsule.title,
                    unlockDate: capsule.unlockDate,
                    mood: capsule.mood,
                  }))}
                className="rounded-lg overflow-hidden"
              />
            </Card>
          </motion.div>
        )}

        {/* Filter Tabs */}
        {capsules.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
          >
            {[
              { key: 'all', label: 'All', count: capsules.length },
              { key: 'locked', label: 'Locked', count: categorized.locked.length },
              { key: 'opening-soon', label: 'Opening Soon', count: categorized.openingSoon.length },
              { key: 'opened', label: 'Opened', count: categorized.opened.length },
            ].map(({ key, label, count }) => (
              <motion.button
                key={key}
                onClick={() => setFilter(key as Filter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 font-semibold rounded-lg transition-all whitespace-nowrap ${
                  filter === key
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {label}
                <span className="ml-2 text-sm opacity-70">({count})</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <ErrorAlert
              title="Failed to Load Capsules"
              message={error}
              onDismiss={() => refetch()}
              retryAction={() => refetch()}
              variant="error"
            />
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCapsules.length === 0 ? (
          <EmptyState
            icon={filter === 'all' ? '📭' : '🔍'}
            title={filter === 'all' ? 'No capsules yet' : `No ${filter === 'opening-soon' ? 'opening soon' : filter} capsules`}
            description={
              filter === 'all'
                ? 'Write your first message to your future self and seal it in time!'
                : `No ${filter === 'opening-soon' ? 'opening soon' : filter} capsules found. Try changing the filter.`
            }
            action={{
              label: 'Create Your First Capsule',
              href: '/create',
            }}
            secondaryAction={
              filter !== 'all'
                ? {
                    label: 'View All Capsules',
                    onClick: () => setFilter('all'),
                  }
                : undefined
            }
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCapsules.map((capsule) => {
              const listItem: CapsuleListItem = {
                id: capsule.id,
                title: capsule.title,
                description: capsule.description,
                unlockDate: capsule.unlockDate,
                createdAt: capsule.createdAt || new Date(),
                userId: capsule.userId || '',
                updatedAt: capsule.updatedAt || new Date(),
                status: capsule.status,
              };
              return (
                <CapsuleCard
                  key={capsule.id}
                  capsule={listItem}
                  onDelete={() => setDeleteId(capsule.id)}
                />
              );
            })}
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Capsule"
        message="Are you sure you want to delete this capsule? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteId(null);
          setDeleteError(null);
        }}
        variant="danger"
      />

      {/* Delete Error Alert */}
      {deleteError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 max-w-md"
        >
          <ErrorAlert
            title="Delete Failed"
            message={deleteError}
            onDismiss={() => setDeleteError(null)}
            variant="error"
          />
        </motion.div>
      )}
    </ProtectedLayout>
  );
}
