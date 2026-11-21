// ============================================================================
// Repository: Staff Memberships & Role Governance
// Scoped to /tenants/{tenantId}/memberships/{userId}
// ============================================================================

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/app';
import { Membership, UserRole, MembershipStatus, StaffPayrollRecord, PaymentMethod } from '@/types';
import { ExpenseRepository } from './expense.repository';

export interface StaffMemberRecord {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: MembershipStatus;
  permissions: string[];
  designation?: string;
  monthlySalaryPaisa?: number;
  joinedAt: string;
  password?: string;
  isBlocked?: boolean;
}

const DEMO_STAFF_KEY = 'qistflow_demo_staff';
const DEMO_PAYROLL_KEY = 'qistflow_demo_payroll';

export const StaffRepository = {
  async getStaffMembers(tenantId: string, isDemo = false): Promise<StaffMemberRecord[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_STAFF_KEY}_${tenantId}`);
      if (stored) {
        try {
          const parsed: StaffMemberRecord[] = JSON.parse(stored);
          if (tenantId === 'tenant-demo-ryk-01' || tenantId.includes('test')) {
            // If Tariq Mehmood is missing from older cached storage, add him
            const hasTariq = parsed.some((s) => s.email === 'tariq.recovery@qistflow-demo.pk' || s.userId === 'demo-recovery-103');
            if (!hasTariq) {
              parsed.push({
                userId: 'demo-recovery-103',
                displayName: 'Tariq Mehmood',
                email: 'tariq.recovery@qistflow-demo.pk',
                phone: '0305-5544332',
                role: 'recovery',
                status: 'active',
                permissions: ['assigned_collections'],
                designation: 'Field Recovery Officer (Zone C)',
                monthlySalaryPaisa: 2600000, // Rs. 26,000
                joinedAt: '2026-06-15',
                password: 'Pak@12345',
              });
              localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(parsed));
            }
          }
          return parsed;
        } catch (e) {}
      }

      // For any clean/fresh shop other than the reference demo shop 'tenant-demo-ryk-01'
      // Seed ONLY the shop owner (NO manager, NO accountant, NO recovery officer pre-populated)
      if (tenantId !== 'tenant-demo-ryk-01' && !tenantId.includes('test')) {
        let ownerName = 'Shop Owner';
        let ownerEmail = `owner@${tenantId}.pk`;
        let ownerPhone = '0300-1234567';
        let ownerPassword = 'Pak@12345';

        const storedShops = localStorage.getItem('qistflow_registered_shops');
        if (storedShops) {
          try {
            const list = JSON.parse(storedShops);
            const found = list.find((s: any) => s.tenantId === tenantId);
            if (found) {
              ownerName = found.ownerName || ownerName;
              ownerEmail = found.ownerEmail || found.email || ownerEmail;
              ownerPhone = found.phone || ownerPhone;
              ownerPassword = found.ownerPassword || found.password || ownerPassword;
            }
          } catch (e) {}
        }

        const freshShopStaff: StaffMemberRecord[] = [
          {
            userId: `${tenantId}_owner`,
            displayName: ownerName,
            email: ownerEmail,
            phone: ownerPhone,
            role: 'owner',
            status: 'active',
            permissions: ['all'],
            designation: 'Business Owner & Founder (دکان مالک)',
            monthlySalaryPaisa: 0,
            joinedAt: new Date().toISOString().split('T')[0],
            password: ownerPassword,
          },
        ];
        localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(freshShopStaff));
        return freshShopStaff;
      }

      const initialStaff: StaffMemberRecord[] = [
        {
          userId: 'demo-owner-101',
          displayName: 'Haji Abdul Malik',
          email: 'owner@qistflow-demo.pk',
          phone: '0300-1234567',
          role: 'owner',
          status: 'active',
          permissions: ['all'],
          designation: 'Business Owner & Founder',
          monthlySalaryPaisa: 0,
          joinedAt: '2026-01-01',
          password: 'Pak@12345',
        },
        {
          userId: 'demo-manager-102',
          displayName: 'Muhammad Tariq',
          email: 'manager@qistflow-demo.pk',
          phone: '0301-7654321',
          role: 'manager',
          status: 'active',
          permissions: [
            'manage_products',
            'manage_inventory',
            'view_reports',
            'assign_recovery',
            'can_manage_staff',
            'grant_discounts',
          ],
          designation: 'Shop Manager (Main Branch)',
          monthlySalaryPaisa: 4500000, // Rs. 45,000
          joinedAt: '2026-03-15',
          password: 'Pak@12345',
        },
        {
          userId: 'demo-accountant-103',
          displayName: 'Rashid Mehmood',
          email: 'accountant@qistflow-demo.pk',
          phone: '0303-4455667',
          role: 'accountant',
          status: 'active',
          permissions: [
            'view_financial_reports',
            'record_expenses',
            'request_reversals',
            'view_contracts',
            'view_customers',
          ],
          designation: 'Head Accountant & Ledger Keeper',
          monthlySalaryPaisa: 3500000, // Rs. 35,000
          joinedAt: '2026-04-01',
          password: 'Pak@12345',
        },
        {
          userId: 'demo-recovery-101',
          displayName: 'Kamran Ali',
          email: 'kamran.recovery@qistflow-demo.pk',
          phone: '0302-9988776',
          role: 'recovery',
          status: 'active',
          permissions: ['assigned_collections'],
          designation: 'Field Recovery Officer (Zone A)',
          monthlySalaryPaisa: 2800000, // Rs. 28,000
          joinedAt: '2026-05-10',
          password: 'Pak@12345',
        },
        {
          userId: 'demo-recovery-102',
          displayName: 'Bilal Ahmed',
          email: 'bilal.recovery@qistflow-demo.pk',
          phone: '0304-1122334',
          role: 'recovery',
          status: 'active',
          permissions: ['assigned_collections'],
          designation: 'Field Recovery Officer (Zone B)',
          monthlySalaryPaisa: 2500000, // Rs. 25,000
          joinedAt: '2026-06-01',
          password: 'Pak@12345',
        },
        {
          userId: 'demo-recovery-103',
          displayName: 'Tariq Mehmood',
          email: 'tariq.recovery@qistflow-demo.pk',
          phone: '0305-5544332',
          role: 'recovery',
          status: 'active',
          permissions: ['assigned_collections'],
          designation: 'Field Recovery Officer (Zone C)',
          monthlySalaryPaisa: 2600000, // Rs. 26,000
          joinedAt: '2026-06-15',
          password: 'Pak@12345',
        },
        {
          userId: 'demo-support-104',
          displayName: 'Muhammad Aslam',
          email: 'aslam.support@qistflow-demo.pk',
          phone: '0306-9911223',
          role: 'recovery', // uses base operational role with support designation
          status: 'active',
          permissions: [],
          designation: 'Cleaning & Support Staff (صفائی و معاون عملہ)',
          monthlySalaryPaisa: 2000000, // Rs. 20,000
          joinedAt: '2026-02-15',
          password: 'Pak@12345',
        },
      ];
      localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(initialStaff));
      return initialStaff;
    }

    const colRef = collection(db, 'tenants', tenantId, 'memberships');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: any) => {
      const m = d.data() as Membership;
      return {
        userId: m.userId,
        displayName: m.userId.slice(0, 10),
        email: `${m.userId.slice(0, 8)}@staff.pk`,
        role: m.role,
        status: m.membershipStatus,
        permissions: m.permissions || [m.role],
        designation: 'Staff Member',
        monthlySalaryPaisa: 3000000,
        joinedAt: new Date().toISOString().split('T')[0],
      };
    });
  },

  async inviteStaffMember(params: {
    tenantId: string;
    invitedBy: string;
    displayName: string;
    email: string;
    phone?: string;
    role: UserRole;
    permissions?: string[];
    designation?: string;
    monthlySalaryPaisa?: number;
    password?: string;
    isDemo?: boolean;
  }): Promise<StaffMemberRecord> {
    const {
      tenantId,
      invitedBy,
      displayName,
      email,
      phone,
      role,
      permissions,
      designation,
      monthlySalaryPaisa,
      password = 'Pak@12345',
      isDemo = false,
    } = params;
    const userId = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Default permissions based on role
    const effectivePermissions = permissions && permissions.length > 0
      ? permissions
      : role === 'owner'
      ? ['all']
      : role === 'manager'
      ? ['manage_products', 'manage_inventory', 'view_reports', 'assign_recovery', 'can_manage_staff', 'grant_discounts']
      : role === 'accountant'
      ? ['view_financial_reports', 'record_expenses', 'request_reversals', 'view_contracts', 'view_customers']
      : ['assigned_collections'];

    const newMember: StaffMemberRecord = {
      userId,
      displayName,
      email,
      phone,
      role,
      status: 'active',
      permissions: effectivePermissions,
      designation: designation || (role === 'manager' ? 'Shop Manager' : role === 'accountant' ? 'Head Accountant' : 'Recovery Officer'),
      monthlySalaryPaisa: monthlySalaryPaisa || (role === 'manager' ? 4500000 : role === 'accountant' ? 3500000 : 2800000),
      joinedAt: new Date().toISOString().split('T')[0],
      password,
    };

    if (isDemo) {
      const staff = await this.getStaffMembers(tenantId, true);
      const updated = [newMember, ...staff];
      localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(updated));
      return newMember;
    }

    const membershipDoc: Membership = {
      userId,
      tenantId,
      role,
      permissions: effectivePermissions,
      membershipStatus: 'active',
      invitedBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'tenants', tenantId, 'memberships', userId), membershipDoc);
    return newMember;
  },

  async updateStaffDetails(
    tenantId: string,
    userId: string,
    updates: {
      displayName?: string;
      email?: string;
      phone?: string;
      designation?: string;
      password?: string;
    },
    isDemo = false
  ): Promise<StaffMemberRecord | undefined> {
    if (isDemo) {
      const staff = await this.getStaffMembers(tenantId, true);
      const target = staff.find((s) => s.userId === userId);
      if (target) {
        if (updates.displayName !== undefined) target.displayName = updates.displayName;
        if (updates.email !== undefined) target.email = updates.email;
        if (updates.phone !== undefined) target.phone = updates.phone;
        if (updates.designation !== undefined) target.designation = updates.designation;
        if (updates.password !== undefined) target.password = updates.password;
        localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(staff));
        return target;
      }
      return undefined;
    }

    const docUpdates: any = {
      updatedAt: serverTimestamp(),
    };
    if (updates.displayName !== undefined) docUpdates.displayName = updates.displayName;
    if (updates.email !== undefined) docUpdates.email = updates.email;
    if (updates.phone !== undefined) docUpdates.phone = updates.phone;
    if (updates.designation !== undefined) docUpdates.designation = updates.designation;
    if (updates.password !== undefined) docUpdates.password = updates.password;

    await updateDoc(doc(db, 'tenants', tenantId, 'memberships', userId), docUpdates);
    return undefined;
  },

  async updateStaffPassword(
    tenantId: string,
    userId: string,
    newPassword: string,
    isDemo = false
  ): Promise<StaffMemberRecord | undefined> {
    if (isDemo) {
      const staff = await this.getStaffMembers(tenantId, true);
      const target = staff.find((s) => s.userId === userId);
      if (target) {
        target.password = newPassword;
        localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(staff));
        return target;
      }
      return undefined;
    }

    await updateDoc(doc(db, 'tenants', tenantId, 'memberships', userId), {
      password: newPassword,
      updatedAt: serverTimestamp(),
    });
    return undefined;
  },

  async updateStaffPermissions(
    tenantId: string,
    userId: string,
    permissions: string[],
    isDemo = false
  ): Promise<void> {
    if (isDemo) {
      const staff = await this.getStaffMembers(tenantId, true);
      const target = staff.find((s) => s.userId === userId);
      if (target) {
        target.permissions = permissions;
        localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(staff));
      }
      return;
    }

    await updateDoc(doc(db, 'tenants', tenantId, 'memberships', userId), {
      permissions,
      updatedAt: serverTimestamp(),
    });
  },

  async updateStaffStatus(
    tenantId: string,
    userId: string,
    status: MembershipStatus,
    isDemo = false
  ): Promise<void> {
    if (isDemo) {
      const staff = await this.getStaffMembers(tenantId, true);
      const target = staff.find((s) => s.userId === userId);
      if (target) {
        target.status = status;
        target.isBlocked = status === 'suspended';
        localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(staff));
      }
      return;
    }

    await updateDoc(doc(db, 'tenants', tenantId, 'memberships', userId), {
      membershipStatus: status,
      updatedAt: serverTimestamp(),
    });
  },

  async toggleStaffBlock(
    tenantId: string,
    userId: string,
    isDemo = false
  ): Promise<boolean> {
    if (isDemo) {
      const staff = await this.getStaffMembers(tenantId, true);
      const target = staff.find((s) => s.userId === userId);
      if (target) {
        const willBeBlocked = !target.isBlocked && target.status !== 'suspended';
        target.isBlocked = willBeBlocked;
        target.status = willBeBlocked ? 'suspended' : 'active';
        localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(staff));
        return willBeBlocked;
      }
      return false;
    }

    const membershipRef = doc(db, 'tenants', tenantId, 'memberships', userId);
    // For live firestore, default to suspended
    await updateDoc(membershipRef, {
      membershipStatus: 'suspended',
      updatedAt: serverTimestamp(),
    });
    return true;
  },

  async updateStaffSalary(
    tenantId: string,
    userId: string,
    monthlySalaryPaisa: number,
    designation?: string,
    isDemo = false
  ): Promise<void> {
    if (isDemo) {
      const staff = await this.getStaffMembers(tenantId, true);
      const target = staff.find((s) => s.userId === userId);
      if (target) {
        target.monthlySalaryPaisa = monthlySalaryPaisa;
        if (designation) target.designation = designation;
        localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(staff));
      }
      return;
    }
    const updates: any = { monthlySalaryPaisa, updatedAt: serverTimestamp() };
    if (designation) updates.designation = designation;
    await updateDoc(doc(db, 'tenants', tenantId, 'memberships', userId), updates);
  },

  async getPayrollRecords(tenantId: string, monthKey = '2026-11', isDemo = false): Promise<StaffPayrollRecord[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_PAYROLL_KEY}_${tenantId}_${monthKey}`);
      if (stored) return JSON.parse(stored);

      const staff = await this.getStaffMembers(tenantId, true);
      const initialPayroll: StaffPayrollRecord[] = staff
        .filter((s) => s.role !== 'owner' && (s.monthlySalaryPaisa || 0) > 0)
        .map((s, idx) => {
          const isSamplePaid = idx === 0; // manager paid, others pending
          return {
            payrollId: `payr_${monthKey}_${s.userId}`,
            tenantId,
            userId: s.userId,
            employeeName: s.displayName,
            role: s.role,
            designation: s.designation || s.role.toUpperCase(),
            monthKey,
            baseSalaryPaisa: s.monthlySalaryPaisa || 3000000,
            bonusPaisa: 0,
            deductionsPaisa: 0,
            netPayablePaisa: s.monthlySalaryPaisa || 3000000,
            status: isSamplePaid ? 'paid' : 'pending',
            paidAt: isSamplePaid ? `${monthKey}-05` : undefined,
            paymentMethod: isSamplePaid ? 'bank' : undefined,
            notes: isSamplePaid ? 'Monthly salary transferred via bank' : undefined,
            createdAt: new Date().toISOString(),
          };
        });

      localStorage.setItem(`${DEMO_PAYROLL_KEY}_${tenantId}_${monthKey}`, JSON.stringify(initialPayroll));
      return initialPayroll;
    }

    const colRef = collection(db, 'tenants', tenantId, 'payroll');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as StaffPayrollRecord));
  },

  async paySalary(params: {
    tenantId: string;
    userId: string;
    payrollId: string;
    amountPaisa: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    isDemo?: boolean;
  }): Promise<StaffPayrollRecord> {
    const { tenantId, userId, payrollId, amountPaisa, paymentMethod, notes = '', isDemo = false } = params;

    const expense = await ExpenseRepository.recordExpense({
      tenantId,
      userId,
      category: 'Salaries (تنخواہیں)',
      amountPaisa,
      method: paymentMethod,
      description: `Staff Salary Payment [${notes || payrollId}]`,
      isDemo,
    });

    if (isDemo) {
      const parts = payrollId.split('_');
      const monthKey = parts[1] || '2026-11';
      const records = await this.getPayrollRecords(tenantId, monthKey, true);
      const target = records.find((r) => r.payrollId === payrollId);
      if (!target) throw new Error('Payroll record not found');

      target.status = 'paid';
      target.paidAt = new Date().toISOString().split('T')[0];
      target.paymentMethod = paymentMethod;
      target.expenseId = expense.expenseId;
      target.notes = notes;

      localStorage.setItem(`${DEMO_PAYROLL_KEY}_${tenantId}_${monthKey}`, JSON.stringify(records));
      return target;
    }

    await updateDoc(doc(db, 'tenants', tenantId, 'payroll', payrollId), {
      status: 'paid',
      paidAt: serverTimestamp(),
      paymentMethod,
      expenseId: expense.expenseId,
      notes,
    });

    const docSnap = await getDocs(collection(db, 'tenants', tenantId, 'payroll'));
    return docSnap.docs.find((d) => d.id === payrollId)?.data() as StaffPayrollRecord;
  },
};

