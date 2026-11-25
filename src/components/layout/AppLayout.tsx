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
  MoreVertical,
  Lock,
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
    activeMembership,
    currentRole,
    isOwner,
    isManager,
    isAccountant,
    isRecovery,
    isSuperAdmin,
    isShopSuspended,
    shopBlockedReason,
    hasPermission,
  } = useTenant();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isShopBlocked = isShopSuspended && !isSuperAdmin;
  const isUserBlocked = !isShopBlocked && activeMembership?.membershipStatus === 'suspended' && !isOwner;

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    highlight?: boolean;
  }

  // Build role-tailored navigation items
  const getNavItems = (): NavItem[] => {
    // If shop itself is suspended by Super-Admin, or user account is suspended by Owner, hide all navigational items
    if (isShopBlocked || isUserBlocked) {
      return [];
    }

    // 1. Recovery Employee View (STRICTLY RESTRICTED TO FIELD RECOVERY BY DEFAULT, OWNER-EXPANDABLE)
    if (isRecovery) {
      const items: NavItem[] = [];
      if (hasPermission('module_recovery') || hasPermission('assigned_collections')) {
        items.push({
          to: '/recovery',
          label: language === 'ur' ? 'ریکوری فیلڈ پورٹل' : 'Recovery Field Portal',
          icon: Coins,
          highlight: true,
        });
      }
      if (hasPermission('module_customers') || hasPermission('view_customers')) {
        items.push({ to: '/customers', label: t('nav.customers'), icon: Users });
      }
      if (hasPermission('module_calculator') !== false) {
        items.push({
          to: '/calculator',
          label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator',
          icon: Calculator,
        });
      }
      items.push({
        to: '/portal',
        label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook',
        icon: Smartphone,
      });
      // Optional owner additions for recovery officer
      if (hasPermission('module_pos')) {
        items.push({ to: '/sales/new', label: t('nav.pos'), icon: PlusCircle });
      }
      if (hasPermission('module_payments')) {
        items.push({ to: '/payments', label: t('nav.payments'), icon: Receipt });
      }
      if (hasPermission('module_contracts')) {
        items.push({ to: '/contracts', label: t('nav.contracts'), icon: FileText });
      }
      return items;
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
      const items: NavItem[] = [
        { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
      ];
      if (hasPermission('module_installments')) {
        items.push({ to: '/installments/due', label: t('nav.installments'), icon: CalendarClock, highlight: true });
      }
      if (hasPermission('module_payments')) {
        items.push({ to: '/payments', label: t('nav.payments'), icon: Receipt });
      }
      if (hasPermission('module_contracts') || hasPermission('view_contracts')) {
        items.push({ to: '/contracts', label: t('nav.contracts'), icon: FileText });
      }
      if (hasPermission('module_customers') || hasPermission('view_customers')) {
        items.push({ to: '/customers', label: t('nav.customers'), icon: Users });
      }
      if (hasPermission('module_expenses') || hasPermission('record_expenses')) {
        items.push({ to: '/expenses', label: t('nav.expenses'), icon: CreditCard });
      }
      if (hasPermission('module_reports') || hasPermission('view_financial_reports')) {
        items.push({ to: '/reports', label: t('nav.reports'), icon: BarChart3 });
      }
      if (hasPermission('module_calculator')) {
        items.push({
          to: '/calculator',
          label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator',
          icon: Calculator,
        });
      }
      items.push({
        to: '/portal',
        label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook',
        icon: Smartphone,
      });
      return items;
    }

    // 4. Manager / Admin View (OPERATIONAL ACCESS & 100% OWNER-CONFIGURABLE)
    if (isManager) {
      const items: NavItem[] = [];
      // Dashboard (100% Owner-Governed)
      if (hasPermission('module_dashboard')) {
        items.push({ to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard });
      }
      if (hasPermission('module_pos')) {
        items.push({ to: '/sales/new', label: t('nav.pos'), icon: PlusCircle, highlight: true });
      }
      if (hasPermission('module_customers') || hasPermission('view_customers')) {
        items.push({ to: '/customers', label: t('nav.customers'), icon: Users });
      }
      if (hasPermission('module_contracts') || hasPermission('view_contracts')) {
        items.push({ to: '/contracts', label: t('nav.contracts'), icon: FileText });
      }
      if (hasPermission('module_installments')) {
        items.push({ to: '/installments/due', label: t('nav.installments'), icon: CalendarClock });
      }
      if (hasPermission('module_payments')) {
        items.push({ to: '/payments', label: t('nav.payments'), icon: Receipt });
      }
      // Product & Inventory (Individually Separated & Owner-Governed)
      if (hasPermission('module_products') || hasPermission('manage_products')) {
        items.push({ to: '/products', label: t('nav.products'), icon: Package });
      }
      if (hasPermission('module_inventory') || hasPermission('manage_inventory')) {
        items.push({ to: '/inventory', label: t('nav.inventory'), icon: Boxes });
      }
      // Supplier (100% Owner-Governed)
      if (hasPermission('module_suppliers')) {
        items.push({ to: '/suppliers', label: t('nav.suppliers'), icon: Truck });
      }
      // Purchase (100% Owner-Governed)
      if (hasPermission('module_purchases')) {
        items.push({ to: '/purchases', label: t('nav.purchases'), icon: ShoppingCart });
      }
      if (hasPermission('module_expenses') || hasPermission('record_expenses')) {
        items.push({ to: '/expenses', label: t('nav.expenses'), icon: CreditCard });
      }
      // Recovery Portal (100% Owner-Governed)
      if (hasPermission('module_recovery') || hasPermission('assign_recovery')) {
        items.push({ to: '/recovery', label: t('nav.recovery'), icon: Coins });
      }
      // Reports (100% Owner-Governed)
      if (hasPermission('module_reports') || hasPermission('view_reports')) {
        items.push({ to: '/reports', label: t('nav.reports'), icon: BarChart3 });
      }
      // Staff & Roles (100% Owner-Governed)
      if (hasPermission('module_staff') || hasPermission('can_manage_staff')) {
        items.push({ to: '/staff', label: t('nav.staff'), icon: UserCheck });
      }
      if (hasPermission('module_calculator')) {
        items.push({
          to: '/calculator',
          label: language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator',
          icon: Calculator,
        });
      }
      // Customer Passbook (100% Owner-Governed)
      if (hasPermission('module_portal') || hasPermission('module_passbook') || hasPermission('action_view_passbook')) {
        items.push({
          to: '/portal',
          label: language === 'ur' ? 'کسٹمر پاس بک (پیش نظارہ)' : 'Customer Passbook',
          icon: Smartphone,
        });
      }
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
    if (isShopBlocked || isUserBlocked) {
      return null;
    }

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
          style={{ zIndex: 65 }}
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
              {/* Line 1: Shop Name (Full clean width) */}
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

              {/* Line 2: Status Badges & User Identity Subline */}
              <div className="header-meta-subline">
                {!isSuperAdmin && (
                  <span className="badge badge-slate" style={{ fontSize: '0.625rem', padding: '0.08rem 0.35rem', whiteSpace: 'nowrap' }}>
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
                  style={{ fontSize: '0.625rem', padding: '0.08rem 0.35rem', whiteSpace: 'nowrap' }}
                >
                  {getRoleLabel()}
                </span>
                <span className="meta-dot hidden lg:inline">•</span>
                <span className="meta-user hidden lg:inline">
                  {language === 'ur' ? 'لاگ ان:' : 'Logged in:'} <strong>{currentUser?.displayName || currentUser?.email}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="header-right">
            {/* Desktop Action Buttons (Visible on Laptop & Desktop >= 1024px) */}
            <div className="header-desktop-actions">
              {!isSuperAdmin && (
                <button
                  onClick={() => setCalculatorOpen(true)}
                  className="header-btn btn btn-outline text-primary"
                  title={language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator'}
                >
                  <Calculator size={15} />
                  <span>{language === 'ur' ? 'حساب کتاب' : 'Calc'}</span>
                </button>
              )}

              <button
                onClick={toggleLanguage}
                className="header-btn btn btn-outline"
                title={language === 'ur' ? 'زبان تبدیل کریں' : 'Switch Language'}
              >
                <Languages size={15} />
                <span>{t('app.switchLanguage')}</span>
              </button>

              <button
                onClick={handleLogout}
                className="header-btn btn btn-outline text-danger"
                title={language === 'ur' ? 'اکاؤنٹ لاگ آؤٹ کریں' : 'Log Out'}
              >
                <LogOut size={15} />
                <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}</span>
              </button>
            </div>

            {/* Mobile / Tablet Compact Action Bar (< 1024px) */}
            <div className="header-mobile-actions">
              {/* Quick Language Switcher Icon on Mobile */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="btn btn-icon btn-outline"
                style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                title={language === 'ur' ? 'English' : 'اردو'}
                aria-label="Switch Language"
              >
                <Languages size={17} />
              </button>

              {/* 3-Dots Mobile Actions Toggle */}
              <button
                type="button"
                onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
                className={`btn btn-icon ${mobileActionsOpen ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                aria-label="More Actions"
                title={language === 'ur' ? 'مزید اختیارات و مینیو' : 'More Options'}
              >
                <MoreVertical size={18} />
              </button>

              {/* Mobile Actions Dropdown Menu */}
              {mobileActionsOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                    onClick={() => setMobileActionsOpen(false)}
                  />
                  <div
                    className="card"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: language === 'ur' ? 'auto' : 0,
                      left: language === 'ur' ? 0 : 'auto',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.75rem',
                      boxShadow: '0 12px 28px -4px rgba(0,0,0,0.18)',
                      minWidth: '230px',
                      padding: '0.5rem',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    {/* Header User Badge in Dropdown */}
                    <div style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.25rem' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        {currentUser?.displayName || currentUser?.email}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        {getRoleLabel()} • {activeTenant?.businessName}
                      </div>
                    </div>

                    {/* Quick Calculator Option */}
                    {!isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setCalculatorOpen(true);
                          setMobileActionsOpen(false);
                        }}
                        className="btn btn-sm btn-outline"
                        style={{ justifyContent: 'flex-start', border: 'none', background: '#f8fafc', padding: '0.5rem 0.75rem', gap: '0.5rem', width: '100%' }}
                      >
                        <Calculator size={16} className="text-primary" />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{language === 'ur' ? 'حساب کتاب کیلکولیٹر' : 'Installment Calculator'}</span>
                      </button>
                    )}

                    {/* New Sale (POS) Option for Owner / Manager */}
                    {!isSuperAdmin && (isOwner || isManager) && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/sales/new');
                          setMobileActionsOpen(false);
                        }}
                        className="btn btn-sm btn-outline text-primary"
                        style={{ justifyContent: 'flex-start', border: 'none', background: '#f0fdf4', padding: '0.5rem 0.75rem', gap: '0.5rem', width: '100%' }}
                      >
                        <PlusCircle size={16} className="text-primary" />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t('dashboard.newSale')}</span>
                      </button>
                    )}

                    {/* Language Switcher Option */}
                    <button
                      type="button"
                      onClick={() => {
                        toggleLanguage();
                        setMobileActionsOpen(false);
                      }}
                      className="btn btn-sm btn-outline"
                      style={{ justifyContent: 'flex-start', border: 'none', background: '#f8fafc', padding: '0.5rem 0.75rem', gap: '0.5rem', width: '100%' }}
                    >
                      <Languages size={16} className="text-primary" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t('app.switchLanguage')}</span>
                        <span className="badge badge-slate" style={{ fontSize: '0.6875rem' }}>{language === 'ur' ? 'English' : 'اردو'}</span>
                      </div>
                    </button>

                    {/* Customer Passbook Link */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/portal');
                        setMobileActionsOpen(false);
                      }}
                      className="btn btn-sm btn-outline"
                      style={{ justifyContent: 'flex-start', border: 'none', background: '#f8fafc', padding: '0.5rem 0.75rem', gap: '0.5rem', width: '100%' }}
                    >
                      <Smartphone size={16} className="text-primary" />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{language === 'ur' ? 'کسٹمر پاس بک' : 'Customer Passbook'}</span>
                    </button>

                    {/* Direct Logout Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileActionsOpen(false);
                        handleLogout();
                      }}
                      className="btn btn-sm btn-outline text-danger"
                      style={{ justifyContent: 'flex-start', border: 'none', background: '#fef2f2', padding: '0.5rem 0.75rem', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}
                    >
                      <LogOut size={16} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{language === 'ur' ? 'اکاؤنٹ لاگ آؤٹ' : 'Logout'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="app-content">
          {isShopBlocked ? (
            <div
              className="card"
              style={{
                maxWidth: '620px',
                margin: '2rem auto',
                padding: '2.5rem 2rem',
                textAlign: 'center',
                border: '2px solid #ef4444',
                backgroundColor: '#fef2f2',
                borderRadius: '1rem',
                boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.15)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 1.25rem',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                }}
              >
                <Lock size={34} />
              </div>
              <span className="badge badge-danger mb-2" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                {language === 'ur' ? 'پلیٹ فارم سپر ایڈمن کی طرف سے دکان معطل' : 'Shop Suspended by Platform Admin'}
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: '0.5rem 0 0' }}>
                {activeTenant?.businessNameUr || activeTenant?.businessName}
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#b91c1c', fontWeight: 600, marginTop: '0.25rem' }}>
                {language === 'ur'
                  ? 'اس دکان کی تمام سرگرمیاں اور تمام یوزرز کے لاگ انز عارضی طور پر معطل ہیں'
                  : 'All shop operations and staff accounts are temporarily suspended'}
              </p>

              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  margin: '1.25rem 0',
                  border: '1px solid #fecaca',
                  textAlign: language === 'ur' ? 'right' : 'left',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {language === 'ur' ? 'معطلی کی وجہ (Suspension Reason):' : 'Suspension Reason:'}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5, fontWeight: 500 }}>
                  {shopBlockedReason ||
                    (language === 'ur'
                      ? 'سافٹ ویئر لائسنس کی تجدید یا فیس کی عدم ادائیگی کی بنا پر سپر ایڈمن نے دکان کو بلاک کر دیا ہے۔'
                      : 'The shop account has been locked due to overdue subscription dues or licence renewal.')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.75rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem' }}>
                  {language === 'ur'
                    ? 'نوٹ: مالک، منیجر، اکاؤنٹنٹ اور ریکوری ایجنٹ سمیت کسی بھی رکن کو پورٹل استعمال کرنے کی اجازت نہیں ہے۔ سروس بحال کروانے کے لیے ہیلپ لائن 0300-1234567 یا سپر ایڈمن سے رابطہ کریں۔'
                    : 'Notice: Access is completely blocked for Owner, Manager, Accountant, and Recovery officers. Contact Super-Admin at 0300-1234567 to reactivate.'}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-danger"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', fontWeight: 600 }}
              >
                <LogOut size={16} />
                <span>{language === 'ur' ? 'اکاؤنٹ لاگ آؤٹ کریں' : 'Sign Out'}</span>
              </button>
            </div>
          ) : isUserBlocked ? (
            <div
              className="card"
              style={{
                maxWidth: '560px',
                margin: '2rem auto',
                padding: '2rem',
                textAlign: 'center',
                border: '2px solid #ef4444',
                backgroundColor: '#fef2f2',
                borderRadius: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  margin: 'auto',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  marginBottom: '1rem',
                }}
              >
                <ShieldAlert size={30} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                {language === 'ur'
                  ? 'آپ کا اکاؤنٹ دکان انتظامیہ کی طرف سے معطل / بلاک کر دیا گیا ہے'
                  : 'Account Suspended by Shop Administration'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#7f1d1d', marginTop: '0.5rem', lineHeight: 1.6 }}>
                {language === 'ur'
                  ? 'دکان کے مالک نے آپ کی رسائی عارضی طور پر بند کی ہے۔ دوبارہ بحال کروانے کے لیے دکان کے مالک یا ایڈمن سے رابطہ کریں۔'
                  : 'The business owner has temporarily locked your access privileges. Please contact the shop owner to reactivate your account.'}
              </p>
              <button
                onClick={handleLogout}
                className="btn btn-danger"
                style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <LogOut size={16} />
                <span>{language === 'ur' ? 'اکاؤنٹ لاگ آؤٹ کریں' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* Native Mobile Bottom Navigation Bar (Visible on mobile/tablets) */}
        {renderMobileBottomBar()}
      </div>
    </div>
  );
};
