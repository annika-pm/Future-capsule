'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../shared/Button';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-2xl text-purple-600 dark:text-blue-400">
          <span>📮</span>
          <span>FutureCapsule</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Dashboard
          </Link>
          <Link href="/timeline" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Timeline
          </Link>
          <Link href="/insights" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Insights
          </Link>
          <span className="text-gray-400">|</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </nav>

        {/* Mobile menu button */}
        <div className="sm:hidden flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
