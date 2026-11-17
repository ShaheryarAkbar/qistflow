// ============================================================================
// Auth Feature: Register Notice Page (Closed B2B Enterprise System)
// PRD Principle: Public self-registration is closed.
// Super-Admin provisions Shops/Owners; Owners/Managers provision Staff.
// ============================================================================

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coins, ShieldCheck, Languages, LogIn, Lock, Store, Users, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export const RegisterPage: React.FC = () => {
  const { toggleLanguage, language } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: '520px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={toggleLanguage}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
          >
            <Languages size={13} />
            <span>Switch Language / زبان تبدیل کریں</span>
          </button>
        </div>

        <div className="auth-logo" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 16px rgba(15, 23, 42, 0.25)',
            }}
          >
            <Lock size={30} />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            {language === 'ur' ? 'پبلک رجسٹریشن بند ہے' : 'Public Registration Disabled'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            {language === 'ur'
              ? 'قسط فلو ایک محفوظ انٹرپرائز نظام ہے جس میں تمام اکاؤنٹس مجاز ایڈمنسٹریشن کی طرف سے جاری کیے جاتے ہیں۔'
              : 'QistFlow is an authorized enterprise platform. Accounts are strictly provisioned by administration.'}
          </p>
        </div>

        {/* Process Explanation Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.625rem',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                {language === 'ur' ? 'نئے دکان دار (Shop Owners)' : 'New Shop Owners'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
                {language === 'ur'
                  ? 'دکان کا لائسنس اور مالک کا جی میل / پاس ورڈ پلیٹ فارم سپر ایڈمن جاری کرتا ہے۔'
                  : 'Shop tenancy and initial owner credentials are provisioned by Platform Super-Admin.'}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.625rem',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                {language === 'ur' ? 'ملازمین (Staff: Manager, Accountant, Recovery)' : 'Shop Staff'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
                {language === 'ur'
                  ? 'منیجر، اکاؤنٹنٹ اور ریکوری افسران کو خود سائن اپ کی ضرورت نہیں۔ ان کے لاگ ان ان کے دکان دار / مینیجر کے پاس دستیاب ہیں۔'
                  : 'Staff accounts are created directly by Shop Owners via the Staff portal. You do not need to register.'}
              </div>
            </div>
          </div>
        </div>

        {/* Back to Login Button */}
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary btn-block btn-lg"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
        >
          <LogIn size={18} />
          <span>{language === 'ur' ? 'لاگ ان اسکرین پر تشریف لے جائیں' : 'Go to Login Portal'}</span>
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: '#94a3b8' }}>
          <span>QistFlow Platform Security Standard • Rahim Yar Khan</span>
        </div>
      </div>
    </div>
  );
};
