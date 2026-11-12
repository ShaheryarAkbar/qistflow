// ============================================================================
// Auth Feature: Register Page (New Business Owner Onboarding)
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coins, UserPlus, Languages, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/i18n/I18nContext';

export const RegisterPage: React.FC = () => {
  const { signUp, loading } = useAuth();
  const { t, toggleLanguage, language } = useI18n();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await signUp(email, password, fullName);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
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

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Coins size={32} />
          </div>
          <h1 className="auth-title">
            {language === 'ur' ? 'نئی دکان رجسٹر کریں (مالک)' : 'Register New Shop (Owner)'}
          </h1>
          <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>
        </div>

        {/* Informative Security Notice for Staff */}
        <div
          className="mb-4"
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <Info size={16} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            {language === 'ur'
              ? 'توجہ فرمائیں: یہ فارم صرف دکان کے مالک کے لیے ہے۔ اگر آپ ملازم (منیجر، اکاؤنٹنٹ یا ریکوری آفیسر) ہیں، تو یہاں رجسٹریشن کی ضرورت نہیں، مالک کے فراہم کردہ لاگ ان سے سائن ان کریں۔'
              : 'Attention: This registration is exclusively for Shop Owners. Staff members (managers, accountants, recovery staff) must use the credentials assigned by their shop owner.'}
          </span>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.fullName')} (Owner Name)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Haji Muhammad Iqbal"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input
              type="email"
              className="form-input"
              placeholder="owner@qistflow.pk"
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
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-6"
            disabled={submitting || loading}
          >
            <UserPlus size={18} />
            <span>{submitting ? t('common.loading') : t('auth.signUp')}</span>
          </button>
        </form>

        <div className="mt-4 text-center" style={{ fontSize: '0.875rem' }}>
          <span className="text-muted">{t('auth.haveAccount')} </span>
          <Link to="/login" className="font-semibold text-primary">
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
};
