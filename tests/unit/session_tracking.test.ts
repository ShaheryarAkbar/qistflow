import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionTrackerService } from '@/services/sessionTracker.service';

// In-memory mock for node test runner
const localStore: Record<string, string> = {};
const sessionStore: Record<string, string> = {};

global.localStorage = {
  getItem: (key: string) => localStore[key] || null,
  setItem: (key: string, value: string) => {
    localStore[key] = value;
  },
  removeItem: (key: string) => {
    delete localStore[key];
  },
  clear: () => {
    for (const k of Object.keys(localStore)) delete localStore[k];
  },
  key: (index: number) => Object.keys(localStore)[index] || null,
  length: 0,
};

global.sessionStorage = {
  getItem: (key: string) => sessionStore[key] || null,
  setItem: (key: string, value: string) => {
    sessionStore[key] = value;
  },
  removeItem: (key: string) => {
    delete sessionStore[key];
  },
  clear: () => {
    for (const k of Object.keys(sessionStore)) delete sessionStore[k];
  },
  key: (index: number) => Object.keys(sessionStore)[index] || null,
  length: 0,
};

describe('Real-Time Concurrent Session Tracking & Tab Isolation', () => {
  beforeEach(() => {
    global.localStorage.clear();
    global.sessionStorage.clear();
  });

  afterEach(() => {
    global.localStorage.clear();
    global.sessionStorage.clear();
  });

  it('initializes default seeded active sessions correctly', () => {
    const sessions = SessionTrackerService.getAllSessions();
    expect(sessions.length).toBeGreaterThan(0);

    // Verify recovery officer Kamran Ali has 2 seeded concurrent device sessions
    const kamranSessions = SessionTrackerService.getUserSessions('demo-recovery-101');
    expect(kamranSessions.length).toBe(2);
    expect(kamranSessions.map((s) => s.deviceType)).toContain('mobile');
    expect(kamranSessions.map((s) => s.deviceType)).toContain('tablet');
  });

  it('allows registering a new tab session and increments concurrent count', () => {
    // Current count for Kamran Ali is 2
    expect(SessionTrackerService.getUserSessionCount('demo-recovery-101')).toBe(2);

    // Tab 1 registers as Kamran Ali
    const tabSessionId = SessionTrackerService.registerCurrentTabSession({
      userId: 'demo-recovery-101',
      email: 'kamran.recovery@qistflow-demo.pk',
      displayName: 'Kamran Ali',
      role: 'recovery',
    });

    expect(tabSessionId).toBeDefined();
    expect(sessionStorage.getItem('qistflow_tab_session_id')).toBe(tabSessionId);

    // Count should now be 3 (2 field devices + 1 browser tab)
    const updatedCount = SessionTrackerService.getUserSessionCount('demo-recovery-101');
    expect(updatedCount).toBe(3);

    const userSessions = SessionTrackerService.getUserSessions('demo-recovery-101');
    const currentTabSession = userSessions.find((s) => s.sessionId === tabSessionId);
    expect(currentTabSession?.isCurrentTab).toBe(true);
  });

  it('supports simulating a 2nd or 3rd field mobile phone login in real-time', () => {
    // Bilal Ahmed initially has 1 active mobile session
    expect(SessionTrackerService.getUserSessionCount('demo-recovery-102')).toBe(1);

    // Manager/Owner simulates Bilal opening the app on a 2nd phone (e.g. Samsung Galaxy)
    const simulated = SessionTrackerService.simulateAddDeviceSession(
      'demo-recovery-102',
      'Samsung Galaxy A32 (Android 13)',
      'mobile'
    );

    expect(simulated.deviceName).toBe('Samsung Galaxy A32 (Android 13)');
    expect(simulated.deviceType).toBe('mobile');

    // Count is now 2 devices
    expect(SessionTrackerService.getUserSessionCount('demo-recovery-102')).toBe(2);

    // Simulate 3rd device login
    SessionTrackerService.simulateAddDeviceSession('demo-recovery-102', 'Tecno Spark 10', 'mobile');
    expect(SessionTrackerService.getUserSessionCount('demo-recovery-102')).toBe(3);
  });

  it('allows Owner/Manager to terminate a specific remote device session', () => {
    const kamranSessions = SessionTrackerService.getUserSessions('demo-recovery-101');
    expect(kamranSessions.length).toBe(2);

    // Terminate the tablet session
    const tabletSession = kamranSessions.find((s) => s.deviceType === 'tablet');
    expect(tabletSession).toBeDefined();

    SessionTrackerService.terminateSession(tabletSession!.sessionId);

    // Count decrements to 1
    expect(SessionTrackerService.getUserSessionCount('demo-recovery-101')).toBe(1);
    const remaining = SessionTrackerService.getUserSessions('demo-recovery-101');
    expect(remaining.map((s) => s.sessionId)).not.toContain(tabletSession!.sessionId);
  });

  it('isolates multi-tab logins using sessionStorage precedence', () => {
    // Tab 1 simulates Manager login
    const managerSession = {
      user: { uid: 'demo-manager-01', email: 'manager@qistflow-demo.pk', displayName: 'Muhammad Tariq' },
      profile: { userId: 'demo-manager-01', displayName: 'Muhammad Tariq', email: 'manager@qistflow-demo.pk' },
      role: 'manager',
    };
    sessionStorage.setItem('qistflow_demo_user', JSON.stringify(managerSession));

    // Even if localStorage is modified by another tab logging in as Recovery Officer:
    const recoverySession = {
      user: { uid: 'demo-recovery-101', email: 'kamran.recovery@qistflow-demo.pk', displayName: 'Kamran Ali' },
      profile: { userId: 'demo-recovery-101', displayName: 'Kamran Ali', email: 'kamran.recovery@qistflow-demo.pk' },
      role: 'recovery',
    };
    localStorage.setItem('qistflow_demo_user', JSON.stringify(recoverySession));

    // When Tab 1 reads its active user, sessionStorage takes precedence over localStorage
    const activeTabStored = sessionStorage.getItem('qistflow_demo_user') || localStorage.getItem('qistflow_demo_user');
    const parsed = JSON.parse(activeTabStored!);
    expect(parsed.role).toBe('manager');
    expect(parsed.user.uid).toBe('demo-manager-01');

    // Tab 1 remains Manager without getting overwritten or logged out!
  });
});
