// ============================================================================
// Auth Context: Firebase Authentication & Global Profile State
// ============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/services/firebase/app';
import { UserProfile } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isDemoUser: boolean;
  enableDemoMode: (role?: 'owner' | 'manager' | 'accountant' | 'recovery') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Sync Firebase Auth state
  useEffect(() => {
    // Check if demo user was saved
    const demoStored = localStorage.getItem('qistflow_demo_user');
    if (demoStored) {
      try {
        const parsed = JSON.parse(demoStored);
        setCurrentUser(parsed.user);
        setUserProfile(parsed.profile);
        setIsDemoUser(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('qistflow_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // Create initial profile if first login
            const initialProfile: UserProfile = {
              userId: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              emailVerified: user.emailVerified,
              preferredLanguage: 'en',
              accountStatus: 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.warn('[Auth] Could not fetch user profile from Firestore:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, displayName: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const initialProfile: UserProfile = {
        userId: cred.user.uid,
        displayName,
        email,
        emailVerified: cred.user.emailVerified,
        preferredLanguage: 'en',
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), initialProfile);
      setUserProfile(initialProfile);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isDemoUser) {
      localStorage.removeItem('qistflow_demo_user');
      localStorage.removeItem('qistflow_demo_tenant');
      setIsDemoUser(false);
      setCurrentUser(null);
      setUserProfile(null);
      return;
    }
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Immediate 1-click Demo Mode for instant local testing without Firebase setup
  const enableDemoMode = (role: 'owner' | 'manager' | 'accountant' | 'recovery' = 'owner') => {
    const demoUser = {
      uid: `demo-${role}-101`,
      email: `${role}@qistflow-demo.pk`,
      displayName: role === 'owner' ? 'Haji Abdul Malik (Owner)' : `Staff Member (${role})`,
      emailVerified: true,
    } as any;

    const demoProfile: UserProfile = {
      userId: demoUser.uid,
      displayName: demoUser.displayName,
      email: demoUser.email,
      emailVerified: true,
      preferredLanguage: 'ur',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      'qistflow_demo_user',
      JSON.stringify({ user: demoUser, profile: demoProfile })
    );

    setCurrentUser(demoUser);
    setUserProfile(demoProfile);
    setIsDemoUser(true);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signIn,
        signUp,
        logout,
        resetPassword,
        isDemoUser,
        enableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
