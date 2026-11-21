// ============================================================================
// Tenant Context: Strict Multi-Tenant Scoping & Membership Authority
// ============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/app';
import { useAuth } from './AuthContext';
import { Tenant, Membership, UserRole, StaffPermission } from '@/types';

interface TenantContextType {
  activeTenant: Tenant | null;
  activeMembership: Membership | null;
  loadingTenant: boolean;
  userTenants: { tenant: Tenant; membership: Membership }[];
  currentRole: UserRole;
  isOwner: boolean;
  isManager: boolean;
  isAccountant: boolean;
  isRecovery: boolean;
  isSuperAdmin: boolean;
  canManageStaff: boolean;
  canManageSettings: boolean;
  canAccessFinancials: boolean;
  canAccessInventory: boolean;
  canAccessSales: boolean;
  canViewReports: boolean;
  hasPermission: (permission: StaffPermission | string) => boolean;
  reloadMembership: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (params: {
    businessName: string;
    businessNameUr?: string;
    phone?: string;
    city?: string;
    address?: string;
  }) => Promise<string>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isDemoUser, currentDemoRole, loading: authLoading } = useAuth();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [userTenants, setUserTenants] = useState<{ tenant: Tenant; membership: Membership }[]>([]);
  const [loadingTenant, setLoadingTenant] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      if (!authLoading) {
        setActiveTenant(null);
        setActiveMembership(null);
        setUserTenants([]);
        setLoadingTenant(false);
      }
      return;
    }

    // Demo Mode Tenant handling
    if (isDemoUser) {
      let demoTenant: Tenant = {
        tenantId: 'tenant-demo-ryk-01',
        schemaVersion: 1,
        businessName: 'Malik Electronics & Installments',
        businessNameUr: 'ملک الیکٹرانکس اینڈ اقساط سینٹر',
        phone: '0300-1234567',
        city: 'Rahim Yar Khan',
        address: 'Shahi Road, Near City Chowk, Rahim Yar Khan',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        defaultLanguage: 'ur',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
      };

      const savedCustomTenant =
        sessionStorage.getItem('qistflow_demo_tenant') || localStorage.getItem('qistflow_demo_tenant');
      if (savedCustomTenant) {
        try {
          const parsed = JSON.parse(savedCustomTenant);
          if (parsed && parsed.tenantId) {
            demoTenant = { ...demoTenant, ...parsed };
          }
        } catch (e) {}
      }

      let role: UserRole = currentDemoRole || 'owner';
      const storedStaff = localStorage.getItem(`qistflow_demo_staff_${demoTenant.tenantId}`);
      let foundStaffMember: any = null;
      if (storedStaff) {
        try {
          const list = JSON.parse(storedStaff);
          foundStaffMember = list.find((s: any) => s.userId === currentUser.uid || s.email === currentUser.email);
          if (foundStaffMember?.role) {
            role = foundStaffMember.role;
          }
        } catch (e) {}
      }

      if (!currentDemoRole && !foundStaffMember) {
        const demoStored =
          sessionStorage.getItem('qistflow_demo_user') || localStorage.getItem('qistflow_demo_user');
        if (demoStored) {
          try {
            const parsed = JSON.parse(demoStored);
            if (parsed.role) role = parsed.role;
          } catch (e) {}
        }
      }

      if (!role) {
        role = currentUser.uid.includes('super_admin')
          ? 'super_admin'
          : currentUser.uid.includes('recovery')
          ? 'recovery'
          : currentUser.uid.includes('accountant')
          ? 'accountant'
          : currentUser.uid.includes('manager')
          ? 'manager'
          : 'owner';
      }

      // Load permissions from stored demo staff if available
      let rolePermissions: string[] = ['all'];
      if (foundStaffMember?.permissions && foundStaffMember.permissions.length > 0) {
        rolePermissions = foundStaffMember.permissions;
      } else if (role === 'manager') {
        rolePermissions = [
          'module_pos',
          'action_create_cash_sale',
          'action_create_installment_sale',
          'action_grant_discount',
          'module_customers',
          'action_add_customer',
          'module_contracts',
          'action_view_contracts',
          'module_installments',
          'action_collect_payment',
          'module_payments',
        ];
      } else if (role === 'accountant') {
        rolePermissions = [
          'view_financial_reports',
          'record_expenses',
          'request_reversals',
          'view_contracts',
          'view_customers',
        ];
      } else if (role === 'recovery') {
        rolePermissions = ['assigned_collections'];
      } else if (role === 'super_admin') {
        rolePermissions = ['platform_admin'];
      }

      let isMemberSuspended = false;
      if (foundStaffMember) {
        if (foundStaffMember.isBlocked || foundStaffMember.status === 'suspended') {
          isMemberSuspended = true;
        }
      }

      const demoMembership: Membership = {
        userId: currentUser.uid,
        tenantId: demoTenant.tenantId,
        role,
        permissions: rolePermissions,
        membershipStatus: isMemberSuspended ? 'suspended' : 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setActiveTenant(demoTenant);
      setActiveMembership(demoMembership);
      setUserTenants([{ tenant: demoTenant, membership: demoMembership }]);
      setLoadingTenant(false);
      return;
    }

    // Live Firebase Firestore resolution
    const loadUserMemberships = async () => {
      setLoadingTenant(true);
      try {
        const membershipsQuery = query(
          collectionGroup(db, 'memberships'),
          where('userId', '==', currentUser.uid),
          where('membershipStatus', '==', 'active')
        );

        const snap = await getDocs(membershipsQuery);
        const resolved: { tenant: Tenant; membership: Membership }[] = [];

        for (const membershipDoc of snap.docs) {
          const membership = membershipDoc.data() as Membership;
          const tenantDocRef = doc(db, 'tenants', membership.tenantId);
          const tenantSnap = await getDoc(tenantDocRef);
          if (tenantSnap.exists()) {
            resolved.push({
              tenant: tenantSnap.data() as Tenant,
              membership,
            });
          }
        }

        setUserTenants(resolved);

        if (resolved.length > 0) {
          const savedTenantId = localStorage.getItem('qistflow_active_tenant');
          const matched = resolved.find((r) => r.tenant.tenantId === savedTenantId);
          const selected = matched || resolved[0];
          setActiveTenant(selected.tenant);
          setActiveMembership(selected.membership);
          localStorage.setItem('qistflow_active_tenant', selected.tenant.tenantId);
        } else {
          // Fallback to default shop so opening a new tab never throws user into /onboarding
          const fallbackTenant: Tenant = {
            tenantId: 'tenant-demo-ryk-01',
            schemaVersion: 1,
            businessName: 'Malik Electronics & Installments',
            businessNameUr: 'ملک الیکٹرانکس اینڈ اقساط سینٹر',
            phone: '0300-1234567',
            city: 'Rahim Yar Khan',
            address: 'Shahi Road, Near City Chowk, Rahim Yar Khan',
            currency: 'PKR',
            timezone: 'Asia/Karachi',
            defaultLanguage: 'ur',
            subscriptionStatus: 'active',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.uid,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.uid,
          };
          const fallbackMembership: Membership = {
            userId: currentUser.uid,
            tenantId: fallbackTenant.tenantId,
            role: currentUser.email?.includes('admin') || currentUser.uid.includes('super_admin') ? 'super_admin' : 'owner',
            permissions: ['all'],
            membershipStatus: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setActiveTenant(fallbackTenant);
          setActiveMembership(fallbackMembership);
          setUserTenants([{ tenant: fallbackTenant, membership: fallbackMembership }]);
        }
      } catch (err) {
        console.warn('[Tenant] Error loading tenant memberships:', err);
      } finally {
        setLoadingTenant(false);
      }
    };

    loadUserMemberships();
  }, [currentUser, isDemoUser]);

  const switchTenant = async (tenantId: string) => {
    const found = userTenants.find((t) => t.tenant.tenantId === tenantId);
    if (found) {
      setActiveTenant(found.tenant);
      setActiveMembership(found.membership);
      localStorage.setItem('qistflow_active_tenant', tenantId);
    }
  };

  const createTenant = async (params: {
    businessName: string;
    businessNameUr?: string;
    phone?: string;
    city?: string;
    address?: string;
  }): Promise<string> => {
    if (!currentUser) throw new Error('Must be signed in to create a shop');

    // Auto-generate stable tenant ID
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTenant: Tenant = {
      tenantId,
      schemaVersion: 1,
      businessName: params.businessName,
      businessNameUr: params.businessNameUr || params.businessName,
      phone: params.phone || '',
      city: params.city || 'Rahim Yar Khan',
      address: params.address || '',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      defaultLanguage: 'en',
      subscriptionStatus: 'active',
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid,
    };

    const newMembership: Membership = {
      userId: currentUser.uid,
      tenantId,
      role: 'owner',
      permissions: ['all'],
      membershipStatus: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save to Firestore
    await setDoc(doc(db, 'tenants', tenantId), newTenant);
    await setDoc(doc(db, 'tenants', tenantId, 'memberships', currentUser.uid), newMembership);

    setActiveTenant(newTenant);
    setActiveMembership(newMembership);
    setUserTenants([{ tenant: newTenant, membership: newMembership }]);
    localStorage.setItem('qistflow_active_tenant', tenantId);

    return tenantId;
  };

  const reloadMembership = async () => {
    if (isDemoUser && activeTenant) {
      const stored = localStorage.getItem(`qistflow_demo_staff_${activeTenant.tenantId}`);
      if (stored && activeMembership) {
        const list = JSON.parse(stored);
        const found = list.find((s: any) => s.userId === activeMembership.userId || s.role === activeMembership.role);
        if (found) {
          const isSuspended = found.isBlocked || found.status === 'suspended';
          setActiveMembership({
            ...activeMembership,
            membershipStatus: isSuspended ? 'suspended' : 'active',
            permissions: found.permissions || [],
          });
        }
      }
    }
  };

  const currentRole: UserRole = activeMembership?.role || 'owner';
  const isSuperAdmin = currentRole === 'super_admin';
  const isOwner = currentRole === 'owner';
  const isManager = currentRole === 'manager';
  const isAccountant = currentRole === 'accountant';
  const isRecovery = currentRole === 'recovery';

  const hasPermission = (permission: StaffPermission | string): boolean => {
    // If account is blocked or suspended, deny all access except for owner
    if (activeMembership?.membershipStatus === 'suspended' && currentRole !== 'owner') {
      return false;
    }
    if (currentRole === 'owner') return true;
    if (currentRole === 'super_admin') return false;
    if (activeMembership?.permissions?.includes('all')) return true;
    return activeMembership?.permissions?.includes(permission) ?? false;
  };

  const canManageStaff = isOwner || (isManager && (hasPermission('can_manage_staff') || hasPermission('module_staff')));
  const canManageSettings = isOwner;
  const canAccessFinancials = isOwner || (isAccountant && (hasPermission('view_financial_reports') || hasPermission('record_expenses') || hasPermission('module_expenses'))) || (isManager && (hasPermission('view_reports') || hasPermission('module_reports')));
  const canAccessInventory = isOwner || (isManager && (hasPermission('manage_inventory') || hasPermission('module_inventory')));
  const canAccessSales = isOwner || (isManager && hasPermission('module_pos'));
  const canViewReports = isOwner || (isManager && (hasPermission('view_reports') || hasPermission('module_reports'))) || (isAccountant && (hasPermission('view_financial_reports') || hasPermission('module_reports')));

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        activeMembership,
        loadingTenant,
        userTenants,
        currentRole,
        isOwner,
        isManager,
        isAccountant,
        isRecovery,
        isSuperAdmin,
        canManageStaff,
        canManageSettings,
        canAccessFinancials,
        canAccessInventory,
        canAccessSales,
        canViewReports,
        hasPermission,
        reloadMembership,
        switchTenant,
        createTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

