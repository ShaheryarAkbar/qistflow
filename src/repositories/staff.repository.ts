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
import { Membership, UserRole, MembershipStatus } from '@/types';

export interface StaffMemberRecord {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: MembershipStatus;
  permissions: string[];
  joinedAt: string;
}

const DEMO_STAFF_KEY = 'qistflow_demo_staff';

export const StaffRepository = {
  async getStaffMembers(tenantId: string, isDemo = false): Promise<StaffMemberRecord[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_STAFF_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      const initialStaff: StaffMemberRecord[] = [
        {
          userId: 'demo-owner-101',
          displayName: 'Haji Abdul Malik (Owner)',
          email: 'owner@qistflow-demo.pk',
          phone: '0300-1234567',
          role: 'owner',
          status: 'active',
          permissions: ['all'],
          joinedAt: '2026-01-01',
        },
        {
          userId: 'demo-manager-102',
          displayName: 'Muhammad Tariq (Shop Manager)',
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
          joinedAt: '2026-03-15',
        },
        {
          userId: 'demo-accountant-103',
          displayName: 'Rashid Mehmood (Accountant)',
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
          joinedAt: '2026-04-01',
        },
        {
          userId: 'demo-recovery-101',
          displayName: 'Kamran Ali (Recovery Officer)',
          email: 'recovery@qistflow-demo.pk',
          phone: '0302-9988776',
          role: 'recovery',
          status: 'active',
          permissions: ['assigned_collections'],
          joinedAt: '2026-05-10',
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
    isDemo?: boolean;
  }): Promise<StaffMemberRecord> {
    const { tenantId, invitedBy, displayName, email, phone, role, permissions, isDemo = false } = params;
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
      joinedAt: new Date().toISOString().split('T')[0],
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
        localStorage.setItem(`${DEMO_STAFF_KEY}_${tenantId}`, JSON.stringify(staff));
      }
      return;
    }

    await updateDoc(doc(db, 'tenants', tenantId, 'memberships', userId), {
      membershipStatus: status,
      updatedAt: serverTimestamp(),
    });
  },
};

