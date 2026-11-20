// ============================================================================
// Main Application Layout Shell with Mobile App Experience & High Contrast Switcher
// ============================================================================

import React, { useState, useEffect } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useTenant } from '@/app/providers/TenantContext';
import { UserRole } from '@/types';
import { QuickCalculatorModal } from '@/components/shared/QuickCalculatorModal';
export const AppLayout: React.FC = () => {
  const { t, language, toggleLanguage } = useI18n();
  const { currentUser, logout, isDemoUser } = useAuth();
  const {
    activeTenant,
    currentRole,
    isOwner,
    isManager,
    isAccountant,
    isRecovery,
    isSuperAdmin,
    hasPermission,
  } = useTenant();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build role-tailored navigation items
  const getNavItems = () => {
    // 1. Recovery Employee View (STRICTLY RESTRICTED TO FIELD RECOVERY)
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

    // 2. Platform Super-Admin View (STRICTLY SAAS GOVERNANCE - NO SHOP PRODUCTS/SALES/CALCULATOR/PASSBOOK)
    if (isSuperAdmin) {
      return [
        {
          to: '/admin',
          label: language === 'ur' ? 'پلیٹ فارم ایڈمن پورٹل' : 'Platform Super-Admin',
          icon: ShieldAlert,
          highlight: true,
        },
        {
          to: '/settings',
          label: language === 'ur' ? 'پلیٹ فارم سیٹنگز' : 'Platform Settings',
          icon: Settings,
        },
      ];
    }

    // 3. Accountant View (FINANCIAL ONLY & OWNER-CONFIGURABLE)
    if (isAccountant) {
      const items = [
        { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/installments/due', label: t('nav.installments'), icon: CalendarClock, highlight: true },
        { to: '/payments', label: t('nav.payments'), icon: Receipt },
      ];
      if (hasPermission('view_contracts')) {
        items.push({ to: '/contracts', label: t('nav.contracts'), icon: FileText });
      }
      if (hasPermission('view_customers')) {
        items.push({ to: '/customers', label: t('nav.customers'), icon: Users });
      }
      if (hasPermission('record_expenses')) {
        items.push({ to: '/expenses', label: t('nav.expenses'), icon: CreditCard });
      }
      if (hasPermission('view_financial_reports')) {
        items.push({ to: '/reports', label: t('nav.reports'), icon: BarChart3 });
      }
      items.push({
        to: '/calculator',
        label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator',
        icon: Calculator,
      });
      items.push({
        to: '/portal',
        label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook',
        icon: Smartphone,
      });
      return items;
    }

    // 4. Manager / Admin View (OPERATIONAL ACCESS & OWNER-CONFIGURABLE)
    if (isManager) {
      const items = [
        { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/sales/new', label: t('nav.pos'), icon: PlusCircle, highlight: true },
        { to: '/customers', label: t('nav.customers'), icon: Users },
        { to: '/contracts', label: t('nav.contracts'), icon: FileText },
        { to: '/installments/due', label: t('nav.installments'), icon: CalendarClock },
        { to: '/payments', label: t('nav.payments'), icon: Receipt },
      ];
      if (hasPermission('manage_products')) {
        items.push({ to: '/products', label: t('nav.products'), icon: Package });
      }
      if (hasPermission('manage_inventory')) {
        items.push({ to: '/inventory', label: t('nav.inventory'), icon: Boxes });
        items.push({ to: '/suppliers', label: t('nav.suppliers'), icon: Truck });
        items.push({ to: '/purchases', label: t('nav.purchases'), icon: ShoppingCart });
      }
      items.push({ to: '/expenses', label: t('nav.expenses'), icon: CreditCard });
      if (hasPermission('assign_recovery')) {
        items.push({ to: '/recovery', label: t('nav.recovery'), icon: Coins });
      }
      if (hasPermission('view_reports')) {
        items.push({ to: '/reports', label: t('nav.reports'), icon: BarChart3 });
      }
      if (hasPermission('can_manage_staff')) {
        items.push({ to: '/staff', label: t('nav.staff'), icon: UserCheck });
      }
      items.push({
        to: '/calculator',
        label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator',
        icon: Calculator,
      });
      items.push({
        to: '/portal',
        label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook',
        icon: Smartphone,
      });
      return items;
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
      { to: '/branches', label: language === 'ur' ? 'شاخیں و لائسنس (Branches)' : 'Shop Branches', icon: Store },
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

  // Render Mobile Bottom Bar (App-like navigation)
  const renderMobileBottomBar = () => {
    if (isRecovery) {
      return (
        <nav className="mobile-app-nav" aria-label="Mobile Navigation">
          <NavLink to="/recovery" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <Coins size={19} />
            <span>{language === 'ur' ? 'ریکوری' : 'Recovery'}</span>
          </NavLink>
          <NavLink to="/calculator" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <Calculator size={19} />
            <span>{language === 'ur' ? 'کیلکولیٹر' : 'Calculator'}</span>
          </NavLink>
          <NavLink to="/portal" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <Smartphone size={19} />
            <span>{language === 'ur' ? 'پاس بک' : 'Passbook'}</span>
          </NavLink>
          <button onClick={handleLogout} className="mobile-nav-btn text-danger">
            <LogOut size={19} />
            <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}</span>
          </button>
        </nav>
      );
    }

    if (isSuperAdmin) {
      return (
        <nav className="mobile-app-nav" aria-label="Mobile Navigation">
          <NavLink to="/admin" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={19} />
            <span>{language === 'ur' ? 'ایڈمن' : 'Admin'}</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <Settings size={19} />
            <span>{language === 'ur' ? 'سیٹنگز' : 'Settings'}</span>
          </NavLink>
          <button onClick={handleLogout} className="mobile-nav-btn text-danger">
            <LogOut size={19} />
            <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}</span>
          </button>
        </nav>
      );
    }

    if (isAccountant) {
      return (
        <nav className="mobile-app-nav" aria-label="Mobile Navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={19} />
            <span>{language === 'ur' ? 'ڈیش بورڈ' : 'Dashboard'}</span>
          </NavLink>
          <NavLink to="/installments/due" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <CalendarClock size={19} />
            <span>{language === 'ur' ? 'اقساط' : 'Dues'}</span>
          </NavLink>
          <NavLink to="/payments" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <Receipt size={19} />
            <span>{language === 'ur' ? 'وصولیاں' : 'Payments'}</span>
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <CreditCard size={19} />
            <span>{language === 'ur' ? 'اخراجات' : 'Expenses'}</span>
          </NavLink>
          <button onClick={() => setSidebarOpen(true)} className="mobile-nav-btn">
            <Menu size={19} />
            <span>{language === 'ur' ? 'مینیو' : 'Menu'}</span>
          </button>
        </nav>
      );
    }

    // Owner and Manager
    return (
      <nav className="mobile-app-nav" aria-label="Mobile Navigation">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={19} />
          <span>{language === 'ur' ? 'ڈیش بورڈ' : 'Home'}</span>
        </NavLink>
        <NavLink to="/sales/new" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
          <PlusCircle size={19} />
          <span>{language === 'ur' ? 'نئی سیل' : 'Sale'}</span>
        </NavLink>
        <NavLink to="/installments/due" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
          <CalendarClock size={19} />
          <span>{language === 'ur' ? 'اقساط' : 'Dues'}</span>
        </NavLink>
        <NavLink to="/payments" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
          <Receipt size={19} />
          <span>{language === 'ur' ? 'وصولیاں' : 'Collect'}</span>
        </NavLink>
        <button onClick={() => setSidebarOpen(true)} className="mobile-nav-btn">
          <Menu size={19} />
          <span>{language === 'ur' ? 'مینیو' : 'Menu'}</span>
        </button>
      </nav>
    );
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
            <div className="header-title-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                <h1
                  className="shop-title"
                  title={activeTenant?.businessName}
                >
                  {isSuperAdmin
                    ? 'QistFlow Control'
                    : language === 'ur' && activeTenant?.businessNameUr
                    ? activeTenant.businessNameUr
                    : activeTenant?.businessName || t('app.name')}
                </h1>
                {!isSuperAdmin && (
                  <span className="badge badge-slate hidden md:inline-flex" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                    {language === 'ur' ? 'مین برانچ' : 'Main'}
                  </span>
                )}
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
                  style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem', whiteSpace: 'nowrap' }}
                >
                  {getRoleLabel()}
                </span>
              </div>
              <div className="header-meta-user">
                {language === 'ur' ? 'لاگ ان:' : 'Logged in:'} <strong>{currentUser?.displayName || currentUser?.email}</strong>
              </div>
            </div>
          </div>

          <div className="header-right">
            {/* Quick Universal Calculator Modal Button (Shop Roles Only, Hidden for Super-Admin) */}
            {!isSuperAdmin && (
              <button
                onClick={() => setCalculatorOpen(true)}
                className="header-btn btn btn-outline text-primary"
                title={language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator'}
              >
                <Calculator size={15} />
                <span className="hidden md:inline">
                  {language === 'ur' ? 'حساب کتاب' : 'Calc'}
                </span>
              </button>
            )}

            {/* Bilingual toggle button */}
            <button
              onClick={toggleLanguage}
              className="header-btn btn btn-outline"
              title={language === 'ur' ? 'زبان تبدیل کریں' : 'Switch Language'}
            >
              <Languages size={15} />
              <span className="hidden md:inline">{t('app.switchLanguage')}</span>
              <span className="md:hidden font-bold text-xs">{language === 'ur' ? 'EN' : 'اردو'}</span>
            </button>

            {/* Quick POS action button (only for Shop Owner & Manager, never for Platform Super-Admin) */}
            {!isSuperAdmin && (isOwner || isManager) && (
              <button
                onClick={() => navigate('/sales/new')}
                className="header-btn btn btn-primary"
                title={language === 'ur' ? 'نئی قسط سیل' : 'New Installment Sale'}
              >
                <PlusCircle size={15} />
                <span className="hidden sm:inline">{t('dashboard.newSale')}</span>
              </button>
            )}

            {/* Direct Logout Button */}
            <button
              onClick={handleLogout}
              className="header-btn-icon-only btn btn-outline text-danger"
              title={language === 'ur' ? 'اکاؤنٹ لاگ آؤٹ کریں' : 'Log Out'}
            >
              <LogOut size={15} />
              <span className="hidden lg:inline">{language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="app-content">
          <Outlet />
        </main>

        {/* Native Mobile Bottom Navigation Bar (Visible on mobile/tablets) */}
        {renderMobileBottomBar()}
      </div>
    </div>
  );
};
