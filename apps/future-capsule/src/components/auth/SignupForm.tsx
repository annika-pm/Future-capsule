'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';

function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 'medium';
  return 'strong';
}

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }[passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signup(email, password);
      router.push('/dashboard');
    } catch {
      setError('Signup failed. Please check your email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <div>
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {password && (
          <div className="mt-2">
            <div className="flex gap-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex-1 transition-colors ${
                    i < (passwordStrength === 'weak' ? 1 : passwordStrength === 'medium' ? 2 : 3)
                      ? strengthColor
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Strength: <span className="capitalize font-medium">{passwordStrength}</span>
            </p>
          </div>
        )}
      </div>

      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
        error={password && confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
      />

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">{error}</div>}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Create Account
      </Button>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-purple-600 hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </form>
  );
}
