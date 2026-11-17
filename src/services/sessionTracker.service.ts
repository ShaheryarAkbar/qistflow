// ============================================================================
// Real-Time Concurrent Session Tracking Service
// Tracks active device logins across multiple tabs & field mobile devices
// ============================================================================

import { UserRole } from '@/types';

export interface ActiveSessionRecord {
  sessionId: string;
  userId: string;
  userEmail: string;
  displayName: string;
  role: UserRole;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  loginTime: string;
  lastActive: string;
  isCurrentTab?: boolean;
}

const SESSIONS_STORAGE_KEY = 'qistflow_active_sessions';
const TAB_SESSION_ID_KEY = 'qistflow_tab_session_id';

// Default seeded sessions to demonstrate realistic field concurrent device logins
const SEED_ACTIVE_SESSIONS: ActiveSessionRecord[] = [
  {
    sessionId: 'sess_seed_kamran_01',
    userId: 'demo-recovery-101',
    userEmail: 'kamran.recovery@qistflow-demo.pk',
    displayName: 'Kamran Ali',
    role: 'recovery',
    deviceType: 'mobile',
    deviceName: 'Infinix Hot 12 (Field Phone)',
    browser: 'Chrome Mobile 123',
    ipAddress: '182.185.45.12',
    location: 'Rahim Yar Khan (Zone A)',
    loginTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastActive: new Date(Date.now() - 60000 * 4).toISOString(),
  },
  {
    sessionId: 'sess_seed_kamran_02',
    userId: 'demo-recovery-101',
    userEmail: 'kamran.recovery@qistflow-demo.pk',
    displayName: 'Kamran Ali',
    role: 'recovery',
    deviceType: 'tablet',
    deviceName: 'Samsung Galaxy Tab A8 (Shop Backup)',
    browser: 'Samsung Internet 24',
    ipAddress: '182.185.45.18',
    location: 'Rahim Yar Khan (Shahi Road)',
    loginTime: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastActive: new Date(Date.now() - 60000 * 15).toISOString(),
  },
  {
    sessionId: 'sess_seed_bilal_01',
    userId: 'demo-recovery-102',
    userEmail: 'bilal.recovery@qistflow-demo.pk',
    displayName: 'Bilal Ahmed',
    role: 'recovery',
    deviceType: 'mobile',
    deviceName: 'Vivo Y20 (Field Mobile)',
    browser: 'Chrome Mobile 122',
    ipAddress: '182.185.90.34',
    location: 'Khanpur Road (Zone B)',
    loginTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastActive: new Date(Date.now() - 60000 * 8).toISOString(),
  },
  {
    sessionId: 'sess_seed_tariq_rec_01',
    userId: 'demo-recovery-103',
    userEmail: 'tariq.recovery@qistflow-demo.pk',
    displayName: 'Tariq Mehmood',
    role: 'recovery',
    deviceType: 'mobile',
    deviceName: 'Redmi Note 11 (Primary Mobile)',
    browser: 'Chrome Mobile 124',
    ipAddress: '182.185.11.87',
    location: 'Sadiqabad Bypass (Zone C)',
    loginTime: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastActive: new Date(Date.now() - 60000 * 2).toISOString(),
  },
  {
    sessionId: 'sess_seed_accountant_01',
    userId: 'demo-accountant-01',
    userEmail: 'accountant@qistflow-demo.pk',
    displayName: 'Rashid Mehmood',
    role: 'accountant',
    deviceType: 'desktop',
    deviceName: 'Dell OptiPlex (Accounts Terminal)',
    browser: 'Microsoft Edge 123',
    ipAddress: '192.168.1.104 (Local LAN)',
    location: 'Main Branch RYK',
    loginTime: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastActive: new Date(Date.now() - 60000 * 1).toISOString(),
  },
  {
    sessionId: 'sess_seed_manager_01',
    userId: 'demo-manager-01',
    userEmail: 'manager@qistflow-demo.pk',
    displayName: 'Muhammad Tariq',
    role: 'manager',
    deviceType: 'desktop',
    deviceName: 'HP ProBook (Manager Laptop)',
    browser: 'Chrome 124',
    ipAddress: '192.168.1.102 (Local LAN)',
    location: 'Main Branch RYK',
    loginTime: new Date(Date.now() - 3600000 * 6).toISOString(),
    lastActive: new Date(Date.now() - 60000 * 3).toISOString(),
  },
];

export const SessionTrackerService = {
  /**
   * Get all registered active sessions across all devices
   */
  getAllSessions(): ActiveSessionRecord[] {
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(SEED_ACTIVE_SESSIONS));
        return SEED_ACTIVE_SESSIONS;
      }
      const parsed: ActiveSessionRecord[] = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(SEED_ACTIVE_SESSIONS));
        return SEED_ACTIVE_SESSIONS;
      }
      return parsed;
    } catch (e) {
      return SEED_ACTIVE_SESSIONS;
    }
  },

  /**
   * Save sessions list to persistent storage and notify other tabs
   */
  saveSessions(sessions: ActiveSessionRecord[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }
    // Dispatch a storage event on the current window so local listeners update immediately
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new Event('qistflow_sessions_updated'));
      } catch (e) {}
    }
  },

  /**
   * Get sessions for a specific user ID
   */
  getUserSessions(userId: string): ActiveSessionRecord[] {
    const all = this.getAllSessions();
    const currentTabSessionId = this.getCurrentTabSessionId();
    return all
      .filter((s) => s.userId === userId)
      .map((s) => ({
        ...s,
        isCurrentTab: s.sessionId === currentTabSessionId,
      }));
  },

  /**
   * Get the count of concurrent active sessions for a staff user
   */
  getUserSessionCount(userId: string): number {
    return this.getUserSessions(userId).length;
  },

  /**
   * Returns current tab's unique session ID from sessionStorage
   */
  getCurrentTabSessionId(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(TAB_SESSION_ID_KEY);
    }
    return null;
  },

  /**
   * Registers this specific browser tab as an active session for the authenticated user
   */
  registerCurrentTabSession(user: {
    userId?: string;
    uid?: string;
    email: string;
    displayName: string;
    role: UserRole;
  }): string {
    const userId = user.userId || user.uid || `user_${user.role}`;
    let sessionId: string | null = null;
    if (typeof sessionStorage !== 'undefined') {
      sessionId = sessionStorage.getItem(TAB_SESSION_ID_KEY);
    }
    if (!sessionId) {
      sessionId = `sess_tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(TAB_SESSION_ID_KEY, sessionId);
      }
    }

    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 768;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Chrome';
    let browser = 'Browser';
    if (userAgent.includes('Chrome')) browser = isMobileViewport ? 'Chrome Mobile' : 'Chrome Web';
    else if (userAgent.includes('Safari')) browser = isMobileViewport ? 'Safari Mobile' : 'Safari Web';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    const deviceType: 'mobile' | 'tablet' | 'desktop' = isMobileViewport
      ? 'mobile'
      : typeof window !== 'undefined' && window.innerWidth <= 1024
      ? 'tablet'
      : 'desktop';

    const deviceName = isMobileViewport
      ? 'Mobile Device (Active Browser)'
      : 'Workstation Terminal (Tab Session)';

    const currentSessions = this.getAllSessions();
    const existingIndex = currentSessions.findIndex((s) => s.sessionId === sessionId);

    const sessionRecord: ActiveSessionRecord = {
      sessionId,
      userId,
      userEmail: user.email,
      displayName: user.displayName,
      role: user.role,
      deviceType,
      deviceName,
      browser,
      ipAddress: '182.185.14.92 (Local IP)',
      location: 'Rahim Yar Khan, Punjab',
      loginTime: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isCurrentTab: true,
    };

    let updated: ActiveSessionRecord[];
    if (existingIndex >= 0) {
      updated = [...currentSessions];
      updated[existingIndex] = sessionRecord;
    } else {
      updated = [sessionRecord, ...currentSessions];
    }

    this.saveSessions(updated);
    return sessionId;
  },

  /**
   * Unregister the current tab's session upon logout or tab close
   */
  unregisterCurrentTabSession(): void {
    const sessionId = sessionStorage.getItem(TAB_SESSION_ID_KEY);
    if (!sessionId) return;

    const currentSessions = this.getAllSessions();
    const filtered = currentSessions.filter((s) => s.sessionId !== sessionId);
    this.saveSessions(filtered);
    sessionStorage.removeItem(TAB_SESSION_ID_KEY);
  },

  /**
   * Terminate a specific session (used by Owner/Manager remotely)
   */
  terminateSession(sessionId: string): void {
    const currentSessions = this.getAllSessions();
    const filtered = currentSessions.filter((s) => s.sessionId !== sessionId);
    this.saveSessions(filtered);

    // If this happened to be the current tab's session, clear it locally
    const currentTabId = sessionStorage.getItem(TAB_SESSION_ID_KEY);
    if (currentTabId === sessionId) {
      sessionStorage.removeItem(TAB_SESSION_ID_KEY);
    }
  },

  /**
   * Terminate all sessions for a user, optionally preserving the current active tab
   */
  terminateAllUserSessions(userId: string, keepCurrent = false): void {
    const currentTabId = sessionStorage.getItem(TAB_SESSION_ID_KEY);
    const currentSessions = this.getAllSessions();
    const filtered = currentSessions.filter((s) => {
      if (s.userId !== userId) return true;
      if (keepCurrent && s.sessionId === currentTabId) return true;
      return false;
    });
    this.saveSessions(filtered);
  },

  /**
   * Simulate a field staff member opening the app on a 2nd or 3rd device
   * Perfect for demonstration so Owner/Manager sees count increment live
   */
  simulateAddDeviceSession(
    userId: string,
    customDeviceName?: string,
    customDeviceType?: 'mobile' | 'tablet' | 'desktop'
  ): ActiveSessionRecord {
    const currentSessions = this.getAllSessions();
    const existing = currentSessions.find((s) => s.userId === userId);

    const newId = `sess_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomMobiles = [
      'Samsung Galaxy A32 (Android 13)',
      'Tecno Spark 10 Pro (Mobile)',
      'Infinix Note 30 (Field Unit)',
      'Xiaomi Redmi 12 (Mobile)',
      'Realme C53 (Field Unit)',
    ];
    const pickedName =
      customDeviceName || randomMobiles[Math.floor(Math.random() * randomMobiles.length)];

    const newSession: ActiveSessionRecord = {
      sessionId: newId,
      userId,
      userEmail: existing?.userEmail || 'staff@qistflow-demo.pk',
      displayName: existing?.displayName || 'Staff Member',
      role: existing?.role || 'recovery',
      deviceType: customDeviceType || 'mobile',
      deviceName: pickedName,
      browser: 'Chrome Mobile 124',
      ipAddress: `182.185.${Math.floor(Math.random() * 80 + 10)}.${Math.floor(Math.random() * 200 + 10)}`,
      location: 'Rahim Yar Khan, Punjab',
      loginTime: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    const updated = [newSession, ...currentSessions];
    this.saveSessions(updated);
    return newSession;
  },

  /**
   * Listen to session updates across all tabs
   */
  subscribe(callback: (sessions: ActiveSessionRecord[]) => void): () => void {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SESSIONS_STORAGE_KEY) {
        callback(this.getAllSessions());
      }
    };
    const handleLocal = () => {
      callback(this.getAllSessions());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('qistflow_sessions_updated', handleLocal);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('qistflow_sessions_updated', handleLocal);
    };
  },
};
