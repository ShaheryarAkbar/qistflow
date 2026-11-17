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
import { UserProfile, UserRole } from '@/types';
import { SessionTrackerService } from '@/services/sessionTracker.service';

interface SwitchStaffParam {
  userId?: string;
  uid?: string;
  displayName: string;
  email: string;
  role: UserRole;
  phone?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isDemoUser: boolean;
  enableDemoMode: (role?: UserRole, customStaff?: SwitchStaffParam) => void;
  switchDemoStaff: (staff: SwitchStaffParam) => void;
  currentDemoRole?: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  const [currentDemoRole, setCurrentDemoRole] = useState<UserRole | undefined>(undefined);

  // Sync Firebase Auth state
  useEffect(() => {
    // 1. Check tab-isolated sessionStorage first (allows Tab 1 Manager & Tab 2 Recovery to run concurrently!)
    const tabStored = sessionStorage.getItem('qistflow_demo_user');
    const demoStored = tabStored || localStorage.getItem('qistflow_demo_user');
    if (demoStored) {
      try {
        const parsed = JSON.parse(demoStored);
        setCurrentUser(parsed.user);
        setUserProfile(parsed.profile);
        setIsDemoUser(true);
        if (parsed.role) setCurrentDemoRole(parsed.role);

        // Ensure this tab has its own isolated sessionStorage copy
        if (!tabStored) {
          sessionStorage.setItem('qistflow_demo_user', demoStored);
        }

        // Register this tab session with the real-time session tracker
        SessionTrackerService.registerCurrentTabSession({
          userId: parsed.user?.uid,
          email: parsed.user?.email || '',
          displayName: parsed.user?.displayName || 'Staff Member',
          role: parsed.role || 'owner',
        });

        setLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem('qistflow_demo_user');
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

    // Cleanup tab session on page unload
    const handleUnload = () => {
      SessionTrackerService.unregisterCurrentTabSession();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      unsubscribe();
    };
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
    // Unregister this tab's session
    SessionTrackerService.unregisterCurrentTabSession();

    if (isDemoUser) {
      sessionStorage.removeItem('qistflow_demo_user');
      sessionStorage.removeItem('qistflow_demo_tenant');
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
  const enableDemoMode = (role: UserRole = 'owner', customStaff?: SwitchStaffParam) => {
    const assignedRole = customStaff?.role || role;
    let displayName = customStaff?.displayName;
    let email = customStaff?.email;
    const uid = customStaff?.userId || customStaff?.uid || `demo-${assignedRole}-101`;

    if (!displayName) {
      if (assignedRole === 'owner') displayName = 'Haji Abdul Malik (Owner)';
      else if (assignedRole === 'manager') displayName = 'Tariq Mehmood (Shop Manager)';
      else if (assignedRole === 'accountant') displayName = 'Muhammad Zafar (Accountant)';
      else if (assignedRole === 'recovery') displayName = 'Bilal Ahmed (Field Recovery Officer)';
      else if (assignedRole === 'super_admin') displayName = 'QistFlow Platform Super-Admin';
      else displayName = 'Demo User';
    }

    if (!email) {
      email = `${assignedRole}@qistflow-demo.pk`;
    }

    const demoUser = {
      uid,
      email,
      displayName,
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

    const sessionPayload = JSON.stringify({ user: demoUser, profile: demoProfile, role: assignedRole });

    // Tab-isolated storage: This tab gets its own identity so Manager in Tab 1 and Recovery in Tab 2 run in parallel!
    sessionStorage.setItem('qistflow_demo_user', sessionPayload);
    localStorage.setItem('qistflow_demo_user', sessionPayload);

    // Register active concurrent session in the tracker
    SessionTrackerService.registerCurrentTabSession({
      userId: demoUser.uid,
      email: demoUser.email,
      displayName: demoUser.displayName,
      role: assignedRole,
    });

    setCurrentUser(demoUser);
    setUserProfile(demoProfile);
    setCurrentDemoRole(assignedRole);
    setIsDemoUser(true);
    setLoading(false);
  };

  const switchDemoStaff = (staff: SwitchStaffParam) => {
    enableDemoMode(staff.role, staff);
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
        switchDemoStaff,
        currentDemoRole,
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

