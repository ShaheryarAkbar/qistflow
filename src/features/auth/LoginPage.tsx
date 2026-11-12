// ============================================================================
// Auth Feature: Login Page
// Supports both Firebase Auth and 1-Click Role-Specific Offline Demo Mode
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Coins,
  LogIn,
  Sparkles,
  Languages,
  AlertCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { UserRole } from '@/types';

export const LoginPage: React.FC = () => {
  const { signIn, enableDemoMode, loading } = useAuth();
  const { t, toggleLanguage, language } = useI18n();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    enableDemoMode(role);
    if (role === 'recovery') {
      navigate('/recovery');
    } else if (role === 'super_admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        {/* Language switch at top */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={toggleLanguage}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Languages size={14} />
            <span>{t('app.switchLanguage')}</span>
          </button>
        </div>

        {/* Brand header */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Coins size={32} />
          </div>
          <h1 className="auth-title">{t('app.name')}</h1>
          <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input
              type="email"
              className="form-input"
              placeholder="owner@shop.pk / recovery@shop.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.password')}</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-4"
            disabled={submitting || loading}
          >
            <LogIn size={18} />
            <span>{submitting ? t('common.loading') : t('auth.signIn')}</span>
          </button>
        </form>

        {/* Notice for Staff Members */}
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
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <Info size={16} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            {language === 'ur'
              ? 'ملازمین کے لیے نوٹ: منیجر، اکاؤنٹنٹ اور ریکوری افسران کو خود سائن اپ کرنے کی ضرورت نہیں۔ اپنی دکان کے مالک کے فراہم کردہ لاگ ان سے سائن ان کریں۔'
              : 'Notice for Staff: Managers, Accountants, and Recovery Officers do not need to register. Log in using the credentials created by your shop owner.'}
          </span>
        </div>

        <div className="mt-4 text-center" style={{ fontSize: '0.875rem' }}>
          <span className="text-muted">{t('auth.noAccount')} </span>
          <Link to="/register" className="font-semibold text-primary">
            {language === 'ur' ? 'نئی دکان رجسٹر کریں' : 'Register New Shop (Owner)'}
          </Link>
        </div>

        {/* 1-Click Role-Specific Demo Evaluation Box */}
        <div
          className="mt-6"
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.25rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              marginBottom: '0.75rem',
              color: '#059669',
              fontWeight: 700,
              fontSize: '0.8125rem',
            }}
          >
            <Sparkles size={16} />
            <span>
              {language === 'ur'
                ? 'فوری ٹیسٹ کے لیے ۱-کلک ڈیمو موڈ (مختلف کردار)'
                : '1-Click Role-Based Demo Evaluation Mode'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button
              onClick={() => handleDemoLogin('owner')}
              className="btn btn-sm btn-secondary"
              style={{ fontWeight: 600, fontSize: '0.8125rem' }}
            >
              👑 {language === 'ur' ? 'دکان دار (Owner)' : 'Shop Owner'}
            </button>
            <button
              onClick={() => handleDemoLogin('manager')}
              className="btn btn-sm btn-secondary"
              style={{ fontWeight: 600, fontSize: '0.8125rem' }}
            >
              👔 {language === 'ur' ? 'منیجر (Manager)' : 'Shop Manager'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button
              onClick={() => handleDemoLogin('accountant')}
              className="btn btn-sm btn-secondary"
              style={{ fontWeight: 600, fontSize: '0.8125rem' }}
            >
              🧮 {language === 'ur' ? 'اکاؤنٹنٹ (Finance)' : 'Accountant'}
            </button>
            <button
              onClick={() => handleDemoLogin('recovery')}
              className="btn btn-sm btn-secondary"
              style={{ fontWeight: 600, fontSize: '0.8125rem' }}
            >
              🛵 {language === 'ur' ? 'ریکوری عملہ (Mobile)' : 'Recovery Agent'}
            </button>
          </div>

          <button
            onClick={() => handleDemoLogin('super_admin')}
            className="btn btn-sm btn-outline btn-block mt-2"
            style={{ fontWeight: 600, fontSize: '0.8125rem', borderColor: '#cbd5e1' }}
          >
            🛡️ {language === 'ur' ? 'پلیٹ فارم سپر ایڈمن (Super-Admin)' : 'Platform Super-Admin'}
          </button>
        </div>
      </div>
    </div>
  );
};
