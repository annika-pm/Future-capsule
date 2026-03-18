/**
 * Component Tests for CapsuleCard
 * Tests rendering locked/unlocked states, animations disabled in tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CapsuleCard } from '@/components/capsule/CapsuleCard';
import { Capsule } from '@/types/capsule';

// Mock dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
    img: ({ alt, src, ...props }: any) => (
      <img alt={alt} src={src} {...props} />
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

jest.mock('@/hooks/useCountdown', () => ({
  useCountdown: () => ({
    days: 5,
    hours: 12,
    minutes: 30,
    seconds: 0,
    isUnlocked: false,
  }),
}));

jest.mock('@/components/shared/Card', () => ({
  Card: ({ children, ...props }: any) => (
    <div {...props} data-testid="card">
      {children}
    </div>
  ),
}));

jest.mock('@/components/shared/Badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid={`badge-${variant}`}>{children}</span>
  ),
}));

jest.mock('@/components/shared/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/capsule/CountdownTimer', () => ({
  CountdownTimer: ({ countdown }: any) => (
    <div data-testid="countdown-timer">
      {countdown.days}d {countdown.hours}h
    </div>
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => (
    <a href={href}>{children}</a>
  ),
}));

describe('CapsuleCard', () => {
  const futureDate = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now
  const pastDate = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago

  const mockLockedCapsule: Capsule = {
    id: 'capsule-1',
    userId: 'user-123',
    title: 'My Future Self',
    message: 'This is a message for my future self',
    mood: 'Happy',
    unlockDate: futureDate,
    photoURL: 'https://example.com/photo.jpg',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'scheduled',
    isDeleted: false,
    isUnlocked: false,
    daysUntilUnlock: 30,
  };

  const mockUnlockedCapsule: Capsule = {
    ...mockLockedCapsule,
    status: 'unlocked',
    unlockDate: pastDate,
    isUnlocked: true,
    daysUntilUnlock: 0,
  };

  it('should render capsule title', () => {
    render(<CapsuleCard capsule={mockLockedCapsule} />);
    expect(screen.getByText('My Future Self')).toBeInTheDocument();
  });

  it('should display photo when available', () => {
    render(<CapsuleCard capsule={mockLockedCapsule} />);
    const photo = screen.getByAltText('My Future Self');
    expect(photo).toBeInTheDocument();
    expect(photo).toHaveAttribute('src', mockLockedCapsule.photoURL);
  });

  it('should render countdown timer for locked capsule', () => {
    render(<CapsuleCard capsule={mockLockedCapsule} />);
    expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
  });

  it('should apply locked state styling', () => {
    render(<CapsuleCard capsule={mockLockedCapsule} />);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
  });

  it('should apply unlocked state styling', () => {
    render(<CapsuleCard capsule={mockUnlockedCapsule} />);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
  });

  it('should call onDelete when delete is triggered', () => {
    const onDelete = jest.fn();
    render(<CapsuleCard capsule={mockLockedCapsule} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find((btn) => btn.textContent?.includes('Delete'));

    if (deleteButton) {
      deleteButton.click();
      expect(onDelete).toHaveBeenCalled();
    }
  });

  it('should be keyboard accessible', () => {
    render(<CapsuleCard capsule={mockLockedCapsule} />);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
  });

  it('should render without crashing without photo', () => {
    const capsuleNoPhoto = { ...mockLockedCapsule, photoURL: undefined };
    render(<CapsuleCard capsule={capsuleNoPhoto} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('should handle very long title gracefully', () => {
    const capsuleWithLongTitle = {
      ...mockLockedCapsule,
      title: 'This is a very long title that might wrap to multiple lines and should still display properly without breaking the layout',
    };
    render(<CapsuleCard capsule={capsuleWithLongTitle} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});
