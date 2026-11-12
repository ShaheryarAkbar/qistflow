// ============================================================================
// Application Router: Connected Phase 1, Phase 2 & Phase 3 Routes
// ============================================================================

import React from 'react';
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from './providers/AuthContext';
import { useTenant } from './providers/TenantContext';
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

const ModulePlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="card">
    <div className="card-header">
      <h3 className="card-title">{title}</h3>
    </div>
    <div className="card-body text-center" style={{ padding: '3rem 1rem' }}>
      <p className="text-muted mb-4">
        This module is scheduled for implementation in Phase 4.
      </p>
      <span className="badge badge-info">Next Phase</span>
    </div>
  </div>
);

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
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'suppliers',
        element: <SuppliersPage />,
      },
      {
        path: 'purchases',
        element: <SuppliersPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'sales/new',
        element: <PosCheckoutPage />,
      },
      {
        path: 'contracts',
        element: <ContractsPage />,
      },
      {
        path: 'installments/due',
        element: <DueInstallmentsPage />,
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
      {
        path: 'recovery',
        element: <RecoveryPortalPage />,
      },
      {
        path: 'expenses',
        element: <ExpensesPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'staff',
        element: <StaffPage />,
      },
      {
        path: 'archives',
        element: <ArchivesPage />,
      },
      {
        path: 'settings',
        element: <ModulePlaceholder title="Shop Settings & Preferences" />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
