// ============================================================================
// Settings Feature: Shop Profile, Language & Preferences
// ============================================================================

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Languages,
  ShieldCheck,
  CheckCircle,
  Clock,
  Coins,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const { activeTenant, isOwner } = useTenant();
  const { isDemoUser } = useAuth();

  const [businessName, setBusinessName] = useState(activeTenant?.businessName || '');
  const [businessNameUr, setBusinessNameUr] = useState(activeTenant?.businessNameUr || '');
  const [phone, setPhone] = useState(activeTenant?.phone || '');
  const [city, setCity] = useState(activeTenant?.city || 'Rahim Yar Khan');
  const [address, setAddress] = useState(activeTenant?.address || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTenant) {
      activeTenant.businessName = businessName;
      activeTenant.businessNameUr = businessNameUr;
      activeTenant.phone = phone;
      activeTenant.city = city;
      activeTenant.address = address;
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.settings')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'دکان کی معلومات، زبان کی ترجیحات اور سسٹم سیٹنگز'
              : 'Shop profile identity, language localization and system preferences.'}
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="alert alert-success mb-6">
          <CheckCircle size={18} />
          <span>{language === 'ur' ? 'سیٹنگز کامیابی سے محفوظ ہو گئیں۔' : 'Settings updated successfully!'}</span>
        </div>
      )}

      {/* Language Preference Card */}
      <div className="card mb-6">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Languages size={18} className="text-primary" />
            <h3 className="card-title">Language & Typography (زبان اور فونٹ)</h3>
          </div>
        </div>
        <div className="card-body">
          <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
            Select your preferred system language. Urdu enables right-to-left (RTL) Nastaliq layout.
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setLanguage('en')}
              className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.875rem' }}
            >
              <div style={{ fontWeight: 700 }}>English (LTR)</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Standard Business English</div>
            </button>

            <button
              onClick={() => setLanguage('ur')}
              className={`btn ${language === 'ur' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.875rem' }}
            >
              <div style={{ fontWeight: 700 }}>اردو (RTL)</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>نستعلیق رسم الخط</div>
            </button>
          </div>
        </div>
      </div>

      {/* Shop Profile Form */}
      <div className="card mb-6">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={18} className="text-primary" />
            <h3 className="card-title">Shop Identity & Receipt Header</h3>
          </div>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  <span>Shop Name (English)</span>
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">دکان کا نام (اردو)</label>
                <input
                  type="text"
                  className="form-input"
                  value={businessNameUr}
                  onChange={(e) => setBusinessNameUr(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Helpline / Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City (شہر)</label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Street Address (Printed on Receipts)</label>
              <textarea
                className="form-textarea"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
              <div>
                <span className="text-muted">Currency:</span>
                <div className="font-bold">PKR (Pakistani Rupee / روپیہ)</div>
              </div>
              <div>
                <span className="text-muted">Timezone:</span>
                <div className="font-bold">Asia/Karachi (GMT+5)</div>
              </div>
            </div>
          </div>

          <div className="card-footer">
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              Printed receipts and clearance certificates will display these updated details.
            </span>
            <button type="submit" className="btn btn-primary">
              <CheckCircle size={16} />
              <span>{t('common.save')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Information Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="card-title">System & Free-Tier Specifications</h3>
          </div>
        </div>
        <div className="card-body" style={{ fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Product & Version:</span>
              <span className="font-semibold">QistFlow v1.0 Free</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Backend Database:</span>
              <span className="badge badge-success">Firebase Spark (100% Free Plan)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Static Web Hosting:</span>
              <span className="badge badge-info">GitHub Pages (100% Free)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Active Tenant ID:</span>
              <span className="font-mono" style={{ fontSize: '0.75rem' }}>{activeTenant?.tenantId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Running Mode:</span>
              <span className="font-semibold">{isDemoUser ? 'Demo Sandbox Mode' : 'Online Production Mode'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

