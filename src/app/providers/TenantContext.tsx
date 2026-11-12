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
import { Tenant, Membership, UserRole } from '@/types';

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
  const { currentUser, isDemoUser } = useAuth();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [userTenants, setUserTenants] = useState<{ tenant: Tenant; membership: Membership }[]>([]);
  const [loadingTenant, setLoadingTenant] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setActiveTenant(null);
      setActiveMembership(null);
      setUserTenants([]);
      setLoadingTenant(false);
      return;
    }

    // Demo Mode Tenant handling
    if (isDemoUser) {
      const demoTenant: Tenant = {
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

      const role: UserRole = currentUser.uid.includes('super_admin')
        ? 'super_admin'
        : currentUser.uid.includes('recovery')
        ? 'recovery'
        : currentUser.uid.includes('accountant')
        ? 'accountant'
        : currentUser.uid.includes('manager')
        ? 'manager'
        : 'owner';

      const demoMembership: Membership = {
        userId: currentUser.uid,
        tenantId: demoTenant.tenantId,
        role,
        permissions: ['all'],
        membershipStatus: 'active',
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
          setActiveTenant(null);
          setActiveMembership(null);
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

  const currentRole: UserRole = activeMembership?.role || 'owner';
  const isSuperAdmin = currentRole === 'super_admin';
  const isOwner = currentRole === 'owner' || isSuperAdmin;
  const isManager = currentRole === 'manager';
  const isAccountant = currentRole === 'accountant';
  const isRecovery = currentRole === 'recovery';

  const canManageStaff = isOwner || isManager;
  const canManageSettings = isOwner;
  const canAccessFinancials = isOwner || isManager || isAccountant;
  const canAccessInventory = isOwner || isManager;
  const canAccessSales = isOwner || isManager;

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

