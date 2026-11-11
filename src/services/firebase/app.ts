// ============================================================================
// Firebase Client Initialization (Strictly Spark / Free Tier Compatible)
// Note: Config values are public web client credentials. Security is strictly
// enforced via Firebase Authentication & Cloud Firestore Security Rules.
// ============================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-qistflow-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'qistflow-free.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'qistflow-free',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'qistflow-free.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

// Initialize or reuse existing app
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Initialize Firestore with multi-tab offline persistence enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Connect to local emulators if running in local emulator mode
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('[Firebase] Connected to local Firebase Emulators (Auth 9099, Firestore 8080)');
  } catch (err) {
    // Already connected
  }
}
