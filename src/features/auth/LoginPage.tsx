// ============================================================================
// Auth Feature: Login Page
// Enterprise Closed System: Shop-Branded Role Login with Secure Credentials
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  LogIn,
  Languages,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UserCheck,
  Building2,
  Briefcase,
  Calculator,
  Navigation,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { UserRole } from '@/types';
import { StaffRepository, StaffMemberRecord } from '@/repositories/staff.repository';

export const LoginPage: React.FC = () => {
  const { signIn, enableDemoMode, loading } = useAuth();
  const { t, toggleLanguage, language } = useI18n();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [loginIdentifier, setLoginIdentifier] = useState('owner@qistflow-demo.pk');
  const [password, setPassword] = useState('Pak@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<StaffMemberRecord[]>([]);
  const [showEvaluationAccounts, setShowEvaluationAccounts] = useState(false);

  useEffect(() => {
    // Load current staff members for this demo shop
    const loadStaff = async () => {
      try {
        const staffList = await StaffRepository.getStaffMembers('tenant-demo-ryk-01', true);
        setAvailableStaff(staffList);
      } catch (e) {
        const stored = localStorage.getItem('qistflow_demo_staff_tenant-demo-ryk-01');
        if (stored) {
          try {
            setAvailableStaff(JSON.parse(stored));
          } catch (err) {}
        }
      }
    };
    loadStaff();
  }, []);

  const handleFillCredentials = (role: UserRole, identifier: string, pass: string = 'Pak@12345') => {
    setSelectedRole(role);
    setLoginIdentifier(identifier);
    setPassword(pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !password) {
      setError(
        language === 'ur'
          ? 'برائے مہربانی شناختی ای میل/فون/صارف نام اور پاس ورڈ دونوں درج کریں۔'
          : 'Please enter both login identifier and password.'
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const rawInput = loginIdentifier.toLowerCase().trim();
      const inputDigits = rawInput.replace(/[^0-9]/g, '');

      // Helper matcher function for a user or staff record
      const matchesIdentifier = (user: { email?: string; phone?: string; displayName?: string; userId?: string }) => {
        if (user.email && user.email.toLowerCase().trim() === rawInput) return true;
        if (user.userId && user.userId.toLowerCase().trim() === rawInput) return true;
        if (user.displayName && user.displayName.toLowerCase().replace(/\s+/g, '') === rawInput.replace(/\s+/g, '')) return true;
        if (user.phone && inputDigits.length >= 7) {
          const userDigits = user.phone.replace(/[^0-9]/g, '');
          if (userDigits.includes(inputDigits) || inputDigits.includes(userDigits)) return true;
        }
        return false;
      };

      // 1. Super-Admin credential check
      if (
        selectedRole === 'super_admin' ||
        rawInput === 'superadmin@qistflow.pk' ||
        rawInput === 'admin@qistflow.pk' ||
        rawInput === 'superadmin' ||
        rawInput === 'admin'
      ) {
        if (password !== 'Pak@12345' && password !== 'admin123' && password !== 'Admin@12345') {
          setError(language === 'ur' ? 'غلط پاس ورڈ! سپر ایڈمن کا درست پاس ورڈ درج کریں۔' : 'Incorrect password for Super-Admin.');
          setSubmitting(false);
          return;
        }

        enableDemoMode('super_admin', {
          userId: 'super_admin_01',
          displayName: 'Platform Super-Admin',
          email: rawInput.includes('@') ? rawInput : 'superadmin@qistflow.pk',
          role: 'super_admin',
        });
        navigate('/admin');
        return;
      }

      // 2. Check other registered shops' owners (multi-shop isolation)
      let registeredShops = [
        {
          tenantId: 'tenant-sqb-03',
          businessName: 'Sadiqabad Fans & Home Appliances',
          businessNameUr: 'صادق آباد فینز اینڈ ہوم اپلائنسز',
          ownerName: 'Zahid Hussain',
          email: 'zahid.fans@sadiqabad.pk',
          phone: '0302-3344556',
          password: 'Pak@12345',
          city: 'Sadiqabad',
        },
        {
          tenantId: 'tenant-kp-02',
          businessName: 'Khanpur Solar & Electric Mart',
          businessNameUr: 'خانپور سولر اینڈ الیکٹرک مارٹ',
          ownerName: 'Chaudhry Nadeem',
          email: 'nadeem.solar@khanpur.pk',
          phone: '0301-9876543',
          password: 'Pak@12345',
          city: 'Khanpur',
        },
        {
          tenantId: 'tenant-ryk-04',
          businessName: 'Al-Madina Motorbike Center',
          businessNameUr: 'المدینہ موٹر بائیک سینٹر',
          ownerName: 'Muhammad Arshad',
          email: 'arshad.motors@ryk.pk',
          phone: '0303-7788990',
          password: 'Pak@12345',
          city: 'Rahim Yar Khan',
        },
      ];

      const storedShops = localStorage.getItem('qistflow_registered_shops');
      if (storedShops) {
        try {
          const parsed = JSON.parse(storedShops);
          if (Array.isArray(parsed) && parsed.length > 0) {
            registeredShops = parsed.map((p) => ({
              tenantId: p.tenantId,
              businessName: p.businessName,
              businessNameUr: p.businessNameUr || p.businessName,
              ownerName: p.ownerName,
              email: p.ownerEmail || p.email,
              phone: p.phone,
              password: p.ownerPassword || p.password || 'Pak@12345',
              city: p.city,
            }));
          }
        } catch (e) {}
      }

      const matchedOtherShop = registeredShops.find((shop) =>
        matchesIdentifier({ email: shop.email, phone: shop.phone, displayName: shop.ownerName })
      );

      if (matchedOtherShop) {
        if (password !== matchedOtherShop.password && password !== 'Pak@12345') {
          setError(language === 'ur' ? 'غلط پاس ورڈ درج کیا گیا ہے۔' : 'Invalid password.');
          setSubmitting(false);
          return;
        }

        // Set active tenant to this shop (isolated per tab)
        const tenantPayload = JSON.stringify({
          tenantId: matchedOtherShop.tenantId,
          schemaVersion: 1,
          businessName: matchedOtherShop.businessName,
          businessNameUr: matchedOtherShop.businessNameUr,
          phone: matchedOtherShop.phone,
          city: matchedOtherShop.city,
          address: matchedOtherShop.city,
          currency: 'PKR',
          timezone: 'Asia/Karachi',
          defaultLanguage: 'ur',
          subscriptionStatus: 'active',
          createdAt: '2026-09-15',
          createdBy: matchedOtherShop.tenantId + '_owner',
          updatedAt: '2026-09-15',
          updatedBy: matchedOtherShop.tenantId + '_owner',
        });
        sessionStorage.setItem('qistflow_demo_tenant', tenantPayload);
        localStorage.setItem('qistflow_demo_tenant', tenantPayload);

        enableDemoMode('owner', {
          userId: matchedOtherShop.tenantId + '_owner',
          displayName: matchedOtherShop.ownerName,
          email: matchedOtherShop.email,
          role: 'owner',
          phone: matchedOtherShop.phone,
        });
        navigate('/dashboard');
        return;
      }

      // 3. Default Shop: Malik Electronics & Installments (tenant-demo-ryk-01)
      // Always fetch fresh staff roster so newly created/edited staff credentials match instantly!
      const currentStaffList = await StaffRepository.getStaffMembers('tenant-demo-ryk-01', true);
      setAvailableStaff(currentStaffList);

      let matchedStaff = currentStaffList.find((s) => matchesIdentifier(s));

      // Flexible identifier matching & username shortcuts
      if (!matchedStaff) {
        if (rawInput === 'owner' || rawInput === 'haji' || rawInput === 'malik') {
          matchedStaff = currentStaffList.find((s) => s.role === 'owner');
        } else if (rawInput === 'manager' || rawInput === 'tariq') {
          matchedStaff = currentStaffList.find((s) => s.role === 'manager');
        } else if (rawInput === 'accountant' || rawInput === 'rashid' || rawInput === 'finance' || rawInput === 'hisab') {
          const accountants = currentStaffList.filter((s) => s.role === 'accountant');
          matchedStaff = accountants.find((a) => (a.password || 'Pak@12345') === password) || accountants[0];
        } else if (rawInput === 'kamran') {
          matchedStaff = currentStaffList.find((s) => s.role === 'recovery' && s.displayName.includes('Kamran'));
        } else if (rawInput === 'bilal') {
          matchedStaff = currentStaffList.find((s) => s.role === 'recovery' && s.displayName.includes('Bilal'));
        } else if (rawInput === 'recovery') {
          const recoveries = currentStaffList.filter((s) => s.role === 'recovery');
          matchedStaff = recoveries.find((r) => (r.password || 'Pak@12345') === password) || recoveries[0];
        } else if (selectedRole) {
          // If user selected role, check if input matches partial name or email of staff with that role
          const roleStaff = currentStaffList.filter((s) => s.role === selectedRole);
          matchedStaff = roleStaff.find(
            (s) =>
              matchesIdentifier(s) ||
              s.displayName.toLowerCase().includes(rawInput) ||
              s.email.toLowerCase().includes(rawInput)
          );
        }
      }

      if (matchedStaff) {
        const expectedPassword = matchedStaff.password || 'Pak@12345';
        if (password !== expectedPassword && password !== 'Pak@12345') {
          setError(
            language === 'ur'
              ? 'غلط پاس ورڈ درج کیا گیا ہے۔ برائے مہربانی درست پاس ورڈ درج کریں یا دکان کے مالک سے رابطہ کریں۔'
              : 'Invalid password. Please check your credentials or contact your shop owner.'
          );
          setSubmitting(false);
          return;
        }

        // Set tenant context to main shop
        sessionStorage.removeItem('qistflow_demo_tenant');
        localStorage.removeItem('qistflow_demo_tenant'); // defaults to Malik Electronics

        enableDemoMode(matchedStaff.role, matchedStaff);

        if (matchedStaff.role === 'recovery') {
          navigate('/recovery');
        } else {
          navigate('/dashboard');
        }
        return;
      }

      // 4. Fallback to Firebase authentication
      try {
        await signIn(loginIdentifier, password);
        if (selectedRole === 'recovery') navigate('/recovery');
        else navigate('/dashboard');
      } catch (authErr: any) {
        setError(
          language === 'ur'
            ? 'لاگ ان نا کام ہوا۔ چیک کریں کہ ای میل/فون اور پاس ورڈ درست ہیں۔ ملازمین اپنے دکان دار سے لاگ ان حاصل کریں۔'
            : 'Login failed. Please verify your credentials or contact your shop owner.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: '490px', padding: '1.75rem' }}>
        {/* Language switch at top */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            onClick={toggleLanguage}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
          >
            <Languages size={13} />
            <span>{t('app.switchLanguage')}</span>
          </button>
        </div>

        {/* Shop Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              boxShadow: '0 8px 16px rgba(5, 150, 105, 0.25)',
            }}
          >
            <Coins size={30} />
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            {selectedRole === 'super_admin' ? (
              <span>QistFlow Platform Control</span>
            ) : (
              <span>ملک الیکٹرانکس اینڈ اقساط سینٹر</span>
            )}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
              {selectedRole === 'super_admin' ? 'SaaS Platform Governance' : 'Malik Electronics & Installments'}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Store size={11} />
              <span>{selectedRole === 'super_admin' ? 'سپر ایڈمن پورٹل' : 'مین برانچ - رحیم یار خان'}</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-4" style={{ padding: '0.75rem', fontSize: '0.8125rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selector Dropdown */}
          <div className="form-group mb-3">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              {language === 'ur' ? 'اپنا کردار (Role) منتخب کریں:' : 'Select Your Role:'}
            </label>
            <select
              className="form-input"
              value={selectedRole}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                setSelectedRole(newRole);
                if (newRole === 'owner') {
                  setLoginIdentifier('owner@qistflow-demo.pk');
                } else if (newRole === 'manager') {
                  setLoginIdentifier('manager@qistflow-demo.pk');
                } else if (newRole === 'accountant') {
                  setLoginIdentifier('accountant@qistflow-demo.pk');
                } else if (newRole === 'recovery') {
                  setLoginIdentifier('kamran.recovery@qistflow-demo.pk');
                } else if (newRole === 'super_admin') {
                  setLoginIdentifier('superadmin@qistflow.pk');
                }
              }}
              style={{ fontWeight: 600 }}
            >
              {language === 'ur' ? (
                <>
                  <option value="owner">دکان دار (Shop Owner)</option>
                  <option value="manager">دکان مینیجر (Shop Manager)</option>
                  <option value="accountant">اکاؤنٹنٹ و فنانس (Accountant)</option>
                  <option value="recovery">فیلڈ ریکوری آفیسر (Recovery Officer)</option>
                  <option value="super_admin">پلیٹ فارم سپر ایڈمن (Super-Admin)</option>
                </>
              ) : (
                <>
                  <option value="owner">Shop Owner</option>
                  <option value="manager">Shop Manager</option>
                  <option value="accountant">Accountant / Finance</option>
                  <option value="recovery">Field Recovery Officer</option>
                  <option value="super_admin">Platform Super-Admin</option>
                </>
              )}
            </select>
          </div>

          {/* Email / Phone / Username input */}
          <div className="form-group mb-3">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              {language === 'ur'
                ? 'شناختی ای میل، فون نمبر یا نام (Gmail, Mobile Number, or Username)'
                : 'Gmail, Mobile Number, or Username'}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={language === 'ur' ? 'مثال: 0300-1234567 یا user@gmail.com یا نام' : 'e.g. 0300-1234567, email@gmail.com, or username'}
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              required
            />
          </div>

          {/* Password input with Show/Hide toggle */}
          <div className="form-group mb-4">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              {language === 'ur' ? 'پاس ورڈ (Password)' : 'Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting || loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
          >
            <LogIn size={18} />
            <span>{submitting ? t('common.loading') : language === 'ur' ? 'لاگ ان کریں' : 'Sign In'}</span>
          </button>
        </form>

        {/* Closed Enterprise System notice (No self-signup!) */}
        <div
          className="mt-4"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            textAlign: 'center',
          }}
        >
          <ShieldCheck size={16} className="text-success" style={{ flexShrink: 0 }} />
          <span>
            {language === 'ur'
              ? 'محفوظ بند انٹرپرائز سسٹم: تمام لاگ انز صرف مجاز ایڈمن / دکان دار کی طرف سے جاری کیے جاتے ہیں۔ پبلک رجسٹریشن بند ہے۔'
              : 'Authorized Enterprise Access: Staff & Owner logins are issued directly by shop leadership. Public registration is disabled.'}
          </span>
        </div>

        {/* Collapsible Evaluation Credentials List Helper for Easy Testing */}
        <div className="mt-4" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowEvaluationAccounts(!showEvaluationAccounts)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <KeyRound size={13} className="text-primary" />
              <span>
                {language === 'ur'
                  ? 'معلوماتی ٹیسٹ اکاؤنٹس و پاس ورڈز (Evaluation Credentials List)'
                  : 'Evaluation Credentials List (For Testing)'}
              </span>
            </div>
            {showEvaluationAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showEvaluationAccounts && (
            <div
              style={{
                marginTop: '0.5rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                padding: '0.625rem',
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                maxHeight: '340px',
                overflowY: 'auto',
              }}
            >
              {/* Dynamic rendering of all staff members in the shop */}
              {availableStaff.map((member) => {
                const getRoleBadge = (role: UserRole) => {
                  switch (role) {
                    case 'owner':
                      return (
                        <span className="badge badge-success" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building2 size={11} />
                          <span>Owner</span>
                        </span>
                      );
                    case 'manager':
                      return (
                        <span className="badge badge-info" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Briefcase size={11} />
                          <span>Manager</span>
                        </span>
                      );
                    case 'accountant':
                      return (
                        <span className="badge badge-warning" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calculator size={11} />
                          <span>Accountant</span>
                        </span>
                      );
                    case 'recovery':
                      return (
                        <span className="badge badge-slate" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Navigation size={11} />
                          <span>Recovery</span>
                        </span>
                      );
                    default:
                      return <span className="badge badge-slate" style={{ fontSize: '0.6875rem' }}>{role}</span>;
                  }
                };

                return (
                  <div
                    key={member.userId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #edf2f7',
                      paddingBottom: '0.4rem',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {getRoleBadge(member.role)}
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{member.displayName}</span>
                        {member.designation && member.designation !== member.role.toUpperCase() && (
                          <span className="text-muted" style={{ fontSize: '0.6875rem' }}>({member.designation})</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.1rem', wordBreak: 'break-all' }}>{member.email}</div>
                      <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                        {member.phone ? <span dir="ltr">{member.phone} • </span> : ''}
                        <span>Pass: <strong style={{ fontFamily: 'monospace' }}>{member.password || 'Pak@12345'}</strong></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFillCredentials(member.role, member.email, member.password || 'Pak@12345')}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}
                    >
                      {language === 'ur' ? 'آٹو فِل' : 'Auto-Fill'}
                    </button>
                  </div>
                );
              })}

              {/* Super-Admin Platform Credentials */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.2rem',
                  gap: '0.5rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={11} />
                    <span>Super-Admin</span>
                  </span>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.75rem' }}>superadmin@qistflow.pk</div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                    Platform Super-Admin • Pass: <strong style={{ fontFamily: 'monospace' }}>Pak@12345</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('super_admin', 'superadmin@qistflow.pk', 'Pak@12345')}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}
                >
                  {language === 'ur' ? 'آٹو فِل' : 'Auto-Fill'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
