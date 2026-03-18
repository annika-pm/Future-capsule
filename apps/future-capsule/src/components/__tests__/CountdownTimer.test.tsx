/**
 * Component Tests for CountdownTimer
 * Tests timer accuracy, display format, and color changes
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CountdownTimer } from '@/components/capsule/CountdownTimer';
import { CountdownTime } from '@/lib/utils';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, initial, ...props }: any) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

describe('CountdownTimer', () => {
  const mockCountdown: CountdownTime = {
    years: 0,
    months: 0,
    days: 3,
    hours: 5,
    minutes: 30,
    seconds: 15,
    totalSeconds: 280215,
    isUnlocked: false,
  };

  it('should render countdown display', () => {
    render(<CountdownTimer countdown={mockCountdown} />);

    const container = screen.getByTestId('motion-div');
    expect(container).toBeInTheDocument();
  });

  it('should display correct countdown values in text', () => {
    const { container } = render(
      <CountdownTimer countdown={mockCountdown} />
    );

    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('30');
  });

  it('should handle unlocked state correctly', () => {
    const unlockedCountdown: CountdownTime = {
      ...mockCountdown,
      isUnlocked: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    const { container } = render(
      <CountdownTimer countdown={unlockedCountdown} />
    );

    expect(container.textContent).toContain('Unlocked');
  });

  it('should support compact mode', () => {
    const { container } = render(
      <CountdownTimer countdown={mockCountdown} compact={true} />
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
    expect(container.querySelector('[data-compact="true"]')).toBeInTheDocument();
  });

  it('should render progress bar when enabled', () => {
    const unlockedDate = Date.now() + 280215000;
    const { container } = render(
      <CountdownTimer
        countdown={mockCountdown}
        showProgressBar={true}
        unlockDate={unlockedDate}
      />
    );

    const progressBar = container.querySelector('[data-testid="progress-bar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle large countdown values', () => {
    const largeCountdown: CountdownTime = {
      years: 1,
      months: 6,
      days: 15,
      hours: 12,
      minutes: 45,
      seconds: 30,
      totalSeconds: 50000000,
      isUnlocked: false,
    };

    const { container } = render(
      <CountdownTimer countdown={largeCountdown} />
    );

    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('6');
    expect(container.textContent).toContain('15');
  });

  it('should handle zero countdown', () => {
    const zeroCountdown: CountdownTime = {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isUnlocked: true,
    };

    const { container } = render(
      <CountdownTimer countdown={zeroCountdown} />
    );

    expect(container.textContent).toContain('Unlocked');
  });

  it('should update when countdown prop changes', async () => {
    const { rerender } = render(
      <CountdownTimer countdown={mockCountdown} />
    );

    const updatedCountdown: CountdownTime = {
      ...mockCountdown,
      days: 2,
      hours: 4,
    };

    rerender(<CountdownTimer countdown={updatedCountdown} />);

    await waitFor(() => {
      const container = screen.getByTestId('motion-div');
      expect(container.textContent).toContain('2');
      expect(container.textContent).toContain('4');
    });
  });
});
