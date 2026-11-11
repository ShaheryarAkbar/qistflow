// ============================================================================
// Main Application Layout Shell
// ============================================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  ShoppingCart,
  Boxes,
  PlusCircle,
  FileText,
  CalendarClock,
  Receipt,
  UserCheck,
  CreditCard,
  BarChart3,
  DownloadCloud,
  Settings,
  LogOut,
  Menu,
  X,
  Languages,
  Store,
  Coins,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useTenant } from '@/app/providers/TenantContext';

export const AppLayout: React.FC = () => {
  const { t, language, toggleLanguage } = useI18n();
  const { currentUser, logout, isDemoUser } = useAuth();
  const { activeTenant, isRecovery } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/sales/new', label: t('nav.pos'), icon: PlusCircle, highlight: true },
    { to: '/customers', label: t('nav.customers'), icon: Users },
    { to: '/contracts', label: t('nav.contracts'), icon: FileText },
    { to: '/installments/due', label: t('nav.installments'), icon: CalendarClock },
    { to: '/payments', label: t('nav.payments'), icon: Receipt },
    { to: '/products', label: t('nav.products'), icon: Package },
    { to: '/inventory', label: t('nav.inventory'), icon: Boxes },
    { to: '/suppliers', label: t('nav.suppliers'), icon: Truck },
    { to: '/purchases', label: t('nav.purchases'), icon: ShoppingCart },
    { to: '/expenses', label: t('nav.expenses'), icon: CreditCard },
    { to: '/recovery', label: t('nav.recovery'), icon: Coins },
    { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
    { to: '/archives', label: t('nav.archives'), icon: DownloadCloud },
    { to: '/staff', label: t('nav.staff'), icon: UserCheck },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="app-shell">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 35 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-brand">
            <div className="logo-icon">
              <Coins size={22} />
            </div>
            <div className="logo-text">
              {t('app.name')}
              <span className="logo-badge">{t('app.version')}</span>
            </div>
          </div>
          <button
            className="mobile-menu-btn btn btn-icon btn-secondary"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Shop identity tag */}
        <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Store size={18} className="text-primary" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {language === 'ur' && activeTenant?.businessNameUr
                ? activeTenant.businessNameUr
                : activeTenant?.businessName || 'My Shop'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
              {activeTenant?.city || 'Pakistan'}
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''} ${item.highlight ? 'font-semibold' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.displayName || currentUser?.email || 'User'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                {isDemoUser ? 'Demo Mode (Free)' : 'Online (Spark Free)'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-icon btn-outline text-danger"
              title={t('nav.logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="app-main">
        {/* Top Header */}
        <header className="app-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn btn btn-icon btn-secondary"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Navigation"
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
              {language === 'ur' && activeTenant?.businessNameUr
                ? activeTenant.businessNameUr
                : activeTenant?.businessName || t('app.name')}
            </h1>
          </div>

          <div className="header-right">
            {/* Bilingual toggle button */}
            <button
              onClick={toggleLanguage}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <Languages size={15} />
              <span>{t('app.switchLanguage')}</span>
            </button>

            {/* Quick POS action button */}
            <button
              onClick={() => navigate('/sales/new')}
              className="btn btn-sm btn-primary"
            >
              <PlusCircle size={15} />
              <span>{t('dashboard.newSale')}</span>
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

