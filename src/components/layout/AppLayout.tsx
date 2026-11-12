// ============================================================================
// Main Application Layout Shell with Role-Based Navigation & Demo Switcher
// ============================================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Calculator,
  ShieldAlert,
  Smartphone,
  Crown,
  Briefcase,
  Layers,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useTenant } from '@/app/providers/TenantContext';
import { UserRole } from '@/types';
import { QuickCalculatorModal } from '@/components/shared/QuickCalculatorModal';

export const AppLayout: React.FC = () => {
  const { t, language, toggleLanguage } = useI18n();
  const { currentUser, logout, isDemoUser, enableDemoMode, currentDemoRole } = useAuth();
  const {
    activeTenant,
    currentRole,
    isOwner,
    isManager,
    isAccountant,
    isRecovery,
    isSuperAdmin,
  } = useTenant();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDemoRoleSwitch = (role: UserRole) => {
    enableDemoMode(role);
    if (role === 'recovery') {
      navigate('/recovery');
    } else if (role === 'super_admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  // Build role-tailored navigation items
  const getNavItems = () => {
    // 1. Recovery Employee View (STRICTLY RESTRICTED)
    if (isRecovery) {
      return [
        {
          to: '/recovery',
          label: language === 'ur' ? 'ریکوری فیلڈ پورٹل' : 'Recovery Field Portal',
          icon: Coins,
          highlight: true,
        },
        {
          to: '/calculator',
          label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator',
          icon: Calculator,
        },
        {
          to: '/portal',
          label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook',
          icon: Smartphone,
        },
      ];
    }

    // 2. Platform Super-Admin View
    if (isSuperAdmin) {
      return [
        {
          to: '/admin',
          label: language === 'ur' ? 'پلیٹ فارم ایڈمن پورٹل' : 'Platform Super-Admin',
          icon: ShieldAlert,
          highlight: true,
        },
        {
          to: '/dashboard',
          label: t('nav.dashboard'),
          icon: LayoutDashboard,
        },
        {
          to: '/installments/due',
          label: t('nav.installments'),
          icon: CalendarClock,
        },
        {
          to: '/recovery',
          label: t('nav.recovery'),
          icon: Coins,
        },
        {
          to: '/calculator',
          label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator',
          icon: Calculator,
        },
        {
          to: '/portal',
          label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook',
          icon: Smartphone,
        },
        {
          to: '/settings',
          label: t('nav.settings'),
          icon: Settings,
        },
      ];
    }

    // 3. Accountant View (FINANCIAL ONLY)
    if (isAccountant) {
      return [
        { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/installments/due', label: t('nav.installments'), icon: CalendarClock, highlight: true },
        { to: '/payments', label: t('nav.payments'), icon: Receipt },
        { to: '/contracts', label: t('nav.contracts'), icon: FileText },
        { to: '/customers', label: t('nav.customers'), icon: Users },
        { to: '/expenses', label: t('nav.expenses'), icon: CreditCard },
        { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
        { to: '/calculator', label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator', icon: Calculator },
        { to: '/portal', label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook', icon: Smartphone },
      ];
    }

    // 4. Manager / Admin View
    if (isManager) {
      return [
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
        { to: '/staff', label: t('nav.staff'), icon: UserCheck },
        { to: '/calculator', label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator', icon: Calculator },
        { to: '/portal', label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook', icon: Smartphone },
      ];
    }

    // 5. Business Owner View (FULL UNRESTRICTED ACCESS)
    return [
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
      { to: '/calculator', label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator', icon: Calculator },
      { to: '/settings', label: t('nav.settings'), icon: Settings },
      { to: '/portal', label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook', icon: Smartphone },
    ];
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    switch (currentRole) {
      case 'owner':
        return language === 'ur' ? 'دکان دار (Owner)' : 'Shop Owner';
      case 'manager':
        return language === 'ur' ? 'منیجر (Manager)' : 'Shop Manager';
      case 'accountant':
        return language === 'ur' ? 'اکاؤنٹنٹ (Finance)' : 'Accountant';
      case 'recovery':
        return language === 'ur' ? 'ریکوری آفیسر (Field)' : 'Recovery Officer';
      case 'super_admin':
        return language === 'ur' ? 'پلیٹ فارم ایڈمن' : 'Platform Super-Admin';
      default:
        return currentRole;
    }
  };

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

      {/* Quick Calculator Modal Triggerable anywhere */}
      <QuickCalculatorModal
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
      />

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

        {/* Role Identity Tag */}
        <div
          style={{
            padding: '0.75rem 1rem',
            background: isRecovery ? '#fef3c7' : isSuperAdmin ? '#f1f5f9' : '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {isSuperAdmin ? (
            <ShieldAlert size={18} className="text-warning" />
          ) : isRecovery ? (
            <Coins size={18} className="text-warning" />
          ) : (
            <Store size={18} className="text-primary" />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isSuperAdmin
                ? 'QistFlow Platform Control'
                : language === 'ur' && activeTenant?.businessNameUr
                ? activeTenant.businessNameUr
                : activeTenant?.businessName || 'My Shop'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.125rem' }}>
              <span
                className={`badge ${
                  isOwner
                    ? 'badge-success'
                    : isManager
                    ? 'badge-info'
                    : isAccountant
                    ? 'badge-warning'
                    : isRecovery
                    ? 'badge-danger'
                    : 'badge-slate'
                }`}
                style={{ fontSize: '0.6875rem', padding: '0.1rem 0.35rem' }}
              >
                {getRoleLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">
            {isRecovery
              ? language === 'ur' ? 'ریکوری ایکشنز' : 'Recovery Actions'
              : isAccountant
              ? language === 'ur' ? 'مالیاتی مینیو' : 'Financial Menu'
              : isSuperAdmin
              ? language === 'ur' ? 'پلیٹ فارم مینیو' : 'Platform Menu'
              : 'Main Menu'}
          </div>

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
                {isDemoUser ? 'Demo Evaluation' : 'Online (Spark Free)'}
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
        {/* Top Demo Role Switcher Strip (Crucial for Demo Evaluation) */}
        {isDemoUser && (
          <div
            style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={14} className="text-warning" />
              <span style={{ fontWeight: 600 }}>
                {language === 'ur' ? 'کردار تبدیل کریں (Role Simulation):' : 'Demo Role Switcher:'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleDemoRoleSwitch('owner')}
                className={`btn btn-xs ${currentRole === 'owner' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                👑 {language === 'ur' ? 'دکان دار (Owner)' : 'Owner'}
              </button>
              <button
                onClick={() => handleDemoRoleSwitch('manager')}
                className={`btn btn-xs ${currentRole === 'manager' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                👔 {language === 'ur' ? 'مینیجر (Manager)' : 'Manager'}
              </button>
              <button
                onClick={() => handleDemoRoleSwitch('accountant')}
                className={`btn btn-xs ${currentRole === 'accountant' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                🧮 {language === 'ur' ? 'اکاؤنٹنٹ (Finance)' : 'Accountant'}
              </button>
              <button
                onClick={() => handleDemoRoleSwitch('recovery')}
                className={`btn btn-xs ${currentRole === 'recovery' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                🛵 {language === 'ur' ? 'ریکوری عملہ (Mobile)' : 'Recovery'}
              </button>
              <button
                onClick={() => handleDemoRoleSwitch('super_admin')}
                className={`btn btn-xs ${currentRole === 'super_admin' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                🛡️ {language === 'ur' ? 'سپر ایڈمن (Admin)' : 'Super-Admin'}
              </button>
            </div>
          </div>
        )}

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
            <div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {isSuperAdmin
                  ? 'QistFlow Platform Super-Admin'
                  : language === 'ur' && activeTenant?.businessNameUr
                  ? activeTenant.businessNameUr
                  : activeTenant?.businessName || t('app.name')}
              </h1>
              {isRecovery && (
                <div style={{ fontSize: '0.6875rem', color: '#b45309', fontWeight: 600 }}>
                  {language === 'ur' ? 'صرف مجاز فیلڈ ریکوری کھاتوں تک رسائی' : 'Restricted Mobile Field Portal'}
                </div>
              )}
            </div>
          </div>

          <div className="header-right">
            {/* Quick Universal Calculator Modal Button */}
            <button
              onClick={() => setCalculatorOpen(true)}
              className="btn btn-sm btn-outline text-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Open Quick Installment Calculator"
            >
              <Calculator size={15} />
              <span className="hidden sm:inline">
                {language === 'ur' ? 'حساب کتاب (Calculator)' : 'Calculator'}
              </span>
            </button>

            {/* Bilingual toggle button */}
            <button
              onClick={toggleLanguage}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Languages size={15} />
              <span>{t('app.switchLanguage')}</span>
            </button>

            {/* Quick POS action button (only for Owner & Manager) */}
            {(isOwner || isManager) && (
              <button
                onClick={() => navigate('/sales/new')}
                className="btn btn-sm btn-primary"
              >
                <PlusCircle size={15} />
                <span>{t('dashboard.newSale')}</span>
              </button>
            )}
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
