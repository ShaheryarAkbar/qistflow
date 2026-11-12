// ============================================================================
// Application Router: Role-Guarded Multi-Tenant & Platform Navigation
// ============================================================================

import React from 'react';
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from './providers/AuthContext';
import { useTenant } from './providers/TenantContext';
import { UserRole } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';
import { PosCheckoutPage } from '@/features/sales/PosCheckoutPage';
import { ContractsPage } from '@/features/contracts/ContractsPage';
import { PaymentsPage } from '@/features/payments/PaymentsPage';
import { DueInstallmentsPage } from '@/features/installments/DueInstallmentsPage';
import { RecoveryPortalPage } from '@/features/recovery/RecoveryPortalPage';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { StaffPage } from '@/features/staff/StaffPage';
import { ArchivesPage } from '@/features/archives/ArchivesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { PlatformAdminPage } from '@/features/platform/PlatformAdminPage';
import { CalculatorPage } from '@/features/calculator/CalculatorPage';
import { CustomerPortalPage } from '@/features/portal/CustomerPortalPage';

// --- Guards ---
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading QistFlow...</p>
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RequireTenant: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTenant, loadingTenant } = useTenant();
  if (loadingTenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading shop details...</p>
      </div>
    );
  }
  if (!activeTenant) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

// Strict Role Guard
const RequireRole: React.FC<{
  roles: UserRole[];
  children: React.ReactNode;
}> = ({ roles, children }) => {
  const { currentRole, isRecovery, isSuperAdmin } = useTenant();

  if (roles.includes(currentRole)) {
    return <>{children}</>;
  }

  // Gracefully redirect to the role's allowed default screen
  if (isRecovery) {
    return <Navigate to="/recovery" replace />;
  }
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Smart default landing router by role
const RoleLandingRedirect: React.FC = () => {
  const { isRecovery, isSuperAdmin } = useTenant();
  if (isRecovery) {
    return <Navigate to="/recovery" replace />;
  }
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const router = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/onboarding',
    element: (
      <RequireAuth>
        <OnboardingPage />
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <RequireTenant>
          <AppLayout />
        </RequireTenant>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <RoleLandingRedirect />,
      },
      {
        path: 'dashboard',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant', 'super_admin']}>
            <DashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'sales/new',
        element: (
          <RequireRole roles={['owner', 'manager']}>
            <PosCheckoutPage />
          </RequireRole>
        ),
      },
      {
        path: 'customers',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant']}>
            <CustomersPage />
          </RequireRole>
        ),
      },
      {
        path: 'products',
        element: (
          <RequireRole roles={['owner', 'manager']}>
            <ProductsPage />
          </RequireRole>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <RequireRole roles={['owner', 'manager']}>
            <SuppliersPage />
          </RequireRole>
        ),
      },
      {
        path: 'purchases',
        element: (
          <RequireRole roles={['owner', 'manager']}>
            <SuppliersPage />
          </RequireRole>
        ),
      },
      {
        path: 'inventory',
        element: (
          <RequireRole roles={['owner', 'manager']}>
            <InventoryPage />
          </RequireRole>
        ),
      },
      {
        path: 'contracts',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant']}>
            <ContractsPage />
          </RequireRole>
        ),
      },
      {
        path: 'installments/due',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant', 'super_admin']}>
            <DueInstallmentsPage />
          </RequireRole>
        ),
      },
      {
        path: 'payments',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant']}>
            <PaymentsPage />
          </RequireRole>
        ),
      },
      {
        path: 'recovery',
        element: (
          <RequireRole roles={['owner', 'manager', 'recovery', 'super_admin']}>
            <RecoveryPortalPage />
          </RequireRole>
        ),
      },
      {
        path: 'expenses',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant']}>
            <ExpensesPage />
          </RequireRole>
        ),
      },
      {
        path: 'reports',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant']}>
            <ReportsPage />
          </RequireRole>
        ),
      },
      {
        path: 'staff',
        element: (
          <RequireRole roles={['owner', 'manager']}>
            <StaffPage />
          </RequireRole>
        ),
      },
      {
        path: 'archives',
        element: (
          <RequireRole roles={['owner']}>
            <ArchivesPage />
          </RequireRole>
        ),
      },
      {
        path: 'settings',
        element: (
          <RequireRole roles={['owner', 'super_admin']}>
            <SettingsPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireRole roles={['super_admin']}>
            <PlatformAdminPage />
          </RequireRole>
        ),
      },
      {
        path: 'calculator',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant', 'recovery', 'super_admin']}>
            <CalculatorPage />
          </RequireRole>
        ),
      },
      {
        path: 'portal',
        element: (
          <RequireRole roles={['owner', 'manager', 'accountant', 'recovery', 'super_admin']}>
            <CustomerPortalPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <RoleLandingRedirect />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
