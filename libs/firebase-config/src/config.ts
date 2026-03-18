/**
 * Firebase Configuration for FutureCapsule
 * 
 * This file provides a centralized configuration for Firebase and Firestore
 * with support for multiple environments (development, staging, production).
 * 
 * Environment variables should be set in .env.local (dev) or Vercel environment
 * variables (production).
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Load Firebase configuration from environment variables
 * Returns a validated config object ready for initialization
 */
export function getFirebaseConfig(): FirebaseConfig {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.local or Vercel environment configuration.`
    );
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

/**
 * Get environment-specific configuration
 * Allows for different Firestore database IDs in production vs staging
 */
export function getFirebaseEnvironment(): {
  isDevelopment: boolean;
  isProduction: boolean;
  environment: 'development' | 'staging' | 'production';
  firestoreDatabaseId?: string;
} {
  const environment = (process.env.NEXT_PUBLIC_ENVIRONMENT || 'development') as
    | 'development'
    | 'staging'
    | 'production';

  return {
    isDevelopment: environment === 'development',
    isProduction: environment === 'production',
    environment,
    firestoreDatabaseId: process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID,
  };
}

/**
 * Firebase initialization options
 * Can be extended with additional settings like Analytics, Performance Monitoring
 */
export const firebaseInitOptions = {
  // Use app check token for production environments
  appCheck: {
    isTokenAutoRefreshEnabled: true,
  },
  // Configure debug mode for development
  debug: process.env.NEXT_PUBLIC_ENVIRONMENT === 'development',
};

/**
 * Emulator configuration for local development
 * Uses localhost:4000 (Firestore), localhost:9099 (Auth)
 * Set NEXT_PUBLIC_USE_EMULATOR=true to enable
 */
export const emulatorConfig = {
  enabled: process.env.NEXT_PUBLIC_USE_EMULATOR === 'true',
  firestorePort: 8080,
  authPort: 9099,
  storageBucket: 'localhost:4000',
};
