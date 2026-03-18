'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/shared/Loading';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Dot Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900"></div>
        
        {/* Animated dot pattern */}
        <div className="absolute inset-0 opacity-40">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="40" y="40" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="rgba(59, 130, 246, 0.6)"></circle>
                <circle cx="50" cy="50" r="2" fill="rgba(59, 130, 246, 0.4)"></circle>
                <circle cx="70" cy="10" r="1.5" fill="rgba(139, 92, 246, 0.5)"></circle>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"></rect>
          </svg>
        </div>

        {/* Bottom blue gradient glow */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-blue-600 via-blue-600/50 to-transparent opacity-30 blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ✨ Future Capsule
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <button className="px-6 py-2 text-slate-300 hover:text-white transition">Login</button>
            </Link>
            <Link href="/signup">
              <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content - Relative positioned */}
      <div className="relative z-10">
        {/* Hero Section */}
        <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl"
          >
            <div className="mb-6 inline-block">
              <span className="px-4 py-2 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-300 text-sm font-medium">
                ⏰ MESSAGE FROM YOUR FUTURE
              </span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
              Write to Your{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Future Self
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              Create digital time capsules, write your thoughts, capture your emotions, and open them when the time comes. Discover who you were and celebrate who you've become.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/signup">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition transform hover:scale-105">
                  Get Started Free
                </button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 border border-slate-600 text-white rounded-lg font-semibold hover:bg-slate-800/50 transition">
                  Sign In
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl pb-20"
        >
          {[
            {
              icon: '📝',
              title: 'Write Freely',
              description: 'Express your thoughts, emotions, and hopes without any limits.',
            },
            {
              icon: '🔒',
              title: 'Secure & Private',
              description: 'Your capsules are encrypted and visible only to you.',
            },
            {
              icon: '⏰',
              title: 'Perfect Timing',
              description: 'Set your unlock date and rediscover your past at the right moment.',
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition group cursor-pointer"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
        </main>
      </div>
    </div>
  );
}
