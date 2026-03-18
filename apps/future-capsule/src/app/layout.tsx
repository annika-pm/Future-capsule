import './global.css';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorSuppressor } from '../components/providers/ErrorSuppressor';

export const metadata = {
  title: 'FutureCapsule - Letter to Your Future Self',
  description: 'Write a message to your future self and unlock it whenever you want.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ErrorSuppressor />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
