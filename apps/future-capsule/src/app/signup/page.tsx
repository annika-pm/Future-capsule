'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { diagnosticsSupabaseConnection } from '@/lib/supabase-diagnostics';

export default function SignupPage() {
  const router = useRouter();
  const { signup, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string>('');

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !displayName) {
      setError('All fields are required');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleDiagnostics = async () => {
    try {
      const report = await diagnosticsSupabaseConnection();
      setDiagnosticInfo(JSON.stringify(report, null, 2));
    } catch (err) {
      setDiagnosticInfo(`Diagnostic failed: ${err}`);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDiagnosticInfo('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await signup(email, password, displayName);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setDiagnosticInfo('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-black to-purple-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 dark:text-blue-400 mb-2">📮 FutureCapsule</h1>
          <p className="text-gray-600 dark:text-gray-400">Write to your future self</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create an account</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Start writing letters to your future self</p>

          {error && (
            <div>
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded whitespace-pre-wrap text-sm">
                {error}
              </div>
              {error.toLowerCase().includes('network') ||
              error.toLowerCase().includes('failed to fetch') ? (
                <button
                  type="button"
                  onClick={handleDiagnostics}
                  className="mb-4 w-full px-3 py-2 text-sm bg-blue-100 border border-blue-400 text-blue-700 rounded hover:bg-blue-50"
                >
                  🔍 Check Connection
                </button>
              ) : null}
            </div>
          )}

          {diagnosticInfo && (
            <div className="mb-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-3 rounded max-h-48 overflow-y-auto">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {diagnosticInfo}
              </p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              type="text"
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              required
            />

            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" isLoading={isLoading} className="w-full">
              Create Account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            >
              Sign Up with Google
            </button>
          </div>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="text-purple-600 dark:text-blue-400 hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
