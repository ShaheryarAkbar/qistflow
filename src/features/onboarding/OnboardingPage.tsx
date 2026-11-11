// ============================================================================
// Onboarding Feature: Business Setup Wizard
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, CheckCircle, Languages, AlertCircle } from 'lucide-react';
import { useTenant } from '@/app/providers/TenantContext';
import { useI18n } from '@/i18n/I18nContext';

export const OnboardingPage: React.FC = () => {
  const { createTenant } = useTenant();
  const { t, toggleLanguage } = useI18n();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [businessNameUr, setBusinessNameUr] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Rahim Yar Khan');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) {
      setError('Please provide your shop name.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await createTenant({
        businessName,
        businessNameUr,
        phone,
        city,
        address,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to setup shop profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
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
            <Store size={32} />
          </div>
          <h1 className="auth-title">{t('onboarding.title')}</h1>
          <p className="auth-subtitle">{t('onboarding.subtitle')}</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <span>{t('onboarding.shopName')}</span>
              <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Al-Madina Electronics & Fans"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('onboarding.shopNameUr')}</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثلاً: المدینہ الیکٹرانکس اینڈ فین سینٹر"
              value={businessNameUr}
              onChange={(e) => setBusinessNameUr(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">{t('onboarding.phone')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('onboarding.city')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="Rahim Yar Khan / Khanpur"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('onboarding.address')}</label>
            <textarea
              className="form-textarea"
              placeholder="Shop #4, Main Bazar..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-4"
            disabled={submitting}
          >
            <CheckCircle size={18} />
            <span>{submitting ? t('common.loading') : t('onboarding.completeSetup')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

