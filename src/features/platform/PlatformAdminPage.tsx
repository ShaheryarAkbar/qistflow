// ============================================================================
// Platform Administration Feature (PRD Section 4.5, 5 & 6.16)
// Platform Super-Admin: Manage Tenants, SaaS Subscription Dues, Plans & Spark
// ============================================================================

import React, { useState } from 'react';
import {
  ShieldAlert,
  Store,
  Layers,
  KeyRound,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  Users,
  Settings,
  HardDrive,
  Activity,
  Edit,
  Save,
  X,
  CreditCard,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useTenant } from '@/app/providers/TenantContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformPlan, PlatformLicence } from '@/types';

export const PlatformAdminPage: React.FC = () => {
  const { t, language } = useI18n();
  const { currentUser } = useAuth();
  const { activeTenant } = useTenant();

  const [activeTab, setActiveTab] = useState<'tenants' | 'dues' | 'plans' | 'health'>('tenants');
  const [searchShop, setSearchShop] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Sample seed platform tenants
  const [tenants, setTenants] = useState([
    {
      tenantId: 'tenant-demo-ryk-01',
      businessName: 'Malik Electronics & Installments',
      businessNameUr: 'ملک الیکٹرانکس اینڈ اقساط سینٹر',
      ownerName: 'Haji Abdul Malik',
      phone: '0300-1234567',
      city: 'Rahim Yar Khan',
      plan: 'Professional Monthly (Rs. 3,499)',
      licenceType: 'subscription',
      status: 'active',
      activeContracts: 48,
      createdAt: '2026-10-01',
      supportNotes: 'Shop in Shahi Road RYK. Active user, 2 recovery officers.',
    },
    {
      tenantId: 'tenant-kp-02',
      businessName: 'Khanpur Solar & Electric Mart',
      businessNameUr: 'خانپور سولر اینڈ الیکٹرک مارٹ',
      ownerName: 'Chaudhry Nadeem',
      phone: '0301-9876543',
      city: 'Khanpur',
      plan: 'Standard Monthly (Rs. 1,999)',
      licenceType: 'subscription',
      status: 'trial',
      activeContracts: 19,
      createdAt: '2026-11-05',
      supportNotes: 'Trial period. Requested guidance on Urdu receipt printing.',
    },
    {
      tenantId: 'tenant-sqb-03',
      businessName: 'Sadiqabad Fans & Home Appliances',
      businessNameUr: 'صادق آباد فینز اینڈ ہوم اپلائنسز',
      ownerName: 'Zahid Hussain',
      phone: '0302-3344556',
      city: 'Sadiqabad',
      plan: 'Standard Lifetime (Rs. 34,999)',
      licenceType: 'lifetime',
      status: 'active',
      activeContracts: 62,
      createdAt: '2026-09-15',
      supportNotes: 'Paid lifetime licence. Full data export tested.',
    },
    {
      tenantId: 'tenant-ryk-04',
      businessName: 'Al-Madina Motorbike Center',
      businessNameUr: 'المدینہ موٹر بائیک سینٹر',
      ownerName: 'Muhammad Arshad',
      phone: '0303-7788990',
      city: 'Rahim Yar Khan',
      plan: 'Starter Monthly (Rs. 999)',
      licenceType: 'subscription',
      status: 'grace',
      activeContracts: 12,
      createdAt: '2026-10-12',
      supportNotes: 'Subscription due. In 7-day grace period; export available.',
    },
  ]);

  // Shop SaaS Subscription Dues (NOT product installments!)
  const [shopSubscriptions, setShopSubscriptions] = useState([
    {
      subId: 'sub-01',
      tenantId: 'tenant-demo-ryk-01',
      businessName: 'Malik Electronics & Installments',
      ownerName: 'Haji Abdul Malik',
      phone: '0300-1234567',
      city: 'Rahim Yar Khan',
      planName: 'Professional Monthly',
      monthlyFeePKR: 3499,
      dueDate: '2026-11-30',
      status: 'paid',
      lastPaidDate: '2026-10-30',
    },
    {
      subId: 'sub-02',
      tenantId: 'tenant-kp-02',
      businessName: 'Khanpur Solar & Electric Mart',
      ownerName: 'Chaudhry Nadeem',
      phone: '0301-9876543',
      city: 'Khanpur',
      planName: 'Standard Monthly',
      monthlyFeePKR: 1999,
      dueDate: '2026-11-15',
      status: 'due',
      lastPaidDate: '2026-10-15',
    },
    {
      subId: 'sub-03',
      tenantId: 'tenant-ryk-04',
      businessName: 'Al-Madina Motorbike Center',
      ownerName: 'Muhammad Arshad',
      phone: '0303-7788990',
      city: 'Rahim Yar Khan',
      planName: 'Starter Monthly',
      monthlyFeePKR: 999,
      dueDate: '2026-11-10',
      status: 'grace',
      lastPaidDate: '2026-10-10',
    },
    {
      subId: 'sub-04',
      tenantId: 'tenant-sqb-03',
      businessName: 'Sadiqabad Fans & Home Appliances',
      ownerName: 'Zahid Hussain',
      phone: '0302-3344556',
      city: 'Sadiqabad',
      planName: 'Lifetime Standard License',
      monthlyFeePKR: 0,
      dueDate: 'Lifetime Active (لائف ٹائم لائسنس)',
      status: 'lifetime',
      lastPaidDate: '2026-09-15',
    },
  ]);

  // Platform Plans Definitions (PRD Section 5)
  const [plans] = useState<PlatformPlan[]>([
    {
      planId: 'plan-starter-m',
      name: 'Starter Monthly',
      nameUr: 'اسٹارٹر ماہانہ',
      billingType: 'monthly',
      pricePaisa: 99900,
      features: ['1 Shop Branch', '2 Staff Accounts', 'Up to 200 Customers', 'Urdu & English UI', 'Daily Backup Reminders'],
      maxUsers: 2,
      maxCustomers: 200,
      status: 'active',
    },
    {
      planId: 'plan-standard-m',
      name: 'Standard Monthly',
      nameUr: 'اسٹینڈرڈ ماہانہ',
      billingType: 'monthly',
      pricePaisa: 199900,
      features: ['1 Shop Branch', '5 Staff Accounts', 'Up to 1,000 Customers', 'Recovery Field Portal', 'Thermal 80mm Receipts', 'CSV & JSON Exports'],
      maxUsers: 5,
      maxCustomers: 1000,
      status: 'active',
    },
    {
      planId: 'plan-pro-m',
      name: 'Professional Monthly',
      nameUr: 'پروفیشنل ماہانہ',
      billingType: 'monthly',
      pricePaisa: 349900,
      features: ['Multi-Branch Support', 'Unlimited Staff', 'Unlimited Customers', 'Full ZIP Backup Bundler', 'A4 Clearance Certificates', 'Priority Local Support'],
      maxUsers: 999,
      maxCustomers: 99999,
      status: 'active',
    },
    {
      planId: 'plan-basic-life',
      name: 'Lifetime Basic',
      nameUr: 'لائف ٹائم بنیادی',
      billingType: 'lifetime',
      pricePaisa: 1999900,
      features: ['One-time Fee', 'Single Shop License', '3 Staff Accounts', 'Permanent Local Data Ownership', 'Standard Updates'],
      maxUsers: 3,
      maxCustomers: 500,
      status: 'active',
    },
    {
      planId: 'plan-standard-life',
      name: 'Lifetime Standard',
      nameUr: 'لائف ٹائم اسٹینڈرڈ',
      billingType: 'lifetime',
      pricePaisa: 3499900,
      features: ['One-time Fee', '1 Shop + Mobile Recovery', '8 Staff Accounts', 'Full Portability & Exports', '1 Year Priority Support'],
      maxUsers: 8,
      maxCustomers: 2000,
      status: 'active',
    },
    {
      planId: 'plan-pro-life',
      name: 'Lifetime Professional',
      nameUr: 'لائف ٹائم پروفیشنل',
      billingType: 'lifetime',
      pricePaisa: 5999900,
      features: ['One-time Fee', 'Multi-Branch Ready', 'Unlimited Staff & Customers', 'Full Feature Access', 'Lifetime Product Updates'],
      maxUsers: 999,
      maxCustomers: 99999,
      status: 'active',
    },
  ]);

  // Support Notes Modal
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<string>('active');
  const [notesInput, setNotesInput] = useState<string>('');

  const openEditModal = (t: any) => {
    setSelectedTenant(t);
    setEditStatus(t.status);
    setNotesInput(t.supportNotes);
  };

  const handleSaveTenantStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setTenants((prev) =>
      prev.map((t) =>
        t.tenantId === selectedTenant.tenantId
          ? { ...t, status: editStatus, supportNotes: notesInput }
          : t
      )
    );
    setSelectedTenant(null);
    setActionSuccess('Shop status updated successfully!');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleMarkSubscriptionPaid = (subId: string) => {
    setShopSubscriptions((prev) =>
      prev.map((s) => (s.subId === subId ? { ...s, status: 'paid', lastPaidDate: new Date().toISOString().split('T')[0] } : s))
    );
    setActionSuccess('Subscription payment recorded as paid!');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.businessName.toLowerCase().includes(searchShop.toLowerCase()) ||
      t.city.toLowerCase().includes(searchShop.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchShop.toLowerCase())
  );

  return (
    <div>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '1.25rem',
          borderRadius: '0.75rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldAlert size={22} className="text-warning" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              {language === 'ur' ? 'پلیٹ فارم ایڈمن پورٹل' : 'Platform Super-Admin Portal'}
            </h2>
            <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>SaaS Governance</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', margin: 0 }}>
            {language === 'ur'
              ? 'شاپس کی ڈائریکٹری، دکانوں کی سبسکرپشن فیس، کمرشل پلانز اور فائر بیس اسپارک فری کوٹہ'
              : 'Multi-tenant shop directory, SaaS subscription fees, commercial plan entitlements, and Spark quota monitoring.'}
          </p>
        </div>

        {/* Tab pills */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.12)', padding: '0.25rem', borderRadius: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`btn btn-sm ${activeTab === 'tenants' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: activeTab === 'tenants' ? '#fff' : '#e2e8f0', fontSize: '0.75rem' }}
          >
            <Store size={14} />
            <span>{language === 'ur' ? 'شاپس ڈائریکٹری' : 'Shops Directory'}</span>
          </button>
          <button
            onClick={() => setActiveTab('dues')}
            className={`btn btn-sm ${activeTab === 'dues' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: activeTab === 'dues' ? '#fff' : '#e2e8f0', fontSize: '0.75rem' }}
          >
            <CreditCard size={14} />
            <span>{language === 'ur' ? 'سبسکرپشن فیس (Dues)' : 'Shop SaaS Fees'}</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`btn btn-sm ${activeTab === 'plans' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: activeTab === 'plans' ? '#fff' : '#e2e8f0', fontSize: '0.75rem' }}
          >
            <Layers size={14} />
            <span>{language === 'ur' ? 'کمرشل پلانز' : 'Plans & Pricing'}</span>
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`btn btn-sm ${activeTab === 'health' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: activeTab === 'health' ? '#fff' : '#e2e8f0', fontSize: '0.75rem' }}
          >
            <Activity size={14} />
            <span>{language === 'ur' ? 'اسپارک کوٹہ' : 'Spark Health'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success mb-4" style={{ padding: '0.75rem' }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tenant Privacy Notice */}
      <div className="alert alert-info mb-4" style={{ fontSize: '0.8125rem', padding: '0.75rem 1rem' }}>
        <CheckCircle size={16} />
        <span>
          {language === 'ur'
            ? 'سیکیورٹی پرنسپل (PRD 4.5): سپر ایڈمن صرف شاپس کے لائسنس اور سبسکرپشن کا انتظام سنبھالتا ہے۔ دکانوں کی نجی اشیاء اور کسٹمرز کے اقساط کھاتے انفرادی دکان کے پاس مکمل محفوظ ہیں۔'
            : 'SaaS Governance Distinction: Platform Super-Admin manages shop subscription licensing and system health. Individual shop products and customer installment ledgers remain completely isolated.'}
        </span>
      </div>

      {/* ================= TAB 1: TENANTS DIRECTORY ================= */}
      {activeTab === 'tenants' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="card-title">
                {language === 'ur' ? 'رجسٹرڈ دکانوں کی فہرست' : 'Registered Shops Directory'}
              </h3>
              <p className="card-subtitle">
                {language === 'ur'
                  ? 'رحیم یار خان، خانپور، اور صادق آباد کی رجسٹرڈ دکانیں'
                  : 'All shops onboarded to QistFlow across target cities.'}
              </p>
            </div>
            <div style={{ width: '100%', maxWidth: '280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'ur' ? 'نام یا شہر سے تلاش کریں...' : 'Search shop, city, or owner...'}
                value={searchShop}
                onChange={(e) => setSearchShop(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ur' ? 'دکان کا نام' : 'Shop / Business'}</th>
                  <th>{language === 'ur' ? 'مالک / فون' : 'Owner & Contact'}</th>
                  <th>{language === 'ur' ? 'شہر' : 'City'}</th>
                  <th>{language === 'ur' ? 'پلان' : 'Plan'}</th>
                  <th>{language === 'ur' ? 'اسٹیٹس' : 'Status'}</th>
                  <th>{language === 'ur' ? 'انتظام' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t) => (
                  <tr key={t.tenantId}>
                    <td>
                      <div className="font-semibold">{t.businessName}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t.businessNameUr}</div>
                    </td>
                    <td>
                      <div>{t.ownerName}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }} dir="ltr">{t.phone}</div>
                    </td>
                    <td>
                      <span className="badge badge-outline">{t.city}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t.plan}</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.status === 'active'
                            ? 'badge-success'
                            : t.status === 'trial'
                            ? 'badge-info'
                            : t.status === 'grace'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openEditModal(t)}
                        className="btn btn-sm btn-outline"
                      >
                        <Edit size={14} />
                        <span>{language === 'ur' ? 'لائسنس' : 'Manage'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SHOP SAAS SUBSCRIPTION DUES ================= */}
      {activeTab === 'dues' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="card-title">
                {language === 'ur' ? 'دکانوں کی ماہانہ فیس اور تجدید (Shop SaaS Subscription Dues)' : 'Shop SaaS Subscription Dues & Renewals'}
              </h3>
              <p className="card-subtitle">
                {language === 'ur'
                  ? 'دکان داروں کی طرف سے قسط فلو سوفٹ ویئر کی واجب الادا ماہانہ فیس اور تجدید کی تاریخیں'
                  : 'Track and collect SaaS subscription fees from shop owners. (Not customer product installments).'}
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ur' ? 'دکان اور مالک' : 'Shop & Owner'}</th>
                  <th>{language === 'ur' ? 'پیکج / فیس' : 'Plan & Monthly Fee'}</th>
                  <th>{language === 'ur' ? 'تجدید تاریخ' : 'Renewal Due Date'}</th>
                  <th>{language === 'ur' ? 'بلنگ اسٹیٹس' : 'Billing Status'}</th>
                  <th>{language === 'ur' ? 'یاددہانی و وصولی' : 'Collection Action'}</th>
                </tr>
              </thead>
              <tbody>
                {shopSubscriptions.map((sub) => {
                  const reminderMessage = `السلام علیکم ${sub.ownerName}! ${sub.businessName} کے قسط فلو سوفٹ ویئر کی ماہانہ فیس مبلغ Rs. ${sub.monthlyFeePKR.toLocaleString()} واجب الادا ہے۔ تجدید کے لیے رابطہ کریں۔ شکریہ`;

                  return (
                    <tr key={sub.subId}>
                      <td>
                        <div className="font-semibold">{sub.businessName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {sub.ownerName} • <span dir="ltr">{sub.phone}</span> ({sub.city})
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sub.planName}</div>
                        <div className="text-success font-semibold" style={{ fontSize: '0.8125rem' }}>
                          {sub.monthlyFeePKR > 0 ? `Rs. ${sub.monthlyFeePKR.toLocaleString()} / mo` : 'Paid in Full (Lifetime)'}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{sub.dueDate}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Last Paid: {sub.lastPaidDate}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            sub.status === 'paid' || sub.status === 'lifetime'
                              ? 'badge-success'
                              : sub.status === 'due'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {sub.status !== 'paid' && sub.status !== 'lifetime' ? (
                            <>
                              <button
                                onClick={() => handleMarkSubscriptionPaid(sub.subId)}
                                className="btn btn-sm btn-primary"
                                title="Mark fee as received"
                              >
                                <CheckCircle2 size={14} />
                                <span>{language === 'ur' ? 'فیس وصول' : 'Collect Fee'}</span>
                              </button>
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(reminderMessage)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline text-success"
                                title="Send WhatsApp fee reminder"
                              >
                                <MessageCircle size={14} />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {language === 'ur' ? 'کھاتہ اپ ٹو ڈیٹ ہے' : 'Up-to-date'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: PLANS & PRICING ================= */}
      {activeTab === 'plans' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {plans.map((p) => (
              <div
                key={p.planId}
                className="card"
                style={{
                  border: p.billingType === 'lifetime' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div className="card-header" style={{ background: p.billingType === 'lifetime' ? '#f5f3ff' : '#f8fafc', padding: '0.75rem 1rem' }}>
                  <div>
                    <h3 className="card-title" style={{ color: p.billingType === 'lifetime' ? '#7c3aed' : '#0f172a', fontSize: '1rem' }}>
                      {p.name}
                    </h3>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{p.nameUr}</div>
                  </div>
                  <span className={`badge ${p.billingType === 'lifetime' ? 'badge-primary' : 'badge-slate'}`} style={{ fontSize: '0.6875rem' }}>
                    {p.billingType === 'lifetime' ? 'LIFETIME' : 'MONTHLY'}
                  </span>
                </div>

                <div className="card-body" style={{ flex: 1, padding: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                      Rs. {(p.pricePaisa / 100).toLocaleString()}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {p.billingType === 'monthly' ? ' / month' : ' one-time'}
                    </span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                    {p.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle size={14} className="text-success" style={{ flexShrink: 0 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span className="text-muted">Staff: <strong>{p.maxUsers}</strong></span>
                  <span className="text-muted">Customers: <strong>{p.maxCustomers.toLocaleString()}</strong></span>
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: SPARK HEALTH ================= */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HardDrive size={18} className="text-primary" />
                <h3 className="card-title">Firebase Spark Free Tier Compliance</h3>
              </div>
            </div>
            <div className="card-body">
              <p className="text-muted mb-4" style={{ fontSize: '0.8125rem' }}>
                Strict zero-cost guarantee: 100% inside Google Firebase Spark Free Plan without Blaze billing.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                    <span className="font-semibold">Daily Reads: 1,420 / 50,000 (Free Limit)</span>
                    <span className="text-success font-semibold">2.8% Used</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '2.8%', height: '100%', background: '#059669' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                    <span className="font-semibold">Daily Writes: 340 / 20,000 (Free Limit)</span>
                    <span className="text-success font-semibold">1.7% Used</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '1.7%', height: '100%', background: '#059669' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                    <span className="font-semibold">Storage: 42 MB / 1,024 MB (1 GB Free Limit)</span>
                    <span className="text-success font-semibold">4.1% Used</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '4.1%', height: '100%', background: '#059669' }} />
                  </div>
                </div>
              </div>

              <div className="alert alert-success mt-4" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
                <CheckCircle size={15} />
                <span>Zero financial cost incurred. All computations, PDFs, and ZIP bundles generated client-side in browser.</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System & Hosting Health</h3>
            </div>
            <div className="card-body" style={{ fontSize: '0.8125rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="text-muted">Frontend Hosting:</span>
                  <span className="font-semibold text-success">GitHub Pages ($0/mo)</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="text-muted">Single Page App Fallback:</span>
                  <span className="font-semibold">public/404.html Active</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="text-muted">Financial Precision:</span>
                  <span className="font-semibold">Integer Paisa (1 PKR = 100 Paisa)</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="text-muted">Target Districts:</span>
                  <span className="font-semibold">Rahim Yar Khan, Khanpur, Sadiqabad</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Licence / Status Modal */}
      {selectedTenant && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="card" style={{ width: '92%', maxWidth: '520px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                {language === 'ur' ? 'شاپ لائسنس و اسٹیٹس' : 'Manage Shop Licence & Status'}
              </h3>
              <button
                onClick={() => setSelectedTenant(null)}
                className="btn btn-icon btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTenantStatus}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                <div className="font-semibold">{selectedTenant.businessName}</div>
                <div className="text-muted">{selectedTenant.city} • {selectedTenant.ownerName} ({selectedTenant.phone})</div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">{language === 'ur' ? 'لائسنس اسٹیٹس' : 'Licence Status'}</label>
                <select
                  className="form-input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="active">Active (مکمل فعال)</option>
                  <option value="trial">Trial (آزمائشی مدت)</option>
                  <option value="grace">Grace Period (مہلت - 7 دن باقی)</option>
                  <option value="read_only">Read Only (صرف ریڈ کی اجازت)</option>
                  <option value="suspended">Suspended (معطل)</option>
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">{language === 'ur' ? 'سپورٹ نوٹس اور کمنٹس' : 'Internal Support Notes'}</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Record support interactions, pilot feedback, or renewal dates..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="btn btn-outline"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{t('common.save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
