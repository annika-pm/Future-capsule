'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { exifr } from 'exifr';
import { Button } from '../shared/Button';
import { Input, Textarea } from '../shared/Input';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { ErrorAlert } from '../shared/ErrorAlert';
import { MOOD_LABELS, MOOD_EMOJIS, Mood, CreateCapsuleInput } from '../../types/capsule';
import { capsuleClient } from '../../lib/api/capsule-client';
import { calculateCountdown, formatCountdown } from '../../lib/utils';

const MOODS: Mood[] = ['Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful'];

interface CapsuleFormProps {
  onSuccess?: () => void;
}

export function CapsuleForm({ onSuccess }: CapsuleFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mood, setMood] = useState<Mood>('Hopeful');
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockTime, setUnlockTime] = useState('00:00');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCoordinates, setPhotoCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculated values
  const countdown = unlockDate ? calculateCountdown(getUnlockTimestamp()) : null;
  const countdownText = countdown && !countdown.isUnlocked ? formatCountdown(countdown) : null;

  function getUnlockTimestamp(): number {
    if (!unlockDate) return 0;
    const [year, month, day] = unlockDate.split('-').map(Number);
    const [hours, minutes] = unlockTime.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes).getTime();
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.length > 50000) {
      newErrors.message = 'Message must be 50,000 characters or less';
    }

    if (!unlockDate) {
      newErrors.unlockDate = 'Unlock date is required';
    } else {
      const unlockTs = getUnlockTimestamp();
      if (unlockTs <= Date.now()) {
        newErrors.unlockDate = 'Unlock date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      setErrors((prev) => ({
        ...prev,
        photo: 'File size must be less than 5MB',
      }));
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Only JPEG, PNG, WebP, and GIF images are supported',
      }));
      return;
    }

    setPhotoFile(file);
    setErrors((prev) => {
      const { photo: _, ...rest } = prev;
      return rest;
    });

    // Extract EXIF GPS data
    try {
      const exifData = await exifr.parse(file, { gps: true });
      if (exifData?.latitude && exifData?.longitude) {
        setPhotoCoordinates({
          latitude: exifData.latitude,
          longitude: exifData.longitude,
        });
      } else {
        setPhotoCoordinates(null);
      }
    } catch (error) {
      // EXIF extraction failed, continue without coordinates
      console.warn('Failed to extract EXIF data:', error);
      setPhotoCoordinates(null);
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let photoURL: string | undefined;

      // Upload photo if provided
      if (photoFile) {
        photoURL = await capsuleClient.uploadPhotoURL(photoFile);
      }

      // Create capsule
      const input: CreateCapsuleInput = {
        title: title.trim(),
        message: message.trim(),
        mood,
        unlockDate: getUnlockTimestamp(),
        photoURL,
      };

      await capsuleClient.createCapsule(input, photoCoordinates);

      setSuccessMessage('Capsule created successfully! 🎉');

      // Reset form
      setTitle('');
      setMessage('');
      setMood('Hopeful');
      setUnlockDate('');
      setUnlockTime('00:00');
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoCoordinates(null);

      // Redirect after 1 second
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard');
        }
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create capsule';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Write a Message to Your Future Self
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Seal this moment in time and revisit it when you're ready.
        </p>
      </motion.div>

      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError('')}
          retryAction={() => setError('')}
        />
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p className="text-green-700 dark:text-green-400 font-medium">{successMessage}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Input
            label="Message Title"
            placeholder="e.g., My goals for 2025"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            maxLength={255}
            error={errors.title}
            helperText={`${title.length}/255 characters`}
          />
        </motion.div>

        {/* Message */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Textarea
            label="Your Message"
            placeholder="Write your thoughts, dreams, and plans here..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
            }}
            rows={8}
            maxLength={50000}
            error={errors.message}
            helperText={`${message.length}/50,000 characters`}
            className="resize-none"
          />
        </motion.div>

        {/* Mood Selector */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            How are you feeling? <span className="text-xl ml-2">{MOOD_EMOJIS[mood]}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOODS.map((m) => (
              <motion.button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mood === m
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/40 ring-2 ring-purple-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-400'
                }`}
              >
                <p className="text-3xl mb-2">{MOOD_EMOJIS[m]}</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {MOOD_LABELS[m]}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Photo Upload */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Photo (Optional)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          {photoPreview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Remove Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-400 dark:hover:border-purple-400 transition-colors"
            >
              <div className="text-4xl mb-3">📸</div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Drag and drop your photo here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to browse (Max 5MB)
              </p>
            </motion.button>
          )}

          {errors.photo && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.photo}</p>
          )}
        </motion.div>

        {/* Unlock Date & Time */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            When should this open?
          </label>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Unlock Date"
              type="date"
              value={unlockDate}
              onChange={(e) => {
                setUnlockDate(e.target.value);
                if (errors.unlockDate) setErrors((prev) => ({ ...prev, unlockDate: '' }));
              }}
              error={errors.unlockDate ? '' : undefined}
            />
            <Input
              label="Unlock Time"
              type="time"
              value={unlockTime}
              onChange={(e) => setUnlockTime(e.target.value)}
            />
          </div>

          {/* Countdown Preview */}
          {countdownText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <span className="text-lg">⏰</span>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {countdownText}
              </span>
            </motion.div>
          )}

          {errors.unlockDate && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.unlockDate}</p>
          )}
        </motion.div>

        {/* Form Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            className="flex-1"
            size="lg"
          >
            Create Capsule ✨
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            size="lg"
          >
            Cancel
          </Button>
        </motion.div>
      </form>
    </Card>
  );
}
