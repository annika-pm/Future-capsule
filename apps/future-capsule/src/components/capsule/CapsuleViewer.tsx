'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCapsule } from '../../hooks/useCapsules';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { LoadingSpinner, Skeleton } from '../shared/Loading';
import { ConfirmModal } from '../shared/Modal';
import { CountdownTimer } from './CountdownTimer';
import { useCountdown } from '../../hooks/useCountdown';
import { capsuleClient } from '../../lib/api/capsule-client';
import { formatDateTime, MOOD_EMOJIS } from '../../lib/utils';
import { useRouter } from 'next/navigation';

interface CapsuleViewerProps {
  id: string;
}

export function CapsuleViewer({ id }: CapsuleViewerProps) {
  const router = useRouter();
  const { capsule, isLoading, error } = useCapsule(id);
  const countdown = useCountdown(capsule?.unlock_date ? new Date(capsule.unlock_date).getTime() : null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await capsuleClient.deleteCapsule(id);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete capsule';
      console.error('Failed to delete capsule', message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !capsule) {
    return (
      <Card className="p-8 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Capsule Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This capsule could not be found.'}</p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </Card>
    );
  }

  const isUnlocked = capsule ? !capsule.isLocked : false;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Photo */}
        {capsule?.photo_url && (
          <Card className="mb-6 overflow-hidden">
            <div className="relative w-full h-80 bg-gray-200 dark:bg-gray-700">
              <img
                src={capsule.photo_url}
                alt={capsule.title}
                className={`w-full h-full object-cover ${!isUnlocked && 'blur-xl'}`}
              />
            </div>
          </Card>
        )}

        <Card className="p-8 mb-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{capsule?.title}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Created {capsule?.created_at && formatDateTime(capsule.created_at)}
              </p>
            </div>
            <span className="text-5xl flex-shrink-0">{capsule && MOOD_EMOJIS[capsule.mood as keyof typeof MOOD_EMOJIS]}</span>
          </div>

          {/* Mood */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              You wrote this when you felt...
            </p>
            <Badge variant="default" size="md">
              {capsule?.mood}
            </Badge>
          </div>

          {/* Locked State - Show countdown if not unlocked */}
          {!isUnlocked && countdown && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-8 text-center mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Your message is waiting in the future...
              </h2>
              <CountdownTimer countdown={countdown} />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 max-w-md mx-auto">
                Come back on this date to unlock and read your message.
              </p>
            </motion.div>
          )}

          {/* Message Content - Always display */}
          <div className="mb-6">
            <div className={`prose dark:prose-invert max-w-none ${!isUnlocked ? 'opacity-50' : ''}`}>
              <div className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                {capsule?.message || 'No message content'}
              </div>
            </div>
          </div>

          {/* Unlocked State Indicator */}
          {isUnlocked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center mt-6"
            >
              <p className="text-green-700 dark:text-green-400 font-semibold">🎉 Unlocked! Read your message above.</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-wrap">
            <Button asChild variant="primary">
              <Link href="/create">Write Another Capsule</Link>
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
            <Button asChild variant="ghost" className="ml-auto">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Capsule"
        message="Are you sure you want to delete this capsule? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
