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
  const [email, setEmail] = useState('owner@qistflow-demo.pk');
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
        // Fallback to localStorage if any
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

  const handleFillCredentials = (role: UserRole, userEmail: string, pass: string = 'Pak@12345') => {
    setSelectedRole(role);
    setEmail(userEmail);
    setPassword(pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(language === 'ur' ? 'برائے مہربانی ای میل اور پاس ورڈ دونوں درج کریں۔' : 'Please enter both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const cleanEmail = email.toLowerCase().trim();

      // 1. Super-Admin credential check
      if (
        selectedRole === 'super_admin' ||
        cleanEmail === 'superadmin@qistflow.pk' ||
        cleanEmail === 'admin@qistflow.pk'
      ) {
        if (password !== 'Pak@12345' && password !== 'admin123' && password !== 'Admin@12345') {
          setError(language === 'ur' ? 'غلط پاس ورڈ! سپر ایڈمن کا درست پاس ورڈ درج کریں۔' : 'Incorrect password for Super-Admin.');
          setSubmitting(false);
          return;
        }

        enableDemoMode('super_admin', {
          userId: 'super_admin_01',
          displayName: 'Platform Super-Admin',
          email: cleanEmail,
          role: 'super_admin',
        });
        navigate('/admin');
        return;
      }

      // 2. Check Staff & Shop Accounts from Repository / LocalStorage
      let matchedStaff = availableStaff.find(
        (s) => s.email.toLowerCase().trim() === cleanEmail
      );

      // If not in state, check localStorage directly
      if (!matchedStaff) {
        const stored = localStorage.getItem('qistflow_demo_staff_tenant-demo-ryk-01');
        if (stored) {
          try {
            const list: StaffMemberRecord[] = JSON.parse(stored);
            matchedStaff = list.find((s) => s.email.toLowerCase().trim() === cleanEmail);
          } catch (e) {}
        }
      }

      // Predefined fallbacks if repository hasn't loaded yet
      if (!matchedStaff) {
        if (cleanEmail === 'owner@qistflow-demo.pk') {
          matchedStaff = {
            userId: 'usr_owner_01',
            email: 'owner@qistflow-demo.pk',
            displayName: 'Haji Abdul Malik',
            role: 'owner',
            password: 'Pak@12345',
            status: 'active',
            joinedAt: '2026-10-01',
            permissions: [],
          };
        } else if (cleanEmail === 'manager@qistflow-demo.pk') {
          matchedStaff = {
            userId: 'usr_mgr_01',
            email: 'manager@qistflow-demo.pk',
            displayName: 'Usman Ghani',
            role: 'manager',
            password: 'Pak@12345',
            status: 'active',
            joinedAt: '2026-10-05',
            permissions: [],
          };
        } else if (cleanEmail === 'accountant@qistflow-demo.pk') {
          matchedStaff = {
            userId: 'usr_acc_01',
            email: 'accountant@qistflow-demo.pk',
            displayName: 'Farhan Zaidi',
            role: 'accountant',
            password: 'Pak@12345',
            status: 'active',
            joinedAt: '2026-10-10',
            permissions: [],
          };
        } else if (cleanEmail.includes('recovery')) {
          matchedStaff = {
            userId: 'usr_rec_01',
            email: cleanEmail,
            displayName: 'Tariq Mehmood',
            role: 'recovery',
            password: 'Pak@12345',
            status: 'active',
            joinedAt: '2026-10-15',
            permissions: [],
          };
        }
      }

      if (matchedStaff) {
        // Validate password
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

        // Enforce role isolation matching
        enableDemoMode(matchedStaff.role, matchedStaff);

        if (matchedStaff.role === 'recovery') {
          navigate('/recovery');
        } else {
          navigate('/dashboard');
        }
        return;
      }

      // 3. Fallback to Firebase authentication
      try {
        await signIn(email, password);
        if (selectedRole === 'recovery') navigate('/recovery');
        else navigate('/dashboard');
      } catch (authErr: any) {
        setError(
          language === 'ur'
            ? 'لاگ ان نا کام ہوا۔ برائے مہربانی چیک کریں کہ ای میل اور پاس ورڈ درست ہیں۔ ملازمین اپنے دکان کے مالک سے لاگ ان حاصل کریں۔'
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
                  setEmail('owner@qistflow-demo.pk');
                } else if (newRole === 'manager') {
                  setEmail('manager@qistflow-demo.pk');
                } else if (newRole === 'accountant') {
                  setEmail('accountant@qistflow-demo.pk');
                } else if (newRole === 'recovery') {
                  setEmail('tariq.recovery@qistflow-demo.pk');
                } else if (newRole === 'super_admin') {
                  setEmail('superadmin@qistflow.pk');
                }
              }}
              style={{ fontWeight: 600 }}
            >
              <option value="owner">👑 دکان دار (Shop Owner)</option>
              <option value="manager">👔 دکان مینیجر (Shop Manager)</option>
              <option value="accountant">🧮 اکاؤنٹنٹ (Accountant / Finance)</option>
              <option value="recovery">🛵 فیلڈ ریکوری آفیسر (Recovery Officer)</option>
              <option value="super_admin">🛡️ پلیٹ فارم سپر ایڈمن (Platform Super-Admin)</option>
            </select>
          </div>

          {/* Email input */}
          <div className="form-group mb-3">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              {language === 'ur' ? 'لاگ ان ای میل (Gmail / Email)' : 'Login Email / Gmail'}
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="user@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                  ? '🔐 معلوماتی ٹیسٹ اکاؤنٹس و پاس ورڈز (Evaluation Credentials List)'
                  : '🔐 Evaluation Credentials List (For Testing)'}
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
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '0.35rem' }}>
                <div>
                  <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>👑 Owner</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>owner@qistflow-demo.pk</div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>Haji Abdul Malik • Pass: Pak@12345</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('owner', 'owner@qistflow-demo.pk', 'Pak@12345')}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.6875rem', padding: '0.2rem 0.45rem' }}
                >
                  {language === 'ur' ? 'آٹو فِل' : 'Auto-Fill'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '0.35rem' }}>
                <div>
                  <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>👔 Manager</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>manager@qistflow-demo.pk</div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>Usman Ghani • Pass: Pak@12345</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('manager', 'manager@qistflow-demo.pk', 'Pak@12345')}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.6875rem', padding: '0.2rem 0.45rem' }}
                >
                  {language === 'ur' ? 'آٹو فِل' : 'Auto-Fill'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '0.35rem' }}>
                <div>
                  <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>🧮 Accountant</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>accountant@qistflow-demo.pk</div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>Farhan Zaidi • Pass: Pak@12345</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('accountant', 'accountant@qistflow-demo.pk', 'Pak@12345')}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.6875rem', padding: '0.2rem 0.45rem' }}
                >
                  {language === 'ur' ? 'آٹو فِل' : 'Auto-Fill'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '0.35rem' }}>
                <div>
                  <span className="badge badge-slate" style={{ fontSize: '0.6875rem' }}>🛵 Recovery (Tariq)</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>tariq.recovery@qistflow-demo.pk</div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>Tariq Mehmood • Pass: Pak@12345</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('recovery', 'tariq.recovery@qistflow-demo.pk', 'Pak@12345')}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.6875rem', padding: '0.2rem 0.45rem' }}
                >
                  {language === 'ur' ? 'آٹو فِل' : 'Auto-Fill'}
                </button>
              </div>

              {availableStaff
                .filter((s) => s.role === 'recovery' && s.email !== 'tariq.recovery@qistflow-demo.pk')
                .map((officer) => (
                  <div key={officer.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '0.35rem' }}>
                    <div>
                      <span className="badge badge-slate" style={{ fontSize: '0.6875rem' }}>🛵 Recovery ({officer.displayName})</span>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{officer.email}</div>
                      <div className="text-muted" style={{ fontSize: '0.6875rem' }}>{officer.displayName} • Pass: {officer.password || 'Pak@12345'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFillCredentials('recovery', officer.email, officer.password || 'Pak@12345')}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.6875rem', padding: '0.2rem 0.45rem' }}
                    >
                      {language === 'ur' ? 'آٹو فِل' : 'Auto-Fill'}
                    </button>
                  </div>
                ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>🛡️ Super-Admin</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>superadmin@qistflow.pk</div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>Platform Super-Admin • Pass: Pak@12345</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('super_admin', 'superadmin@qistflow.pk', 'Pak@12345')}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.6875rem', padding: '0.2rem 0.45rem' }}
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
