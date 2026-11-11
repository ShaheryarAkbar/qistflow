// ============================================================================
// Auth Feature: Register Page
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coins, UserPlus, Languages, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/i18n/I18nContext';

export const RegisterPage: React.FC = () => {
  const { signUp, loading } = useAuth();
  const { t, toggleLanguage } = useI18n();
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
      <div className="auth-card">
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
          <h1 className="auth-title">{t('auth.registerTitle')}</h1>
          <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.fullName')}</label>
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
              placeholder="shop@qistflow.pk"
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

          <div className="form-group">
            <label className="form-label">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-4"
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
