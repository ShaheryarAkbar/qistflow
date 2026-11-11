// ============================================================================
// Application Router: Connected Phase 1 Routes
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
        This module is scheduled for implementation in Phase 2 / Phase 3.
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
        element: <ModulePlaceholder title="Due Installments Sheet (Phase 2)" />,
      },
      {
        path: 'payments',
        element: <ModulePlaceholder title="Payments Ledger & Reversals (Phase 2)" />,
      },
      {
        path: 'recovery',
        element: <ModulePlaceholder title="Mobile Recovery Field Portal (Phase 2)" />,
      },
      {
        path: 'expenses',
        element: <ModulePlaceholder title="Shop Operating Expenses (Phase 3)" />,
      },
      {
        path: 'reports',
        element: <ModulePlaceholder title="Financial & Collection Reports (Phase 3)" />,
      },
      {
        path: 'archives',
        element: <ModulePlaceholder title="Data Portability, Backups & JSON (Phase 4)" />,
      },
      {
        path: 'staff',
        element: <ModulePlaceholder title="Staff & Roles Management (Phase 3)" />,
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
