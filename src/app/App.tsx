// ============================================================================
// Root Application Component
// ============================================================================

import React from 'react';
import { I18nProvider } from '@/i18n/I18nContext';
import { AuthProvider } from './providers/AuthContext';
import { TenantProvider } from './providers/TenantContext';
import { AppRouter } from './router';

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <TenantProvider>
          <AppRouter />
        </TenantProvider>
      </AuthProvider>
    </I18nProvider>
  );
};
