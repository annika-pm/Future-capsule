/**
 * Component Tests for LoginForm
 * Tests form validation, submission, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('next/navigation');
jest.mock('@/components/shared/Button', () => ({
  Button: ({ children, onClick, isLoading, ...props }: any) => (
    <button onClick={onClick} disabled={isLoading} {...props}>
      {children}
    </button>
  ),
}));
jest.mock('@/components/shared/Input', () => ({
  Input: ({ label, value, onChange, placeholder, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  ),
}));

describe('LoginForm', () => {
  let mockLogin: jest.Mock;
  let mockRouter: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogin = jest.fn().mockResolvedValue(undefined);
    mockRouter = jest.fn();

    const useAuthModule = require('@/hooks/useAuth');
    useAuthModule.useAuth = jest.fn(() => ({
      login: mockLogin,
    }));

    const navigationModule = require('next/navigation');
    navigationModule.useRouter = jest.fn(() => ({
      push: mockRouter,
    }));
  });

  it('should render login form with email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display error when email or password is empty', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Email and password are required')
      ).toBeInTheDocument();
    });
  });

  it('should show error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Auth failed'));

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password')
      ).toBeInTheDocument();
    });
  });

  it('should have link to signup page', () => {
    render(<LoginForm />);

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('should disable submit button while loading', async () => {
    mockLogin.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('should call login with correct credentials', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
