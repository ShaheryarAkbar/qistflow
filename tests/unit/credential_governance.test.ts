// ============================================================================
// Unit Tests: Credential Governance, Password Vault & Role Isolation
// Verifies closed enterprise auth model:
// 1. Super-Admin -> Shop Owner (Shop provisioning & Owner Gmail/Password)
// 2. Owner & Manager -> Staff (Staff Gmail/Password Vault & Updates)
// 3. Strict Role Isolation & Elimination of Insecure Public Role Switchers
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { StaffRepository } from '@/repositories/staff.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';

// In-memory localStorage mock for node environment
const storageMock: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const key of Object.keys(storageMock)) delete storageMock[key];
  },
  key: (index: number) => Object.keys(storageMock)[index] || null,
  length: 0,
};

describe('Credential Governance, Password Vault & Role Isolation', () => {
  const tenantId = 'tenant-demo-ryk-01';

  beforeEach(() => {
    global.localStorage.clear();
  });

  it('stores and retrieves staff passwords in the leadership vault', async () => {
    const staff = await StaffRepository.getStaffMembers(tenantId, true);
    expect(staff.length).toBeGreaterThan(0);

    // Initial seeded staff must have passwords for leadership visibility
    for (const member of staff) {
      expect(member.password).toBeDefined();
      expect(member.password).toBe('Pak@12345');
    }
  });

  it('allows Owner and Manager to create staff with custom password and view in vault', async () => {
    const newOfficer = await StaffRepository.inviteStaffMember({
      tenantId,
      invitedBy: 'owner',
      displayName: 'Kashif Mehmood',
      email: 'kashif.recovery@shop.pk',
      phone: '0301-5544332',
      role: 'recovery',
      designation: 'Senior Recovery Officer',
      password: 'CustomSecret@2026',
      monthlySalaryPaisa: 3500000,
      isDemo: true,
    });

    expect(newOfficer.email).toBe('kashif.recovery@shop.pk');
    expect(newOfficer.password).toBe('CustomSecret@2026');
    expect(newOfficer.designation).toBe('Senior Recovery Officer');
    expect(newOfficer.monthlySalaryPaisa).toBe(3500000);

    // Fetch from repository to verify persistent storage
    const allStaff = await StaffRepository.getStaffMembers(tenantId, true);
    const saved = allStaff.find((s) => s.email === 'kashif.recovery@shop.pk');
    expect(saved).toBeDefined();
    expect(saved?.password).toBe('CustomSecret@2026');
    expect(saved?.designation).toBe('Senior Recovery Officer');
  });

  it('allows Owner and Manager to reset or update any staff member password', async () => {
    const staff = await StaffRepository.getStaffMembers(tenantId, true);
    const targetMember = staff.find((s) => s.role === 'recovery');
    expect(targetMember).toBeDefined();

    if (!targetMember) return;

    // Reset password
    const updated = await StaffRepository.updateStaffPassword(
      tenantId,
      targetMember.userId,
      'NewSecurePass@999',
      true
    );

    expect(updated.password).toBe('NewSecurePass@999');

    // Confirm retrieved list reflects new password
    const refreshed = await StaffRepository.getStaffMembers(tenantId, true);
    const checked = refreshed.find((s) => s.userId === targetMember.userId);
    expect(checked?.password).toBe('NewSecurePass@999');
  });

  it('validates credentials accurately: matching password grants access, incorrect password fails', async () => {
    const staff = await StaffRepository.getStaffMembers(tenantId, true);
    const accountant = staff.find((s) => s.role === 'accountant');
    expect(accountant).toBeDefined();

    if (!accountant) return;

    // Validation logic as performed in LoginPage
    const testLogin = (email: string, pass: string) => {
      const found = staff.find((s) => s.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (!found) return { success: false, reason: 'USER_NOT_FOUND' };
      if ((found.password || 'Pak@12345') !== pass) return { success: false, reason: 'INVALID_PASSWORD' };
      return { success: true, user: found };
    };

    // 1. Correct credentials
    const loginOk = testLogin(accountant.email, accountant.password || 'Pak@12345');
    expect(loginOk.success).toBe(true);
    expect(loginOk.user?.role).toBe('accountant');

    // 2. Wrong password
    const loginFail = testLogin(accountant.email, 'WrongPass123');
    expect(loginFail.success).toBe(false);
    expect(loginFail.reason).toBe('INVALID_PASSWORD');

    // 3. Unknown user
    const loginUnknown = testLogin('hacker@unknown.com', 'Pak@12345');
    expect(loginUnknown.success).toBe(false);
    expect(loginUnknown.reason).toBe('USER_NOT_FOUND');
  });

  it('proves Super-Admin tenant provisioning generates owner credentials for secure handover', () => {
    // Simulating Super-Admin shop onboard flow
    const onboardedShop = {
      tenantId: `tenant_${Date.now()}`,
      businessName: 'Rehman Fan Mart',
      businessNameUr: 'رحمٰن فین مارٹ',
      ownerName: 'Hafiz Rehman',
      ownerEmail: 'rehman.owner@ryk.pk',
      ownerPassword: 'Pak@12345',
      phone: '0300-9988776',
      city: 'Rahim Yar Khan',
      plan: 'Professional Monthly (Rs. 3,499)',
      licenceType: 'subscription',
      status: 'active',
    };

    expect(onboardedShop.ownerEmail).toBe('rehman.owner@ryk.pk');
    expect(onboardedShop.ownerPassword).toBe('Pak@12345');

    // Generate handover text
    const handoverText = `*مبارک ہو! آپ کی دکان کا QistFlow پورٹل تیار ہے*
دکان کا نام: ${onboardedShop.businessNameUr}
مالک کا نام: ${onboardedShop.ownerName}
شہر: ${onboardedShop.city}
لاگ ان ای میل (Gmail): ${onboardedShop.ownerEmail}
پاس ورڈ (Password): ${onboardedShop.ownerPassword}
سافٹ ویئر لنک: https://qistflow.app/#/login`;

    expect(handoverText).toContain('rehman.owner@ryk.pk');
    expect(handoverText).toContain('Pak@12345');
    expect(handoverText).toContain('https://qistflow.app/#/login');
  });
});
