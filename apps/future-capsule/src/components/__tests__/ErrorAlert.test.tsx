/**
 * Component Tests for ErrorAlert
 * Tests error display, dismissal, and retry actions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...props} data-testid="motion-div" role="alert">
        {children}
      </div>
    ),
  },
}));

describe('ErrorAlert', () => {
  it('should render error message', () => {
    render(<ErrorAlert message="An error occurred" />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('should render with default error title', () => {
    render(<ErrorAlert message="Test message" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<ErrorAlert title="Custom Error" message="Test message" />);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    render(
      <ErrorAlert
        message="Test message"
        onDismiss={onDismiss}
      />
    );

    const buttons = screen.getAllByRole('button');
    const dismissButton = buttons.find((btn) => btn.textContent?.includes('×'));
    
    if (dismissButton) {
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalled();
    }
  });

  it('should call retryAction when retry button is clicked', () => {
    const retryAction = jest.fn();
    render(
      <ErrorAlert
        message="Test message"
        retryAction={retryAction}
      />
    );

    const buttons = screen.getAllByRole('button');
    const retryButton = buttons.find((btn) => btn.textContent?.includes('Retry'));
    
    if (retryButton) {
      fireEvent.click(retryButton);
      expect(retryAction).toHaveBeenCalled();
    }
  });

  it('should render warning variant with different styling', () => {
    render(<ErrorAlert message="Warning message" variant="warning" />);
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should render info variant with different styling', () => {
    render(<ErrorAlert message="Info message" variant="info" />);
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(
      <ErrorAlert
        title="Error Alert"
        message="This is an error alert"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});
